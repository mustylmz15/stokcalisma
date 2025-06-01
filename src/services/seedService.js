// Demo verileri yükleme servisi
import { supabase } from '@/lib/supabaseClient';

// Seed servis fonksiyonları
export const seedService = {
    async seedData(data) {
        try {
            // Mevcut verileri kontrol et ve yeni verileri ekle
            for (const tableName in data) {
                // Önce mevcut veri kontrolü
                const { data: existingData, error: checkError } = await supabase
                    .from(tableName)
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.error(`${tableName} tablosu kontrol edilirken hata:`, checkError);
                    continue;
                }

                if (existingData && existingData.length > 0) {
                    console.warn(`${tableName} tablosu zaten veri içeriyor. Atlanıyor.`);
                    continue;
                }

                // Yeni verileri hazırla
                const recordsToInsert = data[tableName].map(item => ({
                    ...item,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                // Toplu ekleme
                const { error: insertError } = await supabase
                    .from(tableName)
                    .insert(recordsToInsert);

                if (insertError) {
                    console.error(`${tableName} verisi eklenirken hata:`, insertError);
                    throw insertError;
                }

                console.log(`${tableName} tablosuna ${recordsToInsert.length} kayıt eklendi`);
            }

            console.log('Örnek veriler başarıyla yüklendi');
            return true;
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            throw new Error('Örnek veriler yüklenirken bir hata oluştu');
        }
    },

    async clearData() {
        const tables = ['categories', 'products', 'warehouses', 'stocks', 'stock_movements'];
        
        try {
            for (const tableName of tables) {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .neq('id', ''); // Tüm kayıtları sil (id boş olmayan kayıtlar)

                if (error) {
                    console.error(`${tableName} tablosu temizlenirken hata:`, error);
                } else {
                    console.log(`${tableName} tablosu temizlendi`);
                }
            }

            console.log('Tüm veriler başarıyla temizlendi');
            return true;
        } catch (error) {
            console.error('Veri temizleme hatası:', error);
            throw new Error('Veriler temizlenirken bir hata oluştu');
        }
    }
};