const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStelionDependencies() {
  // Find STELION tasks
  const stelionTasks = await prisma.projectTask.findMany({
    where: {
      title: { contains: 'STELION', mode: 'insensitive' }
    },
    include: {
      dependsOn: {
        select: { id: true, title: true, status: true }
      },
      project: {
        select: { title: true, cliente: true }
      },
      assignedUsers: {
        include: {
          user: { select: { name: true } }
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  console.log('=== STELION Tasks Analysis ===\n');

  for (const task of stelionTasks) {
    console.log('Project:', task.project?.cliente || task.project?.title);
    console.log('Task:', task.title, '(sortOrder:', task.sortOrder, ')');
    console.log('Status:', task.status);
    console.log('Phase:', task.phase);
    console.log('Published:', task.publishedToApp);
    console.log('DependsOnId:', task.dependsOnId || 'NULL');
    if (task.dependsOn) {
      console.log('Depends On:', task.dependsOn.title, '- Status:', task.dependsOn.status);
    } else {
      console.log('Depends On: NONE (no dependency set!)');
    }
    console.log('Assigned to:', task.assignedUsers.map(au => au.user.name).join(', ') || 'nobody');
    console.log('---');
  }

  await prisma.$disconnect();
}

checkStelionDependencies().catch(console.error);
