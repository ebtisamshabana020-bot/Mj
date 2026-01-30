
import { createClient } from '@supabase/supabase-js';

// القيم تسحب من متغيرات البيئة في Netlify أو تستخدم القيم الافتراضية
const supabaseUrl = process.env.SUPABASE_URL || 'https://djgvntdnisqjtgploopd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZ3ZudGRuaXNxanRncGxvb3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzAyMzUsImV4cCI6MjA4NDYwNjIzNX0.TL0GV2XPw_BE8R7YGjSLHBVS0-lQYdLVvERRiRUsBUs';

export const supabase = createClient(supabaseUrl, supabaseKey);
