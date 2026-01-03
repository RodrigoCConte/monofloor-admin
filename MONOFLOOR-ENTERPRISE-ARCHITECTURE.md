# MONOFLOOR ENTERPRISE - Arquitetura Unificada

## Resumo Executivo

Este documento descreve a arquitetura para unificar os sistemas Pipedrive, Pipefy e Monofloor App em uma plataforma única de gestão empresarial, cobrindo todo o ciclo de vida do projeto: desde a captação do lead até o pós-venda.

---

## 1. Análise dos Sistemas Atuais

### 1.1 Pipedrive (CRM - Comercial)
**Total de Deals Ativos**: ~50+ negócios em andamento
**Pipeline Principal**: 21 etapas

| Stage ID | Nome | Ordem |
|----------|------|-------|
| 1 | Form Orçamento | 0 |
| 2 | 1º Contato | 1 |
| 70 | Proposta Escopo Minimo | 2 |
| 68 | 1º Contato Feito | 3 |
| 62 | Follow 1º Contato | 4 |
| 69 | Follow 1º Contato Feito | 5 |
| 60 | Form Arquiteto | 6 |
| 58 | Contato Arquiteto | 7 |
| 3 | Cálculo de Projeto | 8 |
| 43 | Projeto levantado | 9 |
| 52 | Cálculo Deslocamento | 10 |
| 53 | Deslocamento Levantado | 11 |
| 4 | Proposta enviada | 12 |
| 59-67 | Follows 1, 2, 3 | 13-18 |
| 5 | Negociações | 19 |
| 17 | Perdido | 20 |

**Campos Personalizados Importantes**:
- `Resumo` (text)
- `Metragem estimada` (text)
- `Tipo de cliente` (set)
- `Tipo de projeto` (set)
- `Cidade de execução` (set)
- `Budget estimado` (varchar)
- `Estado de obra` (set)
- `Data prevista de execução` (varchar)
- `Nome do escritório/Empresa` (varchar)
- `Telefone Z-API` (varchar) - para automações WhatsApp

### 1.2 Pipefy OPERAÇÕES (Principal)
**Total de Cards**: 494
**Fases**: 27 etapas

| Fase | Cards | Descrição |
|------|-------|-----------|
| ENTRADA | 5 | Entrada inicial do projeto |
| EM CONTRATO | 5 | Em fase de contrato |
| 1º CONTATO OP. | 8 | Primeiro contato operacional |
| AGEND. VT - AFERIÇÃO/ORIENTAÇÃO | 41 | Agendar visita técnica |
| RESULTADO VT - AFERIÇÃO/ORIENTAÇÃO | 8 | Resultado da visita |
| PROJETOS - 1ª REVISÃO | 4 | Revisão inicial do projeto |
| CONFIRMAÇÕES OP 1 | 5 | Confirmações operacionais |
| DATA À DEFINIR | 0 | Data pendente |
| AGEND. VT - ACOMPANHAMENTO | 1 | Agendar acompanhamento |
| CONFIRMAÇÕES OP 2 | 1 | Segunda confirmação |
| REVISÃO FINAL OP | 1 | Revisão final |
| AGUARDANDO LIBERAÇÃO | 13 | Aguardando liberação |
| INDÚSTRIA - EM PRODUÇÃO | 4 | Material em produção |
| AGEND. VT - ENTRADA | 5 | Agendar visita de entrada |
| RESULTADO VT - ENTRADA | 11 | Resultado visita entrada |
| EQUIPE DE EXECUÇÃO | 5 | Designar equipe |
| INFORMAÇÕES LOGÍSTICAS | 5 | Info logística |
| LOGÍSTICA - EM ENTREGA | 9 | Material em entrega |
| LOGÍSTICA - MATERIAL ENTREGUE | 8 | Material entregue |
| **OBRA EM EXECUÇÃO** | 30 | **Execução ativa** |
| OBRA PAUSADA | 15 | Obra pausada |
| OBRA CONCLUÍDA | 2 | Obra finalizada |
| LOGÍSTICA - COLETAR | 4 | Aguardando coleta |
| LOGÍSTICA - EM COLETA | 15 | Em processo de coleta |
| CLIENTE FINALIZADO | 289 | Histórico completo |

**Campos do Formulário Inicial**:
- CONSULTOR OPERACIONAL, ATENDIMENTO, PROJETOS
- NOME DO PROJETO, ENDEREÇO
- M² TOTAL, LINEAR TOTAL
- DATA DE ENTRADA, PRAZO
- EQUIPE DE EXECUÇÃO
- CLASSIFICAÇÃO DA SUPERFÍCIE (Piso, Parede, etc)
- CORES, MATERIAL
- ESCOPO INICIAL, ESCOPO APROVADO
- OBRA TELADA?, OBRA FASEADA?
- NÚMERO OS (indústria)

### 1.3 Pipefy PÓS-VENDA
**Total de Cards**: 186
**Fases**: 24 etapas (similar a OPERAÇÕES)

**Diferencial**: Campo `MOTIVO DO ACIONAMENTO` para rastrear por que o cliente retornou.

### 1.4 Pipefy COMERCIAL (Subutilizado)
**Total de Cards**: 647
- 643 cards parados em "Formulário preenchido"
- Indica duplicação com Pipedrive, não está sendo usado ativamente

### 1.5 Monofloor App (Existente)
- Check-in/check-out por geolocalização
- Relatórios diários com áudio e fotos
- Controle de horas trabalhadas
- Gestão de equipes
- Academia com vídeos educativos

---

## 2. Arquitetura Proposta

### 2.1 Visão Geral dos Módulos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONOFLOOR ENTERPRISE                                 │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│  COMERCIAL  │    PIUI     │ PLANEJAMENTO│  EXECUÇÃO   │     PÓS-VENDA       │
│  (Vendas)   │ (Contratos) │  (Preparo)  │   (Obra)    │    (Suporte)        │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────────────────┤
│                           PROJETOS (Hub Central)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        AUTOMAÇÕES E INTEGRAÇÕES                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Módulo COMERCIAL

**Fonte de Dados**: Pipedrive (sincronização bidirecional)
**Responsabilidade**: Captação de leads e fechamento de vendas

**Funcionalidades**:
1. **Dashboard de Vendas**
   - Funil visual com todas as etapas
   - Métricas: leads novos, conversão, valor médio
   - Previsão de faturamento

2. **Gestão de Leads**
   - Importar todos os leads do Pipedrive
   - Formulário de novo lead
   - Histórico de interações

3. **Proposta Comercial**
   - Gerador de propostas
   - Templates por tipo de projeto
   - Cálculo automático (m² x preço)

4. **Follow-ups Automatizados**
   - Lembretes de follow-up
   - Envio WhatsApp (Z-API)
   - Email automático

**Etapas do Funil Comercial**:
```
Lead Novo → 1º Contato → Levantamento → Proposta → Follow-ups → Negociação → GANHO/PERDIDO
```

**Trigger para PIUI**: Quando deal é marcado como GANHO

### 2.3 Módulo PIUI (Contratos)

**Responsabilidade**: Gestão de contratos e início formal do projeto

**Funcionalidades**:
1. **Criação de Contrato**
   - Dados importados do Comercial
   - Upload de documentos
   - Assinatura digital (integração DocuSign/ClickSign)

2. **Escopo do Projeto**
   - Detalhamento de áreas (m² piso, parede, rodapé)
   - Especificação de cores e materiais
   - Definição de faseamento

3. **Aprovações**
   - Workflow de aprovação interna
   - Aprovação do cliente
   - Checklist de documentos

4. **Financeiro**
   - Forma de pagamento
   - Parcelas e vencimentos
   - Integração com faturamento

**Trigger para PLANEJAMENTO**: Quando contrato é aprovado

### 2.4 Módulo PLANEJAMENTO

**Responsabilidade**: Preparação técnica e logística antes da execução

**Funcionalidades**:
1. **Visitas Técnicas**
   - Agendamento de VTs (Aferição, Orientação, Acompanhamento, Entrada)
   - Relatório de visita com fotos
   - Aprovação de resultados

2. **Projetos Técnicos**
   - Revisão de escopo
   - Desenhos e plantas
   - Aprovação de cores e materiais

3. **Indústria**
   - Ordem de Serviço (OS)
   - Status de produção
   - Previsão de entrega

4. **Logística**
   - Agendamento de entrega
   - Tracking de material
   - Confirmação de recebimento

5. **Equipe**
   - Designação de equipe
   - Convites para turno noturno
   - Confirmação de disponibilidade

**Trigger para EXECUÇÃO**: Material entregue + Equipe confirmada

### 2.5 Módulo EXECUÇÃO (Existente - Aprimorado)

**Responsabilidade**: Acompanhamento em tempo real da obra

**Funcionalidades Existentes**:
- Check-in/check-out com geofencing
- Relatórios diários (áudio + fotos)
- Controle de horas
- Localização em tempo real
- Solicitações de material/ajuda

**Novas Funcionalidades**:
1. **Progresso Visual**
   - Foto before/after por área
   - Percentual de conclusão por etapa
   - Galeria de evolução

2. **Gantt da Obra**
   - Cronograma visual
   - Tarefas atribuídas
   - Alertas de atraso

3. **Integração com Planejamento**
   - Receber materiais pendentes
   - Solicitar VT de acompanhamento
   - Reportar pausas

4. **Qualidade**
   - Checklist de qualidade por etapa
   - Fotos obrigatórias em pontos críticos
   - Aprovação do líder

**Trigger para PÓS-VENDA**: Obra concluída + Checkout final

### 2.6 Módulo PÓS-VENDA

**Responsabilidade**: Suporte pós-entrega e garantia

**Funcionalidades**:
1. **Acionamento**
   - Registro de chamado
   - Classificação do motivo
   - Priorização

2. **Visita de Qualidade**
   - Agendamento
   - Checklist de verificação
   - Relatório de condições

3. **Intervenção**
   - Workflow similar a PLANEJAMENTO
   - Escopo de correção
   - Equipe designada

4. **Histórico**
   - Todas as intervenções
   - Custo total de garantia
   - Análise de causas

### 2.7 Módulo PROJETOS (Hub Central)

**Responsabilidade**: Visão 360° de cada projeto

**Funcionalidades**:
1. **Dashboard do Projeto**
   - Status atual (em qual módulo)
   - Timeline completa
   - Próximas ações

2. **Informações do Projeto**
   - Dados do cliente
   - Endereço e contatos
   - Arquiteto/Engenheiro

3. **Áreas e Especificações**
   - M² por tipo (piso, parede, rodapé)
   - Cores e materiais
   - Fotos do escopo

4. **Galeria de Vídeos**
   - Vídeos da visita inicial
   - Vídeos durante execução
   - Vídeo de entrega

5. **Documentos**
   - Contrato
   - Escopos aprovados
   - Relatórios de visita

6. **Equipe**
   - Quem participou da execução
   - Horas trabalhadas
   - Avaliações

---

## 3. Modelo de Dados Unificado

### 3.1 Entidade Central: Project

```prisma
model Project {
  id                String   @id @default(uuid())

  // Identificadores externos
  pipedriveDealId   String?  @unique @map("pipedrive_deal_id")
  pipefyCardId      String?  @unique @map("pipefy_card_id")

  // Status global
  currentModule     ProjectModule @default(COMERCIAL)
  status            ProjectStatus @default(ACTIVE)

  // Dados básicos
  cliente           String
  endereco          String?
  cidade            String?
  estado            String?
  cep               String?
  latitude          Decimal?
  longitude         Decimal?

  // Contatos
  telefoneCliente   String?
  emailCliente      String?
  telefonePortaria  String[]

  // Arquiteto/Engenheiro
  arquiteto         String?
  escritorio        String?
  telefoneArquiteto String?

  // Especificações
  m2Total           Decimal?
  m2Piso            Decimal?
  m2Parede          Decimal?
  m2Rodape          Decimal?
  linearTotal       Decimal?

  cores             String[]   // Array de cores
  materiais         String[]   // Array de materiais
  classificacao     String[]   // Classificação da superfície

  // Faseamento
  isFaseada         Boolean    @default(false)
  detalheFaseamento String?
  isTelada          Boolean    @default(false)
  detalheTela       String?

  // Datas
  dataEntradaEstimada DateTime?
  dataEntradaReal     DateTime?
  dataConclusao       DateTime?
  prazo               Int?       // Em dias

  // Financeiro
  valorTotal        Decimal?
  formaPagamento    String?

  // Indústria
  numeroOS          String?

  // Relacionamentos
  comercial         ComercialData?
  contrato          Contrato?
  planejamento      Planejamento?
  execucao          Execucao?
  posVenda          PosVenda[]

  // Equipe
  assignments       ProjectAssignment[]

  // Histórico
  timeline          TimelineEvent[]
  documents         ProjectDocument[]
  videos            ProjectVideo[]

  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@map("projects")
}

enum ProjectModule {
  COMERCIAL
  PIUI
  PLANEJAMENTO
  EXECUCAO
  POS_VENDA
  FINALIZADO
}

enum ProjectStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
  LOST
}
```

### 3.2 Módulo Comercial

```prisma
model ComercialData {
  id              String   @id @default(uuid())
  projectId       String   @unique @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  // Dados do Pipedrive
  pipedriveDealId String?
  stageId         Int?
  stageName       String?

  // Lead
  origem          String?   // Formulário, Indicação, etc
  tipoCliente     String?   // Final, Arquiteto, Empresa
  tipoProjetoEst  String?   // Residencial, Comercial
  budgetEstimado  Decimal?

  // Propostas
  propostas       Proposta[]

  // Follow-ups
  followUps       FollowUp[]

  // Status
  status          ComercialStatus @default(LEAD)
  motivoPerda     String?
  dataGanho       DateTime?
  dataPerda       DateTime?

  consultorId     String?
  consultor       AdminUser? @relation(fields: [consultorId], references: [id])

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@map("comercial_data")
}

enum ComercialStatus {
  LEAD
  PRIMEIRO_CONTATO
  LEVANTAMENTO
  PROPOSTA_ENVIADA
  FOLLOW_UP
  NEGOCIACAO
  GANHO
  PERDIDO
}

model Proposta {
  id              String   @id @default(uuid())
  comercialId     String   @map("comercial_id")
  comercial       ComercialData @relation(fields: [comercialId], references: [id])

  versao          Int      @default(1)
  valorTotal      Decimal
  descricao       String?
  documentoUrl    String?

  status          PropostaStatus @default(DRAFT)
  enviadaEm       DateTime?
  aprovadaEm      DateTime?

  createdAt       DateTime @default(now())

  @@map("propostas")
}

enum PropostaStatus {
  DRAFT
  ENVIADA
  APROVADA
  RECUSADA
}

model FollowUp {
  id              String   @id @default(uuid())
  comercialId     String   @map("comercial_id")
  comercial       ComercialData @relation(fields: [comercialId], references: [id])

  tipo            String   // EMAIL, WHATSAPP, LIGACAO
  mensagem        String?
  resultado       String?

  agendadoPara    DateTime?
  realizadoEm     DateTime?

  createdAt       DateTime @default(now())

  @@map("follow_ups")
}
```

### 3.3 Módulo PIUI (Contratos)

```prisma
model Contrato {
  id              String   @id @default(uuid())
  projectId       String   @unique @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  // Dados do contrato
  numero          String?  @unique
  valorContratado Decimal
  formaPagamento  String?

  // Escopo
  escopoInicial   String?  // URL do documento
  escopoAprovado  String?  // URL do documento

  // Aprovações
  aprovadoInternamente Boolean @default(false)
  aprovadoCliente      Boolean @default(false)

  dataAprovacaoInterna DateTime?
  dataAprovacaoCliente DateTime?

  // Status
  status          ContratoStatus @default(DRAFT)

  // Responsáveis
  consultorContratoId String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Parcelas
  parcelas        Parcela[]

  @@map("contratos")
}

enum ContratoStatus {
  DRAFT
  AGUARDANDO_APROVACAO
  APROVADO
  ASSINADO
  CANCELADO
}

model Parcela {
  id              String   @id @default(uuid())
  contratoId      String   @map("contrato_id")
  contrato        Contrato @relation(fields: [contratoId], references: [id])

  numero          Int
  valor           Decimal
  vencimento      DateTime
  pago            Boolean  @default(false)
  dataPagamento   DateTime?

  @@map("parcelas")
}
```

### 3.4 Módulo Planejamento

```prisma
model Planejamento {
  id              String   @id @default(uuid())
  projectId       String   @unique @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  // Status geral
  status          PlanejamentoStatus @default(AGUARDANDO_VT)

  // Responsáveis
  consultorOperacionalId String?
  consultorProjetosId    String?

  // Visitas Técnicas
  visitasTecnicas VisitaTecnica[]

  // Indústria
  ordemServico    OrdemServico?

  // Logística
  logistica       Logistica?

  // Equipe definida
  equipeDefinida  Boolean @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("planejamentos")
}

enum PlanejamentoStatus {
  AGUARDANDO_VT
  VT_AGENDADA
  VT_REALIZADA
  PROJETO_EM_REVISAO
  CONFIRMACOES
  AGUARDANDO_LIBERACAO
  INDUSTRIA
  LOGISTICA
  PRONTO_EXECUCAO
}

model VisitaTecnica {
  id              String   @id @default(uuid())
  planejamentoId  String   @map("planejamento_id")
  planejamento    Planejamento @relation(fields: [planejamentoId], references: [id])

  tipo            TipoVisita
  status          VisitaStatus @default(AGENDADA)

  dataAgendada    DateTime?
  dataRealizada   DateTime?

  observacoes     String?
  relatorio       String?  // URL do relatório
  fotos           String[] // URLs das fotos

  realizadaPorId  String?

  createdAt       DateTime @default(now())

  @@map("visitas_tecnicas")
}

enum TipoVisita {
  AFERICAO
  ORIENTACAO
  ACOMPANHAMENTO
  ENTRADA
  QUALIDADE
}

enum VisitaStatus {
  AGENDADA
  REALIZADA
  CANCELADA
}

model OrdemServico {
  id              String   @id @default(uuid())
  planejamentoId  String   @unique @map("planejamento_id")
  planejamento    Planejamento @relation(fields: [planejamentoId], references: [id])

  numero          String   @unique
  status          OSStatus @default(AGUARDANDO)

  dataEnvio       DateTime?
  dataPrevisao    DateTime?
  dataConclusao   DateTime?

  observacoes     String?

  @@map("ordens_servico")
}

enum OSStatus {
  AGUARDANDO
  EM_PRODUCAO
  CONCLUIDA
  CANCELADA
}

model Logistica {
  id              String   @id @default(uuid())
  planejamentoId  String   @unique @map("planejamento_id")
  planejamento    Planejamento @relation(fields: [planejamentoId], references: [id])

  // Entrega
  dataEntregaAgendada DateTime?
  dataEntregaRealizada DateTime?
  entregaConfirmada   Boolean @default(false)

  // Coleta
  dataColetaAgendada  DateTime?
  dataColetaRealizada DateTime?
  coletaConfirmada    Boolean @default(false)

  observacoes     String?

  status          LogisticaStatus @default(AGUARDANDO)

  @@map("logisticas")
}

enum LogisticaStatus {
  AGUARDANDO
  ENTREGA_AGENDADA
  EM_ENTREGA
  ENTREGUE
  COLETA_AGENDADA
  EM_COLETA
  COLETADO
}
```

### 3.5 Módulo Execução

```prisma
model Execucao {
  id              String   @id @default(uuid())
  projectId       String   @unique @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  status          ExecucaoStatus @default(AGUARDANDO)

  dataInicio      DateTime?
  dataFim         DateTime?

  // Progresso
  m2Executado     Decimal  @default(0)
  percentual      Decimal  @default(0)

  // Relacionamentos existentes
  checkins        Checkin[]
  reports         Report[]

  // Novo: Etapas da obra
  etapas          EtapaExecucao[]

  // Novo: Checklists de qualidade
  checklists      ChecklistQualidade[]

  @@map("execucoes")
}

enum ExecucaoStatus {
  AGUARDANDO
  EM_ANDAMENTO
  PAUSADA
  CONCLUIDA
}

model EtapaExecucao {
  id              String   @id @default(uuid())
  execucaoId      String   @map("execucao_id")
  execucao        Execucao @relation(fields: [execucaoId], references: [id])

  nome            String
  ordem           Int

  m2Estimado      Decimal?
  m2Executado     Decimal  @default(0)

  status          EtapaStatus @default(PENDENTE)

  dataInicio      DateTime?
  dataFim         DateTime?

  fotoBefore      String?
  fotoAfter       String?

  @@map("etapas_execucao")
}

enum EtapaStatus {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDA
  PAUSADA
}

model ChecklistQualidade {
  id              String   @id @default(uuid())
  execucaoId      String   @map("execucao_id")
  execucao        Execucao @relation(fields: [execucaoId], references: [id])

  etapa           String
  items           Json     // Array de items com check

  aprovado        Boolean  @default(false)
  aprovadoPorId   String?
  aprovadoEm      DateTime?

  observacoes     String?
  fotos           String[]

  createdAt       DateTime @default(now())

  @@map("checklists_qualidade")
}
```

### 3.6 Módulo Pós-Venda

```prisma
model PosVenda {
  id              String   @id @default(uuid())
  projectId       String   @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  // Acionamento
  dataAcionamento DateTime @default(now())
  motivoAcionamento String
  prioridade      Prioridade @default(MEDIA)

  // Status
  status          PosVendaStatus @default(ABERTO)

  // Visita de qualidade
  visitaQualidade VisitaTecnica?

  // Intervenção (se necessária)
  intervencao     Intervencao?

  // Resolução
  dataResolucao   DateTime?
  observacoesFinais String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("pos_vendas")
}

enum PosVendaStatus {
  ABERTO
  VISITA_AGENDADA
  EM_ANALISE
  INTERVENCAO_NECESSARIA
  EM_INTERVENCAO
  RESOLVIDO
  CANCELADO
}

enum Prioridade {
  BAIXA
  MEDIA
  ALTA
  URGENTE
}

model Intervencao {
  id              String   @id @default(uuid())
  posVendaId      String   @unique @map("pos_venda_id")
  posVenda        PosVenda @relation(fields: [posVendaId], references: [id])

  descricao       String
  m2Intervencao   Decimal?

  // Usa estrutura similar ao planejamento
  status          IntervencaoStatus @default(PLANEJANDO)

  dataInicio      DateTime?
  dataFim         DateTime?

  custoEstimado   Decimal?
  custoReal       Decimal?

  @@map("intervencoes")
}

enum IntervencaoStatus {
  PLANEJANDO
  AGUARDANDO_MATERIAL
  EM_EXECUCAO
  CONCLUIDA
}
```

### 3.7 Timeline e Histórico

```prisma
model TimelineEvent {
  id              String   @id @default(uuid())
  projectId       String   @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  modulo          ProjectModule
  tipo            String   // STATUS_CHANGE, VT_AGENDADA, PROPOSTA_ENVIADA, etc
  descricao       String

  dadosAnteriores Json?
  dadosNovos      Json?

  userId          String?
  userName        String?

  createdAt       DateTime @default(now())

  @@index([projectId, createdAt])
  @@map("timeline_events")
}

model ProjectVideo {
  id              String   @id @default(uuid())
  projectId       String   @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  titulo          String
  descricao       String?
  url             String
  thumbnail       String?

  tipo            VideoTipo
  fase            ProjectModule

  createdAt       DateTime @default(now())

  @@map("project_videos")
}

enum VideoTipo {
  VISITA_INICIAL
  DURANTE_EXECUCAO
  ENTREGA
  POS_VENDA
  OUTRO
}
```

---

## 4. Automações

### 4.1 Pipedrive → Sistema

| Trigger | Ação |
|---------|------|
| Novo Deal criado | Criar registro em `comercial_data` |
| Deal movido de stage | Atualizar status comercial |
| Deal GANHO | Criar Projeto + Contrato (PIUI) |
| Deal PERDIDO | Atualizar status e motivo |
| Campo atualizado | Sincronizar dados do projeto |

### 4.2 Sistema → Pipedrive

| Trigger | Ação |
|---------|------|
| Proposta aprovada | Mover deal para "Negociações" |
| Follow-up realizado | Criar atividade no Pipedrive |
| Contrato assinado | Marcar deal como GANHO |

### 4.3 Transições entre Módulos

| De | Para | Trigger |
|----|------|---------|
| COMERCIAL | PIUI | Deal marcado como GANHO |
| PIUI | PLANEJAMENTO | Contrato aprovado e assinado |
| PLANEJAMENTO | EXECUÇÃO | Material entregue + Equipe confirmada |
| EXECUÇÃO | FINALIZADO | Obra concluída + Checkout |
| FINALIZADO | PÓS-VENDA | Cliente aciona suporte |

### 4.4 Notificações Automáticas

| Evento | Destinatários | Canal |
|--------|---------------|-------|
| Nova proposta | Cliente | Email + WhatsApp |
| VT agendada | Cliente + Consultor | Push + Email |
| Material em entrega | Equipe + Cliente | Push + WhatsApp |
| Check-in realizado | Admin | Push |
| Obra concluída | Admin + Cliente | Push + Email |
| Pós-venda aberto | Operacional | Push |

---

## 5. Integrações Técnicas

### 5.1 Pipedrive API

```typescript
// Sync service
class PipedriveSync {
  // Webhook receiver
  async handleWebhook(event: PipedriveEvent) {
    switch (event.event) {
      case 'added.deal':
        await this.createComercialFromDeal(event.current);
        break;
      case 'updated.deal':
        await this.updateComercialFromDeal(event.current, event.previous);
        break;
      case 'merged.deal':
        await this.handleMergedDeal(event);
        break;
    }
  }

  // Bidirectional sync
  async syncDealToProject(dealId: number) {
    const deal = await pipedrive.getDeal(dealId);
    const project = await prisma.project.upsert({
      where: { pipedriveDealId: String(dealId) },
      update: this.mapDealToProject(deal),
      create: this.mapDealToProject(deal),
    });
    return project;
  }

  async syncProjectToDeal(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { comercial: true }
    });
    if (project?.pipedriveDealId) {
      await pipedrive.updateDeal(project.pipedriveDealId, {
        // Map project fields back to Pipedrive
      });
    }
  }
}
```

### 5.2 Pipefy Migration

```typescript
// One-time migration script
async function migratePipefyToSystem() {
  // 1. Migrate OPERAÇÕES cards
  const cards = await pipefy.getAllCards('306410007');

  for (const card of cards) {
    await prisma.project.create({
      data: {
        pipefyCardId: card.id,
        cliente: card.title,
        currentModule: mapPhaseToModule(card.current_phase.name),
        // ... map all fields
      }
    });
  }

  // 2. Migrate PÓS-VENDA cards
  const posVendaCards = await pipefy.getAllCards('306434917');
  // ... similar logic
}
```

### 5.3 WhatsApp (Z-API)

```typescript
class WhatsAppService {
  async sendMessage(phone: string, message: string) {
    // Já integrado no sistema atual
  }

  // Templates
  async sendPropostaEnviada(project: Project) {
    const msg = `Olá! Sua proposta STELION está pronta. Valor: R$ ${project.valorTotal}. Acesse: ${link}`;
    await this.sendMessage(project.telefoneCliente, msg);
  }

  async sendVTAgendada(project: Project, data: Date) {
    const msg = `Visita técnica agendada para ${formatDate(data)}. Endereço: ${project.endereco}`;
    await this.sendMessage(project.telefoneCliente, msg);
  }
}
```

---

## 6. Roadmap de Implementação

### Fase 1: Fundação (2 semanas)
- [ ] Schema do banco de dados
- [ ] Migration do Pipefy (dados históricos)
- [ ] Integração Pipedrive (webhook + sync)
- [ ] API base dos módulos

### Fase 2: Módulo Comercial (2 semanas)
- [ ] Dashboard de vendas
- [ ] Gestão de leads
- [ ] Gerador de propostas
- [ ] Follow-ups automatizados

### Fase 3: Módulo PIUI (1 semana)
- [ ] Criação de contratos
- [ ] Workflow de aprovação
- [ ] Gestão de parcelas

### Fase 4: Módulo Planejamento (2 semanas)
- [ ] Visitas técnicas
- [ ] Ordem de serviço
- [ ] Logística
- [ ] Designação de equipe

### Fase 5: Aprimoramento Execução (1 semana)
- [ ] Etapas da obra
- [ ] Checklists de qualidade
- [ ] Galeria de evolução

### Fase 6: Módulo Pós-Venda (1 semana)
- [ ] Registro de chamados
- [ ] Workflow de intervenção
- [ ] Histórico completo

### Fase 7: Hub de Projetos (1 semana)
- [ ] Dashboard unificado
- [ ] Timeline completa
- [ ] Galeria de vídeos
- [ ] Relatórios gerenciais

---

## 7. Considerações Finais

### 7.1 Migração de Dados

- **Pipedrive**: Manter como fonte para COMERCIAL, sync bidirecional
- **Pipefy OPERAÇÕES**: Migrar todos os 494 cards
- **Pipefy PÓS-VENDA**: Migrar os 186 cards
- **Pipefy COMERCIAL**: Descontinuar (dados em Pipedrive)
- **Monofloor App**: Manter e conectar ao novo backend

### 7.2 Descontinuação Gradual

1. **Fase 1**: Sistema paralelo, dados sincronizados
2. **Fase 2**: Novos projetos apenas no sistema novo
3. **Fase 3**: Migração completa, Pipefy apenas leitura
4. **Fase 4**: Desativação do Pipefy

### 7.3 Métricas de Sucesso

- Tempo médio de lead → contrato
- Taxa de conversão por etapa
- Tempo médio de execução
- Índice de pós-venda
- NPS do cliente

---

*Documento gerado em 25/12/2024*
*Versão 1.0*
