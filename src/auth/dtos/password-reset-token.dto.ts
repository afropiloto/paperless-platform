import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform, Expose, Type } from 'class-transformer';

export class CreatePasswordResetTokenDto {
  @ApiProperty({ description: 'The reset token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'User ID associated with the token' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Token expiration date' })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  expiresAt: Date;
}

export class PasswordResetTokenDto {
  @ApiProperty({ description: 'The reset token' })
  @IsString()
  @IsNotEmpty()
  @Expose()
  token: string;

  @ApiProperty({ description: 'User ID associated with the token' })
  @IsString()
  @IsNotEmpty()
  @Expose()
  @Type(() => String)
  userId: string;

  @ApiProperty({ description: 'Token expiration date' })
  @IsDate()
  @Expose()
  expiresAt: Date;

  @ApiProperty({ description: 'Whether the token has been used' })
  @IsBoolean()
  @Expose()
  used: boolean;

  @ApiProperty({ description: 'When the token was used', required: false })
  @IsOptional()
  @IsDate()
  @Expose()
  usedAt?: Date;

  @ApiProperty({ description: 'Token creation date' })
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Token last update date' })
  @IsDate()
  @Expose()
  updatedAt: Date;
}

export class UpdatePasswordResetTokenDto {
  @ApiProperty({ description: 'Whether the token has been used' })
  @IsBoolean()
  used: boolean;

  @ApiProperty({ description: 'When the token was used', required: false })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  usedAt?: Date;
} 