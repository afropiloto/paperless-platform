import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class ForcedPasswordResetDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPass123!'
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password that meets security requirements',
    example: 'NewSecurePass456!'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class ForcedPasswordResetResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
