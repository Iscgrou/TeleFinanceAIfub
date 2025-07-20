# Financial Management System with Representative Portals

## Overview

A comprehensive financial management platform designed for proxy service businesses, featuring:
- **Web Dashboard**: Complete admin interface for financial management
- **Representative Portals**: Individual portals for each representative at `/portal/username`  
- **Sales Colleague Profiles**: Comprehensive profile system for sales staff
- **Telegram Bot Integration**: AI-powered bot for administrative tasks
- **Automatic Portal Assignment**: Every representative gets their own portal upon registration

## User Preferences

- **Communication Style**: Simple, everyday language
- **Interface Language**: Persian/Farsi with RTL support
- **User Focus**: Financial managers and accounting staff

## Core Objectives

### 1. Representative Management System
- **Individual Portals**: Each representative has a unique portal showing their financial status
- **Profile System**: Comprehensive profiles including debt tracking, invoice history, payment records
- **Automatic Assignment**: Portal creation upon adding representatives (manual or JSON import)
- **Real-time Data**: Live debt status, invoice tracking, payment history

### 2. Sales Colleague Management
- **Staff Profiles**: Complete profile system for sales colleagues
- **Commission Tracking**: Automated commission calculations and records
- **Performance Analytics**: Individual and team performance metrics
- **Portal Access**: Each colleague gets management access based on role

### 3. Financial Operations
- **Invoice Management**: Complete invoice lifecycle from creation to payment
- **Payment Tracking**: Real-time payment processing and debt updates
- **Debt Management**: Automated debt tracking and reminder systems
- **Financial Analytics**: Comprehensive reporting and analysis tools

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state
- **UI Framework**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with Persian RTL support
- **Build Tool**: Vite for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini for natural language processing
- **External APIs**: Telegram Bot API, Speech-to-Text services
- **Transaction Support**: Full ACID compliance with WebSocket driver

### Database Schema
Core entities:
- **Representatives**: Store owners with individual portal access
- **Sales Colleagues**: Staff members with commission tracking
- **Invoices**: Financial records with status tracking
- **Payments**: Payment records linked to representatives
- **Commission Records**: Commission calculations for sales staff
- **System Settings**: Configuration and customization options

## Representative Portal System

### Portal Features (Critical - Currently Missing)
- **Individual Access**: Each representative accesses `/portal/their-username`
- **Debt Dashboard**: Real-time total debt display with visual indicators
- **Invoice History**: Complete list of invoices with status and details
- **Payment History**: Record of all payments made
- **Invoice Details Modal**: Detailed view of line items and invoice information
- **Customizable Interface**: Admin-configurable portal texts and labels

### Automatic Portal Assignment (Critical - Currently Missing)
- **Manual Addition**: When admin adds representative → automatic portal creation
- **JSON Import**: Bulk import from usage files → individual portals for each
- **Unique URLs**: Each representative gets secure access to their portal
- **Data Isolation**: Complete separation of data between representatives

## Sales Colleague Profile System (Critical - Currently Missing)

### Profile Components
- **Personal Information**: Name, contact details, role assignments
- **Commission Tracking**: Real-time commission calculations and history
- **Performance Metrics**: Sales performance and representative assignments
- **Access Controls**: Role-based permissions for system features

## API Structure

### Core Endpoints
- `/api/representatives` - Representative CRUD operations
- `/api/representatives/by-username/:username` - Portal data retrieval
- `/api/representatives/:id/invoices` - Representative-specific invoices
- `/api/representatives/:id/payments` - Representative-specific payments
- `/api/sales-colleagues` - Sales colleague management
- `/api/dashboard/stats` - System analytics and metrics

### Portal-Specific Endpoints (Critical - Currently Missing)
- `/api/portal/texts` - Customizable portal interface texts
- `/api/portal/settings` - Portal configuration and themes
- `/api/representatives/:id/profile` - Complete representative profile data

## Telegram Bot Integration

### AI-Powered Features
- **Natural Language Processing**: Google Gemini with function calling
- **Multi-step Workflows**: Complex administrative task automation
- **Voice Message Support**: Speech-to-text for voice commands
- **Real-time Queries**: Instant access to financial data and operations

### Administrative Commands
- Representative management (add, update, query)
- Invoice generation and processing
- Payment recording and tracking
- Financial reporting and analytics

## Data Flow

### Representative Portal Flow (Critical - Currently Missing)
1. **Portal Access**: Representative visits `/portal/username`
2. **Authentication**: Username validation and data retrieval
3. **Data Loading**: Fetch representative-specific invoices, payments, debt status
4. **Real-time Updates**: Live synchronization with admin system changes

### Administrative Flow
1. **Web Dashboard**: Admin actions → API calls → Database updates
2. **Telegram Bot**: Commands → AI processing → Database operations
3. **Cross-platform Sync**: All changes reflected across web and Telegram interfaces

## Current System Status (July 20, 2025)

### ✅ Completed Features
- Unified web dashboard with responsive sidebar
- Complete CRUD operations for representatives and sales colleagues
- Advanced financial analytics (credit management, cash flow, profitability)
- Telegram bot with AI integration
- Database schema and API endpoints
- **Representative Portal System**: Individual portals at `/portal/username` ✅ RESTORED
- **Portal Links**: Direct links from admin dashboard to representative portals ✅ ADDED
- **Profile API Endpoints**: Complete stats and data APIs for representatives and colleagues ✅ RESTORED
- **Representative Profile Component**: Comprehensive profile management ✅ CREATED
- **Sales Colleague Profile Component**: Full profile system for sales staff ✅ CREATED

### ✅ Recently Restored (July 20, 2025 - 10:26 AM)
- **Automatic Portal Assignment**: Every representative now has automatic portal access
- **Profile Data Integration**: Complete profile data display and management
- **Portal Customization**: Admin-configurable portal texts and settings
- **Cross-System Integration**: Seamless connection between admin dashboard and portals

## Deployment Configuration

### Development Environment
- Vite dev server with hot module replacement
- Express server with TypeScript compilation
- PostgreSQL database with Neon serverless
- Environment-based configuration management

### Production Strategy
- Static frontend served by Express
- Optimized database queries with pagination
- Secure API endpoints with proper validation
- Real-time data synchronization across platforms

## Next Priority Actions

1. **Restore Representative Portal System** - Recreate individual portal functionality
2. **Implement Automatic Portal Assignment** - Ensure new representatives get portals
3. **Create Sales Colleague Profile System** - Comprehensive profile management
4. **Add Portal Customization** - Admin controls for portal appearance and texts
5. **Test Portal Integration** - Verify data flow between admin system and portals