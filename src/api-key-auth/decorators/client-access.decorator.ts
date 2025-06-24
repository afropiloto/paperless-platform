import { SetMetadata } from '@nestjs/common';

export const ClientAccess = (...groups: string[]) =>
  SetMetadata('accessGroups', groups);
