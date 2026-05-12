
import React, { useState, useMemo } from 'react';
import { Veiculo, StatusVeiculo, Contrato, Manutencao, Multa, Despesa, Sinistro } from '../types';
import { Table, Header, Modal, Badge, EmptyState } from './ui';
import { formatCurrency, formatDate } from '../utils/formatters';
import { validateVeiculo, formatPlaca, ValidationErrors } from '../utils/validation';
import { exportToExcel, prepareVeiculosForExport } from '../utils/export';
import FipeLookup from './FipeLookup';
import { FipeValor, parseValorFipe } from '../services/fipe';
import { uploadVehiclePhoto } from '../services/storage';

interface VeiculosProps {
    veiculos: Veiculo[];
    contratos: Contrato[];
    manutencoes: Manutencao[];
    multas: Multa[];
    despesas: Despesa[];
    sinistros: Sinistro[];
    onAddVeiculo: (veiculo: Omit<Veiculo, 'id' | 'codigo'>) => void;
    onDeleteVeiculo: (id: number) => void;
    onUpdateVeiculo: (veiculo: Veiculo) => void;
}

interface VeiculoFormState {
    id?: number;
    codigo?: string;
    placa: string;
    modelo: string;
    marca: string;
    ano: number | string;
    cor: string;
    km_atual: number | string;
    status: StatusVeiculo;
    motorista_atual?: string;
    vencimento_seguro: string;
    valor_compra: number | string;
    data_compra: string;
    valor_fipe: number | string;
    foto_url?: string;
    valor_venda?: number | string;
}

const initialFormState: VeiculoFormState = {
    placa: '',
    modelo: '',
    marca: '',
    ano: new Date().getFullYear(),
    cor: '',
    km_atual: '',
    status: 'Disponível',
    motorista_atual: '',
    vencimento_seguro: '',
    valor_compra: '',
    data_compra: '',
    valor_fipe: '',
    foto_url: '',
    valor_venda: '',
};

interface FinancialData {
    receitaTotal: number;
    custoManutencao: number;
    custoMultas: number;
    custoSinistros: number;
    custoOutros: number;
    totalCustos: number;
    lucroOperacional: number;
    rentabilidadeReal: number;
}

const VeiculoCard: React.FC<{
    veiculo: Veiculo;
    financeiro: FinancialData;
    onClick: () => void;
    onDelete: () => void;
    onEdit: () => void
}> = ({ veiculo, financeiro, onClick, onDelete, onEdit }) => {
    const marca = encodeURIComponent(veiculo.marca);
    const modelo = encodeURIComponent(veiculo.modelo.split(' ')[0]);
    const fallbackImage = `https://placehold.co/400x300/1e293b/94a3b8?text=${marca}+${modelo}`;
    const imageUrl = veiculo.foto_url || fallbackImage;

    const brandDomains: { [key: string]: string } = {
        'Chevrolet': 'chevrolet.com',
        'Hyundai': 'hyundaimotors.com',
        'Renault': 'renaultgroup.com',
        'Fiat': 'fiat.com',
        'Volkswagen': 'volkswagen.com',
        'Toyota': 'toyota.com',
        'Honda': 'honda.com',
        'Ford': 'ford.com',
    };
    const domain = brandDomains[veiculo.marca] || 'car.com';
    const logoUrl = `https://logo.clearbit.com/${domain}`;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const profitColor = financeiro.rentabilidadeReal >= 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div
            className="relative rounded-lg shadow-lg overflow-hidden aspect-[4/3] flex flex-col text-white p-4 cursor-pointer group"
            onClick={onClick}
        >
            <img
                src={imageUrl}
                alt={`${veiculo.marca} ${veiculo.modelo}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110 z-0"
                onError={(e) => { 
                    const target = e.currentTarget;
                    if (target.src !== fallbackImage) {
                        target.src = fallbackImage;
                    }
                }}
            />
            <div className="absolute inset-0 bg-slate-700 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10"></div>

            {/* Action buttons */}
            <div className="absolute top-2 right-2 z-30 flex space-x-1">
                <button
                    onClick={handleEdit}
                    className="p-1.5 bg-black/40 rounded-full text-white/70 hover:text-white hover:bg-petrol-blue-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1.5 bg-black/40 rounded-full text-white/70 hover:text-white hover:bg-red-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="relative z-20 flex flex-col h-full">
                <div className="flex justify-between items-start">
                    <div className="bg-white/20 backdrop-blur-sm p-1 rounded-md">
                        <img
                            src={logoUrl}
                            alt={`${veiculo.marca} Logo`}
                            className="h-8 w-auto object-contain"
                            onError={(e) => { e.currentTarget.parentElement?.style.setProperty('display', 'none') }}
                        />
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-lg leading-tight">{veiculo.marca} {veiculo.modelo}</h3>
                        <Badge status={veiculo.status} />
                    </div>
                    <div className="flex justify-between items-center text-sm font-mono tracking-wider opacity-80 mt-1 mb-2">
                        <span>{veiculo.placa}</span>
                        <span>{veiculo.ano}</span>
                    </div>

                    {/* Profitability Summary */}
                    <div className="border-t border-white/20 pt-2 flex justify-between items-center">
                        <span className="text-xs text-slate-300">Lucro Real:</span>
                        <span className={`text-sm font-bold ${profitColor}`}>
                            {formatCurrency(financeiro.rentabilidadeReal)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Auxiliary components moved outside to prevent re-renders losing focus
const DetailItem: React.FC<{ label: string, value?: string | number | React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
);

// Form input component for reuse
const FormField: React.FC<{
    label: string;
    name: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
}> = ({ label, name, type = 'text', value, onChange, error, required }) => (
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
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:border-petrol-blue-500 focus:ring-petrol-blue-500'
                }`}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
);

const Veiculos: React.FC<VeiculosProps> = ({ veiculos, contratos, manutencoes, multas, despesas, sinistros, onAddVeiculo, onDeleteVeiculo, onUpdateVeiculo }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newVehicle, setNewVehicle] = useState<VeiculoFormState>(initialFormState);
    const [editingVehicle, setEditingVehicle] = useState<VeiculoFormState | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<Veiculo | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
    const [selectedVehicle, setSelectedVehicle] = useState<Veiculo | null>(null);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Calculate financials for all vehicles
    const financials = useMemo(() => {
        const stats: { [key: number]: FinancialData } = {};

        veiculos.forEach(v => {
            // Revenue
            const vehicleContracts = contratos.filter(c => c.veiculo_id === v.id);
            const receitaTotal = vehicleContracts.reduce((sum, c) => {
                const paid = c.pagamentos?.filter(p => p.status === 'Pago') || [];
                return sum + paid.reduce((sub, p) => sub + (p.valor || 0), 0);
            }, 0);

            // Costs
            const custoManutencao = manutencoes
                .filter(m => m.veiculoPlaca === v.placa)
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const custoMultas = multas
                .filter(m => m.veiculoPlaca === v.placa)
                .reduce((sum, m) => sum + (m.valor || 0), 0);

            const custoSinistros = (sinistros || []) // sinistros might not have value in standard type, assume 0 or need refactor if value exists
                .filter(s => s.veiculoPlaca === v.placa)
                .reduce((sum, s) => sum + 0, 0); // TODO: Add value to Sinistro type if needed

            const custoOutros = despesas
                .filter(d => d.veiculo_placa === v.placa)
                .reduce((sum, d) => sum + (d.valor || 0), 0);

            const totalCustos = custoManutencao + custoMultas + custoSinistros + custoOutros;
            const lucroOperacional = receitaTotal - totalCustos;

            // Use Sale Value if set, otherwise use current FIPE value
            const valorFinal = (v.valor_venda && v.valor_venda > 0) ? v.valor_venda : v.valor_fipe;

            // Real Profitability: (Revenue + Final Value) - (Initial Investment + Costs)
            const rentabilidadeReal = (receitaTotal + valorFinal) - (v.valor_compra + totalCustos);

            stats[v.id] = {
                receitaTotal,
                custoManutencao,
                custoMultas,
                custoSinistros,
                custoOutros,
                totalCustos,
                lucroOperacional,
                rentabilidadeReal
            };
        });

        return stats;
    }, [veiculos, contratos, manutencoes, multas, despesas, sinistros]);

    const handleDeleteClick = (veiculo: Veiculo) => {
        setVehicleToDelete(veiculo);
    };

    const handleEditClick = (veiculo: Veiculo) => {
        setEditingVehicle({ ...veiculo });
        setErrors({});
        setPhotoFile(null); // Clear previous file selection
        setIsEditModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const confirmDelete = () => {
        if (vehicleToDelete) {
            onDeleteVeiculo(vehicleToDelete.id);
            setVehicleToDelete(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = value === '' ? '' : parseFloat(value);
        }

        setNewVehicle(prev => ({ ...prev, [name]: processedValue }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = value === '' ? '' : parseFloat(value);
        }

        setEditingVehicle(prev => prev ? { ...prev, [name]: processedValue } : null);

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare data for validation and submission
        const vehicleToSave = {
            ...newVehicle,
            ano: Number(newVehicle.ano) || new Date().getFullYear(),
            km_atual: Number(newVehicle.km_atual) || 0,
            valor_compra: Number(newVehicle.valor_compra) || 0,
            valor_fipe: Number(newVehicle.valor_fipe) || 0,
            valor_venda: Number(newVehicle.valor_venda) || 0,
        } as Omit<Veiculo, 'id' | 'codigo'>;

        // Validate
        const validationErrors = validateVeiculo(vehicleToSave);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setUploading(true);
            let foto_url = '';

            if (photoFile) {
                foto_url = await uploadVehiclePhoto(photoFile, newVehicle.placa);
            }

            // Format placa
            const formattedVehicle = {
                ...vehicleToSave,
                placa: formatPlaca(vehicleToSave.placa),
                foto_url: foto_url || vehicleToSave.foto_url // Preserve if existing or new
            };

            onAddVeiculo(formattedVehicle);
            setIsAddModalOpen(false);
            setNewVehicle(initialFormState);
            setPhotoFile(null);
            setErrors({});
        } catch (error) {
            console.error("Error saving vehicle:", error);
            alert("Erro ao salvar veículo. Verifique o console.");
        } finally {
            setUploading(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVehicle) return;

        // Prepare data
        const vehicleToSave = {
            ...editingVehicle,
            ano: Number(editingVehicle.ano) || new Date().getFullYear(),
            km_atual: Number(editingVehicle.km_atual) || 0,
            valor_compra: Number(editingVehicle.valor_compra) || 0,
            valor_fipe: Number(editingVehicle.valor_fipe) || 0,
            valor_venda: Number(editingVehicle.valor_venda) || 0,
        } as Veiculo;

        // Validate
        const validationErrors = validateVeiculo(vehicleToSave);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setUploading(true);
            let foto_url = editingVehicle.foto_url;

            if (photoFile) {
                foto_url = await uploadVehiclePhoto(photoFile, editingVehicle.placa);
            }

            // Format placa
            const formattedVehicle = {
                ...vehicleToSave,
                placa: formatPlaca(vehicleToSave.placa),
                foto_url: foto_url
            };

            onUpdateVeiculo(formattedVehicle);
            setIsEditModalOpen(false);
            setEditingVehicle(null);
            setPhotoFile(null);
            setErrors({});
        } catch (error) {
            console.error("Error updating vehicle:", error);
            alert("Erro ao atualizar veículo. Verifique o console.");
        } finally {
            setUploading(false);
        }
    };

    const handleExport = () => {
        const data = prepareVeiculosForExport(veiculos);
        exportToExcel(data, 'veiculos', 'Veículos');
    };


    return (
        <>
            <Header title="Veículos da Frota" description="Visualize e gerencie todos os veículos cadastrados no sistema." />

            <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
                <button
                    onClick={() => {
                        setNewVehicle(initialFormState);
                        setErrors({});
                        setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Veículo
                </button>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar
                    </button>

                    <div className="flex items-center space-x-2 rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-petrol-blue-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-slate-600 text-petrol-blue-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {veiculos.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <EmptyState
                        title="Nenhum veículo cadastrado"
                        description="Comece adicionando o primeiro veículo da sua frota para começar a gerenciar seus ativos."
                        actionLabel="Adicionar Primeiro Veículo"
                        onAction={() => setIsAddModalOpen(true)}
                        icon={
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        }
                    />
                </div>
            ) : viewMode === 'list' ? (
                <Table<Veiculo>
                    data={veiculos}
                    columns={[
                        { header: 'Código', accessor: 'codigo' },
                        { header: 'Placa', accessor: 'placa' },
                        { header: 'Modelo', accessor: 'modelo' },
                        { header: 'Status', accessor: 'status', isBadge: true },
                        { header: 'KM Atual', accessor: 'km_atual' },
                        { header: 'Valor FIPE', accessor: 'valor_fipe', isCurrency: true },
                        { header: 'Venc. Seguro', accessor: 'vencimento_seguro', isDate: true },
                        {
                            header: 'Ações',
                            accessor: 'id',
                            render: (veiculo) => (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditClick(veiculo)}
                                        className="text-petrol-blue-600 hover:text-petrol-blue-800 dark:text-petrol-blue-400 dark:hover:text-petrol-blue-300 font-medium text-sm"
                                        aria-label={`Editar veículo ${veiculo.placa}`}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(veiculo)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                                        aria-label={`Excluir veículo ${veiculo.placa}`}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            )
                        },
                    ]}
                    statusFilter={{
                        field: 'status',
                        options: ['Disponível', 'Locado', 'Em manutenção', 'Vendido'] as StatusVeiculo[]
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {veiculos.map(veiculo => (
                        <VeiculoCard
                            key={veiculo.id}
                            veiculo={veiculo}
                            financeiro={financials[veiculo.id] || {
                                receitaTotal: 0,
                                custoManutencao: 0,
                                custoMultas: 0,
                                custoSinistros: 0,
                                custoOutros: 0,
                                totalCustos: 0,
                                lucroOperacional: 0,
                                rentabilidadeReal: 0
                            }}
                            onClick={() => setSelectedVehicle(veiculo)}
                            onDelete={() => handleDeleteClick(veiculo)}
                            onEdit={() => handleEditClick(veiculo)}
                        />
                    ))}
                </div>
            )}


            {/* Add Vehicle Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Veículo" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Consulta FIPE */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <FipeLookup
                            onDadosSelecionados={(marca, modelo, ano) => {
                                setNewVehicle(prev => ({
                                    ...prev,
                                    marca,
                                    modelo,
                                    ano
                                }));
                            }}
                            onValorEncontrado={(valor) => {
                                setNewVehicle(prev => ({
                                    ...prev,
                                    valor_fipe: valor
                                }));
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Placa" name="placa" value={newVehicle.placa} onChange={handleInputChange} error={errors.placa} required />
                        <FormField label="Marca" name="marca" value={newVehicle.marca} onChange={handleInputChange} error={errors.marca} required />
                        <FormField label="Modelo" name="modelo" value={newVehicle.modelo} onChange={handleInputChange} error={errors.modelo} required />
                        <FormField label="Ano" name="ano" type="number" value={newVehicle.ano} onChange={handleInputChange} error={errors.ano} required />
                        <FormField label="Cor" name="cor" value={newVehicle.cor} onChange={handleInputChange} />
                        <FormField label="KM Atual" name="km_atual" type="number" value={newVehicle.km_atual} onChange={handleInputChange} />
                        <FormField label="Valor de Compra" name="valor_compra" type="number" value={newVehicle.valor_compra} onChange={handleInputChange} error={errors.valor_compra} />
                        <FormField label="Valor FIPE" name="valor_fipe" type="number" value={newVehicle.valor_fipe} onChange={handleInputChange} error={errors.valor_fipe} />
                        <FormField label="Valor de Venda (Opcional)" name="valor_venda" type="number" value={newVehicle.valor_venda || ''} onChange={handleInputChange} />
                        <FormField label="Data da Compra" name="data_compra" type="date" value={newVehicle.data_compra} onChange={handleInputChange} />
                        <FormField label="Vencimento do Seguro" name="vencimento_seguro" type="date" value={newVehicle.vencimento_seguro} onChange={handleInputChange} />
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Foto do Veículo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-petrol-blue-50 file:text-petrol-blue-700
                                  hover:file:bg-petrol-blue-100
                                  dark:file:bg-petrol-blue-900 dark:file:text-petrol-blue-300
                                "
                            />
                        </div>
                    </div>
                    <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 disabled:opacity-50"
                        >
                            {uploading ? 'Salvando...' : 'Salvar Veículo'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Vehicle Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Veículo" size="lg">
                {editingVehicle && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Placa" name="placa" value={editingVehicle.placa} onChange={handleEditInputChange} error={errors.placa} required />
                            <FormField label="Marca" name="marca" value={editingVehicle.marca} onChange={handleEditInputChange} error={errors.marca} required />
                            <FormField label="Modelo" name="modelo" value={editingVehicle.modelo} onChange={handleEditInputChange} error={errors.modelo} required />
                            <FormField label="Ano" name="ano" type="number" value={editingVehicle.ano} onChange={handleEditInputChange} error={errors.ano} required />
                            <FormField label="Cor" name="cor" value={editingVehicle.cor} onChange={handleEditInputChange} />
                            <FormField label="KM Atual" name="km_atual" type="number" value={editingVehicle.km_atual} onChange={handleEditInputChange} />
                            <FormField label="Valor de Compra" name="valor_compra" type="number" value={editingVehicle.valor_compra} onChange={handleEditInputChange} error={errors.valor_compra} />
                            <FormField label="Valor FIPE" name="valor_fipe" type="number" value={editingVehicle.valor_fipe} onChange={handleEditInputChange} error={errors.valor_fipe} />
                            <FormField label="Valor de Venda (Opcional)" name="valor_venda" type="number" value={editingVehicle.valor_venda || ''} onChange={handleEditInputChange} />
                            <FormField label="Data da Compra" name="data_compra" type="date" value={editingVehicle.data_compra} onChange={handleEditInputChange} />
                            <FormField label="Vencimento do Seguro" name="vencimento_seguro" type="date" value={editingVehicle.vencimento_seguro} onChange={handleEditInputChange} />
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                <select
                                    name="status"
                                    id="status"
                                    value={editingVehicle.status}
                                    onChange={handleEditInputChange}
                                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="Disponível">Disponível</option>
                                    <option value="Locado">Locado</option>
                                    <option value="Em manutenção">Em manutenção</option>
                                    <option value="Vendido">Vendido</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Atualizar Foto</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-petrol-blue-50 file:text-petrol-blue-700
                                      hover:file:bg-petrol-blue-100
                                       dark:file:bg-petrol-blue-900 dark:file:text-petrol-blue-300
                                    "
                                />
                                {editingVehicle.foto_url && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Foto atual cadastrada. Envie uma nova para substituir.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 disabled:opacity-50"
                            >
                                {uploading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!vehicleToDelete}
                onClose={() => setVehicleToDelete(null)}
                title="Confirmar Exclusão"
            >
                <div>
                    <p className="text-slate-600 dark:text-slate-300 mb-2">
                        Tem certeza que deseja excluir o veículo?
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
                        {vehicleToDelete?.marca} {vehicleToDelete?.modelo} - {vehicleToDelete?.placa}
                    </p>
                    <div className="pt-5 mt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setVehicleToDelete(null)}
                            className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Vehicle Details Modal */}
            <Modal isOpen={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} title="Detalhes do Veículo">
                {selectedVehicle && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                            <h3 className="font-bold text-xl text-petrol-blue-900 dark:text-petrol-blue-300">{selectedVehicle.marca} {selectedVehicle.modelo} <span className="text-base font-medium text-slate-500 dark:text-slate-400">({selectedVehicle.ano})</span></h3>
                            <p className="font-mono text-lg text-slate-700 dark:text-slate-300">{selectedVehicle.placa}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <DetailItem label="Status" value={<Badge status={selectedVehicle.status} />} />
                            <DetailItem label="KM Atual" value={`${selectedVehicle.km_atual.toLocaleString('pt-BR')} km`} />
                            <DetailItem label="Cor" value={selectedVehicle.cor} />
                            <DetailItem label="Motorista Atual" value={selectedVehicle.motorista_atual} />
                            <DetailItem label="Valor de Compra" value={formatCurrency(selectedVehicle.valor_compra)} />
                            <DetailItem label="Valor FIPE (Atual)" value={formatCurrency(selectedVehicle.valor_fipe)} />
                            <DetailItem label="Data da Compra" value={formatDate(selectedVehicle.data_comp_ra)} />
                            <DetailItem label="Vencimento do Seguro" value={formatDate(selectedVehicle.vencimento_seguro)} />
                        </div>

                        {/* Financial Breakdown */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                            <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-petrol-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Rentabilidade Real
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                                    <p className="text-xs text-green-700 dark:text-green-400 font-medium uppercase">Receita Total</p>
                                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                        {formatCurrency(financials[selectedVehicle.id]?.receitaTotal || 0)}
                                    </p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                                    <p className="text-xs text-red-700 dark:text-red-400 font-medium uppercase">Custos Totais</p>
                                    <p className="text-xl font-bold text-red-700 dark:text-red-300">
                                        {formatCurrency(financials[selectedVehicle.id]?.totalCustos || 0)}
                                    </p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium uppercase">Lucro Líquido</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {formatCurrency(financials[selectedVehicle.id]?.lucroOperacional || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Valor de Compra (Investimento)</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(selectedVehicle.valor_compra)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {(selectedVehicle.valor_venda && selectedVehicle.valor_venda > 0) ? 'Valor de Venda (Realizado)' : 'Valor Atual (FIPE)'}
                                    </span>
                                    <span className="font-mono text-green-600 dark:text-green-400">
                                        +{formatCurrency((selectedVehicle.valor_venda && selectedVehicle.valor_venda > 0) ? selectedVehicle.valor_venda : selectedVehicle.valor_fipe)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Depreciação/Valorização</span>
                                    <span className={`font-mono ${((selectedVehicle.valor_venda && selectedVehicle.valor_venda > 0) ? selectedVehicle.valor_venda : selectedVehicle.valor_fipe) >= selectedVehicle.valor_compra ? 'text-green-600' : 'text-red-500'}`}>
                                        {formatCurrency(((selectedVehicle.valor_venda && selectedVehicle.valor_venda > 0) ? selectedVehicle.valor_venda : selectedVehicle.valor_fipe) - selectedVehicle.valor_compra)}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-600 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 dark:text-white">Resultado Final (Se vendesse hoje)</span>
                                    <span className={`text-lg font-bold ${financials[selectedVehicle.id]?.rentabilidadeReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(financials[selectedVehicle.id]?.rentabilidadeReal || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-5 mt-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    handleEditClick(selectedVehicle);
                                    setSelectedVehicle(null);
                                }}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500"
                            >
                                Editar
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedVehicle(null)}
                                className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default Veiculos;
