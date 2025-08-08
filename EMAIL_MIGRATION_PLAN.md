# Email Migration Plan: Synchronous to Asynchronous

## Overview

This document outlines the complete migration plan from synchronous to asynchronous email handling using BullMQ queues. The migration addresses reliability concerns with third-party email providers and improves system performance.

## Current State

### Architecture
```
Auth Service → EmailClientService → Email Provider (Brevo/Dummy)
```

### Issues
- **Synchronous blocking**: Email sending blocks user requests
- **No retry mechanism**: Failed emails are lost
- **Provider dependency**: Email provider failures affect user experience
- **No monitoring**: Limited visibility into email delivery status

## Target State

### Architecture
```
Auth Service → EmailQueueService → BullMQ Queue → AuthEmailProcessor → EmailClientService → Email Provider
                                                      ↑
                                              (in auth module)
```

### Benefits
- **Asynchronous processing**: Non-blocking email operations
- **Automatic retries**: Failed emails are retried with exponential backoff
- **Fault tolerance**: Email provider failures don't affect user experience
- **Monitoring**: Queue statistics and job status tracking
- **Scalability**: Email processing is decoupled from main application flow

## Implementation Plan

### Phase 1: Infrastructure Setup ✅

1. **Add Email Queue Constants**
   - Added `EMAIL_QUEUE` constant
   - Added `EmailJobType` enum with all email types
   - Updated `app.constants.ts`

2. **Create Email Events Module**
   - Created `src/email-events/` directory
   - Implemented email job data types
   - Created queue service and processor

### Phase 2: Core Implementation ✅

1. **Email Job Data Types** (`email-events.types.ts`)
   - `BaseEmailJobData` interface
   - Specific job data interfaces for each email type
   - `EmailJobResult` interface for processing results

2. **Email Queue Service** (`email-queue.service.ts`)
   - Methods for adding different email job types
   - Queue statistics and monitoring
   - Configurable retry and backoff settings

3. **Auth Email Processor** (`auth/auth-email.processor.ts`)
   - Auth-specific BullMQ processor for handling auth email jobs
   - Email content regeneration from job data
   - Error handling and retry logic

4. **Email Events Module** (`email-events.module.ts`)
   - BullMQ queue registration
   - Shared queue service registration
   - Module exports for other modules to use

### Phase 3: Service Integration ✅

1. **Update AuthEmailService**
   - Replaced direct email sending with queue job creation
   - Maintained backward compatibility
   - Updated all email sending methods

2. **Update Auth Module**
   - Added EmailEventsModule import
   - Resolved circular dependency issues

### Phase 4: Testing and Documentation ✅

1. **Unit Tests**
   - Created comprehensive test suite for EmailQueueService
   - Tested all email job types and queue operations

2. **Documentation**
   - Created detailed README for email events module
   - Documented migration benefits and usage

## Files Created/Modified

### New Files
- `src/email-events/email-events.types.ts` - Email job data interfaces
- `src/email-events/email-queue.service.ts` - Shared queue service for adding jobs
- `src/email-events/email-events.module.ts` - Shared queue infrastructure
- `src/email-events/email-queue.service.spec.ts` - Unit tests
- `src/email-events/README.md` - Documentation
- `src/auth/auth-email.processor.ts` - Auth-specific email processor

### Modified Files
- `src/constants/app.constants.ts` - Added email queue constants
- `src/auth/services/auth-email.service.ts` - Updated to use queue
- `src/auth/auth.module.ts` - Added EmailEventsModule import and AuthEmailProcessor

## Configuration

### Queue Settings
- **Retry Attempts**: 3 attempts by default
- **Backoff Strategy**: Exponential backoff starting at 2 seconds
- **Job Cleanup**: Last 100 completed jobs, last 50 failed jobs
- **Priority**: Configurable per job type

### Environment Variables
No additional environment variables required. Uses existing email configuration.

## Email Types Supported

1. **Password Reset** (`PASSWORD_RESET`)
   - Data: userEmail, userName, resetToken, expiryMinutes
   - Use case: Password reset requests

2. **Welcome Email** (`WELCOME_EMAIL`)
   - Data: userEmail, userName
   - Use case: New user registration

3. **User Invitation** (`USER_INVITATION`)
   - Data: userEmail, userName, inviterName, temporaryPassword, customMessage
   - Use case: User invitations with temporary passwords

4. **MFA Setup** (`MFA_SETUP`)
   - Data: userEmail, userName, backupCodes, qrCodeUrl
   - Use case: MFA setup with backup codes and QR codes

5. **MFA Backup Codes** (`MFA_BACKUP_CODES`)
   - Data: userEmail, userName, backupCodes
   - Use case: MFA backup codes regeneration

## Usage Examples

### Adding Email Jobs

```typescript
// Password reset
await emailQueueService.addPasswordResetEmailJob(
  'user@example.com',
  'John Doe',
  'reset-token-123',
  30
);

// Welcome email
await emailQueueService.addWelcomeEmailJob(
  'user@example.com',
  'John Doe'
);

// User invitation
await emailQueueService.addUserInvitationEmailJob(
  'user@example.com',
  'John Doe',
  'Admin User',
  'temp-password-123',
  'Welcome to our platform!'
);
```

### Queue Monitoring

```typescript
const stats = await emailQueueService.getQueueStats();
console.log(`Waiting: ${stats.waiting}, Active: ${stats.active}, Failed: ${stats.failed}`);
```

## Migration Benefits

### Reliability
- **Automatic retries**: Failed emails are retried up to 3 times
- **Exponential backoff**: Prevents overwhelming email providers
- **Error handling**: Comprehensive error logging and monitoring

### Performance
- **Non-blocking**: Email operations don't block user requests
- **Async processing**: Emails are processed in background
- **Queue management**: Efficient job scheduling and processing

### Monitoring
- **Queue statistics**: Real-time queue health monitoring
- **Job tracking**: Individual job status and history
- **Error reporting**: Detailed error logs for debugging

### Scalability
- **Decoupled architecture**: Email processing independent of main app
- **Horizontal scaling**: Multiple processors can handle queue
- **Load distribution**: Email load distributed across time

## Testing Strategy

### Unit Tests
- EmailQueueService functionality
- Job data validation
- Queue statistics

### Integration Tests
- End-to-end email flow
- Queue processing
- Error handling and retries

### Manual Testing
- Use dummy email provider for testing
- Verify email content generation
- Test retry mechanisms

## Deployment Considerations

### Redis Configuration
- Ensure Redis is properly configured for BullMQ
- Monitor Redis memory usage
- Configure Redis persistence for job durability

### Monitoring Setup
- Set up queue monitoring dashboards
- Configure alerts for failed jobs
- Monitor queue backlog and processing times

### Rollback Plan
- Keep existing EmailClientService as fallback
- Feature flag for switching between sync/async
- Gradual rollout with monitoring

## Future Enhancements

1. **Email Templates**
   - Dynamic template system
   - Template versioning
   - A/B testing support

2. **Advanced Features**
   - Email scheduling
   - Bulk email processing
   - Email analytics and tracking

3. **Integration**
   - Webhook support for delivery status
   - Email provider failover
   - Rate limiting and throttling

## Modular Architecture Benefits

### Avoiding Circular Dependencies
- **Centralized Infrastructure**: Shared queue infrastructure in EmailEventsModule
- **Distributed Processors**: Each module handles its own email processing
- **Clean Separation**: Processing logic stays close to the services that need it

### Scalability
- **Module-Specific Processors**: Each module can add its own email processor
- **Independent Development**: Teams can work on email features without affecting other modules
- **Easy Extension**: New email types can be added without modifying existing processors

### Example: Adding New Email Types
```typescript
// In a new module (e.g., notifications)
@Processor(EMAIL_QUEUE)
export class NotificationEmailProcessor extends WorkerHost {
  async process(job: Job<EmailJobData>): Promise<EmailJobResult> {
    // Only process notification-related email types
    if (job.data.jobType === EmailJobType.NOTIFICATION) {
      return this.processNotificationEmail(job.data);
    }
    // Skip other email types
    return this.skipJob(job);
  }
}
```

## Conclusion

The migration to asynchronous email handling provides significant improvements in reliability, performance, and monitoring capabilities. The implementation maintains backward compatibility while adding robust queue-based processing with automatic retries and comprehensive error handling.

The modular design allows for easy extension and future enhancements, making the email system more scalable and maintainable. By distributing email processors to their respective modules, we avoid circular dependencies and keep the code organized and maintainable.
