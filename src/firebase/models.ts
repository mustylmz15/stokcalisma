// Firebase veri modelleri tanımları
import { Timestamp } from 'firebase/firestore';

// Seri numaralı ürün modeli
export interface SerializedItem {
    id?: string;              // Belge ID (Firebase tarafından oluşturulur)
    serialNumber: string;     // Ürünün seri numarası (benzersiz olmalı)
    productId: string;        // Ürünün referans ettiği ürün ID'si
    warehouseId: string;      // Ürünün bulunduğu depo ID'si
    projectId?: string;       // Bağlı olduğu proje ID'si (opsiyonel)
    status: 'active' | 'faulty' | 'repair' | 'returned'; // Durum
    acquisitionDate: Date | Timestamp | string; // Edinim tarihi
    warrantyEndDate?: Date | Timestamp | string; // Garanti bitiş tarihi (opsiyonel)
    notes?: string;           // Notlar
    lastUpdated: Date | Timestamp | string; // Son güncelleme tarihi
    createdAt: Date | Timestamp | string;  // Oluşturulma tarihi
    faultHistory?: string[];  // Arıza geçmişi referansları (opsiyonel)
}

// Genişletilmiş ürün modeli (seri numarası desteği ile)
export interface Product {
    id?: string;               // Belge ID
    code: string;              // Ürün kodu
    name: string;              // Ürün adı
    description?: string;      // Açıklama
    categoryId: string;        // Kategori referansı
    category?: string;         // Kategori adı
    subCategory?: string;      // Alt kategori
    unit: string;              // Birim (adet, kg, vb.)
    stockNumber?: string;      // Stok numarası
    minStockLevel: number;     // Minimum stok seviyesi
    totalStock?: number;       // Toplam stok (hesaplanabilir)
    unitPrice: number;         // Birim fiyat
    isActive: boolean;         // Aktif/pasif durumu
    hasSerialization: boolean; // Seri numaralı takip edilecek mi?
    requireSerialNumber: boolean; // Seri numarası girilmesi zorunlu mu?
    serialNumberPrefix?: string; // Seri numarası ön eki (opsiyonel)
    createdAt?: Date | Timestamp | string; // Oluşturulma tarihi
    updatedAt?: Date | Timestamp | string; // Güncelleme tarihi
}

// Stok yapısı
export interface Stock {
    id?: string;              // Belge ID
    productId: string;        // Ürün referansı
    warehouseId: string;      // Depo referansı
    projectId?: string;       // Proje referansı (opsiyonel)
    quantity: number;         // Miktar
    lastUpdated?: Date | Timestamp | string; // Son güncelleme
}

// Hareket yapısı (seri numarası desteği ile güncellendi)
export interface Movement {
    id?: string;              // Belge ID
    movementNumber?: string;  // Hareket numarası
    date: Date | Timestamp | string;  // Tarih
    type: 'in' | 'out' | 'transfer' | 'stock_add'; // Hareket tipi
    productId: string;        // Ürün referansı
    quantity: number;         // Miktar
    sourceWarehouseId: string; // Kaynak depo
    targetWarehouseId?: string; // Hedef depo (transfer durumunda)
    sourceProjectId?: string;  // Kaynak proje (opsiyonel)
    targetProjectId?: string;  // Hedef proje (opsiyonel)
    description?: string;      // Açıklama
    serialNumbers?: string[];  // İşlem yapılan seri numaraları (opsiyonel)
    isSerialized?: boolean;    // Seri numaralı işlem mi?
    previousQuantity?: number; // Önceki miktar
    newQuantity?: number;      // Yeni miktar
    createdAt?: Date | Timestamp | string; // Oluşturulma tarihi
    timestamp?: Date | Timestamp | string; // İşlem zamanı
}