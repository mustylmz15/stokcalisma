// Firebase hata işleyicileri
import { auth } from './index';

/**
 * Firebase izin hatalarını işleyen yardımcı fonksiyon
 * @param {Error} error - Firebase'den gelen hata
 * @param {Function} retryCallback - Yeniden deneme için çağrılacak fonksiyon
 */
export const handleFirebasePermissionError = async (error, retryCallback) => {
    // Hata türlerini daha kapsamlı kontrol et - regex ile kontrol ekleyerek tüm olası izin hatalarını yakalayalım
    const isPermissionError = error && (
        error.code === 'permission-denied' || 
        (error.message && (
            error.message.includes('Missing or insufficient permissions') ||
            error.message.match(/permission[s]?\s+denied/i) ||
            error.message.match(/not authorized/i) ||
            error.message.match(/access denied/i)
        ))
    );
    
    if (isPermissionError) {
        console.log('Yetki hatası oluştu. Oturum bilgileri yenileniyor...');
        
        try {
            // Mevcut kullanıcı için token yenileme
            const currentUser = auth.currentUser;
            if (currentUser) {
                // Force refresh ile token'ı mutlaka yenile
                await currentUser.getIdToken(true); 
                console.log('Oturum token\'ı yenilendi, işlem tekrar deneniyor...');
                
                // 100ms bekleyerek değişikliklerin Firebase'e yansımasını sağla
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Eğer bir geri çağırma fonksiyonu verilmişse, işlemi tekrar dene
                if (typeof retryCallback === 'function') {
                    return retryCallback();
                }
                
                return true;
            }
        } catch (refreshError) {
            console.error('Token yenileme hatası:', refreshError);
            
            // Token yenileme başarısızsa, kullanıcıyı oturumu yeniden açmaya yönlendir
            auth.signOut().then(() => {
                // Oturum kapatıldıktan sonra sayfayı yeniden yükle
                window.location.href = '/auth/login'; 
            });
        }
    }
    
    // Başka bir hata türüyse, orijinal hatayı geri döndür
    throw error;
};
