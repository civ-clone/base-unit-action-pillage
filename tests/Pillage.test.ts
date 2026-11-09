import Effect from '@civ-clone/core-rule/Effect';
import Generator from '@civ-clone/core-world-generator/Generator';
import Pillage from '../Pillage';
import Pillaged from '@civ-clone/core-tile-improvement/Rules/Pillaged';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';

describe('Pillage', (): void => {
  const setUp = () => {
    const ruleRegistry = new RuleRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      tile = new Tile(0, 0, new Terrain(), new World(new Generator(1, 1))),
      unit = new Unit(null, new Player(), tile, ruleRegistry),
      pillaged: [Tile, TileImprovement][] = [];

    ruleRegistry.register(
      new Pillaged(
        new Effect((pillagedTile: Tile, improvement: TileImprovement): void => {
          pillaged.push([pillagedTile, improvement]);
        })
      )
    );

    return {
      pillage: () =>
        Pillage.complete(
          new Pillage(tile, tile, unit, ruleRegistry, tileImprovementRegistry)
        ),
      pillaged,
      ruleRegistry,
      tile,
      tileImprovementRegistry,
    };
  };

  it('processes the `Pillaged` rules for one improvement on its tile, leaving the removal to them', (): void => {
    const { pillage, pillaged, ruleRegistry, tile, tileImprovementRegistry } =
        setUp(),
      first = new TileImprovement(tile, ruleRegistry),
      second = new TileImprovement(tile, ruleRegistry);

    tileImprovementRegistry.register(first, second);

    pillage();

    expect(pillaged).to.deep.equal([[tile, first]]);
    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([
      first,
      second,
    ]);
  });

  it('does nothing on a tile with no improvement', (): void => {
    const { pillage, pillaged } = setUp();

    pillage();

    expect(pillaged).to.deep.equal([]);
  });
});
