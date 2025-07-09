import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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