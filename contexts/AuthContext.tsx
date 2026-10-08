import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadUserRole } from '../services/authRole';
import type { UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: UserRole | null;
    roleLoading: boolean;
    roleError: string | null;
    refreshRole: () => void;
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
    const [role, setRole] = useState<UserRole | null>(null);
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleError, setRoleError] = useState<string | null>(null);
    const [roleRevision, setRoleRevision] = useState(0);
    const [passwordRecovery, setPasswordRecovery] = useState(false);
    const isConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        let receivedAuthEvent = false;
        const handleSession = (newSession: Session | null) => {
            if (!isMounted) return;
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setRole(null);
            setRoleError(null);
            setRoleLoading(Boolean(newSession?.user));
            setRoleRevision(value => value + 1);
            setLoading(false);
        };

        // Keep this callback synchronous. A Supabase query awaited here can
        // deadlock while Auth holds its session lock, especially on tab focus.
        // Profile reads run in the separate effect below, after the callback.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                receivedAuthEvent = true;
                if (_event === 'PASSWORD_RECOVERY') {
                    setPasswordRecovery(true);
                }
                handleSession(newSession);
            }
        );

        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            // A newer auth event wins over this initial snapshot.
            if (isMounted && !receivedAuthEvent) {
                handleSession(initialSession);
            }
        }).catch(() => {
            if (isMounted && !receivedAuthEvent) setLoading(false);
        });

        const timeout = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 8000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [isConfigured]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        setRole(null);
        setRoleError(null);
        setRoleLoading(Boolean(user));
        if (!user) return () => { active = false; controller.abort(); };

        // A task boundary also guarantees the Auth lock can be released.
        const task = setTimeout(() => {
            loadUserRole(supabase, user.id, controller.signal).then(verifiedRole => {
                if (active) setRole(verifiedRole);
            }).catch(error => {
                if (active) setRoleError((error as Error).message);
            }).finally(() => {
                if (active) setRoleLoading(false);
            });
        }, 0);
        return () => {
            active = false;
            clearTimeout(task);
            controller.abort();
        };
    }, [user?.id, roleRevision]);

    const refreshRole = () => {
        setRole(null);
        setRoleError(null);
        setRoleLoading(Boolean(user));
        setRoleRevision(value => value + 1);
    };

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
        setRoleError(null);
        setRoleLoading(false);
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
        roleLoading,
        roleError,
        refreshRole,
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
