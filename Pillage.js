"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pillage = exports.COMPLETE = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const Pillaging_1 = require("./Rules/Pillaging");
const registerDelayedAction_1 = require("@civ-clone/core-unit/registerDelayedAction");
exports.COMPLETE = 'base-unit-action-pillage:complete';
class Pillage extends DelayedAction_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, turn = Turn_1.instance) {
        super(from, to, unit, ruleRegistry, turn);
        this._tileImprovementRegistry = tileImprovementRegistry;
    }
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost || 0, exports.COMPLETE, Pillaging_1.default);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
}
exports.Pillage = Pillage;
// Registered here rather than passed to `perform` as a closure: a closure
// cannot be written to a file, which is why a unit part-way through this could
// not be saved. The save records the identifier; the behaviour stays here.
//
// This one was missed when the other nine delayed actions were converted, and
// the grep that was meant to find them is why: `node_modules/@civ-clone/*` are
// symlinks into pnpm's store, and `grep -r` does not follow symlinks. `grep -R`
// does, and finds eleven `DelayedAction` subclasses rather than nine.
//
// `Pillaging` is new. This action had no `Busy` subclass of its own and used
// the base `Busy`, which cannot be given to `BusyRegistry` — it is keyed by
// type name, so registering the base class would claim the identity for every
// other busy state that never subclassed it.
(0, registerDelayedAction_1.default)({
    BusyRule: Pillaging_1.default,
    handler: exports.COMPLETE,
    action: (unit) => new Pillage(unit.tile(), unit.tile(), unit),
    complete: (unit) => {
        // TODO: should this prioritise Fortress > Mine > Irrigation > Railroad > Road?
        //  use a Rule
        const [improvement] = TileImprovementRegistry_1.instance.getByTile(unit.tile());
        TileImprovementRegistry_1.instance.unregister(improvement);
    },
});
exports.default = Pillage;
//# sourceMappingURL=Pillage.js.map