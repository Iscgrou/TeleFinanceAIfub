import { storage } from '../storage';
import { Invoice, Representative, InvoiceTemplate } from '@shared/schema';

// Generate invoice as SVG
export async function generateInvoiceSVG(invoiceId: number): Promise<string | null> {
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
    
    // Get active template
    let template = await storage.getActiveInvoiceTemplate();
    if (!template) {
      template = {
        id: 0,
        name: 'Default',
        headerTitle: 'فاکتور فروش',
        headerSubtitle: 'سرویس پروکسی پرسرعت',
        footerText: 'این فاکتور به صورت خودکار توسط سیستم مدیریت مالی تولید شده است',
        footerContact: 'در صورت هرگونه سوال با پشتیبانی تماس بگیرید',
        representativeLabel: 'اطلاعات نماینده',
        invoiceLabel: 'اطلاعات فاکتور',
        lineItemLabel: 'شرح خدمات',
        totalLabel: 'جمع کل',
        payableLabel: 'مبلغ قابل پرداخت',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
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
    
    // Format amounts
    const totalAmount = parseFloat(invoice.amount).toLocaleString('fa-IR');
    const statusText = {
      'unpaid': 'پرداخت نشده',
      'paid': 'پرداخت شده',
      'partially_paid': 'پرداخت جزئی'
    }[invoice.status];
    
    const issueDate = new Date(invoice.issueDate).toLocaleDateString('fa-IR');
    
    // Generate SVG
    const svgContent = `
<svg width="800" height="1200" xmlns="http://www.w3.org/2000/svg" direction="rtl">
  <defs>
    <style>
      .persian-text { font-family: 'Tahoma', Arial, sans-serif; direction: rtl; text-anchor: end; }
      .header-title { font-size: 28px; font-weight: bold; fill: #333; }
      .header-subtitle { font-size: 14px; fill: #666; }
      .section-title { font-size: 16px; font-weight: bold; fill: #333; }
      .label { font-size: 12px; fill: #333; font-weight: bold; }
      .value { font-size: 12px; fill: #333; }
      .footer-text { font-size: 10px; fill: #666; text-anchor: middle; }
      .total-amount { font-size: 16px; font-weight: bold; fill: #333; }
      .status-unpaid { fill: #dc3545; }
      .status-paid { fill: #28a745; }
      .status-partially_paid { fill: #ffc107; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="1200" fill="white" stroke="#ddd" stroke-width="1"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="800" height="100" fill="#f8f9fa" stroke="#ddd" stroke-width="1"/>
  <text x="400" y="35" class="persian-text header-title" text-anchor="middle">${template.headerTitle}</text>
  <text x="400" y="55" class="persian-text header-subtitle" text-anchor="middle">${template.headerSubtitle}</text>
  <line x1="50" y1="80" x2="750" y2="80" stroke="#333" stroke-width="2"/>
  
  <!-- Representative Info -->
  <text x="750" y="130" class="persian-text section-title">${template.representativeLabel}</text>
  <text x="750" y="150" class="persian-text label">نام فروشگاه:</text>
  <text x="550" y="150" class="persian-text value">${representative.storeName || 'نامشخص'}</text>
  <text x="750" y="170" class="persian-text label">نام مالک:</text>
  <text x="550" y="170" class="persian-text value">${representative.ownerName || 'نامشخص'}</text>
  <text x="750" y="190" class="persian-text label">نام کاربری پنل:</text>
  <text x="550" y="190" class="persian-text value">${representative.panelUsername || 'نامشخص'}</text>
  
  <!-- Invoice Info -->
  <text x="350" y="130" class="persian-text section-title">${template.invoiceLabel}</text>
  <text x="350" y="150" class="persian-text label">شماره فاکتور:</text>
  <text x="200" y="150" class="persian-text value">#${invoice.id}</text>
  <text x="350" y="170" class="persian-text label">تاریخ صدور:</text>
  <text x="200" y="170" class="persian-text value">${issueDate}</text>
  <text x="350" y="190" class="persian-text label">وضعیت:</text>
  <text x="200" y="190" class="persian-text value status-${invoice.status}">${statusText}</text>
  
  <!-- Line Items Section -->
  ${formattedLineItems.length > 0 ? `
  <rect x="50" y="220" width="700" height="30" fill="#f8f9fa" stroke="#ddd" stroke-width="1"/>
  <text x="750" y="240" class="persian-text label">ردیف</text>
  <text x="600" y="240" class="persian-text label">${template.lineItemLabel}</text>
  <text x="300" y="240" class="persian-text label">مبلغ (تومان)</text>
  <text x="150" y="240" class="persian-text label">تاریخ</text>
  
  ${formattedLineItems.map((item, index) => `
  <rect x="50" y="${260 + index * 25}" width="700" height="25" fill="${index % 2 === 0 ? 'white' : '#f8f9fa'}" stroke="#ddd" stroke-width="1"/>
  <text x="750" y="${275 + index * 25}" class="persian-text value" text-anchor="middle">${item.rowNumber}</text>
  <text x="600" y="${275 + index * 25}" class="persian-text value">${item.description}</text>
  <text x="300" y="${275 + index * 25}" class="persian-text value">${item.formattedAmount}</text>
  <text x="150" y="${275 + index * 25}" class="persian-text value">${item.formattedDate}</text>
  `).join('')}
  ` : `
  <rect x="50" y="230" width="700" height="80" fill="#f9f9f9" stroke="#ddd" stroke-width="1"/>
  <text x="400" y="275" class="persian-text value" text-anchor="middle">${invoice.description || 'استفاده از سرویس پروکسی'}</text>
  `}
  
  <!-- Total Section -->
  <rect x="450" y="${formattedLineItems.length > 0 ? 280 + formattedLineItems.length * 25 : 330}" width="300" height="60" fill="#f8f9fa" stroke="#333" stroke-width="2"/>
  <text x="730" y="${formattedLineItems.length > 0 ? 300 + formattedLineItems.length * 25 : 350}" class="persian-text label">${template.totalLabel}:</text>
  <text x="730" y="${formattedLineItems.length > 0 ? 320 + formattedLineItems.length * 25 : 370}" class="persian-text total-amount">${totalAmount} تومان</text>
  
  <!-- Footer -->
  <text x="400" y="${formattedLineItems.length > 0 ? 380 + formattedLineItems.length * 25 : 430}" class="persian-text footer-text">${template.footerText}</text>
  <text x="400" y="${formattedLineItems.length > 0 ? 400 + formattedLineItems.length * 25 : 450}" class="persian-text footer-text">${template.footerContact}</text>
</svg>`;
    
    return svgContent;
    
  } catch (error) {
    console.error('Error generating invoice SVG:', error);
    return null;
  }
}

// Convert SVG to PNG buffer using Canvas (fallback implementation)
export async function svgToPng(svgContent: string): Promise<Buffer | null> {
  try {
    // For now, return the SVG as a buffer - we'll need a different conversion method
    // This is a simple fallback that returns SVG content
    return Buffer.from(svgContent, 'utf8');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    return null;
  }
}

// Main function that tries Puppeteer first, falls back to SVG
export async function generateInvoiceImage(invoiceId: number): Promise<Buffer | null> {
  try {
    // Try the original Puppeteer method first
    const { generateInvoicePNG } = await import('./invoice-generator');
    const pngBuffer = await generateInvoicePNG(invoiceId);
    if (pngBuffer) {
      return pngBuffer;
    }
  } catch (error) {
    console.log('Puppeteer failed, falling back to SVG generator');
  }
  
  // Fallback to SVG
  const svgContent = await generateInvoiceSVG(invoiceId);
  if (svgContent) {
    return svgToPng(svgContent);
  }
  
  return null;
}