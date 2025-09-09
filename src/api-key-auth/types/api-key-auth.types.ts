export interface ClientInfoDetails {
  keyId: string;
  accessGroups: string[];
  name: string;
}


export enum ClientAccessGroup {
  SHARED = 'shared',
  PAIPERLESS_PORTAL = 'paiperless-portal',
  PAIPERLESS_APP =  'paiperless-app',
}