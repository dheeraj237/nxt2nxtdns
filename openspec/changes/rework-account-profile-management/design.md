## Context

The app manages multiple NextDNS accounts (each with an encrypted API key) and their profiles, stored locally in SQLite (`src/lib/db/schema.sql`). Today the only way to push settings across accounts is a rigid "master account" (must have exactly one profile) or a fake DB-only "kill switch" profile, both wired into a shared diff/apply pipeline (`src/lib/sync/*`, `DiffPreviewModal`). The new model removes both special cases: any account's currently-open profile can act as a clone source, pushed to any subset of other accounts' default profiles on demand. There's also uncommitted WIP (`/api/accounts/[id]/master`, `/api/kill-switch/*`) extending the model being removed - it gets deleted, not migrated.

Backend integration surface is `src/lib/nextdns/endpoints.ts`, which already covers `privacy`, `parentalControl`, `denylist`, `allowlist` (including active-toggle PATCH endpoints that the UI never uses). Per NextDNS's own API (nextdns.github.io/api), a full profile also has `security` and `settings` sections and `logs`/`analytics` endpoints - none of that exists in this codebase yet.

## Goals / Non-Goals

**Goals:**
- Remove `is_master`/kill-switch entirely; no code path should reference them after this change.
- Every account has a `default_profile_id`, settable at onboarding and editable later.
- One account-detail page renders a NextDNS-dashboard-style tab bar for the profile currently selected in a dropdown (defaults to the account's default profile).
- Denylist/allowlist entries get a working active/inactive switch using the existing PATCH endpoints.
- A "Save to..." action can overwrite N other accounts' default profiles with the open profile's settings, built on the existing diff/apply pipeline.

**Non-Goals:**
- Implementing Security, Logs, Analytics, or Settings tab functionality - these are placeholder-only in this change.
- A global/shared allow-deny domain catalog - out of scope; entries stay per-account/per-profile, matching NextDNS's own model exactly.
- Changing how accounts authenticate to NextDNS (API key storage/encryption is unchanged).

## Decisions

**Default profile via `default_profile_id` column, not a naming convention.** `accounts.default_profile_id TEXT REFERENCES profiles(id)`. Chosen over "first profile created" because onboarding explicitly asks the user to pick one, and it must be independently changeable later without reordering profiles.

**"Save to..." reuses `src/lib/sync` rather than introducing a parallel pipeline.** `SyncSource` collapses from `'master' | 'kill-switch'` to a single shape carrying the in-editor profile's current (possibly unsaved) field values directly, rather than re-reading a "source" from the DB/API. `loadDiffsForTargets` keeps its target-resolution and diff-computation logic; only source resolution changes - `resolveMasterSource`/`resolveKillSwitchSource` are deleted and replaced with a source constructed straight from the editor's in-memory `Profile` state.

**Open question resolved as: diff-preview-then-apply, not silent overwrite.** "Save to..." reuses `DiffPreviewModal` exactly like today's master/kill-switch flows: the user picks target accounts, sees a diff per target, then confirms. Rationale: silently overwriting another account's Denylist/Allowlist/Privacy/Parental settings with no preview is the kind of action that's easy to regret, and the diff machinery already exists - there's no cost to keeping the preview step.

**Denylist/allowlist switch calls the entry PATCH endpoint directly, no local-only staging.** Toggling the switch immediately calls `patchDenylistEntry`/`patchAllowlistEntry` against NextDNS (optimistic UI update, rollback on failure) rather than batching into the profile's "Save" button - this matches NextDNS's own dashboard behavior where list-entry changes are effectively immediate, and avoids conflating "toggle an existing entry" with "add/remove an entry" in one save transaction.

**Settings tab: pure placeholder, not even profile display name.** Considered building a minimal Settings tab for the local `display_name` field (which already exists on `profiles`), but decided against it - `display_name` editing already happens in the account/profile onboarding-and-edit flow (account-onboarding capability), so a Settings tab would either duplicate that or confuse users about which "name" it edits (local display name vs. NextDNS's own `name` field, which this app doesn't touch). Keeping it a placeholder avoids that ambiguity until there's a real reason to build it out.

**Tab order and set matches NextDNS's real dashboard.** Security, Privacy, Parental Control, Denylist, Allowlist, Logs, Analytics, Settings - omitting NextDNS's "Setup" tab (device-install instructions, not applicable to a profile-content manager).

## Risks / Trade-offs

- [Removing `is_master`/kill-switch is a breaking schema change] → No production data exists yet per current repo state (single local SQLite file, no deployed users mentioned); migration is a straight `DROP COLUMN`/`DROP TABLE` in a new schema statement, not a data-preserving migration.
- [Immediate-PATCH toggle for list entries means a flaky NextDNS API call surfaces mid-edit, outside the "Save" flow the user expects to control] → Optimistic UI with visible rollback-on-error toast; document this behavior in the profile-editor spec so it's not mistaken for a bug later.
- [Deleting the uncommitted kill-switch/master WIP loses in-progress work] → It's uncommitted and directly superseded by this proposal; flagged explicitly in the proposal's Impact section so it's a visible decision, not a silent loss.
- ["Save to..." diff-preview against many selected accounts could be slow (one live NextDNS fetch per target)] → Same cost profile as today's master-sync "apply to all," which already does this; no regression, but worth noting it doesn't scale to very large account counts.

## Migration Plan

1. Add `accounts.default_profile_id` column (nullable initially, backfilled to the account's first profile if any exist, or left null for zero-profile accounts).
2. Drop `is_master` column, `one_master_account` index, and `kill_switch_profile` table in the same schema revision.
3. Remove `/api/accounts/[id]/master`, `/api/kill-switch/**`, `killSwitchRepo`, `useKillSwitchEditorAdapter`, and the master/kill-switch UI before wiring the new account-detail page, so there's no window where both models coexist.
4. Ship account-list + account-detail pages behind the existing `/login` gate; no separate rollout flag needed since this is a full replacement of `src/app/page.tsx`, not an additive feature.
5. Rollback: revert the commit(s); since the schema change is destructive (columns/table dropped), rollback after any real usage would need a restored DB backup, not just a code revert - acceptable given no production data currently exists.

## Open Questions

(none outstanding - both resolved below)

**Resolved: an account can never have zero profiles, and its default profile can never be deleted.** `default_profile_id` is NOT NULL once an account exists - onboarding requires picking a default before the account row is created, so a zero-profile account is never a valid state. Profile deletion is blocked outright when the target is (a) the account's current default profile, or (b) the account's last remaining profile - the two conditions overlap whenever an account has exactly one profile, but are enforced as one rule: deletion is refused unless the account has more than one profile AND the profile being deleted is not the current default. To delete the current default, the user must first switch the default to a different profile via the edit-account flow, then delete the old one.
