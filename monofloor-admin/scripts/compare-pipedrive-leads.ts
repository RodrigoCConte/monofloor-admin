/**
 * Comparação detalhada: Pipedrive Form Orçamento vs Sistema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';
const FORM_ORCAMENTO_STAGE_ID = 1;

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

async function main() {
  console.log('═'.repeat(80));
  console.log('COMPARAÇÃO DETALHADA: PIPEDRIVE vs SISTEMA');
  console.log('═'.repeat(80) + '\n');

  // 1. Buscar do Pipedrive
  console.log('[Pipedrive] Buscando deals do stage "Form Orçamento"...');
  const pipedriveDeals = await getAllFormOrcamentoDeals();
  console.log(`[Pipedrive] Total: ${pipedriveDeals.length} deals\n`);

  // 2. Buscar do sistema - todos os leads com pipedriveDealId
  const sistemaLeads = await prisma.comercialData.findMany({
    where: {
      pipedriveDealId: { not: null }
    },
    select: {
      id: true,
      pipedriveDealId: true,
      personName: true,
      personPhone: true,
      personEmail: true,
      status: true,
      stageName: true,
      stageId: true,
    }
  });

  console.log(`[Sistema] Leads com pipedriveDealId: ${sistemaLeads.length}`);

  // 3. Criar mapa do sistema por pipedriveDealId
  const sistemaByPipedriveId = new Map<string, any>();
  for (const lead of sistemaLeads) {
    if (lead.pipedriveDealId) {
      sistemaByPipedriveId.set(lead.pipedriveDealId, lead);
    }
  }

  // 4. Verificar quais deals do Pipedrive existem no sistema
  const existemNoDois: any[] = [];
  const faltamNoSistema: any[] = [];

  for (const deal of pipedriveDeals) {
    const pipedriveId = String(deal.id);
    if (sistemaByPipedriveId.has(pipedriveId)) {
      existemNoDois.push({
        pipedrive: deal,
        sistema: sistemaByPipedriveId.get(pipedriveId)
      });
    } else {
      faltamNoSistema.push(deal);
    }
  }

  // 5. Verificar quais leads do sistema (Form Orçamento) não existem no Pipedrive
  const pipedriveIds = new Set(pipedriveDeals.map(d => String(d.id)));

  // Pegar apenas leads que estão no stage Form Orçamento no sistema
  const sistemaFormOrcamento = sistemaLeads.filter(l =>
    l.stageName === 'Form Orçamento' || l.stageId === 1
  );

  const sobramNoSistema = sistemaFormOrcamento.filter(l =>
    l.pipedriveDealId && !pipedriveIds.has(l.pipedriveDealId)
  );

  // 6. Relatório
  console.log('\n' + '─'.repeat(80));
  console.log('RESULTADO:');
  console.log('─'.repeat(80));
  console.log(`✅ Deals no Pipedrive (Form Orçamento): ${pipedriveDeals.length}`);
  console.log(`✅ Existem nos dois sistemas: ${existemNoDois.length}`);
  console.log(`➕ Faltam no sistema (criar): ${faltamNoSistema.length}`);
  console.log(`⚠️  Sobram no sistema (stageName=Form Orçamento mas não no Pipedrive): ${sobramNoSistema.length}`);

  if (faltamNoSistema.length > 0) {
    console.log('\n📋 LEADS QUE FALTAM NO SISTEMA:');
    for (const deal of faltamNoSistema.slice(0, 10)) {
      console.log(`  • ${deal.person_name || deal.title} (ID: ${deal.id})`);
    }
    if (faltamNoSistema.length > 10) {
      console.log(`  ... e mais ${faltamNoSistema.length - 10}`);
    }
  }

  if (sobramNoSistema.length > 0) {
    console.log('\n📋 LEADS QUE SOBRAM NO SISTEMA (não no Pipedrive Form Orçamento):');
    for (const lead of sobramNoSistema) {
      console.log(`  • ${lead.personName} (Pipedrive ID: ${lead.pipedriveDealId}, Stage: ${lead.stageName})`);
    }
  }

  // 7. Verificar status dos leads existentes
  const statusCount: Record<string, number> = {};
  for (const item of existemNoDois) {
    const status = item.sistema.status;
    statusCount[status] = (statusCount[status] || 0) + 1;
  }

  console.log('\n📊 STATUS DOS LEADS QUE EXISTEM NOS DOIS:');
  for (const [status, count] of Object.entries(statusCount)) {
    console.log(`  ${status}: ${count}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
