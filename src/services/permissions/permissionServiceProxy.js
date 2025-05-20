/**
 * Eski permissionService ile yeni DynamicPermissionManager arasında uyumluluk katmanı sağlar.
 * Bu proxy, eski kodların sınıfların aynı şekilde kullanılmasını sağlarken, arkada yeni dinamik
 * izin sistemini kullanır.
 */
// Orijinal Permission ve UserRole'ü re-export ediyoruz
import { Permission, UserRole, roleHierarchy } from './permissionService';
import DynamicPermissionManager from './dynamicPermissionManager';
import PermissionMigrationService from './permissionMigrationService';
// Re-export the enums for backward compatibility
export { Permission, UserRole };
/**
 * PermissionServiceProxy sınıfı - Geriye dönük uyumluluk için
 */
class PermissionServiceProxy {
    // Migrasyon durumunu tutacak değişken
    static migrated = false;
    /**
     * Sınıf başlangıcında migrasyon işlemini kontrol et
     */
    static async ensureMigrated() {
        if (!this.migrated) {
            try {
                // İzin ve rol tablosunu veritabanına taşı
                await PermissionMigrationService.migrateAllRolesAndPermissions();
                this.migrated = true;
                console.log('İzin sistemi başarıyla migrate edildi');
            }
            catch (error) {
                console.error('İzin sistemi migration hatası:', error);
            }
        }
    }

    /**
     * İzin önbelleğini sıfırlar ve rolleri yeniden yükler
     * @param {string} userId Opsiyonel olarak belirli bir kullanıcının önbelleğini temizler
     */
    static async resetCache(userId = null) {
        console.log('İzin önbelleği sıfırlanıyor...');
        try {
            // DynamicPermissionManager'daki önbelleği temizle
            DynamicPermissionManager.getInstance().clearUserPermissions(userId);
            // Migrasyon durumunu kontrol et ve yenile
            await this.ensureMigrated();
            return true;
        } catch (error) {
            console.error('İzin önbelleği sıfırlanırken hata:', error);
            return false;
        }
    }
    /**
     * Verilen kullanıcı rolü için izinleri döndürür
     */
    static async getPermissionsForRole(role) {
        await this.ensureMigrated();
        try {
            // Dinamik izin sisteminden rol izinlerini al
            const permissionIds = await DynamicPermissionManager.loadUserPermissions(role);
            return permissionIds;
        }
        catch (error) {
            console.error(`Rol izinleri alınırken hata: ${role}`, error);
            return [];
        }
    }
    /**
     * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder (async versiyon)
     */
    static async hasPermissionAsync(permission) {
        await this.ensureMigrated();
        return DynamicPermissionManager.hasPermission(permission);
    }
    /**
     * Mevcut geriye dönük uyumluluk için hasPermission metodu
     * Bu metot, DynamicPermissionManager'ın async yapısını gizler ve senkron gibi davranır
     */
    static hasPermission(permission) {
        // Senkron fonksiyon olarak davranması için
        if (!this.migrated) {
            this.ensureMigrated().catch(error => {
                console.error('İzin sistemi migration hatası:', error);
            });
        }
        try {
            // Admin ise doğrudan true dönelim (bu hızlı yol, çoğu durumda yeterli olacaktır)
            const authStore = require('@/stores/auth-store').useAuthStore();
            if (authStore().isAdmin) {
                return true;
            } // Önbellek kontrolü yaparak senkron davranış sağlayalım
            const userId = authStore().userInfo?.id;
            if (userId) {
                // Önbellekten kullanıcı izinlerini kontrol et
                const cachedData = DynamicPermissionManager.getUserPermissionsCacheData(userId);
                if (cachedData) {
                    return cachedData.permissions.includes(permission);
                }
                // İzinleri arka planda yükle
                DynamicPermissionManager.hasPermission(permission).catch(() => { });
            }
            // Güvenli taraf, mevcut kontrol mekanizmasını kullan
            return false;
        }
        catch (error) {
            console.error('hasPermission hatası:', error);
            return false;
        }
    }
    /**
     * Mevcut oturum açmış kullanıcının belirli bir role sahip olup olmadığını kontrol eder
     */
    static async hasRoleAsync(role) {
        await this.ensureMigrated();
        return DynamicPermissionManager.hasRole(role);
    }
    /**
     * Mevcut geriye dönük uyumluluk için hasRole metodu
     */
    static hasRole(role) {
        // Senkron fonksiyon olarak davranması için önce migration kontrolü
        if (!this.migrated) {
            this.ensureMigrated().catch(error => {
                console.error('İzin sistemi migration hatası:', error);
            });
        }
        try {
            // Kullanıcı ID'sini al
            const authStore = require('@/stores/auth-store').useAuthStore();
            // Ana rol kontrolü - bu hızlı ve senkron
            if (authStore().userInfo?.role === role) {
                return true;
            }
            // Ek roller kontrolü - bu da senkron
            if (authStore().userInfo?.roles?.includes(role)) {
                return true;
            }
            // Daha kapsamlı kontrol için async fonksiyon çalışsın (arka planda)
            const userId = authStore().userInfo?.id;
            if (userId) {
                DynamicPermissionManager.hasRole(role).then(() => {
                    // Rol kontrolü arka planda yapıldı
                }).catch(error => {
                    console.error('Rol kontrolü yapılırken hata:', error);
                });
            }
            // Bu hızlı kontrollerden geçemediyse, false döndür
            return false;
        }
        catch (error) {
            console.error('hasRole hatası:', error);
            return false;
        }
    }
    /**
     * Bir rolün diğer bir rol üzerinde yetkisi olup olmadığını kontrol eder
     */
    static async hasAuthorityOverAsync(superiorRole, subordinateRole) {
        await this.ensureMigrated();
        return DynamicPermissionManager.hasAuthorityOver(superiorRole.toString(), subordinateRole.toString());
    }
    /**
     * Mevcut geriye dönük uyumluluk için hasAuthorityOver metodu
     */
    static hasAuthorityOver(superiorRole, subordinateRole) {
        // Hızlı kontrol için roleHierarchy kullan
        if (typeof superiorRole === 'string' && typeof subordinateRole === 'string' &&
            roleHierarchy[superiorRole] !== undefined &&
            roleHierarchy[subordinateRole] !== undefined) {
            return roleHierarchy[superiorRole] > roleHierarchy[subordinateRole];
        }
        // Bilinmeyen roller için arka planda kontrol et
        if (!this.migrated) {
            this.ensureMigrated().then(() => {
                DynamicPermissionManager.hasAuthorityOver(superiorRole.toString(), subordinateRole.toString()).catch(() => { });
            }).catch(() => { });
        }
        else {
            DynamicPermissionManager.hasAuthorityOver(superiorRole.toString(), subordinateRole.toString()).catch(() => { });
        }
        // Bilinmeyen durum için güvenli bir değer dön
        return false;
    }
    /**
     * Birden fazla izin kontrolü yapar, hepsine sahip olmalı
     */
    static hasAllPermissions(permissions) {
        return permissions.every(permission => this.hasPermission(permission));
    }
    /**
     * Birden fazla izin kontrolü yapar, en az birine sahip olmalı
     */
    static hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    }
    /**
     * Proje bağlamında kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     */
    static async hasProjectPermissionAsync(projectId, permission) {
        await this.ensureMigrated();
        return DynamicPermissionManager.hasProjectPermission(projectId, permission);
    }
    /**
     * Mevcut geriye dönük uyumluluk için hasProjectPermission metodu
     */
    static hasProjectPermission(projectId, permission) {
        try {
            // Kullanıcı ID'sini al
            const authStore = require('@/stores/auth-store').useAuthStore();
            // Admin kontrolü - hızlı
            if (authStore().isAdmin) {
                return true;
            }
            // Arka planda tam kontrolü başlat
            const userId = authStore().userInfo?.id;
            if (userId) {
                DynamicPermissionManager.hasProjectPermission(projectId, permission).catch(() => { });
            }
            // Daha güvenli bir yol için mevcut rol kontrolünü yap (eskiden olduğu gibi)
            // Proje rolüne göre izinleri kontrol et
            const projectRole = authStore().userProjectRoles[projectId];
            if (!projectRole) {
                return false; // Bu projede rolü yoksa yetkisi de yok
            }
            // Proje Admin tüm izinlere sahip olabilir
            if (projectRole === 'proje_admin') {
                return true;
            }
            // Diğer roller için basitleştirilmiş kontrol
            // Bu, geçici bir çözüm olarak düşünülmelidir
            if (permission === 'view_dashboard' || permission === 'view_projects') {
                return true; // Çoğu rol bu izinlere sahip
            }
            return false; // Güvenli tarafta kalmak için
        }
        catch (error) {
            console.error('hasProjectPermission hatası:', error);
            return false;
        }
    }
}
// Kolay kullanım için export edilen yardımcı fonksiyonlar
export const hasPermission = (permission) => {
    return PermissionServiceProxy.hasPermission(permission);
};
export const hasRole = (role) => {
    return PermissionServiceProxy.hasRole(role);
};
export const hasAuthorityOver = (superiorRole, subordinateRole) => {
    return PermissionServiceProxy.hasAuthorityOver(superiorRole, subordinateRole);
};
export default PermissionServiceProxy;
//# sourceMappingURL=permissionServiceProxy.js.map