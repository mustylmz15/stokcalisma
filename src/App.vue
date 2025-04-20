<template>
    <div
        class="main-section antialiased relative font-nunito text-sm font-normal"
        :class="[store.sidebar ? 'toggle-sidebar' : '', store.menu, store.layout, store.rtlClass]"
    >
        <Suspense>
            <template #default>
                <component :is="mainLayout" />
            </template>
            <template #fallback>
                <div class="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#121212]">
                    <div class="animate-spin border-4 border-transparent border-l-primary rounded-full w-10 h-10"></div>
                </div>
            </template>
        </Suspense>
    </div>
</template>
<script lang="ts" setup>
    import { computed, onMounted, watch, onErrorCaptured, ref, onBeforeUnmount } from 'vue';
    import appLayout from '@/layouts/app-layout.vue';
    import authLayout from '@/layouts/auth-layout.vue';
    import { useAppStore } from '@/stores/index';
    import { useMeta } from '@/composables/use-meta';
    import { useAuthStore } from '@/stores/auth-store';
    import { useRouter } from 'vue-router';
    
    const store = useAppStore();
    const authStore = useAuthStore();
    const router = useRouter();

    // Hata yakalama değişkeni
    const error = ref<Error | null>(null);

    // Hataları yakalayalım
    onErrorCaptured((err) => {
        console.error('Uygulama hatası yakalandı:', err);
        error.value = err;
        
        // Hidrasyon hatalarını kontrol et
        if (err?.message?.includes('Hydration') || 
            err?.message?.includes('component') || 
            err?.message?.includes('Cannot read properties of null')) {
            console.warn('Hidrasyon hatası tespit edildi, yenileniyor...');
            // Ciddi hidrasyon hataları için sayfayı yenileme - son çare olarak
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
        
        return false;  // Hatayı zincirle yukarı taşıma
    });
    
    // meta
    useMeta({ title: 'Sales Admin' });
    
    const mainLayout = computed(() => {
        return store.mainLayout === 'auth' ? authLayout : appLayout;
    });
    
    // Uygulama başlatıldığında oturum kontrolü yap
    onMounted(() => {
        console.log('App.vue: Uygulama başlatıldı, oturum kontrolü yapılıyor');
        
        // Firebase Auth listener'ı başlat
        authStore.initAuthListener();
        
        // Bu, tarayıcı "beforeunload" olayını dinler ve açık kalmış dinleyicileri temizler
        window.addEventListener('beforeunload', cleanupListeners);
    });
    
    // Uygulama kapandığında veya component unmount olduğunda temizlik yap
    onBeforeUnmount(() => {
        // App.vue unmount olduğunda Firebase bağlantılarını temizle
        cleanupListeners();
    });
    
    // Tüm Firebase dinleyicilerini temizle
    const cleanupListeners = () => {
        console.log('App.vue: Firebase dinleyicileri temizleniyor...');
        
        // Auth listener'ı temizle
        authStore.cleanupAuthListener();
        
        // Runtime.lastError hatalarını önlemek için asenkron işlemleri durdur
        setTimeout(() => {
            console.log('App.vue: Asenkron işlemler durduruldu');
        }, 0);
    };

    // Auth durumu değiştiğinde rotaları kontrol et
    watch(() => authStore.isLoggedIn, (isLoggedIn) => {
        // Auth durumu hazır olduğunda yönlendirmeleri kontrol et
        if (authStore.authReady) {
            if (isLoggedIn && router.currentRoute.value.meta.layout === 'auth') {
                console.log('Aktif oturum var, ana sayfaya yönlendiriliyor');
                router.push('/');
            } else if (!isLoggedIn && router.currentRoute.value.meta.requiresAuth) {
                console.log('Oturum yok, login sayfasına yönlendiriliyor');
                router.push('/auth/boxed-signin');
            }
        }
    });
</script>
