export enum EmailProviderType {
  BREVO = 'brevo',
  DUMMY = 'dummy',
  // Future providers: SENDGRID, MAILGUN, etc.
}

export interface EmailProviderConfig {
  type: EmailProviderType;
  apiKey?: string;
  senderEmail?: string;
  // Provider-specific config
  [key: string]: any;
}
