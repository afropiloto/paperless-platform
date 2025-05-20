import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({description: 'SIWE Message that was signed'})
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({description: 'Signature hash'})
  @IsNotEmpty()
  @IsString()
  signature: string;
}
