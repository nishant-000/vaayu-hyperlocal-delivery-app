import { Platform } from 'react-native';
import { supabase } from './supabase';

let Notifications: any = null;
try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  // Silent fallback when notifications module is unavailable in web/simulator
}

export async function checkNotificationPermissionStatus() {
  if (Platform.OS === 'web' || !Notifications) return 'granted';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'granted';
  }
}

export async function registerForPushNotifications(userId: string | null, role: 'customer' | 'shop_owner' | 'worker') {
  if (Platform.OS === 'web' || !Notifications) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Safely attempt token retrieval
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);

    const token = tokenData?.data;
    if (!token) return null;

    // Upsert into Supabase push_tokens table
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId || null,
        token: token,
        role: role,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    return token;
  } catch {
    return null;
  }
}

export function setupNotificationListeners(onSelectOrder: (orderId: string) => void) {
  if (Platform.OS === 'web' || !Notifications) return () => {};

  try {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data && data.orderId) {
        onSelectOrder(data.orderId);
      }
    });

    return () => {
      try {
        responseSubscription.remove();
      } catch {}
    };
  } catch {
    return () => {};
  }
}
