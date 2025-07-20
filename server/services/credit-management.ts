import { storage } from '../storage';
import { 
  CreditLimit, 
  InsertCreditLimit, 
  Representative, 
  SecurityAuditLog 
} from '../../shared/schema';

export class CreditManagementService {
  /**
   * Check if representative can afford new debt
   */
  static async checkCreditAvailability(
    representativeId: number, 
    requestedAmount: number
  ): Promise<{
    approved: boolean;
    availableCredit: number;
    message: string;
  }> {
    try {
      const representative = await storage.getRepresentative(representativeId);
      if (!representative) {
        return {
          approved: false,
          availableCredit: 0,
          message: 'نماینده یافت نشد'
        };
      }

      const currentDebt = parseFloat(representative.totalDebt || '0');
      const creditLimit = parseFloat(representative.creditLimit || '1000000');
      const availableCredit = creditLimit - currentDebt;

      const approved = requestedAmount <= availableCredit;

      // Log credit check for audit
      await this.logSecurityEvent({
        userId: representativeId.toString(),
        action: 'CREDIT_CHECK',
        resource: 'representative',
        details: {
          requestedAmount,
          currentDebt,
          creditLimit,
          availableCredit,
          approved
        },
        success: true
      });

      return {
        approved,
        availableCredit,
        message: approved 
          ? `تأیید شد - اعتبار باقی‌مانده: ${availableCredit.toLocaleString()} تومان`
          : `رد شد - اعتبار ناکافی. حد مجاز: ${creditLimit.toLocaleString()}, بدهی فعلی: ${currentDebt.toLocaleString()}`
      };
    } catch (error) {
      console.error('Credit check error:', error);
      return {
        approved: false,
        availableCredit: 0,
        message: 'خطا در بررسی اعتبار'
      };
    }
  }

  /**
   * Update representative's credit limit
   */
  static async updateCreditLimit(
    representativeId: number,
    newCreditLimit: number,
    adjustReason: string,
    adminId: string
  ): Promise<boolean> {
    try {
      // Get current representative
      const representative = await storage.getRepresentative(representativeId);
      if (!representative) return false;

      // Update representative's credit limit
      await storage.updateRepresentative(representativeId, {
        creditLimit: newCreditLimit.toString()
      });

      // Log the change
      await this.logSecurityEvent({
        userId: adminId,
        action: 'CREDIT_LIMIT_UPDATE',
        resource: 'representative',
        details: {
          representativeId,
          oldLimit: representative.creditLimit,
          newLimit: newCreditLimit,
          reason: adjustReason
        },
        success: true
      });

      return true;
    } catch (error) {
      console.error('Error updating credit limit:', error);
      return false;
    }
  }

  /**
   * Automatic risk-based credit adjustment
   */
  static async autoAdjustCreditLimits(): Promise<void> {
    try {
      const representatives = await storage.getRepresentatives();
      
      for (const rep of representatives) {
        const currentDebt = parseFloat(rep.totalDebt || '0');
        const currentLimit = parseFloat(rep.creditLimit || '1000000');
        
        // Risk assessment based on debt levels
        let newLimit = currentLimit;
        let riskLevel = rep.riskLevel || 'medium';

        if (currentDebt > currentLimit * 0.9) {
          // Near credit limit - high risk
          riskLevel = 'critical';
          newLimit = Math.max(currentLimit * 0.8, currentDebt); // Reduce limit but keep above current debt
        } else if (currentDebt > currentLimit * 0.7) {
          // Moderate risk
          riskLevel = 'high';
        } else if (currentDebt < currentLimit * 0.3) {
          // Low utilization - could increase limit
          riskLevel = 'low';
          newLimit = currentLimit * 1.1; // 10% increase
        } else {
          riskLevel = 'medium';
        }

        // Update if changes needed
        if (newLimit !== currentLimit || riskLevel !== rep.riskLevel) {
          await storage.updateRepresentative(rep.id, {
            creditLimit: newLimit.toString(),
            riskLevel
          });
        }
      }
    } catch (error) {
      console.error('Error in auto credit adjustment:', error);
    }
  }

  /**
   * Generate credit utilization report
   */
  static async generateCreditReport(): Promise<{
    totalCreditLimit: number;
    totalDebtUtilized: number;
    utilizationRate: number;
    riskDistribution: Record<string, number>;
    representatives: Array<{
      id: number;
      storeName: string;
      creditLimit: number;
      currentDebt: number;
      utilizationRate: number;
      riskLevel: string;
    }>;
  }> {
    try {
      const representatives = await storage.getRepresentatives();
      
      let totalCreditLimit = 0;
      let totalDebtUtilized = 0;
      const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
      
      const reportData = representatives.map(rep => {
        const creditLimit = parseFloat(rep.creditLimit || '1000000');
        const currentDebt = parseFloat(rep.totalDebt || '0');
        const utilizationRate = creditLimit > 0 ? (currentDebt / creditLimit) * 100 : 0;
        
        totalCreditLimit += creditLimit;
        totalDebtUtilized += currentDebt;
        riskDistribution[rep.riskLevel as keyof typeof riskDistribution]++;
        
        return {
          id: rep.id,
          storeName: rep.storeName,
          creditLimit,
          currentDebt,
          utilizationRate,
          riskLevel: rep.riskLevel || 'medium'
        };
      });

      const overallUtilizationRate = totalCreditLimit > 0 ? (totalDebtUtilized / totalCreditLimit) * 100 : 0;

      return {
        totalCreditLimit,
        totalDebtUtilized,
        utilizationRate: overallUtilizationRate,
        riskDistribution,
        representatives: reportData
      };
    } catch (error) {
      console.error('Error generating credit report:', error);
      throw error;
    }
  }

  /**
   * Log security/audit events
   */
  private static async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      // This would use the new security audit storage method
      // For now, we'll log to console
      console.log('🔒 Security Event:', {
        timestamp: new Date().toISOString(),
        ...event
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}