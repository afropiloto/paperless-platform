import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PromissoryNoteContentDto } from '../../trade-documents/dtos/trade-document.dto';
import { Type } from 'class-transformer';

export class UpdateDealPromissoryNoteDto {
  @ApiProperty({
    description: 'Content of the promissory note',
    example: { /* promissory note content */ },
    required: false
  })
  @IsOptional()
  @Type(()=> PromissoryNoteContentDto)
  content?: PromissoryNoteContentDto;
} 