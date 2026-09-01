"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pillage = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
class Pillage extends DelayedAction_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, turn = Turn_1.instance) {
        super(from, to, unit, ruleRegistry, turn);
        this._tileImprovementRegistry = tileImprovementRegistry;
    }
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost, () => {
            // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
            //  use a Rule
            const [improvement] = this._tileImprovementRegistry.getByTile(this.from());
            this._tileImprovementRegistry.unregister(improvement);
        });
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
}
exports.Pillage = Pillage;
exports.default = Pillage;
//# sourceMappingURL=Pillage.js.map