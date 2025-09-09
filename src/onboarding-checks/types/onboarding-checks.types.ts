export interface OnboardingCheckEventData {
  checklistInstanceId: string;
  registrationId: string;
  onboardingProcessingId: string;
  sectionTitle: string;
  itemTitle: string;
  checkConfig?: Record<string, any>;
}
