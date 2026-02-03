import React, { useState, useEffect } from 'react';
import { getReviewsForSeller, ReviewData } from '../lib/reviews';
import RatingStars from './RatingStars';
import LoadingSpinner from './LoadingSpinner';
import { Link } from 'react-router-dom';

interface ReviewsListProps {
    sellerId: string;
}

// Helper function to format relative time
const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Recent Activity';

    const now = new Date();
    const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return 'Just Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
};

export default function ReviewsList({ sellerId }: ReviewsListProps) {
    const [reviews, setReviews] = useState<(ReviewData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [sellerId]);

    const loadReviews = async () => {
        setLoading(true);
        const data = await getReviewsForSeller(sellerId);
        setReviews(data);
        setLoading(false);
    };

    const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

    if (loading) {
        return <LoadingSpinner size="md" text="Syncing Merchant Logs..." />;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-20 bg-light-50/50 rounded-[40px] border border-light-200 border-dashed">
                <div className="bg-white size-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-light-200">
                    <span className="material-symbols-outlined text-4xl text-gray-200">reviews</span>
                </div>
                <h3 className="text-xl font-black text-dark-800 mb-2 uppercase tracking-tight">Zero Protocols Logged</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    This merchant has no historical performance data
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedReviews.map((review) => (
                    <div key={review.id} className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium transition-all hover:-translate-y-1">
                        {/* Header */}
                        <div className="flex items-start gap-5 mb-6">
                            <Link to={`/profile/${review.buyerId}`} className="shrink-0 relative">
                                <img
                                    src={review.buyerAvatar}
                                    alt={review.buyerName}
                                    className="size-14 rounded-2xl object-cover ring-4 ring-light-50 transition-all hover:ring-primary-vibrant/20"
                                />
                                <div className="absolute -bottom-1 -right-1 size-5 bg-white rounded-lg flex items-center justify-center shadow-sm border border-light-100">
                                    <span className="material-symbols-outlined text-[10px] text-primary-vibrant font-black">verified</span>
                                </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-1 mb-3">
                                    <Link to={`/profile/${review.buyerId}`} className="font-black text-dark-800 truncate hover:text-primary-vibrant transition-colors text-[11px] uppercase tracking-tight leading-tight">
                                        {review.buyerName}
                                    </Link>
                                    <span className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">{getRelativeTime(review.createdAt)}</span>
                                </div>
                                <RatingStars rating={review.rating} size="sm" />
                            </div>
                        </div>

                        {/* Comment */}
                        {review.comment && (
                            <div className="relative">
                                <span className="absolute -top-2 -left-2 text-4xl text-primary-vibrant/10 font-black leading-none select-none">"</span>
                                <p className="text-dark-800 text-[13px] font-bold leading-relaxed relative z-10 pl-2">
                                    {review.comment}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Show More Button */}
            {reviews.length > 5 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-6 bg-light-50/50 hover:bg-light-100 rounded-[32px] border border-transparent hover:border-light-200 text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                    {showAll ? (
                        <>
                            <span className="material-symbols-outlined text-sm font-black">keyboard_double_arrow_up</span>
                            Hide Protocol Logs
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-sm font-black">keyboard_double_arrow_down</span>
                            View All Performance Data ({reviews.length})
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
