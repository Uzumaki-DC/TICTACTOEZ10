import { createClient } from '@supabase/supabase-js'

// Extract URL and anon key from environment variables
function getSupabaseConfig() {
  const databaseUrl = import.meta.env.VITE_DATABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  // Parse the database URL to extract the Supabase URL and project ref
  // Format: postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
  try {
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      const hostParts = url.hostname.split('.');
      
      // Extract project ref from the username part
      if (url.username && url.username.includes('.')) {
        const projectRef = url.username.split('.')[1];
        const supabaseUrl = `https://${projectRef}.supabase.co`;
        
        console.log('Supabase config:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });
        return { supabaseUrl, supabaseAnonKey };
      }
    }
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
  }
  
  console.warn('Supabase configuration incomplete, using fallback values');
  return { 
    supabaseUrl: 'https://placeholder.supabase.co', 
    supabaseAnonKey: supabaseAnonKey || 'placeholder-key' 
  };
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});