import { COMPLETE } from '../Pillage';
import Effect from '@civ-clone/core-rule/Effect';
import Generator from '@civ-clone/core-world-generator/Generator';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Pillaged from '@civ-clone/core-tile-improvement/Rules/Pillaged';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import { instance as busyRegistryInstance } from '@civ-clone/core-unit/BusyRegistry';
import { instance as tileImprovementRegistryInstance } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';

// civ-clone/web-renderer#248
describe('Pillage, loaded into a game with its own registries', (): void => {
  it("pillages from the context's `tileImprovements`, not the module instance", (): void => {
    const context = {
        pendingEffects: new PendingEffectRegistry(),
        rules: new RuleRegistry(),
        tileImprovements: new TileImprovementRegistry(),
        turn: new Turn(),
      },
      tile = new Tile(0, 0, new Terrain(), new World(new Generator(1, 1))),
      unit = new Unit(null, new Player(), tile, context.rules),
      improvement = new TileImprovement(tile, context.rules),
      pillaged: TileImprovement[] = [];

    context.tileImprovements.register(improvement);
    context.rules.register(
      new Pillaged(
        new Effect((pillagedTile: Tile, pillagedImprovement): void => {
          pillaged.push(pillagedImprovement);

          context.tileImprovements.unregister(pillagedImprovement);
        })
      )
    );
    context.pendingEffects.register(
      new PendingEffect(COMPLETE, unit, { endTurn: '1' })
    );
    context.turn.set(1);

    busyRegistryInstance.rebuild('Pillaging', unit, context).process();

    expect(pillaged).to.deep.equal([improvement]);
    expect(context.tileImprovements.getByTile(tile)).to.deep.equal([]);
    expect(tileImprovementRegistryInstance.getByTile(tile)).to.deep.equal([]);
  });
});
