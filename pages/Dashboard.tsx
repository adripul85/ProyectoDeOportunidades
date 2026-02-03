import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getUserTransactions, TransactionData } from '../lib/transactions';
import { getReviewForTransaction } from '../lib/reviews';
import { updateUserProfile } from '../lib/users';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import ReviewModal from '../components/ReviewModal';
import DeleteAccountModal from '../components/DeleteAccountModal';


export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<'compras' | 'ventas' | 'perfil'>('compras');
  const [transactions, setTransactions] = useState<{ compras: any[], ventas: any[] }>({ compras: [], ventas: [] });
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [reviewedTransactions, setReviewedTransactions] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newCertification, setNewCertification] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    phone: '',
    city: '',
    state: '',
    avatar: '',
    certifications: [] as string[],
    verificationBadges: {
      identityVerified: false,
      addressVerified: false,
      phoneVerified: false,
    }
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || '',
        city: userProfile.location?.city || '',
        state: userProfile.location?.state || '',
        avatar: userProfile.avatar || '',
        certifications: userProfile.certifications || [],
        verificationBadges: userProfile.verificationBadges || {
          identityVerified: false,
          addressVerified: false,
          phoneVerified: false,
        }
      });
    }
  }, [userProfile]);


  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getUserTransactions(user.uid);
      setTransactions(data);

      // Check which transactions have been reviewed
      const reviewed = new Set<string>();
      for (const transaction of data.compras) {
        const review = await getReviewForTransaction(transaction.id);
        if (review) {
          reviewed.add(transaction.id);
        }
      }
      setReviewedTransactions(reviewed);

      setLoading(false);
    }
    loadData();
  }, [user]);

  // Handle profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);

    const result = await updateUserProfile(user.uid, {
      displayName: profileForm.displayName,
      bio: profileForm.bio,
      phone: profileForm.phone,
      avatar: profileForm.avatar,
      certifications: profileForm.certifications,
      verificationBadges: profileForm.verificationBadges,
      location: {
        city: profileForm.city,
        state: profileForm.state,
      }
    });

    setSavingProfile(false);

    if (result.success) {
      notify({
        type: 'success',
        title: 'Perfil Actualizado',
        message: 'Tus cambios han sido guardados exitosamente.',
        icon: 'check_circle'
      });
      // Reload to see changes
      window.location.reload();
    } else {
      notify({
        type: 'error',
        title: 'Error',
        message: 'No pudimos actualizar tu perfil.',
        icon: 'error'
      });
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notify({
        type: 'error',
        title: 'Archivo Inválido',
        message: 'Por favor selecciona una imagen.',
        icon: 'error'
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const url = await uploadFile(file, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      setProfileForm({ ...profileForm, avatar: url });
      notify({
        type: 'success',
        title: 'Avatar Actualizado',
        message: 'Tu foto de perfil ha sido subida.',
        icon: 'check_circle'
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Error',
        message: 'No pudimos subir tu imagen.',
        icon: 'error'
      });
    }

    setUploadingAvatar(false);
  };

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

  const list = activeTab === 'compras' ? transactions.compras : transactions.ventas;

  // Helper components for the new design
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
              {activeTab === 'compras' ? 'Mis Compras' : activeTab === 'ventas' ? 'Vendedor Marketplace' : 'Configuración de Perfil'}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              {activeTab === 'compras' ? 'Rastrea tus órdenes y administra pagos protegidos.' : activeTab === 'ventas' ? 'Monitorea tus ingresos y optimiza tu rendimiento.' : 'Mantén actualizada tu seguridad e insignias.'}
            </p>
          </div>

          <div className="flex bg-white p-2 rounded-[24px] border border-light-200 shadow-premium">
            {[
              { id: 'compras', label: 'Compras', icon: 'shopping_bag' },
              { id: 'ventas', label: 'Ventas', icon: 'dashboard' },
              { id: 'perfil', label: 'Perfil', icon: 'settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
                      { label: 'Órdenes Activas', count: 3, icon: 'order_approve', active: true },
                      { label: 'Completadas', count: 42, icon: 'check_circle', active: false },
                      { label: 'Disputadas', count: 0, icon: 'gavel', active: false },
                      { label: 'Canceladas', count: 12, icon: 'cancel', active: false }
                    ].map((item) => (
                      <button key={item.label} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${item.active ? 'bg-primary-50 border-primary-100 text-primary-vibrant shadow-sm translate-x-1' : 'border-light-100 text-gray-400 hover:border-light-200'}`}>
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black ${item.active ? 'bg-primary-vibrant text-white' : 'bg-light-100'}`}>{item.count}</span>
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
                      { label: 'Todas las Ventas', count: 42, icon: 'list', active: true },
                      { label: 'Esperando Envío', count: 2, icon: 'local_shipping', active: false },
                      { label: 'En Inspección', count: 3, icon: 'visibility', active: false },
                      { label: 'Liberando Fondos', count: 1, icon: 'payments', active: false },
                      { label: 'Completadas', count: 36, icon: 'check_circle', active: false }
                    ].map((item) => (
                      <button key={item.label} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${item.active ? 'bg-primary-vibrant border-primary-vibrant text-white shadow-xl translate-x-1' : 'border-light-100 text-gray-400 hover:border-light-200'}`}>
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black ${item.active ? 'bg-white/20' : 'bg-light-100'}`}>{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium">
                  <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em] pl-1 mb-8 text-center uppercase">October 2023</h3>
                  <div className="grid grid-cols-7 gap-y-6 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-[9px] font-black text-gray-300">{d}</span>)}
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
                <MetricCard title="Saldo Pendiente" value="$245.00" subtext="Fondos en periodo de garantía" icon="account_balance_wallet" color="bg-amber-50 text-amber-500" />
                <MetricCard title="Saldo Disponible" value="$1,020.50" subtext="Retirar fondos ahora →" icon="savings" color="bg-primary-50 text-primary-vibrant" />
                <MetricCard title="Ventas Totales Históricas" value="$5,400.00" subtext="En 124 transacciones" icon="trending_up" color="bg-emerald-50 text-emerald-500" />
              </div>
            )}

            {/* DASHBOARD HEADER SEARCH & ACTIONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-2">
              <h2 className="text-2xl font-black text-dark-800 tracking-tighter">
                {activeTab === 'compras' ? 'Compras Recientes' : activeTab === 'ventas' ? 'Ventas Recientes' : 'Nodos de Seguridad'}
              </h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 hover:bg-light-50 transition-all">
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  Filtros
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">Comprado 12 Dic, 2023</p>
                      </div>

                      {/* Escrow Status & Progress */}
                      <div className="flex-[1.5] space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estado Escrow:</p>
                            <p className="text-sm font-black text-primary-vibrant uppercase tracking-tight">
                              {deal.status === 'IN_TRANSIT' ? 'Ítem Enviado' : deal.status === 'COMPLETED' ? 'Fondos Liberados' : 'Periodo de Inspección'}
                            </p>
                          </div>
                          {deal.status === 'IN_TRANSIT' && (
                            <div className="bg-primary-50 px-4 py-2 rounded-xl text-primary-vibrant font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-primary-100/50">
                              <span className="material-symbols-outlined text-xs">local_shipping</span>
                              Rastrea: 4529330201
                            </div>
                          )}
                          {deal.status === 'PAID' && (
                            <div className="bg-amber-50 px-4 py-2 rounded-xl text-amber-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              2d 14h para inspeccionar
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
                          <ProgressStep label="Pago Retenido" active={deal.status === 'PAID'} completed={['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(deal.status)} />
                          <ProgressStep label="Enviado" active={deal.status === 'IN_TRANSIT'} completed={['DELIVERED', 'COMPLETED'].includes(deal.status)} />
                          <ProgressStep label="Recibido" active={deal.status === 'DELIVERED'} completed={['COMPLETED'].includes(deal.status)} />
                          <ProgressStep label="Fondos Liberados" active={deal.status === 'COMPLETED'} completed={false} isLast />
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions Panel */}
                    <div className="bg-light-50/50 px-10 py-6 border-t border-light-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <p className="text-[11px] font-bold text-dark-400 uppercase tracking-widest leading-relaxed max-w-[400px]">
                        {deal.status === 'PAID' && "Por favor inspecciona el ítem. Si estás satisfecho, libera los fondos al vendedor."}
                        {deal.status === 'IN_TRANSIT' && "En tránsito. Entrega esperada para el 15 de Dic."}
                        {deal.status === 'COMPLETED' && "Esta transacción ha finalizado. ¡Esperamos que te guste tu producto!"}
                      </p>
                      <div className="flex gap-4 w-full sm:w-auto">
                        {deal.status === 'PAID' ? (
                          <>
                            <button className="flex-1 sm:flex-none px-8 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-red-500 rounded-2xl transition-all hover:bg-red-50 hover:border-red-100">Reportar Problema</button>
                            <button className="flex-1 sm:flex-none px-8 py-4 bg-primary-vibrant text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:opacity-95 shadow-xl shadow-primary-vibrant/20">Confirmar y Liberar Fondos</button>
                          </>
                        ) : deal.status === 'IN_TRANSIT' ? (
                          <button className="w-full sm:w-auto px-10 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 rounded-2xl transition-all hover:bg-light-50">Rastrear Envío</button>
                        ) : deal.status === 'COMPLETED' ? (
                          <Link to={`/product/${deal.itemId}`} className="w-full sm:w-auto px-10 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 rounded-2xl transition-all hover:bg-light-50 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">replay</span> Comprar de Nuevo
                          </Link>
                        ) : (
                          <button className="w-full sm:w-auto px-10 py-4 bg-white border border-light-200 text-[10px] font-black uppercase tracking-widest text-dark-800 rounded-2xl transition-all hover:bg-light-50">Ver Detalles</button>
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
              )}

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
                <button className="w-full md:w-auto bg-light-50 border border-light-100 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-dark-800 hover:bg-light-100 transition-all">Abrir Caso</button>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE TAB CONTENT (Simplified for Redesign consistency) */}
        {activeTab === 'perfil' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-light-50 animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto px-6 py-20 pb-32">
              <div className="flex items-center gap-6 mb-12">
                <button onClick={() => setActiveTab('compras')} className="size-14 rounded-2xl bg-white border border-light-200 flex items-center justify-center text-dark-800 shadow-sm hover:translate-x-[-4px] transition-transform">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-3xl font-black text-dark-800 tracking-tighter uppercase">Configuración de Protocolo de Seguridad</h1>
              </div>

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Avatar Upload Hub */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium flex flex-col items-center">
                    <div className="size-40 rounded-[48px] border-8 border-light-50 overflow-hidden shadow-inner group relative mb-8">
                      <img src={profileForm.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.displayName)}`} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-dark-800/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                        <input type="file" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                    <h3 className="text-xl font-black text-dark-800 mb-1">{profileForm.displayName}</h3>
                    <p className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest">{user?.email}</p>
                  </div>

                  <div className="bg-red-50 p-10 rounded-[40px] border border-red-100 space-y-4">
                    <h4 className="text-red-600 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined">report</span> Zona de Advertencia
                    </h4>
                    <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest leading-relaxed">
                      Eliminación permanente de historial de transacciones y certificados de verificación.
                    </p>
                    <button onClick={(e) => { e.preventDefault(); setDeleteModalOpen(true); }} className="w-full bg-white text-red-600 border border-red-100 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50">Purgar Datos</button>
                  </div>
                </div>

                {/* Main Form Area */}
                <div className="lg:col-span-8 bg-white p-12 rounded-[48px] border border-light-200 shadow-premium space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Nombre de Protocolo Mercante</label>
                      <input value={profileForm.displayName} onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })} className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Bio de Inteligencia</label>
                      <textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} rows={4} className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 resize-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Nodo de Ciudad</label>
                      <input value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Contacto Seguro</label>
                      <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none" />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-light-100">
                    <button type="submit" className="w-full bg-primary-vibrant text-white font-black py-6 rounded-3xl uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary-vibrant/20 transition-all hover:scale-[1.01]">
                      {savingProfile ? 'Actualizando Protocolo...' : 'Asegurar Cambios'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER MOCKUP BASED ON IMAGE */}
      <footer className="bg-white border-t border-light-100 py-12">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary-vibrant">verified_user</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escrow de Mercado Seguro v2.4</p>
          </div>

          <div className="flex items-center gap-8">
            {['Política de Privacidad', 'Términos de Servicio', 'Protección al Comprador'].map(link => (
              <a key={link} href="#" className="text-[10px] font-black text-dark-800 uppercase tracking-widest hover:text-primary-vibrant transition-colors">{link}</a>
            ))}
          </div>

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">© 2023 MarketTrust Inc. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* MODAL COMPONENTS */}
      {selectedTransaction && (
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
      )}
      <DeleteAccountModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} />
    </div>
  );
}
