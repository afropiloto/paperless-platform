import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RegistrationCompanyDetailsDto, RegistrationContactDetailsDto } from './registration-details.dto';
import { IsString, ValidateNested } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';



export class CreateRegistrationDto {
  constructor() {
    this.registrationId = uuidv4()
  }

  @ApiProperty({ description: 'The unique id for the registration' })
  @IsString()
  readonly registrationId: string;

  @ApiProperty({description: 'The Company Details for the company being registered'})
  @ValidateNested()
  @Type(() => RegistrationCompanyDetailsDto)
  company: RegistrationCompanyDetailsDto

  @ApiProperty({description: 'The primary account holder for the company being registered'})
  @ValidateNested()
  @Type(() => RegistrationContactDetailsDto)
  contact: RegistrationContactDetailsDto
}