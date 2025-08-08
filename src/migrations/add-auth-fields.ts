import { connect, disconnect } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/tradedocs';

async function addAuthFields() {
  try {
    console.log('Connecting to MongoDB...');
    await connect(MONGODB_URI);
    
    console.log('Starting migration: Adding authentication fields to AccountUser collection...');
    
    const db = await connect(MONGODB_URI);
    const collection = db.connection.collection('accountusers');
    
    // Update all existing documents to add new fields with defaults
    const result = await collection.updateMany(
      {}, // Update all documents
      {
        $set: {
          authMethod: 'siwe', // Default to SIWE for existing users
          mfaEnabled: false,
          failedLoginAttempts: 0,
        },
        $setOnInsert: {
          // These fields will only be set if the document is being inserted
          // For existing documents, they'll remain undefined (which is fine)
        }
      },
      { upsert: false } // Don't create new documents
    );
    
    console.log(`Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} documents`);
    
    // Verify the migration
    const sampleDoc = await collection.findOne({});
    if (sampleDoc) {
      console.log('Sample document after migration:', {
        _id: sampleDoc._id,
        authMethod: sampleDoc.authMethod,
        mfaEnabled: sampleDoc.mfaEnabled,
        failedLoginAttempts: sampleDoc.failedLoginAttempts,
        hasPasswordHash: !!sampleDoc.passwordHash,
        hasMfaSecret: !!sampleDoc.mfaSecret,
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addAuthFields()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { addAuthFields }; 