import { PrismaClient } from '@prisma/client';
import { processDailyWorktime } from '../src/services/worktime.service';
import { getRoleRates } from '../src/config/payroll.config';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' }
  });

  if (!user) {
    console.log('Usuário não encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log('Usuário:', user.name, '-', user.role);

  // Limpar todos os DailyWorkSummary antigos
  console.log('\n=== LIMPANDO SUMMARIES ANTIGOS ===');
  await prisma.dailyWorkSummary.deleteMany({
    where: { userId: user.id }
  });
  console.log('✅ Summaries antigos removidos');

  // Processar cada dia de 13 a 20 de dezembro
  const dates = [
    '2025-12-13',
    '2025-12-14',
    '2025-12-15',
    '2025-12-16',
    '2025-12-17',
    '2025-12-18',
    '2025-12-19',
    '2025-12-20'
  ];

  console.log('\n=== PROCESSANDO TODOS OS DIAS ===\n');

  for (const dateStr of dates) {
    const workDate = new Date(dateStr + 'T12:00:00Z'); // Meio dia UTC para evitar problemas de timezone
    console.log(`\nProcessando ${dateStr}...`);

    try {
      await processDailyWorktime(user.id, workDate);
    } catch (error) {
      console.error(`❌ Erro:`, error);
    }
  }

  // Buscar resumos gerados
  console.log('\n=== RESUMOS DIÁRIOS GERADOS ===\n');

  const summaries = await prisma.dailyWorkSummary.findMany({
    where: { userId: user.id },
    orderBy: { workDate: 'desc' }
  });

  const rates = getRoleRates(user.role);
  let totalEarnings = 0;
  let totalHours = 0;

  for (const s of summaries) {
    const date = s.workDate.toISOString().split('T')[0];
    const hours = Number(s.totalHoursWorked) || 0;
    const payment = Number(s.totalPayment) || 0;
    totalEarnings += payment;
    totalHours += hours;

    console.log(`${date} | ${hours.toFixed(2)}h | R$${payment.toFixed(2)}`);
  }

  console.log(`\n=== TOTAL MENSAL ===`);
  console.log(`Horas: ${totalHours.toFixed(2)}h`);
  console.log(`Valor: R$${totalEarnings.toFixed(2)}`);

  // Comparar com check-ins
  const checkins = await prisma.checkin.findMany({
    where: { userId: user.id, checkoutAt: { not: null } },
    include: { project: { select: { title: true } } }
  });

  let checkinHours = 0;
  for (const c of checkins) {
    checkinHours += Number(c.hoursWorked) || 0;
  }

  console.log(`\n=== COMPARAÇÃO ===`);
  console.log(`Total horas DailyWorkSummary: ${totalHours.toFixed(2)}h`);
  console.log(`Total horas Check-ins: ${checkinHours.toFixed(2)}h`);
  console.log(`Diferença: ${(checkinHours - totalHours).toFixed(2)}h`);

  await prisma.$disconnect();
}

main().catch(console.error);
