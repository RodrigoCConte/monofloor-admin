# 🧠 Sistema de Análise Inteligente de Vídeos - Monofloor

## Visão Geral

O novo sistema utiliza **análise semântica com IA** para gerar relatórios técnicos profissionais, identificando automaticamente os pontos mais relevantes dos vídeos e organizando-os por tópicos técnicos.

---

## Como Funciona (5 Fases)

### **Fase 1: Extração Inteligente de Frames** 🎯

**Problema resolvido:** Vídeos de 5 minutos não podem ter frames extraídos a cada N segundos, senão ficam centenas de imagens irrelevantes.

**Solução:**
1. Extrai frames candidatos a cada 3 segundos (até 100 frames)
2. Usa GPT-4 Vision para **avaliar relevância** de cada frame (score 0-10)
3. Seleciona apenas os frames com maior score técnico

**Critérios de relevância:**
- **10 pontos:** Problemas graves, aplicação incorreta, medições visíveis
- **7-9 pontos:** Problemas menores, preparação de substrato
- **4-6 pontos:** Áreas em bom estado, visão geral
- **1-3 pontos:** Imagens borradas, transições, sem valor técnico
- **0 pontos:** Totalmente irrelevante

**Resultado:** De 100 frames candidatos → 15-20 frames relevantes

---

### **Fase 2: Análise Técnica Individual** 🔍

**O que acontece:**
Cada frame selecionado é analisado por GPT-4 Vision com prompt técnico especializado.

**Prompt técnico:**
```
Você é um especialista da Monofloor Revestimentos.

Analise esta imagem de forma TÉCNICA e OBJETIVA:
1. Identifique o ambiente (banheiro, cozinha, etc.)
2. Condições do substrato (tipo, umidade, nivelamento)
3. Problemas identificados (fissuras, umidade, cerâmicas soltas)
4. Requisitos técnicos (resistência 20 MPa, preparação necessária)
5. Observações importantes (medições, detalhes críticos)

Estilo: Formal, técnico, direto.
Use termos como "resistência à compressão", "substrato", "aderência".
```

**Resultado:** 15-20 análises técnicas individuais

---

### **Fase 3: Agrupamento Semântico** 📊

**Problema resolvido:** Relatório precisa estar organizado por TÓPICOS (ex: "Banheiros", "Cerâmicas"), não por ordem cronológica de frames.

**Solução:**
1. GPT-4 recebe TODAS as análises individuais
2. Identifica temas comuns entre frames
3. Agrupa frames relacionados em tópicos técnicos
4. Cria título e descrição para cada tópico

**Exemplo de agrupamento:**
```
Frames 1, 3, 7 → "Condições dos Banheiros"
Frames 2, 5, 9 → "Estado das Cerâmicas"
Frames 4, 6, 8 → "Área Externa e Fachada"
```

**Regras:**
- Mínimo 2 tópicos, máximo 6 tópicos
- Cada frame pertence a apenas UM tópico
- Ordem lógica: entrada → ambientes → problemas específicos

---

### **Fase 4: Geração do PDF Monofloor** 📄

**Design profissional:**

#### Cores:
- **Fundo:** Cinza claro (#E5E5E5)
- **Primária:** Dourado Monofloor (#c9a962)
- **Texto:** Preto e cinza escuro

#### Estrutura:

**Página 1 - Capa:**
```
┌─────────────────────────────────────────┐
│ MONOFLOOR REVESTIMENTOS                 │
│ Sistema STELION - Piso Monolítico       │
└─────────────────────────────────────────┘

    RELATÓRIO DE VISITA TÉCNICA

┌─────────────────────────────────────────┐
│ Projeto: Residência Silva               │
│ Técnico Responsável: João Silva         │
│ Data da Visita: 15/12/2024              │
│ Objetivo: Vistoria Inicial              │
└─────────────────────────────────────────┘

Texto introdutório padrão explicando
o relatório e metodologia...

Observações Gerais: [se houver]
```

**Páginas Internas - Tópicos:**
```
─────────────────────────────────────────

1. Condições dos Banheiros
Análise das condições encontradas nos
ambientes molhados da obra.

─────────────────────────────────────────

┌─────────────────────────────────────────┐
│                                         │
│         [FOTO DO BANHEIRO 1]            │
│                                         │
└─────────────────────────────────────────┘

O ambiente apresenta substrato cerâmico
em condições regulares, com presença de
umidade nas juntas. Necessária remoção
de rejuntes deteriorados e aplicação de
primer com resistência mínima de 20 MPa...

─────────────────────────────────────────

┌─────────────────────────────────────────┐
│                                         │
│         [FOTO DO BANHEIRO 2]            │
│                                         │
└─────────────────────────────────────────┘

Detectada infiltração na base da parede...

═════════════════════════════════════════

2. Estado das Cerâmicas
[próximo tópico...]
```

**Página Final:**
```
CONSIDERAÇÕES FINAIS

Este relatório técnico foi elaborado com
base nas condições encontradas no momento
da visita. As recomendações apresentadas
visam garantir a qualidade e durabilidade...

Relatório gerado em 15/12/2024 14:35
Monofloor - Sistema de Relatórios Automáticos
```

**Rodapé em TODAS as páginas:**
```
┌─────┬─────┬─────┬─────┬─────┐     ┌───┐
│█████│█████│█████│█████│█████│     │ 1 │
│ Preto│Ouro│Marrom│Bege│Cinza│     └───┘
└─────┴─────┴─────┴─────┴─────┘   Página
    Paleta de Cores Monofloor
```

---

## Comparação: Antes vs Agora

### ❌ Sistema Antigo (Cronológico)

```
Relatório → Vídeo 1 → Frame 1 (00:10)
                   → Frame 2 (00:20)
                   → Frame 3 (00:30)
         → Vídeo 2 → Frame 1 (00:10)
                   → Frame 2 (00:20)
```

**Problemas:**
- Frames a cada N segundos (muitos irrelevantes)
- Organização cronológica (não faz sentido técnico)
- Análises descritivas (não focadas em problemas)
- PDF genérico (não segue padrão Monofloor)

---

### ✅ Sistema Novo (Semântico)

```
Relatório → Tópico 1: Banheiros
              → Frame do vídeo 1 (00:23) - relevante
              → Frame do vídeo 2 (01:45) - relevante
              → Frame do vídeo 1 (02:10) - relevante
         → Tópico 2: Cerâmicas
              → Frame do vídeo 2 (00:30) - relevante
              → Frame do vídeo 1 (01:50) - relevante
```

**Benefícios:**
- ✅ **Clinical Eye:** Só frames relevantes (score 7-10)
- ✅ **Organização Lógica:** Por tópicos técnicos
- ✅ **Análise Profissional:** Foco em problemas e requisitos
- ✅ **Design Monofloor:** Fundo cinza, paleta, layout correto

---

## Vídeos Múltiplos

O sistema funciona perfeitamente com **2-4 vídeos** da mesma visita:

### Como processa:

1. **Vídeo 1:** 60 frames candidatos → 12 frames relevantes → 12 análises
2. **Vídeo 2:** 60 frames candidatos → 10 frames relevantes → 10 análises
3. **Vídeo 3:** 60 frames candidatos → 8 frames relevantes → 8 análises

**Total:** 30 análises de 3 vídeos

### Agrupamento consolidado:

A IA analisa as **30 análises juntas** e agrupa por tópico, independente de qual vídeo veio:

```
Tópico 1: Banheiros
  - Frame do vídeo 1
  - Frame do vídeo 3
  - Frame do vídeo 1

Tópico 2: Área Externa
  - Frame do vídeo 2
  - Frame do vídeo 1

Tópico 3: Problemas Estruturais
  - Frame do vídeo 2
  - Frame do vídeo 3
  - Frame do vídeo 2
```

**Resultado:** Relatório único, organizado por tópicos, mesclando os 3 vídeos de forma inteligente.

---

## Configurações Recomendadas

### Para vídeos curtos (30s - 2min):
```json
{
  "maxFrames": 15,
  "frameInterval": 3
}
```
- Análise mais densa
- Ideal para vídeos focados em um problema

### Para vídeos médios (2-5min):
```json
{
  "maxFrames": 20,
  "frameInterval": 3
}
```
- **PADRÃO RECOMENDADO**
- Equilíbrio entre cobertura e relevância

### Para vídeos longos (>5min):
```json
{
  "maxFrames": 25,
  "frameInterval": 3
}
```
- Mais frames relevantes
- Cobre melhor vídeos extensos

---

## Custos (Aproximado)

### Fase 1 - Seleção Inteligente:
- **Modelo:** gpt-4o com `detail: low`
- **Custo:** ~$0.10 por 100 frames candidatos

### Fase 2 - Análise Técnica:
- **Modelo:** gpt-4o com `detail: high`
- **Custo:** ~$0.30 por 20 frames relevantes

### Fase 3 - Agrupamento:
- **Modelo:** gpt-4o (apenas texto)
- **Custo:** ~$0.02 por agrupamento

### Total por vídeo (5min):
- **Custo:** ~$0.42 (~R$ 2,10)
- **Tempo:** 6-10 minutos

### Total para 3 vídeos:
- **Custo:** ~$1.26 (~R$ 6,30)
- **Tempo:** 20-30 minutos

---

## Exemplos de Uso

### Caso 1: Vistoria Completa (3 vídeos)

**Vídeos gravados:**
- `entrada_fachada.mp4` (2min)
- `ambientes_internos.mp4` (4min)
- `banheiros_problemas.mp4` (3min)

**Processo:**
1. Upload dos 3 vídeos simultaneamente
2. Sistema extrai ~180 frames candidatos
3. Seleciona ~45 frames relevantes
4. Agrupa em tópicos: "Entrada e Fachada", "Sala e Cozinha", "Banheiros", "Problemas Hidráulicos"
5. Gera PDF com 25-30 páginas

**Resultado:** Relatório profissional organizado por área técnica

---

### Caso 2: Problema Específico (1 vídeo)

**Vídeo gravado:**
- `infiltracao_parede.mp4` (1min 30s)

**Processo:**
1. Upload de 1 vídeo
2. Sistema extrai ~30 frames candidatos
3. Seleciona ~12 frames relevantes
4. Agrupa em tópicos: "Localização da Infiltração", "Extensão do Dano"
5. Gera PDF com 10-12 páginas

**Resultado:** Relatório focado no problema identificado

---

## Arquivos do Sistema

### Backend:
- `src/services/video-report.service.ts` - Lógica principal
- `src/routes/admin/video-reports.routes.ts` - Endpoints API

### Frontend:
- `projeto relatorio/index.html` - Interface de upload

### Endpoints:

**Single video:**
```http
POST /api/admin/reports/video-process
Content-Type: multipart/form-data

{
  video: [arquivo],
  projectName: "Residência Silva",
  technicianName: "João Silva",
  visitDate: "2024-12-15",
  visitPurpose: "vistoria",
  maxFrames: 20
}
```

**Multiple videos:**
```http
POST /api/admin/reports/video-process-multiple
Content-Type: multipart/form-data

{
  videos: [arquivo1, arquivo2, arquivo3],
  projectName: "Residência Silva",
  technicianName: "João Silva",
  visitDate: "2024-12-15",
  visitPurpose: "vistoria",
  maxFrames: 20
}
```

---

## Diferencial Técnico

### 🎯 Clinical Eye (Olho Clínico)
- Não perde momentos importantes mesmo em vídeos de 5 minutos
- Identifica automaticamente frames com problemas técnicos
- Elimina transições, borrados e imagens sem valor

### 📊 Organização Semântica
- Agrupa conteúdo relacionado, independente da ordem cronológica
- Cria estrutura lógica e profissional
- Facilita leitura e compreensão do relatório

### 🎨 Design Monofloor
- Segue identidade visual da empresa
- Fundo cinza, paleta de cores, layout padronizado
- Textos introdutórios e conclusivos profissionais

### 💡 Análise Técnica Especializada
- Prompts calibrados para contexto de obra
- Terminologia técnica correta (MPa, substrato, aderência)
- Foco em problemas e requisitos, não apenas descrição

---

## Próximas Melhorias

- [ ] Logo Monofloor real no PDF (atualmente é texto)
- [ ] Cache de frames já analisados (evitar reprocessamento)
- [ ] Estimativa de custo antes de processar
- [ ] Preview dos frames selecionados antes de gerar PDF
- [ ] Opção de editar tópicos antes de gerar
- [ ] Suporte a legendas/anotações por frame
- [ ] Comparação antes/depois automática
- [ ] Detecção de medições (OCR em trenas/réguas)

---

## Suporte

**WhatsApp:** (41) 98848-4477
**Email:** contato@monofloor.com.br
