import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DealProcessingRepository } from './deal-processing.repository';
import { DealProcessing } from './schemas/deal-processing.schema';
import { ChecklistItemUpdateDto } from '../due-diligence-checklists/dtos/update-checklist.dto';
import { CreateDealProcessingDto, NewDealProcessing } from './dto/create-deal-processing.dto';
import { Types } from 'mongoose';
import {
  DealProcessingStatus,
  FundingDecisionType,
} from './types/deal-desk.types';
import { UpdatePromissoryNoteDto } from './dto/update-promissory-note.dto';
import {
  DealProcessingResponseDto,
  DealPromissoryNoteDto,
  PromissoryNoteState,
  DealProcessingSearchResultsDto,
} from './dto/deal-processing-response.dto';
import { PromissoryNotePdfService } from './promissory-note-pdf.service';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { TradeDocumentFileStatus } from '../common/types/trade-document.types';
import { DealAnalyticsDto } from './dto/deal-analytics.dto';
import { plainToInstance } from 'class-transformer';
import { DueDiligenceChecklistsService } from '../due-diligence-checklists/due-diligence-checklists.service';
import { DueDiligenceChecklistType } from '../due-diligence-checklists/types/due-diligence-checklists.types';
import { ChecklistInstanceDto } from '../due-diligence-checklists/dtos/checklist-instance.dto';

import { SearchQueryDto } from '../common/dtos/search.dto';

@Injectable()
export class DealProcessingService {
  private readonly logger = new Logger(DealProcessingService.name);

  constructor(
    private readonly dealProcessingRepository: DealProcessingRepository,
    private readonly dueDiligenceChecklistsService: DueDiligenceChecklistsService,
    private readonly promissoryNotePdfService: PromissoryNotePdfService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
  ) {}

  async createDealProcessing(
    createDto: CreateDealProcessingDto,
  ): Promise<DealProcessingResponseDto> {
    // Get the latest due diligence checklist

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

    const newDealProcessing =  await this.dealProcessingRepository.create(
      dealProcessingData,
    );
    newDealProcessing.dueDiligenceChecks = checklistInstance;
    return newDealProcessing;
  }

  async getDealProcessing(id: string): Promise<DealProcessingResponseDto> {
    try {
      const dealProcessing = await this.dealProcessingRepository.findById(id);
      this.logger.debug({dealProcessing});
      dealProcessing.dueDiligenceChecks =
        await this.dueDiligenceChecklistsService.getChecklistInstance(
          dealProcessing.dueDiligenceChecklistId,
        );
      return dealProcessing;
    } catch (error) {
      this.logger.error(
        `Failed to get deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDealProcessingList(searchParams?: SearchQueryDto): Promise<DealProcessingSearchResultsDto> {
    try {
      const results = await this.dealProcessingRepository.findAll(searchParams);
      this.logger.debug({results});
      return results;
    } catch (error) {
      this.logger.error('Failed to get deal processing list:', error.message);
      throw error;
    }
  }

  async updateFundingDecision(
    id: string,
    decision: FundingDecisionType,
    note: string,
    user: string,
  ): Promise<DealProcessing> {
    this.logger.debug({ decision, note, user });
    try {
      return await this.dealProcessingRepository.updateFundingDecision(
        id,
        decision,
        note,
        user,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update funding decision for deal ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async updatePromissoryNote(
    id: string,
    updateDto: UpdatePromissoryNoteDto,
  ): Promise<DealProcessing> {
    try {
      // Get existing deal processing to handle partial updates
      const existingDeal = await this.dealProcessingRepository.findById(id);
      if (!existingDeal) {
        throw new NotFoundException(`Deal processing with id ${id} not found`);
      }

      // Prepare the update data
      const content = updateDto.content ?? existingDeal.promissoryNote?.content;

      // If there's no existing promissory note or no status provided, default to IN_PROGRESS
      const status = !existingDeal.promissoryNote
        ? PromissoryNoteState.IN_PROGRESS
        : (updateDto.status ?? existingDeal.promissoryNote.status);

      this.logger.debug({ id, content, status });
      return await this.dealProcessingRepository.savePromissoryNoteDetails(
        id,
        content,
        status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update promissory note for deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  // ToDo: This needs to use the PromissoryNoteContentDto
  //  Also we need to create this as a Trade Document and then
  //  1. Issue the Prom Note as a Transferable Document
  //  2. Create a Deal Signing Event on chain
  //  3. Sign the document on behalf of Paiperless
  //  4. Create a Deal Signing record to track Deal Signing
  async issuePromissoryNote(id: string) {
    try {
      // Retrieve the stored Promissory Note details
      const dealProcessingDetails =
        await this.dealProcessingRepository.findById(id);
      if (!dealProcessingDetails) {
        throw new NotFoundException(`Deal processing with id ${id} not found`);
      }

      if (!dealProcessingDetails.promissoryNote?.content) {
        throw new Error('Promissory note content is not available');
      }

      // Structure the promissory note content according to DealPromissoryNoteDto
      const promissoryNoteContent: DealPromissoryNoteDto = {
        id: dealProcessingDetails._id.toString(),
        dealId: dealProcessingDetails.dealId.toString(),
        borrower: dealProcessingDetails.promissoryNote.content.borrower,
        lender: dealProcessingDetails.promissoryNote.content.lender,
        amount: dealProcessingDetails.promissoryNote.content.amount,
        currency: dealProcessingDetails.promissoryNote.content.currency,
        issueDate: new Date(
          dealProcessingDetails.promissoryNote.content.issueDate,
        ),
        maturityDate: new Date(
          dealProcessingDetails.promissoryNote.content.maturityDate,
        ),
        interestRate: dealProcessingDetails.promissoryNote.content.interestRate,
        paymentTerms: dealProcessingDetails.promissoryNote.content.paymentTerms,
        specialConditions:
          dealProcessingDetails.promissoryNote.content.specialConditions,
        createdAt: new Date(
          dealProcessingDetails.promissoryNote.content.createdAt,
        ),
        updatedAt: new Date(
          dealProcessingDetails.promissoryNote.content.updatedAt,
        ),
        signatures: dealProcessingDetails.promissoryNote.content.signatures,
      };

      // Generate the Promissory Note PDF
      const pdfBuffer =
        await this.promissoryNotePdfService.generatePromissoryNotePdf(
          promissoryNoteContent,
        );

      // Store the Promissory Note in the storage
      const storedFileDetails = await this.fileStorageService.uploadFile(
        pdfBuffer,
        'promissoryNote.pdf',
        'application/pdf',
      );

      // Create the issued file details
      const issuedFile = {
        storedFileName: storedFileDetails.storedFileName,
        storedFilePath: storedFileDetails.storedFilePath,
        originalFileName: 'promissoryNote.pdf',
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
        status: TradeDocumentFileStatus.COMPLETED,
      };

      // Update the promissory note with file details and status
      const updatedDeal =
        await this.dealProcessingRepository.savePromissoryNoteDetails(
          id,
          promissoryNoteContent,
          PromissoryNoteState.ISSUED,
          issuedFile,
        );

      return {
        dealProcessing: updatedDeal,
        pdfBuffer, // Return the PDF buffer for immediate download
      };
    } catch (error) {
      this.logger.error(
        `Failed to issue promissory note for deal ${id}: ${error.message}`,
      );
      throw error;
    }
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
      this.logger.debug({ analytics });
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
      if (!dealProcessing) {throw new NotFoundException("Deal Processing details not found")}
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
}