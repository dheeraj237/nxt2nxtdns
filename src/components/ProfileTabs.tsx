'use client';

import { useState } from 'react';
import { BLOCKLIST_CATALOG } from '@/lib/nextdns/blocklistCatalog';
import { useParentalControlCategoriesCatalog, useParentalControlServicesCatalog } from '@/hooks/useCatalog';
import { SetupTab } from './SetupTab';
import { AnalyticsTab } from './AnalyticsTab';
import { LogsTab } from './LogsTab';
import type { ProfileEditorAdapter } from '@/hooks/useProfileEditorAdapter';
import type { ProfileSetup } from '@/lib/nextdns/types';

const TABS = ['Setup', 'Privacy', 'Parental Control', 'Denylist', 'Allowlist', 'Logs', 'Analytics'] as const;
type Tab = (typeof TABS)[number];

function ListSection({
  kind,
  entries,
  onAdd,
  onRemove,
  onToggleActive,
}: {
  kind: 'denylist' | 'allowlist';
  entries: { id: string; active: boolean }[];
  onAdd: (kind: 'denylist' | 'allowlist', id: string) => void;
  onRemove: (kind: 'denylist' | 'allowlist', id: string) => void;
  onToggleActive: (kind: 'denylist' | 'allowlist', id: string, active: boolean) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div>
      <ul className="mb-2 max-h-96 overflow-y-auto text-sm text-slate-600">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5">
            <span className={e.active ? '' : 'text-slate-400 line-through'}>{e.id}</span>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1 text-xs text-slate-500">
                <input type="checkbox" checked={e.active} onChange={(ev) => onToggleActive(kind, e.id, ev.target.checked)} />
                Active
              </label>
              <button onClick={() => onRemove(kind, e.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </div>
          </li>
        ))}
        {entries.length === 0 && <li className="py-2 text-slate-400">No entries yet.</li>}
      </ul>
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="domain.com"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (!value) return;
            onAdd(kind, value);
            setValue('');
          }}
          className="rounded bg-slate-900 px-2 py-1 text-sm text-white"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function PrivacyTab({ adapter }: { adapter: ProfileEditorAdapter }) {
  const profile = adapter.profile;
  if (!profile) return null;
  const activeIds = new Set(profile.privacy.blocklists.map((b) => b.id));

  function toggleBlocklist(id: string) {
    const next = activeIds.has(id) ? [...activeIds].filter((i) => i !== id) : [...activeIds, id];
    adapter.putBlocklists(next);
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={profile.privacy.disguisedTrackers}
            onChange={(e) => adapter.patchPrivacy({ disguisedTrackers: e.target.checked })}
          />
          Block disguised third-party trackers
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={profile.privacy.allowAffiliate}
            onChange={(e) => adapter.patchPrivacy({ allowAffiliate: e.target.checked })}
          />
          Allow affiliate & tracking links
        </label>
      </div>
      <p className="mb-1 text-xs font-medium text-slate-500">Blocklists</p>
      <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto">
        {BLOCKLIST_CATALOG.map((b) => (
          <label key={b.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={activeIds.has(b.id)} onChange={() => toggleBlocklist(b.id)} />
            {b.name}
          </label>
        ))}
      </div>
    </div>
  );
}

function ParentalControlTab({ adapter }: { adapter: ProfileEditorAdapter }) {
  const profile = adapter.profile;
  const { data: services = [] } = useParentalControlServicesCatalog();
  const { data: categories = [] } = useParentalControlCategoriesCatalog();
  if (!profile) return null;

  const activeServiceIds = new Set(profile.parentalControl.services.map((s) => s.id));
  const activeCategoryIds = new Set(profile.parentalControl.categories.map((c) => c.id));

  function toggleService(id: string) {
    const next = activeServiceIds.has(id) ? [...activeServiceIds].filter((i) => i !== id) : [...activeServiceIds, id];
    adapter.patchParentalControl({ services: next.map((sid) => ({ id: sid, active: true })) });
  }

  function toggleCategory(id: string) {
    const next = activeCategoryIds.has(id) ? [...activeCategoryIds].filter((i) => i !== id) : [...activeCategoryIds, id];
    adapter.patchParentalControl({ categories: next.map((cid) => ({ id: cid, active: true })) });
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={profile.parentalControl.safeSearch}
            onChange={(e) => adapter.patchParentalControl({ safeSearch: e.target.checked })}
          />
          Force SafeSearch
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={profile.parentalControl.youtubeRestrictedMode}
            onChange={(e) => adapter.patchParentalControl({ youtubeRestrictedMode: e.target.checked })}
          />
          YouTube restricted mode
        </label>
      </div>
      <p className="mb-1 text-xs font-medium text-slate-500">Categories</p>
      <div className="mb-3 grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
        {categories.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={activeCategoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} />
            {c.id}
          </label>
        ))}
      </div>
      <p className="mb-1 text-xs font-medium text-slate-500">Services</p>
      <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto">
        {services.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={activeServiceIds.has(s.id)} onChange={() => toggleService(s.id)} />
            {s.id}
          </label>
        ))}
      </div>
    </div>
  );
}

interface ProfileTabsProps {
  adapter: ProfileEditorAdapter;
  setup?: ProfileSetup | null;
  setupLoading?: boolean;
  profileId?: string;
}

export function ProfileTabs({ adapter, setup = null, setupLoading = false, profileId = '' }: ProfileTabsProps) {
  const [tab, setTab] = useState<Tab>('Setup');
  const { profile, isLoading, error } = adapter;

  if (isLoading) return <p className="text-sm text-slate-500">Loading profile...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load profile: {(error as Error).message}</p>;
  if (!profile) return null;

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex flex-wrap border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${tab === t ? 'border-b-2 border-slate-900 font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === 'Setup' && <SetupTab profileId={profileId} profileLabel={profile?.name || 'Profile'} setup={setup} setupLoading={setupLoading} />}
        {tab === 'Privacy' && <PrivacyTab adapter={adapter} />}
        {tab === 'Parental Control' && <ParentalControlTab adapter={adapter} />}
        {tab === 'Denylist' && (
          <ListSection kind="denylist" entries={profile.denylist} onAdd={adapter.addEntry} onRemove={adapter.removeEntry} onToggleActive={adapter.toggleEntryActive} />
        )}
        {tab === 'Allowlist' && (
          <ListSection kind="allowlist" entries={profile.allowlist} onAdd={adapter.addEntry} onRemove={adapter.removeEntry} onToggleActive={adapter.toggleEntryActive} />
        )}
        {tab === 'Logs' && <LogsTab profileId={profileId} />}
        {tab === 'Analytics' && <AnalyticsTab profileId={profileId} />}
      </div>
    </div>
  );
}
