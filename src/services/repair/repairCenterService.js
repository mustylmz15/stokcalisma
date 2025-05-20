import { useAuthStore } from '@/stores/auth-store';
/**
 * Onarım Merkezi Servis Sınıfı
 * --------------------------------------------------
 * İleride Onarım Merkezi Sorumlusunun aşağıdaki işlemleri yapabilmesi için
 * gerekli fonksiyonlar bu sınıfta yer alacaktır:
 *
 * 1. Arızalı ürünleri teslim alma (onay/red mekanizması)
 * 2. Gelen ürün için QR kod oluşturma ve yazdırma
 * 3. QR kod okutarak ürün detaylarını görüntüleme
 * 4. Onarım işlemlerini (sökülen/takılan parçalar) kaydetme
 * 5. Onarılan ürünleri ilgili depolara geri gönderme
 */
class RepairCenterService {
    collectionName = 'faultyProducts';
    /**
     * Onarım merkezine gelen arızalı ürünleri getirir
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async getIncomingRepairItems() {
        try {
            const authStore = useAuthStore();
            // Boş array döndür - şu an için pasif
            return [];
            /* İleride aktifleştirilecek kod:
            // Admin tüm onarım merkezlerine erişebilir
            if (authStore.isAdmin) {
                const allItems = query(
                    collection(db, this.collectionName),
                    where('status', '==', 'sent_to_repair'),
                    orderBy('sentToRepairDate', 'desc')
                );
                
                const snapshot = await getDocs(allItems);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FaultyProduct));
            }
            
            // Onarım merkezi sorumlusu sadece kendi merkezine gelen ürünleri görebilir
            if (authStore.isRepairCenterManager) {
                // Kullanıcının onarım merkezi ID'sini al (userInfo'dan veya başka bir kaynaktan)
                const repairCenterId = authStore.userInfo?.depot; // veya başka bir kaynaktan
                
                if (!repairCenterId) {
                    console.error('Kullanıcının onarım merkezi bilgisi bulunamadı');
                    return [];
                }
                
                const userItems = query(
                    collection(db, this.collectionName),
                    where('repairCenterId', '==', repairCenterId),
                    where('status', '==', 'sent_to_repair'),
                    orderBy('sentToRepairDate', 'desc')
                );
                
                const snapshot = await getDocs(userItems);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FaultyProduct));
            }
            
            return []; // Diğer roller için boş array
            */
        }
        catch (error) {
            console.error('Arızalı ürünler getirilirken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * Arızalı ürünü teslim alma (onaylama)
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async receiveRepairItem(itemId, notes) {
        try {
            // Şimdilik sadece true döndür - gerçek işlevsellik ileride eklenecek
            return true;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü
            if (!authStore.canManageIncomingRepairItems) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Ürünü kontrol et
            const itemRef = doc(db, this.collectionName, itemId);
            const itemSnap = await getDoc(itemRef);
            
            if (!itemSnap.exists()) {
                throw new Error('Arızalı ürün bulunamadı');
            }
            
            const itemData = itemSnap.data() as FaultyProduct;
            
            // Sadece "sent_to_repair" durumundaki ürünler onaylanabilir
            if (itemData.status !== 'sent_to_repair') {
                throw new Error('Bu ürün onaylanabilir durumda değil');
            }
            
            // Ürünü güncelle
            await updateDoc(itemRef, {
                status: 'received_by_repair',
                receivedByRepairDate: timestamp,
                notes: notes ? `${itemData.notes || ''}\n${notes}` : itemData.notes,
                updatedAt: timestamp,
                updatedBy: authStore.userInfo?.name || ''
            });
            
            return true;
            */
        }
        catch (error) {
            console.error('Arızalı ürün teslim alınırken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * Arızalı ürünü reddetme
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async rejectRepairItem(itemId, rejectionReason) {
        try {
            // Şimdilik sadece true döndür - gerçek işlevsellik ileride eklenecek
            return true;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü
            if (!authStore.canManageIncomingRepairItems) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Ürünü kontrol et
            const itemRef = doc(db, this.collectionName, itemId);
            const itemSnap = await getDoc(itemRef);
            
            if (!itemSnap.exists()) {
                throw new Error('Arızalı ürün bulunamadı');
            }
            
            const itemData = itemSnap.data() as FaultyProduct;
            
            // Sadece "sent_to_repair" durumundaki ürünler reddedilebilir
            if (itemData.status !== 'sent_to_repair') {
                throw new Error('Bu ürün reddedilebilir durumda değil');
            }
            
            // Ürünü güncelle
            await updateDoc(itemRef, {
                status: 'rejected_by_repair',
                notes: `${itemData.notes || ''}\nRed sebebi: ${rejectionReason}`,
                updatedAt: timestamp,
                updatedBy: authStore.userInfo?.name || ''
            });
            
            return true;
            */
        }
        catch (error) {
            console.error('Arızalı ürün reddedilirken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * Arızalı ürün için QR kod oluşturma
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async generateQRCodeForItem(itemId) {
        try {
            // Şimdilik örnek bir QR kod değeri döndür - gerçek işlevsellik ileride eklenecek
            return `REPAIR-${itemId}-${Date.now()}`;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            
            // Yetki kontrolü
            if (!authStore.canGenerateRepairQRCodes) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Ürünü kontrol et
            const itemRef = doc(db, this.collectionName, itemId);
            const itemSnap = await getDoc(itemRef);
            
            if (!itemSnap.exists()) {
                throw new Error('Arızalı ürün bulunamadı');
            }
            
            // QR kod değeri oluştur (örnek bir format)
            const qrValue = `REPAIR-${itemId}-${Date.now()}`;
            
            // QR kodu ürün bilgisine kaydet
            await updateDoc(itemRef, {
                qrCode: qrValue,
                updatedAt: new Date().toISOString(),
                updatedBy: authStore.userInfo?.name || ''
            });
            
            return qrValue;
            */
        }
        catch (error) {
            console.error('QR kod oluşturulurken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * QR kod değeri ile ürün detaylarını getirme
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async getItemDetailsByQR(qrCode) {
        try {
            // Şimdilik null döndür - gerçek işlevsellik ileride eklenecek
            return null;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            
            // Yetki kontrolü
            if (!authStore.canViewRepairDetailsWithQR) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // QR koda göre ürünü sorgula
            const q = query(
                collection(db, this.collectionName),
                where('qrCode', '==', qrCode)
            );
            
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return null;
            }
            
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            } as FaultyProduct;
            */
        }
        catch (error) {
            console.error('Ürün detayları getirilirken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * Onarım işlemlerini kaydetme (sökülen/takılan parçalar)
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async recordRepairOperation(itemId, repairNotes, replacedParts) {
        try {
            // Şimdilik sadece true döndür - gerçek işlevsellik ileride eklenecek
            return true;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü
            if (!authStore.canRecordRepairOperations) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Ürünü kontrol et
            const itemRef = doc(db, this.collectionName, itemId);
            const itemSnap = await getDoc(itemRef);
            
            if (!itemSnap.exists()) {
                throw new Error('Arızalı ürün bulunamadı');
            }
            
            const itemData = itemSnap.data() as FaultyProduct;
            
            // Ürün durumunu kontrol et (sadece onaylanmış ürünlere işlem yapılabilir)
            if (itemData.status !== 'received_by_repair' && itemData.status !== 'in_repair') {
                throw new Error('Bu ürün için onarım işlemi yapılamaz');
            }
            
            // Ürünü güncelle
            await updateDoc(itemRef, {
                status: 'in_repair',
                repairStartDate: itemData.repairStartDate || timestamp, // İlk kayıt ise başlangıç tarihi ekle
                repairNotes: repairNotes,
                replacedParts: replacedParts,
                updatedAt: timestamp,
                updatedBy: authStore.userInfo?.name || ''
            });
            
            return true;
            */
        }
        catch (error) {
            console.error('Onarım işlemi kaydedilirken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * Onarımı tamamlama
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async completeRepair(itemId, finalNotes) {
        try {
            // Şimdilik sadece true döndür - gerçek işlevsellik ileride eklenecek
            return true;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü
            if (!authStore.canRecordRepairOperations) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Ürünü kontrol et
            const itemRef = doc(db, this.collectionName, itemId);
            const itemSnap = await getDoc(itemRef);
            
            if (!itemSnap.exists()) {
                throw new Error('Arızalı ürün bulunamadı');
            }
            
            const itemData = itemSnap.data() as FaultyProduct;
            
            // Ürün durumunu kontrol et (sadece onarımda olan ürünler tamamlanabilir)
            if (itemData.status !== 'in_repair') {
                throw new Error('Bu ürün için onarım tamamlama işlemi yapılamaz');
            }
            
            // Ürünü güncelle
            await updateDoc(itemRef, {
                status: 'repair_completed',
                repairCompletedDate: timestamp,
                repairNotes: finalNotes ? `${itemData.repairNotes || ''}\n${finalNotes}` : itemData.repairNotes,
                updatedAt: timestamp,
                updatedBy: authStore.userInfo?.name || ''
            });
            
            return true;
            */
        }
        catch (error) {
            console.error('Onarım tamamlama işlemi yapılırken hata oluştu:', error);
            throw error;
        }
    }
    /**
     * Onarılan ürünü ilgili depoya geri gönderme
     *
     * NOT: Bu fonksiyon şu an için pasif durumdadır ve ileride gerçeklenecektir.
     */
    async sendRepairedItemBack(itemId, trackingNumber, shippingNotes) {
        try {
            // Şimdilik sadece true döndür - gerçek işlevsellik ileride eklenecek
            return true;
            /* İleride aktifleştirilecek kod:
            const authStore = useAuthStore();
            const timestamp = new Date().toISOString();
            
            // Yetki kontrolü
            if (!authStore.canSendRepairedItemsBack) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
            }
            
            // Ürünü kontrol et
            const itemRef = doc(db, this.collectionName, itemId);
            const itemSnap = await getDoc(itemRef);
            
            if (!itemSnap.exists()) {
                throw new Error('Arızalı ürün bulunamadı');
            }
            
            const itemData = itemSnap.data() as FaultyProduct;
            
            // Ürün durumunu kontrol et (sadece onarımı tamamlanmış ürünler gönderilebilir)
            if (itemData.status !== 'repair_completed') {
                throw new Error('Bu ürün için geri gönderme işlemi yapılamaz');
            }
            
            // Ürünü güncelle
            await updateDoc(itemRef, {
                status: 'sent_back',
                sentBackDate: timestamp,
                notes: shippingNotes ? `${itemData.notes || ''}\nSevkiyat notu: ${shippingNotes}` : itemData.notes,
                trackingNumber: trackingNumber || '',
                updatedAt: timestamp,
                updatedBy: authStore.userInfo?.name || ''
            });
            
            // Onarılan ürünler tablosuna ekle
            await addDoc(collection(db, 'repairedItems'), {
                originalItemId: itemId,
                productId: itemData.productId,
                productName: itemData.productName,
                serialNumber: itemData.serialNumber || '',
                projectId: itemData.projectId,
                warehouseId: itemData.warehouseId, // Geri gönderilecek depo
                repairCenterId: itemData.repairCenterId,
                repairCompletedDate: itemData.repairCompletedDate,
                status: 'in_transit',
                trackingNumber: trackingNumber || '',
                sentDate: timestamp,
                notes: shippingNotes || '',
                repairNotes: itemData.repairNotes || '',
                replacedParts: itemData.replacedParts || [],
                createdAt: timestamp,
                updatedAt: timestamp
            });
            
            return true;
            */
        }
        catch (error) {
            console.error('Onarılan ürün geri gönderilirken hata oluştu:', error);
            throw error;
        }
    }
}
export default new RepairCenterService();
//# sourceMappingURL=repairCenterService.js.map