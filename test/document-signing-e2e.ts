import { ethers} from "ethers-v5";
import * as fs from "node:fs";

// Complete ABI for the DocumentSigningRegistry contract
const DOCUMENT_SIGNING_ABI = [
  // Document creation
  "function createDocument(bytes32 documentHash, address[] memory signers, uint256 expirationDays) public returns (bytes32)",
  
  // Document signing
  "function signDocument(bytes32 documentId, bytes memory signature) public",
  
  // Document status checking
  "function getDocumentStatus(bytes32 documentId) public view returns (uint8)",
  
  // Document details
  "function getDocumentDetails(bytes32 documentId) public view returns (bytes32, address, uint8, uint256, uint256)",
  
  // Document signers
  "function getRequiredSigners(bytes32 documentId) public view returns (address[])",
  
  // Check if signed
  "function hasUserSigned(bytes32 documentId, address signer) public view returns (bool)",

  // User Documents
  "function getUserDocuments(address user, uint256 offset, uint256 limit) public view returns (bytes32[] memory)",

  // Events - Complete definitions with proper parameter types
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "documentId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "initiator",
        "type": "address"
      }
    ],
    "name": "DocumentCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "documentId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "signer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DocumentSigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "documentId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "SigningCompleted",
    "type": "event"
  }
];

/**
 * Document Signing Service
 * Provides an interface to interact with the blockchain document signing contract
 */
export class DocumentSigningService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  
  /**
   * Create a new document signing service
   * @param contractAddress Address of the deployed DocumentSigningRegistry contract
   * @param provider Ethereum provider or signer
   */
  constructor(contractAddress: string, provider: ethers.Signer) {
    this.signer = provider;
    this.contract = new ethers.Contract(contractAddress, DOCUMENT_SIGNING_ABI, provider);
    this.contract.on("DocumentCreated", (arg1, arg2, event) => {
      console.log("DocumentCreated emitted:", arg1, arg2);
    });

  }

  async getContractDetails() {
    console.log(`Contract Address: ${this.contract.address}`)
    console.log(`Provider Network: ${JSON.stringify(await this.contract.provider?.getNetwork())}`);
  }
  /**
   * Creates a new document to be signed
   * @param pdfBuffer The PDF document as a buffer
   * @param signerAddresses Array of Ethereum addresses that need to sign the document
   * @param expirationDays Number of days until the signing request expires
   * @returns The document ID used to reference this document in future operations
   */
  async createDocumentForSigning(
    pdfBuffer: Buffer,
    signerAddresses: string[],
    expirationDays: number = 30
  ): Promise<string> {
    try {
      // Calculate hash of the document
      const documentHash = ethers.utils.keccak256(pdfBuffer);
      
      // Create the document on the blockchain
      const tx = await this.contract.createDocument(
        documentHash,
        signerAddresses,
        expirationDays
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Debug: Log the full receipt
      console.log('Transaction receipt:', JSON.stringify(receipt, null, 2));
      
      // Extract document ID from the event
      const event = receipt.events?.find((e: any) => e.event === 'DocumentCreated');
      if (!event) {
        console.error('Available events:', receipt.events?.map((e: any) => e.event || 'unnamed'));
        throw new Error('Document creation event not found in transaction receipt');
      }

      const documentId = event.args?.documentId;
      console.log('Document ID from event:', documentId);
      return documentId;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
  
  /**
   * Signs a document that was previously created
   * @param documentId The ID of the document to sign
   * @param pdfBuffer The PDF document buffer (to verify hash)
   * @returns Transaction receipt of the signing operation
   */
  async signDocument(documentId: string, pdfBuffer: Buffer): Promise<ethers.ContractReceipt> {
    try {
      // Calculate hash of the document to verify we're signing the right thing
      const documentHash = ethers.utils.keccak256(pdfBuffer);
      
      // Get document details to verify
      const details = await this.contract.getDocumentDetails(documentId);
      const storedHash = details[0]; // First return value is the document hash
      
      // Verify document hash matches
      if (storedHash !== documentHash) {
        throw new Error('Document hash mismatch - cannot sign different document');
      }
      
      // Create the signature of the document hash
      // This proves the signer approved this specific document
      const signerAddress = await this.signer.getAddress();
      const messageHash = ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ['bytes32', 'address', 'string'],
          [documentHash, signerAddress, 'DocSign'] // Include context to prevent replay attacks
        )
      );
      
      // Sign the message hash
      const signature = await this.signer.signMessage(messageHash);
      
      // Submit the signature to the contract
      const tx = await this.contract.signDocument(documentId, signature);
      
      // Wait for transaction to be mined
      return await tx.wait();
    } catch (error) {
      console.error('Error signing document:', error);
      throw error;
    }
  }


  async getUserDocuments(walletAddress:string, offset:number, limit: number): Promise<string[]> {
    return await this.contract.getUserDocuments(walletAddress, offset, limit);
  }

  /**
   * Gets the current status of a document
   * @param documentId The ID of the document to check
   * @returns The status as a number (0=Pending, 1=Completed, 2=Expired, 3=Revoked)
   */
  async getDocumentStatus(documentId: string): Promise<number> {
    return await this.contract.getDocumentStatus(documentId);
  }
  
  /**
   * Checks if a specific user has signed a document
   * @param documentId The ID of the document to check
   * @param signerAddress The address of the signer to check
   * @returns True if the user has signed, false otherwise
   */
  async hasUserSigned(documentId: string, signerAddress: string): Promise<boolean> {
    return await this.contract.hasUserSigned(documentId, signerAddress);
  }
  
  /**
   * Gets all required signers for a document
   * @param documentId The ID of the document
   * @returns Array of Ethereum addresses that need to sign
   */
  async getRequiredSigners(documentId: string): Promise<string[]> {
    return await this.contract.getRequiredSigners(documentId);
  }
  
  /**
   * Subscribes to document signing events
   * @param documentId The ID of the document to watch
   * @param callback Function called when signing events occur
   * @returns An unsubscribe function
   */
  watchSigningEvents(documentId: string, callback: (event: any) => void): () => void {
    // Create filter for the DocumentSigned event for this document
    const filter = this.contract.filters.DocumentSigned(documentId);
    
    // Set up the listener
    this.contract.on(filter, (docId, signer, timestamp, event) => {
      callback({
        documentId: docId,
        signer: signer,
        timestamp: new Date(timestamp.toNumber() * 1000),
        event: event
      });
    });
    
    // Return unsubscribe function
    return () => {
      this.contract.off(filter, callback);
    };
  }
}



async function documentSigningE2E (rpcUrl: string, contractAddress: string, walletPrivateKey: string, signers: string[]) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(walletPrivateKey, provider);

    const documentService = new DocumentSigningService(contractAddress, wallet);

    await documentService.getContractDetails();

    const pdfBuffer = fs.readFileSync('C:/Users/billm/repos/voy/document-signing/multi-party-doc-signing/test/fixtures/invoice_example.pdf');

  // Create document signing request
  console.log('Creating document signing request...');
  const documentId = await documentService.createDocumentForSigning(pdfBuffer, signers, 30);
  console.log('Document created with ID:', documentId);
  
  // Sign document
  console.log('Signing document...');
  const receipt = await documentService.signDocument(documentId, pdfBuffer);
  console.log('Document signed:', receipt.transactionHash);
}

const rpcUrl = "http://127.0.0.1:8545"
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const mainWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const mainWalletPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const otherWalletAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
const otherWalletPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
const signers = [
    mainWalletAddress,
    otherWalletAddress
];

async function main() {
    await documentSigningE2E(rpcUrl, contractAddress, mainWalletPrivateKey, signers)
        .then(()=>{console.log("Done")})
}

main().then(() => {console.log("DONE")})


