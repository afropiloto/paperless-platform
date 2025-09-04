import { UserPermission } from 'src/account-users/types';


export function filterUserPermissionsByClientApplication(permissions: UserPermission[], clientName: string) {
  return permissions.filter((p) => p.module.split('-')[0].toLowerCase() === clientName.toLowerCase());
}