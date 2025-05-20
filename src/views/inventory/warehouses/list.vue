<template>
    <div>
        <div class="panel">
            <div class="flex items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Depolar</h5>
                <button class="btn btn-primary" @click="openAddModal">
                    <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2" /> Yeni Depo Ekle
                </button>
            </div>

            <!-- Depo Listesi -->
            <div class="table-responsive">
                <table class="table-striped">
                    <thead>
                        <tr>
                            <th>Depo Kodu</th>
                            <th>Depo Adı</th>
                            <th>Lokasyon</th>
                            <th>Sorumlu</th>
                            <th>Proje</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="7" class="text-center">
                                <div class="flex justify-center items-center p-4">
                                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="visibleWarehouses.length === 0">
                            <td colspan="7" class="text-center">Henüz depo bulunmamaktadır.</td>
                        </tr>
                        <tr v-for="warehouse in visibleWarehouses" :key="warehouse.id">
                            <td>{{ warehouse.code }}</td>
                            <td>{{ warehouse.name }}</td>
                            <td>{{ warehouse.address }}</td>
                            <td>{{ warehouse.manager }}</td>
                            <td>
                                <span 
                                    v-if="getWarehouseProjects(warehouse.id).length > 0" 
                                    class="badge badge-outline-info"
                                >
                                    {{ getWarehouseProjects(warehouse.id).join(', ') }}
                                </span>
                                <span v-else class="text-gray-400">Atanmamış</span>
                            </td>
                            <td>
                                <span :class="{
                                    'badge badge-success text-black': warehouse.isActive,
                                    'badge badge-danger text-black': !warehouse.isActive
                                }">
                                    {{ warehouse.isActive ? 'Aktif' : 'Pasif' }}
                                </span>
                            </td>
                            <td>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-outline-primary" @click="editWarehouse(warehouse)">
                                        <icon-pencil class="w-4.5 h-4.5" />
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="deleteWarehouse(warehouse.id)">
                                        <icon-trash-lines class="w-4.5 h-4.5" />
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" @click="viewStock(warehouse)">
                                        <icon-box class="w-4.5 h-4.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Sayfalama Kontrolleri -->
            <div class="flex items-center justify-between mt-5">
                <p class="text-sm">Toplam: {{ warehouses.length }} depo</p>
                <div class="flex items-center gap-2">
                    <button 
                        class="btn btn-sm btn-outline-primary" 
                        :disabled="currentPage === 1"
                        @click="currentPage--">
                        Önceki
                    </button>
                    <span class="text-sm">{{ currentPage }} / {{ totalPages }}</span>
                    <button 
                        class="btn btn-sm btn-outline-primary" 
                        :disabled="currentPage === totalPages"
                        @click="currentPage++">
                        Sonraki
                    </button>
                </div>
            </div>
        </div>

        <!-- Depo Ekleme/Düzenleme Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-lg">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg">{{ isEditing ? 'Depo Düzenle' : 'Yeni Depo Ekle' }}</h5>
                    <button class="text-gray-400 hover:text-gray-800" @click="closeModal">
                        <icon-x class="w-5 h-5" />
                    </button>
                </div>

                <form @submit.prevent="handleSubmit">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="mb-4">
                            <label>Depo Kodu <span class="text-red-500">*</span></label>
                            <input
                                type="text"
                                class="form-input"
                                v-model="formData.code"
                                required
                                :readonly="isEditing"
                                :class="{'border-red-500': formErrors.code}"
                            />
                            <p v-if="formErrors.code" class="text-red-500 text-xs mt-1">{{ formErrors.code }}</p>
                        </div>

                        <div class="mb-4">
                            <label>Depo Adı <span class="text-red-500">*</span></label>
                            <input
                                type="text"
                                class="form-input"
                                v-model="formData.name"
                                required
                                :class="{'border-red-500': formErrors.name}"
                            />
                            <p v-if="formErrors.name" class="text-red-500 text-xs mt-1">{{ formErrors.name }}</p>
                        </div>

                        <div class="mb-4 sm:col-span-2">
                            <label>Lokasyon <span class="text-red-500">*</span></label>
                            <textarea
                                class="form-textarea"
                                rows="3"
                                v-model="formData.address"
                                required
                                :class="{'border-red-500': formErrors.address}"
                            ></textarea>
                            <p v-if="formErrors.address" class="text-red-500 text-xs mt-1">{{ formErrors.address }}</p>
                        </div>

                        <div class="mb-4">
                            <label>Sorumlu Firma <span class="text-red-500">*</span></label>
                            <input
                                type="text"
                                class="form-input"
                                v-model="formData.manager"
                                required
                                :class="{'border-red-500': formErrors.manager}"
                            />
                            <p v-if="formErrors.manager" class="text-red-500 text-xs mt-1">{{ formErrors.manager }}</p>
                        </div>

                        <div class="mb-4">
                            <label>Durum</label>
                            <div class="flex items-center mt-2">
                                <label class="inline-flex">
                                    <input type="checkbox" class="form-checkbox" v-model="formData.isActive" />
                                    <span>Aktif</span>
                                </label>
                            </div>                        </div>
                        
                        <div class="mb-4 sm:col-span-2">
                            <label>Proje</label>
                            <select class="form-select" v-model="formData.projectId">
                                <option value="">Proje Seçin (Opsiyonel)</option>
                                <option v-for="project in availableProjects" :key="project.id" :value="project.id">
                                    {{ project.name }}
                                </option>
                            </select>
                            <p class="text-xs mt-1 text-gray-500">
                                Depoyu bir projeyle ilişkilendirmek isterseniz seçebilirsiniz.
                            </p>
                        </div>
                    </div>

                    <div class="flex justify-end gap-4 mt-4">
                        <button type="button" class="btn btn-outline-danger" @click="closeModal">
                            İptal
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="submitting">
                            {{ isEditing ? 'Güncelle' : 'Ekle' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Stok Durumu Modal -->
        <div v-if="showStockModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-4xl">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg">{{ selectedWarehouse?.name }} - Stok Durumu</h5>
                    <button class="text-gray-400 hover:text-gray-800" @click="closeStockModal">
                        <icon-x class="w-5 h-5" />
                    </button>
                </div>                <div class="flex gap-4 mb-4">
                    <div class="flex-1">
                        <input type="text" class="form-input" v-model="stockSearchTerm" placeholder="Ürün Ara..." />
                    </div>
                    <div class="w-64">
                        <select class="form-select" v-model="stockProjectFilter">
                            <option value="">Tüm Projeler</option>
                            <option v-for="project in availableProjects" :key="project.id" :value="project.id">
                                {{ project.name }}
                            </option>
                            <option value="null">Atanmamış</option>
                        </select>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table-striped">
                        <thead>
                            <tr>
                                <th>Ürün Kodu</th>
                                <th>Ürün Adı</th>
                                <th>Proje</th>
                                <th>Miktar</th>
                                <th>Birim</th>
                                <th>Min. Stok</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>                            <tr v-if="loadingStock">
                                <td colspan="7" class="text-center">
                                    <div class="flex justify-center items-center p-4">
                                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr v-else-if="warehouseStock.length === 0">
                                <td colspan="7" class="text-center">Bu depoda ürün bulunmamaktadır.</td>
                            </tr><tr v-for="stock in filteredStock" :key="stock.productId">
                                <td>{{ stock.product?.code || 'N/A' }}</td>
                                <td>{{ stock.product?.name || 'N/A' }}</td>                                <td>
                                    <span v-if="stock.projectId" class="badge badge-outline-info">
                                        {{ getProjectName(stock.projectId) }}
                                    </span>
                                    <span v-else-if="stock.projectId === 'ApMkLHJ3Rk7BpmYuNm5Z'" class="badge badge-outline-success">
                                        KGYS
                                    </span>
                                    <span v-else class="text-gray-400">Atanmamış</span>
                                </td>
                                <td>{{ stock.quantity }}</td>
                                <td>{{ stock.product?.unit || 'N/A' }}</td>
                                <td>{{ stock.product?.minStockLevel || 0 }}</td>
                                <td>
                                    <span :class="{
                                        'badge badge-success text-black': stock.product?.minStockLevel && stock.quantity > stock.product.minStockLevel,
                                        'badge badge-warning text-black': stock.product?.minStockLevel && stock.quantity === stock.product.minStockLevel,
                                        'badge badge-danger text-black': stock.product?.minStockLevel && stock.quantity < stock.product.minStockLevel,
                                        'badge badge-info text-black': !stock.product?.minStockLevel
                                    }">
                                        {{ getStockStatus(stock) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end mt-6">
                    <button class="btn btn-outline-primary" @click="closeStockModal">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconPencil from '@/components/icon/icon-pencil.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconBox from '@/components/icon/icon-box.vue';
import IconX from '@/components/icon/icon-x.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory.js';
import { useProjectStore } from '@/stores/projects';
import inventoryService from '@/services/inventory/inventoryService';
import { eventBus } from '@/composables/eventBus';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

// TypeScript için tip tanımlamaları
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
}

import type { Product } from '@/stores/inventory';

interface LocalProduct {
    name: string;
    unit: string;
    minStockLevel: number;
    category?: Category;
    totalStock?: number;
    categoryId?: string;
    unitPrice?: number;
    description?: string;
    isActive?: boolean;
    createdAt?: Date;
}

interface Stock {
    id: string;
    productId: string;
    warehouseId: string;
    projectId?: string;
    quantity: number;
    product: Product | null;
}

interface FormErrors {
    code?: string;
    name?: string;
    address?: string;
    manager?: string;
}

interface WarehouseForm {
    id?: string;
    code: string;
    name: string;
    address: string;
    manager: string;
    isActive: boolean;
    projectId?: string; // Proje ID'si ekleniyor
}

interface Project {
    id: string;
    name: string;
    // Diğer proje özellikleri buraya eklenebilir
}

const authStore = useAuthStore();
const inventoryStore = useInventoryStore();

// Ref değişkenlerinin doğru tiplerle tanımlanması
const loading = ref<boolean>(false);
const submitting = ref<boolean>(false);
const showModal = ref<boolean>(false);
const showStockModal = ref<boolean>(false);
const isEditing = ref<boolean>(false);
const warehouses = ref<Warehouse[]>([]);
const selectedWarehouse = ref<Warehouse | null>(null);
const warehouseStock = ref<Stock[]>([]);
const loadingStock = ref<boolean>(false);
const stockSearchTerm = ref<string>('');
const stockProjectFilter = ref<string>('');
const currentPage = ref<number>(1);
const itemsPerPage = ref<number>(10);
const formErrors = ref<FormErrors>({});
const formData = ref<WarehouseForm>({
    code: '',
    name: '',
    address: '',
    manager: '',
    isActive: true,
    projectId: '' // Proje ID'si ekleniyor
});

const availableProjects = ref<Project[]>([]); // Mevcut projeler için ref

onMounted(async () => {
    // Önce projeleri yükle - diğer işlemler öncesinde projeleri bilmemiz gerekiyor
    await loadProjects();
    
    // Firebase'de depolar var mı diye kontrol et ve test için bir depo ekle
    await checkAndAddTestWarehouse();
    await loadWarehouses();
    await loadWarehouseProjects();

    // Proje değişikliği dinleyicisi
    eventBus.on('project-changed', handleProjectChanged);
});

onBeforeUnmount(() => {
    // Componet kaldırıldığında dinleyiciyi temizle
    eventBus.off('project-changed', handleProjectChanged);
});

// Proje değiştiğinde depo listesini güncelle
const handleProjectChanged = async () => {
    console.log('Project changed event received, reloading warehouses...');
    await loadWarehouses();
    await loadWarehouseProjects(); // Proje değişiminde depo-proje ilişkilerini de yeniden yükle
};

// Test amaçlı fonksiyon - Firebase'de depo yoksa bir tane ekle
const checkAndAddTestWarehouse = async () => {
    try {
        // Önce store'u başlat
        if (!inventoryStore.isInitialized) {
            await inventoryStore.initializeStore();
        }
        
        // Depoları kontrol et
        console.log("Mevcut depolar:", inventoryStore.warehouses);
        
        // Eğer depo yoksa test amaçlı bir tane ekle
        if (inventoryStore.warehouses.length === 0) {
            console.log("Test deposu ekleniyor...");
            const testWarehouse = {
                code: "DEPO01",
                name: "Test Depo",
                address: "Test Adres",
                manager: "Test Yönetici",
                isActive: true
            };
            
            await inventoryStore.addWarehouse(testWarehouse);
            console.log("Test depo eklendi, veri tabanını kontrol edin.");
            
            // Store'u yenile
            await inventoryStore.refreshData();
        }
    } catch (error) {
        console.error("Test depo ekleme hatası:", error);
    }
};

const loadWarehouses = async () => {
    loading.value = true;
    try {
        // Store başlatılmadıysa ilk önce başlat
        if (!inventoryStore.isInitialized) {
            await inventoryStore.initializeStore();
        }
        
        // Direkt olarak store değişkenine eriş, getter'lar yerine
        console.log('Raw warehouses from store:', inventoryStore.warehouses);
        
        // Eğer aktif proje varsa ve proje depoları doluysa, onları kullan
        if (inventoryStore.activeProjectId && inventoryStore.projectWarehouses.length > 0) {
            console.log('Using project warehouses:', inventoryStore.projectWarehouses);
            warehouses.value = [...inventoryStore.projectWarehouses];
        } else {
            // Değilse tüm depoları kullan
            console.log('Using all warehouses:', inventoryStore.warehouses);
            warehouses.value = [...inventoryStore.warehouses];
        }
        
        // Depo içeriklerini ekrana yazdır (debug)
        if (warehouses.value.length > 0) {
            console.log('Sample warehouse data:', warehouses.value[0]);
        }
        
    } catch (error) {
        console.error('Depolar yüklenirken hata oluştu:', error);
    } finally {
        loading.value = false;
    }
};

const openAddModal = () => {
    isEditing.value = false;
    formData.value = {
        code: '',
        name: '',
        address: '',
        manager: '',
        isActive: true,
        projectId: '' // Proje ID'si ekleniyor
    };
    formErrors.value = {};
    showModal.value = true;
};

const editWarehouse = async (warehouse: Warehouse) => {
    isEditing.value = true;
    
    // Depo bilgilerini önce forma aktar
    formData.value = { 
        ...warehouse,
        address: warehouse.address || '',
        manager: warehouse.manager || '',
        projectId: '' // Önce boş olarak ayarla
    };
    
    // Deponun bağlı olduğu projeyi bul
    try {
        // Depo-proje ilişkilerini sorgula
        const relationQuery = query(
            collection(db, 'projectWarehouses'),
            where('warehouseId', '==', warehouse.id)
        );
        const relationSnapshot = await getDocs(relationQuery);
        
        // Eğer ilişki varsa, projeyi seç
        if (!relationSnapshot.empty) {
            // İlk ilişkiyi al (bir depo sadece bir projeye atanabilir)
            const projectId = relationSnapshot.docs[0].data().projectId;
            formData.value.projectId = projectId;
            console.log(`Depo (${warehouse.id}) şu projeye atanmış: ${projectId}`);
        }
    } catch (error) {
        console.error('Depo-proje ilişkisi yüklenirken hata oluştu:', error);
    }
    
    formErrors.value = {};
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const validateForm = (): boolean => {
    formErrors.value = {};
    
    if (!formData.value.code.trim()) {
        formErrors.value.code = 'Depo kodu zorunludur';
    }
    
    if (!formData.value.name.trim()) {
        formErrors.value.name = 'Depo adı zorunludur';
    }
    
    if (!formData.value.address.trim()) {
        formErrors.value.address = 'Adres zorunludur';
    }
    
    if (!formData.value.manager.trim()) {
        formErrors.value.manager = 'Sorumlu zorunludur';
    }
    
    return Object.keys(formErrors.value).length === 0;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    submitting.value = true;
    try {
        const warehouseData: WarehouseForm = {
            ...formData.value
        };
        
        if (isEditing.value && warehouseData.id) {
            await inventoryStore.updateWarehouse(warehouseData.id, warehouseData);
        } else {
            await inventoryStore.addWarehouse(warehouseData);
        }
        
        // Store'dan güncel verileri al
        await loadWarehouses();
        closeModal();
    } catch (error) {
        console.error('Depo kaydedilirken hata oluştu:', error);
    } finally {
        submitting.value = false;
    }
};

const deleteWarehouse = async (id: string) => {
    if (!confirm('Bu depoyu silmek istediğinizden emin misiniz?')) {
        return;
    }

    loading.value = true;
    try {
        inventoryStore.deleteWarehouse(id);
    warehouses.value = inventoryStore.getWarehouses as Warehouse[];
    } catch (error) {
        console.error('Depo silinirken hata oluştu:', error);
    } finally {
        loading.value = false;
    }
};

const viewStock = async (warehouse: Warehouse) => {
    selectedWarehouse.value = warehouse;
    showStockModal.value = true;
    loadingStock.value = true;

    try {
        // Depo için stok bilgilerini ve ürün detaylarını çek
        const stocks = inventoryStore.getStocksByWarehouseId(warehouse.id);
        
        // Ürün bilgilerini alarak stok listesini oluştur
        warehouseStock.value = Array.isArray(stocks) ? stocks.map(stock => {
            // Ürün bilgisini products dizisinden ID'ye göre bul
            const product = inventoryStore.products.find(p => p.id === stock.productId);
              // Proje bilgisini kontrol et
            const projectId = stock.projectId;
            
            return {
                ...stock,
                product: product || null,
                projectId: projectId
            };
        }) : [];
    } catch (error) {
        console.error('Stok durumu yüklenirken hata oluştu:', error);
    } finally {
        loadingStock.value = false;
    }
};

const closeStockModal = () => {
    showStockModal.value = false;
    selectedWarehouse.value = null;
    warehouseStock.value = [];
    stockSearchTerm.value = '';
    stockProjectFilter.value = ''; // Proje filtresini de sıfırla
};

const filteredStock = computed(() => {
    // Önce stokları projeye göre filtreleyelim
    let filtered = warehouseStock.value;
    
    // Proje filtresi uygula
    if (stockProjectFilter.value !== '') {
        if (stockProjectFilter.value === 'null') {
            // "Atanmamış" seçildi, projectId'si null, undefined veya boş string olan stokları göster
            filtered = filtered.filter(stock => !stock.projectId);
        } else {
            // Belirli bir proje seçildi
            filtered = filtered.filter(stock => stock.projectId === stockProjectFilter.value);
        }
    }
    
    // Metin araması uygula
    if (stockSearchTerm.value) {
        const searchTerm = stockSearchTerm.value.toLowerCase();
        filtered = filtered.filter(stock => {
            // Null kontrolü ekleyerek güvenli filtreleme yapma
            const productName = stock.product?.name || '';
            const productCode = stock.product?.code || '';
            return productName.toLowerCase().includes(searchTerm) || 
                  productCode.toLowerCase().includes(searchTerm);
        });
    }
    
    return filtered;
});

const getStockStatus = (stock: Stock): string => {
    if (!stock.product?.minStockLevel) return 'Belirsiz';
    if (stock.quantity > stock.product.minStockLevel) return 'Normal';
    if (stock.quantity === stock.product.minStockLevel) return 'Kritik';
    return 'Düşük';
};

const visibleWarehouses = computed<Warehouse[]>(() => {
    let result: Warehouse[] = [];
    
    // Admin kullanıcıları için her zaman tüm depoları göster
    if (authStore.isAdmin) {
        // Tüm depoları göster, proje seçimi fark etmeksizin
        result = [...inventoryStore.warehouses];
        console.log("Admin kullanıcısı için tüm depolar gösteriliyor:", result.length);
    } else {
        // Normal kullanıcılar için önceki mantık geçerli
        const authorizedDepot = authStore.getAuthorizedDepot || '';
        result = warehouses.value.filter(w => w.code === authorizedDepot);
    }
    
    // Sayfalama işlemi
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return result.slice(start, end);
});

const totalPages = computed<number>(() => {
    // getAuthorizedDepot için null kontrolü ekle
    const authorizedDepot = authStore.getAuthorizedDepot || '';
    const filteredCount = authStore.isAdmin ? 
        warehouses.value.length : 
        warehouses.value.filter(w => w.code === authorizedDepot).length;
    return Math.max(1, Math.ceil(filteredCount / itemsPerPage.value));
});

// Depo projelerini kaydet - her depo id'sine ait proje adlarını tutacak
const warehouseProjectMap = ref<Record<string, string[]>>({});

// Depolarla ilgili proje bilgilerini yükle
const loadWarehouseProjects = async () => {
    try {
        console.log('Loading warehouse-project relations...');
        
        // Proje store'u kullan
        const projectStore = useProjectStore();
        
        // Her depo için proje ilişkilerini temizle
        warehouseProjectMap.value = {};
        
        // Doğrudan store'dan tüm projeleri al (getAllProjects yerine)
        await projectStore.loadUserProjects(); // Önce projeleri yükle
        const projects = projectStore.projects;
        console.log('Projects fetched:', projects.length);
        
        // Her proje için depo ilişkilerini kontrol et
        for (const project of projects) {
            try {
                // Projeye ait depolar
                const projectWarehouses = await inventoryService.getWarehousesByProject(project.id);
                console.log(`Project ${project.name} has ${projectWarehouses.length} warehouses`);
                
                // Her depoyu mapping'e ekle
                for (const warehouse of projectWarehouses) {
                    if (!warehouseProjectMap.value[warehouse.id]) {
                        warehouseProjectMap.value[warehouse.id] = [];
                    }
                    warehouseProjectMap.value[warehouse.id].push(project.name);
                }
            } catch (err) {
                console.error(`Error loading warehouses for project ${project.id}:`, err);
            }
        }
        
        console.log('Final Warehouse-Project mappings:', warehouseProjectMap.value);
    } catch (error) {
        console.error('Warehouse-project relations error:', error);
    }
};

// Bu fonksiyon bir depoya ait projelerin isimlerini döndürür
const getWarehouseProjects = (warehouseId: string): string[] => {
    // Mapping'den bu depoya ait proje adlarını döndür
    return warehouseProjectMap.value[warehouseId] || [];
};

// Proje ID'sine göre proje adını döndürür
const getProjectName = (projectId: string): string => {
    const project = availableProjects.value.find(p => p.id === projectId);
    return project ? project.name : 'Bilinmeyen Proje';
};

// Projeleri yükle
const loadProjects = async () => {
    try {
        const projectStore = useProjectStore();
        await projectStore.loadUserProjects();
        availableProjects.value = projectStore.projects;
    } catch (error) {
        console.error('Projeler yüklenirken hata oluştu:', error);
    }
};
</script>