import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ShareLinksService } from './share-links.service';
import {
  CreateShareLinkDto,
  ShareLinkResponseDto,
  AccessShareLinkDto,
} from './dtos/share-link.dto';
import { TradeDocumentDto } from '../trade-documents/dtos/trade-document.dto';
import { GeneralResponseDto } from '../common/common-dto';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { TradeDocumentFileVariant } from '../trade-documents/trade-document-file.types';

@ApiTags('Share Links')
@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Post(':accountId/:documentId')
  @ApiOperation({
    summary: 'Creates a secure share link for a trade document',
    description:
      'Generates a secure, non-predictable link ID that can be shared to access a trade document. Optionally specify expiry date and allowed email addresses.',
  })
  @ApiResponse({
    status: 201,
    description: 'Share link created successfully',
    type: ShareLinkResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade document not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this document',
  })
  async createShareLink(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
    @Body() createShareLinkDto: CreateShareLinkDto,
  ): Promise<ShareLinkResponseDto> {
    // TODO: Get the actual user ID from the authenticated context
    const createdBy = 'system'; // This should come from auth context

    return await this.shareLinksService.createShareLink(
      accountId,
      documentId,
      createShareLinkDto,
      createdBy,
    );
  }

  @Get('access/:linkId')
  @ApiOperation({
    summary: 'Access a trade document via a share link',
    description:
      'Retrieves a trade document using a share link ID. Validates expiry and email restrictions if set.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade document retrieved successfully',
    type: TradeDocumentDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email required for restricted access',
  })
  @ApiResponse({
    status: 401,
    description: 'Share link expired or unauthorized email',
  })
  @ApiResponse({
    status: 404,
    description: 'Share link not found',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Email address (required if link has email restrictions)',
  })
  async accessShareLink(
    @Param('linkId') linkId: string,
    @Query() accessDto: AccessShareLinkDto,
  ): Promise<TradeDocumentDto> {
    return await this.shareLinksService.accessShareLink(
      linkId,
      accessDto.email,
    );
  }

  @Get('access/:linkId/files/:variant')
  @ApiOperation({
    summary: 'Download a trade document file via a share link',
    description:
      'Downloads a specific file variant (ORIGINAL, ISSUED, TRADE_TRUST) of a trade document using a share link ID. Validates expiry and email restrictions if set.',
  })
  @ApiResponse({
    status: 200,
    description: 'File streamed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Email required for restricted access',
  })
  @ApiResponse({
    status: 401,
    description: 'Share link expired or unauthorized email',
  })
  @ApiResponse({
    status: 404,
    description: 'Share link or file not found',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Email address (required if link has email restrictions)',
  })
  async accessShareLinkFile(
    @Param('linkId') linkId: string,
    @Param('variant') variant: TradeDocumentFileVariant,
    @Query() accessDto: AccessShareLinkDto,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, headers } = await this.shareLinksService.accessShareLinkFile(
      linkId,
      variant,
      accessDto.email,
    );
    
    res.set(headers);
    return stream.pipe(res);
  }

  @Delete(':linkId')
  @ApiOperation({
    summary: 'Delete a share link',
    description: 'Deletes a share link. Only the account owner can delete their share links.',
  })
  @ApiResponse({
    status: 200,
    description: 'Share link deleted successfully',
    type: GeneralResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to delete this share link',
  })
  @ApiResponse({
    status: 404,
    description: 'Share link not found',
  })
  async deleteShareLink(
    @Param('linkId') linkId: string,
  ): Promise<GeneralResponseDto> {
    // TODO: Get the actual account ID from the authenticated context
    const accountId = 'system'; // This should come from auth context

    await this.shareLinksService.deleteShareLink(linkId, accountId);

    return plainToInstance(GeneralResponseDto, {
      success: true,
      message: 'Share link deleted successfully',
    });
  }

  @Get(':documentId')
  @ApiOperation({
    summary: 'Get all share links for a document',
    description: 'Retrieves all active share links for a specific trade document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Share links retrieved successfully',
    type: [ShareLinkResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this document',
  })
  async getShareLinksForDocument(
    @Param('documentId') documentId: string,
  ): Promise<ShareLinkResponseDto[]> {
    return await this.shareLinksService.getShareLinksForDocument(
      documentId,
    );
  }

  @Get(':linkId/details')
  @ApiOperation({
    summary: 'Get detailed information about a share link',
    description: 'Retrieves detailed information about a specific share link including access history.',
  })
  @ApiResponse({
    status: 200,
    description: 'Share link details retrieved successfully',
    type: ShareLinkResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Share link not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this share link',
  })
  async getShareLinkDetails(
    @Param('linkId') linkId: string,
  ): Promise<ShareLinkResponseDto> {
    return await this.shareLinksService.getShareLinkDetails(linkId);
  }
} 