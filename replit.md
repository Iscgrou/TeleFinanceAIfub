# Advanced AI-Powered Financial Management Platform

## Project Overview
An advanced AI-powered financial management platform specifically designed for proxy service businesses, focusing on intelligent debt recovery and comprehensive financial analytics through a modern, responsive web architecture with integrated Telegram bot functionality.

### Primary Purpose
- **Debt Management**: Track and manage representative debts with intelligent recovery strategies
- **Financial Analytics**: Real-time financial health monitoring and predictive analytics
- **Multi-channel Communication**: Telegram bot integration for seamless representative interactions
- **Representative Portal**: Web-based management interface with granular access controls

### Current System Statistics
- **Active Representatives**: 200
- **Total Outstanding Debt**: 0 Toman (after testing debt adjustments)
- **Sales Colleagues**: 2 active colleagues
- **Data Structure**: All representatives updated with complete profiles
- **System Status**: Operational with CRUD functions working

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js with Server-Side Rendering
- **Language**: TypeScript
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query + Zustand
- **Charts & Visualizations**: Recharts library
- **Language Support**: Persian RTL + English with i18n

### Backend Infrastructure
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket (Socket.IO) for live updates
- **Session Management**: Express Sessions with PostgreSQL store
- **Job Processing**: Bull Queue with Redis
- **External APIs**: Telegram Bot API, Twilio (SMS), SendGrid (Email)

### Core Features
1. **Representative Management**: CRUD operations with debt tracking
2. **Invoice System**: Automated invoice generation with PNG export
3. **Payment Tracking**: Real-time payment processing and history
4. **Financial Analytics**: Dynamic dashboards and reporting
5. **Telegram Bot Integration**: AI-powered conversational interface
6. **Multi-user System**: Role-based access control

## User Preferences

### Communication Style
- Primary language: Persian (Farsi)
- Technical level: Business-focused (non-technical explanations)
- Response format: Concise, action-oriented
- Error reporting: Clear, user-friendly messages

### Development Preferences
- Code organization: Feature-based modular structure
- Database operations: Use Drizzle ORM with type safety
- UI consistency: Maintain shadcn/ui design system
- Performance: Prioritize user experience and responsiveness

## Recent Changes (July 20, 2025)

### ✅ **RESOLVED CRITICAL ISSUES:**
- **Fixed JSON parsing errors** that prevented form submissions
- **Fixed debt adjustment APIs** - increase/decrease debt functionality working
- **Fixed representative editing** by updating old data schema to new structure
- **Fixed sales colleague editing** with proper error handling
- **Fixed invoice creation** by removing incompatible description field
- **Updated 199 legacy representatives** with proper owner names, phone numbers, and sales colleague assignments
- **Set default sales colleague** (سارا احمدی - ID: 2) for usage file processing

### ✅ **Data Structure Improvements:**
- All 200 representatives now have complete profiles
- Random sales colleague assignment completed
- System settings configured for usage processing
- Database schema fully aligned with frontend validation

### Next Priority Actions
→ Fix public portal accessibility in all browsers (Safari, Chrome, Firefox)
→ Implement comprehensive settings page with visual editors
→ Add representative messaging system in portal
→ Enable invoice detail breakdown with Shamsi date support

## Development Guidelines

### Code Quality Standards
- Follow TypeScript strict mode
- Use Drizzle ORM for all database operations
- Implement proper error handling with user-friendly messages
- Maintain consistent Persian language support
- Ensure responsive design for all screen sizes

### Database Management
- Use `npm run db:push` for schema migrations
- Never manually write SQL migrations
- Update both `shared/schema.ts` and `server/storage.ts` for schema changes
- Maintain referential integrity for all foreign keys

### Testing & Deployment
- Test all functionality before marking complete
- Verify Persian text rendering and RTL layout
- Ensure mobile responsiveness
- Validate all form submissions and error states

## Project Status: ACTIVE DEVELOPMENT
**Last Updated**: July 20, 2025
**Current Focus**: Fixing critical CRUD operations and UI navigation issues
**Deployment**: Replit production environment with PostgreSQL database

---

*This document serves as the central source of truth for project context, user preferences, and architectural decisions. It should be updated whenever significant changes are made or user preferences are clarified.*