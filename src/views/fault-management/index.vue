<template>
    <div>
        <div class="pt-5">
            <!-- Üst bilgi ve istatistikler -->
            <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div class="panel p-4">
                    <div class="flex items-center">
                        <div class="w-14 h-14 flex items-center justify-center rounded-full bg-primary-light dark:bg-primary text-primary dark:text-white-light">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="ltr:ml-3 rtl:mr-3">
                            <p class="text-gray-600 dark:text-gray-400">Toplam Arızalı Ürün</p>
                            <h5 class="text-2xl font-bold ltr:mr-3 rtl:ml-3">{{ faultyProducts.length }}</h5>
                        </div>
                    </div>
                </div>
                <div class="panel p-4">
                    <div class="flex items-center">
                        <div class="w-14 h-14 flex items-center justify-center rounded-full bg-danger-light dark:bg-danger text-danger dark:text-white-light">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                            </svg>
                        </div>
                        <div class="ltr:ml-3 rtl:mr-3">
                            <p class="text-gray-600 dark:text-gray-400">Bekleyen Onarımlar</p>
                            <h5 class="text-2xl font-bold ltr:mr-3 rtl:ml-3">{{ pendingRepairs }}</h5>
                        </div>
                    </div>
                </div>
                <div class="panel p-4">
                    <div class="flex items-center">
                        <div class="w-14 h-14 flex items-center justify-center rounded-full bg-success-light dark:bg-success text-success dark:text-white-light">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                                <path d="m9 12 2 2 4-4"></path>
                            </svg>
                        </div>
                        <div class="ltr:ml-3 rtl:mr-3">
                            <p class="text-gray-600 dark:text-gray-400">Tamamlanan Onarımlar</p>
                            <h5 class="text-2xl font-bold ltr:mr-3 rtl:ml-3">{{ completedRepairs }}</h5>
                        </div>
                    </div>
                </div>
                <div class="panel p-4">
                    <div class="flex items-center">
                        <div class="w-14 h-14 flex items-center justify-center rounded-full bg-warning-light dark:bg-warning text-warning dark:text-white-light">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                            </svg>
                        </div>
                        <div class="ltr:ml-3 rtl:mr-3">
                            <p class="text-gray-600 dark:text-gray-400">Garanti Kapsamında</p>
                            <h5 class="text-2xl font-bold ltr:mr-3 rtl:ml-3">{{ warrantyCount }}</h5>
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel mb-5">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Arızalı Ürün Yönetimi</h5>
                    <button type="button" @click="showAddModal = true" class="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 ltr:mr-2 rtl:ml-2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Arızalı Ürün Ekle
                    </button>
                </div>

                <div class="mb-5">
                    <div class="flex flex-wrap items-center gap-3">
                        <button 
                            type="button" 
                            @click="selectedStatus = ''" 
                            class="btn" 
                            :class="selectedStatus === '' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            Tümü
                        </button>
                        <button 
                            type="button" 
                            @click="selectedStatus = 'Gönderildi'" 
                            class="btn" 
                            :class="selectedStatus === 'Gönderildi' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            Gönderildi
                        </button>
                        <button 
                            type="button" 
                            @click="selectedStatus = 'Serviste'" 
                            class="btn" 
                            :class="selectedStatus === 'Serviste' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            Serviste
                        </button>
                        <button 
                            type="button" 
                            @click="selectedStatus = 'Onarılıyor'" 
                            class="btn" 
                            :class="selectedStatus === 'Onarılıyor' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            Onarılıyor
                        </button>
                        <button 
                            type="button" 
                            @click="selectedStatus = 'Onarıldı'" 
                            class="btn" 
                            :class="selectedStatus === 'Onarıldı' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            Onarıldı
                        </button>
                        <button 
                            type="button" 
                            @click="selectedStatus = 'İade Edildi'" 
                            class="btn" 
                            :class="selectedStatus === 'İade Edildi' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            İade Edildi
                        </button>
                        <button 
                            type="button" 
                            @click="selectedStatus = 'İade Alındı'" 
                            class="btn" 
                            :class="selectedStatus === 'İade Alındı' ? 'btn-primary' : 'btn-outline-primary'"
                        >
                            İade Alındı
                        </button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table-striped">
                        <thead>
                            <tr>
                                <th>Seri No</th>
                                <th>Açıklama</th>
                                <th>Depo</th>
                                <th>Servis Merkezi</th>
                                <th>Gönderim Tarihi</th>
                                <th>Durum</th>
                                <th>Öncelik</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody v-if="filteredProducts.length">
                            <tr v-for="product in filteredProducts" :key="product.id">
                                <td>{{ product.serialNumber }}</td>
                                <td>{{ product.description }}</td>
                                <td>{{ getWarehouseName(product.senderWarehouseId) }}</td>
                                <td>{{ getServiceCenterName(product.serviceCenter) }}</td>
                                <td>{{ formatDate(product.sendDate) }}</td>
                                <td>
                                    <span :class="{
                                        'badge badge-outline-primary': product.status === 'Gönderildi',
                                        'badge badge-outline-warning': product.status === 'Serviste' || product.status === 'Onarılıyor',
                                        'badge badge-outline-success': product.status === 'Onarıldı' || product.status === 'İade Alındı',
                                        'badge badge-outline-info': product.status === 'İade Edildi',
                                    }">
                                        {{ product.status }}
                                    </span>
                                </td>
                                <td>
                                    <span :class="{
                                        'badge badge-outline-success': product.priority === 'Düşük',
                                        'badge badge-outline-warning': product.priority === 'Orta',
                                        'badge badge-outline-danger': product.priority === 'Yüksek',
                                    }">
                                        {{ product.priority }}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <button type="button" @click="openDetailModal(product)" class="btn btn-sm btn-outline-info">
                                            Detay
                                        </button>
                                        <button type="button" @click="openUpdateStatusModal(product)" class="btn btn-sm btn-outline-primary">
                                            Durum Güncelle
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else>
                            <tr>
                                <td colspan="8" class="text-center">{{ loading ? 'Yükleniyor...' : 'Kayıt bulunamadı' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Arızalı Ürün Ekleme Modal -->
        <teleport to="body">
            <div v-if="showAddModal" class="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center overflow-y-auto px-4">
                <div @click.stop class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl">
                    <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                        <h5 class="font-bold text-lg">Yeni Arızalı Ürün Kaydı</h5>
                        <button type="button" @click="showAddModal = false" class="text-white-dark hover:text-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="p-5">
                        <!-- Form alanları -->
                        <form class="space-y-5" @submit.prevent="submitForm">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="productId">Ürün</label>
                                    <select id="productId" v-model="formData.productId" class="form-select" required>
                                        <option value="" disabled>Ürün Seçin</option>
                                        <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                                            {{ product.name }} - {{ product.serialNumber }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label for="serialNumber">Seri Numarası</label>
                                    <input id="serialNumber" v-model="formData.serialNumber" type="text" class="form-input" required />
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="senderWarehouseId">Gönderen Depo</label>
                                    <select id="senderWarehouseId" v-model="formData.senderWarehouseId" class="form-select" required>
                                        <option value="" disabled>Depo Seçin</option>
                                        <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                                            {{ warehouse.name }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label for="serviceCenter">Servis Merkezi</label>
                                    <select id="serviceCenter" v-model="formData.serviceCenter" class="form-select" required>
                                        <option value="" disabled>Servis Merkezi Seçin</option>
                                        <option v-for="center in serviceCenters" :key="center.id" :value="center.id">
                                            {{ center.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label for="projectId">Proje</label>
                                    <select id="projectId" v-model="formData.projectId" class="form-select" required>
                                        <option value="" disabled>Proje Seçin</option>
                                        <option v-for="project in projects" :key="project.id" :value="project.id">
                                            {{ project.name }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label for="priority">Öncelik</label>
                                    <select id="priority" v-model="formData.priority" class="form-select" required>
                                        <option value="" disabled>Öncelik Seçin</option>
                                        <option value="Düşük">Düşük</option>
                                        <option value="Orta">Orta</option>
                                        <option value="Yüksek">Yüksek</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="faultType">Arıza Tipi</label>
                                    <select id="faultType" v-model="formData.faultType" class="form-select" required>
                                        <option value="" disabled>Arıza Tipi Seçin</option>
                                        <option value="Donanımsal">Donanımsal</option>
                                        <option value="Yazılımsal">Yazılımsal</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="warrantyStatus">Garanti Durumu</label>
                                    <select id="warrantyStatus" v-model="formData.warrantyStatus" class="form-select">
                                        <option :value="true">Garanti Kapsamında</option>
                                        <option :value="false">Garanti Kapsamı Dışında</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="estimatedRepairTime">Tahmini Onarım Süresi (Gün)</label>
                                    <input id="estimatedRepairTime" v-model="formData.estimatedRepairTime" type="number" min="1" class="form-input" required />
                                </div>
                            </div>
                            
                            <div>
                                <label for="description">Arıza Açıklaması</label>
                                <textarea id="description" v-model="formData.description" class="form-textarea" rows="3" required></textarea>
                            </div>
                            
                            <div>
                                <label for="trackingNumber">Kargo Takip Numarası</label>
                                <input id="trackingNumber" v-model="formData.trackingNumber" type="text" class="form-input" />
                            </div>
                            
                            <div class="flex justify-end items-center mt-8">
                                <button type="button" @click="showAddModal = false" class="btn btn-outline-danger ltr:mr-2 rtl:ml-2">
                                    İptal
                                </button>
                                <button type="submit" class="btn btn-primary" :disabled="loading">
                                    {{ loading ? 'Kaydediliyor...' : 'Kaydet' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </teleport>
        
        <!-- Ürün Detay Modal -->
        <teleport to="body">
            <div v-if="showDetailModal" class="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center overflow-y-auto px-4">
                <div @click.stop class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl">
                    <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                        <h5 class="font-bold text-lg">Arızalı Ürün Detayı</h5>
                        <button type="button" @click="showDetailModal = false" class="text-white-dark hover:text-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="p-5" v-if="selectedProduct">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seri Numarası</label>
                                <div class="text-base">{{ selectedProduct.serialNumber }}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                                <div>
                                    <span :class="{
                                        'badge badge-outline-primary': selectedProduct.status === 'Gönderildi',
                                        'badge badge-outline-warning': selectedProduct.status === 'Serviste' || selectedProduct.status === 'Onarılıyor',
                                        'badge badge-outline-success': selectedProduct.status === 'Onarıldı' || selectedProduct.status === 'İade Alındı',
                                        'badge badge-outline-info': selectedProduct.status === 'İade Edildi',
                                    }">
                                        {{ selectedProduct.status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gönderen Depo</label>
                                <div class="text-base">{{ getWarehouseName(selectedProduct.senderWarehouseId) }}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servis Merkezi</label>
                                <div class="text-base">{{ getServiceCenterName(selectedProduct.serviceCenter) }}</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proje</label>
                                <div class="text-base">{{ getProjectName(selectedProduct.projectId) }}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öncelik</label>
                                <div>
                                    <span :class="{
                                        'badge badge-outline-success': selectedProduct.priority === 'Düşük',
                                        'badge badge-outline-warning': selectedProduct.priority === 'Orta',
                                        'badge badge-outline-danger': selectedProduct.priority === 'Yüksek',
                                    }">
                                        {{ selectedProduct.priority }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gönderim Tarihi</label>
                                <div class="text-base">{{ formatDate(selectedProduct.sendDate) }}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Garanti Durumu</label>
                                <div class="text-base">
                                    {{ selectedProduct.warrantyStatus ? 'Garanti Kapsamında' : 'Garanti Kapsamı Dışında' }}
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arıza Açıklaması</label>
                            <div class="text-base">{{ selectedProduct.description }}</div>
                        </div>

                        <div class="mb-4" v-if="selectedProduct.repairNotes">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Onarım Notları</label>
                            <div class="text-base">{{ selectedProduct.repairNotes }}</div>
                        </div>
                        
                        <div class="mb-4" v-if="selectedProduct.returnNotes">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İade Notları</label>
                            <div class="text-base">{{ selectedProduct.returnNotes }}</div>
                        </div>
                        
                        <div class="mb-4" v-if="selectedProduct.trackingNumber">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kargo Takip Numarası</label>
                            <div class="text-base">{{ selectedProduct.trackingNumber }}</div>
                        </div>
                        
                        <div class="flex justify-end">
                            <button type="button" @click="showDetailModal = false" class="btn btn-primary">
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>
        
        <!-- Durum Güncelleme Modal -->
        <teleport to="body">
            <div v-if="showUpdateStatusModal" class="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center overflow-y-auto px-4">
                <div @click.stop class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg">
                    <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                        <h5 class="font-bold text-lg">Durum Güncelle</h5>
                        <button type="button" @click="showUpdateStatusModal = false" class="text-white-dark hover:text-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="p-5" v-if="selectedProduct">
                        <form @submit.prevent="updateProductStatus">
                            <div class="mb-5">
                                <label for="newStatus">Yeni Durum</label>
                                <select id="newStatus" v-model="statusForm.newStatus" class="form-select" required>
                                    <option value="" disabled>Durum Seçin</option>
                                    <option 
                                        v-for="status in availableStatusOptions" 
                                        :key="status" 
                                        :value="status"
                                    >
                                        {{ status }}
                                    </option>
                                </select>
                            </div>
                            
                            <div class="mb-5">
                                <label for="statusNotes">Notlar</label>
                                <textarea id="statusNotes" v-model="statusForm.notes" class="form-textarea" rows="3"></textarea>
                            </div>
                            
                            <div class="flex justify-end items-center mt-8">
                                <button type="button" @click="showUpdateStatusModal = false" class="btn btn-outline-danger ltr:mr-2 rtl:ml-2">
                                    İptal
                                </button>
                                <button type="submit" class="btn btn-primary" :disabled="loading">
                                    {{ loading ? 'Güncelleniyor...' : 'Güncelle' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useArizaStore } from '@/stores/ariza-store';
import { useToast } from 'vue-toastification';
import { useInventoryStore } from '@/stores/inventory';
import { useProjectStore } from '@/stores/project-store';

const arizaStore = useArizaStore();
const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();
const toast = useToast();

// Veri durumu
const loading = ref(false);
const error = ref(null);
const selectedStatus = ref('');
const showAddModal = ref(false);
const showDetailModal = ref(false);
const showUpdateStatusModal = ref(false);
const selectedProduct = ref(null);

// Form verileri
const formData = ref({
    productId: '',
    serialNumber: '',
    description: '',
    senderWarehouseId: '',
    serviceCenter: '',
    projectId: '',
    sendDate: new Date(),
    estimatedRepairTime: 3,
    priority: 'Orta',
    warrantyStatus: true,
    faultType: 'Donanımsal',
    trackingNumber: '',
});

// Durum güncelleme formu
const statusForm = ref({
    newStatus: '',
    notes: ''
});

// Veri getirme
const fetchData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        await arizaStore.initializeStore();
        await inventoryStore.initializeStore();
        await projectStore.fetchProjects();
    } catch (err) {
        console.error('Error fetching data:', err);
        error.value = 'Veri yüklenirken bir hata oluştu';
        toast.error('Veri yüklenirken bir hata oluştu');
    } finally {
        loading.value = false;
    }
};

// Hesaplanan değerler
const faultyProducts = computed(() => arizaStore.getFaultyProducts);
const serviceCenters = computed(() => arizaStore.getServiceCenters);
const availableProducts = computed(() => inventoryStore.getProducts);
const warehouses = computed(() => inventoryStore.getWarehouses);
const projects = computed(() => projectStore.projects);

// Duruma göre filtrelenmiş ürünler
const filteredProducts = computed(() => {
    if (!selectedStatus.value) {
        return faultyProducts.value;
    }
    return faultyProducts.value.filter(p => p.status === selectedStatus.value);
});

// İstatistikler
const pendingRepairs = computed(() => 
    faultyProducts.value.filter(p => ['Gönderildi', 'Serviste', 'Onarılıyor'].includes(p.status)).length
);
const completedRepairs = computed(() => 
    faultyProducts.value.filter(p => ['Onarıldı', 'İade Edildi', 'İade Alındı'].includes(p.status)).length
);
const warrantyCount = computed(() => 
    faultyProducts.value.filter(p => p.warrantyStatus).length
);

// Durum seçeneklerini hesaplama
const availableStatusOptions = computed(() => {
    if (!selectedProduct.value) return [];
    
    const currentStatus = selectedProduct.value.status;
    
    // Durum geçiş kuralları
    const statusTransitions = {
        'Gönderildi': ['Serviste'],
        'Serviste': ['Onarılıyor', 'Onarıldı'],
        'Onarılıyor': ['Onarıldı'],
        'Onarıldı': ['İade Edildi'],
        'İade Edildi': ['İade Alındı'],
        'İade Alındı': []
    };
    
    return statusTransitions[currentStatus] || [];
});

// Helper fonksiyonlar
const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'object' && date.toDate) {
        date = date.toDate();
    }
    return new Date(date).toLocaleDateString('tr-TR');
};

const getWarehouseName = (id) => {
    const warehouse = warehouses.value.find(w => w.id === id);
    return warehouse ? warehouse.name : id;
};

const getServiceCenterName = (id) => {
    const center = serviceCenters.value.find(c => c.id === id);
    return center ? center.name : id;
};

const getProjectName = (id) => {
    const project = projects.value.find(p => p.id === id);
    return project ? project.name : id;
};

// Form gönderimi
const submitForm = async () => {
    loading.value = true;
    
    try {
        const result = await arizaStore.addFaultyProduct({
            ...formData.value,
            sendDate: new Date()
        });
        
        if (result) {
            toast.success('Arızalı ürün kaydı başarıyla oluşturuldu');
            showAddModal.value = false;
            // Formu sıfırla
            formData.value = {
                productId: '',
                serialNumber: '',
                description: '',
                senderWarehouseId: '',
                serviceCenter: '',
                projectId: '',
                sendDate: new Date(),
                estimatedRepairTime: 3,
                priority: 'Orta',
                warrantyStatus: true,
                faultType: 'Donanımsal',
                trackingNumber: '',
            };
        }
    } catch (err) {
        console.error('Error adding faulty product:', err);
        toast.error('Arızalı ürün kaydı oluşturulurken bir hata oluştu');
    } finally {
        loading.value = false;
    }
};

// Detay modalını açma
const openDetailModal = (product) => {
    selectedProduct.value = product;
    showDetailModal.value = true;
};

// Durum güncelleme modalını açma
const openUpdateStatusModal = (product) => {
    selectedProduct.value = product;
    statusForm.value.newStatus = '';
    statusForm.value.notes = '';
    showUpdateStatusModal.value = true;
};

// Ürün durumunu güncelleme
const updateProductStatus = async () => {
    if (!selectedProduct.value || !statusForm.value.newStatus) return;
    
    loading.value = true;
    
    try {
        const result = await arizaStore.updateStatus(
            selectedProduct.value.id,
            statusForm.value.newStatus,
            statusForm.value.notes
        );
        
        if (result) {
            toast.success('Durum başarıyla güncellendi');
            showUpdateStatusModal.value = false;
        }
    } catch (err) {
        console.error('Error updating status:', err);
        toast.error('Durum güncellenirken bir hata oluştu');
    } finally {
        loading.value = false;
    }
};

// Sayfa yüklendiğinde verileri getir
onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.table-striped tbody tr:nth-child(odd) {
    @apply bg-white-light/20 dark:bg-[#0e1726] ;
}

.table-striped tbody tr {
    @apply hover:bg-white-light/30 dark:hover:bg-[#131d35] transition duration-300;
}

.table-striped tbody tr td,
.table-striped thead tr th {
    @apply px-4 py-3.5 text-sm;
}
</style>
