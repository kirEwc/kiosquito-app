import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert, AlertButton } from '../components/ui/Alert';

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: { title: '' },
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState({
      visible: true,
      options,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Alert
        visible={alertState.visible}
        title={alertState.options.title}
        message={alertState.options.message}
        buttons={alertState.options.buttons}
        type={alertState.options.type}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

// Convenience functions that mimic the native Alert API
export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], type?: 'info' | 'success' | 'warning' | 'error') => {
    // This will be set by the AlertProvider
    if (typeof window !== 'undefined' && (window as any).__customAlert) {
      (window as any).__customAlert.showAlert({ title, message, buttons, type });
    }
  },
};