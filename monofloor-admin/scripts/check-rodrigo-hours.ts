import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // Buscar usuário Rodrigo
  const user = await prisma.user.findFirst({
    where: { email: 'rodrigocontee@gmail.com' },
    select: { id: true, name: true, email: true }
  });

  if (!user) {
    console.log('Usuário não encontrado');
    return;
  }

  console.log('=== USUÁRIO ===');
  console.log(`${user.name} - ${user.email}`);
  console.log(`ID: ${user.id}`);

  // Check-ins de dezembro
  const startDate = new Date('2025-12-01');
  const endDate = new Date('2025-12-31');

  const checkins = await prisma.checkin.findMany({
    where: {
      userId: user.id,
      checkinAt: { gte: startDate, lte: endDate }
    },
    include: {
      project: { select: { id: true, title: true } }
    },
    orderBy: { checkinAt: 'desc' }
  });

  console.log(`\n=== CHECK-INS DEZEMBRO (${checkins.length} registros) ===`);

  let totalMinutes = 0;
  const byProject: Record<string, { title: string, minutes: number, count: number }> = {};

  for (const c of checkins) {
    const projectId = c.projectId || 'SEM_PROJETO';
    const projectTitle = c.project?.title || 'Sem projeto';

    if (!byProject[projectId]) {
      byProject[projectId] = { title: projectTitle, minutes: 0, count: 0 };
    }

    // Usar hoursWorked (Decimal) convertido para minutos
    const hoursWorkedNum = c.hoursWorked ? Number(c.hoursWorked) : 0;
    const minutes = Math.round(hoursWorkedNum * 60);
    byProject[projectId].minutes += minutes;
    byProject[projectId].count++;
    totalMinutes += minutes;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hoursWorked = c.hoursWorked ? Number(c.hoursWorked) : 0;
    console.log(`- ${c.checkinAt.toISOString().split('T')[0]} | ${projectTitle.substring(0,30).padEnd(30)} | ${hoursWorked.toFixed(2)}h | status: ${c.checkoutAt ? 'CHECKED_OUT' : 'ACTIVE'}`);
  }

  console.log('\n=== RESUMO POR PROJETO ===');
  for (const [id, data] of Object.entries(byProject)) {
    const hours = Math.floor(data.minutes / 60);
    const mins = data.minutes % 60;
    console.log(`- ${data.title}: ${hours}h${mins}m (${data.count} check-ins)`);
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  console.log(`\nTOTAL: ${totalHours}h${totalMins}m`);

  await prisma.$disconnect();
}

check();
