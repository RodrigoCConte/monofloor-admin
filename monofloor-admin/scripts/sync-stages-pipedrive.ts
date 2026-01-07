/**
 * Sincronização de Stages: Pipedrive → CRM
 *
 * 1. Busca todos os deals do Pipedrive com seus stages atuais
 * 2. Atualiza o stageName e stageId de cada lead no nosso sistema
 * 3. Verifica se os números batem
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

// Mapeamento Stage ID → Nome (TODOS os stages de TODOS os pipelines)
const STAGE_ID_TO_NAME: Record<number, string> = {
  // Pipeline 1: Pipeline (Principal)
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

  // Pipeline 3: Funil Mineral
  18: 'Formulário preenchido',
  19: 'Primeiro contato',
  20: 'Proposta enviada (Mineral)',
  21: 'Negociações em andamento',
  22: 'Piuizinho',

  // Pipeline 4: Registros - Marketing
  34: 'Avaliar',
  33: 'Radar (Obras ainda não montadas)',
  28: 'Clientes a agendar',
  29: 'Contato realizado',
  30: 'Fotos agendadas',
  31: 'Fotos feitas',
  32: 'Fotos entregues',

  // Pipeline 5: Prospecção ativa
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

  // Pipeline 6: Testes industria
  46: 'Para executar (Testes)',
  47: 'Em execução (Testes)',
  48: 'Avaliação de resultado',

  // Pipeline 7: Marketing - Ideias
  49: 'Para executar (Marketing)',
  50: 'Em execução (Marketing)',
  51: 'Feito',
};

// Mapeamento Stage ID → Status do CRM (TODOS os pipelines)
const STAGE_ID_TO_STATUS: Record<number, string> = {
  // Pipeline 1: Pipeline (Principal)
  1: 'LEAD',                    // Form Orçamento
  2: 'PRIMEIRO_CONTATO',        // 1º Contato
  70: 'LEVANTAMENTO',           // Proposta Escopo Minimo
  68: 'PRIMEIRO_CONTATO',       // 1º Contato Feito
  62: 'FOLLOW_UP',              // Follow 1º Contato
  69: 'FOLLOW_UP',              // Follow 1º Contato Feito
  60: 'CONTATO_ARQUITETO',      // Form Arquiteto
  58: 'CONTATO_ARQUITETO',      // Contato Arquiteto
  3: 'LEVANTAMENTO',            // Cálculo de Projeto
  43: 'LEVANTAMENTO',           // Projeto levantado
  52: 'LEVANTAMENTO',           // Cálculo Deslocamento
  53: 'LEVANTAMENTO',           // Deslocamento Levantado
  4: 'PROPOSTA_ENVIADA',        // Proposta enviada
  59: 'FOLLOW_UP',              // Fazer Follow 1
  63: 'FOLLOW_UP',              // Follow 1 Feito
  64: 'FOLLOW_UP',              // Fazer Follow 2
  65: 'FOLLOW_UP',              // Follow 2 Feito
  66: 'FOLLOW_UP',              // Fazer Follow 3
  67: 'FOLLOW_UP',              // Follow 3 Feito
  5: 'NEGOCIACAO',              // Negociações
  17: 'PERDIDO',                // Perdido

  // Pipeline 3: Funil Mineral
  18: 'LEAD',                   // Formulário preenchido
  19: 'PRIMEIRO_CONTATO',       // Primeiro contato
  20: 'PROPOSTA_ENVIADA',       // Proposta enviada (Mineral)
  21: 'NEGOCIACAO',             // Negociações em andamento
  22: 'GANHO',                  // Piuizinho

  // Pipeline 4: Registros - Marketing
  34: 'LEAD',                   // Avaliar
  33: 'LEAD',                   // Radar (Obras ainda não montadas)
  28: 'PRIMEIRO_CONTATO',       // Clientes a agendar
  29: 'PRIMEIRO_CONTATO',       // Contato realizado
  30: 'LEVANTAMENTO',           // Fotos agendadas
  31: 'LEVANTAMENTO',           // Fotos feitas
  32: 'GANHO',                  // Fotos entregues

  // Pipeline 5: Prospecção ativa
  40: 'PRIMEIRO_CONTATO',       // Já atendidos
  35: 'LEAD',                   // Não atendidos
  54: 'PRIMEIRO_CONTATO',       // Em contato
  55: 'PRIMEIRO_CONTATO',       // Agendado
  36: 'PRIMEIRO_CONTATO',       // Apresentação Online
  45: 'PRIMEIRO_CONTATO',       // Visita Escritório
  44: 'PRIMEIRO_CONTATO',       // Visita Showroom
  56: 'LEVANTAMENTO',           // Em levantamento
  57: 'LEVANTAMENTO',           // Levantado
  38: 'PROPOSTA_ENVIADA',       // Proposta Enviada (Prospecção)
  39: 'NEGOCIACAO',             // Negociações Iniciadas
  41: 'GANHO',                  // Piuiii

  // Pipeline 6: Testes industria
  46: 'LEVANTAMENTO',           // Para executar (Testes)
  47: 'LEVANTAMENTO',           // Em execução (Testes)
  48: 'GANHO',                  // Avaliação de resultado

  // Pipeline 7: Marketing - Ideias
  49: 'LEAD',                   // Para executar (Marketing)
  50: 'LEVANTAMENTO',           // Em execução (Marketing)
  51: 'GANHO',                  // Feito
};

async function fetchPipedrive(endpoint: string): Promise<any> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  const response = await fetch(url);
  return response.json();
}

async function getAllDeals(): Promise<any[]> {
  const allDeals: any[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  console.log('[Pipedrive] Buscando todos os deals...');

  while (hasMore) {
    const response = await fetchPipedrive(`/deals?status=all_not_deleted&start=${start}&limit=${limit}`);
    if (response.data && response.data.length > 0) {
      allDeals.push(...response.data);
      console.log(`[Pipedrive] ${allDeals.length} deals...`);
    }
    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += limit;
  }

  return allDeals;
}

async function getStagesWithCount(): Promise<Record<number, { name: string; count: number; pipelineId: number }>> {
  // Buscar stages de TODOS os pipelines
  const response = await fetchPipedrive('/stages');
  const stages: Record<number, { name: string; count: number; pipelineId: number }> = {};

  if (response.data) {
    for (const stage of response.data) {
      stages[stage.id] = {
        name: stage.name,
        count: 0,
        pipelineId: stage.pipeline_id
      };
    }
  }

  return stages;
}

async function main() {
  console.log('═'.repeat(80));
  console.log('SINCRONIZAÇÃO DE STAGES: PIPEDRIVE → CRM');
  console.log('═'.repeat(80) + '\n');

  // 1. Buscar todos os deals do Pipedrive
  const pipedriveDeals = await getAllDeals();
  console.log(`\n[Pipedrive] Total: ${pipedriveDeals.length} deals\n`);

  // 2. Contar por stage no Pipedrive
  const pipedriveStages = await getStagesWithCount();

  // Contar deals por stage
  for (const deal of pipedriveDeals) {
    if (deal.stage_id && pipedriveStages[deal.stage_id]) {
      pipedriveStages[deal.stage_id].count++;
    }
  }

  // Adicionar Won e Lost
  const wonDeals = pipedriveDeals.filter(d => d.status === 'won');
  const lostDeals = pipedriveDeals.filter(d => d.status === 'lost');

  console.log('=== CONTAGEM NO PIPEDRIVE ===');
  let totalPipedrive = 0;
  for (const [id, stage] of Object.entries(pipedriveStages)) {
    if (stage.count > 0) {
      console.log(`  ${stage.name}: ${stage.count}`);
      totalPipedrive += stage.count;
    }
  }
  console.log(`  Ganhos (Won): ${wonDeals.length}`);
  console.log(`  Perdidos (Lost): ${lostDeals.length}`);
  console.log(`  TOTAL: ${pipedriveDeals.length}`);

  // 3. Atualizar leads no nosso sistema (batch por stageId para eficiência)
  console.log('\n[Sync] Atualizando leads no sistema (modo batch)...\n');

  // Agrupar deals por stageId + dealStatus
  const dealsByStageAndStatus: Record<string, string[]> = {};

  for (const deal of pipedriveDeals) {
    const key = `${deal.stage_id}_${deal.status}`;
    if (!dealsByStageAndStatus[key]) {
      dealsByStageAndStatus[key] = [];
    }
    dealsByStageAndStatus[key].push(String(deal.id));
  }

  console.log(`  Grupos a processar: ${Object.keys(dealsByStageAndStatus).length}`);

  let updated = 0;
  let groupsProcessed = 0;

  for (const [key, dealIds] of Object.entries(dealsByStageAndStatus)) {
    const [stageIdStr, dealStatus] = key.split('_');
    const stageId = parseInt(stageIdStr);
    const stageName = STAGE_ID_TO_NAME[stageId] || `Stage ${stageId}`;

    // Determinar status
    let status = STAGE_ID_TO_STATUS[stageId] || 'LEAD';
    if (dealStatus === 'won') status = 'GANHO';
    if (dealStatus === 'lost') status = 'PERDIDO';

    // Encontrar pipeline_id do primeiro deal deste grupo
    const sampleDeal = pipedriveDeals.find(d => String(d.id) === dealIds[0]);
    const pipelineId = sampleDeal?.pipeline_id || 1;

    try {
      const result = await prisma.comercialData.updateMany({
        where: {
          pipedriveDealId: { in: dealIds }
        },
        data: {
          stageId,
          stageName,
          pipelineId,
          status: status as any,
          dealStatus: dealStatus,
        }
      });

      updated += result.count;
      groupsProcessed++;

      console.log(`  [${groupsProcessed}/${Object.keys(dealsByStageAndStatus).length}] ${stageName} (${dealStatus}): ${result.count} leads`);
    } catch (err: any) {
      console.log(`  ❌ Erro ao atualizar ${stageName}: ${err.message}`);
    }
  }

  const notFound = pipedriveDeals.length - updated;

  console.log(`\n[Sync] RESULTADO:`);
  console.log(`  Grupos processados: ${groupsProcessed}`);
  console.log(`  Leads atualizados: ${updated}`);
  console.log(`  Não encontrados no CRM: ${notFound}`);

  // 4. Verificar contagem no nosso sistema
  console.log('\n=== CONTAGEM NO NOSSO SISTEMA (após sync) ===');

  const sistemaByStage = await prisma.comercialData.groupBy({
    by: ['stageName'],
    where: { pipedriveDealId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  let totalSistema = 0;
  for (const s of sistemaByStage) {
    console.log(`  ${s.stageName || 'NULL'}: ${s._count.id}`);
    totalSistema += s._count.id;
  }
  console.log(`  TOTAL: ${totalSistema}`);

  // 5. Comparar
  console.log('\n=== COMPARAÇÃO ===');
  console.log(`Pipedrive: ${pipedriveDeals.length} deals`);
  console.log(`Sistema (com pipedriveDealId): ${totalSistema} leads`);

  if (pipedriveDeals.length === totalSistema) {
    console.log('✅ NÚMEROS BATEM!');
  } else {
    console.log(`⚠️  Diferença: ${Math.abs(pipedriveDeals.length - totalSistema)}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
