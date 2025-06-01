<template>
    <TransitionRoot appear :show="show" as="template">
        <Dialog as="div" @close="closeModal" class="relative z-50">
            <TransitionChild
                as="template"
                enter="duration-300 ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="duration-200 ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-black bg-opacity-25" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4 text-center">
                    <TransitionChild
                        as="template"
                        enter="duration-300 ease-out"
                        enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100"
                        leave="duration-200 ease-in"
                        leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95"
                    >
                        <DialogPanel
                            class="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-dark text-left align-middle shadow-xl transition-all p-6"
                        >
                            <DialogTitle
                                as="h3"
                                class="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4"
                            >
                                Depo Yöneticileri - {{ warehouse?.name }}
                            </DialogTitle>

                            <div class="space-y-6">
                                <!-- Mevcut Yöneticiler -->
                                <div>
                                    <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Mevcut Yöneticiler
                                    </h4>
                                    
                                    <div v-if="loading.managers" class="text-center py-4">
                                        <div class="animate-spin inline-block w-6 h-6 border-2 border-primary border-l-transparent rounded-full"></div>
                                        <p class="text-sm text-white-dark mt-2">Yöneticiler yükleniyor...</p>
                                    </div>

                                    <div v-else-if="currentManagers.length === 0" class="text-center py-6">
                                        <Icon icon="users" class="w-12 h-12 mx-auto text-white-dark mb-2" />
                                        <p class="text-white-dark">Bu depo için henüz yönetici atanmamış</p>
                                    </div>

                                    <div v-else class="space-y-2">                                    <div
                                        v-for="manager in currentManagers"
                                        :key="manager.user?.id || manager.id"
                                        class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                                    >
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Icon icon="user" class="w-4 h-4 text-primary" />
                                            </div>                                            <div>
                                                <p class="font-medium text-sm">{{ getDisplayName(manager) }}</p>
                                                <p class="text-xs text-white-dark">{{ getEmail(manager) }}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span class="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                                Aktif
                                            </span>
                                            <button
                                                @click="removeManager(manager.user?.id || manager.user_id)"
                                                :disabled="loading.removing === (manager.user?.id || manager.user_id)"
                                                class="btn btn-outline-danger btn-sm"
                                            >
                                                <Icon 
                                                    v-if="loading.removing === (manager.user?.id || manager.user_id)"
                                                    icon="loading" 
                                                    class="w-3 h-3 animate-spin" 
                                                />
                                                <Icon v-else icon="trash" class="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                </div>

                                <!-- Yeni Yönetici Ekle -->
                                <div>
                                    <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Yeni Yönetici Ekle
                                    </h4>
                                    
                                    <div class="space-y-4">
                                        <!-- Kullanıcı Arama -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Kullanıcı Ara
                                            </label>
                                            <div class="relative">
                                                <input
                                                    v-model="searchQuery"
                                                    @input="searchUsers"
                                                    type="text"
                                                    placeholder="Kullanıcı adı veya email ile ara..."
                                                    class="form-input pr-10"
                                                />
                                                <Icon 
                                                    icon="search" 
                                                    class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white-dark" 
                                                />
                                            </div>
                                        </div>

                                        <!-- Arama Sonuçları -->
                                        <div v-if="searchResults.length > 0" class="max-h-48 overflow-y-auto border border-white-light dark:border-dark rounded-lg">
                                            <div
                                                v-for="user in searchResults"
                                                :key="user.id"
                                                class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-white-light dark:border-dark last:border-b-0 cursor-pointer"
                                                @click="selectUser(user)"
                                            >
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <Icon icon="user" class="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p class="font-medium text-sm">{{ user.full_name }}</p>
                                                        <p class="text-xs text-white-dark">{{ user.email }}</p>
                                                        <div class="flex items-center space-x-2 mt-1">
                                                            <span
                                                                v-for="role in user.roles"
                                                                :key="role"
                                                                class="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                                            >
                                                                {{ role }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Icon icon="plus" class="w-4 h-4 text-primary" />
                                            </div>
                                        </div>

                                        <!-- Seçili Kullanıcı -->
                                        <div v-if="selectedUser" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <Icon icon="user" class="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p class="font-medium">{{ selectedUser.full_name }}</p>
                                                        <p class="text-sm text-white-dark">{{ selectedUser.email }}</p>
                                                        <div class="flex items-center space-x-2 mt-1">
                                                            <span
                                                                v-for="role in selectedUser.roles"
                                                                :key="role"
                                                                class="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                                            >
                                                                {{ role }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    @click="clearSelection"
                                                    class="btn btn-outline-secondary btn-sm"
                                                >
                                                    <Icon icon="times" class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <!-- Ekleme Butonu -->
                                        <div v-if="selectedUser">
                                            <button
                                                @click="addManager"
                                                :disabled="loading.adding"
                                                class="btn btn-primary w-full"
                                            >
                                                <Icon 
                                                    v-if="loading.adding"
                                                    icon="loading" 
                                                    class="w-4 h-4 mr-2 animate-spin" 
                                                />
                                                <Icon v-else icon="plus" class="w-4 h-4 mr-2" />
                                                Yönetici Olarak Ekle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-white-light dark:border-dark">
                                <button @click="closeModal" class="btn btn-outline-secondary">
                                    Kapat
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
} from '@headlessui/vue'
import { useToast } from 'vue-toastification'
import Icon from '@/components/icon/Icon.vue'
import warehouseService from '@/services/warehouseService'
import type { Warehouse } from '@/services/warehouseService'

interface WarehouseManager {
    id: string
    warehouse_id: string
    user_id: string
    assigned_at: string
    user?: {
        id: string
        email: string
        full_name: string
        roles?: string[]
    }
}

interface User {
    id: string
    email: string
    full_name: string
    roles?: string[]
}

interface Props {
    show: boolean
    warehouse: Warehouse | null
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'updated', warehouse: Warehouse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toast = useToast()

// State
const currentManagers = ref<WarehouseManager[]>([])
const searchQuery = ref('')
const searchResults = ref<User[]>([])
const selectedUser = ref<User | null>(null)

const loading = ref({
    managers: false,
    searching: false,
    adding: false,
    removing: null as string | null
})

// Computed
const show = computed({
    get: () => props.show,
    set: (value) => emit('update:show', value)
})

// Methods
const loadManagers = async () => {
    if (!props.warehouse?.id) return

    loading.value.managers = true
    try {
        const { data, error } = await warehouseService.getWarehouseManagers(props.warehouse.id)
        if (error) {
            toast.error('Yöneticiler yüklenirken hata oluştu: ' + error.message)
        } else {
            currentManagers.value = data || []
        }
    } finally {
        loading.value.managers = false
    }
}

const searchUsers = async () => {
    if (!searchQuery.value.trim() || searchQuery.value.length < 2) {
        searchResults.value = []
        return
    }

    loading.value.searching = true
    try {
        const { data, error } = await warehouseService.searchUsers(searchQuery.value.trim())
        if (error) {
            console.error('Kullanıcı arama hatası:', error)
            searchResults.value = []        } else {
            // Mevcut yöneticileri filtrele
            const managerIds = currentManagers.value.map(m => m.user?.id || m.user_id)
            searchResults.value = (data || []).filter(user => !managerIds.includes(user.id))
        }
    } finally {
        loading.value.searching = false
    }
}

const selectUser = (user: User) => {
    selectedUser.value = user
    searchQuery.value = ''
    searchResults.value = []
}

const clearSelection = () => {
    selectedUser.value = null
}

const addManager = async () => {
    if (!selectedUser.value || !props.warehouse?.id) return

    loading.value.adding = true
    try {
        const { error } = await warehouseService.addWarehouseManager(
            props.warehouse.id,
            selectedUser.value.id
        )
        
        if (error) {
            toast.error('Yönetici eklenirken hata oluştu: ' + error.message)
        } else {
            toast.success(`${selectedUser.value.full_name} depo yöneticisi olarak eklendi`)
            selectedUser.value = null
            await loadManagers()
            emit('updated', props.warehouse)
        }
    } finally {
        loading.value.adding = false
    }
}

const removeManager = async (userId: string) => {
    if (!props.warehouse?.id) return

    const manager = currentManagers.value.find(m => (m.user?.id || m.user_id) === userId)
    if (!manager) return

    const managerName = manager.user?.full_name || 'Bu kullanıcı'
    if (!confirm(`${managerName} kullanıcısını depo yöneticiliğinden çıkarmak istediğinizden emin misiniz?`)) {
        return
    }

    loading.value.removing = userId
    try {
        const { error } = await warehouseService.removeWarehouseManager(manager.id)
        
        if (error) {
            toast.error('Yönetici çıkarılırken hata oluştu: ' + error.message)
        } else {
            toast.success(`${managerName} depo yöneticiliğinden çıkarıldı`)
            await loadManagers()
            emit('updated', props.warehouse)
        }
    } finally {
        loading.value.removing = null
    }
}

const closeModal = () => {
    emit('update:show', false)
    // Reset state
    currentManagers.value = []
    searchQuery.value = ''
    searchResults.value = []
    selectedUser.value = null
}

// Helper fonksiyonları
const getDisplayName = (manager: any): string => {
    // Yeni format: profiles direkt olarak gelir
    if (manager.profiles) {
        const profile = manager.profiles
        if (profile.first_name || profile.last_name) {
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
    }
    
    // Eski format: user.profiles array
    if (manager.user?.profiles?.[0]) {
        const profile = manager.user.profiles[0]
        if (profile.first_name || profile.last_name) {
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
    }
    
    return manager.user?.full_name || 'Bilinmeyen Kullanıcı'
}

const getEmail = (manager: any): string => {
    return manager.profiles?.email || manager.user?.email || ''
}

// Watchers
watch(() => props.show, (newShow) => {
    if (newShow && props.warehouse) {
        loadManagers()
    }
})

watch(searchQuery, () => {
    if (searchQuery.value.length === 0) {
        searchResults.value = []
    }
})
</script>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
