import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const KEY_ID_LENGTH = 8;
const RAW_KEY_LENGTH = 32;
const BCRYPT_ROUNDS = 10;

export interface GeneratedApiKey {
  keyId: string;
  rawKey: string;
  fullKey: string; // format: keyId:rawKey
  hashedKey: string;
}

export async function generateApiKey(): Promise<GeneratedApiKey> {
  const keyId = crypto.randomBytes(KEY_ID_LENGTH / 2).toString('hex');
  const rawKey = crypto.randomBytes(RAW_KEY_LENGTH).toString('hex');
  const fullKey = `${keyId}:${rawKey}`;
  const hashedKey = await bcrypt.hash(rawKey, BCRYPT_ROUNDS);

  return {
    keyId,
    rawKey,
    fullKey,
    hashedKey,
  };
}
