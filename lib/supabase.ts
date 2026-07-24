import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

try {
  require('react-native-url-polyfill/auto');
} catch (e) {
  // Polyfill fallback
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://npshikrjdvvdqjrybeju.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wc2hpa3JqZHZ2ZHFqcnliZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Njk1NjUsImV4cCI6MjA5OTA0NTU2NX0.XlugAPESA28iLxUUXwSSFRGea0bx22JO9qZEAxHXaBQ';

// In-memory fallback map if native AsyncStorage module is unavailable
const memoryStore = new Map<string, string>();

const CustomAsyncStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return memoryStore.get(key) || null; }
    }
    try {
      const val = await AsyncStorage.getItem(key);
      return val;
    } catch (e) {
      return memoryStore.get(key) || null;
    }
  },
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
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
