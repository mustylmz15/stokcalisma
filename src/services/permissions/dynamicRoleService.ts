import { collection, doc, getDocs, setDoc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Rol nesnesini temsil eden arayüz
 */
export interface Role {
    id: string;          // Rol ID'si (ör: "admin", "proje_admin" vb.)
    name: string;        // Rol adı (ör: "Admin", "Proje Admin" vb.)
    description: string; // Rol açıklaması
    priority: number;    // Rol önceliği/hiyerarşisi
    weight?: number;     // Rol ağırlığı (düşük değer daha yüksek yetkiyi ifade eder) 
    isSystem?: boolean;  // Sistem rolü mü (silinemeyen)
    createdAt: string;   // Oluşturulma tarihi
    updatedAt?: string;  // Güncelleme tarihi
}

/**
 * Kullanıcı-rol ilişkisini temsil eden arayüz
 */
export interface UserRole {
    userId: string;      // Kullanıcı ID'si
    roleId: string;      // Rol ID'si
    projectId?: string;  // Proje ID'si (proje bazlı roller için)
    expiresAt?: string;  // Geçerlilik süresi (opsiyonel, geçici yetkiler için)
    grantedBy: string;   // Bu rolü veren kullanıcı ID'si
    grantedAt: string;   // Veriliş tarihi
}

/**
 * Rol-izin ilişkisini temsil eden arayüz
 */
export interface RolePermission {
    roleId: string;      // Rol ID'si
    permissionId: string; // İzin ID'si
    projectId?: string;  // Proje ID'si (projeli izinler için)
}

/**
 * Dinamik rol yönetimi servisi
 */
class DynamicRoleService {
    private rolesCollection = collection(db, 'roles');
    private userRolesCollection = collection(db, 'user_roles');
    private rolePermissionsCollection = collection(db, 'role_permissions');

    /**
     * Tüm rolleri getirir
     */
    async getAllRoles(): Promise<Role[]> {
        try {
            const querySnapshot = await getDocs(this.rolesCollection);
            return querySnapshot.docs.map(doc => {
                return { id: doc.id, ...doc.data() } as Role;
            });
        } catch (error) {
            console.error('Roller getirilirken hata oluştu:', error);
            throw error;
        }
    }

    /**
     * Belirli bir rolü ID'ye göre getirir
     */
    async getRole(roleId: string): Promise<Role | null> {
        try {
            const roleDoc = await getDoc(doc(this.rolesCollection, roleId));
            if (roleDoc.exists()) {
                return { id: roleDoc.id, ...roleDoc.data() } as Role;
            }
            return null;
        } catch (error) {
            console.error(`Rol bulunamadı: ${roleId}`, error);
            throw error;
        }
    }

    /**
     * Yeni bir rol oluşturur
     */
    async createRole(role: Omit<Role, 'id' | 'createdAt'>): Promise<Role> {
        try {
            // Benzersiz bir ID oluştur veya sağlanan id'yi kullan
            const roleId = role.name.toLowerCase().replace(/\s+/g, '_');
            const now = new Date().toISOString();
            
            const newRole: Role = {
                id: roleId,
                name: role.name,
                description: role.description,
                priority: role.priority,
                isSystem: role.isSystem || false,
                createdAt: now,
                updatedAt: now
            };
            
            // Firestore'a kaydet
            await setDoc(doc(this.rolesCollection, roleId), newRole);
            
            return newRole;
        } catch (error) {
            console.error('Rol oluşturulurken hata:', error);
            throw error;
        }
    }

    /**
     * Bir rolü günceller
     */
    async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
        try {
            const roleRef = doc(this.rolesCollection, roleId);
            const roleDoc = await getDoc(roleRef);
            
            if (!roleDoc.exists()) {
                throw new Error(`Rol bulunamadı: ${roleId}`);
            }
            
            // Sistem rollerinin değiştirilmesini engelle
            if (roleDoc.data()?.isSystem && updates.isSystem === false) {
                throw new Error('Sistem rolleri değiştirilemez.');
            }
            
            const updatedRole = {
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            await updateDoc(roleRef, updatedRole);
            
            return { id: roleId, ...roleDoc.data(), ...updatedRole } as Role;
        } catch (error) {
            console.error(`Rol güncellenirken hata: ${roleId}`, error);
            throw error;
        }
    }

    /**
     * Bir rolü siler
     */
    async deleteRole(roleId: string): Promise<boolean> {
        try {
            const roleRef = doc(this.rolesCollection, roleId);
            const roleDoc = await getDoc(roleRef);
            
            if (!roleDoc.exists()) {
                throw new Error(`Rol bulunamadı: ${roleId}`);
            }
            
            // Sistem rollerinin silinmesini engelle
            if (roleDoc.data()?.isSystem) {
                throw new Error('Sistem rolleri silinemez.');
            }
            
            // Önce bu role ait tüm kullanıcı ilişkilerini sil
            const userRolesQuery = query(this.userRolesCollection, where('roleId', '==', roleId));
            const userRolesSnapshot = await getDocs(userRolesQuery);
            
            const deleteUserRolePromises = userRolesSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteUserRolePromises);
            
            // Sonra bu role ait tüm izin ilişkilerini sil
            const rolePermissionsQuery = query(this.rolePermissionsCollection, where('roleId', '==', roleId));
            const rolePermissionsSnapshot = await getDocs(rolePermissionsQuery);
            
            const deleteRolePermissionPromises = rolePermissionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteRolePermissionPromises);
            
            // Son olarak rolü sil
            await deleteDoc(roleRef);
            
            return true;
        } catch (error) {
            console.error(`Rol silinirken hata: ${roleId}`, error);
            throw error;
        }
    }

    /**
     * Kullanıcıya rol atar
     */
    async assignRoleToUser(userRole: Omit<UserRole, 'grantedAt'>): Promise<UserRole> {
        try {
            const now = new Date().toISOString();
            const docId = `${userRole.userId}_${userRole.roleId}${userRole.projectId ? '_' + userRole.projectId : ''}`;
            
            const newUserRole: UserRole = {
                userId: userRole.userId,
                roleId: userRole.roleId,
                projectId: userRole.projectId,
                expiresAt: userRole.expiresAt,
                grantedBy: userRole.grantedBy,
                grantedAt: now
            };
            
            await setDoc(doc(this.userRolesCollection, docId), newUserRole);
            
            return newUserRole;
        } catch (error) {
            console.error('Kullanıcıya rol atanırken hata:', error);
            throw error;
        }
    }

    /**
     * Kullanıcıdan rolü kaldırır
     */
    async removeRoleFromUser(userId: string, roleId: string, projectId?: string): Promise<boolean> {
        try {
            const docId = `${userId}_${roleId}${projectId ? '_' + projectId : ''}`;
            await deleteDoc(doc(this.userRolesCollection, docId));
            return true;
        } catch (error) {
            console.error('Kullanıcıdan rol kaldırılırken hata:', error);
            throw error;
        }
    }

    /**
     * Belirli bir kullanıcının tüm rollerini getirir
     */
    async getUserRoles(userId: string, includeExpired: boolean = false): Promise<UserRole[]> {
        try {
            const q = query(this.userRolesCollection, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            const now = new Date().toISOString();
            
            return querySnapshot.docs
                .map(doc => doc.data() as UserRole)
                .filter(userRole => {
                    // Geçerlilik süresini kontrol et
                    if (!includeExpired && userRole.expiresAt) {
                        return userRole.expiresAt > now;
                    }
                    return true;
                });
        } catch (error) {
            console.error(`Kullanıcı rolleri getirilirken hata: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Belirli bir projede kullanıcının rollerini getirir
     */
    async getUserProjectRoles(userId: string, projectId: string): Promise<UserRole[]> {
        try {
            const q = query(
                this.userRolesCollection, 
                where('userId', '==', userId),
                where('projectId', '==', projectId)
            );
            
            const querySnapshot = await getDocs(q);
            const now = new Date().toISOString();
            
            return querySnapshot.docs
                .map(doc => doc.data() as UserRole)
                .filter(userRole => {
                    // Geçerlilik süresini kontrol et
                    if (userRole.expiresAt) {
                        return userRole.expiresAt > now;
                    }
                    return true;
                });
        } catch (error) {
            console.error(`Kullanıcı proje rolleri getirilirken hata: ${userId}/${projectId}`, error);
            throw error;
        }
    }

    /**
     * Belirli bir projeye atanmış tüm kullanıcıları rolleriyle birlikte getirir
     */
    async getProjectUsers(projectId: string): Promise<{ userId: string, roles: string[] }[]> {
        try {
            const q = query(this.userRolesCollection, where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            
            const now = new Date().toISOString();
            const userRoles: Record<string, string[]> = {};
            
            // Her kullanıcının rollerini topla
            querySnapshot.docs
                .map(doc => doc.data() as UserRole)
                .filter(userRole => {
                    // Geçerlilik süresini kontrol et
                    if (userRole.expiresAt) {
                        return userRole.expiresAt > now;
                    }
                    return true;
                })
                .forEach(userRole => {
                    if (!userRoles[userRole.userId]) {
                        userRoles[userRole.userId] = [];
                    }
                    
                    userRoles[userRole.userId].push(userRole.roleId);
                });
            
            // Kullanıcıları rolleriyle birlikte dönüştür
            return Object.entries(userRoles).map(([userId, roles]) => ({
                userId,
                roles
            }));
        } catch (error) {
            console.error(`Proje kullanıcıları getirilirken hata: ${projectId}`, error);
            throw error;
        }
    }

    /**
     * Role izin atar
     */
    async assignPermissionToRole(rolePermission: RolePermission): Promise<RolePermission> {
        try {
            const docId = `${rolePermission.roleId}_${rolePermission.permissionId}${rolePermission.projectId ? '_' + rolePermission.projectId : ''}`;
            
            await setDoc(doc(this.rolePermissionsCollection, docId), rolePermission);
            
            return rolePermission;
        } catch (error) {
            console.error('Role izin atanırken hata:', error);
            throw error;
        }
    }

    /**
     * Rolden izni kaldırır
     */
    async removePermissionFromRole(roleId: string, permissionId: string, projectId?: string): Promise<boolean> {
        try {
            const docId = `${roleId}_${permissionId}${projectId ? '_' + projectId : ''}`;
            await deleteDoc(doc(this.rolePermissionsCollection, docId));
            return true;
        } catch (error) {
            console.error('Rolden izin kaldırılırken hata:', error);
            throw error;
        }
    }

    /**
     * Belirli bir rolün tüm izinlerini getirir
     */
    async getRolePermissions(roleId: string): Promise<string[]> {
        try {
            const q = query(this.rolePermissionsCollection, where('roleId', '==', roleId));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => (doc.data() as RolePermission).permissionId);
        } catch (error) {
            console.error(`Rol izinleri getirilirken hata: ${roleId}`, error);
            throw error;
        }
    }
}

export default new DynamicRoleService();
