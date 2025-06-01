import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/auth-store';
import type { FaultyProductRecord } from '@/stores/ariza-store';

// Arızaya gönderilen ürünlere ait servis
export default {
    /**
     * En son arızaya gönderilen ürünleri getirir
     * @param limitCount Kaç adet ürün getirileceği
     */    
    async getLatestFaultyProducts(limitCount = 5) {
        const authStore = useAuthStore();
        
        try {
            // Temel sorgu oluştur
            let query = supabase
                .from('faulty_products')
                .select('*')
                .order('send_date', { ascending: false })
                .limit(limitCount);
            
            // Eğer kullanıcı admin değilse, sadece kendi deposuna ait arızalı ürünleri göster
            if (!authStore.isAdmin) {
                // Not: Burada authorizedDepot'u Supabase kullanıcı bilgilerinden almalıyız
                // Şimdilik bu kısmı yorum olarak bırakıyorum, gerekli olduğunda implementasyon güncellenecek
                // const authorizedWarehouseId = authStore.userInfo?.warehouse_id;
                // if (authorizedWarehouseId) {
                //     query = query.eq('sender_warehouse_id', authorizedWarehouseId);
                // }
            }
            
            const { data: faultyProductsData, error } = await query;
            
            if (error) {
                console.error('Arızalı ürünler getirilirken hata oluştu:', error);
                throw error;
            }
            
            // Veriyi FaultyProductRecord[] formatına dönüştür
            const faultyProducts: FaultyProductRecord[] = faultyProductsData?.map(item => {
                return {
                    ...item,
                    id: item.id,
                    // Firebase'den gelen tarih formatından farklı olarak, Supabase tarih formatını işle
                    // Not: Supabase varsayılan olarak ISO string formatında tarih döndürür, 
                    // bu yüzden tarih alanlarını Date nesnelerine dönüştürüyoruz
                    sendDate: item.send_date ? new Date(item.send_date) : null,
                    createdAt: item.created_at ? new Date(item.created_at) : null,
                    updatedAt: item.updated_at ? new Date(item.updated_at) : null,
                    returnedAt: item.returned_at ? new Date(item.returned_at) : null,
                    senderWarehouseId: item.sender_warehouse_id,
                    // Diğer snake_case'den camelCase'e dönüşümleri ekleyebilirsiniz
                };
            }) || [];
            
            return faultyProducts;
            
        } catch (error) {
            console.error('En son arızaya gönderilen ürünler alınırken hata:', error);
            throw error;
        }
    }
};
