import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ChecklistItemResponseDto {
  @ApiProperty({
    description: 'Title of the checklist item',
    example: 'Verify company registration'
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Guidance text for the checklist item',
    example: 'Check the company registration number in the official registry'
  })
  @Expose()
  guidance: string;
}

@Exclude()
export class SectionResponseDto {
  @ApiProperty({
    description: 'Title of the section',
    example: 'Company Verification'
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Guidance text for the section',
    example: 'Complete all company verification checks before proceeding'
  })
  @Expose()
  guidance: string;

  @ApiProperty({
    description: 'List of checklist items in this section',
    type: [ChecklistItemResponseDto]
  })
  @Expose()
  @Type(() => ChecklistItemResponseDto)
  items: ChecklistItemResponseDto[];
}

@Exclude()
export class ChecklistResponseDto {
  @ApiProperty({
    description: "Unique id for checklist"
  })
  @Expose()
  _id: string;

  @ApiProperty({
    description: "The Checklist Type"
  })
  @Expose()
  checklistType: string;

  @ApiProperty({
    description: 'Version number of the checklist template',
    example: 1
  })
  @Expose()
  version: number;

  @ApiProperty({
    description: 'List of sections in the checklist',
    type: [SectionResponseDto]
  })
  @Expose()
  @Type(() => SectionResponseDto)
  sections: SectionResponseDto[];

  @ApiProperty({
    description: 'Creation timestamp of the checklist',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp of the checklist',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  updatedAt: Date;
} 