// MongoDB initialization script
db = db.getSiblingDB('tradedocs');

// Create application user
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'tradedocs'
    }
  ]
});

// Create collections with basic indexes
db.createCollection('accounts');
db.createCollection('registrations');
db.createCollection('onboarding');
db.createCollection('dueDiligenceChecklists');
db.createCollection('dueDiligenceChecklistInstances');
db.createCollection('tradeDocuments');
db.createCollection('auditLogs');

// Create indexes for better performance
db.accounts.createIndex({ "email": 1 });
db.accounts.createIndex({ "company.name": 1 });
db.accounts.createIndex({ "walletAddress": 1 });

db.registrations.createIndex({ "registrationId": 1 });
db.registrations.createIndex({ "company.name": 1 });
db.registrations.createIndex({ "company.accountWalletAddress": 1 });
db.registrations.createIndex({ "status": 1 });

db.onboarding.createIndex({ "registrationId": 1 });
db.onboarding.createIndex({ "status": 1 });

db.dueDiligenceChecklists.createIndex({ "type": 1 });
db.dueDiligenceChecklists.createIndex({ "isActive": 1 });

db.dueDiligenceChecklistInstances.createIndex({ "checklistId": 1 });
db.dueDiligenceChecklistInstances.createIndex({ "createdAt": 1 });

db.tradeDocuments.createIndex({ "documentId": 1 });
db.tradeDocuments.createIndex({ "status": 1 });
db.tradeDocuments.createIndex({ "accountId": 1 });

db.auditLogs.createIndex({ "timestamp": 1 });
db.auditLogs.createIndex({ "subject": 1 });
db.auditLogs.createIndex({ "eventType": 1 });

print('Database initialization completed successfully');
