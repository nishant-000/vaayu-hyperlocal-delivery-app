import { supabase, CustomAsyncStorage } from './supabase';

const CACHE_KEY = 'VAAYU_APP_CONFIG';
const CACHE_TIMESTAMP_KEY = 'VAAYU_APP_CONFIG_TS';
const TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export interface AppConfig {
  delivery_fee: { instant: number; scheduled: number };
  free_delivery_threshold: number; // Free delivery threshold (default 150)
  platform_fee: number;
  min_order_value: number;
  service_radius_or_blocks: string[];
  promo_codes: Array<{
    code: string;
    discount_type: 'flat' | 'percentage';
    discount_value: number;
    min_order_value: number;
    active: boolean;
  }>;
  banners: Array<{
    id: string;
    title: string;
    image_url: string;
    link?: string;
    active: boolean;
    priority: number;
    show_on: string[];
  }>;
}

export const DEFAULT_CONFIG: AppConfig = {
  delivery_fee: { instant: 10, scheduled: 5 },
  free_delivery_threshold: 150,
  platform_fee: 5,
  min_order_value: 30,
  service_radius_or_blocks: ["Gate 1", "Block A", "Block B", "Block C", "Admin Block", "Library"],
  promo_codes: [
    { code: "VAAYU50", discount_type: "flat", discount_value: 50, min_order_value: 150, active: true },
    { code: "WELCOME20", discount_type: "percentage", discount_value: 20, min_order_value: 100, active: true }
  ],
  banners: [
    {
      id: "b1",
      title: "Gate 1 Express Delivery",
      image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop",
      active: true,
      priority: 1,
      show_on: ["customer_home"]
    }
  ]
};

const getStorageItem = (key: string) => CustomAsyncStorage.getItem(key);
const setStorageItem = (key: string, value: string) => CustomAsyncStorage.setItem(key, value);

export async function fetchRemoteConfig(): Promise<AppConfig> {
  try {
    // 1. Check local cache validity
    const cachedData = await getStorageItem(CACHE_KEY);
    const cachedTs = await getStorageItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    let config: AppConfig = DEFAULT_CONFIG;

    if (cachedData && cachedTs && now - parseInt(cachedTs, 10) < TTL_MS) {
      config = JSON.parse(cachedData);
    }

    // 2. Fetch fresh config from Supabase app_config table
    const { data, error } = await supabase.from('app_config').select('key, value');
    if (!error && data && data.length > 0) {
      const freshConfig: any = { ...DEFAULT_CONFIG };
      data.forEach(item => {
        try {
          freshConfig[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        } catch {
          freshConfig[item.key] = item.value;
        }
      });
      config = freshConfig as AppConfig;

      // Update cache
      await setStorageItem(CACHE_KEY, JSON.stringify(config));
      await setStorageItem(CACHE_TIMESTAMP_KEY, now.toString());
    }

    return config;
  } catch (err) {
    console.warn('[RemoteConfig] Failed to fetch live config, using cached/default:', err);
    return DEFAULT_CONFIG;
  }
}

export function subscribeToRemoteConfig(onUpdate: (config: AppConfig) => void) {
  const subscription = supabase
    .channel('app_config_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_config' },
      async () => {
        console.log('[RemoteConfig] Realtime update detected in app_config!');
        const updatedConfig = await fetchRemoteConfig();
        onUpdate(updatedConfig);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

export async function validatePromoCodeServerSide(code: string, cartTotal: number) {
  try {
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code,
      p_cart_total: cartTotal
    });

    if (error) {
      console.error('[RemoteConfig] RPC validate_promo_code error:', error);
      return { valid: false, reason: 'Failed to validate promo code' };
    }

    return data;
  } catch (err: any) {
    return { valid: false, reason: err.message || 'Validation error' };
  }
}
