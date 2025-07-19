import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertInvoiceTemplateSchema, type InvoiceTemplate, type InsertInvoiceTemplate } from '@shared/schema';

export default function InvoiceTemplatesPage() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch invoice templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/invoice-templates'],
    queryFn: () => apiRequest('/api/invoice-templates')
  });

  const templates = templatesData?.templates || [];

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertInvoiceTemplate) => apiRequest('/api/invoice-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-templates'] });
      setIsCreating(false);
      toast({
        title: 'Success',
        description: 'Invoice template created successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
    }
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertInvoiceTemplate> }) => 
      apiRequest(`/api/invoice-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-templates'] });
      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Template updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
    }
  });

  // Activate template mutation
  const activateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/invoice-templates/${id}/activate`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-templates'] });
      toast({
        title: 'Success',
        description: 'Template activated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to activate template',
        variant: 'destructive'
      });
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/invoice-templates/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-templates'] });
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  });

  // Template form component
  function TemplateForm({ 
    template, 
    onSubmit, 
    onCancel, 
    isSubmitting 
  }: { 
    template?: InvoiceTemplate; 
    onSubmit: (data: InsertInvoiceTemplate) => void;
    onCancel: () => void;
    isSubmitting: boolean;
  }) {
    const form = useForm<InsertInvoiceTemplate>({
      resolver: zodResolver(insertInvoiceTemplateSchema),
      defaultValues: template ? {
        name: template.name,
        headerTitle: template.headerTitle,
        headerSubtitle: template.headerSubtitle,
        footerText: template.footerText,
        footerContact: template.footerContact,
        representativeLabel: template.representativeLabel,
        invoiceLabel: template.invoiceLabel,
        lineItemLabel: template.lineItemLabel,
        totalLabel: template.totalLabel,
        payableLabel: template.payableLabel,
        isActive: template.isActive
      } : {
        name: '',
        headerTitle: 'فاکتور فروش',
        headerSubtitle: 'سرویس پروکسی پرسرعت',
        footerText: 'این فاکتور به صورت خودکار توسط سیستم مدیریت مالی تولید شده است',
        footerContact: 'در صورت هرگونه سوال با پشتیبانی تماس بگیرید',
        representativeLabel: 'اطلاعات نماینده',
        invoiceLabel: 'اطلاعات فاکتور',
        lineItemLabel: 'شرح خدمات',
        totalLabel: 'جمع کل',
        payableLabel: 'مبلغ قابل پرداخت',
        isActive: false
      }
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="Default Template" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="headerTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Header Title</FormLabel>
                  <FormControl>
                    <Input placeholder="فاکتور فروش" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="headerSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Header Subtitle</FormLabel>
                  <FormControl>
                    <Input placeholder="سرویس پروکسی پرسرعت" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="representativeLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Representative Section Label</FormLabel>
                  <FormControl>
                    <Input placeholder="اطلاعات نماینده" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Section Label</FormLabel>
                  <FormControl>
                    <Input placeholder="اطلاعات فاکتور" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="lineItemLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Line Items Label</FormLabel>
                  <FormControl>
                    <Input placeholder="شرح خدمات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Label</FormLabel>
                  <FormControl>
                    <Input placeholder="جمع کل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payableLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payable Label</FormLabel>
                  <FormControl>
                    <Input placeholder="مبلغ قابل پرداخت" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="footerText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Text</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="این فاکتور به صورت خودکار توسط سیستم مدیریت مالی تولید شده است" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="footerContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Contact</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="در صورت هرگونه سوال با پشتیبانی تماس بگیرید" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Template</FormLabel>
                  <FormLabel className="text-sm text-muted-foreground">
                    Set this as the active template for invoice generation
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : template ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Templates</h1>
          <p className="text-muted-foreground">
            Customize invoice text labels and formatting
          </p>
        </div>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice Template</DialogTitle>
              <DialogDescription>
                Create a new invoice template with custom labels and text
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreating(false)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {templates.map((template: InvoiceTemplate) => (
          <Card key={template.id} className={template.isActive ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.isActive && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!template.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activateMutation.mutate(template.id)}
                      disabled={activateMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(template.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === template.id ? (
                <TemplateForm
                  template={template}
                  onSubmit={(data) => updateMutation.mutate({ id: template.id, data })}
                  onCancel={() => setEditingId(null)}
                  isSubmitting={updateMutation.isPending}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-semibold">Header Title:</Label>
                    <p className="text-muted-foreground">{template.headerTitle}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Header Subtitle:</Label>
                    <p className="text-muted-foreground">{template.headerSubtitle}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Representative Label:</Label>
                    <p className="text-muted-foreground">{template.representativeLabel}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Invoice Label:</Label>
                    <p className="text-muted-foreground">{template.invoiceLabel}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Line Items Label:</Label>
                    <p className="text-muted-foreground">{template.lineItemLabel}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Total Label:</Label>
                    <p className="text-muted-foreground">{template.totalLabel}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="font-semibold">Footer Text:</Label>
                    <p className="text-muted-foreground">{template.footerText}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No invoice templates found</p>
              <Button 
                className="mt-4" 
                onClick={() => setIsCreating(true)}
              >
                Create your first template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}