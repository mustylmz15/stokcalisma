<template>
    <div>
        <div class="flex justify-between mb-5 items-center">
            <h5 class="font-semibold text-lg dark:text-white-light">Ürün Düzenle</h5>
            <router-link to="/inventory/products" class="btn btn-outline-primary">
                <span class="flex items-center">
                    <i class="las la-arrow-left mr-1"></i> Geri Dön
                </span>
            </router-link>
        </div>

        <div class="panel" v-if="loading">
            <div class="flex justify-center items-center p-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </div>

        <div class="panel" v-else>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Ürün Kodu (Düzenlenemez) -->
                    <div class="mb-4">
                        <label for="productCode">Ürün Kodu</label>
                        <input
                            id="productCode"
                            type="text"
                            class="form-input bg-gray-100"
                            v-model="formData.code"
                            disabled
                        />
                        <p class="text-xs text-gray-500 mt-1">Ürün kodu değiştirilemez</p>
                    </div>

                    <!-- Stok Numarası -->
                    <div class="mb-4">
                        <label for="stockNumber">Stok Numarası</label>
                        <input
                            id="stockNumber"
                            type="text"
                            class="form-input"
                            v-model="formData.stockNumber"
                            placeholder="Stok numarası giriniz"
                        />
                    </div>

                    <!-- Ürün Adı -->
                    <div class="mb-4">
                        <label for="productName">Ürün Adı <span class="text-red-500">*</span></label>
                        <input
                            id="productName"
                            type="text"
                            class="form-input"
                            v-model="formData.name"
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
                            v-model="formData.categoryId"
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
                            v-model="formData.subCategory"
                            required
                            :disabled="!formData.categoryId || availableSubCategories.length === 0"
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
                            v-model="formData.unit"
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

                    <!-- Minimum Stok Seviyesi -->
                    <div class="mb-4">
                        <label for="minStockLevel">Minimum Stok Seviyesi</label>
                        <input
                            id="minStockLevel"
                            type="number"
                            class="form-input"
                            v-model="formData.minStockLevel"
                            min="0"
                        />
                    </div>

                    <!-- Toplam Stok (Sadece Gösterim) -->
                    <div class="mb-4">
                        <label for="totalStock">Toplam Stok</label>
                        <input
                            id="totalStock"
                            type="number"
                            class="form-input bg-gray-100"
                            v-model="formData.totalStock"
                            disabled
                        />
                        <p class="text-xs text-gray-500 mt-1">Stok hareketleriyle güncellenir</p>
                    </div>

                    <!-- Durum -->
                    <div class="mb-4 flex items-center">
                        <label class="inline-flex">
                            <input type="checkbox" class="form-checkbox" v-model="formData.isActive" />
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
                            v-model="formData.description"
                        ></textarea>
                    </div>
                </div>

                <div class="flex justify-end gap-4 mt-6">
                    <button type="button" class="btn btn-outline-danger" @click="resetForm">
                        Değişiklikleri İptal Et
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="submitting">
                        <span v-if="submitting" class="animate-spin mr-2">&#8635;</span>
                        Kaydet
                    </button>
                </div>
            </form>
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
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';

interface FormErrors {
    code?: string;
    name?: string;
    categoryId?: string;
    subCategory?: string;
    unit?: string;
}

interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

// Kategori-alt kategori ilişkilerini tanımla
const categorySubcategories: Record<string, string[]> = {
    'ekinoks': ['Hareketli Kamera', 'Sabit Kamera', 'Balistik Kamera', 'Akıllı Hareketli', 'Akıllı Sabit'],
    'geko': ['Geko', 'Geko+', 'Mobil PTS'],
    'kayitcihazi': ['NIR 54TB', 'NIR 96TB', 'CIR 96TB', 'CIR 216TB', 'NVR 64TB', 'NVR 96 TB', 'NAR 64 TB', 'NAR 96 TB'],
    'ethernet': ['C Tipi Ethernet Anahtar', 'B Tipi Ethernet Anahtar', 'A Tipi Ethernet Anahtar']
};

const router = useRouter();
const route = useRoute();
const inventoryStore = useInventoryStore();

const loading = ref(false);
const submitting = ref(false);
const formErrors = ref<FormErrors>({});
const originalProduct = ref<any | null>(null);

// Mevcut alt kategorileri tutan değişken
const availableSubCategories = ref<string[]>([]);

const notification = ref<Notification>({
    show: false,
    message: '',
    type: 'info'
});

// Form verisi
const formData = ref({
    id: '',
    code: '',
    name: '',
    categoryId: '',
    subCategory: '',
    unit: 'adet',
    stockNumber: '',
    minStockLevel: 0,
    totalStock: 0,
    description: '',
    isActive: true
});

// Store'dan veri getirme
const categories = ref(inventoryStore.getCategories);

// Kategori seçildiğinde alt kategorileri güncelle
const updateSubCategories = () => {
    // Seçilen kategoriye göre alt kategorileri belirle
    const selectedCategory = categories.value.find(c => c.id === formData.value.categoryId);
    if (selectedCategory) {
        // Kategori adını küçük harfe çevir
        const categoryName = selectedCategory.name.toLowerCase();
        
        // Kategori adına göre alt kategorileri belirle
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
        
        // Eğer mevcut alt kategori bu liste içinde değilse, sıfırla
        if (formData.value.subCategory && !availableSubCategories.value.includes(formData.value.subCategory)) {
            formData.value.subCategory = '';
        }
    } else {
        availableSubCategories.value = [];
        formData.value.subCategory = '';
    }
    
    console.log('Kategori değişti:', selectedCategory?.name, 'Alt kategoriler:', availableSubCategories.value);
};

// Ürün bilgilerini yükle
const loadProduct = async (productId: string) => {
    loading.value = true;
    try {
        const product = inventoryStore.getProducts.find(p => p.id === productId);
        
        if (!product) {
            showNotification('Ürün bulunamadı. Ürün listesine yönlendiriliyorsunuz.', 'error');
            setTimeout(() => {
                router.push('/inventory/products');
            }, 2000);
            return;
        }
          formData.value = { 
            id: product.id,
            code: product.code,
            name: product.name,
            categoryId: product.categoryId, 
            unit: product.unit,
            subCategory: product.subCategory || '',
            stockNumber: product.stockNumber || '',
            minStockLevel: product.minStockLevel,
            totalStock: product.totalStock || 0,
            description: product.description || '',
            isActive: product.isActive
        };

        // Ürün yüklendiğinde alt kategorileri de güncelle
        updateSubCategories();

        // Orijinal ürün bilgilerini sakla
        originalProduct.value = { ...formData.value };
        
    } catch (error) {
        console.error('Ürün yüklenirken hata oluştu:', error);
        showNotification('Ürün bilgileri yüklenirken bir hata oluştu', 'error');
    } finally {
        loading.value = false;
    }
};

const validateForm = (): boolean => {
    formErrors.value = {};
    let isValid = true;
    
    if (!formData.value.name.trim()) {
        formErrors.value.name = 'Ürün adı zorunludur';
        isValid = false;
    }
    
    if (!formData.value.categoryId) {
        formErrors.value.categoryId = 'Kategori seçmelisiniz';
        isValid = false;
    }
    
    if (formData.value.categoryId && availableSubCategories.value.length > 0 && !formData.value.subCategory) {
        formErrors.value.subCategory = 'Alt kategori seçmelisiniz';
        isValid = false;
    }
    
    if (!formData.value.unit) {
        formErrors.value.unit = 'Birim seçmelisiniz';
        isValid = false;
    }
    
    return isValid;
};

const resetForm = () => {
    if (originalProduct.value) {
        formData.value = { ...originalProduct.value };
        // Alt kategorileri yeniden yükle
        updateSubCategories();
    }
    formErrors.value = {};
    showNotification('Form orijinal değerlere sıfırlandı', 'info');
};

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

const closeNotification = () => {
    notification.value.show = false;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    submitting.value = true;
    try {
        const updatedProduct = {
            code: formData.value.code,
            name: formData.value.name,
            categoryId: formData.value.categoryId,
            subCategory: formData.value.subCategory,
            unit: formData.value.unit,
            stockNumber: formData.value.stockNumber,
            minStockLevel: formData.value.minStockLevel,
            description: formData.value.description,
            isActive: formData.value.isActive
        };
        
        // Store'da ürünü güncelle - await ile bekleyerek işlemin tamamlanmasını sağla
        await inventoryStore.updateProduct(formData.value.id, updatedProduct);
        
        showNotification('Ürün başarıyla güncellendi', 'success');
        
        // Son değişiklikleri originalProduct'a da yansıt
        originalProduct.value = { ...formData.value };
        
        // Kısa bir bekleme sonrası ürün listesine dön
        setTimeout(() => {
            router.push('/inventory/products');
        }, 1500);
    } catch (error) {
        console.error('Ürün güncellenirken hata oluştu:', error);
        showNotification('Ürün güncellenirken bir hata oluştu', 'error');
    } finally {
        submitting.value = false;
    }
};

// Sayfa yüklendiğinde
onMounted(() => {
    // URL'den ürün ID'sini al
    const productId = route.params.id as string;
    if (productId) {
        loadProduct(productId);
    } else {
        router.push('/inventory/products');
    }
});
</script>