import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionsValidationService } from '../account-users/services/permissions-validation.service';
import { ModulePermissionsService } from '../account-users/services/module-permissions.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
  const permissionsValidation = app.get(PermissionsValidationService);
  const modulePermissionsService = app.get(ModulePermissionsService);

  // Use the legacy logic via PermissionsValidationService to get current combinations
  const combinations = await permissionsValidation.getValidCombinations();

  // Group by module
  const grouped: Record<string, Array<{ role: string; description?: string }>> = {};
  for (const c of combinations) {
    if (!grouped[c.module]) grouped[c.module] = [];
    grouped[c.module].push({ role: c.role, description: c.description });
  }

  for (const module of Object.keys(grouped)) {
    await modulePermissionsService.upsert({
      module,
      description: `${module} module`,
      allowableRoles: grouped[module],
      active: true,
    });
    console.log(`Upserted from legacy combinations: ${module}`);
  }

  await app.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});


