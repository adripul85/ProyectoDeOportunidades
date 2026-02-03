
import React from 'react';

interface Props {
    images: string[];
    activeImg: number;
    setActiveImg: (idx: number) => void;
    isHovered: boolean;
    setIsHovered: (val: boolean) => void;
    mousePos: { x: number; y: number };
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onFullscreen: () => void;
    onShare: () => void;
    imageRef: React.RefObject<HTMLDivElement>;
}


const ProductMedia: React.FC<Props> = ({
    images,
    activeImg,
    setActiveImg,
    isHovered,
    setIsHovered,
    mousePos,
    onMouseMove,
    onFullscreen,
    imageRef
}) => {
    return (
        <div className="bg-white rounded-[40px] p-8 shadow-premium border border-light-200/50">
            {/* Primary Viewer */}
            <div
                ref={imageRef}
                className="aspect-square bg-light-50 rounded-[32px] overflow-hidden mb-8 cursor-zoom-in relative group border border-light-100"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={onMouseMove}
                onClick={onFullscreen}
            >
                <img
                    src={images[activeImg]}
                    alt="Activo Principal del Protocolo"
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out"
                    style={{
                        transform: isHovered ? `scale(1.8)` : 'scale(1)',
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                    }}
                />

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-primary-vibrant/20 transition-all duration-700 rounded-[30px]" />

                <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-dark-800 shadow-premium opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl">fullscreen</span>
                    Alta Resolución
                </div>

                {/* Index Indicator */}
                <div className="absolute top-8 left-8 bg-dark-800/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest pl-5 flex items-center gap-2">
                    <span className="size-1.5 bg-primary-vibrant rounded-full animate-pulse" />
                    Activo {activeImg + 1} / {images.length}
                </div>
            </div>

            {/* Gallery Strip */}
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-1">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImg(idx)}
                        className={`shrink-0 size-24 rounded-2xl border-2 overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 ${activeImg === idx ? 'border-primary-vibrant ring-8 ring-primary-vibrant/5 shadow-lg shadow-primary-vibrant/10' : 'border-light-100 hover:border-light-200'
                            }`}
                    >
                        <img src={img} className="w-full h-full object-cover" alt={`Registro de Perspectiva ${idx + 1}`} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProductMedia;
