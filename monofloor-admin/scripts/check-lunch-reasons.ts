import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLunchReasons() {
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const checkins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkoutAt: { not: null }
    },
    include: {
      project: { select: { title: true } }
    },
    orderBy: { checkinAt: 'desc' }
  });

  console.log('=== TODOS OS CHECK-INS POR MOTIVO ===\n');

  // Agrupar por razão
  const byReason: Record<string, any[]> = {};
  for (const c of checkins) {
    const reason = (c as any).checkoutReason || 'NULL';
    if (!byReason[reason]) {
      byReason[reason] = [];
    }
    byReason[reason].push(c);
  }

  for (const [reason, list] of Object.entries(byReason)) {
    console.log(`\n=== ${reason} (${list.length} check-ins) ===`);
    for (const c of list) {
      const hours = Number(c.hoursWorked) || 0;
      const date = c.checkinAt.toISOString().split('T')[0];
      console.log(`${date} | ${hours.toFixed(2)}h | ${c.project?.title || 'N/A'}`);
    }
  }

  // Encontrar check-ins de ALMOCO com mais de 2 horas (suspeitos)
  console.log('\n\n=== CHECK-INS DE ALMOÇO COM MAIS DE 2 HORAS (SUSPEITOS) ===\n');

  const suspectLunch = checkins.filter(c => {
    const reason = (c as any).checkoutReason;
    const hours = Number(c.hoursWorked) || 0;
    return reason === 'ALMOCO_INTERVALO' && hours > 2;
  });

  if (suspectLunch.length === 0) {
    console.log('Nenhum encontrado');
  } else {
    for (const c of suspectLunch) {
      const hours = Number(c.hoursWorked) || 0;
      console.log('ID:', c.id);
      console.log('Check-in:', c.checkinAt.toISOString());
      console.log('Checkout:', c.checkoutAt?.toISOString());
      console.log('Horas:', hours.toFixed(2), 'h');
      console.log('---');
    }
  }

  await prisma.$disconnect();
}

checkLunchReasons().catch(console.error);
