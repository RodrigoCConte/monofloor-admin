/**
 * Sincronização RÁPIDA Pipedrive → CRM (usa batch updates)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';

// Mapeamento Stage ID → Nome exato do Pipedrive (usar nomes originais)
const STAGE_NAMES = {
  1: 'Form Orçamento', 2: '1º Contato', 70: 'Proposta Escopo Minimo',
  68: '1º Contato Feito', 62: 'Follow 1º Contato', 69: 'Follow 1º Contato Feito',
  60: 'Form Arquiteto', 58: 'Contato Arquiteto', 3: 'Cálculo de Projeto',
  43: 'Projeto levantado', 52: 'Cálculo Deslocamento', 53: 'Deslocamento Levantado',
  4: 'Proposta enviada', 59: 'Fazer Follow 1', 63: 'Follow 1 Feito',
  64: 'Fazer Follow 2', 65: 'Follow 2 Feito', 66: 'Fazer Follow 3',
  67: 'Follow 3 Feito', 5: 'Negociações', 17: 'Perdido',
  18: 'Formulário preenchido', 19: 'Primeiro contato', 20: 'Proposta enviada',
  21: 'Negociações em andamento', 22: 'Piuizinho', 34: 'Avaliar',
  33: 'Radar (Obras ainda não montadas)', 28: 'Clientes a agendar', 29: 'Contato realizado',
  30: 'Fotos agendadas', 31: 'Fotos feitas', 32: 'Fotos entregues',
  40: 'Já atendidos', 35: 'Não atendidos', 54: 'Em contato',
  55: 'Agendado', 36: 'Apresentação Online', 45: 'Visita Escritório',
  44: 'Visita Showroom', 56: 'Em levantamento', 57: 'Levantado',
  38: 'Proposta Enviada', 39: 'Negociações Iniciadas', 41: 'Piuiii',
  46: 'Para executar', 47: 'Em execução', 48: 'Avaliação de resultado',
  49: 'Para executar', 50: 'Em execução', 51: 'Feito',
};

// Mapeamento Stage → Status do CRM
const STAGE_TO_STATUS = {
  'Form Orçamento': 'LEAD', '1º Contato': 'PRIMEIRO_CONTATO',
  '1º Contato Feito': 'PRIMEIRO_CONTATO', 'Follow 1º Contato': 'FOLLOW_UP',
  'Follow 1º Contato Feito': 'FOLLOW_UP', 'Form Arquiteto': 'CONTATO_ARQUITETO',
  'Contato Arquiteto': 'CONTATO_ARQUITETO', 'Proposta Escopo Minimo': 'LEVANTAMENTO',
  'Cálculo de Projeto': 'LEVANTAMENTO', 'Projeto levantado': 'LEVANTAMENTO',
  'Cálculo Deslocamento': 'LEVANTAMENTO', 'Deslocamento Levantado': 'LEVANTAMENTO',
  'Proposta enviada': 'PROPOSTA_ENVIADA', 'Proposta Enviada': 'PROPOSTA_ENVIADA',
  'Fazer Follow 1': 'FOLLOW_UP', 'Follow 1 Feito': 'FOLLOW_UP',
  'Fazer Follow 2': 'FOLLOW_UP', 'Follow 2 Feito': 'FOLLOW_UP',
  'Fazer Follow 3': 'FOLLOW_UP', 'Follow 3 Feito': 'FOLLOW_UP',
  'Negociações': 'NEGOCIACAO', 'Negociações em andamento': 'NEGOCIACAO',
  'Negociações Iniciadas': 'NEGOCIACAO',
  'Para executar': 'LEAD', 'Em execução': 'LEAD',
  'Avaliação de resultado': 'LEAD', 'Feito': 'GANHO',
  'Perdido': 'PERDIDO', 'Ganho': 'GANHO',
};

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
  console.log('SINCRONIZAÇÃO RÁPIDA: PIPEDRIVE → CRM');
  console.log('═'.repeat(60));

  const pipedriveDeals = await getAllDeals();

  // Buscar IDs existentes no CRM
  const existingLeads = await prisma.comercialData.findMany({
    where: { pipedriveDealId: { not: null } },
    select: { id: true, pipedriveDealId: true }
  });
  const existingIds = new Set(existingLeads.map(l => l.pipedriveDealId));

  console.log(`\nCRM atual: ${existingLeads.length} leads com pipedriveDealId`);

  // Agrupar deals por (stage_id + dealStatus) para batch updates
  const groups = {};
  const missingDeals = [];

  for (const deal of pipedriveDeals) {
    const pipedriveId = String(deal.id);

    // Determinar stageName
    let stageName = STAGE_NAMES[deal.stage_id] || `Stage ${deal.stage_id}`;
    if (deal.status === 'won') stageName = 'Ganho';
    else if (deal.status === 'lost') stageName = 'Perdido';

    const crmStatus = STAGE_TO_STATUS[stageName] || 'LEAD';
    const key = `${stageName}|${deal.status}|${crmStatus}|${deal.stage_id}|${deal.pipeline_id}`;

    if (existingIds.has(pipedriveId)) {
      if (!groups[key]) groups[key] = { stageName, dealStatus: deal.status, crmStatus, stageId: deal.stage_id, pipelineId: deal.pipeline_id, ids: [] };
      groups[key].ids.push(pipedriveId);
    } else {
      missingDeals.push(deal);
    }
  }

  console.log(`\n[1] Atualizando ${Object.keys(groups).length} grupos em batch...\n`);

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
      console.log(`  ✅ ${group.stageName.padEnd(30)} (${group.dealStatus}): ${result.count} leads`);
    } catch (err) {
      console.log(`  ❌ Erro em ${group.stageName}: ${err.message}`);
    }
  }

  console.log(`\n[2] Criando ${missingDeals.length} deals que faltam...\n`);

  let created = 0;
  for (const deal of missingDeals) {
    try {
      const personName = deal.person_name || deal.title || 'Lead Pipedrive';
      let stageName = STAGE_NAMES[deal.stage_id] || `Stage ${deal.stage_id}`;
      if (deal.status === 'won') stageName = 'Ganho';
      else if (deal.status === 'lost') stageName = 'Perdido';
      const crmStatus = STAGE_TO_STATUS[stageName] || 'LEAD';

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
    console.log('\n✅ NÚMEROS BATEM AGORA!');
  } else {
    console.log(`\n⚠️  Diferença: ${Math.abs(pipedriveDeals.length - finalCount)}`);
  }

  console.log('\n📊 CONTAGEM POR STAGE NO CRM:');
  for (const s of byStage.slice(0, 20)) {
    console.log(`  ${(s.stageName || 'NULL').padEnd(35)} ${s._count.id}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
