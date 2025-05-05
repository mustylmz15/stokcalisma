import { query, collection, getDocs, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/auth-store';
import type { FaultyProductRecord } from '@/stores/ariza-store';

// Arızaya gönderilen ürünlere ait servis
export default {
    /**
     * En son arızaya gönderilen ürünleri getirir
     * @param limitCount Kaç adet ürün getirileceği
     */    async getLatestFaultyProducts(limitCount = 5) {
        const authStore = useAuthStore();
        
        try {
            // En son gönderilen ürünleri getir (sendDate'e göre sırala)
            let faultyProductsQuery = query(
                collection(db, 'faultyProducts'),
                orderBy('sendDate', 'desc'),
                limit(limitCount)
            );
            
            // Eğer kullanıcı admin değilse, sadece kendi deposuna ait arızalı ürünleri göster
            if (!authStore.isAdmin) {
                const authorizedDepot = authStore.getAuthorizedDepot;
                if (authorizedDepot) {
                    faultyProductsQuery = query(
                        collection(db, 'faultyProducts'),
                        where('senderWarehouseId', '==', authorizedDepot),
                        orderBy('sendDate', 'desc'),
                        limit(limitCount)
                    );
                }
            }
            
            const snapshot = await getDocs(faultyProductsQuery);
            
            const faultyProducts: FaultyProductRecord[] = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data() as FaultyProductRecord;
                faultyProducts.push({
                    ...data,
                    id: doc.id,
                    // Tarih alanlarını JavaScript Date objelerine çevir
                    sendDate: data.sendDate instanceof Timestamp ? data.sendDate.toDate() : data.sendDate,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                    returnedAt: data.returnedAt instanceof Timestamp ? data.returnedAt.toDate() : data.returnedAt,
                });
            });
            
            return faultyProducts;
            
        } catch (error) {
            console.error('En son arızaya gönderilen ürünler alınırken hata:', error);
            throw error;
        }
    }
};
