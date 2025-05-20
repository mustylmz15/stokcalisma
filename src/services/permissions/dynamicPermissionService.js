import { collection, doc, getDocs, setDoc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import DynamicRoleService from './dynamicRoleService';
import { handleFirebasePermissionError } from '@/firebase/errorHandler';
/**
 * Dinamik izin yönetimi servisi
 */
class DynamicPermissionService {
    permissionsCollection = collection(db, 'permissions');
    userPermissionsCollection = collection(db, 'user_permissions');
    /**
     * Tüm izinleri getirir
     */
    async getAllPermissions() {
        const fetchPermissions = async () => {
            const querySnapshot = await getDocs(this.permissionsCollection);
            return querySnapshot.docs.map(doc => {
                return { id: doc.id, ...doc.data() };
            });
        };
        
        try {
            return await fetchPermissions();
        }
        catch (error) {
            console.error('İzinler getirilirken hata oluştu:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchPermissions);
            } catch (retryError) {
                console.error('İzin verilerini getirme hatası sonrası yeniden deneme başarısız:', retryError);
                // Hata durumunda boş array dön
                return [];
            }
        }
    }
    /**
     * Belirli bir izni ID'ye göre getirir
     */
    async getPermission(permissionId) {
        const fetchPermission = async () => {
            const permissionDoc = await getDoc(doc(this.permissionsCollection, permissionId));
            if (permissionDoc.exists()) {
                return { id: permissionDoc.id, ...permissionDoc.data() };
            }
            return null;
        };
        
        try {
            return await fetchPermission();
        } catch (error) {
            console.error(`İzin bulunamadı: ${permissionId}`, error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, fetchPermission);
            } catch (retryError) {
                console.error(`İzin bilgisini getirme hatası sonrası yeniden deneme başarısız: ${permissionId}`, retryError);
                return null;
            }
        }
    }
    /**
     * Yeni bir izin oluşturur
     */
    async createPermission(permission) {
        const performCreatePermission = async () => {
            // Benzersiz bir ID oluştur veya sağlanan id'yi kullan
            const permissionId = permission.name.toLowerCase().replace(/\s+/g, '_');
            const now = new Date().toISOString();
            const newPermission = {
                id: permissionId,
                name: permission.name,
                description: permission.description,
                category: permission.category,
                isSystem: permission.isSystem || false,
                createdAt: now,
                updatedAt: now
            };
            // Firestore'a kaydet
            await setDoc(doc(this.permissionsCollection, permissionId), newPermission);
            return newPermission;
        };
        
        try {
            return await performCreatePermission();
        }
        catch (error) {
            console.error('İzin oluşturulurken hata:', error);
            try {
                // Yetki hatası durumunda token yenilemeyi dene
                return await handleFirebasePermissionError(error, performCreatePermission);
            } catch (retryError) {
                console.error('İzin oluşturma hatası sonrası yeniden deneme başarısız:', retryError);
                throw retryError;
            }
        }
    }
    /**
     * Bir izni günceller
     */
    async updatePermission(permissionId, updates) {
        try {
            const permissionRef = doc(this.permissionsCollection, permissionId);
            const permissionDoc = await getDoc(permissionRef);
            if (!permissionDoc.exists()) {
                throw new Error(`İzin bulunamadı: ${permissionId}`);
            }
            // Sistem izinlerinin değiştirilmesini engelle
            if (permissionDoc.data()?.isSystem && updates.isSystem === false) {
                throw new Error('Sistem izinleri değiştirilemez.');
            }
            const updatedPermission = {
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(permissionRef, updatedPermission);
            return { id: permissionId, ...permissionDoc.data(), ...updatedPermission };
        }
        catch (error) {
            console.error(`İzin güncellenirken hata: ${permissionId}`, error);
            throw error;
        }
    }
    /**
     * Bir izni siler
     */
    async deletePermission(permissionId) {
        try {
            const permissionRef = doc(this.permissionsCollection, permissionId);
            const permissionDoc = await getDoc(permissionRef);
            if (!permissionDoc.exists()) {
                throw new Error(`İzin bulunamadı: ${permissionId}`);
            }
            // Sistem izinlerinin silinmesini engelle
            if (permissionDoc.data()?.isSystem) {
                throw new Error('Sistem izinleri silinemez.');
            }
            // Önce bu izne ait tüm kullanıcı izin ilişkilerini sil
            const userPermissionsQuery = query(this.userPermissionsCollection, where('permissionId', '==', permissionId));
            const userPermissionsSnapshot = await getDocs(userPermissionsQuery);
            const deleteUserPermissionPromises = userPermissionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteUserPermissionPromises);
            // Son olarak izni sil
            await deleteDoc(permissionRef);
            return true;
        }
        catch (error) {
            console.error(`İzin silinirken hata: ${permissionId}`, error);
            throw error;
        }
    }
    /**
     * Kullanıcıya özel izin atar (izini verir veya engeller)
     */
    async setUserPermission(userPermission) {
        try {
            const now = new Date().toISOString();
            const docId = `${userPermission.userId}_${userPermission.permissionId}${userPermission.projectId ? '_' + userPermission.projectId : ''}`;
            const newUserPermission = {
                userId: userPermission.userId,
                permissionId: userPermission.permissionId,
                projectId: userPermission.projectId,
                expiresAt: userPermission.expiresAt,
                granted: userPermission.granted,
                grantedBy: userPermission.grantedBy,
                grantedAt: now,
                reason: userPermission.reason
            };
            await setDoc(doc(this.userPermissionsCollection, docId), newUserPermission);
            return newUserPermission;
        }
        catch (error) {
            console.error('Kullanıcıya izin atanırken hata:', error);
            throw error;
        }
    }
    /**
     * Kullanıcıdan özel izni kaldırır
     */
    async removeUserPermission(userId, permissionId, projectId) {
        try {
            const docId = `${userId}_${permissionId}${projectId ? '_' + projectId : ''}`;
            await deleteDoc(doc(this.userPermissionsCollection, docId));
            return true;
        }
        catch (error) {
            console.error('Kullanıcıdan özel izin kaldırılırken hata:', error);
            throw error;
        }
    }
    /**
     * Belirli bir kullanıcının özel izinlerini getirir
     */
    async getUserPermissions(userId, includeExpired = false) {
        try {
            const q = query(this.userPermissionsCollection, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            const now = new Date().toISOString();
            return querySnapshot.docs
                .map(doc => doc.data())
                .filter(userPermission => {
                // Geçerlilik süresini kontrol et
                if (!includeExpired && userPermission.expiresAt) {
                    return userPermission.expiresAt > now;
                }
                return true;
            });
        }
        catch (error) {
            console.error(`Kullanıcı özel izinleri getirilirken hata: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Kullanıcının belirli bir projede özel izinlerini getirir
     */
    async getUserProjectPermissions(userId, projectId) {
        try {
            const q = query(this.userPermissionsCollection, where('userId', '==', userId), where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            const now = new Date().toISOString();
            return querySnapshot.docs
                .map(doc => doc.data())
                .filter(userPermission => {
                // Geçerlilik süresini kontrol et
                if (userPermission.expiresAt) {
                    return userPermission.expiresAt > now;
                }
                return true;
            });
        }
        catch (error) {
            console.error(`Kullanıcı proje özel izinleri getirilirken hata: ${userId}/${projectId}`, error);
            throw error;
        }
    }
    /**
     * Belirli bir kullanıcının tüm izinlerini döndürür (rol-tabanlı izinler + özel izinler)
     */
    async getAllUserPermissions(userId) {
        try {
            // 1. Kullanıcının rollerini al
            const userRoles = await DynamicRoleService.getUserRoles(userId);
            // 2. Roller üzerinden izinleri al
            const rolePermissionsMap = {};
            // Her rol için izinleri al ve birleştir
            for (const userRole of userRoles) {
                const rolePermissions = await DynamicRoleService.getRolePermissions(userRole.roleId);
                rolePermissions.forEach(permission => {
                    rolePermissionsMap[permission] = true;
                });
            }
            // 3. Kullanıcının özel izinlerini al
            const userCustomPermissions = await this.getUserPermissions(userId);
            const customPermissionsMap = {};
            // Özel izinleri ekle/üzerine yaz
            userCustomPermissions.forEach(permission => {
                customPermissionsMap[permission.permissionId] = permission.granted;
            });
            // 4. Sonuçları birleştir
            const result = [];
            // Önce rol tabanlı izinleri ekle
            Object.entries(rolePermissionsMap).forEach(([permissionId, granted]) => {
                // Eğer bu izin özel olarak override edilmişse, rol tabanlı izni ekleme
                if (customPermissionsMap[permissionId] === undefined) {
                    result.push({ permissionId, granted, source: 'role' });
                }
            });
            // Sonra özel izinleri ekle
            Object.entries(customPermissionsMap).forEach(([permissionId, granted]) => {
                result.push({ permissionId, granted, source: 'custom' });
            });
            return result;
        }
        catch (error) {
            console.error(`Kullanıcının tüm izinleri getirilirken hata: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     */
    async hasPermission(userId, permissionId, projectId) {
        try {
            // 1. Önce özel izinleri kontrol et (override)
            const customPermissionId = `${userId}_${permissionId}${projectId ? '_' + projectId : ''}`;
            const customPermissionDoc = await getDoc(doc(this.userPermissionsCollection, customPermissionId));
            if (customPermissionDoc.exists()) {
                const customPermission = customPermissionDoc.data();
                // Geçerlilik süresini kontrol et
                if (customPermission.expiresAt) {
                    const now = new Date().toISOString();
                    if (now > customPermission.expiresAt) {
                        // Süresi dolmuş, rollere bakılacak
                    }
                    else {
                        return customPermission.granted;
                    }
                }
                else {
                    return customPermission.granted;
                }
            }
            // 2. Kullanıcının rollerini kontrol et
            let userRoles = [];
            if (projectId) {
                // Proje spesifik roller
                userRoles = await DynamicRoleService.getUserProjectRoles(userId, projectId);
            }
            // Genel roller
            const globalRoles = await DynamicRoleService.getUserRoles(userId);
            userRoles = [...userRoles, ...globalRoles.filter(role => !role.projectId)];
            // Her bir rol için izinleri kontrol et
            for (const role of userRoles) {
                const rolePermissions = await DynamicRoleService.getRolePermissions(role.roleId);
                if (rolePermissions.includes(permissionId)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error(`İzin kontrolü yapılırken hata: ${userId}/${permissionId}`, error);
            throw error;
        }
    }
    /**
     * İzin kategorilerini getirir
     */
    async getPermissionCategories() {
        try {
            const permissions = await this.getAllPermissions();
            const categories = new Set();
            permissions.forEach(permission => {
                categories.add(permission.category);
            });
            return Array.from(categories);
        }
        catch (error) {
            console.error('İzin kategorileri getirilirken hata:', error);
            throw error;
        }
    }
}
export default new DynamicPermissionService();
//# sourceMappingURL=dynamicPermissionService.js.map