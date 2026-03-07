import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/auth';
import { NotificationProvider } from '../context/NotificationContext';
import { CartProvider } from '../context/CartContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <HashRouter>
            {children}
          </HashRouter>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default AppProviders;
