import { supabase } from '../supabase'

// =======================================
// INTERFACE TANIMLARI
// =======================================

export type WarehouseType = 'MAIN' | 'PROJECT'

// Profil bilgileri (user referansı için)
export interface UserProfile {
    id: string
    first_name?: string
    last_name?: string
    email: string
}

// Depo yöneticisi
export interface WarehouseManager {
    id: string
    warehouse_id: string
    user_id: string
    is_active: boolean
    assigned_at: string
    assigned_by?: string
    profiles?: UserProfile  // Direct relation
    user?: {                // Nested relation for backward compatibility
        profiles: UserProfile
    }
}

// Depo modeli
export interface Warehouse {
    id: string
    name: string
    code: string
    description?: string
    address?: string
    city?: string
    country?: string
    warehouse_type: WarehouseType
    parent_id?: string
    project_id?: string
    is_active: boolean
    created_at: string
    updated_at?: string
    
    // İlişkili veriler
    managers?: WarehouseManager[]           // Backward compatibility
    warehouse_managers?: WarehouseManager[] // New format
    parent_warehouse?: Warehouse
    project?: {
        id: string
        name: string
        description?: string
    }
}

// Depo oluşturma formu
export interface CreateWarehouseForm {
    name: string
    code: string
    description?: string
    address?: string
    city?: string
    country?: string
    warehouse_type: WarehouseType
    parent_id?: string
    project_id?: string
}

// Depo güncelleme formu
export interface UpdateWarehouseForm {
    name?: string
    code?: string
    description?: string
    address?: string
    city?: string
    country?: string
    project_id?: string
    is_active?: boolean
}

// Depo yöneticisi atama formu
export interface AssignManagerForm {
    warehouse_id: string
    user_id: string
}

class WarehouseService {
    // =======================================
    // DEPO LİSTELEME İŞLEMLERİ
    // =======================================

    /**
     * Tüm depoları listeler (kullanıcının erişim yetkisi olan)
     */
    async getAllWarehouses(): Promise<{ data: Warehouse[], error: any }> {
        try {
            // Önce tüm depoları al
            const { data: warehouses, error: warehousesError } = await supabase
                .from('warehouses')
                .select('*')
                .eq('is_active', true)
                .order('warehouse_type', { ascending: true })
                .order('name', { ascending: true })

            if (warehousesError) {
                return { data: [], error: warehousesError }
            }

            if (!warehouses || warehouses.length === 0) {
                return { data: [], error: null }
            }

            // Her depo için detaylarını ayrı ayrı al
            const warehousesWithDetails = await Promise.all(
                warehouses.map(async (warehouse) => {
                    try {
                        // Managers - warehouse_managers tablosu varsa kullan
                        let managers: any[] = []
                        const { data: managersData } = await supabase
                            .from('warehouse_managers')
                            .select('id, user_id, is_active, assigned_at')
                            .eq('warehouse_id', warehouse.id)
                            .eq('is_active', true)

                        if (managersData && managersData.length > 0) {
                            // Her manager için profile bilgisini al
                            const managersWithProfiles = await Promise.all(
                                managersData.map(async (manager) => {
                                    const { data: profile } = await supabase
                                        .from('profiles')
                                        .select('id, first_name, last_name, email')
                                        .eq('id', manager.user_id)
                                        .single()

                                    return {
                                        ...manager,
                                        profiles: profile || null
                                    }
                                })
                            )
                            managers = managersWithProfiles
                        }

                        // Parent warehouse
                        let parentWarehouse: any = null
                        if (warehouse.parent_id) {
                            const { data: parent } = await supabase
                                .from('warehouses')
                                .select('id, name, code, warehouse_type')
                                .eq('id', warehouse.parent_id)
                                .single()
                            parentWarehouse = parent || null
                        }

                        // Project info
                        let project: any = null
                        if (warehouse.project_id) {
                            const { data: projectData } = await supabase
                                .from('projects')
                                .select('id, name, description')
                                .eq('id', warehouse.project_id)
                                .single()
                            project = projectData || null
                        }

                        return {
                            ...warehouse,
                            warehouse_managers: managers,
                            managers: managers, // Backward compatibility
                            parent_warehouse: parentWarehouse,
                            project: project
                        }
                    } catch (error) {
                        console.error(`Depo ${warehouse.id} detayları alınırken hata:`, error)
                        return {
                            ...warehouse,
                            warehouse_managers: [],
                            managers: [],
                            parent_warehouse: null,
                            project: null
                        }
                    }
                })
            )

            return { data: warehousesWithDetails as Warehouse[], error: null }
        } catch (error) {
            console.error('Tüm depolar alınırken hata:', error)
            return { data: [], error }
        }
    }

    /**
     * Ana depoları listeler
     */
    async getMainWarehouses(): Promise<{ data: Warehouse[], error: any }> {
        try {
            // Önce ana depoları al
            const { data: warehouses, error: warehousesError } = await supabase
                .from('warehouses')
                .select('*')
                .eq('warehouse_type', 'MAIN')
                .is('parent_id', null)
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (warehousesError) {
                return { data: [], error: warehousesError }
            }

            if (!warehouses || warehouses.length === 0) {
                return { data: [], error: null }
            }

            // Her depo için yöneticilerini ayrı ayrı al
            const warehousesWithManagers = await Promise.all(
                warehouses.map(async (warehouse) => {
                    try {
                        let managers: any[] = []
                        const { data: managersData } = await supabase
                            .from('warehouse_managers')
                            .select('id, user_id, is_active, assigned_at')
                            .eq('warehouse_id', warehouse.id)
                            .eq('is_active', true)

                        if (managersData && managersData.length > 0) {
                            // Her manager için profile bilgisini al
                            const managersWithProfiles = await Promise.all(
                                managersData.map(async (manager) => {
                                    const { data: profile } = await supabase
                                        .from('profiles')
                                        .select('id, first_name, last_name, email')
                                        .eq('id', manager.user_id)
                                        .single()

                                    return {
                                        ...manager,
                                        profiles: profile || null
                                    }
                                })
                            )
                            managers = managersWithProfiles
                        }

                        return {
                            ...warehouse,
                            warehouse_managers: managers,
                            managers: managers // Backward compatibility
                        }
                    } catch (error) {
                        console.error(`Ana depo ${warehouse.id} yöneticileri alınırken hata:`, error)
                        return {
                            ...warehouse,
                            warehouse_managers: [],
                            managers: []
                        }
                    }
                })
            )

            return { data: warehousesWithManagers as Warehouse[], error: null }
        } catch (error) {
            console.error('Ana depolar alınırken hata:', error)
            return { data: [], error }
        }
    }

    /**
     * Proje depolarını listeler
     */
    async getProjectWarehouses(projectId?: string): Promise<{ data: Warehouse[], error: any }> {
        try {
            // Önce proje depolarını al
            let query = supabase
                .from('warehouses')
                .select('*')
                .eq('warehouse_type', 'PROJECT')
                .eq('is_active', true)

            if (projectId) {
                query = query.eq('project_id', projectId)
            }

            const { data: warehouses, error: warehousesError } = await query.order('name', { ascending: true })

            if (warehousesError) {
                return { data: [], error: warehousesError }
            }

            if (!warehouses || warehouses.length === 0) {
                return { data: [], error: null }
            }

            // Her depo için yöneticilerini ve parent/project bilgilerini ayrı ayrı al
            const warehousesWithDetails = await Promise.all(
                warehouses.map(async (warehouse) => {
                    try {
                        // Managers
                        let managers: any[] = []
                        const { data: managersData } = await supabase
                            .from('warehouse_managers')
                            .select('id, user_id, is_active, assigned_at')
                            .eq('warehouse_id', warehouse.id)
                            .eq('is_active', true)

                        if (managersData && managersData.length > 0) {
                            const managersWithProfiles = await Promise.all(
                                managersData.map(async (manager) => {
                                    const { data: profile } = await supabase
                                        .from('profiles')
                                        .select('id, first_name, last_name, email')
                                        .eq('id', manager.user_id)
                                        .single()

                                    return {
                                        ...manager,
                                        profiles: profile || null
                                    }
                                })
                            )
                            managers = managersWithProfiles
                        }

                        // Parent warehouse
                        let parentWarehouse: any = null
                        if (warehouse.parent_id) {
                            const { data: parent } = await supabase
                                .from('warehouses')
                                .select('id, name, code, warehouse_type')
                                .eq('id', warehouse.parent_id)
                                .single()
                            parentWarehouse = parent || null
                        }

                        // Project info
                        let project: any = null
                        if (warehouse.project_id) {
                            const { data: projectData } = await supabase
                                .from('projects')
                                .select('id, name, description')
                                .eq('id', warehouse.project_id)
                                .single()
                            project = projectData || null
                        }

                        return {
                            ...warehouse,
                            warehouse_managers: managers,
                            managers: managers, // Backward compatibility
                            parent_warehouse: parentWarehouse,
                            project: project
                        }
                    } catch (error) {
                        console.error(`Proje deposu ${warehouse.id} detayları alınırken hata:`, error)
                        return {
                            ...warehouse,
                            warehouse_managers: [],
                            managers: [],
                            parent_warehouse: null,
                            project: null
                        }
                    }
                })
            )

            return { data: warehousesWithDetails as Warehouse[], error: null }
        } catch (error) {
            console.error('Proje depoları alınırken hata:', error)
            return { data: [], error }
        }
    }

    /**
     * Warehouse istatistiklerini getirir
     */
    async getWarehouseStats(): Promise<{ data: any[], error: any }> {
        try {
            const { data, error } = await supabase
                .rpc('get_warehouse_stats')

            return { data: data || [], error }
        } catch (error) {
            console.error('Warehouse stats alınırken hata:', error)
            return { data: [], error }
        }
    }

    /**
     * Kullanıcının yönettiği depoları listeler
     */
    async getUserManagedWarehouses(): Promise<{ data: Warehouse[], error: any }> {
        try {
            const { data: user } = await supabase.auth.getUser()
            if (!user?.user) {
                return { data: [], error: { message: 'Kullanıcı bulunamadı' } }
            }

            // Kullanıcının yönetici olduğu warehouse ID'lerini al
            const { data: managerData } = await supabase
                .from('warehouse_managers')
                .select('warehouse_id')
                .eq('user_id', user.user.id)
                .eq('is_active', true)

            if (!managerData || managerData.length === 0) {
                return { data: [], error: null }
            }

            const warehouseIds = managerData.map(m => m.warehouse_id)

            // Bu depoların detaylarını al
            const { data: warehouses, error } = await supabase
                .from('warehouses')
                .select('*')
                .in('id', warehouseIds)
                .eq('is_active', true)
                .order('name', { ascending: true })

            return { data: warehouses as Warehouse[] || [], error }
        } catch (error) {
            console.error('Kullanıcı depoları alınırken hata:', error)
            return { data: [], error }
        }
    }

    // =======================================
    // DEPO OLUŞTURMA VE GÜNCELLEME İŞLEMLERİ
    // =======================================

    /**
     * Yeni depo oluşturur
     */
    async createWarehouse(warehouseData: CreateWarehouseForm): Promise<{ data: Warehouse | null, error: any }> {
        try {
            const payload = {
                ...warehouseData,
                is_active: true,
                // created_at ve updated_at alanları genellikle Supabase trigger'ları veya varsayılan değerlerle yönetilir.
                // Eğer tablonuzda bu şekilde bir otomatik yönetim yoksa, burada manuel olarak eklemeniz gerekebilir:
                // created_at: new Date().toISOString(), 
            };
            // ADD THIS LOG
            console.log('[warehouseService] Payload for Supabase insert:', JSON.parse(JSON.stringify(payload)));

            const { data, error } = await supabase
                .from('warehouses')
                .insert([payload])
                .select()
                .single()

            if (error) {
                console.error('[warehouseService] Supabase error during create:', error);
            }
            return { data: data as Warehouse, error }
        } catch (error) {
            console.error('[warehouseService] Catch error during create:', error);
            return { data: null, error }
        }
    }

    /**
     * Depoyu günceller
     */
    async updateWarehouse(id: string, updates: UpdateWarehouseForm): Promise<{ data: Warehouse | null, error: any }> {
        try {
            const { data, error } = await supabase
                .from('warehouses')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            return { data: data as Warehouse, error }
        } catch (error) {
            return { data: null, error }
        }
    }

    /**
     * Depo yöneticisi ekleme
     */
    async addWarehouseManager(warehouseId: string, userId: string): Promise<{ data: any, error: any }> {
        try {
            // Mevcut kayıt var mı kontrol et
            const { data: existing } = await supabase
                .from('warehouse_managers')
                .select('*')
                .eq('warehouse_id', warehouseId)
                .eq('user_id', userId)
                .single()

            if (existing) {
                return { data: null, error: { message: 'Bu kullanıcı zaten bu deponun yöneticisi' } }
            }

            // Mevcut kullanıcı bilgisini al
            const { data: user } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('warehouse_managers')
                .insert([{
                    warehouse_id: warehouseId,
                    user_id: userId,
                    assigned_by: user?.user?.id,
                    assigned_at: new Date().toISOString(),
                    is_active: true,
                    created_at: new Date().toISOString(),
                }])
                .select()
                .single()

            return { data, error }
        } catch (error) {
            return { data: null, error }
        }
    }
}

// Singleton service instance
export const warehouseService = new WarehouseService()
export default warehouseService
