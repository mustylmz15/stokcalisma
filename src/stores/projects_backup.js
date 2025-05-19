import { defineStore } from 'pinia';
from;
'vue';
import projectService from '@/services/projectService';
import { useAuthStore } from './auth-store';
export const useProjectStore = defineStore('projects', () => {
    // State
    const projects = ref([]);
    const activeProject = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const isInitialized = ref(false);
    // Auth store
    const authStore = useAuthStore();
    // Computed
    const activeProjectId = computed(() => activeProject.value?.id || null);
    const userProjects = computed(() => {
        if (!authStore.userInfo)
            return [];
        // Admin ise tüm aktif projeleri görsün
        if (authStore.isAdmin) {
            return projects.value.filter(p => p.isActive);
        }
        // Admin değilse sadece kullanıcının erişimi olan aktif projeleri görsün
        return projects.value.filter(p => {
            // Projenin aktif olması ve kullanıcının bu projeye erişimi olması gerekiyor
            return p.isActive && p.users && p.users.some(u => u.userId === authStore.userInfo?.id);
        });
    });
    // Actions
    // initializeStore fonksiyonunu güncelliyoruz - belirli projeleri yüklemek için parametre eklendi
    async function initializeStore(projectIds) {
        if (!authStore.isLoggedIn)
            return;
        // Zaten yüklendiyse ve özel bir projectIds listesi verilmediyse yeniden yükleme
        if (isInitialized.value && !projectIds)
            return;
        loading.value = true;
        error.value = null;
        try {
            // Eğer belirli proje ID'leri verildiyse, onları kullan
            if (projectIds && projectIds.length > 0) {
                console.log(`Belirli projeler yükleniyor: ${projectIds.length} adet`);
                await loadSpecificProjects(projectIds);
            }
            else {
                // Normal yükleme - kullanıcı projelerini yükle
                console.log('Normal proje yükleme işlemi başlatılıyor');
                await loadUserProjects();
            }
            // Eğer aktif proje yoksa ve en az bir proje varsa, ilk projeyi aktif yap
            if (!activeProject.value && projects.value.length > 0) {
                setActiveProject(projects.value[0].id);
            }
            isInitialized.value = true;
        }
        catch (err) {
            error.value = err.message || 'Proje bilgileri yüklenirken hata oluştu';
            console.error('Project store initialization error:', err);
        }
        finally {
            loading.value = false;
        }
    }
    async function loadUserProjects() {
        if (!authStore.userInfo)
            return;
        loading.value = true;
        error.value = null;
        try { // Admin ise tüm projeleri, değilse sadece kullanıcının projelerini yükle
            let userProjects = [];
            try {
                if (authStore.isAdmin) {
                    // Admin kullanıcılar için tüm projeleri getir
                    userProjects = await projectService.getAllProjects();
                }
                else {
                    // Normal kullanıcılar için sadece kendi projelerini getir
                    userProjects = await projectService.getUserProjects(authStore.userInfo.id);
                }
                // Boş veya hatalı projeler olmamasını sağla
                userProjects = userProjects.filter(project => project && project.id && typeof project.id === 'string');
            }
            catch (err) {
                console.error('Kullanıcı projeleri yüklenirken hata:', err);
                userProjects = []; // Hata durumunda boş dizi kullan
            }
            projects.value = userProjects;
        }
        catch (err) {
            error.value = err.message || 'Projeler yüklenirken hata oluştu';
            console.error('Load projects error:', err);
        }
        finally {
            loading.value = false;
        }
    }
    // Belirli proje ID'lerine göre projeleri yükle (kullanıcı için özel olarak)
    async function loadSpecificProjects(projectIds) {
        if (!projectIds || projectIds.length === 0)
            return;
        loading.value = true;
        error.value = null;
        try {
            // Tüm projeleri al ve filtreleme yap
            const allProjects = await projectService.getAllProjects();
            // Sadece verilen ID'lere sahip projeleri filtrele
            projects.value = allProjects.filter(project => projectIds.includes(project.id));
            console.log(`${projects.value.length} proje yüklendi (${projectIds.length} arasından)`);
        }
        catch (err) {
            error.value = err.message || 'Projeler yüklenirken hata oluştu';
            console.error('Load specific projects error:', err);
        }
        finally {
            loading.value = false;
        }
    }
    function setActiveProject(projectId) {
        if (projectId) {
            const project = projects.value.find(p => p.id === projectId);
            if (project) {
                activeProject.value = project;
                localStorage.setItem('activeProjectId', project.id);
            }
        }
        else {
            console.warn(`Project with ID ${projectId} not found`);
        }
    }
    // Aktif projeyi temizle - "Tüm Projeler" modu için
    function clearActiveProject() {
        activeProject.value = null;
        localStorage.removeItem('activeProjectId');
    }
    async function addProject(projectData) {
        if (!authStore.isAdmin) {
            error.value = 'Bu işlem için yetkiniz yok';
            return null;
        }
        loading.value = true;
        error.value = null;
        try {
            const newProject = await projectService.addProject(projectData);
            projects.value.push(newProject);
            // Eğer ilk proje ise, aktif proje olarak ayarla
            if (projects.value.length === 1) {
                setActiveProject(newProject.id);
            }
            return newProject;
        }
        catch (err) {
            error.value = err.message || 'Proje eklenirken hata oluştu';
            console.error('Add project error:', err);
            return null;
        }
        finally {
            loading.value = false;
        }
    }
    async function updateProject(projectId, projectData) {
        if (!authStore.isAdmin) {
            error.value = 'Bu işlem için yetkiniz yok';
            return null;
        }
        loading.value = true;
        error.value = null;
        try {
            const updatedProject = await projectService.updateProject(projectId, projectData);
            // Projeyi state'de güncelle
            const index = projects.value.findIndex(p => p.id === projectId);
            if (index !== -1) {
                projects.value[index] = { ...projects.value[index], ...updatedProject };
                // Eğer aktif proje güncellendiyse, aktif projeyi de güncelle
                if (activeProject.value?.id === projectId) {
                    activeProject.value = { ...activeProject.value, ...updatedProject };
                }
            }
            return updatedProject;
        }
        catch (err) {
            error.value = err.message || 'Proje güncellenirken hata oluştu';
            console.error('Update project error:', err);
            return null;
        }
        finally {
            loading.value = false;
        }
    }
    async function deleteProject(projectId) {
        if (!authStore.isAdmin) {
            error.value = 'Bu işlem için yetkiniz yok';
            return false;
        }
        loading.value = true;
        error.value = null;
        try {
            await projectService.deleteProject(projectId);
            // Projeyi state'den kaldır
            projects.value = projects.value.filter(p => p.id !== projectId);
            // Eğer aktif proje silindiyse, başka bir proje aktif yap
            if (activeProject.value?.id === projectId) {
                activeProject.value = null;
                if (projects.value.length > 0) {
                    setActiveProject(projects.value[0].id);
                }
            }
            return true;
        }
        catch (err) {
            error.value = err.message || 'Proje silinirken hata oluştu';
            console.error('Delete project error:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    }
    async function addUserToProject(userId, projectId, role) {
        // Proje yönetici yetkisi kontrolü
        const hasPermission = await hasProjectRole(projectId, ['admin', 'proje_admin']);
        if (!hasPermission) {
            error.value = 'Bu işlem için yetkiniz yok';
            return false;
        }
        loading.value = true;
        error.value = null;
        try {
            await projectService.addUserToProject(userId, projectId, role);
            return true;
        }
        catch (err) {
            error.value = err.message || 'Kullanıcı projeye eklenirken hata oluştu';
            console.error('Add user to project error:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    }
    async function removeUserFromProject(userId, projectId) {
        // Proje yönetici yetkisi kontrolü
        const hasPermission = await hasProjectRole(projectId, ['admin', 'proje_admin']);
        if (!hasPermission) {
            error.value = 'Bu işlem için yetkiniz yok';
            return false;
        }
        loading.value = true;
        error.value = null;
        try {
            await projectService.removeUserFromProject(userId, projectId);
            return true;
        }
        catch (err) {
            error.value = err.message || 'Kullanıcı projeden çıkarılırken hata oluştu';
            console.error('Remove user from project error:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    }
    async function updateUserProjectRole(userId, projectId, newRole) {
        // Proje yönetici yetkisi kontrolü
        const hasPermission = await hasProjectRole(projectId, ['admin', 'proje_admin']);
        if (!hasPermission) {
            error.value = 'Bu işlem için yetkiniz yok';
            return false;
        }
        loading.value = true;
        error.value = null;
        try {
            await projectService.updateUserProjectRole(userId, projectId, newRole);
            return true;
        }
        catch (err) {
            error.value = err.message || 'Kullanıcı rolü güncellenirken hata oluştu';
            console.error('Update user project role error:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    }
    // Depo-Proje işlemleri
    async function addWarehouseToProject(warehouseId, projectId) {
        if (!authStore.isAdmin && !await hasProjectRole(projectId, ['admin', 'proje_admin'])) {
            error.value = 'Bu işlem için yetkiniz yok';
            return null;
        }
        loading.value = true;
        error.value = null;
        try {
            await projectService.addWarehouseToProject(warehouseId, projectId);
            return true;
        }
        catch (err) {
            error.value = err.message || 'Depo projeye eklenirken hata oluştu';
            console.error('Add warehouse to project error:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    }
    async function removeWarehouseFromProject(warehouseId, projectId) {
        if (!authStore.isAdmin && !await hasProjectRole(projectId, ['admin', 'proje_admin'])) {
            error.value = 'Bu işlem için yetkiniz yok';
            return false;
        }
        loading.value = true;
        error.value = null;
        try {
            await projectService.removeWarehouseFromProject(warehouseId, projectId);
            return true;
        }
        catch (err) {
            error.value = err.message || 'Depo projeden çıkarılırken hata oluştu';
            console.error('Remove warehouse from project error:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    }
    async function hasProjectRole(projectId, allowedRoles) {
        if (!authStore.userInfo)
            return false;
        // Admin her şeyi yapabilir
        if (authStore.isAdmin)
            return true;
        // Rol kontrolü
        const project = projects.value.find(p => p.id === projectId);
        if (project && project.users) {
            // Kullanıcının bu projedeki rolünü bul
            const userInProject = project.users.find(u => u.userId === authStore.userInfo.id);
            if (userInProject) {
                return allowedRoles.includes(userInProject.role);
            }
        }
        try {
            const userRole = await projectService.getUserProjectRole(authStore.userInfo.id, projectId);
            if (userRole) {
                return allowedRoles.includes(userRole);
            }
            else
                return false;
        }
        catch (err) {
            console.error('Check project role error:', err);
            return false;
        }
    }
    // Kullanıcının aktif projedeki rolünü kontrol et
    async function hasActiveProjectRole(allowedRoles) {
        if (!activeProject.value)
            return false;
        return await hasProjectRole(activeProject.value.id, allowedRoles);
    }
    // Aktif projeden verilen projeye geç
    function switchProject(projectId) {
        setActiveProject(projectId);
    }
    // Store'u sıfırla
    function resetStore() {
        projects.value = [];
        activeProject.value = null;
        loading.value = false;
        error.value = null;
        isInitialized.value = false;
        localStorage.removeItem('activeProjectId');
    }
    // Store'u başlat
    function initFromLocalStorage() {
        const savedProjectId = localStorage.getItem('activeProjectId');
        if (savedProjectId) {
            setActiveProject(savedProjectId);
        }
    }
    // Oturum açıldığında store'u başlat
    if (authStore.isLoggedIn) {
        initFromLocalStorage();
    }
    return {
        // State
        projects,
        activeProject,
        loading,
        error,
        isInitialized,
        // Computed
        activeProjectId,
        userProjects,
        // Actions
        initializeStore,
        loadUserProjects,
        setActiveProject,
        clearActiveProject,
        addProject,
        updateProject,
        deleteProject,
        addUserToProject,
        removeUserFromProject,
        updateUserProjectRole,
        addWarehouseToProject,
        removeWarehouseFromProject,
        hasProjectRole,
        hasActiveProjectRole,
        switchProject,
        resetStore
    };
});
//# sourceMappingURL=projects_backup.js.map