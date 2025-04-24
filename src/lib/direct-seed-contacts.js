import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function directSeedContacts() {
  try {
    console.log('Directly seeding contacts via SQL...');
    console.log('Supabase URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
    
    // Step 1: Create the contacts table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text NOT NULL,
        phone text,
        mobile text,
        client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
        role text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      
      -- Create index on email for faster lookups
      CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
      
      -- Create index on client_id for faster joins
      CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts(client_id);
      
      -- Disable RLS for now
      ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
    `;
    
    console.log('Creating contacts table...');
    const { error: createError } = await supabase.sql(createTableSQL);
    
    if (createError) {
      console.error('Error creating contacts table:', createError);
      return false;
    }
    
    // Step 2: Clear existing data
    console.log('Clearing existing contacts...');
    const { error: clearError } = await supabase.sql('DELETE FROM contacts;');
    
    if (clearError) {
      console.error('Error clearing contacts:', clearError);
      // Continue anyway
    }
    
    // Step 3: Get client IDs
    console.log('Fetching clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');
    
    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return false;
    }
    
    if (!clients || clients.length === 0) {
      console.error('No clients found, cannot associate contacts');
      return false;
    }
    
    console.log('Found clients:', clients.map(c => c.name).join(', '));
    
    // Step 4: Insert sample contacts
    const acmeId = clients.find(c => c.name === 'Acme Corporation')?.id;
    const stellarId = clients.find(c => c.name === 'Stellar Solutions')?.id;
    const globalId = clients.find(c => c.name === 'Global Dynamics')?.id;
    
    if (!acmeId || !stellarId || !globalId) {
      console.error('Could not find all required client IDs');
      return false;
    }
    
    const insertSQL = `
      -- Insert Acme Corporation contacts
      INSERT INTO contacts (first_name, last_name, email, phone, mobile, client_id, role)
      VALUES 
        ('John', 'Smith', 'john.smith@acme.com', '+1 (555) 123-4567', '+1 (555) 987-6543', '${acmeId}', 'CEO'),
        ('Sarah', 'Johnson', 'sarah.johnson@acme.com', '+1 (555) 234-5678', '+1 (555) 876-5432', '${acmeId}', 'CTO');
      
      -- Insert Stellar Solutions contacts
      INSERT INTO contacts (first_name, last_name, email, phone, mobile, client_id, role)
      VALUES 
        ('Michael', 'Brown', 'michael.brown@stellar.com', '+1 (555) 345-6789', '+1 (555) 765-4321', '${stellarId}', 'Project Manager');
      
      -- Insert Global Dynamics contacts
      INSERT INTO contacts (first_name, last_name, email, phone, mobile, client_id, role)
      VALUES 
        ('Emily', 'Davis', 'emily.davis@globaldynamics.com', '+1 (555) 456-7890', '+1 (555) 654-3210', '${globalId}', 'Director'),
        ('David', 'Wilson', 'david.wilson@globaldynamics.com', '+1 (555) 567-8901', '+1 (555) 543-2109', '${globalId}', 'Engineer');
    `;
    
    console.log('Inserting contacts...');
    const { error: insertError } = await supabase.sql(insertSQL);
    
    if (insertError) {
      console.error('Error inserting contacts:', insertError);
      return false;
    }
    
    // Step 5: Verify contacts were inserted
    console.log('Verifying contacts...');
    const { data: contactCount, error: countError } = await supabase
      .from('contacts')
      .select('count');
    
    if (countError) {
      console.error('Error counting contacts:', countError);
    } else {
      console.log(`Contacts in database: ${contactCount.length}`);
    }
    
    console.log('Contacts seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error in directSeedContacts:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  directSeedContacts().then(success => {
    console.log(`Direct contacts seeding ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { directSeedContacts };