/**
 * Sincroniza APENAS o Pipeline 1 do Pipedrive com o CRM
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';

const STAGE_TO_STATUS = {
  'form orçamento': 'LEAD',
  '1º contato': 'PRIMEIRO_CONTATO',
  '1º contato feito': 'PRIMEIRO_CONTATO',
  'follow 1º contato': 'FOLLOW_UP',
  'follow 1º contato feito': 'FOLLOW_UP',
  'form arquiteto': 'CONTATO_ARQUITETO',
  'contato arquiteto': 'CONTATO_ARQUITETO',
  'proposta escopo minimo': 'LEVANTAMENTO',
  'cálculo de projeto': 'LEVANTAMENTO',
  'projeto levantado': 'LEVANTAMENTO',
  'cálculo deslocamento': 'LEVANTAMENTO',
  'deslocamento levantado': 'LEVANTAMENTO',
  'proposta enviada': 'PROPOSTA_ENVIADA',
  'fazer follow 1': 'FOLLOW_UP',
  'follow 1 feito': 'FOLLOW_UP',
  'fazer follow 2': 'FOLLOW_UP',
  'follow 2 feito': 'FOLLOW_UP',
  'fazer follow 3': 'FOLLOW_UP',
  'follow 3 feito': 'FOLLOW_UP',
  'negociações': 'NEGOCIACAO',
  'perdido': 'PERDIDO',
  'ganho': 'GANHO',
};

function getStatusFromStageName(stageName) {
  const normalized = (stageName || '').toLowerCase().trim();
  return STAGE_TO_STATUS[normalized] || 'LEAD';
}

async function fetchPipedrive(endpoint) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://api.pipedrive.com/v1${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  const response = await fetch(url);
  return response.json();
}

async function getAllDealsPipeline1() {
  const allDeals = [];
  let start = 0;
  let hasMore = true;
  console.log('Buscando deals do Pipeline 1...');
  while (hasMore) {
    // Filtrar apenas pipeline_id=1
    const response = await fetchPipedrive(`/deals?status=all_not_deleted&start=${start}&limit=500`);
    if (response.data && response.data.length > 0) {
      // Filtrar apenas pipeline 1
      const pipeline1Deals = response.data.filter(d => d.pipeline_id === 1);
      allDeals.push(...pipeline1Deals);
      process.stdout.write(`\r  ${allDeals.length} deals do Pipeline 1...`);
    }
    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += 500;
  }
  console.log(`\n  Total Pipeline 1: ${allDeals.length} deals`);
  return allDeals;
}

async function main() {
  console.log('='.repeat(60));
  console.log('SINCRONIZACAO PIPELINE 1 APENAS');
  console.log('='.repeat(60));

  // 1. Buscar stages do Pipedrive
  console.log('\n[1] Buscando stages...');
  const stagesResp = await fetchPipedrive('/stages');
  const stageNames = {};
  for (const s of stagesResp.data || []) {
    stageNames[s.id] = s.name.trim();
  }

  // 2. Buscar deals do Pipeline 1
  const pipedriveDeals = await getAllDealsPipeline1();

  // 3. Buscar IDs existentes no CRM (apenas pipeline 1)
  const existingLeads = await prisma.comercialData.findMany({
    where: {
      pipedriveDealId: { not: null },
      pipelineId: 1
    },
    select: { id: true, pipedriveDealId: true }
  });
  const existingIds = new Set(existingLeads.map(l => l.pipedriveDealId));
  console.log(`\nCRM Pipeline 1: ${existingLeads.length} leads`);

  // 4. Agrupar para batch updates
  const groups = {};
  const missingDeals = [];

  for (const deal of pipedriveDeals) {
    const pipedriveId = String(deal.id);

    let stageName = stageNames[deal.stage_id] || `Stage ${deal.stage_id}`;
    if (deal.status === 'won') stageName = 'Ganho';
    else if (deal.status === 'lost') stageName = 'Perdido';

    const crmStatus = getStatusFromStageName(stageName);
    const key = `${stageName}|${deal.status}|${crmStatus}|${deal.stage_id}`;

    if (existingIds.has(pipedriveId)) {
      if (!groups[key]) {
        groups[key] = { stageName, dealStatus: deal.status, crmStatus, stageId: deal.stage_id, ids: [] };
      }
      groups[key].ids.push(pipedriveId);
    } else {
      missingDeals.push(deal);
    }
  }

  console.log(`\n[2] Atualizando ${Object.keys(groups).length} grupos...\n`);

  let updated = 0;
  for (const [key, group] of Object.entries(groups)) {
    try {
      const result = await prisma.comercialData.updateMany({
        where: { pipedriveDealId: { in: group.ids } },
        data: {
          stageName: group.stageName,
          stageId: group.stageId,
          pipelineId: 1,
          status: group.crmStatus,
          dealStatus: group.dealStatus,
          pipedriveSyncedAt: new Date(),
        }
      });
      updated += result.count;
      console.log(`  OK ${group.stageName.padEnd(30)} (${group.dealStatus}): ${result.count}`);
    } catch (err) {
      console.log(`  ERRO ${group.stageName}: ${err.message}`);
    }
  }

  console.log(`\n[3] Criando ${missingDeals.length} deals que faltam...\n`);

  let created = 0;
  for (const deal of missingDeals) {
    try {
      const personName = deal.person_name || deal.title || 'Lead Pipedrive';
      let stageName = stageNames[deal.stage_id] || `Stage ${deal.stage_id}`;
      if (deal.status === 'won') stageName = 'Ganho';
      else if (deal.status === 'lost') stageName = 'Perdido';
      const crmStatus = getStatusFromStageName(stageName);

      const project = await prisma.project.create({
        data: {
          title: personName,
          cliente: personName,
          endereco: '',
          m2Total: 0,
          status: 'PAUSADO',
          currentModule: 'COMERCIAL',
        }
      });

      await prisma.comercialData.create({
        data: {
          projectId: project.id,
          pipedriveDealId: String(deal.id),
          pipedriveUrl: `https://monofloor.pipedrive.com/deal/${deal.id}`,
          personName: personName,
          personEmail: deal.person_id?.email?.[0]?.value || null,
          personPhone: deal.person_id?.phone?.[0]?.value || null,
          dealValue: deal.value ? parseFloat(deal.value) : null,
          dealCurrency: deal.currency || 'BRL',
          dealAddTime: deal.add_time ? new Date(deal.add_time) : null,
          dealOrigin: 'pipedrive',
          stageId: deal.stage_id,
          stageName: stageName,
          pipelineId: 1,
          status: crmStatus,
          dealStatus: deal.status,
          ownerUserName: deal.user_id?.name || deal.owner_name || null,
          consultorId: deal.user_id?.name || deal.owner_name || null,
          pipedriveSyncedAt: new Date(),
        }
      });
      created++;
      if (created % 10 === 0) process.stdout.write(`\r  Criados: ${created}...`);
    } catch (err) {
      // Silencioso para não poluir output
    }
  }
  if (created > 0) console.log(`\r  Criados: ${created}                    `);

  // Verificar final
  const finalCount = await prisma.comercialData.count({ where: { pipelineId: 1, pipedriveDealId: { not: null } } });

  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO:');
  console.log('='.repeat(60));
  console.log(`  Criados: ${created}`);
  console.log(`  Atualizados: ${updated}`);
  console.log(`\n  Pipedrive Pipeline 1: ${pipedriveDeals.length} deals`);
  console.log(`  CRM Pipeline 1: ${finalCount} leads`);

  if (pipedriveDeals.length === finalCount) {
    console.log('\n OK - NUMEROS BATEM!');
  } else {
    console.log(`\n DIFERENCA: ${Math.abs(pipedriveDeals.length - finalCount)}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
