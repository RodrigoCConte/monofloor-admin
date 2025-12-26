import prisma from '../src/lib/prisma';

async function showTasks() {
  // Pegar um projeto com tarefas
  const project = await prisma.project.findFirst({
    where: {
      currentModule: 'EXECUCAO',
      tasks: { some: {} }
    },
    include: {
      tasks: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!project) {
    console.log('Nenhum projeto com tarefas encontrado');
    return;
  }

  console.log('='.repeat(60));
  console.log('Projeto:', project.title);
  console.log('Piso:', project.m2Piso, 'm² | Parede:', project.m2Parede, 'm²');
  console.log('Teto:', project.m2Teto, 'm² | Rodapé:', project.mRodape, 'm');
  console.log('Material:', project.material);
  console.log('='.repeat(60));
  console.log('');
  console.log('ETAPAS GERADAS:');
  console.log('');

  for (const task of project.tasks) {
    console.log(task.sortOrder + '. [' + task.phase + '] ' + task.title);
    console.log('   Tipo: ' + task.taskType + ' | Superfície: ' + task.surface);
    console.log('   Horas estimadas: ' + task.estimatedHours + 'h');
    console.log('   Dias: ' + (task.inputDays || '-') + ' | Pessoas: ' + (task.inputPeople || '-'));
    console.log('');
  }

  await prisma.$disconnect();
}

showTasks();
