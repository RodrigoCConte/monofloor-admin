/**
 * Cleanup Recordings Job
 *
 * Remove session recordings expiradas (mais de 1 semana).
 * Este job pode ser executado:
 *   1. Via Railway Cron: https://docs.railway.com/reference/cron-jobs
 *   2. Via endpoint DELETE /api/proposals/recordings/cleanup
 *   3. Diretamente via: npx ts-node src/jobs/cleanup-recordings.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredRecordings() {
  console.log('🧹 Iniciando limpeza de gravações expiradas...');
  console.log(`📅 Data atual: ${new Date().toISOString()}`);

  try {
    // Buscar quantas gravações serão removidas
    const expiredCount = await prisma.sessionRecording.count({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    console.log(`📊 Gravações expiradas encontradas: ${expiredCount}`);

    if (expiredCount === 0) {
      console.log('✅ Nenhuma gravação expirada para remover.');
      return { success: true, deleted: 0 };
    }

    // Remover gravações expiradas
    const result = await prisma.sessionRecording.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    console.log(`✅ Limpeza concluída! ${result.count} gravações removidas.`);
    return { success: true, deleted: result.count };

  } catch (error) {
    console.error('❌ Erro ao limpar recordings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupExpiredRecordings()
    .then((result) => {
      console.log('🎉 Job finalizado:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no job:', error);
      process.exit(1);
    });
}

export { cleanupExpiredRecordings };
