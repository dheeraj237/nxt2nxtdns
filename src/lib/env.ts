function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

// Getters defer the required-var check to first access, so importing this module
// (e.g. during `next build`'s route analysis, before real env vars are injected) doesn't throw.
export const env = {
  get masterPassword() {
    return required('MASTER_PASSWORD');
  },
  get jwtSecret() {
    return required('JWT_SECRET');
  },
  get serverSecret() {
    return required('SERVER_SECRET'); // 32-byte hex, used for AES-256-GCM at rest
  },
  get dbPath() {
    return process.env.DB_PATH ?? 'data/app.db';
  },
};
