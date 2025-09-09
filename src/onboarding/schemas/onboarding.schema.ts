import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OnboardingDecision, OnboardingStatus } from '../types/onboarding.types';
import { NoteEntry } from '../../common/schemas/note-entry.schema';


@Schema({ timestamps: true })
export class OnboardingDecisionDetails extends Document {
  @Prop({
    type: String,
    enum: OnboardingDecision,
    default: OnboardingDecision.PENDING,
  })
  decision: OnboardingDecision;

  @Prop({ type: NoteEntry })
  decisionNotes?: NoteEntry;
}

@Schema({ timestamps: true })
export class OnboardingProcessing extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  registrationId: Types.ObjectId;

  @Prop({
    type: String,
    enum: OnboardingStatus,
    default: OnboardingStatus.NEW,
  })
  status: OnboardingStatus;

  @Prop()
  dueDiligenceChecklistId: string;

  @Prop()
  onboardingChecksChecklistId: string;

  @Prop({
    type: OnboardingDecisionDetails,
  })
  onboardingDecision: OnboardingDecisionDetails;

}

export const OnboardingProcessingSchema =
  SchemaFactory.createForClass(OnboardingProcessing);