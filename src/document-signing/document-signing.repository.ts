import { Injectable, Logger } from '@nestjs/common';
import { DocumentSigning } from './schemas/document-signing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DocumentSigningCreationDetailsDto,
  DocumentSigningDetailsDto,
  DocumentSigningSearchResultsDto,
  UpdateSigningDetailsDto,
} from './dtos/document-signing.dto';
import {
  DocumentSigningFilterByParams,
  DocumentSigningStatus,
} from './types/document-signing.types';
import {
  SearchQueryDto,
  SearchResultsMetadata,
} from 'src/common/dtos/search.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DocumentSigningRepository {
  private readonly logger = new Logger(DocumentSigningRepository.name);

  constructor(
    @InjectModel(DocumentSigning.name)
    private readonly documentSigningModel: Model<DocumentSigning>,
  ) {}

  async findById(id: string): Promise<DocumentSigningDetailsDto | null> {
    try {
      const documentSigning = await this.documentSigningModel
        .findById(id)
        .exec();
      if (!documentSigning) {
        return null;
      }

      return plainToInstance(DocumentSigningDetailsDto, {
        id: documentSigning._id.toString(),
        ...documentSigning.toObject(),
      });
    } catch (error) {
      this.logger.error(`Error finding document signing by id ${id}:`, error);
      throw error;
    }
  }

  async findByIdentifier(
    filterParams: DocumentSigningFilterByParams,
    searchQuery: SearchQueryDto,
  ): Promise<DocumentSigningSearchResultsDto> {
    try {
      const {
        page = 1,
        limit = 10,
        queryTerm,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = searchQuery;
      const skip = (page - 1) * limit;

      // Build query to find documents where the wallet address is in the parties array
      let query: any;
      if (filterParams.walletAddress) {
        query['parties.walletAddress'] = filterParams.walletAddress;
      }
      if (filterParams.accountId) {
        query['accountId'] = filterParams.accountId;
      }

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
        this.documentSigningModel.countDocuments(query).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);
      const metadata: SearchResultsMetadata = {
        page,
        totalPages,
        limit,
      };

      const documentSigningDetails = documentSignings.map((doc) =>
        this.mapToDocumentSigningDetailsDto(doc),
      );

      return plainToInstance(DocumentSigningSearchResultsDto, {
        documentSigningDetails,
        metadata,
      });
    } catch (error) {
      this.logger.error(
        `Error finding document signings by filter properties ${filterParams}:`,
        error,
      );
      throw error;
    }
  }

  async findExpiringSoonByWalletAddress(
    walletAddress: string,
    daysUntilExpiry: number = 7,
  ): Promise<DocumentSigningDetailsDto[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      const query = {
        'parties.walletAddress': walletAddress,
        lastKnownStatus: DocumentSigningStatus.PENDING,
        expiryDate: { $lte: expiryDate, $gte: new Date() },
      };

      const documentSignings = await this.documentSigningModel
        .find(query)
        .sort({ expiryDate: 1 })
        .exec();

      return documentSignings.map((doc) =>
        this.mapToDocumentSigningDetailsDto(doc),
      );
    } catch (error) {
      this.logger.error(
        `Error finding expiring document signings for wallet address ${walletAddress}:`,
        error,
      );
      throw error;
    }
  }

  async updateLastKnownStatus(
    id: string,
    lastKnownStatus: DocumentSigningStatus,
  ): Promise<DocumentSigningDetailsDto | null> {
    try {
      const updatedDocumentSigning = await this.documentSigningModel
        .findByIdAndUpdate(
          id,
          { lastKnownStatus },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedDocumentSigning) {
        return null;
      }

      return this.mapToDocumentSigningDetailsDto(updatedDocumentSigning);
    } catch (error) {
      this.logger.error(
        `Error updating last known status for document signing ${id}:`,
        error,
      );
      throw error;
    }
  }

  async create(
    creationDetails: DocumentSigningCreationDetailsDto,
  ): Promise<DocumentSigningDetailsDto> {
    try {
      const documentSigningData = {
        description: creationDetails.description,
        accountId: creationDetails.accountId,
        documentId: creationDetails.documentId,
        parties: creationDetails.parties,
        lastKnownStatus: DocumentSigningStatus.PENDING,
        expiryDate: creationDetails.expiryDate,
      };

      const newDocumentSigning = new this.documentSigningModel(
        documentSigningData,
      );
      const savedDocumentSigning = await newDocumentSigning.save();

      const mapped = this.mapToDocumentSigningDetailsDto(savedDocumentSigning);
      this.logger.debug({mapped})
      return mapped;
    } catch (error) {
      this.logger.error('Error creating document signing:', error);
      throw error;
    }
  }

  private mapToDocumentSigningDetailsDto(
    documentSigning: DocumentSigning,
  ): DocumentSigningDetailsDto {
    return plainToInstance(DocumentSigningDetailsDto, {
      id: documentSigning._id.toString(),
      ...documentSigning.toObject(),
    });
  }

  async update(signingId, updates: UpdateSigningDetailsDto) {
    try {
      const updatedDocumentSigning = await this.documentSigningModel
        .findByIdAndUpdate(
          signingId,
          updates,
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedDocumentSigning) {
        return null;
      }

      return this.mapToDocumentSigningDetailsDto(updatedDocumentSigning);
    } catch (error) {
      this.logger.error(
        `Error updating Document Signing Records ${signingId}:`,
        error,
      );
      throw error;
    }
  }

  async findByTradeDocumentId(
    tradeDocumentId: string,
  ): Promise<DocumentSigningDetailsDto | null> {
    try {
      const documentSigning = await this.documentSigningModel
        .findOne({ documentId: tradeDocumentId })
        .exec();

      if (!documentSigning) {
        return null;
      }

      return plainToInstance(DocumentSigningDetailsDto, {
        id: documentSigning._id.toString(),
        ...documentSigning.toObject(),
      });
    } catch (error) {
      this.logger.error(
        `Error finding document signing by id ${tradeDocumentId}:`,
        error,
      );
      throw error;
    }
  }
}