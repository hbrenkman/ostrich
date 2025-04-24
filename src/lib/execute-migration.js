import { supabase } from './supabaseUtils.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function executeMigration(migrationFile) {
  try {
    console.log(`Executing migration: ${migrationFile}`);
    
    // Read the SQL file
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL directly
    console.log('Executing SQL directly...');
    const { error: sqlError } = await supabase.sql(sql);
    
    if (sqlError) {
      console.error('Error executing SQL directly:', sqlError);
      return false;
    }
    
    console.log(`Migration ${migrationFile} executed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error executing migration ${migrationFile}:`, error);
    return false;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Please provide a migration file name');
    process.exit(1);
  }
  
  executeMigration(migrationFile).then(success => {
    console.log(`Migration execution ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { executeMigration };