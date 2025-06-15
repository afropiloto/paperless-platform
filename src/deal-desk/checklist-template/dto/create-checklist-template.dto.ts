import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChecklistItemDto {
  @ApiProperty({ description: 'The item text' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Optional guidance for the item', required: false })
  @IsString()
  @IsOptional()
  guidance?: string;
}

export class CreateChecklistSectionDto {
  @ApiProperty({ description: 'Title of the section' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Optional guidance for the section', required: false })
  @IsString()
  @IsOptional()
  guidance?: string;

  @ApiProperty({ description: 'List of items in the section', type: [CreateChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items: CreateChecklistItemDto[];
}

export class CreateChecklistTemplateDto {
  @ApiProperty({ description: 'Name of the template' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Optional description for the template', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'List of sections in the template', type: [CreateChecklistSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistSectionDto)
  sections: CreateChecklistSectionDto[];
} 