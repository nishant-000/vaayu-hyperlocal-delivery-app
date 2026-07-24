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
} catch (e) {
  console.log('[Notifications] Native notifications module not available in this environment.');
}

export async function checkNotificationPermissionStatus() {
  if (Platform.OS === 'web' || !Notifications) return 'granted';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (err) {
    console.log('[Notifications] Could not fetch permissions status:', err);
    return 'granted';
  }
}

export async function registerForPushNotifications(userId: string | null, role: 'customer' | 'shop_owner' | 'worker') {
  if (Platform.OS === 'web' || !Notifications) {
    console.log('[Notifications] Skipping push registration (web or module unavailable).');
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
      console.log('[Notifications] Push permission not granted.');
      return null;
    }

    // Safely attempt token retrieval
    const tokenData = await Notifications.getExpoPushTokenAsync().catch((err: any) => {
      console.log('[Notifications] Expo push token fetch failed:', err?.message || err);
      return null;
    });

    const token = tokenData?.data;

    if (!token) {
      console.log('[Notifications] Unable to retrieve Expo push token.');
      return null;
    }

    console.log('[Notifications] Expo Push Token acquired:', token);

    // Upsert into Supabase push_tokens table
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId || null,
        token: token,
        role: role,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    if (error) {
      console.error('[Notifications] Failed to upsert push token to Supabase:', error);
    } else {
      console.log('[Notifications] Push token saved to Supabase successfully!');
    }

    return token;
  } catch (err) {
    console.error('[Notifications] Error registering push notifications:', err);
    return null;
  }
}

export function setupNotificationListeners(onSelectOrder: (orderId: string) => void) {
  if (Platform.OS === 'web' || !Notifications) return () => {};

  try {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      console.log('[Notifications] Notification tapped with data:', data);

      if (data && data.orderId) {
        onSelectOrder(data.orderId);
      }
    });

    return () => {
      try {
        responseSubscription.remove();
      } catch {}
    };
  } catch (err) {
    console.log('[Notifications] Unable to set up notification response listener:', err);
    return () => {};
  }
}
