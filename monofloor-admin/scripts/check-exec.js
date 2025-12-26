const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const nullPhase = await prisma.project.findMany({
    where: { currentModule: 'EXECUCAO', pipefyPhase: null },
    select: { cliente: true, pipefyCardId: true, status: true }
  });
  
  const withPipefyId = nullPhase.filter(p => p.pipefyCardId !== null);
  const withoutPipefyId = nullPhase.filter(p => p.pipefyCardId === null);
  
  console.log('Projetos EXECUCAO com fase NULL: ' + nullPhase.length);
  console.log('- Com pipefyCardId: ' + withPipefyId.length);
  console.log('- Sem pipefyCardId: ' + withoutPipefyId.length);
  
  console.log('\nEXEMPLOS COM pipefyCardId:');
  withPipefyId.slice(0, 5).forEach(p => {
    console.log('- ' + (p.cliente || 'N/A').substring(0,40) + ' | ID: ' + p.pipefyCardId);
  });
  
  console.log('\nEXEMPLOS SEM pipefyCardId:');
  withoutPipefyId.slice(0, 5).forEach(p => {
    console.log('- ' + (p.cliente || 'N/A').substring(0,40) + ' | Status: ' + p.status);
  });
  
  await prisma.$disconnect();
}

check();
