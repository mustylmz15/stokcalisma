// Menü konfigürasyonu - Dinamik rol bazlı sidebar sistemi
import { useDynamicRoles } from '@/services/permissions/dynamic-role-service';
export interface MenuItem {
    id: string;
    title: string;
    path?: string;
    icon?: string;
    roles?: string[]; // Hangi roller görebilir
    permissions?: string[]; // Hangi izinler gerekli
    children?: MenuItem[];
    isHeader?: boolean; // Başlık mı
    isGroup?: boolean; // Grup mu
}

export const MENU_CONFIG: MenuItem[] = [    // Dashboard - Herkes erişebilir
    {
        id: 'dashboard',
        title: 'Anasayfa',
        path: '/',        icon: 'icon-menu-dashboard',
        roles: ['*'] // Tüm roller
    },

    // Uygulamalar Başlığı
    {
        id: 'apps-header',
        title: 'Uygulamalar',
        isHeader: true
    },

    // Uygulamalar Grubu
    {
        id: 'apps-group',
        title: 'Uygulamalar',
        icon: 'icon-menu-apps',
        isGroup: true,
        children: [
            {
                id: 'chat',
                title: 'Sohbet',
                path: '/apps/chat'
            },
            {
                id: 'mailbox',
                title: 'Posta',
                path: '/apps/mailbox'
            },
            {
                id: 'todolist',
                title: 'Yapılacaklar',
                path: '/apps/todolist'
            },
            {
                id: 'notes',
                title: 'Notlar',
                path: '/apps/notes'
            }
        ]
    },

    // Envanter Yönetimi Başlığı
    {
        id: 'inventory-header',
        title: 'Envanter Yönetimi',
        isHeader: true
    },

    // Envanter Grubu
    {
        id: 'inventory-group',
        title: 'ENVANTER',
        icon: 'icon-menu-widgets',
        isGroup: true,
        roles: ['admin', 'depo_kullanicisi', 'proje_admin', 'proje_sorumlusu', 'onarim_merkezi_sorumlusu'],
        children: [
            {
                id: 'inventory-home',
                title: 'Anasayfa',
                path: '/inventory'
            },
            {
                id: 'inventory-products',
                title: 'Ürünler',
                path: '/inventory/products',
                roles: ['admin']
            },            {
                id: 'inventory-stocks',
                title: 'Stoklar',
                path: '/inventory/stocks'
            },
            {
                id: 'inventory-categories',
                title: 'Kategoriler',
                path: '/inventory/categories',
                roles: ['admin']
            },
            {
                id: 'inventory-serialized',
                title: 'Seri Numaralı Envanter',
                path: '/inventory/serialized',
                roles: ['admin', 'depo_kullanicisi', 'proje_admin']
            }
        ]
    },

    // Projeler Grubu
    {
        id: 'projects-group',
        title: 'PROJELER',
        icon: 'icon-menu-widgets',
        isGroup: true,
        roles: ['admin', 'proje_admin', 'proje_sorumlusu', 'proje_it_sorumlusu'],
        children: [
            {
                id: 'projects-home',
                title: 'Projeler',
                path: '/projeler'
            }
        ]
    },

    // Arıza Yönetimi Grubu
    {
        id: 'fault-group',
        title: 'ARIZA YÖNETİMİ',
        icon: 'icon-menu-widgets',
        isGroup: true,
        roles: ['admin', 'onarim_merkezi_sorumlusu', 'onarim_kullanici', 'depo_kullanicisi'],
        children: [
            {
                id: 'fault-home',
                title: 'Arızalı Ürünler',
                path: '/ariza-yonetimi'
            },
            {
                id: 'fault-setup',
                title: 'Kurulum',
                path: '/ariza-yonetimi/kurulum',
                roles: ['admin']
            }
        ]
    },

    // Depo Yönetimi Grubu
    {
        id: 'warehouse-group',
        title: 'DEPO YÖNETİMİ',
        icon: 'icon-menu-invoice',
        isGroup: true,
        roles: ['admin', 'warehouse_manager', 'depo_kullanicisi'],
        children: [
            {
                id: 'warehouse-management',
                title: 'Depo Yönetimi',
                path: '/warehouse-management',
                roles: ['admin', 'warehouse_manager']
            },
            {
                id: 'warehouse-stocks',
                title: 'Depo Stokları',
                path: '/warehouse-stocks',
                roles: ['admin', 'warehouse_manager', 'depo_kullanicisi']
            },
            {
                id: 'warehouse-transfers',
                title: 'Depo Transferleri',
                path: '/warehouse-transfers',
                roles: ['admin', 'warehouse_manager']
            }
        ]
    },

    // Kullanıcı ve Sayfalar Başlığı
    {
        id: 'users-header',
        title: 'Kullanıcı ve Sayfalar',
        isHeader: true
    },

    // Profil - Herkes erişebilir
    {
        id: 'profile-group',
        title: 'Profil',
        icon: 'icon-menu-users',
        isGroup: true,
        children: [
            {
                id: 'profile',
                title: 'Profil',
                path: '/users/profile'
            }
        ]
    },

    // Yönetim - Sadece admin
    {
        id: 'admin-group',
        title: 'Yönetim',
        icon: 'icon-menu-users',
        isGroup: true,
        roles: ['admin'],
        children: [
            {
                id: 'user-management',
                title: 'Kullanıcı Yönetimi',
                path: '/users/kullanici-yonetimi'
            },
            {
                id: 'role-management',
                title: 'Rol Yönetimi',
                path: '/users/role-permission-management'
            },
            {                id: 'project-management',
                title: 'Proje Yönetimi',
                path: '/projeler'
            }
        ]
    }
];

// Dinamik rol kontrolü yardımcı fonksiyonu
export async function hasAccessAsync(item: MenuItem, userRoles: string[], userPermissions: string[] = []): Promise<boolean> {
    // Eğer rol belirtilmemişse herkes erişebilir
    if (!item.roles && !item.permissions) {
        return true;
    }

    // Wildcard kontrolü
    if (item.roles?.includes('*')) {
        return true;
    }

    // Dinamik rol doğrulama
    const dynamicRoleService = useDynamicRoles();
    
    // Rol kontrolü
    if (item.roles && item.roles.length > 0) {
        let hasValidRole = false;
        for (const role of item.roles) {
            if (userRoles.includes(role)) {
                // Rolün gerçekten geçerli olduğunu kontrol et
                const isValid = await dynamicRoleService.isValidRole(role);
                if (isValid) {
                    hasValidRole = true;
                    break;
                }
            }
        }
        if (!hasValidRole) return false;
    }

    // İzin kontrolü
    if (item.permissions && item.permissions.length > 0) {
        const hasPermission = item.permissions.some(permission => userPermissions.includes(permission));
        if (!hasPermission) return false;
    }

    return true;
}

// Senkron rol kontrolü (geriye uyumluluk için)
export function hasAccess(item: MenuItem, userRoles: string[], userPermissions: string[] = []): boolean {
    // Eğer rol belirtilmemişse herkes erişebilir
    if (!item.roles && !item.permissions) {
        return true;
    }

    // Wildcard kontrolü
    if (item.roles?.includes('*')) {
        return true;
    }

    // Basit rol kontrolü (dinamik kontrol olmadan)
    if (item.roles && item.roles.length > 0) {
        const hasRole = item.roles.some(role => userRoles.includes(role));
        if (!hasRole) return false;
    }

    // İzin kontrolü
    if (item.permissions && item.permissions.length > 0) {
        const hasPermission = item.permissions.some(permission => userPermissions.includes(permission));
        if (!hasPermission) return false;
    }

    return true;
}

// Dinamik filtrelenmiş menü oluşturma (async)
export async function getFilteredMenuAsync(userRoles: string[], userPermissions: string[] = []): Promise<MenuItem[]> {
    const filteredItems: MenuItem[] = [];
    
    for (const item of MENU_CONFIG) {
        const hasItemAccess = await hasAccessAsync(item, userRoles, userPermissions);
        if (hasItemAccess) {
            if (item.children) {
                const filteredChildren: MenuItem[] = [];
                for (const child of item.children) {
                    const hasChildAccess = await hasAccessAsync(child, userRoles, userPermissions);
                    if (hasChildAccess) {
                        filteredChildren.push(child);
                    }
                }
                
                // Çocukları olan gruplarda çocuk yoksa grubu da kaldır
                if (item.isGroup && filteredChildren.length === 0) {
                    continue;
                }
                
                filteredItems.push({
                    ...item,
                    children: filteredChildren
                });
            } else {
                filteredItems.push(item);
            }
        }
    }
    
    return filteredItems;
}

// Senkron filtrelenmiş menü oluşturma (geriye uyumluluk)
export function getFilteredMenu(userRoles: string[], userPermissions: string[] = []): MenuItem[] {
    return MENU_CONFIG
        .filter(item => hasAccess(item, userRoles, userPermissions))
        .map(item => {
            if (item.children) {
                return {
                    ...item,
                    children: item.children.filter(child => hasAccess(child, userRoles, userPermissions))
                };
            }
            return item;
        })
        .filter(item => {
            // Çocukları olmayan grupları filtrele
            if (item.isGroup && item.children && item.children.length === 0) {
                return false;
            }
            return true;
        });
}
