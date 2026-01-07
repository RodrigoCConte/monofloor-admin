/**
 * Obtém contagem exata do Pipedrive Pipeline 1 (apenas status=open)
 */

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
  const stagesResp = await fetchPipedrive('/stages');
  const stageNames = {};
  const stageOrder = {};
  for (const s of stagesResp.data || []) {
    if (s.pipeline_id === 1) {
      stageNames[s.id] = s.name.trim();
      stageOrder[s.id] = s.order_nr;
    }
  }

  const deals = await getAllDeals();
  const pipeline1Open = deals.filter(d => d.pipeline_id === 1 && d.status === 'open');

  // Contar por stage
  const byStage = {};
  for (const d of pipeline1Open) {
    const stageId = d.stage_id;
    const name = stageNames[stageId] || `Stage ${stageId}`;
    if (!byStage[stageId]) {
      byStage[stageId] = { name, count: 0, order: stageOrder[stageId] || 999 };
    }
    byStage[stageId].count++;
  }

  // Ordenar por order_nr
  const sorted = Object.entries(byStage).sort((a, b) => a[1].order - b[1].order);

  console.log('PIPEDRIVE - PIPELINE 1 - APENAS OPEN (o que aparece no funil):');
  console.log('='.repeat(50));
  let total = 0;
  for (const [stageId, data] of sorted) {
    console.log(data.name.padEnd(35) + String(data.count).padStart(5));
    total += data.count;
  }
  console.log('='.repeat(50));
  console.log('TOTAL OPEN:'.padEnd(35) + String(total).padStart(5));

  // JSON para comparação
  console.log('\n// JSON para comparação:');
  const json = {};
  for (const [stageId, data] of sorted) {
    json[data.name] = data.count;
  }
  console.log(JSON.stringify(json, null, 2));
}

main();
