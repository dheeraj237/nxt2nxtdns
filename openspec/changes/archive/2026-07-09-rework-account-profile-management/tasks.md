## 1. Remove master/kill-switch and superseded WIP

- [x] 1.1 Delete `/api/kill-switch/**` route tree, `/api/accounts/[id]/master/route.ts`, `useKillSwitchEditorAdapter` (and its usages in `useProfileEditorAdapter.ts`), `useKillSwitch.ts`
- [x] 1.2 Remove `killSwitchRepo`, `kill_switch_profile` table definition, and `MasterValidationError`/`setMaster`/`getMaster`/`getMasterProfile` from `src/lib/db/repo.ts`
- [x] 1.3 Remove `is_master` column and `one_master_account` index from `src/lib/db/schema.sql`; remove `SyncSource: 'master' | 'kill-switch'` and `resolveMasterSource`/`resolveKillSwitchSource` from `src/lib/sync/loadTargets.ts`
- [x] 1.4 Remove "Set as master" button from `ProfileList.tsx` and the pinned master/kill-switch editors from `src/app/page.tsx`

## 2. Schema and repo changes for default profile

- [x] 2.1 Add `default_profile_id TEXT REFERENCES profiles(id)` to `accounts` in `schema.sql`
- [x] 2.2 Add `accountsRepo.setDefaultProfile(accountId, profileId)` and include `default_profile_id` in `accountsRepo.list`/account read paths
- [x] 2.3 Make `default_profile_id` NOT NULL; enforce at the repo/API layer that profile deletion is refused when the target is the account's last profile or its current default (per resolved design.md decision)

## 3. Account onboarding (list + add/edit/delete)

- [x] 3.1 Build account list page: list rows (label + delete icon), empty state, "+" add-account action
- [x] 3.2 Build add-account flow: label + API key form -> call NextDNS `listProfiles` with the key -> profile picker -> save account with `default_profile_id`
- [x] 3.3 Handle invalid API key and zero-profile-key cases per `account-onboarding` spec scenarios
- [x] 3.4 Build edit-account flow: rename label, change default profile among the account's existing profiles
- [x] 3.5 Wire delete icon to account deletion with confirmation copy stating it's local-only (per spec)
- [x] 3.6 Remove old `AddAccountForm`/`AddProfileForm` dashboard forms once the new onboarding flow covers their functionality
- [x] 3.7 In the profile-removal UI, disable/hide the delete action for a profile that is the account's last one or its current default, with copy explaining why (per `account-onboarding` spec)

## 4. Account detail page and profile editor

- [x] 4.1 Build account detail route/page: profile dropdown (default-selected to `default_profile_id`, switchable to any of that account's profiles)
- [x] 4.2 Build tab bar in order: Security, Privacy, Parental Control, Denylist, Allowlist, Logs, Analytics, Settings
- [x] 4.3 Wire Privacy, Parental Control tabs to existing adapter logic from `useProfileEditorAdapter.ts` (adapted to the new per-account/per-profile source, no master/kill-switch special-casing)
- [x] 4.4 Add active/inactive toggle switch to `ListSection` (Denylist/Allowlist), wired to `patchDenylistEntry`/`patchAllowlistEntry` with optimistic update + rollback-on-error
- [x] 4.5 Add placeholder content for Security, Logs, Analytics, Settings tabs (no fetch/persist)
- [x] 4.6 Wire "Save" button to persist only the currently selected account+profile

## 5. Save-to / clone flow

- [x] 5.1 Build "Save to..." modal: account list with checkboxes, select-all/select-none control
- [x] 5.2 Adapt `loadDiffsForTargets`/`SyncSource` so the diff source is the in-editor profile's current field values instead of a resolved master/kill-switch source
- [x] 5.3 Reuse `DiffPreviewModal` to show per-target diffs against each selected account's default profile before applying
- [x] 5.4 Wire confirm-apply to overwrite Denylist, Allowlist, Privacy, and Parental Control on each selected target's default profile
- [x] 5.5 Handle zero-target selection (no-op, no diff shown) per spec

## 6. Cleanup and verification

- [x] 6.1 Remove now-unused types/exports (`SyncSource` union values, old hooks) left over from steps 1-5
- [x] 6.2 Manually verify: onboard an account, edit its profile, toggle a denylist entry, save, then clone to a second account and confirm the diff/apply matches expectations
- [x] 6.3 Update README/docs referencing the old master/kill-switch flow if any exist
