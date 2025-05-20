<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Proje Yönetimi</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Depo Transferleri</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel mb-5">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Merkez Depo Transferleri</h5>
                    <div class="flex items-center gap-2">
                        <button type="button" class="btn btn-primary" @click="openNewTransferModal">
                            <icon-plus class="ltr:mr-2 rtl:ml-2" />
                            Yeni Transfer
                        </button>
                    </div>
                </div>

                <!-- Proje Seçme Bölümü -->
                <div class="mb-5">
                    <label for="projectId" class="form-label">Proje Seçin</label>
                    <select id="projectId" class="form-select" v-model="selectedProjectId" @change="loadTransfers">
                        <option value="">Proje Seçin</option>
                        <option v-for="project in availableProjects" :key="project.id" :value="project.id">
                            {{ project.name }}
                        </option>
                    </select>
                </div>

                <div class="mb-5 flex flex-wrap items-center">
                    <div class="flex items-center flex-1">
                        <div class="flex-1">
                            <input type="text" placeholder="Transfer Ara..." class="form-input" v-model="search" />
                        </div>
                    </div>
                    <div class="flex">
                        <select class="form-select" v-model="statusFilter">
                            <option value="">Tüm Durumlar</option>
                            <option value="draft">Taslak</option>
                            <option value="requested">Talep Edildi</option>
                            <option value="approved">Onaylandı</option>
                            <option value="shipped">Gönderildi</option>
                            <option value="delivered">Teslim Edildi</option>
                            <option value="rejected">Reddedildi</option>
                        </select>
                    </div>
                </div>

                <!-- Transfer Tablosu -->
                <div v-if="selectedProjectId" class="datatables">
                    <div v-if="loading" class="flex justify-center items-center p-10">
                        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                    <div v-else-if="filteredTransfers.length > 0" class="table-responsive">
                        <table class="table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Talep Eden</th>
                                    <th>Kaynak Depo</th>
                                    <th>Hedef Depo</th>
                                    <th>Talep Tarihi</th>
                                    <th>Durum</th>
                                    <th class="text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(transfer, index) in filteredTransfers" :key="transfer.id">
                                    <td>{{ index + 1 }}</td>
                                    <td>{{ transfer.requesterName }}</td>
                                    <td>{{ getWarehouseName(transfer.sourceWarehouseId) }}</td>
                                    <td>{{ getWarehouseName(transfer.targetWarehouseId) }}</td>
                                    <td>{{ formatDate(transfer.requestDate) }}</td>
                                    <td>
                                        <span :class="{
                                            'badge bg-secondary': transfer.status === 'draft',
                                            'badge bg-info': transfer.status === 'requested',
                                            'badge bg-success': transfer.status === 'approved',
                                            'badge bg-warning': transfer.status === 'shipped',
                                            'badge bg-primary': transfer.status === 'delivered',
                                            'badge bg-danger': transfer.status === 'rejected'
                                        }">
                                            {{ translateStatus(transfer.status) }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="flex items-center justify-center gap-2">
                                            <button 
                                                type="button" 
                                                class="btn btn-sm btn-outline-primary" 
                                                @click="viewTransferDetails(transfer)"
                                            >
                                                Detaylar
                                            </button>
                                            <button 
                                                v-if="transfer.status === 'draft'" 
                                                type="button" 
                                                class="btn btn-sm btn-outline-success" 
                                                @click="sendTransferRequest(transfer)"
                                            >
                                                Gönder
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="flex justify-center p-10">
                        <p v-if="statusFilter">Bu durumda transfer bulunmuyor.</p>
                        <p v-else>Henüz transfer bulunmuyor.</p>
                    </div>
                </div>
                <div v-else class="flex justify-center p-10">
                    <p>Lütfen bir proje seçin.</p>
                </div>
            </div>
        </div>

        <!-- Yeni Transfer Modal -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showTransferModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">Yeni Merkez Depo Transferi</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="showTransferModal = false">
                                <icon-x />
                            </button>
                        </div>
                        <div class="p-5 max-h-[80vh] overflow-y-auto">
                            <form @submit.prevent="createTransfer">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label for="sourceWarehouseId" class="form-label">Kaynak Depo <span class="text-danger">*</span></label>
                                        <select id="sourceWarehouseId" class="form-select" v-model="transferForm.sourceWarehouseId" required>
                                            <option value="">Kaynak Depo Seçin</option>
                                            <option v-for="warehouse in centralWarehouses" :key="warehouse.id" :value="warehouse.id">
                                                {{ warehouse.name }}
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label for="targetWarehouseId" class="form-label">Hedef Depo <span class="text-danger">*</span></label>
                                        <select id="targetWarehouseId" class="form-select" v-model="transferForm.targetWarehouseId" required>
                                            <option value="">Hedef Depo Seçin</option>
                                            <option v-for="warehouse in projectWarehouses" :key="warehouse.id" :value="warehouse.id">
                                                {{ warehouse.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <h6 class="font-semibold mb-3">Transfer Edilecek Ürünler</h6>
                                <div v-for="(item, index) in transferForm.productTransfers" :key="index" class="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label :for="`product_${index}`" class="form-label">Ürün <span class="text-danger">*</span></label>
                                            <select :id="`product_${index}`" class="form-select" v-model="item.productId" @change="updateProductName(item)" required>
                                                <option value="">Ürün Seçin</option>
                                                <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                                                    {{ product.name }}
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label :for="`quantity_${index}`" class="form-label">Miktar <span class="text-danger">*</span></label>
                                            <input :id="`quantity_${index}`" type="number" min="1" class="form-input" v-model.number="item.quantity" required />
                                        </div>
                                        <div class="flex items-end">
                                            <button v-if="index > 0" type="button" class="btn btn-danger w-full" @click="removeProduct(index)">
                                                Kaldır
                                            </button>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <label :for="`notes_${index}`" class="form-label">Notlar</label>
                                        <textarea :id="`notes_${index}`" class="form-textarea" v-model="item.notes" rows="2"></textarea>
                                    </div>
                                </div>
                                <div class="mb-5">
                                    <button type="button" class="btn btn-outline-primary" @click="addProductToTransfer">
                                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                        Ürün Ekle
                                    </button>
                                </div>

                                <div class="mb-5">
                                    <label for="transferNotes" class="form-label">Genel Notlar</label>
                                    <textarea id="transferNotes" class="form-textarea" v-model="transferForm.notes" rows="3" placeholder="Transfer hakkında genel notlar..."></textarea>
                                </div>

                                <div class="flex justify-end items-center">
                                    <button type="button" class="btn btn-outline-danger ltr:mr-2 rtl:ml-2" @click="showTransferModal = false">İptal</button>
                                    <button type="submit" class="btn btn-primary" :disabled="submitLoading">
                                        {{ submitLoading ? 'Kaydediliyor...' : 'Kaydet' }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>

        <!-- Transfer Detay Modal -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showDetailsModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">Transfer Detayı</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="closeDetailsModal">
                                <icon-x />
                            </button>
                        </div>
                        <div class="p-5 max-h-[80vh] overflow-y-auto">
                            <div v-if="selectedTransfer">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <p><strong>Talep Eden:</strong> {{ selectedTransfer.requesterName }}</p>
                                        <p><strong>Talep Tarihi:</strong> {{ formatDate(selectedTransfer.requestDate) }}</p>
                                        <p><strong>Kaynak Depo:</strong> {{ getWarehouseName(selectedTransfer.sourceWarehouseId) }}</p>
                                        <p><strong>Hedef Depo:</strong> {{ getWarehouseName(selectedTransfer.targetWarehouseId) }}</p>
                                    </div>
                                    <div>
                                        <p><strong>Durum:</strong> {{ translateStatus(selectedTransfer.status) }}</p>
                                        <p v-if="selectedTransfer.approverName"><strong>Onaylayan:</strong> {{ selectedTransfer.approverName }}</p>
                                        <p v-if="selectedTransfer.approverDate"><strong>Onay Tarihi:</strong> {{ formatDate(selectedTransfer.approverDate) }}</p>
                                        <p v-if="selectedTransfer.trackingNumber"><strong>Takip Numarası:</strong> {{ selectedTransfer.trackingNumber }}</p>
                                    </div>
                                </div>

                                <div class="mb-5" v-if="selectedTransfer.notes">
                                    <p><strong>Notlar:</strong> {{ selectedTransfer.notes }}</p>
                                </div>

                                <h6 class="font-semibold mb-3">Transfer Edilen Ürünler</h6>
                                <div class="table-responsive mb-5">
                                    <table class="table-striped">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Ürün</th>
                                                <th>Miktar</th>
                                                <th>Notlar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(item, index) in selectedTransfer.productTransfers" :key="index">
                                                <td>{{ index + 1 }}</td>
                                                <td>{{ item.productName }}</td>
                                                <td>{{ item.quantity }}</td>
                                                <td>{{ item.notes || '-' }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="mb-5" v-if="selectedTransfer.status === 'draft' || selectedTransfer.status === 'requested'">
                                    <div v-if="selectedTransfer.status === 'draft'" class="flex justify-end items-center">
                                        <button 
                                            type="button" 
                                            class="btn btn-success" 
                                            @click="sendTransferRequest(selectedTransfer)">
                                            Transfer Talebini Gönder
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-5" v-if="selectedTransfer.status === 'shipped'">
                                    <div class="flex justify-end items-center">
                                        <button 
                                            type="button" 
                                            class="btn btn-primary" 
                                            @click="confirmDelivery(selectedTransfer)">
                                            Teslimatı Onayla
                                        </button>
                                    </div>
                                </div>

                                <div class="flex justify-end">
                                    <button type="button" class="btn btn-outline-dark" @click="closeDetailsModal">Kapat</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/projects';
import { useInventoryStore } from '@/stores/inventory';
import { useMeta } from '@/composables/use-meta';
import { CentralWarehouseTransfer, ProductTransferItem } from '@/services/warehouse/centralWarehouseTransferService';
import centralWarehouseTransferService from '@/services/warehouse/centralWarehouseTransferService';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconX from '@/components/icon/icon-x.vue';

// Meta bilgilerini ayarla
useMeta({ title: 'Merkez Depo Transferleri' });

// Store'lar
const appStore = useAppStore();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const inventoryStore = useInventoryStore();

// Durum değişkenleri
const loading = ref(false);
const submitLoading = ref(false);
const search = ref('');
const statusFilter = ref('');
const selectedProjectId = ref('');
const transfers = ref<CentralWarehouseTransfer[]>([]);
const showTransferModal = ref(false);
const showDetailsModal = ref(false);
const selectedTransfer = ref<CentralWarehouseTransfer | null>(null);

// Proje admin'in erişim yetkisi olan projeleri
const availableProjects = computed(() => {
    // Admin tüm projelere erişebilir
    if (authStore.isAdmin) {
        return projectStore.projects;
    }

    // Proje admin sadece kendi projelerine erişebilir
    if (authStore.isProjectAdmin) {
        return projectStore.projects.filter(project => {
            const userInProject = project.users?.find(u => u.userId === authStore.userInfo?.id);
            return userInProject && (userInProject.role === 'proje_admin' || userInProject.role === 'admin');
        });
    }

    return [];
});

// Filtrelenmiş transferler
const filteredTransfers = computed(() => {
    if (!transfers.value) return [];
    
    let result = transfers.value;
    
    // Status filtresi
    if (statusFilter.value) {
        result = result.filter(transfer => transfer.status === statusFilter.value);
    }
    
    // Arama filtresi
    if (search.value.trim()) {
        const searchTerm = search.value.toLowerCase().trim();
        result = result.filter(transfer => {
            return (
                transfer.requesterName.toLowerCase().includes(searchTerm) ||
                getWarehouseName(transfer.sourceWarehouseId).toLowerCase().includes(searchTerm) ||
                getWarehouseName(transfer.targetWarehouseId).toLowerCase().includes(searchTerm) ||
                (transfer.notes && transfer.notes.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    return result;
});

// Merkez ve proje depoları
const centralWarehouses = computed(() => {
    // Eğer isCentralWarehouse özelliği yoksa, kod veya isimden ayırt edebilirsiniz
    // Örneğin, kodu 'MERKEZ' olanları merkez depo kabul edelim (örnek)
    return inventoryStore.getWarehouses.filter(w => (w.code === 'MERKEZ' || w.name.toLowerCase().includes('merkez')) && w.isActive);
});

const projectWarehouses = computed(() => {
    // Merkez depoları kodu 'MERKEZ' olanlar veya isminde 'merkez' geçenler olarak ayırıyoruz
    return inventoryStore.getWarehouses.filter(
        w => w.isActive && !(w.code === 'MERKEZ' || w.name.toLowerCase().includes('merkez'))
    );
});

// Tüm ürünler
const availableProducts = computed(() => {
    return inventoryStore.getProducts.filter(p => p.isActive);
});

// Yeni transfer formu
const transferForm = reactive({
    sourceWarehouseId: '',
    targetWarehouseId: '',
    projectId: '',
    notes: '',
    productTransfers: [
        {
            productId: '',
            productName: '',
            quantity: 1,
            notes: ''
        }
    ] as ProductTransferItem[]
});

// Transfer listesini yükle
const loadTransfers = async () => {
    if (!selectedProjectId.value) return;
    
    try {
        loading.value = true;
        transferForm.projectId = selectedProjectId.value; // Form için proje ID'sini ayarla
        transfers.value = await centralWarehouseTransferService.getProjectTransfers(selectedProjectId.value);
    } catch (error) {
        console.error('Transfer listesi yüklenirken hata:', error);
        appStore.showMessage('Transfer listesi yüklenirken hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Depo adını getir
const getWarehouseName = (warehouseId: string): string => {
    const warehouse = inventoryStore.getWarehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
};

// Ürün adını güncelle
const updateProductName = (item: ProductTransferItem) => {
    if (!item.productId) {
        item.productName = '';
        return;
    }
    
    const product = inventoryStore.getProducts.find(p => p.id === item.productId);
    if (product) {
        item.productName = product.name;
    }
};

// Yeni ürün ekle
const addProductToTransfer = () => {
    transferForm.productTransfers.push({
        productId: '',
        productName: '',
        quantity: 1,
        notes: ''
    });
};

// Ürün kaldır
const removeProduct = (index: number) => {
    transferForm.productTransfers.splice(index, 1);
};

// Yeni transfer modalını aç
const openNewTransferModal = () => {
    if (!selectedProjectId.value) {
        appStore.showMessage('Lütfen önce bir proje seçin.', 'warning');
        return;
    }
    
    // Form değerlerini sıfırla
    transferForm.sourceWarehouseId = '';
    transferForm.targetWarehouseId = '';
    transferForm.projectId = selectedProjectId.value;
    transferForm.notes = '';
    transferForm.productTransfers = [
        {
            productId: '',
            productName: '',
            quantity: 1,
            notes: ''
        }
    ];
    
    showTransferModal.value = true;
};

// Transfer oluştur
const createTransfer = async () => {
    // Form doğrulama
    if (!transferForm.sourceWarehouseId) {
        appStore.showMessage('Lütfen bir kaynak depo seçin.', 'warning');
        return;
    }
    
    if (!transferForm.targetWarehouseId) {
        appStore.showMessage('Lütfen bir hedef depo seçin.', 'warning');
        return;
    }
    
    if (transferForm.sourceWarehouseId === transferForm.targetWarehouseId) {
        appStore.showMessage('Kaynak ve hedef depo aynı olamaz.', 'warning');
        return;
    }
    
    // Ürün kontrolü
    let isValid = true;
    transferForm.productTransfers.forEach((item, index) => {
        if (!item.productId) {
            appStore.showMessage(`Lütfen ${index + 1}. sıradaki ürünü seçin.`, 'warning');
            isValid = false;
        }
        
        if (!item.quantity || item.quantity <= 0) {
            appStore.showMessage(`Lütfen ${index + 1}. sıradaki ürün için geçerli bir miktar girin.`, 'warning');
            isValid = false;
        }
    });
    
    if (!isValid) return;
    
    try {
        submitLoading.value = true;
        
        // Ürün adlarını güncelle
        transferForm.productTransfers.forEach(item => {
            if (item.productId && !item.productName) {
                const product = inventoryStore.getProducts.find(p => p.id === item.productId);
                if (product) {
                    item.productName = product.name;
                }
            }
        });
        
        // Transfer verilerini hazırla
        const transferData: CentralWarehouseTransfer = {
            sourceWarehouseId: transferForm.sourceWarehouseId,
            targetWarehouseId: transferForm.targetWarehouseId,
            projectId: transferForm.projectId,
            productTransfers: transferForm.productTransfers,
            status: 'draft',
            requesterId: authStore.userInfo?.id || '',
            requesterName: authStore.userInfo?.name || 'Anonim',
            requestDate: new Date().toISOString(),
            notes: transferForm.notes
        };
        
        // Transfer oluşturma metodu
        await authStore.createCentralWarehouseTransfer(transferData);
        
        appStore.showMessage('Transfer başarıyla oluşturuldu.', 'success');
        showTransferModal.value = false;
        
        // Transfer listesini yenile
        await loadTransfers();
    } catch (error) {
        console.error('Transfer oluşturulurken hata:', error);
        appStore.showMessage('Transfer oluşturulurken hata oluştu.', 'error');
    } finally {
        submitLoading.value = false;
    }
};

// Transfer detaylarını görüntüle
const viewTransferDetails = (transfer: CentralWarehouseTransfer) => {
    selectedTransfer.value = JSON.parse(JSON.stringify(transfer)); // Deep copy
    showDetailsModal.value = true;
};

// Detay modalını kapat
const closeDetailsModal = () => {
    showDetailsModal.value = false;
    selectedTransfer.value = null;
};

// Transfer talebini gönder
const sendTransferRequest = async (transfer: CentralWarehouseTransfer) => {
    if (!transfer.id) return;
    
    if (confirm('Transfer talebini göndermek istediğinize emin misiniz?')) {
        try {
            loading.value = true;
            await centralWarehouseTransferService.updateTransfer(
                transfer.id,
                { ...transfer, status: 'requested' },
                transfer.projectId
            );
            appStore.showMessage('Transfer talebi başarıyla gönderildi.', 'success');
            
            // Eğer detay modalı açıksa kapat
            if (showDetailsModal.value) {
                closeDetailsModal();
            }
            
            // Transfer listesini yenile
            await loadTransfers();
        } catch (error) {
            console.error('Transfer talebi gönderilirken hata:', error);
            appStore.showMessage('Transfer talebi gönderilirken hata oluştu.', 'error');
        } finally {
            loading.value = false;
        }
    }
};

// Teslimatı onayla
const confirmDelivery = async (transfer: CentralWarehouseTransfer) => {
    if (!transfer.id) return;
    
    if (confirm('Teslimatı onaylamak istediğinize emin misiniz?')) {
        try {
            loading.value = true;
            await centralWarehouseTransferService.updateTransfer(
                transfer.id,
                { ...transfer, status: 'delivered' },
                transfer.projectId
            );
            appStore.showMessage('Teslimat başarıyla onaylandı.', 'success');
            
            // Eğer detay modalı açıksa kapat
            if (showDetailsModal.value) {
                closeDetailsModal();
            }
            
            // Transfer listesini yenile
            await loadTransfers();
        } catch (error) {
            console.error('Teslimat onaylanırken hata:', error);
            appStore.showMessage('Teslimat onaylanırken hata oluştu.', 'error');
        } finally {
            loading.value = false;
        }
    }
};

// Tarih formatla
const formatDate = (dateString?: string): string => {
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

// Durum çeviri
const translateStatus = (status: string): string => {
    switch (status) {
        case 'draft': return 'Taslak';
        case 'requested': return 'Talep Edildi';
        case 'approved': return 'Onaylandı';
        case 'shipped': return 'Gönderildi';
        case 'delivered': return 'Teslim Edildi';
        case 'rejected': return 'Reddedildi';
        default: return status;
    }
};

// Yetki kontrolü
const checkPermissions = () => {
    if (!authStore.isAdmin && !authStore.isProjectAdmin) {
        appStore.showMessage('Bu sayfaya erişim yetkiniz bulunmuyor.', 'error');
        // Anasayfaya yönlendir (isteğe bağlı)
        // router.push('/');
    }
};

onMounted(async () => {
    checkPermissions();
    
    try {
        // Projeleri yükle (henüz yüklenmemişse)
        if (!projectStore.projects.length) {
            await projectStore.loadUserProjects();
        }
        
        // Depoları ve ürünleri yükle (henüz yüklenmemişse)
        if (!inventoryStore.getWarehouses.length || !inventoryStore.getProducts.length) {
            await inventoryStore.initializeStore();
        }
    } catch (error) {
        console.error('Sayfa yüklenirken hata:', error);
        appStore.showMessage('Sayfa yüklenirken bir hata oluştu.', 'error');
    }
});
</script>
