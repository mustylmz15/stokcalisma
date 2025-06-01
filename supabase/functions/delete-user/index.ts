// Supabase Edge Function - Kullanıcı silme işlevi
// Deno kullanılarak yazılmıştır
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.12.0';

console.log('Kullanıcı Silme Fonksiyonu Yükleniyor...');

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // CORS için OPTIONS isteğini işle
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers,
      status: 405
    });
  }

  try {
    // İstek gövdesinden kullanıcı ID'sini al
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Kullanıcı ID eksik' }), {
        headers,
        status: 400
      });
    }

    // Yetkilendirme başlığını al
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Yetkilendirme başlığı eksik' }), {
        headers,
        status: 401
      });
    }

    // JWT token'ı çıkar
    const token = authHeader.replace('Bearer ', '');
    
    // Supabase URL ve anahtar bilgilerini çevresel değişkenlerden al
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jjlxvyadlnqerkbielvb.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Servis rolü anahtarı yapılandırılmamış' }), {
        headers,
        status: 500
      });
    }

    // Servis rolü ile Supabase istemcisi oluştur
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // İsteği yapan kullanıcının admin olup olmadığını kontrol et
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Yetkilendirme başarısız' }), {
        headers,
        status: 401
      });
    }

    // İsteği yapan kullanıcının admin rolünde olup olmadığını kontrol et
    const { data: callerRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single();

    if (rolesError || !callerRoles) {
      return new Response(JSON.stringify({ error: 'Bu işlem için admin yetkisi gerekli' }), {
        headers,
        status: 403
      });
    }

    // Artık admin yetkisi doğrulandı, kullanıcıyı silebiliriz
    
    // 1. User rollerini sil
    const { error: roleDeleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (roleDeleteError) {
      console.error('Roller silinirken hata:', roleDeleteError);
      // Hata olsa bile devam et
    }
    
    // 2. Profil bilgisini sil
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileDeleteError) {
      console.error('Profil silinirken hata:', profileDeleteError);
      // Hata olsa bile devam et
    }
    
    // 3. Auth sisteminden kullanıcıyı sil
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Auth sisteminden silinirken hata:', authDeleteError);
      return new Response(JSON.stringify({ 
        error: 'Kullanıcı kısmen silindi ancak auth sisteminden silinemedi',
        details: authDeleteError.message
      }), {
        headers,
        status: 500
      });
    }
    
    // Başarılı yanıt
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Kullanıcı başarıyla silindi'
    }), {
      headers,
      status: 200
    });
    
  } catch (error) {
    console.error('İşlem sırasında hata:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Sunucu hatası', 
      details: error.message 
    }), {
      headers,
      status: 500
    });
  }
});
