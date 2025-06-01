<template>
    <div 
        v-if="show" 
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="closeModal"
    >
        <div class="fixed inset-0 bg-black/50"></div>
        <div class="relative bg-white dark:bg-dark rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-white-light dark:border-dark/20">
                <h3 class="text-xl font-semibold text-primary">Yeni Depo Oluştur</h3>
                <button 
                    @click="closeModal"
                    class="text-white-dark hover:text-primary transition-colors"
                >
                    <Icon icon="x" class="w-6 h-6" />
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <form @submit.prevent="createWarehouse" class="space-y-6">
                    <!-- Depo Türü Seçimi -->
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-white-dark">
                            Depo Türü <span class="text-red-500">*</span>
                        </label>
                        <div class="grid grid-cols-2 gap-4">
                            <label 
                                class="relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors"
                                :class="form.warehouse_type === 'MAIN' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-white-light dark:border-dark/20 hover:border-primary/50'"
                            >
                                <input 
                                    type="radio" 
                                    value="MAIN" 
                                    v-model="form.warehouse_type"
                                    class="sr-only"
                                    @change="onWarehouseTypeChange"
                                >
                                <div class="flex items-center">
                                    <Icon icon="warehouse" class="w-6 h-6 text-blue-500 mr-3" />
                                    <div>
                                        <div class="font-medium">Ana Depo</div>
                                        <div class="text-sm text-white-dark">Bağımsız ana depo</div>
                                    </div>
                                </div>
                            </label>
                            <label 
                                class="relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors"
                                :class="form.warehouse_type === 'PROJECT' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-white-light dark:border-dark/20 hover:border-primary/50'"
                            >
                                <input 
                                    type="radio" 
                                    value="PROJECT" 
                                    v-model="form.warehouse_type"
                                    class="sr-only"
                                    @change="onWarehouseTypeChange"
                                >
                                <div class="flex items-center">
                                    <Icon icon="project-warehouse" class="w-6 h-6 text-green-500 mr-3" />
                                    <div>
                                        <div class="font-medium">Proje Deposu</div>
                                        <div class="text-sm text-white-dark">Belirli bir projeye özel</div>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div v-if="errors.warehouse_type" class="text-red-500 text-sm">
                            {{ errors.warehouse_type }}
                        </div>
                    </div>

                    <!-- Ana Depo Seçimi (Proje deposu için) -->
                    <div v-if="form.warehouse_type === 'PROJECT'" class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Ana Depo <span class="text-red-500">*</span>
                        </label>
                        <select 
                            v-model="form.parent_id" 
                            class="form-select"
                            :class="{ 'border-red-500': errors.parent_id }"
                        >
                            <option value="">Ana depo seçin</option>
                            <option 
                                v-for="warehouse in mainWarehouses" 
                                :key="warehouse.id" 
                                :value="warehouse.id"
                            >
                                {{ warehouse.name }} ({{ warehouse.code }})
                            </option>
                        </select>
                        <div v-if="errors.parent_id" class="text-red-500 text-sm">
                            {{ errors.parent_id }}
                        </div>
                    </div>

                    <!-- Proje Seçimi (Proje deposu için) -->
                    <div v-if="form.warehouse_type === 'PROJECT'" class="space-y-2">
                        <label class="block text-sm font-medium text-white-dark">
                            Proje <span class="text-red-500">*</span>
                        </label>                        <select 
                            v-model="form.project_id" 
                            class="form-select"
                            :class="{ 'border-red-500': errors.project_id }"
                            @focus="() => console.log('[CreateWarehouseModal] Projects available:', availableProjects)"
                        >
                            <option value="">Proje seçin</option>
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
                            placeholder="Örn: 1. Bölge Ana Deposu"
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
                            placeholder="Örn: WH_001"
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
                                placeholder="Örn: İstanbul"
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
                                placeholder="Örn: Türkiye"
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

                    <!-- Otomatik Doldurma Önerisi -->
                    <div v-if="form.warehouse_type === 'PROJECT' && selectedParentWarehouse" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div class="flex items-start gap-3">
                            <Icon icon="info" class="w-5 h-5 text-blue-500 mt-0.5" />
                            <div class="text-sm">
                                <div class="font-medium text-blue-800 dark:text-blue-400 mb-1">
                                    Otomatik Doldurma Önerisi
                                </div>
                                <div class="text-blue-700 dark:text-blue-300 mb-3">
                                    Ana depo bilgileri kullanılarak konum bilgileri otomatik doldurulabilir.
                                </div>
                                <button 
                                    type="button" 
                                    @click="fillFromParentWarehouse"
                                    class="btn btn-sm btn-outline-primary"
                                >
                                    Ana Depo Bilgilerini Kullan
                                </button>
                            </div>
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
                    @click="createWarehouse"
                    class="btn btn-primary"
                    :disabled="loading || !isFormValid"
                >
                    <div v-if="loading" class="flex items-center gap-2">
                        <div class="animate-spin w-4 h-4 border-2 border-white border-l-transparent rounded-full"></div>
                        Oluşturuluyor...
                    </div>
                    <div v-else class="flex items-center gap-2">
                        <Icon icon="plus" class="w-4 h-4" />
                        Depo Oluştur
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
import type { CreateWarehouseForm, Warehouse } from '@/services/warehouseService'
import type { Project } from '@/services/projectService'; // Add this

interface Props {
    show: boolean
    mainWarehouses: Warehouse[]
    availableProjects: Project[] // Update type
}

const props = defineProps<Props>()

watch(() => props.availableProjects, (newVal) => {
    console.log('[CreateWarehouseModal] Received availableProjects prop:', newVal);
}, { immediate: true, deep: true });

const emit = defineEmits<{
    'update:show': [value: boolean]
    created: [warehouse: Warehouse]
}>()

const toast = useToast()

// State
const loading = ref(false)
const form = ref<CreateWarehouseForm>({
    name: '',
    code: '',
    description: '',
    address: '',
    city: '',
    country: '',
    warehouse_type: 'MAIN',
    parent_id: '',
    project_id: ''
})

const errors = ref<Record<string, string>>({})

// Computed
const selectedParentWarehouse = computed(() => {
    if (!form.value.parent_id) return null
    return props.mainWarehouses.find(w => w.id === form.value.parent_id)
})

const isFormValid = computed(() => {
    const requiredFields = ['name', 'code', 'warehouse_type']
    
    if (form.value.warehouse_type === 'PROJECT') {
        requiredFields.push('parent_id', 'project_id')
    }
    
    return requiredFields.every(field => {
        const value = form.value[field as keyof CreateWarehouseForm]
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
        warehouse_type: 'MAIN',
        parent_id: '',
        project_id: ''
    }
    errors.value = {}
}

const normalizeCode = () => {
    form.value.code = form.value.code
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '')
        .substring(0, 50)
}

const onWarehouseTypeChange = () => {
    // Proje deposu seçildiğinde ana depo ve proje alanlarını temizle
    if (form.value.warehouse_type === 'MAIN') {
        form.value.parent_id = ''
        form.value.project_id = ''
    }
    
    // Hataları temizle
    delete errors.value.parent_id
    delete errors.value.project_id
}

const fillFromParentWarehouse = () => {
    if (!selectedParentWarehouse.value) return
    
    const parent = selectedParentWarehouse.value
    form.value.address = parent.address || ''
    form.value.city = parent.city || ''
    form.value.country = parent.country || ''
    
    toast.success('Ana depo bilgileri dolduruldu')
}

const validateForm = (): boolean => {
    errors.value = {}
    
    // Depo adı kontrolü
    if (!form.value.name.trim()) {
        errors.value.name = 'Depo adı gereklidir'
    } else if (form.value.name.length < 3) {
        errors.value.name = 'Depo adı en az 3 karakter olmalıdır'
    }
    
    // Depo kodu kontrolü
    if (!form.value.code.trim()) {
        errors.value.code = 'Depo kodu gereklidir'
    } else if (form.value.code.length < 2) {
        errors.value.code = 'Depo kodu en az 2 karakter olmalıdır'
    } else if (!/^[A-Z0-9_]+$/.test(form.value.code)) {
        errors.value.code = 'Depo kodu sadece büyük harf, rakam ve alt çizgi içerebilir'
    }
    
    // Depo türü kontrolü
    if (!form.value.warehouse_type) {
        errors.value.warehouse_type = 'Depo türü seçilmelidir'
    }
    
    // Proje deposu için ekstra kontroller
    if (form.value.warehouse_type === 'PROJECT') {
        if (!form.value.parent_id) {
            errors.value.parent_id = 'Ana depo seçilmelidir'
        }
        if (!form.value.project_id) {
            errors.value.project_id = 'Proje seçilmelidir'
        }
    }
    
    return Object.keys(errors.value).length === 0
}

const createWarehouse = async () => {
    if (!validateForm()) {
        toast.error('Lütfen tüm gerekli alanları doldurun')
        return
    }
    if (!isFormValid.value) {
        toast.error('Lütfen tüm zorunlu alanları doldurun.')
        return
    }
    
    loading.value = true
    
    try {
        // ADD THIS LOG
        console.log('[CreateWarehouseModal] Submitting form data:', JSON.parse(JSON.stringify(form.value)));

        const { data, error } = await warehouseService.createWarehouse({
            name: form.value.name.trim(),
            code: form.value.code.trim(),
            description: form.value.description?.trim() || undefined,
            address: form.value.address?.trim() || undefined,
            city: form.value.city?.trim() || undefined,
            country: form.value.country?.trim() || undefined,
            warehouse_type: form.value.warehouse_type,
            parent_id: form.value.parent_id || undefined,
            project_id: form.value.project_id || undefined
        })
        
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
                toast.error('Depo oluşturulurken hata oluştu: ' + error.message)
            }
            return
        }
        
        if (data) {
            emit('created', data)
            closeModal()
            toast.success('Depo başarıyla oluşturuldu')
        }
    } catch (error) {
        toast.error('Beklenmeyen bir hata oluştu')
        console.error('Depo oluşturma hatası:', error)
    } finally {
        loading.value = false
    }
}

// Watchers
watch(() => props.show, (newValue) => {
    if (!newValue) {
        resetForm()
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
