const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkResponsibility() {
  // Find Casa Rodrigo project
  const project = await prisma.project.findFirst({
    where: { cliente: { contains: 'Rodrigo', mode: 'insensitive' } }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('=== Project Casa Rodrigo ===');
  console.log('ID:', project.id);
  console.log('');

  // Get active team members
  const teamMembers = await prisma.projectAssignment.findMany({
    where: {
      projectId: project.id,
      isActive: true,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  console.log('=== Active Team Members ===');
  teamMembers.forEach(m => {
    console.log('  -', m.user.name, '(', m.projectRole, ')');
  });
  console.log('');

  // Get today's responsibility
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const responsibility = await prisma.dailyReportResponsibility.findUnique({
    where: {
      projectId_reportDate: {
        projectId: project.id,
        reportDate: today,
      },
    },
    include: {
      responsibleUser: { select: { id: true, name: true } },
    },
  });

  console.log("=== Today's Responsibility ===");
  if (responsibility) {
    console.log('Responsible:', responsibility.responsibleUser.name);
    console.log('Status:', responsibility.status);
    console.log('ID:', responsibility.id);

    // Check if responsible is on the team
    const isOnTeam = teamMembers.some(m => m.userId === responsibility.responsibleUserId);
    console.log('Is on team:', isOnTeam ? 'YES' : 'NO <<<< PROBLEM!');
  } else {
    console.log('No responsibility assigned for today');
  }

  // Check João Silva
  const joaoSilva = await prisma.user.findFirst({
    where: { name: { contains: 'João Silva', mode: 'insensitive' } }
  });

  if (joaoSilva) {
    console.log('');
    console.log('=== João Silva ===');
    console.log('ID:', joaoSilva.id);

    const joaoAssignment = await prisma.projectAssignment.findFirst({
      where: {
        projectId: project.id,
        userId: joaoSilva.id,
      },
    });

    if (joaoAssignment) {
      console.log('Assignment exists:', joaoAssignment.isActive ? 'ACTIVE' : 'INACTIVE');
    } else {
      console.log('No assignment to this project');
    }
  }

  await prisma.$disconnect();
}

checkResponsibility().catch(console.error);
