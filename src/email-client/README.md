# Email Client Service

This module provides email sending functionality using the Brevo (formerly Sendinblue) API.

## Environment Variables

The following environment variables are required:

- `EMAIL_SERVICE_API_KEY`: Your Brevo API key
- `EMAIL_SERVICE_SENDER_EMAIL`: The email address that emails will be sent from

## Usage

### 1. Import the EmailClientModule in your module

```typescript
import { Module } from '@nestjs/common';
import { EmailClientModule } from '../email-client/email-client.module';

@Module({
  imports: [EmailClientModule],
  // ... other module configuration
})
export class YourModule {}
```

### 2. Inject the email service in your service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { EMAIL_CLIENT_SERVICE } from '../email-client/email-client.constants';
import { EmailClientInterface, SendEmailOptions } from '../email-client/types';

@Injectable()
export class YourService {
  constructor(
    @Inject(EMAIL_CLIENT_SERVICE)
    private readonly emailService: EmailClientInterface,
  ) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    const emailOptions: SendEmailOptions = {
      to: userEmail,
      subject: 'Welcome to Our Platform!',
      htmlContent: `
        <h1>Welcome ${userName}!</h1>
        <p>Thank you for joining our platform.</p>
      `,
      textContent: `Welcome ${userName}! Thank you for joining our platform.`,
    };

    await this.emailService.sendEmail(emailOptions);
  }

  async sendBulkEmail(emails: string[], subject: string, content: string) {
    const emailOptions: SendEmailOptions = {
      to: emails,
      subject,
      htmlContent: content,
    };

    await this.emailService.sendEmail(emailOptions);
  }
}
```

## API Reference

### SendEmailOptions Interface

```typescript
interface SendEmailOptions {
  to: string | string[];           // Required: Recipient email(s)
  subject: string;                 // Required: Email subject
  htmlContent: string;             // Required: HTML content of the email
  textContent?: string;            // Optional: Plain text content
  replyTo?: string;                // Optional: Reply-to email address
  cc?: string | string[];          // Optional: CC recipients
  bcc?: string | string[];         // Optional: BCC recipients
}
```

### EmailClientInterface

```typescript
interface EmailClientInterface {
  sendEmail(options: SendEmailOptions): Promise<void>;
}
```

## Error Handling

The service will throw an error if:
- Required environment variables are missing
- The Brevo API returns an error
- Invalid email addresses are provided

All errors are logged with appropriate context for debugging. 