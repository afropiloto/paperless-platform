import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HealthCheckResponseDto {
  @ApiProperty({description: "API Service Status"})
  @Expose()
  status: string;
}