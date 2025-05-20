import { defineStore } from 'pinia';
import { DocumentData } from 'firebase/firestore';
import { auth } from '@/firebase';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { userService, getUserProjects } from '@/services/auth/userService';
import PermissionServiceProxy from '@/services/permissions/permissionServiceProxy'; 
import { Permission, UserRole as PermRole } from '@/services/permissions/permissionService';
import DynamicPermissionManager from '@/services/permissions/dynamicPermissionManager';

// Kolay erişim için alias tanımlıyoruz
const PermissionService = PermissionServiceProxy;

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
    roles?: string[]; // Birden fazla rol desteği için
    customPermissions?: Record<string, boolean>; // Özelleştirilmiş izinler
}

// ValidUser interface'i (aktif kullanıcılar için)
export interface ValidUser extends BaseUser {
    isActive: boolean;
    password?: string; // Şifre alanını opsiyonel olarak ekliyoruz
}

// Kullanıcı rollerini tanımlayan type (mevcut sistemle uyumluluk için)
export type UserRole = 'admin' | 'user' | 'depo_sorumlusu' | 'proje_admin' | 
    'proje_sorumlusu' | 'proje_it_sorumlusu' | 'onarim_merkezi_sorumlusu' | 'onarim_kullanici';

// Firestore'dan gelen kullanıcı verisi için interface
export interface UserDocument {
    id: string;
    email: string;
    name: string;
    role: UserRole; // Ana rol
    roles?: string[]; // Ek roller (opsiyonel)
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    lastLogin: string;
    phone: string;
    depot?: string | null;
    avatar: string;
    canEdit: boolean;
    password?: string; // Şifre alanını opsiyonel olarak ekliyoruz
    customPermissions?: Record<string, boolean>; // Özelleştirilmiş izinler
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
    roles?: string[]; // Çoklu rol desteği için
    avatar?: string;
    depot?: string | null;
    password?: string;
    isActive?: boolean;
    projectId?: string | null; // Kullanıcının bağlı olduğu proje ID'si
    customPermissions?: Record<string, boolean>; // Özelleştirilmiş izinler
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
        // Mevcut oturum açmış kullanıcıyı döndür
        currentUser(): UserDocument | null {
            return this.userInfo;
        },
        
        // Kullanıcının admin rolü olup olmadığını kontrol et
        isAdmin(state): boolean {
            return PermissionService.hasRole(PermRole.ADMIN) || state.userInfo?.role === 'admin';
        },

        // Kullanıcının proje admin rolü olup olmadığını kontrol et
        isProjectAdmin(state): boolean {
            return state.userInfo?.role === 'proje_admin' || this.isAdmin;
        },

        // Kullanıcının depo sorumlusumu olup olmadığını kontrol et
        isWarehouseManager(state): boolean {
            return state.userInfo?.role === 'depo_sorumlusu' || PermissionService.hasRole(PermRole.WAREHOUSE_MANAGER);
        },

        // Proje sorumlusu kontrolü 
        isProjectManager(state): boolean {
            return state.userInfo?.role === 'proje_sorumlusu' || PermissionService.hasRole(PermRole.PROJECT_MANAGER);
        },
        
        // Proje IT sorumlusu kontrolü
        isProjectITManager(state): boolean {
            return state.userInfo?.role === 'proje_it_sorumlusu' || PermissionService.hasRole(PermRole.PROJECT_IT_MANAGER);
        },
        
        // Onarım merkezi sorumlusu kontrolü
        isRepairCenterManager(state): boolean {
            return state.userInfo?.role === 'onarim_merkezi_sorumlusu' || 
                   PermissionService.hasRole(PermRole.SERVICE_CENTER_MANAGER);
        },
        
        // Onarım kullanıcısı kontrolü
        isRepairUser(state): boolean {
            return state.userInfo?.role === 'onarim_kullanici' || PermissionService.hasRole(PermRole.REPAIR_USER);
        },

        // PDF rapor erişimi kontrolü - Admin ve onarım merkezi sorumlusu erişebilir
        canAccessRepairReports(state): boolean {
            return PermissionService.hasPermission(Permission.ACCESS_REPAIR_REPORTS);
        },
        
        // Onarım süreçlerini yönetme yetkisi - Admin ve onarım merkezi sorumlusu yönetebilir
        canManageRepairProcesses(state): boolean {
            return PermissionService.hasPermission(Permission.MANAGE_REPAIR_PROCESSES);
        },
        
        // Ana ürün tanımlarını yönetme yetkisi - Sadece admin
        canManageProductDefinitions(state): boolean {
            return this.isAdmin;
        },
        
        // Yeni kullanıcı ekleme yetkisi - Sadece admin
        canAddGlobalUsers(state): boolean {
            return PermissionService.hasPermission(Permission.MANAGE_USERS);
        },
        
        // Proje yönetimi yetkisi - Sadece admin proje ekleyebilir
        canManageProjects(state): boolean {
            return PermissionService.hasPermission(Permission.MANAGE_PROJECTS);
        },
        
        // Proje bazında kullanıcı ekleme yetkisi - Admin ve proje admin
        canAddProjectUsers(state): boolean {
            return this.isAdmin || this.isProjectAdmin;
        },
        
        // Proje bazlı depo kullanıcısı oluşturma yetkisi - Admin ve proje admin
        canCreateDepotUsersForProject(state): boolean {
            return this.isAdmin || this.isProjectAdmin;
        },
        
        // Proje bazlı ürün ayarlarını yapma yetkisi - Admin ve proje admin
        canConfigureProjectProducts(state): boolean {
            return this.isAdmin || this.isProjectAdmin;
        },
        
        // Malzeme talep onaylama yetkisi - Admin ve proje admin
        canApproveMaterialRequests(state): boolean {
            return this.isAdmin || this.isProjectAdmin;
        },
        
        // Merkez depodan illere malzeme gönderim yetkisi - Admin, proje admin ve proje sorumlusu
        canManageCentralWarehouseTransfers(state): boolean {
            return this.isAdmin || this.isProjectAdmin || this.isProjectManager;
        },

        // Proje Sorumlusu Rolü - İleride kullanılacak yetkiler
        // Proje Admin onayından sonra onay verme yetkisi
        canApproveAfterProjectAdmin(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isProjectManager;
        },
        
        // Transfer onayından sonra malzeme gönderimi izni
        canSendMaterialAfterApproval(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isProjectManager;
        },

        // Proje IT Sorumlusu Rolü - İleride kullanılacak yetkiler
        // Proje IT Sorumlusu sadece kendi sorumluluğundaki cihazları yönetecek
        canManageITDevices(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            // Proje IT Sorumlusu kendisinin sorumluluğundaki cihazları görüntüleyecek ve yönetecek
            return this.isAdmin || this.isProjectAdmin || this.isProjectITManager;
        },
        
        // Proje IT Sorumlusunun cihaz onarım talepleri oluşturma yetkisi
        canCreateITDeviceRepairRequests(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isProjectAdmin || this.isProjectITManager;
        },

        // Onarım Merkezi Sorumlusu Rolü - İleride kullanılacak yetkiler
        // Onarım merkezine gelen arızalı ürünleri onaylama/reddetme yetkisi
        canManageIncomingRepairItems(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isRepairCenterManager;
        },
        
        // Onarım merkezi QR kod üretme ve yazdırma yetkisi
        canGenerateRepairQRCodes(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isRepairCenterManager;
        },
        
        // QR kod ile ürün detaylarını görüntüleme yetkisi
        canViewRepairDetailsWithQR(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isRepairCenterManager || this.isRepairUser;
        },
        
        // Onarım işlemlerini sisteme girme yetkisi
        canRecordRepairOperations(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isRepairCenterManager || this.isRepairUser;
        },
        
        // Onarılan ürünleri ilgili depolara gönderme yetkisi
        canSendRepairedItemsBack(state): boolean {
            // İleride aktifleştirilecek - Şu an için yalnızca rol kontrolü yapılıyor
            return this.isAdmin || this.isRepairCenterManager;
        },

        // Kullanıcının yetkili olduğu depo bilgisini al
        getAuthorizedDepot(state): string | null {
            if (!state.userInfo) return null;
            if (this.isAdmin || this.isProjectAdmin) return null; // Admin ve proje admin tüm depolara erişebilir
            return state.userInfo.depot || null;
        },
        
        // Depo kullanıcısının arızalı ürün kaydı yapma yetkisi
        canRegisterFaultyProducts(state): boolean {
            if (!state.userInfo) return false;
            return this.isAdmin || this.isProjectAdmin || this.isWarehouseManager;
        },
        
        // Depo kullanıcısının arızalı ürünleri onarıma gönderme yetkisi
        canSendProductsToRepair(state): boolean {
            if (!state.userInfo) return false;
            return this.isAdmin || this.isProjectAdmin || this.isWarehouseManager;
        },
        
        // Depo kullanıcısının onarımdan gelen ürünleri teslim alma yetkisi
        canReceiveRepairedProducts(state): boolean {
            if (!state.userInfo) return false;
            return this.isAdmin || this.isProjectAdmin || this.isWarehouseManager;
        },
        
        // Depo kullanıcısının konsinye ürün takibi yapma yetkisi
        canManageConsignedProducts(state): boolean {
            if (!state.userInfo) return false;
            return this.isAdmin || this.isProjectAdmin || this.isWarehouseManager;
        },
        
        // Depo kullanıcısının merkez depodan ürün talebinde bulunma yetkisi
        canRequestProductsFromCentralWarehouse(state): boolean {
            if (!state.userInfo) return false;
            return this.isAdmin || this.isProjectAdmin || this.isWarehouseManager;
        },

        // Kullanıcının düzenleme yapma yetkisi olup olmadığını kontrol et
        canEditItems(state): boolean {
            if (!state.userInfo) return false;
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
        },
        
        /**
         * İzin sistemini yenilemek için kullanılan method
         * Bu method, token yenilendikten sonra izin sistemini tekrar başlatır
         */
        async refreshPermissions(): Promise<boolean> {
            if (this.userInfo && this.userInfo.id) {
                try {
                    // İzin sistemini dinamik olarak yenilemek için
                    // PermissionService kullanımını resetliyoruz
                    console.log('İzin sistemi yenileniyor...');
                    
                    // Önbelleği temizleme işlemi 
                    // DynamicPermissionManager sınıfıyla yapılabilir ancak
                    // Store'dan erişim olmadığı için doğrudan
                    // yeniden kullanıcı projelerini ve rollerini yüklüyoruz
                    await this.initializeUserProjects();
                    
                    console.log('İzin sistemi başarıyla yenilendi.');
                    return true;
                } catch (error) {
                    console.error('İzin sistemini yenileme hatası:', error);
                    return false;
                }
            }
            return false;
        },

        /**
         * Auth durumu değişikliklerini dinleyen listener'ı başlatır
         */
        initAuthListener() {
            if (this.authUnsubscribe) return;
            
            // Varolan bir listener varsa önce temizle
            this.cleanupAuthListener();
            
            // Auth state'ini hazır olarak işaretle
            
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
                            
                            // Kullanıcı bilgilerini localStorage'a kaydet
                            localStorage.setItem('user', JSON.stringify(this.userInfo));
                            
                            // Kullanıcı izinlerini yükle ve önbelleğe al
                            try {
                                // Dinamik izin sistemini başlat
                                console.log('Kullanıcı izinleri yükleniyor...');
                                await DynamicPermissionManager.loadUserPermissions(this.userInfo.id);
                                console.log('Kullanıcı izinleri başarıyla yüklendi');
                            } catch (permError) {
                                console.error('Kullanıcı izinleri yüklenirken hata:', permError);
                            }
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
            this.authReady = true; // Auth state'ini hazır olarak işaretle
            
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
                
                // Kullanıcı izinlerini yükle
                try {
                    if (this.userInfo?.id) {
                        await DynamicPermissionManager.loadUserPermissions(this.userInfo.id);
                        console.log('Oturum kontrolünde kullanıcı izinleri yüklendi');
                    }
                } catch (permError) {
                    console.warn('İzinler yüklenirken hata:', permError);
                    // Bu noktada izinlerde hata olması giriş yapmasını engellemesin
                }
                
                // İşlem başarılı, kullanıcı giriş yapmış olarak kabul et
                this.isLoggedIn = true;
                return true;
            } catch (error) {
                console.error('Oturum kontrolünde hata:', error);
                this.isLoggedIn = false;
                this.userInfo = null;

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
                
                // Dinamik izin sistemini başlat
                try {
                    await DynamicPermissionManager.loadUserPermissions(user.id);
                    console.log('Kullanıcı izinleri yüklendi');
                } catch (permError) {
                    console.error('Kullanıcı izinleri yüklenirken hata:', permError);
                }
                
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
        
        // Çıkış işlemi - güçlendirildi
        async signOut() {
            try {
                // Kullanıcının ID'sini saklayın (izin önbelleğini temizlemek için)
                const userId = this.userInfo?.id;
                
                // Önce durumu hemen güncelle (yönlendirmeden önce)
                this.isLoggedIn = false;
                this.userInfo = null;
                
                // İzin önbelleğini temizle
                try {
                    // DynamicPermissionManager bir singleton
                    if (userId) {
                        DynamicPermissionManager.clearUserPermissions(userId);
                    } else {
                        DynamicPermissionManager.clearUserPermissions(); // Tüm önbelleği temizle
                    }
                    console.log('İzin önbelleği temizlendi');
                } catch (permError) {
                    console.error('İzin önbelleği temizlenirken hata:', permError);
                    // Devam et - bu kritik değil
                }
                
                // Firebase dinleyicisini temizle
                try {
                    this.cleanupAuthListener();
                } catch (listenerError) {
                    console.error('Firebase dinleyici temizlenirken hata:', listenerError);
                    // Devam et - bu kritik değil
                }
                
                // localStorage'dan oturum bilgilerini temizle - hemen yap
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('currentProject');
                
                // sessionStorage'dan proje seçimini temizle
                sessionStorage.removeItem('activeProjectId');
                
                // Proje verilerini sıfırla
                this.resetProjectData();
                
                // Firebase logout
                try {
                    await userService.logout();
                } catch (logoutError) {
                    console.error('Firebase çıkış işleminde hata:', logoutError);
                    // Devam et - kullanıcı zaten yönlendirilmiş olacak
                }
                
                return true; // Başarılı çıkış
            } catch (error) {
                console.error('Çıkış işleminde hata:', error);
                // Hata durumunda bile oturumu temizleme işlemini tamamla
                this.isLoggedIn = false;
                this.userInfo = null;
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                return false;
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

        // Proje Admin'in kullanıcıları kendi projesine eklemesi için metod
        async addUserToProject(userId: string, projectId: string, projectRole: string = 'user'): Promise<boolean> {
            try {
                // Önce yetki kontrolü
                if (!this.userInfo) return false;
                
                // Admin her projeye kullanıcı ekleyebilir
                if (this.isAdmin) {
                    const { useProjectStore } = await import('./projects');
                    const projectStore = useProjectStore();
                    return await projectStore.addUserToProject(userId, projectId, projectRole);
                }
                
                // Proje Admin sadece kendi yönettiği projelere kullanıcı ekleyebilir
                if (this.isProjectAdmin) {
                    // Kullanıcının bu projede yetkisi var mı kontrol et
                    const hasPermission = await this.hasProjectRole(projectId, ['admin', 'proje_admin']);
                    if (!hasPermission) {
                        console.error('Proje Admin bu projeye erişim yetkisine sahip değil:', projectId);
                        return false;
                    }
                    
                    // Kullanıcıyı projeye ekle
                    const { useProjectStore } = await import('./projects');
                    const projectStore = useProjectStore();
                    return await projectStore.addUserToProject(userId, projectId, projectRole);
                }
                
                return false;
            } catch (error) {
                console.error('Kullanıcı projeye eklenirken hata:', error);
                return false;
            }
        },
        
        // Proje Admin'in kendi projesi için depo kullanıcısı oluşturması
        async createDepotUserForProject(userData: { 
            email: string;
            name: string;
            password: string;
            phone: string;
            depot: string;
            projectId: string;
        }): Promise<UserResponse> {
            try {
                // Yetki kontrolü
                if (!this.canCreateDepotUsersForProject) {
                    return {
                        success: false,
                        message: 'Bu işlem için yetkiniz bulunmuyor'
                    };
                }
                
                // Proje Admin ise, sadece kendi projesi için depo kullanıcısı oluşturabilir
                if (this.isProjectAdmin && !this.isAdmin) {
                    const hasPermission = await this.hasProjectRole(userData.projectId, ['admin', 'proje_admin']);
                    if (!hasPermission) {
                        return {
                            success: false,
                            message: 'Bu proje için depo kullanıcısı oluşturma yetkiniz yok'
                        };
                    }
                }
                
                // Depo kullanıcısını oluştur
                const result = await this.addUser({
                    id: '',
                    email: userData.email,
                    name: userData.name,
                    password: userData.password,
                    role: 'depo_sorumlusu' as UserRole,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: '',
                    phone: userData.phone,
                    depot: userData.depot,
                    avatar: '/assets/images/profile-default.jpeg',
                    canEdit: true
                });
                
                // Başarılı ise kullanıcıyı projeye ekle
                if (result.success && result.user) {
                    await this.addUserToProject(result.user.id, userData.projectId, 'depo_sorumlusu');
                }
                
                return result;
            } catch (error) {
                console.error('Depo kullanıcısı oluşturulurken hata:', error);
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
                };
            }
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
        
        // Proje Admin'in proje bazlı ürün ayarlarını yapabilmesi için metod
        async configureProjectProduct(projectId: string, productSettings: any): Promise<boolean> {
            try {
                // Önce yetki kontrolü
                if (!this.userInfo) return false;
                
                // Admin her projenin ürün ayarlarını yapabilir
                if (this.isAdmin) {
                    const projectProductService = await import('@/services/projects/projectProductService').then(m => m.default);
                    await projectProductService.addProductSetting({
                        projectId,
                        ...productSettings
                    });
                    return true;
                }
                
                // Proje Admin sadece kendi projelerinin ürün ayarlarını yapabilir
                if (this.isProjectAdmin) {
                    // Kullanıcının bu projede yetkisi var mı kontrol et
                    const hasPermission = await this.hasProjectRole(projectId, ['admin', 'proje_admin']);
                    if (!hasPermission) {
                        console.error('Proje Admin bu projeye erişim yetkisine sahip değil:', projectId);
                        return false;
                    }
                    
                    // Proje ürün ayarlarını yap
                    const projectProductService = await import('@/services/projects/projectProductService').then(m => m.default);
                    await projectProductService.addProductSetting({
                        projectId,
                        ...productSettings
                    });
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error('Proje ürün ayarları yapılandırılırken hata:', error);
                return false;
            }
        },
        
        // Proje Admin'in malzeme taleplerini onaylaması için metod
        async approveMaterialRequest(requestId: string, approverName: string, approvedItems?: any[], notes?: string): Promise<boolean> {
            try {
                // Yetki kontrolü
                if (!this.canApproveMaterialRequests) return false;
                
                const materialRequestService = await import('@/services/materials/materialRequestService').then(m => m.default);
                
                // Önce talebi getir
                const request = await materialRequestService.getRequest(requestId);
                if (!request) {
                    console.error('Onaylanacak talep bulunamadı:', requestId);
                    return false;
                }
                
                // Eğer Proje Admin ise, sadece kendi projesi için gelen talepleri onaylayabilir
                if (this.isProjectAdmin && !this.isAdmin) {
                    const hasPermission = await this.hasProjectRole(request.targetProjectId, ['admin', 'proje_admin']);
                    if (!hasPermission) {
                        console.error('Bu talebi onaylama yetkiniz yok');
                        return false;
                    }
                }
                
                // Talebi onayla
                await materialRequestService.approveRequest(requestId, approverName, approvedItems, notes);
                return true;
            } catch (error) {
                console.error('Malzeme talebi onaylanırken hata:', error);
                return false;
            }
        },
        
        // Proje Admin'in merkez depodan illere malzeme gönderim işlemlerini yönetmesi için metod
        async createCentralWarehouseTransfer(transferData: any): Promise<boolean> {
            try {
                // Yetki kontrolü
                if (!this.canManageCentralWarehouseTransfers) return false;
                
                const centralWarehouseTransferService = await import('@/services/warehouse/centralWarehouseTransferService').then(m => m.default);
                
                // Eğer Proje Admin ise, sadece kendi projesi için transfer oluşturabilir
                if (this.isProjectAdmin && !this.isAdmin) {
                    const hasPermission = await this.hasProjectRole(transferData.projectId, ['admin', 'proje_admin']);
                    if (!hasPermission) {
                        console.error('Bu proje için transfer oluşturma yetkiniz yok');
                        return false;
                    }
                }
                
                // Transfer oluştur
                await centralWarehouseTransferService.createTransfer(transferData);
                return true;
            } catch (error) {
                console.error('Merkez depo transferi oluşturulurken hata:', error);
                return false;
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
        },
    }
});
