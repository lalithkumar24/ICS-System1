import type { Express, RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";

// Simple local development authentication bypass
export function getLocalSession() {
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

export async function setupLocalAuth(app: Express) {
  app.use(getLocalSession());

  // Mock login endpoint for local development
  app.get("/api/login", async (req, res) => {
    // Create or get a test user
    const testUser = {
      id: "local-test-user-123",
      email: "test@localhost.dev",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null,
    };

    try {
      await storage.upsertUser(testUser);
      (req.session as any).user = testUser;
      res.redirect("/");
    } catch (error) {
      console.error("Local auth error:", error);
      res.status(500).json({ message: "Local auth setup failed" });
    }
  });

  // Mock callback endpoint
  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isLocalAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionUser = (req.session as any)?.user;
  
  if (!sessionUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request object in the format expected by the app
  req.user = sessionUser;
  return next();
};