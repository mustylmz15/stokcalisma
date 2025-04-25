<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Dashboard</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Sales</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <!-- ÜRÜN STOKLARI - 2 SÜTUNLU -->
              <div class="panel p-4">
                <h6 class="font-semibold mb-2">Ürün Stokları</h6>
                <div class="text-sm">
                  <div v-for="(category, i) in productStocks" :key="i" class="mb-3">
                    <h6 class="font-semibold text-primary">{{ category.subCategory }} ({{ category.total }})</h6>
                    <div class="grid grid-cols-2 gap-1">
                      <div> 
                      </div>
                      <div v-if="category.products.length > 10">
                    </div>
                    </div>
                    <div v-if="category.products.length > 20" class="italic text-xs text-right mt-1">
                      ... daha fazla (toplam {{ category.products.length }} ürün)
                    </div>
                  </div>
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
                        <h5 class="font-semibold text-lg">Hasılat</h5>
                        <div class="dropdown ltr:ml-auto rtl:mr-auto">
                            <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                                <a href="javascript:;">
                                    <icon-horizontal-dots class="text-black/70 dark:text-white/70 hover:!text-primary" />
                                </a>
                                <template #content="{ close }">
                                    <ul @click="close()">
                                        <li>
                                            <a href="javascript:;">Haftalık</a>
                                        </li>
                                        <li>
                                            <a href="javascript:;">Aylık</a>
                                        </li>
                                        <li>
                                            <a href="javascript:;">Yıllık</a>
                                        </li>
                                    </ul>
                                </template>
                            </Popper>
                        </div>
                    </div>
                    <p class="text-lg dark:text-white-light/90">Toplam Kâr <span class="text-primary ml-2">$10,840</span></p>
                    <div class="relative">
                        <apexchart height="325" :options="revenueChart" :series="revenueSeries" class="bg-white dark:bg-black rounded-lg overflow-hidden">
                            <!-- loader -->
                            <div class="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span
                                    class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"
                                ></span>
                            </div>
                        </apexchart>
                    </div>
                </div>

                <div class="panel h-full">
                    <div class="flex items-center mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Sales By Category</h5>
                    </div>
                    <div>
                        <apexchart
                            height="460"
                            :options="salesByCategory"
                            :series="salesByCategorySeries"
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
                            Daily Sales <span class="block text-white-dark text-sm font-normal">Go to columns for details.</span>
                        </h5>
                        <div class="ltr:ml-auto rtl:mr-auto relative">
                            <div class="w-11 h-11 text-warning bg-[#ffeccb] dark:bg-warning dark:text-[#ffeccb] grid place-content-center rounded-full">
                                <icon-dollar-sign />
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

                <div class="panel h-full">
                    <div class="flex items-center dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Summary</h5>
                        <div class="dropdown ltr:ml-auto rtl:mr-auto">
                          <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                            <a href="javascript:;"><icon-horizontal-dots class="w-5 h-5 text-black/70 dark:text-white/70 hover:!text-primary"/></a>
                            <template #content="{ close }">
                              <ul @click="close()">
                                <li><a href="javascript:;">View Report</a></li>
                                <li><a href="javascript:;">Edit Report</a></li>
                                <li><a href="javascript:;">Mark as Done</a></li>
                              </ul>
                            </template>
                          </Popper>
                        </div>
                    </div>
                    <div class="space-y-9">
                      <div class="flex items-center">
                        <div class="w-full">
                          <div class="flex justify-between">
                            <span class="text-xs font-semibold text-white-dark dark:text-white/60">Ürün Stokları</span>
                            <span class="text-xs font-semibold text-white-dark dark:text-white/60">{{ totalProducts }}</span>
                          </div>
                          <div class="h-2.5 bg-white-light/30 dark:bg-white/10 rounded-full">
                            <div class="h-2.5 bg-primary rounded-full" :style="{ width: `${(totalProducts / 100) * 100}%` }"></div>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center">
                        <div class="w-full">
                          <div class="flex justify-between">
                            <span class="text-xs font-semibold text-white-dark dark:text-white/60">Düşük Stok</span>
                            <span class="text-xs font-semibold text-white-dark dark:text-white/60">{{ lowStockCount }}</span>
                          </div>
                          <div class="h-2.5 bg-white-light/30 dark:bg-white/10 rounded-full">
                            <div class="h-2.5 bg-danger rounded-full" :style="{ width: `${(lowStockCount / 100) * 100}%` }"></div>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center">
                        <div class="w-full">
                          <div class="flex justify-between">
                            <span class="text-xs font-semibold text-white-dark dark:text-white/60">Toplam Kategori</span>
                            <span class="text-xs font-semibold text-white-dark dark:text-white/60">{{ totalCategories }}</span>
                          </div>
                          <div class="h-2.5 bg-white-light/30 dark:bg-white/10 rounded-full">
                            <div class="h-2.5 bg-success rounded-full" :style="{ width: `${(totalCategories / 100) * 100}%` }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
            </div>

            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <div class="panel h-full sm:col-span-2 xl:col-span-1 pb-0">
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
                            View All
                            <icon-arrow-left
                                class="rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition duration-300 ltr:ml-1 rtl:mr-1"
                            />
                        </a>
                    </div>
                </div>

                <div class="panel h-full p-0">
                    <div class="flex items-center justify-between w-full p-5 absolute">
                        <div class="relative">
                            <div
                                class="text-success dark:text-success-light bg-success-light dark:bg-success w-11 h-11 rounded-lg flex items-center justify-center"
                            >
                                <icon-shopping-cart />
                            </div>
                        </div>
                        <h5 class="font-semibold text-2xl ltr:text-right rtl:text-left dark:text-white-light">
                            3,192
                            <span class="block text-sm font-normal">Total Orders</span>
                        </h5>
                    </div>
                    <apexchart height="290" :options="totalOrders" :series="totalOrdersSeries" class="bg-white dark:bg-black rounded-lg overflow-hidden">
                        <!-- loader -->
                        <div class="min-h-[290px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                            <span class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    </apexchart>
                </div>
            </div>

            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <div class="panel h-full p-0 border-0 overflow-hidden">
                    <div class="p-6 bg-gradient-to-r from-[#4361ee] to-[#160f6b] min-h-[190px]">
                        <div class="flex justify-between items-center mb-6">
                            <div class="bg-black/50 rounded-full p-1 ltr:pr-3 rtl:pl-3 flex items-center text-white font-semibold">
                                <img
                                    class="w-8 h-8 rounded-full border-2 border-white/50 block object-cover ltr:mr-1 rtl:ml-1"
                                    src="/assets/images/profile-34.jpeg"
                                    alt=""
                                />
                                Alan Green
                            </div>
                            <button
                                type="button"
                                class="ltr:ml-auto rtl:mr-auto flex items-center justify-between w-9 h-9 bg-black text-white rounded-md hover:opacity-80"
                            >
                                <icon-plus class="w-6 h-6 m-auto" />
                            </button>
                        </div>
                        <div class="text-white flex justify-between items-center">
                            <p class="text-xl">Wallet Balance</p>
                            <h5 class="ltr:ml-auto rtl:mr-auto text-2xl"><span class="text-white-light">$</span>2953</h5>
                        </div>
                    </div>
                    <div class="-mt-12 px-8 grid grid-cols-2 gap-2">
                        <div class="bg-white rounded-md shadow px-4 py-2.5 dark:bg-[#060818]">
                            <span class="flex justify-between items-center mb-4 dark:text-white"
                                >Received
                                <icon-caret-down class="w-4 h-4 text-success rotate-180" />
                            </span>
                            <div class="btn w-full py-1 text-base shadow-none border-0 bg-[#ebedf2] dark:bg-black text-[#515365] dark:text-[#bfc9d4]">
                                $97.99
                            </div>
                        </div>
                        <div class="bg-white rounded-md shadow px-4 py-2.5 dark:bg-[#060818]">
                            <span class="flex justify-between items-center mb-4 dark:text-white"
                                >Spent
                                <icon-caret-down class="w-4 h-4 text-danger" />
                            </span>
                            <div class="btn w-full py-1 text-base shadow-none border-0 bg-[#ebedf2] dark:bg-black text-[#515365] dark:text-[#bfc9d4]">
                                $53.00
                            </div>
                        </div>
                    </div>
                    <div class="p-5">
                        <div class="mb-5">
                            <span
                                class="bg-[#1b2e4b] text-white text-xs rounded-full px-4 py-1.5 before:bg-white before:w-1.5 before:h-1.5 before:rounded-full ltr:before:mr-2 rtl:before:ml-2 before:inline-block"
                                >Pending</span
                            >
                        </div>
                        <div class="mb-5 space-y-1">
                            <div class="flex items-center justify-between">
                                <p class="text-[#515365] font-semibold">Netflix</p>
                                <p class="text-base"><span>$</span> <span class="font-semibold">13.85</span></p>
                            </div>
                            <div class="flex items-center justify-between">
                                <p class="text-[#515365] font-semibold">BlueHost VPN</p>
                                <p class="text-base"><span>$</span> <span class="font-semibold">15.66</span></p>
                            </div>
                        </div>
                        <div class="text-center px-2 flex justify-around">
                            <button type="button" class="btn btn-secondary ltr:mr-2 rtl:ml-2">View Details</button>
                            <button type="button" class="btn btn-success">Pay Now $29.51</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="panel h-full w-full">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Recent Orders</h5>
                    </div>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th class="ltr:rounded-l-md rtl:rounded-r-md">Customer</th>
                                    <th>Product</th>
                                    <th>Invoice</th>
                                    <th>Price</th>
                                    <th class="ltr:rounded-r-md rtl:rounded-l-md">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="min-w-[150px] text-black dark:text-white">
                                        <div class="flex items-center">
                                            <img class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/profile-6.jpeg" alt="avatar" />
                                            <span class="whitespace-nowrap">Luke Ivory</span>
                                        </div>
                                    </td>
                                    <td class="text-primary">Headphone</td>
                                    <td><router-link to="/apps/invoice/preview">#46894</router-link></td>
                                    <td>$56.07</td>
                                    <td><span class="badge bg-success shadow-md dark:group-hover:bg-transparent">Paid</span></td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex items-center">
                                            <img class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/profile-7.jpeg" alt="avatar" />
                                            <span class="whitespace-nowrap">Andy King</span>
                                        </div>
                                    </td>
                                    <td class="text-info">Nike Sport</td>
                                    <td><router-link to="/apps/invoice/preview">#76894</router-link></td>
                                    <td>$126.04</td>
                                    <td><span class="badge bg-secondary shadow-md dark:group-hover:bg-transparent">Shipped</span></td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex items-center">
                                            <img class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/profile-8.jpeg" alt="avatar" />
                                            <span class="whitespace-nowrap">Laurie Fox</span>
                                        </div>
                                    </td>
                                    <td class="text-warning">Sunglasses</td>
                                    <td><router-link to="/apps/invoice/preview">#66894</router-link></td>
                                    <td>$56.07</td>
                                    <td><span class="badge bg-success shadow-md dark:group-hover:bg-transparent">Paid</span></td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex items-center">
                                            <img class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/profile-9.jpeg" alt="avatar" />
                                            <span class="whitespace-nowrap">Ryan Collins</span>
                                        </div>
                                    </td>
                                    <td class="text-danger">Sport</td>
                                    <td><router-link to="/apps/invoice/preview">#75844</router-link></td>
                                    <td>$110.00</td>
                                    <td><span class="badge bg-secondary shadow-md dark:group-hover:bg-transparent">Shipped</span></td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex items-center">
                                            <img class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/profile-10.jpeg" alt="avatar" />
                                            <span class="whitespace-nowrap">Irene Collins</span>
                                        </div>
                                    </td>
                                    <td class="text-secondary">Speakers</td>
                                    <td><router-link to="/apps/invoice/preview">#46894</router-link></td>
                                    <td>$56.07</td>
                                    <td><span class="badge bg-success shadow-md dark:group-hover:bg-transparent">Paid</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="panel h-full w-full">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Top Selling Product</h5>
                    </div>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr class="border-b-0">
                                    <th class="ltr:rounded-l-md rtl:rounded-r-md">Product</th>
                                    <th>Price</th>
                                    <th>Discount</th>
                                    <th>Sold</th>
                                    <th class="ltr:rounded-r-md rtl:rounded-l-md">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="min-w-[150px] text-black dark:text-white">
                                        <div class="flex">
                                            <img
                                                class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover"
                                                src="/assets/images/product-headphones.jpg"
                                                alt="avatar"
                                            />
                                            <p class="whitespace-nowrap">Headphone <span class="text-primary block text-xs">Digital</span></p>
                                        </div>
                                    </td>
                                    <td>$168.09</td>
                                    <td>$60.09</td>
                                    <td>170</td>
                                    <td>
                                        <a class="text-danger flex items-center" href="javascript:;">
                                            <icon-multiple-forward-right class="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />

                                            Direct
                                        </a>
                                    </td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex">
                                            <img
                                                class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover"
                                                src="/assets/images/product-shoes.jpg"
                                                alt="avatar"
                                            />
                                            <p class="whitespace-nowrap">Shoes <span class="text-warning block text-xs">Faishon</span></p>
                                        </div>
                                    </td>
                                    <td>$126.04</td>
                                    <td>$47.09</td>
                                    <td>130</td>
                                    <td>
                                        <a class="text-success flex items-center" href="javascript:;">
                                            <icon-multiple-forward-right class="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />

                                            Google
                                        </a>
                                    </td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex">
                                            <img
                                                class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover"
                                                src="/assets/images/product-watch.jpg"
                                                alt="avatar"
                                            />
                                            <p class="whitespace-nowrap">Watch <span class="text-danger block text-xs">Accessories</span></p>
                                        </div>
                                    </td>
                                    <td>$56.07</td>
                                    <td>$20.00</td>
                                    <td>66</td>
                                    <td>
                                        <a class="text-warning flex items-center" href="javascript:;">
                                            <icon-multiple-forward-right class="rtl:rotate-180 ltr:mr-1 rtl:ml-3" />

                                            Ads
                                        </a>
                                    </td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex">
                                            <img
                                                class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover"
                                                src="/assets/images/product-laptop.jpg"
                                                alt="avatar"
                                            />
                                            <p class="whitespace-nowrap">Laptop <span class="text-primary block text-xs">Digital</span></p>
                                        </div>
                                    </td>
                                    <td>$110.00</td>
                                    <td>$33.00</td>
                                    <td>35</td>
                                    <td>
                                        <a class="text-secondary flex items-center" href="javascript:;">
                                            <icon-multiple-forward-right class="rtl:rotate-180 ltr:mr-1 rtl:ml-3" />
                                            Email
                                        </a>
                                    </td>
                                </tr>
                                <tr class="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                    <td class="text-black dark:text-white">
                                        <div class="flex">
                                            <img
                                                class="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover"
                                                src="/assets/images/product-camera.jpg"
                                                alt="avatar"
                                            />
                                            <p class="whitespace-nowrap">Camera <span class="text-primary block text-xs">Digital</span></p>
                                        </div>
                                    </td>
                                    <td>$56.07</td>
                                    <td>$26.04</td>
                                    <td>30</td>
                                    <td>
                                        <a class="text-primary flex items-center" href="javascript:;">
                                            <icon-multiple-forward-right class="rtl:rotate-180 ltr:mr-1 rtl:ml-3" />
                                            Referral
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
    import { ref, computed, onMounted } from 'vue';
    import apexchart from 'vue3-apexcharts';

    import { useAppStore } from '@/stores/index';
    import { useInventoryStore } from '@/stores/inventory';
    import { useAuthStore } from '@/stores/auth-store';
    const inventoryStore = useInventoryStore();
    onMounted(() => {
        inventoryStore.initializeStore();
    });
    // auth store for role and depot filtering
    const authStore = useAuthStore();
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
            colors: isDark ? ['#2196f3', '#e7515a'] : ['#1b55e2', '#e7515a'],
            markers: {
                discrete: [
                    {
                        seriesIndex: 0,
                        dataPointIndex: 6,
                        fillColor: '#1b55e2',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                    {
                        seriesIndex: 1,
                        dataPointIndex: 5,
                        fillColor: '#e7515a',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                ],
            },
            labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
                        return value / 1000 + 'K';
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

    const revenueSeries = ref([
        {
            name: 'Gelirler',
            data: [16800, 16800, 15500, 17800, 15500, 17000, 19000, 16000, 15000, 17000, 14000, 17000],
        },
        {
            name: 'Giderler',
            data: [16500, 17500, 16200, 17300, 16000, 19500, 16000, 17000, 16000, 19000, 18000, 19000],
        },
    ]);

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
            colors: ['#e2a03f', '#e0e6ed'],
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
                    show: false,
                },
                categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'],
            },
            yaxis: {
                show: false,
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
            name: 'Sales',
            data: [44, 55, 41, 67, 22, 43, 21],
        },
        {
            name: 'Last Week',
            data: [13, 23, 20, 8, 13, 27, 33],
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

    // Son hareketler verisi ve yardımcı fonksiyonlar
    const movementsList = computed(() => {
   let list = inventoryStore.getProjectMovements.slice()
     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 5);
   if (!isAdminUser.value && authorizedDepot.value) {
     list = list.filter(m =>
       m.sourceWarehouseId === authorizedDepot.value ||
       m.targetWarehouseId === authorizedDepot.value
     );
   }
   return list;
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

    // 1. adım detaylı kartlar için hesaplamalar
    const productStocks = computed<CategoryGroup[]>(() => {
  // Önce ürünleri alt kategorilere göre gruplayalım
  const bySubCategory = inventoryStore.getProducts.reduce<Record<string, CategoryGroup>>((acc, p) => {
    // Alt kategori yoksa "Genel" olarak kabul edelim
    const subCat = p.subCategory || 'Genel';
    
    // Alt kategoriye göre toplam stok hesaplaması
    const total = (isAdminUser.value || !authorizedDepot.value)
      ? p.totalStock || 0
      : inventoryStore.getStocksByWarehouseId(authorizedDepot.value!).filter(s => s.productId === p.id)
          .reduce((sum, s) => sum + s.quantity, 0);
    
    // Eğer bu alt kategori daha önce yoksa oluştur
    if (!acc[subCat]) {
      acc[subCat] = {
        subCategory: subCat,
        total: 0,
        products: []
      };
    }
    
    // Bu ürünü alt kategoriye ekle ve toplamı güncelle
    acc[subCat].products.push({ name: p.name, total });
    acc[subCat].total += total;
    
    return acc;
  }, {});
  
  // Alt kategorileri diziye dönüştür
  return Object.values(bySubCategory);
});

    const lowStockProducts = computed(() => {
   const stocks = inventoryStore.getLowStockProducts;
   const filtered = (isAdminUser.value || !authorizedDepot.value)
     ? stocks
     : stocks.filter(s => s.warehouseId === authorizedDepot.value!);
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
        // Admin kullanıcıları tüm depoları görebilir
        // Depo sorumluları sadece yetkili oldukları depoyu görebilir
        const warehouses = isAdminUser.value || !authorizedDepot.value 
            ? inventoryStore.getWarehouses 
            : inventoryStore.getWarehouses.filter(w => w.id === authorizedDepot.value);
        return warehouses.map(w => w.name);
    });

    const warehouseChartSeries = computed(() => {
        // Önce hangi depoların gösterilmesi gerektiğini belirle
        const warehouses = isAdminUser.value || !authorizedDepot.value 
            ? inventoryStore.getWarehouses 
            : inventoryStore.getWarehouses.filter(w => w.id === authorizedDepot.value);
        
        // Belirlenen depolar için stok miktarlarını hesapla
        return warehouses.map(w =>
            inventoryStore.stocks
                .filter(s => s.warehouseId === w.id)
                .reduce((sum, s) => sum + s.quantity, 0)
        );
    });

    const warehouseChartOptions = computed(() => ({
      chart: { type: 'donut', toolbar: { show: false } },
      dataLabels: { enabled: true, formatter: (val: number, opts: any) => {
          const totals = opts.w.globals.seriesTotals;
          const totalAll = totals.reduce((a: number, b: number) => a + b, 0);
          return ((val / totalAll) * 100).toFixed(0) + '%';
      } },
      labels: warehouseLabels.value,
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '65%' } } }
    }));

    // Summary bölümü için istatistikler
const totalProducts = computed(() => {
  const products = isAdminUser.value || !authorizedDepot.value
    ? inventoryStore.getProducts.length
    : inventoryStore.getProducts.filter(p => 
        inventoryStore.getStocksByWarehouseId(authorizedDepot.value!)
          .some(s => s.productId === p.id)
      ).length;
  return products;
});

const lowStockCount = computed(() => {
  const stocks = inventoryStore.getLowStockProducts;
  const filtered = (isAdminUser.value || !authorizedDepot.value)
    ? stocks
    : stocks.filter(s => s.warehouseId === authorizedDepot.value!);
  return filtered.length;
});

const totalCategories = computed(() => {
  // Tüm kategorilerin sayısını alıyoruz, çünkü kategoriler genellikle tüm sistem içindir
  return inventoryStore.getCategories.length;
});

// Filtre ve arama fonksiyonları
    const searchTerm = ref('');
    const categoryFilter = ref('');
    const filteredProducts = computed(() => {
   const base = (isAdminUser.value || !authorizedDepot.value)
     ? inventoryStore.getProducts
     : inventoryStore.getProducts.filter(p =>
         inventoryStore.getStocksByWarehouseId(authorizedDepot.value!).some(s => s.productId === p.id)
       );
   return base.filter(p => {
     const matchesSearch = !searchTerm.value ||
       p.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
       p.code.toLowerCase().includes(searchTerm.value.toLowerCase());
     const matchesCategory = !categoryFilter.value || p.category.name === categoryFilter.value;
     return matchesSearch && matchesCategory;
   });
});
</script>
