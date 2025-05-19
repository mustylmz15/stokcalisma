import('ts-node').then(() => {
  import('./permissionMigrationService.js').then(async (module) => {
    const PermissionMigrationService = module.default;
    const result = await PermissionMigrationService.migrateAllRolesAndPermissions();
    if (result) {
      console.log('Migration başarıyla tamamlandı!');
    } else {
      console.error('Migration sırasında hata oluştu!');
    }
    process.exit(result ? 0 : 1);
  });
}); 