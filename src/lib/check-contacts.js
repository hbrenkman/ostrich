import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkContacts() {
  try {
    console.log('Checking contacts table...');
    
    // Try to query the contacts table
    const { data, error } = await supabase
      .from('contacts')
      .select('*');
    
    if (error) {
      console.error('Error querying contacts:', error);
      return false;
    }
    
    console.log(`Found ${data.length} contacts:`);
    data.forEach(contact => {
      console.log(`- ${contact.first_name} ${contact.last_name} (${contact.email})`);
    });
    
    return data.length > 0;
  } catch (error) {
    console.error('Error checking contacts:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  checkContacts().then(success => {
    console.log(`Contacts check ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { checkContacts };