import { ApiHeader } from '@nestjs/swagger';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

export const ApiKeyProtectedSwagger = () =>
  applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiHeader({
      name: 'x-api-key',
      description: 'API key for authenticating client application',
      required: true,
    }),
  );
