import { IsArray, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChecklistItemDto {
  @ApiProperty({
    description: 'Title of the checklist item',
    example: 'Verify company registration'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Guidance text for the checklist item',
    example: 'Check the company registration number in the official registry'
  })
  @IsString()
  @IsNotEmpty()
  guidance: string;
}

export class SectionDto {
  @ApiProperty({
    description: 'Title of the section',
    example: 'Company Verification'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({description: 'The position of the section in the template', example: 1})
  @IsNumber()
  @IsPositive()
  @IsInt()
  position: number;

  @ApiProperty({
    description: 'Guidance text for the section',
    example: 'Complete all company verification checks before proceeding'
  })
  @IsString()
  @IsNotEmpty()
  guidance: string;

  @ApiProperty({
    description: 'List of checklist items in this section',
    type: [ChecklistItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}

export class CreateChecklistDto {
  @ApiProperty({
    description: 'Version number of the checklist',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  version: number;

  @ApiProperty({
    description: 'List of sections in the checklist',
    type: [SectionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
} 