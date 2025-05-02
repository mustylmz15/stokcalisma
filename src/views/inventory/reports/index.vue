<template>
    <div>
        <!-- Rapor Seçimi -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div class="panel cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_1px_rgba(0,0,0,0.15)] bg-success/10 dark:bg-success/20 hover:bg-success/20 dark:hover:bg-success/30"
                :class="{'ring-2 ring-success': selectedReport === 'stock-status'}"
                @click="selectReport('stock-status')">
                <div class="flex items-start">
                    <div class="flex-1">
                        <h5 class="font-semibold text-lg mb-2">Stok Durum Raporu</h5>
                        <p class="text-[13px] text-white-dark">Tüm ürünlerin güncel stok durumunu görüntüleyin</p>
                    </div>
                </div>
            </div>

            <div class="panel cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_1px_rgba(0,0,0,0.15)] bg-info/10 dark:bg-info/20 hover:bg-info/20 dark:hover:bg-info/30"
                :class="{'ring-2 ring-info': selectedReport === 'movement-history'}"
                @click="selectReport('movement-history')">
                <div class="flex items-start">
                    <div class="flex-1">
                        <h5 class="font-semibold text-lg mb-2">Hareket Geçmişi</h5>
                        <p class="text-[13px] text-white-dark">Stok hareketlerini analiz edin</p>
                    </div>
                </div>
            </div>

            <div class="panel cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_1px_rgba(0,0,0,0.15)] bg-warning/10 dark:bg-warning/20 hover:bg-warning/20 dark:hover:bg-warning/30"
                :class="{'ring-2 ring-warning': selectedReport === 'low-stock'}"
                @click="selectReport('low-stock')">
                <div class="flex items-start">
                    <div class="flex-1">
                        <h5 class="font-semibold text-lg mb-2">Kritik Stok Raporu</h5>
                        <p class="text-[13px] text-white-dark">Minimum stok seviyesinin altındaki ürünleri listeleyin</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtreler ve Tablo -->
        <div class="panel">
            <div class="flex flex-wrap justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">
                    {{ selectedReport === 'stock-status' ? 'Stok Durum Raporu' :
                       selectedReport === 'movement-history' ? 'Hareket Geçmişi' :
                       selectedReport === 'low-stock' ? 'Kritik Stok Raporu' : '' }}
                </h5>
                <button class="btn btn-primary" @click="exportReport">
                    Dışa Aktar
                </button>
            </div>

            <!-- Filtreler -->
            <div class="mb-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <template v-if="selectedReport === 'movement-history'">
                    <div>
                        <label>Başlangıç Tarihi</label>
                        <input type="date" class="form-input" v-model="filters.startDate" />
                    </div>
                    <div>
                        <label>Bitiş Tarihi</label>
                        <input type="date" class="form-input" v-model="filters.endDate" />
                    </div>
                    <div>
                        <label>Hareket Tipi</label>                        <select class="form-select" v-model="filters.movementType">
                            <option value="">Tümü</option>
                            <option value="in">Giriş</option>
                            <option value="out">Çıkış</option>
                            <option value="transfer">Transfer</option>
                            <option value="stock_add">Stok Ekleme</option>
                        </select>
                    </div>
                </template>                <template v-else>
                    <div>
                        <label>Proje</label>
                        <select class="form-select" v-model="filters.projectId">
                            <option value="">Tümü</option>
                            <option v-for="project in availableProjects" :key="project.id" :value="project.id">{{ project.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label>Kategori</label>
                        <select class="form-select" v-model="filters.categoryId">
                            <option value="">Tümü</option>
                            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label>Depo</label>
                        <select class="form-select" v-model="filters.warehouseId">
                            <option value="">Tümü</option>
                            <option v-for="warehouse in availableWarehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
                        </select>
                    </div>
                    <div v-if="selectedReport === 'stock-status'">
                        <label>Stok Durumu</label>
                        <select class="form-select" v-model="filters.stockStatus">
                            <option value="">Tümü</option>
                            <option value="normal">Normal</option>
                            <option value="critical">Kritik</option>
                            <option value="low">Düşük</option>
                        </select>
                    </div>
                </template>
            </div>

            <!-- Tablo -->
            <div class="table-responsive">
                <table class="table-striped">
                    <thead>
                        <tr>
                            <template v-if="selectedReport === 'stock-status' || selectedReport === 'low-stock'">
                                <th>Ürün Kodu</th>
                                <th>Ürün Adı</th>
                                <th>Kategori</th>
                                <th>Depo</th>
                                <th>Miktar</th>
                                <th>Min. Stok</th>
                                <th v-if="selectedReport === 'low-stock'">Eksik Miktar</th>
                                <th>Durum</th>
                            </template>
                            <template v-else-if="selectedReport === 'movement-history'">
                                <th>Hareket No</th>
                                <th>Tarih</th>
                                <th>Hareket Tipi</th>
                                <th>Ürün</th>
                                <th>Miktar</th>
                                <th>Kaynak Depo</th>
                                <th>Hedef Depo</th>
                                <th>Açıklama</th>
                            </template>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td :colspan="selectedReport === 'movement-history' ? 8 : 7" class="text-center">
                                <div class="flex justify-center items-center p-4">
                                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="selectedReport === 'stock-status' && stockData.length === 0">
                            <td colspan="7" class="text-center">Stok verisi bulunamadı.</td>
                        </tr>
                        <tr v-else-if="selectedReport === 'movement-history' && movementData.length === 0">
                            <td colspan="8" class="text-center">Hareket verisi bulunamadı.</td>
                        </tr>
                        <tr v-else-if="selectedReport === 'low-stock' && lowStockData.length === 0">
                            <td colspan="8" class="text-center">Kritik stok seviyesinde ürün bulunmamaktadır.</td>
                        </tr>
                        
                        <!-- Stok Durumu ve Kritik Stok Tablosu -->
                        <template v-if="selectedReport === 'stock-status' || selectedReport === 'low-stock'">
                            <tr v-for="item in paginatedItems" :key="item.id">
                                <td>{{ item.product?.code || '-' }}</td>
                                <td>{{ item.product?.name || '-' }}</td>
                                <td>{{ item.product?.category?.name || '-' }}</td>
                                <td>{{ itemWarehouse(item)?.name || '-' }}</td>
                                <td>{{ item.quantity }}</td>
                                <td>{{ item.product?.minStockLevel || 0 }}</td>
                                <td v-if="selectedReport === 'low-stock'">{{ (item.product?.minStockLevel || 0) - item.quantity }}</td>
                                <td>                                    <span :class="{
                                        'badge badge-success': isNormalStock(item),
                                        'badge badge-warning': isCriticalStock(item),
                                        'badge badge-danger': isLowStock(item)
                                    }">
                                        {{ getStockStatus(isStockItem(item) ? item : undefined) }}
                                    </span>
                                </td>
                            </tr>
                        </template>

                        <!-- Hareket Geçmişi Tablosu -->
                        <template v-if="selectedReport === 'movement-history'">
                            <tr v-for="item in paginatedItems" :key="item.id">
                                <td>{{ isMovementItem(item) ? item.movementNumber : '-' }}</td>
                                <td>{{ isMovementItem(item) ? formatDate(item.date) : '-' }}</td>
                                <td>                                    <span v-if="isMovementItem(item)" :class="{
                                        'badge badge-success': item.type === 'in',
                                        'badge badge-danger': item.type === 'out',
                                        'badge badge-info': item.type === 'transfer',
                                        'badge badge-warning': item.type === 'stock_add'
                                    }">
                                        {{ getMovementTypeLabel(item.type) }}
                                    </span>
                                </td>
                                <td>{{ item.product?.name || '-' }}</td>
                                <td>{{ item.quantity }}</td>
                                <td>{{ isMovementItem(item) ? item.sourceWarehouse?.name : '-' }}</td>
                                <td>{{ isMovementItem(item) && (item.type === 'transfer' || item.type === 'stock_add') ? item.targetWarehouse?.name : '-' }}</td>
                                <td>{{ isMovementItem(item) ? item.description : '-' }}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Sayfalama -->
            <div class="flex items-center justify-between mt-5">
                <div class="flex items-center gap-2">
                    <select class="form-select w-20" v-model="itemsPerPage">
                        <option>10</option>
                        <option>20</option>
                        <option>50</option>
                        <option>100</option>
                    </select>
                    <span>kayıt gösteriliyor</span>
                </div>
                <div class="flex items-center gap-2">
                    <button class="btn btn-outline-primary p-2" :disabled="currentPage === 1" @click="currentPage--">
                        ←
                    </button>
                    <span>Sayfa {{ currentPage }} / {{ totalPages }}</span>
                    <button class="btn btn-outline-primary p-2" :disabled="currentPage === totalPages" @click="currentPage++">
                        →
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory';
import { useProjectStore } from '@/stores/projects';
import { eventBus } from '@/composables/eventBus'; // Doğru yol: @/composables/eventBus

// Tip tanımlamaları
interface Product {
    id: string;
    code: string;
    name: string;
    unit: string;
    minStockLevel: number;
    category: Category;
    categoryId: string;  // Eklendi
    isActive: boolean;   // Eklendi
    description?: string;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    description?: string;
}

// AuthStore için özel tip tanımlaması yapmak yerine doğrudan store'u kullanıyoruz
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();

interface StockItem {
    id: string;
    product: Product;
    warehouse: Warehouse;
    quantity: number;
}

interface MovementItem {
    id: string;
    date: string; // ISO string format
    movementNumber: string;
    type: 'in' | 'out' | 'transfer' | 'stock_add';
    product: Product;
    quantity: number;
    sourceWarehouse: Warehouse;
    targetWarehouse?: Warehouse;
    description?: string;
}

interface Filters {
    startDate: string;
    endDate: string;
    categoryId: string;
    warehouseId: string;
    movementType: '' | 'in' | 'out' | 'transfer';
    stockStatus: '' | 'normal' | 'critical' | 'low';
    projectId: string;
}

const loading = ref(false);
const selectedReport = ref('stock-status');
const stockData = ref<StockItem[]>([]);
const movementData = ref<MovementItem[]>([]);
const lowStockData = ref<StockItem[]>([]);
const warehouses = ref<Warehouse[]>([]);
const categories = ref<Category[]>([]); // Tip tanımlaması eklendi
const itemsPerPage = ref(10);
const currentPage = ref(1);
const activeProjectId = ref<string | null>(null); // Aktif proje ID'si için ref

const filters = ref<Filters>({
    startDate: '',
    endDate: '',
    categoryId: '',
    warehouseId: '',
    movementType: '',
    stockStatus: '',
    projectId: ''
});

// Proje değişiklik olayını dinle
onMounted(() => {
    // Mevcut aktif projeyi al
    activeProjectId.value = projectStore.activeProjectId;
    
    // Proje değiştiğinde tetiklenecek fonksiyon
    const handleProjectChanged = (projectId: string | null) => {
        console.log('Rapor sayfası: Proje değişikliği algılandı:', projectId);
        activeProjectId.value = projectId;
        // Veri yükleme işlemini tekrar başlat
        loadReportData();
    };

    // Event bus'a subscribe ol
    eventBus.on('project-changed', handleProjectChanged);

    // Temizleme işlemi
    onBeforeUnmount(() => {
        eventBus.off('project-changed', handleProjectChanged);
    });
    
    // İlk verileri yükle
    loadInitialData();
});

watch([selectedReport, filters, currentPage, itemsPerPage], () => {
    if (selectedReport.value !== 'movement-history') {
        currentPage.value = 1; // Rapor değiştiğinde ilk sayfaya dön
    }
    loadReportData();
});

const loadInitialData = async () => {
    // Kategori ve depo verilerini yükle
    warehouses.value = inventoryStore.getWarehouses;
    categories.value = inventoryStore.getCategories;
    
    // İlk raporu yükle
    loadReportData();
};

const loadReportData = async () => {
    loading.value = true;
    try {
        switch (selectedReport.value) {
            case 'stock-status':
                loadStockData();
                break;
            case 'movement-history':
                loadMovementData();
                break;
            case 'low-stock':
                loadLowStockData();
                break;
        }
    } catch (error) {
        console.error('Rapor yüklenirken hata oluştu:', error);
    } finally {
        loading.value = false;
    }
};

// Store tiplerini düzenliyorum
interface StoreProduct {
    id: string;
    code: string;
    name: string;
    unit: string;
    categoryId: string;
    minStockLevel: number;
    category: Category;
    description?: string;
    isActive: boolean;
}

interface StoreStockItem {
    id: string;
    product: StoreProduct;
    warehouse: Warehouse;
    quantity: number;
}

interface StoreMovementItem {
    id: string;
    date: string;
    movementNumber: string;
    type: 'in' | 'out' | 'transfer' | 'stock_add';
    product: StoreProduct;
    quantity: number;
    sourceWarehouse: Warehouse;
    targetWarehouse?: Warehouse;
    description?: string;
}

// Store ve interface uyumluluğu için tip tanımlamalarını güncelliyorum
interface Product extends StoreProduct {
    // Ek alanlar buraya eklenebilir
}

interface StockItem extends StoreStockItem {
    // Ek alanlar buraya eklenebilir
}

interface MovementItem extends StoreMovementItem {
    // Ek alanlar buraya eklenebilir
}

// Güvenli filtreleme fonksiyonlarını güncelliyorum
const safeFilterByWarehouse = (items: StockItem[], warehouseId: string) => {
    return items.filter(item => item.warehouse?.id === warehouseId);
};

const safeFilterByCategory = (items: StockItem[], categoryId: string) => {
    return items.filter(item => item.product?.category?.id === categoryId);
};

const safeFilterByStockLevel = (items: StockItem[], type: 'low' | 'critical' | 'normal') => {
    return items.filter(item => {
        if (!item.product?.minStockLevel) return false;
        switch (type) {
            case 'low':
                return item.quantity < item.product.minStockLevel;
            case 'critical':
                return item.quantity === item.product.minStockLevel;
            case 'normal':
                return item.quantity > item.product.minStockLevel;
        }
    });
};

// Stok durumu kontrol fonksiyonları
const isNormalStock = (item: StockItem | MovementItem) => {
    if (!item.product?.minStockLevel) return false;
    return item.quantity > item.product.minStockLevel;
};

const isCriticalStock = (item: StockItem | MovementItem) => {
    if (!item.product?.minStockLevel) return false;
    return item.quantity === item.product.minStockLevel;
};

const isLowStock = (item: StockItem | MovementItem) => {
    if (!item.product?.minStockLevel) return false;
    return item.quantity < item.product.minStockLevel;
};

// Store'dan gelen veriyi dönüştürme fonksiyonları
const convertToStockItem = (item: any): StockItem => {
    // Eğer item veya item.product null ise boş bir stok öğesi döndür
    if (!item || !item.product) {
        console.warn('Eksik veya null stok verisi:', item);
        return {
            id: item?.id || 'unknown',
            product: {
                id: 'unknown',
                code: 'N/A',
                name: 'Bilinmeyen Ürün',
                unit: '',
                minStockLevel: 0,
                categoryId: '',
                isActive: false,
                category: {
                    id: '',
                    name: 'Kategori Yok',
                    description: ''
                },
                description: ''
            },
            warehouse: {
                id: item?.warehouse?.id || '',
                code: item?.warehouse?.code || 'N/A',
                name: item?.warehouse?.name || 'Bilinmeyen Depo'
            },
            quantity: item?.quantity || 0
        };
    }
    
    // Kategori null kontrolü
    const category = item.product.category || { id: '', name: 'Kategori Yok', description: '' };
    
    return {
        id: item.id,
        product: {
            id: item.product.id,
            code: item.product.code || 'N/A',
            name: item.product.name || 'İsimsiz Ürün',
            unit: item.product.unit || '',
            minStockLevel: item.product.minStockLevel || 0,
            categoryId: item.product.categoryId || '',
            isActive: !!item.product.isActive,
            category: {
                id: category.id || '',
                name: category.name || 'Kategori Yok',
                description: category.description || ''
            },
            description: item.product.description || ''
        },
        warehouse: {
            id: item.warehouse?.id || '',
            code: item.warehouse?.code || 'N/A',
            name: item.warehouse?.name || 'Bilinmeyen Depo'
        },
        quantity: item.quantity || 0
    };
};

const convertToMovementItem = (item: any): MovementItem => {
    return {
        id: item.id,
        date: typeof item.date === 'string' ? item.date : new Date().toISOString(),
        movementNumber: item.movementNumber,
        type: item.type,
        product: {
            id: item.product.id,
            code: item.product.code,
            name: item.product.name,
            unit: item.product.unit,
            minStockLevel: item.product.minStockLevel,
            categoryId: item.product.categoryId,
            isActive: item.product.isActive,
            category: {
                id: item.product.category.id,
                name: item.product.category.name,
                description: item.product.category.description
            },
            description: item.product.description
        },
        quantity: item.quantity,
        sourceWarehouse: {
            id: item.sourceWarehouse.id,
            code: item.sourceWarehouse.code,
            name: item.sourceWarehouse.name
        },
        targetWarehouse: item.targetWarehouse ? {
            id: item.targetWarehouse.id,
            code: item.targetWarehouse.code,
            name: item.targetWarehouse.name
        } : undefined,
        description: item.description
    };
};

// Veri yükleme fonksiyonları - iyileştirilmiş versiyon
const loadStockData = () => {
    try {
        console.log("Stok durum raporu yükleniyor...");
        
        // Ham verileri al
        const stocksRaw = inventoryStore.getStocks || [];
        const allProducts = inventoryStore.getProducts || [];
        
        console.log(`${stocksRaw.length} stok kaydı, ${allProducts.length} ürün bulundu`);
        
        // Stok kayıtlarından geçerli olanları işle
        const processedStocks: StockItem[] = [];
        
        for (const stock of stocksRaw) {
            // İlgili ürün ve depoyu bul
            const product = allProducts.find(p => p.id === stock.productId);
            const warehouse = warehouses.value.find(w => w.id === stock.warehouseId);
            
            // Eğer ürün ve depo bilgisi varsa geçerli bir stok öğesi oluştur
            if (product && warehouse) {
                // Kategori bilgisi
                const category = product.category || { 
                    id: '', 
                    name: 'Kategori Yok', 
                    description: '' 
                };
                
                // Stok öğesini oluştur
                processedStocks.push({
                    id: stock.id,
                    product: {
                        id: product.id,
                        code: product.code || '',
                        name: product.name || '',
                        unit: product.unit || '',
                        categoryId: product.categoryId || '',
                        minStockLevel: product.minStockLevel || 0,
                        isActive: !!product.isActive,
                        category: category,
                        description: product.description
                    },
                    warehouse: {
                        id: warehouse.id,
                        code: warehouse.code || '',
                        name: warehouse.name || ''
                    },
                    quantity: stock.quantity || 0
                });
            }
        }        console.log(`${processedStocks.length} geçerli stok kaydı işlendi`);
        
        // Yetki ve filtre kontrolü
        let filteredData = [...processedStocks];
        
        // Yetki kontrolü
        if (!authStore.isAdmin) {
            const yetkiliDepoCodu = authStore.getAuthorizedDepot;
            if (yetkiliDepoCodu) { // null kontrolü eklenmiştir
                const yetkiliDepo = warehouses.value.find(w => w.code === yetkiliDepoCodu);
                if (yetkiliDepo) {
                    filteredData = filteredData.filter(item => item.warehouse?.id === yetkiliDepo.id);
                }
            }
        }
        
        // Filtre: Depo
        if (filters.value.warehouseId) {
            filteredData = filteredData.filter(item => item.warehouse?.id === filters.value.warehouseId);
        }
          // Filtre: Kategori
        if (filters.value.categoryId) {
            filteredData = filteredData.filter(item => item.product?.category?.id === filters.value.categoryId);
        }
        
        // Filtre: Proje
        if (filters.value.projectId) {
            // Proje ID'sine göre filtreleme
            filteredData = filteredData.filter(stock => {
                // Doğrudan projectId eşleşmesi
                if ('projectId' in stock && stock.projectId === filters.value.projectId) {
                    return true;
                }
                
                // Depo bazlı proje filtreleme (proje-depo ilişkisini kullanarak)
                return inventoryStore.getStocksByProject(filters.value.projectId)
                    .some(projStock => projStock.id === stock.id);
            });
        } else if (activeProjectId.value !== null) {
            // Aktif projeye göre filtreleme (header'dan seçilen)
            filteredData = filteredData.filter(stock => {
                if ('projectId' in stock && stock.projectId === activeProjectId.value) {
                    return true;
                }
                
                return inventoryStore.getStocksByProject(activeProjectId.value as string)
                    .some(projStock => projStock.id === stock.id);
            });
        }
        
        // Filtre: Stok Durumu
        if (filters.value.stockStatus) {
            const status = filters.value.stockStatus;
            if (status === 'low') {
                filteredData = filteredData.filter(item => 
                    item.quantity < (item.product?.minStockLevel || 0)
                );
            } else if (status === 'critical') {
                filteredData = filteredData.filter(item => 
                    item.quantity === (item.product?.minStockLevel || 0)
                );
            } else if (status === 'normal') {
                filteredData = filteredData.filter(item => 
                    item.quantity > (item.product?.minStockLevel || 0)
                );
            }
        }
        
        stockData.value = filteredData;
        console.log(`${filteredData.length} kayıt filtrelendi ve gösteriliyor`);
        
    } catch (error) {
        console.error("Stok verilerini yüklerken hata:", error);
        stockData.value = [];
    }
};

// Hareket geçmişi verileri için iyileştirilmiş yükleme fonksiyonu
const loadMovementData = () => {
    try {
        console.log("Hareket geçmişi verisi yükleniyor");
        
        // Hareket verilerini, ürünleri ve depoları al
        const movementsRaw = inventoryStore.getMovements || [];
        const products = inventoryStore.getProducts || [];
        
        console.log(`${movementsRaw.length} hareket kaydı bulundu`);
        
        // Hareket verilerini işle
        const movements: MovementItem[] = [];
        
        for (const movement of movementsRaw) {
            try {
                // Ürün, kaynak depo ve hedef depo bilgilerini bul
                const product = products.find(p => p.id === movement.productId);
                const sourceWarehouse = warehouses.value.find(w => w.id === movement.sourceWarehouseId);
                const targetWarehouse = movement.targetWarehouseId ? 
                    warehouses.value.find(w => w.id === movement.targetWarehouseId) : undefined;
                
                // Eğer gerekli bileşenler bulunduysa hareket kaydını ekle
                if (product && sourceWarehouse) {
                    movements.push({
                        id: movement.id,
                        date: typeof movement.date === 'string' ? movement.date : new Date().toISOString(),
                        movementNumber: movement.movementNumber || `HRK-${movement.id.slice(0, 8)}`,
                        type: movement.type,
                        product: {
                            id: product.id,
                            code: product.code || 'Kod Yok',
                            name: product.name || 'İsimsiz Ürün',
                            unit: product.unit || '',
                            minStockLevel: product.minStockLevel || 0,
                            categoryId: product.categoryId || '',
                            isActive: !!product.isActive,
                            category: product.category || { id: '', name: 'Kategori Yok', description: '' }
                        },
                        quantity: movement.quantity || 0,
                        sourceWarehouse: {
                            id: sourceWarehouse.id,
                            code: sourceWarehouse.code || '',
                            name: sourceWarehouse.name || 'İsimsiz Depo'
                        },
                        targetWarehouse: targetWarehouse ? {
                            id: targetWarehouse.id,
                            code: targetWarehouse.code || '',
                            name: targetWarehouse.name || 'İsimsiz Depo'
                        } : undefined,
                        description: movement.description || ''
                    });
                } else {
                    console.warn("Eksik hareket bileşenleri:", {
                        movementId: movement.id,
                        productFound: !!product,
                        sourceWarehouseFound: !!sourceWarehouse
                    });
                }
            } catch (err) {
                console.error("Hareket dönüştürmede hata:", err);
            }
        }
        
        console.log(`${movements.length} hareket kaydı işlendi`);
        
        let filteredData = [...movements];        // Yetki kontolü
        const yetkiliDepoCodu = !authStore.isAdmin ? (authStore.getAuthorizedDepot as unknown as string) : null;
        // Sadece yetkiliDepoCodu bir string ise depot filtrelemesi yap
        if (yetkiliDepoCodu) {            const yetkiliDepo = warehouses.value.find(w => w.code === String(yetkiliDepoCodu));
            if (yetkiliDepo) {
                filteredData = filteredData.filter(item => 
                    item.sourceWarehouse?.id === yetkiliDepo.id || 
                    item.targetWarehouse?.id === yetkiliDepo.id
                );
            }
        }
        
        // Tarih filtresi
        if (filters.value.startDate && filters.value.endDate) {
            const startDate = new Date(filters.value.startDate);
            const endDate = new Date(filters.value.endDate);
            endDate.setHours(23, 59, 59, 999);

            filteredData = filteredData.filter(item => {
                try {
                    const itemDate = new Date(item.date);
                    return !isNaN(itemDate.getTime()) && itemDate >= startDate && itemDate <= endDate;
                } catch {
                    return false;
                }
            });
        }
        
        // Depo filtresi
        if (filters.value.warehouseId) {
            filteredData = filteredData.filter(item => 
                item.sourceWarehouse?.id === filters.value.warehouseId || 
                item.targetWarehouse?.id === filters.value.warehouseId
            );
        }
          // Hareket tipi filtresi
        if (filters.value.movementType) {
            filteredData = filteredData.filter(item => item.type === filters.value.movementType);
        }
        
        // Proje filtresi
        if (filters.value.projectId) {
            // Hareket kayıtlarında sourceProjectId veya targetProjectId varsa ona göre filtrele
            filteredData = filteredData.filter(movement => {
                // Doğrudan proje ID'si eşleşmesi
                if ('sourceProjectId' in movement && movement.sourceProjectId === filters.value.projectId) {
                    return true;
                }
                if ('targetProjectId' in movement && movement.targetProjectId === filters.value.projectId) {
                    return true;
                }
                
                // Depo bazlı proje filtreleme
                const projMovements = inventoryStore.getMovementsByProject(filters.value.projectId);
                return projMovements.some(pm => pm.id === movement.id);
            });
        } else if (activeProjectId.value !== null) {
            // Header'dan seçilen projeye göre filtreleme
            filteredData = filteredData.filter(movement => {
                if ('sourceProjectId' in movement && movement.sourceProjectId === activeProjectId.value) {
                    return true;
                }
                if ('targetProjectId' in movement && movement.targetProjectId === activeProjectId.value) {
                    return true;
                }
                
                const projMovements = inventoryStore.getMovementsByProject(activeProjectId.value as string);
                return projMovements.some(pm => pm.id === movement.id);
            });
        }
        
        // Tarihe göre sırala (yeniden eskiye)
        filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        movementData.value = filteredData;
        
        console.log(`${filteredData.length} hareket kaydı filtrelendi ve gösteriliyor`);
    } catch (error) {
        console.error("Hareket geçmişi yüklenirken hata:", error);
        movementData.value = [];
    }
};

// Kritik stok verileri için iyileştirilmiş yükleme fonksiyonu
const loadLowStockData = () => {
    try {
        console.log("Kritik stok verileri yükleniyor");
        
        // Ham verileri al
        const stocksRaw = inventoryStore.getStocks || [];
        const allProducts = inventoryStore.getProducts || [];
        
        // Stok kayıtlarını işleyip geçerli olanları belirle
        const processedStocks: StockItem[] = [];
        
        for (const stock of stocksRaw) {
            // İlgili ürün ve depoyu bul
            const product = allProducts.find(p => p.id === stock.productId);
            const warehouse = warehouses.value.find(w => w.id === stock.warehouseId);
            
            // Eğer ürün ve depo bilgisi varsa geçerli bir stok öğesi oluştur
            if (product && warehouse) {
                // Kategori bilgisi
                const category = product.category || { 
                    id: '', 
                    name: 'Kategori Yok', 
                    description: '' 
                };
                
                // Stok öğesini oluştur
                processedStocks.push({
                    id: stock.id,
                    product: {
                        id: product.id,
                        code: product.code || '',
                        name: product.name || '',
                        unit: product.unit || '',
                        categoryId: product.categoryId || '',
                        minStockLevel: product.minStockLevel || 0,
                        isActive: !!product.isActive,
                        category: category,
                        description: product.description
                    },
                    warehouse: {
                        id: warehouse.id,
                        code: warehouse.code || '',
                        name: warehouse.name || ''
                    },
                    quantity: stock.quantity || 0
                });
            }
        }
        
        // Kritik stok seviyesindeki ürünleri filtrele
        const lowStocks = processedStocks.filter(item => 
            item.quantity <= (item.product?.minStockLevel || 0)
        );
          console.log(`${lowStocks.length} kritik stok seviyesinde ürün bulundu`);
        
        // Filtreleme işlemleri
        let filteredData = [...lowStocks];
        
        // Yetki kontrolü
        if (!authStore.isAdmin) {
            const yetkiliDepoCodu = authStore.getAuthorizedDepot;
            if (yetkiliDepoCodu) { // null kontrolü eklenmiştir
                const yetkiliDepo = warehouses.value.find(w => w.code === yetkiliDepoCodu);
                if (yetkiliDepo) {
                    filteredData = filteredData.filter(item => item.warehouse?.id === yetkiliDepo.id);
                }
            }
        }
        
        // Filtre: Depo
        if (filters.value.warehouseId) {
            filteredData = filteredData.filter(item => item.warehouse?.id === filters.value.warehouseId);
        }
        
        // Filtre: Kategori
        if (filters.value.categoryId) {
            filteredData = filteredData.filter(item => item.product?.category?.id === filters.value.categoryId);
        }
        
        lowStockData.value = filteredData;
        console.log(`${filteredData.length} kritik stok kaydı filtrelendi ve gösteriliyor`);
        
    } catch (error) {
        console.error("Kritik stok verilerini yüklerken hata:", error);
        lowStockData.value = [];
    }
};

// Depo seçim listesi için computed property
const availableWarehouses = computed(() => {
    if (authStore.isAdmin) {
        return warehouses.value;
    }
    const yetkiliDepoCodu = authStore.getAuthorizedDepot as unknown as string;    // Sadece string bir değer varsa filtrele, yoksa boş dizi döndür
    return yetkiliDepoCodu 
        ? warehouses.value.filter(w => w.code === String(yetkiliDepoCodu))
        : [];
});

// Proje seçim listesi için computed property
const availableProjects = computed(() => {
    return projectStore.userProjects || [];
});

const selectReport = (reportType: string) => {
    selectedReport.value = reportType;
    loadReportData(); // Rapor türü değiştiğinde verileri yükle
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Tarih formatlama hatası:', error);
        return '-';
    }
};

const getMovementTypeLabel = (type: string) => {
    switch (type) {
        case 'in':
            return 'Giriş';
        case 'out':
            return 'Çıkış';
        case 'transfer':
            return 'Transfer';
        case 'stock_add':
            return 'Stok Ekleme';
        default:
            return type;
    }
};

const getStockStatus = (stock: StockItem | undefined) => {
    if (!stock?.product?.minStockLevel) return '-';
    if (stock.quantity > stock.product.minStockLevel) return 'Normal';
    if (stock.quantity === stock.product.minStockLevel) return 'Kritik';
    return 'Düşük';
};

const exportReport = async () => {
    try {
        loading.value = true;
        const reportData = filteredItems.value;
        const reportName = selectedReport.value === 'stock-status' ? 'Stok_Durum' :
                          selectedReport.value === 'movement-history' ? 'Hareket_Gecmisi' :
                          'Kritik_Stok';
        
        const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        const fileName = `${reportName}_${currentDate}.csv`;

        // CSV başlıkları
        let headers = '';
        let rows: string[] = [];

        if (selectedReport.value === 'movement-history') {
            headers = 'Hareket No,Tarih,Hareket Tipi,Ürün,Miktar,Kaynak Depo,Hedef Depo,Açıklama';
            rows = reportData.map(item => [
                item.movementNumber,
                formatDate(item.date),
                getMovementTypeLabel(item.type),
                item.product.name,
                item.quantity.toString(),
                item.sourceWarehouse.name,
                item.type === 'transfer' ? item.targetWarehouse?.name || '-' : '-',
                item.description || '-'
            ].join(','));
        } else {
            headers = 'Ürün Kodu,Ürün Adı,Kategori,Depo,Miktar,Min. Stok,Durum' + 
                     (selectedReport.value === 'low-stock' ? ',Eksik Miktar' : '');
            rows = reportData.map(item => [
                item.product.code,
                item.product.name,
                item.product.category.name,
                item.warehouse.name,
                item.quantity.toString(),
                item.product.minStockLevel.toString(),
                getStockStatus(item),
                selectedReport.value === 'low-stock' ? (item.product.minStockLevel - item.quantity).toString() : ''
            ].filter(Boolean).join(','));
        }

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Rapor dışa aktarılırken hata oluştu:', error);
    } finally {
        loading.value = false;
    }
};

// Sayfalama için computed properties
const filteredItems = computed(() => {
    switch (selectedReport.value) {
        case 'stock-status':
            return stockData.value;
        case 'movement-history':
            return movementData.value;
        case 'low-stock':
            return lowStockData.value;
        default:
            return [];
    }
});

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredItems.value.length / itemsPerPage.value));
});

const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredItems.value.slice(start, end);
});

// Öğe tipleri için kontrol fonksiyonları
const isStockItem = (item: any): item is StockItem => {
    return item && item.warehouse !== undefined && item.product !== undefined;
};

const isMovementItem = (item: any): item is MovementItem => {
    return item && item.movementNumber !== undefined && item.sourceWarehouse !== undefined;
};

// Depo bilgisi için yardımcı fonksiyon
const itemWarehouse = (item: StockItem | MovementItem): Warehouse | undefined => {
    if (isStockItem(item)) {
        return item.warehouse;
    }
    return undefined;
};
</script>