import Rule from '@civ-clone/core-rule/Rule';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * Which of `candidates` (the improvements on `tile`, or only the one the player chose) `unit` pillages when its
 *  `Pillage` completes: the first answer that isn't `undefined`. `null` pillages nothing.
 *
 * With no answer (no rule registered, or every rule declining), `Pillage` takes the first improvement on the tile, as
 *  it always has.
 */
export declare class PillageTarget extends Rule<
  [Unit, Tile, TileImprovement[]],
  TileImprovement | null | undefined
> {}
export default PillageTarget;
