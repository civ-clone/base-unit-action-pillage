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
export declare const pillageTarget: (
  prefix: string,
  pillageable: (improvement: TileImprovement) => boolean,
  order?: PillageOrder
) => PillageTarget;
export default pillageTarget;
