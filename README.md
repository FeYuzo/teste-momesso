# Momesso – Gestão Industrial Full Stack

Aplicação full stack para gerenciamento de **empresas**, **usuários** e **máquinas**, desenvolvida com NestJS, Angular e PostgreSQL, com autenticação JWT e políticas de segurança via PostgreSQL RLS.

---

## Tecnologias Utilizadas

### Back-end
| Tecnologia | Versão | Motivo |
|---|---|---|
| **NestJS** | ^10 | Framework Node.js com arquitetura modular e injeção de dependências |
| **TypeORM** | ^0.3 | ORM para mapeamento de entidades e acesso ao banco de dados |
| **PostgreSQL** | 15 | Banco relacional com suporte a RLS (Row Level Security) |
| **JWT / Passport** | — | Autenticação stateless e proteção de rotas |
| **bcryptjs** | — | Hash seguro de senhas |
| **class-validator** | — | Validação de DTOs com decorators |

### Front-end
| Tecnologia | Versão | Motivo |
|---|---|---|
| **Angular** | 17 | Framework SPA com Signals, componentes standalone e lazy loading |
| **TypeScript** | ~5.2 | Tipagem estática e melhor DX |
| **SCSS** | — | Estilos modulares e variáveis CSS |
| **Angular Router** | — | Navegação com guards de autenticação |

### Infra
- **Docker + Docker Compose** — Ambiente reproduzível, sem instalar nada na máquina
- **Nginx** — Servidor estático para o build de produção do Angular

---

## Estrutura do Projeto

```
momesso-project/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT, guards, estratégias, decorators
│   │   ├── companies/      # CRUD de empresas + testes unitários
│   │   ├── users/          # CRUD de usuários
│   │   ├── machines/       # CRUD de máquinas
│   │   └── seeds/          # Seed de dados iniciais
│   ├── rls-policies.sql    # Políticas RLS do PostgreSQL
│   ├── Dockerfile          # Build de produção (multi-stage)
│   ├── Dockerfile.seed     # Container exclusivo para rodar o seed
│   └── package.json
│
├── frontend/
│   ├── src/app/
│   │   ├── auth/           # Login, guards, interceptor JWT
│   │   ├── dashboard/      # Tela de dashboard
│   │   ├── companies/      # CRUD de empresas
│   │   ├── users/          # CRUD de usuários
│   │   ├── machines/       # CRUD de máquinas
│   │   └── shared/         # ApiService, Layout, estilos compartilhados
│   ├── nginx.conf
│   ├── Dockerfile          # Build de produção (multi-stage) + Nginx
│   └── package.json
│
├── docker-compose.yml
├── start.sh                # Script para rodar localmente sem Docker
└── README.md
```

---

## Como Executar

### Opção 1 — Docker Compose ✅ (zero configuração)

> **Não precisa instalar Node.js, npm ou PostgreSQL.**
> O Docker faz tudo: `npm install`, `npm run build`, banco de dados, seed.

```bash
# 1. Clone o repositório
git clone https://github.com/FeYuzo/teste-momesso.git
cd momesso-project

# 2. Suba tudo (build + banco + seed automático)
docker-compose up --build
```

O Docker irá automaticamente:
1. Subir o **PostgreSQL** e criar o banco `momesso_db`
2. Rodar `npm install` e `npm run build` no **back-end**
3. Rodar `npm install` e `npm run build:prod` no **front-end**
4. Executar o **seed** com dados de demonstração
5. Servir tudo via **Nginx**

Acesse:
- **Frontend:** http://localhost:4200
- **API:** http://localhost:3000/api

---

### Opção 2 — Script local (Node.js + PostgreSQL instalados)

> Requisitos: **Node.js 20+** e **PostgreSQL 15+** rodando localmente.

```bash
# Crie o banco de dados antes
psql -U postgres -c "CREATE DATABASE momesso_db;"

# Execute o script que instala tudo e sobe os servidores
chmod +x start.sh
./start.sh
```

O script faz automaticamente:
1. Cria `backend/.env` a partir de `.env.example`
2. Roda `npm install` no back-end
3. Roda o seed do banco de dados
4. Inicia o back-end em modo desenvolvimento (`npm run start:dev`)
5. Roda `npm install` no front-end
6. Inicia o front-end (`npm start`)

---

### Opção 3 — Manual (passo a passo)

```bash
# ── BACK-END ──────────────────────────────────────
cd backend
cp .env.example .env        # configure suas credenciais se necessário
npm install                  # instala todas as dependências
npm run start:dev            # inicia o servidor (porta 3000)

# Em outro terminal — seed do banco:
cd backend
npm run seed

# ── FRONT-END ─────────────────────────────────────
cd frontend
npm install                  # instala todas as dependências  
npm start                    # inicia o servidor Angular (porta 4200)
```

---

## Usuários de Demonstração (criados pelo seed)

| Email | Senha | Role | Empresa |
|---|---|---|---|
| admin@momesso.com | 123456 | **ADMIN** | Momesso Tecnologia Ltda |
| joao@momesso.com | 123456 | USER | Momesso Tecnologia Ltda |
| admin@techsolutions.com | 123456 | **ADMIN** | Tech Solutions S.A. |
| maria@techsolutions.com | 123456 | USER | Tech Solutions S.A. |

---

## Regras de Negócio e Segurança

### Roles

| Ação | ADMIN | USER |
|---|---|---|
| Ver todas as empresas | ✅ | ❌ (só a própria) |
| Criar / Editar / Deletar empresa | ✅ | ❌ |
| Ver todos os usuários | ✅ | ❌ (só da empresa) |
| Criar usuário em qualquer empresa | ✅ | ❌ (só na própria) |
| Ver todas as máquinas | ✅ | ❌ (só da empresa) |
| Criar máquina em qualquer empresa | ✅ | ❌ (só na própria) |

### Camadas de proteção

A segurança é implementada em **duas camadas independentes**:

1. **Aplicação (NestJS):** Guards JWT, decorator `@Roles()`, e filtros por `companyId` nas queries TypeORM.
2. **Banco (PostgreSQL RLS):** Políticas de Row Level Security diretamente no banco — arquivo `backend/rls-policies.sql`.

---

## Segurança RLS — PostgreSQL

O arquivo `backend/rls-policies.sql` implementa RLS nas três tabelas:

```sql
-- Usuário USER só vê registros da própria empresa
CREATE POLICY machines_user_select ON machines
  FOR SELECT TO momesso_user
  USING (company_id = current_company_id());
```

Para aplicar manualmente:
```bash
psql -U postgres -d momesso_db -f backend/rls-policies.sql
```

---

## Endpoints da API

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Gerar token JWT |

### Companies · Users · Machines
Todos seguem o padrão REST:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/{recurso}` | Listar todos (filtrado por role) |
| GET | `/api/{recurso}/:id` | Buscar por ID |
| POST | `/api/{recurso}` | Criar |
| PATCH | `/api/{recurso}/:id` | Atualizar |
| DELETE | `/api/{recurso}/:id` | Remover |

---

## Testes Unitários

```bash
cd backend
npm test           # roda todos os testes
npm run test:cov   # com relatório de cobertura
```

Cobertos: `CompaniesService` (create, findAll por role, findOne) e `AuthService` (login, usuário inexistente, senha inválida).

---

## Diferenciais Implementados

- ✅ Testes unitários (Jest)
- ✅ Dashboard com totalizadores e tabelas recentes
- ✅ Seed completo com dados de demonstração
- ✅ RLS / Políticas no PostgreSQL (`rls-policies.sql`)
- ✅ Docker Compose completo com seed automático
- ✅ Script `start.sh` para execução local simplificada
- ✅ Design system dark mode com identidade visual própria
- ✅ Sidebar colapsável e responsiva
- ✅ Lazy loading de rotas Angular
- ✅ Signals do Angular 17
