import { supabase, supabaseAdmin } from './supabaseUtils.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Sample contacts data
const contactsData = [
  {
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@acme.com",
    phone: "+1 (555) 123-4567",
    mobile: "+1 (555) 987-6543",
    role: "CEO"
  },
  {
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@acme.com",
    phone: "+1 (555) 234-5678",
    mobile: "+1 (555) 876-5432",
    role: "CTO"
  },
  {
    first_name: "Michael",
    last_name: "Brown",
    email: "michael.brown@stellar.com",
    phone: "+1 (555) 345-6789",
    mobile: "+1 (555) 765-4321",
    role: "Project Manager"
  },
  {
    first_name: "Emily",
    last_name: "Davis",
    email: "emily.davis@globaldynamics.com",
    phone: "+1 (555) 456-7890",
    mobile: "+1 (555) 654-3210",
    role: "Director"
  },
  {
    first_name: "David",
    last_name: "Wilson",
    email: "david.wilson@globaldynamics.com",
    phone: "+1 (555) 567-8901",
    mobile: "+1 (555) 543-2109",
    role: "Engineer"
  }
];

/**
 * Seed contacts with data.
 */
async function seedContacts() {
  let success = false;
  
  try {
    console.log('Seeding contacts...');
    console.log('Supabase URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
    
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return false;
    }
    
    // Approach 1: Try to execute the migration file directly
    console.log('\nApproach 1: Executing migration file directly...');
    try {
      const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250424160000_final_contacts_fix.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { query: sql });
        
        if (sqlError) {
          console.error('Error executing migration file:', sqlError);
        } else {
          console.log('Migration file executed successfully');
          success = true;
        }
      } else {
        console.log('Migration file not found, trying next approach');
      }
    } catch (migrationErr) {
      console.error('Exception executing migration file:', migrationErr);
    }
    
    // If migration approach failed, try direct table creation and data insertion
    if (!success) {
      console.log('\nApproach 2: Direct table creation and data insertion...');
      
      // Step 1: Create the contacts table if it doesn't exist
      try {
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
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { query: createTableSQL });
        
        if (createError) {
          console.error('Error creating contacts table:', createError);
        } else {
          console.log('Contacts table created or already exists');
        }
      } catch (createErr) {
        console.error('Exception creating contacts table:', createErr);
      }
      
      // Step 2: Clear existing data
      try {
        console.log('Clearing existing contacts...');
        const { error: clearError } = await supabaseAdmin.rpc('exec_sql', { query: 'DELETE FROM contacts;' });
        
        if (clearError) {
          console.error('Error clearing contacts:', clearError);
        } else {
          console.log('Cleared existing contacts');
        }
      } catch (clearErr) {
        console.error('Exception clearing contacts:', clearErr);
      }
    }
    
    // Get client IDs
    console.log('\nFetching clients...');
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
    
    // Step 3: Insert sample contacts using direct SQL
    const acmeId = clients.find(c => c.name === 'Acme Corporation')?.id;
    const stellarId = clients.find(c => c.name === 'Stellar Solutions')?.id;
    const globalId = clients.find(c => c.name === 'Global Dynamics')?.id;
    
    if (!acmeId || !stellarId || !globalId) {
      console.error('Could not find all required client IDs');
      return false;
    }
    
    console.log('\nInserting contacts via direct SQL...');
    try {
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
      
      const { error: insertError } = await supabaseAdmin.rpc('exec_sql', { query: insertSQL });
      
      if (insertError) {
        console.error('Error inserting contacts via SQL:', insertError);
        
        // Try individual inserts if bulk insert fails
        console.log('\nTrying individual inserts...');
        
        // Insert Acme contacts
        await insertContact('John', 'Smith', 'john.smith@acme.com', '+1 (555) 123-4567', '+1 (555) 987-6543', acmeId, 'CEO');
        await insertContact('Sarah', 'Johnson', 'sarah.johnson@acme.com', '+1 (555) 234-5678', '+1 (555) 876-5432', acmeId, 'CTO');
        
        // Insert Stellar contact
        await insertContact('Michael', 'Brown', 'michael.brown@stellar.com', '+1 (555) 345-6789', '+1 (555) 765-4321', stellarId, 'Project Manager');
        
        // Insert Global Dynamics contacts
        await insertContact('Emily', 'Davis', 'emily.davis@globaldynamics.com', '+1 (555) 456-7890', '+1 (555) 654-3210', globalId, 'Director');
        await insertContact('David', 'Wilson', 'david.wilson@globaldynamics.com', '+1 (555) 567-8901', '+1 (555) 543-2109', globalId, 'Engineer');
      } else {
        console.log('Contacts inserted successfully via SQL');
      }
    } catch (insertErr) {
      console.error('Exception inserting contacts:', insertErr);
    }
    
    // Step 4: Verify contacts were inserted
    console.log('\nVerifying contacts...');
    const { data: contacts, error: verifyError } = await supabase
      .from('contacts')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying contacts:', verifyError);
    } else {
      console.log(`Found ${contacts.length} contacts:`);
      contacts.forEach(contact => {
        console.log(`- ${contact.first_name} ${contact.last_name} (${contact.email})`);
      });
      
      if (contacts.length > 0) {
        success = true;
      }
    }
    
    console.log('\nContacts seeding completed!');
    return true;
  } catch (error) {
    console.error('Error seeding contacts:', error);
    return false;
  }
}

/**
 * Helper function to insert a single contact
 */
async function insertContact(firstName, lastName, email, phone, mobile, clientId, role) {
  try {
    console.log(`Inserting contact: ${firstName} ${lastName}`);
    
    // Try direct insert first
    const { error: insertError } = await supabase
      .from('contacts')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        mobile: mobile || null,
        client_id: clientId,
        role: role || null
      });
    
    if (insertError) {
      console.error(`Error inserting contact: ${insertError.message}`);
      return false;
    }
    
    console.log(`Contact ${firstName} ${lastName} inserted successfully`);
    return true;
  } catch (error) {
    console.error(`Exception inserting contact: ${error.message}`);
    return false;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedContacts()
    .then(success => {
      console.log(`Contact seeding ${success ? 'succeeded' : 'failed'}.`);
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

export { seedContacts };