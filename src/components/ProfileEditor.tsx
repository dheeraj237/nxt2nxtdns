'use client';

import { useState } from 'react';
import { BLOCKLIST_CATALOG } from '@/lib/nextdns/blocklistCatalog';
import { useParentalControlCategoriesCatalog, useParentalControlServicesCatalog } from '@/hooks/useCatalog';
import type { ProfileEditorAdapter } from '@/hooks/useProfileEditorAdapter';

function ListSection({
  title,
  kind,
  entries,
  onAdd,
  onRemove,
}: {
  title: string;
  kind: 'denylist' | 'allowlist';
  entries: { id: string; active: boolean }[];
  onAdd: (kind: 'denylist' | 'allowlist', id: string) => void;
  onRemove: (kind: 'denylist' | 'allowlist', id: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-700">
        {title} ({entries.length})
      </h4>
      <ul className="mb-2 max-h-40 overflow-y-auto text-sm text-slate-600">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 py-0.5">
            <span>{e.id}</span>
            <button onClick={() => onRemove(kind, e.id)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
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

function PrivacySection({ adapter }: { adapter: ProfileEditorAdapter }) {
  const profile = adapter.profile;
  if (!profile) return null;
  const activeIds = new Set(profile.privacy.blocklists.map((b) => b.id));

  function toggleBlocklist(id: string) {
    const next = activeIds.has(id) ? [...activeIds].filter((i) => i !== id) : [...activeIds, id];
    adapter.putBlocklists(next);
  }

  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-700">Privacy</h4>
      <div className="mb-2 flex flex-col gap-1">
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
      <p className="mb-1 text-xs text-slate-500">Blocklists</p>
      <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
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

function ParentalControlSection({ adapter }: { adapter: ProfileEditorAdapter }) {
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
      <h4 className="mb-1 text-sm font-semibold text-slate-700">Parental control</h4>
      <div className="mb-2 flex flex-col gap-1">
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
      <p className="mb-1 text-xs text-slate-500">Categories</p>
      <div className="mb-2 grid max-h-32 grid-cols-2 gap-1 overflow-y-auto">
        {categories.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={activeCategoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} />
            {c.id}
          </label>
        ))}
      </div>
      <p className="mb-1 text-xs text-slate-500">Services</p>
      <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
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

export function ProfileEditor({ title, adapter }: { title: string; adapter: ProfileEditorAdapter }) {
  const { profile, isLoading, error } = adapter;

  if (isLoading) return <p className="text-sm text-slate-500">Loading {title.toLowerCase()}...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load {title.toLowerCase()}: {(error as Error).message}</p>;
  if (!profile) return null;

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 font-medium text-slate-800">
        {title}: {profile.name || 'Untitled'}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListSection title="Denylist" kind="denylist" entries={profile.denylist} onAdd={adapter.addEntry} onRemove={adapter.removeEntry} />
        <ListSection title="Allowlist" kind="allowlist" entries={profile.allowlist} onAdd={adapter.addEntry} onRemove={adapter.removeEntry} />
        <PrivacySection adapter={adapter} />
        <ParentalControlSection adapter={adapter} />
      </div>
    </div>
  );
}
