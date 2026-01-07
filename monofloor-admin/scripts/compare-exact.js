/**
 * Comparação EXATA entre Pipedrive e CRM - Pipeline 1, status open
 */

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
  // Buscar stages
  const stagesResp = await fetchPipedrive('/stages');
  const stageNames = {};
  const stageOrder = {};
  for (const s of stagesResp.data || []) {
    if (s.pipeline_id === 1) {
      stageNames[s.id] = s.name.trim();
      stageOrder[s.id] = s.order_nr;
    }
  }

  // Buscar deals do Pipedrive
  const deals = await getAllDeals();
  const pipeline1Open = deals.filter(d => d.pipeline_id === 1 && d.status === 'open');

  // Contar por stage no Pipedrive
  const pipeByStage = {};
  for (const d of pipeline1Open) {
    const name = stageNames[d.stage_id] || `Stage ${d.stage_id}`;
    if (!pipeByStage[name]) {
      pipeByStage[name] = { count: 0, order: stageOrder[d.stage_id] || 999 };
    }
    pipeByStage[name].count++;
  }

  // Contar por stage no CRM
  const crmByStage = await prisma.comercialData.groupBy({
    by: ['stageName'],
    where: {
      pipelineId: 1,
      dealStatus: 'open',
      pipedriveDealId: { not: null }
    },
    _count: { id: true }
  });

  const crmMap = {};
  for (const c of crmByStage) {
    crmMap[c.stageName] = c._count.id;
  }

  // Ordenar stages
  const sortedStages = Object.entries(pipeByStage)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([name]) => name);

  // Adicionar stages que só existem no CRM
  for (const c of crmByStage) {
    if (!sortedStages.includes(c.stageName)) {
      sortedStages.push(c.stageName);
    }
  }

  console.log('═'.repeat(75));
  console.log('COMPARAÇÃO EXATA: PIPEDRIVE vs CRM (Pipeline 1, status=open)');
  console.log('═'.repeat(75));
  console.log('');
  console.log('ETAPA'.padEnd(35) + '│ PIPEDRIVE │    CRM │ STATUS');
  console.log('─'.repeat(75));

  let totalPipe = 0;
  let totalCRM = 0;
  let allMatch = true;

  for (const stage of sortedStages) {
    const pipeCount = pipeByStage[stage]?.count || 0;
    const crmCount = crmMap[stage] || 0;
    totalPipe += pipeCount;
    totalCRM += crmCount;

    const match = pipeCount === crmCount;
    if (!match) allMatch = false;

    const status = match ? '✓ OK' : '✗ DIFF (' + (pipeCount - crmCount) + ')';
    console.log(stage.padEnd(35) + '│ ' + String(pipeCount).padStart(9) + ' │ ' + String(crmCount).padStart(6) + ' │ ' + status);
  }

  console.log('─'.repeat(75));
  console.log('TOTAL'.padEnd(35) + '│ ' + String(totalPipe).padStart(9) + ' │ ' + String(totalCRM).padStart(6) + ' │ ' + (totalPipe === totalCRM ? '✓ OK' : '✗ DIFF'));
  console.log('═'.repeat(75));

  if (allMatch && totalPipe === totalCRM) {
    console.log('\n✅ TODOS OS NÚMEROS BATEM EXATAMENTE!');
  } else {
    console.log('\n❌ Há diferenças que precisam ser corrigidas.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
