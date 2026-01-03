# MAPEAMENTO TYPEFORM → SISTEMA MONOFLOOR

> Documento que mapeia os campos dos formulários Typeform para os campos base do projeto.

---

## VISÃO GERAL DOS FORMULÁRIOS

| Formulário | ID | Destino | Objetivo |
|------------|----|---------| ---------|
| waitlist \| novo | `uQwmO6L6` | Comercial | Captação de leads e qualificação |
| Contrato | `MR7zP9Sl` | Contratos | Dados para formalização contratual |

---

## 1. FORMULÁRIO: waitlist | novo (COMERCIAL)

**URL:** https://form.typeform.com/to/uQwmO6L6
**Objetivo:** Captar leads qualificados e coletar informações iniciais do projeto

### Campos Coletados

| # | Campo Typeform | Ref ID | Tipo | Obrigatório | → Campo Sistema |
|---|----------------|--------|------|-------------|-----------------|
| 1 | Nome (como gostaria de ser chamado) | `d22955cf-0355-4920-af4e-d5c459ee33b3` | short_text | Sim | `lead.nome` |
| 2 | Nível de envolvimento | `67b60026-26ac-4666-af67-f382459afc6a` | multiple_choice | Sim | `lead.tipo_cliente` |
| 3 | Nome do escritório (arquiteto) | `ba39550e-af05-44c7-9017-d53d4b762f89` | short_text | Sim* | `lead.escritorio` |
| 4 | Nome do escritório (cliente final) | `37b719ea-f801-4309-8bb6-59fe3c434a42` | short_text | Sim* | `lead.escritorio` |
| 5 | Budget estimado | `34abe367-b05f-4faf-92de-f654a9cf0342` | dropdown | Não | `lead.budget` |
| 6 | Cidade/Estado do projeto | `b7e773b0-73c4-4516-a95a-78c4d4ffdd92` | multiple_choice | Sim | `lead.regiao` |
| 7 | Atende metragem mínima 80m² | `0dfa0e82-8fa6-4cd0-a799-db8eb20421cb` | yes_no | Sim* | `lead.atende_metragem` |
| 8 | Atende metragem mínima 150-300m² | `ea772a05-1343-4752-b183-5264e39e21b9` | yes_no | Sim* | `lead.atende_metragem` |
| 9 | Atende metragem mínima 300m² | `2bc90f3d-7d43-41d5-bdce-a880c537669f` | yes_no | Sim* | `lead.atende_metragem` |
| 10 | Área total para revestir (detalhes) | `1b29e5e3-389f-44a1-8e81-fe0377f477c3` | long_text | Sim | `lead.detalhes_metragem` |
| 11 | Nome da cidade (se "Outro") | `6ee5b188-7a2b-475a-85dd-0c7b89d250b7` | short_text | Sim* | `lead.cidade` |
| 12 | Metragem estimada (faixa) | `097fec94-e5a6-4123-949b-b6b21abbdca0` | dropdown | Sim | `lead.faixa_metragem` |
| 13 | Detalhes metragem | `6e76397a-57a3-4466-bde8-43b9063765f4` | long_text | Sim | `lead.detalhes_metragem` |
| 14 | Data estimada execução | `5155d54d-613f-46a7-8185-34d69603c3f5` | dropdown | Sim | `lead.previsao_execucao` |
| 15 | Contato (nome, telefone, email) | `23763286-bb5b-4c21-b608-f975e92f4c24` | contact_info | Sim | `lead.contato` |
| 16 | Contato waitlist (não atende) | `0a505443-a460-4b13-b3e4-6b037dc48196` | contact_info | Sim* | `waitlist.contato` |

*Condicional - depende do fluxo

### Opções dos Dropdowns/Choices

**Nível de Envolvimento:**
```
- Sou arquiteto(a) | Engenheiro(a) do projeto → ARQUITETO
- Sou cliente final → CLIENTE_FINAL
```

**Budget Estimado:**
```
- Menos de 500 mil → MENOS_500K
- Entre 500 mil a 1 milhão → 500K_1M
- Entre 1 a 3 milhões → 1M_3M
- Entre 3 a 5 milhões → 3M_5M
- Entre 5 milhões e 10 milhões → 5M_10M
- Acima de 10 milhões → ACIMA_10M
```

**Região do Projeto:**
```
- São Paulo (Capital) → SP_CAPITAL
- Rio de Janeiro (Capital) → RJ_CAPITAL
- Curitiba → CURITIBA
- Interior ou Litoral Paulista → SP_INTERIOR
- Interior ou Litoral Carioca → RJ_INTERIOR
- Santa Catarina → SC
- Litoral Paranaense → PR_LITORAL
- Outro → OUTRO
```

**Faixa de Metragem:**
```
- de 80m² a 150m² → 80_150
- de 150m² a 300m² → 150_300
- de 300m² a 500m² → 300_500
- de 500m² a 1000m² → 500_1000
- acima de 1000m² → ACIMA_1000
```

**Previsão de Execução:**
```
- Janeiro | 2026 → 2026-01
- Fevereiro | 2026 → 2026-02
- Março | 2026 → 2026-03
- Abril | 2026 → 2026-04
- Maio | 2026 → 2026-05
- Junho | 2026 → 2026-06
- Julho | 2026 → 2026-07
- Agosto | 2026 → 2026-08
- Setembro | 2026 → 2026-09
- Outubro | 2026 → 2026-10
- Novembro | 2026 → 2026-11
- Dezembro | 2026 → 2026-12
- Após Janeiro | 2027 → 2027+
```

### Campos Hidden
```
position → Número sequencial do lead
```

---

## 2. FORMULÁRIO: Contrato (CONTRATOS)

**URL:** https://form.typeform.com/to/MR7zP9Sl
**Objetivo:** Coletar dados formais para elaboração do contrato

### Campos Coletados

| # | Campo Typeform | Ref ID | Tipo | Obrigatório | → Campo Sistema |
|---|----------------|--------|------|-------------|-----------------|
| 1 | Dados pessoais | `23763286-bb5b-4c21-b608-f975e92f4c24` | contact_info | Sim | `contratante.*` |
| 1.1 | → Nome | `002ba554-51ec-49b1-b1fe-3595e9dac660` | short_text | Sim | `contratante.nome` |
| 1.2 | → Telefone | `d0b8f242-79cb-4e4d-abdf-6e23166a112b` | phone | Sim | `contratante.telefone` |
| 1.3 | → Email | `a541a982-f772-4ec4-a234-364345632d39` | email | Sim | `contratante.email` |
| 2 | CPF ou CNPJ | `2d71eb51-c851-4caf-82dc-500b03f8068d` | short_text | Sim | `contratante.documento` |
| 3 | Estado civil | `329de820-54cd-4318-8597-4b8cf1931f68` | short_text | Sim | `contratante.estado_civil` |
| 4 | Nacionalidade | `c0cf30fc-f292-4c1a-b57f-2082daf8dece` | short_text | Sim | `contratante.nacionalidade` |
| 5 | Profissão | `1ed9316f-fd50-4a20-8ed4-4560176ade0f` | short_text | Sim | `contratante.profissao` |
| 6 | Endereço residencial | `c1a047cd-a913-4bd0-8901-bd4bb61e1250` | address | Sim | `contratante.endereco_*` |
| 6.1 | → Endereço | `47d2e765-e38a-4e21-b704-bb35d1ef9f3c` | short_text | Sim | `contratante.endereco_rua` |
| 6.2 | → Complemento | `b392fe4f-1f42-4ebc-a2de-511fd65f65fc` | short_text | Não | `contratante.endereco_complemento` |
| 6.3 | → Cidade | `805571fd-0618-49bf-8bca-d1fdeb877a91` | short_text | Sim | `contratante.endereco_cidade` |
| 6.4 | → Estado | `aaeee111-3495-4b57-bc9d-7bd2a7a7b6f0` | short_text | Sim | `contratante.endereco_estado` |
| 6.5 | → CEP | `fc816937-908a-44b0-acfe-420c34d46d4d` | short_text | Sim | `contratante.endereco_cep` |
| 6.6 | → País | `f0bc4ca0-3ad7-4f6f-844f-bf0395c71788` | short_text | Não | `contratante.endereco_pais` |
| 7 | Possui arquiteto? | `67b60026-26ac-4666-af67-f382459afc6a` | multiple_choice | Sim | `projeto.tem_arquiteto` |
| 8 | Nome do escritório | `ba39550e-af05-44c7-9017-d53d4b762f89` | short_text | Sim* | `projeto.escritorio` |
| 9 | Endereço do projeto | `9debea71-2bc0-4497-883d-45307de19f31` | address | Sim | `projeto.endereco_*` |
| 9.1 | → Endereço | `985b8d2f-ff9c-4cb9-aa7f-83aac2c3114b` | short_text | Sim | `projeto.endereco_rua` |
| 9.2 | → Complemento | `9abf6451-26d1-4bb4-a4c9-08d7e1fc5a29` | short_text | Não | `projeto.endereco_complemento` |
| 9.3 | → Cidade | `44fffe3d-2526-4c17-8fba-80910d9caf41` | short_text | Sim | `projeto.endereco_cidade` |
| 9.4 | → Estado | `1f384477-edb6-4377-ba17-e4bcee30344c` | short_text | Sim | `projeto.endereco_estado` |
| 9.5 | → CEP | `1f29057e-4e4a-404e-8cab-8801ce91b7e7` | short_text | Sim | `projeto.endereco_cep` |
| 9.6 | → País | `ad2dd349-f77e-4dc6-8577-03a170c3f849` | short_text | Não | `projeto.endereco_pais` |
| 10 | Cor(es) do projeto | `1bf04c99-d8c0-49fc-a3ae-7ca53713f84c` | short_text | Sim | `projeto.cores` |
| 11 | Data início execução | `775dec99-3079-42a8-8c94-15855b0c7a5f` | date | Não | `projeto.data_entrada` |

### Opções dos Choices

**Possui Arquiteto:**
```
- Sim, possuo arquiteto → true
- Não tenho arquiteto → false
```

### Campos Hidden
```
position → Número sequencial do contrato
```

---

## MAPEAMENTO PARA CAMPOS BASE DO PROJETO

### De Typeform waitlist → Lead (Comercial)

```typescript
interface LeadFromTypeform {
  // Identificação
  nome: string;                    // d22955cf-0355-4920-af4e-d5c459ee33b3
  tipo_cliente: 'ARQUITETO' | 'CLIENTE_FINAL';  // 67b60026-26ac-4666-af67-f382459afc6a
  escritorio?: string;             // ba39550e ou 37b719ea (depende do tipo)

  // Contato
  telefone: string;                // contact_info.phone_number
  email: string;                   // contact_info.email

  // Projeto
  regiao: string;                  // b7e773b0-73c4-4516-a95a-78c4d4ffdd92
  cidade?: string;                 // 6ee5b188-7a2b-475a-85dd-0c7b89d250b7 (se Outro)
  faixa_metragem: string;          // 097fec94-e5a6-4123-949b-b6b21abbdca0
  detalhes_metragem: string;       // 1b29e5e3 ou 6e76397a
  previsao_execucao: string;       // 5155d54d-613f-46a7-8185-34d69603c3f5

  // Qualificação
  budget?: string;                 // 34abe367-b05f-4faf-92de-f654a9cf0342
  atende_metragem: boolean;        // 0dfa0e82 ou ea772a05 ou 2bc90f3d

  // Metadata
  position: number;                // hidden field
  submitted_at: Date;
  typeform_response_id: string;
}
```

### De Typeform Contrato → Projeto (Contratos)

```typescript
interface ProjetoFromTypeform {
  // Contratante
  contratante: {
    nome: string;                  // 002ba554-51ec-49b1-b1fe-3595e9dac660
    telefone: string;              // d0b8f242-79cb-4e4d-abdf-6e23166a112b
    email: string;                 // a541a982-f772-4ec4-a234-364345632d39
    documento: string;             // 2d71eb51-c851-4caf-82dc-500b03f8068d (CPF/CNPJ)
    estado_civil: string;          // 329de820-54cd-4318-8597-4b8cf1931f68
    nacionalidade: string;         // c0cf30fc-f292-4c1a-b57f-2082daf8dece
    profissao: string;             // 1ed9316f-fd50-4a20-8ed4-4560176ade0f
    endereco: {
      rua: string;                 // 47d2e765-e38a-4e21-b704-bb35d1ef9f3c
      complemento?: string;        // b392fe4f-1f42-4ebc-a2de-511fd65f65fc
      cidade: string;              // 805571fd-0618-49bf-8bca-d1fdeb877a91
      estado: string;              // aaeee111-3495-4b57-bc9d-7bd2a7a7b6f0
      cep: string;                 // fc816937-908a-44b0-acfe-420c34d46d4d
    }
  };

  // Projeto
  projeto: {
    tem_arquiteto: boolean;        // 67b60026-26ac-4666-af67-f382459afc6a
    escritorio?: string;           // ba39550e-af05-44c7-9017-d53d4b762f89
    endereco: {
      rua: string;                 // 985b8d2f-ff9c-4cb9-aa7f-83aac2c3114b
      complemento?: string;        // 9abf6451-26d1-4bb4-a4c9-08d7e1fc5a29
      cidade: string;              // 44fffe3d-2526-4c17-8fba-80910d9caf41
      estado: string;              // 1f384477-edb6-4377-ba17-e4bcee30344c
      cep: string;                 // 1f29057e-4e4a-404e-8cab-8801ce91b7e7
    };
    cores: string;                 // 1bf04c99-d8c0-49fc-a3ae-7ca53713f84c
    data_entrada?: Date;           // 775dec99-3079-42a8-8c94-15855b0c7a5f
  };

  // Metadata
  position: number;                // hidden field
  submitted_at: Date;
  typeform_response_id: string;
}
```

---

## MAPEAMENTO TYPEFORM → PIPEDRIVE → SISTEMA

### waitlist | novo → Pipedrive → ComercialData

| Campo Typeform | → Pipedrive Key | → Pipedrive Field | → ComercialData |
|----------------|-----------------|-------------------|-----------------|
| Nome | `title` | Título | `project.cliente` |
| Tipo cliente | `1f41e2ababaaca38f6eda10f0118d8739895f4d7` | Tipo de cliente | `tipoCliente` |
| Escritório | `461af1e6927db97e477004b68d9eed2a123b237a` | Nome do escritório | `nomeEscritorio` |
| Budget | `6e584cf39b9b71ed4f0b1cc87268d8f25decc86e` | Budget estimado | `budgetEstimado` |
| Região | `60a014040c370143e4e8d58efc47c7ecfec484d6` | Cidade de execução | `cidadeExecucao` |
| Cidade (descritivo) | `87845e892df12877faac618a35d9064c3cf2833f` | Cidade de execução (descritivo) | `cidadeExecucaoDesc` |
| Faixa metragem | `b738870cd03c6212a2cedb5a94e6b969b5cac7cd` | Metragem estimada N1 | `metragemEstimadaN1` |
| Metragem texto | `2c3ffa560c132066eb8503bc58a5b1a35b9bff4c` | Metragem estimada | `metragemEstimada` |
| Detalhes metragem | `9f938c89c2b9b6aeb1ee15934eb103e1b4847bdf` | Descritivo de área | `descritivoArea` |
| Previsão execução | `e34c43d77127f2032b7827450093a89db01db960` | Data prevista de execução | `dataPrevistaExec` |
| Contato.telefone | `9ed948b3581f019a0ed8cc2dcab3e106bfca84c4` | Telefone Z-API | `telefoneZapi` |
| Contato.nome | `162d774100ff3792cc5d0c79a3439525d9a9bc14` | Primeiro Nome Z-API | `primeiroNomeZapi` |
| Contato.email | `person_id.email` | Email da pessoa | `personEmail` |
| Contato.telefone | `person_id.phone` | Telefone da pessoa | `personPhone` |

### Valores dos Campos no Pipedrive

**Tipo de cliente (1f41e2...):**
```
- Arquiteto | Engenheiro → "Arquiteto"
- Cliente Final → "Cliente Final"
```

**Cidade de execução (60a014...):**
```
- SP_CAPITAL → "São Paulo (Capital)"
- RJ_CAPITAL → "Rio de Janeiro (Capital)"
- CURITIBA → "Curitiba"
- SP_INTERIOR → "Interior/Litoral SP"
- RJ_INTERIOR → "Interior/Litoral RJ"
- SC → "Santa Catarina"
- PR_LITORAL → "Litoral PR"
- OUTRO → valor do campo cidade
```

**Budget estimado (6e584c...):**
```
- MENOS_500K → "Menos de 500 mil"
- 500K_1M → "500 mil a 1 milhão"
- 1M_3M → "1 a 3 milhões"
- 3M_5M → "3 a 5 milhões"
- 5M_10M → "5 a 10 milhões"
- ACIMA_10M → "Acima de 10 milhões"
```

---

## MAPEAMENTO PARA CAMPOS BASE (PROJETO_CAMPOS_BASE.md)

### waitlist | novo → Campos Base

| Campo Typeform | → Campo Base Projeto |
|----------------|---------------------|
| Nome | `project.cliente` + `comercialData.primeiroNomeZapi` |
| Tipo cliente | `comercialData.tipoCliente` |
| Escritório | `comercialData.nomeEscritorio` |
| Budget | `comercialData.budgetEstimado` |
| Região | `comercialData.cidadeExecucao` |
| Cidade (outro) | `comercialData.cidadeExecucaoDesc` |
| Faixa metragem | `comercialData.metragemEstimadaN1` |
| Detalhes metragem | `comercialData.descritivoArea` |
| Previsão execução | `comercialData.dataPrevistaExec` |
| Contato.nome | `comercialData.primeiroNomeZapi` + `comercialData.personName` |
| Contato.telefone | `comercialData.telefoneZapi` + `comercialData.personPhone` |
| Contato.email | `comercialData.personEmail` |

### Contrato → Campos Base

| Campo Typeform | → Campo Base Projeto |
|----------------|---------------------|
| Nome | `contratante.nome` |
| Telefone | `contratante.telefone` |
| Email | `contratante.email` |
| CPF/CNPJ | `contratante.documento` |
| Estado civil | `contratante.estado_civil` |
| Nacionalidade | `contratante.nacionalidade` |
| Profissão | `contratante.profissao` |
| Endereço residencial | `contratante.endereco_*` |
| Possui arquiteto | *boolean* |
| Nome escritório | → Buscar/criar `arquiteto` |
| Endereço projeto | `projeto.endereco` (Endereço Completo) |
| Cores | `projeto.cores` |
| Data início | `projeto.data_de_entrada` |

---

## FLUXO DE INTEGRAÇÃO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TYPEFORM WEBHOOKS                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
┌───────────────────┐                                 ┌───────────────────┐
│  waitlist | novo  │                                 │     Contrato      │
│    (uQwmO6L6)     │                                 │    (MR7zP9Sl)     │
└─────────┬─────────┘                                 └─────────┬─────────┘
          │                                                     │
          ▼                                                     ▼
┌───────────────────┐                                 ┌───────────────────┐
│  POST /webhooks/  │                                 │  POST /webhooks/  │
│  typeform/lead    │                                 │  typeform/contrato│
└─────────┬─────────┘                                 └─────────┬─────────┘
          │                                                     │
          ▼                                                     ▼
┌───────────────────┐                                 ┌───────────────────┐
│   Criar LEAD      │                                 │  Criar/Atualizar  │
│   no sistema      │                                 │     PROJETO       │
└─────────┬─────────┘                                 └─────────┬─────────┘
          │                                                     │
          ▼                                                     ▼
┌───────────────────┐                                 ┌───────────────────┐
│ Notificar COMERCIAL│                                │ Notificar CONTRATOS│
│  (email/slack)    │                                 │   + criar grupo   │
└───────────────────┘                                 │   Telegram        │
                                                      └───────────────────┘
```

---

## NOVOS CAMPOS NECESSÁRIOS NO SISTEMA

### Tabela: leads (nova)

```prisma
model Lead {
  id                  String    @id @default(uuid())

  // Identificação
  nome                String
  tipo                LeadType  // ARQUITETO, CLIENTE_FINAL
  escritorio          String?

  // Contato
  telefone            String
  email               String

  // Projeto (inicial)
  regiao              String
  cidade              String?
  faixa_metragem      String
  detalhes_metragem   String?
  previsao_execucao   String?

  // Qualificação
  budget              String?
  atende_metragem     Boolean   @default(true)

  // Status
  status              LeadStatus @default(NOVO)
  convertido_em       String?   // project_id se convertido

  // Typeform
  typeform_response_id String   @unique
  position            Int?

  // Timestamps
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@map("leads")
}

enum LeadType {
  ARQUITETO
  CLIENTE_FINAL
}

enum LeadStatus {
  NOVO
  EM_CONTATO
  QUALIFICADO
  PROPOSTA_ENVIADA
  CONVERTIDO
  PERDIDO
}
```

### Tabela: contratantes (nova)

```prisma
model Contratante {
  id                  String    @id @default(uuid())

  // Dados pessoais
  nome                String
  telefone            String
  email               String
  documento           String    // CPF ou CNPJ
  estado_civil        String?
  nacionalidade       String?
  profissao           String?

  // Endereço
  endereco_rua        String?
  endereco_complemento String?
  endereco_cidade     String?
  endereco_estado     String?
  endereco_cep        String?

  // Relações
  projetos            Project[]

  // Typeform
  typeform_response_id String?

  // Timestamps
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@map("contratantes")
}
```

### Campos adicionais em Project

```prisma
model Project {
  // ... campos existentes ...

  // Novo: Relação com contratante
  contratante_id      String?
  contratante         Contratante? @relation(...)

  // Novo: Arquiteto
  tem_arquiteto       Boolean?
  escritorio_nome     String?

  // Novo: Typeform
  typeform_contrato_id String?

  // ... resto dos campos ...
}
```

---

## ENDPOINTS DE WEBHOOK

### POST /webhooks/typeform/lead

Recebe respostas do formulário "waitlist | novo"

```typescript
// Payload do Typeform
{
  event_id: string,
  event_type: "form_response",
  form_response: {
    form_id: "uQwmO6L6",
    token: string,
    submitted_at: string,
    hidden: { position: string },
    answers: [...]
  }
}
```

### POST /webhooks/typeform/contrato

Recebe respostas do formulário "Contrato"

```typescript
// Payload do Typeform
{
  event_id: string,
  event_type: "form_response",
  form_response: {
    form_id: "MR7zP9Sl",
    token: string,
    submitted_at: string,
    hidden: { position: string },
    answers: [...]
  }
}
```

---

## PRÓXIMOS PASSOS

- [x] Adicionar campos `typeformResponseId`, `typeformSubmittedAt`, `typeformRawData` no ComercialData
- [x] Criar rotas de webhook para Typeform (`/api/webhooks/typeform/lead`)
- [ ] Deploy do backend para produção (Railway)
- [ ] Configurar webhook no Typeform (Settings → Connect → Webhooks)
- [ ] Testar fluxo completo em produção
- [ ] Implementar notificações (email/Slack) para novos leads
- [ ] Criar tela de gestão de leads no admin

---

## CONFIGURAÇÃO DO WEBHOOK NO TYPEFORM

### 1. Acessar configurações do formulário "waitlist | novo"

1. Vá para https://admin.typeform.com/
2. Abra o formulário "waitlist | novo"
3. Clique em "Connect" no menu lateral
4. Clique em "Webhooks"

### 2. Adicionar webhook

**URL do Webhook (produção):**
```
https://devoted-wholeness-production.up.railway.app/api/webhooks/typeform/lead
```

**Configurações:**
- Trigger: Form is submitted
- Content Type: application/json

### 3. Testar

Use o botão "Test webhook" no Typeform para enviar um payload de teste.

---

## ENDPOINTS DISPONÍVEIS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/webhooks/health` | Health check do serviço de webhooks |
| GET | `/api/webhooks/typeform/test` | Verifica se o endpoint Typeform está funcionando |
| POST | `/api/webhooks/typeform/lead` | Recebe respostas do formulário "waitlist \| novo" |
| POST | `/api/webhooks/typeform/contrato` | Recebe respostas do formulário "Contrato" (pendente) |

---

## MAPEAMENTO IMPLEMENTADO

### Campos do Typeform → ComercialData

| Campo Typeform | → Prisma Field |
|----------------|----------------|
| Nome | `primeiroNomeZapi`, `personName`, `project.cliente` |
| Tipo cliente | `tipoCliente` |
| Escritório | `nomeEscritorio` |
| Budget | `budgetEstimado` |
| Região | `cidadeExecucao` |
| Cidade (descritivo) | `cidadeExecucaoDesc` |
| Faixa metragem | `metragemEstimadaN1` |
| Metragem estimada | `metragemEstimada` |
| Detalhes metragem | `descritivoArea` |
| Previsão execução | `dataPrevistaExec` |
| Contato.telefone | `telefoneZapi`, `personPhone` |
| Contato.email | `personEmail` |
| Response ID | `typeformResponseId` |
| Submitted At | `typeformSubmittedAt` |
| Raw Payload | `typeformRawData` |

---

*Documento atualizado em: Dezembro 2025*
*Versão: 2.0 - Webhook implementado*
