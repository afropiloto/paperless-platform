import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers-v5';
import { DocumentSigningStatus } from './types/document-signing.types';

// ABI for the DocumentSigningRegistry contract
const DOCUMENT_SIGNING_ABI = [
  // Document creation
  'function createDocument(bytes32 documentHash, address[] memory signers, uint256 expirationDays) public returns (bytes32)',

  // Document signing
  'function signDocument(bytes32 documentId, bytes memory signature) public',

  // Document status checking
  'function getDocumentStatus(bytes32 documentId) public view returns (uint8)',

  // Document details
  'function getDocumentDetails(bytes32 documentId) public view returns (bytes32, address, uint8, uint256, uint256)',

  // Document signers
  'function getRequiredSigners(bytes32 documentId) public view returns (address[])',

  // Check if signed
  'function hasUserSigned(bytes32 documentId, address signer) public view returns (bool)',

  // Events
  'event DocumentCreated(bytes32 indexed documentId, address indexed initiator)',
  'event DocumentSigned(bytes32 indexed documentId, address indexed signer, uint256 timestamp)',
  'event SigningCompleted(bytes32 indexed documentId, uint256 timestamp)',
];

/**
 * Document Signing Service
 * Provides an interface to interact with the blockchain document signing contract
 */
@Injectable()
export class DocumentSigningContractService {
  private contractAddress: string;
  private contract: ethers.Contract;
  private contractOwnerSigner: ethers.Signer;
  private readonly logger = new Logger(DocumentSigningContractService.name);

  constructor(contractAddress: string, provider: ethers.Signer) {
    this.contractAddress = contractAddress;
    this.contractOwnerSigner = provider;
    this.contract = new ethers.Contract(
      this.contractAddress,
      DOCUMENT_SIGNING_ABI,
      provider,
    );
  }

  /**
   * Creates a new document to be signed
   * @param pdfBuffer The PDF document as a buffer
   * @param signerAddresses Array of Ethereum addresses that need to sign the document
   * @param expirationDays Number of days until the signing request expires
   * @returns The document ID used to reference this document in future operations
   */
  async createDocument(
    pdfBuffer: Buffer,
    signerAddresses: string[],
    expirationDays: number = 30,
  ): Promise<string> {
    try {
      // Calculate hash of the document
      const documentHash = ethers.utils.keccak256(pdfBuffer);

      // Create the document on the blockchain
      const tx = await this.contract.createDocument(
        documentHash,
        signerAddresses,
        expirationDays,
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Extract document ID from the event
      const event = receipt.events?.find((e) => e.event === 'DocumentCreated');
      if (!event) {
        throw new Error(
          'Document creation event not found in transaction receipt',
        );
      }

      const documentId = event.args?.documentId;
      return documentId;
    } catch (error) {
      this.logger.error({
        message: 'Error creating document:',
        error: error.error,
      });
      throw error;
    }
  }

  /**
   * Signs a document that was previously created
   * @param documentId The ID of the document to sign
   * @param pdfBuffer The PDF document buffer (to verify hash)
   * @returns Transaction receipt of the signing operation
   */
  async ownerSignDocument(
    documentId: string,
    pdfBuffer: Buffer,
  ): Promise<ethers.ContractReceipt> {
    try {
      // Calculate hash of the document to verify we're signing the right thing
      const documentHash = ethers.utils.keccak256(pdfBuffer);

      // Get document details to verify
      const details = await this.contract.getDocumentDetails(documentId);
      const storedHash = details[0]; // First return value is the document hash

      // Verify document hash matches
      if (storedHash !== documentHash) {
        throw new Error(
          'Document hash mismatch - cannot sign different document',
        );
      }

      // Create the signature of the document hash
      // This proves the signer approved this specific document
      const signerAddress = await this.contractOwnerSigner.getAddress();
      const messageHash = ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ['bytes32', 'address', 'string'],
          [documentHash, signerAddress, 'DocSign'], // Include context to prevent replay attacks
        ),
      );

      // Sign the message hash
      const signature = await this.contractOwnerSigner.signMessage(messageHash);

      // Submit the signature to the contract
      const tx = await this.contract.signDocument(documentId, signature);

      // Wait for transaction to be mined
      return await tx.wait();
    } catch (error) {
      this.logger.error({
        message: 'Error signing document:',
        error: error.error,
      });
      throw error;
    }
  }

  /**
   * Signs a document that was previously created
   * @param documentId The ID of the document to sign
   * @param pdfBuffer The PDF document buffer (to verify hash)
   * @param signer The Ethers Signer for the event
   * @returns Transaction receipt of the signing operation
   */
  async signDocument(
    documentId: string,
    pdfBuffer: Buffer,
    signer: ethers.Signer,
  ): Promise<ethers.ContractReceipt> {
    try {
      this.logger.debug(
        `Signing document: ${documentId} with wallet: ${await signer.getAddress()});`,
      );
      const contract = new ethers.Contract(
        this.contractAddress,
        DOCUMENT_SIGNING_ABI,
        signer,
      );
      // Calculate hash of the document to verify we're signing the right thing
      const documentHash = ethers.utils.keccak256(pdfBuffer);

      // Get document details to verify
      const details = await contract.getDocumentDetails(documentId);
      const storedHash = details[0]; // First return value is the document hash

      // Verify document hash matches
      if (storedHash !== documentHash) {
        throw new Error(
          'Document hash mismatch - cannot sign different document',
        );
      }

      // Create the signature of the document hash
      // This proves the signer approved this specific document
      const signerAddress = await signer.getAddress();
      const messageHash = ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ['bytes32', 'address', 'string'],
          [documentHash, signerAddress, 'DocSign'], // Include context to prevent replay attacks
        ),
      );

      // Sign the message hash
      const signature = await signer.signMessage(messageHash);

      // Submit the signature to the contract
      const tx = await contract.signDocument(documentId, signature);

      // Wait for transaction to be mined
      return await tx.wait();
    } catch (error) {
      console.error('Error signing document:', error);
      this.logger.error({
        message: 'Error signing document',
        documentId,
        signer: await signer.getAddress(),
        error: error.error,
      });
      throw error;
    }
  }

  /**
   * Gets the current status of a document
   * @param documentId The ID of the document to check
   * @returns The status as a number (0=Pending, 1=Completed, 2=Expired, 3=Revoked)
   */
  async getDocumentStatus(documentId: string): Promise<DocumentSigningStatus> {
    const status = await this.contract.getDocumentStatus(documentId);
    switch (status) {
      case 0:
        return DocumentSigningStatus.PENDING;
      case 1:
        return DocumentSigningStatus.SIGNED;
      case 2:
        return DocumentSigningStatus.EXPIRED;
        case 3:
          return DocumentSigningStatus.REVOKED;
      default:
        throw new Error(`Unknown Document Status returned from contract: ${status}`)
    }
  }

  /**
   * Checks if a specific user has signed a document
   * @param documentId The ID of the document to check
   * @param signerAddress The address of the signer to check
   * @returns True if the user has signed, false otherwise
   */
  async hasUserSigned(
    documentId: string,
    signerAddress: string,
  ): Promise<boolean> {
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
}