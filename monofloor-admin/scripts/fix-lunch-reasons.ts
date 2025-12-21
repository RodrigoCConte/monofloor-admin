import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLunchReasons() {
  console.log('=== CORRIGINDO CHECK-INS DE ALMOÇO SUSPEITOS ===\n');

  // IDs dos check-ins suspeitos (8h de "almoço")
  const suspectIds = [
    'd1b102be-a167-4997-a902-7cf138dc6304', // 2025-12-16 8h
    '563c2095-47b7-4fab-8925-2135c0b2a4d9'  // 2025-12-14 8h
  ];

  for (const id of suspectIds) {
    const checkin = await prisma.checkin.findUnique({
      where: { id },
      include: { project: { select: { title: true } } }
    });

    if (!checkin) {
      console.log(`Check-in ${id} não encontrado`);
      continue;
    }

    console.log('---');
    console.log('ID:', id);
    console.log('Data:', checkin.checkinAt.toISOString().split('T')[0]);
    console.log('Horas:', Number(checkin.hoursWorked).toFixed(2), 'h');
    console.log('Motivo ANTIGO:', (checkin as any).checkoutReason);

    // Atualizar para FIM_EXPEDIENTE
    await prisma.checkin.update({
      where: { id },
      data: {
        checkoutReason: 'FIM_EXPEDIENTE'
      }
    });

    console.log('Motivo NOVO: FIM_EXPEDIENTE');
    console.log('✅ Corrigido!');
  }

  console.log('\n=== CONCLUÍDO ===');

  await prisma.$disconnect();
}

fixLunchReasons().catch(console.error);
