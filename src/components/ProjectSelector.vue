<template>
    <div class="dropdown">
        <div class="relative">
            <button type="button" class="flex items-center gap-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60" @click="toggleDropdown">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <path d="M2 17L12 22L22 17"></path>
                    <path d="M2 12L12 17L22 12"></path>
                    <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
                </svg>
                <span class="text-sm hidden sm:inline-block">{{ activeProject?.name || 'Proje Seç' }}</span>
            </button>

            <div v-show="isDropdownOpen" class="absolute z-50 mt-2 w-[250px] bg-white dark:bg-[#1b2e4b] shadow-md rounded-lg right-0">
                <div class="!py-0 text-dark dark:text-white-dark">
                    <div class="p-4 font-semibold border-b border-white-light dark:border-[#1b2e4b]">
                        Projelerim
                    </div>
                    <div v-if="isProjectsLoading" class="p-4 text-center">
                        <div class="animate-spin inline-block w-5 h-5 border-2 border-primary border-l-transparent rounded-full align-middle mr-2"></div>
                        Yükleniyor...
                    </div>
                    <div v-else-if="projects.length === 0" class="p-4 text-center">
                        Henüz bir projeniz bulunmuyor.
                    </div>
                    <ul v-else class="max-h-64 overflow-y-auto">
                        <li v-for="project in projects" :key="project.id">
                            <a href="javascript:;"
                                class="flex items-center px-4 py-3 hover:bg-white-light dark:hover:bg-[#1b2e4b]"
                                :class="{ 'bg-primary-light dark:bg-primary/20': activeProject?.id === project.id }"
                                @click="selectProject(project)">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h4 class="text-sm font-semibold" :class="{ 'text-primary': activeProject?.id === project.id }">{{ project.name }}</h4>
                                        <span v-if="activeProject?.id === project.id" class="bg-primary text-white text-xs rounded px-1 ml-2">Aktif</span>
                                    </div>
                                </div>
                            </a>
                        </li>
                    </ul>
                    <div class="border-t border-white-light dark:border-[#1b2e4b] p-4">
                        <button 
                            class="btn btn-outline-primary btn-sm w-full"
                            @click="navigateToProjects()"
                            :disabled="!canManageProjects">
                            Proje Yönetimi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useProjectStore } from '@/stores/projects';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory';
import { useRouter } from 'vue-router';
import { eventBus } from '@/composables/eventBus';

const projectStore = useProjectStore();
const authStore = useAuthStore();
const router = useRouter();

const isDropdownOpen = ref(false);
const isProjectsLoading = ref(true);

// Aktif proje bilgisi
const activeProject = computed(() => {
    return projectStore.activeProject;
});

// Kullanıcının erişimi olan projeler
const projects = computed(() => {
    return projectStore.userProjects;
});

// Kullanıcının proje yönetimi sayfasına erişim izni olup olmadığı
const canManageProjects = computed(() => {
    return authStore.isAdmin || authStore.isProjectAdmin;
});

// Toggle dropdown
const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
};

// Dropdown dışına tıklandığında kapanma
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown') && isDropdownOpen.value) {
        isDropdownOpen.value = false;
    }
};

// Component yüklendiğinde projeleri getir
onMounted(async () => {
    // Click outside listener ekleme
    document.addEventListener('click', handleClickOutside);
      if (!projectStore.isInitialized) {
        try {
            // Kullanıcı projelerini yüklerken isProjectsLoading değerini aktif et
            isProjectsLoading.value = true;
            
            // Sadece initializeStore çağırarak projeleri yükle
            // (loadUserProjects zaten initializeStore içinde çağrılıyor)
            await projectStore.initializeStore();
        } catch (error) {
            console.error('Projeler yüklenirken hata oluştu:', error);
        } finally {
            isProjectsLoading.value = false;
        }
    } else {
        isProjectsLoading.value = false;
    }
});

// Component unmount olduğunda listener'ları temizle
onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Proje seçme fonksiyonu
const selectProject = async (project) => {
    try {
        // Projeyi değiştirirken loading yap
        isProjectsLoading.value = true;
        
        await projectStore.setActiveProject(project.id);
        
        // Eğer proje sayısı 0 ise proje yönetim sayfasına git
        if (projects.value.length === 0) return navigateToProjects();
        
        // Envanter bilgilerini projeye göre filtrele
        const inventoryStore = useInventoryStore();
        await inventoryStore.setActiveProjectId(project.id);
        
        // Proje değişti eventi yayınla
        eventBus.emit('project-changed', project.id);
        
        isDropdownOpen.value = false;
    } catch (error) {
        isProjectsLoading.value = false;
        
        console.error('Proje değiştirirken hata:', error);
    }
};

// Proje yönetim sayfasına gitme fonksiyonu
const navigateToProjects = () => {
    isDropdownOpen.value = false;
    router.push('/projeler');
};
</script>

<style scoped>
.dropdown {
    position: relative;
    display: inline-block;
}
</style>