import { supabase, CustomAsyncStorage } from './supabase';

const CACHE_KEY = 'VAAYU_APP_CONFIG';
const CACHE_TIMESTAMP_KEY = 'VAAYU_APP_CONFIG_TS';
const TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export interface DeliverySlotConfig {
  id: string;
  name: string;
  label: string;
  start_hour: number;
  start_minute: number;
}

export interface AppConfig {
  delivery_fee: { instant: number; scheduled: number };
  free_delivery_threshold: number; // Free delivery threshold (default 150)
  platform_fee: number;
  min_order_value: number;
  service_radius_or_blocks: string[];
  delivery_slots: DeliverySlotConfig[];
  promo_codes: Array<{
    code: string;
    discount_type: 'flat' | 'percentage' | 'platform_fee' | 'free_platform_fee';
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
  delivery_slots: [
    { id: "slot_1", name: "Lunch Slot", label: "12:40 PM – 1:40 PM", start_hour: 12, start_minute: 40 },
    { id: "slot_2", name: "Night Slot", label: "7:00 PM – 9:00 PM", start_hour: 19, start_minute: 0 }
  ],
  promo_codes: [
    { code: "FREEFEE", discount_type: "platform_fee", discount_value: 5, min_order_value: 0, active: true },
    { code: "NOPLATFORM", discount_type: "platform_fee", discount_value: 5, min_order_value: 0, active: true },
    { code: "FREEPLATFORM", discount_type: "platform_fee", discount_value: 5, min_order_value: 0, active: true },
    { code: "ZEROFEES", discount_type: "platform_fee", discount_value: 5, min_order_value: 0, active: true },
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

export async function fetchRemoteConfig(forceRefresh = false): Promise<AppConfig> {
  try {
    // 1. Check local cache validity
    const cachedData = await getStorageItem(CACHE_KEY);
    const cachedTs = await getStorageItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    if (!forceRefresh && cachedData && cachedTs && now - parseInt(cachedTs, 10) < TTL_MS) {
      console.log('[RemoteConfig] Returning cached config');
      return JSON.parse(cachedData) as AppConfig;
    }

    let config: AppConfig = DEFAULT_CONFIG;
    
    console.log('[RemoteConfig] Fetching fresh config from Supabase...');
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
    }

    // 3. Fetch from dedicated 'promos' table if available in Table Editor
    try {
      const { data: promoRows, error: promoError } = await supabase
        .from('promos')
        .select('*')
        .eq('active', true);

      if (!promoError && promoRows && promoRows.length > 0) {
        config.promo_codes = promoRows.map((r: any) => ({
          code: r.code,
          discount_type: r.discount_type || 'flat',
          discount_value: Number(r.discount_value) || 0,
          min_order_value: Number(r.min_order_value) || 0,
          active: r.active !== false
        }));
      }
    } catch (promoFetchErr) {
      // Gracefully continue if promos table is not created yet
    }

    // Update cache
    await setStorageItem(CACHE_KEY, JSON.stringify(config));
    await setStorageItem(CACHE_TIMESTAMP_KEY, now.toString());

    return config;
  } catch (err) {
    console.error('[RemoteConfig] Fetch error:', err);
    return DEFAULT_CONFIG;
  }
}

// Global Singleton for Config Listeners
let globalConfigChannel: any = null;
const configListeners: Set<(config: AppConfig) => void> = new Set();
let currentConfig: AppConfig | null = null;

export function subscribeToRemoteConfig(onUpdate: (config: AppConfig) => void) {
  // Add listener
  configListeners.add(onUpdate);
  console.log(`[RemoteConfig] Added listener. Total listeners: ${configListeners.size}`);

  // Immediately give them the latest known config if we have it
  if (currentConfig) {
    onUpdate(currentConfig);
  }

  // If channel doesn't exist, create it
  if (!globalConfigChannel) {
    console.log('[RemoteConfig] Initializing GLOBAL realtime channel...');
    globalConfigChannel = supabase
      .channel('global_app_config_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        async (payload) => {
          console.log('[RemoteConfig] 🔔 APP_CONFIG REALTIME EVENT RECEIVED:', payload);
          const updatedConfig = await fetchRemoteConfig(true); // Bypass cache
          currentConfig = updatedConfig;
          configListeners.forEach(listener => listener(updatedConfig));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promos' },
        async (payload) => {
          console.log('[RemoteConfig] 🔔 PROMOS TABLE REALTIME EVENT RECEIVED:', payload);
          const updatedConfig = await fetchRemoteConfig(true); // Bypass cache
          currentConfig = updatedConfig;
          configListeners.forEach(listener => listener(updatedConfig));
        }
      )
      .subscribe((status, err) => {
        console.log('[RemoteConfig] Channel status update:', status, err || '');
      });
  }

  // Cleanup function for this specific listener
  return () => {
    configListeners.delete(onUpdate);
    console.log(`[RemoteConfig] Removed listener. Total listeners: ${configListeners.size}`);
    
    // If no more listeners, clean up the global channel to save resources
    if (configListeners.size === 0 && globalConfigChannel) {
      console.log('[RemoteConfig] No more listeners, tearing down global channel.');
      supabase.removeChannel(globalConfigChannel);
      globalConfigChannel = null;
    }
  };
}

export async function validatePromoCodeServerSide(code: string, cartTotal: number, platformFee: number = 5) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return { valid: false, reason: 'Please enter a promo code' };

  try {
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: cleanCode,
      p_cart_total: cartTotal
    });

    if (!error && data && data.valid !== undefined) {
      return data;
    }
  } catch (err: any) {
    console.warn('[RemoteConfig] Server RPC validate_promo_code error:', err);
  }

  // Resilient fallback to active remote config / DEFAULT_CONFIG
  try {
    const config = await fetchRemoteConfig();
    const promoList = config.promo_codes || DEFAULT_CONFIG.promo_codes;
    const promo = promoList.find(p => p.code.toUpperCase() === cleanCode && p.active);

    if (!promo) {
      return { valid: false, reason: 'Invalid or inactive promo code' };
    }

    if (cartTotal < (promo.min_order_value || 0)) {
      return { valid: false, reason: `${promo.code} requires a minimum order of ₹${promo.min_order_value}` };
    }

    let discount = 0;
    if (promo.discount_type === 'flat') {
      discount = promo.discount_value;
    } else if (promo.discount_type === 'percentage') {
      discount = Math.round((cartTotal * promo.discount_value) / 100);
    } else if (promo.discount_type === 'platform_fee' || promo.discount_type === 'free_platform_fee') {
      discount = config.platform_fee || platformFee || 5;
    } else {
      discount = promo.discount_value || 5;
    }

    return {
      valid: true,
      code: promo.code,
      discount: discount,
      discount_type: promo.discount_type,
      reason: promo.discount_type === 'platform_fee' ? '100% Free Platform Fee' : undefined
    };
  } catch (localErr: any) {
    return { valid: false, reason: 'Could not validate promo code' };
  }
}
