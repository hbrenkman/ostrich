import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixContactsTable() {
  try {
    console.log('Fixing contacts table...');
    console.log('Supabase URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
    
    // Step 1: Drop the contacts table if it exists
    console.log('Dropping contacts table if it exists...');
    const dropSQL = `
      DROP TABLE IF EXISTS contacts CASCADE;
    `;
    
    const { error: dropError } = await supabase.sql(dropSQL);
    
    if (dropError) {
      console.error('Error dropping contacts table:', dropError);
    } else {
      console.log('Contacts table dropped successfully');
    }
    
    // Step 2: Create the contacts table
    console.log('Creating contacts table...');
    const createSQL = `
      CREATE TABLE contacts (
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
      CREATE INDEX contacts_email_idx ON contacts(email);
      
      -- Create index on client_id for faster joins
      CREATE INDEX contacts_client_id_idx ON contacts(client_id);
      
      -- Disable RLS
      ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: createError } = await supabase.sql(createSQL);
    
    if (createError) {
      console.error('Error creating contacts table:', createError);
      return false;
    } else {
      console.log('Contacts table created successfully');
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
    
    console.log('Inserting contacts...');
    
    // Insert contacts one by one to avoid SQL injection issues
    const contacts = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@acme.com', phone: '+1 (555) 123-4567', mobile: '+1 (555) 987-6543', client_id: acmeId, role: 'CEO' },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@acme.com', phone: '+1 (555) 234-5678', mobile: '+1 (555) 876-5432', client_id: acmeId, role: 'CTO' },
      { first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@stellar.com', phone: '+1 (555) 345-6789', mobile: '+1 (555) 765-4321', client_id: stellarId, role: 'Project Manager' },
      { first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@globaldynamics.com', phone: '+1 (555) 456-7890', mobile: '+1 (555) 654-3210', client_id: globalId, role: 'Director' },
      { first_name: 'David', last_name: 'Wilson', email: 'david.wilson@globaldynamics.com', phone: '+1 (555) 567-8901', mobile: '+1 (555) 543-2109', client_id: globalId, role: 'Engineer' }
    ];
    
    for (const contact of contacts) {
      const { error: insertError } = await supabase
        .from('contacts')
        .insert(contact);
      
      if (insertError) {
        console.error(`Error inserting contact ${contact.first_name} ${contact.last_name}:`, insertError);
      } else {
        console.log(`Inserted contact: ${contact.first_name} ${contact.last_name}`);
      }
    }
    
    // Step 5: Verify contacts were inserted
    console.log('Verifying contacts...');
    const { data: verifyContacts, error: verifyError } = await supabase
      .from('contacts')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying contacts:', verifyError);
      return false;
    }
    
    console.log(`Found ${verifyContacts.length} contacts:`);
    verifyContacts.forEach(contact => {
      console.log(`- ${contact.first_name} ${contact.last_name} (${contact.email})`);
    });
    
    return verifyContacts.length > 0;
  } catch (error) {
    console.error('Error fixing contacts table:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixContactsTable().then(success => {
    console.log(`Fixing contacts table ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { fixContactsTable };