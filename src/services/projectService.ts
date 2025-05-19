// Proje ile ilgili işlemleri yönetecek servis
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// Proje tipi için arayüz
export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    isActive?: boolean;
    managerEmail?: string;
    users?: ProjectUser[]; // Projeye bağlı kullanıcılar
}

// Kullanıcı-Proje ilişkisi için arayüz
export interface UserProject {
    userId: string;
    projectId: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
}

// Proje kullanıcıları için arayüz
export interface ProjectUser {
    userId: string; 
    role: string;
    addedAt?: string;
}

class ProjectService {
    // Firebase koleksiyon referansları
    private projectsCollection = collection(db, 'projects');
    private userProjectsCollection = collection(db, 'userProjects');
    
    // Tüm projeleri getir
    async getProjects(): Promise<Project[]> {
        try {
            const querySnapshot = await getDocs(this.projectsCollection);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    // Tarih dönüşüm hatalarını düzelt - Timestamp veya Date objesi kontrolü yap
                    createdAt: this.formatTimestamp(data.createdAt),
                    updatedAt: this.formatTimestamp(data.updatedAt),
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    managerEmail: data.managerEmail,
                    users: data.users || []
                };
            });
        } catch (error) {
            console.error('Projeler getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Tüm projeleri getir (isAdmin çağrısıyla uyumlu olması için)
    async getAllProjects(): Promise<Project[]> {
        return this.getProjects();
    }
    
    // Kullanıcıya ait projeleri getir
    async getUserProjects(userId: string): Promise<Project[]> {
        try {
            // Kullanıcının projelerini bul
            const userProjectsQuery = query(this.userProjectsCollection, where('userId', '==', userId));
            const userProjectsSnapshot = await getDocs(userProjectsQuery);
            const userProjectIds = userProjectsSnapshot.docs.map(doc => doc.data().projectId);
            
            // Projeleri al
            const projects: Project[] = [];
            for (const projectId of userProjectIds) {
                const projectDoc = await getDoc(doc(this.projectsCollection, projectId));
                if (projectDoc.exists()) {
                    const data = projectDoc.data();
                    const project: Project = {
                        id: projectDoc.id,
                        name: data.name,
                        description: data.description,
                        createdAt: this.formatTimestamp(data.createdAt),
                        updatedAt: this.formatTimestamp(data.updatedAt),
                        isActive: data.isActive !== undefined ? data.isActive : true,
                        managerEmail: data.managerEmail
                    };
                    
                    // Kullanıcının bu projede rolünü al
                    const userProject = userProjectsSnapshot.docs.find(d => d.data().projectId === projectId);
                    if (userProject) {
                        project.users = [{
                            userId,
                            role: userProject.data().role,
                            addedAt: this.formatTimestamp(userProject.data().createdAt)
                        }];
                    }
                    
                    projects.push(project);
                }
            }
            return projects;
        } catch (error) {
            console.error('Kullanıcı projeleri getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Proje detaylarını getir
    async getProjectById(id: string): Promise<Project | undefined> {
        try {
            const projectDoc = await getDoc(doc(this.projectsCollection, id));
            if (!projectDoc.exists()) {
                return undefined;
            }
            
            const data = projectDoc.data();
            return {
                id: projectDoc.id,
                name: data.name,
                description: data.description,
                createdAt: this.formatTimestamp(data.createdAt),
                updatedAt: this.formatTimestamp(data.updatedAt),
                isActive: data.isActive !== undefined ? data.isActive : true,
                managerEmail: data.managerEmail
            };
        } catch (error) {
            console.error('Proje detayları getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Kullanıcılar ve proje ilişkilerini getir
    async getUsersByProjectId(projectId: string): Promise<UserProject[]> {
        try {
            const userProjectsQuery = query(this.userProjectsCollection, where('projectId', '==', projectId));
            const querySnapshot = await getDocs(userProjectsQuery);
            
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    userId: data.userId,
                    projectId: data.projectId,
                    role: data.role,
                    createdAt: this.formatTimestamp(data.createdAt),
                    updatedAt: this.formatTimestamp(data.updatedAt)
                };
            });
        } catch (error) {
            console.error('Proje kullanıcıları getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Yeni proje ekle
    async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
        try {
            const projectData = {
                name: project.name,
                description: project.description || '',
                createdAt: Timestamp.now(),
                isActive: project.isActive !== undefined ? project.isActive : true,
                managerEmail: project.managerEmail || ''
            };
            
            const docRef = await addDoc(this.projectsCollection, projectData);
            
            return {
                id: docRef.id,
                ...projectData,
                createdAt: projectData.createdAt.toDate().toISOString()
            };
        } catch (error) {
            console.error('Proje eklenirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Proje güncelle
    async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project | undefined> {
        try {
            const projectRef = doc(this.projectsCollection, id);
            const projectDoc = await getDoc(projectRef);
            
            if (!projectDoc.exists()) {
                return undefined;
            }
            
            const updateData: any = {
                ...updates,
                updatedAt: Timestamp.now()
            };
            
            await updateDoc(projectRef, updateData);
            
            // Güncellenmiş projeyi getir
            const updatedDoc = await getDoc(projectRef);
            const data = updatedDoc.data();
            
            return {
                id: updatedDoc.id,
                name: data?.name,
                description: data?.description,
                createdAt: this.formatTimestamp(data?.createdAt),
                updatedAt: this.formatTimestamp(data?.updatedAt),
                isActive: data?.isActive,
                managerEmail: data?.managerEmail
            };
        } catch (error) {
            console.error('Proje güncellenirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Proje sil
    async deleteProject(id: string): Promise<boolean> {
        try {
            await deleteDoc(doc(this.projectsCollection, id));
            
            // Projeye ait tüm kullanıcı ilişkilerini sil
            const userProjectsQuery = query(this.userProjectsCollection, where('projectId', '==', id));
            const userProjectsSnapshot = await getDocs(userProjectsQuery);
            
            const deletePromises = userProjectsSnapshot.docs.map(document => 
                deleteDoc(doc(this.userProjectsCollection, document.id))
            );
            
            await Promise.all(deletePromises);
            
            return true;
        } catch (error) {
            console.error('Proje silinirken hata oluştu:', error);
            throw error;
        }
    }
      // Kullanıcı projeye ekle
    async addUserToProject(userId: string, projectId: string, role: string): Promise<boolean> {
        try {
            if (!userId || !projectId) {
                console.error('addUserToProject: userId veya projectId boş olamaz');
                return false;
            }
            
            // İki sorgu yerine composite (bileşik) sorgu kullanmak yerine 
            // sadece userId'ye göre sorgu yapıp, sonuçları JavaScript'te filtreleyelim
            const userProjectQuery = query(
                this.userProjectsCollection, 
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(userProjectQuery);
            
            // Bu kullanıcının bu projesi var mı kontrol et
            const existingUserProject = querySnapshot.docs.find(
                doc => doc.data().projectId === projectId
            );
            
            if (existingUserProject) {
                // İlişki zaten var, rolü güncelle
                console.log(`Kullanıcı ${userId} için ${projectId} projesi ilişkisi güncelleniyor`);
                await updateDoc(doc(this.userProjectsCollection, existingUserProject.id), {
                    role,
                    updatedAt: Timestamp.now()
                });
            } else {
                // Yeni ilişki ekle
                console.log(`Kullanıcı ${userId} için ${projectId} projesi ilişkisi oluşturuluyor`);
                await addDoc(this.userProjectsCollection, {
                    userId,
                    projectId,
                    role,
                    createdAt: Timestamp.now()
                });
            }
            
            return true;
        } catch (error) {
            console.error('Kullanıcı projeye eklenirken hata oluştu:', error);
            return false; // Hata durumunda null değil false döndürüyoruz
        }
    }
    
    // Kullanıcıyı projeden çıkar
    async removeUserFromProject(userId: string, projectId: string): Promise<boolean> {
        try {
            if (!userId || !projectId) {
                console.error('removeUserFromProject: userId veya projectId boş olamaz');
                return false;
            }
            
            // Composite query yerine sadece userId'ye göre sorgula
            const userProjectQuery = query(
                this.userProjectsCollection, 
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(userProjectQuery);
            
            // Bu kullanıcının bu projesi var mı kontrol et
            const existingUserProject = querySnapshot.docs.find(
                doc => doc.data().projectId === projectId
            );
            
            if (!existingUserProject) {
                console.log(`Kullanıcı ${userId} için ${projectId} projesi ilişkisi bulunamadı`);
                return false;
            }
            
            // İlişki dokümanını sil
            console.log(`Kullanıcı ${userId} için ${projectId} projesi ilişkisi siliniyor`);
            await deleteDoc(doc(this.userProjectsCollection, existingUserProject.id));
            
            return true;
        } catch (error) {
            console.error('Kullanıcı projeden çıkarılırken hata oluştu:', error);
            return false; // Hata durumunda null değil false döndürüyoruz
        }
    }
    
    // Kullanıcının proje rolünü güncelle
    async updateUserProjectRole(userId: string, projectId: string, newRole: string): Promise<boolean> {
        try {
            const userProjectQuery = query(
                this.userProjectsCollection, 
                where('userId', '==', userId),
                where('projectId', '==', projectId)
            );
            const querySnapshot = await getDocs(userProjectQuery);
            
            if (querySnapshot.empty) {
                return false;
            }
            
            // Rol güncelle
            await updateDoc(doc(this.userProjectsCollection, querySnapshot.docs[0].id), {
                role: newRole,
                updatedAt: Timestamp.now()
            });
            
            return true;
        } catch (error) {
            console.error('Kullanıcı rolü güncellenirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Kullanıcının projedeki rolünü getir
    async getUserProjectRole(userId: string, projectId: string): Promise<string | null> {
        try {
            const userProjectQuery = query(
                this.userProjectsCollection, 
                where('userId', '==', userId),
                where('projectId', '==', projectId)
            );
            const querySnapshot = await getDocs(userProjectQuery);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            return querySnapshot.docs[0].data().role;
        } catch (error) {
            console.error('Kullanıcı rolü getirilirken hata oluştu:', error);
            throw error;
        }
    }
    
    // Depoları yönetme fonksiyonları
    async getAllWarehouses(): Promise<any[]> {
        try {
            const warehousesQuery = query(collection(db, 'warehouses'));
            const querySnapshot = await getDocs(warehousesQuery);
            
            const warehouses: any[] = [];
            querySnapshot.forEach((doc) => {
                warehouses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return warehouses;
        } catch (error) {
            console.error('Get all warehouses error:', error);
            throw error;
        }
    }

    // Proje-depo ilişkilerini getir
    async getWarehousesByProjectId(projectId: string): Promise<any[]> {
        try {
            const projectWarehousesQuery = query(
                collection(db, 'projectWarehouses'),
                where('projectId', '==', projectId)
            );
            
            const querySnapshot = await getDocs(projectWarehousesQuery);
            
            const warehouseProjects: any[] = [];
            querySnapshot.forEach((doc) => {
                warehouseProjects.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return warehouseProjects;
        } catch (error) {
            console.error('Get warehouses by project error:', error);
            throw error;
        }
    }

    // Depoyu projeye ekle
    async addWarehouseToProject(warehouseId: string, projectId: string): Promise<any> {
        try {
            // İlişkinin daha önce eklenip eklenmediğini kontrol et
            const relationQuery = query(
                collection(db, 'projectWarehouses'),
                where('projectId', '==', projectId),
                where('warehouseId', '==', warehouseId)
            );
            
            const relationSnapshot = await getDocs(relationQuery);
            
            if (!relationSnapshot.empty) {
                // İlişki zaten var, güncelle
                const relationDoc = relationSnapshot.docs[0];
                await updateDoc(doc(db, 'projectWarehouses', relationDoc.id), {
                    updatedAt: new Date().toISOString()
                });
                
                return {
                    id: relationDoc.id,
                    warehouseId,
                    projectId,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // Yeni ilişki oluştur
            const relationData = {
                warehouseId,
                projectId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const docRef = await addDoc(collection(db, 'projectWarehouses'), relationData);
            
            return {
                id: docRef.id,
                ...relationData
            };
        } catch (error) {
            console.error('Add warehouse to project error:', error);
            throw error;
        }
    }

    // Depoyu projeden kaldır
    async removeWarehouseFromProject(warehouseId: string, projectId: string): Promise<boolean> {
        try {
            // İlişkiyi bul
            const relationQuery = query(
                collection(db, 'projectWarehouses'),
                where('projectId', '==', projectId),
                where('warehouseId', '==', warehouseId)
            );
            
            const relationSnapshot = await getDocs(relationQuery);
            
            if (relationSnapshot.empty) {
                return false;
            }
            
            // İlişkiyi sil
            await deleteDoc(doc(db, 'projectWarehouses', relationSnapshot.docs[0].id));
            
            return true;
        } catch (error) {
            console.error('Remove warehouse from project error:', error);
            throw error;
        }
    }      // Timestamp veya diğer tarih formatlarını düzgün şekilde işlemek için yardımcı metod
    private formatTimestamp(timestamp: any): string {
        try {
            // Timestamp boş ise şimdiki zamanı döndür
            if (!timestamp) {
                return new Date().toISOString();
            }
            
            // Firestore Timestamp objesi kontrolü
            if (timestamp && timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate().toISOString();
            }
            
            // Date objesi kontrolü
            if (timestamp instanceof Date) {
                return timestamp.toISOString();
            }
            
            // Sayısal değer kontrolü
            const timestampType = typeof timestamp;
            if (timestampType === 'number') {
                return new Date(timestamp).toISOString();
            }
            
            // String değer kontrolü
            if (timestampType === 'string') {
                const timestampStr = timestamp as string;
                // ISO string formatı kontrolü
                if (timestampStr.includes('T') && timestampStr.includes('Z')) {
                    return timestampStr;
                }
                // Tarih oluşturmayı dene
                return new Date(timestampStr).toISOString();
            }
            
            // Hiçbir format eşleşmediyse
            return new Date().toISOString();
        } catch (error) {
            console.error('formatTimestamp hata:', error);
            return new Date().toISOString(); // Hata olursa varsayılan değer
        }
    }

    // Depo ID'sine göre bağlı olduğu projeyi bul
    async getProjectIdByWarehouse(warehouseId: string): Promise<string | null> {
        try {
            // Proje-depo ilişkisini kontrol et
            const projectsSnapshot = await getDocs(this.projectsCollection);
            
            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                
                // Depoların doğrudan proje ile ilişkisi varsa
                if (projectData.warehouses && Array.isArray(projectData.warehouses)) {
                    const warehouse = projectData.warehouses.find((w: any) => w.id === warehouseId);
                    if (warehouse) {
                        return projectDoc.id;
                    }
                }
                
                // Stoklar üzerinden ilişki varsa
                if (projectData.stocks && Array.isArray(projectData.stocks)) {
                    const stock = projectData.stocks.find((s: any) => s.warehouseId === warehouseId);
                    if (stock) {
                        return projectDoc.id;
                    }
                }
            }
            
            // İlişki bulunamadıysa null döndür
            return null;
        } catch (error) {
            console.error('Depo-proje ilişkisi bulunurken hata oluştu:', error);
            return null;
        }
    }
}

// Default export olarak tanımlandığı için, import ederken {} kullanmayın
const projectService = new ProjectService();
export default projectService;