// Bu dosya onarımdan gelen ürünlerin yönetimi için servis fonksiyonları içerir

import { db } from '@/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory';

// Onarım Servis Fonksiyonları
export default {
  /**
   * Kullanıcının erişimi olan depolardaki onarılan ürünleri getirir
   * @param {string[]} statuses - Getirilecek ürünlerin durumları
   * @returns {Promise<Array>} - Onarımdan dönen ürünler listesi
   */
  async getRepairedItemsForWarehouse(statuses = ['repair_completed', 'in_transit', 'received', 'approved']) {
    try {
      const authStore = useAuthStore();
      const inventoryStore = useInventoryStore();
        // Kullanıcının erişimi olan depoları belirle
      const userWarehouses: string[] = [];
      
      // Kullanıcı admin ise tüm depolara erişimi var
      if (authStore.isAdmin || authStore.isProjectAdmin) {
        userWarehouses.push(...inventoryStore.getWarehouses.map(w => w.id));
      } else {
        // Depo yöneticisi ise sadece yetkili olduğu depoya erişim sağlar
        const authorizedWarehouse = authStore.getAuthorizedDepot;
        if (authorizedWarehouse) {
          userWarehouses.push(authorizedWarehouse);
        }
      }
      
      if (userWarehouses.length === 0) {
        return [];
      }
      
      // Onarılan ürünleri sorgulamak için query oluştur
      let repairedItemsQuery = query(
        collection(db, 'repairedItems'),
        where('warehouseId', 'in', userWarehouses),
        where('status', 'in', statuses),
        orderBy('repairCompletedDate', 'desc')
      );
      
      const snapshot = await getDocs(repairedItemsQuery);
        const repairedItems: any[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        repairedItems.push({
          id: doc.id,
          ...data,
          // Tarih dönüşümlerini yap
          repairCompletedDate: data.repairCompletedDate instanceof Timestamp ? data.repairCompletedDate.toDate() : data.repairCompletedDate,
          receivedDate: data.receivedDate instanceof Timestamp ? data.receivedDate.toDate() : data.receivedDate,
          approvedDate: data.approvedDate instanceof Timestamp ? data.approvedDate.toDate() : data.approvedDate,
          rejectedDate: data.rejectedDate instanceof Timestamp ? data.rejectedDate.toDate() : data.rejectedDate,
          installedDate: data.installedDate instanceof Timestamp ? data.installedDate.toDate() : data.installedDate,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        });
      });
      
      return repairedItems;
    } catch (error) {
      console.error('Onarılan ürünler getirilirken hata oluştu:', error);
      throw error;
    }
  },
    /**
   * Belirli bir depoya ait onarılmış ürünleri getirir
   * @param warehouseId Depo ID'si
   */
  async getRepairedItemsByWarehouse(warehouseId: string) {
    try {
      const q = query(
        collection(db, 'repairedItems'),
        where('warehouseId', '==', warehouseId),
        orderBy('repairCompletedDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const repairedItems: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        repairedItems.push({
          id: doc.id,
          ...data,
          // Tarih alanlarını JavaScript Date objelerine çevir
          repairCompletedDate: data.repairCompletedDate instanceof Timestamp ? data.repairCompletedDate.toDate() : data.repairCompletedDate,
          receivedDate: data.receivedDate instanceof Timestamp ? data.receivedDate.toDate() : data.receivedDate,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        });
      });
      
      return repairedItems;
    } catch (error) {
      console.error('Onarılan ürünler alınırken hata:', error);
      throw error;
    }
  },
    /**
   * Onarılmış ürünü teslim al
   * @param itemId Ürün ID'si
   * @param notes Teslim alma notları
   */
  async receiveRepairedItem(itemId: string, notes: string) {
    const authStore = useAuthStore();
    
    try {
      const itemRef = doc(db, 'repairedItems', itemId);
      
      await updateDoc(itemRef, {
        status: 'received',
        receivedDate: Timestamp.now(),
        receiverId: authStore.userInfo?.id || '',
        receiverName: authStore.userInfo?.name || '',
        receiveNotes: notes,
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('Onarılan ürün teslim alınırken hata:', error);
      throw error;
    }
  },
    /**
   * Onarım sürecini onayla veya reddet
   * @param itemId Ürün ID'si
   * @param isApproved Onaylandı mı reddedildi mi
   * @param notes Onaylama/reddetme notları
   */
  async approveOrRejectRepair(itemId: string, isApproved: boolean, notes: string) {
    const authStore = useAuthStore();
    
    try {
      const itemRef = doc(db, 'repairedItems', itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (!itemSnap.exists()) {
        throw new Error('Ürün bulunamadı');
      }
      
      const data = itemSnap.data();
      
      await updateDoc(itemRef, {
        status: isApproved ? 'approved' : 'rejected',
        approvedDate: isApproved ? Timestamp.now() : null,
        rejectedDate: !isApproved ? Timestamp.now() : null,
        approverId: authStore.userInfo?.id || '',
        approverName: authStore.userInfo?.name || '',
        approvalNotes: notes,
        updatedAt: Timestamp.now()
      });
      
      // Eğer onarım onaylandıysa, seri numaralı ürün durumunu güncelle
      if (isApproved && data.serialNumber) {
        const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
        await serializedInventoryService.updateSerializedItemStatus(
          data.serialNumber,
          'active',
          'Onarım tamamlandı ve onaylandı'
        );
      }
      
      return true;
    } catch (error) {
      console.error('Onarım onaylama/reddetme işlemi sırasında hata:', error);
      throw error;
    }
  },
    /**
   * Onarılan ürünü montaj yap
   * @param itemId Ürün ID'si
   * @param location Montaj lokasyonu
   * @param notes Montaj notları
   * @param removeFromStock Stoktan düşülecek mi
   */
  async installRepairedItem(itemId: string, location: string, notes: string, removeFromStock: boolean) {
    const authStore = useAuthStore();
    
    try {
      const itemRef = doc(db, 'repairedItems', itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (!itemSnap.exists()) {
        throw new Error('Ürün bulunamadı');
      }
      
      const data = itemSnap.data();
      
      await updateDoc(itemRef, {
        status: 'installed',
        installedDate: Timestamp.now(),
        installerId: authStore.userInfo?.id || '',
        installerName: authStore.userInfo?.name || '',
        installLocation: location,
        installNotes: notes,
        updatedAt: Timestamp.now()
      });
      
      // Eğer stoktan düşülmesi gerekiyorsa
      if (removeFromStock) {
        // Seri numaralı ürün ise durumunu güncelle
        if (data.serialNumber) {
          const serializedInventoryService = (await import('@/services/inventory/serializedInventoryService')).default;
          await serializedInventoryService.updateSerializedItemStatus(
            data.serialNumber,
            'installed',
            `${location} konumuna montaj yapıldı`
          );
        }
        
        // Stoktan düş
        const inventoryService = (await import('@/services/inventory/inventoryService')).default;
        await inventoryService.processStockMovement(
          data.productId,
          data.warehouseId,
          1, // Tek bir ürün
          'out',
          `Montaj: ${location}`,
          data.projectId
        );
      }
      
      return true;
    } catch (error) {
      console.error('Ürün montaj işlemi sırasında hata:', error);
      throw error;
    }
  },
    /**
   * Onarılan ürünün durumunu günceller
   * @param itemId Onarılan ürün ID'si
   * @param status Yeni durum
   * @param data Ek veriler
   */
  async updateRepairedItemStatus(itemId: string, status: string, data: any) {
    const authStore = useAuthStore();
    
    try {
      const itemRef = doc(db, 'repairedItems', itemId);
      
      await updateDoc(itemRef, {
        status: status,
        ...data,
        updatedAt: Timestamp.now(),
        updatedBy: authStore.userInfo?.name || '',
        updatedById: authStore.userInfo?.id || ''
      });
      
      return true;
    } catch (error) {
      console.error('Onarılan ürün durumu güncellenirken hata:', error);
      throw error;
    }
  }
};
