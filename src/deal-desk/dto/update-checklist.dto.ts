import { IsString, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CheckListItemStatus } from '../schemas/deal-processing.schema';

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
    enum: CheckListItemStatus,
    required: false,
    example: CheckListItemStatus.SATISFACTORY
  })
  @IsOptional()
  @IsEnum(CheckListItemStatus)
  status?: CheckListItemStatus;

  @ApiProperty({
    description: 'New note to add to the checklist item',
    type: NoteUpdateDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteUpdateDto)
  note?: NoteUpdateDto;
} 