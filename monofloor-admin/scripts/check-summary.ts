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

  console.log('=== USUÁRIO ===');
  console.log('ID:', user.id, '| Role:', user.role);

  // DailyWorkSummary
  const summaries = await prisma.dailyWorkSummary.findMany({
    where: { userId: user.id },
    orderBy: { workDate: 'desc' }
  });

  console.log('\n=== DAILY WORK SUMMARY ===');
  console.log('Total registros:', summaries.length);

  let totalFromSummary = 0;
  let totalHoursFromSummary = 0;
  for (const s of summaries) {
    const payment = Number(s.totalPayment) || 0;
    const hours = Number(s.totalHoursWorked) || 0;
    totalFromSummary += payment;
    totalHoursFromSummary += hours;
    console.log(s.workDate.toISOString().split('T')[0], '|', hours.toFixed(2), 'h | R$' + payment.toFixed(2));
  }
  console.log('TOTAL Summary:', totalHoursFromSummary.toFixed(2), 'h | R$' + totalFromSummary.toFixed(2));

  // Checkins
  const checkins = await prisma.checkin.findMany({
    where: { userId: user.id, checkoutAt: { not: null } },
    include: { project: { select: { title: true } } },
    orderBy: { checkinAt: 'desc' }
  });

  console.log('\n=== CHECKINS ===');
  console.log('Total checkins:', checkins.length);

  let totalHours = 0;
  for (const c of checkins) {
    const hours = Number(c.hoursWorked) || 0;
    totalHours += hours;
    console.log(c.checkinAt.toISOString().split('T')[0], '|', hours.toFixed(2), 'h |', c.project?.title || 'N/A');
  }
  console.log('TOTAL HORAS Checkins:', totalHours.toFixed(2), 'h');

  await prisma.$disconnect();
}

check().catch(console.error);
