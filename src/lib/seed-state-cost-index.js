import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// US States with major metro areas and cost index values
export const states_with_metro_areas = [
  { "state": "Alabama", "metros": [{ "name": "Birmingham", "index": 87.2 }, { "name": "Mobile", "index": 85.6 }, { "name": "Other", "index": 86.0 }] },
  { "state": "Alaska", "metros": [{ "name": "Anchorage", "index": 128.4 }, { "name": "Other", "index": 125.0 }] },
  { "state": "Arizona", "metros": [{ "name": "Phoenix", "index": 102.1 }, { "name": "Tucson", "index": 98.7 }, { "name": "Other", "index": 99.5 }] },
  { "state": "Arkansas", "metros": [{ "name": "Little Rock", "index": 88.5 }, { "name": "Other", "index": 86.2 }] },
  { "state": "California", "metros": [{ "name": "Los Angeles", "index": 148.6 }, { "name": "San Francisco", "index": 186.4 }, { "name": "San Diego", "index": 142.3 }, { "name": "Other", "index": 138.5 }] },
  { "state": "Colorado", "metros": [{ "name": "Denver", "index": 112.1 }, { "name": "Colorado Springs", "index": 104.5 }, { "name": "Other", "index": 103.0 }] },
  { "state": "Connecticut", "metros": [{ "name": "Hartford", "index": 115.7 }, { "name": "New Haven", "index": 112.9 }, { "name": "Other", "index": 110.5 }] },
  { "state": "Delaware", "metros": [{ "name": "Wilmington", "index": 107.9 }, { "name": "Other", "index": 104.2 }] },
  { "state": "Florida", "metros": [{ "name": "Miami", "index": 116.5 }, { "name": "Orlando", "index": 101.4 }, { "name": "Tampa", "index": 100.1 }, { "name": "Other", "index": 98.7 }] },
  { "state": "Georgia", "metros": [{ "name": "Atlanta", "index": 98.7 }, { "name": "Savannah", "index": 94.8 }, { "name": "Other", "index": 92.5 }] },
  { "state": "Hawaii", "metros": [{ "name": "Honolulu", "index": 192.3 }, { "name": "Other", "index": 185.0 }] },
  { "state": "Idaho", "metros": [{ "name": "Boise", "index": 97.8 }, { "name": "Other", "index": 94.3 }] },
  { "state": "Illinois", "metros": [{ "name": "Chicago", "index": 106.9 }, { "name": "Springfield", "index": 89.3 }, { "name": "Other", "index": 92.1 }] },
  { "state": "Indiana", "metros": [{ "name": "Indianapolis", "index": 91.5 }, { "name": "Fort Wayne", "index": 87.8 }, { "name": "Other", "index": 88.4 }] },
  { "state": "Iowa", "metros": [{ "name": "Des Moines", "index": 90.1 }, { "name": "Cedar Rapids", "index": 89.5 }, { "name": "Other", "index": 87.8 }] },
  { "state": "Kansas", "metros": [{ "name": "Wichita", "index": 88.4 }, { "name": "Kansas City", "index": 91.2 }, { "name": "Other", "index": 87.5 }] },
  { "state": "Kentucky", "metros": [{ "name": "Louisville", "index": 91.6 }, { "name": "Lexington", "index": 90.8 }, { "name": "Other", "index": 88.9 }] },
  { "state": "Louisiana", "metros": [{ "name": "New Orleans", "index": 96.4 }, { "name": "Baton Rouge", "index": 93.7 }, { "name": "Other", "index": 91.5 }] },
  { "state": "Maine", "metros": [{ "name": "Portland", "index": 117.2 }, { "name": "Other", "index": 112.8 }] },
  { "state": "Maryland", "metros": [{ "name": "Baltimore", "index": 113.5 }, { "name": "Rockville", "index": 139.8 }, { "name": "Other", "index": 110.2 }] },
  { "state": "Massachusetts", "metros": [{ "name": "Boston", "index": 148.4 }, { "name": "Worcester", "index": 114.1 }, { "name": "Other", "index": 120.5 }] },
  { "state": "Michigan", "metros": [{ "name": "Detroit", "index": 94.3 }, { "name": "Grand Rapids", "index": 92.8 }, { "name": "Other", "index": 90.6 }] },
  { "state": "Minnesota", "metros": [{ "name": "Minneapolis", "index": 106.3 }, { "name": "Rochester", "index": 98.7 }, { "name": "Other", "index": 97.4 }] },
  { "state": "Mississippi", "metros": [{ "name": "Jackson", "index": 84.3 }, { "name": "Other", "index": 82.1 }] },
  { "state": "Missouri", "metros": [{ "name": "St. Louis", "index": 90.5 }, { "name": "Kansas City", "index": 91.2 }, { "name": "Other", "index": 87.8 }] },
  { "state": "Montana", "metros": [{ "name": "Billings", "index": 100.1 }, { "name": "Other", "index": 97.5 }] },
  { "state": "Nebraska", "metros": [{ "name": "Omaha", "index": 92.3 }, { "name": "Lincoln", "index": 91.5 }, { "name": "Other", "index": 89.2 }] },
  { "state": "Nevada", "metros": [{ "name": "Las Vegas", "index": 104.5 }, { "name": "Reno", "index": 107.8 }, { "name": "Other", "index": 102.3 }] },
  { "state": "New Hampshire", "metros": [{ "name": "Manchester", "index": 109.7 }, { "name": "Other", "index": 106.5 }] },
  { "state": "New Jersey", "metros": [{ "name": "Newark", "index": 125.1 }, { "name": "Jersey City", "index": 128.6 }, { "name": "Other", "index": 120.3 }] },
  { "state": "New Mexico", "metros": [{ "name": "Albuquerque", "index": 93.5 }, { "name": "Santa Fe", "index": 106.2 }, { "name": "Other", "index": 91.8 }] },
  { "state": "New York", "metros": [{ "name": "New York City", "index": 187.2 }, { "name": "Buffalo", "index": 97.7 }, { "name": "Other", "index": 110.5 }] },
  { "state": "North Carolina", "metros": [{ "name": "Charlotte", "index": 97.9 }, { "name": "Raleigh", "index": 102.3 }, { "name": "Other", "index": 95.4 }] },
  { "state": "North Dakota", "metros": [{ "name": "Fargo", "index": 93.9 }, { "name": "Other", "index": 91.2 }] },
  { "state": "Ohio", "metros": [{ "name": "Columbus", "index": 93.3 }, { "name": "Cleveland", "index": 91.8 }, { "name": "Cincinnati", "index": 92.4 }, { "name": "Other", "index": 90.1 }] },
  { "state": "Oklahoma", "metros": [{ "name": "Oklahoma City", "index": 88.3 }, { "name": "Tulsa", "index": 87.9 }, { "name": "Other", "index": 85.6 }] },
  { "state": "Oregon", "metros": [{ "name": "Portland", "index": 116.8 }, { "name": "Eugene", "index": 107.9 }, { "name": "Other", "index": 105.2 }] },
  { "state": "Pennsylvania", "metros": [{ "name": "Philadelphia", "index": 115.2 }, { "name": "Pittsburgh", "index": 101.2 }, { "name": "Other", "index": 98.7 }] },
  { "state": "Rhode Island", "metros": [{ "name": "Providence", "index": 119.4 }, { "name": "Other", "index": 115.8 }] },
  { "state": "South Carolina", "metros": [{ "name": "Charleston", "index": 98.6 }, { "name": "Columbia", "index": 93.2 }, { "name": "Other", "index": 91.5 }] },
  { "state": "South Dakota", "metros": [{ "name": "Sioux Falls", "index": 93.6 }, { "name": "Other", "index": 90.8 }] },
  { "state": "Tennessee", "metros": [{ "name": "Nashville", "index": 96.8 }, { "name": "Memphis", "index": 91.8 }, { "name": "Other", "index": 90.5 }] },
  { "state": "Texas", "metros": [{ "name": "Dallas", "index": 101.6 }, { "name": "Houston", "index": 103.5 }, { "name": "Austin", "index": 106.3 }, { "name": "Other", "index": 98.2 }] },
  { "state": "Utah", "metros": [{ "name": "Salt Lake City", "index": 104.7 }, { "name": "Wasatch Front", "index": 102.3 }, { "name": "Other", "index": 99.8 }] },
  { "state": "Vermont", "metros": [{ "name": "Burlington", "index": 114.5 }, { "name": "Other", "index": 110.2 }] },
  { "state": "Virginia", "metros": [{ "name": "Richmond", "index": 99.2 }, { "name": "Virginia Beach", "index": 100.3 }, { "name": "Other", "index": 97.5 }] },
  { "state": "Washington", "metros": [{ "name": "Seattle", "index": 134.7 }, { "name": "Spokane", "index": 103.1 }, { "name": "Other", "index": 108.5 }] },
  { "state": "West Virginia", "metros": [{ "name": "Charleston", "index": 89.5 }, { "name": "Other", "index": 86.3 }] },
  { "state": "Wisconsin", "metros": [{ "name": "Milwaukee", "index": 97.9 }, { "name": "Madison", "index": 101.5 }, { "name": "Other", "index": 94.7 }] },
  { "state": "Wyoming", "metros": [{ "name": "Cheyenne", "index": 98.7 }, { "name": "Other", "index": 95.4 }] }
];

/**
 * Seed the state_cost_index table with data.
 */
async function seedStateCostIndex() {
  try {
    console.log('Starting to seed state cost index data...');
    console.log('Checking if state_cost_index exists...');
    
    // Check if table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('state_cost_index')
      .select('count')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking state_cost_index table:', tableCheckError);
      console.log('Table may not exist, skipping seeding');
      return false;
    }
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('state_cost_index')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('Cleared existing data');
    
    // Insert new data
    for (const stateData of states_with_metro_areas) {
      const state = stateData.state;
      
      for (const metro of stateData.metros) {
        const data = {
          state: state,
          metro_area: metro.name,
          cost_index: metro.index
        };
        
        const { error: insertError } = await supabase
          .from('state_cost_index')
          .insert(data);
        
        if (insertError) {
          console.error(`Error inserting data for ${state}, ${metro.name}:`, insertError);
        }
      }
    }
    
    console.log('State cost index data seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding state cost index data:', error);
    return false;
  }
}

// Run the seed function
if (require.main === module) {
  seedStateCostIndex().then(success => {
    console.log(`State cost index seeding ${success ? 'succeeded' : 'failed'}.`);
    if (!success) {
      process.exit(1);
    }
  });
}

export { seedStateCostIndex };