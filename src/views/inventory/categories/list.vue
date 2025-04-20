<template>
    <div>
        <div class="panel">
            <div class="flex flex-col md:flex-row items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Kategoriler</h5>
                <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
                    <!-- Arama kutusu -->
                    <div class="flex items-center">
                        <input 
                            type="text" 
                            class="form-input" 
                            placeholder="Kategori ara..." 
                            v-model="searchTerm"
                            @input="filterCategories"
                        />
                    </div>
                    <button class="btn btn-primary" @click="openAddModal">
                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        Yeni Kategori Ekle
                    </button>
                </div>
            </div>

            <!-- Kategori Listesi -->
            <div class="table-responsive">
                <table class="table-striped w-full bg-white dark:bg-black">
                    <thead>
                        <tr>
                            <th class="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-left">Kategori Adı</th>
                            <th class="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-left">Açıklama</th>
                            <th class="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-left">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="3" class="text-center">
                                <div class="flex justify-center items-center p-4">
                                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="paginatedCategories.length === 0">
                            <td colspan="3" class="text-center p-4 border-b border-[#e0e6ed] dark:border-[#1b2e4b]">
                                {{ filteredCategories.length === 0 ? 'Henüz kategori bulunmamaktadır.' : 'Aramanızla eşleşen kategori bulunamadı.' }}
                            </td>
                        </tr>
                        <tr v-for="category in paginatedCategories" :key="category.id" class="hover:bg-[#f6f7f8] dark:hover:bg-[#1a222e]">
                            <td class="p-3 border-b border-[#e0e6ed] dark:border-[#1b2e4b]">{{ category.name }}</td>
                            <td class="p-3 border-b border-[#e0e6ed] dark:border-[#1b2e4b]">{{ category.description }}</td>
                            <td class="p-3 border-b border-[#e0e6ed] dark:border-[#1b2e4b]">
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-outline-primary" @click="editCategory(category)">
                                        <icon-pencil class="w-4.5 h-4.5" />
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="showDeleteConfirmation(category.id)">
                                        <icon-trash-lines class="w-4.5 h-4.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Sayfalama -->
                <div v-if="!loading && totalPages > 1" class="flex justify-between items-center mt-5">
                    <div>
                        <span class="text-sm">Toplam {{ filteredCategories.length }} kategoriden {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredCategories.length) }} arası gösteriliyor</span>
                    </div>
                    <div class="flex gap-2">
                        <button 
                            class="btn btn-sm" 
                            :class="currentPage === 1 ? 'btn-gray' : 'btn-primary'"
                            :disabled="currentPage === 1" 
                            @click="currentPage--"
                        >
                            Önceki
                        </button>
                        <button 
                            class="btn btn-sm" 
                            :class="currentPage === totalPages ? 'btn-gray' : 'btn-primary'" 
                            :disabled="currentPage === totalPages"
                            @click="currentPage++"
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Kategori Ekleme/Düzenleme Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-md">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg">{{ isEditing ? 'Kategori Düzenle' : 'Yeni Kategori Ekle' }}</h5>
                    <button class="text-gray-400 hover:text-gray-800" @click="closeModal">
                        <icon-x class="w-5 h-5" />
                    </button>
                </div>

                <form @submit.prevent="handleSubmit">
                    <div class="mb-4">
                        <label for="categoryName">Kategori Adı <span class="text-red-500">*</span></label>
                        <input
                            id="categoryName"
                            type="text"
                            class="form-input"
                            v-model="formData.name"
                            required
                        />
                        <p v-if="formErrors.name" class="text-red-500 text-xs mt-1">{{ formErrors.name }}</p>
                    </div>

                    <div class="mb-4">
                        <label for="categoryDescription">Açıklama</label>
                        <textarea
                            id="categoryDescription"
                            class="form-textarea"
                            rows="3"
                            v-model="formData.description"
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-4">
                        <button type="button" class="btn btn-outline-danger" @click="closeModal">
                            İptal
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            {{ isEditing ? 'Güncelle' : 'Ekle' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Silme Onay Modalı -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-md p-6">
                <div class="flex flex-col items-center mb-5">
                    <div class="text-red-500 p-4">
                        <icon-info-triangle class="w-12 h-12" />
                    </div>
                    <h5 class="font-semibold text-lg mb-2">Kategori Silme</h5>
                    <p class="text-center">Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
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
import { ref, onMounted, computed, watch } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import IconX from '@/components/icon/icon-x.vue';
import IconPencil from '@/components/icon/icon-pencil.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconInfoTriangle from '@/components/icon/icon-info-triangle.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';

// Store'a erişim
const inventoryStore = useInventoryStore();

// Tip tanımları
interface Category {
    id: string;
    name: string;
    description: string;
}

interface FormErrors {
    name?: string;
}

interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    timeout?: number;
}

// Durum referansları
const loading = ref<boolean>(false);
const showModal = ref<boolean>(false);
const isEditing = ref<boolean>(false);
const categories = ref<Category[]>([]);
const formErrors = ref<FormErrors>({});
const searchTerm = ref<string>('');
const currentPage = ref<number>(1);
const itemsPerPage = ref<number>(5);
const showDeleteModal = ref<boolean>(false);
const categoryToDelete = ref<string | null>(null);
const notification = ref<Notification>({
    show: false,
    message: '',
    type: 'info'
});

// Form verisi
const formData = ref<Category>({
    id: '',
    name: '',
    description: ''
});

// Hesaplanmış özellikler
const filteredCategories = computed((): Category[] => {
    if (!searchTerm.value) return categories.value;
    
    const term = searchTerm.value.toLowerCase();
    return categories.value.filter(category => 
        category.name.toLowerCase().includes(term) || 
        (category.description && category.description.toLowerCase().includes(term))
    );
});

const totalPages = computed((): number => {
    return Math.ceil(filteredCategories.value.length / itemsPerPage.value);
});

const paginatedCategories = computed((): Category[] => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredCategories.value.slice(start, end);
});

// Sayfa değiştiğinde veya filtreleme yapıldığında sayfa numarasını kontrol et
watch([filteredCategories, itemsPerPage], () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
    }
    if (currentPage.value < 1 && totalPages.value > 0) {
        currentPage.value = 1;
    }
});

onMounted(() => {
    loadCategories();
});

// Bildirim gösterme fonksiyonu
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info'): void => {
    // Önceki bildirim zamanlayıcısını temizle
    if (notification.value.timeout) {
        clearTimeout(notification.value.timeout);
    }
    
    notification.value = {
        show: true,
        message,
        type,
        timeout: setTimeout(() => {
            closeNotification();
        }, 3000) as unknown as number
    };
};

const closeNotification = (): void => {
    notification.value.show = false;
};

const filterCategories = (): void => {
    currentPage.value = 1; // Filtreleme yapıldığında ilk sayfaya dön
};

const loadCategories = async (): Promise<void> => {
    loading.value = true;
    try {
        // inventory.js store'dan kategorileri al
        categories.value = inventoryStore.getCategories.map(category => ({
            ...category,
            description: category.description || ''
        }));
        showNotification('Kategoriler başarıyla yüklendi', 'success');
    } catch (error) {
        console.error('Kategoriler yüklenirken hata oluştu:', error);
        showNotification('Kategoriler yüklenirken hata oluştu', 'error');
    } finally {
        loading.value = false;
    }
};

const openAddModal = (): void => {
    isEditing.value = false;
    formData.value = {
        id: '',
        name: '',
        description: ''
    };
    formErrors.value = {};
    showModal.value = true;
};

const editCategory = (category: Category): void => {
    isEditing.value = true;
    formData.value = { ...category };
    formErrors.value = {};
    showModal.value = true;
};

const closeModal = (): void => {
    showModal.value = false;
    formData.value = {
        id: '',
        name: '',
        description: ''
    };
    formErrors.value = {};
};

const validateForm = (): boolean => {
    let isValid = true;
    formErrors.value = {};
    
    if (!formData.value.name.trim()) {
        formErrors.value.name = 'Kategori adı zorunludur';
        isValid = false;
    }
    
    return isValid;
};

const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;
    
    loading.value = true;
    try {
        if (isEditing.value) {
            // Kategori güncelleme
            inventoryStore.updateCategory(formData.value.id, {
                name: formData.value.name,
                description: formData.value.description
            });
            showNotification(`"${formData.value.name}" kategorisi güncellendi`, 'success');
        } else {
            // Yeni kategori ekleme
            inventoryStore.addCategory({
                name: formData.value.name,
                description: formData.value.description
            });
            showNotification(`"${formData.value.name}" kategorisi oluşturuldu`, 'success');
        }
        
        loadCategories(); // Kategorileri yeniden yükle
        closeModal();
    } catch (error) {
        console.error('Kategori kaydedilirken hata oluştu:', error);
        showNotification('Kategori kaydedilirken hata oluştu', 'error');
    } finally {
        loading.value = false;
    }
};

const showDeleteConfirmation = (id: string): void => {
    categoryToDelete.value = id;
    showDeleteModal.value = true;
};

const cancelDelete = (): void => {
    showDeleteModal.value = false;
    categoryToDelete.value = null;
};

const confirmDelete = async (): Promise<void> => {
    if (categoryToDelete.value === null) return;
    
    loading.value = true;
    try {
        const categoryName = inventoryStore.getCategories.find(category => category.id === categoryToDelete.value)?.name || 'Bilinmeyen Kategori';
        
        // Store'dan kategoriyi sil
        inventoryStore.deleteCategory(categoryToDelete.value);
        
        showNotification(`"${categoryName}" kategorisi silindi`, 'success');
        loadCategories(); // Kategorileri yeniden yükle
        showDeleteModal.value = false;
        categoryToDelete.value = null;
    } catch (error) {
        console.error('Kategori silinirken hata oluştu:', error);
        showNotification('Kategori silinirken hata oluştu', 'error');
    } finally {
        loading.value = false;
    }
};
</script>