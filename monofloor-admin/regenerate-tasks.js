const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Task sequences based on scope
const COLORS = {
  PROTECAO: '#64748b',
  LIMPEZA: '#94a3b8',
  PRIMER: '#8b5cf6',
  LILIT: '#3b82f6',
  LEONA: '#c9a962',
  STELION: '#d4af37',
  LIXAMENTO: '#6366f1',
  CURA: '#22c55e',
  VERNIZ: '#14b8a6',
  SELADOR: '#a855f7',
  VERIFICACAO: '#f97316',
};

const PISO_SEQUENCE = [
  { title: 'Proteção/Fitamento', color: COLORS.PROTECAO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Limpeza', color: COLORS.LIMPEZA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Primer Texturizado', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PISO' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PISO' },
];

const PAREDE_SEQUENCE = [
  { title: 'Proteção/Fitamento', color: COLORS.PROTECAO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Limpeza', color: COLORS.LIMPEZA, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Primer Base Água', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT + Calafetes 100%', color: COLORS.LILIT, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Lixamento Fino', color: COLORS.LIXAMENTO, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Verificação Calafetes', color: COLORS.VERIFICACAO, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Selador', color: COLORS.SELADOR, phase: 'ACABAMENTO', surface: 'PAREDE' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PAREDE' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'PAREDE' },
];

const COMBINADO_SEQUENCE = [
  { title: 'Proteção/Fitamento', color: COLORS.PROTECAO, phase: 'PREPARO', surface: 'GERAL' },
  { title: 'Limpeza', color: COLORS.LIMPEZA, phase: 'PREPARO', surface: 'GERAL' },
  { title: 'Primer Base Água', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT', color: COLORS.LILIT, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'Lixamento (girafa)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PAREDE' },
  { title: 'LILIT + Calafetes 100%', color: COLORS.LILIT, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Lixamento Fino (parede)', color: COLORS.LIXAMENTO, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Verificação Calafetes', color: COLORS.VERIFICACAO, phase: 'APLICACAO', surface: 'PAREDE' },
  { title: 'Primer Texturizado', color: COLORS.PRIMER, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento (piso)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Leona', color: COLORS.LEONA, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Lixamento (piso)', color: COLORS.LIXAMENTO, phase: 'PREPARO', surface: 'PISO' },
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Stelion', color: COLORS.STELION, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Cura Stelion', color: COLORS.CURA, isCura: true, phase: 'APLICACAO', surface: 'PISO' },
  { title: 'Selador', color: COLORS.SELADOR, phase: 'ACABAMENTO', surface: 'GERAL' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'GERAL' },
  { title: 'Verniz', color: COLORS.VERNIZ, phase: 'ACABAMENTO', surface: 'GERAL' },
];

function determineScope(m2Piso, m2Parede, m2Teto) {
  const hasPiso = (m2Piso || 0) > 0;
  const hasParede = (m2Parede || 0) > 0;
  const hasTeto = (m2Teto || 0) > 0;

  if (hasPiso && !hasParede && !hasTeto) return 'PISO';
  if (!hasPiso && (hasParede || hasTeto)) return 'PAREDE_TETO';
  return 'COMBINADO';
}

function getSequence(scope) {
  switch (scope) {
    case 'PISO': return PISO_SEQUENCE;
    case 'PAREDE_TETO': return PAREDE_SEQUENCE;
    default: return COMBINADO_SEQUENCE;
  }
}

function getWorkDays(startDate, endDate, allowSaturday, allowSunday) {
  const days = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    if ((!isSaturday && !isSunday) || (isSaturday && allowSaturday) || (isSunday && allowSunday)) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

async function regenerateTasks() {
  console.log('==============================================');
  console.log('Regenerando tarefas dos projetos importados');
  console.log('==============================================\n');

  // Buscar projetos com pipefyCardId que têm m2 configurado
  const projects = await prisma.project.findMany({
    where: {
      pipefyCardId: { not: null },
      OR: [
        { m2Piso: { gt: 0 } },
        { m2Parede: { gt: 0 } },
        { m2Teto: { gt: 0 } },
      ],
    },
    select: {
      id: true,
      pipefyCardId: true,
      title: true,
      m2Piso: true,
      m2Parede: true,
      m2Teto: true,
      startedAt: true,
      deadlineDate: true,
      estimatedDays: true,
      teamSize: true,
      allowSaturday: true,
      allowSunday: true,
      _count: { select: { tasks: true } },
    },
    take: 100, // Processa em lotes
  });

  console.log(`Encontrados ${projects.length} projetos para processar.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const project of projects) {
    // Pular se já tem tarefas
    if (project._count.tasks > 0) {
      console.log(`[SKIP] ${project.title?.substring(0, 30)} - Já tem ${project._count.tasks} tarefas`);
      skipped++;
      continue;
    }

    try {
      console.log(`[PROCESSING] ${project.title?.substring(0, 40)}`);

      const scope = determineScope(
        Number(project.m2Piso) || 0,
        Number(project.m2Parede) || 0,
        Number(project.m2Teto) || 0
      );

      const sequence = getSequence(scope);
      const startDate = project.startedAt || new Date();
      let deadlineDate;

      if (project.deadlineDate) {
        deadlineDate = new Date(project.deadlineDate);
      } else if (project.estimatedDays) {
        deadlineDate = new Date(startDate);
        let daysAdded = 0;
        while (daysAdded < project.estimatedDays) {
          deadlineDate.setDate(deadlineDate.getDate() + 1);
          const dow = deadlineDate.getDay();
          if ((dow !== 0 && dow !== 6) || (dow === 6 && project.allowSaturday) || (dow === 0 && project.allowSunday)) {
            daysAdded++;
          }
        }
      } else {
        deadlineDate = new Date(startDate);
        deadlineDate.setDate(deadlineDate.getDate() + 14);
      }

      const workDays = getWorkDays(startDate, deadlineDate, project.allowSaturday, project.allowSunday);
      const defaultTeamSize = project.teamSize || 4;

      // Distribuir tarefas
      const tasks = sequence.map((template, index) => {
        const dayIndex = workDays.length >= sequence.length
          ? Math.floor(index * workDays.length / sequence.length)
          : Math.min(Math.floor(index / Math.ceil(sequence.length / workDays.length)), workDays.length - 1);

        const taskDate = workDays[Math.min(dayIndex, workDays.length - 1)] || startDate;
        const isCuraTask = template.isCura || false;

        return {
          projectId: project.id,
          title: template.title,
          color: template.color,
          startDate: taskDate,
          endDate: taskDate,
          sortOrder: index + 1,
          phase: template.phase,
          surface: template.surface,
          inputDays: 1,
          inputPeople: isCuraTask ? 0 : defaultTeamSize,
          consumesResources: !isCuraTask,
          estimatedHours: isCuraTask ? 0 : (1 * defaultTeamSize * 7), // 7h úteis por pessoa
          groupWithNext: false,
          status: 'PENDING',
        };
      });

      await prisma.projectTask.createMany({ data: tasks });

      console.log(`  ✓ ${tasks.length} tarefas criadas (${scope})`);
      success++;
    } catch (error) {
      console.log(`  ✗ Erro: ${error.message}`);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('Tarefas regeneradas!');
  console.log(`Sucesso: ${success}`);
  console.log(`Ignorados: ${skipped}`);
  console.log(`Falha: ${failed}`);
  console.log('========================================');
}

regenerateTasks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
