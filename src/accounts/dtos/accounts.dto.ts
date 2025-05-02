import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEmail, IsEthereumAddress, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AccountDetailsDto {
  @ApiProperty({description: 'Unique Id for Account'})
  @Type(()=> String)
  @Expose({name: '_id'})
  id: string;

  @ApiProperty({ description: 'Name for the Account' })
  @Expose()
  accountName: string;

  @ApiProperty({ description: 'Email Address for Account' })
  @Expose()
  emailAddress: string;
  @ApiProperty({ description: 'Wallet Address for Account' })
  @Expose()
  walletAddress: string;
}

export class AccountCreationDto {

  @ApiProperty({description: 'Name for the Account'})
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({description: 'Email Address for Account'})
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @ApiProperty({ description: 'Wallet Address for Account' })
  @IsNotEmpty()
  @IsEthereumAddress()
  walletAddress: string;

}

export class AccountUpdateDto {

  @ApiProperty({description: 'Name for the Account'})
  @IsOptional()
  @IsString()
  accountName: string;

  @ApiProperty({description: 'Email Address for Account'})
  @IsEmail()
  @IsOptional()
  emailAddress: string;

}
