import toast from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
}

export const useToast = () => {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #10b981',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration || 5000,
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #ef4444',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    });
  };

  const loading = (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #3b82f6',
      },
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#fff',
      },
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration || 3000,
      icon: 'ℹ️',
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #3b82f6',
      },
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration || 4000,
      icon: '⚠️',
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #f59e0b',
      },
    });
  };

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    loading,
    info,
    warning,
    dismiss,
  };
};
