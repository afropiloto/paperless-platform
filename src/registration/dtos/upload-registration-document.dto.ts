import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RegistrationDocumentType } from '../enums/document-type.enum';

export class UploadRegistrationDocumentDto{
  @ApiProperty({
    enum: Object.values(RegistrationDocumentType),
    description: 'Type of the document (ProofOfAddress or CompanyRegistration)'
  })
  @IsEnum(RegistrationDocumentType, { message: 'Document type must be either ProofOfAddress or CompanyRegistration' })
  documentType: RegistrationDocumentType;
}