import React, { useState, useRef } from 'react';
import { Manutencao, Veiculo, DocumentoAnexado, StatusPagamentoDespesa } from '../types';
import { Table, Header, Modal, EmptyState } from './ui';
import { formatDate, formatCurrency } from '../utils/formatters';
import { exportToExcel } from '../utils/export';

interface ManutencoesProps {
  manutencoes: Manutencao[];
  veiculos: Veiculo[];
  onAddManutencao: (manutencao: Omit<Manutencao, 'id'>) => void;
  onDeleteManutencao: (id: number) => void;
  onAnexarDocumento: (manutencaoId: number, fileName: string) => void;
  onUpdateManutencao: (manutencao: Manutencao) => void;
}

const initialFormState: Omit<Manutencao, 'id' | 'documentos_anexados'> = {
  veiculo_placa: '',
  tipo: '',
  data: '',
  km: 0,
  valor: 0,
  fornecedor: '',
  status: 'Em aberto',
};

const Manutencoes: React.FC<ManutencoesProps> = ({
  manutencoes,
  veiculos,
  onAddManutencao,
  onDeleteManutencao,
  onAnexarDocumento,
  onUpdateManutencao
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newManutencao, setNewManutencao] = useState(initialFormState);
  const [editingManutencao, setEditingManutencao] = useState<Manutencao | null>(null);
  const [manutencaoToDelete, setManutencaoToDelete] = useState<Manutencao | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentManutencaoId, setCurrentManutencaoId] = useState<number | null>(null);

  const handleDeleteClick = (manutencao: Manutencao) => {
    setManutencaoToDelete(manutencao);
  };

  const handleEditClick = (manutencao: Manutencao) => {
    setEditingManutencao({ ...manutencao });
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (manutencaoToDelete) {
      onDeleteManutencao(manutencaoToDelete.id);
      setManutencaoToDelete(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }
    setNewManutencao(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }
    setEditingManutencao(prev => prev ? { ...prev, [name]: processedValue } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddManutencao(newManutencao);
    setIsAddModalOpen(false);
    setNewManutencao(initialFormState);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManutencao) return;
    onUpdateManutencao(editingManutencao);
    setIsEditModalOpen(false);
    setEditingManutencao(null);
  };

  const handleAnexarClick = (manutencaoId: number) => {
    setCurrentManutencaoId(manutencaoId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentManutencaoId !== null) {
      onAnexarDocumento(currentManutencaoId, e.target.files[0].name);
      setCurrentManutencaoId(null);
      e.target.value = '';
    }
  };

  const handleDownload = (manutencao: Manutencao, documento: DocumentoAnexado) => {
    const fileContent = `
NOTA/RECIBO DE MANUTENÇÃO
---------------------------------
ID Manutenção: ${manutencao.id}
VEÍCULO: ${manutencao.veiculo_placa}
SERVIÇO: ${manutencao.tipo}
DATA: ${formatDate(manutencao.data)}
KM: ${manutencao.km}
VALOR: ${formatCurrency(manutencao.valor)}
FORNECEDOR: ${manutencao.fornecedor}

Este é um documento de simulação para o arquivo: ${documento.nome}
    `;
    const blob = new Blob([fileContent.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = documento.nome.replace(/\.[^/.]+$/, "") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = manutencoes.map(m => ({
      'Veículo': m.veiculo_placa,
      'Tipo de Serviço': m.tipo,
      'Data': m.data,
      'KM': m.km,
      'Valor': m.valor,
      'Fornecedor': m.fornecedor,
      'Status': m.status,
      'Documentos': m.documentos_anexados?.map(d => d.nome).join(', ') || ''
    }));
    exportToExcel(data, 'manutencoes', 'Manutenções');
  };

  const getStatusColor = (status: string) => {
    const colorClasses: { [key: string]: string } = {
      'Paga': 'bg-green-500',
      'Em aberto': 'bg-yellow-500',
      'Atrasado': 'bg-red-500',
    };
    return colorClasses[status] || 'bg-gray-500';
  }

  return (
    <>
      <Header title="Manutenções" description="Registre e acompanhe todas as manutenções realizadas nos veículos da frota." />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.png"
      />

      <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
        <button
          onClick={() => {
            setNewManutencao(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Adicionar Manutenção
        </button>

        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar
        </button>
      </div>

      {manutencoes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <EmptyState
            title="Nenhuma manutenção registrada"
            description="Registre manutenções dos veículos para controle de custos e histórico."
            actionLabel="Registrar Primeira Manutenção"
            onAction={() => setIsAddModalOpen(true)}
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      ) : (
        <Table<Manutencao>
          data={manutencoes}
          columns={[
            { header: 'Veículo', accessor: 'veiculo_placa' },
            { header: 'Tipo de Serviço', accessor: 'tipo' },
            { header: 'Data', accessor: 'data', isDate: true },
            { header: 'KM', accessor: 'km' },
            { header: 'Valor', accessor: 'valor', isCurrency: true },
            {
              header: 'Status', accessor: 'status', render: (manutencao) => (
                <span className={`px-2.5 py-1 text-xs font-bold text-white rounded-full uppercase tracking-wider ${getStatusColor(manutencao.status)}`}>
                  {manutencao.status}
                </span>
              )
            },
            {
              header: 'Documentos',
              accessor: 'documentos_anexados',
              render: (item) => (
                item.documentos_anexados && item.documentos_anexados.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.documentos_anexados.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => handleDownload(item, doc)}
                        className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 font-medium px-2 py-0.5 rounded-full truncate"
                        title={`Baixar ${doc.nome}`}
                      >
                        {doc.nome}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 text-xs">Nenhum</span>
                )
              )
            },
            {
              header: 'Ações',
              accessor: 'id',
              render: (manutencao) => (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditClick(manutencao)}
                    className="text-petrol-blue-700 hover:text-petrol-blue-900 dark:text-petrol-blue-400 dark:hover:text-petrol-blue-300 font-medium text-sm"
                    aria-label={`Editar manutenção ${manutencao.id}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleAnexarClick(manutencao.id)}
                    className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm"
                    aria-label={`Anexar documento para a manutenção ${manutencao.id}`}
                  >
                    Anexar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(manutencao)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                    aria-label={`Excluir manutenção ${manutencao.id}`}
                  >
                    Excluir
                  </button>
                </div>
              ),
            },
          ]}
          statusFilter={{
            field: 'status',
            options: ['Em aberto', 'Paga', 'Atrasado'] as StatusPagamentoDespesa[]
          }}
          dateFilter={{
            field: 'data',
            label: 'Data'
          }}
        />
      )}

      {/* Add Manutenção Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Nova Manutenção" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="veiculo_placa" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Veículo <span className="text-red-500">*</span></label>
              <select name="veiculo_placa" id="veiculo_placa" value={newManutencao.veiculo_placa} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Selecione um veículo</option>
                {veiculos.map(v => <option key={v.id} value={v.placa}>{v.marca} {v.modelo} - {v.placa}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="tipo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Serviço <span className="text-red-500">*</span></label>
              <input type="text" name="tipo" id="tipo" value={newManutencao.tipo} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="data" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data <span className="text-red-500">*</span></label>
              <input type="date" name="data" id="data" value={newManutencao.data} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="km" className="block text-sm font-medium text-slate-700 dark:text-slate-300">KM do Veículo <span className="text-red-500">*</span></label>
              <input type="number" name="km" id="km" value={newManutencao.km} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$) <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" name="valor" id="valor" value={newManutencao.valor} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="fornecedor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fornecedor / Oficina <span className="text-red-500">*</span></label>
              <input type="text" name="fornecedor" id="fornecedor" value={newManutencao.fornecedor} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select name="status" id="status" value={newManutencao.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Em aberto">Em aberto</option>
                <option value="Paga">Paga</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Salvar Manutenção
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Manutenção Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Manutenção" size="lg">
        {editingManutencao && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-veiculo_placa" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Veículo</label>
                <select name="veiculo_placa" id="edit-veiculo_placa" value={editingManutencao.veiculo_placa} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {veiculos.map(v => <option key={v.id} value={v.placa}>{v.marca} {v.modelo} - {v.placa}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="edit-tipo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Serviço</label>
                <input type="text" name="tipo" id="edit-tipo" value={editingManutencao.tipo} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-data" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                <input type="date" name="data" id="edit-data" value={editingManutencao.data} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-km" className="block text-sm font-medium text-slate-700 dark:text-slate-300">KM do Veículo</label>
                <input type="number" name="km" id="edit-km" value={editingManutencao.km} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-valor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
                <input type="number" step="0.01" name="valor" id="edit-valor" value={editingManutencao.valor} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-fornecedor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fornecedor / Oficina</label>
                <input type="text" name="fornecedor" id="edit-fornecedor" value={editingManutencao.fornecedor} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" id="edit-status" value={editingManutencao.status} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Em aberto">Em aberto</option>
                  <option value="Paga">Paga</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
            </div>
            <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
                Cancelar
              </button>
              <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!manutencaoToDelete}
        onClose={() => setManutencaoToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div>
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            Tem certeza que deseja excluir este registro de manutenção?
          </p>
          <p className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
            {manutencaoToDelete?.tipo} em {manutencaoToDelete?.veiculo_placa}
          </p>
          <div className="pt-5 mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setManutencaoToDelete(null)}
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
    </>
  );
};

export default Manutencoes;
