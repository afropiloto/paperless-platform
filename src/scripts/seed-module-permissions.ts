import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ModulePermissionsService } from '../account-users/services/module-permissions.service';
import { LEGACY_MODULE_PERMISSIONS } from '../account-users/config/module-permissions.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
  const service = app.get(ModulePermissionsService);

  for (const item of LEGACY_MODULE_PERMISSIONS) {
    await service.upsert(item);
    console.log(`Upserted module permissions for ${item.module}`);
  }

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});


