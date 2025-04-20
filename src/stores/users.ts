import { defineStore } from 'pinia';
import { UserDocument, UserRole, UpdateUserData } from './auth-store';
import { userService } from '@/services/userService';

// Store'a özel interface'ler
interface UsersState {
    users: UserDocument[];
}

interface UserResult {
    success: boolean;
    user?: UserDocument;
    message?: string;
}

// Users store tanımı
export const useUsersStore = defineStore('users', {
    state: (): UsersState => ({
        users: []
    }),

    actions: {
        // Store'u başlat - Firebase'den kullanıcıları yükle
        async initializeStore() {
            try {
                const users = await userService.getAllUsers();
                this.users = users.map(user => ({
                    ...user,
                    role: user.role as UserRole
                }));
            } catch (error) {
                console.error('Kullanıcılar yüklenirken hata oluştu:', error);
                this.users = [];
            }
        },

        // Varsayılan kullanıcıları yükle (sadece geliştirme amaçlı)
        async resetToDefaults() {
            try {
                // Mevcut kullanıcıları kontrol et
                const users = await userService.getAllUsers();
                
                // Eğer hiç kullanıcı yoksa admin kullanıcısı oluştur
                if (users.length === 0) {
                    await userService.register({
                        email: 'deneme@deneme.com',
                        password: 'deneme123',
                        name: 'Admin Kullanıcı',
                        role: 'admin'
                    });
                    
                    // Kullanıcıları yeniden yükle
                    await this.initializeStore();
                }
            } catch (error) {
                console.error('Varsayılan kullanıcılar oluşturulurken hata:', error);
            }
        },

        // Kullanıcı ekle - Firebase kullanarak
        async addUser(userData: Partial<UserDocument>): Promise<UserResult> {
            try {
                // Email kontrolü
                if (!userData.email) {
                    return { success: false, message: 'Email adresi zorunludur' };
                }
                
                // Şifre kontrolü - Firebase için gerekli
                if (!userData.password) {
                    return { success: false, message: 'Şifre zorunludur' };
                }
                
                // Firebase'e kullanıcı ekle
                const newUser = await userService.register({
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                    role: userData.role as string,
                    phone: userData.phone,
                    depot: userData.depot,
                    avatar: userData.avatar
                });
                
                // Store'u güncelle
                await this.initializeStore();
                
                return { success: true, user: { ...newUser, role: newUser.role as UserRole } };
            } catch (error: any) {
                return { success: false, message: error.message || 'Kullanıcı eklenirken hata oluştu' };
            }
        },

        // Kullanıcı güncelle - Firebase kullanarak
        async updateUser(email: string, updatedData: UpdateUserData): Promise<UserResult> {
            try {
                // Kullanıcıyı bul
                const user = this.users.find(user => user.email === email);
                if (!user) {
                    return { success: false, message: 'Kullanıcı bulunamadı' };
                }
                
                // Firebase'de kullanıcıyı güncelle
                const updatedUser = await userService.updateUser(user.id, {
                    name: updatedData.name,
                    role: updatedData.role,
                    phone: updatedData.phone,
                    depot: updatedData.depot,
                    avatar: updatedData.avatar
                });
                
                // Store'u güncelle
                await this.initializeStore();
                
                return { success: true, user: { ...updatedUser, role: updatedUser.role as UserRole } };
            } catch (error: any) {
                return { success: false, message: error.message || 'Kullanıcı güncellenirken hata oluştu' };
            }
        },

        // Kullanıcı sil - Firebase kullanarak
        async deleteUser(email: string): Promise<boolean> {
            try {
                // Kullanıcıyı bul
                const user = this.users.find(user => user.email === email);
                if (!user) {
                    return false;
                }
                
                // Firebase'den kullanıcıyı sil
                await userService.deleteUser(user.id);
                
                // Store'u güncelle
                await this.$patch((state) => {
                    state.users = [];
                });
                
                return true;
            } catch (error) {
                console.error('Kullanıcı silinirken hata:', error);
                return false;
            }
        },

        // Son giriş zamanını güncelle - Firebase Auth tarafından otomatik yapılıyor
        // Bu metod sadece uyumluluk için korundu
        async updateLastLogin(email: string): Promise<boolean> {
            // Firebase Auth, giriş yapıldığında lastLogin'i otomatik güncelliyor
            // userService.login metodu içinde yapılıyor
            return true;
        },

        // Kullanıcı bilgilerini doğrula - Firebase Auth kullanarak
        // Bu metod sadece uyumluluk için korundu, asıl doğrulama auth-store'da yapılıyor
        verifyCredentials(email: string, password: string): UserDocument | null {
            // Firebase Auth kullanıldığı için bu metod artık kullanılmıyor
            // Doğrulama işlemi auth-store.ts içindeki login metodu ile yapılıyor
            return null;
        },

        // Email ile kullanıcı bul
        getUserByEmail(email: string): UserDocument | undefined {
            return this.users.find(user => user.email === email);
        }
    },
    
    // Firebase kullanıldığı için persist özelliği kaldırıldı
    // Bu ayar, store verilerinin localStorage'a kaydedilmesini engeller
    persist: false
});