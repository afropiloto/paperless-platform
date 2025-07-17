import { randomUUID } from 'crypto';

// Polyfill for crypto.randomUUID() if not available
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => randomUUID(),
  } as any;
}