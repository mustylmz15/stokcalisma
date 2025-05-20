import { query, collection, getDocs, orderBy, limit, Timestamp, where, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
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
    },

    /**
     * Arıza tiplerini getirir
     * @returns Arıza tipleri listesi
     */
    async getFaultTypes() {
        try {
            const q = query(collection(db, 'faultTypes'), orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            
            const types: Array<{id: string, description: string, order: number}> = [];
            snapshot.forEach((doc) => {
                types.push({
                    id: doc.id,
                    ...doc.data() as {description: string, order: number}
                });
            });
            
            return types;
        } catch (error) {
            console.error('Arıza tipleri alınırken hata oluştu:', error);
            throw error;
        }
    },

    /**
     * Arızalı ürün raporu oluşturur
     * @param report Arıza raporu verileri
     * @returns Oluşturulan arıza raporu ID'si
     */
    async createFaultyProductReport(report: any) {
        try {
            // Raporu firebase'e ekleyelim
            const docRef = await addDoc(collection(db, 'faultyProducts'), {
                ...report,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Arıza raporu oluşturulurken hata:', error);
            throw error;
        }
    },

    /**
     * Arızalı ürünü onarım merkezine gönderir
     * @param data Onarım merkezi gönderim verileri
     * @returns Oluşturulan gönderim kaydı ID'si
     */
    async sendToRepairCenter(data: any) {
        try {
            // Onarım merkezi gönderimini kaydet
            const docRef = await addDoc(collection(db, 'repairCenterRequests'), {
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Onarım merkezine gönderimde hata:', error);
            throw error;
        }
    },
    
    /**
     * Projeye ait arızalı ürünleri getirir
     * @param projectId Proje ID'si
     * @returns Arızalı ürünler listesi
     */
    async getProjectFaultyProducts(projectId: string) {
        try {
            const q = query(
                collection(db, 'faultyProducts'),
                where('projectId', '==', projectId),
                orderBy('reportDate', 'desc')
            );
            
            const snapshot = await getDocs(q);
            
            const faultyProducts: Array<FaultyProductRecord & {id: string}> = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                faultyProducts.push({
                    id: doc.id,
                    ...data as FaultyProductRecord
                });
            });
            
            return faultyProducts;
        } catch (error) {
            console.error('Projeye ait arızalı ürünler alınırken hata:', error);
            throw error;
        }
    }
}
