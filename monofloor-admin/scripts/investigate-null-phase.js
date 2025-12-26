const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  // Projetos em EXECUCAO com fase NULL
  const execucaoNullPhase = await prisma.project.findMany({
    where: {
      currentModule: 'EXECUCAO',
      pipefyPhase: null
    },
    select: {
      id: true,
      cliente: true,
      pipefyCardId: true,
      status: true,
      createdAt: true,
      pipefySyncedAt: true
    }
  });

  console.log('=== PROJETOS EXECUCAO COM FASE NULL (' + execucaoNullPhase.length + ') ===\n');

  // Verificar se todos têm pipefyCardId
  const comPipefyId = execucaoNullPhase.filter(p => p.pipefyCardId);
  const semPipefyId = execucaoNullPhase.filter(p => !p.pipefyCardId);

  console.log('Com pipefyCardId: ' + comPipefyId.length);
  console.log('Sem pipefyCardId: ' + semPipefyId.length);

  console.log('\n--- PRIMEIROS 15 COM pipefyCardId ---');
  comPipefyId.slice(0, 15).forEach(p => {
    console.log('- ' + (p.cliente || 'N/A').substring(0, 45).padEnd(45) + ' | CardId: ' + p.pipefyCardId);
  });

  if (semPipefyId.length > 0) {
    console.log('\n--- SEM pipefyCardId (de onde vieram?) ---');
    semPipefyId.forEach(p => {
      console.log('- ' + (p.cliente || 'N/A').substring(0, 45) + ' | Created: ' + p.createdAt);
    });
  }

  // Agora vamos ver TODAS as fases distintas no banco
  console.log('\n\n=== TODAS AS FASES DISTINTAS NO BANCO ===');
  const allPhases = await prisma.project.groupBy({
    by: ['pipefyPhase'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  allPhases.forEach(p => {
    console.log((p.pipefyPhase || 'NULL').padEnd(40) + ': ' + p._count.id);
  });

  // Verificar onde estão os projetos de "OBRA EM EXECUÇÃO"
  console.log('\n\n=== PROJETOS COM FASE "OBRA EM EXECUÇÃO" ===');
  const obraEmExecucao = await prisma.project.findMany({
    where: {
      pipefyPhase: { contains: 'OBRA EM EXECUÇÃO', mode: 'insensitive' }
    },
    select: { id: true, cliente: true, currentModule: true, pipefyPhase: true }
  });

  console.log('Total com "OBRA EM EXECUÇÃO": ' + obraEmExecucao.length);
  obraEmExecucao.slice(0, 10).forEach(p => {
    console.log('- ' + (p.cliente || 'N/A').substring(0, 40) + ' | Modulo: ' + p.currentModule + ' | Fase: ' + p.pipefyPhase);
  });

  await prisma.$disconnect();
}

investigate().catch(console.error);
