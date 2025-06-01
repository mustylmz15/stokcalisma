import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
// Firebase importları kaldırıldı:
// import { getAuth } from 'firebase/auth';
// import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { supabase } from '../../supabase'; // supabase importu kalabilir, gelecekte gerekebilir

// Rol türlerini tanımlayan enum
export enum RoleType {
    ADMIN = 'admin',
    MANAGER = 'manager',
    TECHNICIAN = 'technician',
    WAREHOUSE_MANAGER = 'warehouse_manager', // Depo Yöneticisi
    USER = 'user',
    GUEST = 'guest',
    PROJECT_ADMIN = 'proje_admin', // Proje Admini
    PROJECT_IT_MANAGER = 'proje_it_sorumlusu', // Proje IT Sorumlusu
    REPAIR_CENTER_MANAGER = 'onarim_merkezi_sorumlusu', // Onarım Merkezi Sorumlusu
    REPAIR_USER = 'onarim_kullanici', // Onarım Kullanıcısı
    WAREHOUSE_USER = 'depo_kullanicisi', // Yeni: Depo Kullanıcısı
    PROJECT_LEAD = 'proje_sorumlusu', // Yeni: Proje Sorumlusu
}

// İzin türlerini tanımlayan enum
export enum PermissionType {
    // Temel envanter izinleri
    VIEW_INVENTORY = 'view_inventory',
    EDIT_INVENTORY = 'edit_inventory',
    DELETE_INVENTORY = 'delete_inventory',
    VIEW_ALL_WAREHOUSES = 'view_all_warehouses', // Yeni: Tüm depoları görebilme yetkisi
    SEARCH_UGES_INVENTORY = 'search_uges_inventory', // Yeni: UGES envanterinde ürün arama
    INSTALL_REPAIRED_PRODUCT = 'install_repaired_product', // Yeni: Onarılan ürünü sahaya takma
    
    // Kullanıcı yönetimi izinleri
    VIEW_USERS = 'view_users',
    EDIT_USERS = 'edit_users',
    DELETE_USERS = 'delete_users',
    ADD_GLOBAL_USERS = 'add_global_users',
    
    // Proje yönetimi izinleri
    VIEW_PROJECTS = 'view_projects',
    EDIT_PROJECTS = 'edit_projects',
    DELETE_PROJECTS = 'delete_projects',
    MANAGE_PROJECTS = 'manage_projects',
    CREATE_PROJECTS = 'create_projects', // Yeni: Proje ekleyebilme yetkisi
    ADD_PROJECT_USERS = 'add_project_users',
    CREATE_DEPOT_USERS = 'create_depot_users',
    CONFIGURE_PROJECT_PRODUCTS = 'configure_project_products',
    
    // Arıza yönetimi izinleri
    VIEW_FAULTS = 'view_faults',
    EDIT_FAULTS = 'edit_faults',
    RESOLVE_FAULTS = 'resolve_faults',
    ACCESS_REPAIR_REPORTS = 'access_repair_reports',
    MANAGE_REPAIR_PROCESSES = 'manage_repair_processes',
    MANAGE_INCOMING_REPAIR_ITEMS = 'manage_incoming_repair_items',
    GENERATE_REPAIR_QR_CODES = 'generate_repair_qr_codes',
    VIEW_REPAIR_DETAILS_WITH_QR = 'view_repair_details_with_qr',
    RECORD_REPAIR_OPERATIONS = 'record_repair_operations',
    SEND_REPAIRED_ITEMS_BACK = 'send_repaired_items_back',
    
    // Malzeme yönetimi izinleri
    APPROVE_MATERIAL_REQUESTS = 'approve_material_requests',
    MANAGE_CENTRAL_WAREHOUSE_TRANSFERS = 'manage_central_warehouse_transfers',
    APPROVE_AFTER_PROJECT_ADMIN = 'approve_after_project_admin',
    SEND_MATERIAL_AFTER_APPROVAL = 'send_material_after_approval',
    
    // IT cihaz yönetimi
    MANAGE_IT_DEVICES = 'manage_it_devices',
    CREATE_IT_DEVICE_REPAIR_REQUESTS = 'create_it_device_repair_requests',
    
    // Depo işlemleri
    REGISTER_FAULTY_PRODUCTS = 'register_faulty_products',
    SEND_PRODUCTS_TO_REPAIR = 'send_products_to_repair',
    RECEIVE_REPAIRED_PRODUCTS = 'receive_repaired_products',
    MANAGE_CONSIGNED_PRODUCTS = 'manage_consigned_products',
    REQUEST_PRODUCTS_FROM_CENTRAL = 'request_products_from_central',
    
    // Genel izinler
    SYSTEM_SETTINGS = 'system_settings',
    GENERATE_REPORTS = 'generate_reports',
    EDIT_ITEMS = 'edit_items',
    MANAGE_PRODUCT_DEFINITIONS = 'manage_product_definitions',
}

// Her role ait izinleri tanımlayan harita
const ROLE_PERMISSIONS_MAP: Record<RoleType, PermissionType[]> = {
    // Admin tüm izinlere sahip
    [RoleType.ADMIN]: Object.values(PermissionType),
    
    // Yönetici izinleri
    [RoleType.MANAGER]: [
        PermissionType.VIEW_INVENTORY, PermissionType.EDIT_INVENTORY,
        PermissionType.VIEW_USERS,
        PermissionType.VIEW_PROJECTS, PermissionType.EDIT_PROJECTS,
        PermissionType.VIEW_FAULTS, PermissionType.EDIT_FAULTS, PermissionType.RESOLVE_FAULTS,
        PermissionType.GENERATE_REPORTS,
        PermissionType.APPROVE_MATERIAL_REQUESTS,
        PermissionType.APPROVE_AFTER_PROJECT_ADMIN,
        PermissionType.SEND_MATERIAL_AFTER_APPROVAL,
    ],
    
    // Teknisyen izinleri
    [RoleType.TECHNICIAN]: [
        PermissionType.VIEW_INVENTORY,
        PermissionType.VIEW_PROJECTS,
        PermissionType.VIEW_FAULTS, PermissionType.EDIT_FAULTS, PermissionType.RESOLVE_FAULTS,
    ],
    
    // Depo yöneticisi izinleri
    [RoleType.WAREHOUSE_MANAGER]: [
        PermissionType.VIEW_INVENTORY, PermissionType.EDIT_INVENTORY, PermissionType.DELETE_INVENTORY,
        PermissionType.VIEW_PROJECTS,
        PermissionType.GENERATE_REPORTS,
        PermissionType.REGISTER_FAULTY_PRODUCTS,
        PermissionType.SEND_PRODUCTS_TO_REPAIR,
        PermissionType.RECEIVE_REPAIRED_PRODUCTS,
        PermissionType.MANAGE_CONSIGNED_PRODUCTS,
        PermissionType.REQUEST_PRODUCTS_FROM_CENTRAL,
    ],
    
    // Kullanıcı izinleri
    [RoleType.USER]: [
        PermissionType.VIEW_INVENTORY,
        PermissionType.VIEW_PROJECTS,
        PermissionType.VIEW_FAULTS,
    ],
    
    // Misafir izinleri
    [RoleType.GUEST]: [
        PermissionType.VIEW_INVENTORY,
    ],
    
    // Proje Yöneticisi izinleri
    [RoleType.PROJECT_ADMIN]: [
        PermissionType.VIEW_INVENTORY, // Kendi projesine ait envanteri ve depoları görebilir
        PermissionType.EDIT_INVENTORY, // Kendi projesine ürün ekleyebilir (Admin'in eklediği ana ürün listesinden)
        PermissionType.VIEW_USERS, // Kendi projesindeki kullanıcıları görebilir
        PermissionType.VIEW_PROJECTS, // Sadece kendi atandığı projeleri görebilir
        PermissionType.EDIT_PROJECTS, // Sadece kendi atandığı projeleri yönetebilir
        PermissionType.ADD_PROJECT_USERS, // Kullanıcıları kendi projesine dahil edebilir
        PermissionType.CREATE_DEPOT_USERS, // Kendi projesindeki alt ekipler için "Depo Kullanıcısı" oluşturabilir
        PermissionType.CONFIGURE_PROJECT_PRODUCTS, // Proje bazlı ürün ayarlarını yapabilir (konsinye, seri takibi, onarım süresi vb.)
        PermissionType.APPROVE_MATERIAL_REQUESTS, // Malzeme taleplerinde onay mekanizmasında rol alır (kendi projesi veya sorumlu olduğu projeler arası)
        PermissionType.MANAGE_CENTRAL_WAREHOUSE_TRANSFERS, // Merkez depodan illere malzeme gönderim sürecini başlatabilir/onaylayabilir (kendi projesi için)
        // Not: Yeni kullanıcı ekleyemez (Admin seviyesinde).
        // Not: Yeni proje ekleyemez.
    ],
    
    // Proje IT Sorumlusu izinleri
    [RoleType.PROJECT_IT_MANAGER]: [
        PermissionType.VIEW_INVENTORY,
        PermissionType.VIEW_PROJECTS,
        PermissionType.MANAGE_IT_DEVICES,
        PermissionType.CREATE_IT_DEVICE_REPAIR_REQUESTS,
    ],
    
    // Onarım Merkezi Sorumlusu izinleri
    [RoleType.REPAIR_CENTER_MANAGER]: [
        PermissionType.VIEW_INVENTORY,
        PermissionType.VIEW_FAULTS, PermissionType.EDIT_FAULTS, PermissionType.RESOLVE_FAULTS,
        PermissionType.ACCESS_REPAIR_REPORTS,
        PermissionType.MANAGE_REPAIR_PROCESSES,
        // PermissionType.MANAGE_INCOMING_REPAIR_ITEMS, // Arızalı ürünleri teslim alır (onay/red mekanizması).
        // PermissionType.GENERATE_REPAIR_QR_CODES, // Gelen ürün için QR kod yazdırıp ürüne yapıştırır.
        // PermissionType.VIEW_REPAIR_DETAILS_WITH_QR, // QR kod okutarak ürünün arıza detaylarını görür.
        // PermissionType.RECORD_REPAIR_OPERATIONS, // Onarım işlemlerini (sökülen/takılan parçalar) sisteme girer.
        // PermissionType.SEND_REPAIRED_ITEMS_BACK, // Onarılan ürünü ilgili bölge deposuna geri gönderir.
    ],
    
    // Onarım Kullanıcısı izinleri
    [RoleType.REPAIR_USER]: [
        PermissionType.VIEW_INVENTORY,
        PermissionType.VIEW_FAULTS,
        PermissionType.VIEW_REPAIR_DETAILS_WITH_QR,
        PermissionType.RECORD_REPAIR_OPERATIONS,
    ],

    // Yeni eklenen roller için varsayılan (boş) izinler
    [RoleType.WAREHOUSE_USER]: [
        PermissionType.VIEW_INVENTORY, // Atandığı projelerin depolarını görebilir ve malzemeleri listeleyebilir
        PermissionType.SEARCH_UGES_INVENTORY, // Kendi projesine ait bir stoğun UGES envanterinde olup olmadığını arayabilir
        PermissionType.REQUEST_PRODUCTS_FROM_CENTRAL, // Diğer depolardan ürün talep edebilir (Proje Admini onayına düşer)
        PermissionType.REGISTER_FAULTY_PRODUCTS, // Arızalı ürün kaydı yapabilir
        PermissionType.MANAGE_CONSIGNED_PRODUCTS, // Konsinye ürün takibi ve değişimini yapabilir
        PermissionType.SEND_PRODUCTS_TO_REPAIR, // Arızalı ürünü onarıma gönderebilir
        PermissionType.RECEIVE_REPAIRED_PRODUCTS, // Onarımdan gelen ürünü teslim alabilir, onaylayabilir/reddedebilir
        PermissionType.INSTALL_REPAIRED_PRODUCT, // Onarılan ürünü sahaya takabilir (stoktan düşer)
        // Not: Birden fazla projeye atanabilir.
    ],
    [RoleType.PROJECT_LEAD]: [
        PermissionType.APPROVE_AFTER_PROJECT_ADMIN, // Proje Admini'nden sonraki onay mekanizmasında rol alabilir
        PermissionType.SEND_MATERIAL_AFTER_APPROVAL, // Merkez depodan illere malzeme gönderme işlemini gerçekleştirebilir (Proje Admini onayından sonra)
        // Not: Malzeme gönderimi için sürekli açık bildirim alır (işlem tamamlanana kadar).
    ],
};

// Her rolün UI üzerinde gösterilecek açıklaması
const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
    [RoleType.ADMIN]: 'Sistem Yöneticisi - Tam Yetki',
    [RoleType.MANAGER]: 'Yönetici - Genel Yönetim Yetkisi',
    [RoleType.TECHNICIAN]: 'Teknisyen - Arıza Yönetimi',
    [RoleType.WAREHOUSE_MANAGER]: 'Depo Yöneticisi - Envanter Kontrolü',
    [RoleType.USER]: 'Kullanıcı - Sınırlı Erişim',
    [RoleType.GUEST]: 'Misafir - Sadece Görüntüleme',
    [RoleType.PROJECT_ADMIN]: 'Proje Yöneticisi - Proje Bazlı Tam Yetki',
    [RoleType.PROJECT_IT_MANAGER]: 'Proje IT Sorumlusu - IT Cihaz Yönetimi',
    [RoleType.REPAIR_CENTER_MANAGER]: 'Onarım Merkezi Sorumlusu - Onarım Yönetimi',
    [RoleType.REPAIR_USER]: 'Onarım Kullanıcısı - Onarım İşlemleri',
    [RoleType.WAREHOUSE_USER]: 'Depo Kullanıcısı - Depo Erişimi',
    [RoleType.PROJECT_LEAD]: 'Proje Sorumlusu - Proje Yönetimi',
};

// Pinia store tanımı
export const useRoleStore = defineStore('roleStore', () => {
    // State
    const userRoles = ref<RoleType[]>([]);
    const userPermissions = ref<PermissionType[]>([]);
    const rolesInitialized = ref(false);
    const rolesError = ref<string | null>(null);
    
    // Getter'lar
    const currentUserRoles = computed(() => userRoles.value);
    const currentUserPermissions = computed(() => userPermissions.value);
    const isRolesInitialized = computed(() => rolesInitialized.value);
    const getRolesError = computed(() => rolesError.value);
    
    // Aksiyon'lar
    function setRolesAndPermissions(rawRoles: string[]) {
        rolesError.value = null;
        try {
            const validRoles = rawRoles
                .map(roleStr => roleStr.toLowerCase() as RoleType)
                .filter(role => Object.values(RoleType).includes(role));
            
            if (validRoles.length === 0 && rawRoles.length > 0) {
                console.warn('[RoleStore] Gelen rollerden hiçbiri geçerli RoleType değil. Kullanıcıya varsayılan (USER) rolü atanıyor.', rawRoles);
                // validRoles.push(RoleType.USER); // Veya boş bırakılabilir, uygulamanın varsayılan davranışına göre
            }

            userRoles.value = validRoles;
            
            let permissions: PermissionType[] = [];
            validRoles.forEach(role => {
                const rolePermissions = ROLE_PERMISSIONS_MAP[role] || [];
                permissions = [...permissions, ...rolePermissions];
            });
            userPermissions.value = [...new Set(permissions)]; // Benzersiz izinleri sakla

            rolesInitialized.value = true;
        } catch (error: any) {
            console.error('[RoleStore] Roller ve izinler ayarlanırken hata:', error);
            rolesError.value = error.message || 'Roller ve izinler ayarlanırken bilinmeyen bir hata oluştu.';
            userRoles.value = [];
            userPermissions.value = [];
            rolesInitialized.value = false;
        }
    }

    function clearRolesAndPermissions() {
        console.log('[RoleStore] Clearing roles and permissions.');
        userRoles.value = [];
        userPermissions.value = [];
        rolesInitialized.value = false;
        rolesError.value = null;
        console.log('[RoleStore] Roles and permissions cleared.');
    }

    // Firebase UID ile rolleri yükleme (Supabase'e uyarlandı, artık doğrudan roller alıyor)
    // async function loadUserRoles(userId: string): Promise<void> { ... } // Bu fonksiyon artık kullanılmıyor, setRolesAndPermissions ile değiştirildi

    // Belirli bir role sahip olup olmadığını kontrol et
    function hasRole(role: RoleType): boolean {
        return userRoles.value.includes(role);
    }

    // Belirli bir izne sahip olup olmadığını kontrol et
    function hasPermission(permission: PermissionType): boolean {
        // Admin her zaman tüm izinlere sahiptir
        if (userRoles.value.includes(RoleType.ADMIN)) {
            return true;
        }
        return userPermissions.value.includes(permission);
    }

    return {
        // State
        userRoles,
        userPermissions,
        rolesInitialized,
        rolesError,
        // Getter'lar
        currentUserRoles,
        currentUserPermissions,
        isRolesInitialized,
        getRolesError,
        // Aksiyon'lar
        setRolesAndPermissions,
        clearRolesAndPermissions, // Yeni action eklendi
        hasRole,
        hasPermission,
    };
});

// Supabase'den tüm rolleri (RoleType enum değerleri) getiren fonksiyon
export async function getAllRoles(): Promise<RoleType[]> {
    // RoleType enum'unun değerlerini döndürür.
    // Gerçek bir API çağrısı yerine enum değerlerini kullanıyoruz,
    // çünkü roller uygulamada sabit olarak tanımlanmış durumda.
    return Object.values(RoleType);
}

// Kullanıcının belirli bir role sahip olup olmadığını kontrol eden fonksiyon
export async function checkUserRole(userId: string, role: RoleType): Promise<boolean> {
    if (!userId) {
        console.error('checkUserRole: userId sağlanmadı.');
        return false;
    }
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', role);

        if (error) {
            console.error('Error fetching user role:', error);
            return false;
        }
        return data && data.length > 0;
    } catch (err) {
        console.error('Exception in checkUserRole:', err);
        return false;
    }
}

// Belirli bir rolün izinlerini getiren fonksiyon
export function getPermissionsForRole(role: RoleType): PermissionType[] {
    return ROLE_PERMISSIONS_MAP[role] || [];
}

// Kullanıcıya belirtilen rolleri ekleyen fonksiyon
export async function addRolesToUser(userId: string, roles: RoleType[]): Promise<void> {
    if (!userId || !roles || roles.length === 0) {
        console.error('addRolesToUser: userId veya roller sağlanmadı/boş.');
        throw new Error('Kullanıcı ID ve roller gereklidir.');
    }
    try {
        const rolesToAdd = roles.map(role => ({
            user_id: userId,
            role: role,
        }));

        const { error } = await supabase.from('user_roles').insert(rolesToAdd);

        if (error) {
            console.error('Error adding roles to user:', error);
            // @ts-ignore
            if (error.code === '23505') { // unique_violation
                throw new Error('Kullanıcı zaten bu rollerden birine veya daha fazlasına sahip.');
            }
            throw new Error('Kullanıcıya rol eklenirken bir hata oluştu.');
        }
        console.log(`Roles ${roles.join(', ')} added to user ${userId}`);
    } catch (err) {
        console.error('Exception in addRolesToUser:', err);
        throw err; // Hatanın yukarıya fırlatılması
    }
}


// Rol hizmetini dışa aktarma
export class RoleService {
    private static instance: RoleService;
    private _store: ReturnType<typeof useRoleStore> | null = null;
    
    private constructor() {
        // Store burada başlatılmayacak
    }

    private get store(): ReturnType<typeof useRoleStore> {
        if (!this._store) {
            this._store = useRoleStore();
        }
        return this._store;
    }
    
    /**
     * Singleton örneği döndürür
     */
    public static getInstance(): RoleService {
        if (!RoleService.instance) {
            RoleService.instance = new RoleService();
        }
        return RoleService.instance;
    }
    
    /**
     * Kullanıcının rollerini ve izinlerini verilen rollerle başlatır.
     * @param {string[]} rolesFromSupabase - Supabase'den alınan kullanıcı rolleri.
     */
    public async initializeRoles(rolesFromSupabase: string[]): Promise<boolean> {
        if (!Array.isArray(rolesFromSupabase)) {
            console.error('[RoleService] rolesFromSupabase bir dizi değil.', rolesFromSupabase);
            // this.store.setRolesAndPermissions([]); // Hatalı durumda rolleri temizle // Store burada null olabilir.
            useRoleStore().setRolesAndPermissions([]); // Doğrudan store'u çağır
            return false;
        }
        try {
            // this.store.setRolesAndPermissions(rolesFromSupabase); // Store burada null olabilir.
            useRoleStore().setRolesAndPermissions(rolesFromSupabase); // Doğrudan store'u çağır
            return true;
        } catch (error) {
            console.error('[RoleService] Error initializing roles:', error);
            return false;
        }
    }

    public clearRoles() { // Yeni public metot
        console.log('[RoleService] Clearing roles via store.');
        // this.store.clearRolesAndPermissions(); // Store burada null olabilir.
        useRoleStore().clearRolesAndPermissions(); // Doğrudan store'u çağır
    }

    /**
     * Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
     * @param role Kontrol edilecek rol
     */
    public hasRole(role: RoleType): boolean {
        const result = this.store.hasRole(role);
        console.log(`[RoleService] Checking role ${role}: ${result}`);
        return result;
    }
    
    /**
     * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     * @param permission Kontrol edilecek izin
     */
    public hasPermission(permission: PermissionType): boolean {
        // Admin her zaman tüm izinlere sahiptir
        // Bu kontrol store içinde zaten var, burada tekrar etmeye gerek yok gibi
        // Ancak service katmanında da bir güvenlik katmanı olarak kalabilir.
        if (this.store.hasRole(RoleType.ADMIN)) {
            console.log('[RoleService] Admin has all permissions.');
            return true;
        }
        const result = this.store.hasPermission(permission);
        console.log(`[RoleService] Checking permission ${permission}: ${result}`);
        return result;
    }

    /**
     * Kullanıcının admin olup olmadığını kontrol eder
     */
    public isAdmin(): boolean {
        // return this.hasRole(RoleType.ADMIN); // Store burada null olabilir.
        return useRoleStore().hasRole(RoleType.ADMIN); // Doğrudan store'u çağır
    }
    
    /**
     * Kullanıcının proje admin olup olmadığını kontrol eder
     */
    public isProjectAdmin(): boolean {
        // return this.hasRole(RoleType.PROJECT_ADMIN) || this.isAdmin(); // Store burada null olabilir.
        const store = useRoleStore();
        return store.hasRole(RoleType.PROJECT_ADMIN) || store.hasRole(RoleType.ADMIN);
    }
    
    /**
     * Kullanıcının depo sorumlusu olup olmadığını kontrol eder
     */
    public isWarehouseManager(): boolean {
        // return this.hasRole(RoleType.WAREHOUSE_MANAGER) || this.isAdmin(); // Store burada null olabilir.
        const store = useRoleStore();
        return store.hasRole(RoleType.WAREHOUSE_MANAGER) || store.hasRole(RoleType.ADMIN);
    }
    
    /**
     * Kullanıcının proje yönetme yetkisi olup olmadığını kontrol eder
     */
    public canManageProjects(): boolean {
        // return this.hasPermission(PermissionType.MANAGE_PROJECTS) || this.isAdmin(); // Store burada null olabilir.
        const store = useRoleStore();
        return store.hasPermission(PermissionType.MANAGE_PROJECTS) || store.hasRole(RoleType.ADMIN);
    }
    
    /**
     * Kullanıcının mevcut rollerini döndürür
     */
    public getCurrentUserRoles(): RoleType[] {
        // return [...this.store.userRoles]; // Değişikliklerin yayılmaması için kopyasını döndür // Store burada null olabilir.
        return [...useRoleStore().userRoles];
    }
    
    /**
     * Kullanıcının mevcut izinlerini döndürür
     */
    public getCurrentUserPermissions(): PermissionType[] {
        // return [...this.store.userPermissions]; // Değişikliklerin yayılmaması için kopyasını döndür // Store burada null olabilir.
        return [...useRoleStore().userPermissions];
    }
    
    /**
     * Rol açıklamalarını döndürür (Bu store'a taşınabilir veya burada kalabilir)
     */
    public getRoleDescriptions(): Record<RoleType, string> {
        return { ...ROLE_DESCRIPTIONS }; // Kopyasını döndür
    }
    
    /**
     * Belirli bir rolün açıklamasını döndürür
     */
    public getRoleDescription(role: RoleType): string {
        return ROLE_DESCRIPTIONS[role] || 'Bilinmeyen Rol';
    }
    
    /**
     * Roller ve izinlerin yüklenip yüklenmediğini kontrol eder
     */
    public isInitialized(): boolean {
        // return this.store.isRolesInitialized; // Store burada null olabilir.
        return useRoleStore().isRolesInitialized;
    }
    
    /**
     * Yükleme sırasında bir hata olup olmadığını kontrol eder
     */
    public getError(): string | null {
        // return this.store.getRolesError; // Store burada null olabilir.
        return useRoleStore().getRolesError;
    }
}

// RoleService örneğini dışa aktar (singleton pattern)
const roleServiceInstance = RoleService.getInstance(); // Değişken adını değiştirdik çakışmayı önlemek için

export const getRoleService = () => roleServiceInstance;

// Eğer `roleService` adıyla doğrudan bir exporta ihtiyaç varsa ve proxy'nin amacı
// henüz başlatılmamış servise erişimi daha güvenli hale getirmekse,
// proxy'yi kaldırıp sadece getRoleService() kullanımını teşvik edebiliriz.
// Şimdilik proxy'yi kaldırarak "redeclaration" hatasını çözüyoruz.
// Gerekirse proxy mantığı farklı bir şekilde (belki de getRoleService içinde) ele alınabilir.
export const roleService = roleServiceInstance; // Singleton örneğini doğrudan dışa aktar
