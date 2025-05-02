import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GeneralResponseDto {
  @ApiProperty({ description: 'Success Indicator' })
  @Expose()
  success: boolean;

  @ApiProperty({ description: 'Response Message' })
  @Expose()
  message?: string;
}