// Supabase client'ları direk export ediyoruz, duplication olmasın
export { supabase, supabaseAdmin } from '@/lib/supabaseClient';

// Re-import for local usage
import { supabase } from '@/lib/supabaseClient';

// Kullanıcı profilini getiren fonksiyon
export const fetchUserProfile = async (userId: string) => {
  if (!userId) {
    console.error('fetchUserProfile: userId sağlanmadı.');
    return null;
  }
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && status !== 406) { // 406, 'Not Acceptable' anlamına gelir, bu da satır bulunamadığında döner
      console.error('Error fetching user profile:', error.message);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Catch block: Error fetching user profile:', error);
    return null;
  }
};

// Kullanıcı rollerini getiren fonksiyon (profiles tablosundaki roles sütunundan)
export const fetchUserRoles = async (userId: string): Promise<string[]> => {
  if (!userId) {
    console.error('fetchUserRoles: userId sağlanmadı.');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user roles:', error.message);
      // Kullanıcıya ait profil bulunamazsa veya başka bir hata olursa boş dizi döndür
      return [];
    }
    return data?.roles || [];
  } catch (error) {
    console.error('Catch block: Error fetching user roles:', error);
    return [];
  }
};

// Tüm kullanıcı profillerini getiren fonksiyon
export const fetchAllUserProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching all user profiles:', error.message);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Catch block: Error fetching all user profiles:', error);
    return [];
  }
};

// Kullanıcı profili güncelleme fonksiyonu
export const updateUserProfile = async (userId: string, updates: any) => {
  if (!userId) {
    console.error('updateUserProfile: userId sağlanmadı.');
    return { success: false, error: 'Kullanıcı ID\'si gereklidir.' };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Catch block: Error updating user profile:', error);
    return { success: false, error: 'Kullanıcı profili güncellenirken beklenmeyen bir hata oluştu.' };
  }
};

// Kullanıcı rollerini güncelleme fonksiyonu
export const updateUserRoles = async (userId: string, roles: string[]) => {
  return await updateUserProfile(userId, { roles });
};