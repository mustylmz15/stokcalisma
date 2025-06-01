<template>
  <div class="panel">
    <!-- Header -->
    <div class="panel-header">
      <h5 class="text-lg font-semibold">{{ $t('warehouse_stocks') }}</h5>
      
      <!-- Warehouse Selection -->
      <div class="flex gap-4 items-center">
        <select 
          v-model="selectedWarehouse" 
          class="form-select w-64"
          @change="onWarehouseChange"
        >
          <option value="">{{ $t('select_warehouse') }}</option>
          <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </option>
        </select>
        
        <button
          @click="openAddMovementModal"
          class="btn btn-primary"
          :disabled="!selectedWarehouse"
        >
          <IconPlus class="w-4 h-4 mr-2" />
          {{ $t('add_movement') }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="selectedWarehouse && stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stats-card bg-blue-500">
        <div class="stats-content">
          <div class="stats-number">{{ stats.totalProducts }}</div>
          <div class="stats-label">{{ $t('total_products') }}</div>
        </div>
        <IconBox class="stats-icon" />
      </div>
      
      <div class="stats-card bg-green-500">
        <div class="stats-content">
          <div class="stats-number">{{ formatCurrency(stats.totalValue) }}</div>
          <div class="stats-label">{{ $t('total_value') }}</div>
        </div>
        <IconBox class="stats-icon" />
      </div>
      
      <div class="stats-card bg-orange-500">
        <div class="stats-content">
          <div class="stats-number">{{ stats.lowStockItems }}</div>
          <div class="stats-label">{{ $t('low_stock_items') }}</div>
        </div>
        <IconInfoTriangle class="stats-icon" />
      </div>
      
      <div class="stats-card bg-red-500">
        <div class="stats-content">
          <div class="stats-number">{{ stats.outOfStockItems }}</div>
          <div class="stats-label">{{ $t('out_of_stock_items') }}</div>
        </div>
        <IconInfoTriangle class="stats-icon" />
      </div>
    </div>

    <!-- Content -->
    <div class="panel-body">
      <div v-if="loading" class="text-center py-8">
        <div class="loading-spinner"></div>
        <p class="mt-2">Yükleniyor...</p>
      </div>
      
      <div v-else-if="!selectedWarehouse" class="text-center py-8 text-gray-500">
        <IconBox class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{{ $t('please_select_warehouse') }}</p>
      </div>
      
      <div v-else-if="stocks.length === 0" class="text-center py-8 text-gray-500">
        <IconBox class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Bu depoda stok bulunmamaktadır</p>
      </div>
      
      <div v-else>
        <!-- Stocks Table -->
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Miktar</th>
                <th>Son Güncelleme</th>
              </tr>
            </thead>
            <tbody>              <tr v-for="stock in stocks" :key="stock.id">
                <td class="font-medium">{{ stock.product_name || 'N/A' }}</td>
                <td>{{ stock.product_sku || 'N/A' }}</td>
                <td>
                  <span class="badge badge-primary">{{ stock.product?.category || 'N/A' }}</span>
                </td>
                <td>
                  <span class="quantity-badge">{{ stock.quantity || 0 }}</span>
                </td>
                <td class="text-sm text-gray-500">
                  {{ formatDate(stock.updated_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Stock Movement Modal -->
    <StockMovementModal 
      v-model="showMovementModal"
      :warehouse-id="selectedWarehouse"
      @success="onMovementSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStocksByWarehouse, getStockStats } from '@/services/warehouseStocksService'
import { supabase } from '@/supabase'
import StockMovementModal from '@/components/warehouse/StockMovementModal.vue'
import IconBox from '@/components/icon/icon-box.vue'
import IconInfoTriangle from '@/components/icon/icon-info-triangle.vue'
import IconPlus from '@/components/icon/icon-plus.vue'

const { t } = useI18n()

// State
const selectedWarehouse = ref('')
const warehouses = ref([])
const stocks = ref([])
const stats = ref(null)
const loading = ref(false)
const showMovementModal = ref(false)

// Load warehouses on mount
onMounted(async () => {
  await loadWarehouses()
})

// Watch warehouse selection
watch(selectedWarehouse, async (newWarehouseId) => {
  if (newWarehouseId) {
    await loadStocks()
    await loadStats()
  } else {
    stocks.value = []
    stats.value = null
  }
})

const loadWarehouses = async () => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id, name')
      .order('name')

    if (error) throw error
    warehouses.value = data || []
  } catch (error) {
    console.error('Error loading warehouses:', error)
  }
}

const loadStocks = async () => {
  if (!selectedWarehouse.value) return
  
  try {
    loading.value = true
    console.log('Loading stocks for warehouse:', selectedWarehouse.value)
    const data = await getStocksByWarehouse(selectedWarehouse.value)
    stocks.value = data || []
    console.log('Stocks loaded:', stocks.value.length, 'items')
  } catch (error) {
    console.error('Error loading stocks:', error)
    stocks.value = []
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  if (!selectedWarehouse.value) return
  
  try {
    const data = await getStockStats(selectedWarehouse.value)
    stats.value = data
  } catch (error) {
    console.error('Error loading stats:', error)
    stats.value = null
  }
}

const onWarehouseChange = () => {
  // Watch already handles this
}

const openAddMovementModal = () => {
  showMovementModal.value = true
}

const onMovementSuccess = () => {
  console.log('onMovementSuccess called - reloading data...')
  // Reload stocks and stats after successful movement
  loadStocks()
  loadStats()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR')
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}
</script>

<style scoped>
.panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-body {
  padding: 1.5rem;
}

.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.stats-card {
  border-radius: 8px;
  padding: 1.5rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.stats-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.stats-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.7;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.table th {
  font-weight: 600;
  background: #f9fafb;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-primary {
  background: #dbeafe;
  color: #1e40af;
}

.quantity-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 4px;
  font-weight: 500;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .panel {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .panel-header {
    border-bottom-color: #374151;
  }
  
  .form-select {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .table th {
    background: #374151;
    color: #f9fafb;
  }
  
  .table td {
    border-bottom-color: #374151;
  }
  
  .table tbody tr:hover {
    background: #374151;
  }
}
</style>