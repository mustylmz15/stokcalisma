import { Permission as StaticPermission, UserRole as StaticUserRole, roleHierarchy, rolePermissions } from './permissionService';
import DynamicRoleService from './dynamicRoleService';
import DynamicPermissionService from './dynamicPermissionService';
/**
 * Mevcut statik izin yapısını Firebase'e taşımak için kullanılacak servis
 */
class PermissionMigrationService {
    /**
     * Tüm rolleri ve izinleri Firebase'e aktarır
     */
    async migrateAllRolesAndPermissions() {
        try {
            // Önce rolleri ve izinleri kontrol et, yoksa oluştur
            await this.migrateRoles();
            await this.migratePermissions();
            // Rol-izin ilişkilerini oluştur
            await this.migrateRolePermissions();
            return true;
        }
        catch (error) {
            console.error('İzin ve rol yapısı aktarılırken hata:', error);
            return false;
        }
    }
    /**
     * Statik rolleri Firebase'e aktarır
     */
    async migrateRoles() {
        try {
            console.log('Roller aktarılıyor...');
            // Mevcut rolleri doğrudan UserRole enum'dan al
            const roles = Object.values(StaticUserRole);
            for (const roleKey of roles) {
                // Role adı ve açıklaması için kullanıcı dostu string oluştur
                const name = this.formatRoleName(roleKey);
                const description = `${name} rolü için sistem tarafından oluşturulmuş tanım`;
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
            }
            console.log('Roller başarıyla aktarıldı.');
        }
        catch (error) {
            console.error('Roller aktarılırken hata:', error);
            throw error;
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