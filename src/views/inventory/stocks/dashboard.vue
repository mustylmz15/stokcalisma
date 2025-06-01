<template>
    <div>
        <!-- Sayfa Başlığı -->
        <div class="flex items-center justify-between mb-5">
            <h5 class="font-semibold text-lg dark:text-white-light">Stok Yönetimi</h5>
            <div class="flex gap-2">
                <router-link to="/inventory/stocks/operations/stock-in" class="btn btn-primary">
                    <i class="las la-plus mr-1"></i> Stok Giriş
                </router-link>
                <router-link to="/inventory/stocks/operations/stock-out" class="btn btn-outline-primary">
                    <i class="las la-minus mr-1"></i> Stok Çıkış
                </router-link>
            </div>
        </div>

        <!-- Özet Kartları -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <!-- Toplam Ürün Sayısı -->
            <div class="panel bg-gradient-to-r from-cyan-500 to-cyan-400">
                <div class="flex items-center">
                    <div class="shrink-0">
                        <div class="text-white bg-white/20 backdrop-blur-sm rounded-xl p-3">
                            <i class="las la-boxes text-2xl"></i>
                        </div>
                    </div>
                    <div class="ltr:ml-3 rtl:mr-3 text-white">
                        <p class="text-xs text-white/80">Toplam Ürün Çeşidi</p>
                        <h3 class="text-xl font-bold">{{ stats.totalProducts }}</h3>
                    </div>
                </div>
            </div>

            <!-- Toplam Stok Miktarı -->
            <div class="panel bg-gradient-to-r from-violet-500 to-violet-400">
                <div class="flex items-center">
                    <div class="shrink-0">
                        <div class="text-white bg-white/20 backdrop-blur-sm rounded-xl p-3">
                            <i class="las la-layer-group text-2xl"></i>
                        </div>
                    </div>
                    <div class="ltr:ml-3 rtl:mr-3 text-white">
                        <p class="text-xs text-white/80">Toplam Stok Adedi</p>
                        <h3 class="text-xl font-bold">{{ stats.totalQuantity.toLocaleString() }}</h3>
                    </div>
                </div>
            </div>

            <!-- Düşük Stok Uyarısı -->
            <div class="panel bg-gradient-to-r from-orange-500 to-orange-400">
                <div class="flex items-center">
                    <div class="shrink-0">
                        <div class="text-white bg-white/20 backdrop-blur-sm rounded-xl p-3">
                            <i class="las la-exclamation-triangle text-2xl"></i>
                        </div>
                    </div>
                    <div class="ltr:ml-3 rtl:mr-3 text-white">
                        <p class="text-xs text-white/80">Düşük Stok Uyarısı</p>
                        <h3 class="text-xl font-bold">{{ stats.lowStockProducts }}</h3>
                    </div>
                </div>
            </div>

            <!-- Aktif Depolar -->
            <div class="panel bg-gradient-to-r from-green-500 to-green-400">
                <div class="flex items-center">
                    <div class="shrink-0">
                        <div class="text-white bg-white/20 backdrop-blur-sm rounded-xl p-3">
                            <i class="las la-warehouse text-2xl"></i>
                        </div>
                    </div>
                    <div class="ltr:ml-3 rtl:mr-3 text-white">
                        <p class="text-xs text-white/80">Aktif Depolar</p>
                        <h3 class="text-xl font-bold">{{ stats.activeWarehouses }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <!-- Son Stok Hareketleri -->
            <div class="panel">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Son Stok Hareketleri</h5>
                    <router-link to="/inventory/stocks/movements/list" class="btn btn-outline-primary btn-sm">
                        Tümünü Gör
                    </router-link>
                </div>
                
                <div class="table-responsive" v-if="recentMovements.length > 0">
                    <table class="table-hover">
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Ürün</th>
                                <th>Hareket</th>
                                <th>Miktar</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="movement in recentMovements" :key="movement.id">
                                <td>
                                    <span class="text-xs text-gray-500">
                                        {{ formatDate(movement.created_at) }}
                                    </span>
                                </td>
                                <td>
                                    <div>
                                        <div class="font-semibold">{{ movement.product?.name }}</div>
                                        <div class="text-xs text-gray-500">{{ movement.product?.sku }}</div>
                                    </div>
                                </td>                                <td>
                                    <span :class="getMovementTypeClass(movement.movement_type)">
                                        {{ getMovementTypeText(movement.movement_type) }}
                                    </span>
                                </td>
                                <td>
                                    <span :class="movement.movement_type === 'out' ? 'text-red-500' : 'text-green-500'">
                                        {{ movement.movement_type === 'out' ? '-' : '+' }}{{ movement.quantity }}
                                    </span>
                                </td>
                                <td>
                                    <span :class="getStatusClass(movement.status)">
                                        {{ getStatusText(movement.status) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div v-else class="text-center py-8">
                    <i class="las la-history text-4xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500">Henüz stok hareketi bulunmamaktadır</p>
                </div>
            </div>

            <!-- Düşük Stoklu Ürünler -->
            <div class="panel">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Düşük Stoklu Ürünler</h5>
                    <router-link to="/inventory/stocks/list?filter=low-stock" class="btn btn-outline-danger btn-sm">
                        Tümünü Gör
                    </router-link>
                </div>
                
                <div class="space-y-3" v-if="lowStockItems.length > 0">
                    <div v-for="item in lowStockItems" :key="item.id" 
                         class="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark rounded-lg">
                        <div class="flex items-center">
                            <div class="w-2 h-2 rounded-full mr-3"
                                 :class="item.quantity === 0 ? 'bg-red-500' : 'bg-orange-500'"></div>
                            <div>
                                <div class="font-semibold">{{ item.product?.name }}</div>
                                <div class="text-xs text-gray-500">{{ item.product?.sku }}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold"
                                 :class="item.quantity === 0 ? 'text-red-500' : 'text-orange-500'">
                                {{ item.quantity }}
                            </div>
                            <div class="text-xs text-gray-500">{{ item.warehouse?.name }}</div>
                        </div>
                    </div>
                </div>
                
                <div v-else class="text-center py-8">
                    <i class="las la-check-circle text-4xl text-green-300 mb-2"></i>
                    <p class="text-gray-500">Tüm ürünler yeterli stok seviyesinde</p>
                </div>
            </div>
        </div>        <!-- Depo Bazında Stok Dağılımı -->
        <div class="panel">
            <div class="flex items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Depo Bazında Stok Dağılımı</h5>
                
                <!-- Filtreler -->
                <div class="flex gap-3">                    <select class="form-select w-48" v-model="selectedProjectFilter" @change="filterWarehouses">
                        <option value="">Tüm Projeler</option>
                        <option value="main-warehouses">Ana Depolar</option>
                        <option v-for="project in availableProjects" :key="project.id" :value="project.id">
                            {{ project.name }}
                        </option>
                    </select>
                    
                    <select class="form-select w-40" v-model="warehouseTypeFilter" @change="filterWarehouses">
                        <option value="">Tüm Depolar</option>
                        <option value="main">Ana Depo</option>
                        <option value="project">Proje Depoları</option>
                    </select>
                </div>
            </div>
            
            <!-- Depo Listesi -->
            <div v-if="filteredWarehouseStats.length > 0" class="space-y-3">
                <div v-for="warehouse in filteredWarehouseStats" :key="warehouse.id" 
                     class="flex items-center justify-between p-4 bg-white dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    
                    <!-- Sol Kısım: Depo Bilgileri -->
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <i class="las la-warehouse text-primary text-xl"></i>
                            </div>
                        </div>
                        
                        <div>
                            <h6 class="font-semibold text-lg">{{ warehouse.name }}</h6>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span v-if="warehouse.projectName" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {{ warehouse.projectName }}
                                </span>
                                <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {{ warehouse.warehouseType === 'main' ? 'Ana Depo' : 'Genel Depo' }}
                                </span>
                                <span>{{ warehouse.location }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sağ Kısım: İstatistikler -->
                    <div class="flex items-center space-x-8">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ warehouse.productCount }}</div>
                            <div class="text-xs text-gray-500">Ürün Çeşidi</div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-2xl font-bold text-primary">{{ warehouse.totalQuantity.toLocaleString() }}</div>
                            <div class="text-xs text-gray-500">Toplam Stok</div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-2xl font-bold" :class="warehouse.lowStockCount > 0 ? 'text-orange-500' : 'text-green-500'">
                                {{ warehouse.lowStockCount }}
                            </div>
                            <div class="text-xs text-gray-500">Düşük Stok</div>
                        </div>
                        
                        <!-- Düşük Stok Yüzdesi -->
                        <div class="text-center">
                            <div class="w-16 h-16 relative">
                                <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                    <circle 
                                        cx="32" cy="32" r="28" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        stroke-width="4" 
                                        class="text-gray-200"
                                    />
                                    <circle 
                                        cx="32" cy="32" r="28" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        stroke-width="4" 
                                        :stroke-dasharray="`${warehouse.lowStockPercentage * 1.76} 176`"
                                        :class="warehouse.lowStockPercentage > 20 ? 'text-red-500' : warehouse.lowStockPercentage > 10 ? 'text-orange-500' : 'text-green-500'"
                                        class="transition-all duration-300"
                                    />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-xs font-semibold">{{ warehouse.lowStockPercentage }}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Aksiyon Butonları -->
                        <div class="flex space-x-2">
                            <button 
                                @click="viewWarehouseDetails(warehouse)"
                                class="btn btn-sm btn-outline-primary"
                                title="Detayları Görüntüle"
                            >
                                <i class="las la-eye"></i>
                            </button>
                            <button 
                                @click="generateWarehouseReport(warehouse)"
                                class="btn btn-sm btn-outline-secondary"
                                title="Rapor Oluştur"
                            >
                                <i class="las la-file-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-else class="text-center py-8">
                <i class="las la-warehouse text-4xl text-gray-300 mb-2"></i>
                <p class="text-gray-500">
                    {{ selectedProjectFilter || warehouseTypeFilter ? 'Filtrelere uygun depo bulunamadı' : 'Henüz depo bilgisi bulunmamaktadır' }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useProjectStore } from '@/stores/projects';
import projectService from '@/services/projectService';

interface StockStats {
    totalProducts: number;
    totalQuantity: number;
    lowStockProducts: number;
    activeWarehouses: number;
}

interface StockMovement {
    id: string;
    product_id: string;
    movement_type: string;
    quantity: number;
    status: string;
    created_at: string;
    product?: any;
}

interface StockItem {
    id: string;
    product_id: string;
    warehouse_id: string;
    quantity: number;
    product?: any;
    warehouse?: any;
}

interface WarehouseStat {
    id: string;
    name: string;
    location: string;
    productCount: number;
    totalQuantity: number;
    lowStockCount: number;
    lowStockPercentage: number;
    projectName?: string;
    warehouseType: 'main' | 'project' | 'general';    parent_id?: string | null;
}

const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();

// Reaktif veriler
const loading = ref(false);
const stats = ref<StockStats>({
    totalProducts: 0,
    totalQuantity: 0,
    lowStockProducts: 0,
    activeWarehouses: 0
});

const recentMovements = ref<StockMovement[]>([]);
const lowStockItems = ref<StockItem[]>([]);
const warehouseStats = ref<WarehouseStat[]>([]);

// Filtre verileri
const selectedProjectFilter = ref<string>('');
const warehouseTypeFilter = ref<string>('');

// Computed properties
const lowStockThreshold = computed(() => 10); // Düşük stok eşiği

// Mevcut projeler
const availableProjects = computed(() => {
    if (!projectStore.projects || !Array.isArray(projectStore.projects)) {
        return [];
    }
    const activeProjects = projectStore.projects.filter(project => 
        project && typeof project === 'object' && project.is_active !== false
    );
    return activeProjects;
});

// Filtrelenmiş depo istatistikleri
const filteredWarehouseStats = computed(() => {    let filtered = [...warehouseStats.value];
    
    // Proje filtreleme
    if (selectedProjectFilter.value) {
        if (selectedProjectFilter.value === 'main-warehouses') {
            // Ana depolar: parent_id null olan depolar
            filtered = filtered.filter(warehouse => {
                const isMainWarehouse = !warehouse.parent_id || warehouse.parent_id === null;
                return isMainWarehouse;
            });
        } else {
            // Belirli bir proje seçilmişse o projeye ait depoları göster
            filtered = filtered.filter(warehouse => {
                if (warehouse.projectName) {
                    const projectId = getProjectIdByName(warehouse.projectName);
                    const matches = projectId === selectedProjectFilter.value;
                    return matches;
                }
                return false;
            });
        }
    }    
    // Depo türü filtreleme
    if (warehouseTypeFilter.value) {
        filtered = filtered.filter(warehouse => {
            const matches = warehouse.warehouseType === warehouseTypeFilter.value;
            return matches;
        });
    }
    
    return filtered;
});

// Yardımcı fonksiyonlar
const getProjectIdByName = (projectName: string): string | null => {
    if (!availableProjects.value || !Array.isArray(availableProjects.value)) {
        return null;
    }
    const project = availableProjects.value.find(p => p.name === projectName);
    return project ? project.id : null;
};

// Utility fonksiyonları
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getMovementTypeText = (type: string) => {
    const types: { [key: string]: string } = {
        'in': 'Giriş',
        'out': 'Çıkış',
        'transfer': 'Transfer',
        'adjustment': 'Düzeltme',
        'assignment': 'Atama',
        'return': 'İade'
    };
    return types[type] || type;
};

const getMovementTypeClass = (type: string) => {
    const classes: { [key: string]: string } = {
        'in': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200',
        'out': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200',
        'transfer': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200',
        'adjustment': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200',
        'assignment': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200',
        'return': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200'
    };
    return classes[type] || 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200';
};

const getStatusText = (status: string) => {
    const statuses: { [key: string]: string } = {
        'pending': 'Bekliyor',
        'approved': 'Onaylandı',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal',
        'rejected': 'Reddedildi'
    };
    return statuses[status] || status;
};

const getStatusClass = (status: string) => {
    const classes: { [key: string]: string } = {
        'pending': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200',
        'approved': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200',
        'completed': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200',
        'cancelled': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200',
        'rejected': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200'
    };
    return classes[status] || 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200';
};

// Veri yükleme fonksiyonları
const loadStats = async () => {
    try {
        // Inventory store'dan gerçek istatistikleri getir
        const dashboardStats = inventoryStore.getDashboardStats;
        const allStocks = inventoryStore.getStocks;
        
        // Toplam stok miktarını hesapla
        const totalQuantity = allStocks.reduce((total, stock) => total + stock.quantity, 0);
        
        stats.value = {
            totalProducts: dashboardStats.totalProducts,
            totalQuantity: totalQuantity,
            lowStockProducts: dashboardStats.lowStockCount,
            activeWarehouses: dashboardStats.totalWarehouses
        };
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
    }
};

const loadRecentMovements = async () => {
    try {
        // Inventory store'dan gerçek hareketleri getir
        const allMovements = inventoryStore.getMovements;
        const allProducts = inventoryStore.getProducts;
        const allWarehouses = inventoryStore.getWarehouses;
        
        // Son 10 hareketi al ve detay bilgilerini ekle
        const recentData = allMovements
            .slice(-10) // Son 10 hareket
            .reverse() // En yeniden en eskiye sırala
            .map(movement => {
                const product = allProducts.find(p => p.id === movement.product_id);
                
                return {
                    id: movement.id,
                    product_id: movement.product_id,
                    movement_type: movement.type,
                    quantity: movement.quantity,
                    status: 'completed', // Tüm hareketler tamamlanmış olarak varsayalım
                    created_at: movement.created_at || movement.date,                    product: product ? {
                        name: product.name,
                        sku: product.sku || product.name // Use sku property instead of code
                    } : null
                };
            });
        
        recentMovements.value = recentData;
    } catch (error) {
        console.error('Son hareketler yüklenirken hata:', error);
    }
};

const loadLowStockItems = async () => {
    try {
        // Inventory store'dan düşük stoklu ürünleri getir
        const lowStockData = inventoryStore.getLowStockProductsFiltered;
        
        // İlk 10 düşük stoklu ürünü al ve formatla
        const formattedItems = lowStockData
            .slice(0, 10)
            .map(item => ({
                id: item.id,
                product_id: item.product_id,
                warehouse_id: item.warehouse_id,
                quantity: item.quantity,                product: item.product ? {
                    name: item.product.name,
                    sku: item.product.sku || item.product.name // Use sku property instead of code
                } : null,
                warehouse: item.warehouse ? {
                    name: item.warehouse.name
                } : null
            }));
        
        lowStockItems.value = formattedItems;
    } catch (error) {
        console.error('Düşük stoklu ürünler yüklenirken hata:', error);
    }
};

const loadWarehouseStats = async () => {    try {
        // Inventory store'dan gerçek depo verilerini getir
        const allWarehouses = inventoryStore.getWarehouses;
        const allStocks = inventoryStore.getStocks;
        const allProducts = inventoryStore.getProducts;
        
        // Projeler için isim mapping'i oluştur
        const projectNameMap: { [key: string]: string } = {};
        if (availableProjects.value && Array.isArray(availableProjects.value)) {
            availableProjects.value.forEach(project => {
                projectNameMap[project.id] = project.name;
            });
        }
        
        // Her depo için istatistikleri hesapla
        const warehouseStatsData = await Promise.all(allWarehouses.map(async warehouse => {
            // Bu depodaki stokları getir
            const warehouseStocks = allStocks.filter(stock => stock.warehouse_id === warehouse.id);
            
            // Ürün çeşidi sayısı (benzersiz product_id'ler)
            const uniqueProductIds = [...new Set(warehouseStocks.map(stock => stock.product_id))];
            const productCount = uniqueProductIds.length;
            
            // Toplam stok adedi
            const totalQuantity = warehouseStocks.reduce((total, stock) => total + stock.quantity, 0);            // Düşük stoklu ürün sayısı
            const lowStockCount = warehouseStocks.filter(stock => {
                const product = allProducts.find(p => p.id === stock.product_id);
                return product && stock.quantity <= (product.minStockLevel || 0);
            }).length;
            
            // Düşük stok yüzdesi
            const lowStockPercentage = productCount > 0 ? Math.round((lowStockCount / productCount) * 100) : 0;            // Depo türünü belirle
            let warehouseType: 'main' | 'project' | 'general' = 'general';
            let projectName: string | undefined;
            
            // Ana depo kontrolü - parent_id null olanlar ana depodur
            if (!warehouse.parent_id || warehouse.parent_id === null) {
                warehouseType = 'main';
            } else {
                // Alt depo - projeye ait olup olmadığını kontrol et
                if (warehouse.project_id && availableProjects.value && Array.isArray(availableProjects.value)) {
                    const project = availableProjects.value.find(p => p.id === warehouse.project_id);
                    if (project) {
                        warehouseType = 'project';
                        projectName = project.name;
                    } else {
                        warehouseType = 'general';
                    }
                } else {
                    warehouseType = 'general';
                }
            }
              return {
                id: warehouse.id,
                name: warehouse.name,
                location: warehouse.description || warehouse.name || 'Belirtilmemiş',
                productCount,
                totalQuantity,
                lowStockCount,
                lowStockPercentage,
                projectName,
                warehouseType,
                parent_id: warehouse.parent_id
            };}));
          warehouseStats.value = warehouseStatsData;
    } catch (error) {
        console.error('Depo istatistikleri yüklenirken hata:', error);
    }
};

// Filtre fonksiyonu
const filterWarehouses = () => {
    // Computed property otomatik olarak filtreleme yapacak
};

// Depo detaylarını görüntüle
const viewWarehouseDetails = (warehouse: WarehouseStat) => {
    // Bu fonksiyon depo detay sayfasına yönlendirme yapabilir
    // Örnek: router.push(`/inventory/warehouses/${warehouse.id}`)
};

// Depo raporu oluştur
const generateWarehouseReport = (warehouse: WarehouseStat) => {
    // Bu fonksiyon depo raporu oluşturabilir
    // Örnek: PDF raporu indirme işlemi
};

// Ana yükleme fonksiyonu
const loadDashboardData = async () => {
    loading.value = true;
    try {
        // Store verilerinin mevcut olduğunu kontrol et
        await Promise.all([
            loadStats(),
            loadRecentMovements(),
            loadLowStockItems(),
            loadWarehouseStats()
        ]);
    } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
        loading.value = false;
    }
};

// Sayfa yüklendiğinde
onMounted(async () => {
    try {
        // Store'ları başlat
        if (!inventoryStore.isInitialized) {
            await inventoryStore.initializeStore();
        }

        if (!projectStore.isInitialized) {
            try {
                // Store'u initialize edelim
                if (typeof projectStore.initializeStore === 'function') {
                    await projectStore.initializeStore();
                } else {
                    await projectStore.loadUserProjects();
                    projectStore.isInitialized = true;
                }
            } catch (error) {
                console.error('Project store yükleme hatası:', error);
            }
        }
        
        // Store'ların yüklendiğinden emin olduktan sonra dashboard verilerini yükle
        await loadDashboardData();
    } catch (error) {
        console.error('Dashboard yüklenirken hata oluştu:', error);
    }
});
</script>

<style scoped>
/* Custom styling if needed - using standard CSS instead of @apply */
</style>
