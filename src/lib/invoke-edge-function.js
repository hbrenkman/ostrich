import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function invokeSeedContactsFunction() {
  try {
    console.log('Invoking seed-contacts edge function...');
    
    const { data, error } = await supabase.functions.invoke('seed-contacts');
    
    if (error) {
      console.error('Error invoking seed-contacts function:', error);
      return false;
    }
    
    console.log('Seed contacts function response:', data);
    return true;
  } catch (error) {
    console.error('Exception invoking seed-contacts function:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  invokeSeedContactsFunction().then(success => {
    console.log(`Invoking seed-contacts function ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { invokeSeedContactsFunction };