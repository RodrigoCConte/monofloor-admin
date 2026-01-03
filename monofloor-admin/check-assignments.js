const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Get tasks 5 and 6 (Lixamento and Leona) with their assignments
  const tasks = await prisma.projectTask.findMany({
    where: {
      publishedToApp: true,
      title: { in: ['Lixamento', 'Leona'] },
      status: 'PENDING'
    },
    include: {
      assignedUsers: {
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  console.log('Tasks Lixamento and Leona with assignments:');
  tasks.forEach(t => {
    const users = t.assignedUsers.map(a => a.user.name).join(', ') || 'NENHUM';
    console.log(`  ${t.sortOrder}. ${t.title} (${t.id.slice(0,8)}) - groupWithNext: ${t.groupWithNext}, users: [${users}]`);
  });

  // Also show all user assignments for this project
  console.log('\nAll task assignments for PENDING tasks:');
  const allTasks = await prisma.projectTask.findMany({
    where: {
      publishedToApp: true,
      status: 'PENDING'
    },
    include: {
      assignedUsers: {
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { sortOrder: 'asc' },
    take: 10
  });

  allTasks.forEach(t => {
    const users = t.assignedUsers.map(a => a.user.name).join(', ') || 'NENHUM';
    console.log(`  ${t.sortOrder}. ${t.title} - users: [${users}]`);
  });

  await prisma.$disconnect();
}
check();
