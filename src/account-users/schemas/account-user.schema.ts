import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApplicationPermissions, ApplicationPermissionsSchema } from './application-permissions.schema';

export enum AccountUserStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  DELETED = 'Deleted',
}

export enum AuthMethod {
  SIWE = 'siwe',
  EMAIL_PASSWORD = 'email-password',
  BOTH = 'both',
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
    lowercase: true
  })
  emailAddress: string;

  @Prop({ 
    required: false,
    type: String 
  })
  walletAddress?: string;

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

  // Authentication fields
  @Prop({ 
    type: String,
    select: false // Don't include password hash in queries by default
  })
  passwordHash?: string;

  @Prop({ 
    type: String,
    enum: AuthMethod,
    default: AuthMethod.SIWE
  })
  authMethod: AuthMethod;

  // MFA fields
  @Prop({ 
    type: String,
    select: false // Don't include MFA secret in queries by default
  })
  mfaSecret?: string;

  @Prop({ 
    type: Boolean,
    default: false
  })
  mfaEnabled: boolean;

  @Prop({ 
    type: [String],
    select: false // Don't include backup codes in queries by default
  })
  mfaBackupCodes?: string[];

  @Prop({ 
    type: Boolean,
    default: false
  })
  mfaSetupRequired: boolean;

  // Security fields
  @Prop({ 
    type: Date
  })
  lastPasswordChange?: Date;

  @Prop({ 
    type: Boolean,
    default: false
  })
  passwordChanged: boolean;

  @Prop({ 
    type: Boolean,
    default: false
  })
  passwordResetRequired: boolean;

  @Prop({ 
    type: Date
  })
  firstLoginAt?: Date;

  @Prop({ 
    type: Number,
    default: 0
  })
  failedLoginAttempts: number;

  @Prop({ 
    type: Date
  })
  accountLockedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AccountUserSchema = SchemaFactory.createForClass(AccountUser); 