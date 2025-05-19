import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import tr from './locales/tr.json';
const storedLocale = localStorage.getItem('i18n_locale');
const defaultLocale = 'tr';
// Sadece desteklenen dilleri kontrol et
const supportedLocales = ['tr', 'en'];
const initialLocale = storedLocale && supportedLocales.includes(storedLocale) ? storedLocale : defaultLocale;
const i18n = createI18n({
    legacy: false, // Vue 3 Composition API için önemli
    globalInjection: true, // $t, $d, vb. için global enjeksiyon
    locale: initialLocale,
    fallbackLocale: 'en',
    messages: {
        en,
        tr
    }
});
export default i18n;
//# sourceMappingURL=i18n.js.map