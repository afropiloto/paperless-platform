import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChecklistQuestionResponseDto {
  @ApiProperty({ description: 'Unique identifier for the question' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The question text' })
  @Expose()
  question: string;

  @ApiProperty({ description: 'Optional description for the question', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Type of question' })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Optional array of options for multiple-choice questions', required: false })
  @Expose()
  options?: string[];

  @Exclude()
  sectionId: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}

export class ChecklistSectionResponseDto {
  @ApiProperty({ description: 'Unique identifier for the section' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Title of the section' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Optional description for the section', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'List of questions in the section', type: [ChecklistQuestionResponseDto] })
  @Expose()
  @Type(() => ChecklistQuestionResponseDto)
  questions: ChecklistQuestionResponseDto[];

  @Exclude()
  templateId: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}

export class ChecklistTemplateResponseDto {
  @ApiProperty({ description: 'Unique identifier for the template' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name of the template' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Optional description for the template', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Version number of the template' })
  @Expose()
  version: number;

  @ApiProperty({ description: 'List of sections in the template', type: [ChecklistSectionResponseDto] })
  @Expose()
  @Type(() => ChecklistSectionResponseDto)
  sections: ChecklistSectionResponseDto[];

  @Exclude()
  isActive: boolean;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
} 