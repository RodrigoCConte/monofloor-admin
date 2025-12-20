import { PrismaClient } from '@prisma/client';
import { processDailyWorktime } from '../src/services/worktime.service';
import { getRoleRates } from '../src/config/payroll.config';

const prisma = new PrismaClient();

async function main() {
  // Buscar usuário Rodrigo Conte (email correto)
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' }
  });

  if (!user) {
    console.log('Usuário Rodrigo não encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log('Usuário encontrado:', user.name, '-', user.email, '-', user.role);
  const rates = getRoleRates(user.role);
  console.log('Role rates:', rates);

  // Buscar check-ins com checkout
  const checkins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkoutAt: { not: null }
    },
    include: {
      project: { select: { id: true, title: true, cliente: true, isTravelMode: true } }
    },
    orderBy: { checkinAt: 'desc' }
  });

  console.log(`\n=== Total de ${checkins.length} Check-ins ===\n`);

  // Agrupar por data
  const byDate = new Map<string, typeof checkins>();
  for (const c of checkins) {
    const date = c.checkinAt.toISOString().split('T')[0];
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date)!.push(c);
  }

  console.log('Datas com check-ins:', Array.from(byDate.keys()).join(', '));

  // Processar cada dia
  console.log('\n=== Processando cada dia ===\n');

  for (const [dateStr, dayCheckins] of byDate) {
    const workDate = new Date(dateStr);
    console.log(`\nProcessando ${dateStr}...`);

    try {
      await processDailyWorktime(user.id, workDate);
      console.log(`✅ ${dateStr} processado`);
    } catch (error) {
      console.error(`❌ Erro ao processar ${dateStr}:`, error);
    }
  }

  // Buscar resumos gerados
  console.log('\n=== Resumos Diários Gerados ===\n');

  const summaries = await prisma.dailyWorkSummary.findMany({
    where: { userId: user.id },
    orderBy: { workDate: 'desc' }
  });

  let totalEarnings = 0;
  let totalHours = 0;

  for (const s of summaries) {
    const date = s.workDate.toISOString().split('T')[0];
    const hours = Number(s.totalHoursWorked) || 0;
    const payment = Number(s.totalPayment) || 0;
    totalEarnings += payment;
    totalHours += hours;

    console.log(`${date} | ${s.userRole} | ${hours.toFixed(2)}h | R$${payment.toFixed(2)}`);
  }

  console.log(`\n=== TOTAL ===`);
  console.log(`Horas: ${totalHours.toFixed(2)}h`);
  console.log(`Valor: R$${totalEarnings.toFixed(2)}`);

  await prisma.$disconnect();
}

main().catch(console.error);
