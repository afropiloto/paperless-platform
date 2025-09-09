# Add Onboarding Check CLI - Quick Reference

## Quick Commands

### Duplicate Registration Check
```bash
pnpm run script:add-onboarding-check \
  -e ONBOARDING_CHECK_DUPLICATE_REGISTRATION \
  -c <checklist-instance-id> \
  -r <registration-id> \
  -o <onboarding-processing-id> \
  -s "Company Verification" \
  -i "Check for duplicate company registrations"
```

### Email Uniqueness Check
```bash
pnpm run script:add-onboarding-check \
  -e ONBOARDING_CHECK_EMAIL_UNIQUENESS \
  -c <checklist-instance-id> \
  -r <registration-id> \
  -o <onboarding-processing-id> \
  -s "Contact Verification" \
  -i "Check email uniqueness"
```

### Wallet Uniqueness Check
```bash
pnpm run script:add-onboarding-check \
  -e ONBOARDING_CHECK_WALLET_UNIQUENESS \
  -c <checklist-instance-id> \
  -r <registration-id> \
  -o <onboarding-processing-id> \
  -s "Wallet Verification" \
  -i "Check wallet address uniqueness"
```

### With Custom Retry Configuration
```bash
pnpm run script:add-onboarding-check \
  -e ONBOARDING_CHECK_WALLET_UNIQUENESS \
  -c <checklist-instance-id> \
  -r <registration-id> \
  -o <onboarding-processing-id> \
  -s "Wallet Verification" \
  -i "Check wallet address uniqueness" \
  -k '{"retryAttempts": 5, "timeout": 30000}'
```

## Required Parameters

- `-e, --event-type`: One of the three valid event types
- `-c, --checklist-instance-id`: MongoDB ObjectId of the checklist instance
- `-r, --registration-id`: Registration ID to check
- `-o, --onboarding-processing-id`: Onboarding processing ID
- `-s, --section-title`: Section title from the checklist template
- `-i, --item-title`: Item title from the checklist template

## Optional Parameters

- `-k, --check-config`: JSON string with retry/timeout configuration
- `-h, --help`: Show help message

## Environment Setup

Make sure these environment variables are set:
- `REDIS_HOST` (default: localhost)
- `REDIS_PORT` (default: 6379)
- `REDIS_PASSWORD` (optional)

## Common Use Cases

1. **Testing Processors**: Add jobs to test if processors are working
2. **Debugging**: Re-run specific checks with different parameters
3. **Development**: Test new check configurations
4. **Manual Verification**: Run checks outside of normal onboarding flow


