import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://jjlxvyadlnqerkbielvb.supabase.co' // Buraya kendi Supabase Proje URL'nizi girin
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbHh2eWFkbG5xZXJrYmllbHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDgxMjIsImV4cCI6MjA2MzQ4NDEyMn0.xq_Ul-hlGEG3hwpBEvY6MXNd74fM4PVHh4vdnuUof0I' // Buraya kendi Supabase anon public API anahtarınızı girin
// Bu anahtar sadece herkese açık verilere erişim için kullanılır

// Service role anahtarı - Bu anahtarı yönetici işlemleri için kullanın
// NOT: Bu anahtarı yalnızca güvenli ortamlarda kullanın, istemci tarafında ASLA açığa çıkarmayın
// Bu anahtarı kullanmak için Supabase'ten service_role anahtarınızı almanız gerekir
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Singleton pattern to prevent multiple client instances
let _supabase: any = null;
let _supabaseAdmin: any = null;

// Normal client - Standart kullanıcı işlemleri için
export const supabase = (() => {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
})()

// Admin client - Sadece yönetici işlemleri için (örn. kullanıcı silme)
// Bu client'ı sadece güvenli ortamlarda kullanın
export const supabaseAdmin = (() => {
  if (!_supabaseAdmin && supabaseServiceKey) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'supabase-admin-auth-token' // Different storage key to avoid conflicts
      }
    })
  }
  return _supabaseAdmin
})()