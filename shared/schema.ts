import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Assessment schema for back pain risk evaluation
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  // Demographics
  age: integer("age"),
  occupation: text("occupation"),
  hoursSeated: integer("hours_seated"),
  // Current pain
  hasPain: text("has_pain"), // "yes" | "no"
  painIntensity: integer("pain_intensity"), // 0-10
  painDuration: text("pain_duration"), // "less_week" | "1_4_weeks" | "1_3_months" | "more_3_months"
  painLocation: text("pain_location"), // "lower" | "middle" | "upper" | "multiple"
  // Risk factors (STarT Back adapted)
  legPain: text("leg_pain"), // "yes" | "no"
  shoulderNeckPain: text("shoulder_neck_pain"), // "yes" | "no"
  fearMovement: integer("fear_movement"), // 0-10 scale
  catastrophizing: integer("catastrophizing"), // 0-10 scale
  depression: integer("depression"), // 0-10 scale
  // Work context
  stressLevel: integer("stress_level"), // 0-10
  physicalActivity: text("physical_activity"), // "sedentary" | "light" | "moderate" | "active"
  // New context fields
  movementBreaks: text("movement_breaks"), // "never" | "rarely" | "sometimes" | "frequently"
  sleepQuality: text("sleep_quality"), // "poor" | "fair" | "good" | "excellent"
  workIntensity: text("work_intensity"), // "low" | "moderate" | "high" | "very_high"
  // Language preference
  language: text("language").default("es"), // "es" | "en"
  // Optional company link (for B2B)
  companyCode: varchar("company_code"), // Links to company.inviteCode
  // Results - segmented risk scores
  riskLevel: text("risk_level"), // "low" | "medium" | "high"
  totalScore: integer("total_score"),
  mechanicalRisk: integer("mechanical_risk"), // 0-100
  recoveryRisk: integer("recovery_risk"), // 0-100
  psychosocialRisk: integer("psychosocial_risk"), // 0-100
  recommendations: jsonb("recommendations"),
  personalizedAlert: text("personalized_alert"),
});

// Input schema for client submissions - excludes server-computed fields
export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  // Exclude server-computed fields - these are calculated by the backend
  riskLevel: true,
  totalScore: true,
  mechanicalRisk: true,
  recoveryRisk: true,
  psychosocialRisk: true,
  recommendations: true,
  personalizedAlert: true,
}).extend({
  // Make optional fields nullable
  email: z.string().nullable().optional(),
  painDuration: z.string().nullable().optional(),
  painLocation: z.string().nullable().optional(),
  movementBreaks: z.string().nullable().optional(),
  sleepQuality: z.string().nullable().optional(),
  workIntensity: z.string().nullable().optional(),
  // Language preference for i18n (now part of the table schema)
  language: z.enum(["es", "en"]).optional().default("es"),
  // Optional company code for B2B
  companyCode: z.string().optional(),
});

// Recommendation object schema
export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  action: z.string(),
  rationale: z.string(),
  category: z.enum(["mechanical", "recovery", "psychosocial"]),
  icon: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Full assessment schema for storage (includes computed fields)
export const storedAssessmentSchema = insertAssessmentSchema.extend({
  riskLevel: z.string(),
  totalScore: z.number(),
  mechanicalRisk: z.number(),
  recoveryRisk: z.number(),
  psychosocialRisk: z.number(),
  recommendations: z.array(recommendationSchema),
  personalizedAlert: z.string(),
});

export type StoredAssessment = z.infer<typeof storedAssessmentSchema>;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// Form step schemas for validation
export const demographicsSchema = z.object({
  age: z.number().min(18).max(100),
  occupation: z.enum(["office", "remote", "healthcare", "education", "manufacturing", "retail", "other"]),
  hoursSeated: z.number().min(0).max(16),
});

export const painStatusSchema = z.object({
  hasPain: z.enum(["yes", "no"]),
  painIntensity: z.number().min(0).max(10).optional(),
  painDuration: z.enum(["less_week", "1_4_weeks", "1_3_months", "more_3_months"]).optional(),
  painLocation: z.enum(["lower", "middle", "upper", "multiple"]).optional(),
});

export const riskFactorsSchema = z.object({
  legPain: z.enum(["yes", "no"]),
  shoulderNeckPain: z.enum(["yes", "no"]),
  fearMovement: z.number().min(0).max(10),
  catastrophizing: z.number().min(0).max(10),
  depression: z.number().min(0).max(10),
});

export const lifestyleSchema = z.object({
  stressLevel: z.number().min(0).max(10),
  physicalActivity: z.enum(["sedentary", "light", "moderate", "active"]),
  movementBreaks: z.enum(["never", "rarely", "sometimes", "frequently"]),
  sleepQuality: z.enum(["poor", "fair", "good", "excellent"]),
  workIntensity: z.enum(["low", "moderate", "high", "very_high"]),
});

export const contactSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
});

export type Demographics = z.infer<typeof demographicsSchema>;
export type PainStatus = z.infer<typeof painStatusSchema>;
export type RiskFactors = z.infer<typeof riskFactorsSchema>;
export type Lifestyle = z.infer<typeof lifestyleSchema>;
export type Contact = z.infer<typeof contactSchema>;

// ============================================
// B2B ENTERPRISE SCHEMAS
// ============================================

// Company registration table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  // Basic info
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  industry: text("industry"), // "tech" | "healthcare" | "finance" | "manufacturing" | "retail" | "education" | "other"
  country: text("country"),
  // Company data for cost calculation
  totalEmployees: integer("total_employees").notNull(),
  officeEmployeesPercent: integer("office_employees_percent"), // % of sedentary workers
  averageSalary: decimal("average_salary", { precision: 12, scale: 2 }), // Annual salary
  sickDaysPerYear: integer("sick_days_per_year"), // Average sick days
  backPainCasesReported: integer("back_pain_cases_reported"), // Known cases
  // Unique code for employees to link their assessments
  inviteCode: varchar("invite_code").unique().default(sql`gen_random_uuid()`),
  // Status
  status: text("status").default("pending"), // "pending" | "reviewed" | "active" | "completed"
  // Admin notes
  adminNotes: text("admin_notes"),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  inviteCode: true,
  status: true,
  adminNotes: true,
}).extend({
  companyName: z.string().min(2, "El nombre de la empresa es requerido"),
  contactName: z.string().min(2, "El nombre de contacto es requerido"),
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().optional(),
  industry: z.enum(["tech", "healthcare", "finance", "manufacturing", "retail", "education", "services", "government", "other"]).optional(),
  country: z.string().optional(),
  totalEmployees: z.number().min(1, "Debe tener al menos 1 empleado"),
  officeEmployeesPercent: z.number().min(0).max(100).optional(),
  averageSalary: z.string().optional(), // Decimal comes as string
  sickDaysPerYear: z.number().min(0).optional(),
  backPainCasesReported: z.number().min(0).optional(),
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Company files (HR reports, statistics, etc.)
export const companyFiles = pgTable("company_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"), // MIME type
  fileSize: integer("file_size"), // bytes
  fileData: text("file_data"), // base64 encoded or URL
  description: text("description"),
});

export const insertCompanyFileSchema = createInsertSchema(companyFiles).omit({
  id: true,
  createdAt: true,
});

export type InsertCompanyFile = z.infer<typeof insertCompanyFileSchema>;
export type CompanyFile = typeof companyFiles.$inferSelect;

// Cost analysis results (calculated by admin)
export const companyCostAnalysis = pgTable("company_cost_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // Calculated costs
  absenteeismCost: decimal("absenteeism_cost", { precision: 12, scale: 2 }),
  presenteeismCost: decimal("presenteeism_cost", { precision: 12, scale: 2 }),
  futureRiskCost: decimal("future_risk_cost", { precision: 12, scale: 2 }),
  totalAnnualCost: decimal("total_annual_cost", { precision: 12, scale: 2 }),
  potentialSavings: decimal("potential_savings", { precision: 12, scale: 2 }),
  // Risk distribution from assessments
  employeesAssessed: integer("employees_assessed"),
  highRiskCount: integer("high_risk_count"),
  mediumRiskCount: integer("medium_risk_count"),
  lowRiskCount: integer("low_risk_count"),
  avgMechanicalRisk: integer("avg_mechanical_risk"),
  avgRecoveryRisk: integer("avg_recovery_risk"),
  avgPsychosocialRisk: integer("avg_psychosocial_risk"),
  // Key intervention points
  keyInterventions: jsonb("key_interventions"),
  executiveSummary: text("executive_summary"),
});

export const insertCostAnalysisSchema = createInsertSchema(companyCostAnalysis).omit({
  id: true,
  createdAt: true,
});

export type InsertCostAnalysis = z.infer<typeof insertCostAnalysisSchema>;
export type CostAnalysis = typeof companyCostAnalysis.$inferSelect;

// ============================================
// LEADS / PLAN SUBSCRIPTION
// ============================================

// People interested in the personalized plan
export const planLeads = pgTable("plan_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  // Contact info
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country"),
  // Context
  assessmentId: varchar("assessment_id"), // Link to their assessment if available
  spineAge: integer("spine_age"), // Calculated spine age
  realAge: integer("real_age"), // Their actual age
  riskLevel: text("risk_level"), // From assessment
  // Status
  status: text("status").default("new"), // "new" | "contacted" | "converted" | "not_interested"
  adminNotes: text("admin_notes"),
});

export const insertPlanLeadSchema = createInsertSchema(planLeads).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
}).extend({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  country: z.string().optional(),
  assessmentId: z.string().optional(),
  spineAge: z.number().optional(),
  realAge: z.number().optional(),
  riskLevel: z.string().optional(),
});

export type InsertPlanLead = z.infer<typeof insertPlanLeadSchema>;
export type PlanLead = typeof planLeads.$inferSelect;
