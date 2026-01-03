const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tasks = await prisma.projectTask.findMany({
    where: { publishedToApp: true },
    select: {
      id: true,
      title: true,
      groupWithNext: true,
      sortOrder: true,
      phase: true,
      status: true,
      projectId: true
    },
    orderBy: { sortOrder: 'asc' },
    take: 20
  });
  console.log('Tasks with groupWithNext:');
  tasks.forEach(t => {
    console.log(`  ${t.sortOrder}. ${t.title} - groupWithNext: ${t.groupWithNext}, status: ${t.status}, phase: ${t.phase}`);
  });
  await prisma.$disconnect();
}
check();
