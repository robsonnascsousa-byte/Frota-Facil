import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: string | null;
    loading: boolean;
    passwordRecovery: boolean;
    signUp: (email: string, password: string, nome?: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
    clearPasswordRecovery: () => void;
    isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [passwordRecovery, setPasswordRecovery] = useState(false);
    const isConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchRole = async (userId: string): Promise<string> => {
            console.log('[AuthContext] fetchRole started for:', userId);
            try {
                // Add a timeout to the fetch call
                const fetchPromise = supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 3000)
                );

                const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

                if (error) {
                    console.warn('[AuthContext] fetchRole error:', error.message);
                    return 'operacao';
                }
                if (!data) {
                    console.log('[AuthContext] No profile data found');
                    return 'operacao';
                }
                console.log('[AuthContext] fetchRole returning:', data.role);
                return data.role || 'operacao';
            } catch (err) {
                console.error('[AuthContext] fetchRole error or timeout:', err);
                return 'operacao'; // Falha fechada: nunca eleva privilégio por indisponibilidade.
            }
        };

        const handleSession = async (newSession: Session | null) => {
            if (!isMounted) return;
            console.log('[AuthContext] handleSession called, session exists:', !!newSession);

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                const userRole = await fetchRole(newSession.user.id);
                console.log('[AuthContext] Setting role to:', userRole);
                if (isMounted) setRole(userRole);
            } else {
                setRole(null);
            }

            if (isMounted) {
                console.log('[AuthContext] Setting loading to false');
                setLoading(false);
            }
        };

        // Subscribe to auth changes FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                console.log('[AuthContext] onAuthStateChange event:', _event);
                if (_event === 'PASSWORD_RECOVERY') {
                    setPasswordRecovery(true);
                }
                await handleSession(newSession);
            }
        );

        // Then get initial session
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            console.log('[AuthContext] getSession resolved');
            if (isMounted && loading) {
                handleSession(initialSession);
            }
        });

        // Safety timeout for the entire loading state
        const timeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('[AuthContext] Global loading timeout reached');
                setLoading(false);
            }
        }, 8000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [isConfigured]);

    const signUp = async (email: string, password: string, nome?: string, _role?: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome
                }
            }
        });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { error };
    };

    const signOut = async () => {
        console.log('[AuthContext] signOut called');
        try {
            await supabase.auth.signOut();
            console.log('[AuthContext] Supabase signOut completed');
        } catch (error) {
            console.error('[AuthContext] signOut error:', error);
        }
        setUser(null);
        setSession(null);
        setRole(null);
        console.log('[AuthContext] User state cleared');
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        return { error };
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
    };

    const clearPasswordRecovery = () => setPasswordRecovery(false);

    const value = {
        user,
        session,
        role,
        loading,
        passwordRecovery,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        clearPasswordRecovery,
        isConfigured
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
