<template>
    <div class="space-y-6">
        <!--
        TODO: Üst yönetime sorulacak fonksiyonel sorular:

        1. STOK SEVİYELERİ:
           - Minimum stok seviyesi ürün bazlı mı yoksa depo-ürün bazlı mı olmalı?
           - Maksimum stok kapasitesi kontrolü gerekli mi?

        2. STOK REZERVASYONU:
           - Ürünler rezerve edilebilecek mi? (Sipariş bekleyenler için)
           - Reserved quantity alanı gerekli mi?

        3. STOK SAYIMI:
           - Periyodik stok sayımı yapılacak mı?
           - Sayım tarihleri takip edilecek mi?

        4. ÜRÜN LOKASYONU:
           - Depo içi konum takibi (raf, koridor, alan) gerekli mi?
           - Barkod ile konum takibi yapılacak mı?

        5. ONAY SÜREÇLERİ:
           - Stok hareketleri onay sürecine tabi mi?
           - Hangi roller hangi işlemleri yapabilir?
        -->

        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{ warehouseName }} - Depo Stokları
                </h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Depo stok durumu ve ürün detayları
                </p>
            </div>
            <div class="mt-4 md:mt-0 flex space-x-3">
                <button 
                    type="button" 
                    class="btn btn-secondary"
                    @click="refreshStocks"
                    :disabled="loading"
                >
                    <Icon icon="refresh" class="w-4 h-4 mr-2" />
                    Yenile
                </button>
                <button 
                    type="button" 
                    class="btn btn-primary"
                    @click="openStockMovementModal"
                >
                    <Icon icon="plus" class="w-4 h-4 mr-2" />
                    Stok Hareketi
                </button>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="panel">
                <div class="flex items-center">
                    <div class="text-2xl text-primary">
                        <Icon icon="box" />
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold">{{ totalProducts }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Toplam Ürün</p>
                    </div>
                </div>
            </div>
            
            <div class="panel">
                <div class="flex items-center">
                    <div class="text-2xl text-success">
                        <Icon icon="check-circle" />
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold">{{ stockedProducts }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Stokta Bulunan</p>
                    </div>
                </div>
            </div>
            
            <div class="panel">
                <div class="flex items-center">
                    <div class="text-2xl text-warning">
                        <Icon icon="exclamation-triangle" />
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold">{{ lowStockProducts }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Düşük Stok</p>
                    </div>
                </div>
            </div>
            
            <div class="panel">
                <div class="flex items-center">
                    <div class="text-2xl text-danger">
                        <Icon icon="x-circle" />
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold">{{ outOfStockProducts }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Tükenen Stok</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="panel">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Category Filter -->
                <div>
                    <label class="block text-sm font-medium mb-2">Kategori</label>
                    <select 
                        v-model="filters.category" 
                        class="form-select"
                        @change="applyFilters"
                    >
                        <option value="">Tüm Kategoriler</option>
                        <option 
                            v-for="category in categories" 
                            :key="category.id" 
                            :value="category.id"
                        >
                            {{ category.name }}
                        </option>
                    </select>
                </div>

                <!-- Stock Status Filter -->
                <div>
                    <label class="block text-sm font-medium mb-2">Stok Durumu</label>
                    <select 
                        v-model="filters.stockStatus" 
                        class="form-select"
                        @change="applyFilters"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="in_stock">Stokta</option>
                        <option value="low_stock">Düşük Stok</option>
                        <option value="out_of_stock">Tükenen</option>
                    </select>
                </div>

                <!-- Search -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium mb-2">Ürün Ara</label>
                    <div class="relative">
                        <input 
                            type="text" 
                            v-model="filters.search"
                            placeholder="Ürün adı veya kodu ile ara..."
                            class="form-input pl-10"
                            @input="applyFilters"
                        />
                        <Icon icon="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Stock List Table -->
        <div class="panel">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold">Stok Listesi</h2>
                <div class="text-sm text-gray-600">
                    {{ filteredStocks.length }} ürün gösteriliyor
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span class="ml-3">Stoklar yükleniyor...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-12">
                <Icon icon="exclamation-triangle" class="w-12 h-12 text-danger mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hata Oluştu</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
                <button @click="refreshStocks" class="btn btn-primary">
                    Tekrar Dene
                </button>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredStocks.length === 0" class="text-center py-12">
                <Icon icon="box" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {{ stocks.length === 0 ? 'Bu depoda henüz stok bulunmuyor' : 'Arama kriterlerinize uygun ürün bulunamadı' }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ stocks.length === 0 ? 'İlk stok girişini yapmak için "Stok Hareketi" butonunu kullanın.' : 'Filtreleri değiştirerek tekrar deneyin.' }}
                </p>
            </div>

            <!-- Stock Table -->
            <div v-else class="overflow-x-auto">
                <table class="table-auto w-full">
                    <thead>
                        <tr class="bg-gray-50 dark:bg-gray-700">
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Ürün
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Mevcut Stok
                            </th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Min. Stok
                            </th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Durum
                            </th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Son Hareket
                            </th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr 
                            v-for="stock in filteredStocks" 
                            :key="stock.id"
                            class="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <!-- Product Info -->
                            <td class="px-4 py-4">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">
                                        {{ stock.product.name }}
                                    </div>
                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        Kod: {{ stock.product.code }}
                                    </div>
                                </div>
                            </td>

                            <!-- Category -->
                            <td class="px-4 py-4">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {{ stock.product.category?.name || 'Kategorisiz' }}
                                </span>
                            </td>

                            <!-- Current Stock -->
                            <td class="px-4 py-4 text-right">
                                <span class="font-semibold text-lg">{{ stock.quantity }}</span>
                                <span class="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                    {{ stock.product.unit || 'adet' }}
                                </span>
                            </td>

                            <!-- Minimum Stock -->
                            <td class="px-4 py-4 text-right">
                                <span class="text-sm">{{ stock.product.minimum_stock || '-' }}</span>
                            </td>

                            <!-- Status -->
                            <td class="px-4 py-4 text-center">
                                <span 
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    :class="getStockStatusClass(stock)"
                                >
                                    {{ getStockStatusText(stock) }}
                                </span>
                            </td>

                            <!-- Last Movement -->
                            <td class="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                {{ formatDate(stock.last_movement_date) }}
                            </td>

                            <!-- Actions -->
                            <td class="px-4 py-4 text-center">
                                <div class="flex items-center justify-center space-x-2">
                                    <button
                                        @click="openStockInModal(stock)"
                                        class="text-success hover:text-success-dark"
                                        title="Stok Giriş"
                                    >
                                        <Icon icon="plus-circle" class="w-5 h-5" />
                                    </button>
                                    <button
                                        @click="openStockOutModal(stock)"
                                        class="text-warning hover:text-warning-dark"
                                        title="Stok Çıkış"
                                        :disabled="stock.quantity <= 0"
                                    >
                                        <Icon icon="minus-circle" class="w-5 h-5" />
                                    </button>
                                    <button
                                        @click="openTransferModal(stock)"
                                        class="text-primary hover:text-primary-dark"
                                        title="Transfer"
                                        :disabled="stock.quantity <= 0"
                                    >
                                        <Icon icon="arrow-right-circle" class="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '@/components/icon/Icon.vue';

// Types
interface Product {
    id: string;
    name: string;
    code: string;
    unit?: string;
    minimum_stock?: number;
    category?: {
        id: string;
        name: string;
    };
}

interface Stock {
    id: string;
    product_id: string;
    warehouse_id: string;
    quantity: number;
    last_movement_date?: string;
    product: Product;
}

interface Category {
    id: string;
    name: string;
}

// Route
const route = useRoute();
const warehouseId = computed(() => route.params.id as string);

// State
const loading = ref(false);
const error = ref('');
const warehouseName = ref('');
const stocks = ref<Stock[]>([]);
const categories = ref<Category[]>([]);

// Filters
const filters = ref({
    category: '',
    stockStatus: '',
    search: ''
});

// Computed Properties
const totalProducts = computed(() => stocks.value.length);

const stockedProducts = computed(() => 
    stocks.value.filter(stock => stock.quantity > 0).length
);

const lowStockProducts = computed(() => 
    stocks.value.filter(stock => {
        const minStock = stock.product.minimum_stock || 5; // Default minimum 5
        return stock.quantity > 0 && stock.quantity <= minStock;
    }).length
);

const outOfStockProducts = computed(() => 
    stocks.value.filter(stock => stock.quantity === 0).length
);

const filteredStocks = computed(() => {
    let filtered = [...stocks.value];

    // Category filter
    if (filters.value.category) {
        filtered = filtered.filter(stock => 
            stock.product.category?.id === filters.value.category
        );
    }

    // Stock status filter
    if (filters.value.stockStatus) {
        filtered = filtered.filter(stock => {
            const minStock = stock.product.minimum_stock || 5;
            switch (filters.value.stockStatus) {
                case 'in_stock':
                    return stock.quantity > minStock;
                case 'low_stock':
                    return stock.quantity > 0 && stock.quantity <= minStock;
                case 'out_of_stock':
                    return stock.quantity === 0;
                default:
                    return true;
            }
        });
    }

    // Search filter
    if (filters.value.search) {
        const searchTerm = filters.value.search.toLowerCase();
        filtered = filtered.filter(stock =>
            stock.product.name.toLowerCase().includes(searchTerm) ||
            stock.product.code.toLowerCase().includes(searchTerm)
        );
    }

    return filtered;
});

// Methods
const refreshStocks = async () => {
    await loadWarehouseStocks();
};

const loadWarehouseStocks = async () => {
    loading.value = true;
    error.value = '';
    
    try {
        // Mock data for now - bu kısımda gerçek API çağrısı yapılacak
        setTimeout(() => {
            warehouseName.value = 'Ana Depo';
            
            stocks.value = [
                {
                    id: '1',
                    product_id: 'p1',
                    warehouse_id: warehouseId.value,
                    quantity: 25,
                    last_movement_date: '2024-05-28T10:30:00Z',
                    product: {
                        id: 'p1',
                        name: 'Laptop Dell Inspiron',
                        code: 'DELL-INS-001',
                        unit: 'adet',
                        minimum_stock: 10,
                        category: { id: 'c1', name: 'Bilgisayar' }
                    }
                },
                {
                    id: '2',
                    product_id: 'p2',
                    warehouse_id: warehouseId.value,
                    quantity: 3,
                    last_movement_date: '2024-05-27T14:20:00Z',
                    product: {
                        id: 'p2',
                        name: 'Klavye Logitech',
                        code: 'LOG-KB-001',
                        unit: 'adet',
                        minimum_stock: 5,
                        category: { id: 'c2', name: 'Aksesuar' }
                    }
                },
                {
                    id: '3',
                    product_id: 'p3',
                    warehouse_id: warehouseId.value,
                    quantity: 0,
                    last_movement_date: '2024-05-25T09:15:00Z',
                    product: {
                        id: 'p3',
                        name: 'Mouse Wireless',
                        code: 'MOUSE-001',
                        unit: 'adet',
                        minimum_stock: 8,
                        category: { id: 'c2', name: 'Aksesuar' }
                    }
                }
            ];

            categories.value = [
                { id: 'c1', name: 'Bilgisayar' },
                { id: 'c2', name: 'Aksesuar' },
                { id: 'c3', name: 'Yazılım' }
            ];

            loading.value = false;
        }, 1000);
        
    } catch (err) {
        error.value = 'Stoklar yüklenirken bir hata oluştu';
        loading.value = false;
    }
};

const applyFilters = () => {
    // Filters are reactive, so this triggers computed recalculation
};

const getStockStatusClass = (stock: Stock) => {
    const minStock = stock.product.minimum_stock || 5;
    
    if (stock.quantity === 0) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (stock.quantity <= minStock) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
};

const getStockStatusText = (stock: Stock) => {
    const minStock = stock.product.minimum_stock || 5;
    
    if (stock.quantity === 0) {
        return 'Tükendi';
    } else if (stock.quantity <= minStock) {
        return 'Düşük Stok';
    } else {
        return 'Normal';
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// Modal Actions (to be implemented)
const openStockMovementModal = () => {
    console.log('Open stock movement modal');
};

const openStockInModal = (stock: Stock) => {
    console.log('Open stock in modal for:', stock);
};

const openStockOutModal = (stock: Stock) => {
    console.log('Open stock out modal for:', stock);
};

const openTransferModal = (stock: Stock) => {
    console.log('Open transfer modal for:', stock);
};

// Lifecycle
onMounted(() => {
    loadWarehouseStocks();
});

// Watch route changes
watch(() => warehouseId.value, () => {
    if (warehouseId.value) {
        loadWarehouseStocks();
    }
});
</script>
