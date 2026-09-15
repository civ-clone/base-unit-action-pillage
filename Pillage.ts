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
import Pillaging from './Rules/Pillaging';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import registerDelayedAction from '@civ-clone/core-unit/registerDelayedAction';

export const COMPLETE = 'base-unit-action-pillage:complete';

export class Pillage extends DelayedAction {
  private _tileImprovementRegistry: TileImprovementRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
    turn: Turn = turnInstance
  ) {
    super(from, to, unit, ruleRegistry, turn);

    this._tileImprovementRegistry = tileImprovementRegistry;
  }

  perform() {
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(moveCost || 0, COMPLETE, Pillaging);

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
  static complete(action: Pillage): void {
    const [improvement] = action._tileImprovementRegistry.getByTile(
      action.from()
    );

    action._tileImprovementRegistry.unregister(improvement);
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
  complete: (unit, pendingEffect, action) => Pillage.complete(action),
});

export default Pillage;
