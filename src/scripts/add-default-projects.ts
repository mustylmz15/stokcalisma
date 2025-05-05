// Firebase veritabanına projeleri ekleyen script
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface Project {
    name: string;
    description: string;
    createdAt: any;
    status: string;
}

// Eklenecek projeler
const projectsToAdd: Project[] = [
    {
        name: 'TYP Projesi',
        description: 'Türkiye Yolcu Projelendirmesi',
        createdAt: Timestamp.now(),
        status: 'aktif'
    },
    {
        name: 'KGYS Projesi',
        description: 'Kent Güvenlik Yönetim Sistemi',
        createdAt: Timestamp.now(),
        status: 'aktif'
    },
    {
        name: 'EDS Projesi',
        description: 'Elektronik Denetleme Sistemi',
        createdAt: Timestamp.now(),
        status: 'aktif'
    }
];

// Projeleri ekle
async function addProjects() {
    console.log('Projeler ekleniyor...');
    
    try {
        // Mevcut projeleri kontrol et
        const projectsRef = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsRef);
        const existingProjects = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Mevcut proje sayısı: ${existingProjects.length}`);
        
        // Her bir projeyi ekle
        let addedCount = 0;
        let existingCount = 0;
        
        for (const project of projectsToAdd) {
            // Aynı isimde proje var mı kontrol et
            const existingProject = existingProjects.find(
                p => p.name && p.name.toLowerCase() === project.name.toLowerCase()
            );
            
            if (existingProject) {
                console.log(`"${project.name}" projesi zaten mevcut, atlanıyor...`);
                existingCount++;
                continue;
            }
            
            // Yeni projeyi ekle
            const docRef = await addDoc(projectsRef, project);
            console.log(`Proje başarıyla eklendi! ID: ${docRef.id}, İsim: ${project.name}`);
            addedCount++;
        }
        
        console.log(`İşlem tamamlandı: ${addedCount} proje eklendi, ${existingCount} proje zaten mevcuttu.`);
        return { added: addedCount, existing: existingCount };
    } catch (error) {
        console.error('Projeler eklenirken hata:', error);
        throw error;
    }
}

// Script'i çalıştır
addProjects()
    .then(result => {
        console.log('Script başarıyla tamamlandı:', result);
    })
    .catch(error => {
        console.error('Script çalıştırılırken hata oluştu:', error);
    });
