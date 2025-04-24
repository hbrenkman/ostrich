import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

async function adminSeedContacts() {
  try {
    console.log('Seeding contacts using service role key...');
    
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      console.log('SUPABASE_URL:', supabaseUrl);
      console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[REDACTED]' : 'undefined');
      return false;
    }
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key (first 10 chars):', supabaseServiceKey.substring(0, 10) + '...');
    
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Step 1: Create the contacts table if it doesn't exist
    console.log('Creating contacts table...');
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
    
    const { error: createError } = await supabaseAdmin.sql(createTableSQL);
    
    if (createError) {
      console.error('Error creating contacts table:', createError);
    }
    
    // Step 2: Clear existing data
    console.log('Clearing existing contacts...');
    const { error: clearError } = await supabaseAdmin
      .from('contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (clearError) {
      console.error('Error clearing contacts:', clearError);
    }
    
    // Step 3: Get client IDs
    console.log('Fetching clients...');
    const { data: clients, error: clientsError } = await supabaseAdmin
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
    console.log('Inserting contacts...');
    
    // Map company names to client IDs
    const clientMap = {
      'Acme Corporation': clients.find(c => c.name === 'Acme Corporation')?.id,
      'Stellar Solutions': clients.find(c => c.name === 'Stellar Solutions')?.id,
      'Global Dynamics': clients.find(c => c.name === 'Global Dynamics')?.id
    };
    
    // Sample contacts data
    const contactsData = [
      {
        first_name: "John",
        last_name: "Smith",
        email: "john.smith@acme.com",
        phone: "+1 (555) 123-4567",
        mobile: "+1 (555) 987-6543",
        company: "Acme Corporation",
        role: "CEO"
      },
      {
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.johnson@acme.com",
        phone: "+1 (555) 234-5678",
        mobile: "+1 (555) 876-5432",
        company: "Acme Corporation",
        role: "CTO"
      },
      {
        first_name: "Michael",
        last_name: "Brown",
        email: "michael.brown@stellar.com",
        phone: "+1 (555) 345-6789",
        mobile: "+1 (555) 765-4321",
        company: "Stellar Solutions",
        role: "Project Manager"
      },
      {
        first_name: "Emily",
        last_name: "Davis",
        email: "emily.davis@globaldynamics.com",
        phone: "+1 (555) 456-7890",
        mobile: "+1 (555) 654-3210",
        company: "Global Dynamics",
        role: "Director"
      },
      {
        first_name: "David",
        last_name: "Wilson",
        email: "david.wilson@globaldynamics.com",
        phone: "+1 (555) 567-8901",
        mobile: "+1 (555) 543-2109",
        company: "Global Dynamics",
        role: "Engineer"
      }
    ];
    
    // Insert contacts
    for (const contact of contactsData) {
      const clientId = clientMap[contact.company];
      
      if (!clientId) {
        console.warn(`Could not find client ID for company: ${contact.company}`);
        continue;
      }
      
      const { error: insertError } = await supabaseAdmin
        .from('contacts')
        .insert({
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          mobile: contact.mobile,
          client_id: clientId,
          role: contact.role
        });
      
      if (insertError) {
        console.error(`Error inserting contact ${contact.first_name} ${contact.last_name}:`, insertError);
      } else {
        console.log(`Inserted contact: ${contact.first_name} ${contact.last_name}`);
      }
    }
    
    // Step 5: Verify contacts were inserted
    console.log('Verifying contacts...');
    const { data: contacts, error: verifyError } = await supabaseAdmin
      .from('contacts')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying contacts:', verifyError);
      return false;
    }
    
    console.log(`Found ${contacts.length} contacts:`);
    contacts.forEach(contact => {
      console.log(`- ${contact.first_name} ${contact.last_name} (${contact.email})`);
    });
    
    return contacts.length > 0;
  } catch (error) {
    console.error('Error in adminSeedContacts:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  adminSeedContacts().then(success => {
    console.log(`Admin contacts seeding ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { adminSeedContacts };