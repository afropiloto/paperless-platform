import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApplicationPermissions, ApplicationPermissionsSchema } from './application-permissions.schema';

export enum AccountUserStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  DELETED = 'Deleted',
}

export type AccountUserDocument = AccountUser & Document;

@Schema({ timestamps: true })
export class AccountUser {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'Account' 
  })
  accountId: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: String 
  })
  name: string;

  @Prop({ 
    required: true, 
    type: String, 
    lowercase: true,
    unique: true 
  })
  emailAddress: string;

  @Prop({ 
    required: true, 
    type: String 
  })
  walletAddress: string;

  @Prop({ 
    required: true, 
    type: String, 
    enum: AccountUserStatus, 
    default: AccountUserStatus.ACTIVE 
  })
  status: AccountUserStatus;

  @Prop({ 
    required: true, 
    type: [ApplicationPermissionsSchema], 
    default: [] 
  })
  permissions: ApplicationPermissions[];

  createdAt: Date;
  updatedAt: Date;
}

export const AccountUserSchema = SchemaFactory.createForClass(AccountUser); 