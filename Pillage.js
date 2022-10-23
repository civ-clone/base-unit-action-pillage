"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Pillage_tileImprovementRegistry;
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
        _Pillage_tileImprovementRegistry.set(this, void 0);
        __classPrivateFieldSet(this, _Pillage_tileImprovementRegistry, tileImprovementRegistry, "f");
    }
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost, () => {
            // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
            //  use a Rule
            const [improvement] = __classPrivateFieldGet(this, _Pillage_tileImprovementRegistry, "f").getByTile(this.from());
            __classPrivateFieldGet(this, _Pillage_tileImprovementRegistry, "f").unregister(improvement);
        });
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
}
exports.Pillage = Pillage;
_Pillage_tileImprovementRegistry = new WeakMap();
exports.default = Pillage;
//# sourceMappingURL=Pillage.js.map