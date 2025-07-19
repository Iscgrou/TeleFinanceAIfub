import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { storage } from '../storage';
import { Invoice, Representative } from '@shared/schema';

// Invoice template HTML
const invoiceTemplate = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    @font-face {
      font-family: 'IRANSans';
      src: url('data:font/woff2;base64,d09GMgABAAAAAAKwAAsAAAAABbQAAAJgAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACCcAqBMIEsATYCJAMICwYABCAFhGcHMBtYBciuMTZxV2PAAIBQCCgKhUJW3u+/f3v2dvecAiQSiUQikUgkEolEIpFIJBKJRCKRCEB/35t5L5FIJBKJRCKRSCRyPxKJ3I9E7n8ikfu/iUT+30Qi93+JRO7/IhGJhEDADQwKBAR2CQi4BQQGBnYJOLgDBnbJ/3//n/v/f//n//9z/5/7n/uf+5/7n/uf+/+cAwABEIsF0F4LBwUANwBgAC4AxgC8AXgD8AbgDcAbgDcAbwDeALwBeAOwBmANwBqANQBrANYArAFYA7AGYA3AGoBjgNgY4BgAHAPExgDHALExQGwMEBsDxMYAsTFAbAwwNoAxAIwBYAwAYwAYA8AYAMYAMAaAMQCMAWAMAGMgGANhDISBUAyEgVAMhIFQDISBUAyEYSAMg2AYCMNAGAbCMBCGgTAMhGEgDANhGAjDQBgGwnAQhoMwHIThIAwHYTgIw0EYDsJwEIaDMByE4SAMB2E4CMNBGA7CcBCGgzAchOEgDAdhOAjDQRgOIjgQwUEEB2VwEMFBBAdRHERxEMVBFAdRHERxEMVBFAdRHMRwEMNBDAdxHMRxEMdBHAdxHCRwkMBBAgcJHCRwkMBBAgcJHCRwkMRBEgdJHCRxkMJBCgcpHKRwkMJBCgcpHKRwkMJBCgdpHKRxkMZBGgdpHKRxkMZBGgdpHKRxkMZBGgcZHGRwkMFBBgcZHGRwkMFBBgcZHGRwkMFBBgcZHGRwkMFBBgcZHGRwkMFBBgcZHGRwkMFBBgcZHGRwkMFBBgcZHGRxkMVBFgdZHGRxkMVBFgdZHGRxkMVBFgdZHGRxkMVBFgdZHGRxkMVBFgdZHGRxkMVBFgdZHGRxkMVBFgdZHGRxkMVBFgc5HORwkMNBDgc5HORwkMNBDgc5HORwkMNBDgc5HORwkMNBDgc5HORwkMNBDgc5HORwkMNBDgc5HORwkMNBDgc5HORwkMNBDgd5HORxkMdBHgd5HORxUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQcFHBRwUMBBAQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHBRxUMRBEQdFHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHJRwUMJBCQclHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRwUMFBBQcVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMVBFQdVHFRxUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBDQc1HNRwUMNBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBHQd1HNRxUMdBAwcNHDRw0MBBA') format('woff2');
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'IRANSans', Arial, sans-serif;
      background: white;
      padding: 20px;
      direction: rtl;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #ddd;
      padding: 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    
    .header h1 {
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .info-section {
      flex: 1;
    }
    
    .info-section h3 {
      color: #333;
      font-size: 16px;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    
    .info-section p {
      margin: 5px 0;
      color: #555;
      font-size: 14px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table th {
      background: #f5f5f5;
      padding: 15px;
      text-align: right;
      font-weight: bold;
      border: 1px solid #ddd;
      font-size: 14px;
    }
    
    .items-table td {
      padding: 12px 15px;
      border: 1px solid #ddd;
      font-size: 13px;
    }
    
    .items-table tr:nth-child(even) {
      background: #fafafa;
    }
    
    .total-section {
      text-align: left;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #333;
    }
    
    .total-section .total-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }
    
    .total-section .grand-total {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-unpaid {
      background: #ffebee;
      color: #c62828;
    }
    
    .status-paid {
      background: #e8f5e9;
      color: #2e7d32;
    }
    
    .status-partially_paid {
      background: #fff3e0;
      color: #ef6c00;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>فاکتور فروش</h1>
      <p>سرویس پروکسی پرسرعت</p>
    </div>
    
    <div class="invoice-info">
      <div class="info-section">
        <h3>اطلاعات نماینده</h3>
        <p><strong>نام فروشگاه:</strong> {{storeName}}</p>
        <p><strong>یوزرنیم پنل:</strong> {{panelUsername}}</p>
        {{#if representativeName}}
        <p><strong>نام نماینده:</strong> {{representativeName}}</p>
        {{/if}}
        {{#if salesColleagueName}}
        <p><strong>همکار فروش:</strong> {{salesColleagueName}}</p>
        {{/if}}
      </div>
      
      <div class="info-section">
        <h3>اطلاعات فاکتور</h3>
        <p><strong>شماره فاکتور:</strong> #{{invoiceId}}</p>
        <p><strong>تاریخ صدور:</strong> {{issueDate}}</p>
        <p><strong>وضعیت:</strong> <span class="status-badge status-{{status}}">{{statusText}}</span></p>
      </div>
    </div>
    
    {{#if hasLineItems}}
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">ردیف</th>
          <th>شرح</th>
          <th style="width: 150px;">مبلغ (تومان)</th>
          <th style="width: 180px;">تاریخ</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td style="text-align: center;">{{rowNumber}}</td>
          <td>{{description}}</td>
          <td style="text-align: left;">{{formattedAmount}}</td>
          <td>{{formattedDate}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    {{else}}
    <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; text-align: center;">
      <p style="font-size: 16px; color: #666;">{{description}}</p>
    </div>
    {{/if}}
    
    <div class="total-section">
      <div class="total-row">
        <span>جمع کل:</span>
        <span>{{totalAmount}} تومان</span>
      </div>
      {{#if previousDebt}}
      <div class="total-row">
        <span>بدهی قبلی:</span>
        <span>{{previousDebt}} تومان</span>
      </div>
      {{/if}}
      <div class="total-row grand-total">
        <span>مبلغ قابل پرداخت:</span>
        <span>{{grandTotal}} تومان</span>
      </div>
    </div>
    
    <div class="footer">
      <p>این فاکتور به صورت خودکار توسط سیستم مدیریت مالی تولید شده است</p>
      <p>در صورت هرگونه سوال با پشتیبانی تماس بگیرید</p>
    </div>
  </div>
</body>
</html>
`;

// Register Handlebars helpers
Handlebars.registerHelper('formatNumber', (num: number) => {
  return num.toLocaleString('fa-IR');
});

// Invoice data interface
interface InvoiceData {
  invoice: Invoice;
  representative: Representative;
  lineItems?: any[];
}

// Generate invoice HTML
function generateInvoiceHTML(data: InvoiceData): string {
  const { invoice, representative, lineItems } = data;
  
  // Parse line items from usageJsonDetails
  let parsedLineItems = [];
  if (invoice.usageJsonDetails) {
    try {
      parsedLineItems = typeof invoice.usageJsonDetails === 'string' 
        ? JSON.parse(invoice.usageJsonDetails)
        : invoice.usageJsonDetails;
    } catch (e) {
      console.error('Failed to parse usage details:', e);
    }
  }
  
  // Format line items for display
  const formattedLineItems = parsedLineItems.map((item, index) => ({
    rowNumber: index + 1,
    description: item.description || 'استفاده از سرویس',
    formattedAmount: parseFloat(item.amount).toLocaleString('fa-IR'),
    formattedDate: new Date(item.event_timestamp).toLocaleDateString('fa-IR')
  }));
  
  // Prepare template data
  const templateData = {
    // Representative info
    storeName: representative.storeName,
    panelUsername: representative.panelUsername,
    representativeName: representative.ownerName,
    salesColleagueName: representative.salesColleagueName,
    
    // Invoice info
    invoiceId: invoice.id,
    issueDate: new Date(invoice.issueDate).toLocaleDateString('fa-IR'),
    status: invoice.status,
    statusText: {
      'unpaid': 'پرداخت نشده',
      'paid': 'پرداخت شده',
      'partially_paid': 'پرداخت جزئی'
    }[invoice.status],
    
    // Financial info
    description: invoice.description,
    totalAmount: parseFloat(invoice.amount).toLocaleString('fa-IR'),
    grandTotal: parseFloat(invoice.amount).toLocaleString('fa-IR'),
    
    // Line items
    hasLineItems: formattedLineItems.length > 0,
    lineItems: formattedLineItems
  };
  
  // Compile and render template
  const template = Handlebars.compile(invoiceTemplate);
  return template(templateData);
}

// Generate invoice PNG
export async function generateInvoicePNG(invoiceId: number): Promise<Buffer | null> {
  try {
    // Fetch invoice data
    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return null;
    }
    
    // Fetch representative data
    const representative = await storage.getRepresentativeById(invoice.representativeId);
    if (!representative) {
      console.error('Representative not found:', invoice.representativeId);
      return null;
    }
    
    // Generate HTML
    const html = generateInvoiceHTML({ invoice, representative });
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 800,
      height: 1200,
      deviceScaleFactor: 2
    });
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true
    });
    
    await browser.close();
    
    return screenshot;
    
  } catch (error) {
    console.error('Error generating invoice PNG:', error);
    return null;
  }
}

// Generate multiple invoices
export async function generateMultipleInvoices(invoiceIds: number[]): Promise<Map<number, Buffer>> {
  const results = new Map<number, Buffer>();
  
  for (const invoiceId of invoiceIds) {
    const png = await generateInvoicePNG(invoiceId);
    if (png) {
      results.set(invoiceId, png);
    }
  }
  
  return results;
}