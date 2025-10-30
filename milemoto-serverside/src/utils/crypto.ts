import { createHash, randomBytes } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

// n = bytes. 32 bytes → 256-bit token.
export function randToken(n = 32): string {
  // URL-safe
  return randomBytes(n).toString('base64url');
}
