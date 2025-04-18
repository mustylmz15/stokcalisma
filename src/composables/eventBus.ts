import { reactive } from 'vue';

export type EventCallback = (...args: any[]) => void;

interface EventBus {
    events: Record<string, EventCallback[]>;
    on(event: string, callback: EventCallback): void;
    off(event: string, callback: EventCallback): void;
    emit(event: string, ...args: any[]): void;
}

// Basit bir event bus oluştur
export const eventBus: EventBus = reactive({
    events: {},
    
    // Event dinleyicisi ekle
    on(event: string, callback: EventCallback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    // Event dinleyicisini kaldır
    off(event: string, callback: EventCallback) {
        if (!this.events[event]) {
            return;
        }
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },
    
    // Event yayınla
    emit(event: string, ...args: any[]) {
        if (!this.events[event]) {
            return;
        }
        this.events[event].forEach(callback => {
            callback(...args);
        });
    }
});