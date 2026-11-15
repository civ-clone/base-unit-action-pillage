import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Pillaged from '@civ-clone/core-tile-improvement/Rules/Pillaged';
import PillageTarget from './Rules/PillageTarget';
import Pillaging from './Rules/Pillaging';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import registerDelayedAction from '@civ-clone/core-unit/registerDelayedAction';
import { typeNameOf } from '@civ-clone/core-data-object/DataObject';

export const COMPLETE = 'base-unit-action-pillage:complete';

// The key of a chosen target in the action's `PendingEffect` data: the improvement's type name (`typeNameOf`, the name
//  a save and the client know it by).
export const TARGET = 'target';

export class Pillage extends DelayedAction {
  private _pendingEffectRegistry: PendingEffectRegistry;
  private _tileImprovementRegistry: TileImprovementRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
    turn: Turn = turnInstance,
    pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
  ) {
    super(from, to, unit, ruleRegistry, turn, pendingEffects);

    this._pendingEffectRegistry = pendingEffects;
    this._tileImprovementRegistry = tileImprovementRegistry;
  }

  /**
   * Starts pillaging. `target`, when given, is the improvement the player chose (or its type name): it is recorded in
   *  the action's `PendingEffect` data, so it survives a save, and when the work completes it is the only candidate the
   *  `PillageTarget` rules are offered. Without a `PillageTarget` rule it is ignored, and nothing is recorded when it
   *  isn't given.
   *
   * Declared as `...args: unknown[]`, as `perform(target?: TileImprovement | string)` would not compile:
   *  `DelayedAction.perform(turns, handler, BusyRule)` is the method this overrides.
   */
  perform(...args: unknown[]): void {
    const [target] = args as [(TileImprovement | string)?];
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(moveCost || 0, COMPLETE, Pillaging);

    if (target !== undefined) {
      const [pendingEffect] = this._pendingEffectRegistry
        .getByTarget(this.unit())
        .filter(
          (candidate: PendingEffect): boolean =>
            candidate.handler() === COMPLETE
        )
        .slice(-1);

      pendingEffect?.setData({
        ...pendingEffect.data(),
        [TARGET]:
          typeof target === 'string'
            ? target
            : typeNameOf(target.sourceClass()),
      });
    }

    this.ruleRegistry().process(Moved, this.unit(), this);
  }

  /**
   * What finishing does, against the registries this action was constructed
   * with.
   *
   * This was the closure passed to `perform`, bound to `this`. Converting it
   * to a `PendingEffect` handler first moved it to module scope, where `this`
   * is gone, and the registries became `…Instance` singletons — invisible in
   * the game, which uses the singletons, and wrong everywhere else. A method
   * keeps the original body — `this` read as `action` — and
   * `registerDelayedAction` hands the handler the action that was performed,
   * so this runs on that one.
   *
   * Static, because an instance method would not compile: a new public member
   * makes this class unassignable to `Action` (`DataObject._keys:
   * (keyof this)[]`), and it is passed as one to `MovementCost` and `Moved`.
   * A static method of the class may still read its instances' private
   * fields, and does not change `keyof this`.
   */
  static complete(action: Pillage, pendingEffect?: PendingEffect): void {
    const candidates = action._tileImprovementRegistry.getByTile(action.from()),
      chosen = pendingEffect?.data()[TARGET],
      // The `PillageTarget` rules choose (civ-clone/web-renderer#1007), from the player's choice if there was one.
      //  With no answer, the first improvement on the tile, as before: a ruleset with no such rule is unchanged.
      answer = action
        .ruleRegistry()
        .process(
          PillageTarget,
          action.unit(),
          action.from(),
          chosen === undefined
            ? candidates
            : candidates.filter(
                (candidate: TileImprovement): boolean =>
                  typeNameOf(candidate.sourceClass()) === chosen
              )
        )
        .find(
          (target: TileImprovement | null | undefined): boolean =>
            target !== undefined
        ),
      improvement = answer === undefined ? candidates[0] : answer;

    if (!improvement || !candidates.includes(improvement)) {
      return;
    }

    // Through the `Pillaged` rules, as building one goes through `Built`, so the ruleset takes the improvement off
    //  the tile and refreshes the square's yields (civ-clone/web-renderer#413).
    action.ruleRegistry().process(Pillaged, action.from(), improvement);
  }
}

// Registered here rather than passed to `perform` as a closure: a closure
// cannot be written to a file, which is why a unit part-way through this could
// not be saved. The save records the identifier; the behaviour stays here.
//
// This one was missed when the other nine delayed actions were converted, and
// the grep that was meant to find them is why: `node_modules/@civ-clone/*` are
// symlinks into pnpm's store, and `grep -r` does not follow symlinks. `grep -R`
// does, and finds eleven `DelayedAction` subclasses rather than nine.
//
// `Pillaging` is new. This action had no `Busy` subclass of its own and used
// the base `Busy`, which cannot be given to `BusyRegistry` — it is keyed by
// type name, so registering the base class would claim the identity for every
// other busy state that never subclassed it.
registerDelayedAction({
  BusyRule: Pillaging,
  handler: COMPLETE,
  action: (unit: Unit) => new Pillage(unit.tile(), unit.tile(), unit),
  complete: (unit, pendingEffect, action) =>
    Pillage.complete(action, pendingEffect),
});

export default Pillage;
