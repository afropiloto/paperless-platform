import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShareLinkDto {
  @ApiProperty({
    description: 'Optional expiry date for the share link',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  expiresAt?: Date;

  @ApiProperty({
    description: 'List of email addresses that are allowed to access this link',
    required: false,
    type: [String],
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  allowedEmails?: string[];
}

export class AccessHistoryEntryDto {
  @ApiProperty({ description: 'Email address that accessed the link' })
  @Expose()
  @IsString()
  email: string;

  @ApiProperty({ description: 'When the link was accessed' })
  @Expose()
  @IsDate()
  accessedAt: Date;
}

// Internal DTO for repository layer - includes all schema fields
export class ShareLinkDto {
  @Expose()
  @IsString()
  linkId: string;

  @Expose()
  @IsString()
  accountId: string;

  @Expose()
  @IsString()
  documentId: string;

  @Expose()
  @IsString()
  encryptedData: string;

  @Expose()
  @IsString()
  iv: string;

  @Expose()
  @IsString()
  salt: string;

  @Expose()
  isExpired: boolean;

  @Expose()
  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @Expose()
  @IsArray()
  allowedEmails: string[];

  @Expose()
  @IsString()
  createdBy: string;

  @Expose()
  @IsNumber()
  accessCount: number;

  @Expose()
  @IsOptional()
  @IsDate()
  lastAccessedAt?: Date;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessHistoryEntryDto)
  accessHistory: AccessHistoryEntryDto[];

  @Expose()
  @IsDate()
  createdAt: Date;

  @Expose()
  @IsDate()
  updatedAt: Date;
}

export class ShareLinkResponseDto {
  @ApiProperty({ description: 'The secure share link ID' })
  @Expose()
  @IsString()
  linkId: string;

  @ApiProperty({ description: 'When the link expires (if set)' })
  @Expose()
  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({ description: 'List of allowed email addresses (if set)' })
  @Expose()
  @IsOptional()
  @IsArray()
  allowedEmails?: string[];

  @ApiProperty({ description: 'When the link was created' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Total number of times the link has been accessed' })
  @Expose()
  @IsNumber()
  accessCount: number;

  @ApiProperty({ description: 'When the link was last accessed' })
  @Expose()
  @IsOptional()
  @IsDate()
  lastAccessedAt?: Date;

  @ApiProperty({ description: 'History of email addresses that have accessed the link' })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessHistoryEntryDto)
  accessHistory: AccessHistoryEntryDto[];
}

export class AccessShareLinkDto {
  @ApiProperty({
    description: 'Email address of the person accessing the link (required if email restrictions are set)',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;
} 