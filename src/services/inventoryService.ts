import { supabase } from '@/lib/supabaseClient';

// Ürün Tanımları
export interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    category_id: string;
    brand_id?: string;
    category?: Category;
    brand?: Category;
    status: 'active' | 'inactive' | 'discontinued';
    barcode?: string;
    image_url?: string;
    unit: string;
    is_serialized: boolean;
    has_warranty: boolean;
    warranty_period?: number;
    minStockLevel?: number;  // Minimum stok seviyesi
    tags?: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
    totalStock?: number; // Hesaplanmış değer
}

// Kategori Tanımı
export interface Category {
    id: string;
    name: string;
    parent_id?: string;
    created_at?: string;
    updated_at?: string;
}

// Depo Tanımı
export interface Warehouse {
    id: string;
    code: string;
    name: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Stok Tanımı
export interface Stock {
    id: string;
    product_id: string;
    warehouse_id: string;
    project_id?: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

// Stok Hareketi Tanımı
export interface StockMovement {
    id: string;
    movement_number: string;
    date: string;
    product_id: string;
    source_warehouse_id?: string;
    destination_warehouse_id?: string; // target yerine destination
    project_id?: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    reference_number?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

// Seri Numarası Tanımı
export interface SerialNumber {
    id: string;
    product_id: string;
    serial_number: string;
    warehouse_id: string;
    project_id?: string;
    status: 'in_stock' | 'sold' | 'defective' | 'in_repair';
    warranty_start?: string;
    warranty_end?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// Stok/Envanter servis sınıfı
export const inventoryService = {
    // Kategori İşlemleri
    async getAllCategories(): Promise<Category[]> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Kategoriler alınırken hata oluştu:', error);
            throw error;
        }
    },

    async addCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert(categoryData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Kategori eklenirken hata oluştu:', error);
            throw error;
        }
    },

    async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(categoryData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Kategori güncellenirken hata oluştu:', error);
            throw error;
        }
    },

    async deleteCategory(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Kategori silinirken hata oluştu:', error);
            throw error;
        }    },    // Ürün İşlemleri
    async getAllProducts(): Promise<Product[]> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:category_id(id, name),
                    brand:brand_id(id, name)
                `)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Ürünler alınırken hata oluştu:', error);
            throw error;
        }
    },

    async getProductById(productId: string): Promise<Product> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:category_id(id, name),
                    brand:brand_id(id, name)
                `)
                .eq('id', productId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`${productId} ID'li ürün alınırken hata oluştu:`, error);
            throw error;
        }
    },

    async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
        try {
            // Zorunlu alanları kontrol et
            if (!productData.name || !productData.sku || !productData.category_id || !productData.unit) {
                throw new Error('Ürün adı, SKU, kategori ve birim alanları zorunludur');
            }

            // SKU'nun benzersiz olduğunu kontrol et
            const { data: existingProduct, error: checkError } = await supabase
                .from('products')
                .select('id')
                .eq('sku', productData.sku.trim())
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingProduct) {
                throw new Error(`Bu SKU (${productData.sku}) zaten kullanımda`);
            }

            // Ürün verilerini hazırla
            const newProduct = {
                ...productData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Ürünü ekle
            const { data, error } = await supabase
                .from('products')
                .insert(newProduct)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ürün eklenirken hata oluştu:', error);
            throw error;
        }
    },

    async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
        try {
            // updated_at alanını otomatik güncelle
            const updateData = {
                ...productData,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ürün güncellenirken hata oluştu:', error);
            throw error;
        }
    },

    async deleteProduct(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Ürün silinirken hata oluştu:', error);
            throw error;
        }
    },

    // Depo İşlemleri
    async getAllWarehouses(): Promise<Warehouse[]> {
        try {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Depolar alınırken hata oluştu:', error);
            throw error;
        }
    },

    async getWarehousesByProject(projectId: string): Promise<Warehouse[]> {
        try {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .eq('project_id', projectId)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`${projectId} proje ID'li depolar alınırken hata oluştu:`, error);
            throw error;
        }
    },

    async addWarehouse(warehouseData: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Promise<Warehouse> {
        try {
            const newWarehouse = {
                ...warehouseData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('warehouses')
                .insert(newWarehouse)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Depo eklenirken hata oluştu:', error);
            throw error;
        }
    },

    async updateWarehouse(id: string, warehouseData: Partial<Warehouse>): Promise<Warehouse> {
        try {
            const updateData = {
                ...warehouseData,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('warehouses')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Depo güncellenirken hata oluştu:', error);
            throw error;
        }
    },

    async deleteWarehouse(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('warehouses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Depo silinirken hata oluştu:', error);
            throw error;
        }
    },

    // Stok İşlemleri
    async getAllStocks(): Promise<Stock[]> {
        try {
            const { data, error } = await supabase
                .from('stocks')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Stoklar alınırken hata oluştu:', error);
            throw error;
        }
    },

    async getStocksByWarehouse(warehouseId: string): Promise<Stock[]> {
        try {
            const { data, error } = await supabase
                .from('stocks')
                .select('*')
                .eq('warehouse_id', warehouseId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`${warehouseId} depo ID'li stoklar alınırken hata oluştu:`, error);
            throw error;
        }
    },

    async getStocksByProject(projectId: string): Promise<Stock[]> {
        try {
            const { data, error } = await supabase
                .from('stocks')
                .select('*')
                .eq('project_id', projectId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`${projectId} proje ID'li stoklar alınırken hata oluştu:`, error);
            throw error;
        }
    },

    async getStockByProductAndWarehouse(productId: string, warehouseId: string): Promise<Stock | null> {
        try {
            const { data, error } = await supabase
                .from('stocks')
                .select('*')
                .eq('product_id', productId)
                .eq('warehouse_id', warehouseId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Ürün ID: ${productId}, Depo ID: ${warehouseId} stok bilgisi alınırken hata:`, error);
            throw error;
        }
    },

    async updateStock(stockData: Partial<Stock> & { product_id: string, warehouse_id: string }): Promise<Stock> {
        try {
            // Öncelikle mevcut stok kaydını kontrol et
            const { data: existingStock } = await supabase
                .from('stocks')
                .select('*')
                .eq('product_id', stockData.product_id)
                .eq('warehouse_id', stockData.warehouse_id)
                .maybeSingle();

            if (existingStock) {
                // Mevcut stok kaydını güncelle
                const updateData = {
                    ...stockData,
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('stocks')
                    .update(updateData)
                    .eq('id', existingStock.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Yeni stok kaydı oluştur
                const newStock = {
                    ...stockData,
                    quantity: stockData.quantity || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('stocks')
                    .insert(newStock)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Stok güncellenirken hata oluştu:', error);
            throw error;
        }
    },    // Stok Hareketi İşlemleri
    async getAllMovements(): Promise<StockMovement[]> {
        try {
            // Doğru foreign key relationship isimleri ile join
            const { data, error } = await supabase
                .from('stock_movements')
                .select(`
                    *,
                    source_warehouse:warehouses!stock_movements_source_warehouse_id_fkey(*),
                    destination_warehouse:warehouses!stock_movements_destination_warehouse_id_fkey(*),
                    product:products(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Stok hareketleri alınırken hata oluştu:', error);
            throw error;
        }
    },    async getMovementsByProject(projectId: string): Promise<StockMovement[]> {
        try {
            // Doğru foreign key relationship isimleri ile join
            const { data, error } = await supabase
                .from('stock_movements')
                .select(`
                    *,
                    source_warehouse:warehouses!stock_movements_source_warehouse_id_fkey(*),
                    destination_warehouse:warehouses!stock_movements_destination_warehouse_id_fkey(*),
                    product:products(*)
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`${projectId} proje ID'li stok hareketleri alınırken hata:`, error);
            throw error;
        }
    },

    async addMovement(movementData: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
        try {
            // Hareket numarası oluştur (yyyyMMdd-XXX formatında)
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            
            // Stok hareketi kaydı ekle
            const newMovement = {
                ...movementData,
                movement_number: `${dateStr}-${randomNum}`,
                created_at: today.toISOString()
            };
            
            const { data, error } = await supabase
                .from('stock_movements')
                .insert(newMovement)
                .select()
                .single();

            if (error) throw error;            // Stok güncelleme işlemleri
            if (movementData.type === 'in') {
                // Giriş hareketi - Kaynak depodaki stok artırılır
                if (movementData.source_warehouse_id) {
                    await this.updateStockQuantity(
                        movementData.product_id,
                        movementData.source_warehouse_id,
                        movementData.quantity,
                        'add'
                    );
                }
            } else if (movementData.type === 'out') {
                // Çıkış hareketi - Kaynak depodaki stok azaltılır
                if (movementData.source_warehouse_id) {
                    await this.updateStockQuantity(
                        movementData.product_id,
                        movementData.source_warehouse_id,
                        movementData.quantity,
                        'subtract'
                    );
                }            } else if (movementData.type === 'transfer' && movementData.destination_warehouse_id) {
                // Transfer hareketi - Kaynak depodan azalt, hedef depoya ekle
                if (movementData.source_warehouse_id) {
                    await this.updateStockQuantity(
                        movementData.product_id,
                        movementData.source_warehouse_id,
                        movementData.quantity,
                        'subtract'
                    );
                    await this.updateStockQuantity(
                        movementData.product_id,
                        movementData.destination_warehouse_id,
                        movementData.quantity,
                        'add'
                    );
                }
            }

            return data;
        } catch (error) {
            console.error('Stok hareketi eklenirken hata oluştu:', error);
            throw error;
        }
    },

    // Stok miktarını artır veya azalt
    async updateStockQuantity(
        productId: string, 
        warehouseId: string, 
        quantity: number, 
        operation: 'add' | 'subtract'
    ): Promise<Stock> {
        try {
            // Önce mevcut stok kaydını kontrol et
            const { data: existingStock } = await supabase
                .from('stocks')
                .select('*')
                .eq('product_id', productId)
                .eq('warehouse_id', warehouseId)
                .maybeSingle();

            if (existingStock) {
                // Mevcut stoğu güncelle
                const newQuantity = operation === 'add' 
                    ? existingStock.quantity + quantity 
                    : existingStock.quantity - quantity;

                if (newQuantity < 0) {
                    throw new Error('Stok miktarı negatif olamaz');
                }

                const { data, error } = await supabase
                    .from('stocks')
                    .update({ 
                        quantity: newQuantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingStock.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Yeni stok kaydı oluştur (sadece ekleme işlemi için)
                if (operation === 'subtract') {
                    throw new Error('Olmayan stoktan çıkarma yapılamaz');
                }

                const now = new Date().toISOString();
                const { data, error } = await supabase
                    .from('stocks')
                    .insert({
                        product_id: productId,
                        warehouse_id: warehouseId,
                        quantity: quantity,
                        created_at: now,
                        updated_at: now
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Stok miktarı güncellenirken hata oluştu:', error);
            throw error;
        }
    },

    // Seri Numaralı Ürün İşlemleri
    async getSerialNumbersByProduct(productId: string): Promise<SerialNumber[]> {
        try {
            const { data, error } = await supabase
                .from('serial_numbers')
                .select('*')
                .eq('product_id', productId)
                .order('serial_number');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`${productId} ürün ID'li seri numaraları alınırken hata:`, error);
            throw error;
        }
    },

    async addSerialNumber(serialData: Omit<SerialNumber, 'id' | 'created_at' | 'updated_at'>): Promise<SerialNumber> {
        try {
            const now = new Date().toISOString();
            const newSerialNumber = {
                ...serialData,
                created_at: now,
                updated_at: now
            };
            
            const { data, error } = await supabase
                .from('serial_numbers')
                .insert(newSerialNumber)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Seri numarası eklenirken hata oluştu:', error);
            throw error;
        }
    },

    async updateSerialNumber(id: string, serialData: Partial<SerialNumber>): Promise<SerialNumber> {
        try {
            const updateData = {
                ...serialData,
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('serial_numbers')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Seri numarası güncellenirken hata oluştu:', error);
            throw error;
        }
    },

    // Debug function to check stock_movements table structure
    async checkStockMovementsStructure() {
        try {
            // Stock movements table structure check disabled for production
            
            const { data, error } = await supabase
                .from('stock_movements')
                .select('*')
                .limit(1);
                
            if (error) {
                console.error('Error checking structure:', error);
                return null;
            }
              if (data && data.length > 0) {
                // Table has data - structure validated
            } else {
                // No data in stock_movements table
            }
            
            return data;
        } catch (error) {
            console.error('Structure check error:', error);
            return null;
        }
    },
};
