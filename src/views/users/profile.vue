<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Users</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Profile</span>
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
                        <h5 class="font-semibold text-lg dark:text-white-light">Profile</h5>
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
                                    {{ authorizedDepotName }} Sorumlusu
                                </span>
                                <span  v-else="authStore.userInfo?.role === 'observer'">
                                    Gözlemci
                                </span>
                            </li>
                            <li class="flex items-center gap-2">
                                <icon-calendar class="shrink-0" />
                                <span  v-if="authStore.userInfo?.role === 'user'">
                                    <b>{{ authorizedDepotName }}</b>
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
                                Bağlı Olduğu Proje
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
                        <h5 class="font-semibold text-lg dark:text-white-light">Task</h5>
                    </div>
                    <div class="mb-5">
                        <div class="table-responsive text-[#515365] dark:text-white-light font-semibold">
                            <table class="whitespace-nowrap">
                                <thead>
                                    <tr>
                                        <th>Projects</th>
                                        <th>Progress</th>
                                        <th>Task Done</th>
                                        <th class="text-center">Time</th>
                                    </tr>
                                </thead>
                                <tbody class="dark:text-white-dark">
                                    <tr>
                                        <td>Figma Design</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-danger rounded-full w-[29.56%]"></div>
                                            </div>
                                        </td>
                                        <td class="text-danger">29.56%</td>
                                        <td class="text-center">2 mins ago</td>
                                    </tr>
                                    <tr>
                                        <td>Vue Migration</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-info rounded-full w-1/2"></div>
                                            </div>
                                        </td>
                                        <td class="text-success">50%</td>
                                        <td class="text-center">4 hrs ago</td>
                                    </tr>
                                    <tr>
                                        <td>Flutter App</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-warning rounded-full w-[39%]"></div>
                                            </div>
                                        </td>
                                        <td class="text-danger">39%</td>
                                        <td class="text-center">a min ago</td>
                                    </tr>
                                    <tr>
                                        <td>API Integration</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-success rounded-full w-[78.03%]"></div>
                                            </div>
                                        </td>
                                        <td class="text-success">78.03%</td>
                                        <td class="text-center">2 weeks ago</td>
                                    </tr>

                                    <tr>
                                        <td>Blog Update</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-secondary rounded-full w-full"></div>
                                            </div>
                                        </td>
                                        <td class="text-success">100%</td>
                                        <td class="text-center">18 hrs ago</td>
                                    </tr>
                                    <tr>
                                        <td>Landing Page</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-danger rounded-full w-[19.15%]"></div>
                                            </div>
                                        </td>
                                        <td class="text-danger">19.15%</td>
                                        <td class="text-center">5 days ago</td>
                                    </tr>
                                    <tr>
                                        <td>Shopify Dev</td>
                                        <td>
                                            <div class="h-1.5 bg-[#ebedf2] dark:bg-dark/40 rounded-full flex w-full">
                                                <div class="bg-primary rounded-full w-[60.55%]"></div>
                                            </div>
                                        </td>
                                        <td class="text-success">60.55%</td>
                                        <td class="text-center">8 days ago</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="panel">
                    <div class="mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Summary</h5>
                    </div>
                    <div class="space-y-4">
                        <div class="border border-[#ebedf2] rounded dark:bg-[#1b2e4b] dark:border-0">
                            <div class="flex items-center justify-between p-4 py-2">
                                <div
                                    class="grid place-content-center w-9 h-9 rounded-md bg-secondary-light dark:bg-secondary text-secondary dark:text-secondary-light shrink-0"
                                >
                                    <icon-shopping-bag />
                                </div>
                                <div class="ltr:ml-4 rtl:mr-4 flex items-start justify-between flex-auto font-semibold">
                                    <h6 class="text-white-dark text-[13px] dark:text-white-dark">
                                        Income <span class="block text-base text-[#515365] dark:text-white-light">$92,600</span>
                                    </h6>
                                    <p class="ltr:ml-auto rtl:mr-auto text-secondary">90%</p>
                                </div>
                            </div>
                        </div>
                        <div class="border border-[#ebedf2] rounded dark:bg-[#1b2e4b] dark:border-0">
                            <div class="flex items-center justify-between p-4 py-2">
                                <div class="grid place-content-center w-9 h-9 rounded-md bg-info-light dark:bg-info text-info dark:text-info-light shrink-0">
                                    <icon-tag />
                                </div>
                                <div class="ltr:ml-4 rtl:mr-4 flex items-start justify-between flex-auto font-semibold">
                                    <h6 class="text-white-dark text-[13px] dark:text-white-dark">
                                        Profit <span class="block text-base text-[#515365] dark:text-white-light">$37,515</span>
                                    </h6>
                                    <p class="ltr:ml-auto rtl:mr-auto text-info">65%</p>
                                </div>
                            </div>
                        </div>
                        <div class="border border-[#ebedf2] rounded dark:bg-[#1b2e4b] dark:border-0">
                            <div class="flex items-center justify-between p-4 py-2">
                                <div
                                    class="grid place-content-center w-9 h-9 rounded-md bg-warning-light dark:bg-warning text-warning dark:text-warning-light shrink-0"
                                >
                                    <icon-credit-card />
                                </div>
                                <div class="ltr:ml-4 rtl:mr-4 flex items-start justify-between flex-auto font-semibold">
                                    <h6 class="text-white-dark text-[13px] dark:text-white-dark">
                                        Expenses <span class="block text-base text-[#515365] dark:text-white-light">$55,085</span>
                                    </h6>
                                    <p class="ltr:ml-auto rtl:mr-auto text-warning">80%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel">
                    <div class="flex items-center justify-between mb-10">
                        <h5 class="font-semibold text-lg dark:text-white-light">Pro Plan</h5>
                        <a href="javascript:;" class="btn btn-primary">Renew Now</a>
                    </div>
                    <div class="group">
                        <ul class="list-inside list-disc text-white-dark font-semibold mb-7 space-y-2">
                            <li>10,000 Monthly Visitors</li>
                            <li>Unlimited Reports</li>
                            <li>2 Years Data Storage</li>
                        </ul>
                        <div class="flex items-center justify-between mb-4 font-semibold">
                            <p class="flex items-center rounded-full bg-dark px-2 py-1 text-xs text-white-light font-semibold">
                                <icon-clock class="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                                5 Days Left
                            </p>
                            <p class="text-info">$25 / month</p>
                        </div>
                        <div class="rounded-full h-2.5 p-0.5 bg-dark-light overflow-hidden mb-5 dark:bg-dark-light/10">
                            <div class="bg-gradient-to-r from-[#f67062] to-[#fc5296] w-full h-full rounded-full relative" style="width: 65%"></div>
                        </div>
                    </div>
                </div>
                <div class="panel">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Payment History</h5>
                    </div>
                    <div>
                        <div class="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            <div class="flex items-center justify-between py-2">
                                <h6 class="text-[#515365] font-semibold dark:text-white-dark">
                                    March<span class="block text-white-dark dark:text-white-light">Pro Membership</span>
                                </h6>
                                <div class="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                    <p class="font-semibold">90%</p>
                                    <div class="dropdown ltr:ml-4 rtl:mr-4">
                                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                                            <a href="javascript:;">
                                                <icon-horizontal-dots class="opacity-80 hover:opacity-100" />
                                            </a>
                                            <template #content="{ close }">
                                                <ul @click="close()" class="whitespace-nowrap">
                                                    <li>
                                                        <a href="javascript:;">View Invoice</a>
                                                    </li>
                                                    <li>
                                                        <a href="javascript:;">Download Invoice</a>
                                                    </li>
                                                </ul>
                                            </template>
                                        </Popper>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            <div class="flex items-center justify-between py-2">
                                <h6 class="text-[#515365] font-semibold dark:text-white-dark">
                                    February <span class="block text-white-dark dark:text-white-light">Pro Membership</span>
                                </h6>
                                <div class="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                    <p class="font-semibold">90%</p>
                                    <div class="dropdown ltr:ml-4 rtl:mr-4">
                                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                                            <a href="javascript:;">
                                                <icon-horizontal-dots class="opacity-80 hover:opacity-100" />
                                            </a>
                                            <template #content="{ close }">
                                                <ul @click="close()" class="whitespace-nowrap">
                                                    <li>
                                                        <a href="javascript:;">View Invoice</a>
                                                    </li>
                                                    <li>
                                                        <a href="javascript:;">Download Invoice</a>
                                                    </li>
                                                </ul>
                                            </template>
                                        </Popper>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center justify-between py-2">
                                <h6 class="text-[#515365] font-semibold dark:text-white-dark">
                                    January<span class="block text-white-dark dark:text-white-light">Pro Membership</span>
                                </h6>
                                <div class="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                    <p class="font-semibold">90%</p>
                                    <div class="dropdown ltr:ml-4 rtl:mr-4">
                                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                                            <a href="javascript:;">
                                                <icon-horizontal-dots class="opacity-80 hover:opacity-100" />
                                            </a>
                                            <template #content="{ close }">
                                                <ul @click="close()" class="whitespace-nowrap">
                                                    <li>
                                                        <a href="javascript:;">View Invoice</a>
                                                    </li>
                                                    <li>
                                                        <a href="javascript:;">Download Invoice</a>
                                                    </li>
                                                </ul>
                                            </template>
                                        </Popper>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Card Details</h5>
                    </div>
                    <div>
                        <div class="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            <div class="flex items-center justify-between py-2">
                                <div class="flex-none">
                                    <img src="/assets/images/card-americanexpress.svg" alt="" />
                                </div>
                                <div class="flex items-center justify-between flex-auto ltr:ml-4 rtl:mr-4">
                                    <h6 class="text-[#515365] font-semibold dark:text-white-dark">
                                        American Express <span class="block text-white-dark dark:text-white-light">Expires on 12/2025</span>
                                    </h6>
                                    <span class="badge bg-success ltr:ml-auto rtl:mr-auto">Primary</span>
                                </div>
                            </div>
                        </div>
                        <div class="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            <div class="flex items-center justify-between py-2">
                                <div class="flex-none">
                                    <img src="/assets/images/card-mastercard.svg" alt="" />
                                </div>
                                <div class="flex items-center justify-between flex-auto ltr:ml-4 rtl:mr-4">
                                    <h6 class="text-[#515365] font-semibold dark:text-white-dark">
                                        Mastercard <span class="block text-white-dark dark:text-white-light">Expires on 03/2025</span>
                                    </h6>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center justify-between py-2">
                                <div class="flex-none">
                                    <img src="/assets/images/card-visa.svg" alt="" />
                                </div>
                                <div class="flex items-center justify-between flex-auto ltr:ml-4 rtl:mr-4">
                                    <h6 class="text-[#515365] font-semibold dark:text-white-dark">
                                        Visa <span class="block text-white-dark dark:text-white-light">Expires on 10/2025</span>
                                    </h6>
                                </div>
                            </div>
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
        const warehouse = inventoryStore.warehouses.find(w => w.code === code);
        return warehouse ? warehouse.name : 'Tanımsız';
    };
    
    // Kullanıcının yetkili olduğu depo adını computed property olarak tanımlayalım
    const authorizedDepotName = computed(() => {
        return getWarehouseNameByCode((authStore.userInfo as any)?.authorizedDepot);
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

    onMounted(() => {
        if (authStore.userInfo) {
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
        }
    });

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
