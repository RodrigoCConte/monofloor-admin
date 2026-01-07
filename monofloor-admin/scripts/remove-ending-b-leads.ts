/**
 * Script para remover leads do Ending B (abaixo do escopo mínimo)
 * que foram processados antes do filtro ser implementado.
 *
 * Critério: Lead respondeu "Não" a qualquer pergunta de metragem mínima (80, 150 ou 300m²)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Field refs das perguntas de qualificação
const QUALIFYING_FIELDS = {
  ATENDE_METRAGEM_80: '0dfa0e82-8fa6-4cd0-a799-db8eb20421cb',
  ATENDE_METRAGEM_150: 'ea772a05-1343-4752-b183-5264e39e21b9',
  ATENDE_METRAGEM_300: '2bc90f3d-7d43-41d5-bdce-a880c537669f',
};

function isEndingB(answers: any[]): boolean {
  if (!answers || !Array.isArray(answers)) return false;

  for (const a of answers) {
    const ref = a.field?.ref;

    // Verificar se respondeu "Não" (boolean = false) a qualquer pergunta de metragem
    if (ref === QUALIFYING_FIELDS.ATENDE_METRAGEM_80 && a.boolean === false) {
      return true;
    }
    if (ref === QUALIFYING_FIELDS.ATENDE_METRAGEM_150 && a.boolean === false) {
      return true;
    }
    if (ref === QUALIFYING_FIELDS.ATENDE_METRAGEM_300 && a.boolean === false) {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log('🔍 Buscando leads do Typeform para verificar Ending B...\n');

  // Buscar todos os leads do Typeform
  const leads = await prisma.comercialData.findMany({
    where: {
      typeformRawData: { not: undefined },
      dealOrigin: 'form orcamento',
    },
    include: {
      project: true,
    },
  });

  console.log(`Total de leads do Typeform: ${leads.length}\n`);

  const endingBLeads: Array<{
    id: string;
    projectId: string;
    name: string;
    metragem: string | null;
    value: number | null;
  }> = [];

  for (const lead of leads) {
    const raw = lead.typeformRawData as any;
    if (!raw) continue;

    // Verificar estrutura (pode ser form_response ou direto)
    const formResponse = raw.form_response || raw;
    const answers = formResponse.answers || [];

    if (isEndingB(answers)) {
      endingBLeads.push({
        id: lead.id,
        projectId: lead.projectId,
        name: lead.personName || 'Sem nome',
        metragem: lead.metragemEstimada,
        value: lead.dealValue ? Number(lead.dealValue) : null,
      });
    }
  }

  console.log(`\n📊 Leads do Ending B encontrados: ${endingBLeads.length}\n`);

  if (endingBLeads.length === 0) {
    console.log('✅ Nenhum lead do Ending B para remover!');
    return;
  }

  console.log('Leads a serem removidos:');
  console.log('─'.repeat(80));

  for (const lead of endingBLeads) {
    const valueStr = lead.value ? `R$ ${lead.value.toLocaleString('pt-BR')}` : 'N/A';
    console.log(`  • ${lead.name} | Metragem: ${lead.metragem || 'N/A'} | Valor: ${valueStr}`);
  }

  console.log('─'.repeat(80));
  console.log(`\nTotal: ${endingBLeads.length} leads\n`);

  // Perguntar confirmação (via argumento --confirm)
  const shouldConfirm = process.argv.includes('--confirm');

  if (!shouldConfirm) {
    console.log('⚠️  Para remover estes leads, execute novamente com --confirm');
    console.log('   npx ts-node scripts/remove-ending-b-leads.ts --confirm\n');
    return;
  }

  console.log('🗑️  Removendo leads do Ending B...\n');

  let removed = 0;
  let errors = 0;

  for (const lead of endingBLeads) {
    try {
      // Remover em ordem: propostas, timeline, comercialData, project

      // 1. Remover propostas
      await prisma.proposta.deleteMany({
        where: { comercialId: lead.id },
      });

      // 2. Remover follow-ups
      await prisma.followUp.deleteMany({
        where: { comercialId: lead.id },
      });

      // 3. Remover timeline events
      await prisma.timelineEvent.deleteMany({
        where: { projectId: lead.projectId },
      });

      // 4. Remover comercialData
      await prisma.comercialData.delete({
        where: { id: lead.id },
      });

      // 5. Remover project
      await prisma.project.delete({
        where: { id: lead.projectId },
      });

      removed++;
      console.log(`  ✅ Removido: ${lead.name}`);
    } catch (error: any) {
      errors++;
      console.log(`  ❌ Erro ao remover ${lead.name}: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`📊 Resultado:`);
  console.log(`   Removidos com sucesso: ${removed}`);
  console.log(`   Erros: ${errors}`);
  console.log('═'.repeat(80) + '\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
