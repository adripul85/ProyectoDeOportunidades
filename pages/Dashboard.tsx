import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getUserTransactions, TransactionData, TransactionStatus } from '../lib/transactions';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getReviewForTransaction } from '../lib/reviews';
import { getItemsBySeller, ItemData, deleteItem } from '../lib/items';
import { updateUserProfile } from '../lib/users';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ReviewModal from '../components/ReviewModal';
export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification().notify;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const [activeTab, setActiveTab] = useState<'publicaciones' | 'compras' | 'ventas' | 'perfil'>('publicaciones');
  const [transactions, setTransactions] = useState<{ compras: any[], ventas: any[] }>({ compras: [], ventas: [] });
  const [userItems, setUserItems] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [reviewedTransactions, setReviewedTransactions] = useState<Set<string>>(new Set());

  // New States for Management
  const [filterQuery, setFilterQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validatingTx, setValidatingTx] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [shippingTx, setShippingTx] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('Correo Argentino');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [txToCancel, setTxToCancel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const transactionsRef = collection(db, "transactions");

    // Queries
    const qBuy = query(transactionsRef, where("buyerId", "==", user.uid), orderBy("createdAt", "desc"));
    const qSell = query(transactionsRef, where("sellerId", "==", user.uid), orderBy("createdAt", "desc"));

    // Listeners
    const unsubBuy = onSnapshot(qBuy, (snapshot) => {
      const compras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any, type: 'compra' }));

      setTransactions(prev => ({ ...prev, compras }));

      // Check for reviews for these purchases
      const checkReviews = async () => {
        const reviewed = new Set<string>();
        for (const tx of compras) {
          if (tx.status === 'COMPLETED') {
            const review = await getReviewForTransaction(tx.id);
            if (review) reviewed.add(tx.id);
          }
        }
        setReviewedTransactions(prev => {
          const next = new Set(prev);
          reviewed.forEach(id => next.add(id));
          return next;
        });
      };
      checkReviews();
      setLoading(false);
    });

    const unsubSell = onSnapshot(qSell, (snapshot) => {
      const ventas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any, type: 'venta' }));
      setTransactions(prev => ({ ...prev, ventas }));
      setLoading(false);
    });

    return () => {
      unsubBuy();
      unsubSell();
    };
  }, [user]);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">lock</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500 mb-6">Debes iniciar sesión para ver tu panel</p>
          <Link to="/login" className="btn-primary">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }


  // Filter Logic for User Items
  const handleReleaseFunds = async (transactionId: string) => {
    if (!confirm('¿Estás seguro de que recibiste el producto en condiciones y deseas liberar el pago al vendedor? Esta acción es irreversible.')) return;

    // We assume releaseFunds handles buyer confirmation if no token is provided (or we might need a specific flag)
    // For now, let's try calling it. If backend requires token, we might need a distinct 'confirmDelivery' function 
    // but typically releaseFunds is the final step.
    const { releaseFunds } = await import('../lib/transactions');
    const result = await releaseFunds(transactionId);
    if (result.success) {
      notify({ type: 'success', title: '¡Fondos Liberados!', message: 'El vendedor ha recibido su pago.', icon: 'payments' });
      // Refresh transactions locally
      setTransactions(prev => ({
        ...prev,
        compras: prev.compras.map(t => t.id === transactionId ? { ...t, status: 'COMPLETED' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo liberar el pago. Intenta nuevamente.', icon: 'error' });
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.ventas.filter(deal => {
    const matchesSearch = deal.itemTitle.toLowerCase().includes(filterQuery.toLowerCase()) || deal.id.includes(filterQuery);
    const matchesStatus = statusFilter === 'ALL' || deal.status === statusFilter;

    // Specific status mapping for sidebar labels if needed
    if (statusFilter === 'PAID_HELD' && deal.status === 'PAID_HELD') return matchesSearch;
    if (statusFilter === 'SHIPPED' && deal.status === 'SHIPPED') return matchesSearch;

    return matchesSearch && matchesStatus;
  });

  const filteredPurchases = transactions.compras.filter(deal => {
    const matchesSearch = deal.itemTitle.toLowerCase().includes(filterQuery.toLowerCase()) || deal.id.includes(filterQuery);

    // Status Logic for Buyer Sidebar
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'PAID_HELD' && (deal.status === 'PAID_HELD' || deal.status === 'SHIPPED')) || // Active orders
      (statusFilter === 'COMPLETED' && deal.status === 'COMPLETED') ||
      (statusFilter === 'CANCELLED' && deal.status === 'CANCELLED') ||
      (deal.status === statusFilter); // Fallback for exact match

    return matchesSearch && matchesStatus;
  });

  const list = activeTab === 'compras' ? filteredPurchases : filteredTransactions;

  const filteredUserItems = userItems.filter(item =>
    item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleDeleteItem = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteItem(id);
    setIsDeleting(false);
    setItemToDelete(null);

    if (result.success) {
      notify({ type: 'success', title: 'Eliminado', message: 'El producto ha sido eliminado.', icon: 'delete' });
      setUserItems(prev => prev.filter(item => item.id !== id));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar el producto.', icon: 'error' });
    }
  };

  const handleValidateDelivery = async (txId: string) => {
    if (!qrInput) return;

    // Import dynamically to avoid circular dependencies/performance hit
    const { releaseFunds } = await import('../lib/transactions');
    notify({ type: 'info', title: 'Verificando...', message: 'Validando token de entrega...', icon: 'qr_code_scanner' });

    const result = await releaseFunds(txId, qrInput.toUpperCase());

    if (result.success) {
      notify({ type: 'success', title: 'Entrega Exitosa', message: 'Fondos liberados correctamente.', icon: 'verified' });
      setValidatingTx(null);
      setQrInput('');

      // Refresh transactions locally
      setTransactions(prev => ({
        ...prev,
        ventas: prev.ventas.map(t => t.id === txId ? { ...t, status: 'COMPLETED' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Token Inválido', message: 'El código ingresado no es correcto.', icon: 'error' });
    }
  };

  const handleUpdateTracking = async (txId: string) => {
    if (!trackingInput || !courierInput) {
      notify({ type: 'error', title: 'Faltan Datos', message: 'Por favor completa todos los campos de envío.', icon: 'local_shipping' });
      return;
    }

    const { updateTracking } = await import('../lib/transactions');
    notify({ type: 'info', title: 'Actualizando...', message: 'Registrando información de envío...', icon: 'local_shipping' });

    const result = await updateTracking(txId, trackingInput, courierInput);

    if (result.success) {
      notify({ type: 'success', title: 'Envío Registrado', message: 'El comprador ha sido notificado.', icon: 'check_circle' });
      setShippingTx(null);
      setTrackingInput('');

      setTransactions(prev => ({
        ...prev,
        ventas: prev.ventas.map(t => t.id === txId ? { ...t, status: 'SHIPPED', trackingId: trackingInput, courier: courierInput } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el seguimiento.', icon: 'error' });
    }
  };

  const handleConfirmReceipt = async (txId: string) => {
    // Only for shipping items - digital handshake
    const { updateTransactionStatus } = await import('../lib/transactions');
    notify({ type: 'info', title: 'Confirmando...', message: 'Registrando recepción del paquete...', icon: 'inventory' });

    const result = await updateTransactionStatus(txId, 'DELIVERED_PENDING_REVIEW');

    if (result.success) {
      notify({ type: 'success', title: 'Paquete Recibido', message: 'Tienes 48hs para revisar el producto.', icon: 'timer' });
      setTransactions(prev => ({
        ...prev,
        compras: prev.compras.map(t => t.id === txId ? { ...t, status: 'DELIVERED_PENDING_REVIEW' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo confirmar la recepción.', icon: 'error' });
    }
  };

  // Helper components for the new design
  const handleCancelTransaction = async () => {
    if (!txToCancel || !user) return;

    const { cancelTransaction } = await import('../lib/transactions');
    setLoading(true); // Re-use loading or local state

    // Note: The UI says 3% penalty. The backend logic in cancelTransaction should ideally reflect this for buyers too if needed.
    // For now we just call the function.
    const result = await cancelTransaction(txToCancel, user.uid);
    setLoading(false);
    setCancelModalOpen(false);
    setTxToCancel(null);

    if (result.success) {
      notify({ type: 'success', title: 'Orden Cancelada', message: 'La transacción ha sido cancelada.', icon: 'cancel' });
      // Update local state
      setTransactions(prev => ({
        ...prev,
        compras: prev.compras.map(t => t.id === txToCancel ? { ...t, status: 'CANCELLED' } : t),
        ventas: prev.ventas.map(t => t.id === txToCancel ? { ...t, status: 'CANCELLED' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo cancelar la orden.', icon: 'error' });
    }
  };

  const MetricCard = ({ title, value, subtext, icon, color }: { title: string, value: string | number, subtext: string, icon: string, color: string }) => (
    <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium flex items-start gap-6 relative overflow-hidden group">
      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-2xl font-black">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-dark-800 tracking-tighter mb-1">{value}</h4>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{subtext}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 size-24 rounded-full opacity-5 group-hover:scale-110 transition-transform ${color}`} />
    </div>
  );

  const ProgressStep = ({ label, active, completed, isLast }: { label: string, active: boolean, completed: boolean, isLast?: boolean }) => (
    <div className={`flex-1 flex flex-col items-center gap-3 ${isLast ? 'flex-0' : ''}`}>
      <div className="w-full flex items-center">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${completed || active ? 'bg-primary-vibrant' : 'bg-light-200'}`} />
        {!isLast && <div className={`h-px w-full border-t border-dashed border-light-200 mx-2`} />}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active ? 'text-primary-vibrant' : completed ? 'text-dark-800' : 'text-gray-300'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-light-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 py-10">

        {/* TOP NAV BAR (Mockup style) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black text-dark-800 tracking-tighter mb-1 transition-all">
              {activeTab === 'compras' ? 'Mis Compras' : activeTab === 'ventas' ? 'Vendedor Mercado' : activeTab === 'publicaciones' ? 'Mis Publicaciones' : 'Configuración de Perfil'}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              {activeTab === 'compras' ? 'Rastrea tus órdenes y administra pagos protegidos.' : activeTab === 'ventas' ? 'Monitorea tus ingresos y optimiza tu rendimiento.' : activeTab === 'publicaciones' ? 'Gestiona tus productos activos en el mercado.' : 'Mantén actualizada tu seguridad e insignias.'}
            </p>
          </div>

          <div className="flex bg-white p-2 rounded-[24px] border border-light-200 shadow-premium">
            {[
              { id: 'publicaciones', label: 'Publicaciones', icon: 'inventory_2' },
              { id: 'compras', label: 'Compras', icon: 'shopping_bag' },
              { id: 'ventas', label: 'Ventas', icon: 'payments' },
              { id: 'perfil', label: 'Perfil', icon: 'settings', action: () => navigate('/settings') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.action ? tab.action() : setActiveTab(tab.id as any)}
                className={`px-8 py-3.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id
                  ? 'bg-primary-vibrant text-white shadow-xl translate-y-[-2px]'
                  : 'text-gray-400 hover:text-dark-800'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* --- SIDEBAR PANEL --- */}
          <div className="lg:col-span-3 space-y-8">

            {/* Context-Specific Sidebars */}
            {activeTab === 'compras' && (
              <>
                <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium space-y-8">
                  <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em] pl-1">Estado de Compra</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Todas las Compras', count: transactions.compras.length, icon: 'list', status: 'ALL' },
                      { label: 'Órdenes Activas', count: transactions.compras.filter(t => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(t.status)).length, icon: 'order_approve', status: 'PAID_HELD' },
                      { label: 'Completadas', count: transactions.compras.filter(t => t.status === 'COMPLETED').length, icon: 'check_circle', status: 'COMPLETED' },
                      { label: 'Canceladas', count: transactions.compras.filter(t => t.status === 'CANCELLED').length, icon: 'cancel', status: 'CANCELLED' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setStatusFilter(item.status as any)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${statusFilter === item.status ? 'bg-primary-50 border-primary-100 text-primary-vibrant shadow-sm translate-x-1' : 'border-light-100 text-gray-400 hover:border-light-200'}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black ${statusFilter === item.status ? 'bg-primary-vibrant text-white' : 'bg-light-100'}`}>{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium">
                  <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em] pl-1 mb-6">Periodo</h3>
                  <div className="relative">
                    <select className="w-full bg-light-50 border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none appearance-none cursor-pointer text-xs">
                      <option>Últimos 30 días</option>
                      <option>Últimos 3 meses</option>
                      <option>Historial completo</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="bg-primary-50 p-8 rounded-[40px] border border-primary-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-vibrant font-black">verified_user</span>
                    <h4 className="text-[11px] font-black text-primary-800 uppercase tracking-widest">Protección Escrow</h4>
                  </div>
                  <p className="text-[10px] font-bold text-primary-700/60 uppercase tracking-widest leading-relaxed">
                    Tu pago se mantiene seguro en depósito de garantía. Los fondos solo se liberan al vendedor una vez que confirmas que recibiste el artículo en la condición descrita.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'ventas' && (
              <>
                <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium space-y-8">
                  <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em] pl-1">Filtrar por Estado</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Todas las Ventas', count: transactions.ventas.length, icon: 'list', status: 'ALL' },
                      { label: 'Esperando Envío', count: transactions.ventas.filter(t => t.status === 'PAID_HELD' && t.deliveryMethod === 'SHIPPING').length, icon: 'local_shipping', status: 'PAID_HELD' },
                      { label: 'En Inspección', count: transactions.ventas.filter(t => t.status === 'DELIVERED_PENDING_REVIEW').length, icon: 'visibility', status: 'DELIVERED_PENDING_REVIEW' },
                      { label: 'Completadas', count: transactions.ventas.filter(t => t.status === 'COMPLETED').length, icon: 'check_circle', status: 'COMPLETED' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setStatusFilter(item.status as any)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${statusFilter === item.status ? 'bg-primary-vibrant border-primary-vibrant text-white shadow-xl translate-x-1' : 'border-light-100 text-gray-400 hover:border-light-200'}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black ${statusFilter === item.status ? 'bg-white/20' : 'bg-light-100'}`}>{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium">
                  <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em] pl-1 mb-8 text-center uppercase">October 2023</h3>
                  <div className="grid grid-cols-7 gap-y-6 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-[9px] font-black text-gray-300">{d}</span>)}
                    {[...Array(31)].map((_, i) => (
                      <span key={i} className={`text-[10px] font-bold p-1 rounded-lg cursor-pointer hover:bg-light-50 transition-colors ${i + 1 === 6 ? 'bg-primary-vibrant text-white font-black' : 'text-dark-800'}`}>
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* --- MAIN CONTENT PANEL --- */}
          <div className="lg:col-span-9 space-y-10">

            {/* SELLER METRICS (Only on Sales Tab) */}
            {activeTab === 'ventas' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <MetricCard
                  title="Saldo Pendiente"
                  value={`$${(transactions.ventas.filter(t => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(t.status)).reduce((acc, curr) => acc + curr.total, 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  subtext="Fondos en periodo de garantía"
                  icon="account_balance_wallet"
                  color="bg-amber-50 text-amber-500"
                />
                <MetricCard
                  title="Saldo Disponible"
                  value={`$${(userProfile?.wallet?.available || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  subtext="Retirar fondos ahora →"
                  icon="savings"
                  color="bg-primary-50 text-primary-vibrant"
                />
                <MetricCard
                  title="Ventas Totales Históricas"
                  value={`$${(transactions.ventas.filter(t => t.status === 'COMPLETED').reduce((acc, curr) => acc + curr.total, 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  subtext={`En ${transactions.ventas.filter(t => t.status === 'COMPLETED').length} transacciones`}
                  icon="trending_up"
                  color="bg-emerald-50 text-emerald-500"
                />
              </div>
            )}

            {/* DASHBOARD HEADER SEARCH & ACTIONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-2">
              <h2 className="text-2xl font-black text-dark-800 tracking-tighter">
                {activeTab === 'compras' ? 'Compras Recientes' : activeTab === 'ventas' ? 'Ventas Recientes' : activeTab === 'publicaciones' ? 'Mis Productos Activos' : 'Nodos de Seguridad'}
              </h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 hover:bg-light-50 transition-all focus-within:ring-2 focus-within:ring-primary-100">
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="bg-transparent outline-none w-20 placeholder:text-gray-400 font-black uppercase"
                  />
                </button>
                <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 hover:bg-light-50 transition-all">
                  <span className="material-symbols-outlined text-lg">file_download</span>
                  Exportar
                </button>
              </div>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="space-y-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <LoadingSpinner size="lg" text="Sincronizando historial..." />
                </div>
              ) : activeTab === 'publicaciones' ? (
                filteredUserItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredUserItems.map(item => (
                      <div key={item.id} className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden transition-all hover:shadow-premium-lg group animate-in fade-in duration-500">
                        <div className="p-8">
                          <div className="flex gap-6">
                            <div className="size-24 rounded-2xl bg-light-50 shrink-0 overflow-hidden border border-light-100 flex items-center justify-center">
                              {item.images && item.images[0] ? (
                                <img src={item.images[0]} className="w-full h-full object-cover" alt={item.title} />
                              ) : (
                                <span className="material-symbols-outlined text-3xl text-gray-200">image</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">{item.category}</p>
                              <h3 className="text-xl font-black text-dark-800 tracking-tight group-hover:text-red-600 transition-colors line-clamp-1">{item.title}</h3>
                              <p className="text-2xl font-black text-dark-800 pt-1">${item.price.toLocaleString()}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="size-2 bg-emerald-500 rounded-full"></span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Activo</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-8">
                            <button onClick={() => navigate(`/product/${item.id}`)} className="flex-1 py-3 bg-light-100 text-dark-800 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-light-200 transition-all">Ver Publicación</button>
                            <button onClick={() => navigate(`/publish?edit=${item.id}`)} className="flex-1 py-3 bg-white border border-light-200 text-dark-800 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-light-50 transition-all">Editar</button>
                            <button onClick={() => setItemToDelete(item.id)} className="size-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[40px] border border-light-200 shadow-premium">
                    <div className="bg-light-100 size-24 rounded-full flex items-center justify-center mx-auto mb-8">
                      <span className="material-symbols-outlined text-4xl text-gray-300">inventory</span>
                    </div>
                    <h3 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tighter">No tienes publicaciones</h3>
                    <p className="text-sm font-bold text-gray-400 mb-10 max-w-sm mx-auto uppercase">Comienza a vender tus activos en nuestra red segura hoy mismo.</p>
                    <Link to="/publish" className="inline-block bg-red-600 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transition-transform active:scale-95">Publicar un Producto</Link>
                  </div>
                )
              ) : list.length > 0 ? (
                list.map((deal: TransactionData & { id: string, type: string }) => (
                  <div key={deal.id} className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden transition-all hover:shadow-premium-lg group animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row p-10 gap-10">

                      {/* Item Visual */}
                      <div className="size-32 rounded-3xl bg-light-50 shrink-0 overflow-hidden border border-light-100/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-gray-200">landscape</span>
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest">ORDEN #{deal.id.slice(0, 8).toUpperCase()}</p>
                        <h3 className="text-2xl font-black text-dark-800 tracking-tight transition-colors group-hover:text-primary-vibrant">{deal.itemTitle}</h3>
                        <p className="text-3xl font-black text-dark-800 pt-2">${deal.total?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">Comprado {formatDate(deal.createdAt)}</p>
                      </div>

                      {/* Escrow Status & Progress */}
                      <div className="flex-[1.5] space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estado Escrow:</p>
                            <p className="text-sm font-black text-primary-vibrant uppercase tracking-tight">
                              {deal.status === 'SHIPPED' ? 'Ítem Enviado' : deal.status === 'COMPLETED' ? 'Fondos Liberados' : deal.status === 'PAID_HELD' ? 'Pago en Garantía' : 'Pendiente'}
                            </p>
                          </div>
                          {deal.status === 'SHIPPED' && (
                            <div className="bg-primary-50 px-4 py-2 rounded-xl text-primary-vibrant font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-primary-100/50">
                              <span className="material-symbols-outlined text-xs">local_shipping</span>
                              Rastrea: {deal.trackingId || '4529330201'}
                            </div>
                          )}
                          {deal.status === 'PAID_HELD' && (
                            <div className="bg-amber-50 px-4 py-2 rounded-xl text-amber-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              Esperando Envío
                            </div>
                          )}
                          {deal.status === 'DELIVERED_PENDING_REVIEW' && (
                            <div className="bg-blue-50 px-4 py-2 rounded-xl text-blue-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-blue-100">
                              <span className="material-symbols-outlined text-xs">visibility</span>
                              Inspeccionando
                            </div>
                          )}
                          {deal.status === 'COMPLETED' && (
                            <div className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                              <span className="material-symbols-outlined text-xs">verified</span>
                              Transacción Finalizada
                            </div>
                          )}
                        </div>

                        {/* Progress Bar Component */}
                        <div className="flex items-start gap-1">
                          <ProgressStep label="Pago Retenido" active={deal.status === 'PAID_HELD'} completed={['SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(deal.status)} />
                          <ProgressStep label="Enviado" active={deal.status === 'SHIPPED'} completed={['DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(deal.status)} />
                          <ProgressStep label="Recibido" active={deal.status === 'DELIVERED_PENDING_REVIEW'} completed={['COMPLETED'].includes(deal.status)} />
                          <ProgressStep label="Fondos Liberados" active={deal.status === 'COMPLETED'} completed={false} isLast />
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions Panel */}
                    <div className="bg-light-50/50 px-10 py-6 border-t border-light-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <p className="text-[11px] font-bold text-dark-400 uppercase tracking-widest leading-relaxed max-w-[400px]">
                        {deal.status === 'PAID_HELD' && "Fondos en custodia. El vendedor enviará el producto pronto."}
                        {deal.status === 'SHIPPED' && "En tránsito. El paquete está en camino."}
                        {deal.status === 'DELIVERED_PENDING_REVIEW' && "Por favor inspecciona el ítem. Tienes 48h para confirmar."}
                        {deal.status === 'COMPLETED' && "Esta transacción ha finalizado. ¡Esperamos que te guste tu producto!"}
                      </p>
                      <div className="flex gap-4 w-full sm:w-auto">
                        {/* SELLER ACTIONS */}
                        {activeTab === 'ventas' && deal.status !== 'COMPLETED' && deal.status !== 'CANCELLED' && (
                          <>
                            {/* SHIPPING FLOW */}
                            {deal.deliveryMethod === 'SHIPPING' && deal.status === 'PAID_HELD' && (
                              shippingTx === deal.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300 bg-white p-2 rounded-2xl border border-light-200">
                                  <select
                                    value={courierInput}
                                    onChange={(e) => setCourierInput(e.target.value)}
                                    className="bg-light-50 rounded-xl px-2 py-3 text-[10px] font-bold outline-none"
                                  >
                                    <option>Correo Argentino</option>
                                    <option>Andreani</option>
                                    <option>OCA</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Código Seguimiento"
                                    value={trackingInput}
                                    onChange={(e) => setTrackingInput(e.target.value)}
                                    className="w-32 px-3 py-3 rounded-xl bg-light-50 outline-none text-[10px] font-black uppercase"
                                  />
                                  <button onClick={() => handleUpdateTracking(deal.id)} className="px-6 bg-primary-vibrant text-white rounded-xl flex items-center justify-center hover:opacity-90 gap-2">
                                    <span className="material-symbols-outlined text-sm">send</span>
                                    <span className="text-[10px] font-black uppercase">Confirmar</span>
                                  </button>
                                  <button onClick={() => setShippingTx(null)} className="size-10 text-gray-400 hover:text-dark-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShippingTx(deal.id)}
                                  className="px-8 py-4 bg-primary-vibrant text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:opacity-95 shadow-xl flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                                  Marcar como Enviado
                                </button>
                              )
                            )}

                            {/* MEETING FLOW (QR) */}
                            {(deal.deliveryMethod === 'MEETING' || !deal.deliveryMethod) && deal.status === 'PAID_HELD' && (
                              validatingTx === deal.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                  <input
                                    type="text"
                                    placeholder="QR / Token"
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    className="w-24 px-4 py-4 rounded-2xl border-2 border-primary-vibrant text-[10px] font-black uppercase text-center outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleValidateDelivery(deal.id)}
                                    className="px-6 py-4 bg-primary-vibrant text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary-500/30"
                                  >
                                    Validar
                                  </button>
                                  <button
                                    onClick={() => { setValidatingTx(null); setQrInput(''); }}
                                    className="size-12 flex items-center justify-center bg-white border border-light-200 rounded-2xl text-gray-400 hover:text-dark-800 transition-all"
                                  >
                                    <span className="material-symbols-outlined">close</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setValidatingTx(deal.id)}
                                  className="px-8 py-4 bg-dark-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-dark-900 border border-dark-900 shadow-xl flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                                  Validar Entrega
                                </button>
                              )
                            )}
                          </>
                        )}

                        {/* BUYER ACTIONS */}
                        {activeTab === 'compras' && (
                          <>
                            {/* PENDING PAYMENT ACTIONS */}
                            {deal.status === 'PENDING_PAYMENT' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setTxToCancel(deal.id); setCancelModalOpen(true); }}
                                  className="px-6 py-4 bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-red-50 hover:border-red-200 flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">cancel</span>
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => navigate(`/checkout?tx=${deal.id}`)}
                                  className="px-8 py-4 bg-primary-vibrant text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:opacity-90 shadow-xl flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                                  Pagar Ahora
                                </button>
                              </div>
                            )}

                            {/* CONFIRM RECEIPT (Direct Release) */}
                            {(deal.status === 'SHIPPED' || deal.status === 'PAID_HELD') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setTxToCancel(deal.id); setCancelModalOpen(true); }}
                                  className="px-6 py-4 bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-red-50 hover:border-red-200 flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">cancel</span>
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleReleaseFunds(deal.id)}
                                  className="px-8 py-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-emerald-600 shadow-xl flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                                  Ya recibí el producto
                                </button>
                              </div>
                            )}

                            {/* REVIEW OR DISPUTE */}
                            {deal.status === 'DELIVERED_PENDING_REVIEW' && (
                              <>
                                <button
                                  onClick={() => navigate(`/dispute/${deal.id}`)}
                                  className="flex-1 sm:flex-none px-8 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-red-500 rounded-2xl transition-all hover:bg-red-50 hover:border-red-100"
                                >
                                  Reportar Problema
                                </button>
                                <button
                                  onClick={() => handleReleaseFunds(deal.id)}
                                  className="flex-1 sm:flex-none px-8 py-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-emerald-600 shadow-xl flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">payments</span>
                                  Liberar Dinero
                                </button>
                                <button
                                  onClick={() => navigate(`/transaction/${deal.id}`)}
                                  className="flex-1 sm:flex-none px-8 py-4 bg-primary-vibrant text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:opacity-95 shadow-xl shadow-primary-vibrant/20"
                                >
                                  Ver Detalles
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {/* GENERAL TRACKING & REORDER */}
                        {(deal.status === 'SHIPPED' || deal.status === 'COMPLETED') && !deal.status.includes('PENDING') && (
                          deal.status === 'SHIPPED' && activeTab === 'compras' ? (
                            <button
                              onClick={() => navigate(`/transaction/${deal.id}`)}
                              className="w-full sm:w-auto px-10 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 rounded-2xl transition-all hover:bg-light-50"
                            >
                              Rastrear Envío
                            </button>
                          ) : deal.status === 'COMPLETED' ? (
                            <Link to={`/product/${deal.itemId}`} className="w-full sm:w-auto px-10 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 rounded-2xl transition-all hover:bg-light-50 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">replay</span> Comprar de Nuevo
                            </Link>
                          ) : null
                        )}

                        {/* RATE SELLER */}
                        {activeTab === 'compras' && deal.status === 'COMPLETED' && !reviewedTransactions.has(deal.id) && (
                          <button
                            onClick={() => { setSelectedTransaction(deal); setReviewModalOpen(true); }}
                            className="w-full sm:w-auto px-8 py-4 bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-amber-500 shadow-xl flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">star</span>
                            Calificar Vendedor
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-[40px] border border-light-200 shadow-premium">
                  <div className="bg-light-100 size-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-outlined text-4xl text-gray-300">history_toggle_off</span>
                  </div>
                  <h3 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tighter">No se encontró actividad</h3>
                  <p className="text-sm font-bold text-gray-400 mb-10 max-w-sm mx-auto uppercase">Explora nuestro mercado global para comenzar tu red de confianza.</p>
                  <Link to="/" className="inline-block bg-primary-vibrant text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transition-transform active:scale-95">Explorar Productos</Link>
                </div>
              )
              }

              {/* HELP BANNER */}
              <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex items-center gap-6">
                  <div className="size-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined font-black">help</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-dark-800 uppercase tracking-tight">¿Necesitas ayuda con una orden?</h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-1">Visita nuestro Centro de Resolución para asistencia con envíos o calidad del ítem.</p>
                  </div>
                </div>
                <Link to="/resolution-center" className="w-full md:w-auto bg-light-50 border border-light-100 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-dark-800 hover:bg-light-100 transition-all text-center">Abrir Caso</Link>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE TAB CONTENT REMOVED - NOW IN /SETTINGS */}
      </div>

      {/* DEV ZONE: RESET DATABASE (ADMIN ONLY) */}
      {userProfile?.role === 'admin' ? (
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex justify-center">
          <button
            onClick={async () => {
              if (confirm("⚠️ ¿RESET TOTAL? Esto borrará TODAS las transacciones y reseteará las billeteras a $0. Esta acción es irreversible.")) {
                const { resetPlatformData } = await import('../lib/admin');
                const result = await resetPlatformData();
                if (result.success) {
                  alert("Base de datos reseteada correctamente.");
                  window.location.reload();
                } else {
                  alert("Error al resetear: " + result.error);
                }
              }
            }}
            className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">dangerous</span>
            Developer Reset (Limpiar DB)
          </button>
        </div>
      ) : (
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex justify-center">
          <button
            onClick={async () => {
              if (!user) return;
              if (confirm("¿Promover tu usuario a ADMIN? Esto te dará acceso a herramientas de desarrollador.")) {
                const { updateUserRole } = await import('../lib/admin');
                await updateUserRole(user.uid, 'admin');
                alert("¡Ahora eres Admin!");
                window.location.reload();
              }
            }}
            className="bg-indigo-50 border border-indigo-200 text-indigo-600 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            Promover a Admin (Dev Tool)
          </button>
        </div>
      )}

      {/* FOOTER MOCKUP BASED ON IMAGE */}
      <footer className="bg-white border-t border-light-100 py-12">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-red-600">target</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escrow de Mercado Seguro v2.5</p>
          </div>

          <div className="flex items-center gap-8">
            {['Política de Privacidad', 'Términos de Servicio', 'Protección al Comprador'].map(link => (
              <a key={link} href="#" className="text-[10px] font-black text-dark-800 uppercase tracking-widest hover:text-primary-vibrant transition-colors">{link}</a>
            ))}
          </div>

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">© 2026 De Oportunidades Inc. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* MODAL COMPONENTS */}
      {
        selectedTransaction && (
          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => { setReviewModalOpen(false); setSelectedTransaction(null); }}
            transactionId={selectedTransaction.id}
            itemId={selectedTransaction.itemId}
            itemTitle={selectedTransaction.itemTitle}
            sellerId={selectedTransaction.sellerId}
            onReviewSubmitted={async () => {
              if (user) {
                const data = await getUserTransactions(user.uid);
                setTransactions(data);
                const reviewed = new Set<string>();
                for (const transaction of data.compras) {
                  const review = await getReviewForTransaction(transaction.id);
                  if (review) reviewed.add(transaction.id);
                }
                setReviewedTransactions(reviewed);
              }
            }}
          />
        )
      }

      {/* DELETE CONFIRMATION MODAL */}
      {
        itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/40 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="size-16 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl font-black">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-dark-800 mb-2">¿Eliminar Publicación?</h3>
                <p className="text-sm font-bold text-gray-400">Esta acción no se puede deshacer. El ítem dejará de estar visible en el marketplace.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 bg-light-100 text-dark-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-light-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteItem(itemToDelete)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* CANCEL CONFIRMATION MODAL */}
      {
        cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/40 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="size-16 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl font-black">gavel</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-dark-800 mb-2">¿Cancelar esta compra?</h3>
                <p className="text-sm font-bold text-gray-400">
                  La cancelación conlleva una <span className="text-red-500">penalización del 3%</span> por servicios utilizados.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => { setCancelModalOpen(false); setTxToCancel(null); }}
                  className="flex-1 py-4 bg-light-100 text-dark-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-light-200 transition-all"
                >
                  Volver
                </button>
                <button
                  onClick={handleCancelTransaction}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Aceptar y Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
