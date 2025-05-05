// Firebase veritabanını temizleme scripti
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Silinecek koleksiyonlar
const collectionsToClean = [
    'products',          // Ürünler
    'stocks',            // Stoklar
    'movements',         // Hareketler
    'categories',        // Kategoriler (isteğe bağlı)
    'serializedItems'    // Eğer varsa, seri numaralı ürünler
];

// Veritabanını temizleme fonksiyonu
async function cleanDatabase() {
    console.log('Veritabanı temizleme işlemi başlatılıyor...');
    console.log('DİKKAT: Bu işlem geri alınamaz!');
    
    try {
        // Her bir koleksiyonu temizle
        for (const collectionName of collectionsToClean) {
            console.log(`${collectionName} koleksiyonu temizleniyor...`);
            
            try {
                const collectionRef = collection(db, collectionName);
                const snapshot = await getDocs(collectionRef);
                
                if (snapshot.empty) {
                    console.log(`${collectionName} koleksiyonu zaten boş.`);
                    continue;
                }
                
                const deletePromises = [];
                let count = 0;
                
                snapshot.forEach((document) => {
                    deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
                    count++;
                });
                
                await Promise.all(deletePromises);
                console.log(`${collectionName} koleksiyonundan ${count} belge silindi.`);
                
            } catch (error) {
                console.error(`${collectionName} koleksiyonu temizlenirken hata:`, error);
            }
        }
        
        console.log('Veritabanı temizleme işlemi tamamlandı!');
        
    } catch (error) {
        console.error('Veritabanı temizleme sırasında hata oluştu:', error);
    }
}

// Script'i çalıştır
cleanDatabase().catch(error => {
    console.error('Script çalıştırılırken hata oluştu:', error);
});
