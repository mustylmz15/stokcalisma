<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Kullanıcılar</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Hesap Ayarları</span>
            </li>
        </ul>
        <div class="pt-5">
            <div class="flex items-center justify-between mb-5">
                <h5 class="font-semibold text-lg dark:text-white-light">Ayarlar</h5>
            </div>
            <TabGroup>
                <TabList class="flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                    <Tab as="template" v-slot="{ selected }">
                        <a
                            href="javascript:;"
                            class="flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary !outline-none"
                            :class="{ '!border-primary text-primary': selected }"
                        >
                            <icon-user />
                            Genel Bilgiler
                        </a>
                    </Tab>
                    <Tab as="template" v-slot="{ selected }">
                        <a
                            href="javascript:;"
                            class="flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary !outline-none"
                            :class="{ '!border-primary text-primary': selected }"
                        >
                            <icon-user class="w-5 h-5" />
                            Profil Özeti
                        </a>
                    </Tab>
                    <Tab as="template" v-slot="{ selected }">
                        <a
                            href="javascript:;"
                            class="flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary !outline-none"
                            :class="{ '!border-primary text-primary': selected }"
                        >
                            <icon-user class="w-5 h-5" />
                            Ayarlar
                        </a>
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <div>
                            <form class="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-[#0e1726]">
                                <h6 class="text-lg font-bold mb-5">Genel Bilgiler</h6>
                                <div class="flex flex-col sm:flex-row">
                                    <div class="ltr:sm:mr-4 rtl:sm:ml-4 w-full sm:w-2/12 mb-5">
                                        <img :src="formData.avatar || '/assets/images/profile-34.jpeg'" alt="Profil Resmi" class="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover mx-auto" />
                                    </div>
                                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label for="name">Ad Soyad</label>
                                            <input id="name" type="text" v-model="formData.name" class="form-input" readonly />
                                        </div>
                                        <div>
                                            <label for="email">E-posta</label>
                                            <input id="email" type="email" v-model="formData.email" class="form-input" readonly />
                                        </div>
                                        <div>
                                            <label for="role">Rol</label>
                                            <input id="role" type="text" v-model="formData.role" class="form-input" readonly />
                                        </div>
                                        <div>
                                            <label for="phone">Telefon</label>
                                            <input id="phone" type="text" v-model="formData.phone" class="form-input" />
                                        </div>
                                        <div v-if="formData.role === 'depo_sorumlusu'">
                                            <label for="warehouse">Bağlı Olduğu Depo</label>
                                            <input id="warehouse" type="text" v-model="formData.warehouse" class="form-input" readonly />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="panel">
                                <div class="mb-5">
                                    <h5 class="font-semibold text-lg mb-4">Profil Özeti</h5>
                                    <div class="space-y-4">
                                        <div class="flex items-center">
                                            <span class="flex-shrink-0 w-1/4 text-gray-500 dark:text-gray-400">Son Giriş:</span>
                                            <span>{{ formData.lastLogin ? new Date(formData.lastLogin).toLocaleString() : '-' }}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="flex-shrink-0 w-1/4 text-gray-500 dark:text-gray-400">Hesap Durumu:</span>
                                            <span class="px-2 py-1 bg-success text-white rounded-full text-xs">Aktif</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="flex-shrink-0 w-1/4 text-gray-500 dark:text-gray-400">Yetki Seviyesi:</span>
                                            <span>{{ formData.permissionLevel || '-' }}</span>
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
import IconUser from '@/components/icon/icon-user.vue';
import { reactive, onMounted, ref } from 'vue';

useMeta({ title: 'Hesap Ayarları' });
const store = useAppStore();
const authStore = useAuthStore();

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

const handleSubmit = async () => {
    try {
        isSubmitting.value = true;
        // Şifre değişikliği kontrolü
        if (editableFormData.newPassword) {
            if (editableFormData.newPassword !== editableFormData.confirmPassword) {
                store.showMessage('Yeni şifre ve şifre tekrarı eşleşmiyor!', 'error');
                return;
            }
            if (!editableFormData.currentPassword) {
                store.showMessage('Mevcut şifrenizi girmelisiniz!', 'error');
                return;
            }
            
            // Mevcut şifreyi kontrol et
            const usersStore = useUsersStore();
            const currentUser = await usersStore.getUserByEmail(authStore.userInfo?.email || '');
            if (!currentUser || currentUser.password !== editableFormData.currentPassword) {
                store.showMessage('Mevcut şifreniz hatalı!', 'error');
                return;
            }
            
            // Şifreyi güncelle
            await authStore.updateUser(currentUser.email, {
                password: editableFormData.newPassword
            });
        }

        // Kullanıcı bilgilerini Firebase'de güncelle
        if (authStore.userInfo) {
            const updatedData = {
                name: editableFormData.name,
                phone: editableFormData.phone
            };

            // Firebase'de güncelleme yap
            const result = await authStore.updateUser(authStore.userInfo.email, updatedData);
            
            if (result.success) {
                // Başarılı güncelleme sonrası local state'i güncelle
                formData.name = editableFormData.name;
                formData.phone = editableFormData.phone;

                // AuthStore'u güncelle
                authStore.userInfo = {
                    ...authStore.userInfo,
                    ...updatedData
                };

                store.showMessage('Bilgileriniz başarıyla güncellendi!', 'success');
            } else {
                throw new Error(result.message || 'Güncelleme sırasında bir hata oluştu');
            }
        }
        
        // Şifre alanlarını sıfırla
        editableFormData.currentPassword = '';
        editableFormData.newPassword = '';
        editableFormData.confirmPassword = '';
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        store.showMessage('Bilgiler güncellenirken bir hata oluştu!', 'error');
    } finally {
        isSubmitting.value = false;
    }
};
</script>
