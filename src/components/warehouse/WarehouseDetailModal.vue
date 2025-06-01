<template>
    <div 
        v-if="show" 
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="closeModal"
    >
        <div class="fixed inset-0 bg-black/50"></div>
        <div class="relative bg-white dark:bg-dark rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-white-light dark:border-dark/20">
                <div class="flex items-center gap-3">
                    <Icon 
                        :icon="warehouse?.warehouse_type === 'MAIN' ? 'warehouse' : 'project-warehouse'" 
                        :class="warehouse?.warehouse_type === 'MAIN' ? 'text-blue-500' : 'text-green-500'"
                        class="w-8 h-8"
                    />
                    <div>
                        <h3 class="text-xl font-semibold text-primary">{{ warehouse?.name }}</h3>
                        <p class="text-sm text-white-dark">{{ warehouse?.code }}</p>
                    </div>
                </div>
                <button 
                    @click="closeModal"
                    class="text-white-dark hover:text-primary transition-colors"
                >
                    <Icon icon="x" class="w-6 h-6" />
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]" v-if="warehouse">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Sol Kolon: Temel Bilgiler -->
                    <div class="space-y-6">
                        <!-- Depo Bilgileri -->
                        <div class="panel">
                            <h4 class="text-lg font-semibold mb-4">Depo Bilgileri</h4>
                            <div class="space-y-4">
                                <!-- Depo Türü -->
                                <div class="flex items-center gap-3">
                                    <Icon 
                                        :icon="warehouse.warehouse_type === 'MAIN' ? 'warehouse' : 'project-warehouse'" 
                                        :class="warehouse.warehouse_type === 'MAIN' ? 'text-blue-500' : 'text-green-500'"
                                        class="w-5 h-5"
                                    />
                                    <div>
                                        <span class="text-sm text-white-dark">Tür:</span>
                                        <span 
                                            :class="warehouse.warehouse_type === 'MAIN' ? 'text-blue-600' : 'text-green-600'"
                                            class="ml-2 font-medium"
                                        >
                                            {{ warehouse.warehouse_type === 'MAIN' ? 'Ana Depo' : 'Proje Deposu' }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Durum -->
                                <div class="flex items-center gap-3">
                                    <Icon 
                                        :icon="warehouse.is_active ? 'check-circle' : 'x-circle'" 
                                        :class="warehouse.is_active ? 'text-green-500' : 'text-red-500'"
                                        class="w-5 h-5"
                                    />
                                    <div>
                                        <span class="text-sm text-white-dark">Durum:</span>
                                        <span 
                                            :class="warehouse.is_active ? 'text-green-600' : 'text-red-600'"
                                            class="ml-2 font-medium"
                                        >
                                            {{ warehouse.is_active ? 'Aktif' : 'Pasif' }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Açıklama -->
                                <div v-if="warehouse.description">
                                    <span class="text-sm text-white-dark">Açıklama:</span>
                                    <p class="mt-1 text-primary">{{ warehouse.description }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- İlişkiler -->
                        <div class="panel">
                            <h4 class="text-lg font-semibold mb-4">İlişkiler</h4>
                            <div class="space-y-4">
                                <!-- Ana Depo (Proje depoları için) -->
                                <div v-if="warehouse.parent_warehouse" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <div class="flex items-center gap-3">
                                        <Icon icon="hierarchy" class="w-5 h-5 text-blue-500" />
                                        <div>
                                            <div class="font-medium text-blue-800 dark:text-blue-400">Ana Depo</div>
                                            <div class="text-sm text-blue-700 dark:text-blue-300">
                                                {{ warehouse.parent_warehouse.name }} ({{ warehouse.parent_warehouse.code }})
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Proje Bilgisi -->
                                <div v-if="warehouse.project" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                    <div class="flex items-center gap-3">
                                        <Icon icon="project" class="w-5 h-5 text-green-500" />
                                        <div>
                                            <div class="font-medium text-green-800 dark:text-green-400">Proje</div>
                                            <div class="text-sm text-green-700 dark:text-green-300">
                                                {{ warehouse.project.name }}
                                            </div>
                                            <div v-if="warehouse.project.description" class="text-xs text-green-600 dark:text-green-400 mt-1">
                                                {{ warehouse.project.description }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Alt Depolar (Ana depolar için) -->
                                <div v-if="warehouse.sub_warehouses && warehouse.sub_warehouses.length > 0">
                                    <div class="flex items-center gap-2 mb-3">
                                        <Icon icon="sub-warehouses" class="w-5 h-5 text-purple-500" />
                                        <span class="font-medium text-purple-800 dark:text-purple-400">
                                            Alt Depolar ({{ warehouse.sub_warehouses.length }})
                                        </span>
                                    </div>
                                    <div class="space-y-2 max-h-32 overflow-y-auto">
                                        <div 
                                            v-for="subWarehouse in warehouse.sub_warehouses" 
                                            :key="subWarehouse.id"
                                            class="bg-purple-50 dark:bg-purple-900/20 rounded p-3"
                                        >
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <div class="font-medium text-purple-800 dark:text-purple-400">
                                                        {{ subWarehouse.name }}
                                                    </div>
                                                    <div class="text-sm text-purple-700 dark:text-purple-300">
                                                        {{ subWarehouse.code }}
                                                        {{ subWarehouse.project?.name ? ' - ' + subWarehouse.project.name : '' }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Konum Bilgileri -->
                        <div v-if="warehouse.address || warehouse.city || warehouse.country" class="panel">
                            <h4 class="text-lg font-semibold mb-4">Konum Bilgileri</h4>
                            <div class="space-y-3">
                                <div v-if="warehouse.address" class="flex items-start gap-3">
                                    <Icon icon="location" class="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <span class="text-sm text-white-dark">Adres:</span>
                                        <p class="text-primary">{{ warehouse.address }}</p>
                                    </div>
                                </div>
                                <div v-if="warehouse.city || warehouse.country" class="flex items-center gap-3">
                                    <Icon icon="map" class="w-5 h-5 text-gray-400" />
                                    <div>
                                        <span class="text-sm text-white-dark">Konum:</span>
                                        <span class="ml-2 text-primary">
                                            {{ warehouse.city }}{{ warehouse.country ? ', ' + warehouse.country : '' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sağ Kolon: Yöneticiler ve Tarih Bilgileri -->
                    <div class="space-y-6">
                        <!-- Yöneticiler -->
                        <div class="panel">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-semibold">Depo Yöneticileri</h4>
                                <button 
                                    v-if="canManage"
                                    @click="$emit('manage')"
                                    class="btn btn-sm btn-outline-primary"
                                >
                                    <Icon icon="users" class="w-4 h-4 mr-2" />
                                    Yönet
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div v-if="activeManagers.length === 0" class="text-center py-4">
                                    <Icon icon="users" class="w-12 h-12 mx-auto text-white-dark mb-2" />
                                    <p class="text-white-dark">Henüz yönetici atanmamış</p>
                                </div>
                                <div v-else>
                                    <div 
                                        v-for="manager in activeManagers" 
                                        :key="manager.id"
                                        class="bg-gray-50 dark:bg-dark/20 rounded-lg p-4"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Icon icon="user" class="w-5 h-5 text-primary" />
                                            </div>
                                            <div class="flex-1">
                                                <div class="font-medium text-primary">
                                                    {{ getManagerDisplayName(manager) }}
                                                </div>
                                                <div class="text-sm text-white-dark">
                                                    {{ manager.user?.email }}
                                                </div>
                                                <div class="text-xs text-white-dark mt-1">
                                                    Atanma: {{ formatDate(manager.assigned_at) }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tarih Bilgileri -->
                        <div class="panel">
                            <h4 class="text-lg font-semibold mb-4">Tarih Bilgileri</h4>
                            <div class="space-y-4">
                                <div class="flex items-center gap-3">
                                    <Icon icon="calendar-plus" class="w-5 h-5 text-green-500" />
                                    <div>
                                        <span class="text-sm text-white-dark">Oluşturulma:</span>
                                        <div class="text-primary font-medium">{{ formatDateTime(warehouse.created_at) }}</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <Icon icon="calendar-edit" class="w-5 h-5 text-blue-500" />
                                    <div>
                                        <span class="text-sm text-white-dark">Son Güncelleme:</span>
                                        <div class="text-primary font-medium">{{ formatDateTime(warehouse.updated_at) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- İstatistikler (Gelecekte eklenebilir) -->
                        <div class="panel">
                            <h4 class="text-lg font-semibold mb-4">İstatistikler</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div class="text-2xl font-bold text-blue-600">0</div>
                                    <div class="text-sm text-blue-800 dark:text-blue-400">Toplam Stok</div>
                                </div>
                                <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div class="text-2xl font-bold text-green-600">0</div>
                                    <div class="text-sm text-green-800 dark:text-green-400">Aktif Ürün</div>
                                </div>
                            </div>
                            <div class="text-xs text-white-dark text-center mt-2">
                                Stok modülü entegrasyonu sonrası güncellenecek
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between p-6 border-t border-white-light dark:border-dark/20">
                <div class="flex gap-3">
                    <button 
                        v-if="canManage"
                        @click="$emit('edit')"
                        class="btn btn-outline-warning"
                    >
                        <Icon icon="edit" class="w-4 h-4 mr-2" />
                        Düzenle
                    </button>
                    <button 
                        v-if="canManage"
                        @click="$emit('manage')"
                        class="btn btn-outline-info"
                    >
                        <Icon icon="users" class="w-4 h-4 mr-2" />
                        Yöneticileri Düzenle
                    </button>
                </div>
                <button 
                    @click="closeModal"
                    class="btn btn-primary"
                >
                    Kapat
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icon/Icon.vue'
import type { Warehouse } from '@/services/warehouseService'

interface Props {
    show: boolean
    warehouse: Warehouse | null
    canManage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    canManage: false
})

const emit = defineEmits<{
    'update:show': [value: boolean]
    edit: []
    manage: []
}>()

// Computed
const activeManagers = computed(() => {
    return props.warehouse?.managers?.filter(m => m.is_active) || []
})

// Methods
const closeModal = () => {
    emit('update:show', false)
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getManagerDisplayName = (manager: any) => {
    if (manager.user?.profiles?.[0]) {
        const profile = manager.user.profiles[0]
        if (profile.first_name || profile.last_name) {
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
    }
    return manager.user?.email || 'Bilinmeyen Kullanıcı'
}
</script>
