"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pillageTarget = void 0;
const Effect_1 = require("@civ-clone/core-rule/Effect");
const PillageTarget_1 = require("../Rules/PillageTarget");
/**
 * A `PillageTarget` rule, `<prefix>:unit/pillage-target`: of the candidates that are `pillageable` (the ruleset's list, as given to base-unit-action-
 *  rules' `pillageCriteria`), the first in `order` (improvement types, most preferred first; types not in it come after,
 *  in the tile's order), or `null` when none is pillageable. `order` can depend on the unit and the tile (Civ2's
 *  Partisans prefer railroad and road).
 *
 * When the player chose a target, it is the only candidate, so this answers it if it is pillageable.
 */
const pillageTarget = (prefix, pillageable, order = []) => new PillageTarget_1.default(`${prefix}:unit/pillage-target`, new Effect_1.default((unit, tile, candidates) => {
    const preferred = typeof order === 'function' ? order(unit, tile) : order, rank = (improvement) => {
        const index = preferred.findIndex((Type) => improvement instanceof Type);
        return index === -1 ? preferred.length : index;
    }, [first = null] = candidates
        .filter(pillageable)
        .map((improvement, index) => [
        improvement,
        rank(improvement),
        index,
    ])
        .sort(([, a, i], [, b, j]) => a - b || i - j)
        .map(([improvement]) => improvement);
    return first;
}));
exports.pillageTarget = pillageTarget;
exports.default = exports.pillageTarget;
//# sourceMappingURL=pillageTarget.js.map