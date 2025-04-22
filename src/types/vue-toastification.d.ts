declare module 'vue-toastification' {
  import { Plugin } from 'vue';

  export const useToast: () => {
    success: (message: string, options?: object) => void;
    error: (message: string, options?: object) => void;
    info: (message: string, options?: object) => void;
    warning: (message: string, options?: object) => void;
    default: (message: string, options?: object) => void;
  };

  export interface ToastOptions {
    position?: string;
    timeout?: number;
    closeOnClick?: boolean;
    pauseOnFocusLoss?: boolean;
    pauseOnHover?: boolean;
    draggable?: boolean;
    draggablePercent?: number;
    showCloseButtonOnHover?: boolean;
    hideProgressBar?: boolean;
    closeButton?: string | boolean;
    icon?: boolean | string;
    rtl?: boolean;
  }

  export const ToastPlugin: Plugin;

  export default ToastPlugin;
}
