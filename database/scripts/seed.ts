// Database seeding script - populate initial data
// Run this after migrations to seed the database with initial data

import { config } from 'dotenv';
import { join } from 'path';
import { getDatabasePool, closeDatabasePool } from '../connection';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });
import { ToolsRepository } from '../repositories/tools.repository';
import { PromptsRepository } from '../repositories/prompts.repository';
import { toolsDataset, promptsDataset } from '../../data/toolsData';

export async function seedDatabase() {
  console.log('Starting database seed...');
  const pool = getDatabasePool();
  const toolsRepo = new ToolsRepository();
  const promptsRepo = new PromptsRepository();

  try {
    // Seed tools
    console.log('Seeding tools...');
    for (const tool of toolsDataset) {
      await toolsRepo.upsert(tool);
    }
    console.log(`Seeded ${toolsDataset.length} tools`);

    // Seed prompts
    console.log('Seeding prompts...');
    for (const prompt of promptsDataset) {
      await promptsRepo.upsert(prompt);
    }
    console.log(`Seeded ${promptsDataset.length} prompts`);

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await closeDatabasePool();
  }
}

// Run if called directly
seedDatabase()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

