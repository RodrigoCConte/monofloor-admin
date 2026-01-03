const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Get the pending tasks with their dates
  const tasks = await prisma.projectTask.findMany({
    where: {
      publishedToApp: true,
      status: 'PENDING'
    },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      startDate: true,
      endDate: true,
      phase: true,
      groupWithNext: true,
      dependsOnId: true
    },
    orderBy: { sortOrder: 'asc' },
    take: 10
  });

  console.log('Tasks with dates:');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach(t => {
    let daysRemaining = null;
    if (t.endDate) {
      const endDate = new Date(t.endDate);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    console.log(`  ${t.sortOrder}. ${t.title}`);
    console.log(`     startDate: ${t.startDate ? t.startDate.toISOString().split('T')[0] : 'null'}`);
    console.log(`     endDate: ${t.endDate ? t.endDate.toISOString().split('T')[0] : 'null'}`);
    console.log(`     daysRemaining: ${daysRemaining}`);
    console.log(`     groupWithNext: ${t.groupWithNext}`);
    console.log('');
  });

  // Count total tasks assigned to a specific user
  const allUserTasks = await prisma.projectTask.findMany({
    where: {
      publishedToApp: true,
      assignedUsers: {
        some: {
          user: { name: { contains: 'Rodrigo' } }
        }
      }
    },
    select: { id: true, title: true, status: true, sortOrder: true }
  });

  console.log(`\nTotal tasks assigned to Rodrigo: ${allUserTasks.length}`);
  console.log('PENDING tasks:');
  allUserTasks.filter(t => t.status === 'PENDING').forEach(t => {
    console.log(`  ${t.sortOrder}. ${t.title}`);
  });

  await prisma.$disconnect();
}
check();
