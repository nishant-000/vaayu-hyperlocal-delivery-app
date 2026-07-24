import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://npshikrjdvvdqjrybeju.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wc2hpa3JqZHZ2ZHFqcnliZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Njk1NjUsImV4cCI6MjA5OTA0NTU2NX0.XlugAPESA28iLxUUXwSSFRGea0bx22JO9qZEAxHXaBQ';

// In-memory store map
const memoryStore = new Map<string, string>();

// Safe Storage Adapter matching Supabase SupportedStorage interface
export const CustomAsyncStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return Promise.resolve(localStorage.getItem(key));
      }
      return Promise.resolve(memoryStore.get(key) || null);
    } catch {
      return Promise.resolve(memoryStore.get(key) || null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      memoryStore.set(key, value);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    try {
      memoryStore.delete(key);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
    return Promise.resolve();
  },
};

// Polyfill global window/globalThis localStorage to prevent third-party fallback errors
if (typeof globalThis !== 'undefined') {
  try {
    if (!(globalThis as any).localStorage) {
      (globalThis as any).localStorage = {
        getItem: (k: string) => memoryStore.get(k) || null,
        setItem: (k: string, v: string) => { memoryStore.set(k, v); },
        removeItem: (k: string) => { memoryStore.delete(k); },
        clear: () => { memoryStore.clear(); },
      };
    }
  } catch {}
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: CustomAsyncStorage,
    storageKey: 'vaayu-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
