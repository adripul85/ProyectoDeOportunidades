import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-20 h-20 border-[6px]'
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
            <div className="relative">
                <div className={`${sizeClasses[size]} border-light-200 rounded-full`} />
                <div className={`${sizeClasses[size]} border-t-primary-vibrant border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_15px_rgba(37,99,235,0.2)]`} />
            </div>
            {text && (
                <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse pl-1">
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
