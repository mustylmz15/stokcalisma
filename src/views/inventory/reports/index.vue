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
                        <label>Hareket Tipi</label>
                        <select class="form-select" v-model="filters.movementType">
                            <option value="">Tümü</option>
                            <option value="in">Giriş</option>
                            <option value="out">Çıkış</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                </template>
                <template v-else>
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
                                <td>
                                    <span :class="{
                                     /* 'badge badge-success': isNormalStock(item),
                                        'badge badge-warning': isCriticalStock(item),
                                        'badge badge-danger': isLowStock(item)
                                        */
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
                                <td>
                                    <span v-if="isMovementItem(item)" :class="{
                                    /*
                                        'badge badge-success': item.type === 'in',
                                        'badge badge-danger': item.type === 'out',
                                        'badge badge-info': item.type === 'transfer' 
                                    */
                                   
                                    }">
                                        {{ getMovementTypeLabel(item.type) }}
                                    </span>
                                </td>
                                <td>{{ item.product?.name || '-' }}</td>
                                <td>{{ item.quantity }}</td>
                                <td>{{ isMovementItem(item) ? item.sourceWarehouse?.name : '-' }}</td>
                                <td>{{ isMovementItem(item) && item.type === 'transfer' ? item.targetWarehouse?.name : '-' }}</td>
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
import { ref, watch, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory.js';

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

// AuthStore için tip tanımlaması
interface AuthStore {
    isAdmin: boolean;
    getAuthorizedDepot: () => string;
}

const authStore = useAuthStore() as unknown as AuthStore;
const inventoryStore = useInventoryStore();

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
    type: 'in' | 'out' | 'transfer';
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

const filters = ref<Filters>({
    startDate: '',
    endDate: '',
    categoryId: '',
    warehouseId: '',
    movementType: '',
    stockStatus: ''
});

onMounted(() => {
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
    type: 'in' | 'out' | 'transfer';
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
        date: typeof item.date === 'string' ? item.date : item.date.toISOString(),
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

// Veri yükleme fonksiyonları
const loadStockData = () => {
    const stocks = (inventoryStore.getStocks as any[]).map(convertToStockItem);
    let filteredData = [...stocks];
    
    if (!authStore.isAdmin) {
        const yetkiliDepoCodu = authStore.getAuthorizedDepot();
        const yetkiliDepo = warehouses.value.find(w => w.code === yetkiliDepoCodu);
        if (yetkiliDepo) {
            filteredData = safeFilterByWarehouse(filteredData, yetkiliDepo.id);
        }
    }
    
    if (filters.value.warehouseId) {
        filteredData = safeFilterByWarehouse(filteredData, filters.value.warehouseId);
    }
    
    if (filters.value.categoryId) {
        filteredData = safeFilterByCategory(filteredData, filters.value.categoryId);
    }
    
    if (filters.value.stockStatus) {
        filteredData = safeFilterByStockLevel(filteredData, filters.value.stockStatus as 'low' | 'critical' | 'normal');
    }
    
    stockData.value = filteredData;
};

const loadMovementData = () => {
    const movements = (inventoryStore.getMovements as any[]).map(convertToMovementItem);
    let filteredData = [...movements];
    
    const yetkiliDepoCodu = !authStore.isAdmin ? authStore.getAuthorizedDepot() : null;
    const yetkiliDepo = yetkiliDepoCodu ? warehouses.value.find(w => w.code === yetkiliDepoCodu) : null;
    
    if (yetkiliDepo) {
        filteredData = filteredData.filter(item => 
            item.sourceWarehouse?.id === yetkiliDepo.id || 
            item.targetWarehouse?.id === yetkiliDepo.id
        );
    }
    
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
    
    if (filters.value.warehouseId) {
        filteredData = filteredData.filter(item => 
            item.sourceWarehouse?.id === filters.value.warehouseId || 
            item.targetWarehouse?.id === filters.value.warehouseId
        );
    }
    
    if (filters.value.movementType) {
        filteredData = filteredData.filter(item => item.type === filters.value.movementType);
    }
    
    filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    movementData.value = filteredData;
};

const loadLowStockData = () => {
    const stocks = (inventoryStore.getStocks as any[]).map(convertToStockItem);
    const lowStocks = stocks.filter(item => item.quantity <= (item.product?.minStockLevel || 0));
    
    let filteredData = [...lowStocks];
    
    if (!authStore.isAdmin) {
        const yetkiliDepoCodu = authStore.getAuthorizedDepot();
        const yetkiliDepo = warehouses.value.find(w => w.code === yetkiliDepoCodu);
        if (yetkiliDepo) {
            filteredData = filteredData.filter(item => item.warehouse?.id === yetkiliDepo.id);
        }
    }
    
    if (filters.value.warehouseId) {
        filteredData = filteredData.filter(item => item.warehouse?.id === filters.value.warehouseId);
    }
    
    if (filters.value.categoryId) {
        filteredData = filteredData.filter(item => item.product?.category?.id === filters.value.categoryId);
    }
    
    lowStockData.value = filteredData;
};

// Depo seçim listesi için computed property
const availableWarehouses = computed(() => {
    if (authStore.isAdmin) {
        return warehouses.value;
    }
    const yetkiliDepoCodu = authStore.getAuthorizedDepot();
    return warehouses.value.filter(w => w.code === yetkiliDepoCodu);
});

const selectReport = (reportType: string) => {
    selectedReport.value = reportType;
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

// Template'deki koşullu render için tip kontrol fonksiyonları
const isStockItem = (item: any): item is StockItem => {
    return 'warehouse' in item && !('sourceWarehouse' in item);
};

const isMovementItem = (item: any): item is MovementItem => {
    return 'sourceWarehouse' in item && 'type' in item;
};

// Template'de kullanılacak computed property'ler
const itemWarehouse = computed(() => (item: StockItem | MovementItem) => {
    if (isStockItem(item)) {
        return item.warehouse;
    }
    return null;
});

const itemMovementDetails = computed(() => (item: StockItem | MovementItem) => {
    if (isMovementItem(item)) {
        return {
            sourceWarehouse: item.sourceWarehouse,
            targetWarehouse: item.targetWarehouse,
            type: item.type,
            movementNumber: item.movementNumber,
            date: item.date
        };
    }
    return null;
});
</script>