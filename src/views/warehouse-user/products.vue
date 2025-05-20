<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/warehouse-user/dashboard" class="text-primary hover:underline">Depo Yönetimi</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Depo Ürünleri</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel mb-5">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Depo Ürünleri: {{ warehouseName }}</h5>
                    <div class="flex items-center">
                        <button type="button" class="btn btn-primary ltr:mr-2 rtl:ml-2" @click="openRequestModal">
                            <icon-plus class="ltr:mr-2 rtl:ml-2" />
                            Merkez Depodan Ürün Talep Et
                        </button>
                    </div>
                </div>

                <div class="mb-5 flex flex-wrap items-center">
                    <div class="flex items-center flex-1">
                        <div class="flex-1">
                            <input type="text" placeholder="Ürün Ara..." class="form-input" v-model="search" />
                        </div>
                    </div>
                    <div class="flex">
                        <select class="form-select" v-model="categoryFilter">
                            <option value="">Tüm Kategoriler</option>
                            <option v-for="category in inventoryStore.getCategories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Ürün Tablosu -->
                <div v-if="loading" class="flex justify-center items-center p-10">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
                <div v-else-if="filteredStocks.length > 0" class="table-responsive">
                    <table class="table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ürün Adı</th>
                                <th>Kategori</th>
                                <th>Miktar</th>
                                <th>Birim</th>
                                <th class="text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(stock, index) in filteredStocks" :key="stock.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ getProductName(stock.productId) }}</td>
                                <td>{{ getProductCategory(stock.productId) }}</td>
                                <td>{{ stock.quantity }}</td>
                                <td>{{ getProductUnit(stock.productId) }}</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button type="button" class="btn btn-sm btn-outline-primary" @click="openSerialNumbersModal(stock)">
                                            Seri Numaraları
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger" @click="registerFaultyProduct(stock)">
                                            Arıza Kaydı
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="flex justify-center p-10">
                    <p>Bu depoda ürün bulunmamaktadır.</p>
                </div>
            </div>
        </div>

        <!-- Seri Numaraları Modal -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showSerialModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">{{ getProductName(selectedStock?.productId || '') }} - Seri Numaraları</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="showSerialModal = false">
                                <icon-x />
                            </button>
                        </div>
                        <div class="p-5 max-h-[80vh] overflow-y-auto">
                            <div v-if="serializedItems.length > 0" class="table-responsive">
                                <table class="table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Seri Numarası</th>
                                            <th>Durum</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in serializedItems" :key="item.id">
                                            <td>{{ index + 1 }}</td>
                                            <td>{{ item.serialNumber }}</td>
                                            <td>
                                                <span :class="{
                                                    'badge bg-success': item.status === 'active',
                                                    'badge bg-danger': item.status === 'faulty',
                                                    'badge bg-warning': item.status === 'repair',
                                                    'badge bg-secondary': item.status === 'consigned'
                                                }">
                                                    {{ translateStatus(item.status) }}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="flex items-center gap-2">
                                                    <button type="button" v-if="item.status === 'active'" class="btn btn-sm btn-outline-danger" @click="registerSerialFaulty(item)">
                                                        Arıza Bildir
                                                    </button>
                                                    <button type="button" v-if="item.status === 'active'" class="btn btn-sm btn-outline-secondary" @click="markAsConsigned(item)">
                                                        Konsinye Olarak İşaretle
                                                    </button>
                                                    <button type="button" v-if="item.status === 'faulty'" class="btn btn-sm btn-outline-warning" @click="sendToRepair(item)">
                                                        Onarıma Gönder
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else class="flex justify-center p-5">
                                <p>Bu ürüne ait seri numaralı kayıt bulunmamaktadır.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>

        <!-- Merkez Depo Ürün Talep Modal -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showRequestModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">Merkez Depodan Ürün Talebi</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="showRequestModal = false">
                                <icon-x />
                            </button>
                        </div>
                        <div class="p-5 max-h-[80vh] overflow-y-auto">
                            <form @submit.prevent="submitMaterialRequest">
                                <div class="mb-5">
                                    <label for="targetWarehouseId" class="form-label">Hedef Depo</label>
                                    <select id="targetWarehouseId" class="form-select" v-model="materialRequestForm.targetWarehouseId" disabled>
                                        <option :value="warehouseId">{{ warehouseName }}</option>
                                    </select>
                                    <p class="text-xs text-gray-500 mt-1">Bu depoya malzeme talep edilecektir.</p>
                                </div>

                                <div class="mb-5">
                                    <label class="form-label">Merkez Depo Stok Durumu</label>
                                    <div class="table-responsive">
                                        <table class="table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th>Miktar</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="stock in centralWarehouseStocks" :key="stock.id">
                                                    <td>{{ getProductName(stock.productId) }}</td>
                                                    <td>{{ stock.quantity }}</td>
                                                    <td>
                                                        <button type="button" class="btn btn-sm btn-outline-primary" @click="addProductToRequest(stock)">
                                                            Ekle
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div class="mb-5">
                                    <label class="form-label">Talep Edilecek Ürünler</label>
                                    <div v-if="materialRequestForm.items.length > 0" class="table-responsive">
                                        <table class="table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th>Miktar</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(item, index) in materialRequestForm.items" :key="index">
                                                    <td>{{ getProductName(item.productId) }}</td>
                                                    <td>
                                                        <input type="number" class="form-input w-20" v-model.number="item.quantity" min="1" />
                                                    </td>
                                                    <td>
                                                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeProductFromRequest(index)">
                                                            Kaldır
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div v-else class="flex justify-center p-5 border border-dashed border-gray-300 rounded-md">
                                        <p class="text-gray-500">Henüz ürün eklenmedi. Yukarıdaki listeden ürün ekleyin.</p>
                                    </div>
                                </div>

                                <div class="mb-5">
                                    <label for="requestNotes" class="form-label">Notlar</label>
                                    <textarea id="requestNotes" class="form-textarea" v-model="materialRequestForm.notes" rows="3" placeholder="Talep için notlar..."></textarea>
                                </div>

                                <div class="flex justify-end items-center">
                                    <button type="button" class="btn btn-outline-danger ltr:mr-2 rtl:ml-2" @click="showRequestModal = false">İptal</button>
                                    <button type="submit" class="btn btn-primary" :disabled="materialRequestForm.items.length === 0 || submitLoading">
                                        {{ submitLoading ? 'Gönderiliyor...' : 'Talebi Gönder' }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>

        <!-- Arızalı Ürün Kayıt Modal -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showFaultyModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">Arızalı Ürün Kaydı</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="showFaultyModal = false">
                                <icon-x />
                            </button>
                        </div>
                        <div class="p-5 max-h-[80vh] overflow-y-auto">
                            <form @submit.prevent="submitFaultyProductReport">
                                <div class="mb-5">
                                    <label for="productId" class="form-label">Ürün</label>
                                    <select id="productId" class="form-select" v-model="faultyForm.productId" disabled>
                                        <option :value="faultyForm.productId">{{ getProductName(faultyForm.productId) }}</option>
                                    </select>
                                </div>

                                <div class="mb-5">
                                    <label for="serialNumber" class="form-label">Seri Numarası</label>
                                    <select id="serialNumber" class="form-select" v-model="faultyForm.serialNumber">
                                        <option value="">Seri Numarası Seçin (Opsiyonel)</option>
                                        <option v-for="item in availableSerialNumbers" :key="item.id" :value="item.serialNumber">
                                            {{ item.serialNumber }}
                                        </option>
                                    </select>
                                </div>

                                <div class="mb-5">
                                    <label for="quantity" class="form-label">Miktar</label>
                                    <input id="quantity" type="number" class="form-input" v-model.number="faultyForm.quantity" min="1" :max="maxFaultyQuantity" 
                                           :disabled="!!faultyForm.serialNumber" />
                                    <p class="text-xs text-gray-500 mt-1">Seri numarası seçilirse miktar otomatik 1 olacaktır.</p>
                                </div>

                                <div class="mb-5">
                                    <label for="faultType" class="form-label">Arıza Tipi</label>
                                    <select id="faultType" class="form-select" v-model="faultyForm.faultTypeId" required>
                                        <option value="">Arıza Tipi Seçin</option>
                                        <option v-for="faultType in faultTypes" :key="faultType.id" :value="faultType.id">
                                            {{ faultType.description }}
                                        </option>
                                    </select>
                                </div>

                                <div class="mb-5">
                                    <label for="faultDescription" class="form-label">Arıza Açıklaması</label>
                                    <textarea id="faultDescription" class="form-textarea" v-model="faultyForm.description" rows="3" placeholder="Arıza detayları..."></textarea>
                                </div>

                                <div class="flex justify-end items-center">
                                    <button type="button" class="btn btn-outline-danger ltr:mr-2 rtl:ml-2" @click="showFaultyModal = false">İptal</button>
                                    <button type="submit" class="btn btn-primary" :disabled="submitLoading">
                                        {{ submitLoading ? 'Kaydediliyor...' : 'Arıza Kaydı Oluştur' }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory';
import { useProjectStore } from '@/stores/project-store';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconX from '@/components/icon/icon-x.vue';

// Store'lar
const appStore = useAppStore();
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();
const route = useRoute();

// Meta veri
document.title = 'Depo Ürünleri - UGES STOK';

// Durum değişkenleri
const loading = ref(false);
const submitLoading = ref(false);
const warehouseId = ref('');
const warehouseName = ref('');
const search = ref('');
const categoryFilter = ref('');
const stocks = ref<any[]>([]);
const showSerialModal = ref(false);
const selectedStock = ref<any>(null);
const serializedItems = ref<any[]>([]);
const showRequestModal = ref(false);
const centralWarehouseStocks = ref<any[]>([]);
const showFaultyModal = ref(false);
const faultTypes = ref<any[]>([]);

// Form değişkenleri
const materialRequestForm = ref({
    targetWarehouseId: '',
    sourceWarehouseId: '',
    projectId: '',
    sourceProjectId: '',
    targetProjectId: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    items: [] as { productId: string, quantity: number }[]
});

const faultyForm = ref({
    productId: '',
    serialNumber: '',
    quantity: 1,
    faultTypeId: '',
    description: ''
});

// Bilgileri hesaplanan özellikler
const filteredStocks = computed(() => {
    if (!stocks.value || stocks.value.length === 0) return [];

    let result = stocks.value;
    
    // Arama filtresi
    if (search.value.trim()) {
        const searchTerm = search.value.toLowerCase().trim();
        result = result.filter(stock => {
            const product = inventoryStore.getProducts.find(p => p.id === stock.productId);
            if (!product) return false;
            return product.name.toLowerCase().includes(searchTerm);
        });
    }
    
    // Kategori filtresi
    if (categoryFilter.value) {
        result = result.filter(stock => {
            const product = inventoryStore.getProducts.find(p => p.id === stock.productId);
            if (!product) return false;
            return product.categoryId === categoryFilter.value;
        });
    }
    
    return result;
});

// Seri numarası seçildiğinde miktarı otomatik 1 yap
watch(() => faultyForm.value.serialNumber, (newVal) => {
    if (newVal) {
        faultyForm.value.quantity = 1;
    }
});

// Seçili ürün için kullanılabilir seri numaraları
const availableSerialNumbers = computed(() => {
    if (!faultyForm.value.productId) return [];
    
    return serializedItems.value.filter(item => 
        item.productId === faultyForm.value.productId && 
        item.status === 'active'
    );
});

// Arızalı olarak kaydedilebilecek maksimum ürün miktarı
const maxFaultyQuantity = computed(() => {
    if (!selectedStock.value) return 1;
    return selectedStock.value.quantity;
});

// Sayfa yüklendiğinde
onMounted(async () => {
    // Yetki kontrolü
    if (!authStore.isAdmin && !authStore.isProjectAdmin && !authStore.isWarehouseManager) {
        appStore.showMessage('Bu sayfaya erişim yetkiniz bulunmuyor.', 'error');
        return;
    }
    
    // Depo ID'sini URL'den al
    warehouseId.value = route.params.id as string;
    
    // Store'ları başlat
    if (!inventoryStore.isInitialized) {
        await inventoryStore.initializeStore();
    }
    
    // Depo bilgisini al
    await loadWarehouseInfo();
    
    // Depo stoklarını yükle
    await loadWarehouseStocks();
    
    // Arıza tiplerini yükle
    await loadFaultTypes();
    
    // Form başlangıç değerlerini ayarla
    materialRequestForm.value.targetWarehouseId = warehouseId.value;
});

// Depo bilgisini yükle
async function loadWarehouseInfo() {
    try {
        loading.value = true;
        
        const warehouse = inventoryStore.getWarehouses.find(w => w.id === warehouseId.value);
        
        if (!warehouse) {
            appStore.showMessage('Depo bilgisi bulunamadı.', 'error');
            return;
        }
        
        warehouseName.value = warehouse.name;
        
        // Her deponun bağlı olduğu bir proje olmalı
        // Bu bilgiyi almak için proje-depo ilişkisini kontrol ediyoruz
        const projectWarehouseService = (await import('@/services/projects/projectService')).default;
        
        try {
            const projectId = await projectWarehouseService.getProjectIdByWarehouse(warehouseId.value);
            
            materialRequestForm.value.projectId = projectId || '';
            materialRequestForm.value.sourceProjectId = projectId || '';
            materialRequestForm.value.targetProjectId = projectId || '';
        } catch (error) {
            console.error('Proje ID alınırken hata:', error);
            // Proje ID alınamazsa boş bir değer ata
            materialRequestForm.value.projectId = '';
            materialRequestForm.value.sourceProjectId = '';
            materialRequestForm.value.targetProjectId = '';
        }
        
    } catch (error) {
        console.error('Depo bilgisi yüklenirken hata:', error);
        appStore.showMessage('Depo bilgisi yüklenirken bir hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Depo stoklarını yükle
async function loadWarehouseStocks() {
    try {
        loading.value = true;
        
        // Depo stoklarını al
        const inventoryService = (await import('@/services/inventory/inventoryService')).default;
        const warehouseStocks = await inventoryService.getStocksByWarehouse(warehouseId.value);
        
        stocks.value = warehouseStocks;
        
    } catch (error) {
        console.error('Depo stokları yüklenirken hata:', error);
        appStore.showMessage('Depo stokları yüklenirken bir hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Ürün adını getir
function getProductName(productId: string): string {
    const product = inventoryStore.getProducts.find(p => p.id === productId);
    return product ? product.name : productId;
}

// Ürün kategorisini getir
function getProductCategory(productId: string): string {
    const product = inventoryStore.getProducts.find(p => p.id === productId);
    if (!product) return '';
    
    const category = inventoryStore.getCategories.find(c => c.id === product.categoryId);
    return category ? category.name : '';
}

// Ürün birimini getir
function getProductUnit(productId: string): string {
    const product = inventoryStore.getProducts.find(p => p.id === productId);
    return product ? product.unit : '';
}

// Durum çevirisi
function translateStatus(status: string): string {
    switch (status) {
        case 'active': return 'Aktif';
        case 'faulty': return 'Arızalı';
        case 'repair': return 'Onarımda';
        case 'consigned': return 'Konsinye';
        default: return status;
    }
}

// Seri numaraları modalını aç
async function openSerialNumbersModal(stock: any) {
    selectedStock.value = stock;
    
    try {
        loading.value = true;
        
        // Ürüne ait seri numaralı kayıtları getir
        const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
        const items = await serializedInventoryService.getSerializedItemsByProductInWarehouse(stock.productId, warehouseId.value);
        
        serializedItems.value = items;
        showSerialModal.value = true;
        
    } catch (error) {
        console.error('Seri numaralı ürünler yüklenirken hata:', error);
        appStore.showMessage('Seri numaralı ürünler yüklenirken bir hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Merkez depo ürün talep modalını aç
async function openRequestModal() {
    try {
        loading.value = true;
        
        // Merkez depo bilgilerini al
        const centralWarehouses = inventoryStore.getWarehouses.filter(
            w => (w.code === 'MERKEZ' || w.name.toLowerCase().includes('merkez')) && w.isActive
        );
        
        if (centralWarehouses.length === 0) {
            appStore.showMessage('Merkez depo bulunamadı.', 'error');
            return;
        }
        
        materialRequestForm.value.sourceWarehouseId = centralWarehouses[0].id;
        
        // Merkez depo stoklarını al
        const inventoryService = (await import('@/services/inventory/inventoryService')).default;
        const stocks = await inventoryService.getStocksByWarehouse(centralWarehouses[0].id);
        
        centralWarehouseStocks.value = stocks;
        materialRequestForm.value.items = [];
        showRequestModal.value = true;
        
    } catch (error) {
        console.error('Merkez depo bilgileri yüklenirken hata:', error);
        appStore.showMessage('Merkez depo bilgileri yüklenirken bir hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Talebe ürün ekle
function addProductToRequest(stock: any) {
    // Daha önce eklenmişse miktar artır
    const existingItem = materialRequestForm.value.items.find(item => item.productId === stock.productId);
    if (existingItem) {
        existingItem.quantity++;
        return;
    }
    
    // Yeni ürün ekle
    materialRequestForm.value.items.push({
        productId: stock.productId,
        quantity: 1
    });
}

// Talepten ürün çıkar
function removeProductFromRequest(index: number) {
    materialRequestForm.value.items.splice(index, 1);
}

// Malzeme talebini gönder
async function submitMaterialRequest() {
    if (materialRequestForm.value.items.length === 0) {
        appStore.showMessage('Lütfen en az bir ürün ekleyin.', 'warning');
        return;
    }
      try {
        submitLoading.value = true;
        
        // MaterialRequest tipine uygun veri oluştur
        const request = {
            sourceWarehouseId: materialRequestForm.value.sourceWarehouseId,
            targetWarehouseId: materialRequestForm.value.targetWarehouseId,
            sourceProjectId: materialRequestForm.value.sourceProjectId || materialRequestForm.value.projectId,
            targetProjectId: materialRequestForm.value.targetProjectId || materialRequestForm.value.projectId,
            status: 'draft' as 'draft' | 'requested' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled',
            notes: materialRequestForm.value.notes,
            requesterId: authStore.userInfo?.id || '',
            requesterName: authStore.userInfo?.name || '',
            requestDate: new Date().toISOString(),
            priority: materialRequestForm.value.priority,
            // requestItems formatında dönüştür
            requestItems: materialRequestForm.value.items.map(item => {
                const product = inventoryStore.getProducts.find(p => p.id === item.productId);
                return {
                    productId: item.productId,
                    productName: product ? product.name : item.productId,
                    requestedQuantity: item.quantity,
                    notes: ''
                };
            })
        };
        
        // Talebi kaydet
        const materialRequestService = (await import('@/services/materials/materialRequestService')).default;
        await materialRequestService.createRequest(request);
        
        appStore.showMessage('Malzeme talebi başarıyla oluşturuldu.', 'success');
        showRequestModal.value = false;
        
    } catch (error) {
        console.error('Malzeme talebi oluşturulurken hata:', error);
        appStore.showMessage('Malzeme talebi oluşturulurken bir hata oluştu.', 'error');
    } finally {
        submitLoading.value = false;
    }
}

// Arızalı ürün kaydı modalını aç
async function registerFaultyProduct(stock: any) {
    selectedStock.value = stock;
    
    faultyForm.value = {
        productId: stock.productId,
        serialNumber: '',
        quantity: 1,
        faultTypeId: '',
        description: ''
    };
    
    try {
        loading.value = true;
        
        // Seri numaralı ürünleri getir
        const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
        const items = await serializedInventoryService.getSerializedItemsByProductInWarehouse(stock.productId, warehouseId.value);
        
        serializedItems.value = items.filter(item => item.status === 'active');
        showFaultyModal.value = true;
        
    } catch (error) {
        console.error('Seri numaralı ürünler yüklenirken hata:', error);
        appStore.showMessage('Seri numaralı ürünler yüklenirken bir hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Arıza tiplerini yükle
async function loadFaultTypes() {
    try {
        const faultyProductService = (await import('@/services/repair/faultyProductService')).default;
        const types = await faultyProductService.getFaultTypes();
        
        faultTypes.value = types;
        
    } catch (error) {
        console.error('Arıza tipleri yüklenirken hata:', error);
    }
}

// Arızalı ürün kaydı gönder
async function submitFaultyProductReport() {
    if (!faultyForm.value.faultTypeId) {
        appStore.showMessage('Lütfen bir arıza tipi seçin.', 'warning');
        return;
    }
    
    try {
        submitLoading.value = true;
        
        const faultyProductService = (await import('@/services/repair/faultyProductService')).default;
        
        // Arızalı ürün raporu oluştur
        const faultyReport = {
            productId: faultyForm.value.productId,
            productName: getProductName(faultyForm.value.productId),
            warehouseId: warehouseId.value,
            warehouseName: warehouseName.value,
            serialNumber: faultyForm.value.serialNumber || null,
            quantity: faultyForm.value.quantity,
            faultTypeId: faultyForm.value.faultTypeId,
            status: 'reported',
            description: faultyForm.value.description,
            projectId: materialRequestForm.value.projectId || '',
            reporterId: authStore.userInfo?.id || '',
            reporterName: authStore.userInfo?.name || '',
            reportDate: new Date().toISOString()
        };
        
        // Arıza kaydını oluştur
        await faultyProductService.createFaultyProductReport(faultyReport);
        
        // Eğer seri numaralı ürünse, durumunu güncelle
        if (faultyForm.value.serialNumber) {
            const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
            await serializedInventoryService.updateSerializedItemStatus(
                faultyForm.value.serialNumber, 
                'faulty', 
                faultyForm.value.description
            );
        } else {
            // Normal stok çıkışı yap
            const inventoryService = (await import('@/services/inventory/inventoryService')).default;
            await inventoryService.processStockMovement(
                faultyForm.value.productId,
                warehouseId.value,
                faultyForm.value.quantity,
                'out',
                'Arızalı ürün kaydı',
                materialRequestForm.value.projectId
            );
        }
        
        appStore.showMessage('Arıza kaydı başarıyla oluşturuldu.', 'success');
        showFaultyModal.value = false;
        
        // Stokları yeniden yükle
        await loadWarehouseStocks();
        
    } catch (error) {
        console.error('Arıza kaydı oluşturulurken hata:', error);
        appStore.showMessage('Arıza kaydı oluşturulurken bir hata oluştu.', 'error');
    } finally {
        submitLoading.value = false;
    }
}

// Seri numaralı ürünü arızalı olarak kaydet
async function registerSerialFaulty(item: any) {
    faultyForm.value = {
        productId: item.productId,
        serialNumber: item.serialNumber,
        quantity: 1,
        faultTypeId: '',
        description: ''
    };
    
    showSerialModal.value = false;
    showFaultyModal.value = true;
}

// Seri numaralı ürünü konsinye olarak işaretle
async function markAsConsigned(item: any) {
    try {
        submitLoading.value = true;
        
        const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
        await serializedInventoryService.updateSerializedItemStatus(
            item.serialNumber, 
            'consigned', 
            'Konsinye olarak işaretlendi'
        );
        
        appStore.showMessage('Ürün konsinye olarak işaretlendi.', 'success');
        
        // Güncel verileri yükle
        const updatedItems = await serializedInventoryService.getSerializedItemsByProductInWarehouse(item.productId, warehouseId.value);
        serializedItems.value = updatedItems;
        
    } catch (error) {
        console.error('Konsinye işaretlenirken hata:', error);
        appStore.showMessage('Konsinye işaretlenirken bir hata oluştu.', 'error');
    } finally {
        submitLoading.value = false;
    }
}

// Arızalı ürünü onarıma gönder
async function sendToRepair(item: any) {
    try {
        submitLoading.value = true;
        
        const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
        await serializedInventoryService.updateSerializedItemStatus(
            item.serialNumber, 
            'repair', 
            'Onarıma gönderildi'
        );
        
        // Onarım merkezine gönderme kaydı oluştur
        const faultyProductService = (await import('@/services/repair/faultyProductService')).default;
        await faultyProductService.sendToRepairCenter({
            serialNumber: item.serialNumber,
            productId: item.productId,
            productName: getProductName(item.productId),
            warehouseId: warehouseId.value,
            warehouseName: warehouseName.value,
            serviceCenterId: '', // Varsayılan onarım merkezi
            status: 'sent',
            notes: 'Onarım için gönderildi',
            sentDate: new Date().toISOString(),
            senderName: authStore.userInfo?.name || '',
            senderId: authStore.userInfo?.id || '',
            projectId: materialRequestForm.value.projectId || ''
        });
        
        appStore.showMessage('Ürün onarıma gönderildi.', 'success');
        
        // Güncel verileri yükle
        const updatedItems = await serializedInventoryService.getSerializedItemsByProductInWarehouse(item.productId, warehouseId.value);
        serializedItems.value = updatedItems;
        
    } catch (error) {
        console.error('Onarıma gönderilirken hata:', error);
        appStore.showMessage('Onarıma gönderilirken bir hata oluştu.', 'error');
    } finally {
        submitLoading.value = false;
    }
}
</script>
