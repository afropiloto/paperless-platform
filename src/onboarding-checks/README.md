# Onboarding Checks Module

This module implements automated checks for the onboarding process using a router pattern.

## Architecture

### Router Pattern
The module uses a single router processor (`OnboardingChecksRouter`) that listens to the `ONBOARDING_CHECKS` queue and routes jobs to appropriate handler services based on the job name.

### Handler Services
Each check type has its own service that contains the business logic:
- `DuplicateRegistrationCheckService` - Checks for duplicate company registrations
- `EmailUniquenessCheckService` - Checks for duplicate email addresses
- `WalletUniquenessCheckService` - Checks for duplicate wallet addresses

### Benefits
1. **Single Queue Management** - All onboarding checks use the same queue
2. **No Job Loss** - Router always processes jobs, no silent rejections
3. **Easy to Extend** - Adding new checks only requires new handler services
4. **Centralized Control** - All routing logic in one place
5. **Better Error Handling** - Consistent error handling and retry logic

## Configuration

### Concurrency
The router processor concurrency can be configured via environment variable:
```bash
ONBOARDING_CHECKS_CONCURRENCY=5  # Default: 5
```

### Queue Configuration
The module registers with the `ONBOARDING_CHECKS` queue and processes jobs with the following event types:
- `ONBOARDING_CHECK_DUPLICATE_REGISTRATION`
- `ONBOARDING_CHECK_EMAIL_UNIQUENESS`
- `ONBOARDING_CHECK_WALLET_UNIQUENESS`

## Usage

### Adding New Checks
1. Create a new handler service in `src/onboarding-checks/services/`
2. Implement the `executeCheck(data: OnboardingCheckEventData)` method
3. Add the service to the module providers
4. Add a new case in the router's switch statement
5. Update the checklist template to include the new event type

### Example Handler Service
```typescript
@Injectable()
export class NewCheckService {
  private readonly logger = new Logger(NewCheckService.name);

  constructor(
    private readonly onboardingChecksService: OnboardingChecksService,
    // ... other dependencies
  ) {}

  async executeCheck(data: OnboardingCheckEventData): Promise<void> {
    this.logger.log(`Processing new check for registration ${data.registrationId}`);
    
    try {
      // Implement check logic here
      const result = await this.performCheck(data);
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        data.checklistInstanceId,
        data.sectionTitle,
        data.itemTitle,
        result.status,
        result.notes
      );
      
      this.logger.log(`New check completed for registration ${data.registrationId}`);
    } catch (error) {
      this.logger.error(`Error in new check for registration ${data.registrationId}: ${error.message}`);
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        data.checklistInstanceId,
        data.sectionTitle,
        data.itemTitle,
        ChecklistItemStatus.CRITICAL,
        [{ text: `Error: ${error.message}`, userId: 'system' }]
      );
      
      throw error; // Re-throw to let the router handle retry logic
    }
  }
}
```

## Migration from Individual Processors

The router pattern replaces the previous individual processors:
- `DuplicateRegistrationCheckProcessor` → `DuplicateRegistrationCheckService`
- `EmailUniquenessCheckProcessor` → `EmailUniquenessCheckService`
- `WalletUniquenessCheckProcessor` → `WalletUniquenessCheckService`

The old processors can be removed as they are no longer needed.
