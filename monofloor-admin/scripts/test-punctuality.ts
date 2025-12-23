import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPunctuality() {
  console.log('=== TESTE DO SISTEMA DE PONTUALIDADE ===\n');

  // 1. Buscar usuário de teste
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' },
    select: {
      id: true,
      email: true,
      name: true,
      punctualityStreak: true,
      punctualityMultiplier: true,
      lastPunctualDate: true,
      xpTotal: true,
    }
  });

  if (!user) {
    console.log('Usuário não encontrado');
    return;
  }

  console.log('=== DADOS DO USUÁRIO ===');
  console.log('Nome:', user.name);
  console.log('Email:', user.email);
  console.log('XP Total:', user.xpTotal);
  console.log('Streak de Pontualidade:', user.punctualityStreak, 'dias');
  console.log('Multiplicador Atual:', Number(user.punctualityMultiplier).toFixed(1) + 'x');
  console.log('Última Data Pontual:', user.lastPunctualDate?.toISOString() || 'Nunca');

  // 2. Buscar projetos do usuário com workStartTime
  const projects = await prisma.project.findMany({
    where: {
      assignments: {
        some: { userId: user.id }
      }
    },
    select: {
      id: true,
      title: true,
      workStartTime: true,
      workEndTime: true,
    }
  });

  console.log('\n=== PROJETOS COM HORÁRIO DE TRABALHO ===');
  for (const project of projects) {
    console.log(`- ${project.title}`);
    console.log(`  Início: ${project.workStartTime || 'Não definido'}`);
    console.log(`  Fim: ${project.workEndTime || 'Não definido'}`);
  }

  // 3. Buscar check-ins recentes com dados de pontualidade
  const checkins = await prisma.checkin.findMany({
    where: { userId: user.id },
    orderBy: { checkinAt: 'desc' },
    take: 10,
    select: {
      id: true,
      checkinAt: true,
      checkoutAt: true,
      isFirstOfDay: true,
      isPunctual: true,
      minutesLate: true,
      expectedTime: true,
      project: {
        select: { title: true }
      }
    }
  });

  console.log('\n=== CHECK-INS RECENTES (últimos 10) ===');
  for (const c of checkins) {
    const date = c.checkinAt.toISOString().split('T')[0];
    const time = c.checkinAt.toISOString().split('T')[1].substring(0, 5);

    let status = '';
    if (c.isFirstOfDay) {
      if (c.isPunctual === true) {
        status = '✅ PONTUAL';
      } else if (c.isPunctual === false) {
        status = `❌ ATRASADO (${c.minutesLate} min)`;
      } else {
        status = '⏳ (sem dados)';
      }
    } else {
      status = '(não é primeiro do dia)';
    }

    console.log(`${date} ${time} | ${c.project.title.substring(0, 20).padEnd(20)} | ${status}`);
    if (c.expectedTime) {
      console.log(`  Esperado: ${c.expectedTime} | isFirstOfDay: ${c.isFirstOfDay}`);
    }
  }

  // 4. Buscar transações de XP de pontualidade
  const xpTransactions = await prisma.xpTransaction.findMany({
    where: {
      userId: user.id,
      reason: { contains: 'Pontualidade' }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      amount: true,
      reason: true,
      createdAt: true,
    }
  });

  console.log('\n=== TRANSAÇÕES DE XP DE PONTUALIDADE ===');
  if (xpTransactions.length === 0) {
    console.log('Nenhuma transação de pontualidade encontrada');
  } else {
    for (const tx of xpTransactions) {
      const date = tx.createdAt.toISOString().split('T')[0];
      console.log(`${date} | +${tx.amount} XP | ${tx.reason}`);
    }
  }

  // 5. Calcular próximo multiplicador
  const nextStreak = user.punctualityStreak + 1;
  const nextMultiplier = Math.min(1.1 + (nextStreak * 0.1), 5.0);

  console.log('\n=== PREVISÃO ===');
  console.log(`Se for pontual amanhã: streak ${nextStreak} dias, ${nextMultiplier.toFixed(1)}x multiplicador`);

  if (user.punctualityStreak > 0) {
    console.log(`Se atrasar: streak 0 dias, 1.1x multiplicador (perde ${(Number(user.punctualityMultiplier) - 1.1).toFixed(1)}x)`);
  }

  await prisma.$disconnect();
}

testPunctuality().catch(console.error);
