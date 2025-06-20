import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum ApplicationModule {
  DEAL_DESK = 'DealDesk',
  PAIPERLESS = 'Paiperless',
  ONBOARDING_DESK = 'OnboardingDesk',
  PORTAL_ADMIN = 'PortalAdmin',
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