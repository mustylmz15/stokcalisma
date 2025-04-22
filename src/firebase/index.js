// Firebase entegrasyonu
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
    // Aşağıya Firebase konsolundan aldığınız yapılandırma bilgilerini yerleştirin
    apiKey: "AIzaSyD4ARJP5VvKDKQnuWjJFtgm6_TrSGiZ0lo",
    authDomain: "uges-stok-takip.firebaseapp.com",
    projectId: "uges-stok-takip",
    storageBucket: "uges-stok-takip.firebasestorage.app",
    messagingSenderId: "311457122548",
    appId: "1:311457122548:web:26e2a50e70cb836186f6a1",
    measurementId: "G-V0Z52MVYDL"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth ve Firestore hizmetlerini başlat
const auth = getAuth(app);
const db = getFirestore(app);

// Offline persistence'ı daha güvenli hale getiriyoruz
// Bu fonksiyon, uygulamanın başlatılması sırasında çağrılacak ve hataları uygun şekilde yönetecek
export const enableOfflinePersistence = async () => {
  try {
    // Persistence'ı şu an için sadece açıkça istendiğinde etkinleştir (otomatik çalışan kodları azaltmak için)
    // Daha sonra uygulama içinde açık bir şekilde çağrılabilir
    // await enableIndexedDbPersistence(db);
    console.log('Offline persistence hazır - manuel olarak etkinleştirilebilir');
    return true;
  } catch (err) {
    if (err.code === 'failed-precondition') {
      // Birden fazla sekme açıksa bu hata oluşabilir
      console.warn('Offline persistence etkinleştirilemedi: Birden fazla sekme açık olabilir');
    } else if (err.code === 'unimplemented') {
      // Tarayıcı IndexedDB'yi desteklemiyorsa bu hata oluşabilir
      console.warn('Tarayıcınız offline persistence özelliğini desteklemiyor');
    } else {
      console.error('Offline persistence etkinleştirilemedi:', err);
    }
    return false;
  }
};

export { auth, db };