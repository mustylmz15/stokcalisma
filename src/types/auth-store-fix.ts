// TypeScript hataları düzeltme için geçici çözüm
// Projenin başında import ederek çalıştırın

// AuthStore sınıfı için ek tanımlamaları yapılandırın
declare module '@/stores/auth-store' {
  interface AuthStore {
    getAuthorizedDepot: string | null;
  }
}

// Herhangi bir sayfa tarafından import edildiğinde otomatik olarak çalışır
export const fixAuthStoreTypes = true;
