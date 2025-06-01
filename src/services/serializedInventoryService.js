// Seri numaralı ürün servisi
import { supabase } from '@/lib/supabaseClient';

// Seri numaralı ürün servis fonksiyonları
const serializedInventoryService = {
    // Seri numaralı ürün ekle
    async addSerializedItem(itemData) {
        try {
            // Seri numarası kontrolü
            if (!itemData.serialNumber) {
                throw new Error('Seri numarası zorunludur');
            }
            
            // Seri numarasının benzersiz olduğunu kontrol et
            const { data: existingItems, error: checkError } = await supabase
                .from('serialized_items')
                .select('id, warehouse_id')
                .eq('serial_number', itemData.serialNumber);
            
            if (checkError) {
                throw new Error(`Seri numarası kontrolü sırasında hata: ${checkError.message}`);
            }
            
            if (existingItems && existingItems.length > 0) {
                const warehouseInfo = existingItems.map(item => {
                    return `Depo ID: ${item.warehouse_id}`;
                }).join(", ");
                
                throw new Error(`Bu seri numarası (${itemData.serialNumber}) zaten kullanılıyor. Mevcut depolar: ${warehouseInfo}`);
            }
            
            // Ürün var mı kontrol et
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', itemData.productId)
                .single();
            
            if (productError) {
                throw new Error(`Ürün bulunamadı: ${productError.message}`);
            }
            
            if (!productData) {
                throw new Error(`Ürün bulunamadı: ID=${itemData.productId}`);
            }
            
            // Şimdi/tarih alanlarını oluştur
            const now = new Date().toISOString();
            
            // Seri numaralı ürün nesnesini oluştur (snake_case kullanarak)
            const serializedItemObject = {
                product_id: itemData.productId,
                serial_number: itemData.serialNumber,
                warehouse_id: itemData.warehouseId,
                status: itemData.status || 'active',
                notes: itemData.notes || null,
                created_at: now,
                updated_at: now,
                created_by: itemData.createdBy || null,
                // Diğer camelCase -> snake_case dönüşümleri
            };
            
            // Veriyi ekle
            const { data: newItem, error: insertError } = await supabase
                .from('serialized_items')
                .insert(serializedItemObject)
                .select()
                .single();
            
            if (insertError) {
                throw new Error(`Seri numaralı ürün eklenirken hata: ${insertError.message}`);
            }
            
            // Verileri camelCase'e çevirip döndür
            return {
                id: newItem.id,
                productId: newItem.product_id,
                serialNumber: newItem.serial_number,
                warehouseId: newItem.warehouse_id,
                status: newItem.status,
                notes: newItem.notes,
                createdAt: newItem.created_at,
                updatedAt: newItem.updated_at,
                createdBy: newItem.created_by,
                // Diğer snake_case -> camelCase dönüşümleri
            };
        } catch (error) {
            console.error('Seri numaralı ürün eklenirken hata:', error);
            throw error;
        }
    },

    // Seri numarasına göre ürün getir (tüm eşleşen kayıtları döndürür)
    async getSerializedItemBySerialNumber(serialNumber) {
        try {
            const { data: items, error } = await supabase
                .from('serialized_items')
                .select('*')
                .eq('serial_number', serialNumber);
            
            if (error) {
                throw new Error(`Seri numarası ile ürün getirilirken hata: ${error.message}`);
            }
            
            if (!items || items.length === 0) {
                return null; // Ürün bulunamadı
            }
            
            if (items.length > 1) {
                console.warn(`DİKKAT: "${serialNumber}" seri numaralı ürün için birden fazla kayıt bulundu. Bu bir veri bütünlüğü sorunudur.`);
            }
            
            // Tek kayıt varsa, o kaydı döndür
            return {
                id: items[0].id,
                productId: items[0].product_id,
                serialNumber: items[0].serial_number,
                warehouseId: items[0].warehouse_id,
                status: items[0].status,
                notes: items[0].notes,
                createdAt: items[0].created_at,
                updatedAt: items[0].updated_at,
                createdBy: items[0].created_by,
            };
        } catch (error) {
            console.error('Seri numarası ile ürün getirme hatası:', error);
            throw error;
        }
    },

    // Belirli bir seri numarasının belirli bir depoda olup olmadığını kontrol et
    async checkSerialNumberInWarehouse(serialNumber, warehouseId) {
        try {
            console.log(`SERVİS: checkSerialNumberInWarehouse çağrıldı - Seri No: ${serialNumber}, Depo ID: ${warehouseId}`);
            
            if (!serialNumber || !warehouseId) {
                console.warn('SERVİS: Geçersiz parametre - Seri numarası veya depo ID boş');
                return { exists: false, message: "Geçersiz seri numarası veya depo" };
            }
            
            // Önce seri numaralı ürünü bul
            const { data: items, error } = await supabase
                .from('serialized_items')
                .select('*')
                .eq('serial_number', serialNumber);
            
            console.log(`SERVİS: "${serialNumber}" için sorgu sonucu:`, items.length === 0 ? 'Kayıt bulunamadı' : `${items.length} kayıt bulundu`);
            
            if (items.length === 0) {
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
            if (items.length > 1) {
                console.warn(`SERVİS: "${serialNumber}" seri numarası için birden fazla kayıt bulundu (${items.length} adet) - VERİ TUTARSIZLIĞI!`);
                
                // Hangi depolarda olduğunu belirle
                const warehouses = items.map(item => item.warehouse_id);
                console.log(`SERVİS: Çift kayıt durumu - Ürün şu depolarda bulunuyor:`, warehouses);
                
                // Seçilen depodaki kayıt var mı?
                const itemInRequestedWarehouse = items.find(item => item.warehouse_id === warehouseId);
                
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
                id: items[0].id,
                productId: items[0].product_id,
                serialNumber: items[0].serial_number,
                warehouseId: items[0].warehouse_id,
                status: items[0].status,
                notes: items[0].notes,
                createdAt: items[0].created_at,
                updatedAt: items[0].updated_at,
                createdBy: items[0].created_by,
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
            const { data: items, error } = await supabase
                .from('serialized_items')
                .select('*')
                .eq('product_id', productId);
            
            if (error) {
                throw new Error(`Ürüne ait seri numaralı ürünleri getirme hatası: ${error.message}`);
            }
            
            return items.map(item => ({
                id: item.id,
                productId: item.product_id,
                serialNumber: item.serial_number,
                warehouseId: item.warehouse_id,
                status: item.status,
                notes: item.notes,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                createdBy: item.created_by,
            }));
        } catch (error) {
            console.error('Ürüne ait seri numaralı ürünleri getirme hatası:', error);
            throw error;
        }
    },
    
    // Depoya ait tüm seri numaralı ürünleri getir
    async getSerializedItemsByWarehouse(warehouseId) {
        try {
            const { data: items, error } = await supabase
                .from('serialized_items')
                .select('*')
                .eq('warehouse_id', warehouseId);
            
            if (error) {
                throw new Error(`Depoya ait seri numaralı ürünleri getirme hatası: ${error.message}`);
            }
            
            return items.map(item => ({
                id: item.id,
                productId: item.product_id,
                serialNumber: item.serial_number,
                warehouseId: item.warehouse_id,
                status: item.status,
                notes: item.notes,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                createdBy: item.created_by,
            }));
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
            const { data: updatedItem, error } = await supabase
                .from('serialized_items')
                .update({
                    status,
                    notes: notes ? (item.notes ? item.notes + ' | ' + notes : notes) : item.notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', item.id)
                .select()
                .single();
            
            if (error) {
                throw new Error(`Seri numaralı ürün durumu güncellenirken hata: ${error.message}`);
            }
            
            console.log(`${serialNumber} seri numaralı ürünün durumu güncellendi: ${status}`);
            
            return {
                ...item,
                status: updatedItem.status,
                notes: updatedItem.notes,
                updatedAt: updatedItem.updated_at,
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
            const { data: updatedItem, error } = await supabase
                .from('serialized_items')
                .update({
                    warehouse_id: targetWarehouseId,
                    updated_at: new Date().toISOString(),
                    notes: notes ? (item.notes ? item.notes + ' | ' + notes : notes) : item.notes,
                })
                .eq('id', item.id)
                .select()
                .single();
            
            if (error) {
                throw new Error(`Seri numaralı ürün transfer edilirken hata: ${error.message}`);
            }
            
            // Hareket kaydı oluştur
            const movementData = {
                type: 'transfer',
                productId: item.productId,
                quantity: 1,
                sourceWarehouseId,
                targetWarehouseId,
                date: new Date().toISOString(),
                description: `Seri no: ${serialNumber} transferi - ${notes}`,
                serialNumbers: [serialNumber],
                isSerialized: true,
                createdAt: new Date().toISOString()
            };
            
            // movements koleksiyonuna hareket kaydı ekle
            await supabase
                .from('movements')
                .insert(movementData);
            
            console.log(`${serialNumber} seri numaralı ürün ${sourceWarehouseId} deposundan ${targetWarehouseId} deposuna transfer edildi`);
            
            return {
                ...item,
                warehouseId: targetWarehouseId,
                updatedAt: updatedItem.updated_at,
                notes: updatedItem.notes,
            };
        } catch (error) {
            console.error('Seri numaralı ürün transfer hatası:', error);
            throw error;
        }
    },
    
    // Tüm seri numaralı ürünleri getir
    async getAllSerializedItems() {
        try {
            const { data: items, error } = await supabase
                .from('serialized_items')
                .select('*');
            
            if (error) {
                throw new Error(`Tüm seri numaralı ürünleri getirme hatası: ${error.message}`);
            }
            
            return items.map(item => ({
                id: item.id,
                productId: item.product_id,
                serialNumber: item.serial_number,
                warehouseId: item.warehouse_id,
                status: item.status,
                notes: item.notes,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                createdBy: item.created_by,
            }));
        } catch (error) {
            console.error('Tüm seri numaralı ürünleri getirme hatası:', error);
            throw error;
        }
    },
    
    // Seri numaralı ürünü sil
    async deleteSerializedItem(id) {
        try {
            const { error } = await supabase
                .from('serialized_items')
                .delete()
                .eq('id', id);
            
            if (error) {
                throw new Error(`Seri numaralı ürün silinirken hata: ${error.message}`);
            }
            
            console.log(`Seri numaralı ürün silindi: ${id}`);
            return true;
        } catch (error) {
            console.error('Seri numaralı ürün silme hatası:', error);
            throw error;
        }
    }
};

export default serializedInventoryService;
