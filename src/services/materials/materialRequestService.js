import { collection, doc, getDocs, addDoc, query, where, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
class MaterialRequestService {
    collectionName = 'materialRequests';
    // Projeye ait talepleri getir
    async getProjectRequests(projectId) {
        try {
            const q = query(collection(db, this.collectionName), where('sourceProjectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Malzeme talepleri yüklenirken hata:', error);
            throw error;
        }
    }
    // Onay bekleyen talepleri getir
    async getPendingApprovalRequests(projectId) {
        try {
            const q = query(collection(db, this.collectionName), where('targetProjectId', '==', projectId), where('status', '==', 'requested'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Onay bekleyen talepler yüklenirken hata:', error);
            throw error;
        }
    }
    // Belirli bir talebi getir
    async getRequest(requestId) {
        try {
            const docRef = doc(db, this.collectionName, requestId);
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
            console.error('Talep yüklenirken hata:', error);
            throw error;
        }
    }
    // Yeni talep oluştur
    async createRequest(requestData) {
        try {
            const timestamp = new Date().toISOString();
            const newRequest = {
                ...requestData,
                status: requestData.status || 'draft',
                requestDate: timestamp,
                updatedAt: timestamp
            };
            const docRef = await addDoc(collection(db, this.collectionName), newRequest);
            return {
                ...newRequest,
                id: docRef.id
            };
        }
        catch (error) {
            console.error('Talep oluşturulurken hata:', error);
            throw error;
        }
    }
    // Talebi güncelle
    async updateRequest(requestId, updatedData, updatedBy) {
        try {
            if (!requestId) {
                throw new Error('Güncellenecek talep ID\'si geçersiz');
            }
            const docRef = doc(db, this.collectionName, requestId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Güncellenecek talep bulunamadı');
            }
            const updateData = {
                ...updatedData,
                updatedBy,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(docRef, updateData);
            const updatedDocSnap = await getDoc(docRef);
            return {
                id: requestId,
                ...updatedDocSnap.data()
            };
        }
        catch (error) {
            console.error('Talep güncellenirken hata:', error);
            throw error;
        }
    }
    // Talebi onayla
    async approveRequest(requestId, approverName, approvedItems, notes) {
        try {
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('Onaylanacak talep bulunamadı');
            }
            // Onaylanan miktarları güncelle
            let updatedItems = [...request.requestItems];
            if (approvedItems && approvedItems.length > 0) {
                updatedItems = updatedItems.map(item => {
                    const approvedItem = approvedItems.find(ai => ai.productId === item.productId);
                    if (approvedItem) {
                        return {
                            ...item,
                            approvedQuantity: approvedItem.approvedQuantity
                        };
                    }
                    return item;
                });
            }
            const approvalData = {
                status: 'approved',
                approverName,
                approvalDate: new Date().toISOString(),
                requestItems: updatedItems,
                notes: notes || request.notes
            };
            return await this.updateRequest(requestId, approvalData, approverName);
        }
        catch (error) {
            console.error('Talep onaylanırken hata:', error);
            throw error;
        }
    }
    // Talebi reddet
    async rejectRequest(requestId, approverName, rejectionReason) {
        try {
            const rejectionData = {
                status: 'rejected',
                approverName,
                approvalDate: new Date().toISOString(),
                rejectionReason
            };
            return await this.updateRequest(requestId, rejectionData, approverName);
        }
        catch (error) {
            console.error('Talep reddedilirken hata:', error);
            throw error;
        }
    }
    /**
     * İleriki Geliştirme: Proje Sorumlusu onay süreçleri
     * --------------------------------------------------
     * Proje Admini onayından sonra Proje Sorumlusunun da onay vermesi gerekecek
     * Bu fonksiyonlar ileride aktifleştirilecektir.
     */
    // Proje sorumlusu onayı bekleyen talepleri getir
    async getPendingManagerApprovalRequests(projectId) {
        try {
            // İleride status için 'admin_approved' değeri kullanılacak
            const q = query(collection(db, this.collectionName), where('targetProjectId', '==', projectId), where('status', '==', 'approved') // Şu an için admin approved kullanılıyor
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Proje sorumlusu onayı bekleyen talepler yüklenirken hata:', error);
            throw error;
        }
    }
    // Proje sorumlusu onayı
    async approveRequestByManager(requestId, managerName, notes) {
        try {
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('Onaylanacak talep bulunamadı');
            }
            // İleride status için 'manager_approved' değeri kullanılacak
            const approvalData = {
                status: 'approved', // Şu an için sadece approved kullanılıyor
                // managerApproverName: managerName,
                // managerApprovalDate: new Date().toISOString(),
                notes: notes || request.notes
            };
            return await this.updateRequest(requestId, approvalData, managerName);
        }
        catch (error) {
            console.error('Proje sorumlusu tarafından talep onaylanırken hata:', error);
            throw error;
        }
    }
    // Proje sorumlusu reddi
    async rejectRequestByManager(requestId, managerName, rejectionReason) {
        try {
            // İleride status için 'manager_rejected' değeri kullanılacak
            const rejectionData = {
                status: 'rejected', // Şu an için sadece rejected kullanılıyor
                // managerApproverName: managerName,
                // managerRejectionDate: new Date().toISOString(),
                rejectionReason
            };
            return await this.updateRequest(requestId, rejectionData, managerName);
        }
        catch (error) {
            console.error('Proje sorumlusu tarafından talep reddedilirken hata:', error);
            throw error;
        }
    }
    // Talebi sil (sadece draft durumunda)
    async deleteRequest(requestId) {
        try {
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('Silinecek talep bulunamadı');
            }
            // Sadece taslak durumundaki talepler silinebilir
            if (request.status !== 'draft') {
                throw new Error('Sadece taslak durumundaki talepler silinebilir');
            }
            await deleteDoc(doc(db, this.collectionName, requestId));
            return true;
        }
        catch (error) {
            console.error('Talep silinirken hata:', error);
            throw error;
        }
    }
}
export default new MaterialRequestService();
//# sourceMappingURL=materialRequestService.js.map