import { 
  admins, salesColleagues, representatives, invoices, payments, 
  commissionRecords, systemSettings,
  type Admin, type InsertAdmin,
  type SalesColleague, type InsertSalesColleague,
  type Representative, type InsertRepresentative,
  type Invoice, type InsertInvoice,
  type Payment, type InsertPayment,
  type CommissionRecord, type InsertCommissionRecord,
  type SystemSettings, type InsertSystemSettings
} from "@shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, sql } from 'drizzle-orm';
import ws from 'ws';

export interface IStorage {
  // Admin management
  getAdmin(chatId: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminCount(): Promise<number>;
  getAllAdmins(): Promise<Admin[]>;

  // Sales colleagues
  getSalesColleagues(): Promise<SalesColleague[]>;
  getSalesColleagueByName(name: string): Promise<SalesColleague | undefined>;
  createSalesColleague(colleague: InsertSalesColleague): Promise<SalesColleague>;

  // Representatives
  getRepresentatives(): Promise<Representative[]>;
  getRepresentativeByStoreName(storeName: string): Promise<Representative | undefined>;
  createRepresentative(representative: InsertRepresentative): Promise<Representative>;
  updateRepresentativeDebt(id: number, newDebt: string): Promise<void>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByRepresentative(representativeId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsByRepresentative(representativeId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Commission records
  getCommissionsByColleague(colleagueId: number): Promise<CommissionRecord[]>;
  createCommissionRecord(record: InsertCommissionRecord): Promise<CommissionRecord>;

  // System settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalDebt: string;
    pendingCommissions: string;
    todayPayments: string;
    activeRepresentatives: number;
  }>;
}

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// Use WebSocket connection for transaction support
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database connection is established via drizzle
  }

  async getAdmin(chatId: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.chatId, chatId)).limit(1);
    return result[0];
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(insertAdmin).returning();
    return result[0];
  }

  async getAdminCount(): Promise<number> {
    const result = await db.select({ count: sql`COUNT(*)` }).from(admins);
    return Number(result[0].count);
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins);
  }

  async getSalesColleagues(): Promise<SalesColleague[]> {
    return await db.select().from(salesColleagues);
  }

  async getSalesColleagueByName(name: string): Promise<SalesColleague | undefined> {
    const result = await db.select().from(salesColleagues).where(eq(salesColleagues.name, name)).limit(1);
    return result[0];
  }

  async createSalesColleague(insertColleague: InsertSalesColleague): Promise<SalesColleague> {
    const result = await db.insert(salesColleagues).values(insertColleague).returning();
    return result[0];
  }

  async getRepresentatives(): Promise<Representative[]> {
    return await db.select().from(representatives);
  }

  async getRepresentativeByStoreName(storeName: string): Promise<Representative | undefined> {
    const result = await db.select().from(representatives).where(eq(representatives.storeName, storeName)).limit(1);
    return result[0];
  }

  async createRepresentative(insertRepresentative: InsertRepresentative): Promise<Representative> {
    const result = await db.insert(representatives).values(insertRepresentative).returning();
    return result[0];
  }

  async updateRepresentativeDebt(id: string | number, newDebt: string): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    await db.update(representatives).set({ totalDebt: newDebt }).where(eq(representatives.id, numericId));
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.issueDate));
  }

  async getInvoicesByRepresentative(representativeId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.representativeId, representativeId)).orderBy(desc(invoices.issueDate));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(insertInvoice).returning();
    return result[0];
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByRepresentative(representativeId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.representativeId, representativeId)).orderBy(desc(payments.paymentDate));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(insertPayment).returning();
    return result[0];
  }

  async getCommissionsByColleague(colleagueId: number): Promise<CommissionRecord[]> {
    return await db.select().from(commissionRecords).where(eq(commissionRecords.colleagueId, colleagueId)).orderBy(desc(commissionRecords.createdAt));
  }

  async createCommissionRecord(insertRecord: InsertCommissionRecord): Promise<CommissionRecord> {
    const result = await db.insert(commissionRecords).values(insertRecord).returning();
    return result[0];
  }

  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const result = await db.select().from(systemSettings).limit(1);
    return result[0];
  }

  async updateSystemSettings(insertSettings: InsertSystemSettings): Promise<SystemSettings> {
    const existing = await this.getSystemSettings();
    
    if (existing) {
      const result = await db.update(systemSettings).set(insertSettings).where(eq(systemSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(systemSettings).values(insertSettings).returning();
      return result[0];
    }
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getRepresentativeById(id: number): Promise<Representative | undefined> {
    const result = await db.select().from(representatives).where(eq(representatives.id, id)).limit(1);
    return result[0];
  }

  async getDashboardStats(): Promise<{
    totalDebt: string;
    pendingCommissions: string;
    todayPayments: string;
    activeRepresentatives: number;
  }> {
    const reps = await db.select().from(representatives);
    const totalDebt = reps
      .reduce((sum, rep) => sum + parseFloat(rep.totalDebt || '0'), 0)
      .toString();

    const commissions = await db.select().from(commissionRecords);
    const pendingCommissions = commissions
      .filter(c => c.payoutStatus === 'pending')
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0)
      .toString();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentsToday = await db.select().from(payments);
    const todayPayments = paymentsToday
      .filter(p => p.paymentDate && p.paymentDate >= today)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toString();

    const activeRepresentatives = reps.filter(r => r.isActive).length;

    return {
      totalDebt,
      pendingCommissions,
      todayPayments,
      activeRepresentatives
    };
  }
}

export const storage = new DatabaseStorage();
