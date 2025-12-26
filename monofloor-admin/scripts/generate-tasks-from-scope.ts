/**
 * Script para gerar etapas sugeridas baseado nos escopos dos projetos
 * Executa: npx ts-node scripts/generate-tasks-from-scope.ts
 */

import prisma from '../src/lib/prisma';

// Constantes para cálculo de horas estimadas
const HOURS_PER_M2_PISO = 0.5;        // 0.5h por m² de piso
const HOURS_PER_M2_PAREDE = 0.6;      // 0.6h por m² de parede (mais difícil)
const HOURS_PER_M2_TETO = 0.8;        // 0.8h por m² de teto (mais difícil)
const HOURS_PER_M_RODAPE = 0.1;       // 0.1h por metro linear de rodapé
const HOURS_PREPARACAO = 4;           // 4h fixas para preparação
const HOURS_LIMPEZA = 2;              // 2h fixas para limpeza
const HOURS_NIVELAMENTO_PER_M2 = 0.2; // 0.2h por m² para nivelamento
const HOURS_LIXAMENTO_PER_M2 = 0.15;  // 0.15h por m² para lixamento
const HOURS_SELADOR_PER_M2 = 0.1;     // 0.1h por m² para selador
const HOURS_CURA = 24;                // 24h para cura

interface TaskTemplate {
  title: string;
  description: string;
  taskType: string;
  phase: string;
  surface: string;
  estimatedHours: number;
  sortOrder: number;
  consumesResources: boolean;
  inputDays?: number;
  inputPeople?: number;
}

function generateTasksForProject(project: any): TaskTemplate[] {
  const tasks: TaskTemplate[] = [];
  let sortOrder = 1;

  const m2Piso = Number(project.m2Piso) || 0;
  const m2Parede = Number(project.m2Parede) || 0;
  const m2Teto = Number(project.m2Teto) || 0;
  const mRodape = Number(project.mRodape) || 0;
  const m2Total = m2Piso + m2Parede + m2Teto;

  // Materiais
  const materials = (project.material || '').toLowerCase();
  const hasStelion = materials.includes('stelion');
  const hasLilit = materials.includes('lilit');
  const hasPiscina = materials.includes('piscina');

  // Detalhamento
  const detalhamento = (project.detalhamento || '').toLowerCase();
  const especiais = (project.especiais || '').toLowerCase();

  // ========================================
  // FASE 1: PREPARO
  // ========================================

  // 1. Limpeza Inicial
  tasks.push({
    title: 'Limpeza Inicial do Local',
    description: 'Limpeza e remoção de resíduos antes do início dos trabalhos',
    taskType: 'LIMPEZA_INICIAL',
    phase: 'PREPARO',
    surface: 'GERAL',
    estimatedHours: HOURS_LIMPEZA,
    sortOrder: sortOrder++,
    consumesResources: true,
    inputDays: 1,
    inputPeople: 2,
  });

  // 2. Preparação/Nivelamento
  if (m2Piso > 0) {
    const nivelamentoHours = Math.max(4, m2Piso * HOURS_NIVELAMENTO_PER_M2);
    tasks.push({
      title: 'Nivelamento e Preparação do Piso',
      description: `Preparação do substrato para ${m2Piso.toFixed(1)} m² de piso`,
      taskType: 'NIVELAMENTO',
      phase: 'PREPARO',
      surface: 'PISO',
      estimatedHours: nivelamentoHours,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(nivelamentoHours / 8),
      inputPeople: 2,
    });
  }

  if (m2Parede > 0) {
    const prepParede = Math.max(2, m2Parede * 0.15);
    tasks.push({
      title: 'Preparação das Paredes',
      description: `Preparação de ${m2Parede.toFixed(1)} m² de parede para aplicação`,
      taskType: 'PREPARACAO',
      phase: 'PREPARO',
      surface: 'PAREDE',
      estimatedHours: prepParede,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(prepParede / 8),
      inputPeople: 2,
    });
  }

  // ========================================
  // FASE 2: APLICAÇÃO
  // ========================================

  // Aplicação de Piso
  if (m2Piso > 0) {
    const horasPiso = m2Piso * HOURS_PER_M2_PISO;
    const materialPiso = hasStelion ? 'Stelion' : hasLilit ? 'Lilit' : 'Material padrão';

    tasks.push({
      title: `Aplicação de Piso - ${materialPiso}`,
      description: `Aplicação de ${m2Piso.toFixed(1)} m² de piso com ${materialPiso}`,
      taskType: 'APLICACAO_PISO',
      phase: 'APLICACAO',
      surface: 'PISO',
      estimatedHours: horasPiso,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(horasPiso / 8),
      inputPeople: 3,
    });
  }

  // Aplicação de Parede
  if (m2Parede > 0) {
    const horasParede = m2Parede * HOURS_PER_M2_PAREDE;
    const materialParede = hasLilit ? 'Lilit' : hasStelion ? 'Stelion' : 'Material padrão';

    tasks.push({
      title: `Aplicação de Parede - ${materialParede}`,
      description: `Aplicação de ${m2Parede.toFixed(1)} m² de parede com ${materialParede}`,
      taskType: 'APLICACAO_PAREDE',
      phase: 'APLICACAO',
      surface: 'PAREDE',
      estimatedHours: horasParede,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(horasParede / 8),
      inputPeople: 3,
    });
  }

  // Aplicação de Teto
  if (m2Teto > 0) {
    const horasTeto = m2Teto * HOURS_PER_M2_TETO;

    tasks.push({
      title: 'Aplicação de Teto/Forro',
      description: `Aplicação de ${m2Teto.toFixed(1)} m² de teto`,
      taskType: 'APLICACAO_TETO',
      phase: 'APLICACAO',
      surface: 'PAREDE', // Teto usa mesma categoria de parede
      estimatedHours: horasTeto,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(horasTeto / 8),
      inputPeople: 3,
    });
  }

  // Rodapé
  if (mRodape > 0) {
    const horasRodape = mRodape * HOURS_PER_M_RODAPE;

    tasks.push({
      title: 'Aplicação de Rodapé',
      description: `Aplicação de ${mRodape.toFixed(1)} metros lineares de rodapé`,
      taskType: 'RODAPE',
      phase: 'APLICACAO',
      surface: 'GERAL',
      estimatedHours: Math.max(2, horasRodape),
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(horasRodape / 8) || 1,
      inputPeople: 2,
    });
  }

  // ========================================
  // ESPECIAIS (Piscina, Bancadas, etc.)
  // ========================================

  if (hasPiscina || especiais.includes('piscina')) {
    // Extrair metragem da piscina se disponível
    let piscinaInfo = 'Aplicação em área de piscina';

    if (especiais.includes('piscina')) {
      const match = especiais.match(/piscina[^,]*/i);
      if (match) {
        piscinaInfo = match[0];
      }
    }

    tasks.push({
      title: 'Aplicação em Piscina',
      description: piscinaInfo,
      taskType: 'CUSTOM',
      phase: 'APLICACAO',
      surface: 'GERAL',
      estimatedHours: 16, // Estimativa para piscina
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: 2,
      inputPeople: 3,
    });
  }

  // Bancadas (se mencionado no detalhamento)
  if (detalhamento.includes('bancada')) {
    const bancadaMatch = detalhamento.match(/bancada[:\s]*([0-9.,]+)\s*m/i);
    const bancadaMetros = bancadaMatch ? parseFloat(bancadaMatch[1].replace(',', '.')) : 5;

    tasks.push({
      title: 'Aplicação em Bancadas',
      description: `Aplicação em bancadas - ${bancadaMetros.toFixed(1)} metros lineares`,
      taskType: 'CUSTOM',
      phase: 'APLICACAO',
      surface: 'GERAL',
      estimatedHours: bancadaMetros * 0.5,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: 1,
      inputPeople: 2,
    });
  }

  // Nichos (se mencionado)
  if (detalhamento.includes('nicho')) {
    tasks.push({
      title: 'Aplicação em Nichos',
      description: 'Aplicação em nichos e detalhes',
      taskType: 'CUSTOM',
      phase: 'APLICACAO',
      surface: 'PAREDE',
      estimatedHours: 4,
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: 1,
      inputPeople: 2,
    });
  }

  // ========================================
  // FASE 3: ACABAMENTO
  // ========================================

  // Cura (tempo de secagem - não consome recursos)
  tasks.push({
    title: 'Tempo de Cura',
    description: 'Período de cura e secagem do material aplicado',
    taskType: 'CURA',
    phase: 'ACABAMENTO',
    surface: 'GERAL',
    estimatedHours: HOURS_CURA,
    sortOrder: sortOrder++,
    consumesResources: false, // Não precisa de pessoas
    inputDays: 1,
    inputPeople: 0,
  });

  // Lixamento
  if (m2Total > 0) {
    const horasLixamento = m2Total * HOURS_LIXAMENTO_PER_M2;

    tasks.push({
      title: 'Lixamento',
      description: `Lixamento de ${m2Total.toFixed(1)} m² de superfície aplicada`,
      taskType: 'LIXAMENTO',
      phase: 'ACABAMENTO',
      surface: 'GERAL',
      estimatedHours: Math.max(4, horasLixamento),
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(horasLixamento / 8) || 1,
      inputPeople: 2,
    });
  }

  // Selador
  if (m2Total > 0) {
    const horasSelador = m2Total * HOURS_SELADOR_PER_M2;

    tasks.push({
      title: 'Aplicação de Selador',
      description: `Aplicação de selador em ${m2Total.toFixed(1)} m²`,
      taskType: 'SELADOR',
      phase: 'ACABAMENTO',
      surface: 'GERAL',
      estimatedHours: Math.max(2, horasSelador),
      sortOrder: sortOrder++,
      consumesResources: true,
      inputDays: Math.ceil(horasSelador / 8) || 1,
      inputPeople: 2,
    });
  }

  // Limpeza Final
  tasks.push({
    title: 'Limpeza Final e Entrega',
    description: 'Limpeza final do local e preparação para entrega',
    taskType: 'CUSTOM',
    phase: 'ACABAMENTO',
    surface: 'GERAL',
    estimatedHours: HOURS_LIMPEZA,
    sortOrder: sortOrder++,
    consumesResources: true,
    inputDays: 1,
    inputPeople: 2,
  });

  return tasks;
}

async function main() {
  console.log('='.repeat(60));
  console.log('GERAÇÃO DE ETAPAS BASEADO NOS ESCOPOS');
  console.log('='.repeat(60));

  // Buscar projetos no módulo EXECUCAO
  const projects = await prisma.project.findMany({
    where: { currentModule: 'EXECUCAO' },
    include: {
      tasks: { select: { id: true } }, // Para verificar se já tem tarefas
    },
  });

  console.log(`\nProjetos encontrados: ${projects.length}`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const project of projects) {
    // Pular se já tem tarefas
    if (project.tasks.length > 0) {
      console.log(`⏭️  ${project.title.substring(0, 40)} - já possui ${project.tasks.length} tarefas`);
      skipped++;
      continue;
    }

    // Verificar se tem escopo mínimo
    const m2Total = Number(project.m2Piso) + Number(project.m2Parede) + Number(project.m2Teto);
    if (m2Total === 0 && Number(project.mRodape) === 0) {
      console.log(`⏭️  ${project.title.substring(0, 40)} - sem metragem definida`);
      skipped++;
      continue;
    }

    try {
      const tasksToCreate = generateTasksForProject(project);

      // Criar as tarefas no banco
      for (const task of tasksToCreate) {
        await prisma.projectTask.create({
          data: {
            projectId: project.id,
            title: task.title,
            description: task.description,
            taskType: task.taskType as any,
            phase: task.phase as any,
            surface: task.surface as any,
            estimatedHours: task.estimatedHours,
            sortOrder: task.sortOrder,
            consumesResources: task.consumesResources,
            inputDays: task.inputDays,
            inputPeople: task.inputPeople,
            status: 'PENDING',
            progress: 0,
          },
        });
      }

      console.log(`✅ ${project.title.substring(0, 40)} - ${tasksToCreate.length} etapas criadas`);
      created++;
    } catch (error: any) {
      console.log(`❌ ${project.title.substring(0, 40)} - Erro: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO');
  console.log('='.repeat(60));
  console.log(`✅ Projetos com etapas geradas: ${created}`);
  console.log(`⏭️  Projetos ignorados: ${skipped}`);
  console.log(`❌ Erros: ${errors}`);

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
