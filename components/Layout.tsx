import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from './Header';

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
        <Link className="hover:text-dark-800 transition-colors" to="/escrow-info">Seguridad Escrow</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/legal/costs">Términos y Costos</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/escrow-info">Cómo Funciona</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/resolution-center">Centro de Ayuda</Link>
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

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen relative font-body text-dark-charcoal">
        <Header />
        <main className="flex-grow">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
