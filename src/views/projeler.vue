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
                                            <span class="material-icons-outlined text-sm">Düzenle</span>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-info" @click="openUserProjectModal(project)">
                                            <span class="material-icons-outlined text-sm">Kullanıcılar</span>
                                        </button>
                                        <!-- Depo yönetimi butonu -->
                                        <button type="button" class="btn btn-sm btn-outline-success" @click="openWarehouseProjectModal(project)">
                                            <span class="material-icons-outlined text-sm">Depolar</span>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger" @click="confirmDeleteProject(project)">
                                            <span class="material-icons-outlined text-sm">Sil</span>
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
                    <span class="material-icons-outlined text-6xl">Projeler</span>
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
                            <span class="material-icons-outlined">Kapat</span>
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
                            <span class="material-icons-outlined">Kapat</span>
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
                                                <span class="material-icons-outlined text-sm">Kullanıcıyı Sil</span>
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

        <!-- Depo-Proje İlişkisi Modal -->
        <Teleport to="body">
            <div v-if="showWarehouseProjectModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="panel w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-5">
                        <h5 class="font-semibold text-lg">Proje Depoları: {{ selectedProject?.name }}</h5>
                        <button type="button" class="text-gray-400 hover:text-gray-800" @click="showWarehouseProjectModal = false">
                            <span class="material-icons-outlined">Kapat</span>
                        </button>
                    </div>
                    
                    <!-- Depo Ekleme Formu -->
                    <div class="mb-5 border-b pb-5">
                        <h6 class="font-semibold mb-3">Depo Ekle</h6>
                        <form @submit.prevent="addWarehouseToProject">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="warehouseId" class="form-label">Depo</label>
                                    <select id="warehouseId" class="form-select" v-model="warehouseProjectForm.warehouseId" required>
                                        <option value="" disabled selected>Depo Seçin</option>
                                        <option v-for="warehouse in availableWarehouses" :key="warehouse.id" :value="warehouse.id">
                                            {{ warehouse.name }} ({{ warehouse.code }})
                                        </option>
                                    </select>
                                </div>
                                <div class="flex items-end">
                                    <button type="submit" class="btn btn-primary w-full" :disabled="loading">
                                        Ekle
                                        <span v-if="loading" class="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block align-middle ml-2"></span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Depo Listesi -->
                    <div v-if="projectWarehouses.length > 0">
                        <h6 class="font-semibold mb-3">Projeye Atanmış Depolar</h6>
                        <div class="table-responsive">
                            <table class="table-striped">
                                <thead>
                                    <tr>
                                        <th>Depo Kodu</th>
                                        <th>Depo Adı</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="warehouse in projectWarehouses" :key="warehouse.id">
                                        <td>{{ warehouse.code }}</td>
                                        <td>{{ warehouse.name }}</td>
                                        <td>
                                            <span :class="{
                                                'badge badge-outline-success': warehouse.isActive,
                                                'badge badge-outline-danger': !warehouse.isActive}">
                                                {{ warehouse.isActive ? 'Aktif' : 'Pasif' }}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                type="button" 
                                                class="btn btn-sm btn-outline-danger"
                                                @click="confirmRemoveWarehouseFromProject(warehouse)">
                                                <span class="material-icons-outlined text-sm">Kaldır</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div v-else class="text-center py-5">
                        <p>Bu projede henüz depo bulunmuyor.</p>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/projects';
import projectService from '@/services/projectService';

// Auth store'u başlat
const authStore = useAuthStore();
// Project store'u başlat
const projectStore = useProjectStore();

// Type tanımlamaları
interface ProjectInterface {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    managerEmail?: string;
    isActive?: boolean;
}

interface UserProjectInterface {
    userId: string;
    projectId: string;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UserInterface {
    id: string;
    email: string;
    name: string;
    projectRole?: string;
}

interface WarehouseInterface {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
}

// Durum değişkenleri
const showProjectModal = ref(false);
const showUserProjectModal = ref(false);
const showWarehouseProjectModal = ref(false);
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
const warehouseProjectForm = reactive({
    warehouseId: ''
});
const projectUsers = ref<UserInterface[]>([]);
const allUsers = ref<UserInterface[]>([]);
const projectWarehouses = ref<WarehouseInterface[]>([]);
const allWarehouses = ref<WarehouseInterface[]>([]);
const loading = ref(false);

// Projede olmayan kullanıcıları hesapla
const availableUsers = computed(() => {
    const projectUserIds = projectUsers.value.map(user => user.id);
    return allUsers.value.filter(user => !projectUserIds.includes(user.id));
});

// Projede olmayan depoları hesapla
const availableWarehouses = computed(() => {
    const projectWarehouseIds = projectWarehouses.value.map(warehouse => warehouse.id);
    return allWarehouses.value.filter(warehouse => !projectWarehouseIds.includes(warehouse.id));
});

// Sayfa yüklendiğinde
onMounted(async () => {
    try {
        // Proje store'u başlat
        if (!projectStore.isInitialized) {
            await projectStore.initializeStore();
            console.log('Project store başarıyla başlatıldı');
        }
        
        // Tüm kullanıcıları getir
        await loadAllUsers();
        
        // Tüm depoları getir
        await loadAllWarehouses();
    } catch (error) {
        console.error('Sayfa yüklenirken hata:', error);
        showNotification('Veriler yüklenirken hata oluştu', 'error');
    }
});

// Tüm kullanıcıları yükle
async function loadAllUsers() {
    try {
        allUsers.value = await authStore.getAllUsers();
        console.log(`${allUsers.value.length} kullanıcı yüklendi`);
    } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        showNotification('Kullanıcılar yüklenirken hata oluştu', 'error');
    }
}

// Tüm depoları yükle
async function loadAllWarehouses() {
    try {
        allWarehouses.value = await projectService.getAllWarehouses();
        console.log(`${allWarehouses.value.length} depo yüklendi`);
    } catch (error) {
        console.error('Depolar yüklenirken hata:', error);
        showNotification('Depolar yüklenirken hata oluştu', 'error');
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
            await projectStore.addProject({
                name: formData.name,
                description: formData.description,
                managerEmail: formData.managerEmail,
                isActive: formData.isActive
            });
            showNotification('Proje başarıyla oluşturuldu', 'success');
        } else {
            // Projeyi güncelle
            await projectStore.updateProject(formData.id, {
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
        await projectStore.deleteProject(projectId);
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
        // Projedeki kullanıcıları getir
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
        
        console.log(`${projectUsers.value.length} kullanıcı projede bulunuyor`);
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
        await projectStore.addUserToProject(userProjectForm.userId, selectedProject.value.id, userProjectForm.role);
        
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
        await projectStore.updateUserProjectRole(userId, selectedProject.value.id, newRole);
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
        await projectStore.removeUserFromProject(userId, selectedProject.value.id);
        
        // Kullanıcı listesini yenile
        await loadProjectUsers(selectedProject.value.id);
        
        showNotification('Kullanıcı projeden çıkarıldı', 'success');
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
    }
}

// Depo-Proje İlişkisi modalını aç
async function openWarehouseProjectModal(project: ProjectInterface) {
    selectedProject.value = project;
    showWarehouseProjectModal.value = true;
    
    // Form değerlerini sıfırla
    warehouseProjectForm.warehouseId = '';
    
    // Projedeki depoları getir
    await loadProjectWarehouses(project.id);
}

// Projedeki depoları yükle
async function loadProjectWarehouses(projectId: string) {
    try {
        // Projedeki depoları getir
        const warehouseProjects = await projectService.getWarehousesByProjectId(projectId);
        
        // Her deponun detaylarını getir
        projectWarehouses.value = [];
        for (const warehouseProject of warehouseProjects) {
            const warehouseDetails = allWarehouses.value.find(w => w.id === warehouseProject.warehouseId);
            if (warehouseDetails) {
                projectWarehouses.value.push({
                    ...warehouseDetails,
                    isActive: warehouseProject.isActive
                });
            }
        }
        
        console.log(`${projectWarehouses.value.length} depo projede bulunuyor`);
    } catch (error) {
        console.error('Proje depoları yüklenirken hata:', error);
        showNotification('Depolar yüklenirken hata oluştu', 'error');
        projectWarehouses.value = [];
    }
}

// Depoyu projeye ekle
async function addWarehouseToProject() {
    if (!selectedProject.value || !warehouseProjectForm.warehouseId) return;
    
    try {
        await projectStore.addWarehouseToProject(warehouseProjectForm.warehouseId, selectedProject.value.id);
        
        // Depo listesini yenile
        await loadProjectWarehouses(selectedProject.value.id);
        
        // Formu temizle
        warehouseProjectForm.warehouseId = '';
        
        showNotification('Depo projeye eklendi', 'success');
    } catch (error: any) {
        showNotification(`Hata: ${error.message || 'İşlem başarısız'}`, 'error');
    }
}

// Depoyu projeden kaldırma onayı
function confirmRemoveWarehouseFromProject(warehouse: any) {
    if (confirm(`"${warehouse.name}" deposunu projeden çıkarmak istediğinize emin misiniz?`)) {
        removeWarehouseFromProject(warehouse.id);
    }
}

// Depoyu projeden kaldır
async function removeWarehouseFromProject(warehouseId: string) {
    if (!selectedProject.value) return;
    
    try {
        await projectStore.removeWarehouseFromProject(warehouseId, selectedProject.value.id);
        
        // Depo listesini yenile
        await loadProjectWarehouses(selectedProject.value.id);
        
        showNotification('Depo projeden çıkarıldı', 'success');
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