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
  complete: (unit: Unit) => {
    // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
    //  use a Rule
    const [improvement] = tileImprovementRegistryInstance.getByTile(
      unit.tile()
    );

    tileImprovementRegistryInstance.unregister(improvement);
  },
});

export default Pillage;
