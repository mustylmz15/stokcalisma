import { createApp } from 'vue';
import { useToast } from 'vue-toastification';

import App from '@/App.vue';

// Pinia entegrasyonu
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// Firebase entegrasyonu
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// App oluştur
const app = createApp(App);

// Pinia kurulumu
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// Firebase servislerini import et
import inventoryService from '@/services/inventoryService';

import { useAuthStore } from './stores/auth-store';
import { useProjectStore } from './stores/projects';

// Firebase kimlik doğrulama durumunu dinle
onAuthStateChanged(auth, async (user) => {
    const authStore = useAuthStore();
    const projectStore = useProjectStore();

    // Auth store'un başlatıldığından emin olalım
    await authStore.initializeStore();

    // Oturum açmış kullanıcı için işlemleri yapalım
    if (user) {
        // Kullanıcının tüm verilerinin yüklenmesi için gerekli kod
        await projectStore.initializeStore();

        if (authStore.isLoggedIn) {
            const toast = useToast();
            try {
                // Envanter verilerini yükle
                await Promise.all([
                    inventoryService.getAllCategories(),
                    inventoryService.getAllProducts(),
                    inventoryService.getAllWarehouses(),
                    inventoryService.getAllStocks()
                ]);
                console.log('Firebase\'den envanter verileri yüklendi');
                console.log('Offline persistence etkin, internet bağlantısı olmadığında da veriler kullanılabilir olacak');
            } catch (error) {
                console.error('Envanter verilerini yükleme hatası:', error);
                toast.error('Envanter verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
            }
        }
    }

    // Auth store'un yüklendiğine emin olalım
    if(!authStore.authReady){
        authStore.authReady = true;
    }
});

import router from '@/router';
app.use(router);

// main app css
import '@/assets/css/app.css';

// perfect scrollbar
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
app.use(PerfectScrollbarPlugin);

//vue-meta
import { createHead } from '@vueuse/head';
const head = createHead();
app.use(head);

// set default settings
import appSetting from '@/app-setting';
appSetting.init();

//vue-i18n
import i18n from '@/i18n';
app.use(i18n);

// Global mixin olarak i18n metodlarını ekleyelim - $t fonksiyonunu template içinde kullanabilmek için
app.mixin({
    methods: {
        $t(key) {
            return i18n.global.t(key);
        }
    }
});

// tippy tooltips
import { TippyPlugin } from 'tippy.vue';
app.use(TippyPlugin);

//input mask
import { vMaska } from 'maska/vue';
app.directive('maska', vMaska);

//markdown editor
import VueEasymde from 'vue3-easymde';
import 'easymde/dist/easymde.min.css';
app.use(VueEasymde);

// popper
import Popper from 'vue3-popper';
app.component('Popper', Popper);

// json to excel
import vue3JsonExcel from 'vue3-json-excel';
app.use(vue3JsonExcel);

app.mount('#app');
