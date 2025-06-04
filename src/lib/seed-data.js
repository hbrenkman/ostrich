import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';
import { states_with_metro_areas } from './seed-state-cost-index.js';
import { seedContacts } from './seed-contacts.js';

// Load environment variables
dotenv.config();

// Sample data for reference tables
const referenceTablesData = [
  {
    name: 'Industries',
    category: 'Project Types',
    description: 'List of industry types for companies',
    entries: [
      { id: '1', key: 'Architecture', value: 'ARCH', description: 'Architecture firms and practices' },
      { id: '2', key: 'Engineering', value: 'ENG', description: 'Engineering firms and practices' },
      { id: '3', key: 'Construction', value: 'CON', description: 'Construction companies and contractors' },
      { id: '4', key: 'Real Estate', value: 'RE', description: 'Real estate development and management' },
      { id: '5', key: 'Technology', value: 'TECH', description: 'Technology companies and IT services' },
      { id: '6', key: 'Healthcare', value: 'HC', description: 'Healthcare providers and facilities' },
      { id: '7', key: 'Manufacturing', value: 'MFG', description: 'Manufacturing companies' },
      { id: '8', key: 'Retail', value: 'RET', description: 'Retail businesses' },
      { id: '9', key: 'Financial Services', value: 'FIN', description: 'Financial institutions and services' },
      { id: '10', key: 'Education', value: 'EDU', description: 'Educational institutions' },
      { id: '11', key: 'Government', value: 'GOV', description: 'Government agencies and departments' },
      { id: '12', key: 'Non-Profit', value: 'NP', description: 'Non-profit organizations' },
      { id: '13', key: 'Transportation', value: 'TRANS', description: 'Transportation and logistics' },
      { id: '14', key: 'Energy', value: 'NRG', description: 'Energy companies and utilities' },
      { id: '15', key: 'Telecommunications', value: 'TELECOM', description: 'Telecommunications providers' },
      { id: '16', key: 'Professional Services', value: 'PRO', description: 'Professional service providers' },
      { id: '17', key: 'Other', value: 'OTHER', description: 'Other industry types' }
    ]
  },
  {
    name: 'Fee Multipliers',
    category: 'Design Fee Rates',
    description: 'Base multipliers for calculating project fees based on complexity',
    entries: [
      { id: '1', key: 'Simple Complexity Project', value: 1.2, description: 'Projects with standard requirements and minimal customization' },
      { id: '2', key: 'Medium Complexity Project', value: 1.5, description: 'Projects with moderate customization and technical requirements' },
      { id: '3', key: 'Complex Project', value: 1.8, description: 'Projects with extensive customization and advanced technical requirements' }
    ]
  },
  {
    name: 'Building Construction Rates',
    category: 'Rate Categories',
    description: 'Construction cost rates per square foot by building type',
    entries: [
      { id: '1', key: 'Apartment', value: 'APT', description: 'Multi-family residential buildings - $225/sq.ft' },
      { id: '2', key: 'Office', value: 'OFF', description: 'Commercial office spaces - $195/sq.ft' },
      { id: '3', key: 'Medical Office', value: 'MED', description: 'Healthcare professional offices - $275/sq.ft' },
      { id: '4', key: 'Dental Office', value: 'DEN', description: 'Dental clinics and practices - $265/sq.ft' },
      { id: '5', key: 'Hospital', value: 'HOS', description: 'Medical treatment facilities - $425/sq.ft' },
      { id: '6', key: 'Retail', value: 'RET', description: 'Shops and commercial retail spaces - $185/sq.ft' },
      { id: '7', key: 'Factory', value: 'FAC', description: 'Manufacturing and industrial facilities - $155/sq.ft' },
      { id: '8', key: 'Warehouse', value: 'WAR', description: 'Storage and distribution facilities - $125/sq.ft' },
      { id: '9', key: 'Hotel', value: 'HOT', description: 'Lodging and hospitality buildings - $245/sq.ft' },
      { id: '10', key: 'Recreational', value: 'REC', description: 'Sports and entertainment venues - $215/sq.ft' },
      { id: '11', key: 'Church', value: 'CHU', description: 'Religious and worship facilities - $235/sq.ft' },
      { id: '12', key: 'School', value: 'SCH', description: 'Educational institutions - $255/sq.ft' },
      { id: '13', key: 'Laboratory', value: 'LAB', description: 'Research and testing facilities - $315/sq.ft' },
      { id: '14', key: 'Data Center', value: 'DAT', description: 'IT infrastructure facilities - $385/sq.ft' },
      { id: '15', key: 'Restaurant', value: 'RES', description: 'Food service establishments - $225/sq.ft' },
      { id: '16', key: 'Residential', value: 'RSD', description: 'Single-family homes and dwellings - $205/sq.ft' }
    ]
  }
];

// Sample clients data
const clientsData = [
  {
    name: "Acme Corporation",
    type: "Enterprise",
    status: "Active"
  },
  {
    name: "Stellar Solutions",
    type: "SMB",
    status: "Active"
  },
  {
    name: "Global Dynamics",
    type: "Enterprise",
    status: "Active"
  }
];

// Sample projects data
const projectsData = [
  {
    number: "PRJ-001",
    name: "Website Redesign",
    type: "Development",
    status: "Design"
  },
  {
    number: "PRJ-002",
    name: "Mobile App Development",
    type: "Development",
    status: "Construction"
  },
  {
    number: "PRJ-003",
    name: "Database Migration",
    type: "Infrastructure",
    status: "Pending"
  }
];

// Sample assets data
const assetsData = [
  {
    number: "AST-001",
    description: "Dell Precision Workstation",
    designation: "Engineering",
    location: "Main Office - Floor 2",
    purchase_value: 2500.00,
    purchase_date: "2024-01-15",
    status: "Active"
  },
  {
    number: "AST-002",
    description: "HP DesignJet Plotter",
    designation: "Production",
    location: "Print Room",
    purchase_value: 8500.00,
    purchase_date: "2023-11-20",
    status: "Maintenance"
  },
  {
    number: "AST-003",
    description: "Conference Room AV System",
    designation: "Meeting Facilities",
    location: "Conference Room A",
    purchase_value: 12000.00,
    purchase_date: "2023-09-05",
    status: "Active"
  }
];

/**
 * Seed reference tables with data.
 */
async function seedReferenceTables() {
  try {
    console.log('Seeding reference tables...');
    console.log('Checking if reference_tables exists...');
    
    // Check if table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('reference_tables')
      .select('count')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking reference_tables table:', tableCheckError);
      console.log('Table may not exist, skipping seeding');
      return false;
    }
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('reference_tables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error('Error clearing reference tables:', deleteError);
    } else {
      console.log('Cleared existing reference tables data');
    }
    
    // Insert new data
    for (const tableData of referenceTablesData) {
      const { error: insertError } = await supabase
        .from('reference_tables')
        .insert({
          name: tableData.name,
          category: tableData.category,
          description: tableData.description,
          entries: tableData.entries
        });
      
      if (insertError) {
        console.error(`Error inserting reference table '${tableData.name}':`, insertError);
      } else {
        console.log(`Inserted reference table: ${tableData.name}`);
      }
    }
    
    console.log('Reference tables seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding reference tables:', error);
    return false;
  }
}

/**
 * Seed state cost index with data.
 */
async function seedStateCostIndex() {
  try {
    console.log('Seeding state cost index...');
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
      console.error('Error clearing state cost index:', deleteError);
    } else {
      console.log('Cleared existing state cost index data');
    }
    
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
      
      console.log(`Inserted data for state: ${state}`);
    }
    
    console.log('State cost index seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding state cost index:', error);
    return false;
  }
}

/**
 * Seed clients with data.
 */
async function seedClients() {
  try {
    console.log('Seeding clients...');
    console.log('Checking if clients exists...');
    
    // Check if table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking clients table:', tableCheckError);
      console.log('Table may not exist, skipping seeding');
      return false;
    }
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error('Error clearing clients:', deleteError);
    } else {
      console.log('Cleared existing clients data');
    }
    
    // Insert new data
    for (const clientData of clientsData) {
      const { error: insertError } = await supabase
        .from('clients')
        .insert(clientData);
      
      if (insertError) {
        console.error(`Error inserting client '${clientData.name}':`, insertError);
      } else {
        console.log(`Inserted client: ${clientData.name}`);
      }
    }
    
    console.log('Clients seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding clients:', error);
    return false;
  }
}

/**
 * Seed projects with data.
 */
async function seedProjects() {
  try {
    console.log('Seeding projects...');
    console.log('Checking if projects exists...');
    
    // Check if table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking projects table:', tableCheckError);
      console.log('Table may not exist, skipping seeding');
      return false;
    }
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error('Error clearing projects:', deleteError);
    } else {
      console.log('Cleared existing projects data');
    }
    
    // Get client IDs
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');
    
    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return;
    }
    
    // Insert new data
    for (let i = 0; i < projectsData.length; i++) {
      const projectData = projectsData[i];
      const clientId = clients[i % clients.length].id;
      
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          client_id: clientId
        });
      
      if (insertError) {
        console.error(`Error inserting project '${projectData.name}':`, insertError);
      } else {
        console.log(`Inserted project: ${projectData.name}`);
      }
    }
    
    console.log('Projects seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding projects:', error);
    return false;
  }
}

/**
 * Seed assets with data.
 */
async function seedAssets() {
  try {
    console.log('Seeding assets...');
    console.log('Checking if assets exists...');
    
    // Check if table exists first
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('assets')
      .select('count')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking assets table:', tableCheckError);
      console.log('Table may not exist, skipping seeding');
      return false;
    }
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error('Error clearing assets:', deleteError);
    } else {
      console.log('Cleared existing assets data');
    }
    
    // Insert new data
    for (const assetData of assetsData) {
      const { error: insertError } = await supabase
        .from('assets')
        .insert(assetData);
      
      if (insertError) {
        console.error(`Error inserting asset '${assetData.number}':`, insertError);
      } else {
        console.log(`Inserted asset: ${assetData.number} - ${assetData.description}`);
      }
    }
    
    console.log('Assets seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding assets:', error);
    return false;
  }
}

/**
 * Seed all data.
 */
async function seedAllData() {
  try {
    const results = await Promise.allSettled([
      await seedReferenceTables(),
      await seedStateCostIndex(),
      await seedClients(),
      await seedProjects(),
      await seedAssets()
    ]);
    
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failed = results.filter(r => r.status === 'rejected' || r.value === false).length;
    
    console.log(`Seeding completed: ${succeeded} succeeded, ${failed} failed`);
    
    return succeeded > 0;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedAllData()
    .then(success => {
      console.log(`Data seeding ${success ? 'succeeded' : 'failed'}.`);
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

export { 
  seedReferenceTables, 
  seedStateCostIndex, 
  seedClients, 
  seedProjects, 
  seedAssets,
  seedAllData
};

export { states_with_metro_areas };