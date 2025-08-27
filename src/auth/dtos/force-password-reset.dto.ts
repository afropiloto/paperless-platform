import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class ForcePasswordResetDto {
  @ApiProperty({
    description: 'Email address of the user to force password reset for',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Optional reason for forcing the password reset',
    required: false,
    example: 'Security policy compliance'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Whether to send an email notification to the user',
    required: false,
    default: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class ForcePasswordResetResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
