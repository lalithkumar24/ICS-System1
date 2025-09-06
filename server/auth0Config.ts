import { auth, ConfigParams } from 'express-openid-connect';
import type { Express, RequestHandler } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import "dotenv/config"; 

// Auth0 configuration
const getAuth0Config = (): ConfigParams => {
  console.log('Environment check:');
  console.log('AUTH0_SECRET:', process.env.AUTH0_SECRET ? 'Set' : 'Missing');
  console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET ? 'Set' : 'Missing');
  console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID ? 'Set' : 'Missing');
  console.log('AUTH0_ISSUER_BASE_URL:', process.env.AUTH0_ISSUER_BASE_URL);

  if (!process.env.AUTH0_SECRET) {
    throw new Error('AUTH0_SECRET environment variable is required');
  }
  if (!process.env.AUTH0_BASE_URL) {
    throw new Error('AUTH0_BASE_URL environment variable is required');
  }
  if (!process.env.AUTH0_CLIENT_ID) {
    throw new Error('AUTH0_CLIENT_ID environment variable is required');
  }
  if (!process.env.AUTH0_CLIENT_SECRET) {
    throw new Error('AUTH0_CLIENT_SECRET environment variable is required');
  }
  if (!process.env.AUTH0_ISSUER_BASE_URL) {
    throw new Error('AUTH0_ISSUER_BASE_URL environment variable is required');
  }

  return {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  routes: {                          // ← NEW: Added this entire routes block
    login: '/api/login',
    logout: '/api/logout',
    callback: '/api/callback'
  },
  authorizationParams: {
    response_type: 'code',
    response_mode: 'query',
    scope: 'openid profile email',
  },
  session: {
    rollingDuration: 7 * 24 * 60 * 60, // 7 days in seconds
    absoluteDuration: 7 * 24 * 60 * 60 * 60 // 7 days in seconds
  }
  };
};

// Session configuration for Auth0
export function getAuth0Session() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.AUTH0_SECRET || process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// User upsert function for Auth0 users
async function upsertAuth0User(user: any) {
  const userData = {
    id: user.sub, // Auth0 user ID
    email: user.email,
    firstName: user.given_name || user.name?.split(' ')[0] || null,
    lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || null,
    profileImageUrl: user.picture || null,
  };

  await storage.upsertUser(userData);
  return userData;
}

// Setup Auth0 authentication
export async function setupAuth0(app: Express) {
  // Configure session middleware
  app.use(getAuth0Session());

  // Configure Auth0 middleware
  const config = getAuth0Config();
  app.use(auth(config));

  // Handle user creation after authentication
  app.use((req, res, next) => {
    if (req.oidc.isAuthenticated() && req.oidc.user && !req.session.userProcessed) {
      upsertAuth0User(req.oidc.user)
        .then(() => {
          req.session.userProcessed = true;
        })
        .catch(error => {
          console.error('Error upserting Auth0 user:', error);
        });
    }
    next();
  });
}

// Auth0 authentication middleware
export const requireAuth0: RequestHandler = (req, res, next) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Get Auth0 user info
export const getAuth0User = async (req: any) => {
  if (!req.oidc.isAuthenticated() || !req.oidc.user) {
    return null;
  }

  try {
    // Ensure user exists in our database
    const userData = await upsertAuth0User(req.oidc.user);
    return await storage.getUser(userData.id);
  } catch (error) {
    console.error('Error getting Auth0 user:', error);
    return null;
  }
};
