import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import videoReportService from '../../services/video-report.service';

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
 * POST /api/admin/reports/video-process
 * Processa vídeo e gera relatório PDF
 */
router.post('/video-process', upload.single('video'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum vídeo foi enviado' });
        }

        const {
            projectName,
            technicianName,
            visitDate,
            visitPurpose,
            observations,
            frameInterval,
            maxFrames,
            analysisPrompt
        } = req.body;

        // Validação
        if (!projectName || !technicianName || !visitDate) {
            return res.status(400).json({
                error: 'Campos obrigatórios: projectName, technicianName, visitDate'
            });
        }

        console.log('[VideoReportRoute] Processando vídeo:', req.file.filename);
        console.log('[VideoReportRoute] Projeto:', projectName);

        // Gerar relatório
        const pdfBuffer = await videoReportService.generateReport({
            videoPath: req.file.path,
            projectName,
            technicianName,
            visitDate,
            visitPurpose: visitPurpose || 'vistoria',
            observations,
            frameInterval: frameInterval ? parseInt(frameInterval) : 10,
            maxFrames: maxFrames ? parseInt(maxFrames) : 30,
            analysisPrompt
        });

        // Deletar vídeo após processamento
        try {
            await fs.unlink(req.file.path);
        } catch (error) {
            console.error('Erro ao deletar vídeo:', error);
        }

        // Retornar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${projectName.replace(/[^a-z0-9]/gi, '_')}_${visitDate}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('[VideoReportRoute] Erro:', error);
        res.status(500).json({
            error: 'Erro ao processar vídeo',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/reports/video-process/test
 * Endpoint de teste
 */
router.get('/video-process/test', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Endpoint de processamento de vídeo está funcionando',
        timestamp: new Date().toISOString()
    });
});

export default router;
