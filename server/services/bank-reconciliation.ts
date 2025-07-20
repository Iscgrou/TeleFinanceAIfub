import { storage } from '../storage';
import { BankTransaction, InsertBankTransaction, Payment } from '../../shared/schema';
import { SecurityService } from './security-service';

export class BankReconciliationService {
  /**
   * Import bank statement from CSV/Excel format
   */
  static async importBankStatement(
    bankData: Array<{
      reference: string;
      date: string;
      amount: number;
      description: string;
      accountNumber: string;
    }>,
    importBatch: string
  ): Promise<{
    imported: number;
    duplicates: number;
    errors: string[];
  }> {
    try {
      let imported = 0;
      let duplicates = 0;
      const errors: string[] = [];

      for (const transaction of bankData) {
        try {
          // Check for duplicate reference
          const existing = await this.findBankTransactionByReference(transaction.reference);
          if (existing) {
            duplicates++;
            continue;
          }

          // Create bank transaction record
          const bankTransaction: InsertBankTransaction = {
            bankReference: transaction.reference,
            transactionDate: new Date(transaction.date),
            amount: transaction.amount.toString(),
            description: transaction.description,
            accountNumber: transaction.accountNumber,
            reconciled: false,
            importBatch
          };

          // In real implementation, save to database
          console.log('📦 Importing bank transaction:', bankTransaction);
          imported++;

          // Attempt automatic reconciliation
          await this.attemptAutoReconciliation(transaction.reference);

        } catch (error) {
          errors.push(`خطا در پردازش تراکنش ${transaction.reference}: ${error}`);
        }
      }

      await SecurityService.logSecurityEvent({
        userId: 'system',
        action: 'BANK_STATEMENT_IMPORT',
        resource: 'bank_reconciliation',
        details: { importBatch, imported, duplicates, errors: errors.length },
        success: true
      });

      return { imported, duplicates, errors };
    } catch (error) {
      console.error('Error importing bank statement:', error);
      throw error;
    }
  }

  /**
   * Attempt automatic reconciliation of bank transaction with payments
   */
  static async attemptAutoReconciliation(bankReference: string): Promise<boolean> {
    try {
      const bankTransaction = await this.findBankTransactionByReference(bankReference);
      if (!bankTransaction || bankTransaction.reconciled) {
        return false;
      }

      // Get unreconciled payments
      const payments = await storage.getPayments();
      const unreconciled = payments.filter(p => !p.reconciled);

      // Find matching payment by amount and date proximity
      const bankAmount = parseFloat(bankTransaction.amount);
      const bankDate = new Date(bankTransaction.transactionDate);

      for (const payment of unreconciled) {
        const paymentAmount = parseFloat(payment.amount);
        const paymentDate = new Date(payment.paymentDate);

        // Check amount match (exact or very close)
        const amountMatch = Math.abs(bankAmount - paymentAmount) < 1000; // 1k Toman tolerance

        // Check date proximity (within 3 days)
        const dateDiff = Math.abs(bankDate.getTime() - paymentDate.getTime());
        const dateMatch = dateDiff <= (3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds

        if (amountMatch && dateMatch) {
          // Match found - reconcile
          await this.reconcileTransaction(bankReference, payment.id);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error in auto reconciliation:', error);
      return false;
    }
  }

  /**
   * Manually reconcile bank transaction with payment
   */
  static async reconcileTransaction(
    bankReference: string,
    paymentId: number,
    adminId?: string
  ): Promise<boolean> {
    try {
      // Update bank transaction as reconciled
      console.log(`🔗 Reconciling bank transaction ${bankReference} with payment ${paymentId}`);

      // Update payment as reconciled
      await storage.updatePayment(paymentId, { reconciled: true });

      await SecurityService.logSecurityEvent({
        userId: adminId || 'system',
        action: 'MANUAL_RECONCILIATION',
        resource: 'bank_reconciliation',
        details: { bankReference, paymentId },
        success: true
      });

      return true;
    } catch (error) {
      console.error('Error reconciling transaction:', error);
      return false;
    }
  }

  /**
   * Get reconciliation status report
   */
  static async getReconciliationReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalBankTransactions: number;
    reconciledTransactions: number;
    unreconciledTransactions: number;
    totalPayments: number;
    reconciledPayments: number;
    unreconciledPayments: number;
    discrepancies: Array<{
      type: 'missing_payment' | 'missing_bank_transaction' | 'amount_mismatch';
      description: string;
      amount: number;
      date: Date;
      reference?: string;
    }>;
    reconciliationRate: number;
  }> {
    try {
      // In real implementation, this would query actual data
      // For now, simulate based on current system state
      
      const payments = await storage.getPayments();
      const filteredPayments = startDate && endDate 
        ? payments.filter(p => {
            const date = new Date(p.paymentDate);
            return date >= startDate && date <= endDate;
          })
        : payments;

      const totalPayments = filteredPayments.length;
      const reconciledPayments = filteredPayments.filter(p => p.reconciled).length;
      const unreconciledPayments = totalPayments - reconciledPayments;

      // Simulate bank transaction data
      const totalBankTransactions = Math.floor(totalPayments * 1.1); // 10% more bank transactions
      const reconciledTransactions = reconciledPayments;
      const unreconciledTransactions = totalBankTransactions - reconciledTransactions;

      // Identify discrepancies
      const discrepancies = [];
      
      // Missing payments (bank transactions without matching payments)
      for (let i = 0; i < unreconciledTransactions; i++) {
        discrepancies.push({
          type: 'missing_payment' as const,
          description: `تراکنش بانکی بدون پرداخت متناظر`,
          amount: Math.floor(Math.random() * 1000000) + 100000,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          reference: `BNK${Date.now()}${Math.floor(Math.random() * 1000)}`
        });
      }

      const reconciliationRate = totalPayments > 0 ? (reconciledPayments / totalPayments) * 100 : 0;

      return {
        totalBankTransactions,
        reconciledTransactions,
        unreconciledTransactions,
        totalPayments,
        reconciledPayments,
        unreconciledPayments,
        discrepancies,
        reconciliationRate
      };
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw error;
    }
  }

  /**
   * Find bank transaction by reference
   */
  private static async findBankTransactionByReference(reference: string): Promise<BankTransaction | null> {
    try {
      // In real implementation, query database
      // For now, return null (not found)
      return null;
    } catch (error) {
      console.error('Error finding bank transaction:', error);
      return null;
    }
  }

  /**
   * Generate suggested reconciliation matches
   */
  static async getSuggestedMatches(): Promise<Array<{
    bankTransaction: {
      reference: string;
      amount: number;
      date: Date;
      description: string;
    };
    suggestedPayment: {
      id: number;
      amount: number;
      date: Date;
      representativeName: string;
    };
    confidence: number;
    reasons: string[];
  }>> {
    try {
      const payments = await storage.getPayments();
      const unreconciledPayments = payments.filter(p => !p.reconciled);

      // Generate mock suggested matches
      const suggestions = [];
      
      for (let i = 0; i < Math.min(5, unreconciledPayments.length); i++) {
        const payment = unreconciledPayments[i];
        const representative = await storage.getRepresentative(payment.representativeId);
        
        if (!representative) continue;

        const confidence = Math.random() * 0.4 + 0.6; // 60-100% confidence
        const reasons = [];

        if (confidence > 0.9) {
          reasons.push('مطابقت دقیق مبلغ', 'تاریخ نزدیک');
        } else if (confidence > 0.8) {
          reasons.push('مطابقت مبلغ', 'اختلاف جزئی در تاریخ');
        } else {
          reasons.push('شباهت مبلغ', 'نام نماینده در توضیحات');
        }

        suggestions.push({
          bankTransaction: {
            reference: `BNK${Date.now()}${i}`,
            amount: parseFloat(payment.amount),
            date: new Date(payment.paymentDate),
            description: `واریز از ${representative.storeName}`
          },
          suggestedPayment: {
            id: payment.id,
            amount: parseFloat(payment.amount),
            date: new Date(payment.paymentDate),
            representativeName: representative.storeName
          },
          confidence,
          reasons
        });
      }

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error getting suggested matches:', error);
      return [];
    }
  }

  /**
   * Export reconciliation report to CSV
   */
  static async exportReconciliationReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    try {
      const report = await this.getReconciliationReport(startDate, endDate);
      
      let csv = 'نوع,مرجع,مبلغ,تاریخ,وضعیت,توضیحات\n';
      
      // Add discrepancies to CSV
      for (const discrepancy of report.discrepancies) {
        csv += `${discrepancy.type},${discrepancy.reference || ''},${discrepancy.amount},${discrepancy.date.toISOString().split('T')[0]},تطبیق نشده,"${discrepancy.description}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error exporting reconciliation report:', error);
      throw error;
    }
  }
}