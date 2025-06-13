import crypto from 'crypto';
import { FileData } from '../../types/trade-documents.types';


export function generateTrackingId() {
  return crypto.randomUUID();
}

export async function computeVerifiableHash(file: FileData) {
  const buffer = Buffer.from(file.buffer);
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

