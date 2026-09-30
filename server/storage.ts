// PostgreSQL database storage implementation
import { 
  users, 
  assessments, 
  companies,
  companyFiles,
  companyCostAnalysis,
  planLeads,
  type User, 
  type InsertUser, 
  type Assessment, 
  type InsertAssessment, 
  type Recommendation,
  type Company,
  type InsertCompany,
  type CompanyFile,
  type InsertCompanyFile,
  type CostAnalysis,
  type InsertCostAnalysis,
  type PlanLead,
  type InsertPlanLead
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Type for creating assessment with computed fields
interface CreateAssessmentData extends InsertAssessment {
  riskLevel: string;
  totalScore: number;
  mechanicalRisk: number;
  recoveryRisk: number;
  psychosocialRisk: number;
  recommendations: Recommendation[];
  personalizedAlert: string;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Assessments
  createAssessment(assessment: CreateAssessmentData): Promise<Assessment>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentsByEmail(email: string): Promise<Assessment[]>;
  getAssessmentsByCompanyCode(companyCode: string): Promise<Assessment[]>;
  // Companies
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByInviteCode(inviteCode: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  updateCompanyStatus(id: string, status: string, adminNotes?: string): Promise<Company | undefined>;
  // Company Files
  createCompanyFile(file: InsertCompanyFile): Promise<CompanyFile>;
  getCompanyFiles(companyId: string): Promise<CompanyFile[]>;
  // Cost Analysis
  createCostAnalysis(analysis: InsertCostAnalysis): Promise<CostAnalysis>;
  getCostAnalysisByCompany(companyId: string): Promise<CostAnalysis | undefined>;
  updateCostAnalysis(id: string, data: Partial<InsertCostAnalysis>): Promise<CostAnalysis | undefined>;
  // Plan Leads
  createPlanLead(lead: InsertPlanLead): Promise<PlanLead>;
  getAllPlanLeads(): Promise<PlanLead[]>;
  getPlanLeadByAssessmentId(assessmentId: string): Promise<PlanLead | undefined>;
  updatePlanLeadStatus(id: string, status: string, adminNotes?: string): Promise<PlanLead | undefined>;
}

export class DatabaseStorage implements IStorage {
  // ============ USERS ============
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // ============ ASSESSMENTS ============
  async createAssessment(data: CreateAssessmentData): Promise<Assessment> {
    const [assessment] = await db
      .insert(assessments)
      .values({
        email: data.email || null,
        age: data.age || null,
        occupation: data.occupation || null,
        hoursSeated: data.hoursSeated || null,
        hasPain: data.hasPain || null,
        painIntensity: data.painIntensity || null,
        painDuration: data.painDuration || null,
        painLocation: data.painLocation || null,
        legPain: data.legPain || null,
        shoulderNeckPain: data.shoulderNeckPain || null,
        fearMovement: data.fearMovement || null,
        catastrophizing: data.catastrophizing || null,
        depression: data.depression || null,
        stressLevel: data.stressLevel || null,
        physicalActivity: data.physicalActivity || null,
        movementBreaks: data.movementBreaks || null,
        sleepQuality: data.sleepQuality || null,
        workIntensity: data.workIntensity || null,
        language: data.language || "es",
        companyCode: data.companyCode || null,
        riskLevel: data.riskLevel,
        totalScore: data.totalScore,
        mechanicalRisk: data.mechanicalRisk,
        recoveryRisk: data.recoveryRisk,
        psychosocialRisk: data.psychosocialRisk,
        recommendations: data.recommendations,
        personalizedAlert: data.personalizedAlert,
      })
      .returning();
    return assessment;
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment || undefined;
  }

  async getAssessmentsByEmail(email: string): Promise<Assessment[]> {
    const results = await db
      .select()
      .from(assessments)
      .where(eq(assessments.email, email))
      .orderBy(desc(assessments.createdAt));
    return results;
  }

  async getAssessmentsByCompanyCode(companyCode: string): Promise<Assessment[]> {
    const results = await db
      .select()
      .from(assessments)
      .where(eq(assessments.companyCode, companyCode))
      .orderBy(desc(assessments.createdAt));
    return results;
  }

  // ============ COMPANIES ============
  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values({
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        industry: data.industry || null,
        country: data.country || null,
        totalEmployees: data.totalEmployees,
        officeEmployeesPercent: data.officeEmployeesPercent || null,
        averageSalary: data.averageSalary || null,
        sickDaysPerYear: data.sickDaysPerYear || null,
        backPainCasesReported: data.backPainCasesReported || null,
      })
      .returning();
    return company;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByInviteCode(inviteCode: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.inviteCode, inviteCode));
    return company || undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    const results = await db
      .select()
      .from(companies)
      .orderBy(desc(companies.createdAt));
    return results;
  }

  async updateCompanyStatus(id: string, status: string, adminNotes?: string): Promise<Company | undefined> {
    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    const [updated] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();
    return updated || undefined;
  }

  // ============ COMPANY FILES ============
  async createCompanyFile(data: InsertCompanyFile): Promise<CompanyFile> {
    const [file] = await db
      .insert(companyFiles)
      .values({
        companyId: data.companyId,
        fileName: data.fileName,
        fileType: data.fileType || null,
        fileSize: data.fileSize || null,
        fileData: data.fileData || null,
        description: data.description || null,
      })
      .returning();
    return file;
  }

  async getCompanyFiles(companyId: string): Promise<CompanyFile[]> {
    const results = await db
      .select()
      .from(companyFiles)
      .where(eq(companyFiles.companyId, companyId))
      .orderBy(desc(companyFiles.createdAt));
    return results;
  }

  // ============ COST ANALYSIS ============
  async createCostAnalysis(data: InsertCostAnalysis): Promise<CostAnalysis> {
    const [analysis] = await db
      .insert(companyCostAnalysis)
      .values(data)
      .returning();
    return analysis;
  }

  async getCostAnalysisByCompany(companyId: string): Promise<CostAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(companyCostAnalysis)
      .where(eq(companyCostAnalysis.companyId, companyId))
      .orderBy(desc(companyCostAnalysis.createdAt));
    return analysis || undefined;
  }

  async updateCostAnalysis(id: string, data: Partial<InsertCostAnalysis>): Promise<CostAnalysis | undefined> {
    const [updated] = await db
      .update(companyCostAnalysis)
      .set(data)
      .where(eq(companyCostAnalysis.id, id))
      .returning();
    return updated || undefined;
  }

  // ============ PLAN LEADS ============
  async createPlanLead(data: InsertPlanLead): Promise<PlanLead> {
    const [lead] = await db
      .insert(planLeads)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        country: data.country || null,
        assessmentId: data.assessmentId || null,
        spineAge: data.spineAge || null,
        realAge: data.realAge || null,
        riskLevel: data.riskLevel || null,
      })
      .returning();
    return lead;
  }

  async getAllPlanLeads(): Promise<PlanLead[]> {
    const results = await db
      .select()
      .from(planLeads)
      .orderBy(desc(planLeads.createdAt));
    return results;
  }

  async getPlanLeadByAssessmentId(assessmentId: string): Promise<PlanLead | undefined> {
    const [lead] = await db
      .select()
      .from(planLeads)
      .where(eq(planLeads.assessmentId, assessmentId))
      .limit(1);
    return lead || undefined;
  }

  async updatePlanLeadStatus(id: string, status: string, adminNotes?: string): Promise<PlanLead | undefined> {
    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    const [updated] = await db
      .update(planLeads)
      .set(updateData)
      .where(eq(planLeads.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
