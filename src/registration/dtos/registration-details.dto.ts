import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { RegistrationDocumentType } from '../enums/document-type.enum';
import { RegistrationDocumentStatus, RegistrationStatus } from '../enums/registration-status.enum';
import { IS_ETHEREUM_ADDRESS, IsEmail, IsEthereumAddress, IsString, ValidateNested } from 'class-validator';


export class RegistrationAddressDto {
  @ApiProperty({description: 'Building Number and Street address for company address'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  street: string;
  @ApiProperty({description: 'City for company address'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  city:  string;
  @ApiProperty({description: 'County, state or provence for company address'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  state:  string;
  @ApiProperty({description: 'Postal code for company address'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  postalCode:  string;
  @ApiProperty({description: 'Country for company address'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  country:  string;
}

export class RegistrationContactDetailsDto {
  @ApiProperty({description: 'The name of the Primary Account Holder for the company being registered'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  name: string;

  @ApiProperty({description: 'The Position or Job Title of the Account Holder for the company being registered'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  position: string;

  @ApiProperty({description: 'The contact phone number of the Primary Account Holder for the company being registered'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  phone: string;

  @ApiProperty({description: 'The contact email address of the Primary Account Holder for the company being registered'})
  @IsString()
  @IsEmail()
  @Transform(({value}) => value.trim().toLowerCase())
  @Expose()
  email: string;
}

export class RegistrationCompanyDetailsDto {
  @ApiProperty({description: 'The registered name of the company being registered'})
  @IsString()
  @Transform(({value}) => value.trim())
  @Expose()
  name: string;

  @ApiProperty({description: 'The registered address of the company being registered'})
  @Type(() => RegistrationAddressDto)
  @ValidateNested()
  @Expose()
  address: RegistrationAddressDto

  @ApiProperty({description: 'The website of the company being registered'})
  @IsString()
  @Transform(({value}) => value.trim().toLowerCase())
  @Expose()
  website: string;


  @ApiProperty({description: 'The Wallet Address to be associated with the company being registered'})
  @IsEthereumAddress()
  @Expose()
  accountWalletAddress: string;

}

export class RegistrationDocumentDto {
  @ApiProperty({ description: 'File name for  Registration Document' })
  @Expose()
  originalFilename: string;

  @ApiProperty({ description: 'Detected Mime Type for the document' })
  @Expose()
  mimeType: string;

  @ApiProperty({ description: 'File Size' })
  @Expose()
  size: number;

  @ApiProperty({ description: 'Type of Registration Document' })
  @Expose()
  documentType: RegistrationDocumentType;

  @ApiProperty({ description: 'Current Status of the Document' })
  @Expose()
  status: RegistrationDocumentStatus;

  @ApiProperty({ description: 'Date the Registration Document was uploaded' })
  @Expose()
  createdAt: Date;
}

export class RegistrationDetailsDto {
  @ApiProperty({description: 'The registration id'})
  @Expose()
  registrationId: string

  @ApiProperty({description: 'The Company Details for the company being registered'})
  @Type(() => RegistrationCompanyDetailsDto)
  @Expose()
  company: RegistrationCompanyDetailsDto


  @ApiProperty({description: 'The primary account holder for the company being registered'})
  @Type(() => RegistrationContactDetailsDto)
  @Expose()
  contact: RegistrationContactDetailsDto

  @ApiProperty({description: 'Current status of the Registration' })
  @Expose()
  status: RegistrationStatus;

  @ApiProperty({ description: 'List of documents uploaded to support the registration' })
  @Expose()
  @Type(() =>RegistrationDocumentDto) // Needed to ensure the nested objects are correctly mapped
  documents: RegistrationDocumentDto[];

  @ApiProperty({ description: 'Date the Registration was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date the Registration was last updated' })
  @Expose()
  updatedAt: Date;
}