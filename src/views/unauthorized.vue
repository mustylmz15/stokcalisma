<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center px-4">
        <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <div class="mb-6">
                <div class="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h1>
                <p class="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            </div>
            
            <div class="space-y-4">
                <div class="text-sm text-gray-500">
                    <p class="mb-2">Eğer bu sayfaya erişmeniz gerektiğini düşünüyorsanız:</p>
                    <ul class="list-disc list-inside text-left space-y-1">
                        <li>Sistem yöneticinizle iletişime geçin</li>
                        <li>Gerekli izinlerinizi kontrol ettirin</li>
                        <li>Doğru kullanıcı hesabıyla giriş yaptığınızdan emin olun</li>
                    </ul>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button 
                        @click="goBack"
                        class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                        Geri Dön
                    </button>
                    <button 
                        @click="goHome"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                        Ana Sayfa
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1);
    } else {
        router.push('/');
    }
};

const goHome = () => {
    router.push('/');
};
</script>
