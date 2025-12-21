import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_WORK_HOURS = 8; // Máximo de horas de trabalho por sessão

async function fixLongCheckins() {
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' }
  });

  if (!user) {
    console.log('User not found');
    await prisma.$disconnect();
    return;
  }

  console.log('=== CORRIGINDO CHECK-INS LONGOS ===\n');

  // Buscar check-ins com mais de 10 horas
  const longCheckins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkoutAt: { not: null },
      hoursWorked: { gt: 10 }
    },
    include: {
      project: { select: { title: true } }
    },
    orderBy: { checkinAt: 'desc' }
  });

  console.log(`Encontrados ${longCheckins.length} check-ins com mais de 10 horas\n`);

  for (const checkin of longCheckins) {
    const checkinTime = new Date(checkin.checkinAt);
    const oldCheckoutTime = checkin.checkoutAt!;
    const oldHours = Number(checkin.hoursWorked) || 0;

    // Novo checkout: 8 horas após check-in
    const newCheckoutTime = new Date(checkinTime.getTime() + MAX_WORK_HOURS * 60 * 60 * 1000);

    console.log('---');
    console.log('ID:', checkin.id);
    console.log('Projeto:', checkin.project?.title || 'N/A');
    console.log('Check-in:', checkinTime.toISOString());
    console.log('Checkout ANTIGO:', oldCheckoutTime.toISOString(), `(${oldHours.toFixed(2)}h)`);
    console.log('Checkout NOVO:', newCheckoutTime.toISOString(), `(${MAX_WORK_HOURS}h)`);

    // Atualizar no banco
    await prisma.checkin.update({
      where: { id: checkin.id },
      data: {
        checkoutAt: newCheckoutTime,
        hoursWorked: MAX_WORK_HOURS
      }
    });

    console.log('✅ Corrigido!');
  }

  console.log('\n=== VERIFICAÇÃO FINAL ===\n');

  // Verificar totais após correção
  const allCheckins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkoutAt: { not: null }
    }
  });

  let totalHours = 0;
  for (const c of allCheckins) {
    totalHours += Number(c.hoursWorked) || 0;
  }

  console.log('Total de check-ins:', allCheckins.length);
  console.log('Total de horas:', totalHours.toFixed(2), 'h');

  await prisma.$disconnect();
}

fixLongCheckins().catch(console.error);
