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

// Ensure high-priority Android notification channel is configured
async function setupAndroidChannel() {
  if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8fda58',
        sound: 'default',
      });
    } catch (e) {
      console.warn('[Notifications] Android channel setup warning:', e);
    }
  }
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

export async function registerForPushNotifications(userId: string | null, role: 'customer' | 'shop_owner' | 'worker' = 'customer') {
  if (Platform.OS === 'web' || !Notifications) {
    return null;
  }

  try {
    await setupAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted:', finalStatus);
      return null;
    }

    // Safely attempt token retrieval
    let token: string | null = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData?.data || null;
    } catch (tokenErr) {
      console.warn('[Notifications] getExpoPushTokenAsync notice:', tokenErr);
    }

    if (!token) return null;

    // Resolve authenticated Supabase user ID if not passed directly
    let targetUserId = userId;
    if (!targetUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          targetUserId = authData.user.id;
        }
      } catch (_) {}
    }

    if (targetUserId) {
      // Upsert into Supabase push_tokens table
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: targetUserId,
          token: token,
          role: role,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );
      if (error) {
        console.warn('[Notifications] Upsert push token notice:', error.message);
      } else {
        console.log('[Notifications] Push token successfully registered for user:', targetUserId);
      }
    }

    return token;
  } catch (err) {
    console.warn('[Notifications] registerForPushNotifications error:', err);
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string, data: any = {}) {
  if (Platform.OS === 'web' || !Notifications?.scheduleNotificationAsync) return;
  try {
    await setupAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] sendLocalNotification error:', e);
  }
}

export function setupNotificationListeners(
  onSelectOrder: (orderId: string) => void,
  onReceiveNotification?: (notification: any) => void
) {
  if (Platform.OS === 'web' || !Notifications) return () => {};

  try {
    const receivedSubscription = onReceiveNotification
      ? Notifications.addNotificationReceivedListener((notification: any) => {
          onReceiveNotification(notification);
        })
      : null;

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data && data.orderId) {
        onSelectOrder(data.orderId);
      }
    });

    return () => {
      try {
        if (receivedSubscription) receivedSubscription.remove();
        responseSubscription?.remove();
      } catch {}
    };
  } catch {
    return () => {};
  }
}
