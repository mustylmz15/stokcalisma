import { useAuthStore } from '@/stores/auth-store';
import { getRoleService } from '@/services/auth/role-service';
import { useDynamicRoles } from './dynamic-role-service';

export interface PermissionService {
    hasRole(role: string): boolean;
    hasAnyRole(roles: string[]): boolean;
    hasPermission(permission: string): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    canAccess(requiredRoles?: string[], requiredPermissions?: string[]): boolean;
    getCurrentRoles(): string[];
    getPrimaryRole(): Promise<string>;
    validateUserRoles(): Promise<string[]>;
}

class PermissionServiceImpl implements PermissionService {
    private authStore = useAuthStore();

    hasRole(role: string): boolean {
        try {
            const roleService = getRoleService();
            return roleService.hasRole(role as any);
        } catch (error) {
            // Fallback: auth store'dan kontrol et
            return this.authStore.userInfo?.roles?.includes(role) || false;
        }
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.some(role => this.hasRole(role));
    }

    hasPermission(permission: string): boolean {
        try {
            const roleService = getRoleService();
            return roleService.hasPermission(permission as any);
        } catch (error) {
            // Fallback: basit rol bazlı kontrol
            if (permission === 'manage_users') return this.hasRole('admin');
            if (permission === 'manage_projects') return this.hasAnyRole(['admin', 'proje_admin']);
            if (permission === 'view_inventory') return this.hasAnyRole(['admin', 'depo_kullanicisi', 'proje_admin']);
            return false;
        }
    }

    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some(permission => this.hasPermission(permission));
    }

    canAccess(requiredRoles?: string[], requiredPermissions?: string[]): boolean {
        // Eğer gereksinimler belirtilmemişse erişime izin ver
        if (!requiredRoles && !requiredPermissions) {
            return true;
        }

        // Rol kontrolü
        if (requiredRoles && requiredRoles.length > 0) {
            // Wildcard kontrolü
            if (requiredRoles.includes('*')) {
                return true;
            }
            
            if (!this.hasAnyRole(requiredRoles)) {
                return false;
            }
        }

        // İzin kontrolü
        if (requiredPermissions && requiredPermissions.length > 0) {
            if (!this.hasAnyPermission(requiredPermissions)) {
                return false;
            }
        }

        return true;
    }    // Kullanıcının mevcut rollerini döndür (dinamik rol sistemi ile)
    getCurrentRoles(): string[] {
        return this.authStore.userInfo?.roles || [];
    }

    // Kullanıcının birincil rolünü döndür (dinamik sistem ile)
    async getPrimaryRole(): Promise<string> {
        const roles = this.getCurrentRoles();
        const dynamicRoleService = useDynamicRoles();
        
        // Öncelik sırası: admin, proje_admin, vb.
        const priorityOrder = ['admin', 'proje_admin', 'onarim_merkezi_sorumlusu', 
                              'depo_kullanicisi', 'proje_sorumlusu', 'proje_it_sorumlusu', 
                              'onarim_kullanici'];
        
        for (const role of priorityOrder) {
            if (roles.includes(role)) {
                // Rolün gerçekten geçerli olduğunu kontrol et
                const isValid = await dynamicRoleService.isValidRole(role);
                if (isValid) return role;
            }
        }
        
        return roles[0] || 'user';
    }

    // Dinamik rol doğrulama
    async validateUserRoles(): Promise<string[]> {
        const currentRoles = this.getCurrentRoles();
        const dynamicRoleService = useDynamicRoles();
        
        // Tüm rollerin geçerli olduğunu kontrol et
        const validRoles: string[] = [];
        for (const role of currentRoles) {
            const isValid = await dynamicRoleService.isValidRole(role);
            if (isValid) {
                validRoles.push(role);
            } else {
                console.warn(`Geçersiz rol bulundu: ${role}`);
            }
        }
        
        return validRoles;
    }
}

// Singleton instance
let permissionServiceInstance: PermissionService | null = null;

export function usePermissions(): PermissionService {
    if (!permissionServiceInstance) {
        permissionServiceInstance = new PermissionServiceImpl();
    }
    return permissionServiceInstance;
}

// Vue 3 Composable
export function useRoleGuard() {
    const permissions = usePermissions();
    
    return {
        hasRole: permissions.hasRole.bind(permissions),
        hasAnyRole: permissions.hasAnyRole.bind(permissions),
        hasPermission: permissions.hasPermission.bind(permissions),
        hasAnyPermission: permissions.hasAnyPermission.bind(permissions),
        canAccess: permissions.canAccess.bind(permissions),
        getCurrentRoles: permissions.getCurrentRoles.bind(permissions),
        getPrimaryRole: permissions.getPrimaryRole.bind(permissions),
        validateUserRoles: permissions.validateUserRoles.bind(permissions)
    };
}

// Standalone helper functions
export function canAccess(userRoles: string[], userPermissions: string[], requiredRoles?: string[], requiredPermissions?: string[]): boolean {
    // Eğer gereksinimler belirtilmemişse erişime izin ver
    if (!requiredRoles && !requiredPermissions) {
        return true;
    }

    // Rol kontrolü
    if (requiredRoles && requiredRoles.length > 0) {
        // Wildcard kontrolü
        if (requiredRoles.includes('*')) {
            return true;
        }
        
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        if (!hasRequiredRole) {
            return false;
        }
    }

    // İzin kontrolü
    if (requiredPermissions && requiredPermissions.length > 0) {
        const hasRequiredPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
        if (!hasRequiredPermission) {
            return false;
        }
    }

    return true;
}
