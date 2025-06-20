# Trade Documents Platform

# Issues:
1. After issuing an invoice the status goes to Issued but something is then reverting it back to In Progress


# Todo:
1. Setup ai.paiperless.com with dns-txt record for identify verification
2. Security
   * Need to add auth-guard to ensure requests have a valid session token and API key
   * Need to add an API key so that we know which application is making the request
3. Authentication Module
    * Need to extend Authentication Module to include a lookup between wallet address, application and application roles.
    * For example a wallet might be allowed to access Onboarding with the Agent role and Deal Desk with the Agent and Supervisor role.
    * There is an issue with using Web3 login in that an account is linked to a single wallet address. 
    * We could extend this by having the company account record linked to multiple wallets with different roles. 
    * We use these wallets for authentication and SIWE but use the company wallet address for tasks such as assigning ownership or making payments.
    * This would require 3 things:
      * For internal users we would need a Voy  Operations Account
      * We would need a UI to manage Voy Operations Accounts
      * We would need a customer facing page on Paiperless for a company admin to manage their accounts
4. Deal Desk Module
   * When a submitted deal is withdrawn, then update the deal using the deal-desk to be withdrawn
   * List Customers (wait for Onboarding to be complete)
   * Handle Promissory Note Signed event
5. Check Verify issued document works as expected
6. Registration Module
    - Need to integrate virus scan to file uploads. Possibly use a 2 stage scan (shallow -> deep) and provide a status on the document to indicate if it viewable yet.
    - Need to Add SIWE and check signature before creating new Registration and store the Wallet Address
7. Add Onboarding Module
   - Initialise onboarding record
   - Handle updates to DD checklist
   - Log Decision
   - Get Registrations by status
   - Get Registration by Id
8. Look at how we are handling dates to make sure we are doing this properly within DTOs and schemas
9. Trade Documents
   * Integrate Virus scanning
   * Consider add Simple document classifier to determine the likely document type if not provided. 
     * This would be used when the File changes and we don't have a file type specified.
10. Add Data Extraction on initial file upload
     * Test data extraction and failure modes
11. Account Analytics
     * Controller
     * Service
     * Repository
12. Authentication Module
    * Auth guard on routes (JWT or API Key?)
    * What about an API Keys for applications rather than JWT tokens?
    * Need middleware to decode the JWT and pull out the accountId for downstream use
    * Add AuthGuard to protected routes
    * Add Audit events for login
13. Update ReadMe with set up & deployment information
14. Consider adding a Notifications feature that we can use to notify accounts of problems with documents or general issues
15. Write Service and Controller Tests
    * Can we get Cursor to create the tests?
16. Consider adding a method to share issued documents with 3rd parties - this needs an email service


# Platform Deployment
ToDO

## Platform Configuration
ToDO

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


