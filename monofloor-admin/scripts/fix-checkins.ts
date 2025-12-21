import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' }
  });

  if (!user) {
    console.log('User not found');
    await prisma.$disconnect();
    return;
  }

  // Buscar os check-ins problemáticos do dia 16
  const checkins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkoutAt: { not: null },
      hoursWorked: { gt: 10 } // Mais de 10 horas é suspeito
    },
    orderBy: { checkinAt: 'desc' }
  });

  console.log('=== CHECK-INS COM MAIS DE 10 HORAS ===');
  for (const c of checkins) {
    const hours = Number(c.hoursWorked) || 0;
    const checkinTime = c.checkinAt;
    const checkoutTime = c.checkoutAt!;

    // Calcular diferença real em horas
    const diffMs = checkoutTime.getTime() - checkinTime.getTime();
    const realHours = diffMs / (1000 * 60 * 60);

    console.log('---');
    console.log('ID:', c.id);
    console.log('Check-in:', checkinTime.toISOString());
    console.log('Checkout:', checkoutTime.toISOString());
    console.log('Horas registradas:', hours.toFixed(2), 'h');
    console.log('Horas reais (calculadas):', realHours.toFixed(2), 'h');
    console.log('Diferença:', (hours - realHours).toFixed(2), 'h');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
