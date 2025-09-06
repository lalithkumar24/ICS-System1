import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, isLocalAuthenticated } from "./localAuth";
import { 
  insertSmartContractSchema, 
  insertAuditSchema, 
  insertAuditFindingSchema,
  insertTransactionSchema,
  insertAuditReportSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - use local auth for development
  const isLocalDev = process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_AUTH === 'true';
  
  if (isLocalDev) {
    console.log('🔧 Using local development authentication');
    await setupLocalAuth(app);
  } else {
    console.log('🔐 Using Replit authentication');
    await setupAuth(app);
  }
  
  // Choose the appropriate auth middleware
  const authMiddleware = isLocalDev ? isLocalAuthenticated : isAuthenticated;

  // Auth routes
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
    try {
      // Handle both local and Replit auth user formats
      const userId = isLocalDev ? req.user.id : req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', authMiddleware, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/risk-distribution', authMiddleware, async (req, res) => {
    try {
      const riskDistribution = await storage.getRiskDistribution();
      res.json(riskDistribution);
    } catch (error) {
      console.error("Error fetching risk distribution:", error);
      res.status(500).json({ message: "Failed to fetch risk distribution" });
    }
  });

  // Smart Contract routes
  app.get('/api/contracts', authMiddleware, async (req, res) => {
    try {
      const contracts = await storage.getSmartContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get('/api/contracts/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getSmartContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.post('/api/contracts', authMiddleware, async (req: any, res) => {
    try {
      const userId = isLocalDev ? req.user.id : req.user.claims.sub;
      const contractData = insertSmartContractSchema.parse({
        ...req.body,
        uploaded_by: userId,
      });
      const contract = await storage.createSmartContract(contractData);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      console.error("Error creating contract:", error);
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  app.put('/api/contracts/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contractData = insertSmartContractSchema.partial().parse(req.body);
      const contract = await storage.updateSmartContract(id, contractData);
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete('/api/contracts/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSmartContract(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // Audit routes
  app.get('/api/audits', authMiddleware, async (req, res) => {
    try {
      const audits = await storage.getAudits();
      res.json(audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ message: "Failed to fetch audits" });
    }
  });

  app.get('/api/audits/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getAudit(id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ message: "Failed to fetch audit" });
    }
  });

  app.post('/api/audits', authMiddleware, async (req: any, res) => {
    try {
      const userId = isLocalDev ? req.user.id : req.user.claims.sub;
      const auditData = insertAuditSchema.parse({
        ...req.body,
        auditor_id: userId,
        started_at: new Date(),
      });
      const audit = await storage.createAudit(auditData);
      res.status(201).json(audit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid audit data", errors: error.errors });
      }
      console.error("Error creating audit:", error);
      res.status(500).json({ message: "Failed to create audit" });
    }
  });

  app.put('/api/audits/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auditData = insertAuditSchema.partial().parse(req.body);
      const audit = await storage.updateAudit(id, auditData);
      res.json(audit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid audit data", errors: error.errors });
      }
      console.error("Error updating audit:", error);
      res.status(500).json({ message: "Failed to update audit" });
    }
  });

  app.delete('/api/audits/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAudit(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting audit:", error);
      res.status(500).json({ message: "Failed to delete audit" });
    }
  });

  // Audit findings routes
  app.get('/api/audits/:auditId/findings', authMiddleware, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const findings = await storage.getAuditFindings(auditId);
      res.json(findings);
    } catch (error) {
      console.error("Error fetching audit findings:", error);
      res.status(500).json({ message: "Failed to fetch audit findings" });
    }
  });

  app.post('/api/audits/:auditId/findings', authMiddleware, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const findingData = insertAuditFindingSchema.parse({
        ...req.body,
        audit_id: auditId,
      });
      const finding = await storage.createAuditFinding(findingData);
      res.status(201).json(finding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid finding data", errors: error.errors });
      }
      console.error("Error creating audit finding:", error);
      res.status(500).json({ message: "Failed to create audit finding" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', authMiddleware, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/transactions/high-risk', authMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getHighRiskTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching high-risk transactions:", error);
      res.status(500).json({ message: "Failed to fetch high-risk transactions" });
    }
  });

  app.post('/api/transactions', authMiddleware, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Report routes
  app.get('/api/reports', authMiddleware, async (req, res) => {
    try {
      const auditId = req.query.auditId ? parseInt(req.query.auditId as string) : undefined;
      const reports = await storage.getAuditReports(auditId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post('/api/reports', authMiddleware, async (req: any, res) => {
    try {
      const userId = isLocalDev ? req.user.id : req.user.claims.sub;
      const reportData = insertAuditReportSchema.parse({
        ...req.body,
        generated_by: userId,
      });
      const report = await storage.createAuditReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
