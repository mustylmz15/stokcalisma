// Firebase entegrasyonlu Project Store
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/firebase';
import { 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    where 
} from 'firebase/firestore';

interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Project[]>([]);
    const currentProject = ref<Project | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const showProjectSelectorModal = ref(false);

    // Kullanıcının erişebileceği tüm projeleri getir (Firebase Firestore'dan)
    const fetchProjects = async () => {
        loading.value = true;
        error.value = null;
        
        try {
            // Firestore'dan projeleri çekme
            const projectsCollection = collection(db, 'projects');
            const querySnapshot = await getDocs(projectsCollection);
            
            const projectsList: Project[] = [];
            querySnapshot.forEach((doc) => {
                const projectData = doc.data() as Project;
                projectsList.push({
                    id: doc.id,
                    name: projectData.name,
                    description: projectData.description,
                    createdAt: projectData.createdAt,
                    updatedAt: projectData.updatedAt,
                });
            });
            
            projects.value = projectsList;
            console.log('Firebase\'den projeler yüklendi:', projectsList);
            
            // Eğer proje yoksa, mock veriler kullanabiliriz
            if (projectsList.length === 0) {
                projects.value = [
                    { id: 'proje1', name: 'Proje 1', description: 'Test projesi 1' },
                    { id: 'proje2', name: 'Proje 2', description: 'Test projesi 2' },
                    { id: 'proje3', name: 'Proje 3', description: 'Test projesi 3' },
                ];
                console.log('Firebase\'de proje bulunamadı, mock veriler kullanılıyor');
            }
        } catch (err: any) {
            error.value = err.message || 'Projeler yüklenirken bir hata oluştu';
            console.error('Projeler yüklenirken hata:', err);
            
            // Hata durumunda mock veri kullan
            projects.value = [
                { id: 'proje1', name: 'Proje 1', description: 'Test projesi 1' },
                { id: 'proje2', name: 'Proje 2', description: 'Test projesi 2' },
                { id: 'proje3', name: 'Proje 3', description: 'Test projesi 3' },
            ];
            console.log('Hata nedeniyle mock veriler kullanılıyor');
        } finally {
            loading.value = false;
        }
    };

    // Seçilen projeyi ayarla
    const setCurrentProject = async (projectId: string) => {
        loading.value = true;
        error.value = null;
        
        try {
            // Öncelikle mevcut projelerden arama yap
            let projectToSet = projects.value.find(p => p.id === projectId);
            
            // Eğer projeler yüklenmemişse veya bulunamazsa, doğrudan Firestore'dan çek
            if (!projectToSet) {
                try {
                    const projectDoc = await getDoc(doc(db, 'projects', projectId));
                    if (projectDoc.exists()) {
                        const projectData = projectDoc.data() as Project;
                        projectToSet = {
                            id: projectDoc.id,
                            name: projectData.name,
                            description: projectData.description,
                            createdAt: projectData.createdAt,
                            updatedAt: projectData.updatedAt,
                        };
                    }
                } catch (err) {
                    console.error('Proje detayları getirilemedi:', err);
                }
            }
            
            // Eğer proje bulunduysa güncelle
            if (projectToSet) {
                currentProject.value = projectToSet;
            } else {
                console.warn(`${projectId} ID'li proje bulunamadı`);
                error.value = 'Proje bulunamadı';
                currentProject.value = null;
            }
        } catch (err: any) {
            error.value = err.message || 'Proje seçilirken bir hata oluştu';
            console.error('Proje seçilirken hata:', err);
        } finally {
            loading.value = false;
        }
    };

    // Proje seçim modalını aç/kapat
    const toggleProjectSelector = () => {
        showProjectSelectorModal.value = !showProjectSelectorModal.value;
    };

    return {
        projects,
        currentProject,
        loading,
        error,
        showProjectSelectorModal,
        fetchProjects,
        setCurrentProject,
        toggleProjectSelector
    };
});
