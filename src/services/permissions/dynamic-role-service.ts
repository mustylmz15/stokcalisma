import { supabase } from '@/supabase';

// Dinamik Rol Yönetimi Servisi
export interface DynamicRole {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    permissions?: string[];
    is_active: boolean;
    created_at: string;
}

class DynamicRoleService {
    private roles: DynamicRole[] = [];
    private rolesLoaded = false;

    // Supabase'den tüm rolleri çek
    async loadRoles(): Promise<DynamicRole[]> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) {
                console.error('Roller yüklenirken hata:', error);
                // Fallback: Sabit roller döndür
                return this.getFallbackRoles();
            }

            this.roles = data || [];
            this.rolesLoaded = true;
            console.log('Dinamik roller yüklendi:', this.roles);
            return this.roles;
        } catch (error) {
            console.error('Rol servisi hatası:', error);
            return this.getFallbackRoles();
        }
    }

    // Fallback: Sabit roller (Supabase erişilemediğinde)
    private getFallbackRoles(): DynamicRole[] {
        return [
            {
                id: '1',
                name: 'admin',
                display_name: 'Sistem Yöneticisi',
                description: 'Tüm sisteme erişim',
                permissions: ['*'],
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: '2', 
                name: 'proje_admin',
                display_name: 'Proje Yöneticisi',
                description: 'Proje yönetimi yetkisi',
                permissions: ['manage_projects', 'view_inventory'],
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: '3',
                name: 'depo_kullanicisi',
                display_name: 'Depo Kullanıcısı',
                description: 'Depo işlemleri yetkisi',
                permissions: ['view_inventory', 'edit_inventory'],
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: '4',
                name: 'proje_sorumlusu',
                display_name: 'Proje Sorumlusu',
                description: 'Proje operasyonları',
                permissions: ['view_projects', 'view_inventory'],
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: '5',
                name: 'proje_it_sorumlusu',
                display_name: 'Proje IT Sorumlusu',
                description: 'IT cihaz yönetimi',
                permissions: ['manage_it_devices', 'view_projects'],
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: '6',
                name: 'onarim_merkezi_sorumlusu',
                display_name: 'Onarım Merkezi Sorumlusu',
                description: 'Onarım işlemleri yönetimi',
                permissions: ['manage_repair_processes', 'view_faults'],
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: '7',
                name: 'onarim_kullanici',
                display_name: 'Onarım Kullanıcısı',
                description: 'Onarım işlemleri',
                permissions: ['view_faults', 'record_repair_operations'],
                is_active: true,
                created_at: new Date().toISOString()
            }
        ];
    }

    // Tüm aktif rolleri getir
    async getAllRoles(): Promise<DynamicRole[]> {
        if (!this.rolesLoaded) {
            await this.loadRoles();
        }
        return this.roles;
    }

    // Rol adından rol bilgisini bul
    async getRoleByName(roleName: string): Promise<DynamicRole | null> {
        const roles = await this.getAllRoles();
        return roles.find(role => role.name === roleName) || null;
    }

    // Belirtilen rollerin display_name'lerini getir
    async getRoleDisplayNames(roleNames: string[]): Promise<string[]> {
        const roles = await this.getAllRoles();
        return roleNames.map(roleName => {
            const role = roles.find(r => r.name === roleName);
            return role ? role.display_name : roleName;
        });
    }

    // Kullanıcı rolü validasyonu
    async isValidRole(roleName: string): Promise<boolean> {
        const roles = await this.getAllRoles();
        return roles.some(role => role.name === roleName);
    }

    // Rol permissions'ını getir
    async getRolePermissions(roleName: string): Promise<string[]> {
        const role = await this.getRoleByName(roleName);
        return role?.permissions || [];
    }

    // Cache'i temizle (yeniden yüklemek için)
    clearCache(): void {
        this.roles = [];
        this.rolesLoaded = false;
    }

    // Rol oluştur (admin yetkisi gerekir)
    async createRole(roleData: Omit<DynamicRole, 'id' | 'created_at'>): Promise<DynamicRole | null> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .insert([{
                    ...roleData,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('Rol oluşturulurken hata:', error);
                return null;
            }

            // Cache'i güncelleyelim
            this.clearCache();
            return data;
        } catch (error) {
            console.error('Rol oluşturma servisi hatası:', error);
            return null;
        }
    }

    // Rol güncelle (admin yetkisi gerekir)
    async updateRole(roleId: string, updates: Partial<DynamicRole>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('roles')
                .update(updates)
                .eq('id', roleId);

            if (error) {
                console.error('Rol güncellenirken hata:', error);
                return false;
            }

            // Cache'i temizleyelim
            this.clearCache();
            return true;
        } catch (error) {
            console.error('Rol güncelleme servisi hatası:', error);
            return false;
        }
    }
}

// Singleton instance
let dynamicRoleServiceInstance: DynamicRoleService | null = null;

export function useDynamicRoles(): DynamicRoleService {
    if (!dynamicRoleServiceInstance) {
        dynamicRoleServiceInstance = new DynamicRoleService();
    }
    return dynamicRoleServiceInstance;
}

// Menu sisteminde kullanılmak üzere helper
export async function getAvailableRoles(): Promise<string[]> {
    const roleService = useDynamicRoles();
    const roles = await roleService.getAllRoles();
    return roles.map(role => role.name);
}

export default DynamicRoleService;
