import React, { useState, useRef } from 'react';
import { Contrato, Veiculo, Motorista, Plano, StatusContrato } from '../types';
import { Table, Header, Modal, EmptyState } from './ui';
import { formatDate } from '../utils/formatters';
import { exportToExcel, prepareContratosForExport } from '../utils/export';

interface ContratosProps {
  contratos: Contrato[];
  veiculos: Veiculo[];
  motoristas: Motorista[];
  planos: Plano[];
  onAddContrato: (contrato: Omit<Contrato, 'id' | 'pagamentos'>) => void;
  onDeleteContrato: (id: number) => void;
  onAnexarDocumento: (contratoId: number, fileName: string) => void;
  onUpdateContratoStatus: (contratoId: number, status: StatusContrato) => void;
  onUpdateContrato: (contrato: Contrato) => void;
}

const initialFormState: Omit<Contrato, 'id' | 'pagamentos' | 'veiculo_placa' | 'veiculo_modelo' | 'veiculo_id'> & { veiculo_id: string } = {
  veiculo_id: '',
  motorista_nome: '',
  plano_nome: '',
  data_inicio: '',
  data_fim: '',
  status: 'Em vigor',
};


const Contratos: React.FC<ContratosProps> = ({
  contratos,
  veiculos,
  motoristas,
  planos,
  onAddContrato,
  onDeleteContrato,
  onAnexarDocumento,
  onUpdateContratoStatus,
  onUpdateContrato
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newContrato, setNewContrato] = useState(initialFormState);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [contratoToDelete, setContratoToDelete] = useState<Contrato | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentContratoId, setCurrentContratoId] = useState<number | null>(null);

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'Disponível');

  const handleDeleteClick = (contrato: Contrato) => {
    setContratoToDelete(contrato);
  };

  const handleEditClick = (contrato: Contrato) => {
    setEditingContrato({ ...contrato });
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (contratoToDelete) {
      onDeleteContrato(contratoToDelete.id);
      setContratoToDelete(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewContrato(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingContrato(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veiculoIdNum = parseInt(newContrato.veiculo_id, 10);
    const veiculoSelecionado = veiculos.find(v => v.id === veiculoIdNum);
    if (!veiculoSelecionado) return;

    onAddContrato({
      veiculo_id: veiculoIdNum,
      veiculo_placa: veiculoSelecionado.placa,
      veiculo_modelo: veiculoSelecionado.modelo,
      motorista_nome: newContrato.motorista_nome,
      plano_nome: newContrato.plano_nome,
      data_inicio: newContrato.data_inicio,
      data_fim: newContrato.data_fim,
      status: newContrato.status
    });
    setIsAddModalOpen(false);
    setNewContrato(initialFormState);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrato) return;
    onUpdateContrato(editingContrato);
    setIsEditModalOpen(false);
    setEditingContrato(null);
  };

  const handleAnexarClick = (contratoId: number) => {
    setCurrentContratoId(contratoId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentContratoId !== null) {
      onAnexarDocumento(currentContratoId, e.target.files[0].name);
      setCurrentContratoId(null);
      e.target.value = '';
    }
  };

  const handleDownload = (contrato: Contrato) => {
    if (!contrato.documento_anexado) return;

    const fileContent = `
CONTRATO DE LOCAÇÃO DE VEÍCULO
---------------------------------
CONTRATO Nº: ${contrato.id}
LOCATÁRIO: ${contrato.motorista_nome}
VEÍCULO: ${contrato.veiculo_modelo} - ${contrato.veiculo_placa}
PLANO: ${contrato.plano_nome}
INÍCIO: ${formatDate(contrato.data_inicio)}
FIM: ${formatDate(contrato.data_fim)}
STATUS: ${contrato.status}

Este é um documento de simulação para o arquivo: ${contrato.documento_anexado}
    `;
    const blob = new Blob([fileContent.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = contrato.documento_anexado.replace(/\.[^/.]+$/, "") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = prepareContratosForExport(contratos);
    exportToExcel(data, 'contratos', 'Contratos');
  };

  const getStatusColor = (status: string) => {
    const colorClasses: { [key: string]: string } = {
      'Em vigor': 'bg-green-500',
      'Encerrado': 'bg-slate-500',
      'Em atraso': 'bg-red-500',
    };
    return colorClasses[status] || 'bg-gray-500';
  }

  return (
    <>
      <Header title="Contratos de Locação" description="Acompanhe todos os contratos ativos, encerrados e em atraso." />

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
            setNewContrato(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Adicionar Contrato
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

      {contratos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <EmptyState
            title="Nenhum contrato cadastrado"
            description="Crie contratos de locação vinculando veículos, motoristas e planos."
            actionLabel="Criar Primeiro Contrato"
            onAction={() => setIsAddModalOpen(true)}
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      ) : (
        <Table<Contrato>
          data={contratos}
          columns={[
            { header: 'Contrato Nº', accessor: 'id' },
            { header: 'Veículo', accessor: 'veiculo_placa' },
            { header: 'Motorista', accessor: 'motorista_nome' },
            { header: 'Plano', accessor: 'plano_nome' },
            {
              header: 'Documento', accessor: 'documento_anexado', render: (item) => (
                item.documento_anexado ? (
                  <button
                    onClick={() => handleDownload(item)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium truncate hover:underline"
                    title={`Baixar ${item.documento_anexado}`}
                  >
                    {item.documento_anexado}
                  </button>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Nenhum</span>
                )
              )
            },
            {
              header: 'Status', accessor: 'status', render: (contrato) => (
                <select
                  value={contrato.status}
                  onChange={(e) => onUpdateContratoStatus(contrato.id, e.target.value as StatusContrato)}
                  className={`px-2.5 py-1 text-xs font-bold text-white rounded-full border-none appearance-none cursor-pointer uppercase tracking-wider focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 ${getStatusColor(contrato.status)}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="Em vigor">Em vigor</option>
                  <option value="Encerrado">Encerrado</option>
                  <option value="Em atraso">Em atraso</option>
                </select>
              )
            },
            {
              header: 'Ações',
              accessor: 'id',
              render: (contrato) => (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditClick(contrato)}
                    className="text-petrol-blue-700 hover:text-petrol-blue-900 dark:text-petrol-blue-400 dark:hover:text-petrol-blue-300 font-medium text-sm"
                    aria-label={`Editar contrato ${contrato.id}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleAnexarClick(contrato.id)}
                    className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm"
                    aria-label={`Anexar documento para o contrato ${contrato.id}`}
                  >
                    Anexar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(contrato)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                    aria-label={`Excluir contrato ${contrato.id}`}
                  >
                    Excluir
                  </button>
                </div>
              ),
            },
          ]}
          statusFilter={{
            field: 'status',
            options: ['Em vigor', 'Encerrado', 'Em atraso'] as StatusContrato[]
          }}
          dateFilter={{
            field: 'data_inicio',
            label: 'Data Início'
          }}
        />
      )}

      {/* Add Contrato Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Criar Novo Contrato" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="veiculo_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Veículo (Disponíveis) <span className="text-red-500">*</span></label>
              <select name="veiculo_id" id="veiculo_id" value={newContrato.veiculo_id} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Selecione um veículo</option>
                {veiculosDisponiveis.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="motorista_nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Motorista <span className="text-red-500">*</span></label>
              <select name="motorista_nome" id="motorista_nome" value={newContrato.motorista_nome} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Selecione um motorista</option>
                {motoristas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="plano_nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Plano <span className="text-red-500">*</span></label>
              <select name="plano_nome" id="plano_nome" value={newContrato.plano_nome} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Selecione um plano</option>
                {planos.filter(p => p.status === 'Ativo').map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select name="status" id="status" value={newContrato.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Em vigor">Em vigor</option>
                <option value="Encerrado">Encerrado</option>
                <option value="Em atraso">Em atraso</option>
              </select>
            </div>
            <div>
              <label htmlFor="data_inicio" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data de Início <span className="text-red-500">*</span></label>
              <input type="date" name="data_inicio" id="data_inicio" value={newContrato.data_inicio} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="data_fim" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data de Fim <span className="text-red-500">*</span></label>
              <input type="date" name="data_fim" id="data_fim" value={newContrato.data_fim} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>
          <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Salvar Contrato
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contrato Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Contrato" size="lg">
        {editingContrato && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Veículo:</span> {editingContrato.veiculo_modelo} - {editingContrato.veiculo_placa}
                </p>
              </div>
              <div>
                <label htmlFor="edit-motorista_nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Motorista</label>
                <select name="motorista_nome" id="edit-motorista_nome" value={editingContrato.motorista_nome} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {motoristas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-plano_nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Plano</label>
                <select name="plano_nome" id="edit-plano_nome" value={editingContrato.plano_nome} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {planos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" id="edit-status" value={editingContrato.status} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Em vigor">Em vigor</option>
                  <option value="Encerrado">Encerrado</option>
                  <option value="Em atraso">Em atraso</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-data_inicio" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data de Início</label>
                <input type="date" name="data_inicio" id="edit-data_inicio" value={editingContrato.data_inicio} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="edit-data_fim" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data de Fim</label>
                <input type="date" name="data_fim" id="edit-data_fim" value={editingContrato.data_fim} onChange={handleEditInputChange} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
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
        isOpen={!!contratoToDelete}
        onClose={() => setContratoToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div>
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            Tem certeza que deseja excluir o contrato?
          </p>
          <p className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
            Contrato Nº {contratoToDelete?.id} ({contratoToDelete?.motorista_nome})
          </p>
          <div className="pt-5 mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setContratoToDelete(null)}
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

export default Contratos;
