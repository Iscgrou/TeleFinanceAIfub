import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Clock, Send, Users, TrendingUp, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';

interface ReminderRule {
  id: number;
  name: string;
  triggerConditions: {
    debtAmountMin?: number;
    debtAmountMax?: number;
    daysOverdue?: number;
    lastPaymentDays?: number;
    riskScore?: number;
  };
  schedulePattern: string;
  channels: string[];
  templateId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplate {
  id: number;
  name: string;
  language: string;
  channel: string;
  subject?: string;
  content: string;
  variables: any;
  createdAt: string;
  updatedAt: string;
}

interface ReminderLog {
  id: number;
  representativeId: number;
  ruleId: number;
  channel: string;
  messageContent: string;
  sentAt: string;
  deliveryStatus: string;
  responseReceived: boolean;
  responseContent?: string;
  nextReminderAt?: string;
}

interface ReminderAnalytics {
  totalSent: number;
  successRate: number;
  channelBreakdown: Record<string, number>;
  responseRate: number;
}

export default function RemindersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Fetch reminder rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/reminders/rules'],
    queryFn: async () => {
      const response = await fetch('/api/reminders/rules');
      const result = await response.json();
      return result.data as ReminderRule[];
    }
  });

  // Fetch message templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/reminders/templates'],
    queryFn: async () => {
      const response = await fetch('/api/reminders/templates');
      const result = await response.json();
      return result.data as MessageTemplate[];
    }
  });

  // Fetch reminder logs with analytics
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/reminders/logs', selectedTimeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const response = await fetch(`/api/reminders/logs?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      const result = await response.json();
      return {
        logs: result.data as ReminderLog[],
        analytics: result.analytics as ReminderAnalytics
      };
    }
  });

  // Create reminder rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const response = await fetch('/api/reminders/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      if (!response.ok) throw new Error('Failed to create rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/rules'] });
      setIsCreateRuleOpen(false);
      toast({ title: 'Reminder rule created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create rule', variant: 'destructive' });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await fetch('/api/reminders/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/templates'] });
      setIsCreateTemplateOpen(false);
      toast({ title: 'Message template created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    }
  });

  // Toggle rule activation mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/reminders/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/rules'] });
      toast({ title: 'Rule updated successfully' });
    }
  });

  const formatCronDescription = (pattern: string) => {
    // Simple cron pattern descriptions
    const patterns: Record<string, string> = {
      '0 9 * * 1': 'Every Monday at 9:00 AM',
      '0 9 * * *': 'Every day at 9:00 AM',
      '0 10 1 * *': 'First day of month at 10:00 AM',
      '0 8 * * 1,3,5': 'Mon, Wed, Fri at 8:00 AM'
    };
    return patterns[pattern] || pattern;
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case 'telegram': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Reminders</h1>
          <p className="text-gray-600">Automated payment reminder system management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Message Template</DialogTitle>
                <DialogDescription>
                  Create a new message template for automated reminders
                </DialogDescription>
              </DialogHeader>
              <CreateTemplateForm 
                onSubmit={(data) => createTemplateMutation.mutate(data)}
                isLoading={createTemplateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Reminder Rule</DialogTitle>
                <DialogDescription>
                  Set up automated payment reminder rules with custom triggers and schedules
                </DialogDescription>
              </DialogHeader>
              <CreateRuleForm 
                templates={templatesData || []}
                onSubmit={(data) => createRuleMutation.mutate(data)}
                isLoading={createRuleMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsData?.analytics.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Past {selectedTimeRange}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((logsData?.analytics.successRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((logsData?.analytics.responseRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Representative responses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rulesData?.filter(r => r.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {rulesData?.length || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Reminder Rules</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rulesLoading ? (
            <div className="text-center py-8">Loading reminder rules...</div>
          ) : (
            <div className="grid gap-4">
              {rulesData?.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {rule.name}
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {formatCronDescription(rule.schedulePattern)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => 
                            toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Trigger Conditions</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {rule.triggerConditions.debtAmountMin && (
                            <Badge variant="outline">
                              Debt ≥ {rule.triggerConditions.debtAmountMin.toLocaleString()} T
                            </Badge>
                          )}
                          {rule.triggerConditions.daysOverdue && (
                            <Badge variant="outline">
                              {rule.triggerConditions.daysOverdue}+ days overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Channels</Label>
                        <div className="flex gap-2 mt-1">
                          {rule.channels.map((channel) => (
                            <Badge key={channel} className={getChannelBadgeColor(channel)}>
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templatesLoading ? (
            <div className="text-center py-8">Loading message templates...</div>
          ) : (
            <div className="grid gap-4">
              {templatesData?.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      <Badge className={getChannelBadgeColor(template.channel)}>
                        {template.channel}
                      </Badge>
                      <Badge variant="outline">{template.language}</Badge>
                    </CardTitle>
                    {template.subject && (
                      <CardDescription>Subject: {template.subject}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {template.content.length > 200 
                          ? template.content.substring(0, 200) + '...'
                          : template.content
                        }
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Delivery Logs</h3>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {logsLoading ? (
            <div className="text-center py-8">Loading delivery logs...</div>
          ) : (
            <div className="space-y-3">
              {logsData?.logs.slice(0, 20).map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getChannelBadgeColor(log.channel)}>
                            {log.channel}
                          </Badge>
                          <Badge variant={log.deliveryStatus === 'sent' ? 'default' : 'destructive'}>
                            {log.deliveryStatus}
                          </Badge>
                          {log.responseReceived && (
                            <Badge variant="outline">Responded</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Rep ID: {log.representativeId} • {new Date(log.sentAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(logsData?.analytics.channelBreakdown || {}).map(([channel, count]) => (
                    <div key={channel} className="flex justify-between items-center">
                      <Badge className={getChannelBadgeColor(channel)}>{channel}</Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Rules:</span>
                    <span className="font-semibold">{rulesData?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Rules:</span>
                    <span className="font-semibold text-green-600">
                      {rulesData?.filter(r => r.isActive).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Templates:</span>
                    <span className="font-semibold">{templatesData?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create Rule Form Component
function CreateRuleForm({ 
  templates, 
  onSubmit, 
  isLoading 
}: { 
  templates: MessageTemplate[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    debtAmountMin: '',
    daysOverdue: '',
    schedulePattern: '0 9 * * 1',
    channels: [] as string[],
    templateId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      triggerConditions: {
        debtAmountMin: formData.debtAmountMin ? parseInt(formData.debtAmountMin) : undefined,
        daysOverdue: formData.daysOverdue ? parseInt(formData.daysOverdue) : undefined
      },
      schedulePattern: formData.schedulePattern,
      channels: formData.channels,
      templateId: formData.templateId ? parseInt(formData.templateId) : undefined
    });
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Weekly High Debt Reminder"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="debtAmountMin">Minimum Debt (Toman)</Label>
          <Input
            id="debtAmountMin"
            type="number"
            value={formData.debtAmountMin}
            onChange={(e) => setFormData(prev => ({ ...prev, debtAmountMin: e.target.value }))}
            placeholder="100000"
          />
        </div>
        <div>
          <Label htmlFor="daysOverdue">Days Overdue</Label>
          <Input
            id="daysOverdue"
            type="number"
            value={formData.daysOverdue}
            onChange={(e) => setFormData(prev => ({ ...prev, daysOverdue: e.target.value }))}
            placeholder="7"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="schedule">Schedule Pattern</Label>
        <Select value={formData.schedulePattern} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, schedulePattern: value }))
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0 9 * * 1">Weekly (Monday 9 AM)</SelectItem>
            <SelectItem value="0 9 * * *">Daily (9 AM)</SelectItem>
            <SelectItem value="0 10 1 * *">Monthly (1st day 10 AM)</SelectItem>
            <SelectItem value="0 8 * * 1,3,5">Mon/Wed/Fri (8 AM)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Channels</Label>
        <div className="flex gap-2 mt-2">
          {['telegram', 'sms', 'email'].map(channel => (
            <Button
              key={channel}
              type="button"
              variant={formData.channels.includes(channel) ? 'default' : 'outline'}
              onClick={() => toggleChannel(channel)}
              size="sm"
            >
              {channel}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="template">Message Template</Label>
        <Select value={formData.templateId} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, templateId: value }))
        }>
          <SelectTrigger>
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name} ({template.channel})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Rule'}
      </Button>
    </form>
  );
}

// Create Template Form Component
function CreateTemplateForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    language: 'fa',
    channel: 'telegram',
    subject: '',
    content: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      variables: {
        representativeName: { type: 'string' },
        storeName: { type: 'string' },
        debtAmount: { type: 'currency' },
        daysOverdue: { type: 'number' },
        panelUsername: { type: 'string' }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Gentle Payment Reminder"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={formData.language} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, language: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fa">Persian (فارسی)</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="channel">Channel</Label>
          <Select value={formData.channel} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, channel: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.channel === 'email' && (
        <div>
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Payment Reminder - {{storeName}}"
          />
        </div>
      )}

      <div>
        <Label htmlFor="content">Message Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Hello {{representativeName}}, your debt amount is {{debtAmount}}..."
          rows={6}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Available variables: representativeName, storeName, debtAmount, daysOverdue, panelUsername
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Template'}
      </Button>
    </form>
  );
}