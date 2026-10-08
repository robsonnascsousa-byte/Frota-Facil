import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/** Returns only the verification status; it never grants a permission. */
export default function AccessStatus() {
    const { roleLoading, roleError, refreshRole } = useAuth();
    if (roleLoading) return <p role="status" className="p-5 rounded-lg border border-bone/10 text-bone/70">Verificando seu nível de acesso…</p>;
    if (roleError) return <div role="alert" className="p-5 rounded-lg border border-bone/10 text-bone/70">
        <p>{roleError}</p>
        <button type="button" onClick={refreshRole} className="mt-3 px-4 py-2 rounded border border-bone/30 text-bone">Verificar acesso novamente</button>
    </div>;
    return null;
}
