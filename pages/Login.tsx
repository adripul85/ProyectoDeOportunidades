
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../App';
import { useAuth } from '../lib/auth';


const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const navigate = useNavigate();
  const { notify } = useNotification();
  const { login, register, loginWithGoogle } = useAuth();

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      notify({ type: 'error', title: 'Entrada Inválida', message: 'Por favor ingresa tus credenciales.', icon: 'error' });
      triggerShake();
      return;
    }

    setIsLoadingAuth(true);
    try {
      if (isLogin) {
        await login(email, password);
        notify({ type: 'success', title: 'Sesión Iniciada', message: 'Accediendo a tu panel seguro.', icon: 'verified_user' });
        navigate('/dashboard');
      } else {
        await register(email, password);
        notify({ type: 'info', title: 'Cuenta Creada', message: 'Se ha enviado un correo electrónico de verificación.', icon: 'mail' });
        setShowVerificationSent(true);
      }
    } catch (err: any) {
      triggerShake();
      notify({ type: 'error', title: 'Error de Autenticación', message: err.message || 'Credenciales inválidas.', icon: 'security' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      notify({ type: 'success', title: 'Autenticación Exitosa', message: 'Identidad validada vía Google.', icon: 'verified_user' });
      navigate('/dashboard');
    } catch (err: any) {
      notify({ type: 'error', title: 'Error de Inicio de Sesión Social', message: err.message || 'No se pudo completar la autenticación.', icon: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-dark-950">

      {/* --- AMBIENT BACKGROUND EFFECTS --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-900/30 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-red-900/20 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-1000 relative z-10">

        {/* --- GLASS CARD --- */}
        <div className={`bg-dark-900/60 backdrop-blur-2xl rounded-[40px] p-10 md:p-14 border border-white/10 shadow-2xl relative transition-all duration-300 ${isShaking ? 'animate-shake ring-2 ring-red-500/50' : 'hover:border-white/20'}`}>

          {showVerificationSent ? (
            <div className="text-center">
              <div className="size-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <span className="material-symbols-outlined text-5xl text-emerald-400">mark_as_unread</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Verificar Identidad</h1>
              <p className="text-sm font-bold text-gray-400 mb-12 leading-relaxed">
                Hemos enviado un protocolo de activación a tu dirección de correo electrónico:<br />
                <span className="text-white font-black border-b-2 border-primary-500 pb-0.5">{email}</span>
              </p>

              <div className="space-y-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-5 bg-white text-dark-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>Ir al Dashboard</span>
                </button>
                <div className="pt-10 border-t border-white/10">
                  <button
                    onClick={() => { setShowVerificationSent(false); setIsLogin(true); }}
                    className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-primary-400 transition-all underline underline-offset-8"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <div className="size-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-900/40">
                  <span className="material-symbols-outlined text-white text-3xl font-black">lock</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {isLogin ? 'Acceso Seguro' : 'Registrar Operador'}
                </h1>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-2">
                  {isLogin ? 'Infraestructura Protegida' : 'Crea Tu Identidad Financiera'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1 group-focus-within:text-primary-400 transition-colors">ID Electrónico (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@entidad.com"
                    className="w-full px-6 py-5 rounded-2xl border border-white/5 bg-dark-800/50 font-bold text-white focus:bg-dark-800 focus:border-primary-500/50 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1 group-focus-within:text-primary-400 transition-colors">Clave de Acceso</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-6 py-5 rounded-2xl border border-white/5 bg-dark-800/50 font-bold text-white focus:bg-dark-800 focus:border-primary-500/50 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button type="button" className="text-[10px] font-black text-gray-600 hover:text-primary-400 uppercase tracking-widest transition-colors">Recuperar Acceso</button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingAuth}
                  className={`w-full py-6 text-xs font-black uppercase tracking-widest rounded-3xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${isLoadingAuth
                    ? 'bg-dark-800 text-gray-600 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:opacity-90 shadow-primary-900/30'
                    }`}
                >
                  <span>{isLoadingAuth ? 'VALIDANDO...' : isLogin ? 'VALIDAR Y ACCEDER' : 'INICIALIZAR CUENTA'}</span>
                  {!isLoadingAuth && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                </button>
              </form>

              <div className="mt-12">
                <div className="relative flex items-center justify-center mb-10">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <span className="relative px-6 bg-transparent text-[9px] font-black uppercase text-gray-600 tracking-[0.2em] bg-dark-900/60 backdrop-blur-xl">Proveedor de Identidad</span>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoadingAuth}
                  className="w-full flex items-center justify-center gap-4 py-5 px-6 bg-white rounded-3xl hover:bg-gray-100 transition-all font-black text-[10px] uppercase tracking-widest text-dark-800 shadow-lg shadow-white/5 group"
                >
                  <svg className="size-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </button>
              </div>

              <div className="mt-14 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all border-b-2 border-transparent hover:border-primary-500 pb-1"
                >
                  {isLogin ? "¿NO TIENES CUENTA? REGÍSTRATE AHORA" : "¿YA ESTÁS REGISTRADO? INICIO SEGURO"}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-12 text-[9px] font-black text-gray-600 uppercase tracking-widest px-12 leading-relaxed opacity-60">
          Al acceder a esta plataforma, aceptas nuestros <span className="text-gray-500 underline decoration-primary-500/20 hover:text-gray-400 cursor-pointer">Protocolos de Servicio</span> y Política de Resguardo.
        </p>
      </div>
    </div>
  );
};

export default Login;
