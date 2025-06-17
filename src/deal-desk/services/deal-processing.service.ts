import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DealProcessingRepository } from '../repositories/deal-processing.repository';
import { DealProcessing } from '../schemas/deal-processing.schema';
import { ChecklistItemUpdateDto } from '../dto/update-checklist.dto';
import { CreateDealProcessingDto } from '../dto/create-deal-processing.dto';
import { Types } from 'mongoose';
import { DueDiligenceChecklistRepository } from '../repositories/due-diligence-checklist.repository';
import { ChecklistItemStatus, DealProcessingStatus, FundingDecisionType } from '../types/deal-desk.types';
import { UpdatePromissoryNoteDto } from '../dto/update-promissory-note.dto';
import { PromissoryNoteState } from '../dto/deal-processing-response.dto';
import { PromissoryNotePdfService } from './promissory-note-pdf.service';
import { FILE_STORAGE_SERVICE } from '../../file-storage/file-storage.constants';
import { FileStorageService } from '../../file-storage/file-storage.interface';
import { TradeDocumentFileStatus } from '../../common/types/trade-document.types';
import { DealPromissoryNoteDto } from '../dto/deal-processing-response.dto';
import { DealAnalyticsDto } from '../dto/deal-analytics.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DealProcessingService {
  private readonly logger = new Logger(DealProcessingService.name);

  constructor(
    private readonly dealProcessingRepository: DealProcessingRepository,
    private readonly dueDiligenceChecklistRepository: DueDiligenceChecklistRepository,
    private readonly promissoryNotePdfService: PromissoryNotePdfService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
  ) {}

  async createDealProcessing(
    createDto: CreateDealProcessingDto,
  ): Promise<DealProcessing> {
    // Get the latest due diligence checklist
    const latestChecklist =
      await this.dueDiligenceChecklistRepository.getLatest();
    if (!latestChecklist) {
      throw new NotFoundException('No due diligence checklist found');
    }

    // Create a new deal processing record with the checklist details

    const dealProcessingData = {
      dealId: new Types.ObjectId(createDto.dealId),
      accountId: new Types.ObjectId(createDto.accountId),
      status: DealProcessingStatus.NEW,
      dueDiligenceChecklistVersion: latestChecklist.version,
      dueDiligenceChecks: latestChecklist.sections.map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          title: item.title,
          status: ChecklistItemStatus.NOT_STARTED,
          notes: [],
        })),
      })),
      fundingDecision: {
        decision: FundingDecisionType.PENDING,

      },
    };

    return await this.dealProcessingRepository.create(
      dealProcessingData as DealProcessing,
    );
  }

  async getDealProcessing(id: string): Promise<DealProcessing> {
    try {
      const results = await this.dealProcessingRepository.findById(id);
      this.logger.debug({ results });
      return results;
    } catch (error) {
      this.logger.error(
        `Failed to get deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDealProcessingList(): Promise<DealProcessing[]> {
    try {
      return await this.dealProcessingRepository.findAll();
    } catch (error) {
      this.logger.error('Failed to get deal processing list:', error.message);
      throw error;
    }
  }

  async  updateFundingDecision(
    id: string,
    decision: FundingDecisionType,
    note: string,
    user: string,
  ): Promise<DealProcessing> {
    this.logger.debug({decision, note, user})
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

  async updateChecklist(
    id: string,
    updates: ChecklistItemUpdateDto[],
  ): Promise<DealProcessing> {
    try {
      const dealProcessing = await this.dealProcessingRepository.findById(id);
      let updatedDealProcessing = dealProcessing;

      for (const update of updates) {
        // Find the section and item indices
        const sectionIndex = dealProcessing.dueDiligenceChecks.findIndex(
          (section) => section.title === update.sectionTitle,
        );
        if (sectionIndex === -1) {
          throw new NotFoundException(
            `Section with title "${update.sectionTitle}" not found`,
          );
        }

        const itemIndex = dealProcessing.dueDiligenceChecks[
          sectionIndex
        ].items.findIndex((item) => item.title === update.itemTitle);
        if (itemIndex === -1) {
          throw new NotFoundException(
            `Item with title "${update.itemTitle}" not found in section "${update.sectionTitle}"`,
          );
        }

        // Update status if provided
        if (update.status) {
          updatedDealProcessing =
            await this.dealProcessingRepository.updateChecklistItemStatus(
              id,
              sectionIndex,
              itemIndex,
              update.status,
            );
        }

        // Add note if provided
        if (update.notes && update.notes.length > 0) {
          for (const note of update.notes) {
            updatedDealProcessing = await this.dealProcessingRepository.addNote(
              id,
              sectionIndex,
              itemIndex,
              note.text,
              note.userId,
            );
          }
        }
      }

      return updatedDealProcessing;
    } catch (error) {
      this.logger.error(
        `Failed to update checklist for deal ${id}: ${error.message}`,
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
        : updateDto.status ?? existingDeal.promissoryNote.status;

      this.logger.debug({id, content, status})
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

  async issuePromissoryNote(id: string) {
    try {
      // Retrieve the stored Promissory Note details
      const dealProcessingDetails = await this.dealProcessingRepository.findById(id);
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
        issueDate: new Date(dealProcessingDetails.promissoryNote.content.issueDate),
        maturityDate: new Date(dealProcessingDetails.promissoryNote.content.maturityDate),
        interestRate: dealProcessingDetails.promissoryNote.content.interestRate,
        paymentTerms: dealProcessingDetails.promissoryNote.content.paymentTerms,
        specialConditions: dealProcessingDetails.promissoryNote.content.specialConditions,
        createdAt: new Date(dealProcessingDetails.promissoryNote.content.createdAt),
        updatedAt: new Date(dealProcessingDetails.promissoryNote.content.updatedAt),
        signatures: dealProcessingDetails.promissoryNote.content.signatures
      };

      // Generate the Promissory Note PDF
      const pdfBuffer = await this.promissoryNotePdfService.generatePromissoryNotePdf(promissoryNoteContent);

      // Store the Promissory Note in the storage
      const storedFileDetails = await this.fileStorageService.uploadFile(pdfBuffer, 'promissoryNote.pdf', "application/pdf");

      // Create the issued file details
      const issuedFile = {
        storedFileName: storedFileDetails.storedFileName,
        storedFilePath: storedFileDetails.storedFilePath,
        originalFileName: 'promissoryNote.pdf',
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
        status: TradeDocumentFileStatus.COMPLETED
      };

      // Update the promissory note with file details and status
      const updatedDeal = await this.dealProcessingRepository.savePromissoryNoteDetails(
        id,
        promissoryNoteContent,
        PromissoryNoteState.ISSUED,
        issuedFile
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
      this.logger.debug({analytics})
      return plainToInstance(DealAnalyticsDto, analytics);
    } catch (error) {
      this.logger.error(`Failed to get deal analytics: ${error.message}`);
      throw error;
    }
  }
}