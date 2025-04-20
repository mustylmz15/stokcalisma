import { defineStore } from 'pinia';
import { DocumentData } from 'firebase/firestore';
import { auth } from '@/firebase';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { userService, getUserProjects } from '@/services/userService';

// Login için kullanılacak interface
export interface LoginCredentials {
    email: string;
    password: string;
}

// Temel kullanıcı interface'i
export interface BaseUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone: string;
    avatar: string;
    lastLogin: string;
    depot?: string | null;
    canEdit: boolean;
}

// ValidUser interface'i (aktif kullanıcılar için)
export interface ValidUser extends BaseUser {
    isActive: boolean;
    password?: string; // Şifre alanını opsiyonel olarak ekliyoruz
}

// Kullanıcı rollerini tanımlayan type
export type UserRole = 'admin' | 'user' | 'observer' | 'depo_sorumlusu' | 'proje_admin' | 'ariza_merkez';

// Firestore'dan gelen kullanıcı verisi için interface
export interface UserDocument {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    lastLogin: string;
    phone: string;
    depot?: string | null;
    avatar: string;
    canEdit: boolean;
    password?: string; // Şifre alanını opsiyonel olarak ekliyoruz
}

// Login yanıtı için interface
export interface LoginResponse {
    user: UserDocument;
    token: string;
}

// Kullanıcı güncellemesi için interface
export interface UpdateUserData {
    name?: string;
    phone?: string;
    role?: UserRole;
    avatar?: string;
    depot?: string | null;
    password?: string;
    isActive?: boolean;
    projectId?: string | null; // Kullanıcının bağlı olduğu proje ID'si
}

// API yanıtları için interface
export interface UserResponse {
    success: boolean;
    user?: UserDocument;
    message?: string;
}

// Auth store tanımı
export const useAuthStore = defineStore('auth', {
    state: () => ({
        isLoggedIn: false,
        userInfo: null as UserDocument | null,
        isDemoDataLoaded: false,
        authReady: false, // Auth durumunun hazır olup olmadığını kontrol etmek için
        currentProjectId: null as string | null, // Aktif proje ID'si
        userProjectRoles: {} as Record<string, string>, // Kullanıcının projeler bazındaki rolleri
        // Auth listener'ını temizlemek için ekledim
        authUnsubscribe: null as Unsubscribe | null,
    }),
    getters: {
        // Kullanıcının admin rolü olup olmadığını kontrol et
        isAdmin(state): boolean {
            return state.userInfo?.role === 'admin';
        },

        // Kullanıcının proje admin rolü olup olmadığını kontrol et
        isProjectAdmin(state): boolean {
            return state.userInfo?.role === 'proje_admin' || this.isAdmin;
        },

        // Kullanıcının depo sorumlusumu olup olmadığını kontrol et
        isWarehouseManager(state): boolean {
            return state.userInfo?.role === 'depo_sorumlusu';
        },

        // Kullanıcının gözlemci rolü olup olmadığını kontrol et
        isObserver(state): boolean {
            return state.userInfo?.role === 'observer';
        },

        // Kullanıcının arıza merkezi rolü olup olmadığını kontrol et
        isRepairCenter(state): boolean {
            return state.userInfo?.role === 'ariza_merkez';
        },

        // Kullanıcının yetkili olduğu depo bilgisini al
        getAuthorizedDepot(state): string | null {
            if (!state.userInfo) return null;
            if (this.isAdmin || this.isProjectAdmin) return null; // Admin ve proje admin tüm depolara erişebilir
            return state.userInfo.depot || null;
        },

        // Kullanıcının düzenleme yapma yetkisi olup olmadığını kontrol et
        canEditItems(state): boolean {
            if (!state.userInfo) return false;
            if (this.isObserver) return false; // Gözlemciler düzenleme yapamaz
            return state.userInfo.canEdit || this.isAdmin || this.isProjectAdmin;
        }
    },
    actions: {
        // Yeni eklenen initialize method
        async initializeStore() {
            // Mevcut oturumu kontrol et
            await this.checkSession();
            
            // Yerel depolamadan kullanıcı bilgilerini al
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (userData && token) {
                try {
                    this.userInfo = JSON.parse(userData);
                    this.isLoggedIn = true;
                    
                    // Kullanıcı projelerini yükle
                    await this.initializeUserProjects();
                    
                    console.log('Auth store başarıyla başlatıldı.');
                } catch (error) {
                    console.error('Auth store başlatma hatası:', error);
                    // Hatalı veriler durumunda temizlik yap
                    this.isLoggedIn = false;
                    this.userInfo = null;
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            } else {
                this.isLoggedIn = false;
                this.userInfo = null;
            }
            
            // Auth listener'ı başlat
            this.initAuthListener();
            
            return this.isLoggedIn;
        },

        // Auth listener'ı başlat - düzenleme yaptım
        initAuthListener() {
            // Eğer zaten hazırsa ve dinleyici varsa tekrar başlatma
            if (this.authReady && this.authUnsubscribe) return;
            
            // Varolan bir listener varsa önce temizle
            this.cleanupAuthListener();
            
            this.authReady = true; // Auth state'ini hazır olarak işaretle
            
            // Firebase auth state değişikliklerini dinle ve temizlik fonksiyonunu tut
            this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // Kullanıcı bilgilerini yükle
                    // Kullanıcı bilgilerini yükle
                    try {
                        const userData = await userService.getUserById(user.uid);
                        if (userData) {
                            this.isLoggedIn = true;
                            this.userInfo = userData as UserDocument;
                            localStorage.setItem('user', JSON.stringify(this.userInfo));
                        } else {
                            this.isLoggedIn = false;
                            this.userInfo = null;
                        }
                    } catch (error) {
                        console.error('Auth listener user data error:', error);
                        this.isLoggedIn = false;
                        this.userInfo = null;
                    }
                } else {
                    // Kullanıcı oturumu kapatmış
                    this.isLoggedIn = false;
                    this.userInfo = null;
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            });
            
            return true;
        },
        
        // Auth listener'ı temizle - yeni ekledim
        cleanupAuthListener() {
            if (this.authUnsubscribe) {
                try {
                    this.authUnsubscribe();
                    this.authUnsubscribe = null;
                } catch (error) {
                    console.error('Error unsubscribing auth listener:', error);
                }
            }
        },

        // Mevcut oturumu kontrol etmek için yeni bir metod
        async checkSession() {
            try {
                // Local Storage veya token kontrolü yap
                const token = localStorage.getItem('token');
                const userData = localStorage.getItem('user');
                
                if (!token || !userData) {
                    return false;
                }
                
                // Token geçerliliğini kontrol et (Firebase veya backend API çağrısı yapabilirsiniz)
                // Bu örnekte basit bir localStorage kontrolü yapıyoruz
                // Kullanıcı bilgilerini state'e yükle
                this.userInfo = JSON.parse(userData);
                
                // İşlem başarılı, kullanıcı giriş yapmış olarak kabul et
                this.isLoggedIn = true;
                return true;
            } catch (error) {
                console.error('Oturum kontrolünde hata:', error);
                return false;
            }
        },
          // Login işlemi - kullanıcı projelerini doğrudan yükleme kodu eklendi
        async login(email, password) {
            try {
                // Önce normal şekilde login fonksiyonunu çağırıyoruz
                const response = await userService.login(email, password);
                
                // Yanıt formatını kontrol et ve gerekirse dönüştür
                let user: UserDocument;
                let token: string = 'default-token';
                
                // Yanıt kontrolü - eğer doğrudan UserDocument ise onu kullan
                if (response && typeof response === 'object') {
                    if ('user' in response && 'token' in response) {
                        // Zaten LoginResponse formatında - tip güvenliği için
                        const typedResponse = response as unknown as LoginResponse;
                        user = typedResponse.user;
                        token = typedResponse.token || 'default-token';
                    } else {
                        // UserDocument formatında gelmiş olabilir
                        user = response as unknown as UserDocument;
                        // Token yoksa varsayılan token kullan
                        token = 'generated-token-' + Date.now();
                    }
                } else {
                    throw new Error('Geçersiz yanıt formatı');
                }
                
                // Kullanıcı kontrolü
                if (!user || !user.id) {
                    throw new Error('Geçersiz kullanıcı bilgileri');
                }
                
                // Kullanıcı bilgilerini state'e yükle
                this.isLoggedIn = true;
                this.userInfo = user;
                
                // Başarılı giriş sonrası, kullanıcı bilgilerini localStorage'a kaydet
                localStorage.setItem('user', JSON.stringify(this.userInfo));
                localStorage.setItem('token', token);
                
                // YENİ: Kullanıcı projelerini hemen yüklemeye başla
                console.log('Giriş başarılı - kullanıcı projelerini yüklüyor...');
                
                try {
                    // Kullanıcı admin değilse ve ID'si varsa, projelerini doğrudan Firebase'den çek
                    if (user.role !== 'admin' && user.id) {
                        console.log(`Kullanıcı ${user.id} (${user.email}) projeleri yükleniyor...`);
                        const userProjects = await this.getUserProjects(user.id);
                        console.log(`Kullanıcı için ${userProjects.length} proje bulundu: `, userProjects);
                        
                        // Projeleri yüklemeyi başlat
                        await this.initializeUserProjects();
                    } else {
                        // Admin için tüm projeleri yükle
                        await this.initializeUserProjects();
                    }
                } catch (projError) {
                    console.error('Kullanıcı projeleri yüklenirken hata:', projError);
                    // Hata olsa bile giriş başarılı olsun, sadece projelerde sorun var
                }
                
                return { success: true };
            } catch (error) {
                this.isLoggedIn = false;
                this.userInfo = null;
                throw error;
            }
        },
        
        // Çıkış işlemi - düzenledik
        async signOut() {
            try {
                // Firebase dinleyicisini temizleme ekledim
                this.cleanupAuthListener();
                
                await userService.logout();
                this.isLoggedIn = false;
                this.userInfo = null;
                this.resetProjectData();
                
                // localStorage'dan oturum bilgilerini temizle
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('currentProject');
            } catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
        },

        // Proje verilerini sıfırlama
        resetProjectData() {
            this.currentProjectId = null;
            this.userProjectRoles = {};
            
            // Project store'u sıfırla - döngüsel bağımlılık problemini önlemek için dinamik import kullanıyoruz
            try {
                // Doğrudan import yerine dynamic import kullanarak döngüsel bağımlılığı çözüyoruz
                import('./projects').then(({ useProjectStore }) => {
                    const projectStore = useProjectStore();
                    projectStore.resetStore();
                }).catch(error => {
                    console.error('Project store could not be loaded:', error);
                });
            } catch (error) {
                console.error('Reset project data error:', error);
            }
        },        // Kullanıcının projelerini yükle - Firebase'den doğrudan kullanıcı projelerini çekecek şekilde iyileştirildi
        async initializeUserProjects() {
            if (!this.userInfo) return;
            
            try {
                // Project store'u dinamik olarak yükleyip başlatıyoruz
                const { useProjectStore } = await import('./projects');
                const projectStore = useProjectStore();
                
                // Admin için tüm projeleri yükle
                if (this.isAdmin) {
                    await projectStore.initializeStore();
                } 
                // Normal kullanıcı için - kullanıcının yetkili olduğu projeleri yükle
                else {
                    console.log(`Kullanıcı projeleri yükleniyor: ${this.userInfo.id} (${this.userInfo.email})`);
                    
                    // Kullanıcı projelerini doğrudan Firebase'den çek
                    const userProjects = await this.getUserProjects(this.userInfo.id);
                    console.log(`Kullanıcı için ${userProjects.length} proje bulundu:`, userProjects);
                    
                    // Kullanıcının yetkili olduğu projelerle store'u başlat
                    await projectStore.initializeStore(userProjects);
                }
                
                // Aktif proje bilgisini güncelle
                if (projectStore.activeProject) {
                    this.currentProjectId = projectStore.activeProject.id;
                }
                
                // Hiç aktif proje yoksa ve kullanıcı projesi varsa, ilkini aktif yap
                else if (projectStore.projects && projectStore.projects.length > 0) {
                    this.currentProjectId = projectStore.projects[0].id;
                    projectStore.setActiveProject(projectStore.projects[0].id);
                }
            } catch (error) {
                console.error('Initialize user projects error:', error);
            }
        },

        // Aktif projeyi değiştir
        async setActiveProject(projectId: string) {
            this.currentProjectId = projectId;
            try {
                const { useProjectStore } = await import('./projects');
                const projectStore = useProjectStore();
                projectStore.setActiveProject(projectId);
            } catch (error) {
                console.error('Set active project error:', error);
            }
        },

        // Kullanıcının bir projede belirli bir rolü olup olmadığını kontrol et
        async hasProjectRole(projectId: string, roles: string | string[]): Promise<boolean> {
            if (!this.userInfo) return false;
            
            // Admin her şeyi yapabilir
            if (this.isAdmin) return true;
            
            // Role kontrolü
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            
            try {
                const { useProjectStore } = await import('./projects');
                const projectStore = useProjectStore();
                return await projectStore.hasProjectRole(projectId, allowedRoles);
            } catch (error) {
                console.error('Has project role error:', error);
                return false;
            }
        },

        // Kullanıcının aktif projede belirli bir rolü olup olmadığını kontrol et
        async hasActiveProjectRole(roles: string | string[]): Promise<boolean> {
            if (!this.currentProjectId) return false;
            return await this.hasProjectRole(this.currentProjectId, roles);
        },

        // Kullanıcının belirli bir global role sahip olup olmadığını kontrol et
        hasRole(role: UserRole | UserRole[]): boolean {
            if (!this.userInfo) return false;

            if (Array.isArray(role)) {
                return role.includes(this.userInfo.role);
            }

            return this.userInfo.role === role;
        },

        // Kullanıcının belirli bir depo üzerinde yetkisi olup olmadığını kontrol et
        // NOT: Artık proje bağlamında depo erişimleri kontrol edilecek
        async hasDepotAccess(depotId: string | null, projectId?: string): Promise<boolean> {
            if (!this.userInfo) return false;
            
            // Hangi projede kontrol edileceğini belirle
            const checkProjectId = projectId || this.currentProjectId;
            if (!checkProjectId) return false;
            
            // Admin her depo için yetkilidir
            if (this.isAdmin) return true;
            
            // Kullanıcının projede admin rolü varsa, tüm depolara erişebilir
            const hasProjectAdminRole = await this.hasProjectRole(checkProjectId, ['admin', 'proje_admin']);
            if (hasProjectAdminRole) {
                return true;
            }
            
            // Depo sorumluları sadece kendi depolarına erişebilir
            if (this.userInfo.role === 'depo_sorumlusu' && this.userInfo.depot === depotId) {
                // Depo sorumlusu, proje kapsamında yetkili olmalı
                return await this.hasProjectRole(checkProjectId, ['user', 'depo_sorumlusu']);
            }
            
            return false;
        },

        // UYUMLULUK İÇİN GEÇIŞ FONKSİYONLARI

        get validUsers() {
            // Artık users store'un direkt kullanımı yerine servis üzerinden alınacak
            // bu kısım eski kodun çalışması için uyumluluk amacıyla tutuldu
            return [];
        },

        // Yeni kullanıcı ekleme
        async addUser(user: UserDocument): Promise<UserResponse> {
            try {
                // Validasyon kontrolleri
                if (!user.email || !user.password) {
                    return {
                        success: false,
                        message: 'Email ve şifre zorunludur'
                    };
                }

                if (user.password.length < 6) {
                    return {
                        success: false,
                        message: 'Şifre en az 6 karakter olmalıdır'
                    };
                }

                const result = await userService.register({
                    email: user.email,
                    password: user.password,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                    depot: user.depot,
                    avatar: user.avatar
                });

                return {
                    success: true,
                    user: {
                        ...result,
                        role: result.role as UserRole
                    },
                    message: 'Kullanıcı başarıyla oluşturuldu'
                };
            } catch (error: any) {
                console.error('Add user error:', error);
                // Eğer error bir Error nesnesi ise message özelliğini kullan
                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
                return {
                    success: false,
                    message: errorMessage
                };
            }
        },

        // Kullanıcı güncelleme
        async updateUser(email: string, updatedUser: UpdateUserData): Promise<UserResponse> {
            try {
                // Tüm kullanıcıları çekmek yerine doğrudan e-posta ile kullanıcıyı bul
                const user = await userService.getUserByEmail(email);

                if (!user) {
                    return { success: false, message: 'Kullanıcı bulunamadı' };
                }

                // Convert null projectId to undefined to match UpdateUserInput type
                const userDataForUpdate = {
                    ...updatedUser,
                    projectId: updatedUser.projectId === null ? undefined : updatedUser.projectId
                };
                
                const result = await userService.updateUser(user.id, userDataForUpdate);

                if (this.userInfo && this.userInfo.email === email && result) {
                    // Tip güvenliği için sonucu any olarak işaretleyip sonra doğru şekilde dönüştürüyoruz
                    const resultData = result as any;
                    const updatedUserInfo: UserDocument = {
                        id: String(resultData.id || ''),
                        email: String(resultData.email || ''),
                        name: String(resultData.name || ''),
                        role: (resultData.role || 'user') as UserRole,
                        isActive: Boolean(resultData.isActive),
                        createdAt: String(resultData.createdAt || new Date().toISOString()),
                        lastLogin: String(resultData.lastLogin || new Date().toISOString()),
                        phone: String(resultData.phone || ''),
                        avatar: String(resultData.avatar || '/assets/images/profile-2.jpeg'),
                        depot: resultData.depot || null,
                        canEdit: Boolean(resultData.canEdit)
                    };

                    this.userInfo = updatedUserInfo;
                }

                return {
                    success: true,
                    user: result as unknown as UserDocument,
                    message: 'Kullanıcı başarıyla güncellendi'
                };
            } catch (error) {
                console.error('Update user error:', error);
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
                };
            }
        },

        // Kullanıcı silme
        async deleteUser(email: string): Promise<UserResponse> {
            try {
                // Önce kullanıcıyı e-posta ile bul
                const users = await userService.getAllUsers();
                const user = users.find(u => u.email === email);

                if (!user) {
                    return { success: false, message: 'Kullanıcı bulunamadı' };
                }

                if (user.email === 'deneme@deneme.com') {
                    return { success: false, message: 'Admin kullanıcısı silinemez' };
                }

                // Kullanıcıyı sil
                await userService.deleteUser(user.id);

                return { success: true };
            } catch (error) {
                console.error('Delete user error:', error);
                return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
            }
        },

        // Firebase'ten kullanıcı listesi alma
        async getAllUsers(): Promise<any[]> {
            try {
                return await userService.getAllUsers();
            } catch (error) {
                console.error('Get all users error:', error);
                return [];
            }
        },

        // Users store'dan kullanıcıları senkronize et
        syncUsersFromUsersStore(users: UserDocument[]): void {
            // Senkronizasyon işlemi gerekli değil çünkü users store zaten Firebase ile senkronize
            console.log('Users store senkronizasyonu atlandı - Firebase ile direkt senkronizasyon kullanılıyor');
        },

        /**
         * Kullanıcının bağlı olduğu projeleri getirir
         * @param userId Kullanıcı ID'si
         * @returns Kullanıcının bağlı olduğu proje ID'leri
         */
        async getUserProjects(userId: string): Promise<string[]> {
            try {
                if (!userId) {
                    console.error('getUserProjects: userId parametresi gereklidir');
                    return [];
                }
                return await getUserProjects(userId);
            } catch (error) {
                console.error('Kullanıcı projeleri alınırken hata:', error);
                return [];
            }
        }
    }
});