import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Veiculos from './components/Veiculos';
import Motoristas from './components/Motoristas';
import Planos from './components/Planos';
import Contratos from './components/Contratos';
import Manutencoes from './components/Manutencoes';
import Financeiro from './components/Financeiro';
import DRE from './components/Dre';
import MultasSinistros from './components/MultasSinistros';
import CommandPalette from './components/CommandPalette';
import Configuracoes from './components/Configuracoes';
import Login from './components/Login';
import Register from './components/Register';
import ControleAcessos from './components/ControleAcessos';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useDarkMode } from './hooks/useDarkMode';
import { useResource } from './hooks/useResource';
import { Page, Veiculo, Plano, Manutencao, Multa, Sinistro, Documento, Motorista, Contrato, Despesa, Receita, StatusPagamentoDespesa, StatusContrato, StatusPagamento } from './types';
import { Table, Header, Toast } from './components/ui';
import { AppSettings, defaultSettings } from './types/settings';
import * as db from './services/database';

// Simple placeholder pages defined within App.tsx to reduce file count
const DocumentosPage: React.FC<{ documentos: Documento[] }> = ({ documentos }) => (
  <>
    <Header title="Documentos" description="Organize os documentos digitais da frota, motoristas e contratos." />
    <Table<Documento>
      data={documentos}
      columns={[
        { header: 'Tipo', accessor: 'tipo' },
        { header: 'Referência', accessor: 'referencia' },
        { header: 'Vencimento', accessor: 'vencimento', isDate: true },
        { header: 'Status', accessor: 'status', isBadge: true },
      ]}
      statusFilter={{
        field: 'status',
        options: ['Válido', 'Vencido', 'Próximo Vencimento']
      }}
    />
  </>
);




const InnerApp: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Dark mode
  const [theme, toggleTheme] = useDarkMode();

  // Supabase Resources - These must be called unconditionally
  const { data: veiculos, add: addVeiculo, update: updateVeiculo, remove: removeVeiculo, setData: setVeiculos } = useResource<Veiculo>('veiculos');
  const { data: motoristas, add: addMotorista, update: updateMotorista, remove: removeMotorista, setData: setMotoristas } = useResource<Motorista>('motoristas');
  const { data: planos, add: addPlano, update: updatePlano, remove: removePlano, setData: setPlanos } = useResource<Plano>('planos');
  const { data: contratos, add: addContrato, update: updateContrato, remove: removeContrato, setData: setContratos, refresh: refreshContratos } = useResource<Contrato>('contratos', { selectQuery: '*, pagamentos(*)' });
  const { data: manutencoes, add: addManutencao, update: updateManutencao, remove: removeManutencao, setData: setManutencoes } = useResource<Manutencao>('manutencoes');
  const { data: multas, add: addMulta, update: updateMulta, remove: removeMulta, setData: setMultas } = useResource<Multa>('multas');
  const { data: sinistros, add: addSinistro, update: updateSinistro, remove: removeSinistro, setData: setSinistros } = useResource<Sinistro>('sinistros');
  const { data: despesas, add: addDespesa, update: updateDespesa, remove: removeDespesa, setData: setDespesas } = useResource<Despesa>('despesas');
  const { data: receitas, add: addReceita, update: updateReceita, remove: removeReceita, setData: setReceitas } = useResource<Receita>('receitas');
  const { data: documentos, add: addDocumento, update: updateDocumento, remove: removeDocumento, setData: setDocumentos } = useResource<Documento>('documentos');

  // Settings (Specific handling)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    db.getConfiguracoes().then(cfg => {
      if (cfg) setSettings(cfg as AppSettings);
    });
  }, []);

  // Undo state for vehicles
  const [lastDeletedVeiculo, setLastDeletedVeiculo] = useState<{ veiculo: Veiculo, index: number } | null>(null);
  const [veiculoToastVisible, setVeiculoToastVisible] = useState(false);

  // Undo state for drivers
  const [lastDeletedMotorista, setLastDeletedMotorista] = useState<{ motorista: Motorista, index: number } | null>(null);
  const [motoristaToastVisible, setMotoristaToastVisible] = useState(false);

  // Undo state for plans
  const [lastDeletedPlano, setLastDeletedPlano] = useState<{ plano: Plano, index: number } | null>(null);
  const [planoToastVisible, setPlanoToastVisible] = useState(false);

  // Undo state for contracts
  const [lastDeletedContrato, setLastDeletedContrato] = useState<{ contrato: Contrato, index: number } | null>(null);
  const [contratoToastVisible, setContratoToastVisible] = useState(false);

  // Undo state for maintenance
  const [lastDeletedManutencao, setLastDeletedManutencao] = useState<{ manutencao: Manutencao, index: number } | null>(null);
  const [manutencaoToastVisible, setManutencaoToastVisible] = useState(false);

  // Undo state for multas
  const [lastDeletedMulta, setLastDeletedMulta] = useState<{ multa: Multa, index: number } | null>(null);
  const [multaToastVisible, setMultaToastVisible] = useState(false);

  // Undo state for sinistros
  const [lastDeletedSinistro, setLastDeletedSinistro] = useState<{ sinistro: Sinistro, index: number } | null>(null);
  const [sinistroToastVisible, setSinistroToastVisible] = useState(false);

  // Undo state for despesas
  const [lastDeletedDespesa, setLastDeletedDespesa] = useState<{ despesa: Despesa, index: number } | null>(null);
  const [despesaToastVisible, setDespesaToastVisible] = useState(false);

  // Undo state for receitas
  const [lastDeletedReceita, setLastDeletedReceita] = useState<{ receita: Receita, index: number } | null>(null);
  const [receitaToastVisible, setReceitaToastVisible] = useState(false);

  // Command Palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- CONDITIONAL RENDERING (Must be after all hooks) ---



  // --- Vehicle Handlers ---
  // --- Vehicle Handlers ---
  const handleAddVeiculo = async (veiculo: Omit<Veiculo, 'id' | 'codigo'>) => {
    try {
      // Supabase handles ID generation. We generate the code locally or in backend trigger?
      // For now, let's auto-generate code based on length + 1 as before, but safer to do it in backend.
      // We'll keep the frontend logic for code for now but ignore 'id'.
      const nextCode = `V${String(veiculos.length + 1).padStart(3, '0')}`;
      await addVeiculo({ ...veiculo, codigo: nextCode });
    } catch (e) {
      console.error(e);
      alert(`Erro ao adicionar veículo: ${(e as Error).message}`);
    }
  };

  const handleUpdateVeiculo = async (updatedVeiculo: Veiculo) => {
    await updateVeiculo(updatedVeiculo);
  };

  const handleDeleteVeiculo = async (id: number) => {
    const originalIndex = veiculos.findIndex(v => v.id === id);
    const deletedVeiculo = veiculos[originalIndex];

    await removeVeiculo(id);

    if (deletedVeiculo) {
      setLastDeletedVeiculo({ veiculo: deletedVeiculo, index: originalIndex });
      setVeiculoToastVisible(true);
      setTimeout(() => setVeiculoToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteVeiculo = async () => {
    if (lastDeletedVeiculo) {
      await addVeiculo(lastDeletedVeiculo.veiculo); // Re-add to DB
      setLastDeletedVeiculo(null);
      setVeiculoToastVisible(false);
    }
  };

  // --- Motorista Handlers ---
  // --- Motorista Handlers ---
  const handleAddMotorista = async (motorista: Omit<Motorista, 'id'>) => {
    await addMotorista(motorista);
  };

  const handleUpdateMotorista = async (updatedMotorista: Motorista) => {
    await updateMotorista(updatedMotorista);
  };

  const handleDeleteMotorista = async (id: number) => {
    const deleted = motoristas.find(m => m.id === id);
    if (deleted) {
      await removeMotorista(id);
      setLastDeletedMotorista({ motorista: deleted, index: 0 }); // Index approximate
      setMotoristaToastVisible(true);
      setTimeout(() => setMotoristaToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteMotorista = async () => {
    if (lastDeletedMotorista) {
      await addMotorista(lastDeletedMotorista.motorista);
      setLastDeletedMotorista(null);
      setMotoristaToastVisible(false);
    }
  };

  // --- Plano Handlers ---
  const handleAddPlano = async (plano: Omit<Plano, 'id'>) => {
    await addPlano(plano);
  };

  const handleUpdatePlano = async (updatedPlano: Plano) => {
    await updatePlano(updatedPlano);
  };

  const handleDeletePlano = async (id: number) => {
    const deleted = planos.find(p => p.id === id);
    if (deleted) {
      await removePlano(id);
      setLastDeletedPlano({ plano: deleted, index: 0 });
      setPlanoToastVisible(true);
      setTimeout(() => setPlanoToastVisible(false), 5000);
    }
  };

  const handleUndoDeletePlano = async () => {
    if (lastDeletedPlano) {
      await addPlano(lastDeletedPlano.plano);
      setLastDeletedPlano(null);
      setPlanoToastVisible(false);
    }
  };

  const handleAddContrato = async (contrato: Omit<Contrato, 'id' | 'pagamentos'>) => {
    try {
      const newContrato = await addContrato({ ...contrato });

      // Generate pagamentos based on plano
      const plano = planos.find(p => p.nome === contrato.plano_nome);
      if (plano && newContrato) {
        const inicio = new Date(contrato.data_inicio + 'T12:00:00');
        const fim = new Date(contrato.data_fim + 'T12:00:00');
        const diffMs = fim.getTime() - inicio.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        let numPagamentos = 1;
        let intervalDays = 7;
        if (plano.tipo_cobranca === 'Semanal') {
          numPagamentos = Math.max(1, Math.ceil(diffDays / 7));
          intervalDays = 7;
        } else if (plano.tipo_cobranca === 'Mensal') {
          numPagamentos = Math.max(1, Math.ceil(diffDays / 30));
          intervalDays = 30;
        } else {
          numPagamentos = Math.max(1, Math.ceil(diffDays));
          intervalDays = 1;
        }

        for (let i = 0; i < numPagamentos; i++) {
          const vencimento = new Date(inicio);
          vencimento.setDate(vencimento.getDate() + (i * intervalDays));
          await db.create('pagamentos', {
            contrato_id: newContrato.id,
            valor: plano.valor_base,
            vencimento: vencimento.toISOString().split('T')[0],
            status: 'Em aberto'
          });
        }
      }

      // Update vehicle status
      const veiculo = veiculos.find(v => v.id === contrato.veiculo_id);
      if (veiculo) {
        await updateVeiculo({ ...veiculo, status: 'Locado', motorista_atual: contrato.motorista_nome });
      }

      // Recarrega os contratos do banco para puxar os pagamentos recém-criados
      await refreshContratos();
    } catch (e) {
      console.error(e);
      alert(`Erro ao adicionar contrato: ${(e as Error).message}`);
    }
  };

  const handleUpdateContrato = async (updatedContrato: Contrato) => {
    await updateContrato(updatedContrato);
  };

  const handleDeleteContrato = async (id: number) => {
    const deleted = contratos.find(c => c.id === id);
    if (deleted) {
      await removeContrato(id);

      if (deleted.status !== 'Encerrado') {
        const veiculo = veiculos.find(v => v.id === deleted.veiculo_id);
        if (veiculo) {
          await updateVeiculo({ ...veiculo, status: 'Disponível', motorista_atual: '' });
        }
      }

      setLastDeletedContrato({ contrato: deleted, index: 0 });
      setContratoToastVisible(true);
      setTimeout(() => setContratoToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteContrato = async () => {
    if (lastDeletedContrato) {
      await addContrato(lastDeletedContrato.contrato);
      // Restore vehicle status logic... omitted for brevity/complexity in restore
      setLastDeletedContrato(null);
      setContratoToastVisible(false);
    }
  };

  // --- Manutencao Handlers ---
  const handleAddManutencao = async (manutencao: Omit<Manutencao, 'id'>) => {
    await addManutencao({ ...manutencao, status: 'Em aberto', documentos_anexados: [] });
  };

  const handleUpdateManutencao = async (updatedManutencao: Manutencao) => {
    await updateManutencao(updatedManutencao);
  };

  const handleDeleteManutencao = async (id: number) => {
    const deleted = manutencoes.find(m => m.id === id);
    if (deleted) {
      await removeManutencao(id);
      setLastDeletedManutencao({ manutencao: deleted, index: 0 });
      setManutencaoToastVisible(true);
      setTimeout(() => setManutencaoToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteManutencao = async () => {
    if (lastDeletedManutencao) {
      await addManutencao(lastDeletedManutencao.manutencao);
      setLastDeletedManutencao(null);
      setManutencaoToastVisible(false);
    }
  };

  // Auxiliary updates (Status updates) - These modify the object and call update
  const handleUpdateManutencaoStatus = async (manutencaoId: number, status: StatusPagamentoDespesa) => {
    const m = manutencoes.find(x => x.id === manutencaoId);
    if (m) await updateManutencao({ ...m, status });
  };

  // --- Multa Handlers ---
  // --- Multa Handlers ---
  const handleAddMulta = async (multa: Omit<Multa, 'id'>) => {
    await addMulta(multa);
  };

  const handleDeleteMulta = async (id: number) => {
    const deleted = multas.find(m => m.id === id);
    if (deleted) {
      await removeMulta(id);
      setLastDeletedMulta({ multa: deleted, index: 0 });
      setMultaToastVisible(true);
      setTimeout(() => setMultaToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteMulta = async () => {
    if (lastDeletedMulta) {
      await addMulta(lastDeletedMulta.multa);
      setLastDeletedMulta(null);
      setMultaToastVisible(false);
    }
  };

  const handleUpdateMultaStatus = async (multaId: number, status: Multa['status']) => {
    const m = multas.find(x => x.id === multaId);
    if (m) await updateMulta({ ...m, status });
  };

  // --- Sinistro Handlers ---
  const handleAddSinistro = async (sinistro: Omit<Sinistro, 'id'>) => {
    await addSinistro(sinistro);
  };

  const handleDeleteSinistro = async (id: number) => {
    const deleted = sinistros.find(s => s.id === id);
    if (deleted) {
      await removeSinistro(id);
      setLastDeletedSinistro({ sinistro: deleted, index: 0 });
      setSinistroToastVisible(true);
      setTimeout(() => setSinistroToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteSinistro = async () => {
    if (lastDeletedSinistro) {
      await addSinistro(lastDeletedSinistro.sinistro);
      setLastDeletedSinistro(null);
      setSinistroToastVisible(false);
    }
  };

  const handleUpdateSinistroStatus = async (sinistroId: number, status: Sinistro['status']) => {
    const s = sinistros.find(x => x.id === sinistroId);
    if (s) await updateSinistro({ ...s, status });
  };

  // --- Despesa Handlers ---
  const handleAddDespesa = async (despesa: Omit<Despesa, 'id'>, parcelas: number = 1, frequencia: 'mensal' | 'semanal' = 'mensal') => {
    if (parcelas > 1) {
      const installmentValue = despesa.valor / parcelas;
      const parcelamento_id = `p-desp-${Date.now()}`;
      for (let i = 0; i < parcelas; i++) {
        const date = new Date(despesa.data + 'T12:00:00'); // Add time to avoid TZ issues
        if (frequencia === 'mensal') {
          date.setMonth(date.getMonth() + i);
        } else {
          date.setDate(date.getDate() + (i * 7));
        }
        await addDespesa({
          ...despesa,
          valor: installmentValue,
          data: date.toISOString().split('T')[0],
          status: 'Em aberto' as StatusPagamentoDespesa,
          parcelamento_id,
          tipo: `${despesa.tipo} (${i + 1}/${parcelas})`,
          veiculo_id: despesa.veiculo_id
        });
      }
    } else {
      await addDespesa({ ...despesa, status: 'Em aberto' as StatusPagamentoDespesa });
    }
  };

  const handleDeleteDespesa = async (id: number) => {
    const deleted = despesas.find(d => d.id === id);
    if (deleted) {
      await removeDespesa(id);
      setLastDeletedDespesa({ despesa: deleted, index: 0 });
      setDespesaToastVisible(true);
      setTimeout(() => setDespesaToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteDespesa = async () => {
    if (lastDeletedDespesa) {
      await addDespesa(lastDeletedDespesa.despesa);
      setLastDeletedDespesa(null);
      setDespesaToastVisible(false);
    }
  };

  const handleUpdateDespesaStatus = async (despesaId: number, status: StatusPagamentoDespesa) => {
    const d = despesas.find(x => x.id === despesaId);
    if (d) await updateDespesa({ ...d, status });
  };

  // --- Receita Handlers ---
  const handleAddReceita = async (receita: Omit<Receita, 'id'>, parcelas: number = 1, frequencia: 'mensal' | 'semanal' = 'mensal') => {
    if (parcelas > 1) {
      const installmentValue = receita.valor / parcelas;
      const parcelamento_id = `p-rec-${Date.now()}`;
      for (let i = 0; i < parcelas; i++) {
        const date = new Date(receita.data + 'T12:00:00');
        if (frequencia === 'mensal') {
          date.setMonth(date.getMonth() + i);
        } else {
          date.setDate(date.getDate() + (i * 7));
        }
        await addReceita({
          ...receita,
          valor: installmentValue,
          data: date.toISOString().split('T')[0],
          status: 'Em aberto' as StatusPagamento,
          parcelamento_id,
          tipo: `${receita.tipo} (${i + 1}/${parcelas})`,
          veiculo_id: receita.veiculo_id
        });
      }
    } else {
      await addReceita({ ...receita, status: 'Em aberto' as StatusPagamento });
    }
  };

  const handleDeleteReceita = async (id: number) => {
    const deleted = receitas.find(r => r.id === id);
    if (deleted) {
      await removeReceita(id);
      setLastDeletedReceita({ receita: deleted, index: 0 });
      setReceitaToastVisible(true);
      setTimeout(() => setReceitaToastVisible(false), 5000);
    }
  };

  const handleUndoDeleteReceita = async () => {
    if (lastDeletedReceita) {
      await addReceita(lastDeletedReceita.receita);
      setLastDeletedReceita(null);
      setReceitaToastVisible(false);
    }
  };

  const handleUpdateReceitaStatus = async (receitaId: number, status: StatusPagamento) => {
    const r = receitas.find(x => x.id === receitaId);
    if (r) await updateReceita({ ...r, status });
  };

  const handleUpdateReceitaValue = async (receitaId: number, valor: number) => {
    const r = receitas.find(x => x.id === receitaId);
    if (r) await updateReceita({ ...r, valor });
  };

  const handleUpdatePagamentoStatus = async (contratoId: number, pagamentoId: number, status: StatusPagamento) => {
    // This is hierarchical (pagamento inside contrato or separate table?)
    // services/database has 'getPagamentosByContrato' but types.ts has pagamentos[] inside Contrato.
    // However schema has 'pagamentos' table.
    // We need to update the 'pagamentos' table directly if possible, or update the contract json?
    // Since database.ts uses generic update, if 'pagamentos' is a TABLE, we should use 'update<Pagamento>'.
    // But App.tsx doesn't have useResource('pagamentos')?
    // Wait, 'Contratos' in types.ts HAS 'pagamentos'.
    // If we are strictly relational, 'contratos' fetch should JOIN pagamentos.
    // Our services/database.getContratosCompletos does join.
    // The update logic in App.tsx was in-memory.
    // For Supabase, we should update the 'pagamentos' table row.

    const { update: updatePagamentoTable } = await import('./services/database');
    // Oops, can't import inside function easily without async mess or top level import.
    // But we can use db.update directly.

    try {
      await db.update('pagamentos', pagamentoId, { status, data_pagamento: status === 'Pago' ? new Date().toISOString() : null });
      // Then refresh contracts? useResource exposes refresh?
      // We called 'updateContrato' which updates local state.
      // But here we update a sub-resource.
      // We should ideally reload contracts or update local state manually.

      const contrato = contratos.find(c => c.id === contratoId);
      if (contrato) {
        const updatedPagamentos = contrato.pagamentos.map(p => p.id === pagamentoId ? { ...p, status } : p);
        // Optimistic update
        setContratos(prev => prev.map(c => c.id === contratoId ? { ...c, pagamentos: updatedPagamentos } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePagamentoValue = async (contratoId: number, pagamentoId: number, valor: number) => {
    try {
      await db.update('pagamentos', pagamentoId, { valor });
      
      const contrato = contratos.find(c => c.id === contratoId);
      if (contrato) {
        const updatedPagamentos = contrato.pagamentos.map(p => p.id === pagamentoId ? { ...p, valor } : p);
        // Optimistic update
        setContratos(prev => prev.map(c => c.id === contratoId ? { ...c, pagamentos: updatedPagamentos } : c));
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar valor da parcela.');
    }
  };

  const handleDeletePagamento = async (contratoId: number, pagamentoId: number) => {
    try {
      await db.remove('pagamentos', pagamentoId);
      
      const contrato = contratos.find(c => c.id === contratoId);
      if (contrato) {
        const updatedPagamentos = contrato.pagamentos.filter(p => p.id !== pagamentoId);
        // Optimistic update
        setContratos(prev => prev.map(c => c.id === contratoId ? { ...c, pagamentos: updatedPagamentos } : c));
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir parcela do contrato.');
    }
  };


  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard veiculos={veiculos} contratos={contratos} documentos={documentos} despesas={despesas} manutencoes={manutencoes} receitas={receitas} multas={multas} />;
      case 'veiculos': return <Veiculos
        veiculos={veiculos}
        contratos={contratos}
        manutencoes={manutencoes}
        multas={multas}
        despesas={despesas}
        sinistros={sinistros}
        onAddVeiculo={handleAddVeiculo}
        onDeleteVeiculo={handleDeleteVeiculo}
        onUpdateVeiculo={handleUpdateVeiculo}
      />;
      case 'motoristas': return <Motoristas motoristas={motoristas} onAddMotorista={handleAddMotorista} onDeleteMotorista={handleDeleteMotorista} onUpdateMotorista={handleUpdateMotorista} />;
      case 'planos': return <Planos planos={planos} onAddPlano={handleAddPlano} onDeletePlano={handleDeletePlano} onUpdatePlano={handleUpdatePlano} />;
      case 'contratos': return <Contratos contratos={contratos} veiculos={veiculos} motoristas={motoristas} planos={planos} onAddContrato={handleAddContrato} onUpdateContrato={handleUpdateContrato} onDeleteContrato={handleDeleteContrato} onAnexarDocumento={(contratoId, fileName) => {
            const contrato = contratos.find(c => c.id === contratoId);
            if (contrato) updateContrato({ ...contrato, documento_anexado: fileName });
          }} onUpdateContratoStatus={(contratoId, status) => {
            const contrato = contratos.find(c => c.id === contratoId);
            if (contrato) updateContrato({ ...contrato, status });
          }} />;
      case 'manutencoes': return <Manutencoes manutencoes={manutencoes} veiculos={veiculos} onAddManutencao={handleAddManutencao} onDeleteManutencao={handleDeleteManutencao} onUpdateManutencao={handleUpdateManutencao} />;
      case 'financeiro': return <Financeiro
        contratos={contratos}
        despesasManuais={despesas}
        receitasManuais={receitas}
        manutencoes={manutencoes}
        veiculos={veiculos}
        onAddDespesa={handleAddDespesa}
        onDeleteDespesa={handleDeleteDespesa}
        onUpdateDespesaStatus={handleUpdateDespesaStatus}
        onAddReceita={handleAddReceita}
        onDeleteReceita={handleDeleteReceita}
        onUpdateReceitaStatus={handleUpdateReceitaStatus}
        onUpdateReceitaValue={handleUpdateReceitaValue}
        onUpdateManutencaoStatus={handleUpdateManutencaoStatus}
        onUpdatePagamentoStatus={handleUpdatePagamentoStatus}
        onUpdatePagamentoValue={handleUpdatePagamentoValue}
        onDeletePagamento={handleDeletePagamento}
      />;
      case 'dre': return <DRE contratos={contratos} despesas={despesas} manutencoes={manutencoes} multas={multas} receitasManuais={receitas} veiculos={veiculos} />;
      case 'multas':
      case 'sinistros':
        return <MultasSinistros
          activeTab={currentPage === 'multas' ? 'multas' : 'sinistros'}
          multas={multas}
          sinistros={sinistros}
          veiculos={veiculos}
          motoristas={motoristas}
          onAddMulta={handleAddMulta}
          onUpdateMultaStatus={handleUpdateMultaStatus}
          onDeleteMulta={handleDeleteMulta}
          onAddSinistro={handleAddSinistro}
          onUpdateSinistroStatus={handleUpdateSinistroStatus}
          onDeleteSinistro={handleDeleteSinistro}
        />;
      case 'documentos': return <DocumentosPage documentos={documentos} />;
      case 'configuracoes': return <Configuracoes
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onExportData={() => {
          const allData = {
            veiculos,
            motoristas,
            planos,
            contratos,
            pagamentos: contratos.flatMap(c => c.pagamentos),
            manutencoes,
            multas,
            sinistros,
            despesas,
            documentos
          };
          const dataStr = JSON.stringify(allData, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `frotafacil_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
        onClearData={() => {
          if (confirm('Tem certeza? Todos os dados locais serão apagados.')) {
            setVeiculos([]);
            setMotoristas([]);
            setPlanos([]);
            setContratos([]);
            setManutencoes([]);
            setMultas([]);
            setSinistros([]);
            setDespesas([]);
            setDocumentos([]);
            alert('Dados limpos com sucesso!');
          }
        }}
      />;
      case 'acessos': return <ControleAcessos />;
      default: return <Dashboard veiculos={veiculos} contratos={contratos} documentos={documentos} despesas={despesas} manutencoes={manutencoes} />;
    }
  };

  return (
    <div className={theme}>
      <div className="flex bg-slate-100 dark:bg-slate-900 min-h-screen transition-colors duration-200">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isDark={theme === 'dark'}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0">
          {/* Mobile Header */}
          <header className="bg-white dark:bg-slate-800 shadow-sm z-10 lg:hidden user-select-none">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 -ml-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-petrol-blue-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="font-bold text-lg text-slate-800 dark:text-white">FrotaFácil</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 scroll-smooth user-select-text">
            {renderContent()}
          </main>
        </div>

        {/* Global Components */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          setIsOpen={setCommandPaletteOpen}
          pages={[
            { id: 'dashboard', title: 'Dashboard', icon: 'ChartBarIcon' },
            { id: 'veiculos', title: 'Veículos', icon: 'TruckIcon' },
            { id: 'motoristas', title: 'Motoristas', icon: 'UserGroupIcon' },
            { id: 'planos', title: 'Planos', icon: 'ClipboardListIcon' },
            { id: 'contratos', title: 'Contratos', icon: 'DocumentTextIcon' },
            { id: 'manutencoes', title: 'Manutenções', icon: 'WrenchScrewdriverIcon' },
            { id: 'financeiro', title: 'Financeiro', icon: 'CurrencyDollarIcon' },
            { id: 'multas', title: 'Multas', icon: 'ExclamationTriangleIcon' },
            { id: 'sinistros', title: 'Sinistros', icon: 'ShieldExclamationIcon' },
            { id: 'documentos', title: 'Documentos', icon: 'FolderIcon' },
            { id: 'configuracoes', title: 'Configurações', icon: 'Cog6ToothIcon' },
          ]}
          onNavigate={(pageId) => {
            setCurrentPage(pageId as Page);
          }}
        />

        {veiculoToastVisible && lastDeletedVeiculo && (
          <Toast
            message={`Veículo ${lastDeletedVeiculo.veiculo.placa} excluído.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteVeiculo()
            }}
            onClose={() => setVeiculoToastVisible(false)}
          />
        )}

        {motoristaToastVisible && lastDeletedMotorista && (
          <Toast
            message={`Motorista ${lastDeletedMotorista.motorista.nome} excluído.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteMotorista()
            }}
            onClose={() => setMotoristaToastVisible(false)}
          />
        )}

        {planoToastVisible && lastDeletedPlano && (
          <Toast
            message={`Plano ${lastDeletedPlano.plano.nome} excluído.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeletePlano()
            }}
            onClose={() => setPlanoToastVisible(false)}
          />
        )}

        {contratoToastVisible && lastDeletedContrato && (
          <Toast
            message={`Contrato #${lastDeletedContrato.contrato.id} excluído.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteContrato()
            }}
            onClose={() => setContratoToastVisible(false)}
          />
        )}

        {manutencaoToastVisible && lastDeletedManutencao && (
          <Toast
            message={`Manutenção para ${lastDeletedManutencao.manutencao.veiculo_placa} excluída.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteManutencao()
            }}
            onClose={() => setManutencaoToastVisible(false)}
          />
        )}

        {multaToastVisible && lastDeletedMulta && (
          <Toast
            message={`Multa para ${lastDeletedMulta.multa.veiculoPlaca} excluída.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteMulta()
            }}
            onClose={() => setMultaToastVisible(false)}
          />
        )}

        {sinistroToastVisible && lastDeletedSinistro && (
          <Toast
            message={`Sinistro para ${lastDeletedSinistro.sinistro.veiculoPlaca} excluído.`}
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteSinistro()
            }}
            onClose={() => setSinistroToastVisible(false)}
          />
        )}

        {despesaToastVisible && lastDeletedDespesa && (
          <Toast
            message="Despesa foi excluída."
            type="success"
            action={{
              label: 'Desfazer',
              onClick: () => handleUndoDeleteDespesa()
            }}
            onClose={() => setDespesaToastVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading, isConfigured } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-petrol-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && isConfigured) {
    if (showRegister) {
      return <Register onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return <InnerApp />;
};

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};
