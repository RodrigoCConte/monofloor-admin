const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fases de cada módulo - APENAS ESTAS vão para EXECUCAO
const EXECUCAO_PHASES = ['OBRA EM EXECUÇÃO', 'OBRA PAUSADA'];

// Clientes finalizados vão para módulo FINALIZADO
const FINALIZADO_PHASES = ['CLIENTE FINALIZADO'];

// Tudo o resto (incluindo pós-obra, logística, etc) vai para PLANEJAMENTO

function getModuleAndStatus(phaseName) {
  if (!phaseName) return { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' };

  const normalizedPhase = phaseName.toUpperCase().trim();

  // EXECUÇÃO - APENAS "OBRA EM EXECUÇÃO" e "OBRA PAUSADA"
  if (EXECUCAO_PHASES.some(p => normalizedPhase.includes(p.toUpperCase()))) {
    if (normalizedPhase.includes('PAUSADA')) return { currentModule: 'EXECUCAO', status: 'PAUSADO' };
    return { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' };
  }

  // FINALIZADO - "CLIENTE FINALIZADO" vai para módulo próprio
  if (FINALIZADO_PHASES.some(p => normalizedPhase.includes(p.toUpperCase()))) {
    return { currentModule: 'FINALIZADO', status: 'CONCLUIDO' };
  }

  // Todas as outras fases (incluindo OBRA CONCLUÍDA, LOGÍSTICA, etc) vão para PLANEJAMENTO
  return { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' };
}

async function fixDirectly() {
  console.log('Corrigindo módulos diretamente no banco...\n');

  // 1. Projetos que devem estar em EXECUCAO (OBRA EM EXECUÇÃO)
  const execucaoAtivo = await prisma.project.updateMany({
    where: {
      pipefyPhase: { contains: 'OBRA EM EXECUÇÃO', mode: 'insensitive' }
    },
    data: { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' }
  });
  console.log(`EXECUCAO (EM_EXECUCAO): ${execucaoAtivo.count}`);

  // 2. Projetos que devem estar em EXECUCAO (OBRA PAUSADA)
  const execucaoPausado = await prisma.project.updateMany({
    where: {
      pipefyPhase: { contains: 'OBRA PAUSADA', mode: 'insensitive' }
    },
    data: { currentModule: 'EXECUCAO', status: 'PAUSADO' }
  });
  console.log(`EXECUCAO (PAUSADO): ${execucaoPausado.count}`);

  // 3. Projetos CLIENTE FINALIZADO vão para FINALIZADO
  const finalizado = await prisma.project.updateMany({
    where: {
      pipefyPhase: { contains: 'CLIENTE FINALIZADO', mode: 'insensitive' }
    },
    data: { currentModule: 'FINALIZADO', status: 'CONCLUIDO' }
  });
  console.log(`FINALIZADO: ${finalizado.count}`);

  // 4. Projetos com outras fases do Pipefy (OBRA CONCLUÍDA, LOGÍSTICA, etc) vão para PLANEJAMENTO
  const posObra = await prisma.project.updateMany({
    where: {
      pipefyCardId: { not: null },
      pipefyPhase: { not: null },
      NOT: [
        { pipefyPhase: { contains: 'OBRA EM EXECUÇÃO', mode: 'insensitive' } },
        { pipefyPhase: { contains: 'OBRA PAUSADA', mode: 'insensitive' } },
        { pipefyPhase: { contains: 'CLIENTE FINALIZADO', mode: 'insensitive' } }
      ]
    },
    data: { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' }
  });
  console.log(`PLANEJAMENTO (outras fases Pipefy): ${posObra.count}`);

  // Resumo final
  const summary = await prisma.project.groupBy({
    by: ['currentModule'],
    _count: { id: true }
  });

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      RESULTADO FINAL POR MÓDULO      ║');
  console.log('╠══════════════════════════════════════╣');
  summary.forEach(s => {
    const name = (s.currentModule || 'SEM MÓDULO').padEnd(18);
    console.log(`║  ${name}${String(s._count.id).padStart(16)}  ║`);
  });
  console.log('╚══════════════════════════════════════╝');

  // Detalhe do EXECUCAO
  const execDetail = await prisma.project.groupBy({
    by: ['status'],
    where: { currentModule: 'EXECUCAO' },
    _count: { id: true }
  });

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      DETALHE EXECUÇÃO POR STATUS     ║');
  console.log('╠══════════════════════════════════════╣');
  execDetail.forEach(s => {
    const name = (s.status || 'SEM STATUS').padEnd(18);
    console.log(`║  ${name}${String(s._count.id).padStart(16)}  ║`);
  });
  console.log('╚══════════════════════════════════════╝');

  await prisma.$disconnect();
}

fixDirectly().catch(console.error);
