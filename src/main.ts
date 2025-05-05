import { createApp } from 'vue';
import Toast, { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css'; // Toast stillerini import ediyoruz
import App from '@/App.vue';

// Tüm importları dosya başına taşıyorum
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import inventoryService from '@/services/inventoryService';
import router from '@/router';
import '@/assets/css/app.css';
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
import { createHead } from '@vueuse/head';
import appSetting from '@/app-setting';
import i18n from '@/i18n';
import { TippyPlugin } from 'tippy.vue';
import { vMaska } from 'maska/vue';
import VueEasymde from 'vue3-easymde';
import 'easymde/dist/easymde.min.css';
import Popper from 'vue3-popper';
import vue3JsonExcel from 'vue3-json-excel';
// Store importları
import { useAuthStore } from './stores/auth-store';
import { useProjectStore } from './stores/projects';

// App oluştur
const app = createApp(App);

// Toast bildirim sistemi yapılandırması
app.use(Toast, {
    position: "top-right",
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false
});

// Pinia kurulumu
const pinia = createPinia();

// Persistedstate eklentisini sadece belirli store'lar için aktifleştir
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// Store'ları kullan

// Firebase kimlik doğrulama durumunu dinle - try-catch bloğu içine alarak hataları yönet
try {
    onAuthStateChanged(auth, async (user) => {
        try {
            const authStore = useAuthStore();
            const projectStore = useProjectStore();

            // Auth store'un başlatıldığından emin olalım
            await authStore.initializeStore();

            // Oturum açmış kullanıcı için işlemleri yapalım
            if (user) {
                try {
                    // Kullanıcının tüm verilerinin yüklenmesi için gerekli kod
                    await projectStore.initializeStore();                    if (authStore.isLoggedIn) {
                        try {
                            // Envanter verilerini yükle - her bir operasyonu ayrı try-catch bloğuyla sarmak daha güvenli
                            // Promise.all yerine sırayla çalıştıralım, daha yavaş ama daha güvenli
                            console.log('Envanter verilerini yükleme başlatılıyor...');
                            await inventoryService.getAllCategories();
                            await inventoryService.getAllProducts();
                            await inventoryService.getAllWarehouses();
                            await inventoryService.getAllStocks();
                            console.log('Firebase\'den envanter verileri yüklendi');
                        } catch (inventoryError) {
                            console.error('Envanter verilerini yükleme hatası:', inventoryError);
                            // Toast bildirim sistemi şu anda devre dışı, sadece konsola hata yazdır
                            console.error('Envanter verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
                        }
                    }
                } catch (projectError) {
                    console.error('Proje store başlatma hatası:', projectError);
                }
            }

            // Auth store'un yüklendiğine emin olalım
            if(!authStore.authReady){
                authStore.authReady = true;
            }
        } catch (authError) {
            console.error('Kimlik doğrulama hatası:', authError);
        }
    });
} catch (firebaseError) {
    console.error('Firebase başlatma hatası:', firebaseError);
}

// Router kullanımı
app.use(router);

// Perfect scrollbar kullanımı
app.use(PerfectScrollbarPlugin);

// Vue-meta başlık yönetimi
const head = createHead();
app.use(head);

// Varsayılan ayarları başlat
appSetting.init();

// i18n dil desteği
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
app.use(TippyPlugin);

// input mask
app.directive('maska', vMaska);

// markdown editor
app.use(VueEasymde);

// popper
app.component('Popper', Popper);

// json to excel
app.use(vue3JsonExcel);

app.mount('#app');
