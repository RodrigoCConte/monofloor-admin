import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const deals = JSON.parse(fs.readFileSync('/tmp/arquiteto_deals.json', 'utf-8'));

async function main() {
  let updated = 0;
  let notFound = 0;

  console.log(`Processing ${deals.length} deals...`);

  for (const deal of deals) {
    if (deal.pipedriveDealId === null || deal.pipedriveDealId === undefined) continue;
    if (deal.ownerName === null || deal.ownerName === undefined) continue;

    const result = await prisma.comercialData.updateMany({
      where: { pipedriveDealId: String(deal.pipedriveDealId) },
      data: { consultorId: deal.ownerName }
    });

    if (result.count > 0) {
      updated++;
    } else {
      notFound++;
    }
  }

  console.log(`Atualizado: ${updated}`);
  console.log(`Não encontrado no CRM: ${notFound}`);

  // Verificar distribuição final
  const stats = await prisma.comercialData.groupBy({
    by: ['consultorId'],
    where: {
      tipoCliente: { contains: 'Arquiteto', mode: 'insensitive' }
    },
    _count: { id: true }
  });

  console.log('\nDistribuição Form Arquiteto no CRM:');
  stats.sort((a, b) => b._count.id - a._count.id).forEach(s => {
    console.log(`  ${s.consultorId || 'Sem consultor'}: ${s._count.id}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
