
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || 'https://djgvntdnisqjtgploopd.supabase.co'),
    'process.env.SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZ3ZudGRuaXNxanRncGxvb3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzAyMzUsImV4cCI6MjA4NDYwNjIzNX0.TL0GV2XPw_BE8R7YGjSLHBVS0-lQYdLVvERRiRUsBUs'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
