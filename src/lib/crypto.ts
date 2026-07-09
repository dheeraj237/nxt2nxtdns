// API keys are stored in plaintext by design (self-hosted, single-user tool) -
// no SERVER_SECRET / at-rest encryption.
export function encrypt(plaintext: string): { ciphertext: string; iv: string } {
  return { ciphertext: plaintext, iv: '' };
}

export function decrypt(ciphertext: string, _iv: string): string {
  return ciphertext;
}
