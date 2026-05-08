
import React from 'react';
import { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onNavigate?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, page, currentPage, setCurrentPage, onNavigate }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => {
        setCurrentPage(page);
        onNavigate?.();
      }}
      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
        ? 'bg-petrol-blue-900 text-white dark:bg-petrol-blue-700'
        : 'text-slate-300 hover:bg-petrol-blue-800 hover:text-white dark:hover:bg-petrol-blue-800'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// SVG Icon Components
const Icon: React.FC<{ d: string }> = ({ d }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d={d} clipRule="evenodd" />
  </svg>
);

const ICONS: { [key in Page]: React.ReactNode } = {
  dashboard: <Icon d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 10a1 1 0 011-1h2a1 1 0 110 2H6a1 1 0 01-1-1zm4 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />,
  veiculos: <Icon d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />,
  motoristas: <Icon d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />,
  planos: <Icon d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />,
  contratos: <Icon d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />,
  manutencoes: <Icon d="M11.94 1.94a1 1 0 00-1.414 0l-8 8a1 1 0 000 1.414l8 8a1 1 0 001.414-1.414L4.828 11H18a1 1 0 100-2H4.828l7.112-7.112a1 1 0 000-1.414z" />,
  multas: <Icon d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />,
  financeiro: <Icon d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />,
  documentos: <Icon d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm0 2h6v12H7V4z" />,
  configuracoes: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
  acessos: <Icon d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />,
  dre: <Icon d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
};
// Add specific icons from heroicons
ICONS.dashboard = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
ICONS.veiculos = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 6.414V16a1 1 0 11-2 0V6.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4zM8 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" /></svg>; // Placeholder, real car icon is complex
ICONS.motoristas = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015.537 4.871A6.987 6.987 0 005 21v-1a6 6 0 016-6c.34 0 .673.024 1 .071A5 5 0 016 11z" /></svg>;
ICONS.planos = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>;
ICONS.contratos = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
ICONS.manutencoes = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.96.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
ICONS.multas = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
ICONS.financeiro = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.162-.328zM11 12.849v-1.698c.22.071.408.164.567.267a2.5 2.5 0 001.162.328z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.876.662A1 1 0 006.25 6.5v1.086c0 .54.328.99.79 1.162a4.502 4.502 0 001.96 1.416A2.5 2.5 0 019 13.5v1.086c0 .54-.328.99-.79 1.162A4.5 4.5 0 006.25 16.5v.092a1 1 0 102 0v-.092a2.5 2.5 0 011.876-.662A1 1 0 0011.75 15.5v-1.086c0-.54-.328-.99-.79-1.162A4.502 4.502 0 009 11.838A2.5 2.5 0 0111 9.5v-1.086c0-.54.328-.99.79-1.162A4.5 4.5 0 0013.75 6.5v-.092a1 1 0 10-2 0v.092a2.5 2.5 0 01-1.876.662 1 1 0 00-.624.456z" clipRule="evenodd" /></svg>;
ICONS.documentos = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 1v1h8V5H6z" /></svg>;
ICONS.configuracoes = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.96.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
ICONS.acessos = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
ICONS.dre = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>;

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  isOpen,
  onToggle,
  isDark,
  onToggleTheme
}) => {
  const { signOut } = useAuth();

  const navItems: { page: Page, label: string }[] = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'veiculos', label: 'Veículos' },
    { page: 'motoristas', label: 'Motoristas' },
    { page: 'planos', label: 'Planos' },
    { page: 'contratos', label: 'Contratos' },
    { page: 'manutencoes', label: 'Manutenções' },
    { page: 'multas', label: 'Multas & Sinistros' },
    { page: 'financeiro', label: 'Financeiro' },
    { page: 'dre', label: 'DRE' },
    { page: 'documentos', label: 'Documentos' },
    { page: 'configuracoes', label: 'Configurações' },
    { page: 'acessos', label: 'Controle de Acessos' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-petrol-blue-950 dark:bg-slate-950 dark:border-r dark:border-slate-800 text-white 
        flex-shrink-0 flex flex-col p-4
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between py-4 border-b border-petrol-blue-900 dark:border-slate-700">
          <div className="text-2xl font-bold">
            Frota<span className="text-petrol-blue-400">Fácil</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-petrol-blue-800 transition-colors"
            aria-label="Fechar menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search hint */}
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="mt-4 flex items-center justify-between px-3 py-2 text-sm text-slate-400 bg-petrol-blue-900/50 dark:bg-slate-800 rounded-md hover:bg-petrol-blue-800 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar...
          </span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-petrol-blue-800 dark:bg-slate-600 rounded">
            Ctrl+K
          </kbd>
        </button>

        {/* Navigation */}
        <nav className="flex-1 mt-6 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem
              key={item.page}
              icon={ICONS[item.page]}
              label={item.label}
              page={item.page}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onNavigate={() => {
                // Fechar sidebar em mobile após navegar
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
            />
          ))}
        </nav>

        {/* Footer with theme toggle */}
        <div className="mt-auto pt-4 border-t border-petrol-blue-900 dark:border-slate-700">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-300 rounded-md hover:bg-petrol-blue-800 dark:hover:bg-slate-700 transition-colors mb-4"
          >
            <span className="flex items-center">
              {isDark ? (
                <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              if (confirm('Deseja realmente sair do sistema?')) {
                signOut();
              }
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-red-300 rounded-md hover:bg-red-900/30 transition-colors mb-4"
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair do Sistema
          </button>

          <div className="text-center text-xs text-slate-400">
            <p>© 2024 FrotaFácil</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
