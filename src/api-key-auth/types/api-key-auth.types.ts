export interface ClientInfoDetails {
  keyId: string;
  accessGroups: string[];
  name: string;
}


export enum ClientAccessGroup {
  SHARED = 'shared',
  PAPERLESS_PORTAL = 'paperless-portal',
  PAPERLESS_APP =  'paperless-app',
}