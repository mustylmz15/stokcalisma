import { defineStore } from 'pinia';
import i18n from '@/i18n';
import appSetting from '@/app-setting';
export const useAppStore = defineStore('app', {
    state: () => ({
        isDarkMode: false,
        mainLayout: 'app',
        theme: 'light',
        menu: 'vertical',
        layout: 'full',
        rtlClass: 'ltr',
        animation: '',
        navbar: 'navbar-sticky',
        locale: 'tr',
        sidebar: false,
        languageList: [
            { code: 'tr', name: 'Türkçe' },
            { code: 'en', name: 'English' }
        ],
        isShowMainLoader: true,
        semidark: false,
    }),
    actions: {
        setMainLayout(payload = null) {
            this.mainLayout = payload; //app , auth
        },
        toggleTheme(payload = null) {
            payload = payload || this.theme; // light|dark|system
            localStorage.setItem('theme', payload);
            this.theme = payload;
            if (payload == 'light') {
                this.isDarkMode = false;
            }
            else if (payload == 'dark') {
                this.isDarkMode = true;
            }
            else if (payload == 'system') {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    this.isDarkMode = true;
                }
                else {
                    this.isDarkMode = false;
                }
            }
            if (this.isDarkMode) {
                document.querySelector('body')?.classList.add('dark');
            }
            else {
                document.querySelector('body')?.classList.remove('dark');
            }
        },
        toggleMenu(payload = null) {
            payload = payload || this.menu; // vertical, collapsible-vertical, horizontal
            this.sidebar = false; // reset sidebar state
            localStorage.setItem('menu', payload);
            this.menu = payload;
        },
        toggleLayout(payload = null) {
            payload = payload || this.layout; // full, boxed-layout
            localStorage.setItem('layout', payload);
            this.layout = payload;
        },
        toggleRTL(payload = null) {
            payload = payload || this.rtlClass; // rtl, ltr
            localStorage.setItem('rtlClass', payload);
            this.rtlClass = payload;
            document.querySelector('html')?.setAttribute('dir', this.rtlClass || 'ltr');
        },
        toggleAnimation(payload = null) {
            payload = payload || this.animation; // animate__fadeIn, animate__fadeInDown, animate__fadeInUp, animate__fadeInLeft, animate__fadeInRight, animate__slideInDown, animate__slideInLeft, animate__slideInRight, animate__zoomIn
            payload = payload?.trim();
            localStorage.setItem('animation', payload);
            this.animation = payload;
            appSetting.changeAnimation();
        },
        toggleNavbar(payload = null) {
            payload = payload || this.navbar; // navbar-sticky, navbar-floating, navbar-static
            localStorage.setItem('navbar', payload);
            this.navbar = payload;
        },
        toggleSemidark(payload = null) {
            payload = payload || false;
            localStorage.setItem('semidark', payload);
            this.semidark = payload;
        },
        toggleLocale(payload = null) {
            payload = payload || this.locale;
            i18n.global.locale.value = payload;
            localStorage.setItem('i18n_locale', payload);
            this.locale = payload;
            if (this.locale?.toLowerCase() === 'ae') {
                this.toggleRTL('rtl');
            }
            else {
                this.toggleRTL('ltr');
            }
        },
        toggleSidebar(state = false) {
            this.sidebar = !this.sidebar;
        },
        toggleMainLoader(state = false) {
            this.isShowMainLoader = true;
            setTimeout(() => {
                this.isShowMainLoader = false;
            }, 500);
        },
        // Bildirim göstermek için yeni metot
        showMessage(message, type = 'info') {
            // Bildirim göstermek için basit bir alert kullanıyoruz
            const icon = type === 'success' ? '✅' :
                type === 'error' ? '❌' :
                    type === 'warning' ? '⚠️' : 'ℹ️';
            alert(`${icon} ${message}`);
            // Konsola da log atalım
            console.log(`[${type.toUpperCase()}] ${message}`);
        },
    },
    getters: {},
});
//# sourceMappingURL=index.js.map