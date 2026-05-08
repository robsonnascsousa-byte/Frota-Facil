import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusVeiculo, StatusContrato, StatusPagamento, StatusMotorista, StatusGenerico, StatusMulta, StatusSinistro } from '../types';


// --- Card Component ---
interface CardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

export const Card: React.FC<CardProps> = ({ title, value, description, icon, colorClass = 'text-petrol-blue-800' }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm flex items-center space-x-4">
    <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-700 ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
    </div>
  </div>
);

// --- Badge Component ---
interface BadgeProps {
  status: StatusVeiculo | StatusContrato | StatusPagamento | StatusMotorista | StatusGenerico | StatusMulta | StatusSinistro | string;
}
export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const baseClasses = "px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-white rounded-full inline-block uppercase tracking-wider";
  const colorClasses: { [key: string]: string } = {
    'Disponível': 'bg-green-500',
    'Locado': 'bg-blue-500',
    'Em manutenção': 'bg-yellow-500',
    'Vendido': 'bg-slate-500',
    'Em vigor': 'bg-green-500',
    'Encerrado': 'bg-slate-500',
    'Em atraso': 'bg-red-500',
    'Pago': 'bg-green-500',
    'Em aberto': 'bg-yellow-500',
    'Atrasado': 'bg-red-500',
    'Ativo': 'bg-green-500',
    'Inadimplente': 'bg-orange-500',
    'Histórico': 'bg-gray-500',
    'Inativo': 'bg-slate-500',
    'Paga': 'bg-green-500',
    'Em recurso': 'bg-blue-500',
    'Em análise': 'bg-yellow-500',
    'Indenizado': 'bg-blue-500',
    'Concluído': 'bg-green-500',
    'Válido': 'bg-green-500',
    'Vencido': 'bg-red-500',
    'Próximo Vencimento': 'bg-yellow-500',
  };

  return <span className={`${baseClasses} ${colorClasses[status] || 'bg-gray-500'}`}>{status}</span>;
};

// --- Header Component ---
interface HeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, description, action }) => (
  <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">{title}</h1>
      <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-petrol-blue-600 hover:bg-petrol-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-petrol-blue-500/20 active:scale-95"
      >
        {action.icon}
        {action.label}
      </button>
    )}
  </div>
);

// --- Empty State Component ---
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
      {icon || (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
    </div>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {actionLabel}
      </button>
    )}
  </div>
);

// --- Table Component ---
interface Column<T> {
  header: string;
  accessor: keyof T;
  isCurrency?: boolean;
  isDate?: boolean;
  isBadge?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  statusFilter?: { field: keyof T; options: string[] };
  dateFilter?: { field: keyof T; label?: string };
  onExport?: () => void;
  emptyState?: { title: string; description: string; actionLabel?: string; onAction?: () => void };
}

export const Table = <T extends { id: number | string }>({
  data,
  columns,
  statusFilter,
  dateFilter,
  onExport,
  emptyState
}: TableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filter by search term
      const matchesSearch = Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Filter by status
      const matchesStatus = !selectedStatus ||
        (statusFilter && item[statusFilter.field] === selectedStatus);

      // Filter by date range
      let matchesDate = true;
      if (dateFilter && (dateStart || dateEnd)) {
        const itemDate = item[dateFilter.field] as string;
        if (itemDate) {
          if (dateStart && itemDate < dateStart) matchesDate = false;
          if (dateEnd && itemDate > dateEnd) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [data, searchTerm, selectedStatus, statusFilter, dateFilter, dateStart, dateEnd]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }

    const value = item[column.accessor];

    if (column.isBadge) {
      return <Badge status={String(value)} />;
    }
    if (column.isCurrency && typeof value === 'number') {
      return formatCurrency(value);
    }
    if (column.isDate && typeof value === 'string') {
      return formatDate(value);
    }
    if (value === null || typeof value === 'undefined') {
      return '-';
    }
    return String(value);
  };

  // Show empty state if no data
  if (data.length === 0 && emptyState) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <EmptyState {...emptyState} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        <input
          type="text"
          placeholder="Buscar em todas as colunas..."
          className="w-full sm:flex-1 sm:min-w-[200px] p-2.5 sm:p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-petrol-blue-500 focus:border-petrol-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base sm:text-sm"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* Status Filter */}
        {statusFilter && (
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500"
          >
            <option value="">Todos os Status</option>
            {statusFilter.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}

        {/* Date Range Filter */}
        {dateFilter && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{dateFilter.label || 'Período'}:</span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateStart}
                onChange={e => {
                  setDateStart(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-none min-w-[130px] p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 text-sm"
                placeholder="Data início"
              />
              <span className="text-slate-400 hidden sm:inline">até</span>
              <input
                type="date"
                value={dateEnd}
                onChange={e => {
                  setDateEnd(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-none min-w-[130px] p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 text-sm"
                placeholder="Data fim"
              />
              {(dateStart || dateEnd) && (
                <button
                  onClick={() => {
                    setDateStart('');
                    setDateEnd('');
                    setCurrentPage(1);
                  }}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Limpar filtro de data"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Excel
          </button>
        )}
      </div>
      {/* Mobile scroll hint */}
      <div className="block sm:hidden px-3 py-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          Deslize para ver mais colunas
        </span>
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 min-w-[640px]">
          <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900">
            <tr>
              {columns.map(col => (
                <th key={String(col.accessor)} scope="col" className="px-3 sm:px-6 py-3 whitespace-nowrap">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map(item => (
              <tr key={item.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                {columns.map(col => (
                  <td key={String(col.accessor)} className="px-3 sm:px-6 py-3 sm:py-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {renderCell(item, col)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-slate-500 dark:text-slate-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {
        totalPages > 1 && (
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm border-t dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400 order-2 sm:order-1">
              Página {currentPage} de {totalPages} ({filteredData.length} resultados)
            </span>
            <div className="inline-flex rounded-md shadow-sm order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2.5 sm:px-3 sm:py-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-l-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 min-h-[44px] sm:min-h-0"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2.5 sm:px-3 sm:py-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-t border-b border-r border-slate-300 dark:border-slate-600 rounded-r-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 min-h-[44px] sm:min-h-0"
              >
                Próximo
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

// --- Modal Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} relative max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b dark:border-slate-700 p-4 flex-shrink-0">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Toast Component ---
interface ToastProps {
  message: string;
  onUndo?: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onUndo, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-800 dark:bg-slate-700 text-white py-3 px-5 rounded-lg shadow-lg flex items-center justify-between animate-fade-in-up">
      <span>{message}</span>
      {onUndo && (
        <button
          onClick={() => {
            onUndo();
            onClose();
          }}
          className="ml-4 font-semibold text-petrol-blue-300 hover:text-petrol-blue-200"
        >
          Desfazer
        </button>
      )}
    </div>
  );
};

// --- Form Input Component ---
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 dark:border-slate-600 focus:border-petrol-blue-500 focus:ring-petrol-blue-500'
        }`}
    />
    {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

// --- Form Select Component ---
interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 dark:border-slate-600 focus:border-petrol-blue-500 focus:ring-petrol-blue-500'
        }`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);