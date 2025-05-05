// Arıza yönetimi için gerekli verileri oluşturma sayfası
<template>
    <div>
        <div class="panel p-6">
            <h1 class="text-2xl font-bold mb-6">Arıza Yönetimi Kurulumu</h1>
            
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Servis Merkezleri</h2>
                <p class="mb-4">Sistemde {{ serviceCenters.length }} servis merkezi bulunuyor. Temel servis merkezlerini eklemek için aşağıdaki butonu kullanın.</p>
                  <button 
                    @click="setupServiceCenters" 
                    class="btn btn-primary" 
                    :disabled="loading"
                >
                    {{ loading ? 'Ekleniyor...' : 'Temel Servis Merkezlerini Ekle' }}
                </button>
                
                <div v-if="result" class="mt-4 p-4 rounded-lg" :class="{'bg-success-light text-success': !result.error, 'bg-danger-light text-danger': result.error}">
                    {{ result.message }}
                </div>
            </div>
            
            <!-- Proje Yönetimi Bölümü -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Projeler</h2>
                <p class="mb-4">Sistemde {{ projects.length }} proje bulunuyor. Temel projeleri eklemek için aşağıdaki butonu kullanın.</p>
                
                <button 
                    @click="setupProjects" 
                    class="btn btn-primary" 
                    :disabled="projectsLoading"
                >
                    {{ projectsLoading ? 'Projeler Ekleniyor...' : 'Temel Projeleri Ekle' }}
                </button>
                  <div v-if="projectsResult" class="mt-4 p-4 rounded-lg" :class="{'bg-success-light text-success': !projectsResult.error, 'bg-danger-light text-danger': projectsResult.error}">
                    {{ projectsResult.message }}
                </div>
            </div>
            
            <div class="mt-10" v-if="projects.length > 0">
                <h3 class="text-lg font-semibold mb-3">Mevcut Projeler</h3>
                <div class="overflow-x-auto">
                    <table class="table-auto w-full">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 text-left">Adı</th>
                                <th class="px-4 py-2 text-left">Açıklama</th>
                                <th class="px-4 py-2 text-left">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="project in projects" :key="project.id" class="border-t">
                                <td class="px-4 py-2">{{ project.name }}</td>
                                <td class="px-4 py-2">{{ project.description }}</td>
                                <td class="px-4 py-2">{{ project.status }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="mt-10" v-if="serviceCenters.length > 0">
                <h3 class="text-lg font-semibold mb-3">Mevcut Servis Merkezleri</h3>
                <div class="overflow-x-auto">
                    <table class="table-auto w-full">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 text-left">Adı</th>
                                <th class="px-4 py-2 text-left">Konum</th>
                                <th class="px-4 py-2 text-left">İletişim</th>
                                <th class="px-4 py-2 text-left">Uzmanlıklar</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="center in serviceCenters" :key="center.id" class="border-t">
                                <td class="px-4 py-2">{{ center.name }}</td>
                                <td class="px-4 py-2">{{ center.location }}</td>
                                <td class="px-4 py-2">{{ center.contactInfo }}</td>
                                <td class="px-4 py-2">{{ center.specialties.join(', ') }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useArizaStore } from '@/stores/ariza-store';
import { ServiceCenter } from '@/stores/ariza-store';
import { useToast } from 'vue-toastification';
import { addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

const arizaStore = useArizaStore();
const toast = useToast();

// Servis merkezi state
const loading = ref(false);
const serviceCenters = ref<ServiceCenter[]>([]);
const result = ref<{ message: string, error: boolean } | null>(null);

// Proje state
const projectsLoading = ref(false);
const projects = ref<any[]>([]);
const projectsResult = ref<{ message: string, error: boolean } | null>(null);

// Mevcut servis merkezlerini yükle
async function loadServiceCenters() {
    loading.value = true;
    try {
        await arizaStore.fetchServiceCenters();
        serviceCenters.value = arizaStore.getServiceCenters;
    } catch (error) {
        console.error('Servis merkezleri yüklenirken hata oluştu:', error);
        toast.error('Servis merkezleri yüklenirken bir hata oluştu');
    } finally {
        loading.value = false;
    }
}

// Temel servis merkezlerini ekle
async function setupServiceCenters() {
    loading.value = true;
    result.value = null;
    
    try {
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
        
        let addedCount = 0;
        let existingCount = 0;
        
        for (const center of serviceCentersToAdd) {
            // İsim kontrolüyle mevcut merkez var mı diye bak
            const exists = serviceCenters.value.some(
                existing => existing.name.toLowerCase() === center.name.toLowerCase()
            );
            
            if (exists) {
                existingCount++;
                continue;
            }
            
            const success = await arizaStore.addServiceCenter(center);
            if (success) {
                addedCount++;
            }
        }
        
        if (addedCount > 0) {
            result.value = { 
                message: `${addedCount} servis merkezi başarıyla eklendi. ${existingCount} servis merkezi zaten mevcut olduğu için atlandı.`, 
                error: false 
            };
            toast.success('Servis merkezleri başarıyla eklendi');
            await loadServiceCenters(); // Listeyi güncelle
        } else if (existingCount > 0) {
            result.value = { 
                message: `Tüm servis merkezleri zaten mevcut olduğu için hiçbir merkez eklenmedi.`, 
                error: false 
            };
            toast.info('Tüm servis merkezleri zaten mevcut');
        } else {
            result.value = { 
                message: 'Servis merkezi eklenemedi.', 
                error: true 
            };
            toast.error('Servis merkezi eklenemedi');
        }
    } catch (error) {
        console.error('Servis merkezleri eklenirken hata oluştu:', error);
        result.value = { 
            message: 'Servis merkezleri eklenirken bir hata oluştu.', 
            error: true 
        };
        toast.error('Servis merkezleri eklenirken bir hata oluştu');
    } finally {
        loading.value = false;
    }
}

// Mevcut projeleri yükle
async function loadProjects() {
    projectsLoading.value = true;
    try {
        const projectsRef = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsRef);
        projects.value = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Projeler yüklenirken hata oluştu:', error);
        toast.error('Projeler yüklenirken bir hata oluştu');
    } finally {
        projectsLoading.value = false;
    }
}

// Temel projeleri ekle
async function setupProjects() {
    projectsLoading.value = true;
    projectsResult.value = null;
    
    try {
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
        let addedCount = 0;
        let existingCount = 0;
        
        for (const project of projectsToAdd) {
            // Aynı isimde proje var mı kontrol et
            const exists = projects.value.some(
                existing => existing.name.toLowerCase() === project.name.toLowerCase()
            );
            
            if (exists) {
                existingCount++;
                continue;
            }
            
            // Yeni projeyi ekle
            const docRef = await addDoc(projectsRef, project);
            console.log(`Proje başarıyla eklendi! ID: ${docRef.id}, İsim: ${project.name}`);
            addedCount++;
        }
        
        if (addedCount > 0) {
            projectsResult.value = { 
                message: `${addedCount} proje başarıyla eklendi. ${existingCount} proje zaten mevcut olduğu için atlandı.`, 
                error: false 
            };
            toast.success('Projeler başarıyla eklendi');
            await loadProjects(); // Listeyi güncelle
        } else if (existingCount > 0) {
            projectsResult.value = { 
                message: `Tüm projeler zaten mevcut olduğu için hiçbir proje eklenmedi.`, 
                error: false 
            };
            toast.info('Tüm projeler zaten mevcut');
        } else {
            projectsResult.value = { 
                message: 'Proje eklenemedi.', 
                error: true 
            };
            toast.error('Proje eklenemedi');
        }
    } catch (error) {
        console.error('Projeler eklenirken hata oluştu:', error);
        projectsResult.value = { 
            message: 'Projeler eklenirken bir hata oluştu.', 
            error: true 
        };
        toast.error('Projeler eklenirken bir hata oluştu');
    } finally {
        projectsLoading.value = false;
    }
}

onMounted(async () => {
    await loadServiceCenters();
    await loadProjects();
});
</script>
