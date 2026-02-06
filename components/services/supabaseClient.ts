import { createClient } from '@supabase/supabase-js';

// Demo placeholder client (kept only for compatibility with any untouched imports).
const supabaseUrl = 'https://example.supabase.co';
const supabaseKey = 'demo-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
