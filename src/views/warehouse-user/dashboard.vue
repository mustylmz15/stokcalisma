<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Depo Yönetimi</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Anasayfa</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Proje Seçimi -->
            <div class="panel mb-5">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Proje Seçin</h5>
                </div>
                <div class="mb-5">
                    <select id="projectId" class="form-select" v-model="selectedProjectId" @change="loadProjectWarehouses">
                        <option value="">Proje Seçin</option>
                        <option v-for="project in userProjects" :key="project.id" :value="project.id">
                            {{ project.name }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Depo Özeti Kartları -->
            <div v-if="selectedProjectId" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <div class="panel h-full">
                    <div class="flex justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Toplam Depo</h5>
                        <div class="dropdown">
                            <IconMenu />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="text-3xl font-bold ltr:mr-3 rtl:ml-3">{{ projectWarehouses.length }}</div>
                    </div>
                    <div class="flex items-center font-semibold mt-5">
                        <IconStore class="ltr:mr-2 rtl:ml-2" />
                        <span>Projeye ait depolar</span>
                    </div>
                </div>

                <div class="panel h-full">
                    <div class="flex justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Toplam Ürün</h5>
                        <div class="dropdown">
                            <IconMenu />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="text-3xl font-bold ltr:mr-3 rtl:ml-3">{{ totalProductCount }}</div>
                    </div>
                    <div class="flex items-center font-semibold mt-5">
                        <IconBox class="ltr:mr-2 rtl:ml-2" />
                        <span>Depolardaki toplam ürün sayısı</span>
                    </div>
                </div>

                <div class="panel h-full">
                    <div class="flex justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Arızalı Ürünler</h5>
                        <div class="dropdown">
                            <IconMenu />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="text-3xl font-bold ltr:mr-3 rtl:ml-3">{{ faultyProductCount }}</div>
                    </div>
                    <div class="flex items-center font-semibold mt-5">
                        <IconAlertTriangle class="ltr:mr-2 rtl:ml-2" />
                        <span>Arızalı ürün sayısı</span>
                    </div>
                </div>

                <div class="panel h-full">
                    <div class="flex justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Bekleyen Talepler</h5>
                        <div class="dropdown">
                            <IconMenu />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="text-3xl font-bold ltr:mr-3 rtl:ml-3">{{ pendingRequestsCount }}</div>
                    </div>
                    <div class="flex items-center font-semibold mt-5">
                        <IconInbox class="ltr:mr-2 rtl:ml-2" />
                        <span>Bekleyen malzeme talepleri</span>
                    </div>
                </div>
            </div>

            <!-- Depolar Listesi -->
            <div v-if="selectedProjectId" class="panel mb-5">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Proje Depoları</h5>
                    <div class="flex items-center">
                        <input type="text" placeholder="Depo Ara..." class="form-input w-auto" v-model="searchWarehouse" />
                    </div>
                </div>

                <div v-if="loading" class="flex justify-center items-center p-10">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
                <div v-else-if="filteredWarehouses.length > 0" class="table-responsive">
                    <table class="table-striped">
                        <thead>
                            <tr>
                                <th>Depo Adı</th>
                                <th>Ürün Sayısı</th>
                                <th>Son Güncelleme</th>
                                <th class="text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="warehouse in filteredWarehouses" :key="warehouse.id">
                                <td>{{ warehouse.name }}</td>
                                <td>{{ getWarehouseProductCount(warehouse.id) }}</td>
                                <td>{{ formatDate(warehouse.updatedAt || warehouse.createdAt) }}</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <router-link :to="`/warehouse-user/products/${warehouse.id}`" class="btn btn-sm btn-outline-primary">Ürünleri Görüntüle</router-link>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="flex justify-center p-10">
                    <p>Bu projeye ait depo bulunmamaktadır.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory';
import { useProjectStore } from '@/stores/projects';
import IconMenu from '@/components/icon/icon-menu.vue';
import IconStore from '@/components/icon/icon-store.vue';
import IconBox from '@/components/icon/icon-box.vue';
import IconAlertTriangle from '@/components/icon/icon-alert-triangle.vue';
import IconInbox from '@/components/icon/icon-inbox.vue';

// Store'lar
const appStore = useAppStore();
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();

// Meta veri
document.title = 'Depo Kullanıcısı - UGES STOK';

// Durum değişkenleri
const loading = ref(false);
const selectedProjectId = ref('');
const searchWarehouse = ref('');
const projectWarehouses = ref<any[]>([]);
const warehouseStocks = ref<any[]>([]);
const faultyProductCount = ref(0);
const pendingRequestsCount = ref(0);

// Kullanıcının erişimi olan projeleri getir
const userProjects = computed(() => {
    return projectStore.projects.filter(project => {
        // Depo kullanıcısı (kullanıcının projeyle ilişkisine bakılarak belirlenir)
        const userInProject = project.users?.find(u => u.userId === authStore.userInfo?.id);
        return userInProject && (
            userInProject.role === 'depo_sorumlusu' || 
            userInProject.role === 'proje_admin' || 
            userInProject.role === 'admin'
        );
    });
});

// Filtrelenmiş depolar
const filteredWarehouses = computed(() => {
    if (!searchWarehouse.value) return projectWarehouses.value;
    
    return projectWarehouses.value.filter(warehouse => 
        warehouse.name.toLowerCase().includes(searchWarehouse.value.toLowerCase())
    );
});

// Toplam ürün sayısı
const totalProductCount = computed(() => {
    return warehouseStocks.value.reduce((total, stock) => total + stock.quantity, 0);
});

// Seçili projenin depolarını yükle
async function loadProjectWarehouses() {
    if (!selectedProjectId.value) {
        projectWarehouses.value = [];
        warehouseStocks.value = [];
        return;
    }
    
    loading.value = true;
    
    try {
        // Önce projeye ait depoları al
        const projectService = (await import('@/services/projects/projectService')).default;
        const warehouses = await projectService.getWarehousesByProjectId(selectedProjectId.value);
        projectWarehouses.value = warehouses;
        
        // Sonra bu depolardaki stokları al
        const inventoryService = (await import('@/services/inventory/inventoryService')).default;
        const stocks = await inventoryService.getStocksByProject(selectedProjectId.value);
        warehouseStocks.value = stocks;        // Arızalı ürün sayısını al
        const faultyService = (await import('@/services/repair/faultyProductService')).default;
        // getFaultyProductsByProject yerine mevcut olan metodu kullanacağız
        const faultyProducts = await faultyService.getLatestFaultyProducts(100); // Tüm kayıtları getir ve sonra filtreleme yap
        // Projeye ait olanları filtrele
        const projectFaultyProducts = faultyProducts.filter(fp => fp.projectId === selectedProjectId.value);
        faultyProductCount.value = projectFaultyProducts.length;
        
        // Bekleyen talepleri al
        const materialRequestService = (await import('@/services/materials/materialRequestService')).default;
        // MaterialRequestService'de projeye ait talepleri getiren fonksiyon var
        const projectRequests = await materialRequestService.getProjectRequests(selectedProjectId.value);
        // Status değeri draft, requested veya processing olanları filtrele
        const pendingRequests = projectRequests.filter(
            req => req.status === 'draft' || req.status === 'requested' || req.status === 'processing'
        );
        pendingRequestsCount.value = pendingRequests.length;
        
    } catch (error) {
        console.error('Depo bilgileri yüklenirken hata:', error);
        appStore.showMessage('Depo bilgileri yüklenirken bir hata oluştu.', 'error');
    } finally {
        loading.value = false;
    }
}

// Belirli bir depodaki ürün sayısını hesapla
function getWarehouseProductCount(warehouseId: string): number {
    return warehouseStocks.value
        .filter(stock => stock.warehouseId === warehouseId)
        .reduce((total, stock) => total + stock.quantity, 0);
}

// Tarih formatla
function formatDate(dateString?: string): string {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

// Sayfa yüklendiğinde
onMounted(async () => {
    // Yetki kontrolü
    if (!authStore.isAdmin && !authStore.isProjectAdmin && !authStore.isWarehouseManager) {
        appStore.showMessage('Bu sayfaya erişim yetkiniz bulunmuyor.', 'error');
        return;
    }
    
    // Store'ları başlat
    if (!inventoryStore.isInitialized) {
        await inventoryStore.initializeStore();
    }
    
    if (!projectStore.projects.length) {
        await projectStore.loadUserProjects();
    }
    
    // Kullanıcı sadece bir projeye erişebiliyorsa otomatik seç
    if (userProjects.value.length === 1) {
        selectedProjectId.value = userProjects.value[0].id;
        await loadProjectWarehouses();
    }
});
</script>
