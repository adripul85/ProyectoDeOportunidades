import React from 'react';
import { Link } from 'react-router-dom';

interface SellerStoreBannerProps {
    sellerId: string;
    sellerName: string;
    sellerAvatar: string;
}

const SellerStoreBanner: React.FC<SellerStoreBannerProps> = ({ sellerId, sellerName, sellerAvatar }) => {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-light-200 shadow-sm flex items-center justify-between group hover:shadow-premium transition-all duration-500">
            <div className="flex items-center gap-5">
                <div className="relative">
                    <img
                        src={sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=random`}
                        alt={sellerName}
                        className="size-14 rounded-2xl object-cover border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                    />
                    <div className="absolute -bottom-1 -right-1 size-5 bg-primary-vibrant rounded-lg flex items-center justify-center border border-white">
                        <span className="material-symbols-outlined text-white text-[12px] font-black">verified</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-base font-black text-dark-800 tracking-tight">
                        Más productos de {sellerName}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Explorá todo lo que tiene para ofrecer
                    </p>
                </div>
            </div>

            <Link
                to={`/shop/${sellerId}`}
                className="bg-white text-primary-vibrant border-2 border-primary-vibrant px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-vibrant hover:text-white transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
            >
                <span className="material-symbols-outlined text-lg">storefront</span>
                Ver tienda
            </Link>
        </div>
    );
};

export default SellerStoreBanner;
