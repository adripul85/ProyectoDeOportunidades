import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { getUserProfile, createUserProfile, UserProfile } from './users';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    profileLoading: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    register: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<any>;
    resetPassword: (email: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    // Fetch user profile
    const fetchUserProfile = async (currentUser: User) => {
        setProfileLoading(true);
        const profile = await getUserProfile(currentUser.uid);

        // If profile doesn't exist, create a basic one
        if (!profile) {
            await createUserProfile(currentUser.uid, {
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                avatar: currentUser.photoURL || '',
                phone: '',
                location: { city: '', state: '' },
                profileComplete: false
            });
            // Fetch again after creation
            const newProfile = await getUserProfile(currentUser.uid);
            setUserProfile(newProfile);
        } else {
            setUserProfile(profile);
        }
        setProfileLoading(false);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                await fetchUserProfile(currentUser);
            } else {
                setUserProfile(null);
                setProfileLoading(false);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

    const register = async (email: string, pass: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email, pass);
        if (credential.user) {
            await sendEmailVerification(credential.user);
        }
        return credential;
    };

    const logout = () => signOut(auth);

    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

    const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

    return (
        <AuthContext.Provider value={{ user, userProfile, profileLoading, loading, login, register, logout, loginWithGoogle, resetPassword, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
