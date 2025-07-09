import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createCipher, createDecipher, scryptSync } from 'crypto';
import { ShareLinksRepository } from './share-links.repository';
import { CreateShareLinkDto, ShareLinkResponseDto } from './dtos/share-link.dto';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ShareLinksService {
  private readonly logger = new Logger(ShareLinksService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32;

  constructor(
    private readonly shareLinksRepository: ShareLinksRepository,
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly auditService: AuditService,
  ) {}

  async createShareLink(
    accountId: string,
    documentId: string,
    createShareLinkDto: CreateShareLinkDto,
    createdBy: string,
  ): Promise<ShareLinkResponseDto> {
    // Verify the document exists and user has access
    await this.tradeDocumentsService.getDocumentById(accountId, documentId);

    // Generate a secure random link ID
    const linkId = this.generateSecureLinkId();

    // Create the data to encrypt
    const dataToEncrypt = {
      accountId,
      documentId,
      expiresAt: createShareLinkDto.expiresAt,
      allowedEmails: createShareLinkDto.allowedEmails || [],
    };

    // Encrypt the data
    const { encryptedData, iv, salt } = this.encryptData(
      JSON.stringify(dataToEncrypt),
    );

    // Create the share link
    const shareLink = await this.shareLinksRepository.createShareLink({
      linkId,
      accountId,
      documentId,
      encryptedData,
      iv,
      salt,
      expiresAt: createShareLinkDto.expiresAt,
      allowedEmails: createShareLinkDto.allowedEmails || [],
      createdBy,
      isExpired: false,
    });

    // Log the audit event
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.SHARE_LINK_CREATED,
      identifier: documentId,
      accountId,
      details: {
        linkId,
        expiresAt: createShareLinkDto.expiresAt,
        hasEmailRestrictions: (createShareLinkDto.allowedEmails?.length || 0) > 0,
      },
    });

    return plainToInstance(ShareLinkResponseDto, {
      linkId: shareLink.linkId,
      expiresAt: shareLink.expiresAt,
      allowedEmails: shareLink.allowedEmails,
      createdAt: (shareLink as any).createdAt,
    });
  }

  async accessShareLink(
    linkId: string,
    email?: string,
  ): Promise<any> {
    // Find the share link
    const shareLink = await this.shareLinksRepository.findByLinkId(linkId);
    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    // Check if link is expired
    if (shareLink.isExpired) {
      throw new UnauthorizedException('Share link has expired');
    }

    // Check if link has expired based on expiresAt
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      await this.shareLinksRepository.markAsExpired(linkId);
      throw new UnauthorizedException('Share link has expired');
    }

    // Check email restrictions
    if (shareLink.allowedEmails && shareLink.allowedEmails.length > 0) {
      if (!email) {
        throw new BadRequestException(
          'Email address is required to access this link',
        );
      }

      if (!shareLink.allowedEmails.includes(email.toLowerCase())) {
        throw new UnauthorizedException(
          'Your email address is not authorized to access this link',
        );
      }
    }

    // Decrypt the data
    const decryptedData = this.decryptData(
      shareLink.encryptedData,
      shareLink.iv,
      shareLink.salt,
    );

    const { accountId, documentId } = JSON.parse(decryptedData);

    // Update access count
    await this.shareLinksRepository.updateAccessCount(linkId);

    // Get the document
    const document = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
    );

    // Log the audit event
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.SHARE_LINK_ACCESSED,
      identifier: documentId,
      accountId,
      details: {
        linkId,
        accessedByEmail: email,
        accessCount: shareLink.accessCount + 1,
      },
    });

    return document;
  }

  async deleteShareLink(linkId: string, accountId: string): Promise<void> {
    const shareLink = await this.shareLinksRepository.findByLinkId(linkId);
    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.accountId !== accountId) {
      throw new UnauthorizedException('Not authorized to delete this share link');
    }

    await this.shareLinksRepository.deleteShareLink(linkId);

    // Log the audit event
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.SHARE_LINK_DELETED,
      identifier: shareLink.documentId,
      accountId,
      details: {
        linkId,
      },
    });
  }

  async getShareLinksForDocument(
    accountId: string,
    documentId: string,
  ): Promise<ShareLinkResponseDto[]> {
    const shareLinks = await this.shareLinksRepository.findByAccountAndDocument(
      accountId,
      documentId,
    );

    return shareLinks.map((link) =>
      plainToInstance(ShareLinkResponseDto, {
        linkId: link.linkId,
        expiresAt: link.expiresAt,
        allowedEmails: link.allowedEmails,
        createdAt: (link as any).createdAt,
      }),
    );
  }

  private generateSecureLinkId(): string {
    // Generate a cryptographically secure random string
    const bytes = randomBytes(32);
    return bytes.toString('base64url');
  }

  private encryptData(data: string): {
    encryptedData: string;
    iv: string;
    salt: string;
  } {
    const salt = randomBytes(16).toString('hex');
    const key = scryptSync(process.env.SHARE_LINK_SECRET || 'default-secret', salt, this.keyLength);
    const iv = randomBytes(16);
    const cipher = createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      salt,
    };
  }

  private decryptData(
    encryptedData: string,
    iv: string,
    salt: string,
  ): string {
    const key = scryptSync(process.env.SHARE_LINK_SECRET || 'default-secret', salt, this.keyLength);
    const decipher = createDecipher(this.algorithm, key);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
} 