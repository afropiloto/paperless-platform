import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentSigningRepository } from './document-signing.repository';
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
import { SearchQueryDto } from 'src/common/dtos/search.dto';
import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import { FlowProducer, Queue } from 'bullmq';
import {
  SIGN_DOCUMENT_EVENT,
  SIGN_DOCUMENT_ON_BEHALF_QUEUE,
} from '../constants/app.constants';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { TradeDocumentFileVariant } from '../trade-documents/trade-document-file.types';
import {
  CreateDocumentSigningEventJobData,
  SignDocumentOnBehalfJobData,
} from './types/signing-events.types';
import { getCreateMultiSignEventFlow } from '../common/event-flows/issue-event-flow';
import { GeneralResponseDto } from '../common/common-dto';

@Injectable()
export class DocumentSigningService {
  private readonly logger = new Logger(DocumentSigningService.name);

  constructor(
    private readonly documentSigningRepository: DocumentSigningRepository,
    private readonly tradeDocumentService: TradeDocumentsService,
    @InjectQueue(SIGN_DOCUMENT_ON_BEHALF_QUEUE)
    private signDocumentQueue: Queue,

    @InjectFlowProducer('create-signing-event')
    private createDocSigningEventFlowProducer: FlowProducer,
  ) {}

  async findById(id: string): Promise<DocumentSigningDetailsDto> {
    const documentSigning = await this.documentSigningRepository.findById(id);

    if (!documentSigning) {
      throw new NotFoundException(`Document signing with id ${id} not found`);
    }

    return documentSigning;
  }

  async findByWalletAddress(
    walletAddress: string,
    searchQuery: SearchQueryDto,
  ): Promise<DocumentSigningSearchResultsDto> {
    this.logger.log(
      `Finding document signings for wallet address: ${walletAddress}`,
    );

    return await this.documentSigningRepository.findByIdentifier(
      { walletAddress },
      searchQuery,
    );
  }

  async findExpiringSoonByWalletAddress(
    walletAddress: string,
    daysUntilExpiry: number = 7,
  ): Promise<DocumentSigningDetailsDto[]> {
    this.logger.log(
      `Finding expiring document signings for wallet address: ${walletAddress} within ${daysUntilExpiry} days`,
    );

    const results =
      await this.documentSigningRepository.findExpiringSoonByWalletAddress(
        walletAddress,
        daysUntilExpiry,
      );

    return results;
  }

  async updateLastKnownStatus(
    id: string,
    lastKnownStatus: DocumentSigningStatus,
  ): Promise<DocumentSigningDetailsDto> {
    this.logger.log(
      `Updating last known status for document signing ${id} to ${lastKnownStatus}`,
    );

    const updatedDocumentSigning =
      await this.documentSigningRepository.updateLastKnownStatus(
        id,
        lastKnownStatus,
      );

    if (!updatedDocumentSigning) {
      throw new NotFoundException(`Document signing with id ${id} not found`);
    }

    this.logger.log(
      `Successfully updated document signing ${id} status to ${lastKnownStatus}`,
    );

    return updatedDocumentSigning;
  }

  /**
   * Creates a document signing event. This stores a documentsigning record
   * @param creationDetails
   */
  async createDocumentSigningEvent(
    creationDetails: DocumentSigningCreationDetailsDto,
  ): Promise<GeneralResponseDto> {
    try {
      // Validate that the expiry date is in the future
      if (creationDetails.expiryDate <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }

      // Validate that there are parties to sign
      if (!creationDetails.parties || creationDetails.parties.length === 0) {
        throw new Error(
          'At least one party must be specified for document signing',
        );
      }

      // Validate that all parties have valid wallet addresses
      const invalidParties = creationDetails.parties.filter(
        (party) => !party.walletAddress,
      );
      if (invalidParties.length > 0) {
        throw new Error('All parties must have valid wallet addresses');
      }

      // Validate the document has an issued document
      const fileDetails =
        await this.tradeDocumentService.getTradeDocumentFileVariantDetails(
          creationDetails.accountId,
          creationDetails.documentId,
          TradeDocumentFileVariant.ISSUED,
        );

      if (!fileDetails || !fileDetails.storedFileName) {
        throw new Error(
          'The Trade Document has not been issued and so cannot be used for Signing',
        );
      }
      const signingJobData: CreateDocumentSigningEventJobData = {
        documentId: creationDetails.documentId,
        accountId: creationDetails.accountId,
        expiryDate: creationDetails.expiryDate,
        description: creationDetails.description,
        parties: creationDetails.parties.map((party) => {
          return {
            walletAddress: party.walletAddress,
            name: party.name,
            role: party.role,
          };
        }),
      };

      await this.createDocSigningEventFlowProducer.add(
        getCreateMultiSignEventFlow(signingJobData),
      );

      return {
        success: true,
        message: 'Document signing event is being created',
      } as GeneralResponseDto;
    } catch (error) {
      this.logger.error({
        message: 'Failed to create document signing event',
        error,
      });
      throw error;
    }
  }

  /**
   * Signs document on behalf of the Paiperless app.
   */
  async signDocumentOnBehalf(signingId: string) {
    // Check that signing details
    const signingDetails =
      await this.documentSigningRepository.findById(signingId);
    if (!signingDetails) {
      throw new Error('Signing Details not found');
    }
    if (
      [DocumentSigningStatus.SIGNED, DocumentSigningStatus.EXPIRED].includes(
        signingDetails.lastKnownStatus,
      )
    ) {
      throw new Error(
        `Unable to sign document as the status of the signing event is ${signingDetails.lastKnownStatus}`,
      );
    }
    if (signingDetails.lastKnownStatus === DocumentSigningStatus.PENDING) {
      throw new Error(
        'Unable to sign document, the Document Signing Event is not ready',
      );
    }

    // Attempt signing
    const jobData: SignDocumentOnBehalfJobData = {
      signingId: signingId,
    };
    const job = await this.signDocumentQueue.add(SIGN_DOCUMENT_EVENT, jobData);
    this.logger.log({
      message: 'Signing Document document on behalf of Paiperless',
      documentId: signingDetails.documentId,
      job: job,
    });
    return signingDetails;
  }

  /**
   * Updates a document signing details by ID
   */
  async updateById(signingId: string, updates: UpdateSigningDetailsDto) {
    return await this.documentSigningRepository.update(signingId, updates);
  }

  /**
   * Function to create a record in the documentsignings collection
   * @param creationDetails
   */
  async createDocumentSigningOffChainDetails(
    creationDetails: DocumentSigningCreationDetailsDto,
  ) {
    return await this.documentSigningRepository.create(creationDetails);
  }

  async findByTradeDocumentId(id: string): Promise<DocumentSigningDetailsDto> {

    const documentSigning =
      await this.documentSigningRepository.findByTradeDocumentId(id);

    if (!documentSigning) {
      throw new NotFoundException(
        `Document signing for trade document with id ${id} not found`,
      );
    }

    return documentSigning;
  }

  async findByIdentifier(
    searchParams: DocumentSigningFilterByParams,
    searchQuery: SearchQueryDto,
  ) {
    return await this.documentSigningRepository.findByIdentifier(
      searchParams,
      searchQuery,
    );
  }
}
