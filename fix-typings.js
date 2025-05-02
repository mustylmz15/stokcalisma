/**
 * index.vue dosyasındaki authStore.getAuthorizedDepot ile ilgili tip sorunlarını çözmek için
 * bu script kullanılacaktır.
 */
const fs = require('fs');
const path = require('path');

// Dosya yolu
const filePath = 'src/views/inventory/reports/index.vue';
const fullPath = path.resolve(process.cwd(), filePath);

// Dosyayı oku
let content = fs.readFileSync(fullPath, 'utf8');

// Tüm authStore.getAuthorizedDepot çağrılarını düzelt
// 1. Önce tip dönüşümü yapılmış olanları düzelt
content = content.replace(
  /authStore\.getAuthorizedDepot as unknown as string/g,
  'String(authStore.getAuthorizedDepot)'
);

content = content.replace(
  /authStore\.getAuthorizedDepot as string/g,
  'String(authStore.getAuthorizedDepot)'
);

// 2. Tip dönüşümü yapılmamış olanları düzelt
content = content.replace(
  /const yetkiliDepoCodu = authStore\.getAuthorizedDepot;/g,
  'const yetkiliDepoCodu = String(authStore.getAuthorizedDepot);'
);

// 3. Koşullu atamayı düzelt
content = content.replace(
  /const yetkiliDepoCodu = !authStore\.isAdmin \? authStore\.getAuthorizedDepot : null;/g,
  'const yetkiliDepoCodu = !authStore.isAdmin ? String(authStore.getAuthorizedDepot) : null;'
);

// 4. Karşılaştırmaları düzelt
content = content.replace(
  /w => w\.code === yetkiliDepoCodu/g,
  'w => w.code === yetkiliDepoCodu'
);

// Düzeltilmiş içeriği yaz
fs.writeFileSync(fullPath, content, 'utf8');

console.log('Değişiklikler başarıyla yapıldı.');
