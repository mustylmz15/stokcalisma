import { collection, doc, getDocs, addDoc, query, where, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
class CentralWarehouseTransferService {
    collectionName = 'warehouseTransfers';
    // Projeye ait transfer taleplerini getir
    async getProjectTransfers(projectId) {
        try {
            const q = query(collection(db, this.collectionName), where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Transfer talepleri yüklenirken hata:', error);
            throw error;
        }
    }
    // Belirli bir transfer talebini getir
    async getTransfer(transferId) {
        try {
            const docRef = doc(db, this.collectionName, transferId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                return null;
            }
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        catch (error) {
            console.error('Transfer talebi yüklenirken hata:', error);
            throw error;
        }
    }
    // Yeni transfer talebi oluştur
    async createTransfer(transferData) {
        try {
            const timestamp = new Date().toISOString();
            const newTransfer = {
                ...transferData,
                status: transferData.status || 'draft',
                requestDate: timestamp,
                updatedAt: timestamp
            };
            const docRef = await addDoc(collection(db, this.collectionName), newTransfer);
            return {
                ...newTransfer,
                id: docRef.id
            };
        }
        catch (error) {
            console.error('Transfer talebi oluşturulurken hata:', error);
            throw error;
        }
    }
    // Transfer talebini güncelle
    async updateTransfer(transferId, updatedData, updatedBy) {
        try {
            if (!transferId) {
                throw new Error('Güncellenecek transfer ID\'si geçersiz');
            }
            const docRef = doc(db, this.collectionName, transferId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Güncellenecek transfer bulunamadı');
            }
            const updateData = {
                ...updatedData,
                updatedBy,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(docRef, updateData);
            const updatedDocSnap = await getDoc(docRef);
            return {
                id: transferId,
                ...updatedDocSnap.data()
            };
        }
        catch (error) {
            console.error('Transfer talebi güncellenirken hata:', error);
            throw error;
        }
    }
    // Transfer talebini onayla
    async approveTransfer(transferId, approverName, notes) {
        try {
            const approvalData = {
                status: 'approved',
                approverName,
                approverDate: new Date().toISOString(),
                notes: notes || undefined
            };
            return await this.updateTransfer(transferId, approvalData, approverName);
        }
        catch (error) {
            console.error('Transfer talebi onaylanırken hata:', error);
            throw error;
        }
    }
    // Transfer talebini reddet
    async rejectTransfer(transferId, rejecterId, rejectionReason) {
        try {
            const docRef = doc(db, this.collectionName, transferId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Reddedilecek transfer talebi bulunamadı');
            }
            const updateData = {
                status: 'rejected',
                rejectionReason,
                updatedBy: rejecterId,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(docRef, updateData);
            // Güncel veriyi getir
            const updatedDoc = await getDoc(docRef);
            return {
                id: transferId,
                ...updatedDoc.data()
            };
        }
        catch (error) {
            console.error('Transfer talebi reddedilirken hata:', error);
            throw error;
        }
    }
    /**
     * İleriki Geliştirme: Proje Sorumlusu onay süreçleri
     * --------------------------------------------------
     * Proje Admini onayından sonra Proje Sorumlusunun da onay vermesi gerekecek
     * Bu fonksiyonlar ileride aktifleştirilecektir.
     */
    // Proje sorumlusu onayı bekleyen transfer taleplerini getir
    async getPendingManagerApprovalTransfers(projectId) {
        try {
            // İleride status için 'admin_approved' değeri kullanılacak
            const q = query(collection(db, this.collectionName), where('projectId', '==', projectId), where('status', '==', 'approved') // Şu an için 'approved' kullanılıyor
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Proje sorumlusu onayı bekleyen transferler yüklenirken hata:', error);
            throw error;
        }
    }
    // Proje sorumlusu tarafından onaylama
    async approveTransferByManager(transferId, managerId, managerName) {
        try {
            const docRef = doc(db, this.collectionName, transferId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Onaylanacak transfer talebi bulunamadı');
            }
            // İleride status için 'manager_approved' değeri kullanılacak
            const updateData = {
                status: 'approved', // Şu an için sadece 'approved' kullanılıyor
                // managerApproverId: managerId,
                // managerApproverName: managerName,
                // managerApprovalDate: new Date().toISOString(),
                updatedBy: managerId,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(docRef, updateData);
            // Güncel veriyi getir
            const updatedDoc = await getDoc(docRef);
            return {
                id: transferId,
                ...updatedDoc.data()
            };
        }
        catch (error) {
            console.error('Transfer talebi proje sorumlusu tarafından onaylanırken hata:', error);
            throw error;
        }
    }
    // Proje sorumlusu tarafından reddetme
    async rejectTransferByManager(transferId, managerId, managerName, rejectionReason) {
        try {
            const docRef = doc(db, this.collectionName, transferId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Reddedilecek transfer talebi bulunamadı');
            }
            // İleride status için 'manager_rejected' değeri kullanılacak
            const updateData = {
                status: 'rejected', // Şu an için sadece 'rejected' kullanılıyor
                // managerRejecterId: managerId,
                // managerRejecterName: managerName, 
                // managerRejectionDate: new Date().toISOString(),
                rejectionReason,
                updatedBy: managerId,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(docRef, updateData);
            // Güncel veriyi getir
            const updatedDoc = await getDoc(docRef);
            return {
                id: transferId,
                ...updatedDoc.data()
            };
        }
        catch (error) {
            console.error('Transfer talebi proje sorumlusu tarafından reddedilirken hata:', error);
            throw error;
        }
    }
    // Transfer talebini sil (sadece draft durumunda)
    async deleteTransfer(transferId) {
        try {
            const transfer = await this.getTransfer(transferId);
            if (!transfer) {
                throw new Error('Silinecek transfer bulunamadı');
            }
            // Sadece taslak durumundaki transferler silinebilir
            if (transfer.status !== 'draft') {
                throw new Error('Sadece taslak durumundaki transferler silinebilir');
            }
            await deleteDoc(doc(db, this.collectionName, transferId));
            return true;
        }
        catch (error) {
            console.error('Transfer talebi silinirken hata:', error);
            throw error;
        }
    }
}
export default new CentralWarehouseTransferService();
//# sourceMappingURL=centralWarehouseTransferService.js.map