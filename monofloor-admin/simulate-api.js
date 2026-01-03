const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateAPI() {
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

  console.log('=== Simulating Mobile API for Rodrigo ===');
  console.log('User ID:', rodrigo.id);
  console.log('');

  // Find Casa Rodrigo project
  const project = await prisma.project.findFirst({
    where: { cliente: { contains: 'Rodrigo', mode: 'insensitive' } }
  });

  if (!project) {
    console.log('Project Casa Rodrigo not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Project:', project.cliente);
  console.log('Project ID:', project.id);
  console.log('');

  const projectId = project.id;
  const userId = rodrigo.id;

  // ============================================
  // THIS IS THE NEW LOGIC FROM THE FIX
  // ============================================

  // Get ALL project tasks to build a map of task statuses (needed for dependency checking)
  const allProjectTasks = await prisma.projectTask.findMany({
    where: {
      projectId,
      publishedToApp: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  console.log('=== All Project Tasks (published) ===');
  for (const task of allProjectTasks) {
    console.log('  [' + task.sortOrder + '] ' + task.title + ' - Status: ' + task.status + ' - DependsOn: ' + (task.dependsOnId || 'NULL'));
  }
  console.log('');

  // Build a map of task ID -> status for quick lookup
  const taskStatusMap = new Map();
  allProjectTasks.forEach((task) => {
    taskStatusMap.set(task.id, task.status);
  });

  // Get tasks explicitly assigned to this user
  const userAssignedTasks = await prisma.projectTask.findMany({
    where: {
      projectId,
      publishedToApp: true,
      assignedUsers: {
        some: {
          userId: userId,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  console.log('=== Tasks Assigned to Rodrigo ===');
  for (const task of userAssignedTasks) {
    console.log('  [' + task.sortOrder + '] ' + task.title + ' - Status: ' + task.status);
  }
  console.log('');

  // Filter tasks: only show tasks that are:
  // 1. COMPLETED - always show
  // 2. Non-completed BUT their dependency (dependsOnId) is COMPLETED
  // This ensures tasks appear in proper sequence respecting dependencies
  const tasks = userAssignedTasks.filter((task) => {
    if (task.status === 'COMPLETED') {
      console.log('  INCLUDE (completed):', task.title);
      return true; // Always show completed tasks
    }

    // Check if dependency task is completed (if there is one)
    if (task.dependsOnId) {
      const dependencyStatus = taskStatusMap.get(task.dependsOnId);
      console.log('  Checking dependency for "' + task.title + '": dependsOnId=' + task.dependsOnId + ' status=' + dependencyStatus);
      // Only show this task if its dependency is COMPLETED
      if (dependencyStatus !== 'COMPLETED') {
        console.log('  EXCLUDE (dependency not completed):', task.title);
        return false; // Hide task - dependency not completed yet
      }
    }

    // Task has no dependency or dependency is completed - show it
    console.log('  INCLUDE (no dep or dep completed):', task.title);
    return true;
  });

  console.log('\n=== FINAL RESULT: Tasks to show to Rodrigo ===');
  if (tasks.length === 0) {
    console.log('  NO TASKS (all tasks are waiting for dependencies)');
  } else {
    for (const task of tasks) {
      console.log('  - ' + task.title);
    }
  }

  await prisma.$disconnect();
}

simulateAPI().catch(console.error);
