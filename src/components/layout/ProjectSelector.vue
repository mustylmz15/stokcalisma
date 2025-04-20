<template>
    <div class="project-selector">
        <div class="dropdown" :class="{ 'show': isOpen }">
            <a 
                href="javascript:;" 
                class="btn btn-primary dropdown-toggle d-flex align-items-center"
                @click="toggleDropdown"
            >
                <span class="material-icons-outlined text-white me-2">folder</span>
                <span v-if="currentProject">{{ currentProject.name }}</span>
                <span v-else>Proje Seçin</span>
            </a>
            <ul class="dropdown-menu" :class="{ 'show': isOpen }">
                <li v-for="project in projects" :key="project.id">
                    <a 
                        href="javascript:;" 
                        class="dropdown-item" 
                        :class="{ 'active': project.id === currentProject?.id }"
                        @click="selectProject(project)"
                    >
                        {{ project.name }}
                    </a>
                </li>
                <li v-if="projects.length === 0">
                    <span class="dropdown-item disabled">Proje bulunamadı</span>
                </li>
                <li>
                    <hr class="dropdown-divider" />
                </li>
                <li v-if="isAdmin">
                    <router-link to="/projeler" class="dropdown-item">
                        <span class="material-icons-outlined me-2">add</span> 
                        Proje Yönetimi
                    </router-link>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProjectStore } from '@/stores/projects';
import { useAuthStore } from '@/stores/auth-store';

const projectStore = useProjectStore();
const authStore = useAuthStore();
const isOpen = ref(false);

// Projeleri ve mevcut projeyi almak için computed değerleri
const projects = computed(() => projectStore.projects);
const currentProject = computed(() => projectStore.activeProject);
const isAdmin = computed(() => authStore.isAdmin || authStore.isProjectAdmin);

// Dropdown'ı aç/kapa
const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

// Proje seç
const selectProject = (project) => {
    authStore.setActiveProject(project.id);
    isOpen.value = false;
};

// Sayfa dışı tıklamalarda dropdown'ı kapatma
const closeDropdown = (event) => {
    const dropdown = document.querySelector('.project-selector');
    if (dropdown && !dropdown.contains(event.target)) {
        isOpen.value = false;
    }
};

// Bileşen yüklendiğinde event listener ekle
onMounted(() => {
    document.addEventListener('click', closeDropdown);
    
    // Projeleri yükle
    if (!projectStore.isInitialized) {
        projectStore.initializeStore();
    }
});

// Bileşen kaldırıldığında event listener'ı temizle
const onBeforeUnmount = () => {
    document.removeEventListener('click', closeDropdown);
};
</script>

<style scoped>
.project-selector {
    position: relative;
    z-index: 10;
    margin-right: 15px;
}

.dropdown-menu {
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
}

.dropdown-item.active {
    background-color: var(--primary);
    color: white;
}
</style>