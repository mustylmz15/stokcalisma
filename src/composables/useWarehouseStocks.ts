import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { warehouseStocksService, type StockItem, type StockStats, type StockFilters } from '@/services/warehouseStocksService';

export function useWarehouseStocks() {
  const route = useRoute();
  
  // State
  const stocks = ref<StockItem[]>([]);
  const stats = ref<StockStats>({
    total_products: 0,
    stocked_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_value: 0
  });
  const categories = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Pagination
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Filters
  const filters = ref<StockFilters>({
    search: '',
    category: 'all',
    stock_status: 'all',
    page: 1,
    limit: 50
  });

  // Computed
  const warehouseId = computed(() => route.params.id as string);
  
  const hasStocks = computed(() => stocks.value.length > 0);
  
  const filteredStocksCount = computed(() => {
    if (!filters.value.search && filters.value.category === 'all' && filters.value.stock_status === 'all') {
      return stats.value.total_products;
    }
    return pagination.value.total;
  });

  // Helper function to get stock status
  const getStockStatus = (stock: StockItem) => {
    if (stock.current_quantity === 0) return 'out_of_stock';
    if (stock.current_quantity <= stock.minimum_level) return 'low_stock';
    return 'in_stock';
  };

  // Helper function to get stock status label
  const getStockStatusLabel = (status: string) => {
    const labels = {
      'in_stock': 'Stokta',
      'low_stock': 'Düşük Stok',
      'out_of_stock': 'Stok Yok'
    };
    return labels[status as keyof typeof labels] || 'Bilinmiyor';
  };

  // Helper function to get stock status color
  const getStockStatusColor = (status: string) => {
    const colors = {
      'in_stock': 'success',
      'low_stock': 'warning',
      'out_of_stock': 'danger'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  // Load warehouse stocks
  const loadStocks = async (resetPagination = false) => {
    if (!warehouseId.value) return;

    try {
      loading.value = true;
      error.value = null;

      if (resetPagination) {
        filters.value.page = 1;
        pagination.value.page = 1;
      }

      const response = await warehouseStocksService.getWarehouseStocks(
        warehouseId.value,
        filters.value
      );

      stocks.value = response.data;
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.count,
        totalPages: response.total_pages
      };

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Stoklar yüklenirken hata oluştu';
      console.error('Stoklar yüklenirken hata:', err);
    } finally {
      loading.value = false;
    }
  };

  // Load warehouse stats
  const loadStats = async () => {
    if (!warehouseId.value) return;

    try {
      const statsData = await warehouseStocksService.getWarehouseStockStats(warehouseId.value);
      stats.value = statsData;
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const categoriesData = await warehouseStocksService.getProductCategories();
      categories.value = categoriesData;
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      loadStocks(true),
      loadStats(),
      loadCategories()
    ]);
  };

  // Initialize data
  const initializeData = async () => {
    await refreshData();
  };

  // Search stocks
  const searchStocks = async (searchTerm: string) => {
    filters.value.search = searchTerm;
    await loadStocks(true);
  };

  // Filter by category
  const filterByCategory = async (category: string) => {
    filters.value.category = category;
    await loadStocks(true);
  };

  // Filter by stock status
  const filterByStockStatus = async (status: string) => {
    filters.value.stock_status = status as any;
    await loadStocks(true);
  };

  // Clear filters
  const clearFilters = async () => {
    filters.value = {
      search: '',
      category: 'all',
      stock_status: 'all',
      page: 1,
      limit: 50
    };
    await loadStocks(true);
  };

  // Change page
  const changePage = async (page: number) => {
    filters.value.page = page;
    pagination.value.page = page;
    await loadStocks();
  };

  // Change page size
  const changePageSize = async (limit: number) => {
    filters.value.limit = limit;
    pagination.value.limit = limit;
    await loadStocks(true);
  };

  // Create stock movement
  const createStockMovement = async (movementData: any) => {
    try {
      loading.value = true;
      await warehouseStocksService.createStockMovement({
        ...movementData,
        warehouse_id: warehouseId.value
      });
      
      // Refresh data after movement
      await refreshData();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stok hareketi oluşturulurken hata oluştu';
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // Adjust stock level
  const adjustStockLevel = async (productId: string, newQuantity: number, notes?: string) => {
    try {
      loading.value = true;
      await warehouseStocksService.adjustStockLevel(
        warehouseId.value,
        productId,
        newQuantity,
        notes
      );
      
      // Refresh data after adjustment
      await refreshData();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stok seviyesi ayarlanırken hata oluştu';
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // Get low stock alerts
  const getLowStockAlerts = async () => {
    if (!warehouseId.value) return [];

    try {
      return await warehouseStocksService.getLowStockAlerts(warehouseId.value);
    } catch (err) {
      console.error('Düşük stok uyarıları getirilirken hata:', err);
      return [];
    }
  };

  // Watch for route changes
  watch(() => route.params.id, async (newId) => {
    if (newId) {
      await initializeData();
    }
  }, { immediate: true });

  return {
    // State
    stocks,
    stats,
    categories,
    loading,
    error,
    pagination,
    filters,
    
    // Computed
    warehouseId,
    hasStocks,
    filteredStocksCount,
    
    // Methods
    getStockStatus,
    getStockStatusLabel,
    getStockStatusColor,
    loadStocks,
    loadStats,
    loadCategories,
    refreshData,
    initializeData,
    searchStocks,
    filterByCategory,
    filterByStockStatus,
    clearFilters,
    changePage,
    changePageSize,
    createStockMovement,
    adjustStockLevel,
    getLowStockAlerts
  };
}
