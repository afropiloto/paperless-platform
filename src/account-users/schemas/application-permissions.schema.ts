import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum ApplicationModule {
  PORTAL_DEAL_DESK = 'Portal-DealDesk',
  PORTAL_ONBOARDING_DESK = 'Portal-OnboardingDesk',
  PORTAL_ADMIN = 'Portal-Admin',
  PAIPERLESS_TRADE_DOCUMENTS = 'Paiperless-Trade-Documents',
  PAIPERLESS_TRADE_FINANCE = 'Paiperless-Trade-Finance',
  PAIPERLESS_ADMIN = 'Paiperless-Admin',
}


export enum ApplicationRole {
  AGENT = 'Agent',
  SUPERVISOR = 'Supervisor',
  MANAGER = 'Manager',
}

@Schema({ timestamps: false, _id: false })
export class ApplicationPermissions {
  @Prop({ 
    required: true, 
    type: String, 
    enum: ApplicationModule 
  })
  module: ApplicationModule;

  @Prop({ 
    required: true, 
    type: String, 
    enum: ApplicationRole 
  })
  role: ApplicationRole;
}

export const ApplicationPermissionsSchema = SchemaFactory.createForClass(ApplicationPermissions); 