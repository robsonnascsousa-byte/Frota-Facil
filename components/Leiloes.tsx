import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header, Badge, Modal } from './ui';
import FipeLookup from './FipeLookup';
import { useAuth } from '../contexts/AuthContext';
import type { Despesa, Veiculo } from '../types';
import type { AuctionAnalysis, AuctionLot, MarketSearch } from '../types/auction';
import * as auction from '../services/auction';
import { analysisRepairCost, safeHttpUrl, simulateAuction } from '../utils/auction';
import { formatCurrency, formatDate } from '../utils/formatters';
import { MAX_MEDIA_BYTES } from '../supabase/functions/auction-ai/validation';
import './Leiloes.css';

interface Props {
  veiculos: Veiculo[];
  despesas: Despesa[];
  onAcquired: (veiculo: Veiculo) => void;
  onUpdateVeiculo: (veiculo: Veiculo) => Promise<void>;
  onAddDespesa: (despesa: Omit<Despesa, 'id'>) => Promise<void>;
  onNavigate: (page: 'veiculos' | 'financeiro' | 'manutencoes') => void;
}
type Media = { name: string; data: string; mimeType: string };
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const initialForm = () => ({ marca: '', modelo: '', ano: new Date().getFullYear(), fipe: 0, lance: 0, comissao: 5,
  taxas: 0, extras: 0, reparos: 0, revenda: 0, roi: 20, data: '', leiloeiro: '', lote: '', link: '', notas: '' });
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="auction-field"><span>{label}</span>{children}</label>;
const Metric = ({ label, value, negative }: { label: string; value: string; negative?: boolean }) => <div className="auction-metric"><span>{label}</span><strong className={negative ? 'auction-negative' : ''}>{value}</strong></div>;

export default function Leiloes({ veiculos, despesas, onAcquired, onUpdateVeiculo, onAddDespesa, onNavigate }: Props) {
  const { role } = useAuth();
  const allowed = role === 'admin' || role === 'gerente';
  const [tab, setTab] = useState<'simulator' | 'watchlist' | 'portfolio'>('simulator');
  const [form, setForm] = useState(initialForm);
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [analysis, setAnalysis] = useState<AuctionAnalysis | null>(null);
  const [showFipe, setShowFipe] = useState(false);
  const [market, setMarket] = useState<MarketSearch | null>(null);
  const [filter, setFilter] = useState('monitorando');
  const [portfolioFilter, setPortfolioFilter] = useState('todos');
  const [purchase, setPurchase] = useState<AuctionLot | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({ placa: '', data_compra: today(), lance: 0 });
  const [sale, setSale] = useState<Veiculo | null>(null);
  const [saleValue, setSaleValue] = useState(0);
  const [costVehicle, setCostVehicle] = useState<Veiculo | null>(null);
  const [costForm, setCostForm] = useState({ tipo: 'Manutenção', descricao: '', valor: 0, data: today() });

  const refresh = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try { setLots(await auction.getAuctionLots()); setLoadError(''); }
    catch (e) { setLoadError((e as Error).message); }
    finally { setLoading(false); }
  }, [allowed]);
  useEffect(() => { void refresh(); }, [refresh]);
  const simulation = useMemo(() => simulateAuction({ bid: form.lance, commissionPercent: form.comissao,
    fees: form.taxas, extraCosts: form.extras, repairs: form.reparos, resale: form.revenda, targetRoi: form.roi }), [form]);
  const portfolio = useMemo(() => lots.filter(lot => lot.veiculo_id).map(lot => ({ lot,
    vehicle: veiculos.find(v => v.id === lot.veiculo_id) })).filter(row => row.vehicle), [lots, veiculos]);
  const sold = portfolio.filter(row => row.vehicle!.status === 'Vendido');
  const expenseTotal = (v: Veiculo) => despesas.filter(d => d.veiculo_id === v.id || (!d.veiculo_id && d.veiculo_placa === v.placa)).reduce((sum, d) => sum + d.valor, 0);
  const resultTotal = sold.reduce((sum, row) => sum + (row.vehicle!.valor_venda || 0) - row.vehicle!.valor_compra - expenseTotal(row.vehicle!), 0);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (e) { setError((e as Error).message || 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  function numberField(key: 'ano' | 'fipe' | 'lance' | 'comissao' | 'taxas' | 'extras' | 'reparos' | 'revenda' | 'roi', label: string) {
    const max = key === 'comissao' ? 100 : key === 'roi' ? 1000 : key === 'ano' ? 2100 : 100000000;
    return <Field label={label}><input type="number" min={key === 'ano' ? 1900 : 0} max={max} step={key === 'ano' ? 1 : '0.01'} value={form[key] || ''}
      onChange={e => setForm(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, Number(e.target.value) || 0)) }))} /></Field>;
  }
  async function readFiles(files: File[]) {
    if (!files.length) return;
    await run(async () => {
      if (files.length > 6 || files.reduce((sum, f) => sum + f.size, 0) > MAX_MEDIA_BYTES) throw new Error('Envie até 6 mídias, somando no máximo 12 MB.');
      if (files.some(f => !['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(f.type))) throw new Error('Use JPG, PNG, WebP, MP4 ou WebM.');
      const next = await Promise.all(files.map(file => new Promise<Media>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        reader.onload = () => resolve({ name: file.name, mimeType: file.type, data: String(reader.result).split(',')[1] });
        reader.readAsDataURL(file);
      })));
      setMedia(next); setAnalysis(null); setMarket(null);
    });
  }
  async function saveLot(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (!form.marca.trim() || !form.modelo.trim() || !Number.isInteger(form.ano) || form.ano < 1900) throw new Error('Preencha marca, modelo e ano válidos.');
      if (form.link && !safeHttpUrl(form.link)) throw new Error('Informe um link HTTP ou HTTPS válido.');
      const lot = await auction.saveAuctionLot({ marca: form.marca.trim(), modelo: form.modelo.trim(), ano: form.ano,
        valor_fipe: form.fipe, lance: form.lance, comissao_percentual: form.comissao, taxas: form.taxas, custos_extras: form.extras,
        reparos_estimados: form.reparos, revenda_estimada: form.revenda, data_leilao: form.data || null,
        leiloeiro: form.leiloeiro, numero_lote: form.lote, link: form.link, notas: form.notas, status: 'monitorando', analise: analysis });
      setLots(prev => [lot, ...prev]); setMessage('Lote salvo no acompanhamento.'); setTab('watchlist');
      setForm(initialForm()); setAnalysis(null); setMedia([]); setMarket(null);
    });
  }
  async function searchMarket(partName?: string) {
    await run(async () => { setMarket(null); setMarket(await auction.searchAuctionMarket(`${form.marca} ${form.modelo} ${form.ano}`.trim(), partName)); });
  }
  if (!allowed) return <><Header title="Leilões e revenda" description="Avaliação, aquisição e acompanhamento dos veículos de leilão." /><p className="auction-panel">Este módulo está disponível para administradores e gerentes.</p></>;

  return <section className="auction-module">
    <Header title="Leilões e revenda" description="Do primeiro lance à revenda, com os veículos e o financeiro da sua frota." />
    <div className="auction-tabs" role="tablist" aria-label="Leilões e revenda">
      {([['simulator', 'Avaliar e simular'], ['watchlist', 'Lotes acompanhados'], ['portfolio', 'Arrematados e revenda']] as const).map(([id, label]) =>
        <button type="button" key={id} role="tab" id={`auction-tab-${id}`} aria-controls="auction-content" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1}
          onKeyDown={e => {
            const tabs = ['simulator', 'watchlist', 'portfolio'] as const;
            const index = tabs.indexOf(id);
            const next = e.key === 'ArrowRight' ? tabs[(index + 1) % 3] : e.key === 'ArrowLeft' ? tabs[(index + 2) % 3] : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[2] : null;
            if (next) { e.preventDefault(); setTab(next); setError(''); setMessage(''); document.getElementById(`auction-tab-${next}`)?.focus(); }
          }} onClick={() => { setTab(id); setError(''); setMessage(''); }}>{label}</button>)}
    </div>
    {error && <p role="alert" className="auction-alert">{error}</p>}
    {message && <p role="status" className="auction-message">{message}</p>}
    {loadError && <div role="alert" className="auction-alert">{loadError} <button type="button" onClick={refresh}>Tentar novamente</button></div>}
    <div id="auction-content" role="tabpanel" aria-labelledby={`auction-tab-${tab}`}>
    {tab === 'simulator' && <div className="auction-layout">
      <div>
        <div className="auction-panel">
          <div className="auction-heading"><h2>Avaliação por imagens e vídeos</h2><span>GEMINI AI</span></div>
          <p className="auction-muted">Envie fotos do lote ou grave um vídeo. Até 6 arquivos, total de 12 MB.</p>
          <div className="auction-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) void readFiles(Array.from(e.dataTransfer.files)); }}>
            <label>Selecionar fotos ou vídeos<input disabled={busy} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e => { void readFiles(Array.from(e.target.files || [])); e.target.value = ''; }} /></label>
            <label className="auction-camera">Usar câmera<input disabled={busy} type="file" accept="image/*" capture="environment" onChange={e => { void readFiles(Array.from(e.target.files || [])); e.target.value = ''; }} /></label>
          </div>
          {media.length > 0 && <div className="auction-media">{media.map((file, i) => <div key={`${file.name}-${i}`}>
            {file.mimeType.startsWith('image/') ? <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.name} /> : <video controls src={`data:${file.mimeType};base64,${file.data}`} />}
            <span>{file.name}</span><button type="button" disabled={busy} aria-label={`Remover ${file.name}`} onClick={() => { setMedia(prev => prev.filter((_, n) => n !== i)); setAnalysis(null); setMarket(null); }}>Remover</button>
          </div>)}</div>}
          <button className="auction-primary" type="button" disabled={busy || !media.length} onClick={() => void run(async () => {
            setAnalysis(null); setMarket(null);
            const result = await auction.analyzeAuctionMedia(media.map(({ data, mimeType }) => ({ data, mimeType })), `${form.marca} ${form.modelo} ${form.ano}`);
            setAnalysis(result); setForm(prev => ({ ...prev, marca: result.brand, modelo: result.model, fipe: result.marketValueFipe,
              lance: result.recommendedBid, reparos: analysisRepairCost(result), revenda: Math.round(result.marketValueFipe * 0.8) }));
            setMessage('Estimativas carregadas. Revise a FIPE, os custos e o preço de revenda.');
          })}>{busy ? 'Processando…' : 'Analisar mídias com IA'}</button>
        </div>
        <form onSubmit={saveLot} className="auction-panel">
          <div className="auction-heading"><h2>Simulação do lote</h2><button type="button" onClick={() => setShowFipe(v => !v)}>Consultar FIPE</button></div>
          {showFipe && <FipeLookup onDadosSelecionados={(marca, modelo, ano) => setForm(prev => ({ ...prev, marca, modelo, ano }))}
            onValorEncontrado={fipe => setForm(prev => ({ ...prev, fipe, revenda: Math.round(fipe * 0.8) }))} />}
          <div className="auction-fields">
            <Field label="Marca"><input required maxLength={200} value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} /></Field>
            <Field label="Modelo e versão"><input required maxLength={300} value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} /></Field>
            {numberField('ano', 'Ano do modelo')}{numberField('fipe', 'Valor FIPE (R$)')}
            {numberField('lance', 'Lance planejado (R$)')}{numberField('comissao', 'Comissão do leiloeiro (%)')}
            {numberField('taxas', 'Taxas do leilão (R$)')}{numberField('extras', 'Transporte e documentos (R$)')}
            {numberField('reparos', 'Peças e mão de obra estimadas (R$)')}{numberField('revenda', 'Revenda esperada (R$)')}
            {numberField('roi', 'Retorno desejado sobre investimento (%)')}
            <Field label="Data do leilão"><input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
            <Field label="Leiloeiro"><input maxLength={200} value={form.leiloeiro} onChange={e => setForm({ ...form, leiloeiro: e.target.value })} /></Field>
            <Field label="Número do lote"><input maxLength={100} value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} /></Field>
            <Field label="Link do lote"><input type="url" maxLength={2000} value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} /></Field>
            <Field label="Observações"><textarea maxLength={10000} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></Field>
          </div>
          <div className="auction-actions"><button className="auction-primary" disabled={busy || !!loadError || loading}>Salvar lote acompanhado</button>
            <button type="button" disabled={busy || !form.modelo.trim()} onClick={() => void searchMarket()}>Pesquisar mercado</button></div>
        </form>
      </div>
      <aside>
        <div className="auction-panel auction-summary"><p className="auction-eyebrow">VIABILIDADE DA COMPRA</p><h2>Antes de dar o lance</h2>
          <Metric label="Custo de aquisição" value={formatCurrency(simulation.acquisition)} />
          <Metric label="Comissão incluída" value={formatCurrency(simulation.commission)} />
          <Metric label="Investimento com recuperação" value={formatCurrency(simulation.investment)} />
          <Metric label="Resultado estimado de revenda" value={formatCurrency(simulation.profit)} negative={simulation.profit < 0} />
          <Metric label="ROI estimado" value={simulation.roi === null ? '—' : `${simulation.roi.toFixed(1)}%`} negative={(simulation.roi || 0) < 0} />
          <div className="auction-bid"><span>Lance máximo para o retorno desejado</span><strong>{formatCurrency(simulation.maxBid)}</strong></div>
          <p className="auction-muted">Inclui comissão, taxas, transporte e recuperação. O preço de revenda pode ser ajustado; a sugestão ao consultar a FIPE considera desconto de 20%.</p>
        </div>
        {analysis && <div className="auction-panel"><h2>Danos e recuperação estimados</h2><p className="auction-muted">{analysis.detectedDamageDescription}</p>
          {analysis.damagedParts.map((part, i) => <div className="auction-part" key={i}><strong>{part.partName}</strong><span>{part.repairOrReplace === 'repair' ? 'Recuperar' : 'Substituir'} · {formatCurrency(part.estimatedPriceRange[0])} a {formatCurrency(part.estimatedPriceRange[1])}</span>
            <button type="button" disabled={busy} onClick={() => void searchMarket(part.partName)}>Pesquisar peça</button></div>)}
          <p className="auction-muted">Mão de obra: {formatCurrency((Object.values(analysis.laborEstimate) as number[]).reduce((sum, value) => sum + value, 0))}</p>
          <p className="auction-muted">{analysis.profitAnalysis}</p>
        </div>}
        {market && <div className="auction-panel"><h2>Pesquisa de mercado</h2><p className="auction-muted">{market.summary}</p>
          {!market.offers.length && <p>Nenhuma oferta com preço verificável encontrada.</p>}
          {market.offers.map((offer, i) => <div key={i} className="auction-part"><strong>{offer.title}</strong><span>{offer.source} · {formatCurrency(offer.price)}</span>{safeHttpUrl(offer.url) && <a href={safeHttpUrl(offer.url)!} target="_blank" rel="noopener noreferrer">Ver oferta ↗</a>}</div>)}
          {market.citations?.map((citation, i) => safeHttpUrl(citation.uri) && <a className="auction-source" key={i} href={safeHttpUrl(citation.uri)!} target="_blank" rel="noopener noreferrer">{citation.title} ↗</a>)}
        </div>}
        <p className="auction-muted">A análise visual e os preços são estimativas. Confirme os danos por inspeção e os valores nas fontes antes da compra.</p>
      </aside>
    </div>}
    {tab === 'watchlist' && <>
      <div className="auction-toolbar"><Field label="Situação dos lotes"><select value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todos</option><option value="monitorando">Monitorando</option><option value="arrematado">Arrematados</option><option value="perdido">Perdidos</option><option value="cancelado">Cancelados</option></select></Field><button type="button" onClick={() => setTab('simulator')}>Adicionar lote</button></div>
      {loading ? <p role="status">Carregando lotes…</p> : <div className="auction-list">{lots.filter(lot => filter === 'todos' || lot.status === filter).sort((a, b) => (a.data_leilao || '9999').localeCompare(b.data_leilao || '9999')).map(lot => <article className="auction-panel" key={lot.id}>
        <div className="auction-heading"><h2>{lot.marca} {lot.modelo}</h2><Badge status={lot.status} /></div>
        <p className="auction-muted">{lot.ano} · {lot.leiloeiro || 'Leiloeiro não informado'} · Lote {lot.numero_lote || '—'} · {lot.data_leilao ? formatDate(lot.data_leilao) : 'Sem data'}</p>
        <div className="auction-metrics"><Metric label="Lance planejado" value={formatCurrency(lot.lance)} /><Metric label="Revenda estimada" value={formatCurrency(lot.revenda_estimada)} /><Metric label="Recuperação estimada" value={formatCurrency(lot.reparos_estimados)} /></div>
        {lot.notas && <p className="auction-muted">{lot.notas}</p>}
        <div className="auction-actions">{safeHttpUrl(lot.link) && <a href={safeHttpUrl(lot.link)!} target="_blank" rel="noopener noreferrer">Abrir lote ↗</a>}
          {lot.status === 'monitorando' && <><button className="auction-primary" disabled={busy} onClick={() => { setPurchase(lot); setPurchaseForm({ placa: '', data_compra: today(), lance: lot.lance }); }}>Registrar arrematação</button>
            <button disabled={busy} onClick={() => void run(async () => { await auction.changeAuctionLotStatus(lot.id, 'perdido'); await refresh(); })}>Marcar perdido</button>
            <button disabled={busy} onClick={() => void run(async () => { await auction.changeAuctionLotStatus(lot.id, 'cancelado'); await refresh(); })}>Cancelar acompanhamento</button></>}
          {['perdido', 'cancelado'].includes(lot.status) && <button disabled={busy} onClick={() => void run(async () => { await auction.changeAuctionLotStatus(lot.id, 'monitorando'); await refresh(); })}>Voltar a acompanhar</button>}
        </div>
      </article>)}{!lots.some(lot => filter === 'todos' || lot.status === filter) && !loadError && <div className="auction-empty"><h2>Nenhum lote nesta situação</h2><p>Simule uma oportunidade e salve para acompanhar o leilão.</p><button onClick={() => setTab('simulator')}>Avaliar primeiro lote</button></div>}</div>}
    </>}
    {tab === 'portfolio' && <>
      <div className="auction-metrics"><Metric label="Veículos arrematados" value={String(portfolio.length)} /><Metric label="Em estoque" value={String(portfolio.length - sold.length)} /><Metric label="Resultado de vendas menos aquisição e despesas" value={formatCurrency(resultTotal)} negative={resultTotal < 0} /></div>
      <div className="auction-toolbar"><Field label="Situação dos veículos"><select value={portfolioFilter} onChange={e => setPortfolioFilter(e.target.value)}><option value="todos">Todos</option><option value="Em manutenção">Em recuperação</option><option value="Disponível">Disponíveis</option><option value="Vendido">Vendidos</option><option value="Locado">Locados</option><option value="Inativo">Inativos</option></select></Field><button onClick={() => onNavigate('veiculos')}>Abrir frota</button></div>
      <div className="auction-list">{portfolio.filter(row => portfolioFilter === 'todos' || row.vehicle!.status === portfolioFilter).map(({ lot, vehicle }) => {
        const v = vehicle!; const costs = expenseTotal(v); const investment = v.valor_compra + costs;
        const profit = (v.valor_venda || 0) - investment;
        return <article key={lot.id} className="auction-panel"><div className="auction-heading"><h2>{v.marca} {v.modelo}</h2><Badge status={v.status} /></div>
          <p className="auction-muted">{v.placa} · {v.ano} · Compra em {formatDate(v.data_compra)}</p>
          <div className="auction-metrics"><Metric label="Aquisição com taxas" value={formatCurrency(v.valor_compra)} /><Metric label="Despesas lançadas" value={formatCurrency(costs)} /><Metric label="Recuperação estimada no lote" value={formatCurrency(lot.reparos_estimados)} />
            {v.status === 'Vendido' && <><Metric label="Venda" value={formatCurrency(v.valor_venda || 0)} /><Metric label="Venda menos aquisição e despesas" value={formatCurrency(profit)} negative={profit < 0} /><Metric label="ROI de revenda" value={investment ? `${(profit / investment * 100).toFixed(1)}%` : '—'} /></>}
          </div>
          <p className="auction-muted">Estimativas de recuperação não geram despesas. Registre os custos reais no Financeiro. Para resultado completo com locações, manutenções, multas e sinistros, consulte o veículo na frota.</p>
          <div className="auction-actions"><button onClick={() => onNavigate('financeiro')}>Ver financeiro</button><button onClick={() => onNavigate('manutencoes')}>Ver manutenções</button>
            {v.status !== 'Vendido' && <><button disabled={busy} onClick={() => { setCostVehicle(v); setCostForm({ tipo: 'Manutenção', descricao: '', valor: 0, data: today() }); }}>Adicionar custo</button>
              {v.status === 'Em manutenção' && <button disabled={busy} onClick={() => void run(async () => { await onUpdateVeiculo({ ...v, status: 'Disponível' }); setMessage('Veículo disponível na frota.'); })}>Concluir recuperação</button>}
              {v.status !== 'Locado' && <button className="auction-primary" disabled={busy} onClick={() => { setSale(v); setSaleValue(lot.revenda_estimada); }}>Registrar venda à vista</button>}</>}
          </div>
        </article>;
      })}{!portfolio.length && !loading && !loadError && <div className="auction-empty"><h2>Nenhum veículo arrematado</h2><p>Registre a arrematação de um lote acompanhado para adicioná-lo à frota.</p><button onClick={() => setTab('watchlist')}>Ver lotes acompanhados</button></div>}</div>
    </>}
    </div>
    <Modal isOpen={!!purchase} onClose={() => { if (!busy) setPurchase(null); }} title="Registrar arrematação">
      <form className="auction-module auction-modal" onSubmit={e => { e.preventDefault(); if (!purchase) return; void run(async () => {
        const result = await auction.acquireAuctionLot(purchase.id, purchaseForm); onAcquired(result.veiculo);
        setLots(prev => prev.map(lot => lot.id === result.lote.id ? result.lote : lot)); setPurchase(null); setTab('portfolio'); setMessage('Arrematação registrada e veículo adicionado à frota.');
      }); }}>
        <p>O custo de aquisição inclui lance, comissão, taxas e custos extras do lote. Os reparos estimados serão lançados como despesas apenas quando você registrar os custos reais.</p>
        <Field label="Placa"><input required maxLength={8} pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}" value={purchaseForm.placa} onChange={e => setPurchaseForm({ ...purchaseForm, placa: e.target.value.toUpperCase() })} /></Field>
        <Field label="Data da compra"><input required type="date" max={today()} value={purchaseForm.data_compra} onChange={e => setPurchaseForm({ ...purchaseForm, data_compra: e.target.value })} /></Field>
        <Field label="Lance efetivo (R$)"><input required type="number" min="0.01" max="100000000" step="0.01" value={purchaseForm.lance || ''} onChange={e => setPurchaseForm({ ...purchaseForm, lance: Number(e.target.value) })} /></Field>
        {error && <p role="alert" className="auction-alert">{error}</p>}<button className="auction-primary" disabled={busy}>{busy ? 'Registrando…' : 'Confirmar arrematação'}</button>
      </form>
    </Modal>
    <Modal isOpen={!!sale} onClose={() => { if (!busy) setSale(null); }} title="Registrar venda à vista">
      <form className="auction-module auction-modal" onSubmit={e => { e.preventDefault(); if (!sale) return; void run(async () => {
        await onUpdateVeiculo({ ...sale, status: 'Vendido', valor_venda: saleValue }); setSale(null); setMessage('Venda e receita registradas no Financeiro.');
      }); }}>
        <p>{sale?.placa} · A venda será registrada com a data de hoje e a receita paga. Para parcelamento, use o cadastro de Veículos.</p>
        <Field label="Valor recebido (R$)"><input required type="number" min="0.01" max="100000000" step="0.01" value={saleValue || ''} onChange={e => setSaleValue(Number(e.target.value))} /></Field>
        {error && <p role="alert" className="auction-alert">{error}</p>}<button className="auction-primary" disabled={busy}>{busy ? 'Registrando…' : 'Confirmar venda e receita'}</button>
      </form>
    </Modal>
    <Modal isOpen={!!costVehicle} onClose={() => { if (!busy) setCostVehicle(null); }} title="Adicionar custo real">
      <form className="auction-module auction-modal" onSubmit={e => { e.preventDefault(); if (!costVehicle) return; void run(async () => {
        await onAddDespesa({ tipo: `${costForm.tipo} - ${costForm.descricao.trim()}`, valor: costForm.valor, data: costForm.data,
          veiculo_id: costVehicle.id, veiculo_placa: costVehicle.placa, status: 'Em aberto' });
        setCostVehicle(null); setMessage('Custo lançado em aberto no Financeiro. Registre o pagamento quando ele ocorrer.');
      }); }}>
        <p>{costVehicle?.placa} · O custo será vinculado ao veículo no Financeiro.</p>
        <Field label="Categoria"><select value={costForm.tipo} onChange={e => setCostForm({ ...costForm, tipo: e.target.value })}><option>Manutenção</option><option>Licenciamento</option><option>Outros</option></select></Field>
        <Field label="Descrição"><input required maxLength={150} value={costForm.descricao} onChange={e => setCostForm({ ...costForm, descricao: e.target.value })} /></Field>
        <Field label="Valor (R$)"><input required type="number" min="0.01" max="100000000" step="0.01" value={costForm.valor || ''} onChange={e => setCostForm({ ...costForm, valor: Number(e.target.value) })} /></Field>
        <Field label="Data do custo"><input required type="date" value={costForm.data} onChange={e => setCostForm({ ...costForm, data: e.target.value })} /></Field>
        {error && <p role="alert" className="auction-alert">{error}</p>}<button className="auction-primary" disabled={busy}>{busy ? 'Registrando…' : 'Lançar custo em aberto'}</button>
      </form>
    </Modal>
  </section>;
}
