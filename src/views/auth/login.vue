<template>
    <div>
        <div class="panel">
            <div class="flex mb-5 justify-between">
                <div class="flex items-center">
                    <h5 class="font-semibold text-lg dark:text-white-light mr-2">Proje Yönetimi</h5>
                    <span v-if="projectStore.loading" class="animate-spin border-2 border-primary border-l-transparent rounded-full w-5 h-5 inline-block align-middle"></span>
                </div>
                <button type="button" class="btn btn-primary" @click="openProjectModal('add')">
                    <span class="material-icons-outlined" add></span> Yeni Proje
                </button>
            </div>

            <!-- Proje listesi -->
            <div v-if="projectStore.projects.length > 0">
                <div class="table-responsive">
                    <table class="table-striped">
                        <thead>
                            <tr>
                                <th>Proje Adı</th>
                                <th>Açıklama</th>
                                <th>Oluşturulma Tarihi</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="project in projectStore.projects" :key="project.id">
                                <td class="font-semibold">{{ project.name }}</td>
                                <td>{{ project.description || "-" }}</td>
                                <td>{{ formatDate(project.createdAt) }}</td>
                                <td>
                                    <span :class="{
                                        'badge badge-outline-success': project.isActive,
                                        'badge badge-outline-danger': !project.isActive}">
                                        {{ project.isActive ? 'Aktif' : 'Pasif' }}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <button type="button" class="btn btn-sm btn-outline-primary" @click="openProjectModal('edit', project)">
                                            <span class="material-icons-outlined text-sm">edit</span>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-info" @click="openUserProjectModal(project)">
                                            <span class="material-icons-outlined text-sm">people</span>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDeleteProject(project)">
                                            <span class="material-icons-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else class="text-center py-8">
                <div class="text-gray-400 mb-4">
                    <span class="material-icons-outlined text-6xl">folder_open</span>
                </div>
                <p>Henüz hiç proje oluşturulmamış.</p>
                <button type="button" class="btn btn-primary mt-4" @click="openProjectModal('add')">
                    <span class="material-icons-outlined">add</span> İlk Projeyi Oluştur
                </button>
            </div>
        </div>

        <!-- Proje Modal -->
        <Teleport to="body">
            <div v-if="showProjectModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="panel w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-5">
                        <h5 class="font-semibold text-lg">{{ modalMode === 'add' ? 'Yeni Proje Oluştur' : 'Projeyi Düzenle' }}</h5>
                        <button type="button" class="text-gray-400 hover:text-gray-800" @click="showProjectModal = false">
                            <span class="material-icons-outlined">close</span>
                        </button>
                    </div>
                    <form @submit.prevent="saveProject">
                        <div class="mb-5">
                            <label for="name" class="form-label">Proje Adı <span class="text-danger">*</span></label>
                            <input id="name" type="text" class="form-input" v-model="formData.name" placeholder="Proje Adı" required />
                        </div>
                        <div class="mb-5">
                            <label for="description" class="form-label">Açıklama</label>
                            <textarea id="description" class="form-textarea" v-model="formData.description" placeholder="Proje açıklaması"></textarea>
                        </div>
                        <div class="mb-5">
                            <label for="managerEmail" class="form-label">Proje Yöneticisi Email</label>
                            <input id="managerEmail" type="email" class="form-input" v-model="formData.managerEmail" placeholder="ornek@firma.com" />
                        </div>
                        <div class="mb-5">
                            <label class="inline-flex">
                                <input type="checkbox" class="form-checkbox" v-model="formData.isActive" />
                                <span>Aktif</span>
                            </label>
                        </div>
                        <div class="flex justify-end gap-4 mt-8">
                            <button type="button" class="btn btn-outline-danger" @click="showProjectModal = false">İptal</button>
                            <button type="submit" class="btn btn-primary" :disabled="projectStore.loading">
                                {{ modalMode === 'add' ? 'Oluştur' : 'Güncelle' }}
                                <span v-if="projectStore.loading" class="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block align-middle ml-2"></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>

        <!-- Kullanıcı-Proje İlişkisi Modal -->
        <Teleport to="body">
            <div v-if="showUserProjectModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="panel w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-5">
                        <h5 class="font-semibold text-lg">Proje Kullanıcıları: {{ selectedProject?.name }}</h5>
                        <button type="button" class="text-gray-400 hover:text-gray-800" @click="showUserProjectModal = false">
                            <span class="material-icons-outlined">close</span>
                        </button>
                    </div>
                    
                    <!-- Kullanıcı Ekleme Formu -->
                    <div class="mb-5 border-b pb-5">
                        <h6 class="font-semibold mb-3">Kullanıcı Ekle</h6>
                        <form @submit.prevent="addUserToProject">
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label for="userId" class="form-label">Kullanıcı</label>
                                    <select id="userId" class="form-select" v-model="userProjectForm.userId" required>
                                        <option value="" disabled selected>Kullanıcı Seçin</option>
                                        <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                                            {{ user.name }} ({{ user.email }})
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label for="role" class="form-label">Rol</label>
                                    <select id="role" class="form-select" v-model="userProjectForm.role" required>
                                        <option value="admin">Admin</option>
                                        <option value="proje_admin">Proje Admin</option>
                                        <option value="user">Normal Kullanıcı</option>
                                        <option value="observer">Gözlemci</option>
                                        <option value="depo_sorumlusu">Depo Sorumlusu</option>
                                    </select>
                                </div>
                                <div class="flex items-end">
                                    <button type="submit" class="btn btn-primary w-full" :disabled="projectStore.loading">
                                        Ekle
                                        <span v-if="projectStore.loading" class="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block align-middle ml-2"></span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Kullanıcı Listesi -->
                    <div v-if="projectUsers.length > 0">
                        <h6 class="font-semibold mb-3">Proje Kullanıcıları</h6>
                        <div class="table-responsive">
                            <table class="table-striped">
                                <thead>
                                    <tr>
                                        <th>Kullanıcı</th>
                                        <th>E-posta</th>
                                        <th>Rol</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="user in projectUsers" :key="user.id">
                                        <td>{{ user.name }}</td>
                                        <td>{{ user.email }}</td>
                                        <td>
                                            <select 
                                                class="form-select form-select-sm" 
                                                v-model="user.projectRole"
                                                @change="updateUserProjectRole(user.id, user.projectRole || 'user')">
                                                <option value="admin">Admin</option>
                                                <option value="proje_admin">Proje Admin</option>
                                                <option value="user">Normal Kullanıcı</option>
                                                <option value="observer">Gözlemci</option>
                                                <option value="depo_sorumlusu">Depo Sorumlusu</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button 
                                                type="button" 
                                                class="btn btn-sm btn-outline-danger"
                                                @click="confirmRemoveUserFromProject(user)"
                                                :disabled="user.id === authStore.userInfo?.id">
                                                <span class="material-icons-outlined text-sm">person_remove</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div v-else class="text-center py-5">
                        <p>Bu projede henüz kullanıcı bulunmuyor.</p>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth-store';

// Project interface tanımı eklendi
interface ProjectInterface {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    managerEmail?: string;
    isActive?: boolean;
}

// User interface tanımı
interface UserInterface {
    id: string;
    name: string;
    email: string;
    projectRole?: string;
}

// ProjectStore ve ProjectService için doğrudan import yapalım
let useProjectStore: any;
let projectService: any;
let projectStore = ref<any>({
    projects: [] as ProjectInterface[],
    loading: false,
    isInitialized: false,
    initializeStore: async () => {
        console.log('Mock initializeStore çalıştı');
        return true;
    },
    addProject: async (projectData: any) => {
        console.log('Mock addProject çağrıldı:', projectData);
        return { id: '1', name: projectData.name, ...projectData };
    },
    updateProject: async (id: string, updates: any) => {
        console.log('Mock updateProject çağrıldı:', id, updates);
        return true;
    },
    deleteProject: async (id: string) => {
        console.log('Mock deleteProject çağrıldı:', id);
        return true;
    },
    addUserToProject: async (userId: string, projectId: string, role: string) => {
        console.log('Mock addUserToProject çağrıldı:', { userId, projectId, role });
        return true;
    },
    updateUserProjectRole: async (userId: string, projectId: string, role: string) => {
        console.log('Mock updateUserProjectRole çağrıldı:', { userId, projectId, role });
        return true;
    },
    removeUserFromProject: async (userId: string, projectId: string) => {
        console.log('Mock removeUserFromProject çağrıldı:', { userId, projectId });
        return true;
    }
});

try {
    // Dinamik import ile modülleri yükle
    import('@/stores/projects')
        .then(projectStoreModule => {
            useProjectStore = projectStoreModule.useProjectStore;
            
            // Store'u başlat
            const store = useProjectStore();
            projectStore.value = store;
            
            // Store başlatıldıysa ve henüz initialize edilmediyse
            if (store && !store.isInitialized) {
                store.initializeStore().then(() => {
                    console.log('Project store başarıyla başlatıldı');
                });
            }
        })
        .catch(error => {
            console.error('Project store modülü yüklenemedi:', error);
        });
    
    import('@/services/projects/projectService')
        .then(serviceModule => {
            projectService = serviceModule.default;
        })
        .catch(error => {
            console.error('ProjectService modülü yüklenemedi:', error);
        });
} catch (error) {
    console.error('Modüller yüklenemedi, mock servisler kullanılacak', error);
}

const authStore = useAuthStore();

// Durum değişkenleri
const showProjectModal = ref(false);
const showUserProjectModal = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const selectedProject = ref<ProjectInterface | null>(null);
const formData = reactive({
    id: '',
    name: '',
    description: '',
    managerEmail: '',
    isActive: true
});
const userProjectForm = reactive({
    userId: '',
    role: 'user'
});
const projectUsers = ref<UserInterface[]>([]);
const allUsers = ref<UserInterface[]>([]);

// Projede olmayan kullanıcıları hesapla
const availableUsers = computed(() => {
    const projectUserIds = projectUsers.value.map(user => user.id);
    return allUsers.value.filter(user => !projectUserIds.includes(user.id));
});

// Sayfa yüklendiğinde
onMounted(async () => {
    // Gerçek store varsa başlat
    if (useProjectStore) {
        try {
            const store = useProjectStore();
            if (!store.isInitialized) {
                await store.initializeStore();
            }
        } catch (error) {
            console.error('Project store başlatılamadı:', error);
        }
    }
    
    // Tüm kullanıcıları getir
    loadAllUsers();
});

// Tüm kullanıcıları yükle
async function loadAllUsers() {
    try {
        allUsers.value = await authStore.getAllUsers();
    } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
    }
}

// Proje modalını aç
function openProjectModal(mode: 'add' | 'edit', project?: ProjectInterface) {
    modalMode.value = mode;
    
    if (mode === 'add') {
        // Yeni proje için formu temizle
        formData.id = '';
        formData.name = '';
        formData.description = '';
        formData.managerEmail = '';
        formData.isActive = true;
    } else if (mode === 'edit' && project) {
        // Mevcut proje bilgilerini forma doldur
        formData.id = project.id;
        formData.name = project.name;
        formData.description = project.description || '';
        formData.managerEmail = project.managerEmail || '';
        formData.isActive = project.isActive !== undefined ? project.isActive : true;
    }
    
    showProjectModal.value = true;
}

// Projeyi kaydet (ekle veya güncelle)
async function saveProject() {
    try {
        if (modalMode.value === 'add') {
            // Yeni proje ekle
            await projectStore.value.addProject({
                name: formData.name,
                description: formData.description,
                managerEmail: formData.managerEmail,
                isActive: formData.isActive
            });
            showNotification('Proje başarıyla oluşturuldu', 'success');
        } else {
            // Projeyi güncelle
            await projectStore.value.updateProject(formData.id, {
                name: formData.name,
                description: formData.description,
                managerEmail: formData.managerEmail,
                isActive: formData.isActive
            });
            showNotification('Proje başarıyla güncellendi', 'success');
        }
        
        showProjectModal.value = false;
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
    }
}

// Proje silme onayı
function confirmDeleteProject(project: ProjectInterface) {
    if (confirm(`"${project.name}" projesini silmek istediğinize emin misiniz?`)) {
        deleteProject(project.id);
    }
}

// Projeyi sil
async function deleteProject(projectId: string) {
    try {
        await projectStore.value.deleteProject(projectId);
        showNotification('Proje başarıyla silindi', 'success');
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
    }
}

// Kullanıcı-Proje İlişkisi modalını aç
async function openUserProjectModal(project: ProjectInterface) {
    selectedProject.value = project;
    showUserProjectModal.value = true;
    
    // Form değerlerini sıfırla
    userProjectForm.userId = '';
    userProjectForm.role = 'user';
    
    // Projedeki kullanıcıları getir
    await loadProjectUsers(project.id);
}

// Projedeki kullanıcıları yükle
async function loadProjectUsers(projectId: string) {
    try {
        // Projedeki kullanıcı-proje ilişkilerini getir
        if (projectService && typeof projectService.getUsersByProjectId === 'function') {
            const userProjects = await projectService.getUsersByProjectId(projectId);
            
            // Her kullanıcının detaylarını getir
            projectUsers.value = [];
            for (const userProject of userProjects) {
                const userDetails = allUsers.value.find(u => u.id === userProject.userId);
                if (userDetails) {
                    projectUsers.value.push({
                        ...userDetails,
                        projectRole: userProject.role
                    });
                }
            }
        } else {
            projectUsers.value = [];
            console.warn('projectService veya getUsersByProjectId metodu henüz hazır değil');
        }
    } catch (error) {
        console.error('Proje kullanıcıları yüklenirken hata:', error);
        showNotification('Kullanıcılar yüklenirken hata oluştu', 'error');
        projectUsers.value = [];
    }
}

// Kullanıcıyı projeye ekle
async function addUserToProject() {
    if (!selectedProject.value || !userProjectForm.userId) return;
    
    try {
        await projectStore.value.addUserToProject(userProjectForm.userId, selectedProject.value.id, userProjectForm.role);
        
        // Kullanıcı listesini yenile
        await loadProjectUsers(selectedProject.value.id);
        
        // Formu temizle
        userProjectForm.userId = '';
        
        showNotification('Kullanıcı projeye eklendi', 'success');
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
    }
}

// Kullanıcının proje rolünü güncelle
async function updateUserProjectRole(userId: string, newRole: string) {
    if (!selectedProject.value) return;
    
    try {
        await projectStore.value.updateUserProjectRole(userId, selectedProject.value.id, newRole);
        showNotification('Kullanıcı rolü güncellendi', 'success');
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
        // Hata durumunda kullanıcı listesini yenile
        await loadProjectUsers(selectedProject.value.id);
    }
}

// Kullanıcıyı projeden kaldırma onayı
function confirmRemoveUserFromProject(user: any) {
    if (user.id === authStore.userInfo?.id) {
        showNotification('Kendi kullanıcınızı projeden çıkaramazsınız', 'error');
        return;
    }
    
    if (confirm(`"${user.name}" kullanıcısını projeden çıkarmak istediğinize emin misiniz?`)) {
        removeUserFromProject(user.id);
    }
}

// Kullanıcıyı projeden kaldır
async function removeUserFromProject(userId: string) {
    if (!selectedProject.value) return;
    
    try {
        await projectStore.value.removeUserFromProject(userId, selectedProject.value.id);
        
        // Kullanıcı listesini yenile
        await loadProjectUsers(selectedProject.value.id);
        
        showNotification('Kullanıcı projeden çıkarıldı', 'success');
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
    }
}

// Tarih formatla
function formatDate(dateString: string) {
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (error) {
        console.error('Tarih formatlanırken hata:', error);
        return dateString;
    }
}

// Bildirimleri göster (Örnek, gerçekte bir bildirim kütüphanesi kullanın)
function showNotification(message: string, type: 'success' | 'error' = 'success') {
    alert(message);
}
</script>