import { Router } from 'express';
import { accountsRepo, profilesRepo } from '../db/repo.js';
import {
  addAllowlistEntry,
  addDenylistEntry,
  getParentalControl,
  getPrivacy,
  getProfile,
  removeAllowlistEntry,
  removeDenylistEntry,
} from '../nextdns/endpoints.js';
import { NextDnsApiError } from '../nextdns/client.js';

export const profilesRouter = Router();

profilesRouter.get('/', (_req, res) => {
  res.json(profilesRepo.list());
});

profilesRouter.post('/', async (req, res) => {
  const { accountId, profileId, displayName } = req.body as {
    accountId?: string;
    profileId?: string;
    displayName?: string;
  };
  if (!accountId || !profileId) return res.status(400).json({ error: 'accountId and profileId required' });

  try {
    const apiKey = accountsRepo.getDecryptedKey(accountId);
    const liveProfile = await getProfile(apiKey, profileId);
    const row = profilesRepo.create(accountId, profileId, displayName ?? liveProfile.name ?? null);
    res.status(201).json(row);
  } catch (err) {
    if (err instanceof NextDnsApiError) {
      return res.status(422).json({ error: `NextDNS rejected profile id: ${err.message}` });
    }
    res.status(500).json({ error: err instanceof Error ? err.message : 'unknown error' });
  }
});

profilesRouter.delete('/:id', (req, res) => {
  profilesRepo.delete(req.params.id);
  res.status(204).end();
});

profilesRouter.patch('/:id/master', (req, res) => {
  const profile = profilesRepo.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  profilesRepo.setMaster(req.params.id);
  res.json({ ok: true });
});

profilesRouter.get('/:id/live', async (req, res) => {
  const profile = profilesRepo.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    const live = await getProfile(apiKey, profile.profile_id);
    res.json(live);
  } catch (err) {
    if (err instanceof NextDnsApiError) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: err instanceof Error ? err.message : 'unknown error' });
  }
});

profilesRouter.get('/:id/live/privacy', async (req, res) => {
  const profile = profilesRepo.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
  res.json(await getPrivacy(apiKey, profile.profile_id));
});

profilesRouter.get('/:id/live/parentalControl', async (req, res) => {
  const profile = profilesRepo.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
  res.json(await getParentalControl(apiKey, profile.profile_id));
});

function listRoute(kind: 'denylist' | 'allowlist', add: typeof addDenylistEntry, remove: typeof removeDenylistEntry) {
  profilesRouter.post(`/:id/live/${kind}`, async (req, res) => {
    const profile = profilesRepo.get(req.params.id);
    if (!profile) return res.status(404).json({ error: 'profile not found' });
    const { id, active } = req.body as { id?: string; active?: boolean };
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
      await add(apiKey, profile.profile_id, { id, active: active ?? true });
      res.status(201).json({ ok: true });
    } catch (err) {
      if (err instanceof NextDnsApiError) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err instanceof Error ? err.message : 'unknown error' });
    }
  });

  profilesRouter.delete(`/:id/live/${kind}/:entryId`, async (req, res) => {
    const profile = profilesRepo.get(req.params.id);
    if (!profile) return res.status(404).json({ error: 'profile not found' });
    try {
      const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
      await remove(apiKey, profile.profile_id, req.params.entryId);
      res.status(204).end();
    } catch (err) {
      if (err instanceof NextDnsApiError) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err instanceof Error ? err.message : 'unknown error' });
    }
  });
}

listRoute('denylist', addDenylistEntry, removeDenylistEntry);
listRoute('allowlist', addAllowlistEntry, removeAllowlistEntry);
