# Trade Documents Platform

# Testing
1. Registration - register -> Onboard Reject
2. Registration - register -> Accept Reject - check Account is created
3. Upload Trade Document -> Issue -> Fund -> Reject
4. Upload Trade Document -> Issue -> Fund -> Accept -> Promissory Note -> Signed


# Todo:
1. Setup ai.paiperless.com with dns-txt record for identify verification
2. Document signing
   * Add service to interact with the Document Signing service to read data.
   * Update retrieval methods to get current data from chain. Do this for In Progress items only but where an updated status is returned, update the status in the database.
3. Extend document types to include Bill of Lading and Warehouse receipts
4. Migrate data extraction to extend.ai
5. Email Module - add EmailerService that integrates with an email provider to send emails.
6. Security
   * Need to add setup API Key guards on endpoints
   * Need to add JWT guard to controllers
   * Need to add UserPermissionGuards to controller methods
   * We need a Paiperless Account with users creating 
7. Virus Scan
    * Need to integrate Virus Scan into Registration documents upload
    * Need to integrate Virus Scan into Trade Documents File upload
8. Account Analytics
9. Need to ensure that if we suspend and account that all users related to that account are suspended - also for making accounts Active
10. Need to ensure that when account users are being updated for an accountId, they are being updated by an account linked to the same accountId OR the user is a Voy Admin user
11. Update ReadMe with set up & deployment information
12. Write Service and Controller Tests
    * Can we get Cursor to create the tests?

# Platform Deployment
ToDO

## Platform Configuration
ToDO

## Authentication Roles and Configuration
ToDo: Add information about configuring applications and roles

### Decoding the JWT token clientside and checking for permissions
The following code snippet shows how the JWT can be decoded and the permissions accessed.
``` typescript
// Decode JWT token
const decoded = jwt_decode(accessToken);

// Check if user has permission for DealDesk module
const hasDealDeskAccess = decoded.permissions.some(
p => p.moduleId === 'deal-desk' && p.roleId === 'supervisor'
);

// Render UI based on permissions
if (hasDealDeskAccess) {
showDealDeskModule();
}
```

## Trade Trust setup
The Paiperless application uses the TradeTrust packages to issue verifiable documents and mint transferable documents
We are using the DNS-TXT method for identification and deploying on chain; the following outlines how these are setup


### Setup for Verifiable Documents
Run script `pnpm run script:generateDidWeb`

https://docs.tradetrust.io/docs/how-tos/open-attestation/verifiable-documents/dns-did/dns


### Deploy Document Store (Legacy)
see https://documentation.tradetrust.io/docs/how-tos/open-attestation/verifiable-documents/dns-txt/deploying-document-store/document-store-cli

You will need to install the Trade Trust CLI tools (https://documentation.tradetrust.io/docs/how-tos/open-attestation/prerequisites/#installation-of-tradetrust-cli)
Once installed, the Document Store can be deployed using 

`tradetrust deploy document-store "Paiperless Document Store" --network stability -k <wallet private key>`

or

`tradetrust deploy document-store "Paiperless Document Store" --network stability -f <wallet private key file>`

This will deploy a new Document Store smart contract to the network and the output will include the address the document store is deployed to
This address should be copied and stored in the .env file as DOCUMENT_STORE_ADDRESS

>TODO: Need to create a script for this

### Deploy Token Registry
To deploy a new token registry we can run the following pnpm script

`pnpm run script:deployTokenRegistry`

This will deploy a new token registry using the settings in the .env file.
The script will run and then update the .env file with the new token registry address

>Note: running this script will overwrite the current token registry address in the .env file.

### DNS-TXT setup
As part of the document verification at Trade Trust, we need to set up DNS-TXT records to provide proof of identity
See https://documentation.tradetrust.io/docs/how-tos/issuer/dns-txt/#hands-on-creating-a-dns-txt-record

Since we are using both a Token Registry and a Document Store we need to create 2 DNS TXT records on the target domain (ai.paiperless.com).
One is for the Token Registry and the other for the Document Store
These records have the form

`openatts net=ethereum netId=<NETWORK_ID> addr=<CONTRACT_ADDRESS>`

* The <NETWORK_ID> should be the CHAIN ID where the contracts are deployed. So for Stability mainnet this would be 101010
* The <CONTRACT_ADDRESS> should be either the address of the deployed smart contract for the Token Registry or Document Store.

> IMPORTANT: This is required for production only and not required in a dev environment
> 
> Potentially if we need to test Trade Trust document verification during development we can deploy to a test net and add the TXT-DNS records as needed.
> The best approach would be to setup the contracts on a test net and each developer/tester issues to these rather than each setting up their own.  







## Redis Queue Deployment
ToDO

## Virus Scan Deployment
Currently the ClaimAV container requires an environment variable to be set
``CLAMAV_DB_PATH``
This is the path to persistent storage for the Virus Signatures DB

__Note:__
1. We may change this so that we have a base layer plus a Prod layer that allows the volume to be mapped to some persistent storage


# Development
## Security
The platform has 2 layers of security that protects access to the API.
1. Client API Keys
2. User Permissions

The Client API Keys restrict access to specific applications whereas the User Permissions restricts based on the business module and role that a user account might hold.

### Client API Keys
The Trade Docs Platform serves multiple client applications which are a mixture of public facing (Paiperless) and internal facing (Paiperless Portal and Vault).
Some API endpoints are for internal use only, others should not be used internally and some are public.

At a technical level, this is achieved through the `api-key-auth` module and decorators that can be applied to Controller endpoints.
The `ApiKeyGuard` Guard added to an endpoint indicates that the request is protected by Client API Keys.
The key needs to be provided by clients as the `x-api-key` header in the request.
To determine which application groups are allowed to access the endpoint we specify these using the `@ClientAccess()` decorator and pass a set of application group labels.

So a controller method with the following decorators is guarded by the ApiKeyGuard and only Client API keys that belong to one of the groups `'paiperless-portal'` or `'internal-only'` can access.
If there is no API key provided. not recognised or the provided key is valid but does not belong to one of the groups then a HTTP 403 Forbidden response is returned 
```typescript
@UseGuards(ApiKeyGuard)
@Controller('finance')
export class FinanceController {
  @Get('review')
  @ClientAccess('paiperless-portal', 'internal-only') // Only Paiperless or Portal can access
  reviewStuff(@Req() req) {
    return `Welcome ${req.user.name}, your level grants access to review.`;
  }
}
```

#### Generating new API Keys
Keys for client applications can be generated using the CLI script 

`npx run script:generate-api-key '<clientName>' <groups>`

Where `<clientName>` is the name given to the application for identification purposes (for example `paiperless`) and `<groups>` is a space delimited list of application groups.
Example Usage:
```bash
npx run script:generate-api-key "paiperless-portal" shared internal-only paiperless-portal-only
```
This will generate output similar to the following:
```bash
✅ API key created for "paiperless-portal"
🚨 Save this API key securely — you won’t see it again:
a1b2c3d4:9f8e7c6b5a4...
```
This generates a new API Key attached to the client application and stores this in the `clients` collection but only the hash of the API is stored and used for comparison.
The API key should be copied and saved securely as it is not recoverable. If lost, then a new key would be generated.

### User Permissions
While the Client API Key prevents client applications from accessing API endpoints they should not have access to, the `UserPermissionGuard` ensures that controllers check the user's permissions when endpoints are called.
Aside from a few public API endpoints, all endpoints require a JWT token to be provided as a Bearer Token in the `Authorization` header.
The JTW token is generated when the user authenticates and includes information such as:
* Linked Account
* User Name
* Permissions
The Permissions define the modules that the user account has access to and what the role they have. We currently support 3 roles:
1. __Agent__ - the lowest level of authority and is an operation role used to carry out tasks that don't typically involve payments. For example, they can add new Trade Documents by can't issue a Trade Document.
2. __Supervisor__ - represents an operational role that can perform tasks that involve costs. For example, on Paiperless a Supervisor can  A Supervisor can Issue Trade Documents and Request Funding.
3. __Manager__ - represents an administrative role that can perform administrative tasks on the account. For example, on Paiperless a Manager can update the Account Details and add/remove user accounts.

In the current implementation, the roles are hierarchical so a Supervisor is an Agent and a Supervisor.

A module isn't strictly an application, for Paiperless App, we have the Trade Documents module and the Finance Module which can be assigned to different users.
User Permissions are managed within the Paiperless application (for customer accounts) and within the Paiperless Portal for Paiperless accounts.

When a user logs in, their permissions are retrieved and stored in the JWT token. This allows client applications to make decisions about which features to they can access.
However, to enforce this we check these permissions at request time. 

We configure endpoints with User Permission checks using Guards and decorators. 
* The `JwtAuthGuard` enforces that a JWT token must be provided
* The `UserPermissionGuard` enforces that user permissions should be checked.
* The `@UserAccess()` decorator is used to specify the module and role that the user must have in order to access the endpoint

For example:
```typescript
@UseGuards(JwtAuthGuard, UserPermissionGuard)
@Controller('finance')
export class FinanceController {
  @Get('review')
  @UserAccess({ module: 'Finance', minRole: 'Supervisor' }) // Supervisor or Manager
  reviewStuff(@Req() req) {
    return `Welcome ${req.user.name}, your level grants access to review.`;
  }
}
```
