# Trade Documents Platform


# Todo:
1. Registration Module
    - Need to integrate virus scan to file uploads. Possibly use a 2 stage scan (shallow -> deep) and provide a status on the document to indicate if it viewable yet.
    - Need to Add SIWE and check signature before creating new Registration and store the Wallet Address
2. Add Onboarding Module
   - Initialise onboarding
   - Update Onboarding task state
   - Log Decision
   - Get Registrations by status
3. Look at how we are handling dates to make sure we are doing this properly within DTOs and schemas
4. Trade Documents
   * Integrate Virus scanning
   * Test the creation and editing of documents when the file type changes 
   * Consider add Simple document classifier to determine the likely document type if not provided. 
     * This would be used when the File changes and we don't have a file type specified. 
5. Issue Trade Document
    * Migrate to DID Identity and sign documents being issued and minted
    * Migrate to use TT supported network providers functions rather than coding our own.
    * Add ability to specify the network to publish on
6. Add Data Extraction
    * Test data extraction and failure modes
7. Account Analytics
    * Controller
    * Service
    * Repository
8. Authentication Module
   * allow email/password or web3 authentication
   * JWT and refresh tokens?
   * Auth guard on routes (JWT or API Key?)
   * What about an API Keys for applications rather than JWT tokens?
   * Need middleware to decode the JWT and pull out the accountId for downstream use
   * Add AuthGuard to protected routes
   * Add Audit events for login
9. Update ReadMe with set up & deployment information
10. Migrate to Stability Mainnet and test
    * Issue Verifiable document
    * Issue Transferable document
    * Check Verify document
11. Consider adding a Notifications feature that we can use to notify accounts of problems with documents or general issues
12. Write Service and Controller Tests
    * Can we get Cursor to create the tests?
13. Consider adding a method to share issued documents with 3rd parties - this needs an email service
14. Create scripts and pnpm script commands to perform actions
    * Create DID json file
    * Deploy Trade Trust Token Registry
    * Deploy Trade Trust Document Store


# Platform Deployment

## Platform Configuration

## Redis Queue Deployment

## Virus Scan Deployment

