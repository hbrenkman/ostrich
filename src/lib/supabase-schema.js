import { supabase } from './supabaseUtils.js';

/**
 * Create a new table in Supabase.
 * 
 * @param {string} tableName - The name of the table to create
 * @param {Object} schema - The schema definition with column names and types
 * @param {Object} options - Additional options like constraints
 * @returns {Promise<Object>} - The result of the operation
 */
export async function createTable(tableName, schema, options = {}) {
  try {
    // Build the SQL statement
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    // Add columns
    const columns = Object.entries(schema).map(([columnName, definition]) => {
      return `  ${columnName} ${definition}`;
    });
    
    sql += columns.join(',\n');
    
    // Add primary key if specified
    if (options.primaryKey) {
      sql += `,\n  PRIMARY KEY (${options.primaryKey})`;
    }
    
    // Add foreign keys if specified
    if (options.foreignKeys && options.foreignKeys.length > 0) {
      for (const fk of options.foreignKeys) {
        sql += `,\n  FOREIGN KEY (${fk.column}) REFERENCES ${fk.references}(${fk.referencedColumn || 'id'})`;
        if (fk.onDelete) {
          sql += ` ON DELETE ${fk.onDelete}`;
        }
        if (fk.onUpdate) {
          sql += ` ON UPDATE ${fk.onUpdate}`;
        }
      }
    }
    
    // Close the statement
    sql += '\n);';
    
    // Add unique constraints if specified
    if (options.unique && options.unique.length > 0) {
      for (const uniqueConstraint of options.unique) {
        if (Array.isArray(uniqueConstraint)) {
          sql += `\nALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${uniqueConstraint.join('_')}_unique UNIQUE (${uniqueConstraint.join(', ')});`;
        } else {
          sql += `\nALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${uniqueConstraint}_unique UNIQUE (${uniqueConstraint});`;
        }
      }
    }
    
    // Enable RLS if specified
    if (options.enableRLS) {
      sql += `\nALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`;
    }
    
    // Add RLS policies if specified
    if (options.policies && options.policies.length > 0) {
      for (const policy of options.policies) {
        sql += `\nCREATE POLICY "${policy.name}" ON ${tableName} FOR ${policy.operation} TO ${policy.to} `;
        
        if (policy.using) {
          sql += `USING (${policy.using})`;
        }
        
        if (policy.withCheck) {
          sql += ` WITH CHECK (${policy.withCheck})`;
        }
        
        sql += ';';
      }
    }
    
    // Add updated_at trigger if specified
    if (options.addUpdatedAtTrigger) {
      sql += `
\nDO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_${tableName}_updated_at') THEN
    CREATE TRIGGER update_${tableName}_updated_at
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;`;
    }
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'success',
      message: `Table ${tableName} created successfully`
    };
  } catch (error) {
    console.error('Error creating table:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Alter an existing table in Supabase.
 * 
 * @param {string} tableName - The name of the table to alter
 * @param {Object} alterations - The alterations to make
 * @returns {Promise<Object>} - The result of the operation
 */
export async function alterTable(tableName, alterations) {
  try {
    let sql = '';
    
    // Add columns
    if (alterations.addColumns) {
      for (const [columnName, definition] of Object.entries(alterations.addColumns)) {
        sql += `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${definition};\n`;
      }
    }
    
    // Drop columns
    if (alterations.dropColumns) {
      for (const columnName of alterations.dropColumns) {
        sql += `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName};\n`;
      }
    }
    
    // Rename columns
    if (alterations.renameColumns) {
      for (const [oldName, newName] of Object.entries(alterations.renameColumns)) {
        sql += `ALTER TABLE ${tableName} RENAME COLUMN ${oldName} TO ${newName};\n`;
      }
    }
    
    // Alter columns
    if (alterations.alterColumns) {
      for (const [columnName, definition] of Object.entries(alterations.alterColumns)) {
        sql += `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} ${definition};\n`;
      }
    }
    
    // Add constraints
    if (alterations.addConstraints) {
      for (const constraint of alterations.addConstraints) {
        sql += `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.name} ${constraint.definition};\n`;
      }
    }
    
    // Drop constraints
    if (alterations.dropConstraints) {
      for (const constraintName of alterations.dropConstraints) {
        sql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintName};\n`;
      }
    }
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'success',
      message: `Table ${tableName} altered successfully`
    };
  } catch (error) {
    console.error('Error altering table:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Drop a table from Supabase.
 * 
 * @param {string} tableName - The name of the table to drop
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The result of the operation
 */
export async function dropTable(tableName, options = {}) {
  try {
    const cascade = options.cascade ? 'CASCADE' : '';
    const sql = `DROP TABLE IF EXISTS ${tableName} ${cascade};`;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'success',
      message: `Table ${tableName} dropped successfully`
    };
  } catch (error) {
    console.error('Error dropping table:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Create an index on a table in Supabase.
 * 
 * @param {string} tableName - The name of the table
 * @param {string|string[]} columns - The column(s) to index
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The result of the operation
 */
export async function createIndex(tableName, columns, options = {}) {
  try {
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    const indexName = options.name || `idx_${tableName}_${Array.isArray(columns) ? columns.join('_') : columns}`;
    const unique = options.unique ? 'UNIQUE' : '';
    const method = options.method ? `USING ${options.method}` : '';
    
    const sql = `CREATE ${unique} INDEX IF NOT EXISTS ${indexName} ON ${tableName} ${method} (${columnList});`;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'success',
      message: `Index ${indexName} created successfully`
    };
  } catch (error) {
    console.error('Error creating index:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Create a view in Supabase.
 * 
 * @param {string} viewName - The name of the view to create
 * @param {string} query - The SQL query that defines the view
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The result of the operation
 */
export async function createView(viewName, query, options = {}) {
  try {
    const orReplace = options.replace ? 'OR REPLACE' : '';
    const sql = `CREATE ${orReplace} VIEW ${viewName} AS ${query};`;
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'success',
      message: `View ${viewName} created successfully`
    };
  } catch (error) {
    console.error('Error creating view:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

export default {
  createTable,
  alterTable,
  dropTable,
  createIndex,
  createView
};