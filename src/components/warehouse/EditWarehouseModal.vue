<template>
    <div 
        v-if="show" 
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="closeModal"
    >
        <div class="fixed inset-0 bg-black/50"></div>
        <div class="relative bg-white dark:bg-dark rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-white-light dark:border-dark/20">
                <h3 class="text-xl font-semibold text-primary">Depo Düzenle</h3>
                <button 
                    @click="closeModal"
                    class="text-white-dark hover:text-primary transition-colors"
                >
                    <Icon icon="x" class="w-6 h-6" />
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <form @submit.prevent="updateWarehouse" class="space-y-6" v-if="warehouse">
                    <!-- Depo Türü Gösterimi -->
                    <div class="bg-gray-50 dark:bg-dark/20 rounded-lg p-4">
                        <div class="flex items-center gap-3">
                            <Icon 
                                :icon="warehouse.warehouse_type === 'MAIN' ? 'warehouse' : 'project-warehouse'" 
                                :class="warehouse.warehouse_type === 'MAIN' ? 'text-blue-500' : 'text-green-500'"
                                class="w-6 h-6"
                            />
                            <div>
                                <div class="font-medium">
                                    {{ warehouse.warehouse_type === 'MAIN' ? 'Ana Depo' : 'Proje Deposu' }}
                                </div>
                                <div class="text-sm text-white-dark">
                                    Depo türü değiştirilemez
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ana Depo Bilgisi (Proje depoları için) -->
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
                    </div>                    <!-- Proje Seçimi -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Proje
                        </label>
                        <div v-if="warehouse.warehouse_type === 'MAIN'" class="text-sm text-white-dark bg-gray-50 dark:bg-dark/20 rounded-lg p-3">
                            Ana depolar projeye bağlı değildir
                        </div>
                        <div v-else class="space-y-2">
                            <select 
                                v-model="form.project_id" 
                                class="form-select"
                                :class="{ 'border-red-500': errors.project_id }"
                                @focus="loadAvailableProjects"
                            >
                                <option value="">Proje seçin...</option>
                                <option 
                                    v-for="project in availableProjects" 
                                    :key="project.id" 
                                    :value="project.id"
                                >
                                    {{ project.name }}
                                </option>
                            </select>
                            <div v-if="errors.project_id" class="text-red-500 text-sm">
                                {{ errors.project_id }}
                            </div>
                            <div v-if="!availableProjects.length && !loadingProjects" class="text-xs text-white-dark">
                                Henüz proje tanımlanmamış
                            </div>
                            <div v-if="loadingProjects" class="text-xs text-white-dark">
                                Projeler yükleniyor...
                            </div>
                        </div>
                    </div>

                    <!-- Depo Adı -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Depo Adı <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            v-model="form.name" 
                            class="form-input"
                            :class="{ 'border-red-500': errors.name }"
                            placeholder="Depo adını girin"
                            maxlength="100"
                        >
                        <div v-if="errors.name" class="text-red-500 text-sm">
                            {{ errors.name }}
                        </div>
                    </div>

                    <!-- Depo Kodu -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Depo Kodu <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            v-model="form.code" 
                            class="form-input font-mono"
                            :class="{ 'border-red-500': errors.code }"
                            placeholder="Depo kodunu girin"
                            maxlength="50"
                            @input="normalizeCode"
                        >
                        <div class="text-xs text-white-dark">
                            Sadece büyük harf, rakam ve alt çizgi kullanın
                        </div>
                        <div v-if="errors.code" class="text-red-500 text-sm">
                            {{ errors.code }}
                        </div>
                    </div>

                    <!-- Açıklama -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Açıklama
                        </label>
                        <textarea 
                            v-model="form.description" 
                            class="form-textarea"
                            rows="3"
                            placeholder="Depo hakkında açıklama..."
                            maxlength="500"
                        ></textarea>
                        <div class="text-xs text-white-dark text-right">
                            {{ form.description?.length || 0 }}/500
                        </div>
                    </div>

                    <!-- Konum Bilgileri -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white-dark">
                                Şehir
                            </label>
                            <input 
                                type="text" 
                                v-model="form.city" 
                                class="form-input"
                                placeholder="Şehir adı"
                                maxlength="50"
                            >
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white-dark">
                                Ülke
                            </label>
                            <input 
                                type="text" 
                                v-model="form.country" 
                                class="form-input"
                                placeholder="Ülke adı"
                                maxlength="50"
                            >
                        </div>
                    </div>

                    <!-- Adres -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Adres
                        </label>
                        <textarea 
                            v-model="form.address" 
                            class="form-textarea"
                            rows="2"
                            placeholder="Detaylı adres bilgisi..."
                            maxlength="200"
                        ></textarea>
                    </div>

                    <!-- Durum -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Depo Durumu
                        </label>
                        <div class="flex items-center gap-4">
                            <label class="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    :value="true" 
                                    v-model="form.is_active"
                                    class="form-radio text-success"
                                >
                                <span class="ml-2 text-success">Aktif</span>
                            </label>
                            <label class="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    :value="false" 
                                    v-model="form.is_active"
                                    class="form-radio text-danger"
                                >
                                <span class="ml-2 text-danger">Pasif</span>
                            </label>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-white-light dark:border-dark/20">
                <button 
                    type="button" 
                    @click="closeModal"
                    class="btn btn-outline-danger"
                    :disabled="loading"
                >
                    İptal
                </button>
                <button 
                    @click="updateWarehouse"
                    class="btn btn-primary"
                    :disabled="loading || !isFormValid"
                >
                    <div v-if="loading" class="flex items-center gap-2">
                        <div class="animate-spin w-4 h-4 border-2 border-white border-l-transparent rounded-full"></div>
                        Güncelleniyor...
                    </div>
                    <div v-else class="flex items-center gap-2">
                        <Icon icon="check" class="w-4 h-4" />
                        Güncelle
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Icon from '@/components/icon/Icon.vue'
import warehouseService from '@/services/warehouseService'
import projectService from '@/services/projectService'
import type { UpdateWarehouseForm, Warehouse } from '@/services/warehouseService'
import type { Project } from '@/services/projectService'

interface Props {
    show: boolean
    warehouse: Warehouse | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'update:show': [value: boolean]
    updated: [warehouse: Warehouse]
}>()

const toast = useToast()

// State
const loading = ref(false)
const loadingProjects = ref(false)
const availableProjects = ref<Project[]>([])
const form = ref<UpdateWarehouseForm & { is_active: boolean; project_id?: string }>({
    name: '',
    code: '',
    description: '',
    address: '',
    city: '',
    country: '',
    is_active: true,
    project_id: ''
})

const errors = ref<Record<string, string>>({})

// Computed
const isFormValid = computed(() => {
    const requiredFields = ['name', 'code']
    return requiredFields.every(field => {
        const value = form.value[field as keyof typeof form.value]
        return value && value.toString().trim() !== ''
    })
})

// Methods
const closeModal = () => {
    emit('update:show', false)
    resetForm()
}

const resetForm = () => {
    form.value = {
        name: '',
        code: '',
        description: '',
        address: '',
        city: '',
        country: '',
        is_active: true,
        project_id: ''
    }
    errors.value = {}
    availableProjects.value = []
}

const loadWarehouseData = () => {
    if (!props.warehouse) return
    
    form.value = {
        name: props.warehouse.name || '',
        code: props.warehouse.code || '',
        description: props.warehouse.description || '',
        address: props.warehouse.address || '',
        city: props.warehouse.city || '',
        country: props.warehouse.country || '',
        is_active: props.warehouse.is_active,
        project_id: props.warehouse.project_id || ''
    }
    
    // Eğer depo bir projeye atanmışsa proje listesini yükle
    if (props.warehouse.warehouse_type !== 'MAIN') {
        loadAvailableProjects()
    }
}

const normalizeCode = () => {
    form.value.code = form.value.code
        ?.toUpperCase()
        .replace(/[^A-Z0-9_]/g, '')
        .substring(0, 50) || ''
}

const loadAvailableProjects = async () => {
    console.log('EditWarehouseModal: Loading available projects...')
    
    if (loadingProjects.value || availableProjects.value.length > 0) {
        console.log('EditWarehouseModal: Projects already loaded or loading')
        return
    }
    
    loadingProjects.value = true
      try {
        const projects = await projectService.getAllProjects()
        
        console.log('EditWarehouseModal: Projects loaded:', projects)
        
        if (projects && Array.isArray(projects)) {
            availableProjects.value = projects
            console.log('EditWarehouseModal: Available projects loaded:', availableProjects.value.length)
        } else {
            console.warn('EditWarehouseModal: Invalid projects response:', projects)
            availableProjects.value = []
        }
    } catch (error) {
        console.error('EditWarehouseModal: Error loading projects:', error)
        availableProjects.value = []
    } finally {
        loadingProjects.value = false
    }
}

const validateForm = (): boolean => {
    errors.value = {}
    
    // Depo adı kontrolü
    if (!form.value.name?.trim()) {
        errors.value.name = 'Depo adı gereklidir'
    } else if (form.value.name.length < 3) {
        errors.value.name = 'Depo adı en az 3 karakter olmalıdır'
    }
    
    // Depo kodu kontrolü
    if (!form.value.code?.trim()) {
        errors.value.code = 'Depo kodu gereklidir'
    } else if (form.value.code.length < 2) {
        errors.value.code = 'Depo kodu en az 2 karakter olmalıdır'
    } else if (!/^[A-Z0-9_]+$/.test(form.value.code)) {
        errors.value.code = 'Depo kodu sadece büyük harf, rakam ve alt çizgi içerebilir'
    }
    
    return Object.keys(errors.value).length === 0
}

const updateWarehouse = async () => {
    if (!props.warehouse || !validateForm()) {
        toast.error('Lütfen tüm gerekli alanları doldurun')
        return
    }
    
    loading.value = true
    
    try {
        const updateData: UpdateWarehouseForm = {
            name: form.value.name?.trim(),
            code: form.value.code?.trim(),
            description: form.value.description?.trim() || undefined,
            address: form.value.address?.trim() || undefined,
            city: form.value.city?.trim() || undefined,
            country: form.value.country?.trim() || undefined,
            is_active: form.value.is_active
        }
        
        // Proje deposu ise ve proje seçilmişse project_id'yi ekle
        if (props.warehouse.warehouse_type !== 'MAIN' && form.value.project_id) {
            updateData.project_id = form.value.project_id
        }
        
        console.log('EditWarehouseModal: Updating warehouse with data:', updateData)
        
        const { data, error } = await warehouseService.updateWarehouse(props.warehouse.id, updateData)
        
        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                if (error.message.includes('code')) {
                    errors.value.code = 'Bu depo kodu zaten kullanılıyor'
                } else if (error.message.includes('name')) {
                    errors.value.name = 'Bu depo adı zaten kullanılıyor'
                } else {
                    toast.error('Bu depo bilgileri zaten mevcut')
                }
            } else {
                toast.error('Depo güncellenirken hata oluştu: ' + error.message)
            }
            return
        }
        
        if (data) {
            emit('updated', data)
            closeModal()
            toast.success('Depo başarıyla güncellendi')
        }
    } catch (error) {
        toast.error('Beklenmeyen bir hata oluştu')
        console.error('Depo güncelleme hatası:', error)
    } finally {
        loading.value = false
    }
}

// Watchers
watch(() => props.show, (newValue) => {
    if (newValue) {
        loadWarehouseData()
    } else {
        resetForm()
    }
})

watch(() => props.warehouse, () => {
    if (props.show) {
        loadWarehouseData()
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
