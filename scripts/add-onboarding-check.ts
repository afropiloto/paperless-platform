#!/usr/bin/env node

import { Queue } from 'bullmq';
import { OnboardingCheckEventData } from '../src/onboarding-checks/types/onboarding-checks.types';
import { OnboardingQueues } from '../src/constants/app.constants';

interface CliOptions {
  eventType: string;
  checklistInstanceId: string;
  registrationId: string;
  onboardingProcessingId: string;
  sectionTitle: string;
  itemTitle: string;
  checkConfig?: string; // JSON string
  help?: boolean;
}

const VALID_EVENT_TYPES = [
  'ONBOARDING_CHECK_DUPLICATE_REGISTRATION',
  'ONBOARDING_CHECK_EMAIL_UNIQUENESS', 
  'ONBOARDING_CHECK_WALLET_UNIQUENESS'
];

function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {} as CliOptions;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--event-type':
      case '-e':
        options.eventType = args[++i];
        break;
      case '--checklist-instance-id':
      case '-c':
        options.checklistInstanceId = args[++i];
        break;
      case '--registration-id':
      case '-r':
        options.registrationId = args[++i];
        break;
      case '--onboarding-processing-id':
      case '-o':
        options.onboardingProcessingId = args[++i];
        break;
      case '--section-title':
      case '-s':
        options.sectionTitle = args[++i];
        break;
      case '--item-title':
      case '-i':
        options.itemTitle = args[++i];
        break;
      case '--check-config':
      case '-k':
        options.checkConfig = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Add Onboarding Check CLI Tool

Usage: pnpm run add-onboarding-check [options]

Options:
  -e, --event-type <type>              Event type (required)
  -c, --checklist-instance-id <id>     Checklist instance ID (required)
  -r, --registration-id <id>           Registration ID (required)
  -o, --onboarding-processing-id <id>  Onboarding processing ID (required)
  -s, --section-title <title>          Section title (required)
  -i, --item-title <title>             Item title (required)
  -k, --check-config <json>            Check configuration as JSON string (optional)
  -h, --help                           Show this help message

Valid Event Types:
  ${VALID_EVENT_TYPES.join('\n  ')}

Examples:
  # Add a duplicate registration check
  pnpm run add-onboarding-check \\
    --event-type ONBOARDING_CHECK_DUPLICATE_REGISTRATION \\
    --checklist-instance-id 507f1f77bcf86cd799439011 \\
    --registration-id REG-12345 \\
    --onboarding-processing-id 507f1f77bcf86cd799439012 \\
    --section-title "Company Verification" \\
    --item-title "Check for duplicate company registrations"

  # Add a wallet uniqueness check with custom config
  pnpm run add-onboarding-check \\
    --event-type ONBOARDING_CHECK_WALLET_UNIQUENESS \\
    --checklist-instance-id 507f1f77bcf86cd799439011 \\
    --registration-id REG-12345 \\
    --onboarding-processing-id 507f1f77bcf86cd799439012 \\
    --section-title "Wallet Verification" \\
    --item-title "Check wallet address uniqueness" \\
    --check-config '{"timeout": 30000, "retryAttempts": 5}'
`);
}

function validateOptions(options: CliOptions): string[] {
  const errors: string[] = [];
  if (!options.eventType) {
    errors.push('--event-type is required');
  } else if (!VALID_EVENT_TYPES.includes(options.eventType)) {
    errors.push(`Invalid event type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  if (!options.checklistInstanceId) {
    errors.push('--checklist-instance-id is required');
  }

  if (!options.registrationId) {
    errors.push('--registration-id is required');
  }

  if (!options.onboardingProcessingId) {
    errors.push('--onboarding-processing-id is required');
  }

  if (!options.sectionTitle) {
    errors.push('--section-title is required');
  }

  if (!options.itemTitle) {
    errors.push('--item-title is required');
  }

  if (options.checkConfig) {
    try {
      JSON.parse(options.checkConfig);
    } catch (error) {
      errors.push('--check-config must be valid JSON');
    }
  }

  return errors;
}

async function addOnboardingCheck() {
  const options = parseArguments();

  if (options.help) {
    printHelp();
    return;
  }

  const errors = validateOptions(options);
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nUse --help for usage information');
    process.exit(1);
  }

  let checksQueue: Queue;
  try {
    console.log('🔗 Connecting to Redis queue...');
    
    // Get Redis connection details from environment
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    
    console.log(`   Redis: ${redisHost}:${redisPort}`);
    
    // Create queue connection
    checksQueue = new Queue(OnboardingQueues.ONBOARDING_CHECKS, {
      connection: {
        host: redisHost,
        port: redisPort,
        password: redisPassword,
      },
    });

    // Parse check config if provided
    let checkConfig: Record<string, any> | undefined;
    if (options.checkConfig) {
      try {
        checkConfig = JSON.parse(options.checkConfig);
      } catch (error) {
        console.error('❌ Failed to parse check config JSON:', error.message);
        process.exit(1);
      }
    }

    // Prepare job data
    const jobData: OnboardingCheckEventData = {
      checklistInstanceId: options.checklistInstanceId,
      registrationId: options.registrationId,
      onboardingProcessingId: options.onboardingProcessingId,
      sectionTitle: options.sectionTitle,
      itemTitle: options.itemTitle,
      checkConfig
    };

    console.log('📤 Adding job to queue...');
    console.log('Job data:', JSON.stringify(jobData, null, 2));

    // Add job to queue
    const job = await checksQueue.add(
      options.eventType,
      jobData,
      {
        attempts: checkConfig?.retryAttempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    console.log('✅ Job added successfully!');
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Event Type: ${options.eventType}`);
    console.log(`   Queue: ${OnboardingQueues.ONBOARDING_CHECKS}`);
    console.log(`   Registration ID: ${options.registrationId}`);
    console.log(`   Checklist Instance ID: ${options.checklistInstanceId}`);

    // Wait a moment for processing
    console.log('\n⏳ Waiting for job to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check job status
    const jobState = await job.getState();
    console.log(`📊 Job state: ${jobState}`);

    if (jobState === 'completed') {
      console.log('🎉 Job completed successfully!');
    } else if (jobState === 'failed') {
      console.log('❌ Job failed. Check the logs for details.');
      const failedReason = job.failedReason;
      if (failedReason) {
        console.log(`   Failure reason: ${failedReason}`);
      }
    } else {
      console.log(`⏳ Job is ${jobState}. It may still be processing...`);
    }

  } catch (error) {
    console.error('❌ Error adding onboarding check:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (checksQueue) {
      console.log('🔄 Closing queue connection...');
      await checksQueue.close();
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the CLI
addOnboardingCheck().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
