import { Moved, IMovedRegistry } from '@civ-clone/core-unit/Rules/Moved';
import {
  MovementCost,
  IMovementCostRegistry,
} from '@civ-clone/core-unit/Rules/MovementCost';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';

export class Pillage extends DelayedAction {
  perform() {
    const [
      moveCost,
    ]: number[] = (this.ruleRegistry() as IMovementCostRegistry)
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(
      moveCost,
      (
        tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance
      ) => {
        // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
        //  use a Rule
        const [improvement] = tileImprovementRegistry.getByTile(this.from());

        tileImprovementRegistry.unregister(improvement);
      }
    );

    (this.ruleRegistry() as IMovedRegistry).process(Moved, this.unit(), this);
  }
}

export default Pillage;
