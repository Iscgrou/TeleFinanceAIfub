import { storage } from '../storage';
import { CashFlowForecast, InsertCashFlowForecast } from '../../shared/schema';

export class CashFlowForecastingService {
  /**
   * Generate cash flow forecast for next 30 days
   */
  static async generateMonthlyForecast(): Promise<CashFlowForecast[]> {
    try {
      const forecasts: InsertCashFlowForecast[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 30; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        const forecast = await this.calculateDayForecast(forecastDate);
        forecasts.push(forecast);
      }
      
      // In a real implementation, we would save these to database
      // For now, return the calculated forecasts
      return forecasts.map((f, index) => ({
        id: index + 1,
        ...f,
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Error generating monthly forecast:', error);
      throw error;
    }
  }

  /**
   * Calculate forecast for a specific day
   */
  private static async calculateDayForecast(date: Date): Promise<InsertCashFlowForecast> {
    try {
      // Get historical payment patterns
      const representatives = await storage.getRepresentatives();
      const paymentHistory = await this.getPaymentHistory();
      
      // Calculate expected inflows based on:
      // 1. Historical payment patterns
      // 2. Outstanding invoices
      // 3. Payment reminders sent
      let expectedInflows = 0;
      
      // Simple model: assume 2% of total debt will be paid daily
      const totalDebt = representatives.reduce((sum, rep) => 
        sum + parseFloat(rep.totalDebt || '0'), 0
      );
      
      // Weekend adjustment
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendMultiplier = isWeekend ? 0.3 : 1.0;
      
      expectedInflows = (totalDebt * 0.02) * weekendMultiplier;
      
      // Expected outflows (operational costs, commissions, etc.)
      const expectedOutflows = await this.calculateExpectedOutflows(date);
      
      const netCashFlow = expectedInflows - expectedOutflows;
      
      // Confidence based on data quality and historical accuracy
      const confidence = this.calculateConfidence(date, paymentHistory);
      
      return {
        forecastDate: date,
        expectedInflows,
        expectedOutflows,
        netCashFlow,
        confidence,
        modelVersion: 'v1.0'
      };
    } catch (error) {
      console.error('Error calculating day forecast:', error);
      throw error;
    }
  }

  /**
   * Calculate expected outflows for a date
   */
  private static async calculateExpectedOutflows(date: Date): Promise<number> {
    try {
      // Base operational costs (could be configurable)
      let outflows = 50000; // 50k Toman daily operational cost
      
      // Commission payouts (typically monthly)
      const dayOfMonth = date.getDate();
      if (dayOfMonth === 1) {
        // Monthly commission payout
        const pendingCommissions = await this.calculatePendingCommissions();
        outflows += pendingCommissions;
      }
      
      // Marketing/reminder costs
      const reminderCosts = 5000; // SMS/communication costs
      outflows += reminderCosts;
      
      return outflows;
    } catch (error) {
      console.error('Error calculating outflows:', error);
      return 50000; // Default operational cost
    }
  }

  /**
   * Calculate confidence score based on historical data
   */
  private static calculateConfidence(date: Date, paymentHistory: any[]): number {
    try {
      // Distance from today affects confidence
      const daysFromToday = Math.abs(date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      let baseConfidence = Math.max(0.3, 1 - (daysFromToday * 0.02)); // Decreases with time
      
      // More historical data = higher confidence
      if (paymentHistory.length > 100) {
        baseConfidence += 0.1;
      } else if (paymentHistory.length < 20) {
        baseConfidence -= 0.2;
      }
      
      // Cap between 0.1 and 0.95
      return Math.max(0.1, Math.min(0.95, baseConfidence));
    } catch (error) {
      return 0.5; // Medium confidence if calculation fails
    }
  }

  /**
   * Get payment history for analysis
   */
  private static async getPaymentHistory(): Promise<any[]> {
    try {
      // This would get actual payment history from database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Calculate pending commissions
   */
  private static async calculatePendingCommissions(): Promise<number> {
    try {
      // This would calculate actual pending commissions
      // For now, estimate based on recent activity
      const representatives = await storage.getRepresentatives();
      const totalDebt = representatives.reduce((sum, rep) => 
        sum + parseFloat(rep.totalDebt || '0'), 0
      );
      
      // Assume 5% commission rate on processed amounts
      return totalDebt * 0.05;
    } catch (error) {
      console.error('Error calculating commissions:', error);
      return 0;
    }
  }

  /**
   * Generate weekly cash flow summary
   */
  static async getWeeklySummary(): Promise<{
    weeklyInflows: number;
    weeklyOutflows: number;
    netWeeklyFlow: number;
    avgDailyFlow: number;
    riskDays: Date[];
  }> {
    try {
      const forecasts = await this.generateMonthlyForecast();
      const weeklyForecasts = forecasts.slice(0, 7); // Next 7 days
      
      const weeklyInflows = weeklyForecasts.reduce((sum, f) => sum + f.expectedInflows, 0);
      const weeklyOutflows = weeklyForecasts.reduce((sum, f) => sum + f.expectedOutflows, 0);
      const netWeeklyFlow = weeklyInflows - weeklyOutflows;
      const avgDailyFlow = netWeeklyFlow / 7;
      
      // Identify risk days (negative cash flow)
      const riskDays = weeklyForecasts
        .filter(f => f.netCashFlow < 0)
        .map(f => f.forecastDate);
      
      return {
        weeklyInflows,
        weeklyOutflows,
        netWeeklyFlow,
        avgDailyFlow,
        riskDays
      };
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      throw error;
    }
  }
}