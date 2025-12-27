/**
 * Typeform Webhook Routes
 *
 * Receives webhook payloads from Typeform forms:
 * - waitlist | novo (uQwmO6L6) → Creates lead in Comercial
 * - Contrato (MR7zP9Sl) → Creates/updates project in Contratos
 */

import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { ComercialStatus } from '@prisma/client';

const router = Router();

// Typeform form IDs
const FORM_IDS = {
  WAITLIST: 'uQwmO6L6',
  CONTRATO: 'MR7zP9Sl',
};

// Field reference IDs from Typeform "waitlist | novo"
const WAITLIST_FIELD_REFS = {
  NOME: 'd22955cf-0355-4920-af4e-d5c459ee33b3',
  TIPO_CLIENTE: '67b60026-26ac-4666-af67-f382459afc6a',
  ESCRITORIO_ARQ: 'ba39550e-af05-44c7-9017-d53d4b762f89',
  ESCRITORIO_CLIENTE: '37b719ea-f801-4309-8bb6-59fe3c434a42',
  BUDGET: '34abe367-b05f-4faf-92de-f654a9cf0342',
  REGIAO: 'b7e773b0-73c4-4516-a95a-78c4d4ffdd92',
  ATENDE_METRAGEM_80: '0dfa0e82-8fa6-4cd0-a799-db8eb20421cb',
  ATENDE_METRAGEM_150: 'ea772a05-1343-4752-b183-5264e39e21b9',
  ATENDE_METRAGEM_300: '2bc90f3d-7d43-41d5-bdce-a880c537669f',
  DETALHES_METRAGEM: '1b29e5e3-389f-44a1-8e81-fe0377f477c3',
  CIDADE_OUTRO: '6ee5b188-7a2b-475a-85dd-0c7b89d250b7',
  FAIXA_METRAGEM: '097fec94-e5a6-4123-949b-b6b21abbdca0',
  DETALHES_METRAGEM_2: '6e76397a-57a3-4466-bde8-43b9063765f4',
  PREVISAO_EXECUCAO: '5155d54d-613f-46a7-8185-34d69603c3f5',
  CONTATO: '23763286-bb5b-4c21-b608-f975e92f4c24',
  CONTATO_WAITLIST: '0a505443-a460-4b13-b3e4-6b037dc48196',
};

// Mapping for region codes
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

// Mapping for budget
const BUDGET_MAP: Record<string, string> = {
  'Menos de 500 mil': 'Menos de 500 mil',
  'Entre 500 mil a 1 milhão': '500 mil a 1 milhão',
  'Entre 1 a 3 milhões': '1 a 3 milhões',
  'Entre 3 a 5 milhões': '3 a 5 milhões',
  'Entre 5 milhões e 10 milhões': '5 a 10 milhões',
  'Acima de 10 milhões': 'Acima de 10 milhões',
};

// Mapping for metragem faixa
const METRAGEM_MAP: Record<string, { faixa: string; estimativa: number }> = {
  'de 80m² a 150m²': { faixa: '80-150', estimativa: 115 },
  'de 150m² a 300m²': { faixa: '150-300', estimativa: 225 },
  'de 300m² a 500m²': { faixa: '300-500', estimativa: 400 },
  'de 500m² a 1000m²': { faixa: '500-1000', estimativa: 750 },
  'acima de 1000m²': { faixa: '1000+', estimativa: 1500 },
};

// Helper to get answer by field ref
function getAnswer(answers: any[], ref: string): any {
  const answer = answers.find((a: any) => a.field?.ref === ref);
  return answer;
}

// Helper to get text value from answer
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

// Helper to get contact info
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

/**
 * POST /webhooks/typeform/lead
 * Receives "waitlist | novo" form submissions
 */
router.post('/lead', async (req: Request, res: Response) => {
  console.log('📨 [Typeform] Received webhook for lead form');

  try {
    const payload = req.body;

    // Validate payload
    if (!payload.form_response) {
      return res.status(400).json({ error: 'Invalid payload: missing form_response' });
    }

    const formResponse = payload.form_response;
    const formId = formResponse.form_id;
    const responseId = formResponse.token;
    const submittedAt = formResponse.submitted_at;
    const answers = formResponse.answers || [];
    const hidden = formResponse.hidden || {};

    // Validate form ID
    if (formId !== FORM_IDS.WAITLIST) {
      console.log(`[Typeform] Ignoring form ${formId}, expected ${FORM_IDS.WAITLIST}`);
      return res.status(200).json({ message: 'Form ignored' });
    }

    // Check if already processed
    const existing = await prisma.comercialData.findFirst({
      where: { typeformResponseId: responseId },
    });

    if (existing) {
      console.log(`[Typeform] Response ${responseId} already processed`);
      return res.status(200).json({ message: 'Already processed' });
    }

    // Extract data from answers
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

    // Parse values
    const nome = getTextValue(nomeAnswer) || 'Lead Typeform';
    const tipoClienteRaw = getTextValue(tipoClienteAnswer);
    const tipoCliente = tipoClienteRaw?.includes('arquiteto') || tipoClienteRaw?.includes('Engenheiro')
      ? 'Arquiteto'
      : 'Cliente Final';
    const escritorio = getTextValue(escritorioArqAnswer) || getTextValue(escritorioClienteAnswer);
    const budgetRaw = getTextValue(budgetAnswer);
    const budget = budgetRaw ? (BUDGET_MAP[budgetRaw] || budgetRaw) : null;
    const regiaoRaw = getTextValue(regiaoAnswer);
    const regiao = regiaoRaw ? REGIAO_MAP[regiaoRaw] : null;
    const cidadeOutro = getTextValue(cidadeOutroAnswer);
    const cidadeDesc = regiao?.codigo === 'OUTRO' ? cidadeOutro : regiao?.descricao;
    const faixaMetragemRaw = getTextValue(faixaMetragemAnswer);
    const faixaMetragem = faixaMetragemRaw ? METRAGEM_MAP[faixaMetragemRaw] : null;
    const detalhesMetragem = getTextValue(detalhesMetragemAnswer);
    const previsaoExec = getTextValue(previsaoExecAnswer);
    const contato = getContactInfo(contatoAnswer);

    console.log(`[Typeform] Processing lead: ${nome} (${tipoCliente})`);
    console.log(`[Typeform] Contato: ${contato.nome}, ${contato.telefone}, ${contato.email}`);
    console.log(`[Typeform] Região: ${regiao?.codigo} (${cidadeDesc})`);
    console.log(`[Typeform] Metragem: ${faixaMetragem?.faixa} (~${faixaMetragem?.estimativa}m²)`);

    // Create project and comercial data
    const project = await prisma.project.create({
      data: {
        title: nome,
        cliente: nome,
        endereco: cidadeDesc || '',
        m2Total: faixaMetragem?.estimativa || 0,
        status: 'PAUSADO',
        currentModule: 'COMERCIAL',
      },
    });

    const comercialData = await prisma.comercialData.create({
      data: {
        projectId: project.id,

        // Status
        status: 'LEAD' as ComercialStatus,

        // Typeform tracking
        typeformResponseId: responseId,
        typeformSubmittedAt: new Date(submittedAt),
        dealOrigin: 'Typeform',
        dealOriginId: `typeform_${responseId}`,

        // Person info
        personName: contato.nome || nome,
        personEmail: contato.email,
        personPhone: contato.telefone,
        primeiroNomeZapi: contato.nome?.split(' ')[0] || nome.split(' ')[0],
        telefoneZapi: contato.telefone,

        // Project info
        tipoCliente,
        nomeEscritorio: escritorio,
        budgetEstimado: budget,
        cidadeExecucao: regiao?.codigo,
        cidadeExecucaoDesc: cidadeDesc,
        metragemEstimadaN1: faixaMetragem?.faixa,
        metragemEstimada: faixaMetragem?.estimativa?.toString(),
        descritivoArea: detalhesMetragem,
        dataPrevistaExec: previsaoExec,

        // Dates
        dealAddTime: new Date(submittedAt),

        // Raw data for debugging
        typeformRawData: payload as any,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        modulo: 'COMERCIAL',
        tipo: 'LEAD_CRIADO',
        titulo: 'Lead criado via Typeform',
        descricao: `Lead ${nome} criado a partir do formulário waitlist`,
        metadata: {
          typeformResponseId: responseId,
          tipoCliente,
          regiao: regiao?.codigo,
          metragem: faixaMetragem?.faixa,
        } as any,
      },
    });

    console.log(`✅ [Typeform] Lead created: ${project.id} (ComercialData: ${comercialData.id})`);

    res.status(200).json({
      success: true,
      projectId: project.id,
      comercialDataId: comercialData.id,
    });

  } catch (error: any) {
    console.error('❌ [Typeform] Error processing lead webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /webhooks/typeform/contrato
 * Receives "Contrato" form submissions
 */
router.post('/contrato', async (req: Request, res: Response) => {
  console.log('📨 [Typeform] Received webhook for contrato form');

  try {
    const payload = req.body;

    // Validate payload
    if (!payload.form_response) {
      return res.status(400).json({ error: 'Invalid payload: missing form_response' });
    }

    const formResponse = payload.form_response;
    const formId = formResponse.form_id;
    const responseId = formResponse.token;

    // Validate form ID
    if (formId !== FORM_IDS.CONTRATO) {
      console.log(`[Typeform] Ignoring form ${formId}, expected ${FORM_IDS.CONTRATO}`);
      return res.status(200).json({ message: 'Form ignored' });
    }

    // TODO: Implement contrato processing
    // This will be implemented when we set up the Contratos module
    console.log(`[Typeform] Contrato form received, processing not yet implemented`);

    res.status(200).json({
      success: true,
      message: 'Contrato form received, processing pending',
    });

  } catch (error: any) {
    console.error('❌ [Typeform] Error processing contrato webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /webhooks/typeform/test
 * Test endpoint to verify webhook is reachable
 */
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Typeform webhook endpoint is working',
    timestamp: new Date().toISOString(),
    forms: {
      waitlist: FORM_IDS.WAITLIST,
      contrato: FORM_IDS.CONTRATO,
    },
  });
});

export default router;
