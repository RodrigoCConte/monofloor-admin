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

### Solicitações de Contribuição (`/api/admin/contributions`)
- `GET /` - Listar solicitações (filtros: status, paginação)
- `GET /pending-count` - Contagem de solicitações pendentes
- `POST /:id/approve` - Aprovar solicitação (adiciona usuário ao projeto)
- `POST /:id/reject` - Rejeitar solicitação

### Campanhas (`/api/admin/campaigns`)
- `GET /` - Listar campanhas (filtros: status, paginação)
- `GET /:id` - Detalhes da campanha
- `POST /` - Criar campanha
- `PUT /:id` - Atualizar campanha
- `DELETE /:id` - Deletar campanha
- `POST /:id/launch` - Lançar campanha
- `POST /:id/slides` - Adicionar slide
- `PUT /:id/slides/:slideId` - Atualizar slide
- `DELETE /:id/slides/:slideId` - Deletar slide
- `POST /:id/slides/reorder` - Reordenar slides
- `POST /upload` - Upload de mídia (imagem/vídeo)
- `POST /import` - Importar campanha (JSON)
- `GET /export/:id` - Exportar campanha

### Localização (`/api/admin/locations`)
- `GET /` - Listar localizações (filtros: projectId, onlineOnly)
- `GET /map` - Dados para visualização no mapa
- `GET /:userId` - Localização atual de um usuário
- `GET /:userId/history` - Histórico de localização (últimas N horas)

### Projetos - Funcionalidades Adicionais (`/api/admin/projects`)
- `PUT /:id/night-shift` - Configurar turno noturno
- `GET /:id/night-shift/invites` - Listar convites de turno noturno
- `POST /:id/night-shift/invites` - Enviar convites
- `DELETE /:id/night-shift/invites/:inviteId` - Cancelar convite
- `POST /:id/request-entry` - Solicitar liberação na portaria (WhatsApp)

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
- `GET /campaigns` - Listar campanhas ativas (para exibir no app)
- `POST /campaigns/:id/join` - Participar de uma campanha
- `POST /location` - Atualizar localização do usuário (real-time)
- `POST /location/offline` - Marcar usuário como offline
- `GET /projects/nearby` - Projetos próximos (por localização)
- `POST /projects/:id/request-contribution` - Solicitar para contribuir em projeto
- `POST /projects/:id/request-entry` - Solicitar liberação na portaria
- `POST /push-subscription` - Registrar para notificações push
- `POST /help-requests` - Criar solicitação de material/ajuda
- `GET /help-requests` - Listar solicitações do usuário
- `POST /transcribe` - Transcrição de áudio (Whisper)

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
12. **contribution_requests** - Solicitações para contribuir em projetos
13. **help_requests** - Solicitações de material/ajuda
14. **campaigns** - Campanhas de incentivo
15. **campaign_slides** - Slides das campanhas
16. **campaign_participants** - Participantes das campanhas
17. **night_shift_invites** - Convites para turno noturno
18. **user_locations** - Localização atual dos usuários (real-time)
19. **location_history** - Histórico de localização
20. **push_subscriptions** - Subscrições para notificações push

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

### API Keys Externas:
- **Hostinger API**: `gtBGTroy2FPgOXmhpD08ffvGOOQD6uFznQ21U6iC089f2eeb`
- **VPS Hostinger**: 72.61.56.150 (root / qS4wv19mLrB;c@rOGeX,)

---

## O Que Falta Implementar

- [x] Autenticação de usuários (JWT implementado)
- [x] Banco de dados (PostgreSQL + Prisma)
- [x] Upload de arquivos (fotos/áudio) - estrutura pronta
- [x] Geofencing real (GPS) - validação no backend
- [x] Notificações push - estrutura pronta (Service Worker implementado)
- [x] Sistema de XP/conquistas - estrutura pronta
- [x] Admin Panel frontend (Vue.js implementado)
- [x] Sistema de Campanhas - **IMPLEMENTADO** (admin cria, aparece no app)
- [x] Sistema de Localização em Tempo Real - **IMPLEMENTADO**
- [x] Sistema de Solicitações de Contribuição - **IMPLEMENTADO**
- [x] Sistema de Turno Noturno - **IMPLEMENTADO**
- [x] Sistema de Solicitações de Ajuda/Material - **IMPLEMENTADO**
- [x] Módulo Academia com Vídeos Educativos e Quizzes - **IMPLEMENTADO** (21/12/2024)
- [x] Gerenciamento de Help Requests no Admin Console - **IMPLEMENTADO**
- [x] Seleção de Pessoas no Gantt (Task Assignments) - **IMPLEMENTADO**
- [ ] Integração Telegram (estrutura pronta, não implementada)

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

### Sessão 3 (14/12/2024)
- **Correções críticas no projeto após problemas de build**:

#### Problemas Corrigidos:
1. **Seed do banco de dados** - Roles antigos (`APLICADOR_SENIOR`, `LIDER_EQUIPE`) não existiam mais
   - Corrigido para usar roles atuais: `APLICADOR`, `LIDER`, `AUXILIAR`, etc.
   - Arquivo: `monofloor-admin/prisma/seed.ts`

2. **Erros TypeScript no Admin Panel**:
   - `socket.ts` - Object possibly undefined
   - `auth.ts` - Adicionado `photoUrl` ao tipo User
   - `Contributions.vue` - Retorno da função getPhotoUrl
   - `Map.vue` - Removida função não usada, corrigido MapOptions
   - `Projects.vue` - Removido import e variável não usados

3. **Solicitação de Material no APP** (monofloor-app/app.js):
   - Token era salvo como `token` mas lido como `authToken` - **CORRIGIDO**
   - Variáveis `currentProject` e `currentProjectId` não existiam - **CORRIGIDO** para usar `selectedProject`
   - Adicionada validação de token com mensagem clara para usuário

#### Arquivos Modificados:
- `monofloor-admin/prisma/seed.ts` - Roles corrigidos
- `monofloor-admin/admin-panel/src/stores/auth.ts` - photoUrl adicionado
- `monofloor-admin/admin-panel/src/services/socket.ts` - null check
- `monofloor-admin/admin-panel/src/views/Contributions.vue` - retorno undefined
- `monofloor-admin/admin-panel/src/views/Map.vue` - função removida
- `monofloor-admin/admin-panel/src/views/Projects.vue` - imports limpos
- `monofloor-app/app.js` - token e selectedProject corrigidos

### Sessão 4+ (Atualizações Recentes - Data a confirmar)
- **Muitas funcionalidades novas implementadas**:

#### Novas Funcionalidades no Backend:

1. **Sistema de Solicitações de Contribuição** (`/api/admin/contributions`):
   - Aplicadores podem solicitar para contribuir em projetos
   - Admin pode aprovar/rejeitar solicitações
   - Notificações via Socket.io quando aprovado/rejeitado
   - Endpoints: `GET /`, `GET /pending-count`, `POST /:id/approve`, `POST /:id/reject`

2. **Sistema de Campanhas** (`/api/admin/campaigns`):
   - Campanhas de incentivo com banner (vídeo/imagem)
   - Slides informativos
   - Bonus de XP e multiplicadores
   - Status: DRAFT, SCHEDULED, ACTIVE, ENDED, CANCELLED
   - Upload de mídia (imagens/vídeos até 100MB)
   - Import/Export de campanhas
   - Endpoints completos para CRUD, slides, launch, etc.

3. **Sistema de Localização em Tempo Real** (`/api/admin/locations`):
   - Rastreamento de localização dos aplicadores
   - Histórico de localização
   - Detecção de aplicadores online (últimos 5 minutos)
   - Dados de mapa para visualização
   - Geofencing (detecção se está fora da área do projeto)
   - Endpoints: `GET /`, `GET /map`, `GET /:userId`, `GET /:userId/history`

4. **Sistema de Turno Noturno** (Night Shift):
   - Configuração de turnos noturnos por projeto
   - Convites para aplicadores
   - Controle de vagas (slots)
   - Período de vigência (startDate/endDate)
   - Endpoints em `/api/admin/projects/:id/night-shift`

5. **Sistema de Solicitação de Entrada** (Entry Request):
   - Solicitação de liberação na portaria
   - Envio de WhatsApp para telefones responsáveis
   - Endpoint: `POST /api/admin/projects/:id/request-entry`

6. **Sistema de Solicitações de Ajuda/Material** (Help Requests):
   - Solicitações de material ou ajuda
   - Suporte a áudio e vídeo
   - Transcrição de áudio via AI
   - Status: PENDING, IN_PROGRESS, RESOLVED, CANCELLED

#### Novas Tabelas no Banco de Dados:
- `contribution_requests` - Solicitações para contribuir em projetos
- `help_requests` - Solicitações de material/ajuda
- `campaigns` - Campanhas de incentivo
- `campaign_slides` - Slides das campanhas
- `campaign_participants` - Participantes das campanhas
- `night_shift_invites` - Convites para turno noturno
- `user_locations` - Localização atual dos usuários
- `location_history` - Histórico de localização

#### Novas Views no Admin Panel:
- **Contributions.vue** - Gerenciamento de solicitações de contribuição
- **Campaigns.vue** - Gerenciamento completo de campanhas
- **Map.vue** - Visualização de localização em tempo real

#### Mudanças na Configuração:
- Backend agora roda na porta **3001** (padrão, configurável via PORT)
- API URL padrão: `https://devoted-wholeness-production.up.railway.app` (produção)

#### Como Rodar (Estado Atual):
```bash
# Terminal 1 - Backend API
cd monofloor-admin && npm run dev
# Roda em http://localhost:3000 (ou porta configurada via PORT, padrão 3001)

# Terminal 2 - Admin Panel (Vue)
cd monofloor-admin/admin-panel && npm run dev
# Roda em http://localhost:5173 ou 5174

# Terminal 3 - APP Mobile (Frontend puro)
# IMPORTANTE: Acessar diretamente via arquivo index.html
# Abrir no navegador: file:///caminho/para/monofloor-app/index.html
# OU usar um servidor local simples que sirva o arquivo diretamente
# 
# NÃO usar: npx serve -p 8080 (pode causar problemas com Service Worker e campanhas)
# 
# Motivo: O sistema de campanhas e Service Worker funcionam melhor quando acessado
# diretamente via arquivo index.html, garantindo funcionamento correto das funcionalidades
```

#### Credenciais de Teste:
- **Admin Panel**: admin@monofloor.com.br / admin123
- **APP Mobile**: joao@monofloor.com.br / senha123

#### Sistema de Campanhas no APP Mobile:
- **Implementado**: Sistema completo de campanhas no app mobile
- **Funcionalidade**: Admin Panel cria campanhas → aparecem automaticamente no app mobile
- **Características**:
  - Banner principal (vídeo ou imagem)
  - Slides informativos adicionais
  - Contador de participantes
  - Navegação entre slides
  - Participação na campanha
  - Cache de campanhas já visualizadas
- **API Endpoint**: `GET /api/mobile/campaigns` - Busca campanhas ativas
- **API Endpoint**: `POST /api/mobile/campaigns/:id/join` - Participar de campanha
- **Acesso**: App deve ser acessado via `index.html` diretamente (não via localhost:8080)
  - Motivo: Service Worker e funcionalidades de campanha funcionam melhor com acesso direto ao arquivo
  - Abrir: `file:///caminho/para/monofloor-app/index.html` no navegador

### Sessão 5 (21/12/2024) - Módulo Academia e Correções

#### 1. Módulo Academia com Vídeos Educativos e Quizzes

**Novas Tabelas no Prisma Schema:**
- `educational_videos` - Vídeos educativos (título, descrição, URL, categoria, nível, XP)
- `video_quizzes` - Questionários vinculados aos vídeos
- `quiz_questions` - Perguntas dos quizzes (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE)
- `quiz_answers` - Respostas/opções das perguntas
- `video_progress` - Progresso do usuário no vídeo (assistido, completado)
- `quiz_attempts` - Tentativas do usuário no quiz (score, passed, xpEarned)

**Enums Adicionados:**
- `VideoCategory`: TECNICA, SEGURANCA, PRODUTO, ATENDIMENTO, GERAL
- `VideoLevel`: INICIANTE, INTERMEDIARIO, AVANCADO
- `QuestionType`: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE
- `XpTransactionType`: adicionado `QUIZ_PASSED`

**Novos Endpoints Admin** (`/api/admin/academy`):
- `GET /videos` - Listar vídeos (filtros: category, level, isActive)
- `GET /videos/:id` - Detalhes do vídeo com quiz
- `POST /videos` - Criar vídeo
- `PUT /videos/:id` - Atualizar vídeo
- `DELETE /videos/:id` - Excluir vídeo
- `POST /videos/:id/publish` - Publicar vídeo
- `POST /videos/upload` - Upload de vídeo
- `GET /videos/:id/stats` - Estatísticas (views, completions, quiz pass rate)
- `POST /videos/:id/quiz` - Criar/atualizar quiz
- `GET /videos/:id/quiz` - Obter quiz completo (com respostas corretas)
- `DELETE /videos/:id/quiz` - Excluir quiz

**Novos Endpoints Mobile** (`/api/mobile/academy`):
- `GET /videos` - Listar vídeos (com progresso do usuário)
- `GET /videos/:id` - Detalhes do vídeo
- `POST /videos/:id/progress` - Atualizar progresso
- `POST /videos/:id/complete` - Marcar como completo
- `GET /videos/:id/quiz` - Obter quiz (sem respostas corretas)
- `POST /videos/:id/quiz/submit` - Submeter respostas
- `GET /stats` - Estatísticas do usuário

**Nova View Admin Panel:**
- `Academy.vue` - Gerenciamento completo de vídeos e quizzes
  - Listagem com filtros por categoria e nível
  - Upload de vídeo
  - Criação de quiz com perguntas e respostas
  - Estatísticas de visualização e aprovação

**Arquivos Criados:**
- `monofloor-admin/src/routes/admin/academy.routes.ts`
- `monofloor-admin/admin-panel/src/views/Academy.vue`

#### 2. Gerenciamento de Help Requests no Admin Console

**Novos Endpoints Admin** (`/api/admin/help-requests`):
- `GET /` - Listar solicitações (filtros: status, type)
- `GET /pending-count` - Contagem de pendentes
- `GET /:id` - Detalhes com mídia
- `PUT /:id` - Atualizar status
- `POST /:id/resolve` - Resolver com notas

**Nova View Admin Panel:**
- `HelpRequests.vue` - Gerenciamento de solicitações de ajuda/material
  - Tabs: PENDING, IN_PROGRESS, RESOLVED, CANCELLED
  - Player de áudio/vídeo
  - Transcrição do áudio (Whisper)
  - Ações: Em progresso, Resolver, Cancelar

**Arquivos Criados:**
- `monofloor-admin/src/routes/admin/help-requests.routes.ts`
- `monofloor-admin/admin-panel/src/views/HelpRequests.vue`

#### 3. Seleção de Pessoas no Gantt (Task Assignments)

**Nova Tabela Prisma:**
```prisma
model TaskAssignment {
  id            String      @id @default(uuid())
  projectTaskId String
  projectTask   ProjectTask @relation(...)
  userId        String
  user          User        @relation(...)
  assignedAt    DateTime    @default(now())
  @@unique([projectTaskId, userId])
  @@map("task_assignments")
}
```

**Novos Endpoints** (`/api/admin/projects/:projectId/tasks`):
- `GET /:taskId/assignments` - Listar usuários atribuídos
- `PUT /:taskId/assignments` - Atualizar atribuições (array de userIds)
- `POST /bulk-assignments` - Atribuição em lote para múltiplas tarefas

**UI no ProjectDetail.vue:**
- Dropdown substituído por seletor multi-select
- Modal com busca de aplicadores
- Preview de avatares selecionados
- Opção "Aplicar para tarefas abaixo"

#### 4. Correção: Liberação na Portaria (Entry Request)

**Problema:** Mobile enviava apenas o contato do aplicador individual
**Solução:** Agora envia TODOS os membros ativos do projeto

**Arquivo Modificado:** `monofloor-admin/src/routes/mobile/index.ts` (linhas 2294-2383)
```typescript
// Antes: Apenas 1 pessoa
applicators: [{ name: user.name, cpf, phone, role }]

// Depois: Todos os membros do projeto
const teamMembers = await prisma.projectAssignment.findMany({
  where: { projectId, isActive: true },
  include: { user: { select: { name, cpf, phone } } }
});
applicators: teamMembers.map(m => ({ name, cpf, phone, role }))
```

#### 5. Navegação Admin Panel

**Link "Academia" adicionado em todas as views:**
- Dashboard.vue
- Campaigns.vue
- Badges.vue
- Applicators.vue
- Projects.vue
- Map.vue
- HelpRequests.vue
- ProjectDetail.vue
- Contributions.vue

**Padrão de navegação:**
```html
<router-link to="/academy" class="nav-link">
  <svg class="nav-icon" viewBox="0 0 24 24" ...>
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
  Academia
</router-link>
```

#### 6. Router Atualizado

**Novas rotas em** `admin-panel/src/router/index.ts`:
```typescript
{ path: '/help-requests', name: 'HelpRequests', component: () => import('../views/HelpRequests.vue') }
{ path: '/academy', name: 'Academy', component: () => import('../views/Academy.vue') }
```

#### 7. API Index Atualizado

**Novos métodos em** `admin-panel/src/api/index.ts`:
```typescript
export const helpRequestsApi = {
  getAll, getPendingCount, getById, updateStatus, resolve
};

export const academyApi = {
  getVideos, getVideo, createVideo, updateVideo, deleteVideo,
  publishVideo, uploadVideo, getStats, getQuiz, saveQuiz, deleteQuiz
};
```

#### Arquivos Modificados nesta Sessão:
- `prisma/schema.prisma` - Novos models Academia + TaskAssignment
- `src/routes/admin/index.ts` - Registrar novas rotas
- `src/routes/admin/academy.routes.ts` - **NOVO**
- `src/routes/admin/help-requests.routes.ts` - **NOVO**
- `src/routes/admin/tasks.routes.ts` - Endpoints de assignments
- `src/routes/mobile/index.ts` - Fix entry request
- `admin-panel/src/api/index.ts` - Novos API clients
- `admin-panel/src/router/index.ts` - Novas rotas
- `admin-panel/src/views/Academy.vue` - **NOVO**
- `admin-panel/src/views/HelpRequests.vue` - **NOVO**
- `admin-panel/src/views/*.vue` - Link Academia no nav (9 arquivos)

---

## Assets de Branding

Arquivos de identidade visual salvos em `monofloor-admin/public/branding/`:

| Arquivo | Descrição | Uso |
|---------|-----------|-----|
| `Capa Proposta de investimento.001.jpeg` | Capa da proposta com foto de ambiente e logo | Thumbnail/OG Image para compartilhamento WhatsApp |
| `Simbolo Icone Ajustado Final.png` | Símbolo Monofloor (ondas em preto) | Ícone/favicon |

**OG Image para Propostas HTML:**
- Arquivo: `monofloor-admin/public/og-image.jpg` (cópia da capa)
- URL produção: `https://propostas.monofloor.cloud/og-image.jpg`
- Descrição OG: "Um piso sem juntas é um caminho sem volta."

---

## Próximos Passos Sugeridos

1. ~~Configurar PostgreSQL e rodar migrations~~ ✅
2. ~~Testar API com Postman/Insomnia~~ ✅
3. Implementar upload de arquivos (fotos/áudio) - estrutura pronta
4. ~~Criar Admin Panel frontend~~ ✅ (Vue.js implementado)
5. ~~Atualizar mobile app para usar API real~~ ✅
6. Deploy no Railway ✅ (deployed)
7. ~~Testar fluxo completo de solicitação de material/ajuda~~ ✅
8. **Melhorar design do módulo Academia** (usando plugin frontend-design)
9. Implementar tela de Academia no app mobile (vídeos + quizzes)
