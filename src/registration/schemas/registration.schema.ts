import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RegistrationDocumentType } from '../enums/document-type.enum';
import { Document } from 'mongoose';
import { RegistrationDocumentStatus, RegistrationStatus } from '../enums/registration-status.enum';

@Schema({timestamps: true})
export class RegistrationDocumentDetails {
  @Prop({required: true})
  storedFileName: string;

  @Prop({required: true})
  storedFilePath: string;

  @Prop({required: true})
  originalFilename: string;

  @Prop({ required: true, enum: RegistrationDocumentType, type: String })
  documentType: RegistrationDocumentType;

  @Prop({required: true})
  mimeType: string;

  @Prop({required: true})
  size: number;

  @Prop({ required: true, enum: RegistrationDocumentStatus, type: String, default: RegistrationDocumentStatus.AWAITING_VIRUS_SCAN })
  status: RegistrationDocumentStatus;
}

export const RegistrationDocumentDetailsSchema = SchemaFactory.createForClass(RegistrationDocumentDetails);

@Schema({timestamps: false, _id: false})
export class RegistrationAddressDetails {
  @Prop({required: true, type: String})
  street: string;
  @Prop({required: true, type: String})
  city: string;
  @Prop({required: false, type: String})
  state: string;
  @Prop({required: true, type: String})
  postalCode: string;
  @Prop({required: true, type: String})
  country: string;
}
export const RegistrationAddressDetailsSchema = SchemaFactory.createForClass(RegistrationAddressDetails);

@Schema({timestamps: false, _id: false})
export class RegistrationCompanyDetails {
  @Prop({required: true, type: String})
  name: string;
  @Prop({required: true, type: RegistrationAddressDetailsSchema})
  address: RegistrationAddressDetails;
  @Prop({required: true, type: String})
  website: string;
  @Prop({required: true, type: String})
  accountWalletAddress: string;
}
export const RegistrationCompanyDetailsSchema = SchemaFactory.createForClass(RegistrationCompanyDetails);



@Schema({timestamps: false, _id: false})
export class RegistrationContactDetails {
  @Prop({required: true, type: String})
  name: string;
  @Prop({required: true, type: String})
  position: string;
  @Prop({required: true, type: String})
  phone: string;
  @Prop({required: true, type: String})
  email: string;

}
export const RegistrationContactDetailsSchema = SchemaFactory.createForClass(RegistrationContactDetails);

@Schema({timestamps: true})
export class Registration extends Document {
  @Prop({required: true, type: String, index: true})
  registrationId: string;

  @Prop({required: true, type: RegistrationCompanyDetailsSchema})
  company: RegistrationCompanyDetails;

  @Prop({required: true, type: RegistrationContactDetailsSchema})
  contact: RegistrationContactDetails;

  @Prop({ required: true, enum: RegistrationStatus, type: String, default: RegistrationStatus.READY_FOR_ONBOARDING })
  status: RegistrationStatus;

  @Prop({required: false, type: [RegistrationDocumentDetailsSchema], default: []})
  documents: RegistrationDocumentDetails[];

}
export const RegistrationSchema = SchemaFactory.createForClass(Registration);