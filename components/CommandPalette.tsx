import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Page, Veiculo, Motorista, Contrato } from '../types';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    veiculos: Veiculo[];
    motoristas: Motorista[];
    contratos: Contrato[];
    onNavigate: (page: Page) => void;
}

interface SearchResult {
    id: string;
    type: 'veiculo' | 'motorista' | 'contrato' | 'page';
    title: string;
    subtitle: string;
    page: Page;
    icon: React.ReactNode;
}

const PAGES: Array<{ page: Page; label: string }> = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'veiculos', label: 'Veículos' },
    { page: 'motoristas', label: 'Motoristas' },
    { page: 'planos', label: 'Planos' },
    { page: 'contratos', label: 'Contratos' },
    { page: 'manutencoes', label: 'Manutenções' },
    { page: 'multas', label: 'Multas & Sinistros' },
    { page: 'financeiro', label: 'Financeiro' },
    { page: 'documentos', label: 'Documentos' },
    { page: 'configuracoes', label: 'Configurações' },
];

// Ícones para cada tipo de resultado
const VeiculoIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
);

const MotoristaIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const ContratoIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const PageIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    veiculos,
    motoristas,
    contratos,
    onNavigate,
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Gerar resultados da busca
    const results = useMemo<SearchResult[]>(() => {
        const q = query.toLowerCase().trim();

        if (!q) {
            // Sem busca, mostrar páginas
            return PAGES.map(p => ({
                id: `page-${p.page}`,
                type: 'page' as const,
                title: p.label,
                subtitle: 'Navegar para seção',
                page: p.page,
                icon: <PageIcon />,
            }));
        }

        const items: SearchResult[] = [];

        // Buscar em veículos
        veiculos
            .filter(v =>
                v.placa.toLowerCase().includes(q) ||
                v.modelo.toLowerCase().includes(q) ||
                v.marca.toLowerCase().includes(q)
            )
            .slice(0, 5)
            .forEach(v => {
                items.push({
                    id: `veiculo-${v.id}`,
                    type: 'veiculo',
                    title: `${v.marca} ${v.modelo}`,
                    subtitle: v.placa,
                    page: 'veiculos',
                    icon: <VeiculoIcon />,
                });
            });

        // Buscar em motoristas
        motoristas
            .filter(m =>
                m.nome.toLowerCase().includes(q) ||
                m.cpf.includes(q)
            )
            .slice(0, 5)
            .forEach(m => {
                items.push({
                    id: `motorista-${m.id}`,
                    type: 'motorista',
                    title: m.nome,
                    subtitle: m.whatsapp,
                    page: 'motoristas',
                    icon: <MotoristaIcon />,
                });
            });

        // Buscar em contratos
        contratos
            .filter(c =>
                c.motoristaNome.toLowerCase().includes(q) ||
                c.veiculoPlaca.toLowerCase().includes(q)
            )
            .slice(0, 5)
            .forEach(c => {
                items.push({
                    id: `contrato-${c.id}`,
                    type: 'contrato',
                    title: `Contrato: ${c.motoristaNome}`,
                    subtitle: `${c.veiculoPlaca} - ${c.planoNome}`,
                    page: 'contratos',
                    icon: <ContratoIcon />,
                });
            });

        // Buscar em páginas
        PAGES
            .filter(p => p.label.toLowerCase().includes(q))
            .forEach(p => {
                items.push({
                    id: `page-${p.page}`,
                    type: 'page',
                    title: p.label,
                    subtitle: 'Navegar para seção',
                    page: p.page,
                    icon: <PageIcon />,
                });
            });

        return items;
    }, [query, veiculos, motoristas, contratos]);

    // Resetar seleção quando resultados mudam
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Focar no input ao abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
        }
    }, [isOpen]);

    // Scroll para item selecionado
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.querySelector('[data-selected="true"]');
            if (selected) {
                selected.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    // Navegação por teclado
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    onNavigate(results[selectedIndex].page);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [results, selectedIndex, onNavigate, onClose]);

    // Listener global para Ctrl+K
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (!isOpen) {
                    // O App.tsx vai lidar com isso
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="command-palette-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
                <div
                    className="relative w-full max-w-xl transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black/5 transition-all"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="relative">
                        <svg
                            className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 sm:text-sm"
                            placeholder="Buscar veículos, motoristas, contratos ou navegar..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <kbd className="pointer-events-none absolute right-4 top-3 hidden rounded border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs text-slate-400 sm:block">
                            ESC
                        </kbd>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Results List */}
                    <div
                        ref={listRef}
                        className="max-h-80 scroll-py-2 overflow-y-auto p-2"
                    >
                        {results.length === 0 ? (
                            <div className="px-4 py-14 text-center sm:px-14">
                                <svg
                                    className="mx-auto h-6 w-6 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="mt-4 text-sm text-slate-500">
                                    Nenhum resultado encontrado para "{query}"
                                </p>
                            </div>
                        ) : (
                            <ul className="text-sm text-slate-700 dark:text-slate-200">
                                {results.map((result, index) => (
                                    <li
                                        key={result.id}
                                        data-selected={index === selectedIndex}
                                        className={`group flex cursor-pointer select-none items-center rounded-md px-3 py-2 ${index === selectedIndex
                                                ? 'bg-petrol-blue-600 text-white'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        onClick={() => {
                                            onNavigate(result.page);
                                            onClose();
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <span className={`flex-shrink-0 ${index === selectedIndex ? 'text-white' : 'text-slate-400'
                                            }`}>
                                            {result.icon}
                                        </span>
                                        <div className="ml-3 flex-auto truncate">
                                            <p className="font-medium truncate">
                                                {result.title}
                                            </p>
                                            <p className={`truncate text-xs ${index === selectedIndex ? 'text-petrol-blue-200' : 'text-slate-400'
                                                }`}>
                                                {result.subtitle}
                                            </p>
                                        </div>
                                        {index === selectedIndex && (
                                            <span className="ml-3 flex-shrink-0 text-xs text-petrol-blue-200">
                                                Enter ↵
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-500">
                        <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-0.5 mr-1">↑</kbd>
                        <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-0.5 mr-2">↓</kbd>
                        <span className="mr-4">para navegar</span>
                        <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-0.5 mr-2">Enter</kbd>
                        <span className="mr-4">para selecionar</span>
                        <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-0.5 mr-2">Esc</kbd>
                        <span>para fechar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
