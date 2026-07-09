import crypto from 'node:crypto';
import { env } from './env';

const ALGO = 'aes-256-gcm';

function serverKey(): Buffer {
  const key = Buffer.from(env.serverSecret, 'hex');
  if (key.length !== 32) throw new Error('SERVER_SECRET must be 32 bytes hex-encoded');
  return key;
}

export function encrypt(plaintext: string): { ciphertext: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, serverKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, authTag]).toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decrypt(ciphertext: string, iv: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const authTag = buf.subarray(buf.length - 16);
  const enc = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv(ALGO, serverKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
