// Seri numaralı ürün servisi
import { db } from '@/firebase';
import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';

// Seri numaralı ürün servis fonksiyonları
const serializedInventoryService = {
    // Seri numaralı ürün ekle
    async addSerializedItem(itemData) {
        try {            // Seri numarası kontrolü
            if (!itemData.serialNumber) {
                throw new Error('Seri numarası zorunludur');
            }
            
            // Seri numarasının benzersiz olduğunu daha sıkı kontrol et
            const serialQuery = query(
                collection(db, 'serializedItems'),
                where('serialNumber', '==', itemData.serialNumber)
            );
            const serialSnapshot = await getDocs(serialQuery);
            
            if (!serialSnapshot.empty) {
                // Mevcut kayıtları al
                const existingItems = serialSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const warehouseInfo = existingItems.map(item => {
                    return `Depo ID: ${item.warehouseId}`;
                }).join(", ");
                
                throw new Error(`Bu seri numarası (${itemData.serialNumber}) zaten kullanılıyor. Mevcut depolar: ${warehouseInfo}`);
            }
            
            // Ürün var mı kontrol et
            const productRef = doc(db, 'products', itemData.productId);
            const productDoc = await getDoc(productRef);
            
            if (!productDoc.exists()) {
                throw new Error(`Ürün bulunamadı (ID: ${itemData.productId})`);
            }
            
            // Ürün serialization'a uygun mu?
            const productData = productDoc.data();
            if (productData.hasSerialization === false) {
                throw new Error(`Bu ürün seri numaralı takip için uygun değil: ${productData.name}`);
            }
              // Yeni seri numaralı ürünü ekle
            const itemObject = {
                ...itemData,
                status: itemData.status || 'active',
                acquisitionDate: itemData.acquisitionDate || Timestamp.now(),
                lastUpdated: Timestamp.now(),
                createdAt: Timestamp.now()
            };
            
            const docRef = await addDoc(collection(db, 'serializedItems'), itemObject);
            
            // Aynı zamanda normal stok tablosunda da bu ürünün miktarını artır
            // Önce bu ürün ve depo için mevcut stok var mı kontrol et
            const stockQuery = query(
                collection(db, 'stocks'),
                where('productId', '==', itemData.productId),
                where('warehouseId', '==', itemData.warehouseId)
            );
            const stockSnapshot = await getDocs(stockQuery);
            
            if (stockSnapshot.empty) {
                // Bu ürün ve depo için stok kaydı yoksa yeni bir kayıt oluştur
                await addDoc(collection(db, 'stocks'), {
                    productId: itemData.productId,
                    warehouseId: itemData.warehouseId,
                    quantity: 1, // Seri numaralı ürünler birer adet olarak ekleniyor
                    lastUpdated: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
                console.log(`Yeni stok kaydı oluşturuldu: Ürün ${itemData.productId}, Depo ${itemData.warehouseId}`);
            } else {
                // Mevcut stok kaydını güncelle
                const stockDoc = stockSnapshot.docs[0];
                const currentStock = stockDoc.data().quantity || 0;
                
                await updateDoc(stockDoc.ref, {
                    quantity: currentStock + 1, // Stok miktarını 1 artır
                    lastUpdated: serverTimestamp()
                });
                console.log(`Stok miktarı güncellendi: Ürün ${itemData.productId}, Depo ${itemData.warehouseId}, Yeni miktar: ${currentStock + 1}`);
            }
            
            console.log(`Seri numaralı ürün eklendi: ${itemData.serialNumber}`);
            
            return {
                id: docRef.id,
                ...itemObject
            };
        } catch (error) {
            console.error('Seri numaralı ürün ekleme hatası:', error);
            throw error;
        }
    },    // Seri numarasına göre ürün getir (tüm eşleşen kayıtları döndürür)
    async getSerializedItemBySerialNumber(serialNumber) {
        try {
            const serialQuery = query(
                collection(db, 'serializedItems'),
                where('serialNumber', '==', serialNumber)
            );
            const serialSnapshot = await getDocs(serialQuery);
            
            if (serialSnapshot.empty) {
                return null; // Ürün bulunamadı
            }
            
            if (serialSnapshot.docs.length > 1) {
                console.warn(`DİKKAT: "${serialNumber}" seri numaralı ürün için ${serialSnapshot.docs.length} adet kayıt bulundu. Bu bir veri bütünlüğü sorunudur.`);
            }
            
            // Tüm eşleşen belgeler
            const items = serialSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Aynı seri numaralı birden fazla kayıt varsa, hepsini döndür
            if (items.length > 1) {
                return {
                    duplicateDetected: true,
                    items: items,
                    message: `DİKKAT: "${serialNumber}" seri numarası için birden fazla kayıt bulundu.`
                };
            }
            
            // Tek kayıt varsa, o kaydı döndür
            return items[0];
        } catch (error) {
            console.error('Seri numarası ile ürün getirme hatası:', error);
            throw error;
        }
    },    // Belirli bir seri numarasının belirli bir depoda olup olmadığını kontrol et
    async checkSerialNumberInWarehouse(serialNumber, warehouseId) {
        try {
            console.log(`SERVİS: checkSerialNumberInWarehouse çağrıldı - Seri No: ${serialNumber}, Depo ID: ${warehouseId}`);
            
            if (!serialNumber || !warehouseId) {
                console.warn('SERVİS: Geçersiz parametre - Seri numarası veya depo ID boş');
                return { exists: false, message: "Geçersiz seri numarası veya depo" };
            }
            
            // Önce seri numaralı ürünü bul
            const serialQuery = query(
                collection(db, 'serializedItems'),
                where('serialNumber', '==', serialNumber)
            );
            const serialSnapshot = await getDocs(serialQuery);
            console.log(`SERVİS: "${serialNumber}" için sorgu sonucu:`, serialSnapshot.empty ? 'Kayıt bulunamadı' : `${serialSnapshot.docs.length} kayıt bulundu`);
              if (serialSnapshot.empty) {
                // Bu çok önemli - seri numarası sistemde yoksa daha açık bir mesaj döndür
                console.warn(`SERVİS: "${serialNumber}" seri numaralı ürün sistemde bulunamadı - KRİTİK UYARI!!!`);
                // Daha detaylı bilgi içeren bir nesne döndür, null yerine böylece UI'da daha kullanışlı
                return {
                    exists: false,
                    notInSystem: true, // Seri numarasının hiç sistemde olmadığını belirten özel bir flag
                    message: `"${serialNumber}" seri numarası sistemde kayıtlı değil! Arızalı ürün girişi yapılamaz.`,
                    serialNumber: serialNumber
                };
            }
              // Birden fazla kayıt varsa, veri bütünlüğü sorunu var demektir
            if (serialSnapshot.docs.length > 1) {
                console.warn(`SERVİS: "${serialNumber}" seri numarası için birden fazla kayıt bulundu (${serialSnapshot.docs.length} adet) - VERİ TUTARSIZLIĞI!`);
                
                // Tüm eşleşen kayıtları al
                const items = serialSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Hangi depolarda olduğunu belirle
                const warehouses = items.map(item => item.warehouseId);
                console.log(`SERVİS: Çift kayıt durumu - Ürün şu depolarda bulunuyor:`, warehouses);
                
                // Seçilen depodaki kayıt var mı?
                const itemInRequestedWarehouse = items.find(item => item.warehouseId === warehouseId);
                
                if (itemInRequestedWarehouse) {
                    // Ürün istenen depoda ama başka depolarda da var
                    return { 
                        exists: true,
                        duplicateDetected: true,
                        message: `DİKKAT: Bu seri numarası için birden fazla kayıt mevcut. Seçilen depoda da var.`,
                        item: itemInRequestedWarehouse,
                        allItems: items,
                        warehouses: warehouses
                    };
                } else {
                    // Ürün istenen depoda değil ama başka depolarda var
                    return { 
                        exists: false,
                        duplicateDetected: true,
                        message: `DİKKAT: Bu seri numarası için birden fazla kayıt mevcut, ancak seçilen depoda değil.`,
                        allItems: items,
                        warehouses: warehouses
                    };
                }
            }
              // Tek kayıt varsa (normal durum)
            const item = {
                id: serialSnapshot.docs[0].id,
                ...serialSnapshot.docs[0].data()
            };
            
            console.log(`SERVİS: "${serialNumber}" seri numarası için tekil kayıt bulundu. Ürünün mevcut depo ID'si: ${item.warehouseId}`);
            
            // Ürünün depo bilgisini kontrol et
            if (item.warehouseId === warehouseId) {
                // Ürün istenen depoda
                console.log(`SERVİS: "${serialNumber}" seri numaralı ürün istenen depoda (${warehouseId}) bulundu. Doğrulama BAŞARILI.`);
                return { 
                    exists: true,
                    message: "Ürün belirtilen depoda bulundu",
                    item: item 
                };
            } else {
                // Ürün başka bir depoda
                console.warn(`SERVİS: "${serialNumber}" seri numaralı ürün istenen depoda (${warehouseId}) DEĞİL, ürün şu depoda: ${item.warehouseId}`);
                return { 
                    exists: false, 
                    message: "Bu seri numaralı ürün seçilen depoda bulunmuyor", 
                    item: item,
                    actualWarehouseId: item.warehouseId
                };
            }
        } catch (error) {
            console.error('Depo içinde seri numarası kontrolü hatası:', error);
            throw error;
        }
    },
    
    // Ürüne ait tüm seri numaralı ürünleri getir
    async getSerializedItemsByProduct(productId) {
        try {
            const serialQuery = query(
                collection(db, 'serializedItems'),
                where('productId', '==', productId)
            );
            const serialSnapshot = await getDocs(serialQuery);
            
            const items = [];
            serialSnapshot.forEach((doc) => {
                items.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return items;
        } catch (error) {
            console.error('Ürüne ait seri numaralı ürünleri getirme hatası:', error);
            throw error;
        }
    },
    
    // Depoya ait tüm seri numaralı ürünleri getir
    async getSerializedItemsByWarehouse(warehouseId) {
        try {
            const serialQuery = query(
                collection(db, 'serializedItems'),
                where('warehouseId', '==', warehouseId)
            );
            const serialSnapshot = await getDocs(serialQuery);
            
            const items = [];
            serialSnapshot.forEach((doc) => {
                items.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return items;
        } catch (error) {
            console.error('Depoya ait seri numaralı ürünleri getirme hatası:', error);
            throw error;
        }
    },
    
    // Seri numaralı ürün durumunu güncelle
    async updateSerializedItemStatus(serialNumber, status, notes = '') {
        try {
            // Önce ürünü bul
            const item = await this.getSerializedItemBySerialNumber(serialNumber);
            
            if (!item) {
                throw new Error(`Bu seri numaralı ürün bulunamadı: ${serialNumber}`);
            }
            
            // Durum güncelleme
            const itemRef = doc(db, 'serializedItems', item.id);
            const updateData = {
                status,
                lastUpdated: Timestamp.now()
            };
            
            if (notes) {
                updateData.notes = notes;
            }
            
            await updateDoc(itemRef, updateData);
            
            console.log(`${serialNumber} seri numaralı ürünün durumu güncellendi: ${status}`);
            
            return {
                ...item,
                ...updateData
            };
        } catch (error) {
            console.error('Seri numaralı ürün durum güncelleme hatası:', error);
            throw error;
        }
    },
    
    // Seri numaralı ürünü depolar arası transfer et
    async transferSerializedItem(serialNumber, targetWarehouseId, notes = '') {
        try {
            // Önce ürünü bul
            const item = await this.getSerializedItemBySerialNumber(serialNumber);
            
            if (!item) {
                throw new Error(`Bu seri numaralı ürün bulunamadı: ${serialNumber}`);
            }
            
            // Eğer ürün zaten hedef depoda ise hata ver
            if (item.warehouseId === targetWarehouseId) {
                throw new Error(`Ürün zaten bu depoda: ${targetWarehouseId}`);
            }
            
            // Kaynak depoyu kaydet
            const sourceWarehouseId = item.warehouseId;
            
            // Depo güncelleme
            const itemRef = doc(db, 'serializedItems', item.id);
            const updateData = {
                warehouseId: targetWarehouseId,
                lastUpdated: Timestamp.now()
            };
            
            if (notes) {
                updateData.notes = (item.notes ? item.notes + ' | ' : '') + notes;
            }
            
            await updateDoc(itemRef, updateData);
            
            // Hareket kaydı oluştur
            const movementData = {
                type: 'transfer',
                productId: item.productId,
                quantity: 1,
                sourceWarehouseId,
                targetWarehouseId,
                date: Timestamp.now(),
                description: `Seri no: ${serialNumber} transferi - ${notes}`,
                serialNumbers: [serialNumber],
                isSerialized: true,
                createdAt: Timestamp.now()
            };
            
            // movements koleksiyonuna hareket kaydı ekle
            await addDoc(collection(db, 'movements'), movementData);
            
            console.log(`${serialNumber} seri numaralı ürün ${sourceWarehouseId} deposundan ${targetWarehouseId} deposuna transfer edildi`);
            
            return {
                ...item,
                ...updateData
            };
        } catch (error) {
            console.error('Seri numaralı ürün transfer hatası:', error);
            throw error;
        }
    },
    
    // Tüm seri numaralı ürünleri getir
    async getAllSerializedItems() {
        try {
            const serialSnapshot = await getDocs(collection(db, 'serializedItems'));
            
            const items = [];
            serialSnapshot.forEach((doc) => {
                items.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return items;
        } catch (error) {
            console.error('Tüm seri numaralı ürünleri getirme hatası:', error);
            throw error;
        }
    },
    
    // Seri numaralı ürünü sil
    async deleteSerializedItem(id) {
        try {
            await deleteDoc(doc(db, 'serializedItems', id));
            console.log(`Seri numaralı ürün silindi: ${id}`);
            return true;
        } catch (error) {
            console.error('Seri numaralı ürün silme hatası:', error);
            throw error;        }
    }
};

export default serializedInventoryService;
