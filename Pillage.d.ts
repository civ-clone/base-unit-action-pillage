import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const COMPLETE = 'base-unit-action-pillage:complete';
export declare const TARGET = 'target';
export declare class Pillage extends DelayedAction {
  private _pendingEffectRegistry;
  private _tileImprovementRegistry;
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry?: RuleRegistry,
    tileImprovementRegistry?: TileImprovementRegistry,
    turn?: Turn,
    pendingEffects?: PendingEffectRegistry
  );
  /**
   * Starts pillaging. `target`, when given, is the improvement the player chose (or its type name): it is recorded in
   *  the action's `PendingEffect` data, so it survives a save, and when the work completes it is the only candidate the
   *  `PillageTarget` rules are offered. With no `PillageTarget` answer, the choice is pillaged if it is still on the tile.
   *  Nothing is recorded when it isn't given.
   *
   * Declared as `...args: unknown[]`, as `perform(target?: TileImprovement | string)` would not compile:
   *  `DelayedAction.perform(turns, handler, BusyRule)` is the method this overrides.
   */
  perform(...args: unknown[]): void;
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
  static complete(action: Pillage, pendingEffect?: PendingEffect): void;
}
export default Pillage;
