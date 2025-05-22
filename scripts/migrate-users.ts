import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  try {
    // Read users from config file
    const configPath = path.join(process.cwd(), 'public', 'users', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const { users } = JSON.parse(configData);

    console.log(`Found ${users.length} users to migrate`);

    // Migrate each user
    for (const user of users) {
      console.log(`Migrating user: ${user.email}`);

      // Create user in Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        },
        app_metadata: {
          role: user.role
        }
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error);
        continue;
      }

      console.log(`Successfully migrated user: ${user.email}`);
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers(); 