import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import simpleVideoReportService from '../../services/simple-video-report.service';

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

export default router;
