import { 
  salesColleagues, representatives, invoices, invoiceItems, payments, 
  paymentAllocations, auditLogs, systemSettings, invoiceTemplates,
  type SalesColleague, type InsertSalesColleague,
  type Representative, type InsertRepresentative, type RepresentativeWithDetails,
  type Invoice, type InsertInvoice, type InvoiceWithDetails,
  type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment,
  type PaymentAllocation, type InsertPaymentAllocation,
  type AuditLog, type InsertAuditLog,
  type SystemSettings, type InsertSystemSettings,
  type InvoiceTemplate, type InsertInvoiceTemplate,
  type DashboardStats
} from "@shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, sql, or, and, asc, sum, count } from 'drizzle-orm';
import ws from 'ws';

export interface IStorage {
  // Sales Colleagues
  getSalesColleagues(): Promise<SalesColleague[]>;
  getSalesColleagueById(id: number): Promise<SalesColleague | undefined>;
  createSalesColleague(colleague: InsertSalesColleague): Promise<SalesColleague>;
  updateSalesColleague(id: number, data: Partial<InsertSalesColleague>): Promise<SalesColleague | null>;
  deleteSalesColleague(id: number): Promise<boolean>;

  // Representatives
  getRepresentatives(): Promise<RepresentativeWithDetails[]>;
  getRepresentativeById(id: number): Promise<RepresentativeWithDetails | undefined>;
  createRepresentative(representative: InsertRepresentative): Promise<Representative>;
  updateRepresentative(id: number, data: Partial<InsertRepresentative>): Promise<Representative | null>;
  updateRepresentativeBalance(id: number, amount: number): Promise<void>;
  deleteRepresentative(id: number): Promise<boolean>;

  // Invoices
  getInvoices(): Promise<InvoiceWithDetails[]>;
  getInvoiceById(id: number): Promise<InvoiceWithDetails | undefined>;
  getInvoicesByRepresentative(representativeId: number): Promise<InvoiceWithDetails[]>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | null>;
  deleteInvoice(id: number): Promise<boolean>;

  // Invoice Items
  createInvoiceItems(items: InsertInvoiceItem[]): Promise<InvoiceItem[]>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsByRepresentative(representativeId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  allocatePayment(paymentId: number, allocations: InsertPaymentAllocation[]): Promise<void>;
  deletePayment(id: number): Promise<boolean>;

  // Audit Logs
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings[]>;
  updateSystemSetting(key: string, value: string): Promise<void>;

  // Invoice Templates
  getInvoiceTemplates(): Promise<InvoiceTemplate[]>;
  getActiveInvoiceTemplate(): Promise<InvoiceTemplate | null>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | null>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Search
  searchGlobal(query: string): Promise<{
    representatives: RepresentativeWithDetails[];
    invoices: InvoiceWithDetails[];
    salesColleagues: SalesColleague[];
  }>;
}

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// Use WebSocket connection for transaction support
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  // Helper method to generate next code
  private async generateCode(prefix: string, table: any, codeField: any): Promise<string> {
    const result = await db.select({ code: codeField })
      .from(table)
      .where(sql`${codeField} LIKE ${prefix + '%'}`)
      .orderBy(desc(codeField))
      .limit(1);
    
    if (result.length === 0) {
      return `${prefix}001`;
    }
    
    const lastCode = result[0].code;
    const lastNumber = parseInt(lastCode.replace(prefix, ''));
    const nextNumber = lastNumber + 1;
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  // Helper method to generate invoice number
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV${year}`;
    
    const result = await db.select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${prefix + '%'}`)
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);
    
    if (result.length === 0) {
      return `${prefix}001`;
    }
    
    const lastNumber = result[0].invoiceNumber;
    const lastSeq = parseInt(lastNumber.replace(prefix, ''));
    const nextSeq = lastSeq + 1;
    
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  }

  // Sales Colleagues
  async getSalesColleagues(): Promise<SalesColleague[]> {
    return await db.select().from(salesColleagues).orderBy(salesColleagues.name);
  }

  async getSalesColleagueById(id: number): Promise<SalesColleague | undefined> {
    const result = await db.select().from(salesColleagues).where(eq(salesColleagues.id, id)).limit(1);
    return result[0];
  }

  async createSalesColleague(colleague: InsertSalesColleague): Promise<SalesColleague> {
    // Generate code if not provided
    if (!colleague.code) {
      colleague.code = await this.generateCode('SC', salesColleagues, salesColleagues.code);
    }
    
    const result = await db.insert(salesColleagues).values(colleague).returning();
    
    // Log audit
    await this.createAuditLog({
      userId: 'admin',
      action: 'افزودن همکار فروش',
      entityType: 'sales_colleague',
      entityId: result[0].id.toString(),
      details: { name: colleague.name }
    });
    
    return result[0];
  }

  async updateSalesColleague(id: number, data: Partial<InsertSalesColleague>): Promise<SalesColleague | null> {
    const result = await db.update(salesColleagues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(salesColleagues.id, id))
      .returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'ویرایش همکار فروش',
        entityType: 'sales_colleague',
        entityId: id.toString(),
        details: data
      });
    }
    
    return result[0] || null;
  }

  async deleteSalesColleague(id: number): Promise<boolean> {
    const result = await db.delete(salesColleagues).where(eq(salesColleagues.id, id)).returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'حذف همکار فروش',
        entityType: 'sales_colleague',
        entityId: id.toString(),
        details: { name: result[0].name }
      });
    }
    
    return result.length > 0;
  }

  // Representatives
  async getRepresentatives(): Promise<RepresentativeWithDetails[]> {
    const result = await db.select({
      id: representatives.id,
      name: representatives.name,
      code: representatives.code,
      storeName: representatives.storeName,
      phone: representatives.phone,
      panelUsername: representatives.panelUsername,
      salesColleagueId: representatives.salesColleagueId,
      accountBalance: representatives.accountBalance,
      creditLimit: representatives.creditLimit,
      tariffs: representatives.tariffs,
      isActive: representatives.isActive,
      createdAt: representatives.createdAt,
      updatedAt: representatives.updatedAt,
      salesColleague: {
        id: salesColleagues.id,
        name: salesColleagues.name,
        code: salesColleagues.code,
        commissionRate: salesColleagues.commissionRate,
        isActive: salesColleagues.isActive,
        createdAt: salesColleagues.createdAt,
        updatedAt: salesColleagues.updatedAt,
      }
    })
    .from(representatives)
    .leftJoin(salesColleagues, eq(representatives.salesColleagueId, salesColleagues.id))
    .orderBy(representatives.name);

    return result.map(row => ({
      ...row,
      salesColleague: row.salesColleague.id ? row.salesColleague : undefined
    }));
  }

  async getRepresentativeById(id: number): Promise<RepresentativeWithDetails | undefined> {
    const result = await db.select({
      id: representatives.id,
      name: representatives.name,
      code: representatives.code,
      storeName: representatives.storeName,
      phone: representatives.phone,
      panelUsername: representatives.panelUsername,
      salesColleagueId: representatives.salesColleagueId,
      accountBalance: representatives.accountBalance,
      creditLimit: representatives.creditLimit,
      tariffs: representatives.tariffs,
      isActive: representatives.isActive,
      createdAt: representatives.createdAt,
      updatedAt: representatives.updatedAt,
      salesColleague: {
        id: salesColleagues.id,
        name: salesColleagues.name,
        code: salesColleagues.code,
        commissionRate: salesColleagues.commissionRate,
        isActive: salesColleagues.isActive,
        createdAt: salesColleagues.createdAt,
        updatedAt: salesColleagues.updatedAt,
      }
    })
    .from(representatives)
    .leftJoin(salesColleagues, eq(representatives.salesColleagueId, salesColleagues.id))
    .where(eq(representatives.id, id))
    .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row,
      salesColleague: row.salesColleague.id ? row.salesColleague : undefined
    };
  }

  async createRepresentative(representative: InsertRepresentative): Promise<Representative> {
    // Generate code if not provided
    if (!representative.code) {
      representative.code = await this.generateCode('REP', representatives, representatives.code);
    }
    
    const result = await db.insert(representatives).values(representative).returning();
    
    // Log audit
    await this.createAuditLog({
      userId: 'admin',
      action: 'افزودن نماینده',
      entityType: 'representative',
      entityId: result[0].id.toString(),
      details: { name: representative.name, storeName: representative.storeName }
    });
    
    return result[0];
  }

  async updateRepresentative(id: number, data: Partial<InsertRepresentative>): Promise<Representative | null> {
    const result = await db.update(representatives)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(representatives.id, id))
      .returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'ویرایش نماینده',
        entityType: 'representative',
        entityId: id.toString(),
        details: data
      });
    }
    
    return result[0] || null;
  }

  async updateRepresentativeBalance(id: number, amount: number): Promise<void> {
    await db.update(representatives)
      .set({ 
        accountBalance: sql`${representatives.accountBalance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(representatives.id, id));
    
    await this.createAuditLog({
      userId: 'admin',
      action: amount > 0 ? 'افزایش موجودی' : 'کاهش موجودی',
      entityType: 'representative',
      entityId: id.toString(),
      details: { amount }
    });
  }

  async deleteRepresentative(id: number): Promise<boolean> {
    const result = await db.delete(representatives).where(eq(representatives.id, id)).returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'حذف نماینده',
        entityType: 'representative',
        entityId: id.toString(),
        details: { name: result[0].name }
      });
    }
    
    return result.length > 0;
  }

  // Invoices
  async getInvoices(): Promise<InvoiceWithDetails[]> {
    const result = await db.select({
      invoice: invoices,
      representative: {
        id: representatives.id,
        name: representatives.name,
        code: representatives.code,
        storeName: representatives.storeName,
      },
      salesColleague: {
        id: salesColleagues.id,
        name: salesColleagues.name,
        commissionRate: salesColleagues.commissionRate,
      }
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .leftJoin(salesColleagues, eq(representatives.salesColleagueId, salesColleagues.id))
    .orderBy(desc(invoices.issueDate));

    return result.map(row => ({
      ...row.invoice,
      representative: row.representative,
      salesColleague: row.salesColleague.id ? row.salesColleague : undefined
    }));
  }

  async getInvoiceById(id: number): Promise<InvoiceWithDetails | undefined> {
    const result = await db.select({
      invoice: invoices,
      representative: representatives,
      salesColleague: salesColleagues
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .leftJoin(salesColleagues, eq(representatives.salesColleagueId, salesColleagues.id))
    .where(eq(invoices.id, id))
    .limit(1);

    if (result.length === 0) return undefined;

    const items = await this.getInvoiceItems(id);
    
    return {
      ...result[0].invoice,
      representative: result[0].representative,
      salesColleague: result[0].salesColleague,
      items
    };
  }

  async getInvoicesByRepresentative(representativeId: number): Promise<InvoiceWithDetails[]> {
    const result = await db.select({
      invoice: invoices,
      representative: representatives,
      salesColleague: salesColleagues
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .leftJoin(salesColleagues, eq(representatives.salesColleagueId, salesColleagues.id))
    .where(eq(invoices.representativeId, representativeId))
    .orderBy(desc(invoices.issueDate));

    return result.map(row => ({
      ...row.invoice,
      representative: row.representative,
      salesColleague: row.salesColleague
    }));
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    const result = await db.insert(invoices).values({
      ...invoice,
      invoiceNumber
    }).returning();
    
    const createdInvoice = result[0];
    
    // Create invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoiceId: createdInvoice.id
    }));
    
    await this.createInvoiceItems(itemsWithInvoiceId);
    
    // Update representative balance
    await this.updateRepresentativeBalance(invoice.representativeId, -Number(invoice.finalAmount));
    
    // Log audit
    await this.createAuditLog({
      userId: 'admin',
      action: 'صدور فاکتور',
      entityType: 'invoice',
      entityId: createdInvoice.id.toString(),
      details: { invoiceNumber, amount: invoice.finalAmount }
    });
    
    return createdInvoice;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | null> {
    const result = await db.update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'ویرایش فاکتور',
        entityType: 'invoice',
        entityId: id.toString(),
        details: data
      });
    }
    
    return result[0] || null;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'حذف فاکتور',
        entityType: 'invoice',
        entityId: id.toString(),
        details: { invoiceNumber: result[0].invoiceNumber }
      });
    }
    
    return result.length > 0;
  }

  // Invoice Items
  async createInvoiceItems(items: InsertInvoiceItem[]): Promise<InvoiceItem[]> {
    const result = await db.insert(invoiceItems).values(items).returning();
    return result;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByRepresentative(representativeId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.representativeId, representativeId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    
    // Update representative balance
    await this.updateRepresentativeBalance(payment.representativeId, Number(payment.amount));
    
    // Log audit
    await this.createAuditLog({
      userId: 'admin',
      action: 'ثبت پرداخت',
      entityType: 'payment',
      entityId: result[0].id.toString(),
      details: { amount: payment.amount }
    });
    
    return result[0];
  }

  async allocatePayment(paymentId: number, allocations: InsertPaymentAllocation[]): Promise<void> {
    await db.insert(paymentAllocations).values(allocations);
    
    // Mark payment as allocated
    await db.update(payments)
      .set({ isAllocated: true })
      .where(eq(payments.id, paymentId));
    
    // Log audit
    await this.createAuditLog({
      userId: 'admin',
      action: 'تخصیص پرداخت',
      entityType: 'payment',
      entityId: paymentId.toString(),
      details: { allocations: allocations.length }
    });
  }

  async deletePayment(id: number): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id)).returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        userId: 'admin',
        action: 'حذف پرداخت',
        entityType: 'payment',
        entityId: id.toString(),
        details: { amount: result[0].amount }
      });
    }
    
    return result.length > 0;
  }

  // Audit Logs
  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings[]> {
    return await db.select().from(systemSettings);
  }

  async updateSystemSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    
    if (existing.length > 0) {
      await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ key, value });
    }
  }

  // Invoice Templates
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return await db.select().from(invoiceTemplates).orderBy(invoiceTemplates.name);
  }

  async getActiveInvoiceTemplate(): Promise<InvoiceTemplate | null> {
    const result = await db.select().from(invoiceTemplates)
      .where(eq(invoiceTemplates.isActive, true))
      .limit(1);
    return result[0] || null;
  }

  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const result = await db.insert(invoiceTemplates).values(template).returning();
    return result[0];
  }

  async updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | null> {
    const result = await db.update(invoiceTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoiceTemplates.id, id))
      .returning();
    
    return result[0] || null;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [revenueResult] = await db.select({ 
      total: sql<number>`COALESCE(SUM(CAST(${invoices.finalAmount} AS DECIMAL)), 0)` 
    }).from(invoices);

    const [commissionsResult] = await db.select({ 
      total: sql<number>`COALESCE(SUM(CAST(${invoices.commissionAmount} AS DECIMAL)), 0)` 
    }).from(invoices);

    const [representativesResult] = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(representatives).where(eq(representatives.isActive, true));

    const [pendingResult] = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(invoices).where(eq(invoices.status, 'unpaid'));

    const [overdueResult] = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(invoices).where(eq(invoices.status, 'overdue'));

    const monthlyRevenue = await db.select({
      month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
      amount: sql<number>`SUM(CAST(${invoices.finalAmount} AS DECIMAL))`
    })
    .from(invoices)
    .groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
    .limit(12);

    const topPerformers = await db.select({
      name: representatives.name,
      amount: sql<number>`SUM(CAST(${invoices.finalAmount} AS DECIMAL))`
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .groupBy(representatives.id, representatives.name)
    .orderBy(sql`SUM(CAST(${invoices.finalAmount} AS DECIMAL)) DESC`)
    .limit(5);

    const totalRevenue = Number(revenueResult.total) || 0;
    const totalCommissions = Number(commissionsResult.total) || 0;

    return {
      totalRevenue,
      totalCommissions,
      netProfit: totalRevenue - totalCommissions,
      activeRepresentatives: Number(representativesResult.count) || 0,
      pendingInvoices: Number(pendingResult.count) || 0,
      overdueInvoices: Number(overdueResult.count) || 0,
      monthlyRevenue: monthlyRevenue.map(row => ({
        month: row.month,
        amount: Number(row.amount) || 0
      })),
      topPerformers: topPerformers.map(row => ({
        name: row.name || 'نامشخص',
        amount: Number(row.amount) || 0
      }))
    };
  }

  // Search
  async searchGlobal(query: string): Promise<{
    representatives: RepresentativeWithDetails[];
    invoices: InvoiceWithDetails[];
    salesColleagues: SalesColleague[];
  }> {
    const searchTerm = `%${query}%`;

    const reps = await db.select({
      id: representatives.id,
      name: representatives.name,
      code: representatives.code,
      storeName: representatives.storeName,
      phone: representatives.phone,
      panelUsername: representatives.panelUsername,
      salesColleagueId: representatives.salesColleagueId,
      accountBalance: representatives.accountBalance,
      creditLimit: representatives.creditLimit,
      tariffs: representatives.tariffs,
      isActive: representatives.isActive,
      createdAt: representatives.createdAt,
      updatedAt: representatives.updatedAt,
      salesColleague: {
        id: salesColleagues.id,
        name: salesColleagues.name,
        code: salesColleagues.code,
        commissionRate: salesColleagues.commissionRate,
        isActive: salesColleagues.isActive,
        createdAt: salesColleagues.createdAt,
        updatedAt: salesColleagues.updatedAt,
      }
    })
    .from(representatives)
    .leftJoin(salesColleagues, eq(representatives.salesColleagueId, salesColleagues.id))
    .where(or(
      sql`${representatives.name} ILIKE ${searchTerm}`,
      sql`${representatives.code} ILIKE ${searchTerm}`,
      sql`${representatives.storeName} ILIKE ${searchTerm}`
    ))
    .limit(10);

    const invs = await db.select({
      invoice: invoices,
      representative: {
        id: representatives.id,
        name: representatives.name,
        code: representatives.code,
        storeName: representatives.storeName,
      }
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .where(or(
      sql`${invoices.invoiceNumber} ILIKE ${searchTerm}`,
      sql`${representatives.name} ILIKE ${searchTerm}`
    ))
    .limit(10);

    const colleagues = await db.select().from(salesColleagues)
      .where(or(
        sql`${salesColleagues.name} ILIKE ${searchTerm}`,
        sql`${salesColleagues.code} ILIKE ${searchTerm}`
      ))
      .limit(10);

    return {
      representatives: reps.map(row => ({
        ...row,
        salesColleague: row.salesColleague.id ? row.salesColleague : undefined
      })),
      invoices: invs.map(row => ({
        ...row.invoice,
        representative: row.representative
      })),
      salesColleagues: colleagues
    };
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();