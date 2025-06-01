<template>
    <div>
        <!-- Ana Panel -->
        <div class="panel">
            <!-- Sayfa Başlığı ve Ana Butonlar -->
            <div class="flex justify-between mb-5">
                <div>
                    <h5 class="font-semibold text-lg dark:text-white-light">Depo Yönetimi</h5>
                    <p class="text-sm text-white-dark mt-1">
                        Ana depolar ve proje depolarınızı yönetin
                    </p>
                </div>
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        class="btn btn-outline-primary"
                        @click="refreshStats"
                        :disabled="loading"
                    >
                        <Icon icon="refresh" class="w-4 h-4 mr-2" />
                        Yenile
                    </button>                    <button 
                        type="button" 
                        class="btn btn-primary"
                        @click="() => {
                            showCreateModal = true;
                        }"
                        v-if="canCreateWarehouse"
                    >
                        <Icon icon="plus" class="w-4 h-4 mr-2" />
                        Yeni Depo
                    </button>
                </div>
            </div>

            <!-- İstatistik Kartları -->
            <div v-if="stats.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div 
                    v-for="(value, key) in stats[0]" 
                    :key="String(key)"
                    class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-white-light dark:border-dark/20"
                >
                    <div class="text-2xl font-bold text-primary">{{ value }}</div>
                    <div class="text-sm text-white-dark">{{ getStatLabel(String(key)) }}</div>
                </div>
            </div>            <!-- Sekme Navigasyonu -->
            <div class="flex flex-wrap border-b border-white-light dark:border-dark/20 mb-6">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    @click="activeTab = tab.key"
                    :class="[
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.key
                            ? 'border-primary text-primary'
                            : 'border-transparent text-white-dark hover:text-primary hover:border-primary/50'
                    ]"
                >
                    <Icon :icon="tab.icon" class="w-4 h-4 mr-2" />
                    {{ tab.label }}
                    <span 
                        v-if="tab.count !== undefined" 
                        class="ml-2 px-2 py-0.5 text-xs rounded-full"
                        :class="activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'"
                    >
                        {{ tab.count }}
                    </span>
                </button>
            </div>            <!-- Ana Depolar Sekmesi İçeriği -->
            <div v-show="activeTab === 'main'" class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h6 class="font-semibold">Ana Depolar</h6>
                    <div class="flex items-center gap-3">                        <!-- Durum Filtresi -->
                        <select 
                            v-model="statusFilter"
                            class="form-select w-40"
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="active">Aktif Depolar</option>
                            <option value="inactive">Pasif Depolar</option>
                        </select>
                        
                        <!-- Görünüm Modu -->
                        <div class="flex rounded-lg border border-white-light dark:border-dark/20 overflow-hidden">
                            <button 
                                @click="viewMode = 'list'"
                                :class="[
                                    'px-3 py-2 text-sm transition-colors',
                                    viewMode === 'list' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-white dark:bg-dark text-gray-600 hover:bg-gray-50 dark:hover:bg-dark/50'
                                ]"
                                title="Liste Görünümü"
                            >
                                <Icon icon="list" class="w-4 h-4" />
                            </button>
                            <button 
                                @click="viewMode = 'grid'"
                                :class="[
                                    'px-3 py-2 text-sm transition-colors',
                                    viewMode === 'grid' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-white dark:bg-dark text-gray-600 hover:bg-gray-50 dark:hover:bg-dark/50'
                                ]"
                                title="Kart Görünümü"
                            >
                                <Icon icon="grid" class="w-4 h-4" />
                            </button>
                        </div>
                          <button 
                            v-if="canSyncWarehouses"
                            @click="syncProjectWarehouses"
                            :disabled="syncing"
                            class="btn btn-outline-success"
                        >
                            <Icon icon="sync" class="w-4 h-4 mr-2" :class="{ 'animate-spin': syncing }" />
                            Senkronize Et
                        </button>
                    </div>
                </div>

                <div v-if="loading" class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-2 border-primary border-l-transparent rounded-full"></div>
                    <p class="mt-2 text-white-dark">Depolar yükleniyor...</p>
                </div>                <div v-else-if="filteredMainWarehouses.length === 0" class="text-center py-8">
                    <Icon icon="warehouse" class="w-16 h-16 mx-auto text-white-dark mb-4" />
                    <p class="text-white-dark">
                        {{ statusFilter === 'active' ? 'Aktif ana depo bulunmuyor' : 
                           statusFilter === 'inactive' ? 'Pasif ana depo bulunmuyor' : 
                           'Henüz ana depo bulunmuyor' }}
                    </p>                    <button 
                        v-if="canCreateWarehouse && statusFilter !== 'inactive'"
                        @click="() => {
                            showCreateModal = true;
                        }"
                        class="btn btn-primary btn-sm mt-4"
                    >
                        İlk Ana Depoyu Oluştur
                    </button>
                </div>                <!-- Liste Görünümü -->
                <div v-else-if="viewMode === 'list'" class="table-responsive">
                    <table class="table-hover">
                        <thead>
                            <tr>
                                <th>Depo Adı</th>
                                <th>Açıklama</th>
                                <th>Durum</th>
                                <th>Oluşturma Tarihi</th>
                                <th class="!text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="warehouse in filteredMainWarehouses" 
                                :key="warehouse.id"
                            >
                                <td>
                                    <div class="flex items-center">
                                        <Icon icon="warehouse" class="w-5 h-5 text-primary mr-3" />
                                        <div>
                                            <div class="font-medium text-gray-900 dark:text-white">{{ warehouse.name }}</div>
                                            <div class="text-sm text-gray-500 dark:text-white-dark">{{ warehouse.id }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {{ warehouse.description || '-' }}
                                </td>
                                <td>
                                    <span 
                                        :class="[
                                            'badge',
                                            warehouse.is_active !== false 
                                                ? 'badge-outline-success'
                                                : 'badge-outline-danger'
                                        ]"
                                    >
                                        {{ warehouse.is_active !== false ? 'Aktif' : 'Pasif' }}
                                    </span>
                                </td>
                                <td>
                                    {{ new Date(warehouse.created_at).toLocaleDateString('tr-TR') }}
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <button 
                                            @click="viewWarehouse(warehouse)"
                                            class="text-primary hover:text-primary/80 transition-colors"
                                            title="Detayları Görüntüle"
                                        >
                                            <Icon icon="eye" class="w-4 h-4" />
                                        </button>
                                        <button 
                                            v-if="canManageWarehouses"
                                            @click="editWarehouse(warehouse)"
                                            class="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Icon icon="edit" class="w-4 h-4" />
                                        </button>
                                        <button 
                                            v-if="canManageWarehouses"
                                            @click="manageWarehouse(warehouse)"
                                            class="text-green-600 hover:text-green-800 transition-colors"
                                            title="Yöneticileri Düzenle"
                                        >
                                            <Icon icon="users" class="w-4 h-4" />
                                        </button>
                                        <button 
                                            v-if="canManageWarehouses"
                                            @click="toggleWarehouseStatus(warehouse)"
                                            :class="[
                                                'transition-colors',
                                                warehouse.is_active !== false 
                                                    ? 'text-red-600 hover:text-red-800' 
                                                    : 'text-green-600 hover:text-green-800'
                                            ]"
                                            :title="warehouse.is_active !== false ? 'Pasif Yap' : 'Aktif Yap'"
                                        >
                                            <Icon :icon="warehouse.is_active !== false ? 'ban' : 'check'" class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Grid Görünümü -->
                <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <WarehouseCard
                        v-for="warehouse in filteredMainWarehouses"
                        :key="warehouse.id"
                        :warehouse="warehouse"
                        :can-manage="canManageWarehouses"
                        @view="viewWarehouse"
                        @edit="editWarehouse"
                        @manage="manageWarehouse"
                        @toggle-status="toggleWarehouseStatus"
                    />
                </div>
            </div>            <!-- Proje Depoları Sekmesi -->
            <div v-show="activeTab === 'project'" class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h6 class="font-semibold">Proje Depoları</h6>
                    <div class="flex items-center gap-3">                        <select 
                            v-model="selectedProjectFilter"
                            @change="filterProjectWarehouses"
                            class="form-select w-40"
                        >
                            <option value="">Tüm Projeler</option>
                            <option 
                                v-for="project in availableProjects" 
                                :key="project.id" 
                                :value="project.id"
                            >
                                {{ project.name }}
                            </option>
                        </select>
                        <!-- Görünüm Modu -->
                        <div class="flex rounded-lg border border-white-light dark:border-dark/20 overflow-hidden">
                            <button 
                                @click="viewModeProject = 'list'"
                                :class="[
                                    'px-3 py-2 text-sm transition-colors',
                                    viewModeProject === 'list' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-white dark:bg-dark text-gray-600 hover:bg-gray-50 dark:hover:bg-dark/50'
                                ]"
                                title="Liste Görünümü"
                            >
                                <Icon icon="list" class="w-4 h-4" />
                            </button>
                            <button 
                                @click="viewModeProject = 'grid'"
                                :class="[
                                    'px-3 py-2 text-sm transition-colors',
                                    viewModeProject === 'grid' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-white dark:bg-dark text-gray-600 hover:bg-gray-50 dark:hover:bg-dark/50'
                                ]"
                                title="Kart Görünümü"
                            >
                                <Icon icon="grid" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="loading" class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-2 border-primary border-l-transparent rounded-full"></div>
                    <p class="mt-2 text-white-dark">Proje depoları yükleniyor...</p>
                </div>

                <div v-else-if="filteredProjectWarehouses.length === 0" class="text-center py-8">
                    <Icon icon="project" class="w-16 h-16 mx-auto text-white-dark mb-4" />
                    <p class="text-white-dark">
                        {{ selectedProjectFilter ? 'Bu proje için depo bulunmuyor' : 'Henüz proje deposu bulunmuyor' }}
                    </p>
                </div>

                <!-- Liste Görünümü (Proje Depoları) -->
                <div v-else-if="viewModeProject === 'list'" class="space-y-4">
                    <div 
                        v-for="(warehouses, projectName) in groupedProjectWarehouses" 
                        :key="projectName"
                        class="border border-white-light dark:border-dark/20 rounded-lg overflow-hidden mb-6"
                    >
                        <div class="bg-gray-50 dark:bg-dark/20 px-4 py-3 border-b border-white-light dark:border-dark/20">
                            <h4 class="font-medium text-primary">{{ projectName }}</h4>
                            <p class="text-sm text-white-dark">{{ warehouses.length }} depo</p>
                        </div>                        <div class="table-responsive">
                            <table class="table-hover">
                                <thead>
                                    <tr>
                                        <th>Depo Adı</th>
                                        <th>Açıklama</th>                                        <th>Durum</th>
                                        <th>Oluşturma Tarihi</th>
                                        <th class="!text-center">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr 
                                        v-for="warehouse in warehouses" 
                                        :key="warehouse.id"
                                    >
                                        <td>
                                            <div class="flex items-center">
                                                <Icon icon="warehouse" class="w-5 h-5 text-primary mr-3" />
                                                <div>
                                                    <div class="font-medium text-gray-900 dark:text-white">{{ warehouse.name }}</div>
                                                    <div class="text-sm text-gray-500 dark:text-white-dark">{{ warehouse.id }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {{ warehouse.description || '-' }}
                                        </td>
                                        <td>
                                            <span 
                                                :class="[
                                                    'badge',
                                                    warehouse.is_active !== false 
                                                        ? 'badge-outline-success'
                                                        : 'badge-outline-danger'
                                                ]"
                                            >
                                                {{ warehouse.is_active !== false ? 'Aktif' : 'Pasif' }}
                                            </span>
                                        </td>
                                        <td>
                                            {{ new Date(warehouse.created_at).toLocaleDateString('tr-TR') }}
                                        </td>
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-2">
                                                <button 
                                                    @click="viewWarehouse(warehouse)"
                                                    class="text-primary hover:text-primary/80 transition-colors"
                                                    title="Detayları Görüntüle"
                                                >
                                                    <Icon icon="eye" class="w-4 h-4" />
                                                </button>
                                                <button 
                                                    v-if="canManageWarehouses"
                                                    @click="editWarehouse(warehouse)"
                                                    class="text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Icon icon="edit" class="w-4 h-4" />
                                                </button>
                                                <button 
                                                    v-if="canManageWarehouses"
                                                    @click="manageWarehouse(warehouse)"
                                                    class="text-green-600 hover:text-green-800 transition-colors"
                                                    title="Yöneticileri Düzenle"
                                                >
                                                    <Icon icon="users" class="w-4 h-4" />
                                                </button>
                                                <button 
                                                    v-if="canManageWarehouses"
                                                    @click="toggleWarehouseStatus(warehouse)"
                                                    :class="[
                                                        'transition-colors',
                                                        warehouse.is_active !== false 
                                                            ? 'text-red-600 hover:text-red-800' 
                                                            : 'text-green-600 hover:text-green-800'
                                                    ]"
                                                    :title="warehouse.is_active !== false ? 'Pasif Yap' : 'Aktif Yap'"
                                                >
                                                    <Icon :icon="warehouse.is_active !== false ? 'ban' : 'check'" class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Grid Görünümü (Proje Depoları) -->
                <div v-else class="space-y-4">
                    <!-- Projeye göre gruplandırılmış depolar -->
                    <div 
                        v-for="(warehouses, projectName) in groupedProjectWarehouses" 
                        :key="projectName"
                        class="border border-white-light dark:border-dark/20 rounded-lg overflow-hidden"
                    >
                        <div class="bg-gray-50 dark:bg-dark/20 px-4 py-3 border-b border-white-light dark:border-dark/20">
                            <h4 class="font-medium text-primary">{{ projectName }}</h4>
                            <p class="text-sm text-white-dark">{{ warehouses.length }} depo</p>
                        </div>
                        <div class="p-4">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <WarehouseCard
                                    v-for="warehouse in warehouses"
                                    :key="warehouse.id"
                                    :warehouse="warehouse"
                                    :can-manage="canManageWarehouses"
                                    :show-project="false"
                                    @view="viewWarehouse"
                                    @edit="editWarehouse"
                                    @manage="manageWarehouse"
                                    @toggle-status="toggleWarehouseStatus"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>            <!-- Yönetilen Depolar Sekmesi -->
            <div v-show="activeTab === 'managed'" class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h6 class="font-semibold">Yönettiğiniz Depolar</h6>
                    <div class="flex items-center gap-3">
                        <!-- Görünüm Modu -->
                        <div class="flex rounded-lg border border-white-light dark:border-dark/20 overflow-hidden">
                            <button 
                                @click="viewModeManaged = 'list'"
                                :class="[
                                    'px-3 py-2 text-sm transition-colors',
                                    viewModeManaged === 'list' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-white dark:bg-dark text-gray-600 hover:bg-gray-50 dark:hover:bg-dark/50'
                                ]"
                                title="Liste Görünümü"
                            >
                                <Icon icon="list" class="w-4 h-4" />
                            </button>                            <button 
                                @click="viewModeManaged = 'grid'"
                                :class="[
                                    'px-3 py-2 text-sm transition-colors',
                                    viewModeManaged === 'grid' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-white dark:bg-dark text-gray-600 hover:bg-gray-50 dark:hover:bg-dark/50'
                                ]"
                                title="Kart Görünümü"
                            >
                                <Icon icon="grid" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="loading" class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-2 border-primary border-l-transparent rounded-full"></div>
                    <p class="mt-2 text-white-dark">Yönetilen depolar yükleniyor...</p>
                </div>

                <div v-else-if="managedWarehouses.length === 0" class="text-center py-8">
                    <Icon icon="user-gear" class="w-16 h-16 mx-auto text-white-dark mb-4" />
                    <p class="text-white-dark">Henüz yönettiğiniz bir depo bulunmuyor</p>
                </div>                <!-- Liste Görünümü (Yönetilen Depolar) -->
                <div v-else-if="viewModeManaged === 'list'" class="table-responsive">
                    <table class="table-hover">
                        <thead>
                            <tr>
                                <th>Depo Adı</th>
                                <th>Açıklama</th>
                                <th>Durum</th>
                                <th>Proje</th>
                                <th>Oluşturma Tarihi</th>
                                <th class="!text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="warehouse in managedWarehouses" 
                                :key="warehouse.id"
                            >
                                <td>
                                    <div class="flex items-center">
                                        <Icon icon="warehouse" class="w-5 h-5 text-primary mr-3" />
                                        <div>
                                            <div class="font-medium text-gray-900 dark:text-white">{{ warehouse.name }}</div>
                                            <div class="text-sm text-gray-500 dark:text-white-dark">{{ warehouse.id }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {{ warehouse.description || '-' }}
                                </td>
                                <td>
                                    <span 
                                        :class="[
                                            'badge',
                                            warehouse.is_active !== false 
                                                ? 'badge-outline-success'
                                                : 'badge-outline-danger'
                                        ]"
                                    >
                                        {{ warehouse.is_active !== false ? 'Aktif' : 'Pasif' }}
                                    </span>
                                </td>
                                <td>
                                    {{ warehouse.project?.name || 'Ana Depo' }}
                                </td>
                                <td>
                                    {{ new Date(warehouse.created_at).toLocaleDateString('tr-TR') }}
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <button 
                                            @click="viewWarehouse(warehouse)"
                                            class="text-primary hover:text-primary/80 transition-colors"
                                            title="Detayları Görüntüle"
                                        >
                                            <Icon icon="eye" class="w-4 h-4" />
                                        </button>
                                        <button 
                                            @click="editWarehouse(warehouse)"
                                            class="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Icon icon="edit" class="w-4 h-4" />
                                        </button>
                                        <button 
                                            @click="manageWarehouse(warehouse)"
                                            class="text-green-600 hover:text-green-800 transition-colors"
                                            title="Yöneticileri Düzenle"
                                        >
                                            <Icon icon="users" class="w-4 h-4" />
                                        </button>
                                        <!-- Pasif/Aktif yapma butonu yönetilen depolarda genellikle olmaz, toggleWarehouseStatus kaldırıldı -->
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Grid Görünümü (Yönetilen Depolar) -->
                <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <WarehouseCard
                        v-for="warehouse in managedWarehouses"
                        :key="warehouse.id"
                        :warehouse="warehouse"
                        :can-manage="true"
                        :is-manager="true"
                        @view="viewWarehouse"
                        @edit="editWarehouse"
                        @manage="manageWarehouse"
                    />
                </div>
            </div>
        </div>

        <!-- Depo Oluşturma Modal -->
        <CreateWarehouseModal
            v-model:show="showCreateModal"
            :main-warehouses="mainWarehouses"
            :available-projects="availableProjects"
            @created="onWarehouseCreated"
        />

        <!-- Depo Düzenleme Modal -->
        <EditWarehouseModal
            v-model:show="showEditModal"
            :warehouse="selectedWarehouse"
            @updated="onWarehouseUpdated"
        />

        <!-- Depo Detay Modal -->
        <WarehouseDetailModal
            v-model:show="showDetailModal"
            :warehouse="selectedWarehouse"
            :can-manage="canManageWarehouses"
            @updated="onWarehouseUpdated"
        />

        <!-- Depo Yöneticileri Modal -->
        <WarehouseManagersModal
            v-model:show="showManagersModal"
            :warehouse="selectedWarehouse"
            @updated="onWarehouseUpdated"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import Icon from '@/components/icon/Icon.vue'
import WarehouseCard from '@/components/warehouse/WarehouseCard.vue'
import CreateWarehouseModal from '@/components/warehouse/CreateWarehouseModal.vue'
import EditWarehouseModal from '@/components/warehouse/EditWarehouseModal.vue'
import WarehouseDetailModal from '@/components/warehouse/WarehouseDetailModal.vue'
import WarehouseManagersModal from '@/components/warehouse/WarehouseManagersModal.vue'
import warehouseService from '@/services/warehouseService'
import type { Warehouse } from '@/services/warehouseService'
import projectService from '@/services/projectService'; // Add this
import type { Project } from '@/services/projectService'; // Add this
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const toast = useToast()

// State
const loading = ref(false)
const syncing = ref(false)
const activeTab = ref('main')
const selectedProjectFilter = ref('')
const statusFilter = ref('all') // Ana depolar için durum filtresi
const viewMode = ref('list') // Ana depolar için görünüm modu
const viewModeProject = ref('grid') // Proje depoları için görünüm modu
const viewModeManaged = ref('grid') // Yönetilen depolar için görünüm modu

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showManagersModal = ref(false)
const selectedWarehouse = ref<Warehouse | null>(null)

// Data
const mainWarehouses = ref<Warehouse[]>([])
const projectWarehouses = ref<Warehouse[]>([])
const managedWarehouses = ref<Warehouse[]>([])
const stats = ref<any[]>([])
const availableProjects = ref<Project[]>([]) // Update type

// Computed
const canCreateWarehouse = computed(() => {
    return authStore.userInfo?.roles?.includes('admin') ||
           (authStore.userInfo?.roles && authStore.userInfo.roles.includes('admin'))
})

const canManageWarehouses = computed(() => {
    return authStore.userInfo?.roles?.includes('admin') ||
           (authStore.userInfo?.roles && authStore.userInfo.roles.includes('admin'))
})

const canSyncWarehouses = computed(() => {
    return canManageWarehouses.value
})

const tabs = computed(() => [
    {
        key: 'main',
        label: 'Ana Depolar',
        icon: 'warehouse',
        count: mainWarehouses.value.length
    },
    {
        key: 'project',
        label: 'Proje Depoları',
        icon: 'project',
        count: projectWarehouses.value.length
    },
    {
        key: 'managed',
        label: 'Yönetilen Depolar',
        icon: 'user-gear',
        count: managedWarehouses.value.length
    }
])

const filteredProjectWarehouses = computed(() => {
    if (!selectedProjectFilter.value) {
        return projectWarehouses.value
    }
    return projectWarehouses.value.filter(w => w.project_id === selectedProjectFilter.value)
})

const filteredMainWarehouses = computed(() => {
    let filtered = mainWarehouses.value
    
    // Durum filtreleme
    if (statusFilter.value === 'active') {
        filtered = filtered.filter(w => w.is_active !== false)
    } else if (statusFilter.value === 'inactive') {
        filtered = filtered.filter(w => w.is_active === false)
    }
    
    return filtered
})

const groupedProjectWarehouses = computed(() => {
    const grouped: Record<string, Warehouse[]> = {}
    
    filteredProjectWarehouses.value.forEach(warehouse => {
        const projectName = warehouse.project?.name || 'Proje Belirtilmemiş'
        if (!grouped[projectName]) {
            grouped[projectName] = []
        }
        grouped[projectName].push(warehouse)
    })
    
    return grouped
})

// Methods
const getStatLabel = (key: string): string => {
    const labels: Record<string, string> = {
        warehouse_count: 'Toplam Depo',
        main_warehouse_count: 'Ana Depo',
        project_warehouse_count: 'Proje Deposu', 
        active_managers_count: 'Aktif Yönetici',
        warehouses_with_managers: 'Yöneticili Depo'
    }
    return labels[key] || key
}

const loadData = async () => {
    loading.value = true
    try {
        await Promise.all([
            loadMainWarehouses(),
            loadProjectWarehouses(),
            loadManagedWarehouses(),
            loadStats(),
            loadAvailableProjects() // Add this call
        ])
    } finally {
        loading.value = false
    }
}

const loadMainWarehouses = async () => {
    const { data, error } = await warehouseService.getMainWarehouses()
    if (error) {
        toast.error('Ana depolar yüklenirken hata oluştu: ' + error.message)
    } else {
        mainWarehouses.value = data || []
    }
}

const loadProjectWarehouses = async () => {
    const { data, error } = await warehouseService.getProjectWarehouses()
    if (error) {
        toast.error('Proje depoları yüklenirken hata oluştu: ' + error.message)
    } else {
        projectWarehouses.value = data || []
        // REMOVED: Logic to extract projects from warehouses
    }
}

const loadAvailableProjects = async () => {    try {
        const projects = await projectService.getAllProjects();
        availableProjects.value = projects || [];
    } catch (error) {
        toast.error('Kullanılabilir projeler yüklenirken hata oluştu: ' + (error as Error).message);
        availableProjects.value = [];
        console.error('[warehouse-management] Error loading available projects:', error);
    }
};

const loadManagedWarehouses = async () => {
    const { data, error } = await warehouseService.getUserManagedWarehouses()
    if (error) {
        console.error('Yönetilen depolar yüklenirken hata:', error)
    } else {
        managedWarehouses.value = data || []
    }
}

const loadStats = async () => {
    const { data, error } = await warehouseService.getWarehouseStats()
    if (error) {
        console.error('İstatistikler yüklenirken hata:', error)
    } else {
        // Fonksiyon TABLE döndürdüğü için data bir array olacak, ilk elemanı al
        stats.value = data && data.length > 0 ? data[0] : {}
    }
}

const refreshStats = async () => {
    await loadData()
    toast.success('Veriler yenilendi')
}

const syncProjectWarehouses = async () => {
    syncing.value = true
    try {
        // const { data, error } = await warehouseService.syncProjectWarehouses() // Bu fonksiyon warehouseService.ts içinde yok
        // if (error) {
        //     toast.error('Senkronizasyon hatası: ' + error.message)
        // } else {
        //     toast.success('Proje depoları senkronize edildi: ' + data)
        //     await loadData()
        // }
        toast.info('Proje depoları senkronizasyon fonksiyonu henüz tanımlanmamış.');
    } finally {
        syncing.value = false
    }
}

const filterProjectWarehouses = () => {
    // Filtreleme computed property'de yapılıyor
}

const viewWarehouse = (warehouse: Warehouse) => {
    selectedWarehouse.value = warehouse
    showDetailModal.value = true
}

const editWarehouse = (warehouse: Warehouse) => {
    selectedWarehouse.value = warehouse
    showEditModal.value = true
}

const manageWarehouse = (warehouse: Warehouse) => {
    selectedWarehouse.value = warehouse
    showManagersModal.value = true
}

const toggleWarehouseStatus = async (warehouse: Warehouse) => {
    try {
        const newStatus = !warehouse.is_active;
        const { error } = await warehouseService.updateWarehouse(warehouse.id, { is_active: newStatus });
            
        if (error) {
            toast.error('Depo durumu güncellenirken hata oluştu: ' + error.message)
        } else {
            toast.success(`Depo ${newStatus ? 'aktive' : 'deaktive'} edildi`)
            await loadData() // Veriyi yeniden yükle ve UI'ı güncelle
        }
    } catch (error) {
        toast.error('Beklenmeyen hata oluştu')
    }
}

const onWarehouseCreated = (warehouse: Warehouse) => {
    toast.success('Depo başarıyla oluşturuldu')
    loadData()
}

const onWarehouseUpdated = (warehouse: Warehouse) => {
    toast.success('Depo başarıyla güncellendi')
    loadData()
}

// Lifecycle
onMounted(() => {
    loadData()
})
</script>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
