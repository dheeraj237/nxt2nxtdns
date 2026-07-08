import { Router } from 'express';
import { accountsRepo } from '../db/repo.js';

export const accountsRouter = Router();

accountsRouter.get('/', (_req, res) => {
  res.json(accountsRepo.list());
});

accountsRouter.post('/', (req, res) => {
  const { label, apiKey } = req.body as { label?: string; apiKey?: string };
  if (!label || !apiKey) return res.status(400).json({ error: 'label and apiKey required' });
  const row = accountsRepo.create(label, apiKey);
  res.status(201).json({ id: row.id, label: row.label, created_at: row.created_at });
});

accountsRouter.patch('/:id', (req, res) => {
  const { apiKey } = req.body as { apiKey?: string };
  if (!apiKey) return res.status(400).json({ error: 'apiKey required' });
  accountsRepo.updateApiKey(req.params.id, apiKey);
  res.json({ ok: true });
});

accountsRouter.delete('/:id', (req, res) => {
  accountsRepo.delete(req.params.id);
  res.status(204).end();
});
