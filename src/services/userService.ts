import { supabase } from '@/supabase'; // Supabase client'ın doğru yoldan import edildiğini varsayıyoruz
import type { User } from '@supabase/supabase-js'; // Supabase User tipi

// Kullanıcı ve profil oluşturmak için gerekli verilerin arayüzü
export interface CreateUserParams {
  email: string;          // auth.users için ve potansiyel olarak profiles.email için
  password: string;       // auth.users için
  firstName?: string;     // profiles.first_name için
  lastName?: string;      // profiles.last_name için
  phoneNumber?: string;   // profiles.phone_number için
  profileEmail?: string;  // profiles.email için (auth e-postasından farklıysa)
  initialRoles?: string[];// profiles.roles için, varsayılan olarak boş dizi
  isActive?: boolean;     // profiles.is_active için, varsayılan olarak true
}

// 'profiles' tablosunda saklanan profil verileri için arayüz
// Bu, auth-store.ts'deki UserDocument ve gerçek tablo yapınızla uyumlu olmalıdır
export interface Profile {
  id: string; // UUID, auth.users.id ile eşleşir
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;       // Profile özel e-posta
  phone_number?: string | null;
  roles?: string[] | null;     // Rol dizisi, örn: ['admin', 'editor']
  is_active?: boolean | null;  // Kullanıcı erişimini etkinleştirmek/devre dışı bırakmak için
  updated_at?: string | null;  // Son güncelleme zaman damgası (genellikle DB tarafından yönetilir)
}

export const userService = {
  async createUser(params: CreateUserParams): Promise<{ user: User | null; profile: Profile | null; error: Error | null }> {
    // 1. Giriş validasyonu (eski userService'e benzer)
    if (!params.email || !params.password) {
      return { user: null, profile: null, error: new Error('E-posta ve şifre zorunludur.') };
    }
    // Temel e-posta formatı validasyonu
    if (!/^\S+@\S+\.\S+$/.test(params.email)) {
      return { user: null, profile: null, error: new Error('Geçerli bir e-posta adresi giriniz.') };
    }
    // Supabase varsayılan minimum şifre uzunluğu 6'dır, ancak yapılandırılabilir.
    if (params.password.length < 6) {
      return { user: null, profile: null, error: new Error('Şifre en az 6 karakter olmalıdır.') };
    }

    let authUser: User | null = null;

    try {
      // 2. Supabase Auth'da kullanıcı oluştur
      // UYARI: supabase.auth.admin.createUser ideal olarak bir Supabase Edge Fonksiyonundan çağrılmalıdır
      // çünkü yönetici ayrıcalıkları (service_role anahtarı) gerektirir.
      // Üretimde istemci tarafından doğrudan çağırmak risklidir.
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: false, // Başlangıçta e-posta onayı gerekmiyorsa false olarak ayarlayın.
                              // True ise, kullanıcı e-postasını onaylayana kadar giriş yapamaz.
        // user_metadata: { /* auth.users.raw_user_meta_data için özel veriler */ }
      });

      if (authError) {
        console.error('Supabase Auth createUser hatası:', authError.message);
        if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
             return { user: null, profile: null, error: new Error('Bu e-posta adresi zaten kayıtlı.') };
        }
        return { user: null, profile: null, error: authError };
      }

      if (!authData || !authData.user) {
        return { user: null, profile: null, error: new Error('Auth kullanıcısı oluşturulamadı, Supabase\'den beklenmedik yanıt.') };
      }
      authUser = authData.user;

      // 3. Kullanıcı profilini 'profiles' tablosuna ekle
      const profileToInsert = {
        id: authUser.id, // auth.users tablosuyla aynı ID'yi kullanarak bağlantı kur
        first_name: params.firstName || null,
        last_name: params.lastName || null,
        // profiles.email için profileEmail kullanın, yoksa auth e-postasını kullanın.
        email: params.profileEmail || authUser.email,
        phone_number: params.phoneNumber || null,
        roles: params.initialRoles || [], // Roller için varsayılan olarak boş bir dizi
        is_active: params.isActive === undefined ? true : params.isActive, // Varsayılan olarak aktif
        // updated_at genellikle PostgreSQL'in sütundaki varsayılan now() fonksiyonu tarafından yönetilir.
        // Yönetilmiyorsa, burada ayarlayabilirsiniz:
        // updated_at: new Date().toISOString(),
      };

      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileToInsert)
        .select() // Eklenen satırı getirir
        .single(); // Tek bir satırın eklenip döndürülmesini bekler

      if (profileError) {
        console.error('Supabase profiles insert hatası:', profileError.message);
        // ÖNEMLİ: Profil ekleme başarısız olursa, auth kullanıcısı hala mevcuttur.
        // Bir temizleme mekanizması (örn: auth kullanıcısını silmek) veya
        // mümkünse daha sağlam bir işlemsel yaklaşım (genellikle Edge Fonksiyonları aracılığıyla) düşünün.
        return { user: authUser, profile: null, error: profileError };
      }

      return { user: authUser, profile: insertedProfile as Profile, error: null };

    } catch (error: any) {
      console.error('createUser genel hatası:', error.message);
      // Yukarıdakine benzer şekilde, authUser oluşturuldu ancak sonraki bir adım başarısız olduysa,
      // temizlemeyi düşünün.
      return { user: null, profile: null, error };
    }
  },

  /**
   * Kullanıcı profil bilgilerini getirir
   * @param userId Kullanıcı ID'si (auth.users tablosundaki id)
   * @returns Profil bilgileri veya hata
   */
  async getUserProfile(userId: string): Promise<{ profile: Profile | null; error: Error | null }> {
    if (!userId) {
      return { profile: null, error: new Error('Kullanıcı ID\'si gereklidir.') };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profil getirme hatası:', error.message);
        return { profile: null, error };
      }

      return { profile: data as Profile, error: null };
    } catch (error: any) {
      console.error('getUserProfile genel hatası:', error.message);
      return { profile: null, error };
    }
  },

  /**
   * Kullanıcı profil bilgilerini günceller
   * @param userId Kullanıcı ID'si (auth.users tablosundaki id)
   * @param profileData Güncellenecek profil verileri
   * @returns Güncellenmiş profil veya hata
   */
  async updateUserProfile(userId: string, profileData: Partial<Profile>): Promise<{ profile: Profile | null; error: Error | null }> {
    if (!userId) {
      return { profile: null, error: new Error('Kullanıcı ID\'si gereklidir.') };
    }

    try {
      // Güvenlik için id alanını profileData'dan kaldırın (id değiştirilemez)
      const { id, ...dataToUpdate } = profileData as any;
      
      // updated_at alanını güncelle
      dataToUpdate.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Profil güncelleme hatası:', error.message);
        return { profile: null, error };
      }

      return { profile: data as Profile, error: null };
    } catch (error: any) {
      console.error('updateUserProfile genel hatası:', error.message);
      return { profile: null, error };
    }
  },

  /**
   * Tüm kullanıcıları profil bilgileriyle getirir
   * @returns Kullanıcı profilleri listesi veya hata
   */
  async getAllUsersWithProfiles(): Promise<{ profiles: Profile[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Kullanıcı profilleri getirme hatası:', error.message);
        return { profiles: [], error };
      }

      return { profiles: data as Profile[], error: null };
    } catch (error: any) {
      console.error('getAllUsersWithProfiles genel hatası:', error.message);
      return { profiles: [], error };
    }
  },

  /**
   * Kullanıcıyı ve ilişkili profil bilgilerini siler
   * @param userId Kullanıcı ID'si (auth.users tablosundaki id)
   * @returns İşlem başarısı
   */
  async deleteUser(userId: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId) {
      return { success: false, error: new Error('Kullanıcı ID\'si gereklidir.') };
    }

    try {
      // 1. İlk olarak profile tablosundaki kaydı sil
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('Profil silme hatası:', profileDeleteError.message);
        return { success: false, error: profileDeleteError };
      }

      // 2. Sonra auth.users tablosundaki kullanıcıyı sil
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error('Auth kullanıcı silme hatası:', authDeleteError.message);
        return { success: false, error: authDeleteError };
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('deleteUser genel hatası:', error.message);
      return { success: false, error };
    }
  },

  /**
   * E-posta adresine göre kullanıcı profili getirir
   * @param email Kullanıcı e-posta adresi
   * @returns Kullanıcı profili veya hata
   */
  async getUserProfileByEmail(email: string): Promise<{ profile: Profile | null; error: Error | null }> {
    if (!email) {
      return { profile: null, error: new Error('E-posta adresi gereklidir.') };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // Hiç sonuç yoksa veya birden fazla sonuç varsa hata vermez

      if (error) {
        console.error('E-posta ile profil getirme hatası:', error.message);
        return { profile: null, error };
      }

      return { profile: data as Profile, error: null };
    } catch (error: any) {
      console.error('getUserProfileByEmail genel hatası:', error.message);
      return { profile: null, error };
    }
  },

  /**
   * Kullanıcı giriş fonksiyonu
   * @param email Kullanıcı e-posta adresi
   * @param password Kullanıcı şifresi
   * @returns Oturum ve kullanıcı bilgileri veya hata
   */
  async login(email: string, password: string): Promise<{ user: User | null; profile: Profile | null; error: Error | null }> {
    if (!email || !password) {
      return { user: null, profile: null, error: new Error('E-posta ve şifre gereklidir.') };
    }

    try {
      // 1. Supabase Auth ile giriş yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Giriş hatası:', authError.message);
        if (authError.message.includes('Invalid login credentials')) {
          return { user: null, profile: null, error: new Error('Geçersiz e-posta veya şifre.') };
        }
        return { user: null, profile: null, error: authError };
      }

      if (!authData.user) {
        return { user: null, profile: null, error: new Error('Kullanıcı bulunamadı.') };
      }

      // 2. Kullanıcının profil bilgilerini getir
      const { profile, error: profileError } = await this.getUserProfile(authData.user.id);

      if (profileError) {
        return { user: authData.user, profile: null, error: profileError };
      }

      // 3. Kullanıcının aktif olup olmadığını kontrol et
      if (profile && profile.is_active === false) {
        // Kullanıcı aktif değilse oturumu kapat
        await supabase.auth.signOut();
        return { user: null, profile: null, error: new Error('Bu hesap devre dışı bırakılmıştır.') };
      }

      // 4. Son giriş zamanını güncelle
      if (profile) {
        await this.updateUserProfile(authData.user.id, {
          ...profile,
          updated_at: new Date().toISOString()
        });
      }

      return { user: authData.user, profile, error: null };
    } catch (error: any) {
      console.error('login genel hatası:', error.message);
      return { user: null, profile: null, error };
    }
  },

  /**
   * Kullanıcı çıkış fonksiyonu
   * @returns İşlem başarısı
   */
  async logout(): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('userService: Çıkış yapılıyor...');
      
      // Tüm oturum verilerini temizle - önbellekleme sorunlarını önlemek için
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Tüm cihazlarda oturumları sonlandır
      });

      if (error) {
        console.error('Çıkış hatası:', error.message);
        // Hata olsa bile temizleme işlemlerine devam et
      }

      // Çıkış sonrası oturumun temizlendiğinden emin ol
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.warn('Oturum hala aktif, ikinci kez çıkış deneniyor...');
        await supabase.auth.signOut({ scope: 'global' });
      }

      // Çıkış başarılı olduğunda localStorage'da kalan tüm kullanıcı verilerini temizle
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sb-session');
      
      // LocalStorage'da 'sb-' ile başlayan tüm anahtarları temizle
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // IndexedDB'deki Supabase verilerini temizle (genellikle 'supabase' adlı bir store)
      try {
        if (window.indexedDB) {
          // IndexedDB'yi açmayı dene
          const request = window.indexedDB.deleteDatabase('supabase');
          request.onsuccess = () => console.log('IndexedDB supabase veritabanı başarıyla silindi');
          request.onerror = () => console.warn('IndexedDB supabase veritabanı silinemedi');
        }
      } catch (idbError) {
        console.warn('IndexedDB temizleme hatası:', idbError);
      }

      // Çerezleri temizle (domain ve path bilgisine göre)
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      console.log('userService: Çıkış başarılı, tüm veriler temizlendi');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('logout genel hatası:', error.message);
      return { success: false, error };
    }
  },

  /**
   * Kullanıcının bağlı olduğu projeleri getirir
   * @param userId Kullanıcı ID'si
   * @returns Kullanıcının bağlı olduğu proje ID'leri
   */
  async getUserProjects(userId: string): Promise<{ projectIds: string[]; error: Error | null }> {
    if (!userId) {
      return { projectIds: [], error: new Error('Kullanıcı ID\'si gereklidir.') };
    }

    try {
      // 1. Önce profiles tablosundaki projectIds alanını kontrol et
      const { profile, error: profileError } = await this.getUserProfile(userId);

      if (!profileError && profile && profile.roles && Array.isArray(profile.roles)) {
        // Eğer roles array'inde proje ID'leri saklanıyorsa
        return { projectIds: profile.roles, error: null };
      }

      // 2. Alternatif olarak userProjects tablosundan kullanıcı projelerini al
      const { data: userProjects, error: projectsError } = await supabase
        .from('userProjects')
        .select('projectId')
        .eq('userId', userId);

      if (projectsError) {
        console.error('Kullanıcı projeleri getirme hatası:', projectsError.message);
        return { projectIds: [], error: projectsError };
      }

      if (!userProjects || userProjects.length === 0) {
        console.log(`${userId} ID'li kullanıcı için bağlı proje bulunamadı`);
        return { projectIds: [], error: null };
      }

      const projectIds: string[] = userProjects
        .filter(up => up.projectId)
        .map(up => up.projectId);

      console.log(`${userId} ID'li kullanıcı için ${projectIds.length} proje bulundu:`, projectIds);
      return { projectIds, error: null };
    } catch (error: any) {
      console.error('getUserProjects genel hatası:', error.message);
      return { projectIds: [], error };
    }
  }
};

export default userService;
