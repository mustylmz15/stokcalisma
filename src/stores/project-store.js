import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useProjectStore = defineStore('project', () => {
    const projects = ref([]);
    const currentProject = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const showProjectSelectorModal = ref(false);

    // Kullanıcının erişebileceği tüm projeleri getir
    const fetchProjects = async () => {
        loading.value = true;
        error.value = null;
        
        try {
            // API'den projeleri çekme
            const response = await axios.get('/api/projects');
            projects.value = response.data;
        } catch (err) {
            error.value = err.message || 'Projeler yüklenirken bir hata oluştu';
            console.error('Projeler yüklenirken hata:', err);
        } finally {
            loading.value = false;
        }
    };

    // Seçilen projeyi ayarla
    const setCurrentProject = async (projectId) => {
        loading.value = true;
        error.value = null;
        
        try {
            // Seçilen projenin detaylarını al veya varolan projeler içinden bul
            let projectToSet;
            
            if (projects.value.length > 0) {
                projectToSet = projects.value.find(p => p.id === projectId);
            }
            
            if (!projectToSet) {
                const response = await axios.get(`/api/projects/${projectId}`);
                projectToSet = response.data;
            }
            
            // Projeyi ayarla ve local storage'a kaydet
            if (projectToSet) {
                currentProject.value = projectToSet;
                localStorage.setItem('currentProjectId', projectId);
                
                // API'ye seçilen projeyi bildir (isteğe bağlı)
                await axios.post('/api/users/current-project', { projectId });
            } else {
                throw new Error('Proje bulunamadı');
            }
        } catch (err) {
            error.value = err.message || 'Proje seçilirken bir hata oluştu';
            console.error('Proje seçilirken hata:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Daha önce seçilen projeyi kontrol et ve yükle
    const loadSavedProject = async () => {
        const savedProjectId = localStorage.getItem('currentProjectId');
        if (savedProjectId) {
            try {
                await setCurrentProject(savedProjectId);
                return true;
            } catch {
                localStorage.removeItem('currentProjectId');
                return false;
            }
        }
        return false;
    };

    // Proje seçim modalını aç
    const openProjectSelectorModal = () => {
        showProjectSelectorModal.value = true;
    };

    // Proje seçim modalını kapat
    const closeProjectSelectorModal = () => {
        showProjectSelectorModal.value = false;
    };

    return {
        projects,
        currentProject,
        loading,
        error,
        showProjectSelectorModal,
        fetchProjects,
        setCurrentProject,
        loadSavedProject,
        openProjectSelectorModal,
        closeProjectSelectorModal
    };
});
