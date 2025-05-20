import { collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/auth-store';

/**
 * IT Cihazları Servis Modülü
 * --------------------------------------------------
 * Bu servis Proje IT Sorumlusu için gerekli işlevleri içerecektir.
 * Şu an için pasif durumdadır ve ilerideki geliştirmeler için bir taslak niteliğindedir.
 */

export interface ITDevice {
    id?: string;
    deviceType: string;           // Cihaz tipi (Bilgisayar, Yazıcı, Tarayıcı vb.)
    brand: string;                // Marka
    model: string;                // Model
    serialNumber: string;         // Seri Numarası
    inventoryNumber?: string;     // Envanter Numarası
    status: 'active' | 'inactive' | 'repair' | 'archived'; // Cihaz durumu
    assignedTo?: string;          // Kime atandı (kullanıcı ID)
    assignedToName?: string;      // Kime atandı (kullanıcı adı)
    location: string;             // Konum/Ofis
    purchaseDate?: string;        // Satın alma tarihi
    warranty?: string;            // Garanti süresi
    notes?: string;               // Notlar
    projectId: string;            // Proje ID'si
    responsibleUserId: string;    // Sorumlu IT personeli ID'si
    responsibleUserName: string;  // Sorumlu IT personeli adı
    createdAt: string;            // Oluşturulma tarihi
    updatedAt?: string;           // Güncellenme tarihi
}

/**
 * IT Cihaz Servis Sınıfı
 * --------------------------------------------------
 * İleride Proje IT Sorumlusunun kendi sorumluluğundaki cihazları
 * görüntüleyebilmesi, yönetebilmesi ve onarım talepleri oluşturabilmesi için
 * gerekli fonksiyonlar bu sınıfta yer alacaktır.
 */

class ITDeviceService {
    private readonly collectionName = 'itDevices';
    
    /**
     * Kullanıcının sorumluluğundaki IT cihazlarını getirir
     * 
     * Proje IT Sorumlusu kendine atanmış cihazları görüntüleyebilecek
     * Admin ve Proje Admin tüm cihazlara erişebilecek
     * 
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async getUserITDevices(): Promise<ITDevice[]> {
        try {
            const authStore = useAuthStore();
            
            // Boş array döndür - şu an için pasif
            return [];
            
            /* İleride aktifleştirilecek kod:
            // Admin ve Proje Admin tüm cihazları görebilir
            if (authStore.isAdmin || authStore.isProjectAdmin) {
                const allDevices = query(
                    collection(db, this.collectionName),
                    orderBy('createdAt', 'desc')
                );
                
                const snapshot = await getDocs(allDevices);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ITDevice));
            }
            
            // IT Sorumlusu sadece kendisine atanmış cihazları görebilir
            if (authStore.isProjectITManager) {
                const userDevices = query(
                    collection(db, this.collectionName),
                    where('responsibleUserId', '==', authStore.userInfo?.id),
                    orderBy('createdAt', 'desc')
                );
                
                const snapshot = await getDocs(userDevices);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ITDevice));
            }
            
            return []; // Diğer roller için boş array
            */
        } catch (error) {
            console.error('IT cihazları getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    /**
     * Cihaz ekleme fonksiyonu
     * 
     * Proje IT Sorumlusu yeni cihaz ekleyebilecek
     * 
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async addITDevice(device: ITDevice): Promise<ITDevice> {
        try {
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü - şu an için yalnızca admin ve proje admin izinli
            if (!authStore.isAdmin && !authStore.isProjectAdmin && !authStore.isProjectITManager) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Cihaz verilerini hazırla
            const newDevice = {
                ...device,
                createdAt: timestamp,
                updatedAt: timestamp,
                // Eğer sorumluluk belirtilmemişse, ekleyen kullanıcı sorumlu olur
                responsibleUserId: device.responsibleUserId || authStore.userInfo?.id || '',
                responsibleUserName: device.responsibleUserName || authStore.userInfo?.name || '',
            };
            
            // Şimdilik yalnızca bir nesne döndür - gerçek işlevsellik ileride eklenecek
            return {
                id: 'sample-id',
                ...newDevice
            };
            
            /* İleride aktifleştirilecek kod:
            const docRef = await addDoc(collection(db, this.collectionName), newDevice);
            
            return {
                id: docRef.id,
                ...newDevice
            };
            */
        } catch (error) {
            console.error('IT cihazı eklenirken hata oluştu:', error);
            throw error;
        }
    }
    
    /**
     * Cihaz onarım talebi oluşturma
     * 
     * Proje IT Sorumlusu sorumluluğundaki cihazlar için onarım talebi oluşturabilecek
     * 
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async createDeviceRepairRequest(deviceId: string, description: string): Promise<boolean> {
        try {
            // Şimdilik sadece true döndür - gerçek işlevsellik ileride eklenecek
            return true;
            
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü
            if (!authStore.canCreateITDeviceRepairRequests) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Cihazı kontrol et
            const deviceRef = doc(db, this.collectionName, deviceId);
            const deviceSnap = await getDoc(deviceRef);
            
            if (!deviceSnap.exists()) {
                throw new Error('Cihaz bulunamadı');
            }
            
            const deviceData = deviceSnap.data() as ITDevice;
            
            // IT Sorumlusu yalnızca kendi sorumluluğundaki cihazlar için onarım talebi oluşturabilir
            if (authStore.isProjectITManager && 
                !authStore.isAdmin && 
                !authStore.isProjectAdmin &&
                deviceData.responsibleUserId !== authStore.userInfo?.id) {
                throw new Error('Bu cihaz için onarım talebi oluşturma yetkiniz bulunmamaktadır');
            }
            
            // Onarım talebi oluştur
            await addDoc(collection(db, 'itRepairRequests'), {
                deviceId,
                deviceType: deviceData.deviceType,
                deviceModel: deviceData.model,
                serialNumber: deviceData.serialNumber,
                description,
                status: 'requested',
                requesterId: authStore.userInfo?.id,
                requesterName: authStore.userInfo?.name,
                projectId: deviceData.projectId,
                requestDate: timestamp,
                updatedAt: timestamp
            });
            
            // Cihaz durumunu güncelle
            await updateDoc(deviceRef, {
                status: 'repair',
                updatedAt: timestamp
            });
            
            return true;
            */
        } catch (error) {
            console.error('Cihaz onarım talebi oluşturulurken hata oluştu:', error);
            throw error;
        }
    }
}

export default new ITDeviceService();
