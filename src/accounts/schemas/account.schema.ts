import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountStatus } from '../types/account.types';
import { ApplicationModule } from 'src/account-users/types';

@Schema({timestamps: false, _id: false})
export class CompanyAddress {
  @Prop({ required: true, type: String})
  street: string;

  @Prop({ required: true, type: String})
  city: string;

  @Prop({ required: false, type: String})
  state?: string;

  @Prop({ required: false, type: String})
  postalCode?: string;

  @Prop({required: true, type: String})
  country: string;
}
@Schema({timestamps: false, _id: false})
export class CompanyDetails {
  @Prop({required: true, type: String})
  name: string;

  @Prop({required: true, type: CompanyAddress})
  address: CompanyAddress;

  @Prop({required: true, type: String})
  website: string;
}

@Schema({timestamps: false, _id: false})
export class ContactDetails {
  @Prop({required: true, type: String})
  name: string;

  @Prop({required: true, type: String})
  position: string;

  @Prop({required: true, type: String, lowercase: true})
  emailAddress: string;

  @Prop({required: false, type: String})
  phone?: string;
}

@Schema({ timestamps: true })
export class Account {
  accountId: string;

  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({required: true, type: CompanyDetails})
  company: CompanyDetails;

  @Prop({required: true, type: ContactDetails})
  contact: ContactDetails;

  @Prop({required: true, default: [], type: [String]})
  applicationModules: ApplicationModule[]

  @Prop({required: true, type: String, enum: AccountStatus, default: AccountStatus.SUSPENDED})
  status: AccountStatus;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
