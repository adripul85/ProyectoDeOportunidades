import React from 'react';

export default function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-border-light overflow-hidden animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-[5/4] bg-gray-200" />

            {/* Content skeleton */}
            <div className="p-6 space-y-3">
                {/* Category badge */}
                <div className="h-4 w-20 bg-gray-200 rounded" />

                {/* Title */}
                <div className="h-5 bg-gray-200 rounded w-3/4" />

                {/* Price and trust */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="h-6 w-24 bg-gray-200 rounded" />
                    <div className="h-5 w-16 bg-gray-200 rounded-md" />
                </div>
            </div>
        </div>
    );
}
