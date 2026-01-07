/**
 * Sincronização completa dos leads Form Orçamento
 *
 * - Cria leads que faltam no sistema
 * - Atualiza consultor/vendedor de todos os leads
 * - Preenche informações faltantes (telefone, nome Z-API, etc.)
 */

import { PrismaClient, ComercialStatus } from '@prisma/client';

const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';
const FORM_ORCAMENTO_STAGE_ID = 1;

// Custom field mappings
const PIPEDRIVE_CUSTOM_FIELDS: Record<string, string> = {
  'aa5d8cc9c5b0b926ebb0a2c3eb73f443bec731b4': 'resumo',
  '2c3ffa560c132066eb8503bc58a5b1a35b9bff4c': 'metragemEstimada',
  'b738870cd03c6212a2cedb5a94e6b969b5cac7cd': 'metragemEstimadaN1',
  '9f938c89c2b9b6aeb1ee15934eb103e1b4847bdf': 'descritivoArea',
  '9fd47f2f4b67f8f7ab5ac5444e988b0222eaad45': 'detalhesArquiteto',
  '87845e892df12877faac618a35d9064c3cf2833f': 'cidadeExecucaoDesc',
  '60a014040c370143e4e8d58efc47c7ecfec484d6': 'cidadeExecucao',
  '1f41e2ababaaca38f6eda10f0118d8739895f4d7': 'tipoCliente',
  '6c33ac42e32df9ffcfe148880cdbcccedb3c3345': 'tipoProjeto',
  '461af1e6927db97e477004b68d9eed2a123b237a': 'nomeEscritorio',
  '6e584cf39b9b71ed4f0b1cc87268d8f25decc86e': 'budgetEstimado',
  'f8d5ce157fe481c15a867f146497eb5831d81249': 'estadoObra',
  'f74d97aed5827fcfa0c40e0cfe83efa0e161764f': 'metragemSemArq',
  'e34c43d77127f2032b7827450093a89db01db960': 'dataPrevistaExec',
  '162d774100ff3792cc5d0c79a3439525d9a9bc14': 'primeiroNomeZapi',
  '9ed948b3581f019a0ed8cc2dcab3e106bfca84c4': 'telefoneZapi',
};

async function fetchPipedrive(endpoint: string): Promise<any> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  const response = await fetch(url);
  return response.json();
}

async function getAllFormOrcamentoDeals(): Promise<any[]> {
  const allDeals: any[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchPipedrive(
      `/deals?stage_id=${FORM_ORCAMENTO_STAGE_ID}&status=open&start=${start}&limit=${limit}`
    );
    if (response.data && response.data.length > 0) {
      allDeals.push(...response.data);
    }
    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += limit;
  }

  return allDeals;
}

function formatPrimeiroNome(nomeCompleto: string | null | undefined): string {
  if (!nomeCompleto) return '';
  const primeiroNome = nomeCompleto.trim().split(/\s+/)[0];
  if (!primeiroNome) return '';
  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

function formatTelefoneZapi(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove tudo exceto números
  let cleaned = phone.replace(/\D/g, '');
  // Se começar com 55, mantém; se não, adiciona
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }
  return cleaned || null;
}

async function main() {
  console.log('═'.repeat(80));
  console.log('SINCRONIZAÇÃO COMPLETA: PIPEDRIVE FORM ORÇAMENTO');
  console.log('═'.repeat(80) + '\n');

  // 1. Buscar todos os deals do Pipedrive
  console.log('[Pipedrive] Buscando deals do stage "Form Orçamento"...');
  const pipedriveDeals = await getAllFormOrcamentoDeals();
  console.log(`[Pipedrive] Total: ${pipedriveDeals.length} deals\n`);

  // 2. Buscar leads existentes no sistema
  const sistemaLeads = await prisma.comercialData.findMany({
    where: { pipedriveDealId: { not: null } },
    select: {
      id: true,
      pipedriveDealId: true,
      projectId: true,
    }
  });

  const sistemaByPipedriveId = new Map<string, any>();
  for (const lead of sistemaLeads) {
    if (lead.pipedriveDealId) {
      sistemaByPipedriveId.set(lead.pipedriveDealId, lead);
    }
  }

  console.log(`[Sistema] Leads com pipedriveDealId: ${sistemaLeads.length}\n`);

  // 3. Processar cada deal
  let created = 0;
  let updated = 0;
  let errors = 0;

  console.log('[Sync] Processando deals...\n');

  for (const deal of pipedriveDeals) {
    try {
      const pipedriveId = String(deal.id);
      const existingLead = sistemaByPipedriveId.get(pipedriveId);

      // Extrair campos customizados
      const customFields: Record<string, any> = {};
      for (const [hash, fieldName] of Object.entries(PIPEDRIVE_CUSTOM_FIELDS)) {
        if (deal[hash] !== undefined && deal[hash] !== null) {
          customFields[fieldName] = deal[hash];
        }
      }

      // Dados do contato
      const personName = deal.person_name || deal.person_id?.name || deal.title || 'Lead Pipedrive';
      const personEmail = deal.person_id?.email?.[0]?.value || null;
      const personPhone = deal.person_id?.phone?.[0]?.value || null;

      // Consultor/Vendedor (owner do deal)
      const consultorId = deal.user_id?.name || deal.owner_name || null;
      const consultorEmail = deal.user_id?.email || null;

      // Formatar para Z-API
      const primeiroNomeZapi = customFields.primeiroNomeZapi || formatPrimeiroNome(personName);
      const telefoneZapi = customFields.telefoneZapi || formatTelefoneZapi(personPhone);

      // Metragem
      let metragemEstimada = customFields.metragemEstimada;
      if (!metragemEstimada && customFields.metragemEstimadaN1) {
        // Tentar extrair número da faixa
        const match = customFields.metragemEstimadaN1.match(/(\d+)/);
        if (match) metragemEstimada = match[1];
      }

      // Dados para criar/atualizar
      const comercialData = {
        pipedriveDealId: pipedriveId,
        pipedrivePersonId: deal.person_id?.value || null,
        pipedriveOrgId: deal.org_id?.value || null,
        stageId: deal.stage_id,
        stageName: 'Form Orçamento',
        stageOrderNr: deal.stage_order_nr,
        pipelineId: deal.pipeline_id,
        pipedriveUrl: `https://monofloor.pipedrive.com/deal/${deal.id}`,

        // Contato
        personName,
        personEmail,
        personPhone,
        primeiroNomeZapi,
        telefoneZapi,

        // Consultor (vendedor designado)
        consultorId,
        ownerUserId: deal.user_id?.value || null,
        ownerUserName: consultorId,
        ownerUserEmail: consultorEmail,

        // Valores
        dealValue: deal.value ? parseFloat(deal.value) : null,
        dealCurrency: deal.currency || 'BRL',

        // Datas
        dealAddTime: deal.add_time ? new Date(deal.add_time) : null,
        dealUpdateTime: deal.update_time ? new Date(deal.update_time) : null,

        // Status
        status: 'LEAD' as ComercialStatus,
        dealStatus: deal.status,
        dealOrigin: deal.origin || 'form orcamento',
        labelPipedrive: deal.label || null,

        // Campos customizados
        ...customFields,

        // Sync
        pipedriveSyncedAt: new Date(),
        pipedriveRawData: deal,
      };

      if (existingLead) {
        // Atualizar lead existente
        await prisma.comercialData.update({
          where: { id: existingLead.id },
          data: {
            ...comercialData,
            // Não atualizar projectId
            projectId: undefined,
          },
        });

        // Atualizar projeto se existir
        if (existingLead.projectId) {
          await prisma.project.update({
            where: { id: existingLead.projectId },
            data: {
              cliente: personName,
              m2Total: metragemEstimada ? parseFloat(metragemEstimada) : undefined,
            },
          });
        }

        updated++;
        console.log(`  ✅ Atualizado: ${personName} (Consultor: ${consultorId || 'N/A'})`);
      } else {
        // Criar novo projeto
        const m2Value = metragemEstimada ? parseFloat(metragemEstimada) : 0;
        const project = await prisma.project.create({
          data: {
            title: personName,
            cliente: personName,
            endereco: customFields.cidadeExecucaoDesc || '',
            m2Total: isNaN(m2Value) ? 0 : m2Value,
            status: 'PAUSADO',
            currentModule: 'COMERCIAL',
          },
        });

        // Criar comercialData
        await prisma.comercialData.create({
          data: {
            ...comercialData,
            project: { connect: { id: project.id } },
          },
        });

        created++;
        console.log(`  ➕ Criado: ${personName} (Consultor: ${consultorId || 'N/A'})`);
      }
    } catch (err: any) {
      errors++;
      console.log(`  ❌ Erro: ${deal.person_name || deal.title} - ${err.message}`);
    }
  }

  // 4. Relatório final
  console.log('\n' + '═'.repeat(80));
  console.log('RESULTADO:');
  console.log('═'.repeat(80));
  console.log(`  ➕ Leads criados: ${created}`);
  console.log(`  ✅ Leads atualizados: ${updated}`);
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`  📊 Total processado: ${pipedriveDeals.length}`);
  console.log('═'.repeat(80) + '\n');

  // 5. Verificar leads que faltam informação
  console.log('\n[Verificação] Leads sem informações importantes:');

  const leadsIncompletos = await prisma.comercialData.findMany({
    where: {
      stageName: 'Form Orçamento',
      OR: [
        { personPhone: null },
        { primeiroNomeZapi: null },
        { primeiroNomeZapi: '' },
        { telefoneZapi: null },
        { telefoneZapi: '' },
        { consultorId: null },
      ]
    },
    select: {
      personName: true,
      personPhone: true,
      primeiroNomeZapi: true,
      telefoneZapi: true,
      consultorId: true,
    }
  });

  if (leadsIncompletos.length > 0) {
    console.log(`\n⚠️  ${leadsIncompletos.length} leads com informações faltando:`);
    for (const lead of leadsIncompletos.slice(0, 10)) {
      const missing: string[] = [];
      if (!lead.personPhone) missing.push('telefone');
      if (!lead.primeiroNomeZapi) missing.push('primeiroNomeZapi');
      if (!lead.telefoneZapi) missing.push('telefoneZapi');
      if (!lead.consultorId) missing.push('consultor');
      console.log(`  • ${lead.personName}: falta ${missing.join(', ')}`);
    }
    if (leadsIncompletos.length > 10) {
      console.log(`  ... e mais ${leadsIncompletos.length - 10}`);
    }
  } else {
    console.log('✅ Todos os leads têm informações completas!');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
