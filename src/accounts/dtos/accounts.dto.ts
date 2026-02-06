import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsEthereumAddress, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccountStatus } from '../types/account.types';
import { ApplicationModule } from '../../account-users/schemas';


export class CompanyAddressDto {
  @ApiProperty({description: 'Street address for company'})
  @IsString()
  @Expose()
  street: string;

  @ApiProperty({description: 'City of registration for company'})
  @IsString()
  @Expose()
  city:string;

  @ApiProperty({description: 'State or Region of registration for company'})
  @IsString()
  @IsOptional()
  @Expose()
  state?:string;

  @ApiProperty({description: 'Postal Code of registration address for company'})
  @IsString()
  @IsOptional()
  @Expose()
  postalCode?:string;

  @ApiProperty({description: 'Country of registration for company'})
  @IsString()
  @Expose()
  country:string;
}

export class CompanyDetailsDto {
  @ApiProperty({description: 'Registered Name of Company'})
  @IsString()
  @Expose()
  name: string

  @ApiProperty({description: 'Registered Address of Company'})
  @Expose()
  @Type(() => CompanyAddressDto)
  address: CompanyAddressDto;

  @ApiProperty({description: 'Website of Company'})
  @IsString()
  @Expose()
  website: string
}

export class CompanyContactDetailsDto {
  @ApiProperty({description: 'Name of Contact'})
  @IsString()
  @Expose()
  name: string

  @ApiProperty({description: 'Position held by contact'})
  @IsString()
  @Expose()
  position: string

  @ApiProperty({description: 'Email Address of Contact'})
  @IsString()
  @IsEmail()
  @Expose()
  emailAddress: string

  @ApiProperty({description: 'Contact Phone Number'})
  @IsString()
  @IsOptional()
  @Expose()
  phone: string
}

export class AccountDetailsDto {
  @ApiProperty({description: 'Unique Id for Account'})
  @Type(()=> String)
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name for the Account' })
  @Expose()
  accountName: string;

  @ApiProperty({ description: 'Wallet Address for Account' })
  @Expose()
  walletAddress: string;

  @ApiProperty({description: "Company Details for Account"})
  @Expose()
  @Type(() => CompanyDetailsDto)
  company: CompanyDetailsDto;

  @ApiProperty({description: "Primary Contact for Account"})
  @Expose()
  @Type(() => CompanyContactDetailsDto)
  contact: CompanyContactDetailsDto;

  @ApiProperty({ description: 'Status of the account', enum: Object.values(AccountStatus) })
  @Expose()
  @IsEnum(AccountStatus)
  status: AccountStatus;

  @ApiProperty({description: 'Account Created On'})
  @Expose()
  createdAt: Date;

  @ApiProperty({description: 'Account Last Updated On'})
  @Expose()
  updatedAt: Date;
}

export class AccountCreationDto {

  @ApiProperty({description: 'Name for the Account'})
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ description: 'Wallet Address for Account' })
  @IsNotEmpty()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({description: "Company Details for Account"})
  @Expose()
  @Type(() => CompanyDetailsDto)
  company: CompanyDetailsDto;

  @ApiProperty({description: "Primary Contact for Account"})
  @Expose()
  @Type(() => CompanyContactDetailsDto)
  contact: CompanyContactDetailsDto;

  @ApiProperty({ description: 'List of modules that the account has access to', enum: Object.values(ApplicationModule) })
  @Expose()
  @IsArray()
  @IsEnum(ApplicationModule)
  applicationModules: ApplicationModule[];

  @ApiProperty({ description: 'The current state of the account', enum: Object.values(AccountStatus) })
  @Expose()
  @IsEnum(AccountStatus)
  status: AccountStatus;
}

export class AccountStatusUpdateDto {
  @ApiProperty({ description: 'Status of the account', enum: Object.values(AccountStatus) })
  @IsEnum(AccountStatus)
  @IsString()
  status: AccountStatus;
}

export class AccountUpdateDto {

  @ApiProperty({description: 'Name for the Account'})
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({description: 'Contact details for Company'})
  @Type(()=>CompanyContactDetailsDto)
  @IsOptional()
  contact?: CompanyContactDetailsDto;

}
