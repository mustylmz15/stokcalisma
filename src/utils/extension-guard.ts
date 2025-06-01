// Extension hatalarını yakalamak ve filtrelemek için
export const suppressExtensionErrors = () => {
  // Chrome extension hatalarını yakala ve filtrele
  const originalError = console.error;
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Chrome extension hatalarını filtrele
    if (
      message.includes('runtime.lastError') ||
      message.includes('message port closed') ||
      message.includes('Extension context invalidated')
    ) {
      // Bu hataları görmezden gel (extension hatası)
      return;
    }
    
    // Diğer gerçek hataları göster
    originalError.apply(console, args);
  };
};

// Window'da extension varlığını kontrol et
export const checkExtensionConflicts = () => {
  const conflicts: string[] = [];
  
  // Yaygın extension conflict'leri kontrol et
  if ((window as any).chrome?.runtime?.id) {
    conflicts.push('Chrome Extension API detected');
  }
  
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    conflicts.push('React DevTools detected');
  }
  
  if ((window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    conflicts.push('Vue DevTools detected');
  }
  
  return conflicts;
};
