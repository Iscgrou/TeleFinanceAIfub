import { storage } from '../storage';
import { Representative } from '@shared/schema';

// Interface for batch operation criteria
export interface QueryCriteria {
  debtAmount?: { operator: '>' | '<' | '>=' | '<=' | '='; value: number };
  invoiceDate?: { operator: 'before' | 'after'; date: string };
  storeName?: { operator: 'contains' | 'equals'; value: string };
  hasDebt?: boolean;
}

// Interface for message template
export interface MessageTemplate {
  content: string;
  isUserProvided: boolean;
}

// Query representatives with dynamic criteria
export async function queryRepresentatives(criteria: QueryCriteria): Promise<Representative[]> {
  try {
    const allRepresentatives = await storage.getRepresentatives();
    
    return allRepresentatives.filter(rep => {
      // Filter by debt amount
      if (criteria.debtAmount) {
        const debt = parseFloat(rep.totalDebt);
        const { operator, value } = criteria.debtAmount;
        
        switch (operator) {
          case '>': if (!(debt > value)) return false; break;
          case '<': if (!(debt < value)) return false; break;
          case '>=': if (!(debt >= value)) return false; break;
          case '<=': if (!(debt <= value)) return false; break;
          case '=': if (!(debt === value)) return false; break;
        }
      }
      
      // Filter by debt existence
      if (criteria.hasDebt !== undefined) {
        const hasDebt = parseFloat(rep.totalDebt) > 0;
        if (hasDebt !== criteria.hasDebt) return false;
      }
      
      // Filter by store name
      if (criteria.storeName) {
        const { operator, value } = criteria.storeName;
        switch (operator) {
          case 'contains':
            if (!rep.storeName.toLowerCase().includes(value.toLowerCase())) return false;
            break;
          case 'equals':
            if (rep.storeName.toLowerCase() !== value.toLowerCase()) return false;
            break;
        }
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error querying representatives:', error);
    return [];
  }
}

// Generate personalized message for a representative
export function personalizeMessage(template: string, representative: Representative): string {
  let personalizedMessage = template;
  
  // Replace placeholders with actual data
  personalizedMessage = personalizedMessage
    .replace(/{store_name}/g, representative.storeName)
    .replace(/{debt_amount}/g, parseFloat(representative.totalDebt).toLocaleString())
    .replace(/{panel_username}/g, representative.panelUsername || 'نامشخص')
    .replace(/{telegram_id}/g, representative.telegramId || 'نامشخص')
    .replace(/{sales_colleague}/g, representative.salesColleagueName || 'نامشخص');
  
  return personalizedMessage;
}

// Generate default reminder message template
export function generateDefaultReminderTemplate(): string {
  return `سلام {store_name} عزیز،

امیدوارم که حالتان خوب باشد. با احترام به اطلاع می‌رسانم که طبق سیستم مالی ما، مانده حساب شما {debt_amount} تومان می‌باشد.

لطفاً در اولین فرصت نسبت به تسویه حساب اقدام فرمایید تا خدمات شما بدون وقفه ادامه یابد.

با تشکر از همکاری شما
تیم مالی`;
}

// Generate AI-powered message template
export async function generateAITemplate(messageType: string, context?: any): Promise<string> {
  const templates = {
    reminder: generateDefaultReminderTemplate(),
    warning: `توجه {store_name}!

مانده حساب شما {debt_amount} تومان است و باید فوراً تسویه شود.

لطفاً ظرف ۲۴ ساعت آینده نسبت به پرداخت اقدام کنید.

تیم مالی`,
    
    invoice_notification: `{store_name} عزیز،

فاکتور جدید به مبلغ {debt_amount} تومان برای شما صادر شد.

جزئیات:
- تاریخ: امروز
- وضعیت: در انتظار پرداخت

با تشکر`,

    payment_reminder: `یادآوری پرداخت

{store_name} گرامی، مانده حساب شما {debt_amount} تومان است.

برای ادامه خدمات، لطفاً در اسرع وقت پرداخت کنید.

تیم پشتیبانی`
  };

  return templates[messageType as keyof typeof templates] || templates.reminder;
}

// Parse criteria from natural language (enhanced for Persian)
export function parseCriteriaFromText(text: string): QueryCriteria {
  const criteria: QueryCriteria = {};
  
  // Parse debt amount criteria
  const debtPatterns = [
    /بدهی بالای ([\d,]+)/,
    /بدهی بیشتر از ([\d,]+)/,
    /مانده بالای ([\d,]+)/,
    /بدهکار بالای ([\d,]+)/,
    /بدهی کمتر از ([\d,]+)/,
    /مانده کمتر از ([\d,]+)/
  ];
  
  for (const pattern of debtPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      const operator = text.includes('بالای') || text.includes('بیشتر از') ? '>' : '<';
      criteria.debtAmount = { operator: operator as any, value: amount };
      break;
    }
  }
  
  // Parse debt existence
  if (text.includes('بدهکار') || text.includes('بدهی دار')) {
    criteria.hasDebt = true;
  }
  
  // Parse store name
  const storePattern = /فروشگاه ([^\s]+)/;
  const storeMatch = text.match(storePattern);
  if (storeMatch) {
    criteria.storeName = { operator: 'contains', value: storeMatch[1] };
  }
  
  return criteria;
}

// Batch processing result interface
export interface BatchProcessingResult {
  targetCount: number;
  messagesGenerated: string[];
  criteria: QueryCriteria;
  template: string;
}

// Execute batch messaging operation
export async function executeBatchMessaging(
  text: string, 
  userTemplate?: string
): Promise<BatchProcessingResult> {
  
  // Parse criteria from user input
  const criteria = parseCriteriaFromText(text);
  
  // Query matching representatives
  const targetRepresentatives = await queryRepresentatives(criteria);
  
  // Determine message template
  let template: string;
  if (userTemplate) {
    template = userTemplate;
  } else {
    // Determine message type from text
    let messageType = 'reminder';
    if (text.includes('هشدار') || text.includes('اخطار')) {
      messageType = 'warning';
    } else if (text.includes('فاکتور')) {
      messageType = 'invoice_notification';
    }
    
    template = await generateAITemplate(messageType);
  }
  
  // Generate personalized messages
  const messagesGenerated = targetRepresentatives.map(rep => 
    personalizeMessage(template, rep)
  );
  
  return {
    targetCount: targetRepresentatives.length,
    messagesGenerated,
    criteria,
    template
  };
}

// Format batch operation description for confirmation
export function formatBatchDescription(result: BatchProcessingResult): string {
  let description = `تولید ${result.targetCount} پیام شخصی‌سازی شده برای نمایندگان با شرایط:\n`;
  
  if (result.criteria.debtAmount) {
    const { operator, value } = result.criteria.debtAmount;
    const operatorText = operator === '>' ? 'بالای' : 'کمتر از';
    description += `• بدهی ${operatorText} ${value.toLocaleString()} تومان\n`;
  }
  
  if (result.criteria.hasDebt) {
    description += `• دارای بدهی\n`;
  }
  
  if (result.criteria.storeName) {
    description += `• نام فروشگاه شامل: ${result.criteria.storeName.value}\n`;
  }
  
  description += `\nمتن پیام:\n"${result.template.substring(0, 100)}..."`;
  
  return description;
}