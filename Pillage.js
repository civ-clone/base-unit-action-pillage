"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pillage = void 0;
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
class Pillage extends DelayedAction_1.default {
    perform() {
        const [moveCost,] = this.ruleRegistry()
            .process(MovementCost_1.MovementCost, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost, (tileImprovementRegistry = TileImprovementRegistry_1.instance) => {
            // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
            //  use a Rule
            const [improvement] = tileImprovementRegistry.getByTile(this.from());
            tileImprovementRegistry.unregister(improvement);
        });
        this.ruleRegistry().process(Moved_1.Moved, this.unit(), this);
    }
}
exports.Pillage = Pillage;
exports.default = Pillage;
//# sourceMappingURL=Pillage.js.map