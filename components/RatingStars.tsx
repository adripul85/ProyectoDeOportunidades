import React from 'react';

interface RatingStarsProps {
    rating: number; // 0-5, can be decimal for display
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRate?: (rating: number) => void;
}

export default function RatingStars({ rating, size = 'md', interactive = false, onRate }: RatingStarsProps) {
    const [hoverRating, setHoverRating] = React.useState(0);

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-3xl'
    };

    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

    const renderStar = (index: number) => {
        const starValue = index + 1;
        const fillPercentage = Math.min(Math.max(displayRating - index, 0), 1) * 100;

        return (
            <div
                key={index}
                className={`relative inline-block ${interactive ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => interactive && setHoverRating(starValue)}
                onMouseLeave={() => interactive && setHoverRating(0)}
                onClick={() => interactive && onRate && onRate(starValue)}
            >
                {/* Background star (empty) */}
                <span className={`material-symbols-outlined ${sizeClasses[size]} text-gray-300`}>
                    star
                </span>

                {/* Filled star (overlay) */}
                {fillPercentage > 0 && (
                    <span
                        className={`material-symbols-outlined ${sizeClasses[size]} text-amber-400 absolute top-0 left-0 overflow-hidden drop-shadow-sm`}
                        style={{
                            width: `${fillPercentage}%`,
                            fontVariationSettings: "'FILL' 1"
                        }}
                    >
                        star
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="inline-flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map(renderStar)}
        </div>
    );
}
