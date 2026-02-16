
import React, { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/marketplace/Home';
import Dashboard from './pages/Dashboard';
import Dispute from './pages/transactions/Dispute';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Verification from './pages/Verification';
import Login from './pages/Login';
import Publish from './pages/publish/Publish';
import Messages from './pages/Messages';
import ProductDetail from './pages/marketplace/ProductDetail';
import Search from './pages/marketplace/Search';
import Checkout from './pages/transactions/Checkout';
import TransactionDetail from './pages/transactions/TransactionDetail';
import Success from './pages/transactions/Success';
import PaymentSuccess from './pages/transactions/PaymentSuccess';
import PaymentFailure from './pages/transactions/PaymentFailure';
import ESgrow from './pages/transactions/ESgrow';
import CompleteProfile from './pages/CompleteProfile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import EscrowInfo from './pages/EscrowInfo';
import VerifyDelivery from './pages/VerifyDelivery';
import TermsAndCosts from './pages/legal/TermsAndCosts';
import PaymentMethods from './pages/legal/PaymentMethods';
import ResolutionCenter from './pages/ResolutionCenter';
import RequireProfile from './components/RequireProfile';
import ProtectedRoute from './components/ProtectedRoute';
import ReportedItems from './pages/admin/ReportedItems';
import { AuthProvider, useAuth } from './lib/auth';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';

import Header from './components/Header';
import Deals from './pages/Deals';
import Cart from './pages/Cart';

// --- App Infrastructure ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const Footer = () => (
  <footer className="mt-40 py-24 bg-white border-t border-light-200">
    <div className="max-w-[1440px] mx-auto px-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-10 opacity-40 grayscale group-hover:grayscale-0 transition-all">
        <span className="material-symbols-outlined text-3xl font-black text-red-600">target</span>
        <h2 className="text-xl font-black tracking-tighter text-red-600">De Oportunidades 🎯</h2>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-12">
        <Link className="hover:text-dark-800 transition-colors" to="/">Protocolos</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/">Cumplimiento</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/">Infraestructura</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/">Nodo de Soporte</Link>
      </div>
      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.4em] text-center">
        © 2026 De Oportunidades Inc. Transacciones seguras mediante protocolos encriptados.
      </p>
    </div>
  </footer>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <HashRouter>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen relative font-body text-dark-charcoal">
              <Header />
              <main className="flex-grow">
                <PageTransition>
                  <Routes>
                    <Route path="/admin/reports" element={
                      <ProtectedRoute requireAdmin={true}>
                        <ReportedItems />
                      </ProtectedRoute>
                    } />
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/publish" element={<RequireProfile><Publish /></RequireProfile>} />
                    <Route path="/transaction/:id" element={<RequireProfile><ESgrow /></RequireProfile>} />

                    <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
                    <Route path="/messages" element={<RequireProfile><Messages /></RequireProfile>} />
                    <Route path="/messages/:chatId" element={<RequireProfile><Messages /></RequireProfile>} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/profile/:uid?" element={<Profile />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/settings" element={<RequireProfile><Settings /></RequireProfile>} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/failure" element={<PaymentFailure />} />
                    <Route path="/payment/pending" element={<PaymentSuccess />} />
                    <Route path="/dispute/:transactionId" element={<Dispute />} />
                    <Route path="/verification" element={<Verification />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/escrow-info" element={<EscrowInfo />} />
                    <Route path="/legal/costs" element={<TermsAndCosts />} />
                    <Route path="/verify-delivery" element={<VerifyDelivery />} />
                    <Route path="/resolution-center" element={<RequireProfile><ResolutionCenter /></RequireProfile>} />
                  </Routes>
                </PageTransition>
              </main>
              <Footer />
            </div>
          </HashRouter>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
