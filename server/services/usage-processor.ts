import { db } from '../db';
import { representatives, invoices, commissionRecords, salesColleagues } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import { storage } from '../storage';
import { createHash } from 'crypto';

// Transaction record schema validation
interface TransactionRecord {
  admin_username: string;
  amount: string;
  event_timestamp: string;
  description: string;
  event_type?: string; // Optional field from production data
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  invalidRecord?: any;
  lineNumber?: number;
}

interface AggregatedData {
  [username: string]: {
    total_due: number;
    line_items: TransactionRecord[];
  };
}

interface ProcessingResult {
  success: boolean;
  message: string;
  invoicesCreated?: number;
  totalAmount?: number;
  error?: string;
}

// Part 1: Parse and validate usage.json
export function parseUsageFile(fileContent: string): { data: TransactionRecord[], error?: string } {
  try {
    const parsed = JSON.parse(fileContent);
    
    // Ensure root is an array
    if (!Array.isArray(parsed)) {
      return { data: [], error: 'Root element must be a JSON array' };
    }
    
    // Find the data payload object
    let dataPayload: TransactionRecord[] | null = null;
    
    for (const element of parsed) {
      if (element && typeof element === 'object' && 'data' in element) {
        if (Array.isArray(element.data)) {
          dataPayload = element.data;
          break;
        }
      }
    }
    
    if (!dataPayload) {
      return { data: [], error: 'No data payload found in JSON array' };
    }
    
    return { data: dataPayload };
  } catch (error) {
    return { data: [], error: `JSON parsing failed: ${error.message}` };
  }
}

// Validate individual transaction record
function validateTransaction(record: any, index: number): ValidationResult {
  // Check admin_username
  if (!record.admin_username || typeof record.admin_username !== 'string' || record.admin_username.trim() === '') {
    return {
      isValid: false,
      error: 'admin_username must be a non-empty string',
      invalidRecord: record,
      lineNumber: index + 1
    };
  }
  
  // Check amount
  if (!record.amount || typeof record.amount !== 'string') {
    return {
      isValid: false,
      error: 'amount must exist and be a string',
      invalidRecord: record,
      lineNumber: index + 1
    };
  }
  
  const parsedAmount = parseFloat(record.amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return {
      isValid: false,
      error: 'amount must be parsable to a non-negative number',
      invalidRecord: record,
      lineNumber: index + 1
    };
  }
  
  // Check event_timestamp
  if (!record.event_timestamp || typeof record.event_timestamp !== 'string') {
    return {
      isValid: false,
      error: 'event_timestamp must exist and be a string',
      invalidRecord: record,
      lineNumber: index + 1
    };
  }
  
  const parsedDate = new Date(record.event_timestamp);
  if (isNaN(parsedDate.getTime())) {
    return {
      isValid: false,
      error: 'event_timestamp must be a valid datetime string',
      invalidRecord: record,
      lineNumber: index + 1
    };
  }
  
  // Check description
  if (!record.description || typeof record.description !== 'string') {
    return {
      isValid: false,
      error: 'description must exist and be a string',
      invalidRecord: record,
      lineNumber: index + 1
    };
  }
  
  return { isValid: true };
}

// Validate all transactions
export function validateAllTransactions(transactions: any[]): ValidationResult {
  for (let i = 0; i < transactions.length; i++) {
    const validation = validateTransaction(transactions[i], i);
    if (!validation.isValid) {
      return validation;
    }
  }
  return { isValid: true };
}

// Part 2: Aggregate transactions by username
export function aggregateTransactions(transactions: TransactionRecord[]): AggregatedData {
  const representatives_summary: AggregatedData = {};
  
  for (const transaction of transactions) {
    const username = transaction.admin_username;
    
    if (!representatives_summary[username]) {
      representatives_summary[username] = {
        total_due: 0.0,
        line_items: []
      };
    }
    
    representatives_summary[username].total_due += parseFloat(transaction.amount);
    representatives_summary[username].line_items.push(transaction);
  }
  
  return representatives_summary;
}

// Generate hash for idempotency check
function generateTransactionHash(transactions: TransactionRecord[]): string {
  const sortedTransactions = [...transactions].sort((a, b) => {
    return a.event_timestamp.localeCompare(b.event_timestamp) || 
           a.admin_username.localeCompare(b.admin_username);
  });
  
  const hashContent = sortedTransactions.map(t => 
    `${t.admin_username}|${t.amount}|${t.event_timestamp}|${t.description}`
  ).join('\n');
  
  return createHash('sha256').update(hashContent).digest('hex');
}

// Part 3: The ProcessAndCommit Workflow
export async function processAndCommitTransactions(aggregatedData: AggregatedData): Promise<ProcessingResult> {
  let invoicesCreated = 0;
  let totalAmount = 0;
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Start transaction
    await db.transaction(async (tx) => {
      // Process in batches for better performance with 500+ admins
      const entries = Object.entries(aggregatedData);
      console.log(`Processing ${entries.length} representatives in single transaction...`);
      
      for (const [username, summary] of entries) {
        // Generate hash for this representative's transactions
        const transactionHash = generateTransactionHash(summary.line_items);
        
        // Check for duplicate processing
        const existingInvoice = await tx
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.usageHash, transactionHash),
            eq(invoices.isManual, false)
          ))
          .limit(1);
          
        if (existingInvoice.length > 0) {
          console.log(`Skipping duplicate invoice for ${username} - already processed with hash ${transactionHash}`);
          continue;
        }
        // Step A: Reconcile Representative Identity
        let representativeRecord = await tx
          .select()
          .from(representatives)
          .where(eq(representatives.panelUsername, username))
          .limit(1);
        
        let representative_id: number;
        let colleague_id: number | null = null;
        
        if (representativeRecord.length > 0) {
          // Representative exists
          representative_id = representativeRecord[0].id;
          colleague_id = representativeRecord[0].colleagueId;
        } else {
          // Genesis Protocol: Create new representative
          const newRep = await tx
            .insert(representatives)
            .values({
              storeName: username, // Using username as default store name
              ownerName: null,
              phone: null,
              panelUsername: username,
              telegramId: null,
              salesColleagueName: null,
              totalDebt: '0',
              isActive: true,
              colleagueId: null
            })
            .returning();
          
          representative_id = newRep[0].id;
          colleague_id = null;
        }
        
        // Step B: Create the Immutable Invoice Record
        const newInvoice = await tx
          .insert(invoices)
          .values({
            representativeId: representative_id,
            amount: summary.total_due.toString(),
            description: `Usage-based invoice - ${summary.line_items.length} transactions`,
            status: 'unpaid',
            isManual: false,
            usageJsonDetails: JSON.stringify(summary.line_items),
            usageHash: transactionHash,
            processingBatchId: batchId
          })
          .returning();
        
        const new_invoice_id = newInvoice[0].id;
        invoicesCreated++;
        totalAmount += summary.total_due;
        
        // Step C: Update the Master Financial Profile
        await tx
          .update(representatives)
          .set({
            totalDebt: sql`${representatives.totalDebt}::numeric + ${summary.total_due}`
          })
          .where(eq(representatives.id, representative_id));
        
        // Step D: Process Commissions (if applicable)
        if (colleague_id) {
          const colleague = await tx
            .select()
            .from(salesColleagues)
            .where(eq(salesColleagues.id, colleague_id))
            .limit(1);
          
          if (colleague.length > 0) {
            const commission_rate = colleague[0].commissionRate / 100;
            const commission_amount = summary.total_due * commission_rate;
            
            await tx
              .insert(commissionRecords)
              .values({
                colleagueId: colleague_id,
                sourceInvoiceId: new_invoice_id,
                commissionAmount: commission_amount.toString(),
                payoutStatus: 'pending'
              });
          }
        }
      }
    });
    
    return {
      success: true,
      message: 'All transactions processed successfully',
      invoicesCreated,
      totalAmount
    };
    
  } catch (error) {
    console.error('Transaction processing failed:', error);
    return {
      success: false,
      message: 'Transaction processing failed',
      error: error.message
    };
  }
}

// Main processing function
export async function processUsageFile(fileContent: string): Promise<ProcessingResult> {
  // Step 1: Parse the file
  const { data: transactions, error: parseError } = parseUsageFile(fileContent);
  if (parseError) {
    return {
      success: false,
      message: 'File parsing failed',
      error: parseError
    };
  }
  
  // Step 2: Validate all transactions
  const validation = validateAllTransactions(transactions);
  if (!validation.isValid) {
    return {
      success: false,
      message: 'Validation failed',
      error: `Line ${validation.lineNumber}: ${validation.error}\nInvalid record: ${JSON.stringify(validation.invalidRecord)}`
    };
  }
  
  // Step 3: Aggregate transactions
  const aggregatedData = aggregateTransactions(transactions as TransactionRecord[]);
  
  // Step 4: Process and commit
  return await processAndCommitTransactions(aggregatedData);
}