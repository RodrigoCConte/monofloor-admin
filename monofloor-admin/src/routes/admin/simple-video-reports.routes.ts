import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import simpleVideoReportService from '../../services/simple-video-report.service';

const prisma = new PrismaClient();

const router = Router();

// Configurar multer para upload de vídeos
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../temp/uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de vídeo não suportado. Use MP4, MOV ou AVI.'));
        }
    }
});

/**
 * POST /api/admin/reports/simple-video
 * Processa vídeo simples (apenas áudio → texto → relatório)
 */
router.post('/simple-video', upload.single('video'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum vídeo foi enviado' });
        }

        const {
            projectName,
            technicianName,
            visitDate,
            clientName,
            address
        } = req.body;

        // Validação
        if (!projectName || !technicianName || !visitDate || !clientName || !address) {
            return res.status(400).json({
                error: 'Campos obrigatórios: projectName, technicianName, visitDate, clientName, address'
            });
        }

        console.log('[SimpleVideoRoute] Processando vídeo:', req.file.filename);
        console.log('[SimpleVideoRoute] Projeto:', projectName);

        // Gerar relatório simples
        const reportBuffer = await simpleVideoReportService.generateReport({
            videoPath: req.file.path,
            projectName,
            technicianName,
            visitDate,
            clientName,
            address
        });

        // Deletar vídeo após processamento
        try {
            await fs.unlink(req.file.path);
        } catch (error) {
            console.error('Erro ao deletar vídeo:', error);
        }

        // Retornar DOCX
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${projectName.replace(/[^a-z0-9]/gi, '_')}_${visitDate}.docx"`);
        res.send(reportBuffer);

    } catch (error: any) {
        console.error('[SimpleVideoRoute] Erro:', error);
        res.status(500).json({
            error: 'Erro ao processar vídeo',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/reports/simple-video-multiple
 * Processa múltiplos vídeos em um único relatório simples
 */
router.post('/simple-video-multiple', upload.array('videos', 10), async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    try {
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Nenhum vídeo foi enviado' });
        }

        const {
            projectName,
            technicianName,
            visitDate,
            clientName,
            address
        } = req.body;

        // Validação
        if (!projectName || !technicianName || !visitDate || !clientName || !address) {
            return res.status(400).json({
                error: 'Campos obrigatórios: projectName, technicianName, visitDate, clientName, address'
            });
        }

        console.log(`[SimpleVideoRoute] Processando ${files.length} vídeo(s)`);
        console.log('[SimpleVideoRoute] Projeto:', projectName);

        // Preparar lista de vídeos
        const videos = files.map(file => ({
            path: file.path,
            name: file.originalname
        }));

        // Gerar relatório consolidado
        const reportBuffer = await simpleVideoReportService.generateMultiVideoReport(videos, {
            projectName,
            technicianName,
            visitDate,
            clientName,
            address
        });

        // Deletar vídeos após processamento
        for (const file of files) {
            try {
                await fs.unlink(file.path);
            } catch (error) {
                console.error('Erro ao deletar vídeo:', error);
            }
        }

        // Retornar DOCX
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${projectName.replace(/[^a-z0-9]/gi, '_')}_${visitDate}.docx"`);
        res.send(reportBuffer);

    } catch (error: any) {
        console.error('[SimpleVideoRoute] Erro:', error);

        // Tentar deletar vídeos em caso de erro
        if (files) {
            for (const file of files) {
                try {
                    await fs.unlink(file.path);
                } catch (err) {
                    console.error('Erro ao deletar vídeo:', err);
                }
            }
        }

        res.status(500).json({
            error: 'Erro ao processar vídeos',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/reports/simple-video/test
 * Endpoint de teste
 */
router.get('/simple-video/test', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Sistema simplificado de vídeo está funcionando',
        timestamp: new Date().toISOString()
    });
});

// =============================================
// ENDPOINTS ASSÍNCRONOS (para evitar timeout)
// =============================================

/**
 * POST /api/admin/reports/video-job
 * Cria um job de processamento de vídeo e retorna imediatamente
 */
router.post('/video-job', upload.array('videos', 10), async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    try {
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Nenhum vídeo foi enviado' });
        }

        const {
            projectName,
            technicianName,
            visitDate,
            clientName,
            address
        } = req.body;

        // Validação
        if (!clientName || !technicianName || !visitDate || !address) {
            // Deletar arquivos enviados
            for (const file of files) {
                try { await fs.unlink(file.path); } catch {}
            }
            return res.status(400).json({
                error: 'Campos obrigatórios: clientName, technicianName, visitDate, address'
            });
        }

        console.log(`[VideoJob] Criando job para ${files.length} vídeo(s)`);

        // Criar job no banco
        const job = await prisma.videoJob.create({
            data: {
                inputFiles: files.map(f => f.filename),
                metadata: {
                    projectName: projectName || clientName,
                    technicianName,
                    visitDate,
                    clientName,
                    address
                },
                status: 'PENDING',
                progress: 0,
                currentPhase: 'queued'
            }
        });

        console.log(`[VideoJob] Job criado: ${job.id}`);

        // Retornar imediatamente com o ID do job
        res.status(202).json({
            success: true,
            jobId: job.id,
            message: 'Processamento iniciado. Use GET /video-job/:id para verificar o status.'
        });

    } catch (error: any) {
        console.error('[VideoJob] Erro ao criar job:', error);

        // Tentar deletar arquivos em caso de erro
        if (files) {
            for (const file of files) {
                try { await fs.unlink(file.path); } catch {}
            }
        }

        res.status(500).json({
            error: 'Erro ao criar job de processamento',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/reports/video-job/:id
 * Retorna o status de um job
 */
router.get('/video-job/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const job = await prisma.videoJob.findUnique({
            where: { id }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job não encontrado' });
        }

        res.json({
            id: job.id,
            status: job.status,
            progress: job.progress,
            currentPhase: job.currentPhase,
            error: job.error,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            hasOutput: !!job.outputUrl
        });

    } catch (error: any) {
        console.error('[VideoJob] Erro ao buscar job:', error);
        res.status(500).json({
            error: 'Erro ao buscar job',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/reports/video-job/:id/download
 * Baixa o arquivo de saída do job
 */
router.get('/video-job/:id/download', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const job = await prisma.videoJob.findUnique({
            where: { id }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job não encontrado' });
        }

        if (job.status !== 'COMPLETED') {
            return res.status(400).json({
                error: 'Job ainda não foi concluído',
                status: job.status,
                progress: job.progress
            });
        }

        if (!job.outputUrl) {
            return res.status(404).json({ error: 'Arquivo de saída não encontrado' });
        }

        // Caminho do arquivo
        const filePath = path.join(__dirname, '../../..', job.outputUrl);

        // Verificar se arquivo existe
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
        }

        // Ler e enviar arquivo
        const fileBuffer = await fs.readFile(filePath);
        const metadata = job.metadata as any || {};
        const clientName = metadata.clientName || 'cliente';
        const visitDate = metadata.visitDate || new Date().toISOString().split('T')[0];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${clientName.replace(/[^a-z0-9]/gi, '-')}-${visitDate}.docx"`);
        res.send(fileBuffer);

    } catch (error: any) {
        console.error('[VideoJob] Erro ao baixar arquivo:', error);
        res.status(500).json({
            error: 'Erro ao baixar arquivo',
            message: error.message
        });
    }
});

/**
 * DELETE /api/admin/reports/video-job/:id
 * Cancela/deleta um job
 */
router.delete('/video-job/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const job = await prisma.videoJob.findUnique({
            where: { id }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job não encontrado' });
        }

        // Deletar arquivo de saída se existir
        if (job.outputUrl) {
            try {
                const filePath = path.join(__dirname, '../../..', job.outputUrl);
                await fs.unlink(filePath);
            } catch {}
        }

        // Deletar arquivos de entrada
        const inputFiles = job.inputFiles as string[];
        for (const fileName of inputFiles) {
            try {
                const filePath = path.join(__dirname, '../../../temp/uploads', fileName);
                await fs.unlink(filePath);
            } catch {}
        }

        // Deletar job
        await prisma.videoJob.delete({ where: { id } });

        res.json({ success: true, message: 'Job deletado' });

    } catch (error: any) {
        console.error('[VideoJob] Erro ao deletar job:', error);
        res.status(500).json({
            error: 'Erro ao deletar job',
            message: error.message
        });
    }
});

export default router;
