import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentSigningRepository } from './document-signing.repository';
import { DocumentSigningDetailsDto, DocumentSigningSearchResultsDto, DocumentSigningCreationDetailsDto } from './dtos/document-signing.dto';
import { DocumentSigningStatus } from './types/document-signing.types';
import { SearchQueryDto } from 'src/common/dtos/search.dto';

@Injectable()
export class DocumentSigningService {
  private readonly logger = new Logger(DocumentSigningService.name);

  constructor(
    private readonly documentSigningRepository: DocumentSigningRepository,
  ) {}

  async findById(id: string): Promise<DocumentSigningDetailsDto> {
    this.logger.log(`Finding document signing by id: ${id}`);
    
    const documentSigning = await this.documentSigningRepository.findById(id);
    
    if (!documentSigning) {
      throw new NotFoundException(`Document signing with id ${id} not found`);
    }
    
    return documentSigning;
  }

  async findByWalletAddress(
    walletAddress: string, 
    searchQuery: SearchQueryDto
  ): Promise<DocumentSigningSearchResultsDto> {
    this.logger.log(`Finding document signings for wallet address: ${walletAddress}`);
    
    return await this.documentSigningRepository.findByWalletAddress(walletAddress, searchQuery);
  }

  async findExpiringSoonByWalletAddress(
    walletAddress: string, 
    daysUntilExpiry: number = 7
  ): Promise<DocumentSigningDetailsDto[]> {
    this.logger.log(`Finding expiring document signings for wallet address: ${walletAddress} within ${daysUntilExpiry} days`);
    
    return await this.documentSigningRepository.findExpiringSoonByWalletAddress(walletAddress, daysUntilExpiry);
  }

  async updateLastKnownStatus(
    id: string, 
    lastKnownStatus: DocumentSigningStatus
  ): Promise<DocumentSigningDetailsDto> {
    this.logger.log(`Updating last known status for document signing ${id} to ${lastKnownStatus}`);
    
    const updatedDocumentSigning = await this.documentSigningRepository.updateLastKnownStatus(id, lastKnownStatus);
    
    if (!updatedDocumentSigning) {
      throw new NotFoundException(`Document signing with id ${id} not found`);
    }
    
    this.logger.log(`Successfully updated document signing ${id} status to ${lastKnownStatus}`);
    return updatedDocumentSigning;
  }

  async create(
    creationDetails: DocumentSigningCreationDetailsDto
  ): Promise<DocumentSigningDetailsDto> {
    this.logger.log(`Creating new document signing for document: ${creationDetails.documentId}`);
    
    // Validate that the expiry date is in the future
    if (creationDetails.expiryDate <= new Date()) {
      throw new Error('Expiry date must be in the future');
    }
    
    // Validate that there are parties to sign
    if (!creationDetails.parties || creationDetails.parties.length === 0) {
      throw new Error('At least one party must be specified for document signing');
    }
    
    // Validate that all parties have valid wallet addresses
    const invalidParties = creationDetails.parties.filter(party => !party.walletAddress);
    if (invalidParties.length > 0) {
      throw new Error('All parties must have valid wallet addresses');
    }
    
    const createdDocumentSigning = await this.documentSigningRepository.create(creationDetails);
    
    this.logger.log(`Successfully created document signing with id: ${createdDocumentSigning.documentId}`);
    return createdDocumentSigning;
  }
}
