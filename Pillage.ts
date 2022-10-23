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
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

export class Pillage extends DelayedAction {
  #tileImprovementRegistry: TileImprovementRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
    turn: Turn = turnInstance
  ) {
    super(from, to, unit, ruleRegistry, turn);

    this.#tileImprovementRegistry = tileImprovementRegistry;
  }

  perform() {
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(moveCost, () => {
      // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
      //  use a Rule
      const [improvement] = this.#tileImprovementRegistry.getByTile(
        this.from()
      );

      this.#tileImprovementRegistry.unregister(improvement);
    });

    this.ruleRegistry().process(Moved, this.unit(), this);
  }
}

export default Pillage;
