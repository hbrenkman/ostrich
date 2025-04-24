// src/lib/supabase-migrations.js
import { supabaseAdmin } from './supabaseUtils.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createTables } from './create-tables.js';
import { seedAllData } from './seed-data.js';

// Load environment variables
dotenv.config();

/**
 * Run SQL migrations on Supabase.
 * @returns {Promise<boolean>} - Whether the migrations were successful
 */
async function runMigrations() {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available. Falling back to direct table creation.');
      return await createTablesAndSeedData();
    }

    console.log('Starting migrations...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Supabase Service Role Key (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...');

    // Get the migrations directory
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    // Get all SQL files in the migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure they run in order

    if (migrationFiles.length === 0) {
      console.log("No migration files found.");
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files.`);

    // Run each migration
    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName);
      console.log(`Running migration: ${fileName}`);
      console.log(`Migration file path: ${filePath}`);

      // Read the SQL file
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute the SQL via a custom Edge Function
      const { data, error } = await supabaseAdmin.functions.invoke('execute-sql', {
        body: { query: sql }
      });

      if (error) {
        console.error(`Error running migration ${fileName}:`, error);
        continue;
      }

      console.log(`Migration ${fileName} completed successfully.`, data);
    }

    console.log("All migrations completed.");
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    console.log('Falling back to direct table creation...');
    return await createTablesAndSeedData();
  }
}

/**
 * Create tables and seed data directly using the Supabase client.
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
async function createTablesAndSeedData() {
  try {
    console.log('Creating tables directly...');
    const tablesCreated = await createTables();
    
    if (tablesCreated) {
      console.log('Tables created successfully, seeding data...');
      await seedAllData();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating tables and seeding data:', error);
    return false;
  }
}

// Run the migrations if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  runMigrations();
}

export { runMigrations, createTablesAndSeedData };