<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Kullanıcılar</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Profil</span>
            </li>
        </ul>
        <div class="pt-5">
            <div class="flex items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Profil</h5>
            </div>
            <TabGroup>                
                <TabList class="flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                    <Tab as="template" v-slot="{ selected }">
                        <a
                            href="javascript:;"
                            class="flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary !outline-none"
                            :class="{ '!border-primary text-primary': selected }"
                        >
                            <icon-user class="w-5 h-5" />
                            Profil
                        </a>
                    </Tab>
                    <Tab as="template" v-slot="{ selected }">
                        <a
                            href="javascript:;"
                            class="flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary !outline-none"
                            :class="{ '!border-primary text-primary': selected }">
                            <icon-settings class="w-5 h-5" />
                            Hesap Ayarları
                        </a>
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
            <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                <div class="panel">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Profil</h5>
                        <router-link to="/users/user-account-settings" class="ltr:ml-auto rtl:mr-auto btn btn-primary p-2 rounded-full">
                            <icon-pencil-paper />
                        </router-link>
                    </div>
                    <div class="mb-5">
                        <div class="flex flex-col justify-center items-center">
                            <img :src="authStore.userInfo?.avatar || '/assets/images/user-profile.jpeg'" alt="" class="w-24 h-24 rounded-full object-cover mb-5" />
                            <p class="font-semibold text-primary text-xl">{{authStore.userInfo?.name}}</p>
                        </div>
                        <ul class="mt-5 flex flex-col max-w-[240px] m-auto space-y-4 font-semibold text-white-dark">
                            <li class="flex items-center gap-2">
                                <icon-coffee class="shrink-0" />
                                <span  v-if="authStore.userInfo?.role === 'admin'">
                                    Admin Kullanıcısı
                                </span>
                                <span  v-else-if="authStore.userInfo?.role === 'user'">
                                    {{ authorizedDepotName }}.Bölge Depo Sorumlusu
                                </span>
                                <span  v-else="authStore.userInfo?.role === 'observer'">
                                    {{ authorizedDepotName }}.Bölge Gözlemci
                                </span>
                            </li>
                            <li class="flex items-center gap-2">
                                <icon-calendar class="shrink-0" />
                                <span  v-if="authStore.userInfo?.role === 'user'">
                                    <b>{{ authorizedDepotName }}. bölge</b>
                                </span> 
                                <span  v-else-if="authStore.userInfo?.role === 'admin'">
                                    {{ authorizedDepotName }}
                                </span> 
                                <span  v-if="authStore.userInfo?.role === 'observer'">
                                    {{ authorizedDepotName }}
                                </span> 
                                    
                            </li>
                            <li class="flex items-center gap-2">
                                <icon-map-pin class="shrink-0" />
                                <div class="flex flex-wrap gap-1">
                                    <span v-if="projectDetails && projectDetails.length > 0">
                                        <span
                                            v-for="project in projectDetails"
                                            :key="project.id"
                                            :class="`text-${project.color || 'primary'}`"
                                        >
                                            {{ project.name }}{{ projectDetails.indexOf(project) < projectDetails.length - 1 ? ',' : '' }}
                                        </span>
                                    </span>
                                    <span v-else-if="userProjects && userProjects.length > 0">
                                        {{ userProjects.join(', ') }}
                                    </span>
                                    <span v-else>Proje atanmamış</span>
                                </div>
                            </li>
                            <li>
                                <a href="javascript:;" class="flex items-center gap-1">
                                    <icon-mail class="w-5 h-5 shrink-0" />
                                    <span class="text-primary truncate">{{ authStore.userInfo?.email || '' }}</span>
                                </a>
                            </li>
                            <li class="flex items-center gap-2">
                                <icon-phone />
                                <span class="whitespace-nowrap" dir="ltr">{{ authStore.userInfo?.phone}}</span>
                            </li>
                        </ul>
                        
                    </div>
                </div>
                <div class="panel lg:col-span-2 xl:col-span-3">
                    <div class="mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Kullanıcı Bilgileri</h5>
                    </div>
                    <div class="mb-5">
                        <div class="table-responsive text-[#515365] dark:text-white-light font-semibold">
                            <table class="whitespace-nowrap">
                                <thead>
                                    <tr>
                                        <th>Bilgi</th>
                                        <th>Değer</th>
                                    </tr>
                                </thead>
                                <tbody class="dark:text-white-dark">
                                    <tr>
                                        <td>İsim Soyisim</td>
                                        <td>{{ authStore.userInfo?.name || '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td>Bağlı Olduğu Projeler</td>
                                        <td>
                                            <div v-if="projectDetails && projectDetails.length > 0" class="flex flex-wrap gap-2">
                                                <span
                                                    v-for="project in projectDetails"
                                                    :key="project.id"
                                                    :class="`badge badge-outline-${project.color || 'primary'}`"
                                                    :title="project.description || 'Açıklama yok'"
                                                >
                                                    {{ project.name }}
                                                </span>
                                            </div>
                                            <div v-else-if="userProjects && userProjects.length > 0" class="flex flex-wrap gap-2">
                                                <span
                                                    v-for="(projectName, index) in userProjects"
                                                    :key="index"
                                                    class="badge badge-outline-primary"
                                                >
                                                    {{ projectName }}
                                                </span>
                                            </div>
                                            <div v-else>Henüz proje atanmamış</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Bağlı Olduğu Depo</td>
                                        <td>
                                            <span v-if="authStore.userInfo?.role === 'admin'">
                                                Admin Kullanıcısı
                                            </span>
                                            <span v-else>
                                                {{ authorizedDepotName }}. Bölge
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>E-posta Adresi</td>
                                        <td>
                                            <a href="mailto:{{ authStore.userInfo?.email }}" class="text-primary">{{ authStore.userInfo?.email || '-' }}</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Telefon</td>
                                        <td>{{ authStore.userInfo?.phone || '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td>Kullanıcı Rolü</td>
                                        <td>
                                            <span v-if="authStore.userInfo?.role === 'admin'" class="badge badge-outline-primary">Admin</span>
                                            <span v-else-if="authStore.userInfo?.role === 'user'" class="badge badge-outline-info">Depo Sorumlusu</span>
                                            <span v-else-if="authStore.userInfo?.role === 'observer'" class="badge badge-outline-secondary">Gözlemci</span>
                                            <span v-else class="badge badge-outline-dark">{{ authStore.userInfo?.role }}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Son Giriş</td>
                                        <td>{{ formatDate(authStore.userInfo?.lastLogin) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
           
                    </TabPanel>
                    <TabPanel>
                        <div class="grid grid-cols-1 gap-5">
                            <div class="panel">
                                <form @submit.prevent="handleSubmit" class="space-y-5">
                                    <h5 class="font-semibold text-lg mb-4">Hesap Ayarları</h5>
                                    
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label for="edit-name">Ad Soyad</label>
                                            <input
                                                id="edit-name"
                                                type="text"
                                                v-model="editableFormData.name"
                                                class="form-input"
                                                placeholder="Ad Soyad"
                                            />
                                        </div>
                                        <div>
                                            <label for="edit-email">E-posta</label>
                                            <input
                                                id="edit-email"
                                                type="email"
                                                v-model="editableFormData.email"
                                                class="form-input"
                                                placeholder="E-posta"
                                            />
                                        </div>
                                        <div>
                                            <label for="edit-phone">Telefon</label>
                                            <input
                                                id="edit-phone"
                                                type="text"
                                                v-model="editableFormData.phone"
                                                class="form-input"
                                                placeholder="Telefon"
                                            />
                                        </div>
                                    </div>

                                    <div class="border-t border-[#ebedf2] dark:border-[#191e3a] pt-4 mt-4">
                                        <h6 class="font-semibold mb-3">Şifre Değiştir</h6>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label for="current-password">Mevcut Şifre</label>
                                                <input
                                                    id="current-password"
                                                    type="password"
                                                    v-model="editableFormData.currentPassword"
                                                    class="form-input"
                                                    placeholder="Mevcut Şifre"
                                                />
                                            </div>
                                            <div>
                                                <label for="new-password">Yeni Şifre</label>
                                                <input
                                                    id="new-password"
                                                    type="password"
                                                    v-model="editableFormData.newPassword"
                                                    class="form-input"
                                                    placeholder="Yeni Şifre"
                                                />
                                            </div>
                                            <div>
                                                <label for="confirm-password">Yeni Şifre Tekrar</label>
                                                <input
                                                    id="confirm-password"
                                                    type="password"
                                                    v-model="editableFormData.confirmPassword"
                                                    class="form-input"
                                                    placeholder="Yeni Şifre Tekrar"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex justify-end mt-4">
                                        <button
                                            type="submit"
                                            class="btn btn-primary"
                                            :disabled="isSubmitting"
                                        >
                                            {{ isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet' }}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </TabPanel>
                </TabPanels>
            </TabGroup>
        </div>
    </div>
</template>
<script lang="ts" setup>
    import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
    import { useAppStore } from '@/stores/index';
    import { useAuthStore } from '@/stores/auth-store';
    import { useUsersStore } from '@/stores/users';
    import { useMeta } from '@/composables/use-meta';
    import { reactive, onMounted, ref, computed, onUnmounted } from 'vue';
    import {useInventoryStore} from '@/stores/inventory.js';
    import { db } from '@/firebase';
    import { doc, getDoc } from 'firebase/firestore';

    import IconPencilPaper from '@/components/icon/icon-pencil-paper.vue';
    import IconCoffee from '@/components/icon/icon-coffee.vue';
    import IconCalendar from '@/components/icon/icon-calendar.vue';
    import IconMapPin from '@/components/icon/icon-map-pin.vue';
    import IconMail from '@/components/icon/icon-mail.vue';
    import IconPhone from '@/components/icon/icon-phone.vue';
    import IconShoppingBag from '@/components/icon/icon-shopping-bag.vue';
    import IconTag from '@/components/icon/icon-tag.vue';
    import IconCreditCard from '@/components/icon/icon-credit-card.vue';
    import IconClock from '@/components/icon/icon-clock.vue';
    import IconHorizontalDots from '@/components/icon/icon-horizontal-dots.vue';
    import IconSettings from '@/components/icon/icon-settings.vue';
    import IconUser from '@/components/icon/icon-user.vue';
    
    useMeta({ title: 'User Profile' });
    const store = useAppStore();
    const authStore = useAuthStore();
    const inventoryStore = useInventoryStore();
    
    // Depo koduna göre depo adını bulan fonksiyon
    const getWarehouseNameByCode = (code) => {
        if (!code) return 'Tanımsız';
        try {
            console.log("Aranılan depo kodu:", code);
            console.log("Mevcut tüm depolar:", inventoryStore.warehouses);
            const warehouse = inventoryStore.warehouses.find(w => w.code === code);
            console.log("Bulunan depo:", warehouse);
            
            if (warehouse) {
                return warehouse.name;
            }
            
            // Depoya direkt kod ile ulaşılamadıysa, depo ID'si olarak dene
            const warehouseById = inventoryStore.warehouses.find(w => w.id === code);
            if (warehouseById) {
                return warehouseById.name;
            }
            
            return code || 'Tanımsız'; // En kötü durumda kod değerini göster
        } catch (error) {
            console.error("Depo ismi bulunurken hata:", error);
            return code || 'Tanımsız';
        }
    };
    
    // Kullanıcının yetkili olduğu depo adını computed property olarak tanımlayalım
    const authorizedDepotName = computed(() => {
        const userInfo = authStore.userInfo as any;
        if (!userInfo) return 'Tanımsız';
        
        // Kullanıcı verisindeki potansiyel depo alanlarını kontrol et
        console.log("Kullanıcı depo bilgisi - authorizedDepot:", userInfo.authorizedDepot);
        console.log("Kullanıcı depo bilgisi - depot:", userInfo.depot);
        console.log("Kullanıcı depo bilgisi - warehouse:", userInfo.warehouse);
        
        // Depo değerini çeşitli alanlardan bulmayı dene
        const depotCode = userInfo.authorizedDepot || userInfo.depot || userInfo.warehouse;
        
        return getWarehouseNameByCode(depotCode);
    });
    
    // Proje verilerini insan okunabilir formata dönüştüren yardımcı fonksiyon
    const formatProjects = (projectData: any): string[] => {
        try {
            if (!projectData) return [];
            
            // Eğer direkt string array ise, aynen göster
            if (Array.isArray(projectData) && projectData.length > 0) {
                return projectData.map(project => {
                    // Eğer proje bir obje ise ve name özelliği varsa
                    if (typeof project === 'object' && project !== null) {
                        if (project.name) return project.name;
                        if (project.id) return project.id;
                    }
                    
                    // Eğer proje bir string ise aynen göster
                    if (typeof project === 'string') {
                        return project;
                    }
                    
                    return 'Bilinmeyen Proje';
                });
            }
            
            // Proje bir obje ise
            if (typeof projectData === 'object' && projectData !== null && !Array.isArray(projectData)) {
                return Object.keys(projectData);
            }
            
            return [fallbackProjectNames.default];
        } catch (error) {
            console.error('Proje formatlanırken hata:', error);
            return ['Format hatası'];
        }
    };
    
    // Kullanıcı projeleri için computed property
    const userProjects = computed(() => {
        try {
            // Firebase'den gelen proje detayları varsa onları kullan
            if (projectDetails.value && projectDetails.value.length > 0) {
                return projectDetails.value.map(project => project.name || project.id);
            }
            
            // Firebase'den veri gelmezse yerel map'ten al
            const user = authStore.userInfo;
            if (!user) return ['Kullanıcı bilgisi yüklenemedi'];
            
            // Projeleri önce userInfo nesnesinden almayı dene
            if ((user as any).projectIds && Array.isArray((user as any).projectIds)) {
                // projectIds dizisini formatla
                return formatProjects((user as any).projectIds);
            }
            
            // projects dizisini kontrol et
            if ((user as any).projects) {
                // projects dizisini formatla
                return formatProjects((user as any).projects);
            }
            
            // Tek bir proje varsa kontrol et
            if ((user as any).projectId) {
                // projectId'yi formatla
                return formatProjects([(user as any).projectId]);
            }
            
            // hiçbir proje bilgisi bulunamazsa
            return ['Genel Kullanıcı'];
        } catch (error) {
            console.error('Kullanıcı projeleri hesaplanırken hata:', error);
            return ['Yüklenirken hata oluştu'];
        }
    });
    
    
    const formData = reactive({
        name: '',
        email: '',
        role: '',
        phone: '',
        warehouse: '',
        avatar: '',
        lastLogin: '',
        permissionLevel: ''
    });
    
    const editableFormData = reactive({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const isSubmitting = ref(false);
    const unsubscribeRef = ref(null);
    
    // Projeler için ref tanımlama
    const projectDetails = ref<Array<{ 
        id: string; 
        name: string; 
        description: string; 
        color: string; 
        isActive: boolean 
    }>>([]);
    
    // Sadece fallback olarak bazı proje adlarını saklayalım (eğer projeler koleksiyonu okunamazsa)
    const fallbackProjectNames = {
        'default': 'Genel Kullanıcı'
    };
    
    // Firebase'den proje detaylarını getiren fonksiyon
    const getProjectDetails = async (projectIds: any[]): Promise<Array<{ 
        id: string; 
        name: string; 
        description: string; 
        color: string; 
        isActive: boolean 
    }>> => {
        try {
            if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
                return [];
            }
            
            const details: Array<{ 
                id: string; 
                name: string; 
                description: string; 
                color: string; 
                isActive: boolean 
            }> = [];
            
            // Firebase'deki projects koleksiyonundan verileri çek
            for (const pid of projectIds) {
                let projectId = pid;
                // Eğer object ise, id'sini kullan
                if (typeof pid === 'object' && pid !== null) {
                    projectId = pid.id || '';
                }
                
                // Boş ID'leri işleme
                if (!projectId) continue;
                
                try {
                    const projectDoc = await getDoc(doc(db, 'projects', projectId));
                    if (projectDoc.exists()) {
                        const projectData = projectDoc.data();
                        details.push({
                            id: projectDoc.id,
                            name: projectData.name || projectDoc.id, // Proje adı yoksa ID'sini göster
                            description: projectData.description || '',
                            color: projectData.color || 'primary',
                            isActive: projectData.isActive !== false
                        });
                    } else {
                        // Proje bulunamadıysa veya silinmişse, ID ile ekle
                        details.push({
                            id: projectId,
                            name: projectId, // Sadece ID'sini göster
                            description: 'Proje detayları bulunamadı',
                            color: 'warning',
                            isActive: true
                        });
                    }
                } catch (error) {
                    console.error(`Proje detayları alınırken hata (${projectId}):`, error);
                }
            }
            
            return details;
        } catch (error) {
            console.error('Proje detayları alınırken genel hata:', error);
            return [];
        }
    };
    
    // Tarih formatlamak için yardımcı fonksiyon
    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        
        try {
            // Firebase timestamp veya date objesi kontrolü
            let date;
            if (timestamp instanceof Date) {
                date = timestamp;
            } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                // Firebase timestamp objesi
                date = new Date(timestamp.seconds * 1000);
            } else {
                // String veya number olarak tarih
                date = new Date(timestamp);
            }
            
            // Geçerli bir tarih kontrolü
            if (isNaN(date.getTime())) {
                return '-';
            }
            
            // Türkçe tarih formatı: GG.AA.YYYY HH:MM
            return date.toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Tarih formatlanırken hata:', error);
            return '-';
        }
    };

    onMounted(async () => {
        try {
            // Kullanıcı bilgilerini loglayalım
            if (authStore.userInfo) {
                console.log("Kullanıcı bilgileri:", authStore.userInfo);
                
                formData.name = authStore.userInfo.name || '';
                formData.email = authStore.userInfo.email || '';
                formData.role = authStore.userInfo.role || '';
                formData.phone = authStore.userInfo.phone || '';
                formData.warehouse = (authStore.userInfo as any).warehouse || '';
                formData.avatar = authStore.userInfo.avatar || '';
                formData.lastLogin = authStore.userInfo.lastLogin || '';
                formData.permissionLevel = (authStore.userInfo as any).permissionLevel || '';
        
                // Düzenlenebilir form verilerini de doldur
                editableFormData.name = authStore.userInfo.name || '';
                editableFormData.email = authStore.userInfo.email || '';
                editableFormData.phone = authStore.userInfo.phone || '';
                
                // Mevcut depo listesini konsola yazdır
                console.log("Mevcut depolar:", inventoryStore.warehouses);
                
                // Kullanıcı projelerini FireStore'dan getir
                await loadUserProjects();
            }
        } catch (error) {
            console.error("Profil sayfası yüklenirken hata:", error);
        }
    });
    
    // Kullanıcı projelerini yükleyen fonksiyon
    const loadUserProjects = async (): Promise<void> => {
        try {
            // Kullanıcı bilgilerini al
            const user = authStore.userInfo;
            if (!user) return;
            
            // Kullanıcı verisinin tamamını loglayalım (debug için)
            console.log("Kullanıcı verisi:", user);
            
            // Kullanıcı proje ID'lerini bul
            let projectIds: any[] = [];
            
            // Farklı proje veri yapılarını kontrol et ve hepsini dene
            if (Array.isArray((user as any).projectIds) && (user as any).projectIds.length > 0) {
                projectIds = (user as any).projectIds;
                console.log("projectIds alanından projeler bulundu:", projectIds);
            } else if (Array.isArray((user as any).projects) && (user as any).projects.length > 0) {
                projectIds = (user as any).projects;
                console.log("projects dizisinden projeler bulundu:", projectIds);
            } else if ((user as any).projects && typeof (user as any).projects === 'object') {
                projectIds = Object.keys((user as any).projects);
                console.log("projects objesinden projeler bulundu:", projectIds);
            } else if ((user as any).projectId) {
                projectIds = [(user as any).projectId];
                console.log("projectId alanından proje bulundu:", projectIds);
            }
            
            // Eğer yukarıdaki koşullar boş döndüyse, kullanıcı verisinde 'project' içeren alanları ara
            if (projectIds.length === 0) {
                console.log("Standart alanlarda proje bulunamadı, alternatif arama yapılıyor...");
                
                const allFields = Object.entries(user as any);
                for (const [key, value] of allFields) {
                    // Anahtar adında 'project' veya 'proje' geçen alanları ara
                    if (
                        key.toLowerCase().includes('project') || 
                        key.toLowerCase().includes('proje')
                    ) {
                        console.log(`Potansiyel proje alanı bulundu - ${key}:`, value);
                        
                        if (Array.isArray(value)) {
                            projectIds.push(...value);
                        } else if (typeof value === 'string') {
                            projectIds.push(value);
                        } else if (typeof value === 'object' && value !== null) {
                            // Obje ise, ya anahtarları ya da içindeki dizi/string değerleri ekle
                            const objKeys = Object.keys(value);
                            objKeys.forEach(objKey => {
                                const objValue = value[objKey];
                                if (typeof objValue === 'string' || typeof objValue === 'number') {
                                    projectIds.push(objKey);
                                }
                            });
                        }
                    }
                }
            }
            
            // Çoğaltılmış ve boş değerleri filtrele
            projectIds = [...new Set(projectIds)].filter(Boolean);
            console.log("Son işlenmiş proje ID'leri:", projectIds);
            
            // Proje detaylarını FireStore'dan al
            if (projectIds.length > 0) {
                const details = await getProjectDetails(projectIds);
                projectDetails.value = details;
                console.log("Yüklenen proje detayları:", details);
            } else {
                console.log("Hiç proje ID'si bulunamadı");
                projectDetails.value = [];
            }
        } catch (error) {
            console.error("Kullanıcı projeleri yüklenirken hata:", error);
        }
    };

    onUnmounted(() => {
        // Firebase dinleyicisini temizle
        if (unsubscribeRef.value) {
            unsubscribeRef.value;
        }
    });
    
    const handleSubmit = async () => {
        try {
            isSubmitting.value = true;
            
            // Telefon numarası doğrulama
            if (editableFormData.phone && !/^[0-9\s-+()]*$/.test(editableFormData.phone)) {
                store.showMessage('Geçerli bir telefon numarası giriniz!', 'error');
                return;
            }
            
            // Kullanıcı bilgilerini Firebase'de güncelle
            if (authStore.userInfo) {
                const updatedData = {
                    name: editableFormData.name,
                    phone: editableFormData.phone || '' // Boş string olarak gönder eğer undefined ise
                };
    
                // Firebase'de güncelleme yap
                const result = await authStore.updateUser(authStore.userInfo.email, updatedData);
                
                if (result.success) {
                    // Başarılı güncelleme sonrası local state'i güncelle
                    formData.name = editableFormData.name;
                    formData.phone = editableFormData.phone || '';
    
                    store.showMessage('Bilgileriniz başarıyla güncellendi!', 'success');
                } else {
                    throw new Error(result.message || 'Güncelleme sırasında bir hata oluştu');
                }
            }
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            store.showMessage('Bilgiler güncellenirken bir hata oluştu!', 'error');
        } finally {
            isSubmitting.value = false;
        }
    };
</script>
