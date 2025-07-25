# طرح جامع مرحله 5: بهبود سیستم فاکتورها

## 📋 هدف کلی
بهبود سیستم فاکتورها با قابلیت‌های پیشرفته نمایش، تولید، و تنظیمات

## 🎯 اهداف دقیق

### 1. نمایش ریز جزئیات فاکتور با تاریخ شمسی
**وضعیت فعلی**: 
- جدول `invoiceDetails` موجود است
- تابع `generatePersianDate()` پیاده‌سازی شده

**نیاز‌های پیاده‌سازی**:
- [ ] Component نمایش جزئیات فاکتور در پورتال نمایندگان
- [ ] نمایش تاریخ‌های شمسی در فرمت زیبا
- [ ] جزئیات کامل هر فاکتور (تاریخ، مبلغ، توضیحات)
- [ ] تاریخچه فاکتورها با فیلتر تاریخی

### 2. اتصال تنظیمات قالب فاکتور به تولید فاکتور
**وضعیت فعلی**:
- فیلد `invoiceTemplate` در تنظیمات موجود است
- سیستم تولید فاکتور PNG موجود است

**نیاز‌های پیاده‌سازی**:
- [ ] خواندن قالب از تنظیمات سیستم
- [ ] اعمال قالب به فاکتور PNG
- [ ] تست تولید فاکتور با قالب جدید
- [ ] نمایش پیش‌نمایش فاکتور

### 3. پیش‌نمایش فاکتور در تنظیمات  
**وضعیت فعلی**:
- صفحه Settings موجود است
- ویرایشگر قالب فاکتور موجود است

**نیاز‌های پیاده‌سازی**:
- [ ] کامپوننت پیش‌نمایش زنده
- [ ] تولید فاکتور نمونه
- [ ] نمایش تغییرات بلادرنگ
- [ ] دکمه ذخیره و تأیید قالب

## 📊 برنامه‌ریزی پیاده‌سازی

### مرحله 5.1: نمایش ریز جزئیات فاکتور
1. **InvoiceDetails Component**: نمایش جزئیات کامل
2. **Persian Calendar Integration**: تاریخ‌های شمسی زیبا
3. **Invoice History View**: تاریخچه و فیلتر
4. **Mobile Responsive**: سازگار با موبایل

### مرحله 5.2: اتصال قالب به تولید فاکتور
1. **Template Engine**: خواندن قالب از تنظیمات
2. **Invoice Generator Enhancement**: اعمال قالب
3. **PNG Generation Update**: تولید با قالب جدید
4. **API Integration**: اتصال کامل سرویس‌ها

### مرحله 5.3: پیش‌نمایش در تنظیمات
1. **Live Preview Component**: پیش‌نمایش زنده
2. **Sample Invoice Generator**: تولید فاکتور نمونه
3. **Template Validation**: اعتبارسنجی قالب
4. **Save & Apply**: ذخیره و اعمال تغییرات

## 🔧 جزئیات فنی

### Database Schema
```typescript
// جدول invoiceDetails (موجود)
{
  id: number,
  invoiceId: number,
  persianDate: string,
  persianMonth: string, 
  persianYear: string,
  description: string,
  notes: string
}

// جدول systemSettings (موجود)
{
  invoiceTemplate: string, // HTML/CSS template
  representativePortalTexts: string
}
```

### API Endpoints مورد نیاز
- `GET /api/invoices/:id/details` ✅ (موجود)
- `POST /api/invoices/:id/details` ✅ (موجود)
- `POST /api/invoices/:id/preview` ❌ (جدید)
- `GET /api/settings/invoice-template` ❌ (جدید)
- `POST /api/settings/invoice-template` ❌ (جدید)

### Frontend Components مورد نیاز
- `InvoiceDetailsView.tsx` ❌ (جدید)
- `InvoicePreview.tsx` ❌ (جدید)
- `TemplateEditor.tsx` ❌ (بهبود موجود)
- `PersianCalendar.tsx` ❌ (جدید)

## ✅ معیارهای تکمیل

### مرحله 5.1
- [x] فاکتور تست ایجاد شده ✅
- [x] جزئیات فاکتور با تاریخ شمسی نمایش داده شود ✅
- [x] InvoiceDetailsView component ایجاد شد ✅
- [x] Persian date conversion درست کار می‌کند ✅
- [x] Modal نمایش جزئیات در RepresentativePortal ✅
- [ ] تاریخچه فاکتورها قابل مشاهده باشد (در حال پیاده‌سازی)
- [ ] فیلترهای تاریخی کار کند

### مرحله 5.2  
- [ ] قالب از تنظیمات خوانده شود
- [ ] فاکتور PNG با قالب جدید تولید شود
- [ ] تست کامل تولید فاکتور
- [ ] خطاهای قالب مدیریت شود

### مرحله 5.3
- [ ] پیش‌نمایش زنده کار کند
- [ ] فاکتور نمونه تولید شود
- [ ] ذخیره قالب بدون خطا
- [ ] تغییرات فوری اعمال شود

## 🧪 استراتژی تست

### Unit Tests
- تست تولید تاریخ شمسی
- تست خواندن قالب از تنظیمات
- تست تولید فاکتور PNG

### Integration Tests  
- تست کامل فرآیند تولید فاکتور
- تست ذخیره و بازیابی قالب
- تست نمایش جزئیات در پورتال

### User Experience Tests
- تست واکنش‌گرایی موبایل
- تست سرعت بارگذاری پیش‌نمایش
- تست وضوح و کیفیت فاکتور PNG

---

**شروع پیاده‌سازی**: آماده شروع مرحله 5.1
**زمان برآورد شده**: 45-60 دقیقه برای تکمیل کامل
**اولویت**: بالا - بخش کلیدی سیستم مالی