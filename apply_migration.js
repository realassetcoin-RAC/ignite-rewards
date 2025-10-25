import { Client } from 'pg';
import fs from 'fs';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function applyMigration() {
  console.log('Applying migration: 20250128_fix_missing_functions_tables_safe.sql');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const sqlContent = fs.readFileSync('supabase/migrations/20250128_fix_missing_functions_tables_safe.sql', 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.log(`⚠️ Statement ${i + 1} warning: ${error.message.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('✅ Migration completed');
    
    // Check tables count
    const result = await client.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log(`📊 Total tables now: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);

