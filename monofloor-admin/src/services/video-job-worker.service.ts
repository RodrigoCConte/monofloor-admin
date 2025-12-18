import { PrismaClient } from '@prisma/client';
import { SimpleVideoReportService } from './simple-video-report.service';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();
const simpleVideoService = new SimpleVideoReportService();

// Intervalo de verificação de jobs (5 segundos)
const POLL_INTERVAL = 5000;

// Flag para evitar processamento simultâneo
let isProcessing = false;

/**
 * Worker que processa jobs de vídeo em background
 */
export class VideoJobWorker {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Inicia o worker
   */
  start() {
    console.log('🎬 Video Job Worker started');
    this.intervalId = setInterval(() => this.processNextJob(), POLL_INTERVAL);
  }

  /**
   * Para o worker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Video Job Worker stopped');
    }
  }

  /**
   * Processa o próximo job pendente
   */
  private async processNextJob() {
    // Evitar processamento simultâneo
    if (isProcessing) return;

    try {
      // Buscar próximo job pendente
      const job = await prisma.videoJob.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) return;

      isProcessing = true;
      console.log(`🎬 Processing job ${job.id}`);

      // Marcar como processando
      await prisma.videoJob.update({
        where: { id: job.id },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          currentPhase: 'starting',
          progress: 5,
        },
      });

      // Processar o job
      await this.executeJob(job);

    } catch (error) {
      console.error('❌ Error in job worker:', error);
    } finally {
      isProcessing = false;
    }
  }

  /**
   * Executa o processamento de um job
   */
  private async executeJob(job: any) {
    const tempDir = path.join(__dirname, '../../temp');
    const outputDir = path.join(__dirname, '../../temp/outputs');
    let outputPath: string | null = null;

    try {
      // Garantir que o diretório de saída existe
      await fs.mkdir(outputDir, { recursive: true });

      // Atualizar progresso: extraindo áudio
      await this.updateProgress(job.id, 10, 'extracting');

      const inputFiles = job.inputFiles as string[];
      const metadata = job.metadata as any || {};

      // Preparar dados para o serviço
      const videoPaths = inputFiles.map((f: string) => path.join(tempDir, 'uploads', f));

      // Verificar se os arquivos existem
      for (const videoPath of videoPaths) {
        try {
          await fs.access(videoPath);
        } catch {
          throw new Error(`Arquivo de vídeo não encontrado: ${videoPath}`);
        }
      }

      // Atualizar progresso: transcrevendo
      await this.updateProgress(job.id, 30, 'transcribing');

      // Processar vídeos
      let result: Buffer;

      if (videoPaths.length === 1) {
        // Processar um único vídeo
        result = await this.processWithProgress(
          job.id,
          () => simpleVideoService.generateReport({
            videoPath: videoPaths[0],
            projectName: metadata.projectName || metadata.clientName || 'Projeto',
            technicianName: metadata.technicianName || 'Técnico',
            visitDate: metadata.visitDate || new Date().toISOString().split('T')[0],
            clientName: metadata.clientName,
            address: metadata.address,
          })
        );
      } else {
        // Processar múltiplos vídeos
        const videos = videoPaths.map((p: string) => ({ path: p, name: path.basename(p) }));
        result = await this.processWithProgress(
          job.id,
          () => simpleVideoService.generateMultiVideoReport(videos, {
            projectName: metadata.projectName || metadata.clientName || 'Projeto',
            technicianName: metadata.technicianName || 'Técnico',
            visitDate: metadata.visitDate || new Date().toISOString().split('T')[0],
            clientName: metadata.clientName,
            address: metadata.address,
          })
        );
      }

      // Atualizar progresso: salvando
      await this.updateProgress(job.id, 90, 'saving');

      // Salvar arquivo de saída
      const outputFileName = `report-${job.id}.docx`;
      outputPath = path.join(outputDir, outputFileName);
      await fs.writeFile(outputPath, result);

      // Marcar como completo
      await prisma.videoJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          currentPhase: 'completed',
          completedAt: new Date(),
          outputUrl: `/temp/outputs/${outputFileName}`,
          outputType: 'docx',
        },
      });

      console.log(`✅ Job ${job.id} completed successfully`);

      // Limpar arquivos de entrada após sucesso
      await this.cleanupInputFiles(inputFiles, tempDir);

    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Marcar como falho
      await prisma.videoJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Erro desconhecido',
          currentPhase: 'failed',
          completedAt: new Date(),
        },
      });

      // Limpar arquivos de entrada mesmo em caso de erro
      const inputFiles = job.inputFiles as string[];
      await this.cleanupInputFiles(inputFiles, tempDir);
    }
  }

  /**
   * Processa com atualização de progresso simulada
   */
  private async processWithProgress(jobId: string, processor: () => Promise<Buffer>): Promise<Buffer> {
    // Simular progresso durante o processamento
    const progressInterval = setInterval(async () => {
      const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
      if (job && job.progress < 85) {
        await prisma.videoJob.update({
          where: { id: jobId },
          data: { progress: job.progress + 5 },
        });
      }
    }, 10000); // Incrementar a cada 10 segundos

    try {
      const result = await processor();
      return result;
    } finally {
      clearInterval(progressInterval);
    }
  }

  /**
   * Atualiza o progresso do job
   */
  private async updateProgress(jobId: string, progress: number, phase: string) {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { progress, currentPhase: phase },
    });
  }

  /**
   * Limpa arquivos de entrada após processamento
   */
  private async cleanupInputFiles(inputFiles: string[], tempDir: string) {
    for (const fileName of inputFiles) {
      try {
        const filePath = path.join(tempDir, 'uploads', fileName);
        await fs.unlink(filePath);
        console.log(`🗑️ Cleaned up: ${fileName}`);
      } catch (error) {
        // Ignorar erros de limpeza
        console.warn(`⚠️ Could not clean up: ${fileName}`);
      }
    }
  }
}

// Singleton do worker
export const videoJobWorker = new VideoJobWorker();

/**
 * Limpa jobs antigos e arquivos temporários
 * Chamado periodicamente para evitar acúmulo
 */
export async function cleanupOldJobs() {
  const tempDir = path.join(__dirname, '../../temp');
  const outputDir = path.join(tempDir, 'outputs');
  const uploadsDir = path.join(tempDir, 'uploads');

  try {
    // Deletar jobs com mais de 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldJobs = await prisma.videoJob.findMany({
      where: {
        createdAt: { lt: oneDayAgo },
        status: { in: ['COMPLETED', 'FAILED'] },
      },
    });

    for (const job of oldJobs) {
      // Deletar arquivo de saída se existir
      if (job.outputUrl) {
        try {
          const outputPath = path.join(__dirname, '../..', job.outputUrl);
          await fs.unlink(outputPath);
        } catch {
          // Ignorar
        }
      }

      // Deletar job do banco
      await prisma.videoJob.delete({ where: { id: job.id } });
    }

    if (oldJobs.length > 0) {
      console.log(`🗑️ Cleaned up ${oldJobs.length} old jobs`);
    }

    // Limpar arquivos órfãos com mais de 2 horas
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    for (const dir of [outputDir, uploadsDir]) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = await fs.stat(filePath);
          if (stat.mtimeMs < twoHoursAgo) {
            await fs.unlink(filePath);
            console.log(`🗑️ Cleaned orphan file: ${file}`);
          }
        }
      } catch {
        // Diretório pode não existir
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up old jobs:', error);
  }
}
