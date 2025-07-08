import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DealProcessingRepository } from './deal-processing.repository';
import { ChecklistItemUpdateDto } from '../due-diligence-checklists/dtos/update-checklist.dto';
import {
  CreateDealProcessingDto,
  NewDealProcessing,
} from './dto/create-deal-processing.dto';
import {
  DealProcessingStatus,
  FundingDecisionType,
} from './types/deal-desk.types';
import {
  DealProcessingResponseDto,
  DealProcessingSearchResultsDto,
} from './dto/deal-processing-response.dto';
import { PromissoryNotePdfService } from './promissory-note-pdf.service';
import { DealAnalyticsDto } from './dto/deal-analytics.dto';
import { plainToInstance } from 'class-transformer';
import { DueDiligenceChecklistsService } from '../due-diligence-checklists/due-diligence-checklists.service';
import { DueDiligenceChecklistType } from '../due-diligence-checklists/types/due-diligence-checklists.types';
import { ChecklistInstanceDto } from '../due-diligence-checklists/dtos/checklist-instance.dto';

import { SearchQueryDto } from '../common/dtos/search.dto';
import {
  PromissoryNoteContentDto,
  TradeDocumentClaimantsDto,
  UpsertTradeDocumentDto,
} from '../trade-documents/dtos/trade-document.dto';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import {
  FileData,
  TradeDocumentStatus,
  TradeDocumentType,
} from '../types/trade-documents.types';
import { TradeFinanceService } from '../trade-finance/trade-finance.service';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../accounts/accounts.service';
import { CompanyAddress } from '../accounts/schemas/account.schema';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { addDays } from '../utils/date-utils';
import {
  IssueTradeDocumentDetails,
  IssueTradeDocumentService,
} from '../issue-trade-document/issue-trade-document.service';
import { GeneralResponseDto } from '../common/common-dto';
import { DocumentSigningService } from '../document-signing/document-signing.service';

import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { DocumentSigningCreationDetailsDto } from '../document-signing/dtos/document-signing.dto';
import { DocumentSigningRole } from '../document-signing/types/document-signing.types';

@Injectable()
export class DealProcessingService {
  private readonly logger = new Logger(DealProcessingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly issueTradeDocumentService: IssueTradeDocumentService,
    private readonly documentSigningService: DocumentSigningService,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => TradeFinanceService))
    private readonly tradeFinanceService: TradeFinanceService,
    private readonly dealProcessingRepository: DealProcessingRepository,
    private readonly dueDiligenceChecklistsService: DueDiligenceChecklistsService,
    private readonly promissoryNotePdfService: PromissoryNotePdfService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
  ) {}

  /**
   * Creates a new Deal Processing Instance
   * @param createDto
   */
  async createDealProcessing(
    createDto: CreateDealProcessingDto,
  ): Promise<DealProcessingResponseDto> {
    // Create a new Due Diligence Checklist instance
    const checklistInstance =
      await this.dueDiligenceChecklistsService.createChecklistInstance(
        DueDiligenceChecklistType.DEAL_PROCESSING,
      );

    // Create a new deal processing record with the checklist details

    const dealProcessingData: NewDealProcessing = {
      dealId: createDto.dealId,
      accountId: createDto.accountId,
      status: DealProcessingStatus.NEW,
      dueDiligenceChecklistId: checklistInstance._id,
      fundingDecision: {
        decision: FundingDecisionType.PENDING,
      },
    };

    const newDealProcessing =
      await this.dealProcessingRepository.create(dealProcessingData);
    newDealProcessing.dueDiligenceChecks = checklistInstance;
    return newDealProcessing;
  }

  /**
   * Retrieves the current Deal Processing details
   * @param id Deal Processing ID
   */
  async getDealProcessing(id: string): Promise<DealProcessingResponseDto> {
    try {
      const dealProcessing = await this.dealProcessingRepository.findById(id);

      dealProcessing.dueDiligenceChecks =
        await this.dueDiligenceChecklistsService.getChecklistInstance(
          dealProcessing.dueDiligenceChecklistId,
        );

      if (dealProcessing.promissoryNote?.documentId) {
        const promNote = await this.tradeDocumentsService.getDocumentById(
          this.configService.get<string>('PAIPERLESS_ACCOUNT_ID'),
          dealProcessing.promissoryNote.documentId,
        );

        dealProcessing.promissoryNote.status = promNote.status;
        dealProcessing.promissoryNote.content =
          promNote.documentContent as PromissoryNoteContentDto;
        dealProcessing.promissoryNote.issuedFile = promNote.issuedFile;
        dealProcessing.createdAt = promNote.createdAt;
        dealProcessing.updatedAt = promNote.updatedAt;
      }

      return dealProcessing;
    } catch (error) {
      this.logger.error(
        `Failed to get deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDealProcessingList(
    searchParams?: SearchQueryDto,
  ): Promise<DealProcessingSearchResultsDto> {
    try {
      const results = await this.dealProcessingRepository.findAll(searchParams);
      return results;
    } catch (error) {
      this.logger.error('Failed to get deal processing list:', error.message);
      throw error;
    }
  }

  private getDealProcessingStatus(decision: FundingDecisionType) {
    switch (decision) {
      case FundingDecisionType.APPROVED:
        return DealProcessingStatus.AWAITING_AGREEMENT;
      case FundingDecisionType.DECLINED:
        return DealProcessingStatus.REJECTED;
      default:
        return DealProcessingStatus.IN_PROGRESS;
    }
  }

  private getDealDecision(decision: FundingDecisionType) {
    switch (decision.toString().toLowerCase()) {
      case 'approve':
      case 'approved':
        return FundingDecisionType.APPROVED;
      case 'decline':
      case 'declined':
        return FundingDecisionType.DECLINED;
      default:
        return FundingDecisionType.PENDING;
    }
  }

  async updateFundingDecision(
    dealProcessingId: string,
    decision: FundingDecisionType,
    note: string,
    user: string,
  ): Promise<DealProcessingResponseDto> {
    try {
      const currentDealState = (await this.getDealProcessing(dealProcessingId))
        .status;

      const dealDecision = this.getDealDecision(decision);
      const newDealStatus = this.getDealProcessingStatus(dealDecision);

      const updateResponse =
        await this.dealProcessingRepository.updateFundingDecision(
          dealProcessingId,
          dealDecision,
          note,
          user,
          newDealStatus,
        );

      if (
        newDealStatus !== currentDealState &&
        newDealStatus === DealProcessingStatus.AWAITING_AGREEMENT
      ) {
        // Create a Promissory Note for the deal
        return await this.createPromissoryNote(dealProcessingId);
      }

      return updateResponse;
    } catch (error) {
      this.logger.error(
        `Failed to update funding decision for deal ${dealProcessingId}: ${error.message}`,
      );
      throw error;
    }
  }

  async updatePromissoryNote(
    dealProcessingId: string,
    promissoryNoteContent: PromissoryNoteContentDto,
  ): Promise<DealProcessingResponseDto> {
    try {
      const dealProcessingDetails =
        await this.dealProcessingRepository.findById(dealProcessingId);
      if (!dealProcessingDetails) {
        throw new NotFoundException(
          `Deal processing with id ${dealProcessingId} not found`,
        );
      }

      if (!dealProcessingDetails.promissoryNote?.documentId) {
        throw new Error('Promissory note is not available');
      }

      // Make update to Promissory Note in tradedocuments collection
      const documentId = dealProcessingDetails.promissoryNote.documentId;
      const currentDocument = await this.tradeDocumentsService.getDocumentById(
        this.configService.get<string>('PAIPERLESS_ACCOUNT_ID'),
        documentId,
      );
      const updatedTradeDocument: UpsertTradeDocumentDto = {
        ...currentDocument,
        documentContent: promissoryNoteContent,
      };
      await this.tradeDocumentsService.updateTradeDocumentById(
        this.configService.get<string>('PAIPERLESS_ACCOUNT_ID'),
        documentId,
        updatedTradeDocument,
      );

      return this.getDealProcessing(dealProcessingId);
    } catch (error) {
      this.logger.error(
        `Failed to update promissory note for deal processing ${dealProcessingId}: ${error.message}`,
      );
      throw error;
    }
  }

  private computePromNoteDates(numDays: number) {
    const issueDate = new Date();
    const maturityDate = addDays(issueDate, numDays);
    return { issueDate, maturityDate };
  }

  private addressToString(companyAddress: CompanyAddress) {
    return `${companyAddress.street} ${companyAddress.city ? companyAddress.city : ''} ${companyAddress.state ? companyAddress.state : ''} ${companyAddress.postalCode ? companyAddress.postalCode : ''}`.trim();
  }

  /**
   * Creates a promissory note in the tradedocuments collection
   * and links this to the deal
   * @param dealProcessingId the deal ID
   */
  async createPromissoryNote(dealProcessingId: string) {
    // Retrieve the deal details
    const dealProcessingDetails =
      await this.dealProcessingRepository.findById(dealProcessingId);
    if (!dealProcessingDetails) {
      throw new NotFoundException(
        `Deal processing with id ${dealProcessingId} not found`,
      );
    }

    const dealDetails = await this.tradeFinanceService.getDealById(
      dealProcessingDetails.accountId,
      dealProcessingDetails.dealId,
    );
    if (!dealDetails) {
      throw new NotFoundException(
        `Deal details with id ${dealProcessingDetails.dealId} not found`,
      );
    }

    const paiperlessAccountId = this.configService.get<string>(
      'PAIPERLESS_ACCOUNT_ID',
    );
    const [paiperlessAccount, borrowerAccount] = await Promise.all([
      await this.accountsService.findByAccountId(paiperlessAccountId),
      await this.accountsService.findByAccountId(
        dealProcessingDetails.accountId,
      ),
    ]);

    if (!borrowerAccount || !paiperlessAccount) {
      throw new NotFoundException(
        `Unable to find account details for deal id:  ${dealProcessingDetails.dealId}`,
      );
    }

    // Create a new Trade Document that Prom Note
    const { issueDate, maturityDate } = this.computePromNoteDates(30);
    const promissoryNoteContent: PromissoryNoteContentDto = {
      noteReference: dealProcessingId,
      issueDate: issueDate,
      maturityDate: maturityDate,
      loanDetails: {
        amount: {
          value: dealDetails.loanDetails.loanAmount,
          currency: dealDetails.loanDetails.currency,
        },
        interestRate: 15.0,
        paymentTerms: '',
      },
      specialConditions: '',
      lender: {
        name: paiperlessAccount.accountName,
        address: this.addressToString(paiperlessAccount.company.address),
        country: paiperlessAccount.company.address.country,
        contactEmail: paiperlessAccount.contact.emailAddress,
      },
      borrower: {
        name: borrowerAccount.accountName,
        address: this.addressToString(borrowerAccount.company.address),
        country: borrowerAccount.company.address.country,
        contactEmail: borrowerAccount.contact.emailAddress,
      },
    };
    const claimants: TradeDocumentClaimantsDto = {
      beneficiary: {
        name: paiperlessAccount.accountName,
        walletAddress: paiperlessAccount.walletAddress,
        contactEmail: paiperlessAccount.contact.emailAddress,
      },
      owner: {
        name: paiperlessAccount.accountName,
        walletAddress: paiperlessAccount.walletAddress,
        contactEmail: paiperlessAccount.contact.emailAddress,
      },
    };
    const tradeDocument: UpsertTradeDocumentDto = {
      documentType: TradeDocumentType.PROMISSORY_NOTE,
      documentReference: dealDetails.dealReference,
      documentContent: promissoryNoteContent,
      claimants: claimants,
    };
    const tradeDocumentDetails =
      await this.tradeDocumentsService.createTradeDocument(
        paiperlessAccountId,
        tradeDocument,
      );

    // Store the documentId against the Deal Processing Record
    await this.dealProcessingRepository.savePromissoryNoteDetails(
      dealProcessingId,
      tradeDocumentDetails.id.toString(),
    );
    return this.getDealProcessing(dealProcessingId);
  }

  async downloadPromissoryNoteFile(filePath: string): Promise<Buffer> {
    try {
      return await this.fileStorageService.downloadFile(filePath);
    } catch (error) {
      this.logger.error(
        `Failed to download promissory note file from path ${filePath}: ${error.message}`,
      );
      throw new NotFoundException('Failed to download promissory note file');
    }
  }

  async getDealAnalytics(): Promise<DealAnalyticsDto> {
    try {
      const analytics = await this.dealProcessingRepository.getDealAnalytics();
      return plainToInstance(DealAnalyticsDto, analytics);
    } catch (error) {
      this.logger.error(`Failed to get deal analytics: ${error.message}`);
      throw error;
    }
  }

  async updateChecklist(
    id: string,
    updates: ChecklistItemUpdateDto[],
  ): Promise<ChecklistInstanceDto> {
    try {
      const dealProcessing = await this.dealProcessingRepository.findById(id);
      if (!dealProcessing) {
        throw new NotFoundException('Deal Processing details not found');
      }
      return await this.dueDiligenceChecklistsService.updateChecklistInstance(
        dealProcessing.dueDiligenceChecklistId,
        updates,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get update Deal Checklist: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Issues the current Promissory Note document
   * @param dealDeskId the DealDeskId
   */
  async issuePromissoryNote(dealDeskId: string) {
    const promNoteAccountId = this.configService.get<string>(
      'PAIPERLESS_ACCOUNT_ID',
    );
    try {
      const dealProcessingDetails =
        await this.dealProcessingRepository.findById(dealDeskId);
      if (!dealProcessingDetails) {
        throw new NotFoundException('Deal Processing details not found');
      }
      const issuerAccount =
        await this.accountsService.findByAccountId(promNoteAccountId);
      const borrowerAccount = await this.accountsService.findByAccountId(
        dealProcessingDetails.accountId,
      );
      if (
        dealProcessingDetails.status !==
          DealProcessingStatus.AWAITING_AGREEMENT ||
        dealProcessingDetails.fundingDecision?.decision !==
          FundingDecisionType.APPROVED
      ) {
        throw new BadRequestException(
          'The Deal is in the correct state to issue the Promissory Note',
        );
      }

      if (
        !dealProcessingDetails.promissoryNote ||
        !dealProcessingDetails.promissoryNote.documentId
      ) {
        throw new BadRequestException(
          'There is no Promissory Note attached to the Deal',
        );
      }

      const dealDetails = await this.tradeFinanceService.getDealById(dealProcessingDetails.accountId, dealProcessingDetails.dealId);

      const promNote = await this.tradeDocumentsService.getDocumentById(
        promNoteAccountId,
        dealProcessingDetails.promissoryNote.documentId,
      );
      if (!promNote || !promNote.status) {
        throw new BadRequestException(
          `The Promissory Note does not exist or is not in the correct status to issue`,
        );
      }

      if (promNote.status !== TradeDocumentStatus.IN_PROGRESS) {
        throw new BadRequestException(
          `The Prom Note cannot be issued while it has the status ${promNote.status}`,
        );
      }
      // Create the Prom Note file and upload
      const promNoteFileBuffer =
        await this.promissoryNotePdfService.generatePromissoryNotePdf(
          promNote.documentContent as PromissoryNoteContentDto,
        );
      const promNoteFileDetails: FileData = {
        originalname: `${promNote.documentReference}.pdf`,
        buffer: promNoteFileBuffer,
        mimetype: 'application/pdf',
        size: promNoteFileBuffer.byteLength,
      };
      await this.tradeDocumentsService.updateTradeDocumentFileById(
        promNoteAccountId,
        dealProcessingDetails.promissoryNote.documentId,
        promNoteFileDetails,
      );

      const issueDetails: IssueTradeDocumentDetails = {
        accountId: promNoteAccountId,
        documentId: dealProcessingDetails.promissoryNote.documentId,
      };

      const documentSigningDetails: DocumentSigningCreationDetailsDto = {
        documentId: dealProcessingDetails.promissoryNote.documentId,
        accountId: promNoteAccountId,
        description: `Promissory Note for Finance Deal. Your Account: ${dealProcessingDetails.accountName}. Your Reference: ${dealDetails.dealReference}. Our Reference: ${dealProcessingDetails.dealId}`,
        parties: [
          {
            name: issuerAccount.accountName,
            walletAddress: issuerAccount.walletAddress,
            role: DocumentSigningRole.ISSUER,
          },
          {
            name: borrowerAccount.accountName,
            walletAddress: borrowerAccount.walletAddress,
            role: DocumentSigningRole.SIGNER,
          },
        ],
        expiryDate: addDays(
          new Date(),
          this.configService.get<number>(
            'PROMISSORY_NOTE_SIGNING_EVENT_DURATION',
          ),
        ),
      };
      const issuedDocument =
        await this.issueTradeDocumentService.issueMultiSignTradeDocument(
          issueDetails,
          documentSigningDetails,
        );

      return plainToInstance(GeneralResponseDto, issuedDocument);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  // /**
  //  * Create Signing Event for a Deal Desk Promissory Note
  //  */
  // async createPromissoryNoteSigningEvent(dealDeskId: string) {
  //   const dealProcessingDetails =
  //     await this.dealProcessingRepository.findById(dealDeskId);
  //   if (!dealProcessingDetails) {
  //     throw new NotFoundException('Deal Processing details not found');
  //   }
  //   if (
  //     dealProcessingDetails.status !== DealProcessingStatus.IN_PROGRESS ||
  //     dealProcessingDetails.fundingDecision?.decision !==
  //       FundingDecisionType.APPROVED
  //   ) {
  //     throw new BadRequestException(
  //       'The Deal is in the correct state to issue the Promissory Note',
  //     );
  //   }
  //   if (
  //     !dealProcessingDetails.promissoryNote ||
  //     !dealProcessingDetails.promissoryNote.documentId
  //   ) {
  //     throw new BadRequestException(
  //       'The Promissory Note for the Deal is not ready for issue',
  //     );
  //   }
  //
  //   const promNote = await this.tradeDocumentsService.getDocumentById(
  //     dealProcessingDetails.accountId,
  //     dealProcessingDetails.promissoryNote.documentId,
  //   );
  //   if (
  //     !promNote ||
  //     !promNote.issuedFile ||
  //     promNote.status !== TradeDocumentStatus.ISSUED
  //   ) {
  //     throw new BadRequestException(
  //       'There is no Issued Promissory Note file for this deal',
  //     );
  //   }
  //
  //   const accountDetails = await this.accountsService.findByAccountId(
  //     dealProcessingDetails.accountId,
  //   );
  //
  //   const parties: SignerDetailsDto[] = [
  //     {
  //       name: 'Paiperless',
  //       role: DocumentSigningRole.ISSUER,
  //       walletAddress: this.configService.get<string>('ISSUER_WALLET'),
  //     },
  //     {
  //       name: accountDetails.company.name,
  //       role: DocumentSigningRole.SIGNER,
  //       walletAddress: accountDetails.walletAddress,
  //     },
  //   ];
  //   const signingDetails: DocumentSigningCreationDetailsDto = {
  //     documentId: dealProcessingDetails.promissoryNote.documentId,
  //     accountId: dealProcessingDetails.accountId,
  //     description: `Promissory Note for Approved Finance Deal: ${dealDeskId}`,
  //     expiryDate: addDays(new Date(), 5),
  //     parties: parties,
  //   };
  //   const signingEventDetails =
  //     await this.documentSigningService.createDocumentSigningEvent(
  //       signingDetails,
  //     );
  //
  //   // Update Deal Processing with signingDetailsID
  //   await this.dealProcessingRepository.setSigningDetails(
  //     dealDeskId,
  //     signingEventDetails.id,
  //     DealProcessingStatus.AWAITING_AGREEMENT,
  //   );
  //
  //   return plainToInstance(GeneralResponseDto, {
  //     success: true,
  //     message: 'Signing Event Creation in progress for Promissory Note',
  //   });
  // }

  /**
   * Signs the current Promissory Note on behalf of Paiperless
   * @param dealDeskId
   */
  // ToDo: This needs to have additional security checks to ensure the caller has the privileges to sign
  async signPromissoryNote(dealDeskId: string) {
    const dealProcessingDetails =
      await this.dealProcessingRepository.findById(dealDeskId);
    if (!dealProcessingDetails) {
      throw new NotFoundException('Deal Processing details not found');
    }
    if (
      dealProcessingDetails.status !== DealProcessingStatus.AWAITING_AGREEMENT
    ) {
      throw new BadRequestException(
        'The Deal is in the correct state to issue the Promissory Note',
      );
    }
    if (
      !dealProcessingDetails.promissoryNote ||
      !dealProcessingDetails.promissoryNote.documentId
    ) {
      throw new BadRequestException(
        'The Promissory Note for the Deal is not ready for issue',
      );
    }

    const promNote = await this.tradeDocumentsService.getDocumentById(
      dealProcessingDetails.accountId,
      dealProcessingDetails.promissoryNote.documentId,
    );
    if (!promNote || !promNote.issuedFile) {
      throw new BadRequestException(
        'There is no Issued Promissory Note file for this deal',
      );
    }
    if (promNote.status !== TradeDocumentStatus.ISSUED) {
      throw new BadRequestException(
        `The Prom Note cannot be signed while it has the status ${promNote.status}`,
      );
    }

    const issuedDocument =
      await this.documentSigningService.signDocumentOnBehalf(
        dealProcessingDetails.signingEventId,
      );

    return plainToInstance(GeneralResponseDto, issuedDocument);
  }

  async deleteDealProcessing(accountId: string, dealId: string) {
    return this.dealProcessingRepository.deleteDeal(accountId, dealId);
  }

  getDealProcessingByDealId(accountId: string, dealId: string) {
    return this.dealProcessingRepository.findByIDealId(accountId, dealId);
  }
}