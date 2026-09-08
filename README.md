# SoundSplit — Plataforma de distribuição musical com royalties

MVP completo e funcional: cadastro de artistas, upload de lançamentos, cálculo
automático de split de receita, e pagamentos reais via Stripe Connect.

## ⚠️ Antes de tudo: como isto se liga ao Spotify/Apple Music de verdade

Este site **não envia música às plataformas de streaming sozinho** — nenhum
site pode, sem ser um agregador aprovado. O que este MVP faz:

- Deixa o artista fazer upload da música e dos metadados
- Marca o lançamento como `IN_REVIEW` no teu painel de admin
- **É tua responsabilidade**, por agora, pegar nesse ficheiro e submetê-lo
  manualmente através de um agregador existente (RouteNote, DistroKid, CD Baby...)
  usando uma conta tua, e depois atualizar o status para `SUBMITTED` / `LIVE`

Para automatizar isto de verdade, o próximo passo é fechar uma parceria de
**revenda white-label** com um agregador que ofereça API (RouteNote Partner API,
Revelator, SonoSuite, FUGA são os nomes a pesquisar). Quando tiveres acesso a
essa API, o ponto exato onde ligar está marcado no ficheiro:

```
app/api/admin/releases/[id]/status/route.ts
```

## Como o dinheiro flui

1. As plataformas pagam royalties ao **agregador** (ex: RouteNote), que te paga a ti
2. Tu (admin) registas esse valor recebido no painel `/admin`, por lançamento
3. O sistema calcula automaticamente a parte do artista (100% − a tua taxa,
   configurável em `PLATFORM_FEE_PERCENT` no `.env`)
4. O artista liga a conta bancária dele via Stripe Connect (`/dashboard/payouts`)
5. Quando o artista pede o levantamento, tu confirmas no `/admin` e o Stripe
   transfere o dinheiro da tua conta Stripe para a conta dele

**Importante:** para os `stripe.transfers.create(...)` funcionarem de verdade,
a tua conta Stripe da plataforma precisa de ter saldo disponível (isto é, o
dinheiro que o agregador te pagou tem de estar na tua conta Stripe/bancária
antes de o transferires para os artistas).

## Instalação local

Este projeto usa **PostgreSQL** (não precisa de instalação local — a forma mais
rápida é criar uma base de dados grátis em [neon.tech](https://neon.tech) ou
[railway.app](https://railway.app) e copiar a connection string, mesmo para
desenvolvimento local).

```bash
npm install
cp .env.example .env
# cola a tua DATABASE_URL do Neon/Railway no .env
# edita também com as tuas chaves Stripe de TESTE (dashboard.stripe.com/test/apikeys)

npm run db:push        # cria as tabelas na tua base de dados Postgres
node scripts/create-admin.js admin@teusite.com senha123

npm run dev
```

Abre `http://localhost:3000`. Regista-te como artista em `/register`,
ou entra como admin em `/login` com o email/senha que criaste acima.

## Testar o fluxo completo

1. Regista-te como artista → faz upload de um lançamento
2. Entra como admin (`/admin`) → muda o status do lançamento pra `LIVE`
3. Ainda no admin, clica **"+ Receita"** na linha do lançamento e regista um
   valor recebido (ex: fonte "Spotify", 100€)
4. Volta ao painel do artista → o saldo já aparece com a parte dele
5. O artista vai a `/dashboard/payouts` → **"Configurar conta de pagamento"**
   (isto abre o onboarding da Stripe — em modo teste, usa dados fictícios)
6. Depois de configurado, o artista pode **"Pedir levantamento"**
7. Como admin, vai a `/admin` e clica **"Processar pagamento"** — isto dispara
   uma transferência Stripe real (em modo teste, simula sem mover dinheiro real)

## Stack

- **Next.js 14** (App Router) — frontend + API routes no mesmo projeto
- **Prisma + PostgreSQL** — funciona com qualquer Postgres (Railway, Neon, Supabase...)
- **Stripe Connect (Express accounts)** — onboarding e pagamentos reais aos artistas
- Autenticação simples por sessão JWT em cookie (sem dependências pesadas)

## O que falta para ir a produção

- [ ] Trocar armazenamento local de ficheiros (`public/uploads`) por S3/Cloudflare R2
      — ficheiros de áudio grandes não devem viver no mesmo servidor da app
- [ ] Fechar parceria com um agregador (RouteNote/Revelator) e ligar a API real
      em `app/api/admin/releases/[id]/status/route.ts`
- [ ] Configurar o webhook do Stripe (`STRIPE_WEBHOOK_SECRET`) para confirmar
      pagamentos e lidar com falhas de transferência automaticamente
- [ ] Validação de conteúdo (direitos autorais, formatos, duração mínima)
      exigida pela maioria dos agregadores
- [ ] Termos de serviço e contrato de distribuição — isto envolve direitos
      autorais e dinheiro de terceiros; vale a pena revisão jurídica antes do lançamento público
