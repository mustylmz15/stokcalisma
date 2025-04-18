<template>
    <div>
        <div class="panel">
            <div class="flex items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Ürün Düzenle</h5>
                <router-link to="/inventory/products" class="btn btn-outline-primary">
                    <i class="las la-arrow-left"></i> Geri Dön
                </router-link>
            </div>

            <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
                <div class="animate-spin rounded-full h-10 w-10 border-4 border-primary border-l-transparent"></div>
            </div>

            <form v-else @submit.prevent="handleSubmit">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Ürün Kodu -->
                    <div class="mb-4">
                        <label for="productCode">Ürün Kodu <span class="text-red-500">*</span></label>
                        <input
                            id="productCode"
                            type="text"
                            class="form-input"
                            v-model="formData.code"
                            required
                            readonly
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
                        >
                            <option value="">Kategori Seçiniz</option>
                            <option v-for="category in categories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                        <p v-if="formErrors.categoryId" class="text-red-500 text-xs mt-1">{{ formErrors.categoryId }}</p>
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
                            <option value="kg">Kilogram</option>
                            <option value="lt">Litre</option>
                            <option value="mt">Metre</option>
                            <option value="kutu">Kutu</option>
                            <option value="paket">Paket</option>
                        </select>
                        <p v-if="formErrors.unit" class="text-red-500 text-xs mt-1">{{ formErrors.unit }}</p>
                    </div>

                    <!-- Birim Fiyat -->
                    <div class="mb-4">
                        <label for="unitPrice">Birim Fiyat <span class="text-red-500">*</span></label>
                        <div class="relative">
                            <input
                                id="unitPrice"
                                type="number"
                                step="0.01"
                                class="form-input pl-8"
                                v-model="formData.unitPrice"
                                required
                                :class="{'border-red-500': formErrors.unitPrice}"
                            />
                            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                        </div>
                        <p v-if="formErrors.unitPrice" class="text-red-500 text-xs mt-1">{{ formErrors.unitPrice }}</p>
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

                    <!-- Mevcut Stok -->
                    <div class="mb-4">
                        <label for="currentStock">Mevcut Stok</label>
                        <div class="flex items-center">
                            <input
                                id="currentStock"
                                type="number"
                                class="form-input bg-gray-100"
                                v-model="formData.totalStock"
                                readonly
                            />
                            <span class="ml-2">{{ formData.unit }}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            Stok miktarını değiştirmek için 
                            <router-link to="/inventory/movements" class="text-blue-500 hover:underline">
                                stok hareketi
                            </router-link> 
                            ekleyin.
                        </p>
                    </div>

                    <!-- Durum -->
                    <div class="mb-4">
                        <label class="block mb-2">Durum</label>
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

                <div class="flex justify-end gap-4 mt-4">
                    <button type="button" class="btn btn-outline-danger" @click="resetForm">
                        Değişiklikleri İptal Et
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="submitting">
                        Değişiklikleri Kaydet
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
    unit?: string;
    unitPrice?: string;
}

interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

const router = useRouter();
const route = useRoute();
const inventoryStore = useInventoryStore();

const loading = ref(false);
const submitting = ref(false);
const formErrors = ref<FormErrors>({});
const originalProduct = ref<any | null>(null);

const notification = ref<Notification>({
    show: false,
    message: '',
    type: 'info'
});

const formData = ref({
    id: '',
    code: '',
    name: '',
    categoryId: '',
    unit: 'adet',
    unitPrice: 0,
    minStockLevel: 0,
    totalStock: 0,
    description: '',
    isActive: true
});

// Saf veriler doğrudan store'dan alınıyor
const categories = ref(inventoryStore.getCategories);

onMounted(async () => {
    const productId = route.params.id?.toString();
    if (productId) {
        await loadProduct(productId);
    } else {
        router.push('/inventory/products');
    }
});

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
            unitPrice: product.unitPrice,
            minStockLevel: product.minStockLevel,
            totalStock: product.totalStock || 0,
            description: product.description || '',
            isActive: product.isActive
        };
        
        originalProduct.value = { ...formData.value };
    } catch (error) {
        console.error('Ürün yüklenirken hata oluştu:', error);
        showNotification('Ürün yüklenirken bir hata oluştu', 'error');
        router.push('/inventory/products');
    } finally {
        loading.value = false;
    }
};

const validateForm = (): boolean => {
    formErrors.value = {};
    
    if (!formData.value.code.trim()) {
        formErrors.value.code = 'Ürün kodu zorunludur';
    }
    
    if (!formData.value.name.trim()) {
        formErrors.value.name = 'Ürün adı zorunludur';
    }
    
    if (!formData.value.categoryId) {
        formErrors.value.categoryId = 'Kategori seçmelisiniz';
    }
    
    if (!formData.value.unit) {
        formErrors.value.unit = 'Birim seçmelisiniz';
    }
    
    if (formData.value.unitPrice <= 0) {
        formErrors.value.unitPrice = 'Birim fiyat 0\'dan büyük olmalıdır';
    }
    
    return Object.keys(formErrors.value).length === 0;
};

const resetForm = () => {
    if (originalProduct.value) {
        formData.value = { ...originalProduct.value };
    }
    showNotification('Form değişiklikleri iptal edildi', 'info');
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
            name: formData.value.name,
            categoryId: formData.value.categoryId,
            unit: formData.value.unit,
            unitPrice: formData.value.unitPrice,
            minStockLevel: formData.value.minStockLevel,
            description: formData.value.description,
            isActive: formData.value.isActive
        };
        
        // Store'da ürünü güncelle
        inventoryStore.updateProduct(formData.value.id, updatedProduct);
        
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
</script>