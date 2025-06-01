<template>
    <div class="space-y-6">
        <!-- Header Section -->
        <div class="panel border-0 shadow-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold">Rol Yönetimi</h1>
                        <p class="text-white/80">Kullanıcıların rollerini ve yetkilerini yönetin</p>
                    </div>
                    <div v-if="loading" class="animate-spin border-2 border-white/30 border-t-white rounded-full w-6 h-6"></div>
                </div>
                <button 
                    type="button" 
                    @click="refreshUsers"
                    class="btn bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Yenile
                </button>
            </div>
        </div>        <!-- Alert Section -->
       

        <!-- Users Section -->
        <div class="panel">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                        </svg>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Kullanıcılar</h2>
                    <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
                        {{ users.length }} kullanıcı
                    </span>
                </div>
            </div>            <!-- Results Section -->
            <div v-if="correctionResult" class="mb-6">
                <div class="p-4 rounded-xl border-l-4" :class="{
                    'border-green-500 bg-green-50 dark:bg-green-900/20': correctionResult.success,
                    'border-red-500 bg-red-50 dark:bg-red-900/20': !correctionResult.success
                }">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <svg v-if="correctionResult.success" class="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <svg v-else class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="font-medium" :class="{
                                'text-green-800 dark:text-green-300': correctionResult.success,
                                'text-red-800 dark:text-red-300': !correctionResult.success
                            }">
                                {{ correctionResult.message }}
                            </p>
                            <p v-if="correctionResult.details" class="text-sm mt-1" :class="{
                                'text-green-700 dark:text-green-400': correctionResult.success,
                                'text-red-700 dark:text-red-400': !correctionResult.success
                            }">
                                <strong>Detaylar:</strong> {{ correctionResult.details }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Users Table -->
            <div v-if="users.length > 0" class="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Kullanıcı
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    E-posta
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Roller
                                </th>
                                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center space-x-3">
                                        <div class="flex-shrink-0">
                                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                {{ user.name.charAt(0).toUpperCase() }}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {{ user.name }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        {{ user.email }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex flex-wrap gap-2">                                        <span v-if="user.role" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            {{ user.role }}
                                            <!-- Global rol silme ikonu -->
                                            <button 
                                                @click.stop="showDeleteRoleConfirm(user, {role: user.role, projectId: 'global', projectName: 'Global'})"
                                                class="ml-1.5 text-red-500 hover:text-red-700 focus:outline-none"
                                                title="Bu rolü sil"
                                            >
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </span>
                                        <span v-if="user.projectRoles && user.projectRoles.length > 0" 
                                              v-for="projectRole in user.projectRoles" 
                                              :key="projectRole.projectId + projectRole.role"
                                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                            {{ projectRole.projectName }}: {{ projectRole.role }}
                                            <!-- Rol silme ikonu -->
                                            <button 
                                                @click.stop="showDeleteRoleConfirm(user, projectRole)"
                                                class="ml-1.5 text-red-500 hover:text-red-700 focus:outline-none"
                                                title="Bu rolü sil"
                                            >
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button 
                                        v-if="canManageUsers" 
                                        type="button" 
                                        @click="selectUser(user)"
                                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    >
                                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                        Düzenle
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Loading State -->
            <div v-else-if="loading" class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p class="text-gray-500 dark:text-gray-400">Kullanıcılar yükleniyor...</p>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center justify-center py-12">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Kullanıcı bulunamadı</h3>
                <p class="text-gray-500 dark:text-gray-400">Henüz sistemde kayıtlı kullanıcı bulunmuyor.</p>
            </div>
        </div>        <!-- Role Management Modal -->
        <teleport to="body">
            <div v-if="showRoleModal" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="closeModal"></div>
                
                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
                        <!-- Modal Header -->
                        <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {{ selectedUser ? selectedUser.name + ' - Rol Düzenleme' : 'Rol Düzenleme' }}
                                        </h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            Kullanıcının rollerini ve yetkilerini güncelleyin
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    @click="closeModal"
                                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>                        <!-- Modal Body -->
                        <div class="px-6 py-6 space-y-6" v-if="selectedUser">                            <!-- Global Role Section -->
                            <div class="space-y-3">                                <label class="block">
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        Kullanıcı Rolü
                                    </span>
                                    
                                    <!-- Mevcut Rol Bilgisi -->
                                    <div v-if="selectedUser && (selectedUser.role || (selectedUser.projectRoles && selectedUser.projectRoles.length > 0))" 
                                         class="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                                        <div class="flex items-center space-x-2 mb-1">
                                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span class="font-medium text-gray-900 dark:text-gray-100">Kullanıcının Mevcut Rolleri</span>
                                        </div>
                                        
                                        <!-- Global Rol -->
                                        <div v-if="selectedUser.role" class="mb-1">
                                            <span class="text-sm text-gray-700 dark:text-gray-300">
                                                Sistem Geneli Rol: 
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                    {{ selectedUser.role }}
                                                </span>
                                            </span>
                                        </div>
                                        
                                        <!-- Proje Rolleri -->
                                        <div v-if="selectedUser.projectRoles && selectedUser.projectRoles.length > 0" class="flex flex-wrap gap-1 mt-1">
                                            <span class="text-sm text-gray-700 dark:text-gray-300 mr-1">Proje Rolleri:</span>
                                            <span v-for="(pr, index) in selectedUser.projectRoles" :key="index"
                                                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                {{ pr.projectName }}: {{ pr.role }}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <!-- Debug Info (geliştirme için) -->
                                    <div v-if="allRoles.length === 0" class="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                        ⚠️ Henüz rol yüklenmedi (allRoles.length = {{ allRoles.length }})
                                    </div>
                                    <div v-else class="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                        ✅ {{ allRoles.length }} rol yüklendi
                                    </div>
                                      <select
                                        v-model="roleForm.globalRole"
                                        @change="onRoleChange"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Rol seçiniz...</option>
                                        <option v-for="role in allRoles" :key="role.id" :value="role.name">
                                            {{ role.display_name }} ({{ role.name }})
                                        </option>
                                    </select>
                                </label>
                            </div>

                            <!-- Project Selection Section (Conditionally Rendered) -->
                            <div v-if="showProjectSelection" class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                        </svg>
                                    </div>
                                    <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Proje Ataması</h4>
                                </div>

                                <div v-if="projects.length > 0" class="space-y-3">
                                     <label class="block">
                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Proje Seçin
                                        </span>
                                        
                                        <!-- Mevcut Proje Bilgisi -->
                                        <div v-if="selectedUser && selectedUser.projectRoles && selectedUser.projectRoles.length > 0"
                                             class="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                                            <div class="flex items-center space-x-2 mb-1">
                                                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                                </svg>
                                                <span class="font-medium text-gray-900 dark:text-gray-100">Kullanıcının Proje Bazlı Rolleri</span>
                                            </div>
                                            
                                            <div class="mt-1 flex flex-wrap gap-1">
                                                <span v-for="(pr, index) in selectedUser.projectRoles" :key="index"
                                                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                    {{ pr.projectName }} ({{ pr.role }})
                                                </span>
                                            </div>
                                            
                                            <div class="mt-2 text-xs text-gray-500 italic">
                                                Not: Yeni bir rol ve proje seçtiğinizde, mevcut roller güncellenir.
                                            </div>
                                        </div>
                                        
                                        <select
                                            v-model="roleForm.selectedProjectId"
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        >
                                            <option value="">Proje seçiniz...</option>
                                            <option v-for="project in projects" :key="project.id" :value="project.id">
                                                {{ project.name }}
                                            </option>
                                        </select>
                                    </label>
                                </div>
                                <div v-else class="text-center py-8">
                                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                        </svg>
                                    </div>
                                    <p class="text-gray-500 dark:text-gray-400">Atanacak proje bulunamadı.</p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Lütfen önce sisteminize projeleri ekleyin.</p>
                                </div>
                            </div>                            <!-- Informational message when no project selection is needed -->
                            <div v-else-if="roleForm.globalRole && !showProjectSelection" class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                                <div class="flex items-center space-x-2 mb-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="font-medium">Bilgi</span>
                                </div>
                                Seçtiğiniz <strong>{{ roleForm.globalRole }}</strong> rolü tüm sistem için geçerli bir rol olduğundan proje seçimi gerekmemektedir. "Yeni Rolü Ata" butonuna tıklayarak işlemi tamamlayabilirsiniz.
                            </div>
                        </div>

                        <!-- Modal Footer -->
                        <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                            <div class="flex justify-end space-x-3">
                                <button 
                                    type="button" 
                                    @click="closeModal"
                                    class="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                >
                                    İptal
                                </button>
                                <button 
                                    type="button" 
                                    @click="updateUserRoles" 
                                    :disabled="saving"
                                    class="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <span v-if="saving" class="flex items-center">
                                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Rol Atanıyor...
                                    </span>
                                    <span v-else class="flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Yeni Rolü Ata
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Role Deletion Confirmation Modal -->
        <teleport to="body">
            <div v-if="showDeleteRoleModal" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="closeDeleteRoleModal"></div>
                
                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <!-- Modal Header -->
                        <div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-t-2xl px-6 py-4">
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0 bg-red-100 dark:bg-red-800/30 p-2 rounded-full">
                                    <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold">
                                        Rol Silme Onayı
                                    </h3>
                                    <p class="text-sm mt-1">
                                        Bu rolü kullanıcıdan silmek istediğinize emin misiniz?
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Modal Body -->
                        <div class="px-6 py-5">
                            <div v-if="roleToDelete" class="space-y-4">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                        {{ roleToDelete.user?.name?.charAt(0).toUpperCase() }}
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-100">
                                            {{ roleToDelete.user?.name }}
                                        </p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ roleToDelete.user?.email }}
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                    <p class="font-medium text-gray-800 dark:text-gray-200 mb-1">Silinecek Rol:</p>
                                    <div class="flex items-center space-x-2">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                                              :class="roleToDelete.projectId ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'">
                                            {{ roleToDelete.projectName ? `${roleToDelete.projectName}: ${roleToDelete.role}` : roleToDelete.role }}
                                        </span>
                                    </div>
                                    <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                        Bu işlem geri alınamaz ve kullanıcı bu role ait tüm yetkileri kaybedecektir.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Modal Footer -->
                        <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                            <div class="flex justify-end space-x-3">
                                <button 
                                    type="button" 
                                    @click="closeDeleteRoleModal"
                                    class="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                >
                                    İptal
                                </button>
                                <button 
                                    type="button" 
                                    @click="deleteUserRole" 
                                    :disabled="deleting"
                                    class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <span v-if="deleting" class="flex items-center">
                                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Siliniyor...
                                    </span>
                                    <span v-else class="flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        Rolü Sil
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore, UserRole } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/projects';
import { useAppStore } from '@/stores/index';
import { getRoleService, RoleType, PermissionType } from '@/services/auth/role-service';
import { supabase, updateUserRoles as supabaseUpdateUserRoles } from '@/supabase';

// Store'ları başlat
const authStore = useAuthStore();
const projectStore = useProjectStore();
const appStore = useAppStore();

// Rol servisi için computed property
const roleService = computed(() => {
    try {
        return getRoleService();
    } catch (error) {
        console.warn('Rol servisi erişilemedi:', error);
        return null;
    }
});

// Kullanıcının admin olup olmadığını kontrol eden computed değişken
const isAdmin = computed(() => {
    try {
        if (roleService.value) {
            return roleService.value.isAdmin();
        }
    } catch (error) {
        console.warn('Rol servisi ile admin kontrolü yapılamadı:', error);
    }
    return authStore.isAdmin;
});

// Kullanıcının kullanıcı yönetimi izni olup olmadığını kontrol eden computed değişken
const canManageUsers = computed(() => {
    try {
        if (roleService.value) {
            return roleService.value.hasPermission(PermissionType.EDIT_USERS) || 
                   roleService.value.isAdmin();
        }
    } catch (error) {
        console.warn('Rol servisi ile izin kontrolü yapılamadı:', error);
    }
    return authStore.isAdmin;
});

// Tip tanımlamaları
interface User {
    id: string;
    name: string;
    email: string;
    role?: string; // Bu artık ana rol olacak (profiles.roles array'den ilk rol)
    projectRoles?: Array<{ // Bu, user_project_roles tablosundan gelecek
        projectId: string;
        projectName: string;
        role: string; // Proje bazlı rol (örneğin, proje_sorumlusu_kgys)
        isGlobal?: boolean; // Global rol mu proje bazlı rol mü
    }>;
}

interface Project {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    is_active?: boolean;
}

interface Role {
    id: string; // Convert from number to string in processing
    name: string; // Role name like 'admin', 'depo_sorumlusu'
    display_name: string; // Human-readable name mapped from description field
    permissions?: string[];
    description?: string; // Original description from Supabase
    created_at?: string; // Original creation date from Supabase
    role_type?: string; // 'global' or 'project_based'
    requires_project?: boolean; // Whether this role requires a project
}

// Kullanıcı ve proje listesi
const users = ref<User[]>([]);
const projects = ref<Project[]>([]);
const allRoles = ref<Role[]>([]); // Supabase'den çekilecek tüm roller

// Durumlar
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false); // Rol silme durumu
const showRoleModal = ref(false);
const showDeleteRoleModal = ref(false); // Rol silme modal durumu
const selectedUser = ref<User | null>(null);
const correcting = ref(false); // Firebase rolleri düzeltme işlem durumu
const correctionResult = ref<{success: boolean, message: string, details?: string} | null>(null);

// Rol silme için gerekli değişkenler
const roleToDelete = ref<{
    user: User | null;
    role: string;
    projectId: string | null;
    projectName: string | null;
} | null>(null);

// Rol formu
const roleForm = reactive({
    globalRole: '' as string, // Seçilen rolün ID'si veya adı (name alanı)
    selectedProjectId: '' as string,
});

// Proje rolleri haritası - Bu yapı değişebilir veya kaldırılabilir.
// Şimdilik globalRol ve selectedProjectId üzerinden ilerleyeceğiz.
const projectRoleMap = reactive({});

// Proje seçimi gerektiren roller - artık database'de rol_type ile belirleniyor
// Bu sabit liste artık kullanılmayacak, yerine role.requires_project değeri kullanılacak
const projectSelectionRoles = [
    'depo_sorumlusu',
    'depo_kullanicisi', 
    'proje_kullanicisi',
    'proje_admin',
    'proje_sorumlusu'
]; // Referans olması için tutuluyor, artık kullanılmıyor

const showProjectSelection = computed(() => {
    if (!roleForm.globalRole) {
        return false;
    }
    
    // selectedRole'ü allRoles içinde bul
    const selectedRoleObject = allRoles.value.find(r => r.name === roleForm.globalRole);
    
    if (!selectedRoleObject) {
        return false;
    }
    
    // Yeni sistem: requires_project alanına göre karar ver
    const needsProject = selectedRoleObject.requires_project === true;
    
    return needsProject;
});

const onRoleChange = () => {
    // Proje seçimini sıfırla
    roleForm.selectedProjectId = '';
};

// Kullanıcıları yükle
async function loadUsers() {
    try {
        loading.value = true;
        
        // Supabase'den kullanıcı profillerini çek
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');
              if (error) {
            console.error('Kullanıcı profilleri çekilirken hata:', error);
            appStore.showMessage ? appStore.showMessage(`Kullanıcılar yüklenirken hata: ${error.message}`, 'error') : 
                                  alert(`Kullanıcılar yüklenirken hata: ${error.message}`);
            return;
        }

        if (!profiles || profiles.length === 0) {
            users.value = [];
            return;
        }
        
        // Profilleri User tipine dönüştür
        const usersWithRoles = profiles.map(profile => {
            
            // İsim oluşturma - farklı alan isimlerini kontrol et
            let displayName = 'İsimsiz Kullanıcı';
            if (profile.first_name || profile.last_name) {
                displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            } else if (profile.name) {
                displayName = profile.name;
            } else if (profile.full_name) {
                displayName = profile.full_name;
            } else if (profile.email) {
                displayName = profile.email.split('@')[0]; // Email'in @ öncesi kısmını al
            }

            // Email alma - farklı alan isimlerini kontrol et
            let userEmail = '';
            if (profile.email) {
                userEmail = profile.email;
            } else if (profile.user_email) {
                userEmail = profile.user_email;
            }            // Rol alma - profiles.roles array'ini kontrol et
            let userRole = 'user'; // Varsayılan rol
            if (Array.isArray(profile.roles) && profile.roles.length > 0) {
                userRole = profile.roles[0]; // İlk rolü al
            } else if (profile.role) {
                userRole = profile.role; // Fallback olarak role alanını kontrol et
            } else if (profile.user_role) {
                userRole = profile.user_role;
            }            return {
                id: profile.id || profile.user_id,
                email: userEmail,
                name: displayName,
                role: userRole,
                projectRoles: [] // user_project_roles tablosundan yüklenecek
            };
        });
        
        users.value = usersWithRoles;
          // Kullanıcıların proje rollerini yükle
        await loadUserProjectRoles();
        
        if (users.value.length === 0) {
            appStore.showMessage ? appStore.showMessage('Hiç kullanıcı bulunamadı. Profiles tablosunu kontrol edin.', 'warning') : 
                                  alert('Hiç kullanıcı bulunamadı.');
        }
          } catch (error) {
        console.error('Kullanıcı yüklenirken genel hata:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        appStore.showMessage ? appStore.showMessage(`Kullanıcı yükleme hatası: ${errorMessage}`, 'error') : 
                              alert(`Kullanıcı yükleme hatası: ${errorMessage}`);
        users.value = [];
    } finally {
        loading.value = false;
    }
}

// Projeleri yükle
async function loadProjects() {
    try {
        loading.value = true;
        const { data, error } = await supabase.from('projects').select('id, name, description');

        if (error) {
            console.error('Supabase projeler çekilirken hata:', error);
            throw error;
        }        
        projects.value = data || [];
        
        // ProjectStore'u da güncellemek iyi bir pratik olabilir  
        // if (projectStore) {
        //     projectStore.projects = projects.value; // Type mismatch nedeniyle geçici olarak kapatıldı
        //     projectStore.isInitialized = true;
        // }
    } catch (error: any) {
        console.error('Projeler yüklenirken hata:', error);
        appStore.showMessage ? appStore.showMessage('Projeler yüklenirken hata oluştu', 'error') : 
                              alert('Projeler yüklenirken hata oluştu');
        projects.value = []; // Hata durumunda boşalt
    } finally {
        loading.value = false;
    }
}

// Rolleri Supabase'den yükle
async function loadRoles() {
    try {
        // Önce RPC function ile deneyelim
        let data, error;
        try {
            const result = await supabase.rpc('get_roles_for_frontend');
            data = result.data;
            error = result.error;
            
            if (error) {
                console.error('💥 get_roles_for_frontend RPC hatası:', error);
                throw error; // Fallback mekanizması için hatayı fırlat
            }
        } catch (rpcError) {
            console.warn('⚠️ RPC fonksiyonu kullanılamadı, direkt roles tablosuna sorgu yapılıyor');
            
            // RPC fonksiyonu çalışmazsa direkt roles tablosuna sorgu yap
            const tableResult = await supabase.from('roles').select('*');
            data = tableResult.data;
            error = tableResult.error;
            
            if (error) {
                console.error('💥 Roles tablosu erişim hatası:', error);
                throw error;
            }        }

        if (!data || data.length === 0) {
            appStore.showMessage ? 
                appStore.showMessage('Henüz sistemde tanımlı rol bulunmuyor.', 'warning') : 
                alert('Henüz sistemde tanımlı rol bulunmuyor.');
            allRoles.value = [];
            return;
        }
        
        // Veri kaynağına göre işleme stratejisini belirle
        const isRpcResult = data[0] && 'requires_project' in data[0]; // RPC sonucu mu kontrol et
        
        const processedRoles = data.map((role: any, index) => {
            
            const processedRole = {
                id: String(role.id), 
                name: role.name,
                description: role.description,
                // RPC sonucuna göre doğrudan al veya hesapla
                role_type: isRpcResult ? role.role_type : (
                    role.name === 'admin' || role.name.includes('onarim') 
                        ? 'global' 
                        : 'project_based'
                ),
                requires_project: isRpcResult ? role.requires_project : (
                    !(role.name === 'admin' || role.name.includes('onarim'))
                ),                display_name: isRpcResult ? role.display_name : (role.description || role.name),
                permissions: []
            };
            
            return processedRole;
        });

        allRoles.value = processedRoles;
        } catch (error: any) {
        console.error('💥 Roller yüklenirken genel hata:', error);
        console.error('📚 Error stack:', error.stack);
        console.error('🔍 Error detayları:', {
            message: error.message,
            name: error.name,
            cause: error.cause
        });
        
        const errorMessage = `Rol yükleme hatası: ${error.message || error}`;
        appStore.showMessage ? 
            appStore.showMessage(errorMessage, 'error') : 
            alert(errorMessage);
        allRoles.value = [];
    }
}

// Kullanıcı seçimi ve modal açma
async function selectUser(user: User) {
    selectedUser.value = user;
      // Kullanıcının mevcut global rolünü ve proje atamasını yükle
    // 1. Global rolü (profiles.roles array'den ilk rol)
    roleForm.globalRole = user.role || '';

    // 2. Proje atamasını (user_project_roles tablosundan)
    // Bu kısım, kullanıcının proje rollerini nasıl sakladığınıza bağlı olarak değişir.
    // Şimdilik, eğer kullanıcının bir proje rolü varsa ve bu rol proje seçimi gerektiriyorsa,
    // o projeyi seçili hale getirelim.
    roleForm.selectedProjectId = ''; // Önce sıfırla
    if (user.projectRoles && user.projectRoles.length > 0) {
        // Basitlik adına ilk proje rolünü alıyoruz. Gerçek senaryoda daha karmaşık bir mantık gerekebilir.
        const mainProjectRole = user.projectRoles[0];
        const roleDetails = allRoles.value.find(r => r.name === mainProjectRole.role); // Proje rolünün adını kontrol et
        
        if (roleDetails && projectSelectionRoles.includes(roleDetails.name)) {
             // Eğer kullanıcının atanmış bir proje rolü varsa ve bu rol proje seçimi gerektiriyorsa
             // ve kullanıcının bir projesi varsa, onu seçili yap.
             // Bu kısım, user.projectRoles yapınıza göre düzenlenmeli.
             // Örneğin, user.projectRoles içinde { projectId: '...', role: 'depo_sorumlusu' } gibi bir yapı varsa:
            const projectAssignment = user.projectRoles.find(pr => projectSelectionRoles.includes(pr.role));
            if (projectAssignment) {
                roleForm.selectedProjectId = projectAssignment.projectId;
                // Eğer global rol de bu proje rolüyle aynıysa (veya ona işaret ediyorsa) onu da ayarla
                // Bu mantık, global rol ve proje rolü arasındaki ilişkiye göre değişir.
                // Şimdilik, kullanıcının ana rolünü (user.role) formda gösteriyoruz.
                // Proje bazlı roller için ayrı bir mantık gerekebilir.
            }
        }
    }
    
    // Proje rolleri haritasını temizle veya güncelle (eski yapı, kaldırılabilir)
    Object.keys(projectRoleMap).forEach(key => delete projectRoleMap[key]);
    // if (user.projectRoles) {
    //     user.projectRoles.forEach(pr => {
    //         projectRoleMap[pr.projectId] = pr.role;
    //     });
    // }

    showRoleModal.value = true;
}

// Modal kapatma
function closeModal() {
    showRoleModal.value = false;
    selectedUser.value = null;
    roleForm.globalRole = '';
    roleForm.selectedProjectId = '';
}

// Kullanıcı rollerini güncelle
async function updateUserRoles() {
    try {
        saving.value = true;
        
        if (!selectedUser.value) {
            console.error('Seçili kullanıcı bulunamadı.');
            appStore.showMessage('Seçili kullanıcı bulunamadı.', 'error');
            return;
        }
        if (!roleForm.globalRole) {
            appStore.showMessage('Lütfen bir rol seçin.', 'error');
            saving.value = false;
            return;
        }

        const userId = selectedUser.value.id;
        const selectedRoleName = roleForm.globalRole; // Bu, rolün 'name' alanı (örn: 'admin', 'depo_sorumlusu')
        const selectedRoleObject = allRoles.value.find(r => r.name === selectedRoleName);

        if (!selectedRoleObject) {
            appStore.showMessage('Seçilen rol geçerli değil.', 'error');
            saving.value = false;
            return;
        }
        
        // Proje seçimi gerektiren rol için proje ID'si kontrolü
        if (selectedRoleObject.requires_project && !roleForm.selectedProjectId) {
            appStore.showMessage('Bu rol için bir proje seçmelisiniz.', 'warning');
            saving.value = false;
            return;        }        
        // Debug için parametreleri loglayalım
        const rpcParams = {
            p_user_id: userId,
            p_role_name: selectedRoleName,
            p_project_id: selectedRoleObject.requires_project ? roleForm.selectedProjectId : null,
            p_assigned_by: authStore.userInfo?.id || null
        };
        
        // Yeni assign_user_role_smart RPC function'ını kullan
        const { data: assignResult, error: assignError } = await supabase.rpc('assign_user_role_smart', rpcParams);

        if (assignError) {
            console.error('Supabase rol atama hatası:', assignError);
            console.error('Hata detayları:', {
                code: assignError.code,
                details: assignError.details,
                hint: assignError.hint,
                message: assignError.message
            });
            appStore.showMessage(`Rol atama işlemi başarısız oldu: ${assignError.message}`, 'error');
            saving.value = false;
            return;
        }
        
        if (assignResult && assignResult.success) {
            appStore.showMessage(assignResult.message || 'Kullanıcı rolü başarıyla güncellendi', 'success');
        } else {
            const errorMessage = assignResult?.message || 'Rol atama işlemi tamamlanamadı';
            appStore.showMessage(errorMessage, 'error');
            saving.value = false;
            return;
        }
        
        closeModal();
        await loadUsers(); // Kullanıcı listesini yenile
        
    } catch (error: any) {
        console.error('Roller güncellenirken genel hata:', error);
        appStore.showMessage(`Hata: ${error.message || 'Bilinmeyen bir hata oluştu'}`, 'error');
    } finally {
        saving.value = false;
    }
}

// Kullanıcıları yenile
async function refreshUsers() {
    console.log('Kullanıcılar yenileniyor...');
    await loadUsers();
}

// Kullanıcıların proje rollerini yükle
async function loadUserProjectRoles() {
    try {
        console.log('🔄 Kullanıcı proje rolleri yükleniyor...');
        
        const { data, error } = await supabase
            .from('user_project_roles')
            .select(`
                user_id,
                role_name,
                project_id,
                projects (
                    id,
                    name
                )
            `);

        if (error) {
            console.error('❌ Kullanıcı proje rolleri yüklenirken hata:', error);
            throw error;
        }

        console.log('✅ Kullanıcı proje rolleri yüklendi:', data);

        // Her kullanıcı için proje rollerini güncelle
        users.value.forEach(user => {
            const userProjectRoles = data?.filter((role: any) => role.user_id === user.id) || [];
              user.projectRoles = userProjectRoles.map((role: any) => ({
                projectId: role.project_id || 'global',
                projectName: role.project_id ? (role.projects?.name || 'Bilinmeyen Proje') : 'Global',
                role: role.role_name,
                isGlobal: !role.project_id
            }));
        });

        console.log('📊 Güncellenmiş kullanıcılar:', users.value);
        
    } catch (error) {
        console.error('💥 Kullanıcı proje rolleri yüklenirken hata:', error);
        // Hata durumunda proje rolleri boş kalır
    }
}

// Rol silme onay modalını göster
function showDeleteRoleConfirm(user: User, projectRole: any) {
    console.log('👤 Rol silme onayı gösteriliyor:', user, projectRole);
    roleToDelete.value = {
        user,
        role: projectRole.role,
        projectId: projectRole.projectId === 'global' ? null : projectRole.projectId,
        projectName: projectRole.projectName === 'Global' ? null : projectRole.projectName
    };
    showDeleteRoleModal.value = true;
}

// Rol silme modalını kapat
function closeDeleteRoleModal() {
    showDeleteRoleModal.value = false;
    roleToDelete.value = null;
}

// Kullanıcı rolünü sil
async function deleteUserRole() {
    try {
        if (!roleToDelete.value || !roleToDelete.value.user) {
            console.error('Silinecek rol bilgisi bulunamadı.');
            appStore.showMessage('Silinecek rol bilgisi bulunamadı.', 'error');
            return;
        }
        
        deleting.value = true;
        console.log('🗑️ Rol siliniyor:', roleToDelete.value);
        
        const rpcParams = {
            p_user_id: roleToDelete.value.user.id,
            p_role_name: roleToDelete.value.role,
            p_project_id: roleToDelete.value.projectId
        };
        console.log('🔍 RPC parametreleri:', rpcParams);
          // remove_user_project_role RPC fonksiyonunu çağır
        const { data: removeResult, error: removeError } = await supabase.rpc('remove_user_project_role', rpcParams);
        
        if (removeError) {            console.error('Supabase rol silme hatası:', removeError);
            console.error('Hata detayları:', {
                code: removeError.code,
                details: removeError.details,
                hint: removeError.hint,
                message: removeError.message
            });
            let errorMsg = removeError.message;
            
            // Fonksiyon adı hatası durumunda daha açıklayıcı mesaj
            if (removeError.message.includes("function \"remove_user_project_role\" does not exist")) {
                errorMsg = "Rol silme fonksiyonu sistemde bulunamadı. Lütfen sistem yöneticinize başvurun.";
            }
            
            appStore.showMessage(`Rol silme işlemi başarısız oldu: ${errorMsg}`, 'error');
            return;
        }
        
        console.log('Rol silme sonucu:', removeResult);
        
        if (removeResult && removeResult.success) {
            appStore.showMessage(removeResult.message || 'Kullanıcı rolü başarıyla silindi', 'success');
        } else {
            const errorMessage = removeResult?.message || 'Rol silme işlemi başarısız oldu';
            appStore.showMessage(errorMessage, 'error');
            return;
        }
        
        closeDeleteRoleModal();
        await loadUsers(); // Kullanıcı listesini yenile
        
    } catch (error: any) {
        console.error('Rol silinirken genel hata:', error);
        appStore.showMessage(`Hata: ${error.message || 'Bilinmeyen bir hata oluştu'}`, 'error');    } finally {
        deleting.value = false;
    }
}

// Sayfa yüklendiğinde
onMounted(async () => {
    // appStore.setPageTitle('Rol Yönetimi'); // Sayfa başlığını ayarla - appStore'da bu fonksiyon yok
    // Firebase kullanıcı verilerini incele - KALDIRILDI
    // await inspectFirebaseUsers(); 
    
    // Önce rolleri ve projeleri yükle
    await loadRoles();
    await loadProjects();
    
    // Sonra kullanıcıları yükle (kullanıcıların rolleri ve projeleri bu listelere göre çözümlenebilir)
    await loadUsers();
});
</script>
