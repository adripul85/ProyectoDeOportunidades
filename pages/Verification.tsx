
import React from 'react';

const Verification = () => {
  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 flex flex-col items-center">
      <div className="w-full flex justify-center items-center gap-6 mb-12">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-14 bg-primary-coral rounded-full rotate-12 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined">description</span>
          </div>
          <span className="text-xs font-bold text-primary-coral">Paso 1</span>
        </div>
        <div className="h-1 w-12 bg-coral-soft rounded-full"></div>
        <div className="flex flex-col items-center gap-2 opacity-40">
          <div className="w-10 h-14 bg-slate-300 rounded-full -rotate-12 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">face</span>
          </div>
          <span className="text-xs font-bold text-slate-400">Paso 2</span>
        </div>
        <div className="h-1 w-12 bg-slate-200 rounded-full"></div>
        <div className="flex flex-col items-center gap-2 opacity-40">
          <div className="w-10 h-14 bg-slate-300 rounded-full rotate-6 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
          <span className="text-xs font-bold text-slate-400">Final</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start">
        <div className="lg:col-span-4 flex flex-col items-center lg:items-end gap-6">
          <div className="relative bg-white p-6 shadow-xl border-4 border-coral-soft rounded-3xl max-w-sm">
            <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white lg:hidden"></div>
            <h2 className="text-xl font-bold mb-3 font-display">¡Hola! Soy Capi.</h2>
            <p className="text-gray-600 leading-relaxed font-medium">
              Para empezar, necesito una fotito del frente de tu DNI. Asegúrate de que haya buena luz.
            </p>
            <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold">
              <span className="material-symbols-outlined">verified</span>
              <span className="text-sm">Estamos cuidando tu identidad.</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-48 h-48 bg-sky-soft rounded-full flex items-center justify-center shadow-inner overflow-hidden">
              <img alt="Capi" className="w-40 h-40" src="https://picsum.photos/300/300?avatar" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-white/40">
            <div className="relative bg-slate-100 aspect-[4/3] overflow-hidden rounded-3xl border-8 border-primary-coral">
              <div className="absolute inset-0 bg-center bg-cover opacity-50" style={{ backgroundImage: "url('https://picsum.photos/800/600?workspace')" }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-10">
                <div className="w-full h-full max-w-sm max-h-56 border-4 border-dashed border-white/60 rounded-3xl flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-6xl text-white mb-2">badge</span>
                  <p className="text-white font-bold text-center px-4">Pon tu documento aquí</p>
                </div>
              </div>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button className="bg-primary-coral hover:bg-primary-coral/90 text-white w-20 h-20 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-4 border-white">
                  <span className="material-symbols-outlined text-4xl">photo_camera</span>
                </button>
              </div>
              <div className="absolute top-6 left-6 bg-emerald-400 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <div className="size-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-xs font-black tracking-widest uppercase">¡Todo Listo!</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 px-2">
              <button className="text-slate-500 font-bold flex items-center gap-2 hover:text-primary-coral transition-colors px-4 py-2 rounded-full hover:bg-primary-coral/10">
                <span className="material-symbols-outlined">upload_file</span>
                Prefiero subir un archivo
              </button>
              <div className="flex gap-4">
                <button className="px-8 py-3 rounded-full bg-slate-100 font-bold text-slate-500 hover:bg-slate-200 transition-all">Volver</button>
                <button className="px-10 py-3 rounded-full bg-primary-mint font-bold text-white shadow-lg hover:shadow-primary-mint/30 transition-all hover:-translate-y-1">Continuar</button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-4 p-4 bg-white/40 border-2 border-lemon-soft rounded-2xl">
              <div className="size-10 bg-lemon-soft/30 rounded-full flex items-center justify-center text-yellow-600">
                <span className="material-symbols-outlined">light_mode</span>
              </div>
              <p className="text-sm font-semibold text-slate-600">Busca un lugar con luz natural</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/40 border-2 border-mint-soft rounded-2xl">
              <div className="size-10 bg-mint-soft/30 rounded-full flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <p className="text-sm font-semibold text-slate-600">Privacidad sagrada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
