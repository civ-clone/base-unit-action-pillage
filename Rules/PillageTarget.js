"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PillageTarget = void 0;
const Rule_1 = require("@civ-clone/core-rule/Rule");
/**
 * Which of `candidates` (the improvements on `tile`, or only the one the player chose) `unit` pillages when its
 *  `Pillage` completes: the first answer that isn't `undefined`. `null` pillages nothing.
 *
 * With no answer (no rule registered, or every rule declining), `Pillage` takes the first improvement on the tile, as
 *  it always has.
 */
class PillageTarget extends Rule_1.default {
}
exports.PillageTarget = PillageTarget;
exports.default = PillageTarget;
//# sourceMappingURL=PillageTarget.js.map