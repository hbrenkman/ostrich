import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
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
    
    await supabase.sql(createTableSQL);
    
    // Step 2: Clear existing data
    await supabase
      .from('contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Step 3: Get client IDs
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');
    
    if (clientsError) {
      throw new Error(`Error fetching clients: ${clientsError.message}`);
    }
    
    if (!clients || clients.length === 0) {
      throw new Error('No clients found, cannot associate contacts');
    }
    
    // Step 4: Insert sample contacts
    // Map company names to client IDs
    const clientMap: Record<string, string> = {};
    clients.forEach(client => {
      clientMap[client.name] = client.id;
    });
    
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
    const insertPromises = contactsData.map(contact => {
      const clientId = clientMap[contact.company];
      
      if (!clientId) {
        console.warn(`Could not find client ID for company: ${contact.company}`);
        return Promise.resolve();
      }
      
      return supabase
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
    });
    
    await Promise.all(insertPromises);
    
    // Step 5: Verify contacts were inserted
    const { data: contacts, error: verifyError } = await supabase
      .from('contacts')
      .select('*');
    
    if (verifyError) {
      throw new Error(`Error verifying contacts: ${verifyError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contacts seeded successfully',
        count: contacts.length,
        contacts: contacts
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});