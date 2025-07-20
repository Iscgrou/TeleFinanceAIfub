import { storage } from '../storage';
import { ProfitabilityReport, InsertProfitabilityReport, Representative } from '../../shared/schema';

export class ProfitabilityAnalysisService {
  /**
   * Generate profitability analysis for a representative
   */
  static async analyzeRepresentativeProfitability(
    representativeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ProfitabilityReport | null> {
    try {
      const representative = await storage.getRepresentative(representativeId);
      if (!representative) return null;

      // Get invoices and payments for the period
      const invoices = await storage.getInvoicesByRepresentative(representativeId);
      const payments = await storage.getPaymentsByRepresentative(representativeId);

      // Calculate revenue (invoices issued in period)
      const periodInvoices = invoices.filter(invoice => {
        const issueDate = new Date(invoice.issueDate);
        return issueDate >= periodStart && issueDate <= periodEnd;
      });

      const totalRevenue = periodInvoices.reduce((sum, invoice) => 
        sum + parseFloat(invoice.amount), 0
      );

      // Calculate costs (estimated operational costs + commissions)
      const commissionRate = 0.05; // 5% commission to sales colleague
      const operationalCostPerInvoice = 10000; // 10k Toman per invoice processing
      const totalCosts = (totalRevenue * commissionRate) + 
                        (periodInvoices.length * operationalCostPerInvoice);

      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
      
      // ROI calculation (return on investment in this representative)
      const investmentBase = parseFloat(representative.creditLimit || '1000000');
      const roi = investmentBase > 0 ? netProfit / investmentBase : 0;

      const analysis: InsertProfitabilityReport = {
        representativeId,
        periodStart,
        periodEnd,
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        roi
      };

      // Return with mock ID for now (in real implementation, save to DB)
      return {
        id: Date.now(),
        ...analysis,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error analyzing representative profitability:', error);
      throw error;
    }
  }

  /**
   * Generate company-wide profitability analysis
   */
  static async analyzeCompanyProfitability(
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    roi: number;
    representativeAnalysis: Array<{
      representative: Representative;
      profitability: ProfitabilityReport;
    }>;
    topPerformers: Array<{
      representative: Representative;
      netProfit: number;
      profitMargin: number;
    }>;
  }> {
    try {
      const representatives = await storage.getRepresentatives();
      const representativeAnalysis = [];
      let totalCompanyRevenue = 0;
      let totalCompanyCosts = 0;

      // Analyze each representative
      for (const rep of representatives) {
        const analysis = await this.analyzeRepresentativeProfitability(
          rep.id, periodStart, periodEnd
        );
        
        if (analysis) {
          representativeAnalysis.push({
            representative: rep,
            profitability: analysis
          });
          
          totalCompanyRevenue += analysis.totalRevenue;
          totalCompanyCosts += analysis.totalCosts;
        }
      }

      const netCompanyProfit = totalCompanyRevenue - totalCompanyCosts;
      const companyProfitMargin = totalCompanyRevenue > 0 ? 
        netCompanyProfit / totalCompanyRevenue : 0;

      // Calculate total investment (sum of all credit limits)
      const totalInvestment = representatives.reduce((sum, rep) => 
        sum + parseFloat(rep.creditLimit || '1000000'), 0
      );
      const companyROI = totalInvestment > 0 ? netCompanyProfit / totalInvestment : 0;

      // Identify top performers
      const topPerformers = representativeAnalysis
        .sort((a, b) => b.profitability.netProfit - a.profitability.netProfit)
        .slice(0, 10)
        .map(item => ({
          representative: item.representative,
          netProfit: item.profitability.netProfit,
          profitMargin: item.profitability.profitMargin
        }));

      return {
        totalRevenue: totalCompanyRevenue,
        totalCosts: totalCompanyCosts,
        netProfit: netCompanyProfit,
        profitMargin: companyProfitMargin,
        roi: companyROI,
        representativeAnalysis,
        topPerformers
      };
    } catch (error) {
      console.error('Error analyzing company profitability:', error);
      throw error;
    }
  }

  /**
   * Generate monthly profitability trend
   */
  static async getMonthlyTrends(months: number = 12): Promise<Array<{
    month: string;
    year: number;
    revenue: number;
    costs: number;
    netProfit: number;
    profitMargin: number;
    representativeCount: number;
  }>> {
    try {
      const trends = [];
      const currentDate = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        
        const monthlyAnalysis = await this.analyzeCompanyProfitability(monthStart, monthEnd);
        
        trends.push({
          month: monthStart.toLocaleString('fa-IR', { month: 'long' }),
          year: monthStart.getFullYear(),
          revenue: monthlyAnalysis.totalRevenue,
          costs: monthlyAnalysis.totalCosts,
          netProfit: monthlyAnalysis.netProfit,
          profitMargin: monthlyAnalysis.profitMargin,
          representativeCount: monthlyAnalysis.representativeAnalysis.length
        });
      }
      
      return trends;
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      throw error;
    }
  }

  /**
   * Identify unprofitable representatives
   */
  static async identifyUnprofitableRepresentatives(
    periodStart: Date,
    periodEnd: Date,
    threshold: number = 0 // Negative profit threshold
  ): Promise<Array<{
    representative: Representative;
    netProfit: number;
    profitMargin: number;
    recommendedAction: string;
  }>> {
    try {
      const representatives = await storage.getRepresentatives();
      const unprofitableReps = [];

      for (const rep of representatives) {
        const analysis = await this.analyzeRepresentativeProfitability(
          rep.id, periodStart, periodEnd
        );
        
        if (analysis && analysis.netProfit <= threshold) {
          let recommendedAction = '';
          
          if (analysis.netProfit < -100000) { // Very unprofitable
            recommendedAction = 'بررسی فوری - احتمال قطع همکاری';
          } else if (analysis.netProfit < -50000) {
            recommendedAction = 'کاهش حد اعتبار - مذاکره شرایط';
          } else if (analysis.netProfit < 0) {
            recommendedAction = 'بررسی علت عدم سودآوری';
          } else {
            recommendedAction = 'نیاز به بهبود عملکرد';
          }
          
          unprofitableReps.push({
            representative: rep,
            netProfit: analysis.netProfit,
            profitMargin: analysis.profitMargin,
            recommendedAction
          });
        }
      }

      // Sort by worst performance first
      return unprofitableReps.sort((a, b) => a.netProfit - b.netProfit);
    } catch (error) {
      console.error('Error identifying unprofitable representatives:', error);
      throw error;
    }
  }

  /**
   * Calculate break-even analysis for representatives
   */
  static async calculateBreakEvenAnalysis(): Promise<Array<{
    representativeId: number;
    storeName: string;
    currentRevenue: number;
    breakEvenRevenue: number;
    revenueGap: number;
    monthsToBreakEven: number;
  }>> {
    try {
      const representatives = await storage.getRepresentatives();
      const analysis = [];
      
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      for (const rep of representatives) {
        const profitability = await this.analyzeRepresentativeProfitability(
          rep.id, monthStart, currentDate
        );
        
        if (profitability) {
          // Calculate break-even revenue (where net profit = 0)
          // totalCosts = fixedCosts + variableCosts
          // breakEvenRevenue = fixedCosts / (1 - variableCostRate)
          const variableCostRate = 0.05; // 5% commission
          const fixedCosts = 10000; // Fixed operational cost per month
          const breakEvenRevenue = fixedCosts / (1 - variableCostRate);
          
          const revenueGap = Math.max(0, breakEvenRevenue - profitability.totalRevenue);
          
          // Estimate months to break even based on current growth rate
          const avgMonthlyRevenue = profitability.totalRevenue;
          const monthsToBreakEven = avgMonthlyRevenue > 0 ? 
            Math.ceil(revenueGap / avgMonthlyRevenue) : Infinity;
          
          analysis.push({
            representativeId: rep.id,
            storeName: rep.storeName,
            currentRevenue: profitability.totalRevenue,
            breakEvenRevenue,
            revenueGap,
            monthsToBreakEven: monthsToBreakEven === Infinity ? 999 : monthsToBreakEven
          });
        }
      }
      
      return analysis.sort((a, b) => b.revenueGap - a.revenueGap);
    } catch (error) {
      console.error('Error calculating break-even analysis:', error);
      throw error;
    }
  }
}