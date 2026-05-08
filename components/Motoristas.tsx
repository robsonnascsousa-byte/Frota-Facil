import React, { useState } from 'react';
import { Motorista, StatusMotorista } from '../types';
import { Table, Header, Modal, EmptyState } from './ui';
import { validateMotorista, formatCPF, formatWhatsApp, ValidationErrors } from '../utils/validation';
import { exportToExcel, prepareMotoristasForExport } from '../utils/export';

interface MotoristasProps {
  motoristas: Motorista[];
  onAddMotorista: (motorista: Omit<Motorista, 'id'>) => void;
  onDeleteMotorista: (id: number) => void;
  onUpdateMotorista: (motorista: Motorista) => void;
}

const initialFormState: Omit<Motorista, 'id'> = {
  nome: '',
  cpf: '',
  whatsapp: '',
  cidade: '',
  status: 'Ativo',
  vencimento_cnh: '',
};

const FormField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  colSpan?: boolean;
}> = ({ label, name, type = 'text', value, onChange, error, required, colSpan }) => (
  <div className={colSpan ? 'md:col-span-2' : ''}>
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

const Motoristas: React.FC<MotoristasProps> = ({ motoristas, onAddMotorista, onDeleteMotorista, onUpdateMotorista }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newMotorista, setNewMotorista] = useState(initialFormState);
  const [editingMotorista, setEditingMotorista] = useState<Motorista | null>(null);
  const [motoristaToDelete, setMotoristaToDelete] = useState<Motorista | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleDeleteClick = (motorista: Motorista) => {
    setMotoristaToDelete(motorista);
  };

  const handleEditClick = (motorista: Motorista) => {
    setEditingMotorista({ ...motorista });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (motoristaToDelete) {
      onDeleteMotorista(motoristaToDelete.id);
      setMotoristaToDelete(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMotorista(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingMotorista(prev => prev ? { ...prev, [name]: value } : null);
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateMotorista(newMotorista);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formattedMotorista = {
      ...newMotorista,
      cpf: formatCPF(newMotorista.cpf),
      whatsapp: formatWhatsApp(newMotorista.whatsapp),
    };

    onAddMotorista(formattedMotorista);
    setIsAddModalOpen(false);
    setNewMotorista(initialFormState);
    setErrors({});
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMotorista) return;

    const validationErrors = validateMotorista(editingMotorista);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formattedMotorista = {
      ...editingMotorista,
      cpf: formatCPF(editingMotorista.cpf),
      whatsapp: formatWhatsApp(editingMotorista.whatsapp),
    };

    onUpdateMotorista(formattedMotorista);
    setIsEditModalOpen(false);
    setEditingMotorista(null);
    setErrors({});
  };

  const handleExport = () => {
    const data = prepareMotoristasForExport(motoristas);
    exportToExcel(data, 'motoristas', 'Motoristas');
  };


  return (
    <>
      <Header title="Motoristas" description="Gerencie o cadastro de todos os motoristas parceiros." />

      <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
        <button
          onClick={() => {
            setNewMotorista(initialFormState);
            setErrors({});
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Adicionar Motorista
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

      {motoristas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <EmptyState
            title="Nenhum motorista cadastrado"
            description="Comece adicionando o primeiro motorista parceiro para gerenciar suas locações."
            actionLabel="Adicionar Primeiro Motorista"
            onAction={() => setIsAddModalOpen(true)}
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
      ) : (
        <Table<Motorista>
          data={motoristas}
          columns={[
            { header: 'Nome', accessor: 'nome' },
            { header: 'CPF', accessor: 'cpf' },
            { header: 'WhatsApp', accessor: 'whatsapp' },
            { header: 'Cidade', accessor: 'cidade' },
            { header: 'Status', accessor: 'status', isBadge: true },
            { header: 'Venc. CNH', accessor: 'vencimento_cnh', isDate: true },
            {
              header: 'Ações',
              accessor: 'id',
              render: (motorista) => (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(motorista)}
                    className="text-petrol-blue-600 hover:text-petrol-blue-800 dark:text-petrol-blue-400 dark:hover:text-petrol-blue-300 font-medium text-sm"
                    aria-label={`Editar motorista ${motorista.nome}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(motorista)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                    aria-label={`Excluir motorista ${motorista.nome}`}
                  >
                    Excluir
                  </button>
                </div>
              ),
            },
          ]}
          statusFilter={{
            field: 'status',
            options: ['Ativo', 'Inadimplente', 'Histórico'] as StatusMotorista[]
          }}
        />
      )}

      {/* Add Motorista Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Motorista" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome Completo" name="nome" value={newMotorista.nome} onChange={handleInputChange} error={errors.nome} required colSpan />
            <FormField label="CPF" name="cpf" value={newMotorista.cpf} onChange={handleInputChange} error={errors.cpf} required />
            <FormField label="WhatsApp" name="whatsapp" type="tel" value={newMotorista.whatsapp} onChange={handleInputChange} error={errors.whatsapp} required />
            <FormField label="Cidade" name="cidade" value={newMotorista.cidade} onChange={handleInputChange} required />
            <FormField label="Vencimento CNH" name="vencimento_cnh" type="date" value={newMotorista.vencimento_cnh} onChange={handleInputChange} required />
            <div className="md:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select name="status" id="status" value={newMotorista.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Ativo">Ativo</option>
                <option value="Inadimplente">Inadimplente</option>
                <option value="Histórico">Histórico</option>
              </select>
            </div>
          </div>
          <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Salvar Motorista
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Motorista Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Motorista" size="lg">
        {editingMotorista && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome Completo" name="nome" value={editingMotorista.nome} onChange={handleEditInputChange} error={errors.nome} required colSpan />
              <FormField label="CPF" name="cpf" value={editingMotorista.cpf} onChange={handleEditInputChange} error={errors.cpf} required />
              <FormField label="WhatsApp" name="whatsapp" type="tel" value={editingMotorista.whatsapp} onChange={handleEditInputChange} error={errors.whatsapp} required />
              <FormField label="Cidade" name="cidade" value={editingMotorista.cidade} onChange={handleEditInputChange} required />
              <FormField label="Vencimento CNH" name="vencimento_cnh" type="date" value={editingMotorista.vencimento_cnh} onChange={handleEditInputChange} required />
              <div className="md:col-span-2">
                <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" id="edit-status" value={editingMotorista.status} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Ativo">Ativo</option>
                  <option value="Inadimplente">Inadimplente</option>
                  <option value="Histórico">Histórico</option>
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
        isOpen={!!motoristaToDelete}
        onClose={() => setMotoristaToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div>
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            Tem certeza que deseja excluir o motorista?
          </p>
          <p className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
            {motoristaToDelete?.nome} - {motoristaToDelete?.cpf}
          </p>
          <div className="pt-5 mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setMotoristaToDelete(null)}
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

export default Motoristas;