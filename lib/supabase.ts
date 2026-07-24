import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

try {
  require('react-native-url-polyfill/auto');
} catch (e) {
  // Polyfill fallback
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://npshikrjdvvdqjrybeju.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wc2hpa3JqZHZ2ZHFqcnliZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Njk1NjUsImV4cCI6MjA5OTA0NTU2NX0.XlugAPESA28iLxUUXwSSFRGea0bx22JO9qZEAxHXaBQ';

// In-memory fallback map to completely prevent native module errors & callback errors
const memoryStore = new Map<string, string>();

export const CustomAsyncStorage = {
  getItem: async (key: string, callback?: (err: any, result?: string | null) => void) => {
    let result: string | null = null;
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        result = localStorage.getItem(key);
      } else {
        result = memoryStore.get(key) || null;
      }
    } catch (e) {
      result = memoryStore.get(key) || null;
    }
    if (typeof callback === 'function') callback(null, result);
    return result;
  },
  setItem: async (key: string, value: string, callback?: (err: any) => void) => {
    try {
      memoryStore.set(key, value);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {}
    if (typeof callback === 'function') callback(null);
    return;
  },
  removeItem: async (key: string, callback?: (err: any) => void) => {
    try {
      memoryStore.delete(key);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    if (typeof callback === 'function') callback(null);
    return;
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: CustomAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
