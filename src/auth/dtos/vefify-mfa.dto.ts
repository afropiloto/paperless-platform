import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { GeneralResponseDto } from '../../common/common-dto';

export class VerifyMfaDto extends GeneralResponseDto{
  @ApiProperty({ description: 'Access Token' })
  @IsString()
  @Expose()
  accessToken?: string;

  @ApiProperty({ description: 'Refresh Token' })
  @IsString()
  @Expose()
  refreshToken?: string;
}