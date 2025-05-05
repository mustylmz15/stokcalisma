import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from './auth-store';
import serializedInventoryService from '@/services/serializedInventoryService';

// Arızalı ürün kayıt tipi tanımı
export interface FaultyProductRecord {
    id?: string;
    productId: string;
    serialNumber: string;
    description: string;
    senderWarehouseId: string;
    serviceCenter: string;
    projectId: string;  // Ürünün hangi projede kullanıldığı bilgisi
    sendDate: Date | Timestamp;
    estimatedRepairTime: number;  // Gün cinsinden
    status: 'Gönderildi' | 'Serviste' | 'Onarılıyor' | 'Onarıldı' | 'İade Edildi' | 'İade Alındı';
    priority: 'Düşük' | 'Orta' | 'Yüksek';
    warrantyStatus: boolean;
    faultType: 'Donanımsal' | 'Yazılımsal' | 'Diğer';
    repairNotes?: string;
    returnNotes?: string;
    attachments?: string[];
    createdBy: string;
    updatedBy?: string;
    createdAt: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    returnedAt?: Date | Timestamp;
    estimatedCost?: number;
    actualCost?: number;
    trackingNumber?: string;
}

// Servis merkezi tipi tanımı
export interface ServiceCenter {
    id?: string;
    name: string;
    location: string;
    contactInfo: string;
    specialties: string[];  // Uzmanlaştığı ürün kategorileri
    createdBy: string;
    createdAt: Date | Timestamp;
}

// Arıza tipi tanımı
export interface FaultType {
    id?: string;
    code: string;
    description: string;
    estimatedRepairTime: number; // Gün cinsinden
    relatedCategories: string[]; // İlgili ürün kategorileri
    createdBy: string;
    createdAt: Date | Timestamp;
}

export const useArizaStore = defineStore('ariza', () => {
    const authStore = useAuthStore();
    
    // State
    const faultyProducts = ref<FaultyProductRecord[]>([]);
    const serviceCenters = ref<ServiceCenter[]>([]);
    const faultTypes = ref<FaultType[]>([]);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);
    
    // Getters
    const getFaultyProducts = computed(() => {
        // Eğer admin kullanıcısı ise tüm arızalı ürünleri göster
        if (authStore.isAdmin) {
            return faultyProducts.value;
        }
        
        // Depo sorumlusu ise sadece kendi deposuna ait arızalı ürünleri göster
        const authorizedDepot = authStore.getAuthorizedDepot;
        if (authorizedDepot) {
            return faultyProducts.value.filter(p => 
                p.senderWarehouseId === authorizedDepot
            );
        }
        
        return [];
    });
    
    const getServiceCenters = computed(() => serviceCenters.value);
    const getFaultTypes = computed(() => faultTypes.value);
    
    // Duruma göre arızalı ürünleri filtrele
    const getProductsByStatus = computed(() => (status: FaultyProductRecord['status']) => {
        return getFaultyProducts.value.filter(p => p.status === status);
    });
    
    // Projeye göre arızalı ürünleri filtrele
    const getProductsByProject = computed(() => (projectId: string) => {
        return getFaultyProducts.value.filter(p => p.projectId === projectId);
    });

    // Actions
    // Arızalı ürünleri Firebase'den yükle
    async function fetchFaultyProducts() {
        loading.value = true;
        error.value = null;
        
        try {
            const faultyProductsRef = collection(db, 'faultyProducts');
            const faultyProductsQuery = query(faultyProductsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(faultyProductsQuery);
            
            const products: FaultyProductRecord[] = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data() as FaultyProductRecord;
                products.push({
                    ...data,
                    id: doc.id,
                    // Tarih alanlarını JavaScript Date objelerine çevir
                    sendDate: data.sendDate instanceof Timestamp ? data.sendDate.toDate() : data.sendDate,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                    returnedAt: data.returnedAt instanceof Timestamp ? data.returnedAt.toDate() : data.returnedAt,
                });
            });
            
            faultyProducts.value = products;
        } catch (err) {
            console.error('Error fetching faulty products:', err);
            error.value = 'Arızalı ürünler yüklenirken bir hata oluştu';
        } finally {
            loading.value = false;
        }
    }
      // Servis merkezlerini Firebase'den yükle
    async function fetchServiceCenters() {
        loading.value = true;
        error.value = null;
        
        try {
            const serviceCentersRef = collection(db, 'serviceCenters');
            const querySnapshot = await getDocs(serviceCentersRef);
            
            const centers: ServiceCenter[] = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data() as ServiceCenter;
                centers.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                });
            });
            
            serviceCenters.value = centers;
        } catch (err) {
            console.error('Error fetching service centers:', err);
            error.value = 'Servis merkezleri yüklenirken bir hata oluştu';
        } finally {
            loading.value = false;
        }
    }
    
    
    // Arıza tiplerini Firebase'den yükle
    async function fetchFaultTypes() {
        loading.value = true;
        error.value = null;
        
        try {
            const faultTypesRef = collection(db, 'faultTypes');
            const querySnapshot = await getDocs(faultTypesRef);
            
            const types: FaultType[] = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data() as FaultType;
                types.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                });
            });
            
            faultTypes.value = types;
        } catch (err) {
            console.error('Error fetching fault types:', err);
            error.value = 'Arıza tipleri yüklenirken bir hata oluştu';
        } finally {
            loading.value = false;
        }
    }    // Yeni arızalı ürün kaydı ekle
    async function addFaultyProduct(product: Omit<FaultyProductRecord, 'id' | 'createdAt' | 'createdBy'>) {
        loading.value = true;
        error.value = null;
        
        try {
            // Seri numarası ve gönderen depo kontrolü - BU KOD ZORUNLU KONTROL YAPAR!
            if (!product.serialNumber || !product.senderWarehouseId) {
                console.error('Arızalı ürün kaydında seri numarası veya depo bilgisi eksik');
                error.value = 'Seri numarası ve gönderen depo gereklidir';
                return false;
            }
            
            console.log('STORE: Arıza kaydı oluşturulmadan önce seri numarası kontrolü yapılıyor', product.serialNumber);
            
            // SERİ NUMARASI KONTROLÜ - MUTLAKA YAPILMALIDIR!
            try {
                // SerializedInventoryService API'sini kullanarak seri numarası kontrolü
                const serialCheck = await serializedInventoryService.checkSerialNumberInWarehouse(
                    product.serialNumber, 
                    product.senderWarehouseId
                );
                
                console.log('STORE: Seri numarası kontrol sonucu:', serialCheck);
                
                // Eğer seri numarası hiç yoksa
                if (!serialCheck || serialCheck?.notInSystem) {
                    const errorMsg = serialCheck?.message || `"${product.serialNumber}" seri numarası sistemde kayıtlı değil!`;
                    console.error('STORE HATA: Arızalı ürün kaydı reddedildi - Seri numarası sistemde yok:', errorMsg);
                    error.value = errorMsg;
                    return false;
                }
                
                // Eğer seri numarası var ama seçilen depoda değilse
                if (!serialCheck.exists) {
                    const errorMsg = serialCheck.message || `Seri numaralı ürün seçilen depoda bulunmuyor.`;
                    console.error('STORE HATA: Arızalı ürün kaydı reddedildi - Seri numarası yanlış depoda:', errorMsg);
                    error.value = errorMsg;
                    return false;
                }
                
                // Bu noktada, seri numarası kontrolünü geçti
                console.log('STORE: Seri numarası kontrolü başarılı, arızalı ürün kaydı oluşturuluyor...');
                
            } catch (validationError) {
                console.error('STORE HATA: Seri numarası doğrulama hatası:', validationError);
                error.value = 'Seri numarası doğrulama sırasında bir hata oluştu: ' + ((validationError as Error)?.message || 'Bilinmeyen hata');
                return false;
            }
            
            const faultyProductsRef = collection(db, 'faultyProducts');
              const newProduct: Omit<FaultyProductRecord, 'id'> = {
                ...product,
                createdBy: authStore.userInfo?.id || '',
                createdAt: Timestamp.now(),
                status: 'Gönderildi',
            };
            
            const docRef = await setDoc(doc(faultyProductsRef), newProduct);
            
            // Yerel state'i güncelle
            await fetchFaultyProducts();
            
            return true;
        } catch (err) {
            console.error('Error adding faulty product:', err);
            error.value = 'Arızalı ürün kaydı eklenirken bir hata oluştu';
            return false;
        } finally {
            loading.value = false;
        }
    }
    
    // Arızalı ürün kaydını güncelle
    async function updateFaultyProduct(id: string, updates: Partial<FaultyProductRecord>) {
        loading.value = true;
        error.value = null;
        
        try {
            const productRef = doc(db, 'faultyProducts', id);
              const updatedData = {
                ...updates,
                updatedBy: authStore.userInfo?.id || '',
                updatedAt: Timestamp.now(),
            };
            
            await updateDoc(productRef, updatedData);
            
            // Yerel state'i güncelle
            await fetchFaultyProducts();
            
            return true;
        } catch (err) {
            console.error('Error updating faulty product:', err);
            error.value = 'Arızalı ürün kaydı güncellenirken bir hata oluştu';
            return false;
        } finally {
            loading.value = false;
        }
    }
    
    // Arızalı ürün kaydını sil
    async function deleteFaultyProduct(id: string) {
        loading.value = true;
        error.value = null;
        
        try {
            const productRef = doc(db, 'faultyProducts', id);
            await deleteDoc(productRef);
            
            // Yerel state'i güncelle
            faultyProducts.value = faultyProducts.value.filter(p => p.id !== id);
            
            return true;
        } catch (err) {
            console.error('Error deleting faulty product:', err);
            error.value = 'Arızalı ürün kaydı silinirken bir hata oluştu';
            return false;
        } finally {
            loading.value = false;
        }
    }
    
    // Ürün durumunu güncelle
    async function updateStatus(id: string, status: FaultyProductRecord['status'], notes?: string) {
        loading.value = true;
        error.value = null;
        
        try {
            const updates: Partial<FaultyProductRecord> = { status };
            
            if (notes) {
                if (status === 'İade Edildi' || status === 'İade Alındı') {
                    updates.returnNotes = notes;
                    updates.returnedAt = Timestamp.now();
                } else {
                    updates.repairNotes = notes;
                }
            }
            
            return await updateFaultyProduct(id, updates);
        } catch (err) {
            console.error('Error updating status:', err);
            error.value = 'Durum güncellenirken bir hata oluştu';
            return false;
        } finally {
            loading.value = false;
        }
    }
    
    // Yeni servis merkezi ekle
    async function addServiceCenter(serviceCenter: Omit<ServiceCenter, 'id' | 'createdAt' | 'createdBy'>) {
        loading.value = true;
        error.value = null;
        
        try {
            const serviceCentersRef = collection(db, 'serviceCenters');
            const newServiceCenter: Omit<ServiceCenter, 'id'> = {
                ...serviceCenter,
                createdBy: authStore.userInfo?.id || '',
                createdAt: Timestamp.now(),
            };
            
            await setDoc(doc(serviceCentersRef), newServiceCenter);
            
            // Yerel state'i güncelle
            await fetchServiceCenters();
            
            return true;
        } catch (err) {
            console.error('Error adding service center:', err);
            error.value = 'Servis merkezi eklenirken bir hata oluştu';
            return false;
        } finally {
            loading.value = false;
        }
    }
    
    // Tüm verileri başlatmak için kullanılan fonksiyon
    async function initializeStore() {
        try {
            // Tüm gereken verileri paralel olarak yükle
            await Promise.all([
                fetchFaultyProducts(),
                fetchServiceCenters(),
                fetchFaultTypes()
            ]);
            
            return true;
        } catch (error) {
            console.error('Arıza store verilerini başlatırken hata:', error);
            return false;
        }
    }
    
    return {
        // State
        faultyProducts,
        serviceCenters,
        faultTypes,
        loading,
        error,
        
        // Getters
        getFaultyProducts,
        getServiceCenters,
        getFaultTypes,
        getProductsByStatus,
        getProductsByProject,
        
        // Actions
        fetchFaultyProducts,
        fetchServiceCenters,
        fetchFaultTypes,
        addFaultyProduct,
        updateFaultyProduct,
        deleteFaultyProduct,
        updateStatus,
        addServiceCenter,
        initializeStore
    };
});
