import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  telegramId: text("telegram_id"),
  panelUsername: text("panel_username").notNull().unique(),
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
