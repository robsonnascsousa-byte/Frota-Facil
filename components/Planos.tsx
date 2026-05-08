import React, { useState } from 'react';
import { Plano, StatusGenerico } from '../types';
import { Table, Header, Modal, EmptyState } from './ui';

interface PlanosProps {
  planos: Plano[];
  onAddPlano: (plano: Omit<Plano, 'id'>) => void;
  onDeletePlano: (id: number) => void;
  onUpdatePlano: (plano: Plano) => void;
}

const initialFormState: Omit<Plano, 'id'> = {
  nome: '',
  tipo_cobranca: 'Semanal',
  valor_base: 0,
  franquia_km: '',
  status: 'Ativo',
};

const FormField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  colSpan?: boolean;
}> = ({ label, name, type = 'text', value, onChange, required, placeholder, colSpan }) => (
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
      placeholder={placeholder}
      className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
    />
  </div>
);

const Planos: React.FC<PlanosProps> = ({ planos, onAddPlano, onDeletePlano, onUpdatePlano }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newPlano, setNewPlano] = useState(initialFormState);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [planoToDelete, setPlanoToDelete] = useState<Plano | null>(null);

  const handleDeleteClick = (plano: Plano) => {
    setPlanoToDelete(plano);
  };

  const handleEditClick = (plano: Plano) => {
    setEditingPlano({ ...plano });
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (planoToDelete) {
      onDeletePlano(planoToDelete.id);
      setPlanoToDelete(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }
    setNewPlano(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }
    setEditingPlano(prev => prev ? { ...prev, [name]: processedValue } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPlano(newPlano);
    setIsAddModalOpen(false);
    setNewPlano(initialFormState);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlano) return;
    onUpdatePlano(editingPlano);
    setIsEditModalOpen(false);
    setEditingPlano(null);
  };


  return (
    <>
      <Header title="Planos de Locação" description="Gerencie os modelos de planos de locação oferecidos aos motoristas." />

      <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
        <button
          onClick={() => {
            setNewPlano(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Adicionar Plano
        </button>
      </div>

      {planos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <EmptyState
            title="Nenhum plano cadastrado"
            description="Crie planos de locação para oferecer aos motoristas parceiros."
            actionLabel="Adicionar Primeiro Plano"
            onAction={() => setIsAddModalOpen(true)}
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />
        </div>
      ) : (
        <Table<Plano>
          data={planos}
          columns={[
            { header: 'Nome do Plano', accessor: 'nome' },
            { header: 'Tipo de Cobrança', accessor: 'tipo_cobranca' },
            { header: 'Valor Base', accessor: 'valor_base', isCurrency: true },
            { header: 'Franquia KM', accessor: 'franquia_km' },
            { header: 'Status', accessor: 'status', isBadge: true },
            {
              header: 'Ações',
              accessor: 'id',
              render: (plano) => (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(plano)}
                    className="text-petrol-blue-600 hover:text-petrol-blue-800 dark:text-petrol-blue-400 dark:hover:text-petrol-blue-300 font-medium text-sm"
                    aria-label={`Editar plano ${plano.nome}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(plano)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                    aria-label={`Excluir plano ${plano.nome}`}
                  >
                    Excluir
                  </button>
                </div>
              ),
            },
          ]}
          statusFilter={{
            field: 'status',
            options: ['Ativo', 'Inativo'] as StatusGenerico[]
          }}
        />
      )}

      {/* Add Plano Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Plano" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome do Plano" name="nome" value={newPlano.nome} onChange={handleInputChange} required colSpan />
            <div>
              <label htmlFor="tipo_cobranca" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Cobrança</label>
              <select name="tipo_cobranca" id="tipo_cobranca" value={newPlano.tipo_cobranca} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Semanal">Semanal</option>
                <option value="Mensal">Mensal</option>
                <option value="Diária">Diária</option>
              </select>
            </div>
            <FormField label="Valor Base (R$)" name="valor_base" type="number" value={newPlano.valor_base} onChange={handleInputChange} required />
            <FormField label="Franquia KM" name="franquia_km" value={newPlano.franquia_km} onChange={handleInputChange} required placeholder="Ex: 1200 KM ou Livre" />
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select name="status" id="status" value={newPlano.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div className="pt-5 border-t dark:border-slate-700 mt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white dark:bg-slate-700 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-petrol-blue-700 hover:bg-petrol-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500">
              Salvar Plano
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Plano Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Plano" size="lg">
        {editingPlano && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome do Plano" name="nome" value={editingPlano.nome} onChange={handleEditInputChange} required colSpan />
              <div>
                <label htmlFor="edit-tipo_cobranca" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Cobrança</label>
                <select name="tipo_cobranca" id="edit-tipo_cobranca" value={editingPlano.tipo_cobranca} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Diária">Diária</option>
                </select>
              </div>
              <FormField label="Valor Base (R$)" name="valor_base" type="number" value={editingPlano.valor_base} onChange={handleEditInputChange} required />
              <FormField label="Franquia KM" name="franquia_km" value={editingPlano.franquia_km} onChange={handleEditInputChange} required placeholder="Ex: 1200 KM ou Livre" />
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" id="edit-status" value={editingPlano.status} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-petrol-blue-500 focus:ring-petrol-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
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
        isOpen={!!planoToDelete}
        onClose={() => setPlanoToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div>
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            Tem certeza que deseja excluir o plano?
          </p>
          <p className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
            {planoToDelete?.nome}
          </p>
          <div className="pt-5 mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setPlanoToDelete(null)}
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

export default Planos;
