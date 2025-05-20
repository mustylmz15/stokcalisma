import { collection, doc, getDocs, setDoc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirebasePermissionError } from '@/firebase/errorHandler';
/**
 * Dinamik rol yönetimi servisi
 */
class DynamicRoleService {
    rolesCollection = collection(db, 'roles');
    userRolesCollection = collection(db, 'user_roles');
    rolePermissionsCollection = collection(db, 'role_permissions');
    
    /**
     * Tüm rolleri getirir
     */
    async getAllRoles() {
        const fetchRoles = async () => {
            const querySnapshot = await getDocs(this.rolesCollection);
            return querySnapshot.docs.map(doc => {
                return { id: doc.id, ...doc.data() };
            });
        };
        
        try {
            return await fetchRoles();
        } catch (error) {
            console.error('Roller getirilirken hata oluştu:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchRoles);
            } catch (retryError) {
                console.error('Rol verilerini getirme hatası sonrası yeniden deneme başarısız:', retryError);
                // Hata durumunda boş array dön
                return [];
            }
        }
    }
    /**
     * Belirli bir rolü ID'ye göre getirir
     */
    async getRole(roleId) {
        const fetchRole = async () => {
            const roleDoc = await getDoc(doc(this.rolesCollection, roleId));
            if (!roleDoc.exists()) {
                console.warn(`Rol bulunamadı: ${roleId}`);
                return null;
            }
            return { id: roleDoc.id, ...roleDoc.data() };
        };
        
        try {
            const role = await fetchRole();
            if (!role) {
                console.warn(`Rol bulunamadı: ${roleId}`);
            }
            return role;
        } catch (error) {
            console.error(`Rol bulunamadı: ${roleId}`, error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchRole);
            } catch (retryError) {
                console.error(`Rol bilgisini getirme hatası sonrası yeniden deneme başarısız: ${roleId}`, retryError);
                return null;
            }
        }
    }
    
    /**
     * Orijinal getRole metodu (yetki hatası işleyicisi olmadan)
     */
    async _getRole(roleId) {
        try {
            const roleDoc = await getDoc(doc(this.rolesCollection, roleId));
            if (roleDoc.exists()) {
                return { id: roleDoc.id, ...roleDoc.data() };
            }
            return null;
        }
        catch (error) {
            console.error(`Rol bulunamadı: ${roleId}`, error);
            throw error;
        }
    }
    /**
     * Yeni bir rol oluşturur
     */
    async createRole(role) {
        const performCreateRole = async () => {
            // Benzersiz bir ID oluştur veya sağlanan id'yi kullan
            const roleId = role.name.toLowerCase().replace(/\s+/g, '_');
            const now = new Date().toISOString();
            const newRole = {
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
        };
        
        try {
            return await performCreateRole();
        } catch (error) {
            console.error('Rol oluşturulurken hata:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, performCreateRole);
            } catch (retryError) {
                console.error('Rol oluşturma hatası sonrası yeniden deneme başarısız:', retryError);
                throw retryError;
            }
        }
    }
    /**
     * Bir rolü günceller
     */
    async updateRole(roleId, updates) {
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
            return { id: roleId, ...roleDoc.data(), ...updatedRole };
        }
        catch (error) {
            console.error(`Rol güncellenirken hata: ${roleId}`, error);
            throw error;
        }
    }
    /**
     * Bir rolü siler
     */
    async deleteRole(roleId) {
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
        }
        catch (error) {
            console.error(`Rol silinirken hata: ${roleId}`, error);
            throw error;
        }
    }
    /**
     * Kullanıcıya rol atar
     */
    async assignRoleToUser(userRole) {
        const performAssignRole = async () => {
            const now = new Date().toISOString();
            const docId = `${userRole.userId}_${userRole.roleId}${userRole.projectId ? '_' + userRole.projectId : ''}`;
            const newUserRole = {
                userId: userRole.userId,
                roleId: userRole.roleId,
                projectId: userRole.projectId,
                expiresAt: userRole.expiresAt,
                grantedBy: userRole.grantedBy,
                grantedAt: now
            };
            await setDoc(doc(this.userRolesCollection, docId), newUserRole);
            return newUserRole;
        };
        
        try {
            return await performAssignRole();
        }
        catch (error) {
            console.error('Kullanıcıya rol atanırken hata:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, performAssignRole);
            } catch (retryError) {
                console.error('Kullanıcıya rol atama hatası sonrası yeniden deneme başarısız:', retryError);
                throw retryError;
            }
        }
    }
    /**
     * Kullanıcıdan rolü kaldırır
     */
    async removeRoleFromUser(userId, roleId, projectId) {
        try {
            const docId = `${userId}_${roleId}${projectId ? '_' + projectId : ''}`;
            await deleteDoc(doc(this.userRolesCollection, docId));
            return true;
        }
        catch (error) {
            console.error('Kullanıcıdan rol kaldırılırken hata:', error);
            throw error;
        }
    }
    /**
     * Belirli bir kullanıcının tüm rollerini getirir
     */
    async getUserRoles(userId, includeExpired = false) {
        const fetchUserRoles = async () => {
            const q = query(this.userRolesCollection, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            const now = new Date().toISOString();
            return querySnapshot.docs
                .map(doc => doc.data())
                .filter(userRole => {
                    // Geçerlilik süresini kontrol et
                    if (!includeExpired && userRole.expiresAt) {
                        return userRole.expiresAt > now;
                    }
                    return true;
                });
        };
        
        try {
            return await fetchUserRoles();
        }
        catch (error) {
            console.error(`Kullanıcı rolleri getirilirken hata: ${userId}`, error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchUserRoles);
            } catch (retryError) {
                console.error(`Kullanıcı rolleri getirme hatası sonrası yeniden deneme başarısız: ${userId}`, retryError);
                return [];
            }
        }
    }
    /**
     * Belirli bir projede kullanıcının rollerini getirir
     */
    async getUserProjectRoles(userId, projectId) {
        const fetchUserProjectRoles = async () => {
            const q = query(this.userRolesCollection, where('userId', '==', userId), where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            const now = new Date().toISOString();
            return querySnapshot.docs
                .map(doc => doc.data())
                .filter(userRole => {
                    // Geçerlilik süresini kontrol et
                    if (userRole.expiresAt) {
                        return userRole.expiresAt > now;
                    }
                    return true;
                });
        };
        
        try {
            return await fetchUserProjectRoles();
        }
        catch (error) {
            console.error(`Kullanıcı proje rolleri getirilirken hata: ${userId}/${projectId}`, error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchUserProjectRoles);
            } catch (retryError) {
                console.error(`Kullanıcı proje rolleri getirme hatası sonrası yeniden deneme başarısız: ${userId}/${projectId}`, retryError);
                return [];
            }
        }
    }
    /**
     * Belirli bir projeye atanmış tüm kullanıcıları rolleriyle birlikte getirir
     */
    async getProjectUsers(projectId) {
        const fetchProjectUsers = async () => {
            const q = query(this.userRolesCollection, where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            const now = new Date().toISOString();
            const userRoles = {};
            // Her kullanıcının rollerini topla
            querySnapshot.docs
                .map(doc => doc.data())
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
        };
        
        try {
            return await fetchProjectUsers();
        }
        catch (error) {
            console.error(`Proje kullanıcıları getirilirken hata: ${projectId}`, error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchProjectUsers);
            } catch (retryError) {
                console.error(`Proje kullanıcıları getirme hatası sonrası yeniden deneme başarısız: ${projectId}`, retryError);
                return [];
            }
        }
    }
    /**
     * Role izin atar
     */
    async assignPermissionToRole(rolePermission) {
        try {
            const docId = `${rolePermission.roleId}_${rolePermission.permissionId}${rolePermission.projectId ? '_' + rolePermission.projectId : ''}`;
            await setDoc(doc(this.rolePermissionsCollection, docId), rolePermission);
            return rolePermission;
        }
        catch (error) {
            console.error('Role izin atanırken hata:', error);
            throw error;
        }
    }
    /**
     * Rolden izni kaldırır
     */
    async removePermissionFromRole(roleId, permissionId, projectId) {
        try {
            const docId = `${roleId}_${permissionId}${projectId ? '_' + projectId : ''}`;
            await deleteDoc(doc(this.rolePermissionsCollection, docId));
            return true;
        }
        catch (error) {
            console.error('Rolden izin kaldırılırken hata:', error);
            throw error;
        }
    }
    /**
     * Belirli bir rolün tüm izinlerini getirir
     */
    async getRolePermissions(roleId) {
        try {
            const q = query(this.rolePermissionsCollection, where('roleId', '==', roleId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data().permissionId);
        }
        catch (error) {
            console.error(`Rol izinleri getirilirken hata: ${roleId}`, error);
            throw error;
        }
    }
}
export default new DynamicRoleService();
//# sourceMappingURL=dynamicRoleService.js.map