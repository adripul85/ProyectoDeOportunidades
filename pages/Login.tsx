import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-dark-950 selection:bg-primary-500/30 selection:text-white">

      {/* --- PREMIUM AMBIENT BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-primary-900/20 rounded-full blur-[120px] animate-mesh-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px] animate-mesh-2"></div>
        <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] bg-red-900/10 rounded-full blur-[100px] animate-mesh-3"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 mix-blend-overlay"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >

        {/* --- GLASS CARD --- */}
        <div className={`bg-dark-900/40 backdrop-blur-3xl rounded-[60px] p-10 md:p-14 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative transition-all duration-300 ${isShaking ? 'animate-shake ring-4 ring-red-500/30' : 'hover:border-white/20'}`}>

          <AnimatePresence mode="wait">
            {showVerificationSent ? (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="size-24 bg-emerald-500/10 rounded-[40px] flex items-center justify-center mx-auto mb-12 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)] animate-float">
                  <span className="material-symbols-outlined text-5xl text-emerald-400">mark_as_unread</span>
                </div>
                <h1 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase">Verificar Identidad</h1>
                <p className="text-xs font-bold text-gray-400 mb-14 leading-relaxed uppercase tracking-widest px-4">
                  Hemos enviado un protocolo de activación a tu dirección de correo electrónico:<br />
                  <span className="text-white font-black border-b-2 border-primary-500 pb-0.5 mt-4 block">{email}</span>
                </p>

                <div className="space-y-6">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-6 bg-white text-dark-950 text-[10px] font-black uppercase tracking-[0.3em] rounded-[32px] shadow-2xl hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined text-xl text-primary-vibrant">verified</span>
                    <span>Acceder al Nodo Principal</span>
                  </button>
                  <div className="pt-12 border-t border-white/5">
                    <button
                      onClick={() => { setShowVerificationSent(false); setIsLogin(true); }}
                      className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] hover:text-primary-400 transition-all"
                    >
                      Volver al Identificador
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-14">
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className="size-20 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-primary-900/60 ring-4 ring-white/5"
                  >
                    <span className="material-symbols-outlined text-white text-4xl font-black">lock</span>
                  </motion.div>
                  <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                    {isLogin ? 'Acceso Seguro' : 'Registrar'}
                  </h1>
                  <div className="flex items-center justify-center gap-3">
                    <div className="size-1.5 bg-primary-vibrant rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
                      {isLogin ? 'Infraestructura Protegida' : 'Crea Tu Identidad'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="group">
                    <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-2 group-focus-within:text-primary-400 transition-colors">Identificador Electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="MAIL@SISTEMA.COM"
                      className="w-full px-8 py-5 rounded-[28px] border-2 border-white/5 bg-dark-800/30 font-black text-[11px] text-white tracking-widest focus:bg-dark-800 focus:border-primary-500/50 outline-none transition-all placeholder:text-gray-700 uppercase"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-2 group-focus-within:text-primary-400 transition-colors">Clave de Nodo</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-8 py-5 rounded-[28px] border-2 border-white/5 bg-dark-800/30 font-bold text-[11px] text-white tracking-widest focus:bg-dark-800 focus:border-primary-500/50 outline-none transition-all placeholder:text-gray-700"
                    />
                  </div>

                  {isLogin && (
                    <div className="text-right px-2">
                      <button type="button" className="text-[10px] font-black text-gray-600 hover:text-primary-400 uppercase tracking-[0.2em] transition-colors">¿Olvidaste el acceso?</button>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoadingAuth}
                    className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] rounded-[32px] transition-all flex items-center justify-center gap-4 shadow-2xl ${isLoadingAuth
                      ? 'bg-dark-800 text-gray-600 cursor-not-allowed border border-white/5'
                      : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:shadow-primary-900/40 hover:scale-[1.02]'
                      }`}
                  >
                    <span>{isLoadingAuth ? 'AUTENTICANDO...' : isLogin ? 'VALIDAR Y ACCEDER' : 'INICIALIZAR'}</span>
                    {!isLoadingAuth && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                  </motion.button>
                </form>

                <div className="mt-14">
                  <div className="relative flex items-center justify-center mb-12">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <span className="relative px-6 bg-transparent text-[9px] font-black uppercase text-gray-600 tracking-[0.3em] backdrop-blur-xl">Autenticación Externa</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleLogin}
                    disabled={isLoadingAuth}
                    className="w-full flex items-center justify-center gap-4 py-5 px-6 bg-white rounded-[28px] transition-all font-black text-[10px] uppercase tracking-[0.3em] text-dark-800 shadow-xl group"
                  >
                    <svg className="size-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sincronizar Google
                  </motion.button>
                </div>

                <div className="mt-16 text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-gray-500 font-black text-[9px] uppercase tracking-[0.3em] hover:text-white transition-all border-b-2 border-transparent hover:border-primary-500 pb-2"
                  >
                    {isLogin ? "¿NO TIENES CUENTA? REGISTRO" : "¿YA ESTÁS REGISTRADO? ACCESO"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-12 text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] px-12 leading-relaxed opacity-40">
          Infraestructura de red sujeta a <span className="text-gray-500 underline decoration-primary-500/40 hover:text-gray-400 cursor-pointer">Seguridad de Nodo</span> y Resguardo de Activos.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
