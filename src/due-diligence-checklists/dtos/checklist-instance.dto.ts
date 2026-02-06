import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DueDiligenceChecklistType, CheckType } from '../types/due-diligence-checklists.types';

@Exclude()
export class NoteDto {
  @ApiProperty({
    description: 'The note text',
    example: 'Documentation verified and approved'
  })
  @Expose()
  note: string;

  @ApiProperty({
    description: 'ID of the user who added the note',
    example: 'user123'
  })
  @Expose()
  user: string;

  @ApiProperty({
    description: 'When the note was created',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  createdAt: Date;
}

@Exclude()
export class ChecklistItemInstanceDto {
  @ApiProperty({
    description: 'Title of the checklist item',
    example: 'Verify company registration'
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Current status of the checklist item',
    enum: ['Not Started', 'In Progress', 'Adverse', 'Satisfactory', 'Critical'],
    example: 'Satisfactory'
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Type of checklist item (manual or automated)',
    enum: Object.values(CheckType),
    example: CheckType.MANUAL
  })
  @Expose()
  checkType: CheckType;

  @ApiProperty({
    description: 'Notes added to this checklist item',
    type: [NoteDto]
  })
  @Expose()
  @Type(() => NoteDto)
  notes: NoteDto[];
}

@Exclude()
export class SectionInstanceDto {
  @ApiProperty({
    description: 'Title of the section',
    example: 'Company Verification'
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Checklist items in this section',
    type: [ChecklistItemInstanceDto]
  })
  @Expose()
  @Type(() => ChecklistItemInstanceDto)
  items: ChecklistItemInstanceDto[];
}

export class ChecklistInstanceDto {
  @ApiProperty({description: "Unique id of for this checklist instance"})
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  _id: string;

  @ApiProperty({ description: 'Type of checklist', enum: Object.values(DueDiligenceChecklistType) })
  @Expose()
  type: DueDiligenceChecklistType;

  @ApiProperty({description: "Version number of the checklist instance"})
  @Expose()
  version: number;

  @ApiProperty({
    description: 'Due diligence checklist sections',
    type: [SectionInstanceDto]
  })
  @Expose()
  @Type(() => SectionInstanceDto)
  sections: SectionInstanceDto[];

  @ApiProperty({description: "Date the checklist instance was created"})
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({description: "Date the checklist instance was last updated"})
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

}