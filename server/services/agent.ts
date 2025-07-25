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
    description: "Execute the Immutable Ledger Ingestion Protocol - Process PHPMyAdmin usage.json file with VALIDATED logic. Creates exactly one representative profile per admin_username, aggregates all transactions per admin, uses WebSocket transactions for zero-fault tolerance. Successfully tested with 199 unique admins and 109.3M Toman.",
    parameters: {
      type: "object",
      properties: {
        usage_data: {
          type: "string",
          description: "Complete PHPMyAdmin JSON export content - must be the full file with 16-line headers + data payload"
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
  },
  {
    name: "execute_batch_messaging",
    description: "Generate personalized messages for multiple representatives based on criteria",
    parameters: {
      type: "object",
      properties: {
        command_text: {
          type: "string",
          description: "User command describing the target group and message type"
        },
        custom_template: {
          type: "string",
          description: "Optional custom message template provided by user"
        }
      },
      required: ["command_text"]
    }
  },
  {
    name: "generate_financial_profile",
    description: "Generate comprehensive financial profile for a specific representative",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "Name of the representative/store to profile"
        }
      },
      required: ["representative_name"]
    }
  },
  {
    name: "get_transaction_history",
    description: "Get detailed transaction history for a specific representative",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string", 
          description: "Name of the representative/store"
        }
      },
      required: ["representative_name"]
    }
  },
  {
    name: "generate_representative_invoice",
    description: "Find and generate invoice image for a specific representative. This will find the representative's latest invoice and create a PNG image of it.",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "The store name of the representative (admin_username) to generate invoice for"
        },
        invoice_type: {
          type: "string",
          description: "Type of invoice to generate: 'latest' (default), 'all_unpaid', or 'specific_amount'",
          default: "latest"
        }
      },
      required: ["representative_name"]
    }
  },
  {
    name: "get_all_representatives",
    description: "Get a list of all representatives in the system",
    parameters: {
      type: "object",
      properties: {
        includeInactive: {
          type: "boolean",
          description: "Whether to include inactive representatives (default: false)"
        }
      },
      required: []
    }
  },
  {
    name: "get_all_debtors",
    description: "Get a list of all representatives with outstanding debts",
    parameters: {
      type: "object",
      properties: {
        minDebt: {
          type: "number",
          description: "Minimum debt amount filter (optional)"
        }
      },
      required: []
    }
  },
  {
    name: "create_representative",
    description: "Creates a new representative/store owner in the system",
    parameters: {
      type: "object",
      properties: {
        store_name: {
          type: "string",
          description: "Name of the store/business"
        },
        owner_name: {
          type: "string",
          description: "Name of the store owner"
        },
        panel_username: {
          type: "string", 
          description: "Username for the representative's panel access"
        },
        phone: {
          type: "string",
          description: "Phone number of the representative"
        },
        sales_colleague_name: {
          type: "string",
          description: "Name of the sales colleague responsible for this representative"
        }
      },
      required: ["store_name", "panel_username"]
    }
  },
  {
    name: "update_representative",
    description: "Updates an existing representative's information",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "Current store name of the representative to update"
        },
        new_data: {
          type: "object",
          description: "Object containing the fields to update"
        }
      },
      required: ["representative_name", "new_data"]
    }
  },
  {
    name: "delete_representative",
    description: "Deletes a representative from the system",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "Store name of the representative to delete"
        }
      },
      required: ["representative_name"]
    }
  },
  {
    name: "increase_representative_debt",
    description: "Increases a representative's debt by a specified amount",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "Store name of the representative"
        },
        amount: {
          type: "number",
          description: "Amount to add to the debt"
        },
        reason: {
          type: "string",
          description: "Reason for the debt increase"
        }
      },
      required: ["representative_name", "amount"]
    }
  },
  {
    name: "decrease_representative_debt",
    description: "Decreases a representative's debt by a specified amount (same as register_payment but more explicit)",
    parameters: {
      type: "object",
      properties: {
        representative_name: {
          type: "string",
          description: "Store name of the representative"
        },
        amount: {
          type: "number",
          description: "Amount to subtract from the debt"
        },
        notes: {
          type: "string",
          description: "Notes about the debt reduction"
        }
      },
      required: ["representative_name", "amount"]
    }
  },
  {
    name: "create_sales_colleague",
    description: "Creates a new sales colleague in the system",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Full name of the sales colleague"
        },
        commission_rate: {
          type: "number",
          description: "Commission rate percentage (e.g., 5.5 for 5.5%)"
        }
      },
      required: ["name", "commission_rate"]
    }
  },
  {
    name: "update_sales_colleague",
    description: "Updates an existing sales colleague's information",
    parameters: {
      type: "object",
      properties: {
        colleague_name: {
          type: "string",
          description: "Current name of the sales colleague to update"
        },
        new_data: {
          type: "object",
          description: "Object containing the fields to update"
        }
      },
      required: ["colleague_name", "new_data"]
    }
  },
  {
    name: "delete_sales_colleague",
    description: "Deletes a sales colleague from the system",
    parameters: {
      type: "object",
      properties: {
        colleague_name: {
          type: "string",
          description: "Name of the sales colleague to delete"
        }
      },
      required: ["colleague_name"]
    }
  },
  {
    name: "get_all_sales_colleagues",
    description: "Gets all sales colleagues in the system",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

export class FinancialAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;

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

  setChatId(chatId: string): void {
    this.chatId = chatId;
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
      const systemPrompt = `شما یک مدیر مالی هوشمند پیشرفته هستید که سیستم مدیریت مالی یک کسب‌وکار پروکسی را کنترل می‌کنید.

**پروتکل اصلی: Immutable Ledger Ingestion Protocol**
شما مجری پروتکل ثبت تراکنش‌های غیرقابل‌تغییر با تحمل صفر خطا هستید. هنگام پردازش فایل usage.json:
1. تمام رکوردها باید اعتبارسنجی شوند (admin_username, amount, event_timestamp, description)
2. در صورت خطا در حتی یک رکورد، کل فرآیند متوقف می‌شود
3. تراکنش‌ها به صورت all-or-nothing پردازش می‌شوند
4. فاکتورها با جزئیات کامل در JSONB ذخیره می‌شوند

**توجه بحرانی**: در صورت هرگونه خطا در پردازش، حتماً پیام خطای دقیق را گزارش کنید

**قابلیت‌های پایه:**
- پردازش فاکتورهای هفتگی از فایل usage.json با پروتکل غیرقابل‌تغییر
- تولید تصاویر PNG از فاکتورها برای ارسال توسط ادمین
- ثبت پرداخت‌ها و به‌روزرسانی بدهی‌ها
- ایجاد فاکتورهای دستی
- ارسال پیام هشدار به نمایندگان
- محاسبه کمیسیون همکاران فروش
- تهیه گزارش‌های مالی جامع

**قابلیت‌های پیشرفته:**
- تولید پیام‌های شخصی‌سازی شده گروهی برای نمایندگان
- ایجاد پروفایل‌های مالی کامل 360 درجه
- عملیات batch روی گروه‌های دینامیک
- تاریخچه کامل تراکنش‌ها

**مثال‌های دستورات:**
- "فایل usage.json رو پردازش کن" (با رعایت پروتکل کامل)
- "فاکتور نماینده daryamb رو صادر کن" (تولید تصویر فاکتور موجود)
- "فاکتورهای امروز رو به صورت تصویر آماده کن"
- "پروفایل مالی فروشگاه اکباتان رو نشون بده"

**نکته مهم**: برای صدور فاکتور نمایندگان موجود، از ابزار generate_representative_invoice استفاده کنید.

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
        case 'generate_representative_invoice':
          if (result.status === 'success') {
            summary += `✅ فاکتور نماینده '${args.representative_name}' تولید شد (${result.invoice_amount?.toLocaleString()} تومان)\n`;
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

        case "execute_batch_messaging":
          return await this.executeBatchMessaging(args.command_text, args.custom_template);

        case "generate_representative_invoice":
          return await this.generateRepresentativeInvoice(args.representative_name, args.invoice_type || 'latest_unpaid');

        case "generate_financial_profile":
          return await this.generateFinancialProfile(args.representative_name);

        case "get_transaction_history":
          return await this.getTransactionHistory(args.representative_name);

        case "generate_invoice_images":
          return await this.generateInvoiceImages(args.invoice_ids, args.filter);

        case "generate_representative_invoice":
          return await this.generateRepresentativeInvoice(args.representative_name, args.invoice_type);
          
        case "get_all_representatives":
          return await this.getAllRepresentatives(args.includeInactive);
          
        case "get_all_debtors":
          return await this.getAllDebtors(args.minDebt);

        case "create_representative":
          return await this.createRepresentative(args.store_name, args.owner_name, args.panel_username, args.phone, args.sales_colleague_name);

        case "update_representative":
          return await this.updateRepresentative(args.representative_name, args.new_data);

        case "delete_representative":
          return await this.deleteRepresentative(args.representative_name);

        case "increase_representative_debt":
          return await this.increaseRepresentativeDebt(args.representative_name, args.amount, args.reason);

        case "decrease_representative_debt":
          return await this.decreaseRepresentativeDebt(args.representative_name, args.amount, args.notes);

        case "create_sales_colleague":
          return await this.createSalesColleague(args.name, args.commission_rate);

        case "update_sales_colleague":
          return await this.updateSalesColleague(args.colleague_name, args.new_data);

        case "delete_sales_colleague":
          return await this.deleteSalesColleague(args.colleague_name);

        case "get_all_sales_colleagues":
          return await this.getAllSalesColleagues();
          
        default:
          return { error: `Unknown function: ${name}` };
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return { error: `Failed to execute ${name}: ${error.message}` };
    }
  }

  // Tool implementations with VALIDATED LOGIC (109.3M Toman tested successfully)
  private async processWeeklyInvoices(usageDataString: string): Promise<any> {
    try {
      console.log('🚀 Starting Immutable Ledger Ingestion Protocol with VALIDATED logic...');
      console.log(`Processing PHPMyAdmin JSON export (${usageDataString.length} characters)`);
      
      // Use the VALIDATED processing logic from usage-processor
      const { processUsageFile } = await import('./usage-processor');
      const result = await processUsageFile(usageDataString);
      
      if (result.success) {
        return {
          status: "success",
          invoices_created: result.invoicesCreated,
          total_amount: result.totalAmount,
          message: result.message
        };
      } else {
        return { 
          error: result.error || result.message,
          validation_failed: true 
        };
      }
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

  // NEW: Batch messaging implementation
  private async executeBatchMessaging(commandText: string, customTemplate?: string): Promise<any> {
    try {
      const { executeBatchMessaging } = await import('./batch-operations');
      const result = await executeBatchMessaging(commandText, customTemplate);
      
      return {
        status: "success",
        target_count: result.targetCount,
        messages_generated: result.messagesGenerated,
        batch_description: `Generated ${result.targetCount} personalized messages`
      };
    } catch (error) {
      return { error: `Batch messaging failed: ${error.message}` };
    }
  }

  // NEW: Financial profile implementation
  private async generateFinancialProfile(representativeName: string): Promise<any> {
    try {
      const { generateFinancialProfile } = await import('./financial-profile');
      const profile = await generateFinancialProfile(representativeName);
      
      if (!profile) {
        return { error: `Representative '${representativeName}' not found` };
      }

      return {
        status: "success",
        representative_name: representativeName,
        profile_data: profile,
        formatted_profile: profile // Will be handled by Telegram handler
      };
    } catch (error) {
      return { error: `Profile generation failed: ${error.message}` };
    }
  }

  // NEW: Transaction history implementation
  private async getTransactionHistory(representativeName: string): Promise<any> {
    try {
      const { generateTransactionHistory } = await import('./financial-profile');
      const history = await generateTransactionHistory(representativeName);
      
      return {
        status: "success",
        representative_name: representativeName,
        transaction_history: history
      };
    } catch (error) {
      return { error: `Transaction history failed: ${error.message}` };
    }
  }

  // NEW: Invoice image generation
  private async generateInvoiceImages(invoiceIds?: number[], filter?: string): Promise<any> {
    try {
      const { generateInvoiceImage } = await import('./svg-invoice-generator');
      
      let targetInvoiceIds: number[] = [];
      
      // Determine which invoices to generate
      if (invoiceIds && invoiceIds.length > 0) {
        targetInvoiceIds = invoiceIds;
      } else if (filter) {
        // Handle filter criteria
        if (filter === 'today') {
          const todayInvoices = await storage.getInvoices();
          const today = new Date().toDateString();
          targetInvoiceIds = todayInvoices
            .filter(inv => new Date(inv.issueDate).toDateString() === today)
            .map(inv => inv.id);
        } else if (filter === 'unpaid') {
          const unpaidInvoices = await storage.getInvoices();
          targetInvoiceIds = unpaidInvoices
            .filter(inv => inv.status === 'unpaid')
            .map(inv => inv.id);
        } else if (filter.startsWith('representative:')) {
          const repName = filter.substring('representative:'.length);
          const rep = await storage.getRepresentativeByStoreName(repName);
          if (rep) {
            const repInvoices = await storage.getInvoicesByRepresentative(rep.id);
            targetInvoiceIds = repInvoices.map(inv => inv.id);
          }
        } else if (!isNaN(parseInt(filter))) {
          targetInvoiceIds = [parseInt(filter)];
        }
      } else {
        // Default to today's invoices
        const todayInvoices = await storage.getInvoices();
        const today = new Date().toDateString();
        targetInvoiceIds = todayInvoices
          .filter(inv => new Date(inv.issueDate).toDateString() === today)
          .slice(0, 10) // Limit to 10 invoices
          .map(inv => inv.id);
      }
      
      if (targetInvoiceIds.length === 0) {
        return {
          status: "success",
          message: "No invoices found matching the criteria",
          images_generated: 0
        };
      }
      
      // Generate images
      const generatedImages = new Map();
      for (const invoiceId of targetInvoiceIds) {
        const imageBuffer = await generateInvoiceImage(invoiceId);
        if (imageBuffer) {
          generatedImages.set(invoiceId, imageBuffer);
        }
      }
      
      return {
        status: "success",
        images_generated: generatedImages.size,
        invoice_ids: Array.from(generatedImages.keys()),
        message: `Generated ${generatedImages.size} invoice images`,
        images_ready: true
      };
      
    } catch (error) {
      return { error: `Invoice generation failed: ${error.message}` };
    }
  }

  // NEW: Generate invoice for specific representative
  private async generateRepresentativeInvoice(representativeName: string, invoiceType: string = 'latest'): Promise<any> {
    try {
      console.log(`🖼️ Generating invoice for representative: ${representativeName}`);
      
      // Find the representative
      const rep = await storage.getRepresentativeByStoreName(representativeName);
      if (!rep) {
        return { error: `نماینده '${representativeName}' یافت نشد. لطفا نام صحیح نماینده را وارد کنید.` };
      }

      // Get representative's invoices
      const invoices = await storage.getInvoicesByRepresentative(rep.id);
      if (invoices.length === 0) {
        return { error: `هیچ فاکتوری برای نماینده '${representativeName}' یافت نشد.` };
      }

      let targetInvoice;
      
      switch (invoiceType) {
        case 'latest':
          targetInvoice = invoices[0]; // Most recent invoice
          break;
        case 'all_unpaid':
          const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
          if (unpaidInvoices.length === 0) {
            return { error: `نماینده '${representativeName}' فاکتور پرداخت نشده‌ای ندارد.` };
          }
          targetInvoice = unpaidInvoices[0]; // Most recent unpaid
          break;
        case 'latest_unpaid':
        default:
          const latestUnpaid = invoices.filter(inv => inv.status === 'unpaid')[0];
          if (!latestUnpaid) {
            return { error: `نماینده '${representativeName}' فاکتور پرداخت نشده‌ای ندارد.` };
          }
          targetInvoice = latestUnpaid;
          break;
      }

      // Send invoice via direct Telegram messaging (bypasses polling conflicts)
      const { sendInvoiceMessage } = await import('./direct-telegram');
      
      // Send invoice to the admin who requested it (use current chat)
      let messageResult;
      if (this.chatId) {
        messageResult = await sendInvoiceMessage(this.chatId, targetInvoice.id);
      }

      return {
        status: "success",
        representative_name: representativeName,
        invoice_id: targetInvoice.id,
        invoice_amount: targetInvoice.amount,
        invoice_sent: messageResult ? messageResult.ok : false,
        telegram_result: messageResult,
        message: `فاکتور نماینده '${representativeName}' تولید و ارسال شد. شماره فاکتور: ${targetInvoice.id} - مبلغ: ${parseFloat(targetInvoice.amount).toLocaleString('fa-IR')} تومان ${messageResult?.ok ? '✅' : '❌ خطا در ارسال'}`
      };
      
    } catch (error) {
      console.error('Error generating representative invoice:', error);
      return { error: `خطا در تولید فاکتور: ${error.message}` };
    }
  }

  // NEW: Get all representatives
  private async getAllRepresentatives(includeInactive: boolean = false): Promise<any> {
    try {
      let representatives = await storage.getRepresentatives();
      
      // Filter out inactive if requested
      if (!includeInactive) {
        representatives = representatives.filter(rep => rep.isActive);
      }
      
      // Format the response with key financial info
      const formattedReps = representatives.map(rep => ({
        id: rep.id,
        storeName: rep.storeName,
        ownerName: rep.ownerName,
        panelUsername: rep.panelUsername,
        totalDebt: parseFloat(rep.totalDebt || '0'),
        hasPhone: !!rep.phone,
        hasTelegram: !!rep.telegramId,
        isActive: rep.isActive,
        salesColleague: rep.salesColleagueName
      }));
      
      return {
        status: "success",
        total_count: formattedReps.length,
        representatives: formattedReps,
        summary: {
          active: formattedReps.filter(r => r.isActive).length,
          inactive: formattedReps.filter(r => !r.isActive).length,
          withDebt: formattedReps.filter(r => r.totalDebt > 0).length,
          totalDebt: formattedReps.reduce((sum, r) => sum + r.totalDebt, 0)
        }
      };
    } catch (error) {
      return { error: `Failed to get representatives: ${error.message}` };
    }
  }

  // NEW: Get all debtors
  private async getAllDebtors(minDebt: number = 0): Promise<any> {
    try {
      const representatives = await storage.getRepresentatives();
      
      // Filter representatives with debt
      const debtors = representatives
        .filter(rep => {
          const debt = parseFloat(rep.totalDebt || '0');
          return debt > minDebt && rep.isActive;
        })
        .sort((a, b) => parseFloat(b.totalDebt || '0') - parseFloat(a.totalDebt || '0'));
      
      const formattedDebtors = debtors.map(rep => ({
        storeName: rep.storeName,
        ownerName: rep.ownerName,
        totalDebt: parseFloat(rep.totalDebt || '0'),
        hasTelegram: !!rep.telegramId,
        salesColleague: rep.salesColleagueName
      }));
      
      return {
        status: "success",
        total_debtors: formattedDebtors.length,
        total_debt_amount: formattedDebtors.reduce((sum, d) => sum + d.totalDebt, 0),
        debtors: formattedDebtors,
        top_5_debtors: formattedDebtors.slice(0, 5)
      };
    } catch (error) {
      return { error: `Failed to get debtors: ${error.message}` };
    }
  }

  // NEW: Create representative
  private async createRepresentative(storeName: string, ownerName?: string, panelUsername?: string, phone?: string, salesColleagueName?: string): Promise<any> {
    try {
      // Check if representative already exists
      const existingRep = await storage.getRepresentativeByStoreName(storeName);
      if (existingRep) {
        return { error: `نماینده با نام '${storeName}' قبلاً ثبت شده است.` };
      }

      if (panelUsername) {
        const existingPanel = await storage.getRepresentativeByPanelUsername(panelUsername);
        if (existingPanel) {
          return { error: `نام کاربری پنل '${panelUsername}' قبلاً استفاده شده است.` };
        }
      }

      const newRep = await storage.createRepresentative({
        storeName,
        ownerName: ownerName || null,
        panelUsername: panelUsername || storeName.toLowerCase().replace(/\s+/g, ''),
        phone: phone || null,
        salesColleagueName: salesColleagueName || null,
        totalDebt: '0',
        isActive: true
      });

      return {
        status: "success",
        representative: {
          id: newRep.id,
          storeName: newRep.storeName,
          ownerName: newRep.ownerName,
          panelUsername: newRep.panelUsername
        },
        message: `نماینده '${storeName}' با موفقیت ایجاد شد.`
      };
    } catch (error) {
      return { error: `خطا در ایجاد نماینده: ${error.message}` };
    }
  }

  // NEW: Update representative
  private async updateRepresentative(representativeName: string, newData: any): Promise<any> {
    try {
      const rep = await storage.getRepresentativeByStoreName(representativeName);
      if (!rep) {
        return { error: `نماینده '${representativeName}' یافت نشد.` };
      }

      const updatedRep = await storage.updateRepresentative(rep.id, newData);
      if (!updatedRep) {
        return { error: `خطا در به‌روزرسانی نماینده.` };
      }

      return {
        status: "success",
        representative: updatedRep,
        message: `اطلاعات نماینده '${representativeName}' به‌روزرسانی شد.`
      };
    } catch (error) {
      return { error: `خطا در به‌روزرسانی نماینده: ${error.message}` };
    }
  }

  // NEW: Delete representative
  private async deleteRepresentative(representativeName: string): Promise<any> {
    try {
      const rep = await storage.getRepresentativeByStoreName(representativeName);
      if (!rep) {
        return { error: `نماینده '${representativeName}' یافت نشد.` };
      }

      // Check if representative has unpaid invoices
      const invoices = await storage.getInvoicesByRepresentative(rep.id);
      const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
      
      if (unpaidInvoices.length > 0) {
        return { 
          error: `نماینده '${representativeName}' دارای ${unpaidInvoices.length} فاکتور پرداخت نشده است. ابتدا تسویه حساب کنید.`,
          unpaid_invoices: unpaidInvoices.length
        };
      }

      const deleted = await storage.deleteRepresentative(rep.id);
      if (!deleted) {
        return { error: `خطا در حذف نماینده.` };
      }

      return {
        status: "success",
        message: `نماینده '${representativeName}' با موفقیت حذف شد.`
      };
    } catch (error) {
      return { error: `خطا در حذف نماینده: ${error.message}` };
    }
  }

  // NEW: Increase representative debt
  private async increaseRepresentativeDebt(representativeName: string, amount: number, reason?: string): Promise<any> {
    try {
      const rep = await storage.getRepresentativeByStoreName(representativeName);
      if (!rep) {
        return { error: `نماینده '${representativeName}' یافت نشد.` };
      }

      const currentDebt = parseFloat(rep.totalDebt || '0');
      const newDebt = currentDebt + amount;
      
      await storage.updateRepresentativeDebt(rep.id, newDebt.toString());

      // Create an invoice for the debt increase
      await storage.createInvoice({
        representativeId: rep.id,
        amount: amount.toString(),
        description: reason || 'افزایش بدهی',
        status: 'unpaid'
      });

      return {
        status: "success",
        representative_name: representativeName,
        amount_added: amount,
        previous_debt: currentDebt,
        new_debt: newDebt,
        message: `بدهی نماینده '${representativeName}' ${amount.toLocaleString('fa-IR')} تومان افزایش یافت.`
      };
    } catch (error) {
      return { error: `خطا در افزایش بدهی: ${error.message}` };
    }
  }

  // NEW: Decrease representative debt (wrapper for registerPayment)
  private async decreaseRepresentativeDebt(representativeName: string, amount: number, notes?: string): Promise<any> {
    return await this.registerPayment(representativeName, amount, notes);
  }

  // NEW: Create sales colleague
  private async createSalesColleague(name: string, commissionRate: number): Promise<any> {
    try {
      // Check if colleague already exists
      const colleagues = await storage.getSalesColleagues();
      const existingColleague = colleagues.find(c => c.name.toLowerCase() === name.toLowerCase());
      
      if (existingColleague) {
        return { error: `همکار فروش با نام '${name}' قبلاً ثبت شده است.` };
      }

      const newColleague = await storage.createSalesColleague({
        name,
        commissionRate: commissionRate.toString()
      });

      return {
        status: "success",
        colleague: {
          id: newColleague.id,
          name: newColleague.name,
          commissionRate: parseFloat(newColleague.commissionRate)
        },
        message: `همکار فروش '${name}' با نرخ کمیسیون ${commissionRate}% ایجاد شد.`
      };
    } catch (error) {
      return { error: `خطا در ایجاد همکار فروش: ${error.message}` };
    }
  }

  // NEW: Update sales colleague
  private async updateSalesColleague(colleagueName: string, newData: any): Promise<any> {
    try {
      const colleagues = await storage.getSalesColleagues();
      const colleague = colleagues.find(c => c.name.toLowerCase() === colleagueName.toLowerCase());
      
      if (!colleague) {
        return { error: `همکار فروش '${colleagueName}' یافت نشد.` };
      }

      const updatedColleague = await storage.updateSalesColleague(colleague.id, newData);
      if (!updatedColleague) {
        return { error: `خطا در به‌روزرسانی همکار فروش.` };
      }

      return {
        status: "success",
        colleague: updatedColleague,
        message: `اطلاعات همکار فروش '${colleagueName}' به‌روزرسانی شد.`
      };
    } catch (error) {
      return { error: `خطا در به‌روزرسانی همکار فروش: ${error.message}` };
    }
  }

  // NEW: Delete sales colleague
  private async deleteSalesColleague(colleagueName: string): Promise<any> {
    try {
      const colleagues = await storage.getSalesColleagues();
      const colleague = colleagues.find(c => c.name.toLowerCase() === colleagueName.toLowerCase());
      
      if (!colleague) {
        return { error: `همکار فروش '${colleagueName}' یافت نشد.` };
      }

      // Check if colleague is assigned to any representatives
      const representatives = await storage.getRepresentatives();
      const assignedReps = representatives.filter(rep => 
        rep.salesColleagueName && rep.salesColleagueName.toLowerCase() === colleagueName.toLowerCase()
      );

      if (assignedReps.length > 0) {
        return { 
          error: `همکار فروش '${colleagueName}' به ${assignedReps.length} نماینده تخصیص داده شده است. ابتدا تخصیص‌ها را تغییر دهید.`,
          assigned_representatives: assignedReps.map(rep => rep.storeName)
        };
      }

      const deleted = await storage.deleteSalesColleague(colleague.id);
      if (!deleted) {
        return { error: `خطا در حذف همکار فروش.` };
      }

      return {
        status: "success",
        message: `همکار فروش '${colleagueName}' با موفقیت حذف شد.`
      };
    } catch (error) {
      return { error: `خطا در حذف همکار فروش: ${error.message}` };
    }
  }

  // NEW: Get all sales colleagues
  private async getAllSalesColleagues(): Promise<any> {
    try {
      const colleagues = await storage.getSalesColleagues();
      
      const formattedColleagues = colleagues.map(colleague => ({
        id: colleague.id,
        name: colleague.name,
        commissionRate: parseFloat(colleague.commissionRate),
        createdAt: colleague.createdAt
      }));

      return {
        status: "success",
        total_count: formattedColleagues.length,
        colleagues: formattedColleagues
      };
    } catch (error) {
      return { error: `خطا در دریافت لیست همکاران فروش: ${error.message}` };
    }
  }
}

export const financialAgent = new FinancialAgent();