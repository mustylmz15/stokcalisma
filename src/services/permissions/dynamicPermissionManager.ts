import DynamicPermissionService from './dynamicPermissionService';
import DynamicRoleService from './dynamicRoleService';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Dinamik izin yönetim sistemi için arayüz
 * Bu sınıf, dinamik rol ve izin servislerini kullanarak
 * kullanıcı yetkilerini yönetir.
 */
class DynamicPermissionManager {
    // Singleton instance
    private static instance: DynamicPermissionManager;
    
    /**
     * Singleton instance'ını döndürür
     */
    static getInstance(): DynamicPermissionManager {
        if (!DynamicPermissionManager.instance) {
            DynamicPermissionManager.instance = new DynamicPermissionManager();
        }
        return DynamicPermissionManager.instance;
    }
    
    // Kullanıcı izinleri önbelleği
    private permissionCache: Map<string, {
        permissions: string[],
        timestamp: number
    }> = new Map();
    
    // Önbellek yaşam süresi (15 dakika)
    private cacheTTL: number = 15 * 60 * 1000;

    // (Bu fonksiyonun yinelenen hali kaldırıldı. Aşağıdaki clearUserPermissions fonksiyonu kullanılacaktır.)

    /**
     * Belirli bir kullanıcı veya rol için izinleri yükler
     * @param roleOrUserId Kullanıcı ID'si veya rol adı
     * @returns İzin ID'lerinin listesi
     */
    async loadUserPermissions(roleOrUserId: string): Promise<string[]> {
        try {
            // Eğer bu bir rol ise, rol izinlerini döndür
            const role = await DynamicRoleService.getRole(roleOrUserId);
            if (role) {
                return DynamicRoleService.getRolePermissions(roleOrUserId);
            }
            
            // Aksi halde bir kullanıcı ID'si olarak kabul et
            const allPermissions = await DynamicPermissionService.getAllUserPermissions(roleOrUserId);
            
            // Sadece izin verilmiş izinleri döndür
            return allPermissions
                .filter(p => p.granted)
                .map(p => p.permissionId);
        } catch (error) {
            console.error(`İzinleri yüklerken hata: ${roleOrUserId}`, error);
            return [];
        }
    }

    /**
     * Kullanıcı izinlerini önbellekten alır
     * @param userId Kullanıcı ID'si
     * @returns Önbellekteki izin verileri veya null
     */
    getUserPermissionsCacheData(userId: string): { permissions: string[], timestamp: number } | null {
        const cachedData = this.permissionCache.get(userId);
        
        if (!cachedData) {
            return null;
        }
        
        // Önbellek süresi dolmuş mu kontrol et
        if (Date.now() - cachedData.timestamp > this.cacheTTL) {
            this.permissionCache.delete(userId);
            return null;
        }
        
        return cachedData;
    }
    
    /**
     * Kullanıcı izinlerini önbelleğe alır
     * @param userId Kullanıcı ID'si
     * @param permissions İzinler listesi
     */
    private cacheUserPermissions(userId: string, permissions: string[]): void {
        this.permissionCache.set(userId, {
            permissions,
            timestamp: Date.now()
        });
    }
    
    /**
     * Kullanıcı izin önbelleğini temizler
     * @param userId Kullanıcı ID'si - belirtilmezse tüm önbellek temizlenir
     */
    clearUserPermissions(userId?: string): void {
        if (userId) {
            // Belirli bir kullanıcının izinlerini temizle
            this.permissionCache.delete(userId);
            console.log(`${userId} kullanıcısı için izin önbelleği temizlendi`);
        } else {
            // Tüm izin önbelleğini temizle
            this.permissionCache.clear();
            console.log('Tüm izin önbelleği temizlendi');
        }
    }
    /**
     * Mevcut oturum açmış kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     * @param permissionId Kontrol edilecek izin ID'si
     * @param projectId Opsiyonel olarak proje ID'si (proje bazlı izinler için)
     * @returns İzin var mı yok mu (true/false)
     */
    async hasPermission(permissionId: string, projectId?: string): Promise<boolean> {
        try {
            const authStore = useAuthStore();
            if (!authStore.userInfo || !authStore.userInfo.id) {
                return false;
            }
            
            return DynamicPermissionService.hasPermission(authStore.userInfo.id, permissionId, projectId);
        } catch (error) {
            console.error(`İzin kontrolü sırasında hata: ${permissionId}`, error);
            return false;
        }
    }    /**
     * Mevcut kullanıcının tüm izinlerini döndürür
     * @returns İzin dizisi
     */
    async getCurrentUserPermissions(): Promise<string[]> {
        try {
            const authStore = useAuthStore();
            if (!authStore.userInfo || !authStore.userInfo.id) {
                return [];
            }
            
            const allPermissions = await DynamicPermissionService.getAllUserPermissions(authStore.userInfo.id);
            return allPermissions
                .filter(p => p.granted)
                .map(p => p.permissionId);
        } catch (error) {
            console.error('Mevcut kullanıcı izinleri alınırken hata:', error);
            return [];
        }
    }    /**
     * Kullanıcıya özel izin ekler
     */
    async addUserPermission(userId: string, permissionId: string, granted: boolean = true, projectId?: string): Promise<boolean> {
        try {
            const authStore = useAuthStore();
            if (!authStore.userInfo || !authStore.userInfo.id) {
                throw new Error('İşlem için oturum açmış kullanıcı gereklidir');
            }
            
            await DynamicPermissionService.setUserPermission({
                userId,
                permissionId,
                projectId,
                granted,
                grantedBy: authStore.userInfo.id
            });
            
            return true;
        } catch (error) {
            console.error(`Kullanıcıya izin eklenirken hata: ${userId}/${permissionId}`, error);
            return false;
        }
    }

    /**
     * Kullanıcıdan özel izni kaldırır
     */
    async removeUserPermission(userId: string, permissionId: string, projectId?: string): Promise<boolean> {
        try {
            return DynamicPermissionService.removeUserPermission(userId, permissionId, projectId);
        } catch (error) {
            console.error(`Kullanıcıdan izin kaldırılırken hata: ${userId}/${permissionId}`, error);
            return false;
        }
    }
      /**
     * Kullanıcının belirtilen role sahip olup olmadığını kontrol eder
     * @param roleName Kontrol edilecek rol adı
     * @returns Kullanıcı bu role sahipse true, değilse false
     */
    async hasRole(roleName: string): Promise<boolean> {
        try {
            const authStore = useAuthStore();
            if (!authStore.userInfo || !authStore.userInfo.id) {
                return false;
            }
            
            const userId = authStore.userInfo.id;
            const userRoles = await DynamicRoleService.getUserRoles(userId);
            
            return userRoles.some(userRole => userRole.roleId === roleName);
        } catch (error) {
            console.error(`Rol kontrolü sırasında hata: ${roleName}`, error);
            return false;
        }
    }
      /**
     * Bir rolün diğer bir rol üzerinde yetkisi olup olmadığını kontrol eder
     * @param superiorRole Üst rol
     * @param subordinateRole Alt rol
     * @returns Yetki varsa true, yoksa false
     */
    async hasAuthorityOver(superiorRole: string, subordinateRole: string): Promise<boolean> {
        try {
            // Önce rolleri getir
            const superior = await DynamicRoleService.getRole(superiorRole);
            const subordinate = await DynamicRoleService.getRole(subordinateRole);
            
            if (!superior || !subordinate) {
                return false;
            }
              // Rol hiyerarşisi için weight/sıralama değerini kontrol et
            // (Varsayılan olarak öndeğerli bir özellik kullanıyoruz)
            const superiorWeight = superior.weight !== undefined ? superior.weight : this.getDefaultRoleWeight(superiorRole);
            const subordinateWeight = subordinate.weight !== undefined ? subordinate.weight : this.getDefaultRoleWeight(subordinateRole);
            
            // Ağırlık değeri küçük olan daha yetkilidir (admin=0, normal kullanıcı=100 gibi)
            return superiorWeight < subordinateWeight;
        } catch (error) {
            console.error(`Yetki kontrolü sırasında hata: ${superiorRole} > ${subordinateRole}`, error);
            return false;
        }
    }
    
    /**
     * Role için varsayılan ağırlık değerini döndürür
     * @param roleName Rolün adı
     * @returns Ağırlık değeri (düşük değer daha yüksek yetkiyi ifade eder)
     */
    private getDefaultRoleWeight(roleName: string): number {
        // Temel roller için varsayılan ağırlıklar
        switch (roleName) {
            case 'admin': return 0;
            case 'proje_admin': return 10;
            case 'proje_sorumlusu': return 20;
            case 'depo_sorumlusu': return 30;
            case 'onarim_merkezi_sorumlusu': return 40;
            case 'proje_it_sorumlusu': return 50;
            case 'onarim_kullanici': return 60;
            case 'field_technician': return 70;
            case 'readonly_user': return 80;
            case 'user': return 100;
            default: return 999; // Bilinmeyen roller en düşük yetkiye sahip
        }
    }
      /**
     * Proje bağlamında kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     * @param projectId Proje ID'si
     * @param permissionId İzin ID'si
     * @returns İzin varsa true, yoksa false
     */
    async hasProjectPermission(projectId: string, permissionId: string): Promise<boolean> {
        try {
            const authStore = useAuthStore();
            if (!authStore.userInfo || !authStore.userInfo.id) {
                return false;
            }
            
            const userId = authStore.userInfo.id;
            
            // Kullanıcı admin mi kontrol et
            if (await this.hasRole('admin')) {
                return true;
            }
            
            // Proje bazlı izinleri kontrol et
            return DynamicPermissionService.hasPermission(userId, permissionId, projectId);
        } catch (error) {
            console.error(`Proje izin kontrolü sırasında hata: ${projectId}/${permissionId}`, error);
            return false;
        }
    }
}

// Singleton olarak dışa aktar
export default DynamicPermissionManager.getInstance();
