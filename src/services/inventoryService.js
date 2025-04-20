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
    serverTimestamp
} from 'firebase/firestore';

// Stok/Envanter servis fonksiyonları
export const inventoryService = {
    // Yeni ürün ekle - ürün kodu gibi anlamlı ID kullanarak
    async addProduct(productData) {
        try {
            if (!productData || !productData.code) {
                throw new Error('Ürün verisi ve ürün kodu zorunludur');
            }

            // Ürün kodunu ID olarak normalize edelim
            const normalizedProductCode = productData.code.trim().replace(/[.#$/\[\]\s]/g, '_');

            // Ürün kodunun benzersiz olduğunu kontrol edelim
            const existingProduct = await getDoc(doc(db, 'products', normalizedProductCode));
            if (existingProduct.exists()) {
                throw new Error(`Bu ürün kodu (${productData.code}) zaten kullanımda`);
            }

            // Şimdi belgeyi özel ID ile oluşturalım
            const productObject = {
                ...productData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'products', normalizedProductCode), productObject);
            return {
                id: normalizedProductCode,
                ...productObject
            };
        } catch (error) {
            console.error('Add product error:', error);
            throw error;
        }
    },

    // Tüm ürünleri getir
    async getAllProducts() {
        try {
            const productsQuery = query(collection(db, 'products'));
            const querySnapshot = await getDocs(productsQuery);

            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return products;
        } catch (error) {
            console.error('Get all products error:', error);
            throw error;
        }
    },

    // Ürünü ID ile getir
    async getProductById(productId) {
        try {
            const productDoc = await getDoc(doc(db, 'products', productId));

            if (!productDoc.exists()) {
                throw new Error('Ürün bulunamadı');
            }

            return {
                id: productId,
                ...productDoc.data()
            };
        } catch (error) {
            console.error('Get product by ID error:', error);
            throw error;
        }
    },

    // Ürünü güncelle
    async updateProduct(productId, productData) {
        try {
            const updateData = {
                ...productData,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'products', productId), updateData);
            return {
                id: productId,
                ...updateData
            };
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    },

    // Ürünü sil
    async deleteProduct(productId) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            return true;
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    },

    // Yeni kategori ekle - kategori adını ID olarak kullanarak
    async addCategory(categoryData) {
        try {
            if (!categoryData || !categoryData.name) {
                throw new Error('Kategori verisi ve kategori adı zorunludur');
            }

            // Kategori adını ID olarak normalize edelim
            const normalizedCategoryName = categoryData.name.trim().toLowerCase().replace(/[.#$/\[\]\s]/g, '_');

            // Kategori adının benzersiz olduğunu kontrol edelim
            const existingCategory = await getDoc(doc(db, 'categories', normalizedCategoryName));
            if (existingCategory.exists()) {
                throw new Error(`Bu kategori adı (${categoryData.name}) zaten kullanımda`);
            }

            // Şimdi belgeyi özel ID ile oluşturalım
            const categoryObject = {
                ...categoryData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'categories', normalizedCategoryName), categoryObject);
            return {
                id: normalizedCategoryName,
                ...categoryObject
            };
        } catch (error) {
            console.error('Add category error:', error);
            throw error;
        }
    },

    // Tüm kategorileri getir - inventory.ts bu metodu kullanıyor
    async getAllCategories() {
        try {
            const categoriesQuery = query(collection(db, 'categories'));
            const querySnapshot = await getDocs(categoriesQuery);

            const categories = [];
            querySnapshot.forEach((doc) => {
                categories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return categories;
        } catch (error) {
            console.error('Get all categories error:', error);
            // Hata durumunda boş array dön, böylece hata alınmaz
            return [];
        }
    },

    // Kategoriyi güncelle
    async updateCategory(categoryId, categoryData) {
        try {
            const updateData = {
                ...categoryData,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'categories', categoryId), updateData);
            return {
                id: categoryId,
                ...updateData
            };
        } catch (error) {
            console.error('Update category error:', error);
            throw error;
        }
    },

    // Kategoriyi sil
    async deleteCategory(categoryId) {
        try {
            await deleteDoc(doc(db, 'categories', categoryId));
            return true;
        } catch (error) {
            console.error('Delete category error:', error);
            throw error;
        }
    },

    // Tüm depoları getir - inventory.ts bu metodu kullanıyor
    async getAllWarehouses() {
        try {
            const warehousesQuery = query(collection(db, 'warehouses'));
            const querySnapshot = await getDocs(warehousesQuery);

            const warehouses = [];
            querySnapshot.forEach((doc) => {
                warehouses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return warehouses;
        } catch (error) {
            console.error('Get all warehouses error:', error);
            // Hata durumunda boş array dön
            return [];
        }
    },

    // Depo ekle
    async addWarehouse(warehouseData) {
        try {
            if (!warehouseData || !warehouseData.code || !warehouseData.name) {
                throw new Error('Depo kodu ve adı zorunludur');
            }

            // Depo kodunu ID olarak normalize edelim
            const normalizedCode = warehouseData.code.trim().replace(/[.#$/\[\]\s]/g, '_');

            // Depo kodunun benzersiz olduğunu kontrol edelim
            const existingWarehouse = await getDoc(doc(db, 'warehouses', normalizedCode));
            if (existingWarehouse.exists()) {
                throw new Error(`Bu depo kodu (${warehouseData.code}) zaten kullanımda`);
            }

            // Proje ID'sini ayır ve warehouseData'dan kaldır
            const projectId = warehouseData.projectId;
            const { projectId: _, ...warehouseDataWithoutProject } = warehouseData;

            const warehouseObject = {
                ...warehouseDataWithoutProject,
                isActive: warehouseData.isActive !== undefined ? warehouseData.isActive : true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Depoyu ekleyelim
            await setDoc(doc(db, 'warehouses', normalizedCode), warehouseObject);
            
            // Eğer bir proje seçildiyse, depoyu o projeyle ilişkilendir
            if (projectId) {
                await this.addWarehouseToProject(projectId, normalizedCode);
                console.log(`Depo (${normalizedCode}) ${projectId} projesiyle ilişkilendirildi`);
            }

            return {
                id: normalizedCode,
                ...warehouseObject
            };
        } catch (error) {
            console.error('Add warehouse error:', error);
            throw error;
        }
    },

    // Depo güncelle
    async updateWarehouse(warehouseId, warehouseData) {
        try {
            // Proje ID'sini ayır ve warehouseData'dan kaldır
            const projectId = warehouseData.projectId;
            const { projectId: _, ...updateDataWithoutProject } = warehouseData;
            
            const updateData = {
                ...updateDataWithoutProject,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'warehouses', warehouseId), updateData);
            
            // Eğer proje ID'si varsa, önce tüm mevcut ilişkileri kaldır, sonra yeni ilişki ekle
            if (projectId !== undefined) {
                try {
                    // Mevcut tüm proje-depo ilişkilerini bul
                    const relationQuery = query(
                        collection(db, 'projectWarehouses'),
                        where('warehouseId', '==', warehouseId)
                    );
                    const relationSnapshot = await getDocs(relationQuery);
                    
                    // Önce tüm mevcut ilişkileri sil (bu bir silme mi yoksa güncelleme mi kontrolü için)
                    const deletePromises = relationSnapshot.docs.map(doc => deleteDoc(doc.ref));
                    await Promise.all(deletePromises);
                    
                    // Eğer yeni bir proje seçildiyse, yeni ilişkiyi ekle
                    if (projectId) {
                        await this.addWarehouseToProject(projectId, warehouseId);
                        console.log(`Depo (${warehouseId}) ${projectId} projesiyle ilişkilendirildi`);
                    }
                } catch (error) {
                    console.error('Depo-proje ilişki güncellemesi sırasında hata:', error);
                    // Depo güncellemesi başarılı olsun, ilişkilendirme hatası olursa sadece log atalım
                }
            }
            
            return {
                id: warehouseId,
                ...updateData
            };
        } catch (error) {
            console.error('Update warehouse error:', error);
            throw error;
        }
    },

    // Depo sil
    async deleteWarehouse(warehouseId) {
        try {
            await deleteDoc(doc(db, 'warehouses', warehouseId));
            return true;
        } catch (error) {
            console.error('Delete warehouse error:', error);
            throw error;
        }
    },

    // Tüm stokları getir - inventory.ts bu metodu kullanıyor
    async getAllStocks() {
        try {
            const stocksQuery = query(collection(db, 'stocks'));
            const querySnapshot = await getDocs(stocksQuery);

            const stocks = [];
            querySnapshot.forEach((doc) => {
                stocks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return stocks;
        } catch (error) {
            console.error('Get all stocks error:', error);
            // Hata durumunda boş array dön
            return [];
        }
    },

    // Stok hareketi ekle
    async processStockMovement(productId, warehouseId, quantity, type, description) {
        try {
            // Stok kaydı oluştur veya güncelle
            const stockId = `${productId}_${warehouseId}`;
            const stockRef = doc(db, 'stocks', stockId);
            const stockDoc = await getDoc(stockRef);
            
            let currentQuantity = 0;
            if (stockDoc.exists()) {
                currentQuantity = stockDoc.data().quantity || 0;
            }
            
            // Stok çıkışı için miktar kontrolü
            if (type === 'out' && currentQuantity < quantity) {
                throw new Error('Yetersiz stok miktarı');
            }
            
            const newQuantity = type === 'in' ? currentQuantity + quantity : currentQuantity - quantity;
            
            // Stok güncelleme
            await setDoc(stockRef, {
                productId,
                warehouseId,
                quantity: newQuantity,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            // Hareket kaydı oluştur
            await addDoc(collection(db, 'movements'), {
                productId,
                warehouseId,
                quantity,
                type,
                description,
                previousQuantity: currentQuantity,
                newQuantity,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            
            return {
                stockId,
                productId,
                warehouseId,
                quantity: newQuantity
            };
        } catch (error) {
            console.error('Process stock movement error:', error);
            throw error;
        }
    },

    // Stok hareketi ekle (ayrıntılı)
    async addMovement(movementData) {
        try {
            if (!movementData.productId || !movementData.type) {
                throw new Error('Ürün ID ve hareket tipi zorunludur');
            }
            
            // Hareket numarası oluştur
            const date = new Date();
            const movementNumber = `MVT${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
            
            const movementObject = {
                ...movementData,
                movementNumber,
                date: date.toISOString(),
                createdAt: date.toISOString()
            };
            
            // Hareket kaydı oluştur
            const docRef = await addDoc(collection(db, 'movements'), movementObject);
            
            // Stok güncelleme
            if (movementData.type === 'in') {
                // Stok girişi
                await this.processStockMovement(
                    movementData.productId, 
                    movementData.targetWarehouseId || movementData.sourceWarehouseId, 
                    movementData.quantity, 
                    'in', 
                    movementData.description || ''
                );
            } else if (movementData.type === 'out') {
                // Stok çıkışı
                await this.processStockMovement(
                    movementData.productId, 
                    movementData.sourceWarehouseId, 
                    movementData.quantity, 
                    'out', 
                    movementData.description || ''
                );
            } else if (movementData.type === 'transfer' && movementData.targetWarehouseId) {
                // Depolar arası transfer
                await this.processStockMovement(
                    movementData.productId, 
                    movementData.sourceWarehouseId, 
                    movementData.quantity, 
                    'out', 
                    `Transfer: ${movementData.sourceWarehouseId} → ${movementData.targetWarehouseId}`
                );
                
                await this.processStockMovement(
                    movementData.productId, 
                    movementData.targetWarehouseId, 
                    movementData.quantity, 
                    'in', 
                    `Transfer: ${movementData.sourceWarehouseId} → ${movementData.targetWarehouseId}`
                );
            }
            
            return {
                id: docRef.id,
                ...movementObject
            };
        } catch (error) {
            console.error('Add movement error:', error);
            throw error;
        }
    },

    // Tüm hareketleri getir - inventory.ts bu metodu kullanıyor
    async getAllMovements() {
        try {
            const movementsQuery = query(collection(db, 'movements'));
            const querySnapshot = await getDocs(movementsQuery);

            const movements = [];
            querySnapshot.forEach((doc) => {
                movements.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return movements;
        } catch (error) {
            console.error('Get all movements error:', error);
            // Hata durumunda boş array dön
            return [];
        }
    },

    // Hareket detaylarını getir
    async getMovementById(movementId) {
        try {
            const movementDoc = await getDoc(doc(db, 'movements', movementId));

            if (!movementDoc.exists()) {
                throw new Error('Hareket kaydı bulunamadı');
            }

            return {
                id: movementId,
                ...movementDoc.data()
            };
        } catch (error) {
            console.error('Get movement by ID error:', error);
            throw error;
        }
    },

    // Projeye göre depoları getir
    async getWarehousesByProject(projectId) {
        try {
            // Eğer projectId yoksa tüm depoları getir
            if (!projectId) {
                return this.getAllWarehouses();
            }
            
            // Proje-depo ilişkilerini sorgula
            const projectWarehousesQuery = query(
                collection(db, 'projectWarehouses'),
                where('projectId', '==', projectId)
            );
            const projectWarehousesSnapshot = await getDocs(projectWarehousesQuery);
            
            // Proje için tanımlı depo ID'leri
            const warehouseIds = [];
            projectWarehousesSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.warehouseId) {
                    warehouseIds.push(data.warehouseId);
                }
            });
            
            // Hiç depo tanımlı değilse boş dizi döndür
            if (warehouseIds.length === 0) {
                return [];
            }
            
            // Her bir depo için bilgileri al
            const warehouses = [];
            for (const warehouseId of warehouseIds) {
                const warehouseDoc = await getDoc(doc(db, 'warehouses', warehouseId));
                if (warehouseDoc.exists()) {
                    warehouses.push({
                        id: warehouseDoc.id,
                        ...warehouseDoc.data()
                    });
                }
            }
            
            return warehouses;
        } catch (error) {
            console.error('Get warehouses by project error:', error);
            return []; // Hata durumunda boş dizi dön
        }
    },
    
    // Depoyu projeye ekle
    async addWarehouseToProject(projectId, warehouseId) {
        try {
            if (!projectId || !warehouseId) {
                throw new Error('Proje ID ve depo ID zorunludur');
            }
            
            // İlişkinin daha önce eklenip eklenmediğini kontrol et
            const relationQuery = query(
                collection(db, 'projectWarehouses'),
                where('projectId', '==', projectId),
                where('warehouseId', '==', warehouseId)
            );
            const relationSnapshot = await getDocs(relationQuery);
            
            if (!relationSnapshot.empty) {
                // İlişki zaten var, güncelle
                const relationDoc = relationSnapshot.docs[0];
                await updateDoc(doc(db, 'projectWarehouses', relationDoc.id), {
                    updatedAt: new Date().toISOString()
                });
                
                return {
                    id: relationDoc.id,
                    projectId,
                    warehouseId,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // Yeni ilişki oluştur
            const relationData = {
                projectId,
                warehouseId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const docRef = await addDoc(collection(db, 'projectWarehouses'), relationData);
            
            return {
                id: docRef.id,
                ...relationData
            };
        } catch (error) {
            console.error('Add warehouse to project error:', error);
            throw error;
        }
    },
    
    // Depoyu projeden kaldır
    async removeWarehouseFromProject(projectId, warehouseId) {
        try {
            if (!projectId || !warehouseId) {
                throw new Error('Proje ID ve depo ID zorunludur');
            }
            
            // İlişkiyi bul
            const relationQuery = query(
                collection(db, 'projectWarehouses'),
                where('projectId', '==', projectId),
                where('warehouseId', '==', warehouseId)
            );
            const relationSnapshot = await getDocs(relationQuery);
            
            if (relationSnapshot.empty) {
                return false; // İlişki yok
            }
            
            // İlişkiyi sil
            await deleteDoc(doc(db, 'projectWarehouses', relationSnapshot.docs[0].id));
            
            return true;
        } catch (error) {
            console.error('Remove warehouse from project error:', error);
            throw error;
        }
    },
    
    // Projeye ait tüm stok hareketlerini getir
    async getMovementsByProject(projectId) {
        try {
            if (!projectId) {
                return this.getAllMovements();
            }
            
            // Önce projeye ait depoları bul
            const projectWarehouses = await this.getWarehousesByProject(projectId);
            const warehouseIds = projectWarehouses.map(warehouse => warehouse.id);
            
            // Depo yoksa boş dizi döndür
            if (warehouseIds.length === 0) {
                return [];
            }
            
            // Bu depolara ait hareketleri getir
            const movements = [];
            const movementsRef = collection(db, 'movements');
            
            for (const warehouseId of warehouseIds) {
                // Kaynak depo olarak hareketleri al
                const sourceMovementsQuery = query(
                    movementsRef, 
                    where('sourceWarehouseId', '==', warehouseId)
                );
                const sourceSnapshot = await getDocs(sourceMovementsQuery);
                
                sourceSnapshot.forEach(doc => {
                    movements.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                // Hedef depo olarak hareketleri al
                const targetMovementsQuery = query(
                    movementsRef, 
                    where('targetWarehouseId', '==', warehouseId)
                );
                const targetSnapshot = await getDocs(targetMovementsQuery);
                
                targetSnapshot.forEach(doc => {
                    // Eğer aynı hareket kaynak olarak eklendiyse tekrar ekleme
                    if (!movements.some(m => m.id === doc.id)) {
                        movements.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    }
                });
            }
            
            return movements;
        } catch (error) {
            console.error('Get movements by project error:', error);
            return []; // Hata durumunda boş dizi dön
        }
    },
    
    // Projeye ait depolardaki stokları getir
    async getStocksByProject(projectId) {
        try {
            if (!projectId) {
                return this.getAllStocks();
            }
            
            // Önce projeye ait depoları bul
            const projectWarehouses = await this.getWarehousesByProject(projectId);
            const warehouseIds = projectWarehouses.map(warehouse => warehouse.id);
            
            // Depo yoksa boş dizi döndür
            if (warehouseIds.length === 0) {
                return [];
            }
            
            // Bu depolardaki stokları getir
            const stocks = [];
            const stocksRef = collection(db, 'stocks');
            
            for (const warehouseId of warehouseIds) {
                const stocksQuery = query(
                    stocksRef, 
                    where('warehouseId', '==', warehouseId)
                );
                const snapshot = await getDocs(stocksQuery);
                
                snapshot.forEach(doc => {
                    stocks.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }
            
            return stocks;
        } catch (error) {
            console.error('Get stocks by project error:', error);
            return []; // Hata durumunda boş dizi dön
        }
    }
};

export default inventoryService;