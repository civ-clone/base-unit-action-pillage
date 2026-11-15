"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pillage = exports.TARGET = exports.COMPLETE = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const Pillaged_1 = require("@civ-clone/core-tile-improvement/Rules/Pillaged");
const PillageTarget_1 = require("./Rules/PillageTarget");
const Pillaging_1 = require("./Rules/Pillaging");
const registerDelayedAction_1 = require("@civ-clone/core-unit/registerDelayedAction");
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
exports.COMPLETE = 'base-unit-action-pillage:complete';
// The key of a chosen target in the action's `PendingEffect` data: the improvement's type name (`typeNameOf`, the name
//  a save and the client know it by).
exports.TARGET = 'target';
class Pillage extends DelayedAction_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, turn = Turn_1.instance, pendingEffects = core_pending_effect_1.instance) {
        super(from, to, unit, ruleRegistry, turn, pendingEffects);
        this._pendingEffectRegistry = pendingEffects;
        this._tileImprovementRegistry = tileImprovementRegistry;
    }
    /**
     * Starts pillaging. `target`, when given, is the improvement the player chose (or its type name): it is recorded in
     *  the action's `PendingEffect` data, so it survives a save, and when the work completes it is the only candidate the
     *  `PillageTarget` rules are offered. Without a `PillageTarget` rule it is ignored, and nothing is recorded when it
     *  isn't given.
     *
     * Declared as `...args: unknown[]`, as `perform(target?: TileImprovement | string)` would not compile:
     *  `DelayedAction.perform(turns, handler, BusyRule)` is the method this overrides.
     */
    perform(...args) {
        const [target] = args;
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost || 0, exports.COMPLETE, Pillaging_1.default);
        if (target !== undefined) {
            const [pendingEffect] = this._pendingEffectRegistry
                .getByTarget(this.unit())
                .filter((candidate) => candidate.handler() === exports.COMPLETE)
                .slice(-1);
            pendingEffect === null || pendingEffect === void 0 ? void 0 : pendingEffect.setData({
                ...pendingEffect.data(),
                [exports.TARGET]: typeof target === 'string'
                    ? target
                    : (0, DataObject_1.typeNameOf)(target.sourceClass()),
            });
        }
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
    /**
     * What finishing does, against the registries this action was constructed
     * with.
     *
     * This was the closure passed to `perform`, bound to `this`. Converting it
     * to a `PendingEffect` handler first moved it to module scope, where `this`
     * is gone, and the registries became `…Instance` singletons — invisible in
     * the game, which uses the singletons, and wrong everywhere else. A method
     * keeps the original body — `this` read as `action` — and
     * `registerDelayedAction` hands the handler the action that was performed,
     * so this runs on that one.
     *
     * Static, because an instance method would not compile: a new public member
     * makes this class unassignable to `Action` (`DataObject._keys:
     * (keyof this)[]`), and it is passed as one to `MovementCost` and `Moved`.
     * A static method of the class may still read its instances' private
     * fields, and does not change `keyof this`.
     */
    static complete(action, pendingEffect) {
        const candidates = action._tileImprovementRegistry.getByTile(action.from()), chosen = pendingEffect === null || pendingEffect === void 0 ? void 0 : pendingEffect.data()[exports.TARGET], 
        // The `PillageTarget` rules choose (civ-clone/web-renderer#1007), from the player's choice if there was one.
        //  With no answer, the first improvement on the tile, as before: a ruleset with no such rule is unchanged.
        answer = action
            .ruleRegistry()
            .process(PillageTarget_1.default, action.unit(), action.from(), chosen === undefined
            ? candidates
            : candidates.filter((candidate) => (0, DataObject_1.typeNameOf)(candidate.sourceClass()) === chosen))
            .find((target) => target !== undefined), improvement = answer === undefined ? candidates[0] : answer;
        if (!improvement || !candidates.includes(improvement)) {
            return;
        }
        // Through the `Pillaged` rules, as building one goes through `Built`, so the ruleset takes the improvement off
        //  the tile and refreshes the square's yields (civ-clone/web-renderer#413).
        action.ruleRegistry().process(Pillaged_1.default, action.from(), improvement);
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
    complete: (unit, pendingEffect, action) => Pillage.complete(action, pendingEffect),
});
exports.default = Pillage;
//# sourceMappingURL=Pillage.js.map