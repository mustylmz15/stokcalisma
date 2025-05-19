import { reactive } from 'vue';
// Basit bir event bus oluştur
export const eventBus = reactive({
    events: {},
    // Event dinleyicisi ekle
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    // Event dinleyicisini kaldır
    off(event, callback) {
        if (!this.events[event]) {
            return;
        }
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },
    // Event yayınla
    emit(event, ...args) {
        if (!this.events[event]) {
            return;
        }
        this.events[event].forEach(callback => {
            callback(...args);
        });
    }
});
//# sourceMappingURL=eventBus.js.map