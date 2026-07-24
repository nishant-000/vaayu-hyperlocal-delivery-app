import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure Notification Handler behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function checkNotificationPermissionStatus() {
  if (Platform.OS === 'web') return 'granted';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function registerForPushNotifications(userId: string | null, role: 'customer' | 'shop_owner' | 'worker') {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform, skipping native push registration.');
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

    // Get Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
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
  if (Platform.OS === 'web') return () => {};

  // Handle notification tap / response
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('[Notifications] Notification tapped with data:', data);

    if (data && data.orderId) {
      onSelectOrder(data.orderId);
    }
  });

  return () => {
    responseSubscription.remove();
  };
}
