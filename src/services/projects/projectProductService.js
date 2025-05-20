import { collection, doc, getDocs, addDoc, query, where, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
class ProjectProductService {
    collectionName = 'projectProductSettings';
    // Proje bazlı tüm ürün ayarlarını getir
    async getProjectProductSettings(projectId) {
        try {
            const q = query(collection(db, this.collectionName), where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Proje ürün ayarları yüklenirken hata:', error);
            throw error;
        }
    }
    // Tek bir ürünün proje bazlı ayarlarını getir
    async getProductSetting(projectId, productId) {
        try {
            const q = query(collection(db, this.collectionName), where('projectId', '==', projectId), where('productId', '==', productId));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return null;
            }
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        }
        catch (error) {
            console.error('Ürün ayarları yüklenirken hata:', error);
            throw error;
        }
    }
    // Yeni proje-ürün ayarı ekle
    async addProductSetting(setting) {
        try {
            // Aynı proje ve ürün için ayar var mı kontrol et
            const existingSetting = await this.getProductSetting(setting.projectId, setting.productId);
            if (existingSetting) {
                throw new Error('Bu ürün için bu projede zaten ayarlar tanımlanmış');
            }
            // Yeni bir ayar oluştur
            const timestamp = new Date().toISOString();
            const newSetting = {
                ...setting,
                createdAt: timestamp,
                updatedAt: timestamp
            };
            const docRef = await addDoc(collection(db, this.collectionName), newSetting);
            return {
                ...newSetting,
                id: docRef.id
            };
        }
        catch (error) {
            console.error('Ürün ayarı eklenirken hata:', error);
            throw error;
        }
    }
    // Mevcut proje-ürün ayarını güncelle
    async updateProductSetting(id, updatedData) {
        try {
            if (!id) {
                throw new Error('Güncellenecek ayar ID\'si geçersiz');
            }
            // Document referansını al
            const docRef = doc(db, this.collectionName, id);
            // Belge var mı kontrol et
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Güncellenecek ayar bulunamadı');
            }
            // Güncellenecek verileri hazırla
            const updateData = {
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            // Belgeyi güncelle
            await updateDoc(docRef, updateData);
            // Güncellenmiş belgeyi al
            const updatedDocSnap = await getDoc(docRef);
            return {
                id,
                ...updatedDocSnap.data()
            };
        }
        catch (error) {
            console.error('Ürün ayarı güncellenirken hata:', error);
            throw error;
        }
    }
    // Proje-ürün ayarını sil
    async deleteProductSetting(id) {
        try {
            if (!id) {
                throw new Error('Silinecek ayar ID\'si geçersiz');
            }
            await deleteDoc(doc(db, this.collectionName, id));
            return true;
        }
        catch (error) {
            console.error('Ürün ayarı silinirken hata:', error);
            throw error;
        }
    }
}
export default new ProjectProductService();
//# sourceMappingURL=projectProductService.js.map