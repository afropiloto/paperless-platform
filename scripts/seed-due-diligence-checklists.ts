import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { DueDiligenceChecklist, DueDiligenceChecklistSchema } from '../src/due-diligence-checklists/schemas/due-diligence-checklist.schema';
import { DueDiligenceChecklistType, CheckType } from '../src/due-diligence-checklists/types/due-diligence-checklists.types';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI as string;

// Load seed data from JSON file
const SEED_DATA_PATH = path.join(__dirname, 'seed-data', 'tradedocs.duediligencechecklists.json');

async function loadSeedData() {
  try {
    const fileContent = fs.readFileSync(SEED_DATA_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading seed data:', error);
    throw error;
  }
}

async function run() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  
  const DueDiligenceChecklistModel = mongoose.model(DueDiligenceChecklist.name, DueDiligenceChecklistSchema);

  try {
    // Load seed data from JSON file
    const seedData = await loadSeedData();
    console.log(`Loaded ${seedData.length} due diligence checklist(s) from seed data`);

    // Process each checklist
    for (const checklistData of seedData) {
      // Check if checklist already exists
      const existingChecklist = await DueDiligenceChecklistModel.findOne({ 
        checklistType: checklistData.checklistType,
        version: checklistData.version
      });

      if (existingChecklist) {
        console.log(`Due diligence checklist '${checklistData.checklistType}' version ${checklistData.version} already exists`);
      } else {
        // Create the checklist
        const checklist = new DueDiligenceChecklistModel(checklistData);
        await checklist.save();
        console.log(`Created due diligence checklist: ${checklistData.checklistType} version ${checklistData.version}`);
        console.log(`  - ${checklistData.sections.length} sections`);
        console.log(`  - ${checklistData.sections.reduce((total, section) => total + section.items.length, 0)} total items`);
      }
    }

    console.log(`Due diligence checklists seeding completed successfully`);
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('Error seeding due diligence checklists:', err);
  process.exit(1);
});
