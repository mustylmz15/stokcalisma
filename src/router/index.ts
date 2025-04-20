import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAppStore } from '@/stores/index';
import appSetting from '@/app-setting';
import { useAuthStore } from '@/stores/auth-store';

// Tüm bileşenleri lazy load olarak yükleyelim - hidrasyon hatalarını önlemek için
const routes: RouteRecordRaw[] = [
    // dashboard - lazy loading ile güncellendi
    { 
        path: '/', 
        name: 'home', 
        component: () => import('../views/index.vue'),
        meta: { layout: 'app' }
    },
    
    // authentication
    {
        path: '/auth/boxed-signin',
        name: 'boxed-signin',
        component: () => import(/* webpackChunkName: "auth-boxed-signin" */ '../views/auth/boxed-signin.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/auth/boxed-signup',
        name: 'boxed-signup',
        component: () => import(/* webpackChunkName: "auth-boxed-signup" */ '../views/auth/boxed-signup.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/auth/boxed-password-reset',
        name: 'boxed-password-reset',
        component: () => import(/* webpackChunkName: "auth-boxed-password-reset" */ '../views/auth/boxed-password-reset.vue'),
        meta: { layout: 'auth' },
    },

    // Projeler sayfası - YENİ
    {
        path: '/projeler',
        name: 'projeler',
        component: () => import(/* webpackChunkName: "projeler" */ '../views/projeler.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, layout: 'app' }
    },
    
    // Uygulamalar rotası - Geri eklendi
    {
        path: '/apps/chat',
        name: 'chat',
        component: () => import(/* webpackChunkName: "apps-chat" */ '../views/apps/chat.vue'),
    },
    {
        path: '/apps/mailbox',
        name: 'mailbox',
        component: () => import(/* webpackChunkName: "apps-mailbox" */ '../views/apps/mailbox.vue'),
    },
    {
        path: '/apps/todolist',
        name: 'todolist',
        component: () => import(/* webpackChunkName: "apps-todolist" */ '../views/apps/todolist.vue'),
    },
    {
        path: '/apps/notes',
        name: 'notes',
        component: () => import(/* webpackChunkName: "apps-notes" */ '../views/apps/notes.vue'),
    },
    {
        path: '/apps/scrumboard',
        name: 'scrumboard',
        component: () => import(/* webpackChunkName: "apps-scrumboard" */ '../views/apps/scrumboard.vue'),
    },
    {
        path: '/apps/contacts',
        name: 'contacts',
        component: () => import(/* webpackChunkName: "apps-contacts" */ '../views/apps/contacts.vue'),
    },
    {
        path: '/apps/calendar',
        name: 'calendar',
        component: () => import(/* webpackChunkName: "apps-calendar" */ '../views/apps/calendar.vue'),
    },
    {
        path: '/apps/invoice/list',
        name: 'invoice-list',
        component: () => import(/* webpackChunkName: "apps-invoice-list" */ '../views/apps/invoice/list.vue'),
    },
    {
        path: '/apps/invoice/preview',
        name: 'invoice-preview',
        component: () => import(/* webpackChunkName: "apps-invoice-preview" */ '../views/apps/invoice/preview.vue'),
    },
    {
        path: '/apps/invoice/add',
        name: 'invoice-add',
        component: () => import(/* webpackChunkName: "apps-invoice-add" */ '../views/apps/invoice/add.vue'),
    },
    {
        path: '/apps/invoice/edit',
        name: 'invoice-edit',
        component: () => import(/* webpackChunkName: "apps-invoice-edit" */ '../views/apps/invoice/edit.vue'),
    },
    
    // Users & Pages Rotaları - Geri Eklendi
    {
        path: '/users/profile',
        name: 'profile',
        component: () => import(/* webpackChunkName: "users-profile" */ '../views/users/profile.vue'),
        meta: { requiresAuth: true, layout: 'app' }
    },
    // Hesap ayarları sayfası profil sayfasına yönlendirildi
    {
        path: '/users/user-account-settings',
        name: 'user-account-settings',
        redirect: '/users/profile',
        meta: { requiresAuth: true, layout: 'app' }
    },
    {
        path: '/users/kullanici-yonetimi',
        name: 'kullanici-yonetimi',
        component: () => import(/* webpackChunkName: "users-kullanici-yonetimi" */ '../views/users/kullanici-yonetimi.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, layout: 'app' }
    },
    {
        path: '/pages/knowledge-base',
        name: 'knowledge-base',
        component: () => import(/* webpackChunkName: "pages-knowledge-base" */ '../views/pages/knowledge-base.vue'),
    },
    {
        path: '/pages/contact-us-boxed',
        name: 'contact-us-boxed',
        component: () => import(/* webpackChunkName: "pages-contact-us-boxed" */ '../views/pages/contact-us-boxed.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/contact-us-cover',
        name: 'contact-us-cover',
        component: () => import(/* webpackChunkName: "pages-contact-us-cover" */ '../views/pages/contact-us-cover.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/faq',
        name: 'faq',
        component: () => import(/* webpackChunkName: "pages-faq" */ '../views/pages/faq.vue'),
    },
    {
        path: '/pages/coming-soon-boxed',
        name: 'coming-soon-boxed',
        component: () => import(/* webpackChunkName: "pages-coming-soon-boxed" */ '../views/pages/coming-soon-boxed.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/coming-soon-cover',
        name: 'coming-soon-cover',
        component: () => import(/* webpackChunkName: "pages-coming-soon-cover" */ '../views/pages/coming-soon-cover.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/error404',
        name: 'error404',
        component: () => import(/* webpackChunkName: "pages-error404" */ '../views/pages/error404.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/error500',
        name: 'error500',
        component: () => import(/* webpackChunkName: "pages-error500" */ '../views/pages/error500.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/error503',
        name: 'error503',
        component: () => import(/* webpackChunkName: "pages-error503" */ '../views/pages/error503.vue'),
        meta: { layout: 'auth' },
    },
    {
        path: '/pages/maintenence',
        name: 'maintenence',
        component: () => import(/* webpackChunkName: "pages-maintenence" */ '../views/pages/maintenence.vue'),
        meta: { layout: 'auth' },
    },
    
    // Stok Yönetimi rotaları
    {
        path: '/inventory',
        name: 'inventory',
        component: () => import(/* webpackChunkName: "inventory-dashboard" */ '../views/inventory/dashboard.vue'),
    },
    {
        path: '/inventory/products',
        name: 'inventory-products',
        component: () => import(/* webpackChunkName: "inventory-products" */ '../views/inventory/products/list.vue'),
    },
    {
        path: '/inventory/products/add',
        name: 'inventory-product-add',
        component: () => import(/* webpackChunkName: "inventory-product-add" */ '../views/inventory/products/add.vue'),
    },
    {
        path: '/inventory/products/edit/:id',
        name: 'inventory-product-edit',
        component: () => import(/* webpackChunkName: "inventory-product-edit" */ '../views/inventory/products/edit.vue'),
    },
    {
        path: '/inventory/categories',
        name: 'inventory-categories',
        component: () => import(/* webpackChunkName: "inventory-categories" */ '../views/inventory/categories/list.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }  // Only admin can access
    },
    {
        path: '/inventory/movements',
        name: 'inventory-movements',
        component: () => import(/* webpackChunkName: "inventory-movements" */ '../views/inventory/movements/list.vue'),
    },
    {
        path: '/inventory/warehouses',
        name: 'inventory-warehouses',
        component: () => import(/* webpackChunkName: "inventory-warehouses" */ '../views/inventory/warehouses/list.vue'),
        meta: { requiresAuth: true }  // Everyone can access but will be filtered by permissions
    },
    {
        path: '/inventory/reports',
        name: 'inventory-reports',
        component: () => import(/* webpackChunkName: "inventory-reports" */ '../views/inventory/reports/index.vue'),
    },
    
    // 404 Error - Bu sayfayı tutuyoruz
    {
        path: '/:pathMatch(.*)*',
        name: 'error404-catch-all',
        component: () => import(/* webpackChunkName: "pages-error404" */ '../views/pages/error404.vue'),
        meta: { layout: 'auth' },
    },
];

// Router'ı oluştururken önbelleğe alama seçeneğini ekleyelim
const router = createRouter({
    history: createWebHistory(),
    linkExactActiveClass: 'active',
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { left: 0, top: 0 };
        }
    },
});

// Route meta fields interface tanımı
declare module 'vue-router' {
    interface RouteMeta {
        layout?: string;
        requiresAuth?: boolean;
        requiresAdmin?: boolean;
    }
}

// Yönlendirme kontrolü bölümünde değişiklik yapalım
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const appStore = useAppStore();

    // Sayfa geçişlerinde oluşan hataları gidermek için hidrasyon özelliklerini ayarlayalım
    // @ts-ignore - Bu özellik TypeScript tarafından bilinmiyor ama çalışma zamanında kullanılabilir
    window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true;
    
    // @ts-ignore - Hidrasyon hatalarını bastır
    window.__VUE_PROD_DEVTOOLS__ = false;

    // Firebase Auth listener'ın başlatıldığından emin olun
    if (!authStore.authReady) {
        // initAuthListener metodunu çağır
        authStore.initAuthListener();
    }

    // Layout ayarlaması
    const layoutMeta = to?.meta?.layout;
    if (layoutMeta === 'auth') {
        appStore.setMainLayout('auth');
    } else {
        appStore.setMainLayout('app');
    }

    // Kimlik doğrulama kontrolü
    // Eğer kimlik doğrulama gerektiren bir route'a gidiliyorsa ve kullanıcı giriş yapmamışsa
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        // Kullanıcı oturumunu kontrol et
        const loggedIn = await authStore.checkSession();
        
        if (loggedIn) {
            // Eğer oturum varsa, istenen sayfaya yönlendir
            return next();
        } else {
            // Oturum yoksa login sayfasına yönlendir, ama hedef URL'i kaydet
            return next({
                path: '/auth/boxed-signin',
                query: { redirect: to.fullPath }
            });
        }
    }

    // Admin gerektiren sayfalara erişim kontrolü
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
        return next({ name: 'home' });
    }

    // Kullanıcı giriş yapmışsa ve login sayfasına gitmeye çalışıyorsa
    if (authStore.isLoggedIn && to.path.includes('/auth/')) {
        // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
        return next({ name: 'home' });
    }

    // Normal geçişe izin ver
    next();
});

// Animasyon ayarlamaları korunsun
router.afterEach((to, from) => {
    appSetting.changeAnimation();
});

// Router hata yakalama mekanizması ekleyelim
router.onError((error) => {
    console.error('Router hatası:', error);
    // Hatanın component ile ilgili olup olmadığını kontrol et
    if (error.message && error.message.includes("Cannot read properties of null (reading 'component')")) {
        console.warn('Router hidrasyon hatası yakalandı, sayfa yenileniyor...');
        // Sayfa yeniden yükle - Son çare olarak
        window.location.reload();
    }
});

export default router;
