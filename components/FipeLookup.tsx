import React, { useState, useEffect, useCallback } from 'react';
import { getMarcas, getModelos, getAnos, getValorFipe, parseValorFipe, FipeMarca, FipeModelo, FipeAno, FipeValor, TipoVeiculo } from '../services/fipe';

interface FipeLookupProps {
    onValorEncontrado?: (valor: number, dados: FipeValor) => void;
    onDadosSelecionados?: (marca: string, modelo: string, ano: number) => void;
    tipoVeiculo?: TipoVeiculo;
    className?: string;
}

const FipeLookup: React.FC<FipeLookupProps> = ({
    onValorEncontrado,
    onDadosSelecionados,
    tipoVeiculo = 'carros',
    className = ''
}) => {
    // Estados para os selects
    const [marcas, setMarcas] = useState<FipeMarca[]>([]);
    const [modelos, setModelos] = useState<FipeModelo[]>([]);
    const [anos, setAnos] = useState<FipeAno[]>([]);

    // Estados selecionados
    const [marcaSelecionada, setMarcaSelecionada] = useState('');
    const [modeloSelecionado, setModeloSelecionado] = useState('');
    const [anoSelecionado, setAnoSelecionado] = useState('');

    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [loadingValor, setLoadingValor] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [valorFipe, setValorFipe] = useState<FipeValor | null>(null);

    // Carrega marcas no mount
    useEffect(() => {
        const carregarMarcas = async () => {
            setLoading(true);
            setErro(null);
            try {
                const data = await getMarcas(tipoVeiculo);
                setMarcas(data);
            } catch {
                setErro('Erro ao carregar marcas. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        carregarMarcas();
    }, [tipoVeiculo]);

    // Carrega modelos quando marca muda
    useEffect(() => {
        if (!marcaSelecionada) {
            setModelos([]);
            setModeloSelecionado('');
            return;
        }

        const carregarModelos = async () => {
            setLoading(true);
            setErro(null);
            try {
                const { modelos: data } = await getModelos(tipoVeiculo, marcaSelecionada);
                setModelos(data);
                setModeloSelecionado('');
                setAnos([]);
                setAnoSelecionado('');
                setValorFipe(null);
            } catch {
                setErro('Erro ao carregar modelos.');
            } finally {
                setLoading(false);
            }
        };
        carregarModelos();
    }, [marcaSelecionada, tipoVeiculo]);

    // Carrega anos quando modelo muda
    useEffect(() => {
        if (!marcaSelecionada || !modeloSelecionado) {
            setAnos([]);
            setAnoSelecionado('');
            return;
        }

        const carregarAnos = async () => {
            setLoading(true);
            setErro(null);
            try {
                const data = await getAnos(tipoVeiculo, marcaSelecionada, parseInt(modeloSelecionado));
                setAnos(data);
                setAnoSelecionado('');
                setValorFipe(null);
            } catch {
                setErro('Erro ao carregar anos.');
            } finally {
                setLoading(false);
            }
        };
        carregarAnos();
    }, [marcaSelecionada, modeloSelecionado, tipoVeiculo]);

    // Busca valor quando ano é selecionado
    const buscarValor = useCallback(async () => {
        if (!marcaSelecionada || !modeloSelecionado || !anoSelecionado) return;

        setLoadingValor(true);
        setErro(null);
        try {
            const valor = await getValorFipe(
                tipoVeiculo,
                marcaSelecionada,
                parseInt(modeloSelecionado),
                anoSelecionado
            );
            setValorFipe(valor);

            // Callbacks
            if (onValorEncontrado) {
                onValorEncontrado(parseValorFipe(valor.Valor), valor);
            }

            if (onDadosSelecionados) {
                const marcaNome = marcas.find(m => m.codigo === marcaSelecionada)?.nome || '';
                const modeloNome = modelos.find(m => m.codigo === parseInt(modeloSelecionado))?.nome || '';
                onDadosSelecionados(marcaNome, modeloNome, valor.AnoModelo);
            }
        } catch {
            setErro('Erro ao buscar valor FIPE.');
        } finally {
            setLoadingValor(false);
        }
    }, [marcaSelecionada, modeloSelecionado, anoSelecionado, tipoVeiculo, marcas, modelos, onValorEncontrado, onDadosSelecionados]);

    // Auto-busca ao selecionar ano
    useEffect(() => {
        if (anoSelecionado) {
            buscarValor();
        }
    }, [anoSelecionado, buscarValor]);

    const selectClasses = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-petrol-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Consulta Tabela FIPE</span>
                {loading && (
                    <svg className="animate-spin h-4 w-4 text-petrol-blue-500 ml-auto" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
            </div>

            {/* Erro */}
            {erro && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {erro}
                </div>
            )}

            {/* Selects em grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Marca */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Marca
                    </label>
                    <select
                        value={marcaSelecionada}
                        onChange={(e) => setMarcaSelecionada(e.target.value)}
                        className={selectClasses}
                        disabled={loading || marcas.length === 0}
                    >
                        <option value="">Selecione a marca</option>
                        {marcas.map((marca) => (
                            <option key={marca.codigo} value={marca.codigo}>
                                {marca.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Modelo */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Modelo
                    </label>
                    <select
                        value={modeloSelecionado}
                        onChange={(e) => setModeloSelecionado(e.target.value)}
                        className={selectClasses}
                        disabled={!marcaSelecionada || loading || modelos.length === 0}
                    >
                        <option value="">Selecione o modelo</option>
                        {modelos.map((modelo) => (
                            <option key={modelo.codigo} value={modelo.codigo}>
                                {modelo.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Ano */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Ano
                    </label>
                    <select
                        value={anoSelecionado}
                        onChange={(e) => setAnoSelecionado(e.target.value)}
                        className={selectClasses}
                        disabled={!modeloSelecionado || loading || anos.length === 0}
                    >
                        <option value="">Selecione o ano</option>
                        {anos.map((ano) => (
                            <option key={ano.codigo} value={ano.codigo}>
                                {ano.nome}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Resultado do Valor FIPE */}
            {valorFipe && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                                Valor FIPE • {valorFipe.MesReferencia}
                            </p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {valorFipe.Valor}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {valorFipe.Marca} {valorFipe.Modelo} • {valorFipe.Combustivel}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Código FIPE</p>
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{valorFipe.CodigoFipe}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading valor */}
            {loadingValor && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-petrol-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Consultando valor FIPE...</span>
                </div>
            )}
        </div>
    );
};

export default FipeLookup;
