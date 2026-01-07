/**
 * Sincronização EXATA Pipedrive → CRM
 * Busca nomes de stages diretamente do Pipedrive para evitar discrepâncias
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';

// Mapeamento Stage → Status do CRM (usa nomes normalizados)
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
  'negociações em andamento': 'NEGOCIACAO',
  'negociações iniciadas': 'NEGOCIACAO',
  'para executar': 'LEAD',
  'em execução': 'LEAD',
  'avaliação de resultado': 'LEAD',
  'feito': 'GANHO',
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

async function getAllDeals() {
  const allDeals = [];
  let start = 0;
  let hasMore = true;
  console.log('Buscando deals do Pipedrive...');
  while (hasMore) {
    const response = await fetchPipedrive(`/deals?status=all_not_deleted&start=${start}&limit=500`);
    if (response.data && response.data.length > 0) {
      allDeals.push(...response.data);
      process.stdout.write(`\r  ${allDeals.length} deals...`);
    }
    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += 500;
  }
  console.log(`\n  Total: ${allDeals.length} deals`);
  return allDeals;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('SINCRONIZAÇÃO EXATA: PIPEDRIVE → CRM');
  console.log('═'.repeat(60));

  // 1. Buscar stages do Pipedrive (nomes exatos)
  console.log('\n[1] Buscando stages do Pipedrive...');
  const stagesResp = await fetchPipedrive('/stages');
  const stageNames = {};
  for (const s of stagesResp.data || []) {
    // Usar nome exato, sem modificações (trim para remover espaços extras)
    stageNames[s.id] = s.name.trim();
  }
  console.log(`  ${Object.keys(stageNames).length} stages encontradas`);

  // 2. Buscar todos os deals
  const pipedriveDeals = await getAllDeals();

  // 3. Buscar IDs existentes no CRM
  const existingLeads = await prisma.comercialData.findMany({
    where: { pipedriveDealId: { not: null } },
    select: { id: true, pipedriveDealId: true }
  });
  const existingIds = new Set(existingLeads.map(l => l.pipedriveDealId));
  console.log(`\nCRM atual: ${existingLeads.length} leads com pipedriveDealId`);

  // 4. Agrupar deals por (stageName + dealStatus + pipelineId) para batch updates
  const groups = {};
  const missingDeals = [];

  for (const deal of pipedriveDeals) {
    const pipedriveId = String(deal.id);

    // Usar nome EXATO do stage, ou tratar won/lost
    let stageName = stageNames[deal.stage_id] || `Stage ${deal.stage_id}`;
    if (deal.status === 'won') stageName = 'Ganho';
    else if (deal.status === 'lost') stageName = 'Perdido';

    const crmStatus = getStatusFromStageName(stageName);
    const key = `${stageName}|${deal.status}|${crmStatus}|${deal.stage_id}|${deal.pipeline_id}`;

    if (existingIds.has(pipedriveId)) {
      if (!groups[key]) {
        groups[key] = {
          stageName,
          dealStatus: deal.status,
          crmStatus,
          stageId: deal.stage_id,
          pipelineId: deal.pipeline_id,
          ids: []
        };
      }
      groups[key].ids.push(pipedriveId);
    } else {
      missingDeals.push(deal);
    }
  }

  console.log(`\n[2] Atualizando ${Object.keys(groups).length} grupos em batch...\n`);

  let updated = 0;
  for (const [key, group] of Object.entries(groups)) {
    try {
      const result = await prisma.comercialData.updateMany({
        where: { pipedriveDealId: { in: group.ids } },
        data: {
          stageName: group.stageName,
          stageId: group.stageId,
          pipelineId: group.pipelineId,
          status: group.crmStatus,
          dealStatus: group.dealStatus,
          pipedriveSyncedAt: new Date(),
        }
      });
      updated += result.count;
      console.log(`  ✅ ${group.stageName.padEnd(35)} (${group.dealStatus}): ${result.count} leads`);
    } catch (err) {
      console.log(`  ❌ Erro em ${group.stageName}: ${err.message}`);
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
          pipelineId: deal.pipeline_id,
          status: crmStatus,
          dealStatus: deal.status,
          ownerUserName: deal.user_id?.name || deal.owner_name || null,
          consultorId: deal.user_id?.name || deal.owner_name || null,
          pipedriveSyncedAt: new Date(),
        }
      });
      created++;
      console.log(`  ➕ ${personName} [${stageName}]`);
    } catch (err) {
      console.log(`  ❌ Erro criando ${deal.person_name || deal.title}: ${err.message}`);
    }
  }

  // Verificar contagem final
  const finalCount = await prisma.comercialData.count({ where: { pipedriveDealId: { not: null } } });

  const byStage = await prisma.comercialData.groupBy({
    by: ['stageName'],
    where: { pipedriveDealId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  console.log('\n' + '═'.repeat(60));
  console.log('RESULTADO:');
  console.log('═'.repeat(60));
  console.log(`  ➕ Criados: ${created}`);
  console.log(`  ✅ Atualizados: ${updated}`);
  console.log(`\n  Pipedrive: ${pipedriveDeals.length} deals`);
  console.log(`  CRM: ${finalCount} leads com pipedriveDealId`);

  if (pipedriveDeals.length === finalCount) {
    console.log('\n✅ NÚMEROS BATEM!');
  } else {
    console.log(`\n⚠️  Diferença: ${Math.abs(pipedriveDeals.length - finalCount)}`);
  }

  console.log('\n📊 CONTAGEM POR STAGE NO CRM:');
  for (const s of byStage.slice(0, 25)) {
    console.log(`  ${(s.stageName || 'NULL').padEnd(40)} ${s._count.id}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
