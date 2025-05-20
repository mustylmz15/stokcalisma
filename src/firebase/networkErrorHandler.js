/**
 * Firebase ağ hatalarını işleyen yardımcı fonksiyonlar
 */

// ERR_BLOCKED_BY_CLIENT hatası için durum kontrolü yapacak
let hasShownAdBlockWarning = false;

/**
 * Tarayıcı eklentileri tarafından engellenen istekleri algılayıp kullanıcıyı bilgilendiren yardımcı fonksiyon
 * Bu fonksiyon, bir console.error override fonksiyonu olarak kullanılır
 */
export const setupNetworkErrorDetection = () => {
    // Orijinal console.error fonksiyonunu kaydet
    const originalConsoleError = console.error;
    
    // console.error'u override et
    console.error = function(...args) {
        // Orijinal fonksiyonu çağır
        originalConsoleError.apply(console, args);
        
        // ERR_BLOCKED_BY_CLIENT hatası kontrolü
        if (args && args.length > 0) {
            const errorString = args.join(' ');
            
            if (errorString.includes('ERR_BLOCKED_BY_CLIENT') && !hasShownAdBlockWarning) {
                // Kullanıcıya AdBlock'u devre dışı bırakma önerisi göster
                const message = `
                    Bir tarayıcı eklentisi (AdBlock, uBlock Origin vb.) Firebase ile iletişimi engelliyor. 
                    Uygulamanın düzgün çalışması için lütfen bu site için eklentiyi devre dışı bırakın.
                `;
                
                // Toast, alert veya uygulama içi bildirim göster
                alert(message);
                
                // Tekrar tekrar göstermeyi önle
                hasShownAdBlockWarning = true;
            }
        }
    };
};
