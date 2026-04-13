# MedControl — Controle de Medicamentos

Sistema web completo de controle de medicamentos com persistência em banco de dados, múltiplos usuários, agenda automática e notificações push.

## Funcionalidades

- **Autenticação** — Cadastro e login de usuários com JWT
- **Medicamentos** — CRUD completo com frequência flexível (intervalo, horários fixos, dias específicos)
- **Agenda** — Geração automática de doses para 30 dias
- **Doses** — Registrar como tomado, pular ou adiar
- **Histórico** — Histórico permanente com filtros
- **Aderência** — Estatísticas e gráficos de cumprimento do tratamento
- **Notificações** — Web Push 10 minutos antes de cada dose

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Backend  | Node.js 24 + Express + TypeScript |
| Banco    | SQLite via `node:sqlite` (built-in Node v22.5+) |
| Auth     | JWT + bcryptjs |
| Push     | Web Push API + VAPID + Service Workers |

---

## Rodar localmente

### Pré-requisitos
- Node.js v22.5 ou superior (recomendado v24)

### 1. Instalar dependências

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env` e preencha:
- **JWT_SECRET** — gere com: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **VAPID keys** — gere com: `npm run generate-vapid`

### 3. Iniciar os servidores (2 terminais)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Rodando em http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Rodando em http://localhost:5173
```

Abra **http://localhost:5173** no navegador.

---

## Deploy (publicar na internet)

### Backend → Render.com (gratuito)

1. Acesse [render.com](https://render.com) e crie uma conta
2. Clique em **New → Blueprint** e conecte este repositório
3. O Render vai ler o `render.yaml` e criar o serviço automaticamente
4. Configure as variáveis de ambiente obrigatórias no painel:
   - `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (gere com `npm run generate-vapid`)
   - `ALLOWED_ORIGIN` → URL do frontend no Vercel (ver abaixo)
5. Copie a URL do backend (ex: `https://medcontrol-backend.onrender.com`)

### Frontend → Vercel (gratuito)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta
2. Importe este repositório
3. Configure:
   - **Root Directory:** `frontend`
   - **Environment Variable:** `VITE_API_URL` = `https://seu-backend.onrender.com/api`
4. Clique em Deploy

Pronto! O link do Vercel pode ser compartilhado com qualquer pessoa.

---

## Estrutura

```
CONTROLEMEDICAMENTOS/
├── render.yaml           Configuração de deploy (Render.com)
├── backend/
│   ├── src/
│   │   ├── config/       Database (SQLite), JWT
│   │   ├── controllers/
│   │   ├── services/     Agenda, Notificações, Aderência
│   │   ├── routes/
│   │   └── app.ts
│   ├── data/             medications.db (criado automaticamente, ignorado no git)
│   └── .env.example      Variáveis de ambiente necessárias
│
└── frontend/
    ├── public/           sw.js, manifest.json, ícones
    ├── src/
    │   ├── api/          Axios clients por módulo
    │   ├── components/
    │   ├── pages/
    │   └── store/        Zustand
    └── .env.example      Variáveis de ambiente necessárias
```
