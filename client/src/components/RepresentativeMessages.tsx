import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  MessageCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  CheckCircle, 
  Bell,
  Calendar
} from 'lucide-react';

interface RepresentativeMessage {
  id: number;
  subject?: string;
  message: string;
  messageType: 'info' | 'warning' | 'urgent' | 'payment_reminder';
  senderType: 'admin' | 'system';
  senderName: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface Props {
  representativeId: number;
  representativeName?: string;
}

const RepresentativeMessages: React.FC<Props> = ({ 
  representativeId, 
  representativeName = 'نماینده' 
}) => {
  const [messages, setMessages] = useState<RepresentativeMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'payment_reminder':
        return <Bell className="h-5 w-5 text-blue-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-green-600" />;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'فوری';
      case 'warning':
        return 'هشدار';
      case 'payment_reminder':
        return 'یادآوری پرداخت';
      case 'info':
      default:
        return 'اطلاعات';
    }
  };

  const getMessageVariant = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'payment_reminder':
        return 'default' as const;
      case 'info':
      default:
        return 'outline' as const;
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/representatives/${representativeId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/representatives/${representativeId}/unread-messages-count`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "پیام خوانده شد",
          description: "پیام به عنوان خوانده شده علامت‌گذاری شد",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast({
        title: "خطا",
        description: "خطا در علامت‌گذاری پیام",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [representativeId]);

  const formatPersianDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            پیام‌های سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            پیام‌های سیستم
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount} پیام جدید
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          پیام‌ها و اطلاعیه‌های مربوط به {representativeName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>هیچ پیامی برای نمایش وجود ندارد</p>
          </div>
        ) : (
          messages.map((message) => (
            <Card 
              key={message.id} 
              className={`relative ${!message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getMessageIcon(message.messageType)}
                    <Badge variant={getMessageVariant(message.messageType)}>
                      {getMessageTypeLabel(message.messageType)}
                    </Badge>
                    {!message.isRead && (
                      <Badge variant="secondary" className="text-xs">
                        جدید
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatPersianDate(message.createdAt)}
                  </div>
                </div>
                
                {message.subject && (
                  <CardTitle className="text-base">{message.subject}</CardTitle>
                )}
                
                <CardDescription className="text-xs flex items-center gap-1">
                  از: {message.senderName}
                  {message.isRead && message.readAt && (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                      خوانده شده در {formatPersianDate(message.readAt)}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.message}
                </div>
                
                {!message.isRead && (
                  <div className="mt-3 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAsRead(message.id)}
                      className="text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      علامت‌گذاری به عنوان خوانده شده
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RepresentativeMessages;