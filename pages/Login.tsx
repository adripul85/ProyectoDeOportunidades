
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../App';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  // Security states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  
  const navigate = useNavigate();
  const { notify } = useNotification();

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_SECONDS = 30;

  useEffect(() => {
    let timer: number;
    if (lockoutTimeLeft > 0) {
      timer = window.setInterval(() => {
        setLockoutTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutTimeLeft > 0) return;

    if (!email || !password) {
      notify({
        type: 'error',
        title: '¡Ups! Algo falta',
        message: 'Por favor, completa todos los campos para continuar con la magia.',
        icon: 'error'
      });
      triggerShake();
      return;
    }

    // Simulated login logic
    if (isLogin) {
      // For demo purposes: if password is "error", simulate failure
      if (password === 'error' || (email === 'test@test.com' && password !== 'admin123')) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        triggerShake();

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutTimeLeft(LOCKOUT_SECONDS);
          setFailedAttempts(0);
          notify({
            type: 'error',
            title: '¡Cofre bloqueado! 🛡️',
            message: `Demasiados intentos. Por seguridad, espera ${LOCKOUT_SECONDS} segundos.`,
            icon: 'security'
          });
        } else {
          notify({
            type: 'warning',
            title: 'Credenciales inválidas',
            message: `Te quedan ${MAX_ATTEMPTS - newAttempts} intentos antes del bloqueo.`,
            icon: 'lock_open_right'
          });
        }
        return;
      }

      // Success
      notify({
        type: 'success',
        title: '¡Bienvenido de nuevo! ✨',
        message: 'Qué bueno verte otra vez por De Oportunidades.',
        icon: 'celebration'
      });
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      // Registration flow
      notify({
        type: 'info',
        title: '¡Casi listo! 📧',
        message: 'Hemos enviado un link mágico a tu correo.',
        icon: 'mail'
      });
      setShowVerificationSent(true);
    }
  };

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      notify({
        type: 'success',
        title: '¡Link reenviado! 🚀',
        message: 'Revisa tu bandeja de entrada (y la de spam por las dudas).',
        icon: 'send_and_archive'
      });
      setIsResending(false);
    }, 1000);
  };

  const handleVerified = () => {
    notify({
      type: 'success',
      title: '¡Email verificado! 🎉',
      message: 'Tu cuenta ha sido activada con éxito.',
      icon: 'verified'
    });
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  const isLocked = lockoutTimeLeft > 0;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-sky-soft/20 overflow-hidden relative">
      <div className="absolute top-20 left-10 w-32 h-32 bg-coral-soft/20 blob-bg rotate-12 -z-10"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-mint-soft/20 blob-bg -rotate-12 -z-10"></div>
      
      <div className="w-full max-w-md">
        <div className={`bg-white hand-drawn-card p-8 md:p-10 relative transition-all duration-300 ${isShaking ? 'animate-shake' : ''} ${isLocked ? 'border-primary-coral ring-4 ring-primary-coral/10' : ''}`}>
          
          {showVerificationSent ? (
            <div className="text-center animate-bounce-short">
              <div className="w-24 h-24 bg-berry/10 rounded-full flex items-center justify-center mx-auto mb-6 hand-drawn-border">
                <span className="material-symbols-outlined text-5xl text-berry">mark_as_unread</span>
              </div>
              <h1 className="text-3xl font-black font-display mb-4">¡Confirma tu email! 💌</h1>
              <p className="font-handwritten text-xl text-gray-600 mb-8 leading-relaxed">
                Hemos enviado un enlace de activación a:<br/>
                <span className="text-berry font-bold break-all bg-berry/5 px-2 rounded-lg">{email}</span>. <br/>
                ¡Estamos a un clic de empezar!
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleVerified}
                  className="w-full py-4 bg-mint-soft text-dark-charcoal text-lg font-black rounded-full hand-drawn-border shadow-[4px_4px_0px_rgba(68,68,68,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">verified</span>
                  <span>¡Ya confirmé mi cuenta!</span>
                </button>
                <button 
                  onClick={handleResend}
                  disabled={isResending}
                  className={`w-full py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${isResending ? 'text-gray-400' : 'text-gray-500 hover:text-berry'}`}
                >
                  <span className={`material-symbols-outlined text-lg ${isResending ? 'animate-spin' : ''}`}>sync</span>
                  {isResending ? 'Reenviando...' : '¿No llegó nada? Reenviar email'}
                </button>
                <div className="pt-6 border-t border-dashed border-gray-100">
                  <button 
                    onClick={() => { setShowVerificationSent(false); setIsLogin(true); }}
                    className="text-sm font-black text-coral-soft underline underline-offset-4 hover:text-primary-coral"
                  >
                    ¿Error en el email? Volver al inicio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute -top-16 -right-8 w-24 h-24 bg-lemon-soft hand-drawn-border rounded-full flex items-center justify-center rotate-12 shadow-lg hidden md:flex">
                 <img src="https://picsum.photos/100/100?avatar" alt="Capi" className="w-16 h-16 rounded-full" />
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-black font-display mb-2">
                  {isLogin ? '¡Hola de nuevo!' : '¡Únete a la fiesta!'}
                </h1>
                {isLocked ? (
                  <div className="bg-coral-soft/10 p-3 rounded-2xl border-2 border-primary-coral/30 mt-4 animate-pulse">
                    <p className="font-bold text-primary-coral text-sm">
                      <span className="material-symbols-outlined align-middle mr-1">timer</span>
                      Bloqueo temporal: {lockoutTimeLeft}s
                    </p>
                  </div>
                ) : (
                  <p className="font-handwritten text-xl text-gray-500">
                    {isLogin ? 'Tu cofre de seguridad te espera.' : 'Empieza a hacer tratos seguros hoy.'}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Email Mágico</label>
                  <input 
                    type="email" 
                    value={email}
                    disabled={isLocked}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@aventura.com"
                    className="w-full px-6 py-4 rounded-2xl border-3 border-dark-charcoal font-handwritten text-xl focus:ring-4 focus:ring-mint-soft/50 focus:border-berry transition-all bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Palabra Secreta</label>
                  <input 
                    type="password" 
                    value={password}
                    disabled={isLocked}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl border-3 border-dark-charcoal font-handwritten text-xl focus:ring-4 focus:ring-mint-soft/50 focus:border-berry transition-all bg-white disabled:opacity-50"
                  />
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button type="button" disabled={isLocked} className="text-sm font-bold text-berry hover:underline disabled:opacity-30">¿Olvidaste tu llave?</button>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLocked}
                  className={`w-full py-5 text-xl font-black rounded-full hand-drawn-border transition-all flex items-center justify-center gap-3 ${
                    isLocked 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300' 
                    : 'bg-coral-soft text-dark-charcoal shadow-[4px_4px_0px_rgba(68,68,68,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                  }`}
                >
                  <span>{isLocked ? 'Cofre Cerrado' : isLogin ? '¡Entrar ahora!' : '¡Crear mi cuenta!'}</span>
                  <span className="material-symbols-outlined font-black">{isLocked ? 'lock' : 'magic_button'}</span>
                </button>
              </form>

              {!isLocked && (
                <div className="mt-8">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-gray-200"></div>
                    </div>
                    <span className="relative px-4 bg-white text-xs font-black uppercase text-gray-400 tracking-widest">O también</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <button className="flex items-center justify-center gap-2 py-4 px-4 bg-white hand-drawn-card hover:bg-sky-soft hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold text-sm">
                      <span className="material-symbols-outlined text-blue-500 font-bold">public</span>
                      Google
                    </button>
                    <button className="flex items-center justify-center gap-2 py-4 px-4 bg-white hand-drawn-card hover:bg-gray-50 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold text-sm">
                      <span className="material-symbols-outlined text-dark-charcoal font-bold">apple</span>
                      Apple
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-10 text-center border-t-2 border-dashed border-gray-100 pt-6">
                <p className="font-bold text-gray-500">
                  {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres un aventurero?'}
                </p>
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={isLocked}
                  className="mt-2 text-berry font-black text-lg underline decoration-dashed underline-offset-4 hover:text-coral-soft transition-colors disabled:opacity-30"
                >
                  {isLogin ? '¡Regístrate gratis!' : '¡Inicia sesión aquí!'}
                </button>
              </div>
            </>
          )}
        </div>
        
        <p className="text-center mt-8 text-xs font-bold text-gray-400">
          Al entrar, aceptas nuestras <span className="underline cursor-pointer">reglas de caballeros</span> y <span className="underline cursor-pointer">privacidad mágica</span>.
        </p>
      </div>
    </div>
  );
};

export default Login;
