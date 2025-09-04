import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ModulePermissions, ModulePermissionsSchema } from '../src/account-users/schemas/module-permissions.schema';
import { MODULE_PERMISSIONS_SEED } from '../src/account-users/config/module-permissions.seed';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI as string;

async function run() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const ModulePermissionsModel = mongoose.model(ModulePermissions.name, ModulePermissionsSchema);

  for (const item of MODULE_PERMISSIONS_SEED) {
    await ModulePermissionsModel.updateOne(
      { module: item.module },
      {
        $set: {
          description: item.description,
          allowableRoles: item.allowableRoles,
          active: item.active,
        },
        $setOnInsert: { module: item.module },
      },
      { upsert: true }
    );
    console.log(`Upserted module permissions for ${item.module}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error seeding module permissions:', err);
  process.exit(1);
});


