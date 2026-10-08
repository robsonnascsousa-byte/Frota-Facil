<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gAFGXHyoKnHNh0KvQftsN1dmahdp3rAK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`).
3. Run the app:
   `npm run dev`

## Leilões e revenda

O módulo CarFlippingBR está integrado ao login, à frota e ao Financeiro. A migração e a função de IA precisam ser ativadas no Supabase conforme [o guia de integração](docs/LEILOES_INTEGRACAO.md). A chave Gemini fica nos secrets do servidor.
