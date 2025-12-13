# Projeto Monofloor Equipes

## Contexto do Projeto

**Monofloor Equipes** é um aplicativo mobile para equipes de obra que trabalham com o sistema STELION (piso monolítico). O app serve como plataforma de gestão de equipes e acompanhamento de trabalho.

### Funcionalidades Principais:
- **Check-in/Check-out** baseado em localização (geofencing 200m)
- **Controle de horas** trabalhadas por projeto
- **Feed social** para comunicação da equipe
- **Relatórios de obra** com áudio e fotos
- **Gamificação** com XP, conquistas e trilhas de aprendizado ("Academia")
- **Gestão de projetos** com progresso em m² e horas

### Público-alvo:
Equipes de aplicação de piso monolítico STELION em obras residenciais e comerciais.

---

## Stack Tecnológica

### Mobile App (Protótipo)
- **Frontend puro**: HTML5, CSS3, JavaScript vanilla
- **Design**: Mobile-first (375x812px), tema escuro
- **Fonte**: Inter (Google Fonts)

### Backend (monofloor-admin)
- **Runtime**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT (tokens separados para admin e mobile)
- **AI**: OpenAI Whisper (transcrição) + GPT-4 (resumos)
- **Hosting**: Railway (planejado)

### Estrutura de Arquivos:
```
monofloor-app/                    # Frontend mobile (protótipo)
├── index.html
├── app.js
├── pipefy.js
├── styles.css
└── logo.png

monofloor-admin/                  # Backend completo
├── prisma/
│   ├── schema.prisma            # Database schema (11 tabelas)
│   └── seed.ts                  # Dados de teste
├── src/
│   ├── config/index.ts          # Configurações
│   ├── middleware/
│   │   ├── auth.ts              # JWT auth (admin + mobile)
│   │   └── errorHandler.ts      # Error handling
│   ├── routes/
│   │   ├── auth.routes.ts       # Login/Register
│   │   ├── admin/               # Dashboard, Aplicadores, Projetos, Reports
│   │   └── mobile/              # Profile, Projects, Checkins, Hours, Reports
│   ├── services/
│   │   ├── pipefy.service.ts    # Sync com Pipefy
│   │   └── ai/                  # Whisper + GPT services
│   ├── utils/password.ts
│   ├── app.ts
│   └── index.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Telas Implementadas (11 telas)

1. **Login** - Email/senha, recuperar senha, cadastro
2. **Criar Perfil** - Upload foto, nome, username, email, senha
3. **Projetos (Dashboard)** - Lista de projetos ativos/concluídos com progresso
4. **Detalhe do Projeto** - Mapa, equipe, check-in, criar relatório
5. **Feed** - Posts da equipe com likes e comentários
6. **Novo Post** - Upload de imagem, texto, seletor de projeto
7. **Comentários** - Thread de comentários em posts
8. **Horas** - Resumo mensal, horas por projeto, histórico
9. **Relatório** - Gravação de áudio, tags rápidas, upload de fotos
10. **Academia** - Nível/XP, conquistas, trilhas de aprendizado
11. **Perfil** - Card do usuário, menu (editar, config, ajuda, sair)

---

## Design System

### Paleta de Cores:
- **Fundo**: Preto/cinza escuro
- **Primária (ouro/bronze)**: #c9a962
- **Sucesso (verde)**: #22c55e
- **Secundária (azul)**: #3b82f6
- **Alerta (laranja)**: #f97316
- **Erro (vermelho)**: #ef4444

### Estilo Visual:
- Bordas arredondadas (12px, 16px, 24px)
- Transições suaves em botões e modais
- Cards com sombras sutis
- Ícones emoji (placeholder)

---

## Funcionalidades JavaScript

### Navegação:
- `navigateTo(screenId)` - Troca de telas
- `updateBottomNav(screenId)` - Estado da navegação inferior

### Check-in/Check-out:
- `doCheckin()` - Inicia check-in no projeto
- `doCheckout()` - Finaliza sessão de trabalho
- `simulateGeofencing()` - Detecção de localização (mock)

### Relatórios:
- `toggleRecording()` - Timer de gravação de áudio
- `publishPost()` - Publicar no feed
- `createProfile()` - Criação de perfil

### UI:
- `previewPhoto(input)` - Preview de foto do perfil
- `toggleLike(btn)` - Toggle de curtida
- `showSuccessModal()` - Notificações de sucesso

---

## Integração Pipefy (ATIVA)

O app carrega projetos diretamente do Pipefy via API GraphQL.

### Configuração:
- **Pipe ID**: 306848975 (EM EXECUÇÃO)
- **Endpoint**: https://api.pipefy.com/graphql
- **Autenticação**: Bearer Token (em pipefy.js)

### Campos Mapeados:
| Campo Pipefy | Campo no App |
|--------------|--------------|
| Cliente | cliente |
| Endereço | endereco |
| M² Total | m2Total |
| Piso (m²) | piso |
| Parede (m²) | parede |
| Equipe | equipe |
| Cor | cor |
| Andamento | andamento |
| Consultor | consultor |
| Material | material |

### Funções disponíveis:
- `PipefyAPI.getProjects()` - Retorna lista de projetos formatados
- `PipefyAPI.getCardDetails(id)` - Detalhes de um card específico
- `loadProjects()` - Carrega e renderiza projetos na tela

### Testar conexão:
```bash
cd monofloor-app && node test-pipefy.js
```

---

## Backend API - Endpoints Implementados

### Autenticação (`/api/auth`)
- `POST /admin/login` - Login admin
- `POST /mobile/register` - Registro aplicador (status PENDING_APPROVAL)
- `POST /mobile/login` - Login mobile (verifica status aprovação)

### Admin Dashboard (`/api/admin/dashboard`)
- `GET /stats` - Estatísticas gerais (obras, aplicadores, m²)
- `GET /top-applicators` - Top 10 por horas
- `GET /bottom-applicators` - Bottom 10 por horas
- `GET /online-applicators` - Aplicadores com check-in ativo

### Gestão de Aplicadores (`/api/admin/applicators`)
- `GET /` - Listar aplicadores (filtros: status, role)
- `GET /:id` - Detalhes do aplicador
- `POST /:id/approve` - Aprovar cadastro
- `POST /:id/reject` - Rejeitar cadastro
- `PUT /:id/role` - Promover cargo
- `POST /:id/projects` - Atribuir projeto

### Gestão de Projetos (`/api/admin/projects`)
- `GET /` - Listar projetos
- `GET /:id` - Detalhes do projeto
- `PUT /:id` - Atualizar projeto
- `GET /:id/team` - Equipe do projeto
- `POST /:id/team` - Adicionar membro
- `DELETE /:id/team/:userId` - Remover membro
- `GET /:id/reports` - Relatórios do projeto
- `GET /:id/checkins` - Check-ins do projeto
- `POST /sync-pipefy` - Sincronizar com Pipefy

### Relatórios AI (`/api/admin/reports`)
- `POST /generate-daily` - Gerar relatório diário (GPT)
- `POST /generate-period` - Gerar relatório do período
- `GET /generated` - Listar relatórios gerados
- `GET /generated/:id` - Detalhes do relatório
- `POST /generate-tasks` - Gerar tarefas via AI

### Mobile API (`/api/mobile`)
- `GET /profile` - Perfil do usuário
- `PUT /profile` - Atualizar perfil
- `GET /projects` - Projetos atribuídos
- `GET /projects/:id` - Detalhes do projeto
- `POST /checkins` - Fazer check-in
- `PUT /checkins/:id/checkout` - Fazer checkout
- `GET /checkins` - Histórico de check-ins
- `GET /checkins/active` - Check-in ativo
- `GET /hours` - Resumo de horas trabalhadas
- `POST /reports` - Criar relatório
- `GET /reports` - Listar relatórios

---

## Banco de Dados (Prisma Schema)

### Tabelas Principais:
1. **admin_users** - Usuários do painel admin (SUPER_ADMIN, ADMIN, VIEWER)
2. **users** - Aplicadores (status: PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED)
3. **projects** - Projetos (sync do Pipefy + dados locais)
4. **project_assignments** - Aplicadores ↔ Projetos (many-to-many)
5. **checkins** - Check-ins/outs com localização e horas
6. **reports** - Relatórios com áudio/fotos
7. **report_photos** - Fotos dos relatórios
8. **project_documents** - Documentos do projeto (admin upload)
9. **generated_reports** - Relatórios gerados pelo admin via AI
10. **telegram_config** - Configuração Telegram (futuro)
11. **audit_logs** - Log de ações

### Workflow de Aprovação:
1. Aplicador se registra → status = PENDING_APPROVAL
2. Admin aprova/rejeita → status = APPROVED ou REJECTED
3. Apenas APPROVED pode fazer login no mobile

---

## Como Rodar o Backend

```bash
cd monofloor-admin

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco
npm run db:push

# Popular com dados de teste
npm run db:seed

# Iniciar servidor (dev)
npm run dev
```

### Credenciais de Teste:
- **Admin**: admin@monofloor.com.br / admin123
- **Mobile**: joao@monofloor.com.br / senha123

---

## O Que Falta Implementar

- [x] Autenticação de usuários (JWT implementado)
- [x] Banco de dados (PostgreSQL + Prisma)
- [ ] Upload de arquivos (fotos/áudio) - estrutura pronta
- [ ] Geofencing real (GPS) - validação no backend
- [ ] Notificações push
- [ ] Sistema de XP/conquistas real
- [ ] Admin Panel frontend (React/Vue)
- [ ] Integração Telegram

---

## Diretrizes de Design Monofloor

Baseado no arquivo `Prompt`, a comunicação Monofloor segue:

1. **Clareza acima de tudo** - Fácil entender a ideia central
2. **Ajudar a decidir** - Cada tela deve destravar uma ação
3. **Tom confiante, não arrogante** - Técnico mas acessível
4. **Estrutura clara** - Seções bem definidas, listas, respiro visual
5. **Frases típicas**: "Na prática, isso significa...", "Do ponto de vista técnico..."

---

## Notas das Conversas

### Sessão 1 (13/12/2024)
- Configurado sistema de memória (CLAUDE.md)
- Documentado estado atual do projeto
- App é um protótipo frontend funcional, pronto para desenvolvimento backend
- **Integração Pipefy implementada**: 30 projetos carregando do funil "EM EXECUÇÃO"
- Criado arquivo pipefy.js com funções de API GraphQL
- Tela de projetos agora carrega dados dinâmicos do Pipefy

### Sessão 2 (13/12/2024)
- **Backend completo implementado** (monofloor-admin/)
- Stack: Node.js + Express + TypeScript + Prisma + PostgreSQL
- Schema Prisma com 11 tabelas (users, projects, checkins, reports, etc.)
- Autenticação JWT implementada (admin + mobile separados)
- Workflow de aprovação de aplicadores
- Sincronização de projetos do Pipefy
- Serviços de AI (Whisper para transcrição, GPT para resumos)
- Geração de relatórios diários e por período via AI
- Seed com dados de teste

---

## Próximos Passos Sugeridos

1. Configurar PostgreSQL e rodar migrations
2. Testar API com Postman/Insomnia
3. Implementar upload de arquivos (fotos/áudio)
4. Criar Admin Panel frontend
5. Atualizar mobile app para usar API real
6. Deploy no Railway
