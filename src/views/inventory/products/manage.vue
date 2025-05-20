<template>
    <div>        <div class="flex justify-between mb-5 items-center">
            <h5 class="font-semibold text-lg dark:text-white-light">
                <span v-if="authStore.isAdmin">Ürün Yönetimi</span>
                <span v-else>Depoya Ürün Ekle</span>
            </h5>
            <router-link v-if="authStore.isAdmin" to="/inventory/products" class="btn btn-outline-primary">
                <span class="flex items-center">
                    <i class="las la-arrow-left mr-1"></i> Ürün Listesine Dön
                </span>
            </router-link>
        </div>

        <!-- Sekme Başlıkları -->
        <div class="mb-5">
            <ul class="flex space-x-2 border-b border-[#ebedf2] dark:border-[#191e3a] mt-3 rtl:space-x-reverse">
                <li v-if="authStore.isAdmin" class="tab-item">
                    <a href="javascript:;"
                       @click="activeTab = 'definitions'"
                       :class="{'active': activeTab === 'definitions'}"
                       class="p-3.5 py-2 -mb-[1px] block border border-transparent hover:text-primary dark:hover:text-primary"
                    >
                        <div class="flex items-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ltr:mr-2 rtl:ml-2">
                                <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M22 12C22 12 21.0071 12.8907 19.0212 13.6851L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L4.97883 13.6851C2.99294 12.8907 2 12 2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M22 16C22 16 21.0071 16.8907 19.0212 17.6851L16.2127 18.8085C14.2268 19.6028 13.2339 20 12 20C10.7661 20 9.77318 19.6028 7.7873 18.8085L4.97883 17.6851C2.99294 16.8907 2 16 2 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            <span>Ürün Tanımları</span>
                        </div>
                    </a>
                </li>
                <li class="tab-item">
                    <a href="javascript:;"
                       @click="activeTab = 'add-to-warehouse'"
                       :class="{'active': activeTab === 'add-to-warehouse'}"
                       class="p-3.5 py-2 -mb-[1px] block border border-transparent hover:text-primary dark:hover:text-primary"
                    >
                        <div class="flex items-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ltr:mr-2 rtl:ml-2">
                                <path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M17.1 2H12.9C9.5 2 8.09998 3.3 8.00998 6.5H11.1C15.5 6.5 17.5 8.5 17.5 12.9V16C20.7 15.9 22 14.5 22 11.1V6.9C22 3.4 20.6 2 17.1 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 14H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10.5 16.5V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Depoya Ürün Ekle</span>
                        </div>
                    </a>
                </li>
            </ul>
        </div>

        <!-- Sekme İçerikleri -->
        <div>
            <!-- Ürün Tanımları Sekmesi (Admin Kullanıcılar İçin) -->
            <div v-if="activeTab === 'definitions' && authStore.isAdmin" class="panel">
                <form @submit.prevent="handleDefinitionSubmit">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Ürün Kodu -->
                        <div class="mb-4">
                            <label for="productCode">Ürün Kodu <span class="text-red-500">*</span></label>
                            <input
                                id="productCode"
                                type="text"
                                class="form-input"
                                v-model="definitionForm.code"
                                required
                                :class="{'border-red-500': formErrors.code}"
                            />
                            <p v-if="formErrors.code" class="text-red-500 text-xs mt-1">{{ formErrors.code }}</p>
                        </div>

                        <!-- Ürün Adı -->
                        <div class="mb-4">
                            <label for="productName">Ürün Adı <span class="text-red-500">*</span></label>
                            <input
                                id="productName"
                                type="text"
                                class="form-input"
                                v-model="definitionForm.name"
                                required
                                :class="{'border-red-500': formErrors.name}"
                            />
                            <p v-if="formErrors.name" class="text-red-500 text-xs mt-1">{{ formErrors.name }}</p>
                        </div>

                        <!-- Kategori -->
                        <div class="mb-4">
                            <label for="category">Kategori <span class="text-red-500">*</span></label>
                            <select
                                id="category"
                                class="form-select"
                                v-model="definitionForm.categoryId"
                                required
                                :class="{'border-red-500': formErrors.categoryId}"
                                @change="updateSubCategories"
                            >
                                <option value="">Kategori Seçiniz</option>
                                <option v-for="category in categories" :key="category.id" :value="category.id">
                                    {{ category.name }}
                                </option>
                            </select>
                            <p v-if="formErrors.categoryId" class="text-red-500 text-xs mt-1">{{ formErrors.categoryId }}</p>
                        </div>
                        
                        <!-- Alt Kategori -->
                        <div class="mb-4">
                            <label for="subCategory">Alt Kategori <span class="text-red-500">*</span></label>
                            <select
                                id="subCategory"
                                class="form-select"
                                v-model="definitionForm.subCategory"
                                required
                                :disabled="!definitionForm.categoryId || availableSubCategories.length === 0"
                                :class="{'border-red-500': formErrors.subCategory}"
                            >
                                <option value="">Alt Kategori Seçiniz</option>
                                <option v-for="(subCategory, index) in availableSubCategories" :key="index" :value="subCategory">
                                    {{ subCategory }}
                                </option>
                            </select>
                            <p v-if="formErrors.subCategory" class="text-red-500 text-xs mt-1">{{ formErrors.subCategory }}</p>
                        </div>

                        <!-- Birim -->
                        <div class="mb-4">
                            <label for="unit">Birim <span class="text-red-500">*</span></label>
                            <select
                                id="unit"
                                class="form-select"
                                v-model="definitionForm.unit"
                                required
                                :class="{'border-red-500': formErrors.unit}"
                            >
                                <option value="adet">Adet</option>
                                <option value="takım">Takım</option>
                                <option value="lt">Litre</option>
                                <option value="mt">Metre</option>
                                <option value="kutu">Kutu</option>
                                <option value="paket">Paket</option>
                            </select>
                            <p v-if="formErrors.unit" class="text-red-500 text-xs mt-1">{{ formErrors.unit }}</p>
                        </div>

                        <!-- Stok Numarası -->
                        <div class="mb-4">
                            <label for="stockNumber">Stok Numarası</label>
                            <input
                                id="stockNumber"
                                type="text"
                                class="form-input"
                                v-model="definitionForm.stockNumber"
                                placeholder="Stok numarası giriniz"
                            />
                        </div>

                        <!-- Minimum Stok Seviyesi -->
                        <div class="mb-4">
                            <label for="minStockLevel">Minimum Stok Seviyesi</label>
                            <input
                                id="minStockLevel"
                                type="number"
                                class="form-input"
                                v-model="definitionForm.minStockLevel"
                                min="0"
                            />
                        </div>

                        <!-- Seri Numarası Takibi -->
                        <div class="mb-4">
                            <label class="flex items-center">
                                <input type="checkbox" class="form-checkbox" v-model="definitionForm.hasSerialization" />
                                <span class="ml-2">Seri Numarası İle Takip Et</span>
                            </label>
                            <p class="text-xs text-gray-500 mt-1">Ürünleri benzersiz seri numarası ile takip etmek için işaretleyin</p>
                        </div>

                        <!-- Seri Numarası Zorunlu -->
                        <div class="mb-4" v-if="definitionForm.hasSerialization">
                            <label class="flex items-center">
                                <input type="checkbox" class="form-checkbox" v-model="definitionForm.requireSerialNumber" />
                                <span class="ml-2">Seri Numarası Zorunlu</span>
                            </label>
                            <p class="text-xs text-gray-500 mt-1">İşaretlenirse, stok girişinde seri numarası girişi zorunlu olacaktır</p>
                        </div>

                        <!-- Seri Numarası Ön Eki -->
                        <div class="mb-4" v-if="definitionForm.hasSerialization">
                            <label for="serialNumberPrefix">Seri Numarası Ön Eki</label>
                            <input
                                id="serialNumberPrefix"
                                type="text"
                                class="form-input"
                                v-model="definitionForm.serialNumberPrefix"
                                placeholder="Örn: KMR-"
                            />
                            <p class="text-xs text-gray-500 mt-1">Otomatik seri numarası oluşturmada kullanılacak ön ek</p>
                        </div>

                        <!-- Durum -->
                        <div class="mb-4 flex items-center">
                            <label class="inline-flex">
                                <input type="checkbox" class="form-checkbox" v-model="definitionForm.isActive" />
                                <span class="ml-2">Aktif</span>
                            </label>
                        </div>

                        <!-- Açıklama -->
                        <div class="mb-4 sm:col-span-2">
                            <label for="description">Açıklama</label>
                            <textarea
                                id="description"
                                class="form-textarea"
                                rows="3"
                                v-model="definitionForm.description"
                            ></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end gap-4 mt-4">
                        <button type="button" class="btn btn-outline-danger" @click="resetDefinitionForm">
                            Formu Temizle
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="submitting">
                            <span v-if="submitting" class="animate-spin mr-2">&#8635;</span>
                            Ürün Tanımı Kaydet
                        </button>
                    </div>
                </form>
            </div>

            <!-- Depoya Ürün Ekleme Sekmesi (Tüm Kullanıcılar İçin) -->
            <div v-if="activeTab === 'add-to-warehouse'" class="panel">
                <h5 class="mb-5">Depoya Seri Numaralı Ürün Ekle</h5>
                
                <!-- Adım 1: Ürün Seçme -->
                <div class="mb-6">
                    <h6 class="text-base mb-3 font-semibold">1. Ürün Seçin</h6>                    <div class="flex flex-wrap gap-3">
                        <div class="flex-1 min-w-[200px]">
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="searchTerm" 
                                placeholder="Ürün kodu, stok kodu veya adı ile ara..." 
                                @keyup.enter="searchProducts"
                            />
                        </div>
                        <button @click="searchProducts" class="btn btn-primary">Ara</button>
                    </div>
                    
                    <!-- Arama Sonuçları -->
                    <div v-if="searchResults.length > 0" class="mt-4">
                        <h6 class="text-sm mb-2">Arama Sonuçları</h6>
                        <div class="overflow-x-auto">                            <table class="table-auto w-full">
                                <thead>
                                    <tr>
                                        <th class="border p-2 dark:border-[#191e3a] text-left">Ürün Kodu</th>
                                        <th class="border p-2 dark:border-[#191e3a] text-left">Stok Kodu</th>
                                        <th class="border p-2 dark:border-[#191e3a] text-left">Ürün Adı</th>
                                        <th class="border p-2 dark:border-[#191e3a] text-left">Kategori</th>
                                        <th class="border p-2 dark:border-[#191e3a] text-right">İşlem</th>
                                    </tr>
                                </thead>                                <tbody>
                                    <tr v-for="product in searchResults" :key="product.id" class="border-b border-[#ebedf2] dark:border-[#191e3a]">
                                        <td class="p-2">{{ product.code }}</td>
                                        <td class="p-2">{{ product.stockNumber || '-' }}</td>
                                        <td class="p-2">{{ product.name }}</td>
                                        <td class="p-2">{{ typeof product.category === 'object' ? (product.category?.name || '-') : product.category }}</td>
                                        <td class="p-2 text-right">
                                            <button @click="selectProduct(product)" class="btn btn-sm btn-outline-primary">
                                                Seç
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div v-else-if="searchAttempted" class="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                        <p>Arama sonucu bulunamadı. Lütfen başka bir arama terimi deneyin.</p>
                    </div>
                </div>
                
                <!-- Adım 2: Seçilen Ürün Bilgileri -->
                <div v-if="selectedProduct" class="mb-6 border-t border-b border-gray-200 dark:border-gray-700 py-4">
                    <h6 class="text-base mb-3 font-semibold">2. Seçilen Ürün Bilgileri</h6>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium">Ürün Kodu:</label>
                            <div class="font-semibold">{{ selectedProduct.code }}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Ürün Adı:</label>
                            <div class="font-semibold">{{ selectedProduct.name }}</div>
                        </div>                        <div>
                            <label class="block text-sm font-medium">Kategori:</label>
                            <div>{{ typeof selectedProduct.category === 'object' ? (selectedProduct.category?.name || '-') : selectedProduct.category }}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Alt Kategori:</label>
                            <div>{{ selectedProduct.subCategory || '-' }}</div>
                        </div>
                        <div v-if="selectedProduct.description">
                            <label class="block text-sm font-medium">Açıklama:</label>
                            <div>{{ selectedProduct.description }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Adım 3: Seri Numarası ve Depo Bilgileri -->
                <div v-if="selectedProduct" class="mb-6">
                    <h6 class="text-base mb-3 font-semibold">3. Depoya Ekleme Bilgileri</h6>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Depo Seçimi -->
                        <div class="mb-4">
                            <label for="warehouseId">Depo <span class="text-red-500">*</span></label>
                            <select 
                                id="warehouseId" 
                                class="form-select" 
                                v-model="warehouseItemForm.warehouseId"
                                required
                                :class="{'border-red-500': warehouseItemErrors.warehouseId}"
                            >
                                <option value="">Depo Seçiniz</option>
                                <option v-for="warehouse in availableWarehouses" :key="warehouse.id" :value="warehouse.id">
                                    {{ warehouse.name }}
                                </option>
                            </select>
                            <p v-if="warehouseItemErrors.warehouseId" class="text-red-500 text-xs mt-1">
                                {{ warehouseItemErrors.warehouseId }}
                            </p>
                        </div>
                        
                        <!-- Proje Seçimi -->
                        <div class="mb-4">
                            <label for="projectId">Proje</label>
                            <select id="projectId" class="form-select" v-model="warehouseItemForm.projectId">
                                <option value="">Proje Seçiniz</option>
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Seri Numarası Girişi -->
                    <div class="mb-4">
                        <div class="flex flex-col mb-2">
                            <label for="serialNumber" class="mb-1">
                                Seri Numarası
                                <span v-if="selectedProduct.requireSerialNumber" class="text-red-500">*</span>
                            </label>
                            <div class="flex gap-2">
                                <input 
                                    id="serialNumber" 
                                    type="text" 
                                    class="form-input" 
                                    v-model="warehouseItemForm.serialNumber"
                                    :required="selectedProduct.requireSerialNumber"
                                    :class="{'border-red-500': warehouseItemErrors.serialNumber}"
                                    placeholder="Ürün seri numarasını girin"
                                />
                                <button 
                                    v-if="selectedProduct.serialNumberPrefix" 
                                    type="button" 
                                    class="btn btn-outline-info"
                                    @click="generateSerialNumber"
                                >
                                    Oluştur
                                </button>
                            </div>
                            <p v-if="warehouseItemErrors.serialNumber" class="text-red-500 text-xs mt-1">
                                {{ warehouseItemErrors.serialNumber }}
                            </p>
                            <p class="text-xs text-gray-500 mt-1" v-if="selectedProduct.serialNumberPrefix">
                                Ön ek: {{ selectedProduct.serialNumberPrefix }}
                            </p>
                        </div>
                    </div>
                    
                    <!-- İlave Bilgiler -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Edinim Tarihi -->
                        <div class="mb-4">
                            <label for="acquisitionDate">Edinim Tarihi</label>
                            <input 
                                id="acquisitionDate" 
                                type="date" 
                                class="form-input" 
                                v-model="warehouseItemForm.acquisitionDate"
                            />
                        </div>
                        
                        <!-- Garanti Bitiş Tarihi -->
                        <div class="mb-4">
                            <label for="warrantyEndDate">Garanti Bitiş Tarihi</label>
                            <input 
                                id="warrantyEndDate" 
                                type="date" 
                                class="form-input" 
                                v-model="warehouseItemForm.warrantyEndDate"
                            />
                        </div>
                    </div>
                    
                    <!-- Notlar -->
                    <div class="mb-4">
                        <label for="notes">Notlar</label>
                        <textarea 
                            id="notes" 
                            class="form-textarea" 
                            rows="3"
                            v-model="warehouseItemForm.notes"
                            placeholder="Ürün ile ilgili özel notlar"
                        ></textarea>
                    </div>
                </div>
                
                <!-- Butonlar -->
                <div class="flex justify-end gap-4">
                    <button type="button" class="btn btn-outline-danger" @click="resetWarehouseItemForm">
                        Temizle
                    </button>
                    <button 
                        type="button" 
                        class="btn btn-primary" 
                        @click="addSerializedItem"
                        :disabled="submitting || !selectedProduct"
                    >
                        <span v-if="submitting" class="animate-spin mr-2">&#8635;</span>
                        Depoya Ekle
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
                <span>{{ notification.message }}</span>
                <button class="ml-4 text-white hover:text-gray-200" @click="closeNotification">
                    <i class="las la-times"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/projects';
import serializedInventoryService from '@/services/inventory/serializedInventoryService';
import dayjs from 'dayjs';

// Store nesnelerini oluştur
const router = useRouter();
const inventoryStore = useInventoryStore();
const authStore = useAuthStore();
const projectStore = useProjectStore();

// Sekme durumu
const activeTab = ref(authStore.isAdmin ? 'definitions' : 'add-to-warehouse');

// Kategori-alt kategori ilişkilerini tanımla
const categorySubcategories: Record<string, string[]> = {
    'ekinoks': ['Hareketli Kamera', 'Sabit Kamera', 'Balistik Kamera', 'Akıllı Hareketli', 'Akıllı Sabit'],
    'geko': ['Geko', 'Geko+', 'Mobil PTS'],
    'kayitcihazi': ['NIR 54TB', 'NIR 96TB', 'CIR 96TB', 'CIR 216TB', 'NVR 64TB', 'NVR 96 TB', 'NAR 64 TB', 'NAR 96 TB'],
    'ethernet': ['C Tipi Ethernet Anahtar', 'B Tipi Ethernet Anahtar', 'A Tipi Ethernet Anahtar']
};

// Ürün tanımlama formu değişkenleri
const availableSubCategories = ref<string[]>([]);
const formErrors = ref<Record<string, string>>({});
const submitting = ref(false);

// Ürün tanımlama formu
const definitionForm = ref({
    code: '',
    name: '',
    categoryId: '',
    subCategory: '',
    unit: 'adet',
    stockNumber: '',
    minStockLevel: 0,
    description: '',
    isActive: true,
    hasSerialization: false,
    requireSerialNumber: false,
    serialNumberPrefix: ''
});

// Depoya ürün ekleme formu değişkenleri
const searchTerm = ref('');
const searchResults = ref<any[]>([]);
const searchAttempted = ref(false);
const selectedProduct = ref<any | null>(null);
const warehouseItemErrors = ref<Record<string, string>>({});

// Depoya ürün ekleme formu
const warehouseItemForm = ref({
    productId: '',
    serialNumber: '',
    warehouseId: '',
    projectId: '',
    acquisitionDate: dayjs().format('YYYY-MM-DD'),
    warrantyEndDate: '',
    notes: '',
    status: 'active'
});

// Bildirim state'i
const notification = ref({
    show: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
});

// Hesaplanmış değerler
const categories = computed(() => inventoryStore.getCategories);
const projects = computed(() => projectStore.projects);

// Kullanıcı için erişilebilir depolar
const availableWarehouses = computed(() => {
    const warehouses = inventoryStore.getWarehouses;
    
    // Admin kullanıcı tüm depoları görebilir
    if (authStore.isAdmin) {
        return warehouses;
    }
    
    // Depo sorumlusu sadece kendi deposunu görebilir
    const userDepot = authStore.getAuthorizedDepot;
    if (userDepot) {
        return warehouses.filter(w => w.code === userDepot);
    }
    
    return [];
});

// Kategori değiştiğinde alt kategorileri güncelleme
const updateSubCategories = () => {
    const selectedCategory = categories.value.find(c => c.id === definitionForm.value.categoryId);
    if (selectedCategory) {
        const categoryName = selectedCategory.name.toLowerCase();
        
        if (categoryName.includes('ekinoks')) {
            availableSubCategories.value = categorySubcategories['ekinoks'];
        } else if (categoryName.includes('geko')) {
            availableSubCategories.value = categorySubcategories['geko'];
        } else if (categoryName.includes('kayıt') || categoryName.includes('kayit')) {
            availableSubCategories.value = categorySubcategories['kayitcihazi'];
        } else if (categoryName.includes('ethernet')) {
            availableSubCategories.value = categorySubcategories['ethernet'];
        } else {
            availableSubCategories.value = [];
        }
        
        definitionForm.value.subCategory = '';
    } else {
        availableSubCategories.value = [];
        definitionForm.value.subCategory = '';
    }
};

// Ürün kodu kullanılabilirliğini kontrol et
const checkCodeAvailability = (code: string): boolean => {
    const products = inventoryStore.getProducts;
    const existingProduct = products.find(p => p.code && p.code.toLowerCase() === code.toLowerCase());
    return existingProduct === undefined;
};

// Ürün tanımlama formu doğrulama
const validateDefinitionForm = (): boolean => {
    formErrors.value = {};
    let isValid = true;
    
    if (!definitionForm.value.code.trim()) {
        formErrors.value.code = 'Ürün kodu zorunludur';
        isValid = false;
    } else if (!checkCodeAvailability(definitionForm.value.code)) {
        formErrors.value.code = 'Bu ürün kodu zaten kullanılıyor';
        isValid = false;
    }
    
    if (!definitionForm.value.name.trim()) {
        formErrors.value.name = 'Ürün adı zorunludur';
        isValid = false;
    }
    
    if (!definitionForm.value.categoryId) {
        formErrors.value.categoryId = 'Kategori seçmelisiniz';
        isValid = false;
    }
    
    if (definitionForm.value.categoryId && availableSubCategories.value.length > 0 && !definitionForm.value.subCategory) {
        formErrors.value.subCategory = 'Alt kategori seçmelisiniz';
        isValid = false;
    }
    
    if (!definitionForm.value.unit) {
        formErrors.value.unit = 'Birim seçmelisiniz';
        isValid = false;
    }
    
    return isValid;
};

// Depoya ürün ekleme formu doğrulama
const validateWarehouseItemForm = (): boolean => {
    warehouseItemErrors.value = {};
    let isValid = true;
    
    if (!warehouseItemForm.value.warehouseId) {
        warehouseItemErrors.value.warehouseId = 'Depo seçimi zorunludur';
        isValid = false;
    }
    
    if (selectedProduct.value?.requireSerialNumber && !warehouseItemForm.value.serialNumber) {
        warehouseItemErrors.value.serialNumber = 'Seri numarası zorunludur';
        isValid = false;
    }
    
    // Seri numarası benzersizliğini kontrol etmek için async kontrolü handleSubmit içine koyacağız
    
    return isValid;
};

// Ürün tanımlama formunu sıfırla
const resetDefinitionForm = () => {
    definitionForm.value = {
        code: '',
        name: '',
        categoryId: '',
        subCategory: '',
        unit: 'adet',
        stockNumber: '',
        minStockLevel: 0,
        description: '',
        isActive: true,
        hasSerialization: false,
        requireSerialNumber: false,
        serialNumberPrefix: ''
    };
    formErrors.value = {};
    availableSubCategories.value = [];
    showNotification('Form temizlendi', 'info');
};

// Depoya ürün ekleme formunu sıfırla
const resetWarehouseItemForm = () => {
    warehouseItemForm.value = {
        productId: '',
        serialNumber: '',
        warehouseId: '',
        projectId: '',
        acquisitionDate: dayjs().format('YYYY-MM-DD'),
        warrantyEndDate: '',
        notes: '',
        status: 'active'
    };
    warehouseItemErrors.value = {};
    selectedProduct.value = null;
    searchResults.value = [];
    searchTerm.value = '';
    searchAttempted.value = false;
    showNotification('Form temizlendi', 'info');
};

// Bildirim göster
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    notification.value = {
        show: true,
        message,
        type
    };
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};

// Bildirimi kapat
const closeNotification = () => {
    notification.value.show = false;
};

// Ürün tanımlama formu gönderme
const handleDefinitionSubmit = async () => {
    if (!validateDefinitionForm()) {
        return;
    }

    submitting.value = true;
    try {
        // Store'da yeni ürün oluştur
        await inventoryStore.addProduct({
            code: definitionForm.value.code,
            name: definitionForm.value.name,
            categoryId: definitionForm.value.categoryId,
            subCategory: definitionForm.value.subCategory,
            unit: definitionForm.value.unit,
            stockNumber: definitionForm.value.stockNumber,
            minStockLevel: definitionForm.value.minStockLevel,
            description: definitionForm.value.description,
            isActive: definitionForm.value.isActive,
            category: categories.value.find(c => c.id === definitionForm.value.categoryId)?.name || '',
            hasSerialization: definitionForm.value.hasSerialization,
            requireSerialNumber: definitionForm.value.requireSerialNumber,
            serialNumberPrefix: definitionForm.value.serialNumberPrefix,
            unitPrice: 0 // Birim fiyat gerekli olduğu için 0 olarak eklendi
        });
        
        showNotification(`"${definitionForm.value.name}" ürünü başarıyla eklendi`, 'success');
        resetDefinitionForm();
    } catch (error) {
        console.error('Ürün eklenirken hata oluştu:', error);
        showNotification('Ürün eklenirken bir hata oluştu', 'error');
    } finally {
        submitting.value = false;
    }
};

// Ürün arama
const searchProducts = async () => {
    if (!searchTerm.value.trim()) {
        showNotification('Lütfen bir arama terimi girin', 'info');
        return;
    }
    
    submitting.value = true;
    searchAttempted.value = true;
    
    try {
        // Ürünleri yükle (Gerçekte burada bir API çağrısı olacak)
        const allProducts = inventoryStore.getProducts;
          // Arama terimi ile filtreleme yap
        const term = searchTerm.value.toLowerCase();
        searchResults.value = allProducts.filter(product => 
            (product.code && product.code.toLowerCase().includes(term)) ||
            (product.name && product.name.toLowerCase().includes(term)) ||
            (product.stockNumber && product.stockNumber.toLowerCase().includes(term))
        );
        
        // Sadece hasSerialization true olan ürünleri filtrele
        searchResults.value = searchResults.value.filter(product => product.hasSerialization);
        
        if (searchResults.value.length === 0) {
            showNotification('Aramanızla eşleşen seri numaralı takip edilen ürün bulunamadı', 'info');
        }
    } catch (error) {
        console.error('Ürün arama hatası:', error);
        showNotification('Ürünler aranırken bir hata oluştu', 'error');
    } finally {
        submitting.value = false;
    }
};

// Ürün seçme
const selectProduct = (product: any) => {
    selectedProduct.value = product;
    warehouseItemForm.value.productId = product.id;
    
    // Depo kullanıcısı için otomatik depo seçimi
    if (!authStore.isAdmin && availableWarehouses.value.length === 1) {
        warehouseItemForm.value.warehouseId = availableWarehouses.value[0].id;
    }
    
    // Seri numarası varsa, ön eki uygula
    if (product.serialNumberPrefix) {
        warehouseItemForm.value.serialNumber = product.serialNumberPrefix;
    }
};

// Otomatik seri numarası oluştur
const generateSerialNumber = () => {
    if (!selectedProduct.value || !selectedProduct.value.serialNumberPrefix) return;
    
    const prefix = selectedProduct.value.serialNumberPrefix;
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    warehouseItemForm.value.serialNumber = `${prefix}${randomPart}-${timestamp}`;
};

// Depoya seri numaralı ürün ekleme
const addSerializedItem = async () => {
    if (!validateWarehouseItemForm()) {
        return;
    }
    
    submitting.value = true;
    
    try {
        // Önce seri numarasının benzersiz olduğunu kontrol et
        const existingItem = await serializedInventoryService.getSerializedItemBySerialNumber(
            warehouseItemForm.value.serialNumber
        );
        
        if (existingItem) {
            warehouseItemErrors.value.serialNumber = 'Bu seri numarası zaten kullanımda';
            submitting.value = false;
            return;
        }
        
        // Seri numaralı ürünü ekle
        const serializedItem = {
            productId: selectedProduct.value.id,
            serialNumber: warehouseItemForm.value.serialNumber,
            warehouseId: warehouseItemForm.value.warehouseId,
            projectId: warehouseItemForm.value.projectId || null,
            status: warehouseItemForm.value.status,
            acquisitionDate: warehouseItemForm.value.acquisitionDate ? new Date(warehouseItemForm.value.acquisitionDate) : new Date(),
            warrantyEndDate: warehouseItemForm.value.warrantyEndDate ? new Date(warehouseItemForm.value.warrantyEndDate) : null,
            notes: warehouseItemForm.value.notes || null
        };
        
        const result = await serializedInventoryService.addSerializedItem(serializedItem);
        
        if (result) {
            showNotification(`"${selectedProduct.value.name}" ürünü depoya başarıyla eklendi`, 'success');
            resetWarehouseItemForm();
        }
    } catch (error: any) {
        console.error('Seri numaralı ürün eklenirken hata oluştu:', error);
        showNotification(
            error.message || 'Seri numaralı ürün eklenirken bir hata oluştu', 
            'error'
        );
    } finally {
        submitting.value = false;
    }
};

// Sayfa yüklendiğinde
onMounted(async () => {
    // Tam sayfa yüklendiğinde hemen ürün tanımlama veya ürün ekleme sekmesini göster
    if (!authStore.isAdmin) {
        activeTab.value = 'add-to-warehouse';
    }
    
    try {
        // Gerekli verileri yükle
        await inventoryStore.initializeStore();
        await projectStore.initializeStore();
        
        // Eğer depo kullanıcısı ise, otomatik olarak kendi deposunu seç
        if (!authStore.isAdmin && authStore.userInfo?.depot) {
            const userDepot = availableWarehouses.value.find(w => w.code === authStore.userInfo?.depot);
            if (userDepot) {
                warehouseItemForm.value.warehouseId = userDepot.id;
            }
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showNotification('Veriler yüklenirken bir hata oluştu', 'error');
    }
});
</script>

<style scoped>
.tab-item a.active {
    @apply text-primary border-primary border-b-2;
}
</style>
