import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import inventoryService from '@/services/inventoryService';
import { useProjectStore } from '@/stores/projects';
import { db } from '@/firebase';
import { 
    doc, 
    collection, 
    getDocs, 
    runTransaction,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

export interface Warehouse {
    id: string;
    code: string;
    name: string;
    address?: string;
    manager?: string;
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    description?: string;
}

export interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    categoryId: string;
    category: string;
    subCategory?: string;
    unit: string;
    stockNumber?: string;
    minStockLevel: number;
    totalStock?: number;
    unitPrice: number;
    isActive: boolean;
    hasSerialization?: boolean; // Seri numaralı takip edilecek mi?
    requireSerialNumber?: boolean; // Seri numarası zorunlu mu?
    serialNumberPrefix?: string; // Seri numarası ön eki
}

interface Stock {
    id: string;
    productId: string;
    warehouseId: string;
    projectId?: string; // Ürünün hangi projeye ait olduğunu belirtir
    quantity: number;
}

export interface Movement {
    id: string;
    movementNumber: string;
    date: string;
    type: 'in' | 'out' | 'transfer' | 'stock_add';
    productId: string;
    quantity: number;
    sourceWarehouseId: string;
    targetWarehouseId?: string;
    sourceProjectId?: string;  // Kaynak proje ID'si
    targetProjectId?: string;  // Hedef proje ID'si (transferlerde kullanılır)
    description?: string;
    serialNumbers?: string[];  // İşlem yapılan seri numaraları
    isSerialized?: boolean;    // Seri numaralı işlem mi?
}

export interface MovementWithDetails extends Movement {
    product?: Product;
    sourceWarehouse?: Warehouse;
    targetWarehouse?: Warehouse;
}

interface DashboardStats {
    totalProducts: number;
    totalCategories: number;
    totalWarehouses: number;
    lowStockCount: number;
}

export interface Depo {
    id: string;
    code: string;
    name: string;
    location?: string;
}

// Stok hareketleri için interface'i genişletelim
interface StockError extends Error {
    code: string;
    details?: any;
}

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        loading: false,
        error: null as string | null,
        stockItems: [] as any[],
        lastUpdate: null as Date | null,
        categories: [] as Category[],
        warehouses: [] as Warehouse[],
        products: [] as Product[],
        stocks: [] as Stock[],
        movements: [] as Movement[],
        serializedItems: [] as any[], // Seri numaralı ürünler
        isInitialized: false,
        activeProjectId: null as string | null,
        projectWarehouses: [] as Warehouse[],
        projectStocks: [] as Stock[],
        projectMovements: [] as Movement[]
    }),

    getters: {
        getCategories: (state) => state.categories,
        getProducts: (state) => {
            return state.products.map(product => {
                const category = state.categories.find(c => c.id === product.categoryId);
                const totalStock = state.stocks
                    .filter(s => s.productId === product.id)
                    .reduce((total, stock) => total + stock.quantity, 0);
                return {
                    ...product,
                    category: category || { id: '', name: 'Tanımsız' },
                    totalStock
                };
            });
        },
        getWarehouses: (state) => state.warehouses,
        getStocks: (state) => state.stocks,
        getStockByProductAndWarehouse: (state) => (productId: string, warehouseId: string) => {
            return state.stocks.find(stock => stock.productId === productId && stock.warehouseId === warehouseId);
        },        getStocksByWarehouseId: (state) => (warehouseId: string) => {
            return state.stocks.filter(stock => stock.warehouseId === warehouseId);
        },
        // Proje bazlı stok bilgileri
        getStocksByProject: (state) => (projectId: string) => {
            return state.stocks.filter(stock => stock.projectId === projectId);
        },
        // Depo ve proje bazlı stok bilgileri
        getStocksByWarehouseAndProject: (state) => (warehouseId: string, projectId: string) => {
            return state.stocks.filter(stock => 
                stock.warehouseId === warehouseId && 
                stock.projectId === projectId
            );
        },
        // Belirli bir ürünün proje bazlı stok bilgileri
        getStockByProductAndProject: (state) => (productId: string, projectId: string) => {
            return state.stocks.find(stock => 
                stock.productId === productId && 
                stock.projectId === projectId
            );
        },
        // Belirli bir depodaki bir ürünün proje bazlı stok bilgileri
        getStockByProductWarehouseAndProject: (state) => (productId: string, warehouseId: string, projectId: string) => {
            return state.stocks.find(stock => 
                stock.productId === productId && 
                stock.warehouseId === warehouseId && 
                stock.projectId === projectId
            );
        },        getMovements: (state) => state.movements,
        // Proje bazlı stok hareketlerini getir
        getMovementsByProject: (state) => (projectId: string) => {
            return state.movements.filter(movement => 
                movement.sourceProjectId === projectId || 
                movement.targetProjectId === projectId
            );
        },
        // Belirli bir depo ve proje için stok hareketlerini getir
        getMovementsByWarehouseAndProject: (state) => (warehouseId: string, projectId: string) => {
            return state.movements.filter(movement => 
                (movement.sourceWarehouseId === warehouseId && movement.sourceProjectId === projectId) ||
                (movement.targetWarehouseId === warehouseId && movement.targetProjectId === projectId)
            );
        },
        // Seri numaralı ürün getters
        getSerializedItems: (state) => state.serializedItems,
        // Seri numarasına göre ürün getir
        getSerializedItemBySerialNumber: (state) => (serialNumber: string) => {
            return state.serializedItems.find(item => item.serialNumber === serialNumber);
        },
        // Ürün ID'sine göre seri numaralı ürünleri getir
        getSerializedItemsByProduct: (state) => (productId: string) => {
            return state.serializedItems.filter(item => item.productId === productId);
        },
        // Depo ID'sine göre seri numaralı ürünleri getir
        getSerializedItemsByWarehouse: (state) => (warehouseId: string) => {
            return state.serializedItems.filter(item => item.warehouseId === warehouseId);
        },
        // Durum değerine göre seri numaralı ürünleri getir
        getSerializedItemsByStatus: (state) => (status: string) => {
            return state.serializedItems.filter(item => item.status === status);
        },
        getLowStockProducts: (state) => {
            return state.stocks.filter(stock => {
                const product = state.products.find(p => p.id === stock.productId);
                if (!product) return false;
                
                return stock.quantity <= product.minStockLevel;
            }).map(stock => {
                const product = state.products.find(p => p.id === stock.productId);
                const warehouse = state.warehouses.find(w => w.id === stock.warehouseId);
                return {
                    ...stock,
                    product,
                    warehouse,
                    stockStatus: stock.quantity === 0 ? 'critical' : 'low'
                };
            });
        },
        getDashboardStats: (state) => {
            return {
                totalProducts: state.products.length,
                totalCategories: state.categories.length,
                totalWarehouses: state.warehouses.length,
                lowStockCount: state.stocks.filter(stock => {
                    const product = state.products.find(p => p.id === stock.productId);
                    return product && stock.quantity <= product.minStockLevel;
                }).length
            };
        },
        // Aktif projeye göre ürün ve depolar
        getProjectWarehouses: (state) => state.projectWarehouses || state.warehouses,
        
        getProjectStocks: (state) => {
            const stocks = state.projectStocks || state.stocks;
            
            // Sadece aktif projeye ait depolardaki stokları filtrele
            if (state.projectWarehouses.length > 0) {
                const warehouseIds = state.projectWarehouses.map(w => w.id);
                return stocks.filter(stock => warehouseIds.includes(stock.warehouseId));
            }
            
            return stocks;
        },
        
        getProjectMovements: (state) => {
            const movements = state.projectMovements || state.movements;
            
            // Sadece aktif projeye ait depolardaki hareketleri filtrele
            if (state.projectWarehouses.length > 0) {
                const warehouseIds = state.projectWarehouses.map(w => w.id);
                return movements.filter(movement => 
                    warehouseIds.includes(movement.sourceWarehouseId) || 
                    (movement.targetWarehouseId && warehouseIds.includes(movement.targetWarehouseId))
                );
            }
            
            return movements;
        },
        
        // Mevcut getterları projeye göre filtrele
        getProductsFiltered: (state) => {
            return state.products.map(product => {
                const category = state.categories.find(c => c.id === product.categoryId);
                
                // Aktif projeye ait depolardaki ürünlerin toplam stok sayısını hesapla
                const projectWarehouses = state.projectWarehouses.length > 0 ? 
                    state.projectWarehouses.map(w => w.id) : 
                    state.warehouses.map(w => w.id);
                
                const totalStock = state.stocks
                    .filter(s => s.productId === product.id && projectWarehouses.includes(s.warehouseId))
                    .reduce((total, stock) => total + stock.quantity, 0);
                
                return {
                    ...product,
                    category: category || { id: '', name: 'Tanımsız' },
                    totalStock
                };
            });
        },
        
        getLowStockProductsFiltered: (state) => {
            const projectWarehouses = state.projectWarehouses.length > 0 ? 
                state.projectWarehouses.map(w => w.id) : 
                state.warehouses.map(w => w.id);
                
            return state.stocks.filter(stock => {
                const product = state.products.find(p => p.id === stock.productId);
                if (!product) return false;
                
                // Sadece aktif projeye ait depolardaki stokları kontrol et
                if (!projectWarehouses.includes(stock.warehouseId)) return false;
                
                return stock.quantity <= product.minStockLevel;
            }).map(stock => {
                const product = state.products.find(p => p.id === stock.productId);
                const warehouse = state.warehouses.find(w => w.id === stock.warehouseId);
                return {
                    ...stock,
                    product,
                    warehouse,
                    stockStatus: stock.quantity === 0 ? 'critical' : 'low'
                };
            });
        },
    },

    actions: {        async initializeStore() {
            try {
                if (this.isInitialized) return;
                
                // Dinamik olarak serializedInventoryService'i import edelim
                let serializedInventoryService;
                try {
                    serializedInventoryService = (await import('@/services/serializedInventoryService')).default;
                } catch (importError) {
                    console.warn('serializedInventoryService yüklenirken hata:', importError);
                    serializedInventoryService = null;
                }
                
                const [categoriesData, warehousesData, productsData, stocksData, movementsData] = await Promise.all([
                    inventoryService.getAllCategories(),
                    inventoryService.getAllWarehouses(),
                    inventoryService.getAllProducts(),
                    inventoryService.getAllStocks(),
                    inventoryService.getAllMovements()
                ]);
                
                this.categories = categoriesData;
                this.warehouses = warehousesData;
                this.products = productsData;
                this.stocks = stocksData;
                this.movements = movementsData;
                
                // Seri numaralı ürünleri de yükleyelim
                if (serializedInventoryService) {
                    try {
                        const serializedItemsData = await serializedInventoryService.getAllSerializedItems();
                        this.serializedItems = serializedItemsData;
                        console.log('Seri numaralı ürünler yüklendi:', serializedItemsData.length);
                    } catch (error) {
                        console.error('Seri numaralı ürünleri yükleme hatası:', error);
                        this.serializedItems = [];
                    }
                }
                
                this.isInitialized = true;
                
                // Aktif proje varsa ona ait verileri de yükle
                await this.loadProjectData();
                
                console.log('Inventory data loaded from Firebase');
            } catch (error) {
                console.error('Error loading inventory data:', error);
                throw error;
            }
        },

        // Aktif projeye ait depo ve stok verilerini yükle
        async loadProjectData() {
            try {
                // Proje store'undan aktif projeyi al
                const projectStore = useProjectStore();
                const activeProjectId = projectStore.activeProjectId;
                
                if (!activeProjectId) {
                    // Aktif proje yoksa tüm veriyi kullan
                    this.projectWarehouses = this.warehouses;
                    this.projectStocks = this.stocks;
                    this.projectMovements = this.movements;
                    this.activeProjectId = null;
                    return;
                }
                
                // Aktif projenin verilerini yükle
                this.loading = true;
                this.activeProjectId = activeProjectId;
                
                try {
                    // Projeye ait depoları al
                    const projectWarehouses = await inventoryService.getWarehousesByProject(activeProjectId);
                    this.projectWarehouses = projectWarehouses;
                    
                    // Bu depolardaki stokları al
                    if (projectWarehouses.length > 0) {
                        const projectStocks = await inventoryService.getStocksByProject(activeProjectId);
                        this.projectStocks = projectStocks;
                        
                        // Bu depolardaki hareketleri al
                        const projectMovements = await inventoryService.getMovementsByProject(activeProjectId);
                        this.projectMovements = projectMovements;
                    } else {
                        // Proje için depo tanımlanmamışsa boş dizileri ayarla
                        this.projectStocks = [];
                        this.projectMovements = [];
                    }
                    
                } catch (error) {
                    console.error('Error loading project data:', error);
                    // Hata durumunda ana verileri kullan
                    this.projectWarehouses = this.warehouses;
                    this.projectStocks = this.stocks;
                    this.projectMovements = this.movements;
                } finally {
                    this.loading = false;
                }
                
            } catch (error) {
                console.error('Error in loadProjectData:', error);
                // Hata durumunda ana verileri kullan
                this.projectWarehouses = this.warehouses;
                this.projectStocks = this.stocks;
                this.projectMovements = this.movements;
                this.loading = false;
            }
        },

        async refreshData() {
            try {
                const [categoriesData, warehousesData, productsData, stocksData, movementsData] = await Promise.all([
                    inventoryService.getAllCategories(),
                    inventoryService.getAllWarehouses(),
                    inventoryService.getAllProducts(),
                    inventoryService.getAllStocks(),
                    inventoryService.getAllMovements()
                ]);
                
                this.categories = categoriesData;
                this.warehouses = warehousesData;
                this.products = productsData;
                this.stocks = stocksData;
                this.movements = movementsData;
                
                // Aktif proje verilerini de yenile
                await this.loadProjectData();
                
                console.log('Inventory data refreshed from Firebase');
            } catch (error) {
                console.error('Error refreshing inventory data:', error);
                throw error;
            }
        },        // Aktif proje ID'sini ayarla ve ilgili verileri yükle
        async setActiveProjectId(projectId: string | null) {
            this.activeProjectId = projectId;
            // Proje bilgisini oturum bazlı tut - localStorage'a kaydetme
            await this.loadProjectData();
        },
        
        // Aktif projeyi sıfırla
        resetActiveProject() {
            this.activeProjectId = null;
        },

        async addCategory(categoryData: Omit<Category, 'id'>) {
            const newCategory = await inventoryService.addCategory(categoryData);
            this.categories.push(newCategory);
            return newCategory;
        },

        async updateCategory(id: string, categoryData: Partial<Category>) {
            const updatedCategory = await inventoryService.updateCategory(id, categoryData);
            const index = this.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                this.categories[index] = updatedCategory;
            }
            return updatedCategory;
        },

        async deleteCategory(id: string) {
            await inventoryService.deleteCategory(id);
            const index = this.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                this.categories.splice(index, 1);
            }
        },

        async addProduct(productData: Omit<Product, 'id'>) {
            const newProduct = await inventoryService.addProduct(productData);
            this.products.push(newProduct);
            return newProduct;
        },

        async updateProduct(id: string, productData: Partial<Product>) {
            const updatedProduct = await inventoryService.updateProduct(id, productData);
            const index = this.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.products[index] = updatedProduct;
            }
            return updatedProduct;
        },

        async deleteProduct(id: string) {
            await inventoryService.deleteProduct(id);
            const index = this.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.products.splice(index, 1);
            }
        },

        async addWarehouse(warehouseData: Omit<Warehouse, 'id'>) {
            const newWarehouse = await inventoryService.addWarehouse(warehouseData);
            this.warehouses.push(newWarehouse);
            return newWarehouse;
        },

        async updateWarehouse(id: string, warehouseData: Partial<Warehouse>) {
            const updatedWarehouse = await inventoryService.updateWarehouse(id, warehouseData);
            const index = this.warehouses.findIndex(w => w.id === id);
            if (index !== -1) {
                this.warehouses[index] = updatedWarehouse;
            }
            return updatedWarehouse;
        },

        async deleteWarehouse(id: string) {
            await inventoryService.deleteWarehouse(id);
            const index = this.warehouses.findIndex(w => w.id === id);
            if (index !== -1) {
                this.warehouses.splice(index, 1);
            }
        },

        async validateStockOperation(productId: string, quantity: number, warehouseId: string) {
            try {
                const stockRef = doc(db, 'stocks', `${productId}_${warehouseId}`);
                const result = await runTransaction(db, async (transaction) => {
                    const stockDoc = await transaction.get(stockRef);
                    if (!stockDoc.exists()) {
                        throw new Error('Stok kaydı bulunamadı');
                    }

                    const currentStock = stockDoc.data().quantity || 0;
                    if (currentStock + quantity < 0) {
                        throw new Error('Yetersiz stok miktarı');
                    }

                    return true;
                });

                return result;
            } catch (error: any) {
                console.error('Stok validasyon hatası:', error);
                throw new Error(error.message);
            }
        },

        async updateStock(productId: string, quantity: number, warehouseId: string, type: 'in' | 'out', description: string) {
            this.loading = true;
            this.error = null;

            try {
                // Stok kontrolü
                if (type === 'out') {
                    await this.validateStockOperation(productId, -quantity, warehouseId);
                }

                const stockRef = doc(db, 'stocks', `${productId}_${warehouseId}`);
                
                await runTransaction(db, async (transaction) => {
                    const stockDoc = await transaction.get(stockRef);
                    const currentQuantity = stockDoc.exists() ? stockDoc.data().quantity || 0 : 0;
                    const newQuantity = type === 'in' ? currentQuantity + quantity : currentQuantity - quantity;

                    transaction.set(stockRef, {
                        productId,
                        warehouseId,
                        quantity: newQuantity,
                        lastUpdated: serverTimestamp()
                    }, { merge: true });

                    // Hareket kaydı
                    const movementRef = doc(collection(db, 'movements'));
                    transaction.set(movementRef, {
                        productId,
                        warehouseId,
                        quantity,
                        type,
                        description,
                        timestamp: serverTimestamp(),
                        previousQuantity: currentQuantity,
                        newQuantity: newQuantity
                    });
                });

                this.loading = false;
                return true;
            } catch (err: any) {
                this.loading = false;
                this.error = err.message;
                throw new Error(err.message);
            }
        },

        async refreshStockData() {
            try {
                const stocksData = await inventoryService.getAllStocks();
                this.stocks = stocksData;
            } catch (error) {
                console.error('Refresh stock data error:', error);
                throw error;
            }
        },        async addMovement(movementData: Movement) {
            try {
                // Stok kontrolü
                if (movementData.type === 'out' || movementData.type === 'transfer') {
                    const currentStock = this.stocks.find(
                        s => s.productId === movementData.productId && 
                             s.warehouseId === movementData.sourceWarehouseId
                    );
                    
                    if (!currentStock || currentStock.quantity < movementData.quantity) {
                        const error = new Error('Yetersiz stok') as StockError;
                        error.code = 'INSUFFICIENT_STOCK';
                        error.details = {
                            currentStock: currentStock?.quantity || 0,
                            requestedQuantity: movementData.quantity
                        };
                        throw error;
                    }
                }                // Stok Ekleme tipinde herhangi bir özel işlem yapmaya gerek yok
                // addMovement metodu içindeki stok işlemleri zaten bizim için çalışacak

                const response = await inventoryService.addMovement(movementData);
                
                // Stok verilerini yeniden yükle
                const stocksData = await inventoryService.getAllStocks();
                this.stocks = stocksData;
                  // Hareketi state'e ekle - response ve movementData'yı birleştirerek tam bir Movement objesi oluştur
                // undefined değerleri filtreleyerek yeni bir nesne oluştur
                const cleanMovementData = Object.keys(movementData).reduce((acc, key) => {
                    if (movementData[key] !== undefined) {
                        acc[key] = movementData[key];
                    }
                    return acc;
                }, {});
                
                const completeMovement: Movement = {
                    type: movementData.type,
                    productId: movementData.productId,
                    quantity: movementData.quantity,
                    sourceWarehouseId: movementData.sourceWarehouseId,
                    ...cleanMovementData,
                    id: response.id,
                    date: typeof response.date === 'string' 
                        ? response.date 
                        : typeof response.date === 'object' && response.date !== null && (response.date as object) instanceof Date 
                            ? (response.date as Date).toISOString() 
                            : String(response.date),
                    movementNumber: response.movementNumber
                };
                
                this.movements.push(completeMovement);
                
                return completeMovement;
                
            } catch (error) {
                console.error('Hareket ekleme hatası:', error);
                if ((error as StockError).code === 'INSUFFICIENT_STOCK') {
                    throw error;
                }
                throw new Error('Hareket eklenirken bir hata oluştu');
            }
        },        async processStockMovement(data: any) {
            this.loading = true;
            this.error = null;
            
            try {
                // Veri doğrulama
                if (!data.productId || !data.warehouseId || !data.quantity) {
                    throw new Error('Gerekli alanlar eksik');
                }
                
                if (data.quantity <= 0) {
                    throw new Error('Miktar sıfırdan büyük olmalıdır');
                }

                await inventoryService.processStockMovement(
                    data.productId,
                    data.warehouseId,
                    data.quantity,
                    data.type,
                    data.description
                );

                this.lastUpdate = new Date();
                await this.refreshStockData(); // Stok listesini yenile
                
                return true;
            } catch (error: any) {
                this.error = error.message || 'Stok işlemi sırasında bir hata oluştu';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        
        // Seri numaralı ürün actions
        
        // Seri numaralı ürün ekle
        async addSerializedItem(itemData: any) {
            this.loading = true;
            this.error = null;
            
            try {
                const serializedInventoryService = (await import('@/services/serializedInventoryService')).default;
                
                const newItem = await serializedInventoryService.addSerializedItem(itemData);
                
                // Bu ürünü state'e ekle
                this.serializedItems.push(newItem);
                
                // İlgili ürünün stock bilgisini güncelle
                await this.refreshStockData();
                
                console.log('Seri numaralı ürün eklendi:', newItem.serialNumber);
                
                return newItem;
            } catch (error: any) {
                this.error = error.message || 'Seri numaralı ürün eklenirken bir hata oluştu';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        
        // Birden fazla seri numaralı ürün ekle
        async addMultipleSerializedItems(productId: string, warehouseId: string, serialNumbers: string[], projectId?: string) {
            this.loading = true;
            this.error = null;
            
            try {
                const serializedInventoryService = (await import('@/services/serializedInventoryService')).default;
                
                const items: any[] = [];
                
                for (const serialNumber of serialNumbers) {
                    try {
                        const itemData = {
                            serialNumber,
                            productId,
                            warehouseId,
                            projectId,
                            status: 'active',
                            acquisitionDate: new Date().toISOString()
                        };
                        
                        const newItem = await serializedInventoryService.addSerializedItem(itemData);
                        
                        // Bu ürünü state'e ekle
                        this.serializedItems.push(newItem);
                        
                        items.push(newItem);
                    } catch (error) {
                        console.error(`${serialNumber} eklenirken hata:`, error);
                        // Hatayı logla ama devam et
                    }
                }
                
                // İlgili ürünün stock bilgisini güncelle
                await this.refreshStockData();
                
                console.log(`${items.length}/${serialNumbers.length} seri numaralı ürün eklendi`);
                
                return items;
            } catch (error: any) {
                this.error = error.message || 'Seri numaralı ürünler eklenirken bir hata oluştu';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        
        // Seri numaralı ürün durumunu güncelle
        async updateSerializedItemStatus(serialNumber: string, status: string, notes?: string) {
            this.loading = true;
            this.error = null;
            
            try {
                const serializedInventoryService = (await import('@/services/serializedInventoryService')).default;
                
                const updatedItem = await serializedInventoryService.updateSerializedItemStatus(serialNumber, status, notes);
                
                // State'deki ilgili ürünü güncelle
                const index = this.serializedItems.findIndex(item => item.serialNumber === serialNumber);
                if (index !== -1) {
                    this.serializedItems[index] = updatedItem;
                }
                
                return updatedItem;
            } catch (error: any) {
                this.error = error.message || 'Ürün durumu güncellenirken bir hata oluştu';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        
        // Seri numaralı ürünü transfer et
        async transferSerializedItem(serialNumber: string, targetWarehouseId: string, notes?: string) {
            this.loading = true;
            this.error = null;
            
            try {
                const serializedInventoryService = (await import('@/services/serializedInventoryService')).default;
                
                const transferredItem = await serializedInventoryService.transferSerializedItem(
                    serialNumber, 
                    targetWarehouseId, 
                    notes
                );
                
                // State'deki ilgili ürünü güncelle
                const index = this.serializedItems.findIndex(item => item.serialNumber === serialNumber);
                if (index !== -1) {
                    this.serializedItems[index] = transferredItem;
                }
                
                // Stok bilgisini güncelle
                await this.refreshStockData();
                
                return transferredItem;
            } catch (error: any) {
                this.error = error.message || 'Ürün transfer edilirken bir hata oluştu';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        
        // Tüm seri numaralı ürünleri getir
        async fetchSerializedItems() {
            this.loading = true;
            this.error = null;
            
            try {
                const serializedInventoryService = (await import('@/services/serializedInventoryService')).default;
                
                const items = await serializedInventoryService.getAllSerializedItems();
                
                this.serializedItems = items;
                
                return items;
            } catch (error: any) {
                this.error = error.message || 'Seri numaralı ürünler getirilirken bir hata oluştu';
                throw error;
            } finally {
                this.loading = false;
            }
        }
    },
    
    // Firebase offline persistence kullanıldığı için persist özelliği kaldırıldı
    // Tüm veri işlemleri Firebase üzerinden yapılacak
    persist: false
});