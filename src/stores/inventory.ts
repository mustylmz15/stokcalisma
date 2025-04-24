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
}

interface Stock {
    id: string;
    productId: string;
    warehouseId: string;
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
    description?: string;
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
        },
        getStocksByWarehouseId: (state) => (warehouseId: string) => {
            return state.stocks.filter(stock => stock.warehouseId === warehouseId);
        },
        getMovements: (state) => state.movements,
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

    actions: {
        async initializeStore() {
            try {
                if (this.isInitialized) return;
                
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
        },

        // Aktif proje ID'sini ayarla ve ilgili verileri yükle
        async setActiveProjectId(projectId: string | null) {
            this.activeProjectId = projectId;
            await this.loadProjectData();
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
        },

        async addMovement(movementData: Movement) {
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
                }

                const response = await inventoryService.addMovement(movementData);
                
                // Stok verilerini yeniden yükle
                const stocksData = await inventoryService.getAllStocks();
                this.stocks = stocksData;
                
                // Hareketi state'e ekle - response ve movementData'yı birleştirerek tam bir Movement objesi oluştur
                const completeMovement: Movement = {
                    ...movementData,
                    id: response.id,
                    date: typeof response.date === 'string' ? response.date : response.date.toISOString(),
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
        },

        async processStockMovement(data: any) {
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
        }
    },
    
    // Firebase offline persistence kullanıldığı için persist özelliği kaldırıldı
    // Tüm veri işlemleri Firebase üzerinden yapılacak
    persist: false
});