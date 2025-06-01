import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/auth-store';
import type { FaultyProductRecord } from '@/stores/ariza-store';

// Günlük arıza istatistiklerini almak için servis
export default {
    /**
     * Son 7 günün arıza merkezine gönderilen ürün verilerini getirir
     */
    async getLastWeekFaultyStats() {
        const authStore = useAuthStore();
        
        try {
            // Bugünün başlangıcını al
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 7 gün öncesinin tarihini al
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            
            // Supabase sorgusu için tarih formatları (ISO string)
            const todayStr = today.toISOString();
            const sevenDaysAgoStr = sevenDaysAgo.toISOString();
            
            // Supabase sorgusu oluştur
            let query = supabase
                .from('faulty_products')
                .select('*')
                .gte('send_date', sevenDaysAgoStr)
                .lt('send_date', todayStr)
                .order('send_date', { ascending: true });
            
            // Eğer kullanıcı admin değilse, sadece kendi deposuna ait arızalı ürünleri göster
            if (!authStore.isAdmin) {
                // Supabase kullanıcı bilgilerinden depo kodu al
                const authorizedDepot = authStore.userInfo?.user_metadata?.warehouse_code;
                if (authorizedDepot) {
                    query = query.eq('sender_warehouse_id', authorizedDepot);
                }
            }
            
            // Verileri çek
            const { data: faultyProductsData, error } = await query;
            
            if (error) {
                console.error('Arızalı ürün istatistikleri alınırken hata:', error);
                throw error;
            }
            
            // Son 7 günün tarihlerini oluştur
            const last7Days: Date[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                last7Days.push(date);
            }
            
            // Günlük bazda sayılar için diziler
            const currentWeekData = Array(7).fill(0);
            const lastWeekData = Array(7).fill(0);
            
            // Bu haftanın verilerini işle
            faultyProductsData?.forEach((faultyProduct) => {
                const sendDate = new Date(faultyProduct.send_date);
                sendDate.setHours(0, 0, 0, 0);
                
                for (let i = 0; i < 7; i++) {
                    const day = last7Days[i];
                    if (sendDate.getTime() === day.getTime()) {
                        currentWeekData[i]++;
                        break;
                    }
                }
            });
            
            return {
                currentWeek: currentWeekData,
                lastWeek: lastWeekData,
            };
            
        } catch (error) {
            console.error('Günlük arıza istatistikleri alınırken hata:', error);
            throw error;
        }
    }
};
