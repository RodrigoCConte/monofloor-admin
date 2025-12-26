const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  // 1. Todos os projetos em EXECUCAO
  const execucao = await prisma.project.findMany({
    where: { currentModule: 'EXECUCAO' },
    select: { id: true, cliente: true, pipefyPhase: true, pipefyCardId: true, status: true }
  });

  console.log('=== PROJETOS EM EXECUCAO (' + execucao.length + ') ===');

  // Agrupar por fase
  const byPhase = {};
  execucao.forEach(p => {
    const phase = p.pipefyPhase || 'NULL';
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(p);
  });

  console.log('\n--- POR FASE ---');
  Object.entries(byPhase).forEach(([phase, projects]) => {
    console.log(phase + ': ' + projects.length);
  });

  // Projetos sem pipefyCardId em EXECUCAO
  const semPipefy = execucao.filter(p => !p.pipefyCardId);
  console.log('\n--- SEM PIPEFY CARD ID (' + semPipefy.length + ') ---');
  semPipefy.slice(0, 10).forEach(p => {
    console.log('- ' + (p.cliente || 'N/A').substring(0, 50) + ' | Fase: ' + (p.pipefyPhase || 'NULL'));
  });

  // Projetos COM pipefyCardId em EXECUCAO
  const comPipefy = execucao.filter(p => p.pipefyCardId);
  console.log('\n--- COM PIPEFY CARD ID (' + comPipefy.length + ') ---');

  // Ver todas as fases distintas de quem tem pipefyCardId
  const phasesComPipefy = [...new Set(comPipefy.map(p => p.pipefyPhase))];
  console.log('Fases distintas com PipefyCardId: ' + JSON.stringify(phasesComPipefy));

  // Contar por fase quem TEM pipefyCardId
  console.log('\n--- CONTAGEM POR FASE (com pipefyCardId) ---');
  phasesComPipefy.forEach(phase => {
    const count = comPipefy.filter(p => p.pipefyPhase === phase).length;
    console.log(phase + ': ' + count);
  });

  // 2. Verificar a origem dos dados - de onde vieram os projetos?
  console.log('\n\n=== ORIGEM DOS PROJETOS ===');

  const allProjects = await prisma.project.findMany({
    select: { pipefyCardId: true, pipedriveDealId: true, currentModule: true }
  });

  const comPipefyId = allProjects.filter(p => p.pipefyCardId);
  const comPipedriveId = allProjects.filter(p => p.pipedriveDealId);
  const semNenhum = allProjects.filter(p => !p.pipefyCardId && !p.pipedriveDealId);

  console.log('Total projetos: ' + allProjects.length);
  console.log('Com pipefyCardId: ' + comPipefyId.length);
  console.log('Com pipedriveDealId: ' + comPipedriveId.length);
  console.log('Sem nenhum ID externo: ' + semNenhum.length);

  // 3. Projetos em EXECUCAO que vieram do Pipedrive (não deveriam estar lá!)
  const execucaoFromPipedrive = execucao.filter(p => !p.pipefyCardId);
  console.log('\n--- EXECUCAO sem pipefyCardId (suspeitos) ---');
  console.log('Total: ' + execucaoFromPipedrive.length);

  await prisma.$disconnect();
}

investigate().catch(console.error);
