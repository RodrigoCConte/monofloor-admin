/**
 * Comparação FUNIL POR FUNIL: Pipedrive vs CRM
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
  console.log('Buscando dados...\n');

  // Buscar pipelines
  const pipelinesResp = await fetchPipedrive('/pipelines');
  const pipelines = {};
  for (const p of pipelinesResp.data || []) {
    pipelines[p.id] = p.name;
  }

  // Buscar stages (aplicar trim para normalizar)
  const stagesResp = await fetchPipedrive('/stages');
  const stages = {};
  for (const s of stagesResp.data || []) {
    stages[s.id] = { name: s.name.trim(), pipelineId: s.pipeline_id };
  }

  // Buscar deals
  const pipedriveDeals = await getAllDeals();

  // Agrupar por pipeline
  const pipedriveByPipeline = {};
  for (const deal of pipedriveDeals) {
    const pipelineId = deal.pipeline_id;
    if (!pipedriveByPipeline[pipelineId]) {
      pipedriveByPipeline[pipelineId] = { name: pipelines[pipelineId] || `Pipeline ${pipelineId}`, stages: {}, total: 0 };
    }

    // Determinar stage name (usar mesma nomenclatura do CRM)
    let stageName = stages[deal.stage_id]?.name || `Stage ${deal.stage_id}`;
    if (deal.status === 'won') stageName = 'Ganho';
    else if (deal.status === 'lost') stageName = 'Perdido';

    if (!pipedriveByPipeline[pipelineId].stages[stageName]) {
      pipedriveByPipeline[pipelineId].stages[stageName] = 0;
    }
    pipedriveByPipeline[pipelineId].stages[stageName]++;
    pipedriveByPipeline[pipelineId].total++;
  }

  // Buscar do CRM por pipeline
  const crmByPipeline = await prisma.comercialData.groupBy({
    by: ['pipelineId', 'stageName'],
    where: { pipedriveDealId: { not: null } },
    _count: { id: true }
  });

  // Organizar CRM por pipeline
  const crmPipelines = {};
  for (const item of crmByPipeline) {
    const pipelineId = item.pipelineId || 0;
    if (!crmPipelines[pipelineId]) {
      crmPipelines[pipelineId] = { stages: {}, total: 0 };
    }
    const stageName = item.stageName || 'NULL';
    crmPipelines[pipelineId].stages[stageName] = item._count.id;
    crmPipelines[pipelineId].total += item._count.id;
  }

  // Mostrar comparação por funil
  console.log('═'.repeat(100));
  console.log('COMPARAÇÃO FUNIL POR FUNIL: PIPEDRIVE vs CRM');
  console.log('═'.repeat(100));

  const allPipelineIds = new Set([...Object.keys(pipedriveByPipeline), ...Object.keys(crmPipelines)]);

  for (const pipelineId of [...allPipelineIds].sort((a, b) => Number(a) - Number(b))) {
    const pipeName = pipedriveByPipeline[pipelineId]?.name || pipelines[pipelineId] || `Pipeline ${pipelineId}`;
    const pipeTotal = pipedriveByPipeline[pipelineId]?.total || 0;
    const crmTotal = crmPipelines[pipelineId]?.total || 0;
    const diff = pipeTotal - crmTotal;
    const diffStr = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '✓';

    console.log(`\n${'▓'.repeat(100)}`);
    console.log(`▓ FUNIL ${pipelineId}: ${pipeName}`);
    console.log(`▓ PIPEDRIVE: ${pipeTotal} | CRM: ${crmTotal} | DIFF: ${diffStr}`);
    console.log(`${'▓'.repeat(100)}`);

    // Combinar stages de ambos
    const pipeStages = pipedriveByPipeline[pipelineId]?.stages || {};
    const crmStages = crmPipelines[pipelineId]?.stages || {};
    const allStages = new Set([...Object.keys(pipeStages), ...Object.keys(crmStages)]);

    console.log('\n' + 'ETAPA'.padEnd(45) + ' | ' + 'PIPE'.padStart(8) + ' | ' + 'CRM'.padStart(8) + ' | DIFF');
    console.log('─'.repeat(80));

    for (const stageName of [...allStages].sort()) {
      const pipeCount = pipeStages[stageName] || 0;
      const crmCount = crmStages[stageName] || 0;
      const stageDiff = pipeCount - crmCount;
      let stageDiffStr = '';
      if (stageDiff > 0) stageDiffStr = `+${stageDiff}`;
      else if (stageDiff < 0) stageDiffStr = `${stageDiff}`;
      else stageDiffStr = '✓';

      const marker = stageDiff !== 0 ? '⚠️ ' : '   ';
      console.log(marker + stageName.substring(0, 42).padEnd(42) + ' | ' +
                  String(pipeCount).padStart(8) + ' | ' +
                  String(crmCount).padStart(8) + ' | ' + stageDiffStr);
    }
  }

  // Resumo final
  console.log('\n' + '═'.repeat(100));
  console.log('RESUMO POR FUNIL:');
  console.log('═'.repeat(100));
  console.log('FUNIL'.padEnd(40) + ' | ' + 'PIPEDRIVE'.padStart(10) + ' | ' + 'CRM'.padStart(10) + ' | STATUS');
  console.log('─'.repeat(80));

  let grandTotalPipe = 0;
  let grandTotalCRM = 0;

  for (const pipelineId of [...allPipelineIds].sort((a, b) => Number(a) - Number(b))) {
    const pipeName = pipedriveByPipeline[pipelineId]?.name || pipelines[pipelineId] || `Pipeline ${pipelineId}`;
    const pipeTotal = pipedriveByPipeline[pipelineId]?.total || 0;
    const crmTotal = crmPipelines[pipelineId]?.total || 0;
    grandTotalPipe += pipeTotal;
    grandTotalCRM += crmTotal;

    const status = pipeTotal === crmTotal ? '✅ OK' : `❌ ${pipeTotal - crmTotal > 0 ? '+' : ''}${pipeTotal - crmTotal}`;
    console.log(pipeName.substring(0, 38).padEnd(38) + ' | ' +
                String(pipeTotal).padStart(10) + ' | ' +
                String(crmTotal).padStart(10) + ' | ' + status);
  }

  console.log('─'.repeat(80));
  const grandStatus = grandTotalPipe === grandTotalCRM ? '✅ OK' : `❌ ${grandTotalPipe - grandTotalCRM}`;
  console.log('TOTAL'.padEnd(38) + ' | ' +
              String(grandTotalPipe).padStart(10) + ' | ' +
              String(grandTotalCRM).padStart(10) + ' | ' + grandStatus);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
