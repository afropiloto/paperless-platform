import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { EmailClientModule } from './email-client.module';
import { EMAIL_CLIENT_SERVICE } from './email-client.constants';
import { EmailClientInterface } from './types';
import { DummyEmailProvider } from './providers/dummy/dummy-email.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          EMAIL_PROVIDER_TYPE: 'dummy',
          EMAIL_SERVICE_API_KEY: 'dummy-key',
          EMAIL_SERVICE_SENDER_EMAIL: 'test@example.com',
          // Enable disk storage for demo
          DUMMY_EMAIL_DISK_STORAGE_ENABLED: true,
          DUMMY_EMAIL_DISK_STORAGE_DIRECTORY: './demo-emails',
          DUMMY_EMAIL_DISK_STORAGE_FORMAT: 'both',
          DUMMY_EMAIL_DISK_STORAGE_INCLUDE_METADATA: true,
        }),
      ],
    }),
    EmailClientModule,
  ],
})
class DemoModule {}

async function demonstrateDummyProvider() {
  console.log('🚀 Demonstrating Dummy Email Provider\n');

  // Create a minimal NestJS application
  const app = await NestFactory.createApplicationContext(DemoModule);

  // Get the email client service
  const emailClient = app.get<EmailClientInterface>(EMAIL_CLIENT_SERVICE);
  
  console.log(`📧 Email Client initialized with provider: ${emailClient.getProviderName()}\n`);

  // Send some test emails
  console.log('📤 Sending test emails...\n');

  const testEmails = [
    {
      to: 'user1@example.com',
      subject: 'Welcome to Our Platform',
      htmlContent: '<h1>Welcome!</h1><p>Thank you for joining our platform.</p>',
      textContent: 'Welcome! Thank you for joining our platform.',
    },
    {
      to: 'user2@example.com',
      subject: 'Password Reset Request',
      htmlContent: '<h1>Password Reset</h1><p>Click the link to reset your password.</p>',
      textContent: 'Password Reset: Click the link to reset your password.',
    },
    {
      to: ['admin@example.com', 'support@example.com'],
      subject: 'System Notification',
      htmlContent: '<h1>System Update</h1><p>The system has been updated successfully.</p>',
      textContent: 'System Update: The system has been updated successfully.',
    },
  ];

  for (const emailOptions of testEmails) {
    console.log(`📨 Sending email to: ${Array.isArray(emailOptions.to) ? emailOptions.to.join(', ') : emailOptions.to}`);
    console.log(`   Subject: ${emailOptions.subject}`);
    
    const result = await emailClient.sendEmail(emailOptions);
    
    console.log(`   Status: ${result.status}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Sent at: ${result.sentAt.toISOString()}\n`);
  }

  // Access the dummy provider to show stored emails
  const dummyProviderInstance = (emailClient as any).provider as DummyEmailProvider;
  
  console.log('📋 Stored Emails in Dummy Provider:\n');
  
  const storedEmails = await dummyProviderInstance.getStoredEmails();
  console.log(`Total emails stored: ${storedEmails.length}\n`);

  for (const email of storedEmails) {
    console.log(`📧 Email ID: ${email.id}`);
    console.log(`   To: ${Array.isArray(email.to) ? email.to.join(', ') : email.to}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Sent at: ${email.sentAt.toISOString()}`);
    console.log(`   Provider: ${email.provider}\n`);
  }

  // Demonstrate search functionality
  console.log('🔍 Search Functionality:\n');
  
  const user1Emails = await dummyProviderInstance.findByRecipient('user1@example.com');
  console.log(`Emails sent to user1@example.com: ${user1Emails.length}`);
  
  const welcomeEmails = await dummyProviderInstance.findBySubject('Welcome');
  console.log(`Emails with "Welcome" in subject: ${welcomeEmails.length}`);
  
  const systemEmails = await dummyProviderInstance.findBySubject('System');
  console.log(`Emails with "System" in subject: ${systemEmails.length}\n`);

  // Demonstrate disk storage configuration
  console.log('💾 Disk Storage Configuration:\n');
  const diskConfig = dummyProviderInstance.getDiskStorageConfig();
  console.log(`Disk storage enabled: ${diskConfig.enabled ? '✅ Yes' : '❌ No'}`);
  console.log(`Storage directory: ${diskConfig.directory}`);
  console.log(`Output format: ${diskConfig.format}`);
  console.log(`Include metadata: ${diskConfig.includeMetadata ? '✅ Yes' : '❌ No'}\n`);

  // Demonstrate health check
  console.log('🏥 Health Check:\n');
  const isHealthy = await emailClient.isHealthy();
  console.log(`Email provider health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  // Clean up
  console.log('🧹 Cleaning up stored emails...\n');
  await dummyProviderInstance.clearStoredEmails();
  
  const remainingEmails = await dummyProviderInstance.getStoredEmailCount();
  console.log(`Remaining emails after cleanup: ${remainingEmails}`);

  await app.close();
  console.log('\n✅ Demo completed successfully!');
}

// Run the demonstration
if (require.main === module) {
  demonstrateDummyProvider().catch(console.error);
}

export { demonstrateDummyProvider };
