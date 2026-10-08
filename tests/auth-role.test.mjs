import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { loadUserRole } from '../services/authRole.ts';

function clientWith(fetch) {
  return createClient('https://auth-test.invalid', 'test-public-key', {
    accessToken: async () => 'test-token',
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  });
}

test('consulta o perfil do usuário e mantém cada papel confirmado pelo banco', async () => {
  for (const role of ['admin', 'gerente', 'operacao']) {
    const client = clientWith(async (url) => {
      const request = new URL(url);
      assert.equal(request.pathname, '/rest/v1/profiles');
      assert.equal(request.searchParams.get('select'), 'role');
      assert.equal(request.searchParams.get('id'), 'eq.current-user');
      return Response.json([{ role }]);
    });
    assert.equal(await loadUserRole(client, 'current-user', new AbortController().signal), role);
  }
});

test('falha de rede ou de permissão não transforma um usuário em Operação', async () => {
  for (const fetch of [
    async () => { throw new TypeError('Network unavailable'); },
    async () => Response.json({ message: 'Access denied' }, { status: 403 }),
  ]) {
    await assert.rejects(loadUserRole(clientWith(fetch), 'user', new AbortController().signal), /Não foi possível consultar/);
  }
});

test('perfil ausente e papel inválido permanecem sem permissão confirmada', async () => {
  for (const response of [[], [{ role: null }], [{ role: 'superadmin' }]]) {
    const client = clientWith(async () => Response.json(response));
    await assert.rejects(loadUserRole(client, 'user', new AbortController().signal), /perfil de acesso não está configurado/);
  }
});

test('consulta travada tem prazo e cancela a requisição', async () => {
  let requestSignal;
  const client = clientWith(async (_, options) => {
    requestSignal = options.signal;
    return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  });
  await assert.rejects(loadUserRole(client, 'user', new AbortController().signal, 30), /demorou demais/);
  assert.equal(requestSignal.aborted, true);
});

test('troca de sessão cancela a consulta anterior sem retornar um papel', async () => {
  const controller = new AbortController();
  let started;
  const start = new Promise(resolve => { started = resolve; });
  const client = clientWith(async (_, options) => {
    const result = new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
    started();
    return result;
  });
  const role = loadUserRole(client, 'previous-user', controller.signal);
  await start;
  controller.abort();
  await assert.rejects(role);
});
