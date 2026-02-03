import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LoadingSpinner from '../components/LoadingSpinner';

interface RequireProfileProps {
    children: React.ReactElement;
}

export default function RequireProfile({ children }: RequireProfileProps) {
    const { user, userProfile, profileLoading } = useAuth();
    const location = useLocation();

    // Show loading while checking profile
    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Cargando perfil..." />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Redirect to complete profile if profile is incomplete
    if (userProfile && !userProfile.profileComplete) {
        return <Navigate to="/complete-profile" replace />;
    }

    // Render children if profile is complete
    return children;
}
