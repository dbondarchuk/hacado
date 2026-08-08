# Weekly Schedule App

App-contained open-hours exceptions on top of the org **default** schedule (managed in settings).

Layers **inside this app** (then returned to core `ScheduleService`):

1. **Company holidays** — hard closures (`holidays` on the exception); members cannot reopen
2. **Company hours** — sparse day overrides (including empty = no company hours that day)
3. **Member** exceptions — per-staff overrides

Empty company hours are **not** holidays. Mark holidays explicitly in the company scope UI.

Core `ScheduleService` only merges: **app day overrides → org default**. It does not read or write this app’s data.

Edits store sparse exceptions (only days that differ from the parent layer).

**Repeat** creates one recurring exception (`repeatEveryWeeks`, `repeatUntil`, `createdAt`). Resolve expands it; newer recurrings win on overlap; single-week docs beat any series. Week reset uses `excludeWeeks`; remove-series deletes the recurring doc. Copy always writes a single week.

## Storage

Mongo collection `weekly-schedule-exceptions` (owned by this app install via `appId`).

Legacy dense weeks in `weekly-schedules` (pre-multiuser) are converted to company-scoped exceptions by migration `20260808140000-weekly_schedules_to_exceptions` (empty days → `holidays`).

## Setup

Install Weekly schedule, then use the scope selector for **Company (all members)** or a staff member.
