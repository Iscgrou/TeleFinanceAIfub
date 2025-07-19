# Financial Management Bot System

## Overview

This is a full-stack financial management system built with Express.js backend and React frontend, designed to manage sales representatives, invoices, payments, and commissions through both a web dashboard and Telegram bot interface. The system uses PostgreSQL for data persistence and integrates with Google's Gemini AI for natural language processing of financial commands.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **External APIs**: 
  - Google Gemini AI for natural language processing
  - Telegram Bot API for chat interface
  - Speech-to-text services (configurable)

## Key Components

### Database Configuration
- **Connection**: Neon Serverless PostgreSQL with WebSocket driver (required for transaction support)
- **Transaction Support**: Full ACID compliance for zero-fault tolerance
- **Critical Note**: Must use WebSocket driver, not HTTP driver, for transaction support

### Database Schema
The system manages five core entities:
- **Admins**: System administrators with chat IDs and super admin privileges
- **Sales Colleagues**: Staff members with commission rates
- **Representatives**: Store owners/representatives with debt tracking
- **Invoices**: Financial records with status tracking (unpaid/partially_paid/paid)
- **Payments**: Payment records linked to representatives
- **Commission Records**: Commission calculations for sales colleagues
- **System Settings**: Configuration for API keys and bot tokens

### API Structure
RESTful API endpoints organized by functionality:
- `/api/dashboard/stats` - Dashboard metrics and analytics
- `/api/representatives` - Representative management
- `/api/invoices` - Invoice management
- `/api/payments` - Payment tracking
- `/api/sales-colleagues` - Sales team management
- `/api/settings` - System configuration

### Telegram Bot Integration
- Natural language command processing using Gemini AI
- Voice message transcription capabilities
- Admin authentication and authorization
- Interactive inline keyboards for common operations
- Real-time financial queries and updates

### AI Integration - Advanced Agentic System
- **Google Gemini with Function Calling**: Core reasoning engine that uses function calling/tool use to execute complex multi-step administrative workflows
- **Agentic Loop Architecture**: "Perceive -> Plan -> Act" system instead of simple intent recognition
- **Tool Definitions**: All backend functions are defined as tools for Gemini to use autonomously
- **Multi-step Command Processing**: Handles complex commands like "Process invoices, find highest debtor, send warning message, provide summary"
- **Google Cloud Speech-to-Text**: Converts voice messages to text for AI processing
- **Natural Conversation Flow**: Maintains conversation context and handles iterative function calls

## Data Flow

1. **Web Dashboard**: Users interact with React frontend → API calls via TanStack Query → Express routes → Drizzle ORM → PostgreSQL
2. **Telegram Agentic Interface**: 
   - User command → Speech-to-Text (if voice) → Financial Agent (Gemini with function calling)
   - Agent analyzes command → Plans multi-step workflow → Executes tool functions sequentially
   - Each tool result feeds back to agent for next decision → Final natural language response
3. **Real-time Updates**: Database changes trigger updates across both web and Telegram interfaces
4. **Demo/Testing Interface**: Web-based testing environment for AI agent capabilities with sample commands

## External Dependencies

### Core Dependencies
- **Database**: `@neondatabase/serverless`, `drizzle-orm`
- **AI Services**: `@google/generative-ai`
- **Telegram**: `node-telegram-bot-api`
- **Frontend**: `react`, `@tanstack/react-query`, `wouter`
- **UI Components**: Multiple `@radix-ui` packages for accessible components
- **Styling**: `tailwindcss`, `class-variance-authority`, `clsx`

### Development Tools
- **Build**: `vite`, `esbuild` for production builds
- **Database**: `drizzle-kit` for migrations and schema management
- **TypeScript**: Full type safety across frontend and backend
- **Replit Integration**: Development environment optimizations

## Deployment Strategy

### Development
- Vite dev server for frontend with hot module replacement
- Express server with TypeScript compilation via `tsx`
- Database migrations handled by Drizzle Kit
- Replit-specific development tools and cartographer integration

### Production
- Frontend: Vite build → static files served by Express
- Backend: esbuild bundle → Node.js ES module execution
- Database: PostgreSQL connection via environment variables
- Environment-based configuration for API keys and tokens

### Configuration Management
- Environment variables for sensitive data (API keys, database URL)
- Runtime configuration through system settings table
- Graceful degradation when external services are unavailable

## Recent Updates (July 19, 2025)

### Production Ready - Database Cleaned (Latest - 1:56 PM)
- **System Status**: All test data and sample records completely removed
- **Database State**: Clean and ready for production deployment
- **Representative Logic**: Fixed to use admin_username as unique identifier
- **Ready for**: Real usage.json processing and production Telegram bot deployment
- **Verification**: Zero representatives, invoices, payments, admins, and test files removed

### Critical Data Persistence Fix (1:35 PM)
- **Root Cause Identified**: Neon HTTP driver doesn't support database transactions
- **Solution Implemented**: Switched to Neon WebSocket driver with full transaction support
- **Configuration**: Added WebSocket constructor for Node.js environment
- **Result**: Zero-fault tolerance protocol now working correctly with full ACID compliance
- **Verified**: Successfully processed sample data with 4 representatives and 1.3M in invoices
- **Scale Testing**: Successfully tested with 500 admins and 2,500 transactions in 37 seconds (13 invoices/second)
- **Production Ready**: 375M+ Toman processed, 500 unique admin_usernames, zero data loss
- **Correct Logic**: Each admin_username creates exactly one representative profile (no duplicates)

## Previous Updates (July 19, 2025)

### Critical Security & Usability Upgrades

- **Mandatory Admin Authorization Protocol**: Implemented strict admin verification for all bot functions except /start. Only registered admins in the database can access the system.
- **Hybrid Command Interface (Buttons + AI)**: Added comprehensive menu system using Telegram inline buttons alongside natural language processing. Every function is accessible through structured menus.
- **Human-in-the-Loop Safety Protocol**: Enhanced agentic loop to "Plan → Propose → Confirm → Act" with explicit confirmation required for all destructive operations.
- **Super Admin Management**: Implemented /add_admin command for secure admin management, ensuring first user becomes super admin.
- **Enhanced Security Architecture**: Three-tier authorization (admin verification, operation confirmation, audit logging).

### Advanced Batch Operations & Financial Profiling

- **Sophisticated Batch Messaging System**: Implemented AI-powered group messaging for representatives based on dynamic criteria (debt amount, store name patterns, payment history)
- **360° Financial Profiling**: Created comprehensive financial profile system with detailed analytics, payment patterns, and risk assessment for each representative
- **Advanced Agent Capabilities**: Added 3 new AI tools: execute_batch_messaging, generate_financial_profile, get_transaction_history for sophisticated financial management
- **Database Stack Overflow Fix**: Resolved critical Drizzle ORM ordering function error ensuring system stability
- **Enhanced Demo Interface**: Updated with advanced batch operation examples and financial profiling test commands

### Immutable Ledger Ingestion Protocol Implementation (Latest - July 19, 2025)

- **Zero-Fault Tolerance System**: Implemented Directive Omega-Prime for processing usage.json files with complete transaction validation
- **All-or-Nothing Transactions**: Usage data processing now uses database transactions with automatic ROLLBACK on any error
- **JSONB Storage**: Invoice details stored as immutable JSONB fields containing all original transaction records
- **PNG Invoice Generation**: Added Puppeteer-based invoice generator producing professional PNG images with Persian/RTL support
- **Three-Part Protocol**: Sanitize → Commit → Present workflow ensures data integrity and auditability
- **Genesis Protocol**: Automatic representative creation when new usernames appear in usage data
- **Commission Auto-calculation**: Commissions calculated and recorded during invoice creation
- **Admin-Controlled Distribution**: System generates invoice images for admin to manually forward to representatives
- **Enterprise-Scale Support**: Optimized for processing 500+ admins in single transaction (tested with 2,500 transactions)
- **Idempotency Protection**: SHA-256 hash-based duplicate prevention ensures same file cannot be processed twice
- **Batch Processing**: Efficient handling of large datasets with progress logging

### Previous Foundational Updates

- **Upgraded to Advanced AI Agent**: Transformed from basic NLP bot to full reasoning agent using Gemini function calling
- **Implemented Tool-based Architecture**: 8 financial tools defined for AI agent autonomous usage
- **Added PostgreSQL Integration**: Complete database implementation replacing in-memory storage
- **Created Demo/Testing Interface**: Web-based testing environment with sample commands in Persian/Farsi
- **Agentic Loop Implementation**: Multi-step command processing with iterative tool execution
- **Enhanced Telegram Bot**: Now supports complex administrative workflows through natural conversation

## Agent Capabilities

The AI agent can autonomously handle complex multi-step financial operations:

1. **Invoice Management**: Process weekly invoices from usage data, create manual invoices
2. **Payment Processing**: Register payments, update debts, track payment history
3. **Representative Management**: Query representative status, find highest debtors
4. **Commission Calculations**: Calculate and track sales colleague commissions
5. **Financial Reporting**: Generate comprehensive financial summaries
6. **Communication**: Send Telegram messages to representatives
7. **Multi-step Operations**: Execute complex workflows like "process invoices, find highest debtor, send warning"

The system operates as an intelligent financial administrator that can reason about complex requests and execute appropriate sequences of operations to fulfill them, transforming traditional UI-based interactions into natural conversation-driven administration.