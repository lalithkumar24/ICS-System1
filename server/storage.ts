import {
  users,
  smartContracts,
  audits,
  auditFindings,
  transactions,
  auditReports,
  type User,
  type UpsertUser,
  type SmartContract,
  type InsertSmartContract,
  type Audit,
  type InsertAudit,
  type AuditFinding,
  type InsertAuditFinding,
  type Transaction,
  type InsertTransaction,
  type AuditReport,
  type InsertAuditReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";
import "dotenv/config"; 

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Smart Contract operations
  getSmartContracts(): Promise<SmartContract[]>;
  getSmartContract(id: number): Promise<SmartContract | undefined>;
  createSmartContract(contract: InsertSmartContract): Promise<SmartContract>;
  updateSmartContract(id: number, contract: Partial<InsertSmartContract>): Promise<SmartContract>;
  deleteSmartContract(id: number): Promise<void>;
  
  // Audit operations
  getAudits(): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  getAuditsByUser(userId: string): Promise<Audit[]>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit>;
  deleteAudit(id: number): Promise<void>;
  
  // Audit Finding operations
  getAuditFindings(auditId: number): Promise<AuditFinding[]>;
  createAuditFinding(finding: InsertAuditFinding): Promise<AuditFinding>;
  updateAuditFinding(id: number, finding: Partial<InsertAuditFinding>): Promise<AuditFinding>;
  deleteAuditFinding(id: number): Promise<void>;
  
  // Transaction operations
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  getHighRiskTransactions(): Promise<Transaction[]>;
  
  // Report operations
  getAuditReports(auditId?: number): Promise<AuditReport[]>;
  createAuditReport(report: InsertAuditReport): Promise<AuditReport>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalAudits: number;
    highRiskIssues: number;
    contractsAnalyzed: number;
    avgRiskScore: number;
  }>;
  
  getRiskDistribution(): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Smart Contract operations
  async getSmartContracts(): Promise<SmartContract[]> {
    return await db.select().from(smartContracts).orderBy(desc(smartContracts.created_at));
  }
  
  async getSmartContract(id: number): Promise<SmartContract | undefined> {
    const [contract] = await db.select().from(smartContracts).where(eq(smartContracts.id, id));
    return contract;
  }
  
  async createSmartContract(contract: InsertSmartContract): Promise<SmartContract> {
    const [newContract] = await db.insert(smartContracts).values(contract).returning();
    return newContract;
  }
  
  async updateSmartContract(id: number, contract: Partial<InsertSmartContract>): Promise<SmartContract> {
    const [updatedContract] = await db
      .update(smartContracts)
      .set({ ...contract, updated_at: new Date() })
      .where(eq(smartContracts.id, id))
      .returning();
    return updatedContract;
  }
  
  async deleteSmartContract(id: number): Promise<void> {
    await db.delete(smartContracts).where(eq(smartContracts.id, id));
  }
  
  // Audit operations
  async getAudits(): Promise<Audit[]> {
    return await db.select().from(audits).orderBy(desc(audits.created_at));
  }
  
  async getAudit(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit;
  }
  
  async getAuditsByUser(userId: string): Promise<Audit[]> {
    return await db.select().from(audits).where(eq(audits.auditor_id, userId)).orderBy(desc(audits.created_at));
  }
  
  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [newAudit] = await db.insert(audits).values(audit).returning();
    return newAudit;
  }
  
  async updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit> {
    const [updatedAudit] = await db
      .update(audits)
      .set({ ...audit, updated_at: new Date() })
      .where(eq(audits.id, id))
      .returning();
    return updatedAudit;
  }
async updateAuditStatus(auditId: number, status: "in_progress" | "completed" | "failed"): Promise<Audit> {
  const [updatedAudit] = await db
    .update(audits)
    .set({ status: status, updated_at: new Date() })
    .where(eq(audits.id, auditId))
    .returning();
  
  return updatedAudit;
}

  
  async deleteAudit(id: number): Promise<void> {
    await db.delete(audits).where(eq(audits.id, id));
  }
  
  // Audit Finding operations
  async getAuditFindings(auditId: number): Promise<AuditFinding[]> {
    return await db.select().from(auditFindings).where(eq(auditFindings.audit_id, auditId));
  }
  
  async createAuditFinding(finding: InsertAuditFinding): Promise<AuditFinding> {
    const [newFinding] = await db.insert(auditFindings).values(finding).returning();
    return newFinding;
  }
  
  async updateAuditFinding(id: number, finding: Partial<InsertAuditFinding>): Promise<AuditFinding> {
    const [updatedFinding] = await db
      .update(auditFindings)
      .set({ ...finding, updated_at: new Date() })
      .where(eq(auditFindings.id, id))
      .returning();
    return updatedFinding;
  }
  
  async deleteAuditFinding(id: number): Promise<void> {
    await db.delete(auditFindings).where(eq(auditFindings.id, id));
  }
  
  // Transaction operations
  async getTransactions(limit = 50): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .orderBy(desc(transactions.created_at))
      .limit(limit);
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }
  
  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async getHighRiskTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(or(eq(transactions.risk_level, "high"), eq(transactions.risk_level, "critical")))
      .orderBy(desc(transactions.created_at))
      .limit(20);
  }
  
  // Report operations
  async getAuditReports(auditId?: number): Promise<AuditReport[]> {
    const query = db.select().from(auditReports);
    if (auditId) {
      return await query.where(eq(auditReports.audit_id, auditId)).orderBy(desc(auditReports.created_at));
    }
    return await query.orderBy(desc(auditReports.created_at));
  }
  
  async createAuditReport(report: InsertAuditReport): Promise<AuditReport> {
    const [newReport] = await db.insert(auditReports).values(report).returning();
    return newReport;
  }
  
  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalAudits: number;
    highRiskIssues: number;
    contractsAnalyzed: number;
    avgRiskScore: number;
  }> {
    const [auditCount] = await db.select({ count: count() }).from(audits);
    const [contractCount] = await db.select({ count: count() }).from(smartContracts);
    const [highRiskIssues] = await db
      .select({ count: count() })
      .from(auditFindings)
      .where(or(
        eq(auditFindings.severity, "high"),
        eq(auditFindings.severity, "critical")
      ));
    const [avgRisk] = await db
      .select({ avg: sql<number>`AVG(${audits.risk_score})` })
      .from(audits)
      .where(eq(audits.status, "completed"));
    
    return {
      totalAudits: auditCount.count,
      highRiskIssues: highRiskIssues.count,
      contractsAnalyzed: contractCount.count,
      avgRiskScore: Number(avgRisk.avg) || 0,
    };
  }
  
  async getRiskDistribution(): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    const [critical] = await db.select({ count: count() }).from(auditFindings).where(eq(auditFindings.severity, "critical"));
    const [high] = await db.select({ count: count() }).from(auditFindings).where(eq(auditFindings.severity, "high"));
    const [medium] = await db.select({ count: count() }).from(auditFindings).where(eq(auditFindings.severity, "medium"));
    const [low] = await db.select({ count: count() }).from(auditFindings).where(eq(auditFindings.severity, "low"));
    
    return {
      critical: critical.count,
      high: high.count,
      medium: medium.count,
      low: low.count,
    };
  }
}

export const storage = new DatabaseStorage();
