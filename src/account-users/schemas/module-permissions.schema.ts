import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModulePermissionsDocument = ModulePermissions & Document;

@Schema({ _id: false, timestamps: false })
export class AllowableRole {
  @Prop({ required: true, type: String })
  role: string;

  @Prop({ required: false, type: String })
  description?: string;
}

const AllowableRoleSchema = SchemaFactory.createForClass(AllowableRole);

@Schema({ timestamps: true })
export class ModulePermissions {
  @Prop({ required: true, unique: true, index: true, type: String })
  module: string;

  @Prop({ required: false, type: String })
  description?: string;

  @Prop({ required: true, type: [AllowableRoleSchema], default: [] })
  allowableRoles: AllowableRole[];

  @Prop({ required: true, type: Boolean, default: true })
  active: boolean;
}

export const ModulePermissionsSchema = SchemaFactory.createForClass(ModulePermissions);

