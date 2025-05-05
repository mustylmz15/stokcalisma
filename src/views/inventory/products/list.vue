<template>
    <div>
        <div class="panel">
            <div class="flex flex-col md:flex-row items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Ürünler</h5>
                <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
                    <!-- Filtreleme ve Arama -->
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1 md:w-48">
                            <select v-model="filters.categoryId" class="form-select">
                                <option value="">Tüm Kategoriler</option>
                                <option v-for="category in categories" :key="category.id" :value="category.id">
                                    {{ category.name }}
                                </option>
                            </select>
                        </div>
                        <div class="flex-1">
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="searchTerm" 
                                placeholder="Ürün ara..."
                            />                        </div>                    </div>
                    <div class="flex gap-2">
                        <router-link to="/inventory/products/manage" class="btn btn-info">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 ltr:mr-2 rtl:ml-2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                <path d="m15 5 3 3" />
                            </svg>
                            <span v-if="authStore.isAdmin">Ürün Yönetimi</span>
                            <span v-else>Depoya Ürün Ekle</span>
                        </router-link>
                        <router-link v-if="authStore.canEditItems" to="/inventory/products/add" class="btn btn-primary">
                            <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            Yeni Ürün
                        </router-link>
                    </div>
                </div>
            </div>

            <!-- Ürün Listesi -->
            <div class="table-responsive">
                <table class="table-striped">                    <thead>                        <tr>
                            <th>Ürün Kodu</th>
                            <th>Ürün Adı</th>
                            <th>Kategori</th>
                            <th>Alt Kategori</th>
                            <th>Stok Numarası</th>
                            <th>Toplam Stok</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="8" class="text-center">
                                <div class="flex justify-center items-center p-4">
                                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="paginatedProducts.length === 0">
                            <td colspan="8" class="text-center">
                                {{ searchTerm || filters.categoryId ? 'Arama kriterlerinize uygun ürün bulunamadı.' : 'Henüz ürün bulunmamaktadır.' }}
                            </td>
                        </tr>                        <tr v-for="product in paginatedProducts" :key="product.id">
                            <td>{{ product.code }}</td>
                            <td>{{ product.name }}</td>
                            <td>{{ product.category.name }}</td>
                            <td>{{ product.subCategory || '-' }}</td>
                            <td>{{ product.stockNumber || '-' }}</td>
                            <td>{{ product.totalStock }}</td>
                            <td>
                                <span :class="{
                                    'badge badge-success text-black': product.totalStock > product.minStockLevel,
                                    'badge badge-warning text-black': product.totalStock === product.minStockLevel,
                                    'badge badge-danger text-black': product.totalStock < product.minStockLevel
                                }">
                                    {{ getStockStatus(product) }}
                                </span>
                            </td>
                            <td>
                                <div class="flex gap-2">
                                    <router-link v-if="!authStore.isObserver" 
                                                :to="`/inventory/products/edit/${product.id}`" 
                                                class="btn btn-sm btn-outline-primary">
                                        <icon-pencil class="w-4.5 h-4.5" />
                                    </router-link>
                                    <button v-if="!authStore.isObserver" 
                                            class="btn btn-sm btn-outline-danger" 
                                            @click="showDeleteConfirmation(product)">
                                        <icon-trash-lines class="w-4.5 h-4.5" />
                                    </button>
                                    <span v-if="authStore.isObserver" 
                                          class="text-sm text-gray-500 italic">
                                        (Düzenleme yetkisi yok)
                                    </span>
                                </div>
                            </td>
                        </tr>
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

        <!-- Silme Onay Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-md">
                <div class="flex flex-col items-center mb-5">
                    <div class="text-red-500 p-4">
                        <icon-info-triangle class="w-12 h-12" />
                    </div>
                    <h5 class="font-semibold text-lg mb-2">Ürün Silme</h5>
                    <p class="text-center">
                        <strong>{{ productToDelete?.name }}</strong> ürününü silmek istediğinizden emin misiniz?<br>
                        Bu işlem geri alınamaz.
                    </p>
                </div>
                <div class="flex justify-center gap-4">
                    <button type="button" class="btn btn-outline-primary" @click="cancelDelete">
                        İptal
                    </button>
                    <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="loading">
                        <span v-if="loading" class="animate-spin mr-2">&#8635;</span>
                        Evet, Sil
                    </button>
                </div>
            </div>
        </div>

        <!-- Bildirim Toast -->
        <div 
            v-if="notification.show" 
            class="fixed top-4 right-4 p-4 rounded shadow-md z-50 transition-all duration-300"
            :class="{
                'bg-green-500 text-white': notification.type === 'success',
                'bg-red-500 text-white': notification.type === 'error',
                'bg-blue-500 text-white': notification.type === 'info'
            }"
        >
            <div class="flex items-center gap-2">
                <icon-circle-check v-if="notification.type === 'success'" class="w-5 h-5" />
                <icon-info-triangle v-else-if="notification.type === 'error'" class="w-5 h-5" />
                <icon-info-circle v-else-if="notification.type === 'info'" class="w-5 h-5" />
                <span>{{ notification.message }}</span>
                <button class="ml-4 text-white hover:text-gray-200" @click="closeNotification">
                    <icon-x class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/projects';
import { eventBus } from '@/composables/eventBus';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconPencil from '@/components/icon/icon-pencil.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconInfoTriangle from '@/components/icon/icon-info-triangle.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';

interface Warehouse {
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

interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    categoryId: string;
    category: Category;
    subCategory?: string;
    unit: string;
    stockNumber?: string;
    minStockLevel: number;
    totalStock: number;
}

interface Filters {
    categoryId: string;
}

interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

// Store'lar
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();

// Durum yönetimi
const loading = ref<boolean>(false);
const searchTerm = ref<string>('');
const currentPage = ref<number>(1);
const itemsPerPage = ref<number>(10);
const showDeleteModal = ref<boolean>(false);
const productToDelete = ref<Product | null>(null);
const activeProjectId = ref<string | null>(null);
const notification = ref<Notification>({
    show: false,
    message: '',
    type: 'info'
});

const filters = ref<Filters>({
    categoryId: ''
});

// Store'dan veri getirme
const products = computed<Product[]>(() => inventoryStore.getProducts);
const categories = computed<Category[]>(() => inventoryStore.getCategories);

// Hesaplanmış özellikler
const filteredProducts = computed<Product[]>(() => {
    let result = [...products.value];
    
    // Aktif proje filtresi
    if (activeProjectId.value !== null) {
        // Burada activeProjectId'ye göre filtreleme yapabiliriz
        // Ürünleri proje ID'sine göre filtrele
        console.log(`Ürünler ${activeProjectId.value} projesine göre filtreleniyor`);
        
        const projectedProducts = inventoryStore.getStocksByProject(activeProjectId.value as string);
        const productIdsInProject = projectedProducts.map(stock => stock.productId);
        
        result = result.filter(product => productIdsInProject.includes(product.id));
    }
    
    // Admin değilse sadece kendi deposundaki ürünleri göster
    if (!authStore.isAdmin) {
        const authorizedDepot = authStore.getAuthorizedDepot;
        if (authorizedDepot) {
            const foundWarehouse = (inventoryStore.getWarehouses as Array<Warehouse>)
                .find((w: Warehouse) => w.code === authorizedDepot);

            if (foundWarehouse) {
                result = result.filter(product => {
                    const stockInfo = inventoryStore.stocks.find(stock => stock.productId === product.id && stock.warehouseId === foundWarehouse.id);
                    return stockInfo !== undefined;
                });
            } else {
                result = [];
            }
        }
    }
    
    // Kategori filtresi
    if (filters.value.categoryId) {
        result = result.filter(product => product.categoryId === filters.value.categoryId);
    }
    
    // Arama filtresi
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        result = result.filter(product => 
            product.code.toLowerCase().includes(term) ||
            product.name.toLowerCase().includes(term) ||
            (product.description?.toLowerCase().includes(term) ?? false)
        );
    }
    
    return result;
});

const totalPages = computed<number>(() => {
    return Math.max(1, Math.ceil(filteredProducts.value.length / itemsPerPage.value));
});

const paginatedProducts = computed<Product[]>(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredProducts.value.slice(start, end);
});

// Metodlar
const loadProducts = async () => {
    loading.value = true;
    try {
        // InventoryStore'dan ürünlerin yüklenmesini sağla
        if (!inventoryStore.isInitialized) {
            await inventoryStore.initializeStore();
        } else {
            await inventoryStore.refreshData();
        }
        
        // Aktif proje ID'si varsa, ürünleri filtrele
        if (activeProjectId.value) {
            console.log('Ürünler aktif projeye göre filtreleniyor:', activeProjectId.value);
            // Filtreleme computed özelliğinde gerçekleşir
        }
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        showNotification('Ürünler yüklenirken bir hata oluştu', 'error');
    } finally {
        setTimeout(() => {
            loading.value = false;
        }, 300);
    }
};

const showNotification = (message: string, type: Notification['type'] = 'info'): void => {
    notification.value = {
        show: true,
        message,
        type
    };
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};

const closeNotification = (): void => {
    notification.value.show = false;
};

const showDeleteConfirmation = (product: Product): void => {
    productToDelete.value = product;
    showDeleteModal.value = true;
};

const cancelDelete = (): void => {
    showDeleteModal.value = false;
    productToDelete.value = null;
};

const confirmDelete = async (): Promise<void> => {
    if (!productToDelete.value) return;
    
    loading.value = true;
    try {
        await inventoryStore.deleteProduct(productToDelete.value.id);
        showNotification(`"${productToDelete.value.name}" ürünü başarıyla silindi`, 'success');
        showDeleteModal.value = false;
        productToDelete.value = null;
    } catch (error) {
        console.error('Ürün silinirken hata oluştu:', error);
        showNotification('Ürün silinirken bir hata oluştu', 'error');
    } finally {
        loading.value = false;
    }
};

const getStockStatus = (product: Product): string => {
    if (product.totalStock > product.minStockLevel) return 'Normal';
    if (product.totalStock === product.minStockLevel) return 'Kritik';
    return 'Düşük';
};

// Sayfa yüklendiğinde
onMounted(async () => {
    // Mevcut aktif projeyi al
    activeProjectId.value = projectStore.activeProjectId;
    
    // Proje değiştiğinde tetiklenecek fonksiyon
    const handleProjectChanged = (projectId: string | null) => {
        console.log('Ürünler sayfası: Proje değişikliği algılandı:', projectId);
        activeProjectId.value = projectId;
        
        // Ürün listesini yeniden yükle
        loadProducts();
    };

    // Event bus'a subscribe ol
    eventBus.on('project-changed', handleProjectChanged);

    // Temizleme işlemi
    onBeforeUnmount(() => {
        eventBus.off('project-changed', handleProjectChanged);
    });
    
    // İlk yüklemede ürünleri getir
    await loadProducts();
});
</script>