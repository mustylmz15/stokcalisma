// Merkezi Rol ve Yetkilendirme Servisi
import { useAuthStore } from '@/stores/auth-store';

/**
 * Kullanıcı rollerinin tanımları
 * Bu enum, sistemdeki tüm kullanıcı rollerini tanımlar
 */
export enum UserRole {
    // Global roller
    ADMIN = 'admin',
    
    // Proje rolleri
    PROJECT_ADMIN = 'proje_admin',
    PROJECT_MANAGER = 'proje_sorumlusu',
    PROJECT_IT_MANAGER = 'proje_it_sorumlusu',
    
    // Depo rolleri
    WAREHOUSE_MANAGER = 'depo_sorumlusu',
    
    // Onarım merkezi rolleri
    SERVICE_CENTER_MANAGER = 'onarim_merkezi_sorumlusu',
    REPAIR_USER = 'onarim_kullanici',
    
    // Temel kullanıcı rolü
    USER = 'user',
    
    // Eski sistemdeki roller (geriye uyumluluk için)
    FIELD_TECHNICIAN = 'field_technician',
    READONLY_USER = 'readonly_user'
}

/**
 * Sistemdeki izin anahtarlarının tanımları
 */
export enum Permission {
    // Genel işlem izinleri
    VIEW_DASHBOARD = 'view_dashboard',
    EXPORT_REPORTS = 'export_reports',
    
    // Arıza ve onarım izinleri
    VIEW_FAULT_MANAGEMENT = 'view_fault_management',
    ADD_FAULTY_PRODUCT = 'add_faulty_product',
    UPDATE_FAULT_STATUS = 'update_fault_status',
    ACCESS_REPAIR_REPORTS = 'access_repair_reports',
    MANAGE_REPAIR_PROCESSES = 'manage_repair_processes',
    
    // Envanter izinleri
    VIEW_INVENTORY = 'view_inventory',
    MANAGE_INVENTORY = 'manage_inventory',
    TRANSFER_STOCK = 'transfer_stock',
    
    // Merkez depo izinleri
    REQUEST_FROM_CENTRAL = 'request_from_central',
    CENTRAL_WAREHOUSE_TRANSFER = 'central_warehouse_transfer',
    
    // Proje izinleri
    VIEW_PROJECTS = 'view_projects',
    MANAGE_PROJECTS = 'manage_projects',
    
    // Kullanıcı izinleri
    VIEW_USERS = 'view_users',
    MANAGE_USERS = 'manage_users',
    MANAGE_PROJECT_USERS = 'manage_project_users',
    
    // Ürün yönetimi izinleri
    VIEW_PRODUCTS = 'view_products',
    MANAGE_PRODUCTS = 'manage_products',
    MANAGE_PROJECT_PRODUCTS = 'manage_project_products',
    
    // IT ekipman yönetimi
    VIEW_IT_DEVICES = 'view_it_devices',
    MANAGE_IT_DEVICES = 'manage_it_devices',
}

/**
 * Her rolün varsayılan izinlerini tanımlar
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: Object.values(Permission), // Admin tüm izinlere sahip
    
    [UserRole.PROJECT_ADMIN]: [
        Permission.VIEW_DASHBOARD,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.ADD_FAULTY_PRODUCT,
        Permission.UPDATE_FAULT_STATUS,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_INVENTORY,
        Permission.VIEW_PROJECTS,
        Permission.VIEW_USERS,
        Permission.MANAGE_PROJECT_USERS,
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PROJECT_PRODUCTS,
        Permission.CENTRAL_WAREHOUSE_TRANSFER,
        Permission.VIEW_IT_DEVICES,
        Permission.MANAGE_IT_DEVICES,
    ],
    
    [UserRole.PROJECT_MANAGER]: [
        Permission.VIEW_DASHBOARD,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.ADD_FAULTY_PRODUCT,
        Permission.VIEW_INVENTORY,
        Permission.VIEW_PROJECTS,
        Permission.CENTRAL_WAREHOUSE_TRANSFER,
        Permission.VIEW_IT_DEVICES,
    ],
    
    [UserRole.PROJECT_IT_MANAGER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.ADD_FAULTY_PRODUCT,
        Permission.VIEW_IT_DEVICES,
        Permission.MANAGE_IT_DEVICES,
    ],
    
    [UserRole.WAREHOUSE_MANAGER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.ADD_FAULTY_PRODUCT,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_INVENTORY,
        Permission.TRANSFER_STOCK,
        Permission.REQUEST_FROM_CENTRAL,
    ],
    
    [UserRole.SERVICE_CENTER_MANAGER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.UPDATE_FAULT_STATUS,
        Permission.ACCESS_REPAIR_REPORTS,
        Permission.MANAGE_REPAIR_PROCESSES,
        Permission.EXPORT_REPORTS,
    ],
    
    [UserRole.REPAIR_USER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.UPDATE_FAULT_STATUS,
        Permission.MANAGE_REPAIR_PROCESSES,
    ],
    
    [UserRole.USER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.VIEW_INVENTORY,
        Permission.VIEW_PROJECTS,
        Permission.VIEW_PRODUCTS,
    ],
    
    [UserRole.FIELD_TECHNICIAN]: [
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.ADD_FAULTY_PRODUCT,
        Permission.VIEW_INVENTORY,
    ],
    
    [UserRole.READONLY_USER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FAULT_MANAGEMENT,
        Permission.VIEW_INVENTORY,
        Permission.VIEW_PROJECTS,
    ]
};

/**
 * Kullanıcılara özel izin atamaları
 * Bu map kullanıcı ID'si ile özelleştirilmiş izinleri eşleştirir
 */
const userSpecificPermissions: Record<string, Permission[]> = {};

/**
 * Rol hiyerarşisi - Bir rolün diğer bir rol üzerinde yetkisi olup olmadığını belirler
 * Değer ne kadar yüksekse, hiyerarşide o kadar yukarıdadır
 */
export const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 100,  
    [UserRole.PROJECT_ADMIN]: 90,
    [UserRole.PROJECT_MANAGER]: 80,
    [UserRole.PROJECT_IT_MANAGER]: 70,
    [UserRole.WAREHOUSE_MANAGER]: 60,
    [UserRole.SERVICE_CENTER_MANAGER]: 65,
    [UserRole.REPAIR_USER]: 50,
    [UserRole.USER]: 10,
    [UserRole.FIELD_TECHNICIAN]: 40,
    [UserRole.READONLY_USER]: 5
};

/**
 * PermissionService - Kullanıcı rollerine ve izinlerine göre erişim kontrolü sağlar
 */
export class PermissionService {
    /**
     * Verilen kullanıcı rolü için izinleri döndürür
     */
    static getPermissionsForRole(role: string): Permission[] {
        // Rol string olarak geçirildiğinde UserRole enum değerine çeviriyoruz
        const userRole = role as UserRole;
        return rolePermissions[userRole] || [];
    }

    /**
     * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     */
    static hasPermission(permission: Permission): boolean {
        const authStore = useAuthStore();
        const userPermissions = this.getUserPermissions();
        
        // Kullanıcıya özel override edilmiş izin varsa onu kontrol et
        if (authStore.userInfo?.customPermissions) {
            const customPermission = authStore.userInfo.customPermissions[permission];
            if (customPermission !== undefined) {
                return customPermission; // Özelleştirilmiş izni döndür
            }
        }
        
        // Varsayılan izinlere bakarak kontrol et
        return userPermissions.includes(permission);
    }
    
    /**
     * Mevcut oturum açmış kullanıcının rollerine göre tüm izinlerini döndürür
     */
    static getUserPermissions(): Permission[] {
        const authStore = useAuthStore();
        
        // Ana rol
        const mainRolePermissions = authStore.userInfo?.role 
            ? rolePermissions[authStore.userInfo.role as UserRole] || []
            : [];
            
        // Ek roller (eğer varsa)
        const additionalRoles = authStore.userInfo?.roles || [];
        
        // Kullanıcının tüm rollerindeki izinleri birleştir
        const permissions = new Set<Permission>(mainRolePermissions);
        
        additionalRoles.forEach(role => {
            if (rolePermissions[role as UserRole]) {
                rolePermissions[role as UserRole].forEach(permission => 
                    permissions.add(permission)
                );
            }
        });
        
        // Kullanıcıya özel izinleri ekle
        if (authStore.userInfo?.id && userSpecificPermissions[authStore.userInfo.id]) {
            userSpecificPermissions[authStore.userInfo.id].forEach(permission => 
                permissions.add(permission)
            );
        }
        
        return Array.from(permissions);
    }
    
    /**
     * Mevcut oturum açmış kullanıcının belirli bir role sahip olup olmadığını kontrol eder
     */
    static hasRole(role: UserRole): boolean {
        const authStore = useAuthStore();
        
        // Ana rol kontrolü
        if (authStore.userInfo?.role === role) {
            return true;
        }
        
        // Ek roller kontrolü
        const additionalRoles = authStore.userInfo?.roles || [];
        return additionalRoles.includes(role);
    }
    
    /**
     * Bir rolün diğer bir rol üzerinde yetkisi olup olmadığını kontrol eder
     */
    static hasAuthorityOver(superiorRole: string, subordinateRole: string): boolean {
        return roleHierarchy[superiorRole as UserRole] > roleHierarchy[subordinateRole as UserRole];
    }
    
    /**
     * Birden fazla izin kontrolü yapar, hepsine sahip olmalı
     */
    static hasAllPermissions(permissions: Permission[]): boolean {
        return permissions.every(permission => this.hasPermission(permission));
    }
    
    /**
     * Birden fazla izin kontrolü yapar, en az birine sahip olmalı
     */
    static hasAnyPermission(permissions: Permission[]): boolean {
        return permissions.some(permission => this.hasPermission(permission));
    }
    
    /**
     * Proje bağlamında kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     */
    static hasProjectPermission(projectId: string, permission: Permission): boolean {
        const authStore = useAuthStore();
        
        // Admin her zaman her izne sahiptir
        if (this.hasRole(UserRole.ADMIN)) {
            return true;
        }
        
        // Kullanıcının bu projede özel bir rolü var mı kontrol et
        const projectRole = authStore.userProjectRoles[projectId];
        
        if (!projectRole) {
            return false; // Bu projede rolü yoksa yetkisi de yok
        }
        
        // Proje rolüne göre izinleri kontrol et
        switch (projectRole) {
            case UserRole.PROJECT_ADMIN:
                return rolePermissions[UserRole.PROJECT_ADMIN].includes(permission);
            case UserRole.PROJECT_MANAGER:
                return rolePermissions[UserRole.PROJECT_MANAGER].includes(permission);
            case UserRole.PROJECT_IT_MANAGER:
                return rolePermissions[UserRole.PROJECT_IT_MANAGER].includes(permission);
            case UserRole.WAREHOUSE_MANAGER:
                return rolePermissions[UserRole.WAREHOUSE_MANAGER].includes(permission);
            default:
                return rolePermissions[UserRole.USER].includes(permission);
        }
    }
}

/**
 * Belirli bir kullanıcıya özel izin ekler
 */
export function addPermissionToUser(userId: string, permission: Permission): void {
    if (!userSpecificPermissions[userId]) {
        userSpecificPermissions[userId] = [];
    }
    
    if (!userSpecificPermissions[userId].includes(permission)) {
        userSpecificPermissions[userId].push(permission);
    }
}

/**
 * Belirli bir kullanıcıdan özel izni kaldırır
 */
export function removePermissionFromUser(userId: string, permission: Permission): void {
    if (userSpecificPermissions[userId]) {
        userSpecificPermissions[userId] = userSpecificPermissions[userId].filter(p => p !== permission);
    }
}

// Kolay kullanım için export edilen yardımcı fonksiyonlar
export const hasPermission = (permission: Permission): boolean => {
    return PermissionService.hasPermission(permission);
};

export const hasRole = (role: UserRole): boolean => {
    return PermissionService.hasRole(role);
};

export const hasAuthorityOver = (superiorRole: string, subordinateRole: string): boolean => {
    return PermissionService.hasAuthorityOver(superiorRole, subordinateRole);
};

export default PermissionService;
