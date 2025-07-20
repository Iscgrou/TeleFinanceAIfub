import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye,
  Download,
  RefreshCw,
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Props {
  invoiceId?: number;
  templateData?: any;
  showDownloadButton?: boolean;
}

const InvoicePreview: React.FC<Props> = ({ 
  invoiceId = 1211, 
  templateData = null,
  showDownloadButton = true 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    generatePreview();
  }, [invoiceId, templateData]);

  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If templateData is provided, save it first
      if (templateData) {
        const saveResponse = await fetch('/api/settings/invoice-template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ invoiceTemplate: templateData })
        });

        if (!saveResponse.ok) {
          throw new Error('خطا در ذخیره قالب');
        }
      }

      // Generate preview
      const response = await fetch(`/api/invoices/${invoiceId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Clean up previous URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        setPreviewUrl(url);
        setLastGenerated(new Date());
        
        toast({
          title: "موفق",
          description: "پیش‌نمایش فاکتور با موفقیت تولید شد",
          variant: "default"
        });
      } else {
        throw new Error('خطا در تولید پیش‌نمایش');
      }
    } catch (error: any) {
      console.error('Error generating preview:', error);
      setError(error.message || 'خطا در تولید پیش‌نمایش');
      toast({
        title: "خطا",
        description: "خطا در تولید پیش‌نمایش فاکتور",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPreview = () => {
    if (!previewUrl) return;
    
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `invoice-${invoiceId}-preview.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "دانلود شد",
      description: "فاکتور با موفقیت دانلود شد",
      variant: "default"
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                پیش‌نمایش فاکتور
              </CardTitle>
              <CardDescription>
                فاکتور #{invoiceId}
                {lastGenerated && (
                  <span className="mr-2 text-green-600">
                    • آخرین بروزرسانی: {formatTime(lastGenerated)}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generatePreview}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              بروزرسانی
            </Button>
            {showDownloadButton && previewUrl && (
              <Button 
                size="sm" 
                onClick={downloadPreview}
              >
                <Download className="h-4 w-4 mr-2" />
                دانلود PNG
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">در حال تولید پیش‌نمایش...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">خطا در تولید پیش‌نمایش</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generatePreview} variant="outline">
              تلاش مجدد
            </Button>
          </div>
        )}

        {previewUrl && !isLoading && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                پیش‌نمایش آماده
              </Badge>
              <div className="text-sm text-gray-500">
                <FileImage className="h-4 w-4 inline mr-1" />
                فرمت: PNG • کیفیت: بالا
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <img 
                src={previewUrl} 
                alt={`پیش‌نمایش فاکتور ${invoiceId}`}
                className="w-full h-auto max-w-full"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>شناسه فاکتور:</strong> #{invoiceId}
              </div>
              <div>
                <strong>تاریخ تولید:</strong> {lastGenerated ? formatTime(lastGenerated) : 'نامشخص'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;