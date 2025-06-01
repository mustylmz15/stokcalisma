<template>
    <div 
        class="panel bg-gradient-to-br from-white to-gray-50 dark:from-dark dark:to-dark/50 hover:shadow-lg transition-all duration-300 border-l-4"
        :class="warehouseTypeClasses"
    >
        <!-- Depo Başlığı -->
        <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <Icon 
                        :icon="warehouseIcon" 
                        :class="warehouseIconClasses"
                        class="w-5 h-5"
                    />
                    <h3 class="font-semibold text-lg text-primary line-clamp-1">
                        {{ warehouse.name }}
                    </h3>
                </div>
                <div class="flex items-center gap-2 text-sm text-white-dark">
                    <Icon icon="code" class="w-4 h-4" />
                    <span class="font-mono">{{ warehouse.code }}</span>
                </div>
            </div>
            
            <!-- Durum Badge -->
            <div class="flex flex-col items-end gap-2">
                <span 
                    :class="statusBadgeClasses"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                >
                    {{ warehouse.is_active ? 'Aktif' : 'Pasif' }}
                </span>
                <span 
                    :class="typeBadgeClasses"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                >
                    {{ warehouseTypeLabel }}
                </span>
            </div>
        </div>

        <!-- Depo Bilgileri -->
        <div class="space-y-3 mb-4">
            <!-- Açıklama -->
            <div v-if="warehouse.description" class="text-sm text-white-dark line-clamp-2">
                {{ warehouse.description }}
            </div>

            <!-- Adres -->
            <div v-if="warehouse.address || warehouse.city" class="flex items-start gap-2 text-sm">
                <Icon icon="location" class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div class="text-white-dark">
                    <div v-if="warehouse.address">{{ warehouse.address }}</div>
                    <div v-if="warehouse.city">
                        {{ warehouse.city }}{{ warehouse.country ? ', ' + warehouse.country : '' }}
                    </div>
                </div>
            </div>

            <!-- Ana Depo Bilgisi (Proje depoları için) -->
            <div v-if="warehouse.parent_warehouse" class="flex items-center gap-2 text-sm">
                <Icon icon="hierarchy" class="w-4 h-4 text-blue-500" />
                <span class="text-white-dark">Ana Depo:</span>
                <span class="text-primary font-medium">{{ warehouse.parent_warehouse.name }}</span>
            </div>

            <!-- Proje Bilgisi -->
            <div v-if="warehouse.project && showProject !== false" class="flex items-center gap-2 text-sm">
                <Icon icon="project" class="w-4 h-4 text-green-500" />
                <span class="text-white-dark">Proje:</span>
                <span class="text-primary font-medium">{{ warehouse.project.name }}</span>
            </div>

            <!-- Alt Depolar (Ana depolar için) -->
            <div v-if="warehouse.sub_warehouses && warehouse.sub_warehouses.length > 0" class="flex items-center gap-2 text-sm">
                <Icon icon="sub-warehouses" class="w-4 h-4 text-purple-500" />
                <span class="text-white-dark">Alt Depolar:</span>
                <span class="text-primary font-medium">{{ warehouse.sub_warehouses.length }} adet</span>
            </div>

            <!-- Yöneticiler -->
            <div v-if="warehouse.managers && warehouse.managers.length > 0" class="space-y-2">
                <div class="flex items-center gap-2 text-sm">
                    <Icon icon="users" class="w-4 h-4 text-orange-500" />
                    <span class="text-white-dark">Yöneticiler:</span>
                </div>
                <div class="pl-6 space-y-1">
                    <div 
                        v-for="manager in activeManagers" 
                        :key="manager.id"
                        class="flex items-center gap-2 text-sm"
                    >
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span class="text-primary">
                            {{ getManagerDisplayName(manager) }}
                        </span>
                        <span v-if="isManager && manager.user_id === currentUserId" class="text-xs text-green-600 font-medium">
                            (Siz)
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tarih Bilgileri -->
        <div class="border-t border-white-light dark:border-dark/20 pt-3 mb-4">
            <div class="grid grid-cols-2 gap-4 text-xs text-white-dark">
                <div>
                    <span class="font-medium">Oluşturulma:</span>
                    <div>{{ formatDate(warehouse.created_at) }}</div>
                </div>
                <div>
                    <span class="font-medium">Güncelleme:</span>
                    <div>{{ formatDate(warehouse.updated_at) }}</div>
                </div>
            </div>
        </div>

        <!-- Aksiyon Butonları -->
        <div class="flex items-center justify-between pt-3 border-t border-white-light dark:border-dark/20">
            <div class="flex gap-2">
                <button
                    @click="$emit('view', warehouse)"
                    class="btn btn-outline-primary btn-sm"
                    title="Detayları Görüntüle"
                >
                    <Icon icon="eye" class="w-4 h-4" />
                </button>
                
                <button
                    v-if="canManage"
                    @click="$emit('edit', warehouse)"
                    class="btn btn-outline-warning btn-sm"
                    title="Düzenle"
                >
                    <Icon icon="edit" class="w-4 h-4" />
                </button>

                <button
                    v-if="canManage"
                    @click="$emit('manage', warehouse)"
                    class="btn btn-outline-info btn-sm"
                    title="Yöneticileri Düzenle"
                >
                    <Icon icon="users" class="w-4 h-4" />
                </button>
            </div>

            <div class="flex gap-2">
                <button
                    v-if="canManage && warehouse.warehouse_type === 'MAIN'"
                    @click="$emit('toggle-status', warehouse)"
                    :class="[
                        'btn btn-sm',
                        warehouse.is_active 
                            ? 'btn-outline-danger' 
                            : 'btn-outline-success'
                    ]"
                    :title="warehouse.is_active ? 'Depoyu Deaktive Et' : 'Depoyu Aktive Et'"
                >
                    <Icon 
                        :icon="warehouse.is_active ? 'pause' : 'play'" 
                        class="w-4 h-4" 
                    />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icon/Icon.vue'
import type { Warehouse } from '@/services/warehouseService'
import { useAuthStore } from '@/stores/auth-store'

interface Props {
    warehouse: Warehouse
    canManage?: boolean
    isManager?: boolean
    showProject?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    canManage: false,
    isManager: false,
    showProject: true
})

defineEmits<{
    view: [warehouse: Warehouse]
    edit: [warehouse: Warehouse]
    manage: [warehouse: Warehouse]
    'toggle-status': [warehouse: Warehouse]
}>()

const authStore = useAuthStore()

// Computed
const currentUserId = computed(() => authStore.userInfo?.id)

const warehouseIcon = computed(() => {
    return props.warehouse.warehouse_type === 'MAIN' ? 'warehouse' : 'project-warehouse'
})

const warehouseIconClasses = computed(() => {
    return props.warehouse.warehouse_type === 'MAIN' 
        ? 'text-blue-500' 
        : 'text-green-500'
})

const warehouseTypeLabel = computed(() => {
    return props.warehouse.warehouse_type === 'MAIN' ? 'Ana Depo' : 'Proje Deposu'
})

const warehouseTypeClasses = computed(() => {
    return props.warehouse.warehouse_type === 'MAIN'
        ? 'border-l-blue-500'
        : 'border-l-green-500'
})

const statusBadgeClasses = computed(() => {
    return props.warehouse.is_active
        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
        : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
})

const typeBadgeClasses = computed(() => {
    return props.warehouse.warehouse_type === 'MAIN'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
        : 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
})

const activeManagers = computed(() => {
    const managers = props.warehouse.managers || props.warehouse.warehouse_managers || []
    return managers.filter((m: any) => m.is_active) || []
})

// Methods
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const getManagerDisplayName = (manager: any) => {
    // Yeni format: profiles direkt olarak gelir
    if (manager.profiles) {
        const profile = manager.profiles
        if (profile.first_name || profile.last_name) {
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
        if (profile.email) {
            return profile.email
        }
    }
    
    // Eski format: user.profiles array
    if (manager.user?.profiles?.[0]) {
        const profile = manager.user.profiles[0]
        if (profile.first_name || profile.last_name) {
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
    }
    
    return manager.user?.email || manager.profiles?.email || 'Bilinmeyen Kullanıcı'
}
</script>

<style scoped>
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.panel:hover {
    transform: translateY(-2px);
}
</style>
