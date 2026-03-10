import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { completeUserProfile } from '../lib/users';
import { useNotification } from '../context/NotificationContext';
import { mapAuthError } from '../lib/error-map';

const RegisterWizard = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { register, refreshProfile, user } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        dni: '',
        phone: '',
        city: '',
        state: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!formData.email || !formData.password) {
                notify({ type: 'error', title: 'Faltan datos', message: 'Email y contraseña son obligatorios.', icon: 'error' });
                return;
            }
            setIsLoading(true);
            try {
                await register(formData.email, formData.password);
                setStep(2);
            } catch (error: any) {
                const friendlyMessage = mapAuthError(error.code);
                notify({ type: 'error', title: 'Error de Registro', message: friendlyMessage, icon: 'error' });
            } finally {
                setIsLoading(false);
            }
        } else if (step === 2) {
            if (!formData.displayName || !formData.dni) {
                notify({ type: 'error', title: 'Faltan datos', message: 'Nombre y DNI son obligatorios.', icon: 'error' });
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (!formData.phone || !formData.city || !formData.state) {
                notify({ type: 'error', title: 'Faltan datos', message: 'Completa tu ubicación y contacto.', icon: 'error' });
                return;
            }

            setIsLoading(true);
            try {
                if (!user) throw new Error("Sesión no detectada.");

                await completeUserProfile(user.uid, {
                    displayName: formData.displayName,
                    dni: formData.dni,
                    email: user.email || formData.email,
                    phone: formData.phone,
                    location: {
                        city: formData.city,
                        state: formData.state
                    },
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName)}&background=random`
                });

                await refreshProfile();
                notify({ type: 'success', title: '¡Bienvenido!', message: 'Tu cuenta ha sido configurada con éxito.', icon: 'verified_user' });
                navigate('/dashboard');
            } catch (error: any) {
                notify({ type: 'error', title: 'Error Final', message: error.message || 'No se pudo completar el perfil.', icon: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const steps = [
        { id: 1, title: 'Cuenta', icon: 'account_circle' },
        { id: 2, title: 'Identidad', icon: 'badge' },
        { id: 3, title: 'Contacto', icon: 'location_on' },
    ];

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary-500/30">
            {/* Background elements (matching Login.tsx) */}
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-primary-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2">
                                <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'bg-white/5 text-gray-500 border border-white/5'}`}>
                                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s.id ? 'text-primary-400' : 'text-gray-600'}`}>{s.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${(step / steps.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-primary-600 to-indigo-600"
                        />
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-dark-900/40 backdrop-blur-3xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Crear Cuenta</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paso 1: Tus datos de acceso</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Email Corporativo / Personal</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="MAIL@EJEMPLO.COM"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Contraseña</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Sobre Ti</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paso 2: Necesitamos estos datos para tu seguridad</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Nombre Completo</label>
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            placeholder="JUAN PEREZ"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700 uppercase"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Documento Nacional de Identidad</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            value={formData.dni}
                                            onChange={handleChange}
                                            placeholder="12.345.678"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Contacto</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paso 3: Datos de contacto y entrega</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Teléfono de Contacto</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+54 9 11 0000-0000"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Ciudad</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="EJ: CABA"
                                                className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700 uppercase"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-2">Provincia</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                placeholder="BUENOS AIRES"
                                                className="w-full px-6 py-4 rounded-2xl border-2 border-white/5 bg-dark-800/30 text-white text-[11px] font-black tracking-widest outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-700 uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 flex items-center justify-between gap-4">
                        {step > 1 && step < 4 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-8 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all"
                            >
                                Volver
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={isLoading}
                            className={`flex-grow py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'bg-white/5 text-gray-600' : 'bg-primary-600 text-white shadow-xl shadow-primary-900/20 hover:bg-primary-500'}`}
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                <>
                                    <span>{step === 3 ? 'Finalizar Registro' : 'Siguiente Paso'}</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link
                        to="/login"
                        className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-primary-400 transition-all border-b border-transparent hover:border-primary-500/30 pb-1"
                    >
                        ¿Ya tienes una identidad? Acceder aquí
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterWizard;
