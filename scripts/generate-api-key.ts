import mongoose from 'mongoose';
import { generateApiKey } from '../src/api-key-auth/api-key-auth.utils';
import { Client, ClientSchema } from '../src/api-key-auth/schemas/client.schema';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const clientName = process.argv[2];
const groups = process.argv.slice(3); // pass access groups from CLI

if (!clientName || groups.length === 0) {
  console.error('Usage: ts-node scripts/generate-api-key.ts <clientName> <accessGroup1> <accessGroup2> ...');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  const ClientModel = mongoose.model(Client.name, ClientSchema);

  const { keyId, hashedKey, fullKey } = await generateApiKey();

  await ClientModel.create({
    name: clientName,
    keyId,
    apiKeyHash: hashedKey,
    accessGroups: groups,
  });

  console.log(`✅ API key created for "${clientName}"`);
  console.log('🚨 Save this API key securely — you won’t see it again:');
  console.log(fullKey);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error generating API key:', err);
  process.exit(1);
});
