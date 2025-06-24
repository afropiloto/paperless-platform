import { UserPermission } from '../../account-users/types/application-permissions.types';

export interface JwtPayload {
  accountId: string;
  userId: string;
  walletAddress: string;
  permissions: UserPermission[];
  iat?: number;
  exp?: number;
} 