# Overview

This is a comprehensive blockchain security audit platform built as a full-stack web application. The system provides professional smart contract analysis, risk assessment, transaction monitoring, and audit report generation capabilities. It's designed for security auditors to analyze blockchain transactions, manage smart contracts, conduct security audits, and generate detailed reports.

The application follows a modern web architecture with a React-based frontend using shadcn/ui components, an Express.js backend API, and PostgreSQL database with Drizzle ORM. Authentication is handled through Replit's OAuth system, making it suitable for deployment on the Replit platform.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Framework**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and API data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite with custom configuration for client-server separation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **API Design**: RESTful API with centralized route registration and middleware
- **Authentication**: Replit OAuth integration with OpenID Connect and Passport.js
- **Session Management**: Express sessions with PostgreSQL session store
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development**: Live reload and hot module replacement for rapid development

## Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Relational database with tables for users, smart contracts, audits, audit findings, transactions, and audit reports
- **Session Storage**: PostgreSQL-backed session store for authentication persistence
- **Migrations**: Drizzle Kit for database schema migrations and version control

## Authentication & Authorization
- **OAuth Provider**: Replit OAuth with OpenID Connect protocol
- **Session Strategy**: Server-side sessions with secure HTTP-only cookies
- **User Management**: Automatic user creation and profile management from OAuth claims
- **Route Protection**: Middleware-based authentication checking for protected API endpoints
- **Security**: CSRF protection, secure session configuration, and environment-based secrets

## Core Business Logic
- **Audit Workflow**: Multi-stage audit process with status tracking (pending, in_progress, completed, failed, paused)
- **Risk Assessment**: Configurable risk analysis with scoring system and risk level categorization
- **Smart Contract Analysis**: Contract upload, verification, and security scanning capabilities
- **Transaction Monitoring**: Real-time transaction analysis with risk scoring and alerting
- **Report Generation**: Automated audit report creation with customizable templates and data export

## Development & Deployment
- **Package Manager**: npm with lock file for consistent dependency versions
- **TypeScript**: Full TypeScript support across frontend, backend, and shared code
- **Code Organization**: Monorepo structure with shared schemas and utilities
- **Build Process**: Separate build processes for client (Vite) and server (esbuild)
- **Development Server**: Integrated development setup with Vite middleware for seamless development experience

# External Dependencies

## Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication & Security
- **Replit OAuth**: Primary authentication provider using OpenID Connect
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **Express Session**: Session management with secure configuration

## Frontend Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form for UI and form management
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS, class-variance-authority for component variants
- **Data Fetching**: TanStack Query for server state management
- **Utilities**: date-fns for date manipulation, clsx for conditional classes

## Backend Libraries
- **Express.js**: Web framework with middleware support
- **WebSocket Support**: ws library for real-time features (Neon compatibility)
- **Validation**: Zod for runtime type checking and validation
- **Utilities**: Memoization, utility libraries for performance optimization

## Development Tools
- **Build Tools**: Vite for frontend, esbuild for backend bundling
- **TypeScript**: Full type safety across the entire application
- **Replit Integration**: Replit-specific plugins for development environment integration
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer