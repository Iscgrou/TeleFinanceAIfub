import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Phone, Video, Paperclip, Mic, Send, Settings, BarChart } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  isProcessing?: boolean;
}

export default function TelegramInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '🤖 سلام! من دستیار مالی هوشمند شما هستم. برای شروع از دستور /start استفاده کنید.',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (content: string, isVoice = false) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      isVoice
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot processing
    setTimeout(() => {
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'در حال پردازش...',
        timestamp: new Date(),
        isProcessing: true
      };
      setMessages(prev => [...prev, processingMessage]);

      // Simulate bot response
      setTimeout(() => {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isProcessing);
          let botResponse = '';

          if (content === '/start') {
            botResponse = `✅ شما به عنوان ادمین تایید شدید.

برای مدیریت سیستم می‌توانید از دستورات زیر استفاده کنید:`;
          } else if (content.includes('بدهی')) {
            botResponse = '💰 گزارش مالی در حال تهیه...';
          } else if (content.includes('فاکتور')) {
            botResponse = '✅ فاکتور دستی با موفقیت صادر شد.\n📄 شماره فاکتور: INV-2024-001';
          } else {
            botResponse = '🤔 متوجه درخواست شما نشدم. لطفا روشن‌تر بیان کنید یا از منوی زیر استفاده کنید.';
          }

          const response: Message = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: botResponse,
            timestamp: new Date()
          };

          return [...filtered, response];
        });
      }, 1500);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simulate voice recording
      setTimeout(() => {
        setIsRecording(false);
        sendMessage("برای فروشگاه آلفا یه فاکتور دستی به مبلغ هفتاد هزار تومان صادر کن", true);
      }, 3000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800">
      {/* Navigation */}
      <div className="bg-white/10 p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <BarChart className="h-4 w-4 ml-2" />
                داشبورد
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="h-4 w-4 ml-2" />
                تنظیمات
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Telegram Header */}
        <div className="bg-blue-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Bot className="text-blue-600 h-6 w-6" />
            </div>
            <div className="flex-1 text-right">
              <h2 className="font-semibold">دستیار مالی هوشمند</h2>
              <p className="text-sm opacity-90">آنلاین</p>
            </div>
            <Phone className="text-white/75 h-5 w-5" />
            <Video className="text-white/75 h-5 w-5" />
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-4 shadow-sm`}>
                {message.isVoice && message.type === 'user' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-4 w-4" />
                    <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-white rounded-full"></div>
                    </div>
                    <span className="text-xs">0:03</span>
                  </div>
                )}
                
                {message.isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm">{message.content}</span>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-line text-right" dir="rtl">
                    {message.content}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/75' : 'text-gray-500'} text-right`}>
                  {formatTime(message.timestamp)}
                </div>

                {message.content.includes('تایید شدید') && (
                  <div className="mt-3 space-y-2">
                    <Link href="/dashboard">
                      <Button size="sm" variant="secondary" className="w-full text-xs">
                        📊 داشبورد
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button size="sm" variant="secondary" className="w-full text-xs">
                        ⚙️ تنظیمات
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" className="w-full text-xs">
                      📄 صدور فاکتور هفتگی
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="bg-white p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="پیام شما..."
                className="text-right"
                dir="rtl"
              />
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className={`${isRecording ? 'text-red-500' : 'text-gray-400'} hover:text-gray-600`}
              onClick={handleVoiceRecord}
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {isRecording && (
            <div className="mt-2 text-center">
              <Badge variant="destructive" className="animate-pulse">
                🔴 در حال ضبط صدا...
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
