import { 
  admins, salesColleagues, representatives, invoices, payments, 
  commissionRecords, systemSettings, invoiceTemplates,
  type Admin, type InsertAdmin,
  type SalesColleague, type InsertSalesColleague,
  type Representative, type InsertRepresentative,
  type Invoice, type InsertInvoice,
  type Payment, type InsertPayment,
  type CommissionRecord, type InsertCommissionRecord,
  type SystemSettings, type InsertSystemSettings,
  type InvoiceTemplate, type InsertInvoiceTemplate
} from "@shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, sql, or, and, asc } from 'drizzle-orm';
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
  getRepresentativeByPanelUsername(panelUsername: string): Promise<Representative | undefined>;
  getRepresentativeById(id: number): Promise<Representative | undefined>;
  createRepresentative(representative: InsertRepresentative): Promise<Representative>;
  updateRepresentativeDebt(id: number, newDebt: string): Promise<void>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByRepresentative(representativeId: number): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
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
  
  // Invoice template management
  getInvoiceTemplates(): Promise<InvoiceTemplate[]>;
  getActiveInvoiceTemplate(): Promise<InvoiceTemplate | null>;
  getInvoiceTemplateById(id: number): Promise<InvoiceTemplate | null>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | null>;
  deleteInvoiceTemplate(id: number): Promise<boolean>;
  setActiveInvoiceTemplate(id: number): Promise<boolean>;
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

  // NEW: Paginated representatives with enhanced performance
  async getRepresentativesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: keyof Representative;
    sortOrder?: 'asc' | 'desc';
    includeInactive?: boolean;
  } = {}): Promise<{
    data: Representative[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const startTime = performance.now();
    console.log(`📊 Starting paginated representatives query...`);
    
    try {
      // Validate and set defaults
      const page = Math.max(1, params.page || 1);
      const limit = Math.min(100, Math.max(1, params.limit || 20));
      const offset = (page - 1) * limit;
      const sortOrder = params.sortOrder || 'desc';
      const sortBy = params.sortBy || 'createdAt';
      
      // Build base queries
      let query = db.select().from(representatives);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(representatives);
      
      // Apply filters
      const conditions: any[] = [];
      
      if (!params.includeInactive) {
        conditions.push(eq(representatives.isActive, true));
      }
      
      if (params.search) {
        const searchTerm = `%${params.search.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${representatives.storeName}) LIKE ${searchTerm}`,
            sql`LOWER(${representatives.ownerName}) LIKE ${searchTerm}`,
            sql`LOWER(${representatives.panelUsername}) LIKE ${searchTerm}`
          )
        );
      }
      
      if (conditions.length > 0) {
        const whereClause = and(...conditions);
        query = query.where(whereClause);
        countQuery = countQuery.where(whereClause);
      }
      
      // Apply sorting
      const sortColumn = representatives[sortBy];
      if (sortColumn) {
        query = sortOrder === 'asc' 
          ? query.orderBy(asc(sortColumn))
          : query.orderBy(desc(sortColumn));
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      // Execute queries in parallel
      const [data, totalResult] = await Promise.all([
        query,
        countQuery
      ]);
      
      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`📊 Paginated query completed in ${duration.toFixed(2)}ms - ${data.length} records`);
      
      // Alert for slow queries
      if (duration > 5000) {
        console.warn(`⚠️ Slow paginated query: ${duration.toFixed(2)}ms`);
      }
      
      return {
        data,
        total,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ Paginated query failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  async getRepresentativeByStoreName(storeName: string): Promise<Representative | undefined> {
    const result = await db.select().from(representatives).where(eq(representatives.storeName, storeName)).limit(1);
    return result[0];
  }

  async getRepresentativeByPanelUsername(panelUsername: string): Promise<Representative | undefined> {
    const result = await db.select().from(representatives).where(eq(representatives.panelUsername, panelUsername)).limit(1);
    return result[0];
  }

  async getRepresentativeById(id: number): Promise<Representative | undefined> {
    const result = await db.select().from(representatives).where(eq(representatives.id, id)).limit(1);
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

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
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

  // Invoice template management
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return await db.select().from(invoiceTemplates).orderBy(desc(invoiceTemplates.createdAt));
  }

  async getActiveInvoiceTemplate(): Promise<InvoiceTemplate | null> {
    const result = await db.select().from(invoiceTemplates)
      .where(eq(invoiceTemplates.isActive, true))
      .limit(1);
    return result[0] || null;
  }

  async getInvoiceTemplateById(id: number): Promise<InvoiceTemplate | null> {
    const result = await db.select().from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id))
      .limit(1);
    return result[0] || null;
  }

  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    // If this template is set as active, deactivate all others first
    if (template.isActive) {
      await db.update(invoiceTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(invoiceTemplates.isActive, true));
    }

    const result = await db.insert(invoiceTemplates).values({
      ...template,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateInvoiceTemplate(id: number, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | null> {
    // If this template is being set as active, deactivate all others first
    if (template.isActive) {
      await db.update(invoiceTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(invoiceTemplates.isActive, true));
    }

    const result = await db.update(invoiceTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(invoiceTemplates.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteInvoiceTemplate(id: number): Promise<boolean> {
    const result = await db.delete(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id))
      .returning();
    return result.length > 0;
  }

  async setActiveInvoiceTemplate(id: number): Promise<boolean> {
    // First check if template exists
    const template = await this.getInvoiceTemplateById(id);
    if (!template) return false;

    // Deactivate all templates
    await db.update(invoiceTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(invoiceTemplates.isActive, true));

    // Activate the specified template
    await db.update(invoiceTemplates)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(invoiceTemplates.id, id));

    return true;
  }
}

export const storage = new DatabaseStorage();
