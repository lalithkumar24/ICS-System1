import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth0, requireAuth0, getAuth0User } from "./auth0Config";
import { 
  insertSmartContractSchema, 
  insertAuditSchema, 
  insertAuditFindingSchema,
  insertTransactionSchema,
  insertAuditReportSchema 
} from "@shared/schema";
import { z } from "zod";
import "dotenv/config";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import solc from "solc";
import PDFDocument from "pdfkit";


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Auth0 authentication
  console.log('🔐 Using Auth0 authentication');
  await setupAuth0(app);

  // Auth routes
  app.get('/api/auth/user', requireAuth0, async (req: any, res) => {
    try {
      const user = await getAuth0User(req);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', requireAuth0, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/risk-distribution', requireAuth0, async (req, res) => {
    try {
      const riskDistribution = await storage.getRiskDistribution();
      res.json(riskDistribution);
    } catch (error) {
      console.error("Error fetching risk distribution:", error);
      res.status(500).json({ message: "Failed to fetch risk distribution" });
    }
  });

  // Smart Contract routes
  app.get('/api/contracts', requireAuth0, async (req, res) => {
    try {
      const contracts = await storage.getSmartContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get('/api/contracts/:id', requireAuth0, async (req, res) => {
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

  app.post('/api/contracts', requireAuth0, async (req: any, res) => {
    try {
      const user = await getAuth0User(req);
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const contractData = insertSmartContractSchema.parse({
        ...req.body,
        uploaded_by: user.id,
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

  app.put('/api/contracts/:id', requireAuth0, async (req, res) => {
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

  app.delete('/api/contracts/:id', requireAuth0, async (req, res) => {
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
  app.post("/api/audits", requireAuth0, async (req, res) => {
  try {
    const { name,source_code } = req.body;
    if (!name || !source_code) {
      return res.status(400).json({ message: "Missing contract name or source code" });
    }

    // 1️⃣ Save temporary contract file
    const filePath = path.join("/tmp", `${name}-${Date.now()}.sol`);
    fs.writeFileSync(filePath, source_code);

    // 2️⃣ Compile with solc
    const input = {
      language: "Solidity",
      sources: { [`${name}.sol`]: { content: source_code } },
      settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode", "metadata"] } } }
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    console.log("Solc output:", output);

    if (output.errors?.some(e => e.severity === "error")) {
      return res.status(400).json({ message: "Compilation failed", errors: output.errors });
    }

    // Store audit in DB
    const audit = await storage.createAudit({
      name: name,
      status: "in_progress",
      createdAt: new Date(),
    });

    // 3️⃣ Run Slither (static analyzer)
    const jsonPath = filePath.replace(".sol", ".json");
    // Corrected Logic
    exec(`slither ${filePath} --json ${jsonPath}`, async (err, stdout, stderr) => {
    // The new condition: only fail if an error occurred AND the output file was NOT created.
    if (err && !fs.existsSync(jsonPath)) {
      console.error("Slither analysis truly failed:", stderr);
      await storage.updateAuditStatus(audit.id, "failed");
      // Clean up the failed .sol file
      fs.unlinkSync(filePath); 
      return res.status(500).json({ message: "Slither analysis failed to run" });
    }
    // If we get here, the analysis was successful (with or without findings).
    // It's now safe to read the report.
    console.log("Slither analysis complete. Processing findings...");
    const findings = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const detectors = findings?.results?.detectors || [];

    for (const issue of detectors) {
          console.log("Processing issue:", issue);
      await storage.createAuditFinding({
        auditId: audit.id,
        title: issue.check,
        check: issue.check,
        severity: issue.impact.toLowerCase(), // <-- FIX: Map the 'impact' value to the 'severity' field
        confidence: issue.confidence,
        description: issue.description,
       });
     }

  // Mark audit as completed
  await storage.updateAuditStatus(audit.id, "completed");

  // Clean up temporary files
  fs.unlinkSync(filePath);
  fs.unlinkSync(jsonPath);

  res.json({
    message: "Audit completed",
    auditId: audit.id,
    compilerOutput: output.contracts,
    slitherFindings: detectors,
  });
});
    
  } catch (error: any) {
    console.error("Audit error:", error);
    res.status(500).json({ message: "Audit failed", error: error.message });
  }
  });

  app.get('/api/audits', requireAuth0, async (req, res) => {
    try {
      const audits = await storage.getAudits();
      res.json(audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ message: "Failed to fetch audits" });
    }
  });

  app.get('/api/audits/:id', requireAuth0, async (req, res) => {
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
 
  app.put('/api/audits/:id', requireAuth0, async (req, res) => {
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

  app.delete('/api/audits/:id', requireAuth0, async (req, res) => {
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
  app.get('/api/audits/:auditId/findings', requireAuth0, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const findings = await storage.getAuditFindings(auditId);
      res.json(findings);
    } catch (error) {
      console.error("Error fetching audit findings:", error);
      res.status(500).json({ message: "Failed to fetch audit findings" });
    }
  });

  app.post('/api/audits/:auditId/findings', requireAuth0, async (req, res) => {
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
  app.get('/api/transactions', requireAuth0, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/transactions/high-risk', requireAuth0, async (req, res) => {
    try {
      const transactions = await storage.getHighRiskTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching high-risk transactions:", error);
      res.status(500).json({ message: "Failed to fetch high-risk transactions" });
    }
  });

  app.post('/api/transactions', requireAuth0, async (req, res) => {
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
  app.get('/api/reports', requireAuth0, async (req, res) => {
    try {
      const auditId = req.query.auditId ? parseInt(req.query.auditId as string) : undefined;
      const reports = await storage.getAuditReports(auditId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

// Utility: Map severity → color
const severityColors: Record<string, string> = {
  High: "red",
  Medium: "orange",
  Low: "green",
};

app.get("/api/audits/:id/report", requireAuth0, async (req, res) => {
  const auditId = parseInt(req.params.id);

  const audit = await storage.getAudit(auditId);
  if (!audit) return res.status(404).json({ message: "Audit not found" });

  const findings = await storage.getAuditFindings(auditId);

  // Create PDF
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="audit-${auditId}.pdf"`
  );
  doc.pipe(res);

  // === Branding Header ===
  doc
    .fillColor("#2C3E50")
    .fontSize(24)
    .text("🔐 Smart Contract Audit Report", { align: "center" });
  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor("gray")
    .text("Generated by Audit Platform", { align: "center" });
  doc.moveDown(2);

  // === Audit Metadata ===
  doc
    .fillColor("#000")
    .fontSize(16)
    .text("📄 Audit Details", { underline: true });
  doc.moveDown();

  doc.fontSize(12).text(`Audit ID: ${audit.id}`);
  doc.text(`Contract Name: ${audit.name || "N/A"}`);
  doc.text(`Status: ${audit.status}`);
  doc.text(`Created At: ${new Date(audit.createdAt).toLocaleString()}`);
  doc.moveDown(2);

  // === Findings Section ===
  doc
    .fontSize(16)
    .fillColor("#000")
    .text("⚠️ Findings", { underline: true });
  doc.moveDown();

  if (findings.length === 0) {
    doc.fontSize(12).fillColor("green").text("✅ No vulnerabilities found!");
  } else {
    findings.forEach((f, i) => {
      doc
        .fontSize(14)
        .fillColor(severityColors[f.impact] || "#000")
        .text(`${i + 1}. ${f.check} (${f.impact} Risk)`);

      doc
        .fontSize(11)
        .fillColor("black")
        .text(`Confidence: ${f.confidence}`, { indent: 20 });
      doc
        .fontSize(11)
        .text(`Description: ${f.description}`, { indent: 20 });
      doc.moveDown(1.2);
    });
  }

  // === Footer Branding ===
  doc.moveDown(3);
  doc
    .fontSize(10)
    .fillColor("gray")
    .text(
      "© 2025 Audit Platform. All Rights Reserved.",
      50,
      doc.page.height - 50,
      { align: "center" }
    );

  doc.end();
});


  app.post('/api/reports', requireAuth0, async (req: any, res) => {
    try {
      const user = await getAuth0User(req);
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const reportData = insertAuditReportSchema.parse({
        ...req.body,
        generated_by: user.id,
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
