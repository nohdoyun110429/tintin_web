import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cgclempwykvqgtotblpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnY2xlbXB3eWt2cWd0b3RibHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODI2NDQsImV4cCI6MjA4MzU1ODY0NH0.ZWTZn2HJNcKvR-5wOpP2ivuMvdmRoFAOwzR0rMUubTo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});


