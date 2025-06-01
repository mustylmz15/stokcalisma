import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjlxvyadlnqerkbielvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbHh2eWFkbG5xZXJrYmllbHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDgxMjIsImV4cCI6MjA2MzQ4NDEyMn0.xq_Ul-hlGEG3hwpBEvY6MXNd74fM4PVHh4vdnuUof0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        console.log('=== Supabase Schema Check ===\n');
        
        // 1. Stock movements tablosunu kontrol et
        console.log('1. Stock movements tablo yapısını kontrol ediyorum...');
        const { data: stockMovements, error: smError } = await supabase
            .from('stock_movements')
            .select('*')
            .limit(1);
            
        if (smError) {
            console.error('Stock movements hata:', smError);
        } else {
            console.log('Stock movements mevcut, örnek satır:');
            console.log(stockMovements?.[0] || 'Tablo boş');
        }
        
        console.log('\n');
        
        // 2. Warehouses tablosunu kontrol et
        console.log('2. Warehouses tablo yapısını kontrol ediyorum...');
        const { data: warehouses, error: whError } = await supabase
            .from('warehouses')
            .select('*')
            .limit(1);
            
        if (whError) {
            console.error('Warehouses hata:', whError);
        } else {
            console.log('Warehouses mevcut, örnek satır:');
            console.log(warehouses?.[0] || 'Tablo boş');
        }
        
        console.log('\n');
        
        // 3. Products tablosunu kontrol et
        console.log('3. Products tablo yapısını kontrol ediyorum...');
        const { data: products, error: pError } = await supabase
            .from('products')
            .select('*')
            .limit(1);
            
        if (pError) {
            console.error('Products hata:', pError);
        } else {
            console.log('Products mevcut, örnek satır:');
            console.log(products?.[0] || 'Tablo boş');
        }
        
        console.log('\n');
        
        // 4. Foreign key join testleri
        console.log('4. Foreign key join testleri...');
        
        // Test 1: Stock movements with warehouses (source)
        console.log('\nTest 1: Stock movements + source warehouse join');
        const { data: test1, error: test1Error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                source_warehouse:warehouses!source_warehouse_id(*)
            `)
            .limit(1);
            
        if (test1Error) {
            console.error('Test 1 hata:', test1Error);
        } else {
            console.log('Test 1 başarılı');
        }
        
        // Test 2: Stock movements with warehouses (target)
        console.log('\nTest 2: Stock movements + target warehouse join');
        const { data: test2, error: test2Error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                target_warehouse:warehouses!target_warehouse_id(*)
            `)
            .limit(1);
            
        if (test2Error) {
            console.error('Test 2 hata:', test2Error);
        } else {
            console.log('Test 2 başarılı');
        }
        
        // Test 3: Stock movements with products
        console.log('\nTest 3: Stock movements + products join');
        const { data: test3, error: test3Error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                product:products(*)
            `)
            .limit(1);
            
        if (test3Error) {
            console.error('Test 3 hata:', test3Error);
        } else {
            console.log('Test 3 başarılı');
        }
        
        // Test 4: Basit join denemesi
        console.log('\nTest 4: Basit stock_movements + warehouses join');
        const { data: test4, error: test4Error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                warehouses(*)
            `)
            .limit(1);
            
        if (test4Error) {
            console.error('Test 4 hata:', test4Error);
        } else {
            console.log('Test 4 başarılı');
        }
        
    } catch (error) {
        console.error('Genel hata:', error);
    }
}

checkSchema();
