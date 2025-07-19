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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({ createdAt: true });
export const insertSalesColleagueSchema = createInsertSchema(salesColleagues).omit({ id: true, createdAt: true });
export const insertRepresentativeSchema = createInsertSchema(representatives).omit({ id: true, createdAt: true, totalDebt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, issueDate: true });
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
