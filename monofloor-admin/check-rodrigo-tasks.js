const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRodrigoTasks() {
  // Find Rodrigo user
  const rodrigo = await prisma.user.findFirst({
    where: {
      name: { contains: 'Rodrigo', mode: 'insensitive' }
    }
  });

  if (!rodrigo) {
    console.log('User Rodrigo not found');
    await prisma.$disconnect();
    return;
  }

  console.log('=== Rodrigo User ===');
  console.log('ID:', rodrigo.id);
  console.log('Name:', rodrigo.name);
  console.log('');

  // Get all tasks assigned to Rodrigo
  const rodrigoTasks = await prisma.projectTask.findMany({
    where: {
      publishedToApp: true,
      assignedUsers: {
        some: {
          userId: rodrigo.id
        }
      }
    },
    include: {
      dependsOn: {
        select: { id: true, title: true, status: true }
      },
      project: {
        select: { title: true, cliente: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  console.log('=== Tasks Assigned to Rodrigo (published to app) ===\n');

  for (const task of rodrigoTasks) {
    const depStatus = task.dependsOn ? task.dependsOn.status : 'NO DEP';
    const shouldShow = task.status === 'COMPLETED' ||
                       !task.dependsOnId ||
                       (task.dependsOn && task.dependsOn.status === 'COMPLETED');

    console.log('Project:', task.project?.cliente || task.project?.title);
    console.log('Task:', task.title, '(sortOrder:', task.sortOrder, ')');
    console.log('Status:', task.status);
    console.log('Phase:', task.phase);
    console.log('Depends On:', task.dependsOn ? task.dependsOn.title : 'NONE');
    console.log('Dependency Status:', depStatus);
    console.log('SHOULD SHOW:', shouldShow ? 'YES' : 'NO');
    console.log('---');
  }

  await prisma.$disconnect();
}

checkRodrigoTasks().catch(console.error);
