const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Get tasks with dependencies
  const tasks = await prisma.projectTask.findMany({
    where: {
      publishedToApp: true,
      status: 'PENDING'
    },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      groupWithNext: true,
      dependsOnId: true,
      dependsOn: {
        select: { id: true, title: true, status: true }
      }
    },
    orderBy: { sortOrder: 'asc' },
    take: 10
  });

  console.log('Tasks with dependencies:');
  tasks.forEach(t => {
    const dep = t.dependsOn ? `depends on "${t.dependsOn.title}" (${t.dependsOn.status})` : 'no dependency';
    console.log(`  ${t.sortOrder}. ${t.title} - groupWithNext: ${t.groupWithNext}, ${dep}`);
  });

  await prisma.$disconnect();
}
check();
