import { validateAiRequest, validateAnalysis, validateMarketSearch, MAX_MEDIA_BYTES } from './validation.ts';
import { analysisSchema, marketSchema } from './schema.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// getUser is verified against Supabase Auth before any billable Gemini request.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Entre na sua conta.' }, 401);
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!url || !anonKey) return json({ error: 'Servidor não configurado.' }, 503);
  const headers = { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' };
  try {
    const auth = await fetch(`${url}/auth/v1/user`, { headers, signal: AbortSignal.timeout(10000) });
    if (!auth.ok) return json({ error: 'Sessão inválida. Entre novamente.' }, 401);
    if (!apiKey) return json({ error: 'Configure GEMINI_API_KEY nos secrets do Supabase para ativar a IA.' }, 503);
    // Bound the actual body, including when Content-Length is absent.
    const limit = Math.ceil(MAX_MEDIA_BYTES * 4 / 3) + 10000;
    const reader = req.body?.getReader();
    if (!reader) return json({ error: 'Requisição vazia.' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return json({ error: 'Envio excede 12 MB de mídia.' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let input: ReturnType<typeof validateAiRequest>;
    try { input = validateAiRequest(JSON.parse(new TextDecoder().decode(bytes))); }
    catch (e) { return json({ error: e instanceof Error ? e.message : 'Dados inválidos.' }, 400); }
    const quota = await fetch(`${url}/rest/v1/rpc/consumir_consulta_leilao`, { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(10000) });
    if (!quota.ok) {
      const details = await quota.json().catch(() => null);
      if (details?.message?.includes('Limite')) return json({ error: 'Limite de 20 consultas por hora atingido. Tente novamente na próxima hora.' }, 429);
      if (details?.message?.includes('Não autorizado')) return json({ error: 'Administradores e gerentes podem usar a IA.' }, 403);
      return json({ error: 'A avaliação por IA ainda não foi ativada. Solicite a configuração ao administrador.' }, 503);
    }

    const isAnalysis = input.action === 'analyze';
    const prompt = isAnalysis
      ? `Avalie visualmente este veículo de leilão no Brasil. Identificação sugerida: ${'carModelSuggestion' in input ? input.carModelSuggestion : ''}. Descreva somente danos visíveis, incertezas e peças que precisam de inspeção presencial. Não afirme integridade estrutural ou classificação legal de monta pelas imagens. Valores em BRL são estimativas; marketValueFipe é estimativa a confirmar na consulta FIPE. Estime peças, mão de obra e lance recomendado. Retorne o JSON do esquema em português.`
      : `Pesquise anúncios reais e atuais no Brasil para ${'carModel' in input ? input.carModel : ''}, ${input.action === 'search-parts' && 'partName' in input ? `peça: ${input.partName}` : 'veículos recuperados de leilão à venda e lotes comparáveis'}. Use Google Search. Só inclua ofertas com preço e URL verificados nas fontes. Não invente preços ou links; retorne offers vazio quando não houver evidência. Explique ano, versão e diferenças na comparação. Valores em BRL. Retorne JSON do esquema em português.`;
    const parts: object[] = [{ text: prompt }];
    if ('files' in input) parts.push(...input.files.map(file => ({ inlineData: file })));
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts }],
        ...(!isAnalysis ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: { responseFormat: { text: { mimeType: 'application/json', schema: isAnalysis ? analysisSchema : marketSchema } } },
      }), signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) return json({ error: response.status === 429 ? 'Cota do Gemini excedida. Tente novamente mais tarde.' : 'O Gemini não concluiu a consulta. Verifique o modelo e a chave configurados.' }, response.status === 429 ? 429 : 502);
    const result = await response.json();
    const candidate = result.candidates?.[0];
    const output = JSON.parse((candidate?.content?.parts || []).filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought).map((p: { text: string }) => p.text).join(''));
    if (isAnalysis) return json(validateAnalysis(output));
    const citations = (candidate?.groundingMetadata?.groundingChunks || []).filter((chunk: { web?: unknown }) => chunk.web).map((chunk: { web: { title?: string; uri: string } }) => ({ title: chunk.web.title || 'Fonte', uri: chunk.web.uri }));
    return json(validateMarketSearch({ ...output, citations }));
  } catch (e) {
    console.error('auction-ai:', e instanceof Error ? e.name : 'erro');
    return json({ error: 'Não foi possível concluir a consulta. Tente novamente. Nenhuma avaliação simulada foi gerada.' }, 502);
  }
});
