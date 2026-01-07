/**
 * Sincronização COMPLETA Pipedrive → CRM
 *
 * 1. Importa os deals que faltam
 * 2. Atualiza stageName de TODOS os deals existentes
 * 3. Trata won/lost corretamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';

// Mapeamento Stage ID → Nome exato do Pipedrive
const STAGE_NAMES = {
  1: 'Form Orçamento',
  2: '1º Contato',
  70: 'Proposta Escopo Minimo',
  68: '1º Contato Feito',
  62: 'Follow 1º Contato',
  69: 'Follow 1º Contato Feito',
  60: 'Form Arquiteto',
  58: 'Contato Arquiteto',
  3: 'Cálculo de Projeto',
  43: 'Projeto levantado',
  52: 'Cálculo Deslocamento',
  53: 'Deslocamento Levantado',
  4: 'Proposta enviada',
  59: 'Fazer Follow 1',
  63: 'Follow 1 Feito',
  64: 'Fazer Follow 2',
  65: 'Follow 2 Feito',
  66: 'Fazer Follow 3',
  67: 'Follow 3 Feito',
  5: 'Negociações',
  17: 'Perdido',
  18: 'Formulário preenchido',
  19: 'Primeiro contato',
  20: 'Proposta enviada (Mineral)',
  21: 'Negociações em andamento',
  22: 'Piuizinho',
  34: 'Avaliar',
  33: 'Radar (Obras ainda não montadas)',
  28: 'Clientes a agendar',
  29: 'Contato realizado',
  30: 'Fotos agendadas',
  31: 'Fotos feitas',
  32: 'Fotos entregues',
  40: 'Já atendidos',
  35: 'Não atendidos',
  54: 'Em contato',
  55: 'Agendado',
  36: 'Apresentação Online',
  45: 'Visita Escritório',
  44: 'Visita Showroom',
  56: 'Em levantamento',
  57: 'Levantado',
  38: 'Proposta Enviada (Prospecção)',
  39: 'Negociações Iniciadas',
  41: 'Piuiii',
  46: 'Para executar (Testes)',
  47: 'Em execução (Testes)',
  48: 'Avaliação de resultado',
  49: 'Para executar (Marketing)',
  50: 'Em execução (Marketing)',
  51: 'Feito',
};

// Mapeamento Stage → Status do CRM
const STAGE_TO_STATUS = {
  'Form Orçamento': 'LEAD',
  '1º Contato': 'PRIMEIRO_CONTATO',
  '1º Contato Feito': 'PRIMEIRO_CONTATO',
  'Follow 1º Contato': 'FOLLOW_UP',
  'Follow 1º Contato Feito': 'FOLLOW_UP',
  'Form Arquiteto': 'CONTATO_ARQUITETO',
  'Contato Arquiteto': 'CONTATO_ARQUITETO',
  'Proposta Escopo Minimo': 'LEVANTAMENTO',
  'Cálculo de Projeto': 'LEVANTAMENTO',
  'Projeto levantado': 'LEVANTAMENTO',
  'Cálculo Deslocamento': 'LEVANTAMENTO',
  'Deslocamento Levantado': 'LEVANTAMENTO',
  'Proposta enviada': 'PROPOSTA_ENVIADA',
  'Fazer Follow 1': 'FOLLOW_UP',
  'Follow 1 Feito': 'FOLLOW_UP',
  'Fazer Follow 2': 'FOLLOW_UP',
  'Follow 2 Feito': 'FOLLOW_UP',
  'Fazer Follow 3': 'FOLLOW_UP',
  'Follow 3 Feito': 'FOLLOW_UP',
  'Negociações': 'NEGOCIACAO',
  'Perdido': 'PERDIDO',
  'Ganho': 'GANHO',
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
  console.log('SINCRONIZAÇÃO COMPLETA: PIPEDRIVE → CRM');
  console.log('═'.repeat(60));

  const pipedriveDeals = await getAllDeals();

  // Buscar IDs existentes no CRM
  const existingLeads = await prisma.comercialData.findMany({
    where: { pipedriveDealId: { not: null } },
    select: { id: true, pipedriveDealId: true }
  });
  const existingIds = new Map(existingLeads.map(l => [l.pipedriveDealId, l.id]));

  console.log(`\nCRM atual: ${existingLeads.length} leads com pipedriveDealId`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  console.log('\nProcessando deals...\n');

  for (const deal of pipedriveDeals) {
    const pipedriveId = String(deal.id);

    // Determinar stageName
    let stageName = STAGE_NAMES[deal.stage_id] || `Stage ${deal.stage_id}`;

    // Tratar won/lost
    if (deal.status === 'won') {
      stageName = 'Ganho';
    } else if (deal.status === 'lost') {
      stageName = 'Perdido';
    }

    // Determinar status do CRM
    const crmStatus = STAGE_TO_STATUS[stageName] || 'LEAD';

    const updateData = {
      stageId: deal.stage_id,
      stageName: stageName,
      pipelineId: deal.pipeline_id,
      status: crmStatus,
      dealStatus: deal.status,
      ownerUserName: deal.user_id?.name || deal.owner_name || null,
      consultorId: deal.user_id?.name || deal.owner_name || null,
      pipedriveSyncedAt: new Date(),
    };

    try {
      if (existingIds.has(pipedriveId)) {
        // Atualizar existente
        await prisma.comercialData.update({
          where: { id: existingIds.get(pipedriveId) },
          data: updateData
        });
        updated++;
      } else {
        // Criar novo
        const personName = deal.person_name || deal.title || 'Lead Pipedrive';

        // Criar projeto primeiro
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

        // Criar comercialData
        await prisma.comercialData.create({
          data: {
            projectId: project.id,
            pipedriveDealId: pipedriveId,
            pipedriveUrl: `https://monofloor.pipedrive.com/deal/${deal.id}`,
            personName: personName,
            personEmail: deal.person_id?.email?.[0]?.value || null,
            personPhone: deal.person_id?.phone?.[0]?.value || null,
            dealValue: deal.value ? parseFloat(deal.value) : null,
            dealCurrency: deal.currency || 'BRL',
            dealAddTime: deal.add_time ? new Date(deal.add_time) : null,
            dealUpdateTime: deal.update_time ? new Date(deal.update_time) : null,
            dealOrigin: 'pipedrive',
            ...updateData
          }
        });
        created++;
        console.log(`  ➕ Criado: ${personName} [${stageName}]`);
      }
    } catch (err) {
      errors++;
      console.log(`  ❌ Erro: ${deal.person_name || deal.title} - ${err.message}`);
    }
  }

  // Verificar contagem final
  const finalCount = await prisma.comercialData.count({
    where: { pipedriveDealId: { not: null } }
  });

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
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`\n  Pipedrive: ${pipedriveDeals.length} deals`);
  console.log(`  CRM: ${finalCount} leads com pipedriveDealId`);

  if (pipedriveDeals.length === finalCount) {
    console.log('\n✅ NÚMEROS BATEM AGORA!');
  } else {
    console.log(`\n⚠️  Diferença: ${Math.abs(pipedriveDeals.length - finalCount)}`);
  }

  console.log('\n📊 CONTAGEM POR STAGE NO CRM:');
  for (const s of byStage.slice(0, 15)) {
    console.log(`  ${(s.stageName || 'NULL').padEnd(35)} ${s._count.id}`);
  }
  if (byStage.length > 15) {
    console.log(`  ... e mais ${byStage.length - 15} stages`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
