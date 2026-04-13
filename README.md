# MedControl — Controle de Medicamentos

Sistema web completo de controle de medicamentos com persistência real em banco de dados, múltiplos usuários, agenda automática e notificações push.

## Funcionalidades

- **Autenticação** — Cadastro e login de usuários com JWT
- **Medicamentos** — CRUD completo com frequência flexível (intervalo, horários fixos, dias específicos)
- **Agenda** — Geração automática de doses para 30 dias
- **Doses** — Registrar como tomado, pular ou adiar
- **Histórico** — Histórico permanente com filtros (mantido mesmo após exclusão de medicamentos)
- **Aderência** — Estatísticas e gráficos de cumprimento do tratamento
- **Notificações** — Web Push 10 minutos antes de cada dose

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 |
| Backend  | Node.js + Express + TypeScript |
| Banco    | SQLite via `node:sqlite` (built-in Node v24) |
| Auth     | JWT + bcryptjs |
| Push     | Web Push API + VAPID + Service Workers |

## Como rodar

### Pré-requisitos
- Node.js v22+ (recomendado v24)
- npm

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com seus valores (JWT_SECRET, VAPID keys)
# Para gerar VAPID keys: npm run generate-vapid
npm run dev
```

O backend roda em `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173`.

### Produção

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Deploy a pasta dist/ no GitHub Pages ou qualquer host estático
```

Para deploy em produção, configure a variável `VITE_API_URL` no frontend apontando para o backend hospedado (ex: Render, Railway).

## Estrutura

```
CONTROLEMEDICAMENTOS/
├── backend/          Node.js + Express API
│   ├── src/
│   │   ├── config/   Database, JWT
│   │   ├── controllers/
│   │   ├── services/ Agenda, Notificações, Aderência
│   │   ├── routes/
│   │   └── app.ts
│   └── data/         medications.db (criado automaticamente)
│
└── frontend/         React + Vite
    ├── public/        sw.js (Service Worker), manifest.json
    └── src/
        ├── api/       Axios modules
        ├── components/
        ├── context/   Auth, Notifications
        ├── pages/
        └── store/     Zustand stores
```

## Regras de negócio

- **Soft delete**: Medicamentos excluídos mantêm todo o histórico de doses
- **Isolamento**: Cada usuário vê apenas seus próprios dados
- **Agenda**: Gerada automaticamente para 30 dias ao cadastrar ou reativar um medicamento
- **Notificações**: Enviadas 10 minutos antes do horário previsto (poll a cada 60s)
- **Pausar**: Cancela doses futuras pendentes sem apagar o histórico

## Design

- Fundo escuro: `#0e0f11`
- Tipografia: Syne (títulos) + DM Mono (horários, badges)
- Paleta: Teal `#14b8a6` · Roxo `#8b5cf6` · Âmbar `#f59e0b`
