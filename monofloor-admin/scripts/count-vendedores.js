const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const consultores = await prisma.comercialData.groupBy({
    by: ['ownerUserName'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  console.log('══════════════════════════════════════════════════');
  console.log('VENDEDORES/CONSULTORES NOS LEADS');
  console.log('══════════════════════════════════════════════════');
  console.log('');

  const validConsultores = consultores.filter(c => c.ownerUserName && c.ownerUserName !== 'N/A');

  console.log('Total de vendedores unicos:', validConsultores.length);
  console.log('');
  console.log('Ranking por quantidade de leads:');
  console.log('──────────────────────────────────────────────────');

  validConsultores.forEach((c, i) => {
    const nome = (c.ownerUserName || 'N/A').padEnd(30);
    console.log(`${(i+1).toString().padStart(2)}. ${nome} ${c._count.id} leads`);
  });

  const totalLeads = validConsultores.reduce((acc, c) => acc + c._count.id, 0);
  console.log('──────────────────────────────────────────────────');
  console.log('Total de leads com consultor:', totalLeads);
}

main().then(() => prisma.$disconnect());
