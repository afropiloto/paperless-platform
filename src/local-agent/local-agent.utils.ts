/** Shared helpers for mongoose document identity under Mongoose 9 typings. */
export function entityId(doc: unknown): string {
  const record = doc as { id?: string; _id?: unknown };
  return String(record.id ?? record._id);
}
