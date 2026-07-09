## Why

The current dashboard is a flat single page built around a "master account" sync model: exactly one account can be flagged `is_master` (and only if it has exactly one profile), and a separate DB-only "kill switch" profile exists as an alternate sync source. This doesn't match how the user actually wants to work: pick any account, edit any of its profiles using a UI that mirrors NextDNS's own dashboard, and push those exact settings to any subset of other accounts on demand. The master/kill-switch special cases add constraints (one-profile-only master, a fake profile with its own REST surface) that get in the way of that simpler, more general workflow. There's also uncommitted WIP (`/api/accounts/[id]/master`, `/api/kill-switch/*`, `useKillSwitchEditorAdapter`) building further on the model being replaced - this proposal supersedes it.

## What Changes

- **BREAKING**: Remove the master-account concept - drop `is_master` column, `one_master_account` unique index, `MasterValidationError`, `accountsRepo.setMaster/getMaster/getMasterProfile`, `/api/accounts/[id]/master` route, and the "Set as master" UI action.
- **BREAKING**: Remove the kill-switch concept - drop `kill_switch_profile` table, `killSwitchRepo`, the `/api/kill-switch/*` route tree, `useKillSwitchEditorAdapter`, and its pinned editor on the dashboard.
- **BREAKING**: Replace `SyncSource: 'master' | 'kill-switch'` and `resolveMasterSource`/`resolveKillSwitchSource` with a source that is always "the profile currently open in the editor."
- Add `default_profile_id` to `accounts` - every account has exactly one default profile, chosen at onboarding and changeable later.
- New account list page (shown after master-password login): list rows (not a grid), each with a delete icon; a "+" action onboards a new account (name + API key -> fetch that key's NextDNS profiles -> pick a default profile -> save).
- New account detail page (opened by clicking an account row): a profile dropdown (defaults to the account's default profile, switchable to any other profile on that account) above a NextDNS-dashboard-style tab bar. Privacy, Parental Control, Denylist, and Allowlist tabs are fully functional; Security, Logs, Analytics, and Settings tabs are placeholders (no backend support exists for them yet).
- Add the missing active/inactive toggle switch to denylist/allowlist entries, wired to the already-existing but unused `patchDenylistEntry`/`patchAllowlistEntry` endpoints - matches NextDNS's own semantics (entries are disabled via `active`, not deleted).
- Add a "Save to..." action beside "Save" on the account detail page: opens a modal listing every account with checkboxes (select all / none / any subset); confirming overwrites each selected account's default profile with the currently-edited profile's settings, reusing the existing diff/apply pipeline (`src/lib/sync`, `DiffPreviewModal`) with the in-editor profile as the source.
- Account delete confirmation copy is updated to make explicit that removal only affects this app's local database, not the account on NextDNS.

## Capabilities

### New Capabilities
- `account-onboarding`: adding, renaming, and removing accounts, including the API-key-driven profile fetch and default-profile selection.
- `profile-editor`: the NextDNS-dashboard-style tabbed editor for a single account/profile, including the profile switcher dropdown and the denylist/allowlist active-toggle.
- `profile-clone`: the "Save to..." flow that overwrites a chosen set of accounts' default profiles with an edited profile's settings.

### Modified Capabilities
(none - no pre-existing specs in `openspec/specs/` to modify; this is the first proposal for this project)

## Impact

- **Schema**: `accounts` gains `default_profile_id`; `is_master` column, its unique index, and the `kill_switch_profile` table are dropped.
- **Backend**: `src/lib/db/repo.ts` (`accountsRepo`, remove `killSwitchRepo`), `src/lib/sync/loadTargets.ts` (source resolution), `src/app/api/accounts/**`, `src/app/api/kill-switch/**` (removed), `src/app/api/profiles/**`.
- **Frontend**: `src/app/page.tsx` (replaced by account-list + account-detail pages/routes), `src/components/ProfileList.tsx`, `ProfileEditor.tsx`, `ActionBar.tsx`, `AddAccountForm`/`AddProfileForm` (replaced by onboarding modal), new clone-target modal.
- **Hooks**: `useAccounts.ts`, `useProfiles.ts`, `useProfileEditorAdapter.ts`, `useSync.ts` all change shape; `useKillSwitch.ts` removed.
- Uncommitted WIP under `src/app/api/accounts/[id]/master/`, `src/app/api/kill-switch/**`, and related hooks is superseded and should be deleted rather than built upon.
