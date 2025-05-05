// Veritabanı temizleme endpoint bileşeni
<template>
    <div class="panel">
        <div class="flex items-center justify-between mb-5">
            <h5 class="font-semibold text-lg dark:text-white-light">Veritabanı Yönetimi</h5>
        </div>

        <div class="mb-5">
            <div class="mb-5">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="alert alert-danger bg-danger text-white p-3">
                        <div class="flex items-start">
                            <div class="ltr:mr-3 rtl:ml-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5">
                                    <path opacity="0.5" d="M5.31171 10.7615C8.23007 5.58716 9.68925 3 12 3C14.3107 3 15.7699 5.58716 18.6883 10.7615L19.0519 11.4063C21.4771 15.7061 22.6897 17.856 21.5937 19.428C20.4978 21 17.7864 21 12.3637 21H11.6363C6.21356 21 3.50217 21 2.40626 19.428C1.31034 17.856 2.52291 15.7061 4.94805 11.4063L5.31171 10.7615Z" stroke="currentColor" stroke-width="1.5"></path>
                                    <path d="M12 8V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                    <circle cx="12" cy="16" r="1" fill="currentColor"></circle>
                                </svg>
                            </div>
                            <div>
                                <h4 class="text-white font-semibold mb-2">Dikkat!</h4>
                                <p>Bu işlem tüm veritabanını temizleyecek ve veri kaybına neden olacaktır. İşlem geri alınamaz.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="panel bg-white dark:bg-gray-800 p-4">
                    <h5 class="font-semibold mb-4">Veritabanını Temizle</h5>
                    <p class="mb-4">Bu işlem aşağıdaki koleksiyonları temizleyecektir:</p>
                    <ul class="list-disc ml-4 mb-4">
                        <li>Ürünler (products)</li>
                        <li>Stoklar (stocks)</li>
                        <li>Hareketler (movements)</li>
                        <li>Kategoriler (categories)</li>
                        <li>Seri Numaralı Ürünler (serializedItems)</li>
                    </ul>
                    <button type="button" class="btn btn-danger" @click="confirmCleanDatabase" :disabled="loading">
                        <span v-if="loading" class="animate-spin mr-2">&#8635;</span>
                        Veritabanını Temizle
                    </button>
                </div>
            </div>
        </div>

        <!-- Onay Modal -->
        <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="panel bg-white dark:bg-gray-800 max-w-md w-full">
                <div class="flex flex-col items-center p-4">
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-danger mb-4">
                        <path opacity="0.5" d="M5.31171 10.7615C8.23007 5.58716 9.68925 3 12 3C14.3107 3 15.7699 5.58716 18.6883 10.7615L19.0519 11.4063C21.4771 15.7061 22.6897 17.856 21.5937 19.428C20.4978 21 17.7864 21 12.3637 21H11.6363C6.21356 21 3.50217 21 2.40626 19.428C1.31034 17.856 2.52291 15.7061 4.94805 11.4063L5.31171 10.7615Z" stroke="currentColor" stroke-width="1.5"></path>
                        <path d="M12 8V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                        <circle cx="12" cy="16" r="1" fill="currentColor"></circle>
                    </svg>
                    <h5 class="text-lg font-bold mb-2">Veritabanını Temizlemeyi Onaylayın</h5>
                    <p class="text-center mb-4">Bu işlem tüm verileri silecektir ve GERİ ALINAMAZ! Devam etmek istediğinize emin misiniz?</p>
                    <div class="flex gap-4">
                        <button type="button" class="btn btn-outline-danger" @click="showConfirmModal = false">
                            İptal
                        </button>
                        <button type="button" class="btn btn-danger" @click="cleanDatabase" :disabled="processing">
                            <span v-if="processing" class="animate-spin mr-2">&#8635;</span>
                            Evet, Veritabanını Temizle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

const toast = useToast();
const loading = ref(false);
const processing = ref(false);
const showConfirmModal = ref(false);
const results = ref([]);

// Silinecek koleksiyonlar
const collectionsToClean = [
    'products',          // Ürünler
    'stocks',            // Stoklar
    'movements',         // Hareketler
    'categories',        // Kategoriler
    'serializedItems'    // Seri numaralı ürünler
];

// Onay modali göster
const confirmCleanDatabase = () => {
    showConfirmModal.value = true;
};

// Veritabanını temizleme fonksiyonu
const cleanDatabase = async () => {
    processing.value = true;
    results.value = [];
    
    try {
        // Her bir koleksiyonu temizle
        for (const collectionName of collectionsToClean) {
            const result = { collection: collectionName, status: 'başladı', count: 0, error: null };
            results.value.push(result);
            
            try {
                const collectionRef = collection(db, collectionName);
                const snapshot = await getDocs(collectionRef);
                
                if (snapshot.empty) {
                    result.status = 'zaten boş';
                    continue;
                }
                
                const deletePromises = [];
                let count = 0;
                
                snapshot.forEach((document) => {
                    deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
                    count++;
                });
                
                await Promise.all(deletePromises);
                result.status = 'tamamlandı';
                result.count = count;
                
            } catch (error) {
                result.status = 'hata';
                result.error = error.message;
                console.error(`${collectionName} koleksiyonu temizlenirken hata:`, error);
            }
        }
        
        toast.success('Veritabanı temizleme işlemi tamamlandı!');
        showConfirmModal.value = false;
        
    } catch (error) {
        console.error('Veritabanı temizleme sırasında hata oluştu:', error);
        toast.error('Veritabanı temizleme işlemi sırasında bir hata oluştu!');
    } finally {
        processing.value = false;
    }
};
</script>
