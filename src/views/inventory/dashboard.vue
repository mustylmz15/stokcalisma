<template>
    <div>
        <div class="panel">
            <div class="flex items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Stok Yönetimi Dashboard</h5>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <!-- Toplam Ürün Kartı -->
                <div class="panel bg-gradient-to-r from-blue-500 to-blue-400">
                    <div class="flex justify-between">
                        <div class="text-white">
                            <h5 class="text-2xl font-semibold">{{ stats?.totalProducts || 0 }}</h5>
                            <h6 class="font-semibold mb-0">Toplam Ürün</h6>
                        </div>
                        <div class="text-white">
                            <i class="las la-box text-4xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Toplam Kategori Kartı -->
                <div class="panel bg-gradient-to-r from-green-500 to-green-400">
                    <div class="flex justify-between">
                        <div class="text-white">
                            <h5 class="text-2xl font-semibold">{{ stats?.totalCategories || 0 }}</h5>
                            <h6 class="font-semibold mb-0">Toplam Kategori</h6>
                        </div>
                        <div class="text-white">
                            <i class="las la-tags text-4xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Toplam Depo / Depo Adı Kartı -->
                <div class="panel bg-gradient-to-r from-orange-500 to-orange-400">
                    <div class="flex justify-between">
                        <div class="text-white">
                            <h5 class="text-2xl font-semibold" v-if="typeof stats?.totalWarehouses === 'number'">{{ stats?.totalWarehouses || 0 }}</h5>
                            <h5 class="text-2xl font-semibold" v-else>{{ stats?.totalWarehouses }}</h5>
                            <h6 class="font-semibold mb-0">{{ typeof stats?.totalWarehouses === 'number' ? 'Toplam Depo' : 'Depo' }}</h6>
                        </div>
                        <div class="text-white">
                            <i class="las la-warehouse text-4xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-6 mb-6">
                <!-- Son Hareketler -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Son Stok Hareketleri</h5>
                        <router-link to="/inventory/movements" class="text-primary hover:underline">
                            Tümünü Gör
                        </router-link>
                    </div>
                    <div class="table-responsive">
                        <table class="table-striped">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Ürün</th>
                                    <th>Hareket Türü</th>
                                    <th>Miktar</th>
                                    <th>Depo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="loading">
                                    <td colspan="5" class="text-center">
                                        <div class="flex justify-center items-center p-4">
                                            <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-else-if="!recentMovements?.length">
                                    <td colspan="5" class="text-center">Henüz hareket kaydı bulunmamaktadır.</td>
                                </tr>
                                <tr v-for="movement in recentMovements" :key="movement.id">
                                    <td>{{ formatDate(movement.date) }}</td>
                                    <td>{{ movement.product?.name || 'Bilinmiyor' }}</td>
                                    <td>
                                        <span :class="{
                                            'badge badge-success': movement.type === 'in',
                                            'badge badge-danger': movement.type === 'out',
                                            'badge badge-info': movement.type === 'transfer'
                                        }">
                                            {{ getMovementTypeLabel(movement.type) }}
                                        </span>
                                    </td>
                                    <td>{{ movement.quantity }} {{ movement.product?.unit || 'adet' }}</td>
                                    <td>
                                        <span v-if="movement.type === 'transfer' && movement.sourceWarehouse && movement.targetWarehouse">
                                            {{ movement.sourceWarehouse.name || 'Bilinmiyor' }} → {{ movement.targetWarehouse.name || 'Bilinmiyor' }}
                                        </span>
                                        <span v-else>
                                            {{ movement.sourceWarehouse?.name || 'Bilinmiyor' }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useInventoryStore, type Movement, type MovementWithDetails } from '@/stores/inventory';

interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    categoryId: string;
    category: {
        id: string;
        name: string;
        description?: string;
    };
    unit: string;
    minStockLevel: number;
    unitPrice: number;
    isActive: boolean;
    totalStock?: number;
}
import { useAuthStore } from '@/stores/auth-store';

interface Warehouse {
    id: string;
    code: string;
    name: string;
    address?: string;
    manager?: string;
    isActive: boolean;
}

interface DashboardStats {
    totalProducts: number;
    totalCategories: number;
    totalWarehouses: number | string;
    lowStockCount: number;
    warehouseId?: string;
}

const inventoryStore = useInventoryStore();
const authStore = useAuthStore();
const loading = ref(true);

// Kullanıcı rolüne göre dashboard istatistiklerini hesapla
const stats = computed<DashboardStats>(() => {
    // Admin veya gözlemci ise tüm istatistikleri göster
    if (authStore.isAdmin || authStore.isObserver) {
        return inventoryStore.getDashboardStats;
    }
    
    // Depo sorumlusu ise sadece kendi deposuna ait istatistikleri göster
    const authorizedDepot = authStore.getAuthorizedDepot;
    if (!authorizedDepot) return inventoryStore.getDashboardStats;
    
    // Yetkili olduğu depoyu bul
    const foundWarehouse = (inventoryStore.getWarehouses as Warehouse[]).find(w => w.code === authorizedDepot);
    if (!foundWarehouse) return inventoryStore.getDashboardStats;

    // Depodaki ürünleri bul
    const warehouseStocks = inventoryStore.stocks.filter(stock => stock.warehouseId === foundWarehouse.id);
    
    // Depodaki benzersiz ürün sayısı
    const productsInWarehouse = [...new Set(warehouseStocks.map(s => s.productId))];
    
    // Depodaki düşük stoklu ürünleri bul
    const lowStockInWarehouse = warehouseStocks.filter(stock => {
        const product = inventoryStore.getProducts.find(p => p.id === stock.productId);
        return product && stock.quantity <= product.minStockLevel;
    });
    
    return {
        totalProducts: productsInWarehouse.length,
        totalCategories: inventoryStore.getCategories.length,
        totalWarehouses: foundWarehouse.name,
        lowStockCount: lowStockInWarehouse.length,
        warehouseId: foundWarehouse.id
    };
});

// Kullanıcı rolüne ve yetkili depoya göre hareketleri filtrele
const recentMovements = computed(() => {
    const allMovements = inventoryStore.getMovements;
    
    // Kullanıcı rolü kontrol et
    if (authStore.isAdmin || authStore.isObserver) {
        return allMovements.slice(0, 5).map(movement => ({
            ...movement,
            product: inventoryStore.getProducts.find(product => product.id === movement.productId) as Product | undefined,
            sourceWarehouse: inventoryStore.getWarehouses.find(warehouse => warehouse.id === movement.sourceWarehouseId),
            targetWarehouse: movement.targetWarehouseId ? 
                inventoryStore.getWarehouses.find(warehouse => warehouse.id === movement.targetWarehouseId) : undefined
        })) as MovementWithDetails[];
    }
    
    // Depo sorumlusu yalnızca kendi deposuna ait hareketleri görebilir
    const authorizedDepot = authStore.getAuthorizedDepot;
    if (!authorizedDepot) return [];

    // Yetkili olduğu depoya ait hareketleri filtrele
    const filteredMovements = allMovements.filter(movement => {
        const sourceWarehouse = inventoryStore.getWarehouses.find(warehouse => warehouse.id === movement.sourceWarehouseId);
        const targetWarehouse = movement.targetWarehouseId ? 
            inventoryStore.getWarehouses.find(warehouse => warehouse.id === movement.targetWarehouseId) : undefined;
            
        return sourceWarehouse?.code === authorizedDepot || 
               targetWarehouse?.code === authorizedDepot;
    });
    
    return filteredMovements.slice(0, 5).map(movement => ({
        ...movement,
        product: inventoryStore.getProducts.find(product => product.id === movement.productId),
        sourceWarehouse: inventoryStore.getWarehouses.find(warehouse => warehouse.id === movement.sourceWarehouseId),
        targetWarehouse: movement.targetWarehouseId ? 
            inventoryStore.getWarehouses.find(warehouse => warehouse.id === movement.targetWarehouseId) : undefined
    }));
});

// Kullanıcı rolüne göre düşük stoklu ürünleri filtrele
const lowStockProducts = computed(() => {
    // Admin veya gözlemci ise tüm düşük stoklu ürünleri göster
    if (authStore.isAdmin || authStore.isObserver) {
        return inventoryStore.getLowStockProducts;
    }

    // Depo sorumlusu ise sadece kendi deposundaki düşük stoklu ürünleri göster
    const authorizedDepot = authStore.getAuthorizedDepot;
    if (!authorizedDepot) return [];

    const foundWarehouse = inventoryStore.getWarehouses
        .find(w => w.code === authorizedDepot);

    if (!foundWarehouse) return [];

    // Depodaki tüm stokları al
    const warehouseStocks = inventoryStore.getStocksByWarehouseId(foundWarehouse.id);
    
    // Düşük stoklu ürünleri filtrele ve dönüştür
    return warehouseStocks
        .map(stock => {
            const product = inventoryStore.getProducts.find(p => p.id === stock.productId);
            if (!product || stock.quantity > product.minStockLevel) return null;
            
            return {
                ...product,
                totalStock: stock.quantity
            };
        })
        .filter((item): item is (Product & { totalStock: number }) => item !== null && item !== undefined);
});

// Sayfa yüklendiğinde gerekli verileri yükle
onMounted(async () => {
    try {
        // Veri deposunu başlat
        await inventoryStore.initializeStore();
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
    } finally {
        // Veri yükleme işlemleri tamamlandı
        setTimeout(() => {
            loading.value = false;
        }, 300);
    }
});

// Yardımcı fonksiyonlar
const formatDate = (date: Date | string): string => {
    if (!date) return '';
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    } catch (error) {
        console.error('Tarih formatlarken hata:', error);
        return '';
    }
};

const getMovementTypeLabel = (type: 'in' | 'out' | 'transfer'): string => {
    switch (type) {
        case 'in':
            return 'Giriş';
        case 'out':
            return 'Çıkış';
        case 'transfer':
            return 'Transfer';
        default:
            return type || 'Bilinmiyor';
    }
};

const getStockStatus = (product: Product | null): string => {
    if (!product) return 'Bilinmiyor';
    
    const totalStock = product.totalStock || 0;
    const minStockLevel = product.minStockLevel || 0;
    
    if (totalStock > minStockLevel) {
        return 'Yeterli';
    } else if (totalStock === minStockLevel) {
        return 'Kritik';
    } else {
        return 'Yetersiz';
    }
};
</script>