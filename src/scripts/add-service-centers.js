// Servis merkezlerini eklemek için script
import { collection, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ServiceCenter } from '../stores/ariza-store';

// Mevcut servis merkezlerini kontrol et
async function checkExistingServiceCenters(): Promise<ServiceCenter[]> {
    try {
        const querySnapshot = await getDocs(collection(db, 'serviceCenters'));
        const existingCenters: ServiceCenter[] = [];

        querySnapshot.forEach((doc) => {
            existingCenters.push({
                id: doc.id,
                ...doc.data()
            } as ServiceCenter);
        });

        console.log(`Mevcut servis merkezi sayısı: ${existingCenters.length}`);
        return existingCenters;
    } catch (error) {
        console.error('Servis merkezleri kontrol edilirken hata oluştu:', error);
        return [];
    }
}

// Yeni servis merkezi ekle
async function addServiceCenter(serviceCenter) {
    try {
        const serviceCentersRef = collection(db, 'serviceCenters');
        const newCenter = {
            ...serviceCenter,
            createdBy: 'system',
            createdAt: Timestamp.now()
        };
        
        await setDoc(doc(serviceCentersRef), newCenter);
        console.log(`${serviceCenter.name} başarıyla eklendi!`);
        return true;
    } catch (error) {
        console.error(`${serviceCenter.name} eklenirken hata:`, error);
        return false;
    }
}

// Ana işlevi çalıştır
async function main() {
    console.log('Servis merkezleri ekleme işlemi başlatılıyor...');
    
    // Eklenecek servis merkezleri
    const serviceCentersToAdd = [
        {
            name: 'Ankara Onarım Merkezi',
            location: 'Ankara, Türkiye',
            contactInfo: 'Tel: +90 312 555 44 33, Email: ankara@onarimaerkezi.com',
            specialties: ['Elektronik', 'Donanım', 'Yazılım']
        },
        {
            name: 'Malatya Onarım Merkezi',
            location: 'Malatya, Türkiye',
            contactInfo: 'Tel: +90 422 555 22 11, Email: malatya@onarimaerkezi.com',
            specialties: ['Elektronik', 'Donanım']
        },
        {
            name: 'Gaziantep Onarım Merkezi',
            location: 'Gaziantep, Türkiye',
            contactInfo: 'Tel: +90 342 555 66 77, Email: gaziantep@onarimaerkezi.com',
            specialties: ['Elektronik', 'Donanım', 'Mekanik']
        }
    ];
    
    const existingCenters = await checkExistingServiceCenters();
    
    // Her bir merkezi ekle, eğer aynı isimde merkez yoksa
    for (const center of serviceCentersToAdd) {
        const exists = existingCenters.some(
            existing => existing.name.toLowerCase() === center.name.toLowerCase()
        );
        
        if (exists) {
            console.log(`${center.name} zaten mevcut, atlanıyor...`);
            continue;
        }
        
        await addServiceCenter(center);
    }
    
    console.log('Servis merkezleri ekleme işlemi tamamlandı!');
}

// Script'i çalıştır
main().catch(error => {
    console.error('Script çalıştırılırken hata oluştu:', error);
});
