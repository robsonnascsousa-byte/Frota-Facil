# Graph Report - .  (2026-08-10)

## Corpus Check
- 65 files · ~76,454 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 363 nodes · 751 edges · 33 communities (21 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.84)
- Token cost: 41,000 input · 5,200 output

## Community Hubs (Navigation)
- Telas Financeiras e Dashboard
- Shell do App e Autenticação de Tela
- Cadastros de Frota e Motoristas
- Contexto de Auth e Deploy Docker
- Schema do Banco Supabase
- Dependências do Projeto
- Configuração TypeScript
- Integração Tabela FIPE
- Navegação e Busca Global
- Trilha de Auditoria
- Sync de Admin (v1)
- Sync de Admin (v2)
- Script Criar Usuário Teste
- Script Resetar Usuário
- Políticas RBAC
- Script Testar Login
- Script Verificar Admin
- Migration Criar Receitas
- Tabela Receitas
- Storage de Objetos
- Perfis (fix admin v1)
- Perfis (fix admin v2)

## God Nodes (most connected - your core abstractions)
1. `isSupabaseConfigured()` - 20 edges
2. `Veiculo` - 18 edges
3. `compilerOptions` - 16 edges
4. `formatCurrency()` - 15 edges
5. `useAuth()` - 14 edges
6. `Contrato` - 14 edges
7. `Header()` - 13 edges
8. `Manutencao` - 12 edges
9. `formatDate()` - 12 edges
10. `Table()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Monograma: setas bidirecionais + ticks de odômetro` --semantically_similar_to--> `LogoMonogram()`  [INFERRED] [semantically similar]
  public/logo.svg → components/Login.tsx
- `Fundo de login: mapa-múndi com frota` --references--> `Login()`  [INFERRED]
  public/login-bg.png → components/Login.tsx
- `Foto de login: SUV branco em estúdio` --references--> `Login()`  [INFERRED]
  public/login-car.png → components/Login.tsx
- `Configuração inline do tema Tailwind` --references--> `Login()`  [INFERRED]
  index.html → components/Login.tsx
- `Dark mode por classe` --shares_data_with--> `useDarkMode()`  [INFERRED]
  index.html → hooks/useDarkMode.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Superfície de identidade visual da marca** — index_brand_palette_tokens, index_brand_font_stack, index_dark_mode_class_strategy, public_logo_primary_lockup, index_petrol_blue_compat_alias [INFERRED 0.85]
- **Resquícios do scaffold FrotaFácil/AI Studio** — readme_ai_studio_boilerplate, readme_gemini_api_key_instruction, index_importmap_cdn_react, public_login_bg_offbrand_cyan_palette, public_login_car_studio_suv [INFERRED 0.85]
- **Cadeia de deploy em produção** — docker_compose_frotafacil_service, docker_compose_supabase_build_args, docker_compose_port_mapping_3080, docker_compose_watchtower_autoupdate, lib_supabase [EXTRACTED 1.00]

## Communities (33 total, 12 thin omitted)

### Community 0 - "Telas Financeiras e Dashboard"
Cohesion: 0.08
Nodes (62): CommandPaletteProps, ContratosProps, initialFormState, CustomTooltip(), Dashboard(), DashboardProps, LEGEND_COLORS, DRE() (+54 more)

### Community 1 - "Shell do App e Autenticação de Tela"
Cohesion: 0.07
Nodes (38): App(), AppWithAuth(), InnerApp(), Configuracoes(), ConfiguracoesProps, Login(), LoginProps, LogoMonogram() (+30 more)

### Community 2 - "Cadastros de Frota e Motoristas"
Cohesion: 0.09
Nodes (31): Contratos(), initialFormState, Motoristas(), MotoristasProps, Badge(), FinancialData, initialFormState, SaleConfig (+23 more)

### Community 3 - "Contexto de Auth e Deploy Docker"
Cohesion: 0.10
Nodes (32): ControleAcessos(), UserProfile, AuthContext, AuthContextType, AuthProvider(), AuthProviderProps, Serviço Docker frotafacil, Publicação da porta 3080:80 (+24 more)

### Community 4 - "Schema do Banco Supabase"
Cohesion: 0.14
Nodes (25): auth, receitas, auth.users, configuracoes, contratos, despesas, documentos, manutencoes (+17 more)

### Community 5 - "Dependências do Projeto"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, recharts, @supabase/supabase-js, devDependencies, @types/node, typescript (+18 more)

### Community 6 - "Configuração TypeScript"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 7 - "Integração Tabela FIPE"
Cohesion: 0.25
Nodes (16): FipeLookup(), FipeLookupProps, buscarValorPorTexto(), cache, fetchWithCache(), FipeAno, FipeMarca, FipeModelo (+8 more)

### Community 8 - "Navegação e Busca Global"
Cohesion: 0.15
Nodes (7): CommandPalette(), PAGES, SearchResult, ICONS, NavItemProps, SidebarProps, Page

### Community 9 - "Trilha de Auditoria"
Cohesion: 0.33
Nodes (7): public.log_audit_event, audit_contratos, audit_logs, audit_manutencoes, audit_motoristas, audit_pagamentos, audit_veiculos

## Ambiguous Edges - Review These
- `Serviço Docker frotafacil` → `Importmap de React/Recharts por CDN`  [AMBIGUOUS]
  docker-compose.yml · relation: conceptually_related_to

## Knowledge Gaps
- **77 isolated node(s):** `PAGES`, `initialFormState`, `UserProfile`, `LEGEND_COLORS`, `ContasAReceber` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Serviço Docker frotafacil` and `Importmap de React/Recharts por CDN`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What connects `PAGES`, `initialFormState`, `UserProfile` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Telas Financeiras e Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.0775438596491228 - nodes in this community are weakly interconnected._
- **Should `Shell do App e Autenticação de Tela` be split into smaller, more focused modules?**
  _Cohesion score 0.06887755102040816 - nodes in this community are weakly interconnected._
- **Should `Cadastros de Frota e Motoristas` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._
- **Should `Contexto de Auth e Deploy Docker` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._
- **Should `Schema do Banco Supabase` be split into smaller, more focused modules?**
  _Cohesion score 0.1354679802955665 - nodes in this community are weakly interconnected._