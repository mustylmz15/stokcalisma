// Proje ile ilgili işlemleri yönetecek servis
import { supabase } from '../supabase'; // Supabase istemcisini içe aktar

// Proje tipi için arayüz
export interface Project {
    id: string;
    name: string;
    description?: string;
    created_at: string; // Supabase genellikle created_at kullanır
    updated_at?: string; // Supabase genellikle updated_at kullanır
    is_active?: boolean; // Supabase genellikle is_active kullanır
    // manager_email?: string; // Bu alan Supabase tablonuzda yok gibi görünüyor
}

// Kullanıcı-Proje ilişkisi için arayüz (Supabase'de ayrı bir tablo varsa)
// export interface UserProject {
//     user_id: string;
//     project_id: string;
//     role: string;
//     created_at?: string;
//     updated_at?: string;
// }

// Proje kullanıcıları için arayüz (Supabase'de ayrı bir tablo varsa)
// export interface ProjectUser {
//     user_id: string; 
//     role: string;
//     added_at?: string;
// }

class ProjectService {
    // Tüm projeleri getir
    async getProjects(): Promise<Project[]> {
        try {
            const { data: projects, error } = await supabase
                .from('projects')
                .select('id, name, description, created_at, updated_at, is_active') // manager_email kaldırıldı
                .order('name', { ascending: true });

            console.log('[projectService] Supabase projects data:', projects);
            console.log('[projectService] Supabase projects error:', error);

            if (error) {
                console.error('Supabase projeler getirilirken hata oluştu:', error);
                throw error;
            }
            return projects || [];
        } catch (error) {
            console.error('Projeler getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Tüm projeleri getir (isAdmin çağrısıyla uyumlu olması için)
    async getAllProjects(): Promise<Project[]> {
        return this.getProjects();
    }
    
    // Kullanıcıya ait projeleri getir (Supabase'e göre güncellenmeli)
    async getUserProjects(userId: string): Promise<Project[]> {
        try {
            // Bu kısım Supabase'deki kullanıcı-proje ilişkilerinize göre tamamen yeniden yazılmalı.
            // Örnek olarak, eğer 'user_projects' adında bir birleştirme tablonuz varsa:
            const { data: userProjectLinks, error: linkError } = await supabase
                .from('user_project_roles') // veya user_projects, vb.
                .select('project_id')
                .eq('user_id', userId);

            if (linkError) {
                console.error('Kullanıcı proje bağlantıları getirilirken hata:', linkError);
                throw linkError;
            }

            if (!userProjectLinks || userProjectLinks.length === 0) {
                return [];
            }

            const projectIds = userProjectLinks.map(link => link.project_id);
            
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, description, created_at, updated_at, is_active') // manager_email kaldırıldı
                .in('id', projectIds)
                .order('name', { ascending: true });

            if (projectsError) {
                console.error('Kullanıcı projeleri (detay) getirilirken hata:', projectsError);
                throw projectsError;
            }

            return projects || [];

        } catch (error) {
            console.error('Kullanıcı projeleri getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Proje detaylarını getir (Supabase'e göre güncellenmeli)
    async getProjectById(id: string): Promise<Project | undefined> {
        try {
            const { data: project, error } = await supabase
                .from('projects')
                .select('id, name, description, created_at, updated_at, is_active') // manager_email kaldırıldı
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // Kayıt bulunamadı hatası
                    return undefined;
                }
                console.error('Supabase proje detayları getirilirken hata oluştu:', error);
                throw error;
            }
            
            return project || undefined;
        } catch (error) {
            console.error('Proje detayları getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Kullanıcılar ve proje ilişkilerini getir (Supabase'e göre güncellenmeli)
    async getUsersByProjectId(projectId: string): Promise<any[]> { // UserProject[] yerine any[] veya uygun Supabase tipi
        try {
            const { data: userRoles, error } = await supabase
                .from('user_project_roles') // veya user_projects, vb.
                .select('user_id, role, profiles ( id, first_name, last_name, email )') // profilleri join ile çekme örneği
                .eq('project_id', projectId);

            if (error) {
                console.error('Proje kullanıcıları (Supabase) getirilirken hata:', error);
                throw error;
            }
            
            return userRoles || [];
        } catch (error) {
            console.error('Proje kullanıcıları getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Yeni proje ekle (Supabase'e göre güncellenmeli)
    async addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
        try {
            const { data: newProject, error } = await supabase
                .from('projects')
                .insert([{
                    name: project.name,
                    description: project.description,
                    is_active: project.is_active !== undefined ? project.is_active : true,
                    // manager_email: project.manager_email // Bu alan kaldırıldı
                }])
                .select('id, name, description, created_at, updated_at, is_active') // manager_email kaldırıldı
                .single();

            if (error) {
                console.error('Supabase proje eklenirken hata:', error);
                throw error;
            }
            if (!newProject) {
                throw new Error('Proje oluşturuldu ancak veri döndürülmedi.');
            }
            
            return newProject;
        } catch (error) {
            console.error('Proje eklenirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Proje güncelle (Supabase'e göre güncellenmeli)
    async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project | undefined> {
        try {
            const { data: updatedProject, error } = await supabase
                .from('projects')
                .update({
                    ...updates,
                    // manager_email: updates.manager_email // Eğer manager_email güncellenmek isteniyorsa ve tabloda yoksa hata verir
                })
                .eq('id', id)
                .select('id, name, description, created_at, updated_at, is_active') // manager_email kaldırıldı
                .single();

            if (error) {
                console.error('Supabase proje güncellenirken hata:', error);
                throw error;
            }
            
            return updatedProject || undefined;
        } catch (error) {
            console.error('Proje güncellenirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Proje sil (Supabase'e göre güncellenmeli)
    async deleteProject(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase proje silinirken hata:', error);
                throw error;
            }
        } catch (error) {
            console.error('Proje silinirken hata oluştu:', error);
            throw error;
        }
    }

    // Kullanıcıyı projeye ekle
    async addUserToProject(userId: string, projectId: string, role: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_project_roles')
                .insert([{
                    user_id: userId,
                    project_id: projectId,
                    role: role
                }]);

            if (error) {
                console.error('Kullanıcı projeye eklenirken hata:', error);
                throw error;
            }
        } catch (error) {
            console.error('Kullanıcı projeye eklenirken hata oluştu:', error);
            throw error;
        }
    }

    // Kullanıcının proje rolünü güncelle
    async updateUserProjectRole(userId: string, projectId: string, newRole: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_project_roles')
                .update({ role: newRole })
                .eq('user_id', userId)
                .eq('project_id', projectId);

            if (error) {
                console.error('Kullanıcı proje rolü güncellenirken hata:', error);
                throw error;
            }
        } catch (error) {
            console.error('Kullanıcı proje rolü güncellenirken hata oluştu:', error);
            throw error;
        }
    }

    // Kullanıcının proje rolünü getir
    async getUserProjectRole(userId: string, projectId: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('user_project_roles')
                .select('role')
                .eq('user_id', userId)
                .eq('project_id', projectId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // Kayıt bulunamadı
                    return null;
                }
                console.error('Kullanıcı proje rolü getirilirken hata:', error);
                throw error;
            }

            return data?.role || null;
        } catch (error) {
            console.error('Kullanıcı proje rolü getirilirken hata oluştu:', error);
            throw error;
        }
    }

    // Depoyu projeye ekle
    async addWarehouseToProject(warehouseId: string, projectId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('project_warehouses')
                .insert([{
                    warehouse_id: warehouseId,
                    project_id: projectId
                }]);

            if (error) {
                console.error('Depo projeye eklenirken hata:', error);
                throw error;
            }
        } catch (error) {
            console.error('Depo projeye eklenirken hata oluştu:', error);
            throw error;
        }
    }

    // Depoyu projeden kaldır
    async removeWarehouseFromProject(warehouseId: string, projectId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('project_warehouses')
                .delete()
                .eq('warehouse_id', warehouseId)
                .eq('project_id', projectId);

            if (error) {
                console.error('Depo projeden kaldırılırken hata:', error);
                throw error;
            }
        } catch (error) {
            console.error('Depo projeden kaldırılırken hata oluştu:', error);
            throw error;
        }
    }
}

// Singleton service instance
export const projectService = new ProjectService();
export default projectService;