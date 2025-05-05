// Projeleri Veritabanına Ekleme Rehberi

/*
Bu dosya, projeleri Firebase veritabanına eklemek için kullanılabilir.
İki yöntem sunuyoruz:

1. Komut Satırından Çalıştırma:
   - JavaScript için: node src/scripts/add-default-projects.js
   - TypeScript için: npx ts-node src/scripts/add-default-projects.ts

2. Vue Component İçinden Çağırma:
   Aşağıdaki kodu bir Vue component'ine ekleyebilirsiniz:

   ```vue
   <script setup>
   import { addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
   import { db } from '@/firebase';
   import { ref } from 'vue';

   const projects = ref([]);

   async function addDefaultProjects() {
     const projectsToAdd = [
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
   }

   // Component yüklendiğinde bu fonksiyonu çağırabilirsiniz:
   // onMounted(addDefaultProjects);
   </script>
   ```

   Bu kodu Fault Management Kurulum sayfasına ekleyerek,
   kullanıcı arayüzünden varsayılan projeleri kolayca ekleyebilirsiniz.
*/

export {};
