const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== VERIFICAÇÃO DETALHADA DO BANCO ===\n');

  // 1. EXECUCAO por status
  console.log('--- EXECUCAO POR STATUS ---');
  const execByStatus = await prisma.project.groupBy({
    by: ['status'],
    where: { currentModule: 'EXECUCAO' },
    _count: { id: true }
  });
  execByStatus.forEach(e => console.log(`  ${e.status}: ${e._count.id}`));

  // 2. EXECUCAO por fase do Pipefy
  console.log('\n--- EXECUCAO POR FASE PIPEFY ---');
  const execByPhase = await prisma.project.groupBy({
    by: ['pipefyPhase'],
    where: { currentModule: 'EXECUCAO' },
    _count: { id: true }
  });
  execByPhase.forEach(e => console.log(`  ${e.pipefyPhase || 'NULL'}: ${e._count.id}`));

  // 3. Projetos PAUSADO - listar todos
  console.log('\n--- TODOS OS PROJETOS COM STATUS PAUSADO ---');
  const pausados = await prisma.project.findMany({
    where: { status: 'PAUSADO' },
    select: { cliente: true, pipefyPhase: true, pipefyCardId: true, currentModule: true }
  });
  console.log(`Total: ${pausados.length}`);
  pausados.forEach((p, i) => {
    console.log(`${i+1}. ${(p.cliente || 'N/A').substring(0, 40)} | Fase: ${p.pipefyPhase || 'NULL'} | Módulo: ${p.currentModule} | CardId: ${p.pipefyCardId || 'sem'}`);
  });

  // 4. Projetos em EXECUCAO com status EM_EXECUCAO
  console.log('\n--- PROJETOS EM_EXECUCAO NO MÓDULO EXECUCAO ---');
  const emExecucao = await prisma.project.findMany({
    where: { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' },
    select: { cliente: true, pipefyPhase: true, pipefyCardId: true }
  });
  console.log(`Total: ${emExecucao.length}`);
  emExecucao.forEach((p, i) => {
    console.log(`${i+1}. ${(p.cliente || 'N/A').substring(0, 40)} | Fase: ${p.pipefyPhase || 'NULL'}`);
  });

  // 5. Verificar se há projetos com status PAUSADO fora do módulo EXECUCAO
  console.log('\n--- PROJETOS PAUSADO FORA DO MÓDULO EXECUCAO ---');
  const pausadosForaExec = await prisma.project.findMany({
    where: { status: 'PAUSADO', currentModule: { not: 'EXECUCAO' } },
    select: { cliente: true, pipefyPhase: true, currentModule: true, pipefyCardId: true }
  });
  console.log(`Total: ${pausadosForaExec.length}`);
  pausadosForaExec.forEach((p, i) => {
    console.log(`${i+1}. ${(p.cliente || 'N/A').substring(0, 40)} | Módulo: ${p.currentModule} | Fase: ${p.pipefyPhase || 'NULL'}`);
  });

  // 6. Verificar todas as combinações de currentModule + status
  console.log('\n\n=== TODAS AS COMBINAÇÕES MODULE + STATUS ===');
  const allCombos = await prisma.$queryRaw`
    SELECT "currentModule", status, COUNT(*) as count
    FROM projects
    GROUP BY "currentModule", status
    ORDER BY "currentModule", status
  `;
  allCombos.forEach(c => {
    console.log(`${(c.currentModule || 'NULL').padEnd(15)} | ${(c.status || 'NULL').padEnd(15)} | ${c.count}`);
  });

  await prisma.$disconnect();
}

check().catch(console.error);
