import { storage } from '../storage';
import { sendMessage } from '../telegram/bot';

// Admin authorization middleware for Telegram handlers
export async function requireAdmin(chatId: string): Promise<boolean> {
  try {
    const admin = await storage.getAdmin(chatId);
    if (!admin) {
      await sendMessage(chatId, `🚫 دسترسی مجاز نیست

شما مجاز به استفاده از این سیستم نیستید. لطفا با مدیر سیستم تماس بگیرید.

Access Denied: You are not authorized to use this system.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking admin authorization:', error);
    await sendMessage(chatId, '❌ خطا در بررسی مجوز دسترسی. لطفا دوباره تلاش کنید.');
    return false;
  }
}

// Super admin check for admin management commands
export async function requireSuperAdmin(chatId: string): Promise<boolean> {
  try {
    const admin = await storage.getAdmin(chatId);
    if (!admin || !admin.isSuperAdmin) {
      await sendMessage(chatId, `🚫 دسترسی محدود

این دستور فقط برای سوپر ادمین قابل اجرا است.

Restricted Access: This command is only available to super admins.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking super admin authorization:', error);
    await sendMessage(chatId, '❌ خطا در بررسی مجوز سوپر ادمین.');
    return false;
  }
}

// Decorator function for admin-required endpoints
export function adminRequired(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    // Extract chatId from the first argument (typically message or callback query)
    const chatId = args[0]?.chat?.id?.toString() || args[0]?.message?.chat?.id?.toString();
    
    if (!chatId) {
      console.error('Unable to extract chat ID from arguments');
      return;
    }

    // Check admin authorization
    const isAuthorized = await requireAdmin(chatId);
    if (!isAuthorized) {
      return; // Authorization failed, access denied message already sent
    }

    // If authorized, proceed with the original method
    return method.apply(this, args);
  };
}