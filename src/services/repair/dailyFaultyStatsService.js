import { query, collection, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/auth-store';
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
            // Firebase sorgusu için tarih formatları
            const todayTimestamp = Timestamp.fromDate(today);
            const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
            // Bu hafta sorgusu
            let currentWeekQuery = query(collection(db, 'faultyProducts'), where('sendDate', '>=', sevenDaysAgoTimestamp), where('sendDate', '<', todayTimestamp), orderBy('sendDate', 'asc'));
            // Eğer kullanıcı admin değilse, sadece kendi deposuna ait arızalı ürünleri göster
            if (!authStore.isAdmin) {
                const authorizedDepot = authStore.getAuthorizedDepot;
                if (authorizedDepot) {
                    currentWeekQuery = query(collection(db, 'faultyProducts'), where('sendDate', '>=', sevenDaysAgoTimestamp), where('sendDate', '<', todayTimestamp), where('senderWarehouseId', '==', authorizedDepot), orderBy('sendDate', 'asc'));
                }
            }
            // Bu hafta verilerini çek
            const currentWeekSnapshot = await getDocs(currentWeekQuery);
            // Son 7 günün tarihlerini oluştur
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                last7Days.push(date);
            }
            // Günlük bazda sayılar için diziler
            const currentWeekData = Array(7).fill(0);
            const lastWeekData = Array(7).fill(0);
            // Bu haftanın verilerini işle
            currentWeekSnapshot.forEach((doc) => {
                const faultyProduct = { id: doc.id, ...doc.data() };
                const sendDate = faultyProduct.sendDate.toDate();
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
        }
        catch (error) {
            console.error('Günlük arıza istatistikleri alınırken hata:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=dailyFaultyStatsService.js.map