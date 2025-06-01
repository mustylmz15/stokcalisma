import { supabase } from '@/lib/supabaseClient';

export interface StockItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  product_name?: string;
  product_sku?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
}

export interface StockMovement {
  id?: string;
  movement_number?: string;
  date?: string;
  product_id: string;
  source_warehouse_id?: string;
  destination_warehouse_id?: string;
  movement_type: 'in' | 'out' | 'transfer';
  quantity: number;
  notes?: string;
  created_at?: string;
}

export interface StockStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, description')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
};

// Get stocks by warehouse
export const getStocksByWarehouse = async (warehouseId: string): Promise<StockItem[]> => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select(`
        id,
        product_id,
        warehouse_id,
        quantity,
        created_at,
        updated_at,
        products (
          name,
          sku
        )
      `)
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }

    // Map joined data
    const stocks = (data || []).map(stock => ({
      ...stock,
      product_name: stock.products?.name || 'Unknown Product',
      product_sku: stock.products?.sku || 'N/A'
    }));

    return stocks;
  } catch (error) {
    console.error('Error in getStocksByWarehouse:', error);
    throw error;
  }
};

// Get stock statistics
export const getStockStats = async (warehouseId: string): Promise<StockStats> => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('quantity')
      .eq('warehouse_id', warehouseId);

    if (error) {
      console.error('Error fetching stock stats:', error);
      throw error;
    }

    const stocks = data || [];
    const totalProducts = stocks.length;
    const totalValue = stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    const lowStockItems = stocks.filter(stock => (stock.quantity || 0) < 10).length;
    const outOfStockItems = stocks.filter(stock => (stock.quantity || 0) === 0).length;

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems
    };
  } catch (error) {
    console.error('Error in getStockStats:', error);
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    };
  }
};

// Create stock movement
export const createStockMovement = async (movement: {
  product_id: string;
  warehouse_id: string;
  movement_type: 'in' | 'out' | 'transfer';
  quantity: number;
  notes?: string;
}): Promise<any> => {
  try {
    console.log('createStockMovement called:', movement);
    
    // For now, just update stock directly without movement record
    // This is a fallback until we can determine the correct stock_movements schema
    await updateStockQuantity(movement.product_id, movement.warehouse_id, movement.movement_type, movement.quantity);

    console.log('createStockMovement completed successfully');

    return {
      id: `temp-${Date.now()}`,
      product_id: movement.product_id,
      type: movement.movement_type,
      quantity: movement.quantity,
      notes: movement.notes || '',
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in createStockMovement:', error);
    throw error;
  }
};

// Update stock quantity based on movement
const updateStockQuantity = async (productId: string, warehouseId: string, movementType: 'in' | 'out' | 'transfer', quantity: number) => {
  try {
    console.log('updateStockQuantity called:', { productId, warehouseId, movementType, quantity });
    
    // Get current stock
    const { data: currentStock, error: fetchError } = await supabase
      .from('stocks')
      .select('id, quantity')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    console.log('Current stock found:', currentStock);

    const currentQuantity = currentStock?.quantity || 0;
    const newQuantity = movementType === 'in' 
      ? currentQuantity + quantity 
      : currentQuantity - quantity;

    console.log('Quantity calculation:', { currentQuantity, newQuantity, movementType });

    if (currentStock) {
      // Update existing stock
      const { error: updateError } = await supabase
        .from('stocks')
        .update({
          quantity: Math.max(0, newQuantity)
        })
        .eq('id', currentStock.id);

      if (updateError) {
        throw updateError;
      }
      console.log('Stock updated successfully');
    } else {
      // Create new stock record
      const { error: insertError } = await supabase
        .from('stocks')
        .insert({
          product_id: productId,
          warehouse_id: warehouseId,
          quantity: Math.max(0, newQuantity)
        });

      if (insertError) {
        throw insertError;
      }
      console.log('New stock record created');
    }
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    throw error;
  }
};
