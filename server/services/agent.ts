import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from '../storage';
import TelegramBot from 'node-telegram-bot-api';

// Tool definitions for Gemini function calling
export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  functionCall: {
    name: string;
    args: Record<string, any>;
  };
}

export interface AgentResponse {
  text?: string;
  toolCalls?: ToolCall[];
}

// Define all available tools for the AI agent
const AVAILABLE_TOOLS: ToolFunction[] = [
  {
    name: "process_weekly_invoices",
    description: "Processes weekly invoices from usage.json file and creates invoices for all representatives",
    parameters: {
      type: "object",
      properties: {
        usage_data: {
          type: "string",
          description: "JSON string containing usage data for all representatives"
        }
      },
      required: ["usage_data"]
    }
  },
  {
    name: "find_representative_with_highest_debt",
    description: "Finds the representative with the highest total debt amount",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "register_payment",
    description: "Registers a new payment from a representative and updates their total debt",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "The store name of the representative making the payment"
        },
        amount: {
          type: "number",
          description: "The amount of money that was paid"
        },
        notes: {
          type: "string",
          description: "Optional notes about the payment"
        }
      },
      required: ["representative_name", "amount"]
    }
  },
  {
    name: "create_manual_invoice",
    description: "Creates a manual invoice for a specific representative",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "The store name of the representative"
        },
        amount: {
          type: "number",
          description: "The invoice amount"
        },
        description: {
          type: "string",
          description: "Description of the invoice"
        }
      },
      required: ["representative_name", "amount", "description"]
    }
  },
  {
    name: "get_representative_status",
    description: "Gets detailed status information for a specific representative including debt, recent payments, and invoices",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "The store name of the representative"
        }
      },
      required: ["representative_name"]
    }
  },
  {
    name: "send_telegram_message",
    description: "Sends a message to a representative via Telegram (if they have Telegram ID configured)",
    parameters: {
      type: "object",
      properties: {
        recipient_name: {
          type: "string",
          description: "The store name of the representative to message"
        },
        message_text: {
          type: "string",
          description: "The message content to send"
        }
      },
      required: ["recipient_name", "message_text"]
    }
  },
  {
    name: "calculate_commissions",
    description: "Calculates and creates commission records for sales colleagues based on recent invoices",
    parameters: {
      type: "object",
      properties: {
        period_days: {
          type: "number",
          description: "Number of days to look back for calculating commissions (default: 7)"
        }
      },
      required: []
    }
  },
  {
    name: "get_financial_summary",
    description: "Gets a comprehensive financial summary including total debts, payments, and commission status",
    parameters: {
      type: "object",
      properties: {
        period_days: {
          type: "number",
          description: "Number of days to include in the summary (default: 30)"
        }
      },
      required: []
    }
  }
];

export class FinancialAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private bot: TelegramBot | null = null;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      tools: [{
        functionDeclarations: AVAILABLE_TOOLS
      }]
    });
    
    // Initialize Telegram bot if token is available
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    }
  }

  // Enhanced method for confirmation workflow
  async processCommandWithConfirmation(userMessage: string, chatId: string): Promise<{
    requiresConfirmation: boolean;
    response: string;
    actionDescription?: string;
    plannedActions?: Array<{ name: string; args: Record<string, any> }>;
  }> {
    try {
      const chat = this.model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
        },
      });

      // Initial prompt with context about the financial system
      const systemPrompt = `شما یک مدیر مالی هوشمند هستید که سیستم مدیریت مالی یک کسب‌وکار پروکسی را کنترل می‌کنید.
      
شما می‌توانید این عملیات‌ها را انجام دهید:
- پردازش فاکتورهای هفتگی از فایل‌های مصرف
- ثبت پرداخت‌ها و به‌روزرسانی بدهی‌ها
- ایجاد فاکتورهای دستی
- ارسال پیام هشدار به نمایندگان
- محاسبه کمیسیون همکاران فروش
- تهیه گزارش‌های مالی جامع

هنگام دریافت دستور، ابتدا برنامه‌ای برای انجام کار تشکیل دهید و سپس ابزارهای مورد نیاز را به ترتیب صدا کنید.`;

      let result = await chat.sendMessage(`${systemPrompt}\n\nدستور کاربر: ${userMessage}`);
      let response = await result.response;

      // Check if the model wants to use tools
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        // Check if any of the planned functions are destructive (require confirmation)
        const { isDestructiveAction } = await import('../services/confirmations');
        const hasDestructiveActions = functionCalls.some(call => {
          return isDestructiveAction(call.name);
        });

        if (hasDestructiveActions) {
          // Return plan for human confirmation
          const plannedActions = functionCalls.map(call => ({
            name: call.name,
            args: call.args
          }));
          
          const { generateActionDescription } = await import('../services/confirmations');
          const actionDescription = generateActionDescription(plannedActions);
          
          return {
            requiresConfirmation: true,
            response: '',
            actionDescription,
            plannedActions
          };
        } else {
          // Execute non-destructive actions immediately
          const functionResponses = [];
          
          for (const call of functionCalls) {
            const functionResult = await this.executeFunction(call.name, call.args);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: functionResult
              }
            });
          }

          // Send function results back to the model
          const nextResult = await chat.sendMessage(functionResponses);
          const nextResponse = await nextResult.response;
          
          return {
            requiresConfirmation: false,
            response: nextResponse.text() || "عملیات با موفقیت انجام شد."
          };
        }
      }

      return {
        requiresConfirmation: false,
        response: response.text() || "متوجه نشدم. لطفا دستور خود را واضح‌تر بیان کنید."
      };

    } catch (error) {
      console.error('Agent processing error:', error);
      return {
        requiresConfirmation: false,
        response: "خطایی در پردازش دستور شما رخ داد. لطفا مجددا تلاش کنید."
      };
    }
  }

  // Original method for backward compatibility
  async processCommand(userMessage: string, context?: any): Promise<string> {
    const result = await this.processCommandWithConfirmation(userMessage, 'default');
    return result.response;
  }

  private async handleAdditionalFunctionCalls(chat: any, functionCalls: any[]): Promise<string> {
    const functionResponses = [];
    
    for (const call of functionCalls) {
      const functionResult = await this.executeFunction(call.name, call.args);
      functionResponses.push({
        functionResponse: {
          name: call.name,
          response: functionResult
        }
      });
    }

    const result = await chat.sendMessage(functionResponses);
    const response = await result.response;
    
    // Check for more function calls
    const moreFunctionCalls = response.functionCalls();
    if (moreFunctionCalls && moreFunctionCalls.length > 0) {
      return await this.handleAdditionalFunctionCalls(chat, moreFunctionCalls);
    }
    
    return response.text() || "عملیات با موفقیت انجام شد.";
  }

  // Direct tool execution for confirmed actions
  async executeToolDirectly(name: string, args: any): Promise<any> {
    return this.executeFunction(name, args);
  }

  // Generate summary of execution results
  generateExecutionSummary(toolCalls: Array<{ name: string; args: Record<string, any> }>, results: any[]): string {
    let summary = '';
    
    toolCalls.forEach((call, index) => {
      const result = results[index];
      const { name, args } = call;
      
      switch (name) {
        case 'process_weekly_invoices':
          if (result.status === 'success') {
            summary += `✅ ${result.invoices_created} فاکتور هفتگی صادر شد\n`;
          }
          break;
        case 'register_payment':
          if (result.status === 'success') {
            summary += `✅ پرداخت ${args.amount?.toLocaleString()} تومان برای '${args.representative_name}' ثبت شد\n`;
          }
          break;
        case 'create_manual_invoice':
          if (result.status === 'success') {
            summary += `✅ فاکتور ${args.amount?.toLocaleString()} تومان برای '${args.representative_name}' صادر شد\n`;
          }
          break;
        case 'calculate_commissions':
          if (result.status === 'success') {
            summary += `✅ کمیسیون ${result.commissions_calculated} همکار محاسبه شد\n`;
          }
          break;
        case 'send_telegram_message':
          if (result.status === 'success') {
            summary += `✅ پیام برای '${args.recipient_name}' ارسال شد\n`;
          }
          break;
        default:
          summary += `✅ ${name} با موفقیت اجرا شد\n`;
      }
    });
    
    return summary || 'عملیات با موفقیت انجام شد.';
  }

  private async executeFunction(name: string, args: any): Promise<any> {
    console.log(`Executing function: ${name} with args:`, args);

    try {
      switch (name) {
        case "process_weekly_invoices":
          return await this.processWeeklyInvoices(args.usage_data);
          
        case "find_representative_with_highest_debt":
          return await this.findRepresentativeWithHighestDebt();
          
        case "register_payment":
          return await this.registerPayment(args.representative_name, args.amount, args.notes);
          
        case "create_manual_invoice":
          return await this.createManualInvoice(args.representative_name, args.amount, args.description);
          
        case "get_representative_status":
          return await this.getRepresentativeStatus(args.representative_name);
          
        case "send_telegram_message":
          return await this.sendTelegramMessage(args.recipient_name, args.message_text);
          
        case "calculate_commissions":
          return await this.calculateCommissions(args.period_days || 7);
          
        case "get_financial_summary":
          return await this.getFinancialSummary(args.period_days || 30);
          
        default:
          return { error: `Unknown function: ${name}` };
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return { error: `Failed to execute ${name}: ${error.message}` };
    }
  }

  // Tool implementations
  private async processWeeklyInvoices(usageDataString: string): Promise<any> {
    try {
      const usageData = JSON.parse(usageDataString);
      const results = [];
      
      for (const [storeName, usage] of Object.entries(usageData)) {
        const rep = await storage.getRepresentativeByStoreName(storeName);
        if (rep) {
          const invoice = await storage.createInvoice({
            representativeId: rep.id,
            amount: usage.toString(),
            description: `فاکتور هفتگی - استفاده از سرویس پروکسی`,
            status: 'unpaid',
            isManual: false,
            usageJsonDetails: JSON.stringify({ usage, storeName })
          });
          results.push({ storeName, invoiceId: invoice.id, amount: usage });
        }
      }
      
      return {
        status: "success",
        invoices_created: results.length,
        total_amount: results.reduce((sum, r) => sum + parseFloat(r.amount), 0),
        details: results
      };
    } catch (error) {
      return { error: `Failed to process invoices: ${error.message}` };
    }
  }

  private async findRepresentativeWithHighestDebt(): Promise<any> {
    const representatives = await storage.getRepresentatives();
    
    if (representatives.length === 0) {
      return { error: "No representatives found" };
    }

    const highestDebtRep = representatives.reduce((max, rep) => {
      const debt = parseFloat(rep.totalDebt || '0');
      const maxDebt = parseFloat(max.totalDebt || '0');
      return debt > maxDebt ? rep : max;
    });

    return {
      representative_name: highestDebtRep.storeName,
      debt_amount: parseFloat(highestDebtRep.totalDebt || '0'),
      contact_info: {
        phone: highestDebtRep.phone,
        telegramId: highestDebtRep.telegramId
      }
    };
  }

  private async registerPayment(representativeName: string, amount: number, notes?: string): Promise<any> {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return { error: `Representative '${representativeName}' not found` };
    }

    await storage.createPayment({
      representativeId: rep.id,
      amount: amount.toString(),
      notes: notes || null
    });

    // Update debt
    const currentDebt = parseFloat(rep.totalDebt || '0');
    const newDebt = Math.max(0, currentDebt - amount);
    await storage.updateRepresentativeDebt(rep.id, newDebt.toString());

    return {
      status: "success",
      representative_name: representativeName,
      payment_amount: amount,
      previous_debt: currentDebt,
      new_debt: newDebt
    };
  }

  private async createManualInvoice(representativeName: string, amount: number, description: string): Promise<any> {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return { error: `Representative '${representativeName}' not found` };
    }

    const invoice = await storage.createInvoice({
      representativeId: rep.id,
      amount: amount.toString(),
      description,
      status: 'unpaid',
      isManual: true
    });

    return {
      status: "success",
      invoice_id: invoice.id,
      representative_name: representativeName,
      amount,
      description
    };
  }

  private async getRepresentativeStatus(representativeName: string): Promise<any> {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return { error: `Representative '${representativeName}' not found` };
    }

    const invoices = await storage.getInvoicesByRepresentative(rep.id);
    const payments = await storage.getPaymentsByRepresentative(rep.id);

    return {
      representative: {
        name: rep.storeName,
        phone: rep.phone,
        total_debt: parseFloat(rep.totalDebt || '0'),
        is_active: rep.isActive
      },
      recent_invoices: invoices.slice(0, 5),
      recent_payments: payments.slice(0, 5),
      summary: {
        total_invoices: invoices.length,
        total_payments: payments.length,
        unpaid_invoices: invoices.filter(i => i.status === 'unpaid').length
      }
    };
  }

  private async sendTelegramMessage(recipientName: string, messageText: string): Promise<any> {
    if (!this.bot) {
      return { error: "Telegram bot not configured" };
    }

    const rep = await storage.getRepresentativeByStoreName(recipientName);
    if (!rep || !rep.telegramId) {
      return { error: `Representative '${recipientName}' not found or no Telegram ID configured` };
    }

    try {
      await this.bot.sendMessage(rep.telegramId, messageText);
      return {
        status: "success",
        recipient_name: recipientName,
        message_sent: true
      };
    } catch (error) {
      return { error: `Failed to send Telegram message: ${error.message}` };
    }
  }

  private async calculateCommissions(periodDays: number): Promise<any> {
    const colleagues = await storage.getSalesColleagues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const results = [];

    for (const colleague of colleagues) {
      const representatives = await storage.getRepresentatives();
      const colleagueReps = representatives.filter(r => r.colleagueId === colleague.id);
      
      let totalCommission = 0;
      for (const rep of colleagueReps) {
        const invoices = await storage.getInvoicesByRepresentative(rep.id);
        const recentInvoices = invoices.filter(i => i.issueDate >= cutoffDate);
        
        const repTotal = recentInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        totalCommission += repTotal * (colleague.commissionRate / 100);
      }

      if (totalCommission > 0) {
        await storage.createCommissionRecord({
          colleagueId: colleague.id,
          commissionAmount: totalCommission.toString(),
          calculatedFromDate: cutoffDate,
          calculatedToDate: new Date(),
          payoutStatus: 'pending'
        });

        results.push({
          colleague_name: colleague.name,
          commission_amount: totalCommission,
          representatives_count: colleagueReps.length
        });
      }
    }

    return {
      status: "success",
      period_days: periodDays,
      commissions_calculated: results.length,
      total_commission_amount: results.reduce((sum, r) => sum + r.commission_amount, 0),
      details: results
    };
  }

  private async getFinancialSummary(periodDays: number): Promise<any> {
    const stats = await storage.getDashboardStats();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const allInvoices = await storage.getInvoices();
    const allPayments = await storage.getPayments();
    
    const recentInvoices = allInvoices.filter(i => i.issueDate >= cutoffDate);
    const recentPayments = allPayments.filter(p => p.paymentDate >= cutoffDate);

    return {
      period_days: periodDays,
      current_stats: stats,
      recent_activity: {
        invoices_created: recentInvoices.length,
        total_invoiced: recentInvoices.reduce((sum, i) => sum + parseFloat(i.amount), 0),
        payments_received: recentPayments.length,
        total_paid: recentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      },
      status_breakdown: {
        unpaid_invoices: allInvoices.filter(i => i.status === 'unpaid').length,
        partially_paid: allInvoices.filter(i => i.status === 'partially_paid').length,
        fully_paid: allInvoices.filter(i => i.status === 'paid').length
      }
    };
  }
}

export const financialAgent = new FinancialAgent();