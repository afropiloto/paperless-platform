import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsEthereumAddress, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { DocumentSigningRole, DocumentSigningStatus } from '../types/document-signing.types';
import { SearchResultsMetadata } from 'src/common/dtos/search.dto';


export class SignerDetailsDto {
  @ApiProperty({description: "Wallet address of the party to sign to the document"})
  @IsEthereumAddress()
  @IsNotEmpty()
  @Expose()
  walletAddress: string;

  @ApiProperty({description: "Name of the signer"})
  @IsString()
  @IsOptional()
  @Expose()
  name?: string;

  @ApiProperty({description: "Role of the signer"})
  @IsEnum(DocumentSigningRole)
  @IsString()
  @Expose()
  role: DocumentSigningRole;

}

export class  DocumentSigningCreationDetailsDto {
  @ApiProperty({description: "Description of the document signing required", example: "Promissory Note to secure funding for Deal Reference 123456A-BC"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  description: string;


  @ApiProperty({description: "Internal Account ID originating the document signing", example: "6787b17870f5941b216cb61d"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  accountId: string;

  @ApiProperty({description: "Internal Id of the document being signed", example: "6787b17870f5941b216cb61d"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  documentId: string;

  @ApiProperty({description: "Expiry Date for the signing"})
  @IsDate()
  @Type(() => Date)
  @Expose()
  expiryDate: Date;

  @ApiProperty({description: "List of Parties required to sign the document"})
  @Expose()
  parties: SignerDetailsDto[];

}

export class UpdateSigningDetailsDto {

  @ApiProperty({description: "DocumentId on of the document being signed on the Contract", example: "b216cb61d678f5941b216cb61d7b17870f59416787b17870"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  signingDocumentId?: string;

  @ApiProperty({description: "Last known status of the document signing"})
  @IsEnum(DocumentSigningStatus)
  @Expose()
  lastKnownStatus?: DocumentSigningStatus;
}

export class DocumentSigningDetailsDto extends DocumentSigningCreationDetailsDto {

  @ApiProperty({description: "Internal id for signing"})
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  @Expose()
  id: string;

  @ApiProperty({description: "Date the Signing Details were created"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  createdAt: Date;

  @ApiProperty({description: "Date the Signing Details were last updated"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  updatedAt: Date;

  @ApiProperty({description: "Last known status of the document signing"})
  @IsEnum(DocumentSigningStatus)
  @Expose()
  lastKnownStatus: DocumentSigningStatus;

  @ApiProperty({description: "DocumentId on of the document being signed on the Contract", example: "b216cb61d678f5941b216cb61d7b17870f59416787b17870"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  signingDocumentId: string;

}

export class DocumentSigningSearchResultsDto {
  @ApiProperty({description: "List of Document Signing Details"})
  @Expose()
  @Type(() => DocumentSigningDetailsDto)
  documentSigningDetails: DocumentSigningDetailsDto[];

  @ApiProperty({description: "Total number of Document Signing Details"})
  @Type(() => SearchResultsMetadata)
  @Expose()
  metadata: SearchResultsMetadata
}