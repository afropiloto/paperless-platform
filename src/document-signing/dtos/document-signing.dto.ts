import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsEthereumAddress, IsNotEmpty, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { DocumentSigningRole, DocumentSigningStatus } from '../types/document-signing.types';
import { SearchResultsMetadata } from 'src/common/dtos/search.dto';


export class SignerDetailsDto {
  @ApiProperty({description: "Wallet address of the party to sign to the document", example: "0xB320Df3e10FdD73fbCc81f225ACb71faE0342bDf"})
  @IsEthereumAddress()
  @IsNotEmpty()
  @Expose()
  walletAddress: string;

  @ApiProperty({description: "Name of the signer", example: "Paperless Ltd"})
  @IsString()
  @IsOptional()
  @Expose()
  name?: string;

  @ApiProperty({description: "Role of the signer", example: "ISSUER", enum: DocumentSigningRole})
  @IsEnum(DocumentSigningRole)
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

  @ApiProperty({
    description: "List of Parties required to sign the document",
    type: [SignerDetailsDto],
    isArray: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignerDetailsDto)
  @Expose()
  parties: SignerDetailsDto[];

}
export class DocumentSigningEventContractDetails{
  @ApiProperty({description: "RPC Url holding the document registry", example: "http://127.0.0.1:8545"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  rpcUrl: string;

  @ApiProperty({description: "Contract Address for the Document Registry used for document signing", example: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  contractAddress: string;

  @ApiProperty({description: "DocumentId on the  Document Registry for the document being signed", example: "5E7734CE288F83690bb3F05127e1Bb143E90bb3F0512e7f17e7f17225E7734CE288F8367e1Bb143E"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  documentId: string;

  @ApiProperty({description: "Chain Id for Document Registry contract", example: "31337"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  chainId: number;
}

export class UpdateSigningDetailsDto {
  @ApiProperty({description: "DocumentId on of the document being signed on the Contract", example: "b216cb61d678f5941b216cb61d7b17870f59416787b17870"})
  @IsOptional()
  @Expose()
  @Type(() => DocumentSigningEventContractDetails)
  contractDetails?: DocumentSigningEventContractDetails;

  @ApiProperty({description: "Last known status of the document signing", enum: DocumentSigningStatus})
  @IsEnum(DocumentSigningStatus)
  @IsOptional()
  @Expose()
  lastKnownStatus?: DocumentSigningStatus;
}

export class DocumentSigningDetailsDto {
  @ApiProperty({description: "Internal id for signing"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;

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

  @ApiProperty({
    description: "List of Parties required to sign the document",
    type: [SignerDetailsDto],
    isArray: true
  })
  @IsArray()
  @Type(() => SignerDetailsDto)
  @Expose()
  parties: SignerDetailsDto[];

  @ApiProperty({description: "Date the Signing Details were created"})
  @IsDate()
  @Type(() => Date)
  @Expose()
  createdAt: Date;

  @ApiProperty({description: "Date the Signing Details were last updated"})
  @IsDate()
  @Type(() => Date)
  @Expose()
  updatedAt: Date;

  @ApiProperty({description: "Last known status of the document signing", example: "PENDING", enum: DocumentSigningStatus})
  @IsEnum(DocumentSigningStatus)
  @Expose()
  lastKnownStatus: DocumentSigningStatus;

  @ApiProperty({description: "Contract Details for the Document Signing"})
  @IsOptional()
  @Type(()=>DocumentSigningEventContractDetails)
  @Expose()
  contractDetails?: DocumentSigningEventContractDetails;

}

export class DocumentSigningSearchResultsDto {
  @ApiProperty({
    description: "List of Document Signing Details",
    type: [DocumentSigningDetailsDto],
    isArray: true
  })
  @Expose()
  @Type(() => DocumentSigningDetailsDto)
  documentSigningDetails: DocumentSigningDetailsDto[];

  @ApiProperty({description: "Total number of Document Signing Details"})
  @Type(() => SearchResultsMetadata)
  @Expose()
  metadata: SearchResultsMetadata
}