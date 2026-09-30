import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function ensureTablesExist(): Promise<boolean> {
  console.log("[DB] Starting database initialization...");
  
  try {
    // Test connection first
    console.log("[DB] Testing database connection...");
    await pool.query("SELECT 1");
    console.log("[DB] Database connection successful.");
    
    // Enable pgcrypto extension for gen_random_uuid()
    console.log("[DB] Enabling pgcrypto extension...");
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log("[DB] pgcrypto extension enabled.");
    
    // Check existing tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'assessments', 'plan_leads')
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    console.log("[DB] Existing tables:", existingTables);
    
    // Create users table if missing
    if (!existingTables.includes('users')) {
      console.log("[DB] Creating users table...");
      await pool.query(`
        CREATE TABLE users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `);
      console.log("[DB] Users table created successfully.");
    }
    
    // Create assessments table if missing
    if (!existingTables.includes('assessments')) {
      console.log("[DB] Creating assessments table...");
      await pool.query(`
        CREATE TABLE assessments (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          age INTEGER,
          occupation TEXT,
          hours_seated INTEGER,
          has_pain TEXT,
          pain_intensity INTEGER,
          pain_duration TEXT,
          pain_location TEXT,
          leg_pain TEXT,
          shoulder_neck_pain TEXT,
          fear_movement INTEGER,
          catastrophizing INTEGER,
          depression INTEGER,
          stress_level INTEGER,
          physical_activity TEXT,
          movement_breaks TEXT,
          sleep_quality TEXT,
          work_intensity TEXT,
          language TEXT DEFAULT 'es',
          risk_level TEXT,
          total_score INTEGER,
          mechanical_risk INTEGER,
          recovery_risk INTEGER,
          psychosocial_risk INTEGER,
          recommendations JSONB,
          personalized_alert TEXT
        )
      `);
      console.log("[DB] Assessments table created successfully.");
    }
    
    // Create plan_leads table if missing
    if (!existingTables.includes('plan_leads')) {
      console.log("[DB] Creating plan_leads table...");
      await pool.query(`
        CREATE TABLE plan_leads (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          assessment_id VARCHAR,
          spine_age INTEGER,
          real_age INTEGER,
          risk_level TEXT,
          status TEXT DEFAULT 'new',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[DB] plan_leads table created successfully.");
    }
    
    // Verify tables exist now
    const verifyResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'assessments', 'plan_leads')
    `);
    
    const finalTables = verifyResult.rows.map(r => r.table_name);
    console.log("[DB] Final tables verification:", finalTables);
    
    if (!finalTables.includes('assessments')) {
      throw new Error("FATAL: assessments table was not created!");
    }
    
    console.log("[DB] Database initialization complete. All tables ready.");
    return true;
    
  } catch (error) {
    console.error("[DB] FATAL ERROR during database initialization:", error);
    throw error; // Re-throw to stop server startup
  }
}

// Health check function for /api/health endpoint
export async function checkDatabaseHealth(): Promise<{ 
  connected: boolean; 
  tables: string[]; 
  error?: string;
}> {
  try {
    await pool.query("SELECT 1");
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return {
      connected: true,
      tables: result.rows.map(r => r.table_name),
    };
  } catch (error) {
    return {
      connected: false,
      tables: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
