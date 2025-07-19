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

### AI Integration
- **Google Gemini**: Processes natural language commands in Persian/Farsi
- **Speech-to-Text**: Converts voice messages to text for processing
- **Command Processing**: Extracts financial intents and entities from user input

## Data Flow

1. **Web Dashboard**: Users interact with React frontend → API calls via TanStack Query → Express routes → Drizzle ORM → PostgreSQL
2. **Telegram Interface**: User messages → Bot handlers → AI processing → Database operations → Response to user
3. **Real-time Updates**: Database changes trigger updates across both web and Telegram interfaces

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

The system is designed to be highly configurable with external service integrations being optional, allowing it to function as a basic financial management system even without AI or Telegram capabilities.