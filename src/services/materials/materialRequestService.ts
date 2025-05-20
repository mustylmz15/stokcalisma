import { collection, doc, getDocs, setDoc, addDoc, query, where, updateDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

// Malzeme talebi arayüzü
export interface MaterialRequest {
    id?: string;
    requesterId: string;           // Talep eden kullanıcı ID
    requesterName: string;         // Talep eden kullanıcı adı
    requesterDepartment?: string;  // Talep eden departman (opsiyonel)
    sourceProjectId: string;       // Kaynak proje ID
    targetProjectId: string;       // Hedef proje ID (proje arası ise)
    sourceWarehouseId: string;     // Kaynak depo ID
    targetWarehouseId?: string;    // Hedef depo ID (opsiyonel)
    requestItems: MaterialRequestItem[]; // Talep edilen malzemeler
    priority: 'low' | 'medium' | 'high'; // Talep önceliği
    status: 'draft' | 'requested' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'; // Talep durumu
    requestDate: string;           // Talep tarihi
    requiredDate?: string;         // İhtiyaç tarihi (opsiyonel)
    notes?: string;                // Notlar (opsiyonel)
    approverName?: string;         // Onaylayan kişi
    approvalDate?: string;         // Onay tarihi
    rejectionReason?: string;      // Red sebebi
    updatedBy?: string;            // Son güncelleyen kullanıcı ID
    updatedAt?: string;            // Son güncelleme tarihi
}

// Talep edilen malzeme kalemi arayüzü
export interface MaterialRequestItem {
    productId: string;             // Ürün ID
    productName: string;           // Ürün adı
    requestedQuantity: number;     // Talep edilen miktar
    approvedQuantity?: number;     // Onaylanan miktar (opsiyonel)
    serialNumbers?: string[];      // Seri numaraları (seri numaralı ürünler için)
    notes?: string;                // Notlar (opsiyonel)
}

class MaterialRequestService {
    private readonly collectionName = 'materialRequests';

    // Projeye ait talepleri getir
    async getProjectRequests(projectId: string): Promise<MaterialRequest[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('sourceProjectId', '==', projectId)
            );
            
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MaterialRequest));
        } catch (error) {
            console.error('Malzeme talepleri yüklenirken hata:', error);
            throw error;
        }
    }

    // Onay bekleyen talepleri getir
    async getPendingApprovalRequests(projectId: string): Promise<MaterialRequest[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('targetProjectId', '==', projectId),
                where('status', '==', 'requested')
            );
            
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MaterialRequest));
        } catch (error) {
            console.error('Onay bekleyen talepler yüklenirken hata:', error);
            throw error;
        }
    }

    // Belirli bir talebi getir
    async getRequest(requestId: string): Promise<MaterialRequest | null> {
        try {
            const docRef = doc(db, this.collectionName, requestId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                return null;
            }
            
            return {
                id: docSnap.id,
                ...docSnap.data()
            } as MaterialRequest;
        } catch (error) {
            console.error('Talep yüklenirken hata:', error);
            throw error;
        }
    }

    // Yeni talep oluştur
    async createRequest(requestData: MaterialRequest): Promise<MaterialRequest> {
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
        } catch (error) {
            console.error('Talep oluşturulurken hata:', error);
            throw error;
        }
    }

    // Talebi güncelle
    async updateRequest(
        requestId: string, 
        updatedData: Partial<MaterialRequest>,
        updatedBy: string
    ): Promise<MaterialRequest> {
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
            } as MaterialRequest;
        } catch (error) {
            console.error('Talep güncellenirken hata:', error);
            throw error;
        }
    }

    // Talebi onayla
    async approveRequest(
        requestId: string, 
        approverName: string,
        approvedItems?: { productId: string; approvedQuantity: number }[],
        notes?: string
    ): Promise<MaterialRequest> {
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
            
            const approvalData: Partial<MaterialRequest> = {
                status: 'approved',
                approverName,
                approvalDate: new Date().toISOString(),
                requestItems: updatedItems,
                notes: notes || request.notes
            };
            
            return await this.updateRequest(requestId, approvalData, approverName);
        } catch (error) {
            console.error('Talep onaylanırken hata:', error);
            throw error;
        }
    }

    // Talebi reddet
    async rejectRequest(
        requestId: string, 
        approverName: string,
        rejectionReason: string
    ): Promise<MaterialRequest> {
        try {
            const rejectionData: Partial<MaterialRequest> = {
                status: 'rejected',
                approverName,
                approvalDate: new Date().toISOString(),
                rejectionReason
            };
            
            return await this.updateRequest(requestId, rejectionData, approverName);
        } catch (error) {
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
    async getPendingManagerApprovalRequests(projectId: string): Promise<MaterialRequest[]> {
        try {
            // İleride status için 'admin_approved' değeri kullanılacak
            const q = query(
                collection(db, this.collectionName),
                where('targetProjectId', '==', projectId),
                where('status', '==', 'approved') // Şu an için admin approved kullanılıyor
            );
            
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MaterialRequest));
        } catch (error) {
            console.error('Proje sorumlusu onayı bekleyen talepler yüklenirken hata:', error);
            throw error;
        }
    }
    
    // Proje sorumlusu onayı
    async approveRequestByManager(
        requestId: string, 
        managerName: string,
        notes?: string
    ): Promise<MaterialRequest> {
        try {
            const request = await this.getRequest(requestId);
            
            if (!request) {
                throw new Error('Onaylanacak talep bulunamadı');
            }
            
            // İleride status için 'manager_approved' değeri kullanılacak
            const approvalData: Partial<MaterialRequest> = {
                status: 'approved', // Şu an için sadece approved kullanılıyor
                // managerApproverName: managerName,
                // managerApprovalDate: new Date().toISOString(),
                notes: notes || request.notes
            };
            
            return await this.updateRequest(requestId, approvalData, managerName);
        } catch (error) {
            console.error('Proje sorumlusu tarafından talep onaylanırken hata:', error);
            throw error;
        }
    }
    
    // Proje sorumlusu reddi
    async rejectRequestByManager(
        requestId: string, 
        managerName: string,
        rejectionReason: string
    ): Promise<MaterialRequest> {
        try {
            // İleride status için 'manager_rejected' değeri kullanılacak
            const rejectionData: Partial<MaterialRequest> = {
                status: 'rejected', // Şu an için sadece rejected kullanılıyor
                // managerApproverName: managerName,
                // managerRejectionDate: new Date().toISOString(),
                rejectionReason
            };
            
            return await this.updateRequest(requestId, rejectionData, managerName);
        } catch (error) {
            console.error('Proje sorumlusu tarafından talep reddedilirken hata:', error);
            throw error;
        }
    }

    // Talebi sil (sadece draft durumunda)
    async deleteRequest(requestId: string): Promise<boolean> {
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
        } catch (error) {
            console.error('Talep silinirken hata:', error);
            throw error;
        }
    }
}

export default new MaterialRequestService();
