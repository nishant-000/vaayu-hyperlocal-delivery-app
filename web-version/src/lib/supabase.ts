import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://npshikrjdvvdqjrybeju.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wc2hpa3JqZHZ2ZHFqcnliZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Njk1NjUsImV4cCI6MjA5OTA0NTU2NX0.XlugAPESA28iLxUUXwSSFRGea0bx22JO9qZEAxHXaBQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
