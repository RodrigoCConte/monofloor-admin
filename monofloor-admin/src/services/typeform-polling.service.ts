/**
 * Typeform Polling Service
 *
 * Polls Typeform API for new responses and creates leads in the system.
 * All fields are mapped to match Pipedrive format for consistency.
 */

import { config } from '../config';
import prisma from '../lib/prisma';
import { ComercialStatus, Prisma } from '@prisma/client';
import { gptService } from './ai/gpt.service';
import { leadDistributionService } from './lead-distribution.service';

/**
 * Formata o primeiro nome para Z-API
 * Ex: "ALTAIR DA SILVA" → "Altair"
 * Ex: "joão pedro" → "João"
 */
function formatPrimeiroNome(nomeCompleto: string | null | undefined): string {
  if (!nomeCompleto) return '';
  const primeiroNome = nomeCompleto.trim().split(/\s+/)[0];
  if (!primeiroNome) return '';
  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

// =============================================
// CONFIGURAÇÕES DE PREÇO (igual ao Pipedrive)
// =============================================
const PRECO_BASE_M2 = 650;

// Tabela de preços base por faixa de metragem (compatível com Pipedrive)
const PRICING_TABLE: Record<string, { midpoint: number; pricePerM2: number }> = {
  'abaixo de 100m2': { midpoint: 75, pricePerM2: PRECO_BASE_M2 },
  'de 80m2 a 150m2': { midpoint: 115, pricePerM2: PRECO_BASE_M2 },
  'de 100m2 a 250m2': { midpoint: 175, pricePerM2: PRECO_BASE_M2 },
  'de 150m2 a 300m2': { midpoint: 225, pricePerM2: PRECO_BASE_M2 },
  'de 250m2 a 500m2': { midpoint: 375, pricePerM2: PRECO_BASE_M2 },
  'de 300m2 a 500m2': { midpoint: 400, pricePerM2: PRECO_BASE_M2 },
  'de 500m2 a 1000m2': { midpoint: 750, pricePerM2: PRECO_BASE_M2 },
  'acima de 1000m2': { midpoint: 1500, pricePerM2: PRECO_BASE_M2 },
};

// Função para calcular valor baseado na metragem (igual à do comercial.routes.ts)
function calculateDealValue(metragem: string | null): number | null {
  if (!metragem) return null;

  const metLower = metragem.toLowerCase().trim();

  // 1. Tentar match exato na tabela de faixas
  for (const [faixa, config] of Object.entries(PRICING_TABLE)) {
    if (metLower === faixa.toLowerCase() || metLower.includes(faixa.toLowerCase())) {
      return config.midpoint * config.pricePerM2;
    }
  }

  // 2. Tentar extrair número diretamente (ex: "150m²", "300m2", "450")
  const numMatch = metragem.match(/(\d+(?:[.,]\d+)?)\s*m?[²2]?/i);
  if (numMatch) {
    const m2 = parseFloat(numMatch[1].replace(',', '.'));
    if (!isNaN(m2) && m2 > 0) {
      return m2 * PRECO_BASE_M2;
    }
  }

  // 3. Tentar extrair faixa (ex: "80 a 150", "150-300")
  const rangeMatch = metragem.match(/(\d+)\s*(?:a|até|-)\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    const midpoint = (min + max) / 2;
    return midpoint * PRECO_BASE_M2;
  }

  return null;
}

// =============================================
// FIELD REFERENCES DO TYPEFORM
// =============================================
const WAITLIST_FIELD_REFS = {
  NOME: 'd22955cf-0355-4920-af4e-d5c459ee33b3',
  TIPO_CLIENTE: '67b60026-26ac-4666-af67-f382459afc6a',
  ESCRITORIO_ARQ: 'ba39550e-af05-44c7-9017-d53d4b762f89',
  ESCRITORIO_CLIENTE: '37b719ea-f801-4309-8bb6-59fe3c434a42',
  BUDGET: '34abe367-b05f-4faf-92de-f654a9cf0342',
  REGIAO: 'b7e773b0-73c4-4516-a95a-78c4d4ffdd92',
  CIDADE_OUTRO: '6ee5b188-7a2b-475a-85dd-0c7b89d250b7',
  FAIXA_METRAGEM: '097fec94-e5a6-4123-949b-b6b21abbdca0',
  DETALHES_METRAGEM: '1b29e5e3-389f-44a1-8e81-fe0377f477c3',
  DETALHES_METRAGEM_2: '6e76397a-57a3-4466-bde8-43b9063765f4',
  PREVISAO_EXECUCAO: '5155d54d-613f-46a7-8185-34d69603c3f5',
  CONTATO: '23763286-bb5b-4c21-b608-f975e92f4c24',
  CONTATO_WAITLIST: '0a505443-a460-4b13-b3e4-6b037dc48196',
  // Campos de contato separados (alguns forms usam campos separados em vez de contact_info)
  CONTATO_NOME: '002ba554-51ec-49b1-b1fe-3595e9dac660',
  CONTATO_TELEFONE: 'd0b8f242-79cb-4e4d-abdf-6e23166a112b',
  CONTATO_EMAIL: 'a541a982-f772-4ec4-a234-364345632d39',
};

// =============================================
// MAPEAMENTOS (compatíveis com Pipedrive)
// =============================================

// Mapeamento de região → código (igual ao Pipedrive)
const REGIAO_MAP: Record<string, { codigo: string; descricao: string }> = {
  'São Paulo (Capital)': { codigo: 'SP_CAPITAL', descricao: 'São Paulo (Capital)' },
  'Rio de Janeiro (Capital)': { codigo: 'RJ_CAPITAL', descricao: 'Rio de Janeiro (Capital)' },
  'Curitiba': { codigo: 'CURITIBA', descricao: 'Curitiba' },
  'Interior ou Litoral Paulista': { codigo: 'SP_INTERIOR', descricao: 'Interior/Litoral SP' },
  'Interior ou Litoral Carioca': { codigo: 'RJ_INTERIOR', descricao: 'Interior/Litoral RJ' },
  'Santa Catarina': { codigo: 'SC', descricao: 'Santa Catarina' },
  'Litoral Paranaense': { codigo: 'PR_LITORAL', descricao: 'Litoral PR' },
  'Outro': { codigo: 'OUTRO', descricao: 'Outro' },
};

// Mapeamento de budget (igual ao Pipedrive)
const BUDGET_MAP: Record<string, string> = {
  'Menos de 500 mil': 'Menos de 500 mil',
  'Entre 500 mil a 1 milhão': '500 mil a 1 milhão',
  'Entre 1 a 3 milhões': '1 a 3 milhões',
  'Entre 3 a 5 milhões': '3 a 5 milhões',
  'Entre 5 milhões e 10 milhões': '5 a 10 milhões',
  'Acima de 10 milhões': 'Acima de 10 milhões',
};

// Mapeamento de faixa de metragem → formato Pipedrive
const METRAGEM_MAP: Record<string, { faixaPipedrive: string; estimativa: number }> = {
  'de 80m² a 150m²': { faixaPipedrive: 'de 80m2 a 150m2', estimativa: 115 },
  'de 150m² a 300m²': { faixaPipedrive: 'de 150m2 a 300m2', estimativa: 225 },
  'de 300m² a 500m²': { faixaPipedrive: 'de 300m2 a 500m2', estimativa: 400 },
  'de 500m² a 1000m²': { faixaPipedrive: 'de 500m2 a 1000m2', estimativa: 750 },
  'acima de 1000m²': { faixaPipedrive: 'acima de 1000m2', estimativa: 1500 },
};

// =============================================
// HELPERS
// =============================================

function getAnswer(answers: any[], ref: string): any {
  return answers.find((a: any) => a.field?.ref === ref);
}

function getTextValue(answer: any): string | null {
  if (!answer) return null;
  if (answer.type === 'text') return answer.text;
  if (answer.type === 'choice') return answer.choice?.label || null;
  if (answer.type === 'boolean') return answer.boolean ? 'Sim' : 'Não';
  if (answer.type === 'email') return answer.email;
  if (answer.type === 'phone_number') return answer.phone_number;
  if (answer.type === 'dropdown') return answer.text || answer.choice?.label;
  return null;
}

function getContactInfo(answer: any): { nome?: string; telefone?: string; email?: string } {
  if (!answer || answer.type !== 'contact_info') return {};
  return {
    nome: answer.contact_info?.first_name || answer.contact_info?.last_name
      ? `${answer.contact_info?.first_name || ''} ${answer.contact_info?.last_name || ''}`.trim()
      : undefined,
    telefone: answer.contact_info?.phone_number,
    email: answer.contact_info?.email,
  };
}

// Função para extrair telefone de qualquer answer
function extractPhone(answers: any[]): string | null {
  // 1. Tentar campo específico de telefone
  const phoneByRef = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_TELEFONE);
  if (phoneByRef?.phone_number) return phoneByRef.phone_number;

  // 2. Buscar qualquer campo do tipo phone_number
  const phoneAnswer = answers.find((a: any) => a.type === 'phone_number');
  if (phoneAnswer?.phone_number) return phoneAnswer.phone_number;

  // 3. Tentar contact_info
  const contactAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO)
    || getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_WAITLIST);
  if (contactAnswer?.contact_info?.phone_number) return contactAnswer.contact_info.phone_number;

  return null;
}

// Função para extrair email de qualquer answer
function extractEmail(answers: any[]): string | null {
  // 1. Tentar campo específico de email
  const emailByRef = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_EMAIL);
  if (emailByRef?.email) return emailByRef.email;

  // 2. Buscar qualquer campo do tipo email
  const emailAnswer = answers.find((a: any) => a.type === 'email');
  if (emailAnswer?.email) return emailAnswer.email;

  // 3. Tentar contact_info
  const contactAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO)
    || getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_WAITLIST);
  if (contactAnswer?.contact_info?.email) return contactAnswer.contact_info.email;

  return null;
}

// Função para extrair nome de contato
function extractContactName(answers: any[]): string | null {
  // 1. Tentar campo específico de nome
  const nameByRef = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_NOME);
  if (nameByRef?.text) return nameByRef.text;

  // 2. Tentar contact_info
  const contactAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO)
    || getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_WAITLIST);
  const contactInfo = getContactInfo(contactAnswer);
  if (contactInfo.nome) return contactInfo.nome;

  return null;
}

// =============================================
// API TYPEFORM
// =============================================

let lastCheckTime: Date | null = null;

async function fetchTypeformResponses(formId: string, since?: Date): Promise<any[]> {
  const apiKey = config.typeform.apiKey;
  if (!apiKey) {
    console.log('[Typeform Polling] API key not configured');
    return [];
  }

  let url = `https://api.typeform.com/forms/${formId}/responses?page_size=100`;
  if (since) {
    url += `&since=${since.toISOString()}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Typeform Polling] API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json() as { items?: any[] };
    return data.items || [];
  } catch (error: any) {
    console.error('[Typeform Polling] Fetch error:', error.message);
    return [];
  }
}

// =============================================
// PROCESSAMENTO DE RESPOSTA
// =============================================

async function processResponse(formResponse: any): Promise<boolean> {
  const responseId = formResponse.token || formResponse.response_id;
  const submittedAt = formResponse.submitted_at;
  const answers = formResponse.answers || [];

  // Check if already processed
  const existing = await prisma.comercialData.findFirst({
    where: { typeformResponseId: responseId },
  });

  if (existing) {
    return false; // Already processed
  }

  // =============================================
  // EXTRAIR DADOS DO TYPEFORM
  // =============================================

  const nomeAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.NOME);
  const tipoClienteAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.TIPO_CLIENTE);
  const escritorioArqAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.ESCRITORIO_ARQ);
  const escritorioClienteAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.ESCRITORIO_CLIENTE);
  const budgetAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.BUDGET);
  const regiaoAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.REGIAO);
  const cidadeOutroAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.CIDADE_OUTRO);
  const faixaMetragemAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.FAIXA_METRAGEM);
  const detalhesMetragemAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.DETALHES_METRAGEM)
    || getAnswer(answers, WAITLIST_FIELD_REFS.DETALHES_METRAGEM_2);
  const previsaoExecAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.PREVISAO_EXECUCAO);
  const contatoAnswer = getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO)
    || getAnswer(answers, WAITLIST_FIELD_REFS.CONTATO_WAITLIST);

  // =============================================
  // PARSEAR E MAPEAR VALORES
  // =============================================

  // Nome (tenta várias fontes)
  const nomeFormulario = getTextValue(nomeAnswer);
  const nomeContato = extractContactName(answers);
  const nome = nomeContato || nomeFormulario || 'Lead Typeform';
  const primeiroNome = nome.split(' ')[0];

  // Telefone e Email (busca em várias fontes)
  const telefone = extractPhone(answers);
  const email = extractEmail(answers);

  // Tipo de cliente (compatível com Pipedrive)
  const tipoClienteRaw = getTextValue(tipoClienteAnswer);
  const tipoCliente = tipoClienteRaw?.toLowerCase().includes('arquiteto')
    || tipoClienteRaw?.toLowerCase().includes('engenheiro')
    ? 'Arquiteto'
    : 'Cliente Final';

  // Escritório
  const escritorioArq = getTextValue(escritorioArqAnswer);
  const escritorioCliente = getTextValue(escritorioClienteAnswer);
  const nomeEscritorio = escritorioArq || escritorioCliente || null;

  // Budget (mapeado para formato Pipedrive)
  const budgetRaw = getTextValue(budgetAnswer);
  const budgetEstimado = budgetRaw ? (BUDGET_MAP[budgetRaw] || budgetRaw) : null;

  // Região e cidade
  const regiaoRaw = getTextValue(regiaoAnswer);
  const regiao = regiaoRaw ? REGIAO_MAP[regiaoRaw] : null;
  const cidadeOutro = getTextValue(cidadeOutroAnswer);
  const cidadeExecucao = regiao?.codigo || null;
  const cidadeExecucaoDesc = regiao?.codigo === 'OUTRO' ? cidadeOutro : regiao?.descricao || null;

  // Metragem (mapeado para formato Pipedrive)
  const faixaMetragemRaw = getTextValue(faixaMetragemAnswer);
  const faixaMetragem = faixaMetragemRaw ? METRAGEM_MAP[faixaMetragemRaw] : null;
  const metragemEstimadaN1 = faixaMetragem?.faixaPipedrive || faixaMetragemRaw || null;
  const descritivoArea = getTextValue(detalhesMetragemAnswer) || null;

  // Usar IA para extrair metragem da descrição
  // Fallback: faixa estimativa > 150m²
  let metragemFinal = faixaMetragem?.estimativa || 150;

  if (descritivoArea && descritivoArea.trim().length > 0) {
    console.log(`[Typeform Polling] Processando descrição com IA: "${descritivoArea}"`);
    try {
      metragemFinal = await gptService.extractMetragemFromDescription(
        descritivoArea,
        faixaMetragem?.estimativa
      );
      console.log(`[Typeform Polling] ✅ Metragem extraída por IA: ${metragemFinal}m²`);
    } catch (error) {
      console.error(`[Typeform Polling] ❌ Erro ao processar com IA:`, error);
      console.log(`[Typeform Polling] Usando fallback: ${metragemFinal}m²`);
    }
  } else {
    console.log(`[Typeform Polling] Sem descrição, usando faixa/fallback: ${metragemFinal}m²`);
  }

  const metragemEstimada = metragemFinal.toString();

  // Previsão de execução
  const dataPrevistaExec = getTextValue(previsaoExecAnswer) || null;

  // Dados de contato finais
  const personName = nome;
  const personEmail = email;
  const personPhone = telefone;
  const telefoneZapi = telefone;
  const primeiroNomeZapi = formatPrimeiroNome(nome);

  // =============================================
  // CALCULAR VALOR DO DEAL (automação de preço)
  // =============================================

  // Usar metragem processada pela IA
  let dealValue: number | null = null;
  if (metragemFinal && metragemFinal > 0) {
    dealValue = metragemFinal * PRECO_BASE_M2;
  } else {
    dealValue = calculateDealValue(metragemEstimadaN1);
  }

  // =============================================
  // CRIAR REGISTROS NO BANCO
  // =============================================

  // =============================================
  // DISTRIBUIÇÃO AUTOMÁTICA DE CONSULTOR
  // =============================================

  // Determinar se é arquiteto (usa DDD) ou orçamento (usa cidade)
  const isArquiteto = tipoCliente === 'Arquiteto';

  // Obter próximo consultor baseado na região
  const consultorAssignado = leadDistributionService.getNextConsultor(
    cidadeExecucao,
    cidadeExecucaoDesc,
    personPhone,  // Para arquiteto, usa DDD do telefone
    isArquiteto
  );
  const consultorNome = consultorAssignado?.name || null;

  console.log(`[Typeform Polling] Processing lead: ${personName} (${tipoCliente})`);
  console.log(`[Typeform Polling]   Telefone: ${personPhone || 'N/A'}, Email: ${personEmail || 'N/A'}`);
  console.log(`[Typeform Polling]   Região: ${cidadeExecucaoDesc || cidadeExecucao || 'N/A'}`);
  console.log(`[Typeform Polling]   Metragem: ${metragemFinal}m², Valor: R$ ${dealValue?.toLocaleString('pt-BR') || 'N/A'}`);
  console.log(`[Typeform Polling]   Consultor: ${consultorNome || 'Não atribuído'} (${isArquiteto ? 'via DDD' : 'via cidade'})`);

  // Criar projeto
  const project = await prisma.project.create({
    data: {
      title: personName,
      cliente: personName,
      endereco: cidadeExecucaoDesc || '',
      m2Total: metragemFinal,
      status: 'PAUSADO',
      currentModule: 'COMERCIAL',
    },
  });

  // Criar ComercialData com TODOS os campos mapeados
  const comercialData = await prisma.comercialData.create({
    data: {
      projectId: project.id,

      // Status
      status: 'LEAD' as ComercialStatus,
      dealStatus: 'open',
      stageName: 'Lead',

      // Origem
      dealOrigin: 'form orcamento',
      dealOriginId: `typeform_${responseId}`,

      // Consultor (distribuição automática)
      consultorId: consultorNome,

      // Etiqueta (compatível com Pipedrive)
      labelPipedrive: 'Novo Lead',

      // Dados da pessoa
      personName,
      personEmail,
      personPhone,
      primeiroNomeZapi,
      telefoneZapi,

      // Tipo e escritório
      tipoCliente,
      nomeEscritorio,
      escritorio: nomeEscritorio,

      // Localização
      cidadeExecucao,
      cidadeExecucaoDesc,

      // Metragem (formato Pipedrive)
      metragemEstimadaN1,
      metragemEstimada,
      descritivoArea,

      // Budget
      budgetEstimado,

      // Previsão
      dataPrevistaExec,

      // Valor calculado automaticamente
      dealValue: dealValue || null,
      dealCurrency: 'BRL',

      // Datas
      dealAddTime: new Date(submittedAt),

      // Typeform metadata
      typeformResponseId: responseId,
      typeformSubmittedAt: new Date(submittedAt),
      typeformRawData: formResponse as any,
    },
  });

  // Criar evento na timeline
  await prisma.timelineEvent.create({
    data: {
      projectId: project.id,
      modulo: 'COMERCIAL',
      tipo: 'LEAD_CRIADO',
      titulo: 'Lead criado via Typeform',
      descricao: `Lead ${personName} criado a partir do formulário de orçamento`,
      metadata: {
        typeformResponseId: responseId,
        tipoCliente,
        regiao: cidadeExecucao,
        metragem: metragemEstimadaN1,
        valorCalculado: dealValue,
        consultor: consultorNome,
        distribuicao: isArquiteto ? 'via DDD' : 'via cidade',
      } as any,
    },
  });

  console.log(`✅ [Typeform Polling] Lead created: ${project.id}`);
  console.log(`   ComercialData: ${comercialData.id}`);
  console.log(`   Consultor: ${consultorNome || 'N/A'}`);
  console.log(`   Label: Novo Lead`);
  console.log(`   Valor: R$ ${dealValue?.toLocaleString('pt-BR') || 'N/A'}`);

  // =============================================
  // GERAÇÃO AUTOMÁTICA DE PROPOSTA
  // =============================================

  // Gerar proposta automática se tiver metragem válida
  if (metragemFinal && metragemFinal > 0 && dealValue && dealValue > 0) {
    try {
      // Calcular valor por m2
      const valorM2 = dealValue / metragemFinal;

      // Criar proposta automática
      const proposta = await prisma.proposta.create({
        data: {
          comercialId: comercialData.id,
          valorTotal: new Prisma.Decimal(dealValue),
          valorM2: new Prisma.Decimal(valorM2),
          metragem: new Prisma.Decimal(metragemFinal),
          desconto: new Prisma.Decimal(0),
          status: 'DRAFT',
          descricao: `Proposta automática gerada via Typeform - ${metragemEstimadaN1 || metragemFinal + 'm²'}`,
          dadosCalculo: {
            origem: 'typeform_auto',
            metragemOriginal: metragemFinal,
            precoBase: PRECO_BASE_M2,
            tipoCliente,
            faixaMetragem: metragemEstimadaN1,
            descritivoArea,
            createdAt: new Date().toISOString(),
          },
        },
      });

      console.log(`📄 [Typeform Polling] Proposta automática gerada: #${proposta.id.slice(-6)}`);
      console.log(`   Valor: R$ ${dealValue.toLocaleString('pt-BR')}`);
      console.log(`   Metragem: ${metragemFinal}m²`);

      // Criar evento na timeline
      await prisma.timelineEvent.create({
        data: {
          projectId: project.id,
          modulo: 'COMERCIAL',
          tipo: 'PROPOSTA_GERADA',
          titulo: 'Proposta automática gerada',
          descricao: `Proposta gerada automaticamente (R$ ${dealValue.toLocaleString('pt-BR')})`,
          metadata: {
            propostaId: proposta.id,
            valorTotal: dealValue,
            metragem: metragemFinal,
            valorM2,
          } as any,
        },
      });
    } catch (propostaError: any) {
      console.error(`[Typeform Polling] Erro ao criar proposta automática:`, propostaError.message);
      // Não interrompe o fluxo - proposta é opcional
    }
  }

  return true;
}

// =============================================
// POLLING SCHEDULER
// =============================================

export async function pollTypeformResponses(): Promise<{ processed: number; skipped: number }> {
  const formId = config.typeform.formIds.waitlist;

  console.log(`📋 [Typeform Polling] Checking for new responses...`);

  const responses = await fetchTypeformResponses(formId, lastCheckTime || undefined);

  let processed = 0;
  let skipped = 0;

  for (const response of responses) {
    try {
      const wasProcessed = await processResponse(response);
      if (wasProcessed) {
        processed++;
      } else {
        skipped++;
      }
    } catch (error: any) {
      console.error(`[Typeform Polling] Error processing response:`, error.message);
    }
  }

  lastCheckTime = new Date();

  if (processed > 0) {
    console.log(`📋 [Typeform Polling] Done: ${processed} new leads, ${skipped} already processed`);
  }

  return { processed, skipped };
}

let pollingInterval: NodeJS.Timeout | null = null;

export function startTypeformPolling(): void {
  if (!config.typeform.apiKey) {
    console.log('[Typeform Polling] API key not configured, skipping');
    return;
  }

  // Initial poll
  pollTypeformResponses();

  // Schedule periodic polling
  pollingInterval = setInterval(() => {
    pollTypeformResponses();
  }, config.typeform.pollingIntervalMs);

  console.log(`📋 [Typeform Polling] Started (every ${config.typeform.pollingIntervalMs / 1000}s)`);
}

export function stopTypeformPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Typeform Polling] Stopped');
  }
}
