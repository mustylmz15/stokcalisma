<template>
    <!-- Mevcut şablonu koruyoruz -->
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Kullanıcılar</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Kullanıcı Yönetimi</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel mb-5">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Kullanıcı Yönetimi</h5>
                    <div>
                        <button type="button" class="btn btn-primary" @click="yeniKullaniciEkle">
                            <icon-plus class="ltr:mr-2 rtl:ml-2" />
                            Yeni Kullanıcı Ekle
                        </button>
                    </div>
                </div>

                <!-- Kullanıcı Filtreleme Bölümü -->
                <div class="mb-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div class="flex items-center flex-1">
                        <div class="flex flex-col sm:flex-row gap-5">
                            <div class="flex-1">
                                <input type="text" placeholder="Kullanıcı Ara..." class="form-input" v-model="aramaMetni" />
                            </div>
                            <div class="flex-1">
                                <select class="form-select" v-model="seciliKullaniciTipi">
                                    <option value="">Tüm Kullanıcı Tipleri</option>
                                    <option value="admin">Admin</option>
                                    <option value="user">Depo Sorumlusu</option>
                                    <option value="observer">Depo İzleyicisi</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kullanıcı Listesi Tablosu -->
                <div class="datatables">
                    <div class="table-responsive whitespace-nowrap">
                        <table class="table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Kullanıcı Adı</th>
                                    <th>Ad Soyad</th>
                                    <th>Email</th>
                                    <th>Kullanıcı Tipi</th>
                                    <th>Durum</th>
                                    <th>Son Giriş</th>
                                    <th class="text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(kullanici, index) in filtrelenmisKullanicilar" :key="index">
                                    <td>{{ index + 1 }}</td>
                                    <td>
                                        <div class="flex items-center">
                                            <img
                                                :src="(kullanici as ValidUser).avatar || '/assets/images/profile-34.jpeg'"
                                                class="w-8 h-8 rounded-full object-cover ltr:mr-2 rtl:ml-2"
                                                alt="avatar"
                                            />
                                            <span class="whitespace-nowrap">{{ (kullanici as ValidUser).email.split('@')[0] }}</span>
                                        </div>
                                    </td>
                                    <td>{{ (kullanici as ValidUser).name || (kullanici as ValidUser).email.split('@')[0] }}</td>
                                    <td>{{ (kullanici as ValidUser).email }}</td>
                                    <td>
                                        <span
                                            :class="{
                                                'badge bg-primary': (kullanici as ValidUser).role === 'admin',
                                                'badge bg-success': (kullanici as ValidUser).role === 'user',
                                                'badge bg-warning': (kullanici as ValidUser).role === 'observer',
                                            }"
                                        >
                                            {{ kullaniciTipiGetir((kullanici as ValidUser).role || '') }}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            :class="{
                                                'badge bg-success': (kullanici as ValidUser).isActive,
                                                'badge bg-danger': !(kullanici as ValidUser).isActive,
                                            }"
                                        >
                                            {{ (kullanici as ValidUser).isActive ? 'Aktif' : 'Pasif' }}
                                        </span>
                                    </td>
                                    <td>{{ (kullanici as ValidUser).lastLogin || '-' }}</td>
                                    <td>
                                        <div class="flex items-center justify-center gap-2">
                                            <button type="button" class="btn btn-sm btn-outline-primary" @click="kullaniciDuzenle(kullanici)">
                                                <icon-pencil />
                                            </button>
                                            <button 
                                                type="button" 
                                                class="btn btn-sm btn-outline-danger" 
                                                @click="kullaniciSil(kullanici)"
                                                :disabled="(kullanici as ValidUser).email === 'deneme@deneme.com'"
                                                :title="(kullanici as ValidUser).email === 'deneme@deneme.com' ? 'Admin kullanıcısı silinemez' : ''"
                                            >
                                                <icon-trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="filtrelenmisKullanicilar.length === 0">
                                    <td colspan="8" class="text-center">Kullanıcı bulunamadı.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Sayfalama -->
                <div class="flex justify-between items-center mt-5">
                    <div>Toplam: {{ (kullanicilar && Array.isArray(kullanicilar)) ? kullanicilar.length : 0 }} kullanıcı</div>
                    <ul class="inline-flex items-center space-x-1 rtl:space-x-reverse">
                        <li>
                            <button
                                type="button"
                                class="flex justify-center px-3 py-2 font-semibold border border-gray-300 rounded-md text-sm leading-5 text-gray-700 bg-white hover:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
                                :disabled="sayfaNo === 1"
                                @click="sayfaDegistir(sayfaNo - 1)"
                            >
                                <icon-arrow-left class="w-5 h-5" />
                            </button>
                        </li>
                        <li v-for="sayfa in sayfaSayisi" :key="sayfa">
                            <button
                                type="button"
                                class="px-3 py-2 rounded-md"
                                :class="{
                                    'bg-primary text-white': sayfaNo === sayfa,
                                    'text-gray-700 hover:text-gray-500 bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200':
                                        sayfaNo !== sayfa,
                                }"
                                @click="sayfaDegistir(sayfa)"
                            >
                                {{ sayfa }}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                class="flex justify-center px-3 py-2 font-semibold border border-gray-300 rounded-md text-sm leading-5 text-gray-700 bg-white hover:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
                                :disabled="sayfaNo === sayfaSayisi"
                                @click="sayfaDegistir(sayfaNo + 1)"
                            >
                                <icon-arrow-forward class="w-5 h-5" />
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Kullanıcı Ekle/Düzenle Modal - Proje seçim kısmı düzeltildi -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">{{ duzenlemeModu ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle' }}</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="showModal = false">
                                <icon-x />
                            </button>
                        </div>
                        <!-- Modal içeriğine kaydırma ekle -->
                        <div class="p-5 overflow-y-auto max-h-[80vh]">
                            <form @submit.prevent="kullaniciKaydet">
                                <div class="mb-5">
                                    <label for="email">Email <span class="text-danger">*</span></label>
                                    <input id="email" type="email" placeholder="Email" class="form-input" v-model="yeniKullanici.email" required :disabled="duzenlemeModu && yeniKullanici.email === 'deneme@deneme.com'" />
                                    <span v-if="formHatalari.email" class="text-danger">{{ formHatalari.email }}</span>
                                </div>
                                <div class="mb-5">
                                    <label for="name">Ad Soyad <span class="text-danger">*</span></label>
                                    <input id="name" type="text" placeholder="Ad Soyad" class="form-input" v-model="yeniKullanici.name" required />
                                    <span v-if="formHatalari.name" class="text-danger">{{ formHatalari.name }}</span>
                                </div>
                                <div class="mb-5">
                                    <label for="name">Telefon <span class="text-danger">*</span></label>
                                    <input id="name" type="text" placeholder="Telefon" class="form-input" v-model="yeniKullanici.phone" required />
                                    <span v-if="formHatalari.name" class="text-danger">{{ formHatalari.name }}</span>
                                </div>
                                <div class="mb-5">
                                    <label for="sifre">{{ duzenlemeModu ? 'Şifre (Değiştirmek için doldurun)' : 'Şifre' }} 
                                        <span v-if="!duzenlemeModu" class="text-danger">*</span>
                                    </label>
                                    <input id="sifre" type="password" placeholder="Şifre" class="form-input" v-model="yeniKullanici.password" :required="!duzenlemeModu" />
                                    <span v-if="formHatalari.password" class="text-danger">{{ formHatalari.password }}</span>
                                </div>

                                <!-- YENİ PROJE SEÇİM ALANI -->
                                <div class="mb-5">
                                    <label>Bağlı Olduğu Projeler <span class="text-danger">*</span></label>

                                    <!-- Seçilmiş Projeler Listesi -->
                                    <div class="border border-gray-300 dark:border-gray-700 rounded-md p-2 min-h-[60px] mb-2 bg-gray-100 dark:bg-gray-800">
                                        <p v-if="secilmisProjeler.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Henüz proje seçilmedi.</p>
                                        <div v-else v-for="proje in secilmisProjeler" :key="'selected-' + proje.id" class="flex items-center justify-between bg-white dark:bg-gray-700 p-1 px-2 rounded mb-1 shadow-sm">
                                            <span>
                                                {{ proje.name }}
                                                <span v-if="!proje.isActive" class="text-xs text-warning">(Pasif)</span>
                                            </span>
                                            <button type="button" @click="projeKaldir(proje.id)" class="text-danger hover:text-red-700" title="Projeyi Kaldır">
                                                <icon-trash class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Seçilebilir Projeler Listesi -->
                                    <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Eklenebilecek Projeler:</label>
                                    <div class="border border-gray-300 dark:border-gray-700 rounded-md p-2 max-h-40 overflow-y-auto">
                                        <p v-if="projeYukleniyor" class="text-sm text-gray-500">Projeler yükleniyor...</p>
                                        <p v-else-if="secilebilirProjeler.length === 0 && projeler.length > 0" class="text-sm text-gray-500">Tüm aktif projeler seçilmiş.</p>
                                        <p v-else-if="projeler.length === 0 && !projeYukleniyor" class="text-sm text-warning">Hiç proje bulunamadı.</p>
                                        <div v-else v-for="proje in secilebilirProjeler" :key="'available-' + proje.id" class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 p-1 px-2 rounded mb-1">
                                            <span>{{ proje.name }}</span>
                                            <button type="button" @click="projeEkle(proje.id)" class="text-success hover:text-green-700" title="Projeyi Ekle">
                                                <icon-plus class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <span v-if="formHatalari.projectIds" class="text-danger text-sm mt-1">{{ formHatalari.projectIds }}</span>
                                </div>
                                <!-- /YENİ PROJE SEÇİM ALANI -->

                                <div class="mb-5">
                                    <label for="role">Kullanıcı Tipi <span class="text-danger">*</span></label>
                                    <select id="role" class="form-select" v-model="yeniKullanici.role" required :disabled="duzenlemeModu && yeniKullanici.email === 'deneme@deneme.com'">
                                        <option value="" disabled>Seçiniz</option>
                                        <option value="admin">Admin</option>
                                        <option value="user">Depo Sorumlusu</option>
                                        <option value="observer">Depo İzleyicisi</option>
                                    </select>
                                    <span v-if="formHatalari.role" class="text-danger">{{ formHatalari.role }}</span>
                                </div>
                                <div class="mb-5" v-if="yeniKullanici.role === 'user'">
                                    <label for="depot">Depo <span class="text-danger">*</span></label>
                                    <select id="depot" class="form-select" v-model="yeniKullanici.depot" required>
                                        <option value="">Depo Seçiniz</option>
                                        <option v-for="depo in availableWarehouses" :key="depo.id" :value="depo.code">
                                            {{ depo.name }} ({{ depo.code }})
                                        </option>
                                    </select>
                                    <span v-if="formHatalari.depot" class="text-danger">{{ formHatalari.depot }}</span>
                                </div>
                                <div class="mb-5">
                                    <label class="inline-flex">
                                        <input type="checkbox" class="form-checkbox" v-model="yeniKullanici.isActive" :disabled="duzenlemeModu && yeniKullanici.email === 'deneme@deneme.com'" />
                                        <span>Aktif</span>
                                    </label>
                                </div>
                                <div class="flex justify-end items-center mt-8 sticky bottom-0 bg-white dark:bg-gray-900 py-3 px-5 -mx-5 -mb-5 border-t border-gray-200 dark:border-gray-800">
                                    <button type="button" class="btn btn-outline-danger ltr:mr-2 rtl:ml-2" @click="showModal = false">İptal</button>
                                    <button type="submit" class="btn btn-primary">Kaydet</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>

        <!-- Silme Onay Modal -->
        <teleport to="#app">
            <transition name="fade">
                <div v-if="showDeleteModal" class="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center px-4">
                    <div class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg">
                        <div class="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 class="font-bold text-lg">Kullanıcı Sil</h5>
                            <button type="button" class="text-white-dark hover:text-dark" @click="showDeleteModal = false">
                                <icon-x />
                            </button>
                        </div>
                        <div class="p-5">
                            <div class="mb-5">
                                <p class="mb-4">{{ silinecekKullanici.name || silinecekKullanici.email }} adlı kullanıcıyı silmek istediğinize emin misiniz?</p>
                                <p class="text-danger">Bu işlem geri alınamaz!</p>
                            </div>
                            <div class="flex justify-end items-center mt-8">
                                <button type="button" class="btn btn-outline-dark ltr:mr-2 rtl:ml-2" @click="showDeleteModal = false">İptal</button>
                                <button type="button" class="btn btn-danger" @click="silmeOnayla">Sil</button>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/index';
import { useAuthStore, ValidUser } from '@/stores/auth-store';
import { useInventoryStore, type Warehouse } from '@/stores/inventory';
import { useUsersStore } from '@/stores/users';
import { useMeta } from '@/composables/use-meta';

// ProjectService'i daha güvenli bir şekilde import et
import { ref as refValue } from 'vue';
const projectService = refValue<any>(null);

// Daha güvenli bir import işlemi için async function kullanıyoruz
async function loadProjectService() {
    try {
        const module = await import('@/services/projectService');
        projectService.value = module.default;
        return true;
    } catch (error) {
        console.error('projectService yüklenemedi, mock servis kullanılıyor', error);
        
        projectService.value = {
            getProjects: async () => {
                return [
                    { id: '1', name: 'Varsayılan Proje', description: 'Mock proje', createdAt: new Date().toISOString(), isActive: true }
                ];
            },
            getProjectById: async (id: string) => {
                return { id, name: 'Varsayılan Proje', description: 'Mock proje', createdAt: new Date().toISOString(), isActive: true };
            }
        };
        return false;
    }
}

// İkon Bileşenleri
import IconPlus from '@/components/icon/icon-plus.vue'; // Ekleme ikonu için
import IconPencil from '@/components/icon/icon-pencil.vue';
import IconTrash from '@/components/icon/icon-trash.vue'; // Kaldırma ikonu için
import IconX from '@/components/icon/icon-x.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';
import IconArrowForward from '@/components/icon/icon-arrow-forward.vue';

// Meta bilgilerini ayarla
useMeta({ title: 'Kullanıcı Yönetimi' });
const store = useAppStore();

// Auth store'u kullan
const authStore = useAuthStore();
const inventoryStore = useInventoryStore();

// Form hataları için state
const formHatalari = ref<{[key: string]: string}>({});

// Depoları computed property olarak tanımlama
const availableWarehouses = computed<Warehouse[]>(() => {
    if (authStore.isAdmin) {
        return inventoryStore.getWarehouses.filter((d) => d.isActive);
    }
    const yetkiliDepoCodu = authStore.getAuthorizedDepot;
    return inventoryStore.getWarehouses.filter((d) => d.code === yetkiliDepoCodu && d.isActive);
});

// Depo listesi 
const depolar = computed<Warehouse[]>(() => {
    return inventoryStore.getWarehouses;
});

// Durum değişkenleri
const yukleniyor = ref(false);
const hata = ref('');
const aramaMetni = ref('');
const seciliKullaniciTipi = ref('');
const sayfaNo = ref(1);
const sayfaBasinaKayit = ref(10);
const showModal = ref(false);
const showDeleteModal = ref(false);
const duzenlemeModu = ref(false);

// Form hataları için arayüz
interface FormHatalari {
    [key: string]: string;
}

const silinecekKullanici = ref<ValidUser>({
    email: '',
    id: '',
    canEdit: true,
    password: '',
    name: '',
    role: 'user',
    isActive: true,
    lastLogin: '',
    avatar: '/assets/images/profile-34.jpeg',
    phone: ''
});

// Interface değişikliği - ValidUser türü genişletiliyor (kullanıcı-yonetimi.vue'den)
interface UserWithProject extends ValidUser {
    projectId?: string; // Geriye dönük uyumluluk için
    projectIds: string[]; // Kullanıcının bağlı olduğu projelerin ID'leri (birden fazla proje seçimi için)
    depot?: string | null;
}

// Formda kullanılacak kullanıcı bilgileri için veri tipi kullanılıyor
const yeniKullanici = ref<UserWithProject>({
    email: '',
    id: '',
    canEdit: true,
    password: '',
    name: '',
    role: 'user',
    isActive: true,
    lastLogin: '',
    avatar: '/assets/images/profile-34.jpeg',
    phone: '',
    projectId: '', // Geriye dönük uyumluluk için
    projectIds: [], // Birden fazla proje seçimi için
    depot: null
});

// Basit proje tipi tanımı
interface ProjectType {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    isActive?: boolean;
}

// Projeler için state ekleme
const projeler = ref<ProjectType[]>([]);
const projeYukleniyor = ref(false);
const projeHata = ref('');

// Projeleri yükleme fonksiyonu iyileştirildi
const projeleriYukle = async () => {
    try {
        projeYukleniyor.value = true;
        
        // Önce projectService'i yükle
        await loadProjectService();
        
        if (!projectService.value || typeof projectService.value.getProjects !== 'function') {
            console.error('projectService tanımlı değil veya getProjects metodu mevcut değil');
            projeler.value = [
                { id: '1', name: 'Varsayılan Proje', description: 'Otomatik oluşturulmuş proje', createdAt: new Date().toISOString(), isActive: true }
            ];
            return;
        }
        
        const res = await projectService.value.getProjects();
        projeler.value = Array.isArray(res) && res.length > 0 ? res : [
            { id: '1', name: 'Varsayılan Proje', description: 'Otomatik oluşturulmuş proje', createdAt: new Date().toISOString(), isActive: true }
        ];
    } catch (error) {
        console.error('Projeler yüklenirken bir hata oluştu:', error);
        projeHata.value = 'Projeler yüklenirken bir hata oluştu.';
        projeler.value = [
            { id: '1', name: 'Varsayılan Proje', description: 'Otomatik oluşturulmuş proje', createdAt: new Date().toISOString(), isActive: true }
        ];
    } finally {
        projeYukleniyor.value = false;
    }
};

// Seçilebilecek projeler (henüz seçilmemiş olanlar)
const secilebilirProjeler = computed(() => {
    return projeler.value.filter(proje =>
        proje.isActive && // Sadece aktif projeler seçilebilir olsun
        !yeniKullanici.value.projectIds.includes(proje.id)
    );
});

// Seçilmiş projeler (tam proje nesneleri)
const secilmisProjeler = computed(() => {
    return projeler.value.filter(proje =>
        yeniKullanici.value.projectIds.includes(proje.id)
    );
});

// Proje ekleme metodu
const projeEkle = (projeId: string) => {
    if (!yeniKullanici.value.projectIds.includes(projeId)) {
        yeniKullanici.value.projectIds.push(projeId);
        // Form hatasını temizle (varsa)
        if (formHatalari.value.projectIds) {
            delete formHatalari.value.projectIds;
        }
    }
};

// Proje kaldırma metodu
const projeKaldir = (projeId: string) => {
    yeniKullanici.value.projectIds = yeniKullanici.value.projectIds.filter(id => id !== projeId);
};


// Form doğrulama - projectId validation içeriyor
const formuDogrula = () => {
    const hatalar: FormHatalari = {};
    formHatalari.value = {};

    // Email validasyonu
    if (!yeniKullanici.value.email) {
        hatalar['email'] = 'Email zorunludur';
    } else if (!/\S+@\S+\.\S+/.test(yeniKullanici.value.email)) {
        hatalar['email'] = 'Geçerli bir email adresi girin';
    }

    // Ad Soyad validasyonu
    if (!yeniKullanici.value.name) {
        hatalar['name'] = 'Ad Soyad zorunludur';
    }

    // Telefon validasyonu
    if (!yeniKullanici.value.phone) {
        hatalar['phone'] = 'Telefon zorunludur';
    }

    // Şifre validasyonu
    if (!duzenlemeModu.value && !yeniKullanici.value.password) {
        hatalar['password'] = 'Şifre zorunludur';
    }    // Proje validasyonu - en az bir proje seçilmeli
    if (!yeniKullanici.value.projectIds || yeniKullanici.value.projectIds.length === 0) {
        hatalar['projectIds'] = 'En az bir proje seçilmelidir';
    }

    // Kullanıcı tipi validasyonu
    if (!yeniKullanici.value.role) {
        hatalar['role'] = 'Kullanıcı tipi zorunludur';
    }

    formHatalari.value = hatalar;
    return Object.keys(hatalar).length === 0;
};

// Kullanıcı listesini al
const kullaniciListesi = ref<ValidUser[]>([]);

// Kullanıcıları yükle
const kullanicilariYukle = async () => {
    try {
        yukleniyor.value = true;
        // Users store'u kullan
        const usersStore = useUsersStore();
        
        // Kullanıcı listesi boşsa, varsayılan kullanıcıları yükle
        if (!usersStore.users || usersStore.users.length === 0) {
            console.log('Kullanıcılar yükleniyor: Kullanıcı listesi boş, varsayılan kullanıcılar yükleniyor...');
            usersStore.resetToDefaults();
            usersStore.initializeStore();
        }
        
        // Auth store'dan tüm kullanıcıları al (Firebase'den)
        const authUsers = await authStore.getAllUsers();
        
        // Eğer Firebase'den kullanıcılar geldiyse onları kullan, yoksa users store'dan al
        const users = authUsers.length > 0 ? authUsers : usersStore.users;
        kullaniciListesi.value = Array.isArray(users) ? users : [];
    } catch (error) {
        console.error('Kullanıcılar alınırken hata:', error);
        hata.value = 'Kullanıcılar yüklenirken bir hata oluştu';
        kullaniciListesi.value = [];
    } finally {
        yukleniyor.value = false;
    }
};

const kullanicilar = computed(() => kullaniciListesi.value);

// Hesaplanmış özellikler
const filtrelenmisKullanicilar = computed(() => {
    if (!kullanicilar.value || kullanicilar.value.length === 0) {
        return [];
    }
    
    try {
        let sonuc = [...kullanicilar.value];
        
        // Arama metnine göre filtreleme
        if (aramaMetni.value) {
            const aramaMetniKucuk = aramaMetni.value.toLowerCase();
            sonuc = sonuc.filter(
                (kullanici) =>
                    ((kullanici as ValidUser).name && (kullanici as ValidUser).name.toLowerCase().includes(aramaMetniKucuk)) ||
                    (kullanici as ValidUser).email.toLowerCase().includes(aramaMetniKucuk)
            );
        }
        
        // Kullanıcı tipine göre filtreleme
        if (seciliKullaniciTipi.value) {
            sonuc = sonuc.filter((kullanici) => (kullanici as ValidUser).role === seciliKullaniciTipi.value);
        }
        
        // Sayfalama için kayıtları sınırlandır
        const baslangicIndex = (sayfaNo.value - 1) * sayfaBasinaKayit.value;
        const bitisIndex = baslangicIndex + sayfaBasinaKayit.value;
        
        return sonuc.slice(baslangicIndex, bitisIndex);
    } catch (error) {
        console.error('kullanici-yonetimi: Filtrelemede hata oluştu', error);
        return [];
    }
});

// Kullanıcı düzenleme fonksiyonu - Firebase'den güncel proje bilgilerini çekecek şekilde iyileştirildi
const kullaniciDuzenle = async (kullanici: ValidUser): Promise<void> => {
    duzenlemeModu.value = true;

    // Boş değerleri kontrol et
    const kullaniciVeritipi = kullanici as any;
    const projectId = kullaniciVeritipi.projectId || '';
    const depot = kullaniciVeritipi.depot || null;

    // Firebase'den en güncel kullanıcı verilerini almak için kullanıcı listesinden buluyoruz
    let guncelKullanici = null;
    let userProjectIds: string[] = [];

    try {
        if (kullanici.id) {
            // Tüm kullanıcıları al ve ID'ye göre filtreleme yap
            const allUsers = await authStore.getAllUsers();
            guncelKullanici = allUsers.find(user => user.id === kullanici.id);
            console.log("Firebase'den gelen güncel kullanıcı verileri:", guncelKullanici);
            
            // Doğrudan Firebase'den kullanıcı projelerini çek (yeni eklediğimiz metodu kullanıyoruz)
            userProjectIds = await authStore.getUserProjects(kullanici.id);
            console.log(`Firebase'den çekilen kullanıcı projeleri: ${userProjectIds.length} adet`, userProjectIds);
        }
    } catch (error) {
        console.error("Kullanıcı verileri güncellenirken hata:", error);
    }

    // Hiç proje bulunamadıysa diğer yöntemleri dene
    if (userProjectIds.length === 0) {
        // Güncel kullanıcıdan projectIds verisini çek
        if (guncelKullanici && (guncelKullanici as UserWithProject).projectIds && Array.isArray((guncelKullanici as UserWithProject).projectIds)) {
            userProjectIds = [...(guncelKullanici as UserWithProject).projectIds];
        }
        // Eğer güncel kullanıcıdan alınamadıysa mevcut veriyi kontrol et
        else if (kullaniciVeritipi.projectIds && Array.isArray(kullaniciVeritipi.projectIds)) {
            userProjectIds = [...kullaniciVeritipi.projectIds];
        }
        // Geriye dönük uyumluluk için - tek bir projectId varsa onu da ekle
        else if (projectId) {
            userProjectIds = [projectId];
        }
    }

    console.log("Düzenleme için kullanıcının projeleri:", userProjectIds);

    yeniKullanici.value = {
        email: kullanici.email,
        id: kullanici.id,
        canEdit: kullanici.canEdit,
        password: '',
        name: kullanici.name || '',
        role: kullanici.role,
        isActive: kullanici.isActive,
        lastLogin: kullanici.lastLogin,
        avatar: kullanici.avatar || '/assets/images/profile-34.jpeg',
        phone: kullanici.phone || '',
        projectId: projectId, // Geriye dönük uyumluluk için
        projectIds: userProjectIds, // Çoklu proje seçimi için
        depot: depot
    };

    formHatalari.value = {};
    showModal.value = true;
};

// Kullanıcı kaydetme işlemi - ek field'lar için tip güvenliğini artırdık
const kullaniciKaydet = async () => {
    // Form doğrulama
    if (!formuDogrula()) {
        return;
    }

    try {
        yukleniyor.value = true;

        // Kullanıcı tipi depo sorumlusu ise ve depo seçilmemişse hata ver
        if ((yeniKullanici.value.role === 'user' || yeniKullanici.value.role === 'depo_sorumlusu') && !yeniKullanici.value.depot) {
            store.showMessage('Depo sorumlusu için depo seçimi zorunludur', 'error');
            yukleniyor.value = false;
            return;
        }

    // projectService yüklenmemişse yükle
        if (!projectService.value) {
            const loaded = await loadProjectService();
            if (!loaded) {
                store.showMessage('Proje servisi yüklenemedi, proje atamaları yapılamayabilir.', 'warning');
            }
        }

        // Düzenleme modu kontrolü
        if (duzenlemeModu.value) {
            // Admin kullanıcısı için özel kontrol
            if (yeniKullanici.value.email === 'deneme@deneme.com') {
                const sonuc = await authStore.updateUser(yeniKullanici.value.email, {
                    name: yeniKullanici.value.name,
                    password: yeniKullanici.value.password || undefined
                });
                
                if (sonuc.success) {
                    store.showMessage('Admin kullanıcı bilgileri güncellendi', 'success');
                    showModal.value = false;
                } else {
                    store.showMessage(sonuc.message || 'Kullanıcı güncellenirken bir hata oluştu', 'error');
                }
                yukleniyor.value = false;
                return;
            }
            
            // Kullanıcının mevcut proje ID'lerini al (güncelleme öncesi)
            let mevcutProjeIdleri: string[] = [];
            try {
                // Kullanıcıyı tekrar çekerek en güncel projectIds'i alalım
                const allUsers = await authStore.getAllUsers();
                const guncelKullaniciData = allUsers.find(user => user.id === yeniKullanici.value.id);
                if (guncelKullaniciData && Array.isArray((guncelKullaniciData as UserWithProject).projectIds)) {
                    mevcutProjeIdleri = [...(guncelKullaniciData as UserWithProject).projectIds];
                }
            } catch (fetchError) {
                console.error("Güncelleme öncesi kullanıcı projeleri alınamadı:", fetchError);
                // Opsiyonel: Hata durumunda işlemi durdurabilir veya devam edebiliriz. Şimdilik devam ediyoruz.
            }
            
            // Kullanıcı güncelleme - proje ID'lerini de ekle
            const updateData: any = {
                name: yeniKullanici.value.name,
                role: yeniKullanici.value.role,
                isActive: yeniKullanici.value.isActive,
                phone: yeniKullanici.value.phone || '', // Telefonu ekle
                projectIds: yeniKullanici.value.projectIds || [], // Proje ID'lerini ekle
                // projectId: yeniKullanici.value.projectId || null // Eski projectId'yi kaldırabilir veya null yapabiliriz, projectIds kullanıldığı için
            };

            // Conditional fields
            if (yeniKullanici.value.password) {
                updateData.password = yeniKullanici.value.password;
            }

            if (yeniKullanici.value.role === 'user' || yeniKullanici.value.role === 'depo_sorumlusu') {
                updateData.depot = yeniKullanici.value.depot;
            } else {
                updateData.depot = null;
            }

            const sonuc = await authStore.updateUser(yeniKullanici.value.email, updateData);

            if (sonuc.success) {
                // Kullanıcı dokümanı güncellendi, şimdi userProjects koleksiyonunu senkronize et
                await kullaniciProjeIliskileriniGuncelle(yeniKullanici.value.id, yeniKullanici.value.projectIds, mevcutProjeIdleri);
                
                store.showMessage('Kullanıcı başarıyla güncellendi', 'success');
                showModal.value = false;
                // Kullanıcı listesini yenile
                await kullanicilariYukle();
            } else {
                store.showMessage(sonuc.message || 'Kullanıcı güncellenirken bir hata oluştu', 'error');
            }
        } else {
            // Yeni kullanıcı ekleme - çoklu proje seçimi için güncellendi
            const userData: any = {
                id: '',
                canEdit: true,
                email: yeniKullanici.value.email,
                password: yeniKullanici.value.password || '',
                name: yeniKullanici.value.name,
                role: yeniKullanici.value.role,
                isActive: yeniKullanici.value.isActive,
                lastLogin: '',
                createdAt: new Date().toISOString(),
                avatar: '/assets/images/profile-34.jpeg',
                phone: yeniKullanici.value.phone || '',
                projectIds: yeniKullanici.value.projectIds || [], // Çoklu proje seçimi
                // projectId: ... // Eski projectId'yi kaldırabiliriz
            };
            
            // Sadece depo sorumlusu ise depot değerini ekle
            if (yeniKullanici.value.role === 'user' || yeniKullanici.value.role === 'depo_sorumlusu') {
                userData.depot = yeniKullanici.value.depot;
            }            const sonuc = await authStore.addUser(userData);

            if (sonuc.success) {
                // Kullanıcı başarıyla oluşturuldu, şimdi userProjects ilişkilerini güncelle
                if (sonuc.user?.id) {
                    // Eklenen kullanıcının ID'si ile proje ilişkilerini oluştur
                    try {
                        await kullaniciProjeIliskileriniGuncelle(sonuc.user.id, yeniKullanici.value.projectIds);
                        console.log(`Yeni kullanıcı ${sonuc.user.id} için proje ilişkileri oluşturuldu`);
                    } catch (projeError) {
                        console.error('Proje ilişkileri oluşturulurken hata:', projeError);
                        store.showMessage('Kullanıcı eklendi ancak proje ilişkileri oluşturulurken hata oluştu', 'warning');
                    }
                } else {
                    console.warn('Kullanıcı ekleme başarılı oldu ancak userId dönmedi, proje ilişkileri kurulamadı');
                }
                
                store.showMessage('Kullanıcı başarıyla eklendi', 'success');
                showModal.value = false;
                // Kullanıcı listesini yenile
                await kullanicilariYukle();
            } else {
                store.showMessage(sonuc.message || 'Kullanıcı eklenirken bir hata oluştu', 'error');
            }
        }

        yukleniyor.value = false;
    } catch (error) {
        console.error('Kullanıcı kaydedilirken hata:', error);
        store.showMessage('Kullanıcı kaydedilirken bir hata oluştu', 'error');
        yukleniyor.value = false;
    }
};


// Auth kontrolleri - sadece admin kullanıcının bu sayfaya erişimi olmalı
const kullaniciYetkisiKontrol = () => {
    if (!authStore.isAdmin) {
        // Yetkisiz kullanıcıyı anasayfaya yönlendir
        // router.push('/');
    }
};

onMounted(async () => {
    try {
        // Önce projectService'i yükle
        await loadProjectService();
        
        // Mevcut kodlar muhafaza edildi
        kullaniciYetkisiKontrol();
        const usersStore = useUsersStore();
        
        // Önce projeleri yükleyelim
        await projeleriYukle();
        
        // Sonra diğer işlemlere devam edelim
        await kullanicilariYukle();
        await inventoryStore.initializeStore();
        
        // Kullanıcı listesi boşsa, varsayılan kullanıcıları yükle
        if (!usersStore.users || usersStore.users.length === 0) {
            console.log('Kullanıcı listesi boş, store yeniden başlatılıyor...');
            usersStore.resetToDefaults();
            usersStore.initializeStore();
        }
    } catch (error) {
        console.error('Sayfa yüklenirken bir hata oluştu:', error);
        store.showMessage('Sayfa yüklenirken bir hata oluştu, lütfen sayfayı yenileyin', 'error');
    }
});

// Yeni kullanıcı eklerken proje değişkeninin sıfırlanması - çoklu proje seçimi için güncellendi
const yeniKullaniciEkle = () => {
    duzenlemeModu.value = false;
    yeniKullanici.value = {
        email: '',
        id: '',
        canEdit: true,
        password: '',
        name: '',
        role: 'user',
        isActive: true,
        lastLogin: '',
        avatar: '/assets/images/profile-34.jpeg',
        phone: '',
        depot: null,
        projectId: '', // Geriye dönük uyumluluk için boş bırakıyoruz
        projectIds: [] // Çoklu proje seçimi için boş array
    };
    formHatalari.value = {};
    showModal.value = true;
};

// Kullanıcı bağlantılı proje adını getiren yardımcı fonksiyon
const kullaniciProjeAdiGetir = (projeId?: string) => {
    if (!projeId) return '-';
    const bulunanProje = projeler.value.find(p => p.id === projeId);
    return bulunanProje ? bulunanProje.name : projeId;
};

// Kullanıcı silme fonksiyonları
const kullaniciSil = (kullanici: ValidUser) => {
    // Silinecek kullanıcıyı ayarla ve silme modalını göster
    silinecekKullanici.value = kullanici;
    showDeleteModal.value = true;
};

// Silme onay fonksiyonu
const silmeOnayla = async () => {
    try {
        yukleniyor.value = true;
        
        if (silinecekKullanici.value.email === 'deneme@deneme.com') {
            store.showMessage('Admin kullanıcısı silinemez', 'error');
            return;
        }
        
        const sonuc = await authStore.deleteUser(silinecekKullanici.value.email);
        
        if (sonuc.success) {
            store.showMessage('Kullanıcı başarıyla silindi', 'success');
            showDeleteModal.value = false;
            // Kullanıcı listesini yenile
            await kullanicilariYukle();
        } else {
            store.showMessage(sonuc.message || 'Kullanıcı silinirken bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        store.showMessage('Kullanıcı silinirken bir hata oluştu', 'error');
    } finally {
        yukleniyor.value = false;
        showDeleteModal.value = false;
    }
};

// Sayfa sayısı hesaplama
const sayfaSayisi = computed(() => {
    if (!kullanicilar.value || kullanicilar.value.length === 0) return 1;
    return Math.ceil(kullanicilar.value.length / sayfaBasinaKayit.value);
});

// Sayfa değiştirme fonksiyonu - eksikti, ekliyoruz
const sayfaDegistir = (sayfa: number) => {
    if (sayfa < 1 || sayfa > sayfaSayisi.value) return;
    sayfaNo.value = sayfa;
};

// Kullanıcı tipi çeviri fonksiyonu - eksikti, ekliyoruz
const kullaniciTipiGetir = (tip: string): string => {
    switch (tip) {
        case 'admin': return 'Admin';
        case 'user': return 'Depo Sorumlusu';
        case 'observer': return 'Gözlemci';
        case 'depo_sorumlusu': return 'Depo Sorumlusu';
        case 'proje_admin': return 'Proje Yöneticisi';
        case 'ariza_merkez': return 'Arıza Merkezi';
        default: return tip;
    }
};

// Kullanıcı-Proje ilişkilerini güncelleyen yardımcı fonksiyon
const kullaniciProjeIliskileriniGuncelle = async (userId: string, yeniProjeIdleri: string[], eskiProjeIdleri: string[] = []) => {
    if (!projectService.value || !userId) {
        console.error('projectService yüklenmemiş veya userId boş');
        return; 
    }

    console.log(`Kullanıcı-proje ilişkileri güncelleniyor. UserId: ${userId}`);
    console.log('Eski projeler:', eskiProjeIdleri);
    console.log('Yeni projeler:', yeniProjeIdleri);

    const eklenecekler = yeniProjeIdleri.filter(id => !eskiProjeIdleri.includes(id));
    const kaldirilacaklar = eskiProjeIdleri.filter(id => !yeniProjeIdleri.includes(id));

    console.log('Eklenecek projeler:', eklenecekler);
    console.log('Kaldırılacak projeler:', kaldirilacaklar);

    // Rol olarak kullanıcının ana rolünü kullan 
    // (proje içinde daha spesifik bir rol yapısı oluşturabilirsiniz)
    const userRole = yeniKullanici.value.role || 'user'; 

    // Eklenecek projeler için işlemleri yap
    for (const projectId of eklenecekler) {
        try {
            await projectService.value.addUserToProject(userId, projectId, userRole);
            console.log(`Kullanıcı ${userId}, proje ${projectId}'e eklendi.`);
        } catch (error) {
            console.error(`Kullanıcı ${userId}, proje ${projectId}'e eklenirken hata:`, error);
            store.showMessage(`Kullanıcı proje ${projectId}'e eklenirken hata oluştu.`, 'error');
            // Hata durumunda devam et, diğerlerini deneyelim
        }
    }

    // Kaldırılacak projeler için işlemleri yap
    for (const projectId of kaldirilacaklar) {
        try {
            await projectService.value.removeUserFromProject(userId, projectId);
            console.log(`Kullanıcı ${userId}, proje ${projectId}'den kaldırıldı.`);
        } catch (error) {
            console.error(`Kullanıcı ${userId}, proje ${projectId}'den kaldırılırken hata:`, error);
            store.showMessage(`Kullanıcı proje ${projectId}'den kaldırılırken hata oluştu.`, 'error');
            // Hata durumunda devam et
        }
    }
};
</script>