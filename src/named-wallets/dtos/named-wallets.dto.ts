import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEmail, IsEthereumAddress, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class NamedWalletDto {
  @ApiProperty({description: "Unique Wallet Id"})
  @Type(() => String)
  @Expose({name: '_id'},)
  id: string;

  @ApiProperty({description: "Account Id"})
  @Expose()
  accountId: string;

  @ApiProperty({description: "Wallet Name"})
  @Expose()
  walletName: string;

  @ApiProperty({description: "Wallet Address"})
  @Expose()
  walletAddress: string;

  @ApiProperty({description: "Wallet Contact Email Address"})
  @Expose()
  emailAddress: string;

}

export class CreateNamedWalletDto {
  @ApiProperty({description: "Name for Wallet"})
  @IsString()
  @IsNotEmpty()
  walletName: string;

  @ApiProperty({description: "Ethereum Wallet Address"})
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({description: "Contact Email Address for Wallet"})
  @IsEmail()
  @IsOptional()
  emailAddress: string;

}

export class UpdateNamedWalletDto {
  @ApiProperty({description: "Name for Wallet"})
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  walletName: string;

  @ApiProperty({description: "Contact Email Address for Wallet"})
  @IsEmail()
  @IsOptional()
  emailAddress: string;

}