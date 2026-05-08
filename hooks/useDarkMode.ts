import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

/**
 * Hook para gerenciar o tema dark/light mode
 * Persiste no localStorage e respeita preferência do sistema
 */
export function useDarkMode(): [Theme, () => void] {
    const getInitialTheme = useCallback((): Theme => {
        if (typeof window === 'undefined') return 'light';

        // Primeiro verifica localStorage
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }

        // Depois verifica preferência do sistema
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }, []);

    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Aplicar classe no documento
    useEffect(() => {
        const root = window.document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    // Escutar mudanças na preferência do sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem('theme');
            // Só muda automaticamente se o usuário não definiu preferência
            if (!stored) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    return [theme, toggleTheme];
}

export default useDarkMode;
