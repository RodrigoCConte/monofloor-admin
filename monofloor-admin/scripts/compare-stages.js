const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';

async function fetchPipedrive(endpoint) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://api.pipedrive.com/v1${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  const response = await fetch(url);
  return response.json();
}

async function getAllDeals() {
  const allDeals = [];
  let start = 0;
  let hasMore = true;
  while (hasMore) {
    const response = await fetchPipedrive(`/deals?status=all_not_deleted&start=${start}&limit=500`);
    if (response.data && response.data.length > 0) allDeals.push(...response.data);
    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += 500;
  }
  return allDeals;
}

async function main() {
  // Buscar stages do Pipedrive
  const stagesResp = await fetchPipedrive('/stages');
  const stageNames = {};
  for (const s of stagesResp.data || []) {
    stageNames[s.id] = s.name;
  }

  // Buscar deals do Pipedrive
  console.log('Buscando deals do Pipedrive...');
  const pipedriveDeals = await getAllDeals();

  // Contar por stage no Pipedrive
  const pipedriveByStage = {};
  for (const deal of pipedriveDeals) {
    const stageName = stageNames[deal.stage_id] || `Stage ${deal.stage_id}`;
    const key = deal.status === 'won' ? 'GANHO (won)' :
                deal.status === 'lost' ? 'PERDIDO (lost)' : stageName;
    pipedriveByStage[key] = (pipedriveByStage[key] || 0) + 1;
  }

  // Buscar do CRM por stageName
  const crmByStage = await prisma.comercialData.groupBy({
    by: ['stageName'],
    where: { pipedriveDealId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  // Buscar leads locais
  const leadsLocais = await prisma.comercialData.count({
    where: { pipedriveDealId: null }
  });

  console.log('═'.repeat(80));
  console.log('COMPARAÇÃO POR ETAPA: PIPEDRIVE vs CRM');
  console.log('═'.repeat(80));

  console.log('\n' + 'ETAPA'.padEnd(40) + ' | ' + 'PIPEDRIVE'.padStart(10) + ' | ' + 'CRM'.padStart(10) + ' | DIFF');
  console.log('─'.repeat(75));

  // Combinar todas as etapas
  const allStages = new Set([...Object.keys(pipedriveByStage), ...crmByStage.map(c => c.stageName || 'NULL')]);

  let totalPipe = 0;
  let totalCRM = 0;

  for (const stage of [...allStages].sort()) {
    const pipeCount = pipedriveByStage[stage] || 0;
    const crmItem = crmByStage.find(c => c.stageName === stage);
    const crmCount = crmItem?._count?.id || 0;

    totalPipe += pipeCount;
    totalCRM += crmCount;

    const diff = pipeCount - crmCount;
    let diffStr = '';
    if (diff > 0) diffStr = `+${diff}`;
    else if (diff < 0) diffStr = `${diff}`;

    console.log((stage || 'NULL').substring(0, 40).padEnd(40) + ' | ' +
                String(pipeCount).padStart(10) + ' | ' +
                String(crmCount).padStart(10) + ' | ' + diffStr);
  }

  console.log('─'.repeat(75));
  console.log('TOTAL'.padEnd(40) + ' | ' + String(totalPipe).padStart(10) + ' | ' + String(totalCRM).padStart(10));

  console.log(`\n📍 Leads LOCAIS (sem pipedriveDealId): ${leadsLocais}`);

  // Mostrar os que faltam
  const crmPipedriveIds = await prisma.comercialData.findMany({
    where: { pipedriveDealId: { not: null } },
    select: { pipedriveDealId: true }
  });
  const crmIdSet = new Set(crmPipedriveIds.map(c => c.pipedriveDealId));
  const missing = pipedriveDeals.filter(d => !crmIdSet.has(String(d.id)));

  console.log(`\n⚠️  ${missing.length} DEALS DO PIPEDRIVE QUE FALTAM NO CRM:`);
  for (const deal of missing.slice(0, 20)) {
    const stageName = stageNames[deal.stage_id] || `Stage ${deal.stage_id}`;
    console.log(`   - ID ${deal.id}: ${deal.person_name || deal.title} [${stageName}] (${deal.status})`);
  }
  if (missing.length > 20) {
    console.log(`   ... e mais ${missing.length - 20}`);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
