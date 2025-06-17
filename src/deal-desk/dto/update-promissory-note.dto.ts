import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { PromissoryNoteState } from './deal-processing-response.dto';

export class UpdatePromissoryNoteDto {
  @ApiProperty({
    description: 'Content of the promissory note',
    example: { /* promissory note content */ },
    required: false
  })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiProperty({
    description: 'Status of the promissory note',
    enum: PromissoryNoteState,
    example: PromissoryNoteState.IN_PROGRESS,
    required: false
  })
  @IsOptional()
  @IsEnum(PromissoryNoteState)
  status?: PromissoryNoteState;
} 