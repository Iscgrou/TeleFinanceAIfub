import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sales Colleagues (همکاران فروش)
export const salesColleagues = pgTable("sales_colleagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull(), // e.g., 10.50 for 10.5%
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Representatives (نمایندگان)
export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  storeName: text("store_name").notNull(),
  phone: text("phone"),
  panelUsername: text("panel_username").notNull().unique(),
  salesColleagueId: integer("sales_colleague_id").references(() => salesColleagues.id),
  accountBalance: numeric("account_balance", { precision: 15, scale: 2 }).default('0'), // موجودی حساب
  creditLimit: numeric("credit_limit", { precision: 15, scale: 2 }).default('1000000'),
  tariffs: jsonb("tariffs"), // 12 سطح تعرفه
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices (فاکتورها)
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 15, scale: 2 }).default('0'),
  finalAmount: numeric("final_amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status", { enum: ["unpaid", "partially_paid", "paid", "overdue"] }).default("unpaid"),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  isManual: boolean("is_manual").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Items (آیتم‌های فاکتور)
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments (پرداخت‌ها)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: text("payment_method").default("cash"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  isAllocated: boolean("is_allocated").default(false), // آیا تخصیص یافته است
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Allocations (تخصیص پرداخت‌ها)
export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  allocatedAmount: numeric("allocated_amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs (ردگیری تغییرات)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").default("admin"), // فعلاً فقط ادمین
  action: text("action").notNull(), // e.g., "افزودن نماینده", "حذف فاکتور"
  entityType: text("entity_type").notNull(), // e.g., "representative", "invoice"
  entityId: text("entity_id"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// System Settings (تنظیمات سیستم)
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: text("category").default("general"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Templates (قالب‌های فاکتور)
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name").default("شرکت پروکسی سرویس"),
  headerTitle: text("header_title").default("فاکتور فروش"),
  footerText: text("footer_text").default("با تشکر از انتخاب شما"),
  primaryColor: text("primary_color").default("#1f2937"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertSalesColleagueSchema = createInsertSchema(salesColleagues).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertRepresentativeSchema = createInsertSchema(representatives).omit({ 
  id: true, 
  accountBalance: true,
  createdAt: true, 
  updatedAt: true 
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  invoiceNumber: true,
  issueDate: true,
  createdAt: true, 
  updatedAt: true 
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  paymentDate: true,
  createdAt: true 
});

export const insertPaymentAllocationSchema = createInsertSchema(paymentAllocations).omit({ 
  id: true, 
  createdAt: true 
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ 
  id: true, 
  timestamp: true 
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Types
export type SalesColleague = typeof salesColleagues.$inferSelect;
export type InsertSalesColleague = z.infer<typeof insertSalesColleagueSchema>;

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type PaymentAllocation = typeof paymentAllocations.$inferSelect;
export type InsertPaymentAllocation = z.infer<typeof insertPaymentAllocationSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;

// Extended types for complex operations
export interface RepresentativeWithDetails extends Representative {
  salesColleague?: SalesColleague;
  totalInvoices?: number;
  totalPaid?: number;
  totalUnpaid?: number;
  lastPaymentDate?: Date;
}

export interface InvoiceWithDetails extends Invoice {
  representative?: Representative;
  items?: InvoiceItem[];
  payments?: PaymentAllocation[];
  salesColleague?: SalesColleague;
}

export interface DashboardStats {
  totalRevenue: number;
  totalCommissions: number;
  netProfit: number;
  activeRepresentatives: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  topPerformers: Array<{ name: string; amount: number }>;
}