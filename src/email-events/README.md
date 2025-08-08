# Email Events Module

This module provides the infrastructure for asynchronous email handling using BullMQ queues. It replaces the previous synchronous email sending approach with a more robust, queue-based system that handles failures and retries automatically.

## Overview

The email events module provides:

- **EmailQueueService**: Shared service for adding email jobs to the queue
- **Email Events Types**: TypeScript interfaces for email job data
- **Queue Infrastructure**: BullMQ queue registration and configuration

**Note**: Email processors are distributed to their respective modules to avoid circular dependencies and keep processing logic close to the services that need it.

## Architecture

### Before (Synchronous)
```
Auth Service → EmailClientService → Email Provider
```

### After (Asynchronous)
```
Auth Service → EmailQueueService → BullMQ Queue → AuthEmailProcessor → EmailClientService → Email Provider
                                                      ↑
                                              (in auth module)
```

## Benefits

1. **Reliability**: Failed emails are automatically retried with exponential backoff
2. **Scalability**: Email processing is decoupled from the main application flow
3. **Monitoring**: Queue statistics and job status tracking
4. **Fault Tolerance**: Email provider failures don't affect user experience
5. **Performance**: Non-blocking email operations

## Email Job Types

The module supports the following email types:

- `PASSWORD_RESET`: Password reset emails
- `WELCOME_EMAIL`: Welcome emails for new users
- `USER_INVITATION`: User invitation emails with temporary passwords
- `MFA_SETUP`: MFA setup emails with backup codes and QR codes
- `MFA_BACKUP_CODES`: MFA backup codes regeneration emails

## Job Data Structure

Each email job contains enough data to regenerate the email content without storing the actual email content on the queue:

```typescript
interface BaseEmailJobData {
  jobType: EmailJobType;
  to: string | string[];
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}
```

## Configuration

### Queue Settings

- **Retry Attempts**: 3 attempts by default
- **Backoff Strategy**: Exponential backoff starting at 2 seconds
- **Job Cleanup**: Last 100 completed jobs, last 50 failed jobs

### Environment Variables

No additional environment variables are required beyond the existing email configuration.

## Usage

### Adding Email Jobs

```typescript
// Password reset email
await emailQueueService.addPasswordResetEmailJob(
  'user@example.com',
  'John Doe',
  'reset-token-123',
  30 // expiry minutes
);

// Welcome email
await emailQueueService.addWelcomeEmailJob(
  'user@example.com',
  'John Doe'
);

// User invitation email
await emailQueueService.addUserInvitationEmailJob(
  'user@example.com',
  'John Doe',
  'Admin User',
  'temp-password-123',
  'Welcome to our platform!'
);
```

### Queue Statistics

```typescript
const stats = await emailQueueService.getQueueStats();
console.log(`Waiting: ${stats.waiting}, Active: ${stats.active}, Failed: ${stats.failed}`);
```

## Migration from Synchronous to Asynchronous

### Changes Made

1. **AuthEmailService**: Updated to use queue instead of direct email sending
2. **Email Events Module**: New module with shared queue infrastructure
3. **Auth Module**: Imports EmailEventsModule and includes AuthEmailProcessor
4. **Constants**: Added email queue constants

### Modular Architecture

- **EmailQueueService**: Shared service for adding jobs to the queue
- **AuthEmailProcessor**: Auth-specific email processor in the auth module
- **Future modules**: Can add their own email processors as needed

### Backward Compatibility

The public API of `AuthEmailService` remains unchanged. All existing code continues to work without modification.

### Testing

The migration maintains the same testing approach. The dummy email provider continues to work for testing purposes.

## Monitoring

### Queue Health

Monitor the email queue health through:

- Queue statistics (waiting, active, completed, failed jobs)
- Job processing logs
- Failed job alerts

### Metrics to Track

- Email delivery success rate
- Average processing time
- Failed job count and reasons
- Queue backlog size

## Future Enhancements

1. **Email Templates**: Support for dynamic email templates
2. **Bulk Emails**: Batch processing for multiple recipients
3. **Email Scheduling**: Delayed email sending
4. **Webhooks**: Email delivery status callbacks
5. **Analytics**: Email open/click tracking
