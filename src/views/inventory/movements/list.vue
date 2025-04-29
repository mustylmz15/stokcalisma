<template>
    <div>
        <div class="panel">
            <div class="flex flex-col md:flex-row items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Stok Hareketleri</h5>
                
                <div v-if="!authStore.isObserver" class="mt-2 md:mt-0">
                    <button type="button" class="btn btn-primary" @click="openAddModal">
                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        Yeni Hareket
                    </button>
                </div>
                <div v-else class="mt-2 md:mt-0 text-sm text-gray-500 italic">
                    (Stok hareketi ekleme yetkisi yok)
                </div>
            </div>

            <!-- Filtreler -->
            <div class="mb-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                    <label>Hareket Tipi</label>                    <select v-model="filtreler.type" class="form-select">
                        <option value="">Tümü</option>
                        <option value="in">Giriş</option>
                        <option value="out">Çıkış</option>
                        <option value="transfer">Transfer</option>
                        <option value="stock_add">Stok Ekleme</option>
                    </select>
                </div>
                <div>
                    <label>Başlangıç Tarihi</label>
                    <input type="date" v-model="filtreler.startDate" class="form-input" />
                </div>
                <div>
                    <label>Bitiş Tarihi</label>
                    <input type="date" v-model="filtreler.endDate" class="form-input" />
                </div>
                <div>
                    <label>Depo</label>
                    <select v-model="filtreler.warehouseId" class="form-select">
                        <option value="">Tümü</option>
                        <option v-for="depo in depolar" :key="depo.id" :value="depo.id">
                            {{ depo.name }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Add this after the filters section and before the table -->
            <div v-if="hata" class="bg-red-100 border border-red-200 text-red-600 px-4 py-3 rounded mb-5">
                <div class="flex items-center">
                    <span class="mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </span>
                    {{ hata }}
                </div>
            </div>

            <!-- Hareket Listesi -->
            <div class="table-responsive">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center">
                        <span v-if="yukleniyor" class="text-gray-500 ml-2">Yükleniyor...</span>
                        <span v-else class="text-gray-500 ml-2">Toplam {{ toplamKayit }} kayıt</span>
                    </div>
                </div>
                <table class="table-striped">                    <thead>
                        <tr>
                            <th>Hareket No</th>
                            <th>Tarih</th>
                            <th>Proje</th>
                            <th>Ürün</th>
                            <th>Miktar</th>
                            <th>Kaynak Depo</th>
                            <th>Hedef Depo</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>                        <tr v-if="yukleniyor">
                            <td colspan="8" class="text-center">
                                <div class="flex justify-center items-center p-4">
                                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-l-transparent"></div>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="hareketler.length === 0">
                            <td colspan="8" class="text-center">Henüz stok hareketi bulunmamaktadır.</td>
                        </tr>
                        <tr v-for="hareket in paginatedMovements" :key="hareket.id">                            <td>{{ hareket.movementNumber }}</td>
                            <td>{{ formatTarih(hareket.date) }}</td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    <span :class="{
                                        'badge badge-outline-info': hareket.sourceProjectId && hareket.sourceProjectId !== 'ApMkLHJ3Rk7BpmYuNm5Z',
                                        'badge badge-outline-success': hareket.sourceProjectId === 'ApMkLHJ3Rk7BpmYuNm5Z'
                                    }">
                                        {{ hareket.sourceProjectId === 'ApMkLHJ3Rk7BpmYuNm5Z' ? 'KGYS' : getProjectName(hareket.sourceProjectId) }}
                                        <span v-if="hareket.type === 'transfer' && hareket.targetProjectId && hareket.targetProjectId !== hareket.sourceProjectId">
                                            → {{ hareket.targetProjectId === 'ApMkLHJ3Rk7BpmYuNm5Z' ? 'KGYS' : getProjectName(hareket.targetProjectId) }}
                                        </span>
                                    </span>
                                    <span class="badge" :class="{
                                        'badge-success': hareket.type === 'in',
                                        'badge-danger': hareket.type === 'out',
                                        'badge-info': hareket.type === 'transfer',
                                        'badge-warning': hareket.type === 'stock_add'
                                    }">
                                        {{ getHareketTipi(hareket.type) }}
                                    </span>
                                </div>
                            </td>
                            <td>{{ hareket.product?.code }} - {{ hareket.product?.name }}</td>
                            <td>{{ hareket.quantity }} {{ hareket.product?.unit }}</td>
                            <td>{{ hareket.sourceWarehouse.name }}</td>
                            <td>{{ hareket.targetWarehouse?.name || '-' }}</td>
                            <td>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-outline-info" @click="viewDetails(hareket)">
                                        <icon-eye class="w-4.5 h-4.5" />
                                    </button>
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

        <!-- Hareket Ekleme Modal -->
        <div v-if="modalGoster" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-lg">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg">Yeni Stok Hareketi</h5>
                    <button class="text-gray-400 hover:text-gray-800" @click="closeModal">
                        <icon-x class="w-5 h-5" />
                    </button>
                </div>

                <form @submit.prevent="handleSubmit">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">                        <div class="mb-4">
                            <label>Proje <span class="text-red-500">*</span></label>
                            <select class="form-select" v-model="formVerisi.sourceProjectId" required :class="{'border-red-500': formHatalari.sourceProjectId}">
                                <option value="">Proje Seçin</option>
                                <option v-for="proje in projeler" :key="proje.id" :value="proje.id">
                                    {{ proje.name }}
                                </option>
                            </select>
                            <p v-if="formHatalari.sourceProjectId" class="text-red-500 text-xs mt-1">{{ formHatalari.sourceProjectId }}</p>
                        </div>
                        
                        <div class="mb-4">
                            <label>Hareket Türü <span class="text-red-500">*</span></label>
                            <select class="form-select" v-model="formVerisi.type" required :class="{'border-red-500': formHatalari.type}" @change="hareketTuruDegisti">
                                <option value="in">Stok Girişi</option>
                                <option value="out">Stok Çıkışı</option>
                                <option value="transfer">Transfer</option>
                                <option value="stock_add">Stok Ekleme</option>
                            </select>
                            <p v-if="formHatalari.type" class="text-red-500 text-xs mt-1">{{ formHatalari.type }}</p>
                        </div>

                        <div class="mb-4">
                            <label>Tarih <span class="text-red-500">*</span></label>
                            <input type="datetime-local" class="form-input" v-model="formVerisi.date" required
                                  :class="{'border-red-500': formHatalari.date}" />
                            <p v-if="formHatalari.date" class="text-red-500 text-xs mt-1">{{ formHatalari.date }}</p>
                        </div>

                        <div class="mb-4">
                            <label>Ürün <span class="text-red-500">*</span></label>
                            <select class="form-select" v-model="formVerisi.productId" required
                                   :class="{'border-red-500': formHatalari.productId}">
                                <option value="">Ürün Seçiniz</option>
                                <option v-for="urun in urunler" :key="urun.id" :value="urun.id">
                                    {{ urun.code }} - {{ urun.name }}
                                </option>
                            </select>
                            <p v-if="formHatalari.productId" class="text-red-500 text-xs mt-1">{{ formHatalari.productId }}</p>
                        </div>

                        <div class="mb-4">
                            <label>Miktar <span class="text-red-500">*</span></label>
                            <input type="number" class="form-input" v-model="formVerisi.quantity" min="0.01" step="0.01" required
                                  :class="{'border-red-500': formHatalari.quantity}" />
                            <p v-if="formHatalari.quantity" class="text-red-500 text-xs mt-1">{{ formHatalari.quantity }}</p>
                        </div>                        <div class="mb-4">
                            <label>{{ formVerisi.type === 'out' || formVerisi.type === 'transfer' || formVerisi.type === 'stock_add' ? 'Kaynak Depo' : 'Depo' }} <span class="text-red-500">*</span></label>
                            <select class="form-select" v-model="formVerisi.sourceWarehouseId" required
                                   :class="{'border-red-500': formHatalari.sourceWarehouseId}"
                                   :disabled="formVerisi.type === 'stock_add'">
                                <option value="">Depo Seçiniz</option>
                                <option v-for="depo in availableSourceWarehouses" :key="depo.id" :value="depo.id">
                                    {{ depo.code }} - {{ depo.name }}
                                </option>
                            </select>                            <p v-if="formHatalari.sourceWarehouseId" class="text-red-500 text-xs mt-1">{{ formHatalari.sourceWarehouseId }}</p>
                            <p v-if="formVerisi.type === 'stock_add'" class="text-xs text-gray-500 mt-1">Stok ekleme işleminde kaynak depo sabit olarak kullanılır</p>
                            <p v-if="formVerisi.type === 'stock_add'" class="font-semibold text-primary mt-1">(Test Depo)</p>
                        </div>                        <div class="mb-4" v-if="formVerisi.type === 'transfer' || formVerisi.type === 'stock_add'">
                            <label>Hedef Depo <span class="text-red-500">*</span></label>
                            <select class="form-select" v-model="formVerisi.targetWarehouseId" required
                                   :class="{'border-red-500': formHatalari.targetWarehouseId}">
                                <option value="">Depo Seçiniz</option>
                                <option v-for="depo in depolar" :key="depo.id" :value="depo.id"
                                        :disabled="depo.id === formVerisi.sourceWarehouseId">
                                    {{ depo.code }} - {{ depo.name }}
                                </option>
                            </select>
                            <p v-if="formHatalari.targetWarehouseId" class="text-red-500 text-xs mt-1">{{ formHatalari.targetWarehouseId }}</p>
                        </div>
                        
                        <div class="mb-4" v-if="formVerisi.type === 'transfer'">
                            <label>Hedef Proje</label>
                            <select class="form-select" v-model="formVerisi.targetProjectId" 
                                   :class="{'border-red-500': formHatalari.targetProjectId}">
                                <option value="">Aynı Proje</option>
                                <option v-for="proje in projeler" :key="proje.id" :value="proje.id">
                                    {{ proje.name }}
                                </option>
                            </select>
                            <p v-if="formHatalari.targetProjectId" class="text-red-500 text-xs mt-1">{{ formHatalari.targetProjectId }}</p>
                            <p class="text-xs text-gray-500 mt-1">Boş bırakırsanız, kaynak projeyle aynı olacaktır</p>
                        </div>

                        <div class="mb-4 sm:col-span-2">
                            <label>Açıklama</label>
                            <textarea class="form-textarea" rows="3" v-model="formVerisi.description"></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end gap-4">
                        <button type="button" class="btn btn-outline-danger" @click="closeModal">
                            İptal
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="kaydediliyor">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Detay Modal -->
        <div v-if="detayModalGoster" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 w-full max-w-lg">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg">Hareket Detayı</h5>
                    <button class="text-gray-400 hover:text-gray-800" @click="closeDetailModal">
                        <icon-x class="w-5 h-5" />
                    </button>
                </div>

                <div class="space-y-4" v-if="seciliHareket">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="font-semibold">Hareket No:</label>
                            <p>{{ seciliHareket.movementNumber }}</p>
                        </div>
                        <div>
                            <label class="font-semibold">Tarih:</label>
                            <p>{{ formatTarih(seciliHareket.date) }}</p>
                        </div>                        <div>
                            <label class="font-semibold">Hareket Türü:</label>
                            <p>{{ getHareketTipi(seciliHareket.type) }}</p>
                        </div>
                        <div>
                            <label class="font-semibold">Proje:</label>
                            <p v-if="seciliHareket.type === 'transfer' && seciliHareket.sourceProjectId !== seciliHareket.targetProjectId">
                                {{ getProjectName(seciliHareket.sourceProjectId) }} → {{ getProjectName(seciliHareket.targetProjectId) }}
                            </p>
                            <p v-else>
                                {{ getProjectName(seciliHareket.sourceProjectId) }}
                            </p>
                        </div>
                        <div>
                            <label class="font-semibold">Ürün:</label>
                            <p>{{ seciliHareket.product?.name }}</p>
                        </div>
                        <div>
                            <label class="font-semibold">Miktar:</label>
                            <p>{{ seciliHareket.quantity }} {{ seciliHareket.product?.unit }}</p>
                        </div>
                        <div>
                            <label class="font-semibold">Depo:</label>
                            <p>{{ getWarehouseInfo(seciliHareket) }}</p>
                        </div>
                        <div class="col-span-2">
                            <label class="font-semibold">Açıklama:</label>
                            <p>{{ seciliHareket.description || '-' }}</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end mt-6">
                    <button class="btn btn-outline-primary" @click="closeDetailModal">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory.js';
import { useProjectStore } from '@/stores/projects';

// Interface isimlerini Türkçeleştirme
type MovementType = 'in' | 'out' | 'transfer' | 'stock_add';

interface Urun {
    id: string;
    code: string;
    name: string;
    unit: string;
    minStockLevel: number;
}

interface Depo {
    id: string;
    code: string;
    name: string;
    address: string | null;
    manager: string | null;
    isActive: boolean;
}

interface StokHareketi {
    id: string;
    movementNumber: string;
    date: Date;
    type: MovementType;
    productId: string;
    quantity: number;
    sourceWarehouseId: string;
    targetWarehouseId?: string;
    sourceProjectId?: string;
    targetProjectId?: string;
    description: string;
    product?: Urun;  // product alanını opsiyonel yaptık
    sourceWarehouse: Depo;
    targetWarehouse?: Depo;
}

interface MovementForm {
    type: MovementType;
    date: string;
    productId: string;
    quantity: number;
    sourceWarehouseId: string;
    targetWarehouseId: string;
    sourceProjectId?: string;
    targetProjectId?: string;
    description: string;
}

interface Filtreler {
    type: string;
    startDate: string;
    endDate: string;
    warehouseId: string;
}

interface FormHatalari {
    type?: string;
    date?: string;
    productId?: string;
    quantity?: string;
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    sourceProjectId?: string;
    targetProjectId?: string;
}

const yukleniyor = ref(false);
const kaydediliyor = ref(false);
const modalGoster = ref(false);
const detayModalGoster = ref(false);
const hareketler = ref<StokHareketi[]>([]);
const depolar = ref<Depo[]>([]);
const urunler = ref<Urun[]>([]);
const projeler = ref<{id: string, name: string}[]>([]);
const seciliHareket = ref<StokHareketi | null>(null);
const hata = ref<string>('');
const toplamKayit = ref(0);

const filtreler = ref<Filtreler>({
    type: '',
    startDate: '',
    endDate: '',
    warehouseId: ''
});

const formVerisi = ref<MovementForm>({
    type: 'in',
    date: new Date().toISOString().slice(0, 16),
    productId: '',
    quantity: 0,
    sourceWarehouseId: '',
    targetWarehouseId: '',
    sourceProjectId: '',
    targetProjectId: '',
    description: ''
});

const formHatalari = ref<FormHatalari>({});

const itemsPerPage = ref(10);
const currentPage = ref(1);

const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const projectStore = useProjectStore();

onMounted(async () => {
    hata.value = '';
    yukleniyor.value = true;
    
    try {
        // Veri deposunu başlatma - bu işlem tamamlanana kadar bekle
        if (!inventoryStore.isInitialized) {
            console.log('Veri deposu başlatılıyor...');
            await inventoryStore.initializeStore();
            console.log('Veri deposu başlatıldı');
        }

        // İlk olarak depoları, ürünleri ve projeleri yükle
        await Promise.all([
            loadWarehouses(),
            loadProducts(),
            loadProjects()
        ]);
        
        // Son olarak hareketleri yükle
        await loadMovements();
        
    } catch (error) {
        console.error('Veriler yüklenirken hata oluştu:', error);
        hata.value = 'Veriler yüklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : String(error));
    } finally {
        // 300ms gecikme ile yükleme durumunu güncelle (UI için daha iyi deneyim)
        setTimeout(() => {
            yukleniyor.value = false;
        }, 300);
    }
});

const loadMovements = async () => {
    yukleniyor.value = true;
    hata.value = '';
    try {
        const movements = inventoryStore.getMovements;
        
        // Eğer depolar ve ürünler henüz yüklenmemişse, önceden yükleyelim
        if (depolar.value.length === 0) {
            await loadWarehouses();
        }
        
        if (urunler.value.length === 0) {
            await loadProducts();
        }
        
        console.log('Hareketler yükleniyor. Toplam:', movements.length);
        
        // Şimdi her hareket için doğru ürün ve depo bilgilerini ekleyelim
        hareketler.value = movements.map(m => {
            // İlgili ürünü bul
            const ilgiliUrun = urunler.value.find(u => u.id === m.productId) || {
                id: m.productId || '',
                code: '',
                name: 'Tanımsız',
                unit: 'adet',
                minStockLevel: 0
            };
            
            // İlgili kaynak depoyu bul
            const kaynakDepo = depolar.value.find(d => d.id === m.sourceWarehouseId) || {
                id: m.sourceWarehouseId || '',
                code: '',
                name: 'Tanımsız',
                address: '',
                manager: '',
                isActive: true
            };            // İlgili hedef depoyu bul (transfer veya stock_add hareketi ise)
            let hedefDepo;
            if ((m.type === 'transfer' || m.type === 'stock_add') && m.targetWarehouseId) {
                hedefDepo = depolar.value.find(d => d.id === m.targetWarehouseId);
                if (!hedefDepo) {
                    hedefDepo = {
                        id: m.targetWarehouseId || '',
                        code: '',
                        name: 'Tanımsız Depo',
                        address: null,
                        manager: null,
                        isActive: true
                    };
                }
            }
              // Hareket nesnesini oluştur
            const hareket: StokHareketi = {
                id: m.id || '',
                movementNumber: m.movementNumber || `HRK-${Math.random().toString(36).substr(2, 9)}`,
                date: new Date(m.date || new Date()),
                type: (m.type === 'out' || m.type === 'transfer' ? m.type : 'in') as MovementType,
                productId: m.productId || '',
                quantity: m.quantity || 0,
                sourceWarehouseId: m.sourceWarehouseId || '',
                targetWarehouseId: m.targetWarehouseId,
                sourceProjectId: m.sourceProjectId || 'ApMkLHJ3Rk7BpmYuNm5Z',
                targetProjectId: m.targetProjectId,
                description: m.description || '',
                product: ilgiliUrun,
                sourceWarehouse: kaynakDepo,
                targetWarehouse: hedefDepo
            };
            
            return hareket;
        });
        
        // Toplam kayıt sayısını güncelle
        toplamKayit.value = hareketler.value.length;
        
        // Debug bilgisi
        console.log(`${hareketler.value.length} hareket yüklendi`);
        if (hareketler.value.length > 0) {
            // İlk hareketin bilgilerini kontrol et
            const ilkHareket = hareketler.value[0];
            console.log('İlk hareket:', {
                movementNumber: ilkHareket.movementNumber,
                product: ilkHareket.product?.name,
                sourceWarehouse: ilkHareket.sourceWarehouse?.name,
                targetWarehouse: ilkHareket.targetWarehouse?.name
            });
        }
        
    } catch (err) {
        console.error('Hareketler yüklenirken hata oluştu:', err);
        hata.value = 'Hareketler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
    } finally {
        yukleniyor.value = false;
    }
};

const loadWarehouses = async () => {
    try {
        // Depolar boş mu kontrol et
        const warehousesData = inventoryStore.getWarehouses || [];
        
        // Aktif depoları filtrele ve varsayılan değerleri sağla
        depolar.value = warehousesData
            .filter(w => w.isActive !== false) // isActive undefined veya null ise de dahil et
            .map(warehouse => ({
                id: warehouse.id || '',
                code: warehouse.code || '',
                name: warehouse.name || 'Tanımsız Depo',
                address: warehouse.address || '',
                manager: warehouse.manager || '',
                isActive: true
            }));
        
        if (depolar.value.length === 0) {
            console.warn('Aktif depo bulunamadı!');
        }
    } catch (err) {
        console.error('Depolar yüklenirken hata oluştu:', err);
        hata.value = 'Depolar yüklenirken hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
};

const loadProducts = async () => {
    try {
        // Ürünler boş mu kontrol et
        const productsData = inventoryStore.getProducts || [];
        
        // Ürün bilgilerini dönüştür ve varsayılanları ayarla
        urunler.value = productsData.map(product => ({
            id: product.id || '',
            code: product.code || '',
            name: product.name || 'Tanımsız Ürün',
            unit: product.unit || 'adet',
            minStockLevel: product.minStockLevel || 0
        }));
        
        if (urunler.value.length === 0) {
            console.warn('Hiç ürün bulunamadı!');
        }
    } catch (err) {
        console.error('Ürünler yüklenirken hata oluştu:', err);
        hata.value = 'Ürünler yüklenirken hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
};

const loadProjects = async () => {
    try {
        await projectStore.loadUserProjects();
        projeler.value = projectStore.projects.map(project => ({
            id: project.id,
            name: project.name
        }));
        
        if (projeler.value.length === 0) {
            console.warn('Hiç proje bulunamadı!');
        } else {
            console.log(`${projeler.value.length} proje yüklendi`);
        }
    } catch (err) {
        console.error('Projeler yüklenirken hata oluştu:', err);
        hata.value = 'Projeler yüklenirken hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
};

const formatTarih = (date: Date | string | undefined) => {
    if (!date) return '-';
    
    try {
        // Tarih string ise onu Date objesine dönüştür
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        // Geçerli bir tarih olup olmadığını kontrol et
        if (isNaN(dateObj.getTime())) {
            console.error('Geçersiz tarih formatı:', date);
            return '-';
        }
        
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    } catch (error) {
        console.error('Tarih biçimlendirme hatası:', error, date);
        return '-';
    }
};

const getMovementTypeLabel = (type: string | undefined) => {
    if (!type) return '';
    
    switch (type) {
        case 'in':
            return 'Giriş';
        case 'out':
            return 'Çıkış';
        case 'transfer':
            return 'Transfer';
        default:
            return type;
    }
};

const openAddModal = () => {
    formVerisi.value = {
        type: 'in',
        date: new Date().toISOString().slice(0, 16),
        productId: '',
        quantity: 0,
        sourceWarehouseId: '',
        targetWarehouseId: '',
        sourceProjectId: '',
        targetProjectId: '',
        description: ''
    };
    formHatalari.value = {};
    modalGoster.value = true;
    
    // Form açılır açılmaz hareket türü fonksiyonunu çağır
    // Böylece varsayılan hareket tipi için gerekli ayarlar yapılır
    hareketTuruDegisti();
};

const closeModal = () => {
    modalGoster.value = false;
};

const viewDetails = (movement: StokHareketi) => {
    seciliHareket.value = movement;
    detayModalGoster.value = true;
};

const closeDetailModal = () => {
    detayModalGoster.value = false;
    seciliHareket.value = null;
};

const filteredMovements = computed(() => {
    // Eğer hareketler yüklenmemişse boş dizi döndür
    if (!hareketler.value || hareketler.value.length === 0) {
        return [];
    }
    
    try {
        // Hareketleri kopyala ve tarihe göre tersine sırala (en yeni en üstte)
        let result = [...hareketler.value].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Azalan sıralama (en yeni önce)
        });
        
        // Admin değilse sadece kendi deposuna ait hareketleri göster
        if (!authStore.isAdmin) {
            const yetkiliDepoKodu = authStore.getAuthorizedDepot;
            if (!yetkiliDepoKodu) {
                console.warn('Kullanıcı için depo yetkisi bulunamadı');
                return [];
            }
            
            const yetkiliDepo = depolar.value.find(d => d.code === yetkiliDepoKodu);
            if (yetkiliDepo) {
                result = result.filter(hareket => 
                    hareket.sourceWarehouseId === yetkiliDepo.id || 
                    hareket.targetWarehouseId === yetkiliDepo.id
                );
            } else {
                console.warn('Yetkilendirilen depo bulunamadı:', yetkiliDepoKodu);
                return [];
            }
        }

        // Filtre uygula
        if (filtreler.value.type) {
            result = result.filter(h => h.type === filtreler.value.type);
        }

        if (filtreler.value.startDate) {
            try {
                const startDate = new Date(filtreler.value.startDate);
                if (!isNaN(startDate.getTime())) {
                    startDate.setHours(0, 0, 0, 0);
                    result = result.filter(h => {
                        const hareketDate = new Date(h.date);
                        return !isNaN(hareketDate.getTime()) && hareketDate >= startDate;
                    });
                }
            } catch (error) {
                console.error('Başlangıç tarihi filtreleme hatası:', error);
            }
        }

        if (filtreler.value.endDate) {
            try {
                const endDate = new Date(filtreler.value.endDate);
                if (!isNaN(endDate.getTime())) {
                    endDate.setHours(23, 59, 59, 999);
                    result = result.filter(h => {
                        const hareketDate = new Date(h.date);
                        return !isNaN(hareketDate.getTime()) && hareketDate <= endDate;
                    });
                }
            } catch (error) {
                console.error('Bitiş tarihi filtreleme hatası:', error);
            }
        }

        if (filtreler.value.warehouseId) {
            result = result.filter(h => 
                h.sourceWarehouseId === filtreler.value.warehouseId ||
                h.targetWarehouseId === filtreler.value.warehouseId
            );
        }

        return result;
    } catch (error) {
        console.error('Filtreleme sırasında hata oluştu:', error);
        return [];
    }
});

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredMovements.value.length / itemsPerPage.value));
});

const paginatedMovements = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredMovements.value.slice(start, end);
});

const validateForm = (): boolean => {
    formHatalari.value = {};
    let isValid = true;
    
    if (!formVerisi.value.type) {
        formHatalari.value.type = 'Hareket türü seçmelisiniz';
        isValid = false;
    }
    
    if (!formVerisi.value.date) {
        formHatalari.value.date = 'Tarih girilmelidir';
        isValid = false;
    } else {
        const selectedDate = new Date(formVerisi.value.date);
        const now = new Date();
        if (selectedDate > now) {
            formHatalari.value.date = 'İleri tarihli hareket giremezsiniz';
            isValid = false;
        }
    }
    
    if (!formVerisi.value.sourceProjectId) {
        formHatalari.value.sourceProjectId = 'Proje seçmelisiniz';
        isValid = false;
    }
    
    if (!formVerisi.value.productId) {
        formHatalari.value.productId = 'Ürün seçmelisiniz';
        isValid = false;
    }
    
    if (!formVerisi.value.quantity || formVerisi.value.quantity <= 0) {
        formHatalari.value.quantity = 'Miktar 0\'dan büyük olmalıdır';
        isValid = false;
    }
    
    if (!formVerisi.value.sourceWarehouseId) {
        formHatalari.value.sourceWarehouseId = 'Kaynak depo seçmelisiniz';
        isValid = false;
    }
      if (formVerisi.value.type === 'transfer' || formVerisi.value.type === 'stock_add') {
        if (!formVerisi.value.targetWarehouseId) {
            formHatalari.value.targetWarehouseId = 'Hedef depo seçmelisiniz';
            isValid = false;
        } else if (formVerisi.value.targetWarehouseId === formVerisi.value.sourceWarehouseId) {
            formHatalari.value.targetWarehouseId = 'Hedef depo, kaynak depodan farklı olmalıdır';
            isValid = false;
        }
    }
    
    return isValid;
};

const getWarehouseInfo = (movement: StokHareketi): string => {
    if (movement.type === 'in') {
        return movement.sourceWarehouse?.name || '';
    } else if (movement.type === 'out') {
        return movement.sourceWarehouse?.name || '';
    } else if (movement.type === 'transfer') {
        return `${movement.sourceWarehouse?.name || ''} -> ${movement.targetWarehouse?.name || ''}`;
    } else if (movement.type === 'stock_add') {
        return `Test Depo -> ${movement.targetWarehouse?.name || '-'}`;
    }
    return '';
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    kaydediliyor.value = true;
    hata.value = ''; // Reset error state
    try {
        // Tarih alanını işle
        let date = new Date();
        if (formVerisi.value.date) {
            try {
                date = new Date(formVerisi.value.date);
                if (isNaN(date.getTime())) {
                    throw new Error('Geçersiz tarih formatı');
                }
            } catch (error) {
                console.error('Tarih dönüştürme hatası:', error);
                date = new Date(); // Hata durumunda geçerli tarihi kullan
            }
        }
        
        // Değerleri doğrula ve varsayılanları ayarla
        const quantity = Number(formVerisi.value.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            throw new Error('Miktar sayısal ve sıfırdan büyük olmalıdır');
        }
        
        // Ürün ve depo kontrolü
        const product = urunler.value.find(u => u.id === formVerisi.value.productId);
        if (!product) {
            throw new Error('Seçilen ürün bulunamadı');
        }
        
        const sourceWarehouse = depolar.value.find(d => d.id === formVerisi.value.sourceWarehouseId);
        if (!sourceWarehouse) {
            throw new Error('Kaynak depo bulunamadı');
        }
        
        let targetWarehouse;
        if (formVerisi.value.type === 'transfer') {
            targetWarehouse = depolar.value.find(d => d.id === formVerisi.value.targetWarehouseId);
            if (!targetWarehouse) {
                throw new Error('Hedef depo bulunamadı');
            }
        }

        // Hareket numarasını oluştur
        const hareketNo = `HRK${String(inventoryStore.getMovements.length + 1).padStart(4, '0')}`;
        console.log(`Yeni hareket numarası oluşturuluyor: ${hareketNo}`);        // Hareket verisi oluştur
        const movementData: any = {
            id: `HRK-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
            date: date.toISOString(),
            movementNumber: hareketNo,
            type: formVerisi.value.type,
            productId: formVerisi.value.productId,
            quantity: quantity,
            sourceWarehouseId: formVerisi.value.sourceWarehouseId,
            description: formVerisi.value.description || '',
            // Proje bilgilerini ekle
            sourceProjectId: formVerisi.value.sourceProjectId || 'ApMkLHJ3Rk7BpmYuNm5Z' // Varsayılan olarak KGYS
        };
        
        // Hedef depo bilgilerini sadece gerekli durumlarda ekle
        if (formVerisi.value.type === 'transfer' || formVerisi.value.type === 'stock_add') {
            movementData.targetWarehouseId = formVerisi.value.targetWarehouseId;
        }
        
        // Hedef proje bilgisini sadece transfer durumunda ve değer varsa ekle
        if (formVerisi.value.type === 'transfer' && formVerisi.value.targetProjectId) {
            movementData.targetProjectId = formVerisi.value.targetProjectId;
        } else if (formVerisi.value.type === 'transfer') {
            // Transfer ama hedef proje seçilmemişse kaynak projeyi kullan
            movementData.targetProjectId = formVerisi.value.sourceProjectId || 'ApMkLHJ3Rk7BpmYuNm5Z';
        }
        // Transfer olmayan hareketlerde targetProjectId hiç eklenmez
        
        console.log('Hareket verisi Firestore\'a gönderiliyor:', movementData);
        
        // Hareketi kaydet
        await inventoryStore.addMovement(movementData);
        
        // Veri yenileme
        await loadMovements();
        closeModal();
        
    } catch (err) {
        console.error('Hareket kaydedilirken hata oluştu:', err);
        // Hata mesajını kullanıcıya göster
        if (err instanceof Error) {
            // Hata mesajlarını anlaşılır hale getir
            if (err.message.includes('INSUFFICIENT_STOCK')) {
                hata.value = 'Yeterli stok bulunmuyor. Lütfen stok miktarını kontrol ediniz.';
            } else {
                hata.value = `Hareket kaydedilirken hata: ${err.message}`;
            }
        } else {
            hata.value = 'Hareket kaydedilirken beklenmeyen bir hata oluştu';
        }
    } finally {
        kaydediliyor.value = false;
    }
};

const getHareketTipi = (type: string): string => {
    switch (type) {
        case 'in':
            return 'Giriş';
        case 'out':
            return 'Çıkış';
        case 'transfer':
            return 'Transfer';
        case 'stock_add':
            return 'Stok Ekleme';
        default:
            return type;
    }
};

const getProjectName = (projectId?: string): string => {
    if (!projectId) return 'Atanmamış';
    if (projectId === 'ApMkLHJ3Rk7BpmYuNm5Z') return 'KGYS';
    
    const proje = projeler.value.find(p => p.id === projectId);
    return proje ? proje.name : 'Bilinmeyen Proje';
};

const canAddMovement = computed(() => {
    if (authStore.isAdmin) {
        return true;
    }
    const yetkiliDepo = depolar.value.find(d => d.code === authStore.getAuthorizedDepot);
    return yetkiliDepo && formVerisi.value.sourceWarehouseId === yetkiliDepo.id;
});

const availableSourceWarehouses = computed(() => {
    if (authStore.isAdmin) {
        return depolar.value;
    }
    const yetkiliDepoCodu = authStore.getAuthorizedDepot;
    return depolar.value.filter(d => d.code === yetkiliDepoCodu);
});

// Hareket türü değiştiğinde çalışan fonksiyon
const hareketTuruDegisti = () => {
    // Öncelikle targetWarehouseId'yi sıfırla (transfer veya stock_add değilse bu alan gösterilmeyecek)
    formVerisi.value.targetWarehouseId = '';
    
    // Transfer değilse targetProjectId'yi de temizle
    if (formVerisi.value.type !== 'transfer') {
        formVerisi.value.targetProjectId = '';
    }
    
    // Eğer seçilen hareket türü "stok ekleme" ise
    if (formVerisi.value.type === 'stock_add') {
        // Test Depo'yu bulmaya çalışalım (önce DEP001 kodlu, sonra "Test" içeren adı olan)
        let testDepo = depolar.value.find(depo => depo.code === 'DEP001');
        
        // DEP001 kodlu depo yoksa, "Test" kelimesi içeren bir depo bulmayı deneyelim
        if (!testDepo) {
            testDepo = depolar.value.find(depo => 
                (depo.name && depo.name.toLowerCase().includes('test')) || 
                (depo.code && depo.code.toLowerCase().includes('test'))
            );
        }
        
        // Eğer hala bulunamadıysa, ilk depoyu kullanalım
        if (!testDepo && depolar.value.length > 0) {
            testDepo = depolar.value[0]; // İlk depoyu kullan
            console.log('Test Depo bulunamadı. İlk depo kullanılıyor:', testDepo.name);
        }
        
        if (testDepo) {
            // Bulunan depoyu kaynak depo olarak ayarla
            formVerisi.value.sourceWarehouseId = testDepo.id;
            console.log('Stok ekleme için kaynak depo olarak kullanılıyor:', testDepo.name);
            hata.value = ''; // Hata mesajını temizle
        } else {
            console.error('Hiçbir aktif depo bulunamadı!');
            hata.value = 'Stok ekleme için kullanılacak bir depo bulunamadı. Lütfen önce depo ekleyin.';
        }
    }
};
</script>