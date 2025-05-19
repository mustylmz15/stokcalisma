import { defineStore } from 'pinia';
import { ref } from 'vue';
import { collection, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from './auth-store';
export const useProjectStore = defineStore('project', () => {
    const authStore = useAuthStore();
    const projects = ref([]);
    const currentProject = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const showProjectSelectorModal = ref(false);
    // Aktif proje ID'si
    const activeProjectId = ref(null); // Projeleri Firebase'den getir
    const fetchProjects = async () => {
        loading.value = true;
        error.value = null;
        try {
            const projectsRef = collection(db, 'projects');
            const querySnapshot = await getDocs(projectsRef);
            const fetchedProjects = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedProjects.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                });
            });
            projects.value = fetchedProjects;
            // Mevcut aktif projeyi kontrol et
            if (activeProjectId.value) {
                const activeProject = fetchedProjects.find(p => p.id === activeProjectId.value);
                if (activeProject) {
                    currentProject.value = activeProject;
                }
            }
        }
        catch (err) {
            error.value = err.message || 'Projeler yüklenirken bir hata oluştu';
            console.error('Projeler yüklenirken hata:', err);
        }
        finally {
            loading.value = false;
        }
    };
    // Varsayılan projeleri ekle (demo projeler)
    const addDefaultProjects = () => {
        // Demo projeler
        projects.value = [
            { id: 'project1', name: 'TYP Projesi', description: 'Türkiye Yolcu Projelendirmesi' },
            { id: 'project2', name: 'KGYS Projesi', description: 'Kent Güvenlik Yönetim Sistemi' },
            { id: 'project3', name: 'EDS Projesi', description: 'Elektronik Denetleme Sistemi' }
        ];
        console.log('Demo projeler eklendi:', projects.value);
        return projects.value;
    };
    // Seçilen projeyi ayarla
    const setCurrentProject = async (projectId) => {
        loading.value = true;
        error.value = null;
        try {
            if (!projectId) {
                activeProjectId.value = null;
                currentProject.value = null;
                localStorage.removeItem('currentProjectId');
                return true;
            }
            // Projeyi varolan projeler içinden bul
            let projectToSet;
            if (projects.value.length > 0) {
                projectToSet = projects.value.find(p => p.id === projectId);
            }
            if (!projectToSet && projectId) {
                // Projeyi Firebase'den getir
                const projectRef = doc(db, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);
                if (projectSnap.exists()) {
                    const data = projectSnap.data();
                    projectToSet = {
                        ...data,
                        id: projectSnap.id,
                        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                    };
                }
            }
            // Projeyi ayarla ve local storage'a kaydet
            if (projectToSet) {
                currentProject.value = projectToSet;
                activeProjectId.value = projectId;
                localStorage.setItem('currentProjectId', projectId);
                return true;
            }
            else {
                throw new Error('Proje bulunamadı');
            }
        }
        catch (err) {
            error.value = err.message || 'Proje seçilirken bir hata oluştu';
            console.error('Proje seçilirken hata:', err);
            return false;
        }
        finally {
            loading.value = false;
        }
    };
    // Daha önce seçilen projeyi kontrol et ve yükle
    const loadSavedProject = async () => {
        const savedProjectId = localStorage.getItem('currentProjectId');
        if (savedProjectId) {
            activeProjectId.value = savedProjectId;
            try {
                await setCurrentProject(savedProjectId);
                return true;
            }
            catch {
                localStorage.removeItem('currentProjectId');
                activeProjectId.value = null;
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
        activeProjectId,
        loading,
        error,
        showProjectSelectorModal,
        fetchProjects,
        setCurrentProject,
        loadSavedProject,
        openProjectSelectorModal,
        closeProjectSelectorModal,
        addDefaultProjects
    };
});
//# sourceMappingURL=project-store.js.map