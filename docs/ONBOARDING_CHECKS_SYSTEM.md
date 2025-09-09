# Due Diligence Checklists & Automated Checks System

## Overview

The Due Diligence Checklists system provides a flexible, template-driven approach to managing both manual and automated verification processes. This system is particularly used in the onboarding process to ensure data integrity and compliance.

## Architecture

### Core Components

1. **DueDiligenceChecklist** - Template definitions for different checklist types
2. **DueDiligenceChecklistInstance** - Individual instances of checklists with status tracking
3. **OnboardingChecksService** - Service for managing automated check processes
4. **Event Processors** - Queue-based processors for automated checks

### Template-Driven Design

The system uses a **template-driven architecture** where:

- **Section and item titles** are stored in the job data, not hardcoded in processors
- **Processors are generic** and work with any checklist item type
- **Template changes** automatically propagate to all processors
- **No code changes** required when adding new checks or modifying existing ones

### Checklist Types

- `ONBOARDING` - Manual due diligence checklists
- `DEAL_PROCESSING` - Deal-specific checklists  
- `ONBOARDING_CHECKS` - Automated onboarding verification checks

## How It Works

### 1. Template-Driven Configuration

Checklists are defined as templates with two types of items:

- **MANUAL** - Require human intervention and can only be updated by client applications
- **AUTOMATED** - Processed by event processors and can only be updated by the system

### 2. Automated Check Process

1. **Registration Created** - New registration triggers onboarding process
2. **Checklist Instance Created** - System creates instance from ONBOARDING_CHECKS template
3. **Events Queued** - Automated check events are queued based on template configuration
4. **Processors Execute** - Event processors perform checks and update checklist items
5. **Status Tracking** - All updates are tracked with originator information

### 3. Access Control

- **Manual Updates**: Only client applications can update MANUAL checklist items
- **Automated Updates**: Only event processors can update AUTOMATED checklist items
- **Originator Validation**: Service layer enforces these restrictions

## Automated Check Processors

### Duplicate Registration Check
- **Event Type**: `ONBOARDING_CHECK_DUPLICATE_REGISTRATION`
- **Purpose**: Verify no existing registrations or accounts exist for the company name
- **Exclusions**: Completed or rejected registrations are excluded from the check

### Email Uniqueness Check  
- **Event Type**: `ONBOARDING_CHECK_EMAIL_UNIQUENESS`
- **Purpose**: Ensure primary contact email is not already used by existing accounts
- **Scope**: Checks both account contacts and account users

### Wallet Uniqueness Check
- **Event Type**: `ONBOARDING_CHECK_WALLET_UNIQUENESS` 
- **Purpose**: Verify company wallet address is not already in use
- **Scope**: Checks accounts, account users, and registrations (excluding completed/rejected)

## Usage Examples

### Creating a Checklist Instance

```typescript
const checklistInstance = await onboardingChecksService.createChecklistInstance(
  DueDiligenceChecklistType.ONBOARDING_CHECKS
);
```

### Updating Manual Checklist Items

```typescript
await checklistService.updateChecklistInstance(
  checklistId,
  [{
    sectionTitle: "Manual Review",
    itemTitle: "Review business documentation", 
    status: ChecklistItemStatus.SATISFACTORY,
    notes: [{ text: "Documents verified", userId: "user123" }]
  }],
  ChecklistUpdateOriginator.MANUAL
);
```

### Automated Check Event Data

```typescript
interface OnboardingCheckEventData {
  checklistInstanceId: string;
  registrationId: string;
  onboardingProcessingId: string;
  sectionTitle: string;
  itemTitle: string;
  checkConfig?: Record<string, any>;
}
```

## Error Handling

- **Retry Logic**: Failed checks are retried based on configuration
- **Error Logging**: All errors are logged with context
- **Status Updates**: Failed checks update checklist items with CRITICAL status
- **Audit Trail**: All updates include originator and timestamp information

## Configuration

### Checklist Template Structure

```typescript
{
  checklistType: DueDiligenceChecklistType.ONBOARDING_CHECKS,
  version: 1,
  sections: [
    {
      title: "Section Title",
      guidance: "Section guidance text",
      items: [
        {
          title: "Item Title",
          guidance: "Item guidance text", 
          checkType: CheckType.AUTOMATED, // or CheckType.MANUAL
          eventType: "EVENT_TYPE_NAME", // for automated items
          checkConfig: {
            timeout: 30000,
            retryAttempts: 3
          }
        }
      ]
    }
  ]
}
```

## Monitoring & Observability

- **Queue Metrics**: Monitor queue depth and processing times
- **Check Status**: Track success/failure rates for each check type
- **Performance**: Monitor check execution times and resource usage
- **Audit Logs**: Complete audit trail of all checklist updates

## Client Integration

### CheckType Field in Responses
All checklist instance responses now include a `checkType` field for each item, allowing clients to:

- **Show appropriate UI** - Different interfaces for manual vs automated items
- **Prevent invalid updates** - Disable update buttons for automated items
- **Provide user feedback** - Show status indicators for automated checks
- **Implement business logic** - Handle manual and automated items differently

### Example Client Usage
```typescript
// Client can now determine how to handle each item
checklistInstance.sections.forEach(section => {
  section.items.forEach(item => {
    if (item.checkType === CheckType.MANUAL) {
      // Show manual update controls
      showManualUpdateUI(item);
    } else if (item.checkType === CheckType.AUTOMATED) {
      // Show read-only status with progress indicator
      showAutomatedStatusUI(item);
    }
  });
});
```

## Security Features

### Originator Validation
The system enforces strict access control based on checklist item types:

- **MANUAL items** can only be updated by client applications (originator: MANUAL)
- **AUTOMATED items** can only be updated by event processors (originator: AUTOMATED)

### Validation Logic
```typescript
private validateUpdateOriginator(
  itemCheckType: CheckType, 
  originator: ChecklistUpdateOriginator
): void {
  if (itemCheckType === CheckType.MANUAL && originator !== ChecklistUpdateOriginator.MANUAL) {
    throw new ForbiddenException('Only manual updates are allowed for this checklist item');
  }
  
  if (itemCheckType === CheckType.AUTOMATED && originator !== ChecklistUpdateOriginator.AUTOMATED) {
    throw new ForbiddenException('Only automated updates are allowed for this checklist item');
  }
}
```

## Database Schema

### OnboardingProcessing Schema
```typescript
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
  onboardingChecksChecklistId: string; // NEW: Links to automated checks

  @Prop({
    type: OnboardingDecisionDetails,
  })
  onboardingDecision: OnboardingDecisionDetails;
}
```

### Enhanced ChecklistItem Schema (Template)
```typescript
@Schema({_id: false, timestamps: false})
export class ChecklistItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  guidance: string;

  @Prop({ 
    type: String, 
    enum: CheckType, 
    default: CheckType.MANUAL 
  })
  checkType: CheckType;

  @Prop({ required: false })
  eventType?: string;

  @Prop({ type: Object, required: false })
  checkConfig?: Record<string, any>;
}
```

### Enhanced ChecklistItem Schema (Instance)
```typescript
@Schema({ timestamps: false, _id: false })
export class ChecklistItem {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: String,
    enum: ChecklistItemStatus,
    default: ChecklistItemStatus.NOT_STARTED,
  })
  status: ChecklistItemStatus;

  @Prop({
    type: String,
    enum: CheckType,
    required: true,
  })
  checkType: CheckType;

  @Prop({ type: [NoteEntry], default: [] })
  @Type(() => NoteEntry)
  notes: NoteEntry[];
}
```

## Future Enhancements

- **Dynamic Templates**: Runtime template updates without code changes
- **Check Dependencies**: Define check execution order and dependencies
- **Custom Check Types**: Plugin system for custom check processors
- **Real-time Updates**: WebSocket updates for real-time status changes
- **Advanced Retry Logic**: Exponential backoff with jitter
- **Check Result Caching**: Cache results for similar checks
- **Bulk Operations**: Process multiple checks in parallel

## Troubleshooting

### Common Issues

1. **Check Fails with ForbiddenException**
   - Ensure you're using the correct originator for the item type
   - Check that the item is defined as MANUAL or AUTOMATED in the template

2. **Events Not Processing**
   - Verify the queue is properly configured
   - Check that processors are registered with the correct event types
   - Review queue metrics for stuck jobs

3. **Template Not Found**
   - Ensure the ONBOARDING_CHECKS template is seeded
   - Check template version compatibility

### Debugging Tips

- Enable debug logging for OnboardingChecksService
- Monitor queue metrics in Redis/BullMQ dashboard
- Check audit logs for originator validation failures
- Review checklist instance status in database

## API Reference

### OnboardingChecksService

#### `createChecklistInstance(): Promise<string>`
Creates a new checklist instance from the ONBOARDING_CHECKS template.

#### `updateAutomatedChecklistItem(checklistId, sectionTitle, itemTitle, status, notes?)`
Updates an automated checklist item with results.

#### `queueAutomatedChecks(template, eventData)`
Queues automated check events based on template configuration.

### Event Processors

All processors extend `WorkerHost` and implement the `process(job: Job<OnboardingCheckEventData>)` method.

**Important**: All processors listen to the same `onboarding-checks-queue` but handle different event types. Each processor checks the job name to determine if it should process the event.

#### DuplicateRegistrationCheckProcessor
- **Queue**: `onboarding-checks-queue`
- **Event**: `ONBOARDING_CHECK_DUPLICATE_REGISTRATION`
- **Purpose**: Checks company name uniqueness across registrations and accounts

#### EmailUniquenessCheckProcessor  
- **Queue**: `onboarding-checks-queue`
- **Event**: `ONBOARDING_CHECK_EMAIL_UNIQUENESS`
- **Purpose**: Checks primary contact email uniqueness

#### WalletUniquenessCheckProcessor
- **Queue**: `onboarding-checks-queue`
- **Event**: `ONBOARDING_CHECK_WALLET_UNIQUENESS`
- **Purpose**: Checks company wallet address uniqueness

### Processor Configuration

Each processor includes event type filtering:

```typescript
async process(job: Job<OnboardingCheckEventData>): Promise<void> {
  // Only process specific event type
  if (job.name !== 'ONBOARDING_CHECK_WALLET_UNIQUENESS') {
    this.logger.debug(`Skipping job ${job.id} with event type ${job.name}`);
    return;
  }
  
  // Process the event...
}
```
