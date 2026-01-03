const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar projetos com pipefyCardId (os importados da planilha Excel)
  const projects = await prisma.project.findMany({
    where: {
      pipefyCardId: { not: null }
    },
    select: {
      id: true,
      pipefyCardId: true,
      title: true,
      endereco: true,
      latitude: true,
      longitude: true
    }
  });

  console.log('Projetos importados da planilha (com pipefyCardId):');
  console.log('Total:', projects.length);
  console.log('\nCom endereço:', projects.filter(p => p.endereco).length);
  console.log('Com coordenadas:', projects.filter(p => p.latitude && p.longitude).length);

  const semCoords = projects.filter(p => !p.latitude || !p.longitude);
  console.log('Sem coordenadas:', semCoords.length);

  console.log('\n--- Projetos sem coordenadas ---');
  semCoords.forEach(p => {
    console.log(`[${p.pipefyCardId}] ${p.title?.substring(0, 30)} | End: ${p.endereco?.substring(0, 50) || 'SEM ENDEREÇO'}`);
  });

  await prisma.$disconnect();
}

main();
