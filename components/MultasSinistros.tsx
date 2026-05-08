import React, { useState } from 'react';
import { Multa, Sinistro, Veiculo, Motorista, StatusMulta, StatusSinistro } from '../types';
import { Table, Header, Modal } from './ui';

interface MultasSinistrosProps {
  multas: Multa[];
  sinistros: Sinistro[];
  veiculos: Veiculo[];
  motoristas: Motorista[];
  onAddMulta: (multa: Omit<Multa, 'id'>) => void;
  onDeleteMulta: (id: number) => void;
  onAddSinistro: (sinistro: Omit<Sinistro, 'id'>) => void;
  onDeleteSinistro: (id: number) => void;
  onUpdateMultaStatus: (multaId: number, status: StatusMulta) => void;
  onUpdateSinistroStatus: (sinistroId: number, status: StatusSinistro) => void;
}

const initialMultaState: Omit<Multa, 'id'> = {
  veiculo_placa: '',
  data: '',
  valor: 0,
  motorista_nome: '',
  status: 'Em aberto',
};

const initialSinistroState: Omit<Sinistro, 'id'> = {
  veiculo_placa: '',
  tipo: '',
  data: '',
  status: 'Em análise',
};

const MultasSinistros: React.FC<MultasSinistrosProps> = ({
  multas,
  sinistros,
  veiculos,
  motoristas,
  onAddMulta,
  onDeleteMulta,
  onAddSinistro,
  onDeleteSinistro,
  onUpdateMultaStatus,
  onUpdateSinistroStatus,
}) => {
  const [isAddMultaModalOpen, setIsAddMultaModalOpen] = useState(false);
  const [newMulta, setNewMulta] = useState(initialMultaState);
  const [multaToDelete, setMultaToDelete] = useState<Multa | null>(null);

  const [isAddSinistroModalOpen, setIsAddSinistroModalOpen] = useState(false);
  const [newSinistro, setNewSinistro] = useState(initialSinistroState);
  const [sinistroToDelete, setSinistroToDelete] = useState<Sinistro | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, setState: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value, type } = e.target;
    let processedValue = value;
    if (type === 'number') {
      processedValue = value ? parseFloat(value) : 0;
    }
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  const handleMultaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMulta(newMulta);
    setIsAddMultaModalOpen(false);
    setNewMulta(initialMultaState);
  };

  const handleSinistroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSinistro(newSinistro);
    setIsAddSinistroModalOpen(false);
    setNewSinistro(initialSinistroState);
  };

  const confirmDeleteMulta = () => {
    if (multaToDelete) {
      onDeleteMulta(multaToDelete.id);
      setMultaToDelete(null);
    }
  };

  const confirmDeleteSinistro = () => {
    if (sinistroToDelete) {
      onDeleteSinistro(sinistroToDelete.id);
      setSinistroToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colorClasses: { [key: string]: string } = {
      'Paga': 'bg-green-500',
      'Em aberto': 'bg-yellow-500',
      'Em recurso': 'bg-blue-500',
      'Em análise': 'bg-yellow-500',
      'Indenizado': 'bg-blue-500',
      'Concluído': 'bg-green-500',
    };
    return colorClasses[status] || 'bg-gray-500';
  }

  return (
    <>
      <Header title="Multas & Sinistros" description="Controle as multas e sinistros associados à frota." />

      {/* Multas Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-700">Multas</h2>
          <button
            onClick={() => setIsAddMultaModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800"
          >
            Adicionar Multa
          </button>
        </div>
        <Table<Multa>
          data={multas}
          columns={[
            { header: 'Veículo', accessor: 'veiculo_placa' },
            { header: 'Data Infração', accessor: 'data', isDate: true },
            { header: 'Motorista', accessor: 'motorista_nome' },
            { header: 'Valor', accessor: 'valor', isCurrency: true },
            {
              header: 'Status',
              accessor: 'status',
              render: (multa) => (
                <select
                  value={multa.status}
                  onChange={(e) => onUpdateMultaStatus(multa.id, e.target.value as StatusMulta)}
                  className={`px-2.5 py-1 text-xs font-bold text-white rounded-full border-none appearance-none cursor-pointer uppercase tracking-wider focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 ${getStatusColor(multa.status)}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="Em aberto">Em aberto</option>
                  <option value="Paga">Paga</option>
                  <option value="Em recurso">Em recurso</option>
                </select>
              )
            },
            {
              header: 'Ações',
              accessor: 'id',
              render: (multa) => (
                <button
                  onClick={() => setMultaToDelete(multa)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Excluir
                </button>
              ),
            },
          ]}
        />
      </div>

      {/* Sinistros Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-700">Sinistros</h2>
          <button
            onClick={() => setIsAddSinistroModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-petrol-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-petrol-blue-800"
          >
            Adicionar Sinistro
          </button>
        </div>
        <Table<Sinistro>
          data={sinistros}
          columns={[
            { header: 'Veículo', accessor: 'veiculo_placa' },
            { header: 'Tipo', accessor: 'tipo' },
            { header: 'Data', accessor: 'data', isDate: true },
            {
              header: 'Status',
              accessor: 'status',
              render: (sinistro) => (
                <select
                  value={sinistro.status}
                  onChange={(e) => onUpdateSinistroStatus(sinistro.id, e.target.value as StatusSinistro)}
                  className={`px-2.5 py-1 text-xs font-bold text-white rounded-full border-none appearance-none cursor-pointer uppercase tracking-wider focus:ring-2 focus:ring-offset-2 focus:ring-petrol-blue-500 ${getStatusColor(sinistro.status)}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="Em análise">Em análise</option>
                  <option value="Indenizado">Indenizado</option>
                  <option value="Concluído">Concluído</option>
                </select>
              )
            },
            {
              header: 'Ações',
              accessor: 'id',
              render: (sinistro) => (
                <button
                  onClick={() => setSinistroToDelete(sinistro)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Excluir
                </button>
              ),
            },
          ]}
        />
      </div>

      {/* Add Multa Modal */}
      <Modal isOpen={isAddMultaModalOpen} onClose={() => setIsAddMultaModalOpen(false)} title="Adicionar Nova Multa">
        <form onSubmit={handleMultaSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="veiculo_placa" className="block text-sm font-medium text-slate-700">Veículo</label>
              <select name="veiculo_placa" value={newMulta.veiculo_placa} onChange={(e) => handleInputChange(e, setNewMulta)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900">
                <option value="">Selecione</option>
                {veiculos.map(v => <option key={v.id} value={v.placa}>{v.marca} {v.modelo} - {v.placa}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="motorista_nome" className="block text-sm font-medium text-slate-700">Motorista</label>
              <select name="motorista_nome" value={newMulta.motorista_nome} onChange={(e) => handleInputChange(e, setNewMulta)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900">
                <option value="">Selecione</option>
                {motoristas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="data" className="block text-sm font-medium text-slate-700">Data da Infração</label>
              <input type="date" name="data" value={newMulta.data} onChange={(e) => handleInputChange(e, setNewMulta)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900" />
            </div>
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-slate-700">Valor (R$)</label>
              <input type="number" step="0.01" name="valor" value={newMulta.valor} onChange={(e) => handleInputChange(e, setNewMulta)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
              <select name="status" value={newMulta.status} onChange={(e) => handleInputChange(e, setNewMulta)} className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900">
                <option>Em aberto</option>
                <option>Paga</option>
                <option>Em recurso</option>
              </select>
            </div>
          </div>
          <div className="pt-5 border-t mt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddMultaModalOpen(false)} className="bg-white py-2 px-4 border rounded-md">Cancelar</button>
            <button type="submit" className="py-2 px-4 rounded-md text-white bg-petrol-blue-700">Salvar Multa</button>
          </div>
        </form>
      </Modal>

      {/* Add Sinistro Modal */}
      <Modal isOpen={isAddSinistroModalOpen} onClose={() => setIsAddSinistroModalOpen(false)} title="Adicionar Novo Sinistro">
        <form onSubmit={handleSinistroSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="veiculo_placa" className="block text-sm font-medium text-slate-700">Veículo</label>
              <select name="veiculo_placa" value={newSinistro.veiculo_placa} onChange={(e) => handleInputChange(e, setNewSinistro)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900">
                <option value="">Selecione</option>
                {veiculos.map(v => <option key={v.id} value={v.placa}>{v.marca} {v.modelo} - {v.placa}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-slate-700">Tipo de Sinistro</label>
              <input type="text" name="tipo" value={newSinistro.tipo} onChange={(e) => handleInputChange(e, setNewSinistro)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900" />
            </div>
            <div>
              <label htmlFor="data" className="block text-sm font-medium text-slate-700">Data</label>
              <input type="date" name="data" value={newSinistro.data} onChange={(e) => handleInputChange(e, setNewSinistro)} required className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
              <select name="status" value={newSinistro.status} onChange={(e) => handleInputChange(e, setNewSinistro)} className="mt-1 block w-full rounded-md border-slate-300 bg-white text-slate-900">
                <option>Em análise</option>
                <option>Indenizado</option>
                <option>Concluído</option>
              </select>
            </div>
          </div>
          <div className="pt-5 border-t mt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddSinistroModalOpen(false)} className="bg-white py-2 px-4 border rounded-md">Cancelar</button>
            <button type="submit" className="py-2 px-4 rounded-md text-white bg-petrol-blue-700">Salvar Sinistro</button>
          </div>
        </form>
      </Modal>


      {/* Delete Confirmation Modals */}
      <Modal isOpen={!!multaToDelete} onClose={() => setMultaToDelete(null)} title="Confirmar Exclusão">
        <p>Tem certeza que deseja excluir esta multa?</p>
        <p className="font-semibold">{multaToDelete?.veiculo_placa} - {multaToDelete?.data}</p>
        <div className="pt-5 flex justify-end space-x-3">
          <button onClick={() => setMultaToDelete(null)} className="bg-white py-2 px-4 border rounded-md">Cancelar</button>
          <button onClick={confirmDeleteMulta} className="py-2 px-4 rounded-md text-white bg-red-600">Confirmar</button>
        </div>
      </Modal>

      <Modal isOpen={!!sinistroToDelete} onClose={() => setSinistroToDelete(null)} title="Confirmar Exclusão">
        <p>Tem certeza que deseja excluir este sinistro?</p>
        <p className="font-semibold">{sinistroToDelete?.veiculo_placa} - {sinistroToDelete?.data}</p>
        <div className="pt-5 flex justify-end space-x-3">
          <button onClick={() => setSinistroToDelete(null)} className="bg-white py-2 px-4 border rounded-md">Cancelar</button>
          <button onClick={confirmDeleteSinistro} className="py-2 px-4 rounded-md text-white bg-red-600">Confirmar</button>
        </div>
      </Modal>
    </>
  );
};

export default MultasSinistros;