function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: required('CORS_ORIGIN'),
  masterPasswordHash: required('MASTER_PASSWORD_HASH'),
  jwtSecret: required('JWT_SECRET'),
  serverSecret: required('SERVER_SECRET'), // 32-byte hex, used for AES-256-GCM at rest
  dbPath: process.env.DB_PATH ?? 'data/app.db',
};
