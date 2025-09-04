import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientInfoDetails } from '../types/api-key-auth.types';

export const ClientInfo = createParamDecorator(
  (data: keyof ClientInfoDetails | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const client = request.client as ClientInfoDetails;
    
    if (!client) {
      return null;
    }
    
    // If a specific property is requested, return it
    if (data) {
      return client[data];
    }
    
    // Otherwise return the full client info
    return client;
  },
);
