import { IsString, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ChecklistItemStatus } from 'src/deal-desk/types/deal-desk.types';
import { ChecklistUpdateOriginator } from '../types/due-diligence-checklists.types';


export class NoteUpdateDto {
  @ApiProperty({
    description: 'The note text',
    example: 'Documentation verified and approved'
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'ID of the user adding the note',
    example: 'user123'
  })
  @IsString()
  userId: string;
}

export class ChecklistItemUpdateDto {
  @ApiProperty({
    description: 'Title of the section containing the item',
    example: 'Company Verification'
  })
  @IsString()
  sectionTitle: string;

  @ApiProperty({
    description: 'Title of the checklist item to update',
    example: 'Verify company registration'
  })
  @IsString()
  itemTitle: string;

  @ApiProperty({
    description: 'New status for the checklist item',
    enum: ChecklistItemStatus,
    required: false,
    example: ChecklistItemStatus.SATISFACTORY
  })
  @IsOptional()
  @IsEnum(ChecklistItemStatus)
  status?: ChecklistItemStatus;

  @ApiProperty({
    description: 'New note to add to the checklist item',
    type: NoteUpdateDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteUpdateDto)
  notes?: NoteUpdateDto[];

  
} 