<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="panel w-full max-w-lg">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold">{{ $t('add_movement') }}</h3>
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="closeModal">
            <IconX class="w-5 h-5" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <!-- Product Selection -->
            <div>
              <label class="form-label">Ürün</label>
              <select v-model="form.product_id" class="form-select" required>
                <option value="">Ürün seçiniz</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }} ({{ product.sku }})
                </option>
              </select>
            </div>

            <!-- Movement Type -->
            <div>
              <label class="form-label">Hareket Tipi</label>
              <select v-model="form.movement_type" class="form-select" required>
                <option value="in">Giriş</option>
                <option value="out">Çıkış</option>
                <option value="adjustment">Düzeltme</option>
              </select>
            </div>

            <!-- Quantity -->
            <div>
              <label class="form-label">Miktar</label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="1"
                step="0.01"
                class="form-input"
                required
              />
            </div>

            <!-- Description -->
            <div>
              <label class="form-label">Açıklama</label>
              <textarea
                v-model="form.notes"
                class="form-textarea"
                rows="3"
                placeholder="Hareket açıklaması..."
              ></textarea>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-2 justify-end mt-6">
            <button type="button" class="btn btn-outline-danger" @click="closeModal">
              İptal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <IconLoader v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { getAllProducts, createStockMovement } from '@/services/warehouseStocksService'
import IconX from '@/components/icon/icon-x.vue'
import IconLoader from '@/components/icon/icon-loader.vue'

const props = defineProps({
  modelValue: Boolean,
  warehouseId: String
})

const emit = defineEmits(['update:modelValue', 'success'])

const loading = ref(false)
const products = ref([])

const form = reactive({
  product_id: '',
  movement_type: 'in',
  quantity: 1,
  notes: ''
})

// Load products when component mounts
onMounted(async () => {
  await loadProducts()
})

// Watch for modal opening
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await loadProducts()
  }
})

const loadProducts = async () => {
  try {
    loading.value = true
    const data = await getAllProducts()
    products.value = data || []
    console.log('Products loaded:', products.value)
  } catch (error) {
    console.error('Error loading products:', error)
    products.value = []
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  form.product_id = ''
  form.movement_type = 'in'
  form.quantity = 1
  form.notes = ''
}

const handleSubmit = async () => {
  if (!props.warehouseId) {
    alert('Lütfen önce bir depo seçin')
    return
  }

  try {
    loading.value = true
      await createStockMovement({
      warehouse_id: props.warehouseId,
      product_id: form.product_id,
      movement_type: form.movement_type,
      quantity: form.quantity,
      notes: form.notes
    })

    console.log('Stock movement created successfully, emitting success event...')
    emit('success')
    closeModal()
  } catch (error) {
    console.error('Error creating stock movement:', error)
    alert('Stok hareketi oluşturulurken hata oluştu')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.panel {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  color: #111827;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-outline-danger {
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline-danger:hover:not(:disabled) {
  background-color: #f9fafb;
}
</style>