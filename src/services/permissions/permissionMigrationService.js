import { Permission as StaticPermission, UserRole as StaticUserRole, roleHierarchy } from './permissionService';
import DynamicRoleService from './dynamicRoleService';
import DynamicPermissionService from './dynamicPermissionService';
import { handleFirebasePermissionError } from '@/firebase/errorHandler';
/**
 * Her rolün varsayılan izinlerini tanımlar
 */
const rolePermissions = {
    [StaticUserRole.ADMIN]: Object.values(StaticPermission), // Admin tüm izinlere sahip
    [StaticUserRole.PROJECT_ADMIN]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.EXPORT_REPORTS,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.ADD_FAULTY_PRODUCT,
        StaticPermission.UPDATE_FAULT_STATUS,
        StaticPermission.VIEW_INVENTORY,
        StaticPermission.MANAGE_INVENTORY,
        StaticPermission.VIEW_PROJECTS,
        StaticPermission.VIEW_USERS,
        StaticPermission.MANAGE_PROJECT_USERS,
        StaticPermission.VIEW_PRODUCTS,
        StaticPermission.MANAGE_PROJECT_PRODUCTS,
        StaticPermission.CENTRAL_WAREHOUSE_TRANSFER,
        StaticPermission.VIEW_IT_DEVICES,
        StaticPermission.MANAGE_IT_DEVICES,
    ],
    [StaticUserRole.PROJECT_MANAGER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.EXPORT_REPORTS,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.ADD_FAULTY_PRODUCT,
        StaticPermission.VIEW_INVENTORY,
        StaticPermission.VIEW_PROJECTS,
        StaticPermission.CENTRAL_WAREHOUSE_TRANSFER,
        StaticPermission.VIEW_IT_DEVICES,
    ],
    [StaticUserRole.PROJECT_IT_MANAGER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.ADD_FAULTY_PRODUCT,
        StaticPermission.VIEW_IT_DEVICES,
        StaticPermission.MANAGE_IT_DEVICES,
    ],
    [StaticUserRole.WAREHOUSE_MANAGER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.ADD_FAULTY_PRODUCT,
        StaticPermission.VIEW_INVENTORY,
        StaticPermission.MANAGE_INVENTORY,
        StaticPermission.TRANSFER_STOCK,
        StaticPermission.REQUEST_FROM_CENTRAL,
    ],
    [StaticUserRole.SERVICE_CENTER_MANAGER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.UPDATE_FAULT_STATUS,
        StaticPermission.ACCESS_REPAIR_REPORTS,
        StaticPermission.MANAGE_REPAIR_PROCESSES,
        StaticPermission.EXPORT_REPORTS,
    ],
    [StaticUserRole.REPAIR_USER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.UPDATE_FAULT_STATUS,
        StaticPermission.MANAGE_REPAIR_PROCESSES,
    ],
    [StaticUserRole.USER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.VIEW_INVENTORY,
        StaticPermission.VIEW_PROJECTS,
        StaticPermission.VIEW_PRODUCTS,
    ],
    [StaticUserRole.FIELD_TECHNICIAN]: [
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.ADD_FAULTY_PRODUCT,
        StaticPermission.VIEW_INVENTORY,
    ],
    [StaticUserRole.READONLY_USER]: [
        StaticPermission.VIEW_DASHBOARD,
        StaticPermission.VIEW_FAULT_MANAGEMENT,
        StaticPermission.VIEW_INVENTORY,
        StaticPermission.VIEW_PROJECTS,
    ]
};
/**
 * Mevcut statik izin yapısını Firebase'e taşımak için kullanılacak servis
 */
class PermissionMigrationService {
    /**
     * Tüm rolleri ve izinleri Firebase'e aktarır
     */
    async migrateAllRolesAndPermissions() {
        const migrateFunction = async () => {
            // Önce rolleri ve izinleri kontrol et, yoksa oluştur
            await this.migrateRoles();
            await this.migratePermissions();
            // Rol-izin ilişkilerini oluştur
            await this.migrateRolePermissions();
            return true;
        };
        
        try {
            return await migrateFunction();
        }
        catch (error) {
            console.error('İzin ve rol yapısı aktarılırken hata:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, migrateFunction);
            } catch (retryError) {
                console.error('İzin ve rol yapısı aktarma hatası sonrası yeniden deneme başarısız:', retryError);
                return false;
            }
        }
    }
    /**
     * Statik rolleri Firebase'e aktarır
     */
    async migrateRoles() {
        const migrateRolesFunction = async () => {
            console.log('Roller aktarılıyor...');
            // Mevcut rolleri doğrudan UserRole enum'dan al
            const roles = Object.values(StaticUserRole);
            for (const roleKey of roles) {
                // Role adı ve açıklaması için kullanıcı dostu string oluştur
                const name = this.formatRoleName(roleKey);
                const description = `${name} rolü için sistem tarafından oluşturulmuş tanım`;
                
                try {
                    // Firebase'de bu rol var mı kontrol et
                    const existingRole = await DynamicRoleService.getRole(roleKey);
                    if (!existingRole) {
                        // Rolü oluştur
                        await DynamicRoleService.createRole({
                            name,
                            description,
                            priority: roleHierarchy[roleKey] || 0,
                            isSystem: true, // Sistem tarafından oluşturulan rol
                        });
                        console.log(`Rol oluşturuldu: ${roleKey}`);
                    }
                    else {
                        console.log(`Rol zaten mevcut: ${roleKey}`);
                    }
                } catch (roleError) {
                    console.warn(`Rol işlenirken hata oluştu (${roleKey}): ${roleError.message}`);
                    // Hata olsa da devam et, diğer rolleri işle
                }
            }
            console.log('Roller başarıyla aktarıldı.');
        };
        
        try {
            await migrateRolesFunction();
        }
        catch (error) {
            console.error('Roller aktarılırken hata:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                await handleFirebasePermissionError(error, migrateRolesFunction);
            } catch (retryError) {
                console.error('Rol aktarma hatası sonrası yeniden deneme başarısız:', retryError);
                // Bu hatayı yükselt, üst seviyede genel hata mesajı gösterilsin
                throw error;
            }
        }
    }
    /**
     * Statik izinleri Firebase'e aktarır
     */
    async migratePermissions() {
        try {
            console.log('İzinler aktarılıyor...');
            // Mevcut izinleri doğrudan Permission enum'dan al
            const permissions = Object.values(StaticPermission);
            // İzinleri kategorilere ayır
            const permissionCategories = {
                'Genel': [],
                'Arıza Yönetimi': [],
                'Envanter': [],
                'Proje': [],
                'Kullanıcı': [],
                'Ürün': [],
                'IT': [],
                'Diğer': []
            };
            // İzinleri kategorilere dağıt
            permissions.forEach(permission => {
                if (permission.includes('fault') || permission.includes('repair')) {
                    permissionCategories['Arıza Yönetimi'].push(permission);
                }
                else if (permission.includes('inventory') || permission.includes('stock') || permission.includes('warehouse')) {
                    permissionCategories['Envanter'].push(permission);
                }
                else if (permission.includes('project')) {
                    permissionCategories['Proje'].push(permission);
                }
                else if (permission.includes('user')) {
                    permissionCategories['Kullanıcı'].push(permission);
                }
                else if (permission.includes('product')) {
                    permissionCategories['Ürün'].push(permission);
                }
                else if (permission.includes('it') || permission.includes('device')) {
                    permissionCategories['IT'].push(permission);
                }
                else if (permission.includes('dashboard') || permission.includes('export')) {
                    permissionCategories['Genel'].push(permission);
                }
                else {
                    permissionCategories['Diğer'].push(permission);
                }
            });
            // Her kategori için izinleri oluştur
            for (const [category, categoryPermissions] of Object.entries(permissionCategories)) {
                for (const permissionKey of categoryPermissions) {
                    // İzin adı ve açıklaması için kullanıcı dostu string oluştur
                    const name = this.formatPermissionName(permissionKey);
                    const description = `${name} izni için sistem tarafından oluşturulmuş tanım`;
                    // Firebase'de bu izin var mı kontrol et
                    const existingPermission = await DynamicPermissionService.getPermission(permissionKey);
                    if (!existingPermission) {
                        // İzni oluştur
                        await DynamicPermissionService.createPermission({
                            name,
                            description,
                            category,
                            isSystem: true, // Sistem tarafından oluşturulan izin
                        });
                        console.log(`İzin oluşturuldu: ${permissionKey} (${category})`);
                    }
                    else {
                        console.log(`İzin zaten mevcut: ${permissionKey}`);
                    }
                }
            }
            console.log('İzinler başarıyla aktarıldı.');
        }
        catch (error) {
            console.error('İzinler aktarılırken hata:', error);
            throw error;
        }
    }
    /**
     * Rol-izin ilişkilerini Firebase'e aktarır
     */
    async migrateRolePermissions() {
        try {
            console.log('Rol-izin ilişkileri aktarılıyor...');
            // Tüm roller için izinleri ata
            for (const [role, permissions] of Object.entries(rolePermissions)) {
                for (const permission of permissions) {
                    // Role bu izni ata
                    await DynamicRoleService.assignPermissionToRole({
                        roleId: role,
                        permissionId: permission,
                    });
                    console.log(`İzin atandı: ${role} => ${permission}`);
                }
            }
            console.log('Rol-izin ilişkileri başarıyla aktarıldı.');
        }
        catch (error) {
            console.error('Rol-izin ilişkileri aktarılırken hata:', error);
            throw error;
        }
    }
    /**
     * Rol adını formatlar
     */
    formatRoleName(roleKey) {
        switch (roleKey) {
            case 'admin':
                return 'Sistem Yöneticisi';
            case 'proje_admin':
                return 'Proje Yöneticisi';
            case 'proje_sorumlusu':
                return 'Proje Sorumlusu';
            case 'proje_it_sorumlusu':
                return 'Proje IT Sorumlusu';
            case 'depo_sorumlusu':
                return 'Depo Sorumlusu';
            case 'onarim_merkezi_sorumlusu':
                return 'Onarım Merkezi Sorumlusu';
            case 'onarim_kullanici':
                return 'Onarım Kullanıcısı';
            case 'user':
                return 'Standart Kullanıcı';
            case 'field_technician':
                return 'Saha Teknisyeni';
            case 'readonly_user':
                return 'Salt Okunur Kullanıcı';
            default:
                return roleKey.charAt(0).toUpperCase() + roleKey.slice(1).replace(/_/g, ' ');
        }
    }
    /**
     * İzin adını formatlar
     */
    formatPermissionName(permissionKey) {
        switch (permissionKey) {
            case 'view_dashboard':
                return 'Dashboard Görüntüleme';
            case 'export_reports':
                return 'Raporları Dışa Aktarma';
            case 'view_fault_management':
                return 'Arıza Yönetimini Görüntüleme';
            case 'add_faulty_product':
                return 'Arızalı Ürün Ekleme';
            case 'update_fault_status':
                return 'Arıza Durumunu Güncelleme';
            case 'access_repair_reports':
                return 'Onarım Raporlarına Erişim';
            case 'manage_repair_processes':
                return 'Onarım Süreçlerini Yönetme';
            case 'view_inventory':
                return 'Envanteri Görüntüleme';
            case 'manage_inventory':
                return 'Envanteri Yönetme';
            case 'transfer_stock':
                return 'Stok Transferi Yapma';
            case 'request_from_central':
                return 'Merkez Depodan Talep Oluşturma';
            case 'central_warehouse_transfer':
                return 'Merkez Depo Transferi Yapma';
            case 'view_projects':
                return 'Projeleri Görüntüleme';
            case 'manage_projects':
                return 'Projeleri Yönetme';
            case 'view_users':
                return 'Kullanıcıları Görüntüleme';
            case 'manage_users':
                return 'Kullanıcıları Yönetme';
            case 'manage_project_users':
                return 'Proje Kullanıcılarını Yönetme';
            case 'view_products':
                return 'Ürünleri Görüntüleme';
            case 'manage_products':
                return 'Ürünleri Yönetme';
            case 'manage_project_products':
                return 'Proje Ürünlerini Yönetme';
            case 'view_it_devices':
                return 'IT Cihazlarını Görüntüleme';
            case 'manage_it_devices':
                return 'IT Cihazlarını Yönetme';
            default:
                return permissionKey.replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
        }
    }
}
export default new PermissionMigrationService();
/**
 * Statik rolleri, izinleri ve rol-izin eşleşmelerini dinamik sisteme eksiksiz aktaran fonksiyon
 */
export async function migrateStaticRolesAndPermissionsToDynamic() {
    // 1. Statik izinleri dinamik sisteme aktar
    for (const permissionKey of Object.keys(StaticPermission)) {
        const permissionId = StaticPermission[permissionKey];
        await DynamicPermissionService.createPermission({
            name: permissionId,
            description: permissionId + ' açıklaması',
            category: 'Genel',
            isSystem: true
        });
    }
    // 2. Statik rolleri dinamik sisteme aktar
    for (const roleKey of Object.keys(StaticUserRole)) {
        const roleId = StaticUserRole[roleKey];
        await DynamicRoleService.createRole({
            name: roleId,
            description: roleId + ' rolü',
            priority: roleHierarchy[roleId] || 0,
            isSystem: true
        });
    }
    // 3. Rol-izin eşleşmelerini dinamik sisteme aktar
    for (const roleId of Object.keys(rolePermissions)) {
        const permissions = rolePermissions[roleId];
        for (const permissionId of permissions) {
            await DynamicRoleService.assignPermissionToRole({
                roleId,
                permissionId
            });
        }
    }
    console.log('Statik roller, izinler ve rol-izin eşleşmeleri dinamik sisteme aktarıldı.');
}
//# sourceMappingURL=permissionMigrationService.js.map