const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PIPEFY_API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NjY2NzE2MTUsImp0aSI6IjE0YWQ1NjM1LTE2OTktNDAxZS04ODQ2LWI4ZDBmMDUzZGZhNCIsInN1YiI6MzA3MTY5NjIyLCJ1c2VyIjp7ImlkIjozMDcxNjk2MjIsImVtYWlsIjoicm9kcmlnb0Btb25vZmxvb3IuY29tLmJyIn0sInVzZXJfdHlwZSI6ImF1dGhlbnRpY2F0ZWQifQ.iIFoE3qzRA17wSuDRQ_fpLmFKq8YAuVhb-WI37UjhZ_JvGgTTbjoetnUkODxK_eo3CYkvhuHh6ZBB76D-FIoyA';
const PIPEFY_PIPE_OPERACOES = '306410007';

// Determina módulo e status com base na fase
function getModuleAndStatus(phaseName) {
  if (!phaseName) {
    return { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' };
  }

  const phase = phaseName.toUpperCase().trim();

  // EXECUÇÃO - APENAS estas fases
  if (phase.includes('OBRA EM EXECUÇÃO')) {
    return { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' };
  }
  if (phase.includes('OBRA PAUSADA')) {
    return { currentModule: 'EXECUCAO', status: 'PAUSADO' };
  }

  // FINALIZADO
  if (phase.includes('CLIENTE FINALIZADO')) {
    return { currentModule: 'FINALIZADO', status: 'CONCLUIDO' };
  }

  // Todo o resto vai para PLANEJAMENTO
  return { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' };
}

async function getAllPipefyCards() {
  const allCards = [];
  let hasMore = true;
  let cursor = null;

  while (hasMore) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      allCards(pipeId: ${PIPEFY_PIPE_OPERACOES}, first: 50${afterClause}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            current_phase {
              id
              name
            }
          }
        }
      }
    }`;

    const response = await axios.post('https://api.pipefy.com/graphql', { query }, {
      headers: {
        'Authorization': `Bearer ${PIPEFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('GraphQL error');
    }

    if (!response.data.data || !response.data.data.allCards) {
      console.error('Response:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from Pipefy');
    }

    const edges = response.data.data.allCards.edges;
    const pageInfo = response.data.data.allCards.pageInfo;

    edges.forEach(edge => allCards.push(edge.node));

    hasMore = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;

    process.stdout.write(`\r   Fetched ${allCards.length} cards...`);
  }

  console.log('');
  return allCards;
}

async function fixModules() {
  console.log('=== CORRIGINDO MÓDULOS COM DADOS DO PIPEFY ===\n');

  // 1. Buscar todos os cards do Pipefy
  console.log('1. Buscando cards do Pipefy...');
  const pipefyCards = await getAllPipefyCards();
  console.log(`   Total de cards: ${pipefyCards.length}\n`);

  // 2. Criar mapa cardId -> fase
  const phaseMap = {};
  pipefyCards.forEach(card => {
    phaseMap[String(card.id)] = card.current_phase?.name || null;
  });

  // 3. Buscar todos os projetos com pipefyCardId
  console.log('2. Buscando projetos no banco...');
  const projects = await prisma.project.findMany({
    where: { pipefyCardId: { not: null } },
    select: { id: true, cliente: true, pipefyCardId: true, currentModule: true, pipefyPhase: true, status: true }
  });
  console.log(`   Total de projetos com pipefyCardId: ${projects.length}\n`);

  // 4. Atualizar cada projeto
  console.log('3. Atualizando projetos...\n');
  const updates = {
    EXECUCAO: 0,
    PLANEJAMENTO: 0,
    FINALIZADO: 0,
    unchanged: 0,
    notInPipefy: 0,
  };

  for (const project of projects) {
    const phaseName = phaseMap[project.pipefyCardId];

    // Card não existe mais no Pipefy (foi deletado ou movido para outro pipe)
    if (phaseName === undefined) {
      updates.notInPipefy++;
      // Mover para PLANEJAMENTO se estava em EXECUCAO sem fase conhecida
      if (project.currentModule === 'EXECUCAO' && !project.pipefyPhase) {
        await prisma.project.update({
          where: { id: project.id },
          data: { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' }
        });
        console.log(`   [PLANEJAMENTO] ${project.cliente?.substring(0, 40) || 'N/A'} (não encontrado no Pipefy)`);
      }
      continue;
    }

    const { currentModule, status } = getModuleAndStatus(phaseName);

    // Só atualiza se mudou
    if (project.currentModule !== currentModule || project.pipefyPhase !== phaseName || project.status !== status) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          currentModule,
          status,
          pipefyPhase: phaseName,
        }
      });

      updates[currentModule]++;
      console.log(`   [${currentModule}] ${project.cliente?.substring(0, 40) || 'N/A'} (${phaseName || 'sem fase'})`);
    } else {
      updates.unchanged++;
    }
  }

  // 5. Resumo
  console.log('\n\n=== RESUMO DAS ATUALIZAÇÕES ===');
  console.log(`EXECUCAO: ${updates.EXECUCAO}`);
  console.log(`PLANEJAMENTO: ${updates.PLANEJAMENTO}`);
  console.log(`FINALIZADO: ${updates.FINALIZADO}`);
  console.log(`Sem alteração: ${updates.unchanged}`);
  console.log(`Não encontrados no Pipefy: ${updates.notInPipefy}`);

  // 6. Verificar estado final
  console.log('\n\n=== ESTADO FINAL DO BANCO ===');
  const finalCounts = await prisma.project.groupBy({
    by: ['currentModule'],
    _count: { id: true },
  });

  finalCounts.forEach(c => {
    console.log(`${(c.currentModule || 'NULL').padEnd(20)} ${c._count.id}`);
  });

  // Detalhe EXECUCAO
  const execDetail = await prisma.project.groupBy({
    by: ['status'],
    where: { currentModule: 'EXECUCAO' },
    _count: { id: true }
  });

  console.log('\nDetalhe EXECUCAO por status:');
  execDetail.forEach(e => {
    console.log(`  ${e.status}: ${e._count.id}`);
  });

  // Mostrar fases em EXECUCAO
  const execPhases = await prisma.project.groupBy({
    by: ['pipefyPhase'],
    where: { currentModule: 'EXECUCAO' },
    _count: { id: true }
  });

  console.log('\nFases em EXECUCAO:');
  execPhases.forEach(e => {
    console.log(`  ${e.pipefyPhase || 'NULL'}: ${e._count.id}`);
  });

  await prisma.$disconnect();
}

fixModules().catch(e => {
  console.error('ERRO:', e);
  prisma.$disconnect();
});
