import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDay() {
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  // Verificar dia 16
  const targetDate = '2025-12-16';
  const startOfDay = new Date(targetDate + 'T00:00:00.000Z');
  const endOfDay = new Date(targetDate + 'T23:59:59.999Z');

  console.log('=== DEBUG DIA 2025-12-16 ===\n');
  console.log('startOfDay:', startOfDay.toISOString());
  console.log('endOfDay:', endOfDay.toISOString());

  // Buscar check-ins do dia (como faz o worktime service)
  const checkins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkinAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      project: { select: { title: true, isTravelMode: true } }
    },
    orderBy: { checkinAt: 'asc' }
  });

  console.log(`\nCheck-ins encontrados: ${checkins.length}\n`);

  let totalMinutes = 0;
  for (const c of checkins) {
    const checkinTime = new Date(c.checkinAt);
    const checkoutTime = c.checkoutAt ? new Date(c.checkoutAt) : null;
    const hours = Number(c.hoursWorked) || 0;
    const reason = (c as any).checkoutReason || 'N/A';

    console.log('---');
    console.log('ID:', c.id);
    console.log('Check-in:', checkinTime.toISOString());
    console.log('Checkout:', checkoutTime?.toISOString() || 'ATIVO');
    console.log('hoursWorked:', hours.toFixed(2), 'h');
    console.log('checkoutReason:', reason);
    console.log('isTravelMode:', c.project?.isTravelMode);

    if (checkoutTime) {
      const sessionMinutes = (checkoutTime.getTime() - checkinTime.getTime()) / 1000 / 60;
      console.log('sessionMinutes (calculado):', (sessionMinutes / 60).toFixed(2), 'h');

      // Verificar se é ALMOCO
      if (reason !== 'ALMOCO_INTERVALO') {
        totalMinutes += sessionMinutes;
      } else {
        console.log('(NÃO CONTA - é almoço)');
      }
    }
  }

  console.log('\n=== TOTAL ===');
  console.log('Total minutos trabalhados:', totalMinutes.toFixed(0), 'min');
  console.log('Total horas trabalhadas:', (totalMinutes / 60).toFixed(2), 'h');

  // Verificar todos os check-ins com data de check-in no dia 16
  console.log('\n\n=== TODOS OS CHECK-INS DO DIA 16 (por hoursWorked) ===\n');

  const allCheckins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkoutAt: { not: null }
    },
    include: {
      project: { select: { title: true } }
    },
    orderBy: { checkinAt: 'asc' }
  });

  for (const c of allCheckins) {
    const checkinDate = c.checkinAt.toISOString().split('T')[0];
    if (checkinDate === '2025-12-16') {
      const hours = Number(c.hoursWorked) || 0;
      console.log(c.checkinAt.toISOString(), '->', c.checkoutAt?.toISOString(), '|', hours.toFixed(2), 'h |', (c as any).checkoutReason);
    }
  }

  await prisma.$disconnect();
}

debugDay().catch(console.error);
