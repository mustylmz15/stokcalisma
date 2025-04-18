<template>
    <div>
        <div class="absolute inset-0">
            <img src="/assets/images/auth/bg-gradient.png" alt="image" class="h-full w-full object-cover" />
        </div>

        <div
            class="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16"
        >
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" class="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <img src="/assets/images/auth/coming-soon-object2.png" alt="image" class="absolute left-24 top-0 h-40 md:left-[30%]" />
            <img src="/assets/images/auth/coming-soon-object3.png" alt="image" class="absolute right-0 top-0 h-[300px]" />
            <img src="/assets/images/auth/polygon-object.svg" alt="image" class="absolute bottom-0 end-[28%]" />
            <div
                class="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]"
            >
                <div class="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20">
                    <div class="absolute top-6 end-6">
                        <div class="dropdown">
                            <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="8">
                                <button
                                    type="button"
                                    class="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                >
                                    <div>
                                        <img :src="currentFlag" alt="image" class="h-5 w-5 rounded-full object-cover" />
                                    </div>
                                    <div class="text-base font-bold uppercase">{{ store.locale }}</div>
                                    <span class="shrink-0">
                                        <icon-caret-down />
                                    </span>
                                </button>
                                <template #content="{ close }">
                                    <ul class="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                        <template v-for="item in store.languageList" :key="item.code">
                                            <li>
                                                <button
                                                    type="button"
                                                    class="w-full hover:text-primary"
                                                    :class="{ 'bg-primary/10 text-primary': i18n.locale === item.code }"
                                                    @click="changeLanguage(item), close()"
                                                >
                                                    <img
                                                        class="w-5 h-5 object-cover rounded-full"
                                                        :src="`/assets/images/flags/${item.code.toUpperCase()}.svg`"
                                                        alt=""
                                                    />
                                                    <span class="ltr:ml-3 rtl:mr-3">{{ item.name }}</span>
                                                </button>
                                            </li>
                                        </template>
                                    </ul>
                                </template>
                            </Popper>
                        </div>
                    </div>
                    <div class="mx-auto w-full max-w-[440px]">
                        <div class="mb-10">
                            <h1 class="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">UGES STOK TAKİP</h1>
                            <p class="text-base font-bold leading-normal text-white-dark">Lütfen Kullanıcı adı ve Şifrenizi giriniz</p>
                        </div>
                        <form class="space-y-5 dark:text-white" @submit.prevent="handleSubmit">
                            <div>
                                <label for="Email">E-Posta</label>
                                <div class="relative text-white-dark">
                                    <input id="Email" type="email" v-model="formData.email" placeholder="E-Postanızı Giriniz" class="form-input ps-10 placeholder:text-white-dark" />
                                    <span class="absolute start-4 top-1/2 -translate-y-1/2">
                                        <icon-mail :fill="true" />
                                    </span>
                                    <p v-if="errors.email" class="text-red-500">{{ errors.email }}</p>
                                </div>
                            </div>
                            <div>
                                <label for="Password">Şifre</label>
                                <div class="relative text-white-dark">
                                    <input id="Password" type="password" v-model="formData.password" placeholder="Şifrenizi Giriniz" class="form-input ps-10 placeholder:text-white-dark" />
                                    <span class="absolute start-4 top-1/2 -translate-y-1/2">
                                        <icon-lock-dots :fill="true" />
                                    </span>
                                    <p v-if="errors.password" class="text-red-500">{{ errors.password }}</p>
                                </div>
                            </div>
                            <div>
                                <label class="flex cursor-pointer items-center">
                                    <input type="checkbox" v-model="rememberMe" class="form-checkbox bg-white dark:bg-black" />
                                    <span class="text-white-dark">Beni Hatırla</span>
                                </label>
                            </div>
                            <button type="submit" class="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
                                Giriş Yap
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
    import { computed, reactive } from 'vue';
    import { useI18n } from 'vue-i18n';
    import appSetting from '@/app-setting';
    import { useAppStore } from '@/stores/index';
    import { useAuthStore } from '@/stores/auth-store'; // Yeni eklenen store
    import { useRouter } from 'vue-router';
    import { useMeta } from '@/composables/use-meta';

    import IconCaretDown from '@/components/icon/icon-caret-down.vue';
    import IconMail from '@/components/icon/icon-mail.vue';
    import IconLockDots from '@/components/icon/icon-lock-dots.vue';
    import { ref, onMounted } from 'vue';

    const formData = reactive({
        email: '',
        password: ''
    });

    const email = computed(() => formData.email);
    const password = computed(() => formData.password);
    const rememberMe = ref(false);
    const errors = ref({
        email: '',
        password: ''
    });

    const router = useRouter();
    const authStore = useAuthStore(); // Auth store'u kullan

    // Sayfa yüklendiğinde kaydedilmiş bilgileri kontrol et
    onMounted(() => {
        const savedCredentials = localStorage.getItem('credentials');
        if (savedCredentials) {
            const { savedEmail, savedPassword } = JSON.parse(savedCredentials);
            formData.email = savedEmail;
            formData.password = savedPassword;
            rememberMe.value = true;
        }
    });

    // Hata mesajlarını temizlemek için yardımcı fonksiyon
    const clearErrors = () => {
        setTimeout(() => {
            errors.value = {
                email: '',
                password: ''
            };
        }, 5000); // 5 saniye sonra
    };

    const handleSubmit = async () => {
        // Hata mesajlarını sıfırla
        errors.value = {
            email: '',
            password: ''
        };

        try {
            // Email validasyonu
            if (!formData.email.trim()) {
                errors.value.email = 'Email alanı zorunludur';
                return;
            }
            
            if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
                errors.value.email = 'Geçerli bir email adresi giriniz';
                return;
            }

            // Şifre validasyonu
            if (!formData.password.trim()) {
                errors.value.password = 'Şifre alanı zorunludur';
                return;
            }

            if (formData.password.length < 6) {
                errors.value.password = 'Şifre en az 6 karakter olmalıdır';
                return;
            }

            // Auth store üzerinden login işlemi yap
            await authStore.login(formData.email.trim(), formData.password);
            
            // Remember me işlemi
            if (rememberMe.value) {
                localStorage.setItem('credentials', JSON.stringify({
                    savedEmail: formData.email,
                    savedPassword: formData.password
                }));
            } else {
                localStorage.removeItem('credentials');
            }
            
            // Ana sayfaya yönlendir
            router.push('/');
        } catch(error: any) {
            console.error('Login error:', error);
            const errorMessage = error?.message || 'Giriş işlemi başarısız';
            
            if (errorMessage.includes('Kullanıcı bulunamadı') || 
                errorMessage.includes('Hatalı şifre')) {
                errors.value.password = 'E-posta veya şifre hatalı';
            } else if (errorMessage.includes('devre dışı')) {
                errors.value.email = 'Bu hesap devre dışı bırakılmış';
            } else {
                errors.value.email = errorMessage;
            }
            
            clearErrors();
        }
    };

    useMeta({ title: 'Login Boxed' });

    const store = useAppStore();
    // multi language
    const i18n = reactive(useI18n());
    const changeLanguage = (item: any) => {
        i18n.locale = item.code;
        appSetting.toggleLanguage(item);
    };
    const currentFlag = computed(() => {
        return `/assets/images/flags/${i18n.locale.toUpperCase()}.svg`;
    });
</script>
