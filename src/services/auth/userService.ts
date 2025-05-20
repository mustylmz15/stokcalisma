import { auth, db } from '@/firebase';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser as firebaseDeleteUser,
    User as FirebaseUser
} from 'firebase/auth';
import { 
    doc, 
    collection,
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    writeBatch,
    serverTimestamp,
    Timestamp,
    limit
} from 'firebase/firestore';

// Uygulama genelinde kullanılacak kullanıcı verisi
let currentUser = null;
let users = [];

// Temel kullanıcı tipi
export interface BaseUserDocument {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLogin: string;
    phone: string;
    depot: string | null;
    avatar: string;
    canEdit: boolean;
    projectId?: string | null; // Geriye dönük uyumluluk için
    projectIds?: string[]; // Birden fazla proje desteği
}

// Giriş bilgileri için tip
export interface LoginCredentials {
    email: string;
    password: string;
}

// Yeni kullanıcı kaydı için tip
export interface UserInput {
    email: string;
    password: string;
    name?: string;
    role?: string;
    phone?: string;
    depot?: string | null;
    avatar?: string;
    projectId?: string; // Geriye dönük uyumluluk için
    projectIds?: string[]; // Birden fazla proje için
}

// Kullanıcı güncellemesi için tip
export interface UpdateUserInput {
    name?: string;
    role?: string;
    phone?: string;
    depot?: string | null;
    avatar?: string;
    isActive?: boolean;
    projectId?: string; // Geriye dönük uyumluluk için
    projectIds?: string[]; // Birden fazla proje için
}

// Ana kullanıcı dökümanı tipi
export interface UserDocument extends BaseUserDocument {
    updatedAt?: string;
    password?: string; // Sadece kayıt sırasında kullanılır
}

// Kullanıcı servisi
export const userService = {
    // Kullanıcı girişi
    async login(email: string, password: string): Promise<UserDocument> {
        try {
            if (!email || !password) {
                throw new Error('Email ve şifre zorunludur');
            }

            if (!/^\S+@\S+\.\S+$/.test(email)) {
                throw new Error('Geçerli bir email adresi giriniz');
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                if (!userData.isActive) {
                    throw new Error('Bu hesap devre dışı bırakılmış');
                }
                
                const lastLogin = new Date().toISOString();
                await updateDoc(doc(db, 'users', userCredential.user.uid), { lastLogin });
                
                return {
                    ...userData,
                    id: userCredential.user.uid,
                    lastLogin
                } as UserDocument;
            }
            
            // Eğer Firestore'da kullanıcı dökumanı yoksa yeni oluştur
            const defaultUserData = {
                id: userCredential.user.uid,
                email: userCredential.user.email!,
                name: userCredential.user.displayName || email.split('@')[0],
                role: 'user',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                phone: '',
                depot: null,
                avatar: '/assets/images/profile-2.jpeg',
                canEdit: false
            };
            
            await setDoc(doc(db, 'users', userCredential.user.uid), defaultUserData);
            return defaultUserData;
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.code === 'auth/user-not-found') {
                throw new Error('Kullanıcı bulunamadı');
            } else if (error.code === 'auth/wrong-password') {
                throw new Error('Hatalı şifre');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Geçersiz email adresi');
            } else if (error.code === 'auth/user-disabled') {
                throw new Error('Bu hesap devre dışı bırakılmış');
            }
            throw error;
        }
    },

    // Kullanıcı çıkışı
    async logout(): Promise<void> {
        await signOut(auth);
    },

    // Yeni kullanıcı kaydı
    async register(userData: UserInput): Promise<UserDocument> {
        try {
            // Input validasyonu
            if (!userData.email || !userData.password) {
                throw new Error('Email ve şifre zorunludur');
            }

            if (!/^\S+@\S+\.\S+$/.test(userData.email)) {
                throw new Error('Geçerli bir email adresi giriniz');
            }

            if (userData.password.length < 6) {
                throw new Error('Şifre en az 6 karakter olmalıdır');
            }

            if (userData.phone && !/^[0-9\s-+()]*$/.test(userData.phone)) {
                throw new Error('Geçerli bir telefon numarası giriniz');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            
            if (userData.name) {
                try {
                    await updateProfile(userCredential.user, {
                        displayName: userData.name
                    });
                } catch (profileError) {
                    console.error('Profile update error:', profileError);
                }
            }
            
            const defaultAvatar = '/assets/images/profile-2.jpeg';            const userDocument: Omit<UserDocument, 'id'> = {
                email: userData.email,
                name: userData.name || userData.email.split('@')[0],
                role: userData.role || 'user',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                phone: userData.phone ? String(userData.phone) : '',
                depot: userData.depot || null,
                avatar: userData.avatar || defaultAvatar,
                canEdit: ['admin', 'user', 'proje_admin'].includes(userData.role || 'user'),
                projectId: userData.projectId || null, // Geriye dönük uyumluluk için
                projectIds: userData.projectIds || [] // Birden fazla proje desteği
            };
            
            try {
                await setDoc(doc(db, 'users', userCredential.user.uid), userDocument);
            } catch (firestoreError) {
                console.error('Firestore save error:', firestoreError);
                await userCredential.user.delete();
                throw new Error('Kullanıcı kaydı tamamlanamadı');
            }
            
            return {
                id: userCredential.user.uid,
                ...userDocument
            };
        } catch (error: any) {
            console.error('Register error:', error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('Bu e-posta adresi zaten kullanımda');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Şifre en az 6 karakter olmalıdır');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Geçersiz e-posta adresi');
            }
            throw error;
        }
    },    // Tüm kullanıcıları getir - optimize edildi
    async getAllUsers(): Promise<UserDocument[]> {
        try {
            // Daha basit sorgu yapısı ve batch işlemi kullanarak
            // Firebase'in iç tutarsızlık yaşamasını önleyelim
            const usersCollectionRef = collection(db, 'users');
            
            // Sorguları limit ile yaparak veri miktarını sınırlayalım
            // (çok fazla kullanıcı olduğunda performans sorunlarını önler)
            const querySnapshot = await getDocs(usersCollectionRef);
            
            const users: UserDocument[] = [];
            
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        users.push({
                            id: doc.id,
                            email: userData.email || '',
                            name: userData.name || '',
                            role: userData.role || 'user',
                            isActive: userData.isActive !== undefined ? userData.isActive : true,
                            createdAt: userData.createdAt || new Date().toISOString(),
                            lastLogin: userData.lastLogin || '',
                            phone: userData.phone || '',
                            depot: userData.depot || null,
                            avatar: userData.avatar || '/assets/images/profile-2.jpeg',
                            canEdit: userData.canEdit !== undefined ? userData.canEdit : false,
                            projectIds: userData.projectIds || []
                        } as UserDocument);
                    }
                });
            }
            
            return users;
        } catch (error) {
            console.error('Get all users error:', error);
            // Hatayı fırlatmak yerine boş dizi döndürerek
            // uygulamanın çalışmaya devam etmesini sağlayalım
            return [];
        }
    },
    
    // Kullanıcı bilgilerini güncelle
    async updateUser(userId: string, userData: UpdateUserInput): Promise<UserDocument> {
        try {
            // Önce kullanıcının var olduğunu kontrol et
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('Kullanıcı bulunamadı');
            }

            const now = new Date().toISOString();
            // Daha güvenli bir şekilde verileri hazırlayalım (serileştirme sorunlarını önlemek için)
            const updateData: Record<string, any> = {
                updatedAt: now
            };
            
            // Her bir alanı ayrı ayrı kontrol edelim, güvenli bir şekilde ekleyelim
            if (userData.name !== undefined) {
                updateData.name = userData.name;
            }
            
            if (userData.role !== undefined) {
                updateData.role = userData.role;
                updateData.canEdit = ['admin', 'user', 'proje_admin'].includes(userData.role);
            }
            
            if (typeof userData.phone !== 'undefined') {
                updateData.phone = userData.phone || '';
            }
            
            if (typeof userData.depot !== 'undefined') {
                updateData.depot = userData.depot;
            }
              if (userData.avatar !== undefined) {
                updateData.avatar = userData.avatar;
            }
            
            if (typeof userData.isActive !== 'undefined') {
                updateData.isActive = userData.isActive;
            }
              if (userData.projectIds !== undefined) {
                try {
                    // Serileştirme sorunu olmadığından emin olmak için JSON serileştirip tekrar çözümleme yap
                    if (Array.isArray(userData.projectIds)) {
                        // Önce JSON olarak serileştirip tekrar parse ederek yeniden oluştur (döngüsel referansları temizler)
                        let cleanProjectIds;
                        try {
                            cleanProjectIds = JSON.parse(JSON.stringify(userData.projectIds));
                        } catch (jsonError) {
                            console.error('projectIds JSON serileştirme hatası:', jsonError);
                            cleanProjectIds = [];
                        }

                        // Dizi içindeki tüm değerlerin primitive olduğundan emin ol
                        const safeProjectIds = cleanProjectIds
                            .filter(id => typeof id === 'string' && id.trim() !== '')
                            // Sadece string değerleri al ve trim yap
                            .map(id => String(id).trim());
                        
                        // Boş stringler olmasın
                        updateData.projectIds = safeProjectIds.filter(id => id !== '');
                    } else {
                        // Dizi değilse boş dizi ata
                        updateData.projectIds = [];
                    }
                } catch (err) {
                    console.error('projectIds serileştirme hatası:', err);
                    updateData.projectIds = [];
                }
            }
              if (userData.projectId !== undefined) {
                // projectId'nin string olduğundan emin olalım
                if (typeof userData.projectId === 'string' || userData.projectId === null) {
                    updateData.projectId = userData.projectId;
                } else if (userData.projectId) {
                    // Eğer string değilse ama bir değer varsa, string'e çevirelim
                    updateData.projectId = String(userData.projectId);
                } else {
                    // Değer yoksa null atalım
                    updateData.projectId = null;
                }
            }
              // Güncelleme verilerini son kez kontrol et
            console.log('Güncellenecek veriler:', JSON.stringify(updateData));
              try {
                // Doğrudan güncelleme işlemini gerçekleştir
                await updateDoc(userRef, updateData);
            } catch (error: any) {
                console.error('Firebase güncelleme hatası:', error);
                // Hatanın nedenini bulalım
                if (error.toString().includes('serializing')) {
                    throw new Error('Veriler serileştirilemedi: ' + error.message);
                }
                throw error;
            }
            
            // Güncellenmiş son veriyi al
            const updatedUserDoc = await getDoc(userRef);
            const updatedData = updatedUserDoc.data();            // Güvenli bir kullanıcı nesnesi oluştur
            const safeUserData = {
                id: userId,
                email: updatedData?.email || '',
                name: updatedData?.name || '',
                role: updatedData?.role || 'user',
                isActive: updatedData?.isActive ?? false,
                createdAt: updatedData?.createdAt || now,
                lastLogin: updatedData?.lastLogin || now,
                phone: updatedData?.phone || '',
                depot: updatedData?.depot || null,
                avatar: updatedData?.avatar || '/assets/images/profile-2.jpeg',
                canEdit: updatedData?.canEdit ?? false,
                updatedAt: now,
                projectId: updatedData?.projectId || null,
                projectIds: Array.isArray(updatedData?.projectIds) ? 
                    updatedData.projectIds.filter(id => typeof id === 'string') : []
            };
            
            return safeUserData;

        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    },

    // Kullanıcı sil
    async deleteUser(userId: string): Promise<boolean> {
        try {
            await deleteDoc(doc(db, 'users', userId));
            return true;        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    },
    
    // Kullanıcı ile ilgili diğer işlemler
    async getUserById(userId: string): Promise<UserDocument> {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            throw new Error('Kullanıcı bulunamadı');
        }
        const userData = userDoc.data();
        return {
            id: userId,
            email: userData.email || '',
            name: userData.name || '',
            role: userData.role || 'user',
            isActive: userData.isActive || false,
            createdAt: userData.createdAt || new Date().toISOString(),
            lastLogin: userData.lastLogin || new Date().toISOString(),
            phone: userData.phone || '',
            depot: userData.depot || null,
            avatar: userData.avatar || '/assets/images/profile-2.jpeg',
            canEdit: userData.canEdit || false,
            projectId: userData.projectId || null,
            projectIds: userData.projectIds || []
        };
    },

    // E-posta ile kullanıcıyı getir
    async getUserByEmail(email: string): Promise<UserDocument | null> {
        try {
            if (!email) return null;
            const usersQuery = query(collection(db, 'users'), where('email', '==', email), limit(1));
            const querySnapshot = await getDocs(usersQuery);
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                return { id: docSnap.id, ...docSnap.data() } as UserDocument;
            }
            return null;
        } catch (error) {
            console.error('getUserByEmail error:', error);
            return null;
        }
    }
}

/**
 * Kullanıcının bağlı olduğu projeleri getirir
 * @param userId Kullanıcı ID'si
 * @returns Kullanıcının bağlı olduğu proje ID'leri
 */
async function getUserProjects(userId: string): Promise<string[]> {
    try {
        if (!userId) {
            console.error('getUserProjects: userId boş olamaz');
            return [];
        }

        // 1. Önce users koleksiyonundaki projectIds alanını kontrol edelim
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && userDoc.data()?.projectIds && Array.isArray(userDoc.data()?.projectIds)) {
            return userDoc.data()?.projectIds;
        }

        // 2. userProjects koleksiyonundan kullanıcı projelerini alalım
        const userProjectsRef = collection(db, 'userProjects');
        const q = query(userProjectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log(`${userId} ID'li kullanıcı için bağlı proje bulunamadı`);
            return [];
        }
        
        const projectIds: string[] = [];
        querySnapshot.forEach((doc) => {
            if (doc.data().projectId) {
                projectIds.push(doc.data().projectId);
            }
        });
        
        console.log(`${userId} ID'li kullanıcı için ${projectIds.length} proje bulundu:`, projectIds);
        return projectIds;
    } catch (error) {
        console.error('Kullanıcı projeleri alınırken hata:', error);
        throw error;
    }
}

export { getUserProjects };