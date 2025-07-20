import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  chatId: text("chat_id").primaryKey(),
  fullName: text("full_name").notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesColleagues = pgTable("sales_colleagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull(), // e.g., 0.1000 for 10%
  createdAt: timestamp("created_at").defaultNow(),
});

export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().unique(),
  ownerName: text("owner_name"),
  phone: text("phone"),
  telegramId: text("telegram_id"),
  panelUsername: text("panel_username").notNull().unique(),
  salesColleagueName: text("sales_colleague_name"),
  totalDebt: numeric("total_debt", { precision: 15, scale: 2 }).default('0'),
  creditLimit: numeric("credit_limit", { precision: 15, scale: 2 }).default('1000000'), // Default 1M Toman credit limit
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  colleagueId: integer("colleague_id").references(() => salesColleagues.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status", { enum: ["unpaid", "partially_paid", "paid"] }).default("unpaid"),
  issueDate: timestamp("issue_date").defaultNow(),
  usageJsonDetails: jsonb("usage_json_details"),
  isManual: boolean("is_manual").default(false),
  usageHash: text("usage_hash"), // Hash to prevent duplicate processing
  processingBatchId: text("processing_batch_id"), // Track which batch created this invoice
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  notes: text("notes"),
});

export const commissionRecords = pgTable("commission_records", {
  id: serial("id").primaryKey(),
  colleagueId: integer("colleague_id").references(() => salesColleagues.id).notNull(),
  sourceInvoiceId: integer("source_invoice_id").references(() => invoices.id).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 15, scale: 2 }).notNull(),
  payoutStatus: text("payout_status", { enum: ["pending", "paid"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  geminiApiKey: text("gemini_api_key"),
  speechToTextProvider: text("speech_to_text_provider").default("google"),
  speechToTextApiKey: text("speech_to_text_api_key"),
  telegramBotToken: text("telegram_bot_token"),
  adminChatId: text("admin_chat_id"),
  invoiceTemplate: text("invoice_template"),
  representativePortalTexts: text("representative_portal_texts"),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Invoice templates for customizable invoice layouts
export const invoiceTemplates = pgTable('invoice_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  headerTitle: varchar('header_title', { length: 200 }).notNull().default('فاکتور فروش'),
  headerSubtitle: varchar('header_subtitle', { length: 200 }).notNull().default('سرویس پروکسی پرسرعت'),
  footerText: text('footer_text').notNull().default('این فاکتور به صورت خودکار توسط سیستم مدیریت مالی تولید شده است'),
  footerContact: text('footer_contact').notNull().default('در صورت هرگونه سوال با پشتیبانی تماس بگیرید'),
  representativeLabel: varchar('representative_label', { length: 100 }).notNull().default('اطلاعات نماینده'),
  invoiceLabel: varchar('invoice_label', { length: 100 }).notNull().default('اطلاعات فاکتور'),
  lineItemLabel: varchar('line_item_label', { length: 100 }).notNull().default('شرح خدمات'),
  totalLabel: varchar('total_label', { length: 100 }).notNull().default('جمع کل'),
  payableLabel: varchar('payable_label', { length: 100 }).notNull().default('مبلغ قابل پرداخت'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Invoice template types
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type NewInvoiceTemplate = typeof invoiceTemplates.$inferInsert;

// Create insert schema for invoice templates
export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;

// Insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({ createdAt: true });
export const insertSalesColleagueSchema = createInsertSchema(salesColleagues).omit({ id: true, createdAt: true });
export const insertRepresentativeSchema = createInsertSchema(representatives).omit({ id: true, createdAt: true, totalDebt: true });
export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({ id: true, issueDate: true })
  .extend({
    amount: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, {
      message: "Amount must be a valid non-negative number"
    })
  });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paymentDate: true });
export const insertCommissionRecordSchema = createInsertSchema(commissionRecords).omit({ id: true, createdAt: true });
export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type SalesColleague = typeof salesColleagues.$inferSelect;
export type InsertSalesColleague = z.infer<typeof insertSalesColleagueSchema>;
export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = z.infer<typeof insertCommissionRecordSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

// Reminder Rules for Automated Payment Notifications
export const reminderRules = pgTable('reminder_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  triggerConditions: jsonb('trigger_conditions').notNull(),
  schedulePattern: varchar('schedule_pattern', { length: 100 }).notNull(),
  channels: text('channels').array().notNull(),
  templateId: integer('template_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Message Templates for Multi-language Support
export const messageTemplates = pgTable('message_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  language: varchar('language', { length: 10 }).default('fa').notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  variables: jsonb('variables'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Reminder Logs for Tracking and Analytics
export const reminderLogs = pgTable('reminder_logs', {
  id: serial('id').primaryKey(),
  representativeId: integer('representative_id').references(() => representatives.id).notNull(),
  ruleId: integer('rule_id').references(() => reminderRules.id).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  messageContent: text('message_content'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  deliveryStatus: varchar('delivery_status', { length: 50 }).default('pending').notNull(),
  responseReceived: boolean('response_received').default(false).notNull(),
  responseContent: text('response_content'),
  nextReminderAt: timestamp('next_reminder_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Risk Profiles for AI Analytics
export const riskProfiles = pgTable('risk_profiles', {
  id: serial('id').primaryKey(),
  representativeId: integer('representative_id').references(() => representatives.id).notNull(),
  riskScore: decimal('risk_score', { precision: 5, scale: 4 }).notNull(),
  riskCategory: varchar('risk_category', { length: 20 }).notNull(),
  factors: jsonb('factors').notNull(),
  paymentProbability30d: decimal('payment_probability_30d', { precision: 5, scale: 4 }),
  paymentProbability60d: decimal('payment_probability_60d', { precision: 5, scale: 4 }),
  paymentProbability90d: decimal('payment_probability_90d', { precision: 5, scale: 4 }),
  recommendedActions: jsonb('recommended_actions'),
  modelVersion: varchar('model_version', { length: 50 }),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Chat Sessions for Intelligent Chatbot
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  context: jsonb('context'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Chat Messages for Conversation History
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').references(() => chatSessions.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  intent: varchar('intent', { length: 100 }),
  entities: jsonb('entities'),
  responseTimeMs: integer('response_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Credit Control System
export const creditLimits = pgTable('credit_limits', {
  id: serial('id').primaryKey(),
  representativeId: integer('representative_id').references(() => representatives.id).notNull(),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).notNull(),
  availableCredit: numeric('available_credit', { precision: 15, scale: 2 }).notNull(),
  lastReviewDate: timestamp('last_review_date').defaultNow().notNull(),
  autoAdjust: boolean('auto_adjust').default(true).notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Cash Flow Forecasting
export const cashFlowForecasts = pgTable('cash_flow_forecasts', {
  id: serial('id').primaryKey(),
  forecastDate: timestamp('forecast_date').notNull(),
  expectedInflows: numeric('expected_inflows', { precision: 15, scale: 2 }).notNull(),
  expectedOutflows: numeric('expected_outflows', { precision: 15, scale: 2 }).notNull(),
  netCashFlow: numeric('net_cash_flow', { precision: 15, scale: 2 }).notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(), // 0.0 to 1.0
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Profitability Analysis
export const profitabilityReports = pgTable('profitability_reports', {
  id: serial('id').primaryKey(),
  representativeId: integer('representative_id').references(() => representatives.id),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  totalRevenue: numeric('total_revenue', { precision: 15, scale: 2 }).notNull(),
  totalCosts: numeric('total_costs', { precision: 15, scale: 2 }).notNull(),
  netProfit: numeric('net_profit', { precision: 15, scale: 2 }).notNull(),
  profitMargin: decimal('profit_margin', { precision: 5, scale: 4 }).notNull(),
  roi: decimal('roi', { precision: 5, scale: 4 }).notNull(), // Return on Investment
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Bank Reconciliation
export const bankTransactions = pgTable('bank_transactions', {
  id: serial('id').primaryKey(),
  bankReference: varchar('bank_reference', { length: 100 }).notNull().unique(),
  transactionDate: timestamp('transaction_date').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  reconciled: boolean('reconciled').default(false).notNull(),
  matchedPaymentId: integer('matched_payment_id').references(() => payments.id),
  importBatch: varchar('import_batch', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Security Audit Log
export const securityAuditLog = pgTable('security_audit_log', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Insert schemas for new tables
export const insertReminderRuleSchema = createInsertSchema(reminderRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({ id: true, sentAt: true, createdAt: true });
export const insertRiskProfileSchema = createInsertSchema(riskProfiles).omit({ id: true, calculatedAt: true, createdAt: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ startedAt: true, lastActivity: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

// New types for advanced features
export type ReminderRule = typeof reminderRules.$inferSelect;
export type InsertReminderRule = z.infer<typeof insertReminderRuleSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type InsertReminderLog = z.infer<typeof insertReminderLogSchema>;
export type RiskProfile = typeof riskProfiles.$inferSelect;
export type InsertRiskProfile = z.infer<typeof insertRiskProfileSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// New schema types for advanced features
export const insertCreditLimitSchema = createInsertSchema(creditLimits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCashFlowForecastSchema = createInsertSchema(cashFlowForecasts).omit({ id: true, createdAt: true });
export const insertProfitabilityReportSchema = createInsertSchema(profitabilityReports).omit({ id: true, createdAt: true });
export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({ id: true, createdAt: true });
export const insertSecurityAuditLogSchema = createInsertSchema(securityAuditLog).omit({ id: true, timestamp: true });

// New types for advanced features
export type CreditLimit = typeof creditLimits.$inferSelect;
export type InsertCreditLimit = z.infer<typeof insertCreditLimitSchema>;
export type CashFlowForecast = typeof cashFlowForecasts.$inferSelect;
export type InsertCashFlowForecast = z.infer<typeof insertCashFlowForecastSchema>;
export type ProfitabilityReport = typeof profitabilityReports.$inferSelect;
export type InsertProfitabilityReport = z.infer<typeof insertProfitabilityReportSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditLog = z.infer<typeof insertSecurityAuditLogSchema>;

// Messages sent to representatives in the portal
export const representativeMessages = pgTable('representative_messages', {
  id: serial('id').primaryKey(),
  representativeId: integer('representative_id').references(() => representatives.id).notNull(),
  senderType: text('sender_type', { enum: ['admin', 'system'] }).notNull().default('admin'),
  senderName: varchar('sender_name', { length: 100 }).notNull().default('مدیریت سیستم'),
  subject: varchar('subject', { length: 200 }),
  message: text('message').notNull(),
  messageType: text('message_type', { enum: ['info', 'warning', 'urgent', 'payment_reminder'] }).notNull().default('info'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Persian calendar support for invoices
export const invoiceDetails = pgTable('invoice_details', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  persianDate: varchar('persian_date', { length: 20 }).notNull(), // e.g., "1403/04/30"
  persianMonth: varchar('persian_month', { length: 20 }).notNull(), // e.g., "مهر"
  persianYear: varchar('persian_year', { length: 10 }).notNull(), // e.g., "1403"
  detailedDescription: text('detailed_description'),
  lineItems: jsonb('line_items'), // Detailed breakdown of services
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Insert schemas for new Phase 4 tables
export const insertRepresentativeMessageSchema = createInsertSchema(representativeMessages).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  isRead: true,
  readAt: true 
});

export const insertInvoiceDetailSchema = createInsertSchema(invoiceDetails).omit({ 
  id: true, 
  createdAt: true 
});

// Types for new Phase 4 tables
export type RepresentativeMessage = typeof representativeMessages.$inferSelect;
export type InsertRepresentativeMessage = z.infer<typeof insertRepresentativeMessageSchema>;
export type InvoiceDetail = typeof invoiceDetails.$inferSelect;
export type InsertInvoiceDetail = z.infer<typeof insertInvoiceDetailSchema>;
