/**
 * Mescla leads duplicados do Typeform nos leads existentes
 * e exclui as duplicatas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('MESCLAGEM DE DUPLICATAS');
  console.log('='.repeat(60));

  // Buscar todos os leads do Typeform (pipelineId: null)
  const typeformLeads = await prisma.comercialData.findMany({
    where: {
      typeformResponseId: { not: null },
      pipelineId: null
    }
  });

  console.log(`\nLeads do Typeform com pipelineId null: ${typeformLeads.length}`);

  let merged = 0;
  let updated = 0;
  let errors = 0;

  for (const tfLead of typeformLeads) {
    try {
      // Buscar lead existente com mesmo email OU telefone
      let existingLead = null;

      if (tfLead.personEmail) {
        existingLead = await prisma.comercialData.findFirst({
          where: {
            personEmail: tfLead.personEmail,
            id: { not: tfLead.id },
            pipelineId: 1
          }
        });
      }

      if (!existingLead && tfLead.personPhone) {
        existingLead = await prisma.comercialData.findFirst({
          where: {
            personPhone: tfLead.personPhone,
            id: { not: tfLead.id },
            pipelineId: 1
          }
        });
      }

      if (existingLead) {
        // Mesclar: copiar dados do Typeform para o lead existente (apenas campos vazios)
        const updateData = {};

        const fieldsToMerge = [
          'tipoCliente', 'nomeEscritorio', 'cidadeExecucao', 'cidadeExecucaoDesc',
          'metragemEstimadaN1', 'metragemEstimada', 'descritivoArea',
          'budgetEstimado', 'dataPrevistaExec', 'estadoObra', 'resumo',
          'primeiroNomeZapi', 'telefoneZapi'
        ];

        for (const field of fieldsToMerge) {
          if (!existingLead[field] && tfLead[field]) {
            updateData[field] = tfLead[field];
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.comercialData.update({
            where: { id: existingLead.id },
            data: updateData
          });
        }

        // Excluir lead duplicado do Typeform
        const projectId = tfLead.projectId;

        await prisma.comercialData.delete({ where: { id: tfLead.id } });

        // Excluir projeto órfão se houver
        if (projectId) {
          await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
        }

        merged++;
        if (merged <= 10) {
          console.log(`  ✓ Mesclado: ${tfLead.personName} → ${existingLead.personName}`);
        }
      } else {
        // Não tem duplicata - apenas atualizar pipelineId para aparecer no CRM
        await prisma.comercialData.update({
          where: { id: tfLead.id },
          data: { pipelineId: 1, dealStatus: 'open' }
        });
        updated++;
        if (updated <= 5) {
          console.log(`  ✓ Atualizado pipelineId: ${tfLead.personName}`);
        }
      }
    } catch (err) {
      console.error(`  ✗ Erro em ${tfLead.personName}:`, err.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO:');
  console.log('='.repeat(60));
  console.log(`  Duplicatas mescladas e excluídas: ${merged}`);
  console.log(`  Leads atualizados (pipelineId): ${updated}`);
  console.log(`  Erros: ${errors}`);

  // Contagem final
  const totalFinal = await prisma.comercialData.count();
  const openFinal = await prisma.comercialData.count({ where: { dealStatus: 'open' } });

  console.log(`\n  Total de leads após: ${totalFinal}`);
  console.log(`  Leads open (aparecem no CRM): ${openFinal}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
