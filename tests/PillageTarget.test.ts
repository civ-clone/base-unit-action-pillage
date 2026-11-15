import Pillage, { COMPLETE, TARGET } from '../Pillage';
import Effect from '@civ-clone/core-rule/Effect';
import Generator from '@civ-clone/core-world-generator/Generator';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import PillageTarget from '../Rules/PillageTarget';
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
import pillageTarget from '../lib/pillageTarget';

// Stand-ins for a ruleset's improvements.
class Road extends TileImprovement {}
class Railroad extends TileImprovement {}
class Irrigation extends TileImprovement {}
class Farmland extends TileImprovement {}
class Mine extends TileImprovement {}
class Fortress extends TileImprovement {}
class Pollution extends TileImprovement {}

class Partisans extends Unit {}

// Civ2's order when the player doesn't choose (survey-units §7, OpenCiv2 `unit_pillage`): farmland, then irrigation or
//  the mine, then a fortress or airbase, then the railroad, then the road.
const civ2Order = [Farmland, Irrigation, Mine, Fortress, Railroad, Road];

// Pollution can't be pillaged.
const pillageable = (improvement: TileImprovement): boolean =>
  !(improvement instanceof Pollution);

describe('Pillage with `PillageTarget`', (): void => {
  const setUp = (UnitType: typeof Unit = Unit) => {
    const ruleRegistry = new RuleRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      pendingEffects = new PendingEffectRegistry(),
      turn = new Turn(),
      tile = new Tile(0, 0, new Terrain(), new World(new Generator(1, 1))),
      unit = new UnitType(null, new Player(), tile, ruleRegistry),
      pillaged: TileImprovement[] = [],
      build = (...Types: (typeof TileImprovement)[]): TileImprovement[] => {
        const improvements = Types.map(
          (Type: typeof TileImprovement): TileImprovement =>
            new Type(tile, ruleRegistry)
        );

        tileImprovementRegistry.register(...improvements);

        return improvements;
      },
      action = (): Pillage =>
        new Pillage(
          tile,
          tile,
          unit,
          ruleRegistry,
          tileImprovementRegistry,
          turn,
          pendingEffects
        ),
      // Performs the action, then completes it with the pending effect `perform` recorded.
      pillage = (target?: TileImprovement | string): PendingEffect => {
        const performed = action();

        performed.perform(...(target === undefined ? [] : [target]));

        const [pendingEffect] = pendingEffects.getByTarget(unit);

        Pillage.complete(performed, pendingEffect);

        return pendingEffect;
      };

    ruleRegistry.register(
      new Pillaged(
        new Effect((pillagedTile: Tile, improvement: TileImprovement): void => {
          pillaged.push(improvement);
        })
      )
    );

    turn.set(3);

    return { build, pendingEffects, pillage, pillaged, ruleRegistry, unit };
  };

  describe('with no `PillageTarget` answer (Civ1)', (): void => {
    it('pillages the first improvement on the tile, and records nothing more than the end turn', (): void => {
      const { build, pillage, pillaged } = setUp(),
        [road] = build(Road, Mine);

      const pendingEffect = pillage();

      expect(pillaged).to.deep.equal([road]);
      expect(pendingEffect.handler()).to.equal(COMPLETE);
      expect(pendingEffect.data()).to.deep.equal({ endTurn: '3' });
    });

    it('ignores a chosen target', (): void => {
      const { build, pillage, pillaged } = setUp(),
        [road] = build(Road, Mine);

      pillage('Mine');

      expect(pillaged).to.deep.equal([road]);
    });

    it('pillages the first improvement when every `PillageTarget` rule declines', (): void => {
      const { build, pillage, pillaged, ruleRegistry } = setUp(),
        [pollution] = build(Pollution, Road);

      ruleRegistry.register(
        new PillageTarget(new Effect((): undefined => undefined))
      );

      pillage();

      expect(pillaged).to.deep.equal([pollution]);
    });
  });

  describe('with a `PillageTarget` rule', (): void => {
    it('`pillageTarget` gives its rule an id under the prefix', (): void => {
      expect(pillageTarget('test', pillageable).id()).to.equal(
        'test:unit/pillage-target'
      );
    });

    it("records the player's choice by type name in the pending effect, so a save keeps it", (): void => {
      const { build, pillage } = setUp(),
        [, mine] = build(Road, Mine);

      expect(pillage(mine).data()).to.deep.equal({
        endTurn: '3',
        [TARGET]: 'Mine',
      });
    });

    it("pillages the player's choice", (): void => {
      const { build, pillage, pillaged, ruleRegistry } = setUp(),
        [, railroad] = build(Road, Railroad, Mine);

      ruleRegistry.register(pillageTarget('test', pillageable, civ2Order));

      pillage('Railroad');

      expect(pillaged).to.deep.equal([railroad]);
    });

    it('pillages in the ruleset order when the player made no choice', (): void => {
      const { build, pillage, pillaged, ruleRegistry } = setUp(),
        [, , mine] = build(Road, Railroad, Mine, Pollution);

      ruleRegistry.register(pillageTarget('test', pillageable, civ2Order));

      pillage();

      expect(pillaged).to.deep.equal([mine]);
    });

    it('pillages farmland before irrigation, and a fortress before the railroad', (): void => {
      const first = setUp(),
        second = setUp(),
        [, farmland] = first.build(Irrigation, Farmland, Road),
        [, fortress] = second.build(Railroad, Fortress);

      first.ruleRegistry.register(
        pillageTarget('test', pillageable, civ2Order)
      );
      second.ruleRegistry.register(
        pillageTarget('test', pillageable, civ2Order)
      );

      first.pillage();
      second.pillage();

      expect(first.pillaged).to.deep.equal([farmland]);
      expect(second.pillaged).to.deep.equal([fortress]);
    });

    // Partisans prefer the railroad and the road (survey-units §7).
    it('takes an order that depends on the unit', (): void => {
      const { build, pillage, pillaged, ruleRegistry } = setUp(Partisans),
        [, road] = build(Mine, Road);

      ruleRegistry.register(
        pillageTarget('test', pillageable, (pillager: Unit) =>
          pillager instanceof Partisans
            ? [Railroad, Road, ...civ2Order]
            : civ2Order
        )
      );

      pillage();

      expect(pillaged).to.deep.equal([road]);
    });

    it('pillages nothing when the choice or every candidate is not pillageable, or the choice is gone', (): void => {
      const choseUnpillageable = setUp(),
        onlyUnpillageable = setUp(),
        choiceGone = setUp();

      choseUnpillageable.build(Road, Pollution);
      onlyUnpillageable.build(Pollution);
      choiceGone.build(Road);

      [choseUnpillageable, onlyUnpillageable, choiceGone].forEach(
        ({ ruleRegistry }) =>
          ruleRegistry.register(pillageTarget('test', pillageable, civ2Order))
      );

      choseUnpillageable.pillage('Pollution');
      onlyUnpillageable.pillage();
      choiceGone.pillage('Mine');

      expect(choseUnpillageable.pillaged).to.deep.equal([]);
      expect(onlyUnpillageable.pillaged).to.deep.equal([]);
      expect(choiceGone.pillaged).to.deep.equal([]);
    });

    it('takes the first answer that is not `undefined`, and ignores one not on the tile', (): void => {
      const declines = setUp(),
        elsewhere = setUp(),
        [, mine] = declines.build(Road, Mine);

      elsewhere.build(Road);

      declines.ruleRegistry.register(
        new PillageTarget(new Effect((): undefined => undefined)),
        new PillageTarget(new Effect((): TileImprovement => mine))
      );
      elsewhere.ruleRegistry.register(
        new PillageTarget(new Effect((): TileImprovement => mine))
      );

      declines.pillage();
      elsewhere.pillage();

      expect(declines.pillaged).to.deep.equal([mine]);
      expect(elsewhere.pillaged).to.deep.equal([]);
    });
  });
});
