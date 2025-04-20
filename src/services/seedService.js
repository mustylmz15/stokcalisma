// Demo verileri yükleme servisi
import { db } from '@/firebase';
import { 
    collection, 
    getDocs,
    addDoc,
    writeBatch,
    doc
} from 'firebase/firestore';


// Seed servis fonksiyonları
export const seedService = {
    async seedData(data) {
        const batch = writeBatch(db);
        
        try {
            // Mevcut verileri kontrol et
            for (const collectionName in data) {
                const existingDocs = await getDocs(collection(db, collectionName));
                if (!existingDocs.empty) {
                    console.warn(`${collectionName} koleksiyonu zaten veri içeriyor. Atlanıyor.`);
                    continue;
                }

                // Yeni verileri ekle
                data[collectionName].forEach(item => {
                    const docRef = doc(collection(db, collectionName));
                    batch.set(docRef, {
                        ...item,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                });
            }

            await batch.commit();
            console.log('Örnek veriler başarıyla yüklendi');
            return true;
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            throw new Error('Örnek veriler yüklenirken bir hata oluştu');
        }
    },

    async clearData() {
        const batch = writeBatch(db);
        const collections = ['categories', 'products', 'warehouses', 'stocks', 'movements'];
        
        try {
            for (const collectionName of collections) {
                const snapshot = await getDocs(collection(db, collectionName));
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }

            await batch.commit();
            console.log('Tüm veriler başarıyla temizlendi');
            return true;
        } catch (error) {
            console.error('Veri temizleme hatası:', error);
            throw new Error('Veriler temizlenirken bir hata oluştu');
        }
    }
};