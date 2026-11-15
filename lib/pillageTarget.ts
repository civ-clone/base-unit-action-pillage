import Effect from '@civ-clone/core-rule/Effect';
import PillageTarget from '../Rules/PillageTarget';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';

export type PillageOrder =
  | (typeof TileImprovement)[]
  | ((unit: Unit, tile: Tile) => (typeof TileImprovement)[]);

/**
 * A `PillageTarget` rule, `<prefix>:unit/pillage-target`: of the candidates that are `pillageable` (the ruleset's list, as given to base-unit-action-
 *  rules' `pillageCriteria`), the first in `order` (improvement types, most preferred first; types not in it come after,
 *  in the tile's order), or `null` when none is pillageable. `order` can depend on the unit and the tile (Civ2's
 *  Partisans prefer railroad and road).
 *
 * When the player chose a target, it is the only candidate, so this answers it if it is pillageable.
 */
export const pillageTarget = (
  prefix: string,
  pillageable: (improvement: TileImprovement) => boolean,
  order: PillageOrder = []
): PillageTarget =>
  new PillageTarget(
    `${prefix}:unit/pillage-target`,
    new Effect(
      (
        unit: Unit,
        tile: Tile,
        candidates: TileImprovement[]
      ): TileImprovement | null => {
        const preferred =
            typeof order === 'function' ? order(unit, tile) : order,
          rank = (improvement: TileImprovement): number => {
            const index = preferred.findIndex(
              (Type: typeof TileImprovement): boolean =>
                improvement instanceof Type
            );

            return index === -1 ? preferred.length : index;
          },
          [first = null] = candidates
            .filter(pillageable)
            .map(
              (
                improvement: TileImprovement,
                index: number
              ): [TileImprovement, number, number] => [
                improvement,
                rank(improvement),
                index,
              ]
            )
            .sort(([, a, i], [, b, j]): number => a - b || i - j)
            .map(([improvement]): TileImprovement => improvement);

        return first;
      }
    )
  );

export default pillageTarget;
