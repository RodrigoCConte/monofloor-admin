const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== ANÁLISE DO STATUS PAUSADO ===\n');

  // 1. Quantos projetos PAUSADO existem por módulo
  console.log('--- PAUSADO POR MÓDULO ---');
  const pausadoByModule = await prisma.project.groupBy({
    by: ['currentModule'],
    where: { status: 'PAUSADO' },
    _count: { id: true }
  });
  pausadoByModule.forEach(p => {
    console.log(`${(p.currentModule || 'NULL').padEnd(15)}: ${p._count.id}`);
  });

  // 2. Apenas os PAUSADO em EXECUCAO (que deveria ser 15)
  console.log('\n--- PAUSADO EM EXECUCAO (deveria ser 15) ---');
  const pausadoExecucao = await prisma.project.findMany({
    where: { currentModule: 'EXECUCAO', status: 'PAUSADO' },
    select: { cliente: true, pipefyPhase: true, pipefyCardId: true }
  });
  console.log(`Total: ${pausadoExecucao.length}`);
  pausadoExecucao.forEach((p, i) => {
    console.log(`${i+1}. ${(p.cliente || 'N/A').substring(0, 50)} | Fase: ${p.pipefyPhase}`);
  });

  // 3. EM_EXECUCAO em EXECUCAO (deveria ser 30)
  console.log('\n--- EM_EXECUCAO EM EXECUCAO (deveria ser 30) ---');
  const emExecucaoCount = await prisma.project.count({
    where: { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' }
  });
  console.log(`Total: ${emExecucaoCount}`);

  // 4. Total no módulo EXECUCAO
  console.log('\n--- TOTAL NO MÓDULO EXECUCAO (deveria ser 45) ---');
  const totalExecucao = await prisma.project.count({
    where: { currentModule: 'EXECUCAO' }
  });
  console.log(`Total: ${totalExecucao}`);

  // 5. Verificar de onde vieram os PAUSADO do COMERCIAL
  console.log('\n--- AMOSTRA PAUSADO COMERCIAL (origem Pipedrive) ---');
  const pausadoComercial = await prisma.project.findMany({
    where: { currentModule: 'COMERCIAL', status: 'PAUSADO' },
    take: 5,
    select: { cliente: true, title: true, status: true }
  });
  pausadoComercial.forEach((p, i) => {
    console.log(`${i+1}. ${(p.cliente || p.title || 'N/A').substring(0, 50)}`);
  });

  await prisma.$disconnect();
}

check().catch(console.error);
