<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Anasayfa</a>
            </li>
            
        </ul>

        <div class="pt-5">
            <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <!-- ÜRÜN STOKLARI - 2 SÜTUNLU -->
              <div class="panel p-4">
                <h6 class="font-semibold mb-2">Ürün Stokları</h6>
                <div v-if="productStocks && productStocks.length > 0" class="text-sm">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-1">Ürün</th>
                        <th class="text-right py-1">Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(category, i) in productStocks" :key="i" class="mb-3">
                        <td class="py-1 truncate max-w-[120px]" :title="category.subCategory">{{ category.subCategory }}</td>
                        <td class="py-1 text-right font-bold text-danger truncate max-w-[80px]" :title="category.total.toString()">{{ category.total }}</td>
                        <div v-if="category.products.length > 10">
                        </div>
                        <div v-if="category.products.length > 20" class="italic text-xs text-right mt-1">
                        ... daha fazla (toplam {{ category.products.length }} ürün)
                        </div>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="flex items-center justify-center h-40 text-gray-500 italic">
                  Görüntülenecek stok verisi bulunamadı.
                </div>
              </div>
              <!-- KRİTİK STOK ÜRÜNLER -->
              <div class="panel p-4">
                <h6 class="font-semibold mb-2">Kritik Stok</h6>
                <div class="text-sm">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-1">Ürün</th>
                        <th class="text-center py-1">Miktar</th>
                        <th class="text-right py-1">Depo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, i) in lowStockProducts.slice(0, 7)" :key="i" class="border-b border-gray-100">
                        <td class="py-1 truncate max-w-[120px]" :title="item.name">{{ item.name }}</td>
                        <td class="py-1 text-center font-bold text-danger">{{ item.quantity }}</td>
                        <td class="py-1 text-right truncate max-w-[80px]" :title="item.warehouse">{{ item.warehouse }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- SON 5 HAREKET -->
              <div class="panel p-4">
                <h6 class="font-semibold mb-2">Son 5 Hareket</h6>
                <div class="text-sm">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-1">Hareket</th>
                        <th class="text-center py-1">Ürün Adı</th>
                        <th class="text-right py-1">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="m in movementsList" :key="m.id" class="border-b border-gray-100">
                        <td class="py-1 truncate max-w-[120px]" :title="m.type">{{ m.type === 'in' ? 'Giriş' : m.type === 'out' ? 'Çıkış' : 'Transfer' }}</td>
                        <td class="py-1 text-center font-bold text-danger">{{ getProductName(m.productId) }}</td>
                        <td class="py-1 text-right truncate max-w-[80px]" :title="m.date">{{ new Date(m.date).toLocaleDateString('tr-TR') }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="grid xl:grid-cols-3 gap-6 mb-6">
                <div class="panel h-full xl:col-span-2">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Arıza-Onarım İstatistikleri</h5>
                        <div class="dropdown ltr:ml-auto rtl:mr-auto">
                            <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                                <a href="javascript:;">
                                    <icon-horizontal-dots class="text-black/70 dark:text-white/70 hover:!text-primary" />
                                </a>
                                <template #content="{ close }">
                                    <ul @click="close()">
                                        <li>
                                            <a href="javascript:;" @click="filterFaultData('month')">Aylık Görünüm</a>
                                        </li>
                                        <li>
                                            <a href="javascript:;" @click="filterFaultData('quarter')">Çeyreklik Görünüm</a>
                                        </li>
                                        <li>
                                            <a href="javascript:;" @click="filterFaultData('year')">Yıllık Görünüm</a>
                                        </li>
                                    </ul>
                                </template>
                            </Popper>
                        </div>
                    </div>
                    <p class="text-lg dark:text-white-light/90">
                        <span class="mr-4">Toplam Arıza: <span class="text-danger ml-1">{{ arizaSayisi }}</span></span>
                        <span>Toplam Onarım: <span class="text-success ml-1">{{ onarimSayisi }}</span></span>
                        <span class="ml-4 text-sm text-gray-500 italic">
                            {{ 
                                chartPeriod === 'month' ? `${new Date().getFullYear()} yılına ait` : 
                                chartPeriod === 'quarter' ? `${new Date().getFullYear()} yılı çeyrekleri` : 
                                `Son 5 yıl (${new Date().getFullYear()-4} - ${new Date().getFullYear()})` 
                            }}
                        </span>
                    </p>
                    <div class="relative">
                        <apexchart height="325" :options="revenueChart" :series="arizaOnarimSeries" class="bg-white dark:bg-black rounded-lg overflow-hidden">
                            <!-- loader -->
                            <div v-if="loading" class="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span
                                    class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"
                                ></span>
                            </div>
                        </apexchart>
                    </div>
                </div>

                <div class="panel h-full">
                    <div class="flex items-center mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Alt Kategorilere Göre Stoklar</h5>
                    </div>
                    <div>
                        <apexchart
                            height="460"
                            :options="subCategoryChart"
                            :series="subcategorySeries"
                            class="bg-white dark:bg-black rounded-lg overflow-hidden"
                        >
                            <!-- loader -->
                            <div class="min-h-[460px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span
                                    class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"
                                ></span>
                            </div>
                        </apexchart>
                    </div>
                </div>
            </div> <!-- end of Sales By Category grid -->

            <!-- Depo Doluluk Oranı ve Ürün Detay Tablosu -->
            <div class="grid grid-cols-5 gap-6 mb-6">
              <div class="panel h-full col-span-2">
                <div class="flex items-center mb-5">
                  <h5 class="font-semibold text-lg dark:text-white-light">Depo Doluluk Oranı</h5>
                </div>
                <p class="text-sm mb-4 text-gray-500">Her bir deponun toplam stok sayısına göre oransal dağılımı</p>
                <apexchart
                  height="380"
                  type="donut"
                  :options="warehouseChartOptions"
                  :series="warehouseChartSeries"
                  class="bg-white dark:bg-black rounded-lg overflow-hidden"
                >
                  <div class="min-h-[380px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                    <span class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"></span>
                  </div>
                </apexchart>
              </div>
              <div class="panel p-4 col-span-3">
                <h5 class="font-semibold mb-4 dark:text-white-light">Ürün Bazlı Detaylı Tablo</h5>
                <div class="flex gap-2 mb-4">
                  <input
                    v-model="searchTerm"
                    type="text"
                    placeholder="Ara..."
                    class="flex-1 p-2 border rounded"
                  />
                  <select v-model="categoryFilter" class="p-2 border rounded">
                    <option value="">Tüm Kategoriler</option>
                    <option v-for="cat in categoriesList" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
                <div class="overflow-auto">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th class="px-2 py-1 text-left">Kod</th>
                        <th class="px-2 py-1 text-left">Ürün Adı</th>
                        <th class="px-2 py-1 text-left">Kategori</th>
                        <th class="px-2 py-1 text-right">Stok</th>
                        <th class="px-2 py-1 text-right">Min. Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="prod in filteredProducts" :key="prod.id" class="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <td class="px-2 py-1">{{ prod.code }}</td>
                        <td class="px-2 py-1">{{ prod.name }}</td>
                        <td class="px-2 py-1">{{ prod.category.name }}</td>
                        <td class="px-2 py-1 text-right">{{ prod.totalStock }}</td>
                        <td class="px-2 py-1 text-right">{{ prod.minStockLevel }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <div class="panel h-full sm:col-span-2 xl:col-span-1">
                    <div class="flex items-center mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">
                            Günlük Arızaya Gönderilen Ürünler <span class="block text-white-dark text-sm font-normal">Detaylı bilgi için sütunlara bakın.</span>
                        </h5>
                        <div class="ltr:ml-auto rtl:mr-auto relative">
                            <div class="w-11 h-11 text-danger bg-[#ffe5e5] dark:bg-danger dark:text-[#ffe5e5] grid place-content-center rounded-full">
                                <icon-alert-circle />
                            </div>
                        </div>
                    </div>
                    <div>
                        <apexchart height="160" :options="dailySales" :series="dailySalesSeries" class="bg-white dark:bg-black rounded-lg overflow-hidden">
                            <!-- loader -->
                            <div class="min-h-[175px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span
                                    class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"
                                ></span>
                            </div>
                        </apexchart>
                    </div>
                </div>           
                <div class="panel h-full sm:col-span-2 xl:col-span-2 pb-0">
                    <h5 class="font-semibold text-lg dark:text-white-light mb-5">Son Hareketler</h5>

                    <perfect-scrollbar
                         :options="{
                             swipeEasing: true,
                             wheelPropagation: false,
                         }"
                         class="relative mb-4 h-[290px] ltr:pr-3 rtl:pl-3 ltr:-mr-3 rtl:-ml-3">
                        <template v-for="m in movementsList" :key="m.id">
                            <div class="grid grid-cols-[auto_1fr_auto_auto] items-center py-1.5 gap-2">
                                <div :class="`w-1.5 h-1.5 rounded-full ${m.type==='in'?'bg-success':m.type==='out'?'bg-danger':'bg-warning'}`"></div>
                                <div class="truncate">
                                    {{ m.type==='in' ? 'Giriş' : m.type==='out' ? 'Çıkış' : 'Transfer' }}: {{ getProductName(m.productId) }}
                                </div>
                                <div class="text-xs text-white-dark dark:text-gray-500 text-center whitespace-nowrap">
                                    {{ new Date(m.date).toLocaleDateString('tr-TR') }} {{ new Date(m.date).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) }}
                                </div>
                                <span :class="`badge badge-outline-${m.type==='in'?'success':m.type==='out'?'danger':'warning'} text-xs`">
                                    {{ m.type==='in'?'Giriş':m.type==='out'?'Çıkış':'Transfer' }}
                                </span>
                            </div>
                        </template>
                    </perfect-scrollbar>
                    <div class="border-t border-white-light dark:border-white/10">
                        <a href="javascript:;" class="font-semibold group hover:text-primary p-4 flex items-center justify-center group">
                            Tümünü Gör
                            <icon-arrow-left
                                class="rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition duration-300 ltr:ml-1 rtl:mr-1"
                            />
                        </a>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="panel h-full w-full">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">En Son Arızalı Ürün Gönderen Depolar</h5>
                    </div>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th class="ltr:rounded-l-md rtl:rounded-r-md">Depo</th>
                                    <th>Arızalı Ürün</th>
                                    <th>Seri No</th>
                                    <th>Gönderim Tarihi</th>
                                    <th class="ltr:rounded-r-md rtl:rounded-l-md">Durumu</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in latestFaultyProducts" :key="index" class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="min-w-[150px] text-black dark:text-white">
                                        <div class="flex items-center">
                                            <span :class="`w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 ${getDepoColorClass(item.senderWarehouseId)} grid place-content-center font-semibold`">{{ getDepoInitial(item.senderWarehouseId) }}</span>
                                            <span class="whitespace-nowrap">{{ getDepoName(item.senderWarehouseId) }}</span>
                                        </div>
                                    </td>
                                    <td :class="getItemColorClass(index)">{{ getUrunName(item.productId) }}</td>
                                    <td>{{ item.serialNumber }}</td>
                                    <td>{{ formatTarih(item.sendDate) }}</td>
                                    <td><span :class="`badge ${getDurumClass(item.status)} shadow-md dark:group-hover:bg-transparent`">{{ item.status }}</span></td>
                                </tr>
                                <tr v-if="!latestFaultyProducts || latestFaultyProducts.length === 0" class="text-center">
                                    <td colspan="5" class="py-4 text-gray-500">Arızalı ürün kaydı bulunamadı.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="panel h-full w-full">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">En Çok Arızalı Ürün Bulunan Depo</h5>
                    </div>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr class="border-b-0">
                                    <th class="ltr:rounded-l-md rtl:rounded-r-md">Depo</th>
                                    <th class="ltr:rounded-r-md rtl:rounded-l-md">Arızalı Ürün Sayısı</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in mostFaultyWarehouses" :key="index" class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="min-w-[150px] text-black dark:text-white">
                                        <div class="flex">
                                            <span :class="`w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 ${getDepoColorClass(item.warehouseId)} grid place-content-center font-semibold`">{{ getDepoInitial(item.warehouseId) }}</span>
                                            <p class="whitespace-nowrap">{{ item.name }}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span :class="`badge badge-outline-${index === 0 ? 'danger' : index === 1 ? 'warning' : index === 2 ? 'info' : 'success'} text-sm`">
                                            {{ item.count }} ürün
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="!mostFaultyWarehouses || mostFaultyWarehouses.length === 0" class="text-center">
                                    <td colspan="2" class="py-4 text-gray-500">Arızalı ürün kaydı bulunamadı.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>    import { ref, computed, onMounted } from 'vue';
    import apexchart from 'vue3-apexcharts';
    
    import { useAppStore } from '@/stores/index';
    import { useInventoryStore } from '@/stores/inventory';
    import { useAuthStore } from '@/stores/auth-store';
    import { useArizaStore } from '@/stores/ariza-store';
    import type { FaultyProductRecord } from '@/stores/ariza-store';
    import { Timestamp } from 'firebase/firestore';
    const inventoryStore = useInventoryStore();
    const authStore = useAuthStore();
    const arizaStore = useArizaStore();
    
    onMounted(async () => {
        try {
            console.log('Dashboard yükleniyor...');
            
            // Store'ları başlat
            if (!inventoryStore.isInitialized) {
                console.log('Envanter deposu başlatılıyor...');
                await inventoryStore.initializeStore();
                console.log('Envanter deposu başlatıldı.');
            } else {
                console.log('Envanter deposu zaten başlatılmış.');
            }
            
            // Arıza deposunu başlat
            console.log('Arıza deposu verilerini yüklüyoruz...');
            await arizaStore.initializeStore();
            console.log(`Arıza deposu başlatıldı. ${arizaStore.getFaultyProducts.length} adet arızalı ürün verisi yüklendi.`);
            
            // Arıza verilerini gerçek verilerle doldur
            await loadRealFaultData();
            console.log('Arıza-Onarım istatistikleri yüklendi.');
            
            // Günlük arıza verilerini yükle
            await loadDailyFaultStats();
            console.log('Günlük arıza istatistikleri yüklendi.');
            
            // Stok verilerini kontrol et
            console.log('Stoklar:', inventoryStore.stocks.length);
            console.log('Ürünler:', inventoryStore.getProducts.length);
            console.log('Depolar:', inventoryStore.getWarehouses.length);
            
            // Depo kullanıcıları için filtrelerin çalışıp çalışmadığını kontrol et
            if (!isAdminUser.value && authorizedDepot.value) {
                console.log('Depo kullanıcısı için filtre: Yetkili Depo =', authorizedDepot.value);
                const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
                
                if (depoObj) {
                    console.log(`Depo bulundu: ${depoObj.name} (ID: ${depoObj.id})`);
                    const depoStocks = inventoryStore.stocks.filter(s => s.warehouseId === depoObj.id);
                    console.log(`${depoObj.name} deposunda ${depoStocks.length} adet stok kaydı var.`);
                } else {
                    console.warn('Depo bulunamadı:', authorizedDepot.value);
                }
            }
            
            // Kartlardaki veri durumunu kontrol et - kısa bir gecikme ile yap ki computed'lar güncellensin
            setTimeout(() => {
                console.log('Alt kategoriler:', productStocks.value);
                console.log('Kritik stok ürünleri:', lowStockProducts.value);
                console.log('Son hareketler:', movementsList.value);
                
                // Veriler boşsa uyarı ver
                if (!productStocks.value || productStocks.value.length === 0) {
                    console.warn('Alt kategoriler verisinde değer bulunamadı. Hesaplama fonksiyonunu kontrol et!');
                }
                
                if (!lowStockProducts.value || lowStockProducts.value.length === 0) {
                    console.warn('Kritik stok ürünleri bulunamadı, ancak bu normal olabilir.');
                }
            }, 500);
        } catch (error) {
            console.error('Veriler yüklenirken hata oluştu:', error);
        }
    });
    
    // auth store için rol ve depo filtreleme
    const isAdminUser = computed(() => authStore.isAdmin);
    const authorizedDepot = computed(() => authStore.getAuthorizedDepot);

    const store = useAppStore();

    // revenue
    const revenueChart = computed(() => {
        const isDark = store.theme === 'dark' || store.isDarkMode ? true : false;
        const isRtl = store.rtlClass === 'rtl' ? true : false;

        return {
            chart: {
                height: 325,
                type: 'area',
                fontFamily: 'Nunito, sans-serif',
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                curve: 'smooth',
                width: 2,
                lineCap: 'square',
            },
            dropShadow: {
                enabled: true,
                opacity: 0.2,
                blur: 10,
                left: -7,
                top: 22,
            },
            colors: isDark ? ['#e7515a', '#8dbf42'] : ['#e7515a', '#8dbf42'], // Kırmızı: arıza, Yeşil: onarım
            markers: {
                discrete: [
                    {
                        seriesIndex: 0,
                        dataPointIndex: 6,
                        fillColor: '#e7515a',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                    {
                        seriesIndex: 1,
                        dataPointIndex: 5,
                        fillColor: '#8dbf42',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                ],
            },
            labels: chartLabels.value,
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                crosshairs: {
                    show: true,
                },
                labels: {
                    offsetX: isRtl ? 2 : 0,
                    offsetY: 5,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-xaxis-title',
                    },
                },
            },
            yaxis: {
                tickAmount: 7,
                labels: {
                    formatter: (value: number) => {
                        return Math.round(value).toString();
                    },
                    offsetX: isRtl ? -30 : -10,
                    offsetY: 0,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-yaxis-title',
                    },
                },
                opposite: isRtl ? true : false,
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
                strokeDashArray: 5,
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
                yaxis: {
                    lines: {
                        show: false,
                    },
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '16px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5,
                },
            },
            tooltip: {
                marker: {
                    show: true,
                },
                x: {
                    show: false,
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: isDark ? 0.19 : 0.28,
                    opacityTo: 0.05,
                    stops: isDark ? [100, 100] : [45, 100],
                },
            },
        };
    });

    // Arıza Onarım grafiği için veri serisi
    const arizaOnarimSeries = ref([
        {
            name: 'Arızaya Gönderilen',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Boş veri, gerçek veri loadRealFaultData tarafından doldurulacak
        },
        {
            name: 'Onarımdan Gelen',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Boş veri, gerçek veri loadRealFaultData tarafından doldurulacak
        },
    ]);
    
    // Arıza ve Onarım sayıları (toplam)
    const arizaSayisi = computed(() => {
        return arizaOnarimSeries.value[0].data.reduce((sum, value) => sum + value, 0);
    });
    
    const onarimSayisi = computed(() => {
        return arizaOnarimSeries.value[1].data.reduce((sum, value) => sum + value, 0);
    });

    // sales by category
    const salesByCategory = computed(() => {
        const isDark = store.theme === 'dark' || store.isDarkMode ? true : false;
        return {
            chart: {
                type: 'donut',
                height: 460,
                fontFamily: 'Nunito, sans-serif',
            },
            dataLabels: {
                enabled: true,
                formatter: (val: number, opts: any) => {
                    const totals = opts.w.globals.seriesTotals;
                    const totalAll = totals.reduce((a: number, b: number) => a + b, 0);
                    return ((val / totalAll) * 100).toFixed(0) + '%';
                }
            },
            stroke: {
                show: true,
                width: 25,
                colors: isDark ? '#0e1726' : '#fff',
            },
            colors: isDark ? ['#5c1ac3', '#e2a03f', '#e7515a', '#e2a03f'] : ['#e2a03f', '#5c1ac3', '#e7515a'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                height: 50,
                offsetY: 20,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '29px',
                                offsetY: -10,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                color: isDark ? '#bfc9d4' : undefined,
                                offsetY: 16,
                                formatter: (val: any) => {
                                    return val;
                                },
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                color: '#888ea8',
                                fontSize: '29px',
                                formatter: (w: any) => {
                                    return w.globals.seriesTotals.reduce(function (a: any, b: any) {
                                        return a + b;
                                    }, 0);
                                },
                            },
                        },
                    },
                },
            },
            labels: inventoryStore.getCategories.map(c => c.name),
            states: {
                hover: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
                active: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
            },
        };
    });

    const salesByCategorySeries = computed(() =>
        inventoryStore.getCategories.map(c => {
            let products = inventoryStore.getProducts.filter(p => p.categoryId === c.id);
            
            // Eğer admin değilse ve yetkili depo varsa, sadece o depoya ait ürünleri göster
            if (!isAdminUser.value && authorizedDepot.value) {
                products = products.filter(p => 
                    inventoryStore.getStocksByWarehouseId(authorizedDepot.value!)
                        .some(s => s.productId === p.id)
                );
            }
            
            return products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
        })
    );

    // daily sales
    const dailySales = computed(() => {
        const isDark = store.theme === 'dark' || store.isDarkMode ? true : false;
        return {
            chart: {
                height: 160,
                type: 'bar',
                fontFamily: 'Nunito, sans-serif',
                toolbar: {
                    show: false,
                },
                stacked: true,
                stackType: '100%',
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 1,
            },
            colors: ['#e7515a', '#e0e6ed'],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: {
                            position: 'bottom',
                            offsetX: -10,
                            offsetY: 0,
                        },
                    },
                },
            ],
            xaxis: {
                labels: {
                    show: true,
                    style: {
                        fontSize: '10px',
                        fontWeight: 'bold',
                    },
                },
                categories: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
                axisTicks: {
                    show: false,
                },
                axisBorder: {
                    show: false,
                },
            },
            yaxis: {
                show: false,
            },
            tooltip: {
                y: {
                    formatter: (val) => {
                        return `${val} Ürün`;
                    },
                },
                x: {
                    formatter: (val) => {
                        return `${val} günü`;
                    },
                },
            },
            fill: {
                opacity: 1,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '25%',
                },
            },
            legend: {
                show: false,
            },
            grid: {
                show: false,
                xaxis: {
                    lines: {
                        show: false,
                    },
                },
                padding: {
                    top: 10,
                    right: -20,
                    bottom: -20,
                    left: -20,
                },
            },
        };
    });

    const dailySalesSeries = ref([
        {
            name: 'Arızaya Gönderilen Ürün',
            data: [6, 8, 5, 10, 7, 12, 4],
        },
        {
            name: 'Geçen Hafta',
            data: [3, 5, 7, 6, 4, 9, 2],
        },
    ]);

    // total orders
    const totalOrders = computed(() => {
        const isDark = store.theme === 'dark' || store.isDarkMode ? true : false;
        return {
            chart: {
                height: 290,
                type: 'area',
                fontFamily: 'Nunito, sans-serif',
                sparkline: {
                    enabled: true,
                },
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            colors: isDark ? ['#00ab55'] : ['#00ab55'],
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            yaxis: {
                min: 0,
                show: false,
            },
            grid: {
                padding: {
                    top: 125,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            fill: {
                opacity: 1,
                type: 'gradient',
                gradient: {
                    type: 'vertical',
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: 0.3,
                    opacityTo: 0.05,
                    stops: [100, 100],
                },
            },
            tooltip: {
                x: {
                    show: false,
                },
            },
        };
    });

    const totalOrdersSeries = ref([
        {
            name: 'Sales',
            data: [28, 40, 36, 52, 38, 60, 38, 52, 36, 40],
        },
    ]);

    // Alt kategorilere göre stoklar grafiği - Gerçek veriler
    const subCategoryItems = computed(() => {
        if (!productStocks.value) return [];
        return productStocks.value.filter(item => item && item.total > 0);
    });
    
    const subcategoryLabels = computed(() => {
        // productStocks'dan sadece alt kategori isimlerini alıyoruz
        return subCategoryItems.value.map(item => item.subCategory || 'Diğer');
    });
    
    const subcategorySeries = computed(() => {
        // productStocks'dan sadece toplam değerleri alıyoruz
        if (subCategoryItems.value.length === 0) return [0]; 
        return subCategoryItems.value.map(item => item.total);
    });
    
    const subCategoryChart = computed(() => {
        const isDark = store.theme === 'dark' || store.isDarkMode ? true : false;
        return {
            chart: {
                type: 'donut',
                height: 460,
                fontFamily: 'Nunito, sans-serif',
                events: {
                    mounted: (chart) => {
                        // Grafik yüklendikten sonra doğru yüzdeleri gösterdiğinden emin ol
                        chart.windowResizeHandler();
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: (val: number, opts: any) => {
                    // Toplam hesaplanarak yüzde elde ediliyor
                    const totals = opts.w.globals.seriesTotals;
                    const totalAll = totals.reduce((a: number, b: number) => a + b, 0);
                    // Yüzde değerini hesapla ve iki basamağa yuvarla
                    return totalAll > 0 ? Math.round((val / totalAll) * 100) + '%' : '0%';
                },
                style: {
                    fontSize: '14px',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 'bold'
                }
            },
            colors: isDark ? 
                ['#5c1ac3', '#e2a03f', '#e7515a', '#8dbf42', '#1abc9c', '#3498db'] : 
                ['#e2a03f', '#5c1ac3', '#e7515a', '#8dbf42', '#1abc9c', '#3498db'],
            stroke: {
                width: 2,
                colors: [isDark ? '#0e1726' : '#fff']
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px'
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '22px',
                                formatter: (val) => val
                            },
                            value: {
                                show: true,
                                fontSize: '20px',
                                formatter: (val) => val
                            },
                            total: {
                                show: true,
                                label: 'Toplam',
                                color: '#888ea8',
                                fontSize: '22px',
                                formatter: (w: any) => {
                                    try {
                                        return w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0);
                                    } catch (e) {
                                        console.error('Toplam hesaplama hatası:', e);
                                        return 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            labels: subcategoryLabels.value.length > 0 ? subcategoryLabels.value : ['Veri Yok'],
            noData: {
                text: 'Veri bulunamadı',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: isDark ? '#bfc9d4' : '#000000',
                    fontSize: '14px',
                    fontFamily: 'Nunito, sans-serif'
                }
            }
        };
    });

    // Son hareketler verisi ve yardımcı fonksiyonlar
    const movementsList = computed(() => {
        // Önce tüm hareketleri al
        let allMovements = inventoryStore.getProjectMovements;
        
        if (!allMovements || allMovements.length === 0) {
            console.warn('Hareket verisi bulunamadı');
            return [];
        }
        
        // Depo kullanıcısı için filtreleme yap
        if (!isAdminUser.value && authorizedDepot.value) {
            // Depo ID'sini bul
            const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
            const depoId = depoObj ? depoObj.id : null;
            
            if (depoId) {
                // Yetkilendirilen depoyu içeren hareketleri filtrele
                allMovements = allMovements.filter(m => 
                    m.sourceWarehouseId === depoId || 
                    m.targetWarehouseId === depoId
                );
            } else {
                console.warn('Yetkilendirilen depo bulunamadı:', authorizedDepot.value);
            }
        }
        
        // En son 5 hareketi göster
        return allMovements
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    });
    const productMap = computed(() =>
        inventoryStore.products.reduce((map, p) => ({ ...map, [p.id]: p.name }), {} as Record<string, string>)
    );
    const warehouseMap = computed(() =>
        inventoryStore.warehouses.reduce((map, w) => ({ ...map, [w.id]: w.name }), {} as Record<string, string>)
    );
    function getProductName(id: string) {
        return productMap.value[id] || id;
    }
    function getWarehouseName(id: string) {
        return warehouseMap.value[id] || id;
    }

    // Gerekli type tanımlamaları
    interface ProductItem {
        name: string;
        total: number;
    }

    interface CategoryGroup {
        subCategory: string;
        total: number;
        products: ProductItem[];
    }

    // Alt kategori istatistikleri - Gerçek veriler
    const productStocks = computed(() => {
        try {
            // Tüm ürünleri al
            if (!inventoryStore.getProducts || inventoryStore.getProducts.length === 0) {
                console.warn('Henüz ürün verisi yüklenemedi');
                return [];
            }
            
            // Depo kullanıcı için doğru depodaki stokları bulalım
            let depotId: string | null = null;
            if (!isAdminUser.value && authorizedDepot.value) {
                // Depo ID'sini bulmak için depo kodunu kullan
                const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
                depotId = depoObj ? depoObj.id : null;
                
                if (depotId === null) {
                    console.warn('Depo kullanıcısı için depo ID bulunamadı:', authorizedDepot.value);
                }
            }
            
            // Stok bilgilerini hazırla
            console.log('Stok hesaplaması yapılıyor...');
            
            // Ürünleri filtrele (tüm ürünleri başlangıçta dahil et)
            let products = inventoryStore.getProducts;
            
            // Alt kategoriye göre grupla
            const bySubCategory: Record<string, CategoryGroup> = {};
            for (const p of products) {
                if (!p) continue;
                // Alt kategori bilgisini al veya varsayılan değer ata
                const subCat = p.subCategory || 'Diğer';
                // Bu alt kategori için kayıt oluştur (yoksa)
                if (!bySubCategory[subCat]) {
                    bySubCategory[subCat] = { subCategory: subCat, total: 0, products: [] };
                }
                
                // Ürünün depolardaki toplam stok miktarı hesaplanıyor
                let productTotal = 0;
                
                if (isAdminUser.value || depotId === null) {
                    // Admin kullanıcı ise veya depotId bulunamadıysa tüm depolar için toplam stok
                    productTotal = (p.totalStock || 0);
                } else {
                    // Depo kullanıcısı için sadece kendi deposundaki ürünlerin stok miktarı
                    const depotStocks = inventoryStore.stocks
                        .filter(s => s.warehouseId === depotId && s.productId === p.id);
                    
                    productTotal = depotStocks.reduce((sum, s) => sum + s.quantity, 0);
                    
                    // Hata ayıklama için stok durumunu loglama
                    if (productTotal > 0) {
                        console.log(`Depo ${depotId} için ürün ${p.id} (${p.name}) stoğu:`, productTotal);
                    }
                }
                        
                // Bu ürünü alt kategoriye ekle ve toplamı güncelle
                if (productTotal > 0) {  // Sadece stok miktarı olanları ekle
                    bySubCategory[subCat].products.push({ name: p.name, total: productTotal });
                    bySubCategory[subCat].total += productTotal;
                }
            }
            // Sadece ürün içeren alt kategorileri filtrele ve döndür
            const result = Object.values(bySubCategory).filter(cat => cat.products.length > 0);
            
            console.log(`Stok hesaplaması tamamlandı: ${result.length} alt kategori, toplam ${result.reduce((sum, cat) => sum + cat.products.length, 0)} ürün.`);
            
            return result;
        } catch (error) {
            console.error('Alt kategori stokları hesaplanırken hata oluştu:', error);
            return [];
        }
    });

    const lowStockProducts = computed(() => {
   // Tüm kritik stok ürünlerini al
   const stocks = inventoryStore.getLowStockProducts;
   
   if (!stocks || stocks.length === 0) {
     return [];
   }
   
   let filtered = stocks;
   
   if (!isAdminUser.value && authorizedDepot.value) {
     // Depo ID'sini bulmak için depo kodunu kullan
     const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
     const depoId = depoObj ? depoObj.id : null;
     
     if (depoId) {
       // Sadece yetkilendirilen depodaki kritik stok ürünlerini filtrele
       filtered = stocks.filter(s => s.warehouseId === depoId);
     } else {
       console.warn('Depo kullanıcısı için depo ID bulunamadı:', authorizedDepot.value);
       return []; // Depo bulunamadıysa boş liste döndür
     }
   }
   
   // İsim, miktar ve depo adı bilgilerini dön
   return filtered.map(s => ({
     name: getProductName(s.productId),
     quantity: s.quantity,
     warehouse: getWarehouseName(s.warehouseId)
   }));
});

    const categoriesList = computed(() => inventoryStore.getCategories.map(c => c.name));

    const stockChartOptions = computed(() => ({
      chart: { type: 'donut', toolbar: { show: false } },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            background: 'transparent',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Toplam',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
              }
            }
          }
        }
      },
      labels: inventoryStore.getCategories.map(c => c.name),
      legend: { position: 'bottom' }
    }));

    // Depo bazlı stok dağılımı
    const warehouseLabels = computed(() => {
        try {
            // Admin kullanıcıları tüm depoları görebilir
            // Depo sorumluları sadece yetkili oldukları depoyu görebilir
            const warehouses = isAdminUser.value || !authorizedDepot.value 
                ? inventoryStore.getWarehouses 
                : inventoryStore.getWarehouses.filter(w => w.code === authorizedDepot.value);
            
            // Depo isimlerini döndür
            return warehouses.map(w => w.name + ' Deposu');
        } catch (error) {
            console.error('Depo etiketleri oluşturulurken hata:', error);
            return ['Depo Bulunamadı'];
        }
    });

    const warehouseChartSeries = computed(() => {
        try {
            // Önce hangi depoların gösterilmesi gerektiğini belirle
            const warehouses = isAdminUser.value || !authorizedDepot.value 
                ? inventoryStore.getWarehouses 
                : inventoryStore.getWarehouses.filter(w => w.code === authorizedDepot.value);
            
            if (!warehouses || warehouses.length === 0) {
                return [0]; // Eğer depo yoksa, boş bir dizi döndür
            }
            
            // Belirlenen depolar için stok miktarlarını hesapla
            return warehouses.map(w => {
                const totalStock = inventoryStore.stocks
                    .filter(s => s.warehouseId === w.id)
                    .reduce((sum, s) => sum + s.quantity, 0);
                
                return totalStock || 0; // Eğer stok yoksa 0 döndür
            });
        } catch (error) {
            console.error('Depo doluluk grafiği hazırlanırken hata:', error);
            return [0]; // Hata durumunda boş dizi döndür
        }
    });

    const warehouseChartOptions = computed(() => ({
      chart: { type: 'donut', toolbar: { show: false } },
      dataLabels: { enabled: true, formatter: (val: number, opts: any) => {
          const totals = opts.w.globals.seriesTotals;
          const totalAll = totals.reduce((a: number, b: number) => a + b, 0);
          return ((val / totalAll) * 100).toFixed(0) + '%';
      } },
      tooltip: {
        y: {
          formatter: (val: number) => {
            return val + ' ürün';
          }
        }
      },
      labels: warehouseLabels.value,
      legend: { position: 'bottom' },
      plotOptions: { 
        pie: { 
          donut: { 
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
              },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                formatter: (val: number) => val.toString()
              },
              total: {
                show: true,
                label: 'Toplam Stok',
                formatter: (w: any) => {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString() + ' ürün';
                }
              }
            }
          } 
        } 
      }
    }));

    // Summary bölümü için istatistikler
const totalProducts = computed(() => {
  try {
    let products;
    
    if (isAdminUser.value || !authorizedDepot.value) {
      // Admin kullanıcı veya yetkili depo yoksa tüm ürünleri say
      products = inventoryStore.getProducts.length;
    } else {
      // Yetkili depo varsa o depodaki ürünleri say
      const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
      const depoId = depoObj ? depoObj.id : null;
      
      if (!depoId) {
        console.warn('Depo ID bulunamadı:', authorizedDepot.value);
        return 0;
      }
      
      // Depodaki stokları bul ve bu ürünleri filtrele
      const depoStokları = inventoryStore.getStocksByWarehouseId(depoId);
      products = inventoryStore.getProducts.filter(p => 
        depoStokları.some(s => s.productId === p.id)
      ).length;
    }
    
    return products;
  } catch (error) {
    console.error('Toplam ürün sayısı hesaplanırken hata:', error);
    return 0;
  }
});

const lowStockCount = computed(() => {
  try {
    // Kritik stok ürünlerini al
    const stocks = inventoryStore.getLowStockProducts;
    let filtered;
    
    if (isAdminUser.value || !authorizedDepot.value) {
      // Admin kullanıcı veya yetkili depo yoksa tüm kritik stokları say
      filtered = stocks;
    } else {
      // Yetkili depo varsa o depodaki kritik stokları say
      const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
      const depoId = depoObj ? depoObj.id : null;
      
      if (!depoId) {
        console.warn('Depo ID bulunamadı:', authorizedDepot.value);
        return 0;
      }
      
      filtered = stocks.filter(s => s.warehouseId === depoId);
    }
    
    return filtered.length;
  } catch (error) {
    console.error('Kritik stok sayısı hesaplanırken hata:', error);
    return 0;
  }
});

const totalCategories = computed(() => {
  // Tüm kategorilerin sayısını alıyoruz, çünkü kategoriler genellikle tüm sistem içindir
  return inventoryStore.getCategories.length;
});

// Filtre ve arama fonksiyonları
    const searchTerm = ref('');
    const categoryFilter = ref('');
    const filteredProducts = computed(() => {
   try {
       let base;
       
       if (isAdminUser.value || !authorizedDepot.value) {
           // Admin veya yetkili depo yoksa tüm ürünleri göster
           base = inventoryStore.getProducts;
       } else {
           // Yetkili depo varsa o depodaki ürünleri filtrele
           const depoObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
           const depoId = depoObj ? depoObj.id : null;
           
           if (!depoId) {
               console.warn('Depo ID bulunamadı:', authorizedDepot.value);
               return []; // Depo bulunamadıysa boş liste döndür
           }
           
           // Depodaki stokları bul ve bu ürünleri filtrele
           const depoStokları = inventoryStore.getStocksByWarehouseId(depoId);
           base = inventoryStore.getProducts.filter(p =>
               depoStokları.some(s => s.productId === p.id)
           );
       }
       
       // Arama ve kategori filtrelerini uygula
       return base.filter(p => {
           const matchesSearch = !searchTerm.value ||
               p.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
               p.code.toLowerCase().includes(searchTerm.value.toLowerCase());
           const matchesCategory = !categoryFilter.value || p.category.name === categoryFilter.value;
           return matchesSearch && matchesCategory;
       });
   } catch (error) {
       console.error('Ürün filtrelemede hata:', error);
       return [];
   }
});
    
    // Arıza-Onarım Grafiği İçin Değişkenler
    const loading = ref(false);
    
    // Grafik periyodu (ay, çeyrek, yıl)
    const chartPeriod = ref<'month' | 'quarter' | 'year'>('month');
    
    // Seçilen periyoda göre X ekseni etiketleri
    const chartLabels = computed(() => {
        if (chartPeriod.value === 'month') {
            return ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        } else if (chartPeriod.value === 'quarter') {
            return ['1. Çeyrek', '2. Çeyrek', '3. Çeyrek', '4. Çeyrek'];
        } else if (chartPeriod.value === 'year') {
            const currentYear = new Date().getFullYear();
            return [
                (currentYear - 4).toString(),
                (currentYear - 3).toString(),
                (currentYear - 2).toString(),
                (currentYear - 1).toString(),
                currentYear.toString()
            ];
        }
        return [];
    });
    
    // Arıza ve onarım verilerini filtreleme fonksiyonu
    async function filterFaultData(period: 'month' | 'quarter' | 'year') {
        loading.value = true;
        chartPeriod.value = period; // Grafik periyodunu güncelle
        
        try {
            // Arıza deposundan veri yükleme (eğer daha önce yüklenmemişse)
            if (!arizaStore.getFaultyProducts || arizaStore.getFaultyProducts.length === 0) {
                await arizaStore.fetchFaultyProducts();
            }
            
            // Gerçek verileri hesapla
            if (period === 'month') {
                // Aylık görünüm - 12 ay
                calculateMonthlyFaultStats();
            } else if (period === 'quarter') {
                // Çeyreklik görünüm
                calculateQuarterlyFaultStats();
            } else if (period === 'year') {
                // Yıllık görünüm - son 5 yıl
                calculateYearlyFaultStats();
            }
        } catch (error) {
            console.error(`${period} periyodu için arıza verileri yüklenirken hata:`, error);
        } finally {
            loading.value = false;
        }
    }
    
    // Arıza-Onarım verisini gerçek verilerle doldur
    async function loadRealFaultData() {
        loading.value = true;
        
        try {
            // Arıza deposundan veri yükleme (eğer daha önce yüklenmemişse)
            if (!arizaStore.getFaultyProducts || arizaStore.getFaultyProducts.length === 0) {
                await arizaStore.fetchFaultyProducts();
            }
            
            // Varsayılan olarak aylık görünümü yükle
            calculateMonthlyFaultStats();
            
            // En son arızalı ürünleri yükle
            await loadLatestFaultyProducts();
            
            console.log('Arıza istatistikleri yüklendi. En çok arızaya sahip depolar:', mostFaultyWarehouses.value);
            
        } catch (error) {
            console.error('Arıza verileri yüklenirken hata:', error);
        } finally {
            loading.value = false;
        }
    }
    
    // Gerçek arıza verilerini analiz ederek aylık istatistikleri hesapla
    function calculateMonthlyFaultStats() {
        // Arıza verilerini al
        const faultyProducts = arizaStore.getFaultyProducts;
        
        if (!faultyProducts || faultyProducts.length === 0) {
            console.warn('Hesaplanacak arıza verisi bulunamadı');
            return;
        }
        
        // Admin olmayan kullanıcılar için depo filtresi uygula
        let filteredProducts = faultyProducts;
        if (!isAdminUser.value && authorizedDepot.value) {
            filteredProducts = faultyProducts.filter(p => p.senderWarehouseId === authorizedDepot.value);
        }
        
        // Aylık istatistik dizileri
        const monthlyFaults = Array(12).fill(0);
        const monthlyRepairs = Array(12).fill(0);
        
        // Mevcut tarih bilgileri
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Her bir arızalı ürün kaydını analiz et
        filteredProducts.forEach(product => {
            try {
                // Gönderim tarihi
                const sendDate = product.sendDate instanceof Date 
                    ? product.sendDate 
                    : product.sendDate.toDate();
                
                // Geri dönüş tarihi (varsa)
                const returnDate = product.returnedAt instanceof Date 
                    ? product.returnedAt 
                    : product.returnedAt ? product.returnedAt.toDate() : null;
                
                // Bu yıl içindeki gönderimler için ay bazında sayım
                if (sendDate && sendDate.getFullYear() === currentYear) {
                    const monthIndex = sendDate.getMonth();
                    monthlyFaults[monthIndex]++;
                }
                
                // Bu yıl içindeki dönüşler için ay bazında sayım
                if (returnDate && returnDate.getFullYear() === currentYear) {
                    const monthIndex = returnDate.getMonth();
                    monthlyRepairs[monthIndex]++;
                }
            } catch (error) {
                console.error('Arıza verisi işlenirken hata:', error);
            }
        });
        
        // Veriyi grafik serisine aktar
        arizaOnarimSeries.value = [
            {
                name: 'Arızaya Gönderilen',
                data: monthlyFaults
            },
            {
                name: 'Onarımdan Gelen',
                data: monthlyRepairs
            }
        ];
        
        console.log('Aylık arıza istatistikleri hesaplandı:', {
            ariza: monthlyFaults,
            onarim: monthlyRepairs
        });
    }
    
    // Gerçek arıza verilerini analiz ederek çeyreklik istatistikleri hesapla
    function calculateQuarterlyFaultStats() {
        // Arıza verilerini al
        const faultyProducts = arizaStore.getFaultyProducts;
        
        if (!faultyProducts || faultyProducts.length === 0) {
            console.warn('Hesaplanacak arıza verisi bulunamadı');
            return;
        }
        
        // Admin olmayan kullanıcılar için depo filtresi uygula
        let filteredProducts = faultyProducts;
        if (!isAdminUser.value && authorizedDepot.value) {
            filteredProducts = faultyProducts.filter(p => p.senderWarehouseId === authorizedDepot.value);
        }
        
        // Çeyreklik istatistik dizileri
        const quarterlyFaults = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
        const quarterlyRepairs = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
        
        // Mevcut tarih bilgileri
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Her bir arızalı ürün kaydını analiz et
        filteredProducts.forEach(product => {
            try {
                // Gönderim tarihi
                const sendDate = product.sendDate instanceof Date 
                    ? product.sendDate 
                    : product.sendDate.toDate();
                
                // Geri dönüş tarihi (varsa)
                const returnDate = product.returnedAt instanceof Date 
                    ? product.returnedAt 
                    : product.returnedAt ? product.returnedAt.toDate() : null;
                
                // Bu yıl içindeki gönderimler için çeyrek bazında sayım
                if (sendDate && sendDate.getFullYear() === currentYear) {
                    const quarterIndex = Math.floor(sendDate.getMonth() / 3);
                    quarterlyFaults[quarterIndex]++;
                }
                
                // Bu yıl içindeki dönüşler için çeyrek bazında sayım
                if (returnDate && returnDate.getFullYear() === currentYear) {
                    const quarterIndex = Math.floor(returnDate.getMonth() / 3);
                    quarterlyRepairs[quarterIndex]++;
                }
            } catch (error) {
                console.error('Arıza verisi işlenirken hata:', error);
            }
        });
        
        // Veriyi grafik serisine aktar
        arizaOnarimSeries.value = [
            {
                name: 'Arızaya Gönderilen',
                data: quarterlyFaults
            },
            {
                name: 'Onarımdan Gelen',
                data: quarterlyRepairs
            }
        ];
        
        console.log('Çeyreklik arıza istatistikleri hesaplandı:', {
            ariza: quarterlyFaults,
            onarim: quarterlyRepairs
        });
    }
    
    // Gerçek arıza verilerini analiz ederek yıllık istatistikleri hesapla
    function calculateYearlyFaultStats() {
        // Arıza verilerini al
        const faultyProducts = arizaStore.getFaultyProducts;
        
        if (!faultyProducts || faultyProducts.length === 0) {
            console.warn('Hesaplanacak arıza verisi bulunamadı');
            return;
        }
        
        // Admin olmayan kullanıcılar için depo filtresi uygula
        let filteredProducts = faultyProducts;
        if (!isAdminUser.value && authorizedDepot.value) {
            filteredProducts = faultyProducts.filter(p => p.senderWarehouseId === authorizedDepot.value);
        }
        
        // Yıllık istatistik dizileri - son 5 yıl
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4; // 5 yıl göstereceğiz
        const yearlyFaults = [0, 0, 0, 0, 0]; // Son 5 yıl
        const yearlyRepairs = [0, 0, 0, 0, 0]; // Son 5 yıl
        
        // Her bir arızalı ürün kaydını analiz et
        filteredProducts.forEach(product => {
            try {
                // Gönderim tarihi
                const sendDate = product.sendDate instanceof Date 
                    ? product.sendDate 
                    : product.sendDate.toDate();
                
                // Geri dönüş tarihi (varsa)
                const returnDate = product.returnedAt instanceof Date 
                    ? product.returnedAt 
                    : product.returnedAt ? product.returnedAt.toDate() : null;
                
                // Son 5 yıl içindeki gönderimler için yıl bazında sayım
                if (sendDate && sendDate.getFullYear() >= startYear) {
                    const yearIndex = sendDate.getFullYear() - startYear;
                    if (yearIndex >= 0 && yearIndex < 5) {
                        yearlyFaults[yearIndex]++;
                    }
                }
                
                // Son 5 yıl içindeki dönüşler için yıl bazında sayım
                if (returnDate && returnDate.getFullYear() >= startYear) {
                    const yearIndex = returnDate.getFullYear() - startYear;
                    if (yearIndex >= 0 && yearIndex < 5) {
                        yearlyRepairs[yearIndex]++;
                    }
                }
            } catch (error) {
                console.error('Arıza verisi işlenirken hata:', error);
            }
        });
        
        // Veriyi grafik serisine aktar
        arizaOnarimSeries.value = [
            {
                name: 'Arızaya Gönderilen',
                data: yearlyFaults
            },
            {
                name: 'Onarımdan Gelen',
                data: yearlyRepairs
            }
        ];
        
        console.log('Yıllık arıza istatistikleri hesaplandı:', {
            ariza: yearlyFaults,
            onarim: yearlyRepairs
        });
    }

    // Günlük arıza sayılarını yükle
    async function loadDailyFaultStats() {
        try {
            // Bugünün tarihini al
            const today = new Date();
            
            // 7 gün öncesinin tarihini hesapla
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            
            // 14 gün öncesinin tarihini hesapla (geçen haftanın başlangıcı)
            const fourteenDaysAgo = new Date(today);
            fourteenDaysAgo.setDate(today.getDate() - 14);
            
            // Son 7 günün tarihleri
            const last7Days: Date[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                date.setHours(0, 0, 0, 0);
                last7Days.push(date);
            }
            
            // Arıza verileri
            const faultyProducts = arizaStore.getFaultyProducts;
            if (!faultyProducts || faultyProducts.length === 0) {
                console.warn('Günlük arıza için gösterilecek veri bulunamadı');
                return;
            }
            
            // Filtrele: Admin olmayan kullanıcılar sadece kendi depolarındaki verileri görebilir
            let filteredProducts = faultyProducts;
            if (!isAdminUser.value && authorizedDepot.value) {
                filteredProducts = faultyProducts.filter(p => p.senderWarehouseId === authorizedDepot.value);
            }
            
            // Bu hafta ve geçen hafta için veri dizileri
            const currentWeekData = [0, 0, 0, 0, 0, 0, 0];
            const lastWeekData = [0, 0, 0, 0, 0, 0, 0];
            
            // Her bir arızalı ürün kaydı için
            filteredProducts.forEach(product => {
                try {
                    // Gönderim tarihini alalım - açık tür tanımlaması ile
                    let sendDate: Date;
                    
                    if (product.sendDate instanceof Date) {
                        sendDate = product.sendDate;
                    } else if (product.sendDate && typeof product.sendDate.toDate === 'function') {
                        sendDate = product.sendDate.toDate();
                    } else {
                        return; // Geçerli bir tarih değilse bu kaydı atla
                    }
                    
                    sendDate.setHours(0, 0, 0, 0); // Saat, dakika ve saniyeyi sıfırla (sadece gün kısmıyla karşılaştırmak için)
                    
                    // Bu hafta içindeki bir gün için
                    if (sendDate >= sevenDaysAgo && sendDate <= today) {
                        // Haftanın hangi gününe denk geldiğini bul
                        for (let i = 0; i < 7; i++) {
                            if (sendDate.getTime() === last7Days[i].getTime()) {
                                currentWeekData[i]++;
                                break;
                            }
                        }
                    }
                    // Geçen hafta içindeki bir gün için
                    else if (sendDate >= fourteenDaysAgo && sendDate < sevenDaysAgo) {
                        // Haftanın hangi gününe denk geldiğini bul (geçen haftaki aynı gün)
                        const dayOfWeek = sendDate.getDay();
                        lastWeekData[dayOfWeek]++;
                    }
                } catch (err) {
                    console.error('Ürün tarihi işlenirken hata:', err);
                }
            });
            
            // Günlük arıza grafiğini güncelle
            dailySalesSeries.value = [
                {
                    name: 'Arızaya Gönderilen Ürün',
                    data: currentWeekData
                },
                {
                    name: 'Geçen Hafta',
                    data: lastWeekData
                }
            ];
            
            console.log('Günlük arıza verileri başarıyla güncellendi:', {
                currentWeek: currentWeekData, 
                lastWeek: lastWeekData
            });
        } catch (error) {
            console.error('Günlük arıza istatistikleri yüklenirken hata:', error);
        }
    }
    
    // En son arızalı ürün gönderen depolar için veri ve yardımcı fonksiyonlar
const latestFaultyProducts = ref<FaultyProductRecord[]>([]);

// En son arızalı ürünleri yükle
async function loadLatestFaultyProducts() {
    try {
        // faultyProductService'den son gönderilen 5 arızalı ürünü al
        const faultyProductService = (await import('@/services/faultyProductService')).default;
        const products = await faultyProductService.getLatestFaultyProducts(5);
        
        // Admin olmayan kullanıcılar için depo filtresi uygula (zaten serviste uygulanıyor)
        latestFaultyProducts.value = products;
        
        console.log('En son arızalı ürünler yüklendi:', products.length);
    } catch (error) {
        console.error('En son arızalı ürünler yüklenirken hata:', error);
        // Hata durumunda boş bir dizi atayalım
        latestFaultyProducts.value = [];
    }
}

// Depo adını getir
function getDepoName(warehouseId: string) {
    const warehouse = inventoryStore.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Bilinmeyen Depo';
}

// Depo rengini getir (ilk harfe göre farklı renk sınıfları)
function getDepoColorClass(warehouseId: string) {
    const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-danger', 'bg-warning', 'bg-secondary', 'bg-dark'];
    const warehouse = inventoryStore.warehouses.find(w => w.id === warehouseId);
    
    if (!warehouse) return colors[0];
    
    // Depo adının ilk harfine göre belirli bir renk döndür
    const firstChar = warehouse.name.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0) - 'a'.charCodeAt(0);
    return colors[Math.abs(charCode) % colors.length];
}

// Depo adının ilk harfini getir
function getDepoInitial(warehouseId: string) {
    const warehouse = inventoryStore.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name.charAt(0).toUpperCase() : 'X';
}

// Ürün adını getir
function getUrunName(productId: string) {
    const product = inventoryStore.products.find(p => p.id === productId);
    return product ? product.name : 'Bilinmeyen Ürün';
}

// Ürün için renk sınıfı getir (sıra numarasına göre)
function getItemColorClass(index: number) {
    const textColors = ['text-primary', 'text-success', 'text-danger', 'text-warning', 'text-info'];
    return textColors[index % textColors.length];
}

// Tarihi formatla
function formatTarih(tarih: Date | Timestamp | undefined) {
    if (!tarih) return '-';
    
    // Firebase Timestamp veya JavaScript Date objesi kontrolü
    const date = tarih instanceof Date ? tarih : tarih.toDate();
    
    // Türkçe tarih formatı: GG.AA.YYYY
    return date.toLocaleDateString('tr-TR');
}

// Durum sınıfını getir
function getDurumClass(status: string) {
    const statusMap: Record<string, string> = {
        'Gönderildi': 'badge-outline-info',
        'Serviste': 'badge-outline-warning',
        'Onarılıyor': 'badge-outline-primary',
        'Onarıldı': 'badge-outline-success',
        'İade Edildi': 'badge-outline-dark',
        'İade Alındı': 'badge-outline-secondary'
    };
    
    return statusMap[status] || 'badge-outline-dark';
}

// En çok arızalı ürün bulunan depoların listesi
const mostFaultyWarehouses = computed(() => {
    // Arıza deposu başlatılmadıysa boş dizi döndür
    if (!arizaStore || !arizaStore.getFaultyProducts || arizaStore.getFaultyProducts.length === 0) {
        return [];
    }
    
    const faultyProducts = arizaStore.getFaultyProducts;
    
    // Yetkili depo var ise ve admin değilse filtreleme yap
    let filteredProducts = faultyProducts;
    if (!isAdminUser.value && authorizedDepot.value) {
        const warehouseObj = inventoryStore.getWarehouses.find(w => w.code === authorizedDepot.value);
        if (warehouseObj) {
            filteredProducts = faultyProducts.filter(p => p.senderWarehouseId === warehouseObj.id);
        }
    }
    
    // Depo ID'lerine göre grupla ve say
    const warehouseCounts: Record<string, number> = {};
    
    filteredProducts.forEach(product => {
        const warehouseId = product.senderWarehouseId;
        if (!warehouseId) return;
        
        if (!warehouseCounts[warehouseId]) {
            warehouseCounts[warehouseId] = 0;
        }
        warehouseCounts[warehouseId]++;
    });
    
    // En çok arızaya sahip olanları seç
    const topWarehouses = Object.entries(warehouseCounts)
        .map(([warehouseId, count]) => ({
            warehouseId,
            count,
            name: getDepoName(warehouseId)
        }))
        .sort((a, b) => b.count - a.count) // Azalan sırada sırala
        .slice(0, 5); // En üstteki 5 tanesini al
    
    return topWarehouses;
});
</script>
