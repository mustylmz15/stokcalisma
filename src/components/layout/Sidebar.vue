<template>
    <div :class="{ 'dark text-white-dark': store.semidark }">
        <nav class="sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300">
            <div class="bg-white dark:bg-[#0e1726] h-full">
                <div class="flex justify-between items-center px-4 py-3">
                    <router-link to="/" class="main-logo flex items-center shrink-0">
                        <img class="w-8 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="" />
                        <span class="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">UGES STOK</span>
                    </router-link>
                    <a
                        href="javascript:;"
                        class="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180 hover:text-primary"
                        @click="store.toggleSidebar()"
                    >
                        <icon-carets-down class="m-auto rotate-90" />
                    </a>
                </div>
                <div class="h-[calc(100vh-80px)] relative overflow-y-auto overflow-x-hidden p-4 py-0">
                    <ul class="relative font-semibold space-y-0.5">
                        <li class="nav-item">
                            <router-link to="/" class="nav-link group" @click="toggleMobileMenu">
                                <div class="flex items-center">
                                    <icon-menu-dashboard class="group-hover:!text-primary shrink-0" />
                                    <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                        Dashboard
                                    </span>
                                </div>
                            </router-link>
                        </li>

                        <!-- Applications Menu -->
                        <h2 class="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                            <icon-minus class="w-4 h-5 flex-none hidden" />
                            <span>Uygulamalar</span>
                        </h2>

                        <li class="menu nav-item">
                            <button
                                type="button"
                                class="nav-link group w-full"
                                :class="{ active: activeDropdown === 'apps' }"
                                @click="activeDropdown === 'apps' ? (activeDropdown = '') : (activeDropdown = 'apps')"
                            >
                                <div class="flex items-center">
                                    <icon-menu-apps class="group-hover:!text-primary shrink-0" />
                                    <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                        Uygulamalar
                                    </span>
                                </div>
                                <div :class="{ 'rtl:rotate-90 -rotate-90': activeDropdown !== 'apps' }">
                                    <icon-caret-down />
                                </div>
                            </button>
                            <vue-collapsible :isOpen="activeDropdown === 'apps'">
                                <ul class="sub-menu text-gray-500">
                                    <li>
                                        <router-link to="/apps/chat" @click="toggleMobileMenu">Sohbet</router-link>
                                    </li>
                                    <li>
                                        <router-link to="/apps/mailbox" @click="toggleMobileMenu">Posta</router-link>
                                    </li>
                                    <li>
                                        <router-link to="/apps/todolist" @click="toggleMobileMenu">Yapılacaklar</router-link>
                                    </li>
                                    <li>
                                        <router-link to="/apps/notes" @click="toggleMobileMenu">Notlar</router-link>
                                    </li>
                                </ul>
                            </vue-collapsible>
                        </li>

                        <h2 class="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                            <icon-minus class="w-4 h-5 flex-none hidden" />
                            <span>Envanter Yönetimi</span>
                        </h2>
                        <li class="menu nav-item">
                            <button
                                type="button"
                                class="nav-link group w-full"
                                :class="{ active: activeDropdown === 'inventory' }"
                                @click="activeDropdown === 'inventory' ? (activeDropdown = '') : (activeDropdown = 'inventory')"
                            >
                                <div class="flex items-center">
                                    <icon-menu-widgets class="group-hover:!text-primary shrink-0" />
                                    <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                        ENVANTER
                                    </span>
                                </div>
                                <div :class="{ 'rtl:rotate-90 -rotate-90': activeDropdown !== 'inventory' }">
                                    <icon-caret-down />
                                </div>
                            </button>
                            <vue-collapsible :isOpen="activeDropdown === 'inventory'">
                                <ul class="sub-menu text-gray-500">
                                    <li>
                                        <router-link to="/inventory" @click="toggleMobileMenu">Anasayfa</router-link>
                                    </li>
                                    <li>
                                        <router-link to="/inventory/products" @click="toggleMobileMenu">Ürünler</router-link>
                                    </li>
                                    <li v-if="authStore.isAdmin">
                                        <router-link to="/inventory/categories" @click="toggleMobileMenu">Kategoriler</router-link>
                                    </li>
                                    <li>
                                        <router-link to="/inventory/movements" @click="toggleMobileMenu">Stok Hareketleri</router-link>
                                    </li>
                                    <li v-if="authStore.isAdmin">
                                        <router-link to="/inventory/warehouses" @click="toggleMobileMenu">Depolar</router-link>
                                    </li>
                                    <li>
                                        <router-link to="/inventory/reports" @click="toggleMobileMenu">Stok Raporları</router-link>
                                    </li>
                                </ul>
                            </vue-collapsible>
                        </li>
                        
                        <h2 class="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                            <icon-minus class="w-4 h-5 flex-none hidden" />
                            <span>Kullanıcı ve Sayfalar</span>
                        </h2>

                        <!-- Profil ve Hesap Ayarları Menüsü (Herkes görebilir) -->
                        <li class="menu nav-item">
                            <button type="button" class="nav-link group w-full"
                                :class="{ active: activeDropdown === 'profile' }"
                                @click="activeDropdown === 'profile' ? (activeDropdown = '') : (activeDropdown = 'profile')">
                                <div class="flex items-center">
                                    <icon-menu-users class="group-hover:!text-primary shrink-0" />
                                    <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                        Profil
                                    </span>
                                </div>
                                <div :class="{ 'rtl:rotate-90 -rotate-90': activeDropdown !== 'profile' }">
                                    <icon-caret-down />
                                </div>
                            </button>
                            <vue-collapsible :isOpen="activeDropdown === 'profile'">
                                <ul class="sub-menu text-gray-500">
                                    <li>
                                        <router-link to="/users/profile" @click="toggleMobileMenu">Profil</router-link>
                                    </li>
                                </ul>
                            </vue-collapsible>
                        </li>

                        <!-- Kullanıcı Yönetimi Menüsü (Sadece admin görebilir) -->
                        <li v-if="!authStore.isObserver && authStore.isAdmin" class="menu nav-item">
                            <router-link to="/users/kullanici-yonetimi" class="nav-link group" @click="toggleMobileMenu">
                                <div class="flex items-center">
                                    <icon-menu-users class="group-hover:!text-primary shrink-0" />
                                    <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                        Kullanıcı Yönetimi
                                    </span>
                                </div>
                            </router-link>
                        </li>
                        
                        <!-- Proje Yönetimi Menüsü (Sadece admin görebilir) - YENİ -->
                        <li v-if="authStore.isAdmin" class="menu nav-item">
                            <router-link to="/projeler" class="nav-link group" @click="toggleMobileMenu">
                                <div class="flex items-center">
                                    <icon-menu-widgets class="group-hover:!text-primary shrink-0" />
                                    <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                        Proje Yönetimi
                                    </span>
                                </div>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useAppStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth-store';
import VueCollapsible from 'vue-height-collapsible/vue3';
import IconCaretsDown from '@/components/icon/icon-carets-down.vue';
import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard.vue';
import IconMinus from '@/components/icon/icon-minus.vue';
import IconCaretDown from '@/components/icon/icon-caret-down.vue';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets.vue';
import IconMenuUsers from '@/components/icon/menu/icon-menu-users.vue';
import IconMenuAuthentication from '@/components/icon/menu/icon-menu-authentication.vue';
import IconMenuApps from '@/components/icon/menu/icon-menu-apps.vue';
import IconMenuPages from '@/components/icon/menu/icon-menu-pages.vue';

export default {
    components: {
        VueCollapsible,
        IconCaretsDown,
        IconMenuDashboard,
        IconMinus,
        IconCaretDown,
        IconMenuWidgets,
        IconMenuUsers,
        IconMenuAuthentication,
        IconMenuApps,
        IconMenuPages
    },
    setup() {
        const store = useAppStore();
        const authStore = useAuthStore();
        const activeDropdown = ref('');
        const subActive = ref('');

        onMounted(() => {
            const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
            if (selector) {
                selector.classList.add('active');
                const ul = selector.closest('ul.sub-menu');
                if (ul) {
                    let ele = ul.closest('li.menu')?.querySelectorAll('.nav-link') || [];
                    if (ele.length) {
                        ele[0].click();
                    }
                }
            }
        });

        const toggleMobileMenu = () => {
            if (window.innerWidth < 1024) {
                store.toggleSidebar();
            }
        };

        return {
            store,
            authStore,
            activeDropdown,
            subActive,
            toggleMobileMenu
        };
    }
};
</script>
