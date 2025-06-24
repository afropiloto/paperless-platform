import { Injectable, Logger } from '@nestjs/common';
import { DocumentSigning } from './schemas/document-signing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentSigningDetailsDto, DocumentSigningSearchResultsDto, DocumentSigningCreationDetailsDto } from './dtos/document-signing.dto';
import { DocumentSigningStatus } from './types/document-signing.types';
import { SearchQueryDto, SearchResultsMetadata } from 'src/common/dtos/search.dto';

@Injectable()
export class DocumentSigningRepository {
  private readonly logger = new Logger(DocumentSigningRepository.name);

  constructor(
    @InjectModel(DocumentSigning.name)
    private readonly documentSigningModel: Model<DocumentSigning>,
  ){}

  async findById(id: string): Promise<DocumentSigningDetailsDto | null> {
    try {
      const documentSigning = await this.documentSigningModel.findById(id).exec();
      if (!documentSigning) {
        return null;
      }
      return this.mapToDocumentSigningDetailsDto(documentSigning);
    } catch (error) {
      this.logger.error(`Error finding document signing by id ${id}:`, error);
      throw error;
    }
  }

  async findByWalletAddress(
    walletAddress: string, 
    searchQuery: SearchQueryDto
  ): Promise<DocumentSigningSearchResultsDto> {
    try {
      const { page = 1, limit = 10, queryTerm, orderBy = 'createdAt', orderDirection = 'desc' } = searchQuery;
      const skip = (page - 1) * limit;

      // Build query to find documents where the wallet address is in the signers array
      const query: any = {
        'signers.walletAddress': walletAddress
      };

      // Add description filter if provided
      if (queryTerm) {
        query.description = { $regex: queryTerm, $options: 'i' };
      }

      // Build sort object
      const sort: any = {};
      sort[orderBy] = orderDirection === 'desc' ? -1 : 1;

      const [documentSignings, total] = await Promise.all([
        this.documentSigningModel
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.documentSigningModel.countDocuments(query).exec()
      ]);

      const totalPages = Math.ceil(total / limit);
      const metadata: SearchResultsMetadata = {
        page,
        totalPages,
        limit
      };

      const documentSigningDetails = documentSignings.map(doc => 
        this.mapToDocumentSigningDetailsDto(doc)
      );

      return {
        documentSigningDetails,
        metadata
      };
    } catch (error) {
      this.logger.error(`Error finding document signings by wallet address ${walletAddress}:`, error);
      throw error;
    }
  }

  async findExpiringSoonByWalletAddress(
    walletAddress: string, 
    daysUntilExpiry: number = 7
  ): Promise<DocumentSigningDetailsDto[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      const query = {
        'signers.walletAddress': walletAddress,
        lastKnownStatus: DocumentSigningStatus.PENDING,
        expiryDate: { $lte: expiryDate, $gte: new Date() }
      };

      const documentSignings = await this.documentSigningModel
        .find(query)
        .sort({ expiryDate: 1 })
        .exec();

      return documentSignings.map(doc => this.mapToDocumentSigningDetailsDto(doc));
    } catch (error) {
      this.logger.error(`Error finding expiring document signings for wallet address ${walletAddress}:`, error);
      throw error;
    }
  }

  async updateLastKnownStatus(
    id: string, 
    lastKnownStatus: DocumentSigningStatus
  ): Promise<DocumentSigningDetailsDto | null> {
    try {
      const updatedDocumentSigning = await this.documentSigningModel
        .findByIdAndUpdate(
          id,
          { lastKnownStatus },
          { new: true, runValidators: true }
        )
        .exec();

      if (!updatedDocumentSigning) {
        return null;
      }

      return this.mapToDocumentSigningDetailsDto(updatedDocumentSigning);
    } catch (error) {
      this.logger.error(`Error updating last known status for document signing ${id}:`, error);
      throw error;
    }
  }

  async create(
    creationDetails: DocumentSigningCreationDetailsDto
  ): Promise<DocumentSigningDetailsDto> {
    try {
      const documentSigningData = {
        description: creationDetails.description,
        documentSigningAddress: creationDetails.documentSigningAddress,
        documentId: creationDetails.documentId,
        signers: creationDetails.parties,
        lastKnownStatus: DocumentSigningStatus.PENDING,
        expiryDate: creationDetails.expiryDate
      };

      const newDocumentSigning = new this.documentSigningModel(documentSigningData);
      const savedDocumentSigning = await newDocumentSigning.save();

      return this.mapToDocumentSigningDetailsDto(savedDocumentSigning);
    } catch (error) {
      this.logger.error('Error creating document signing:', error);
      throw error;
    }
  }

  private mapToDocumentSigningDetailsDto(documentSigning: DocumentSigning): DocumentSigningDetailsDto {
    return {
      description: documentSigning.description,
      documentSigningAddress: documentSigning.documentSigningAddress,
      documentId: documentSigning.documentId,
      parties: documentSigning.signers,
      expiryDate: documentSigning.expiryDate,
      createdAt: (documentSigning as any).createdAt,
      updatedAt: (documentSigning as any).updatedAt,
      lastKnownStatus: documentSigning.lastKnownStatus
    };
  }
}