# Email Client Service

This module provides email sending functionality with support for multiple email providers. Currently supports Brevo (formerly Sendinblue) and a dummy provider for testing.

## Features

- **Provider-agnostic design**: Easy switching between email providers
- **Multiple provider support**: Brevo, Dummy (for testing), and extensible for more
- **Consistent interface**: Same API regardless of the underlying provider
- **Testing support**: Dummy provider for storing emails in memory during tests
- **Health checks**: Provider health monitoring
- **Validation**: Comprehensive email validation

## Environment Variables

### Required for all providers:
- `EMAIL_PROVIDER_TYPE`: The email provider to use (`brevo` or `dummy`)

### Required for Brevo provider:
- `EMAIL_SERVICE_API_KEY`: Your Brevo API key
- `EMAIL_SERVICE_SENDER_EMAIL`: The email address that emails will be sent from

### Optional for Dummy provider:
- `DUMMY_EMAIL_DISK_STORAGE_ENABLED`: Enable writing emails to disk (default: false)
- `DUMMY_EMAIL_DISK_STORAGE_DIRECTORY`: Directory to store email files (default: './dummy-emails')
- `DUMMY_EMAIL_DISK_STORAGE_FORMAT`: Output format - 'json', 'html', or 'both' (default: 'both')
- `DUMMY_EMAIL_DISK_STORAGE_INCLUDE_METADATA`: Include metadata in JSON files (default: true)

## Provider Configuration

### Brevo Provider (Production)
```bash
EMAIL_PROVIDER_TYPE=brevo
EMAIL_SERVICE_API_KEY=your_brevo_api_key
EMAIL_SERVICE_SENDER_EMAIL=your_sender_email
```

### Dummy Provider (Testing)
```bash
EMAIL_PROVIDER_TYPE=dummy
```

### Dummy Provider with Disk Storage (Manual Testing)
```bash
EMAIL_PROVIDER_TYPE=dummy
DUMMY_EMAIL_DISK_STORAGE_ENABLED=true
DUMMY_EMAIL_DISK_STORAGE_DIRECTORY=./test-emails
DUMMY_EMAIL_DISK_STORAGE_FORMAT=both
DUMMY_EMAIL_DISK_STORAGE_INCLUDE_METADATA=true
```

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

    const result = await this.emailService.sendEmail(emailOptions);
    
    if (result.status === 'sent') {
      console.log(`Email sent successfully with ID: ${result.messageId}`);
    } else {
      console.error(`Failed to send email: ${result.error}`);
    }
  }

  async sendBulkEmail(emails: string[], subject: string, content: string) {
    const emailOptions: SendEmailOptions = {
      to: emails,
      subject,
      htmlContent: content,
    };

    const result = await this.emailService.sendEmail(emailOptions);
    return result;
  }

  async checkEmailHealth() {
    const isHealthy = await this.emailService.isHealthy();
    console.log(`Email provider health: ${isHealthy}`);
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
  attachments?: EmailAttachment[]; // Optional: Email attachments
  metadata?: Record<string, any>;  // Optional: Additional metadata
}
```

### EmailAttachment Interface

```typescript
interface EmailAttachment {
  filename: string;        // Required: Name of the file
  content: Buffer | string; // Required: File content
  contentType?: string;    // Optional: MIME type
}
```

### EmailResult Interface

```typescript
interface EmailResult {
  messageId?: string;      // Optional: Provider-specific message ID
  provider: string;        // Required: Name of the provider used
  sentAt: Date;           // Required: Timestamp when email was sent
  status: 'sent' | 'failed'; // Required: Status of the email
  error?: string;         // Optional: Error message if failed
}
```

### EmailClientInterface

```typescript
interface EmailClientInterface {
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;
  getProviderName(): string;
  isHealthy(): Promise<boolean>;
}
```

## Testing with Dummy Provider

The dummy provider is perfect for testing as it stores emails in memory instead of actually sending them.

### Disk Storage for Manual Testing

The dummy provider can optionally write emails to disk, which is extremely useful for manual testing and debugging. This feature allows you to:

- **View email content** in a browser (HTML format)
- **Inspect email data** programmatically (JSON format)
- **Debug email templates** and content
- **Verify email formatting** and styling
- **Share email examples** with team members

#### Configuration Options

```typescript
// Environment variables for disk storage
DUMMY_EMAIL_DISK_STORAGE_ENABLED=true                    // Enable disk storage
DUMMY_EMAIL_DISK_STORAGE_DIRECTORY=./test-emails         // Output directory
DUMMY_EMAIL_DISK_STORAGE_FORMAT=both                     // json, html, or both
DUMMY_EMAIL_DISK_STORAGE_INCLUDE_METADATA=true           // Include metadata in JSON
```

#### Output Files

When disk storage is enabled, each email generates:

- **`{timestamp}-{id}.html`**: Beautiful HTML preview with metadata
- **`{timestamp}-{id}.json`**: Complete email data in JSON format

#### HTML Preview Features

The generated HTML files include:
- Email metadata (recipients, subject, timestamp, etc.)
- Rendered HTML content
- Plain text content (if available)
- Professional styling for easy reading
- Clear indication that it's a dummy email

#### Programmatic Control

You can also control disk storage programmatically:

```typescript
const dummyProvider = (emailClient as any).provider as DummyEmailProvider;

// Enable disk storage
await dummyProvider.enableDiskStorage('./my-emails', 'both');

// Get current configuration
const config = dummyProvider.getDiskStorageConfig();

// Update configuration
dummyProvider.updateDiskStorageConfig({
  enabled: true,
  directory: './custom-directory',
  format: 'html',
  includeMetadata: false,
});

// Disable disk storage
await dummyProvider.disableDiskStorage();
```

### Using Dummy Provider in Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EmailClientModule } from '../email-client/email-client.module';
import { EMAIL_CLIENT_SERVICE } from '../email-client/email-client.constants';
import { EmailClientInterface } from '../email-client/types';
import { DummyEmailProvider } from '../email-client/providers/dummy/dummy-email.provider';

describe('EmailService', () => {
  let emailService: EmailClientInterface;
  let dummyProvider: DummyEmailProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmailClientModule],
    }).compile();

    emailService = module.get<EmailClientInterface>(EMAIL_CLIENT_SERVICE);
    dummyProvider = module.get<DummyEmailProvider>(EMAIL_CLIENT_SERVICE);
  });

  it('should send email and store it in dummy provider', async () => {
    const emailOptions = {
      to: 'test@example.com',
      subject: 'Test Email',
      htmlContent: '<h1>Test</h1>',
    };

    const result = await emailService.sendEmail(emailOptions);

    expect(result.status).toBe('sent');
    expect(result.provider).toBe('dummy');

    // Get stored emails for assertions
    const storedEmails = await dummyProvider.getStoredEmails();
    expect(storedEmails).toHaveLength(1);
    expect(storedEmails[0].to).toBe('test@example.com');
    expect(storedEmails[0].subject).toBe('Test Email');
  });

  it('should find emails by recipient', async () => {
    await emailService.sendEmail({
      to: 'user@example.com',
      subject: 'Welcome',
      htmlContent: '<h1>Welcome</h1>',
    });

    const foundEmails = await dummyProvider.findByRecipient('user@example.com');
    expect(foundEmails).toHaveLength(1);
  });

  afterEach(async () => {
    // Clean up stored emails after each test
    await dummyProvider.clearStoredEmails();
  });
});
```

### Dummy Provider Methods

The dummy provider extends the base interface with additional testing methods:

```typescript
// Get all stored emails
const allEmails = await dummyProvider.getStoredEmails();

// Find emails by recipient
const userEmails = await dummyProvider.findByRecipient('user@example.com');

// Find emails by subject
const welcomeEmails = await dummyProvider.findBySubject('Welcome');

// Find email by ID
const email = await dummyProvider.findById('dummy-1234567890-abc123');

// Get count of stored emails
const count = await dummyProvider.getStoredEmailCount();

// Clear all stored emails
await dummyProvider.clearStoredEmails();
```

## Error Handling

The service will throw an error if:
- Required environment variables are missing
- Invalid email provider type is specified
- Invalid email addresses are provided
- The underlying provider returns an error

All errors are logged with appropriate context for debugging.

## Migration Status

**✅ COMPLETED** - The email client has been successfully migrated to a provider-agnostic architecture.

### What was accomplished:
- ✅ Created provider-agnostic architecture with factory pattern
- ✅ Implemented Brevo and Dummy providers
- ✅ Updated existing services to use new EmailResult interface
- ✅ Updated all tests to work with new interface
- ✅ Added comprehensive integration tests
- ✅ Maintained backward compatibility
- ✅ **Phase 3: Dummy provider for testing is fully implemented and working**

### Current Status:
The email client now supports:
- **Easy provider switching** via `EMAIL_PROVIDER_TYPE` environment variable
- **Consistent interface** across all providers
- **Testing support** with dummy provider (stores emails in memory)
- **Health checks** for provider monitoring
- **Enhanced error handling** with detailed result information
- **Search and query capabilities** for stored emails in dummy provider

## Demo Script

A demonstration script is included to show how the dummy provider works:

```bash
# Run the demo script
npx ts-node src/email-client/demo-dummy-provider.ts
```

The demo script shows:
- How to configure the dummy provider
- Sending emails and getting results
- Accessing stored emails
- Search functionality
- Health checks
- Cleanup operations

## Adding New Providers

1. Create a new provider class that extends `BaseEmailProvider`
2. Implement the required methods: `sendEmail`, `getProviderName`, `isHealthy`
3. Add the provider type to the `EmailProviderType` enum
4. Update the `EmailProviderFactory` to handle the new provider
5. Add appropriate tests

Example:

```typescript
export class SendGridEmailProvider extends BaseEmailProvider {
  // Implementation
}

// In EmailProviderType enum
export enum EmailProviderType {
  BREVO = 'brevo',
  DUMMY = 'dummy',
  SENDGRID = 'sendgrid', // New provider
}

// In EmailProviderFactory
case EmailProviderType.SENDGRID:
  return new SendGridEmailProvider(config);
``` 