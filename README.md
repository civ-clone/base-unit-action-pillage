# base-unit-action-pillage

This package provides the `Pillage` `Action` for `Unit`s.

- `Pillage`: `new Pillage(from, to, unit, ruleRegistry?, tileImprovementRegistry?, turn?, pendingEffects?)`, a delayed
  action. `perform(target?)` starts the work, for the largest `MovementCost` answer in turns. When it completes, one
  improvement on the tile is pillaged through the `Pillaged` rules, which take it off the tile.
- **Which improvement.** The `PillageTarget(unit, tile, candidates)` rules choose, from the improvements on the tile:
  the first answer that isn't `undefined` is pillaged, and `null` pillages nothing. With no answer (no such rule, or
  every rule declining), the player's choice is pillaged if there was one and it is still on the tile, and otherwise
  the first improvement on the tile, as it always has been.
- **The player's choice.** `perform(target)` takes the improvement the player chose, or its type name (`typeNameOf`).
  It is recorded in the action's `PendingEffect` data (under `TARGET`, as its type name), so a save keeps it, and when the work
  completes it is the only candidate the `PillageTarget` rules are offered. With no `PillageTarget` answer, the
  choice is pillaged if it is still on the tile (otherwise the first improvement there). Without a target nothing
  extra is recorded.
- `lib/pillageTarget`: `pillageTarget(prefix, pillageable, order?)` builds a `PillageTarget` rule,
  `<prefix>:unit/pillage-target`: of the candidates that are
  `pillageable` (the ruleset's list, as given to base-unit-action-rules' `pillageCriteria`), the first in `order`
  (improvement types, most preferred first, or a function of the unit and the tile giving them), or `null` when none
  is.
