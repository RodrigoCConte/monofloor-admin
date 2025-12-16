import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import videoReportService from '../../services/video-report.service';
import docxReportService from '../../services/docx-report.service';

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
            analysisPrompt,
            outputFormat,
            clientName,
            address
        } = req.body;

        // Validação
        if (!projectName || !technicianName || !visitDate) {
            return res.status(400).json({
                error: 'Campos obrigatórios: projectName, technicianName, visitDate'
            });
        }

        const format = outputFormat || 'pdf';

        console.log('[VideoReportRoute] Processando vídeo:', req.file.filename);
        console.log('[VideoReportRoute] Projeto:', projectName);
        console.log('[VideoReportRoute] Formato:', format);

        // Gerar relatório
        const reportBuffer = await videoReportService.generateReport({
            videoPath: req.file.path,
            projectName,
            technicianName,
            visitDate,
            visitPurpose: visitPurpose || 'vistoria',
            observations,
            frameInterval: frameInterval ? parseInt(frameInterval) : 10,
            maxFrames: maxFrames ? parseInt(maxFrames) : 30,
            analysisPrompt,
            outputFormat: format,
            clientName,
            address
        });

        // Deletar vídeo após processamento
        try {
            await fs.unlink(req.file.path);
        } catch (error) {
            console.error('Erro ao deletar vídeo:', error);
        }

        // Retornar arquivo no formato escolhido
        const fileExtension = format === 'docx' ? 'docx' : 'pdf';
        const contentType = format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${projectName.replace(/[^a-z0-9]/gi, '_')}_${visitDate}.${fileExtension}"`);
        res.send(reportBuffer);

    } catch (error: any) {
        console.error('[VideoReportRoute] Erro:', error);
        res.status(500).json({
            error: 'Erro ao processar vídeo',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/reports/video-process-multiple
 * Processa múltiplos vídeos e gera um único relatório PDF consolidado
 */
router.post('/video-process-multiple', upload.array('videos', 10), async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    try {
        if (!files || files.length === 0) {
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
            analysisPrompt,
            outputFormat,
            clientName,
            address
        } = req.body;

        // Validação
        if (!projectName || !technicianName || !visitDate) {
            return res.status(400).json({
                error: 'Campos obrigatórios: projectName, technicianName, visitDate'
            });
        }

        const format = outputFormat || 'pdf';

        console.log(`[VideoReportRoute] Processando ${files.length} vídeo(s)`);
        console.log('[VideoReportRoute] Projeto:', projectName);
        console.log('[VideoReportRoute] Formato:', format);

        // Processar todos os vídeos com AUDIO-FIRST
        console.log(`[VideoReportRoute] ========================================`);
        console.log(`[VideoReportRoute] PROCESSAMENTO AUDIO-FIRST DE ${files.length} VÍDEOS`);
        console.log(`[VideoReportRoute] ========================================`);

        const allTopicGroups: any[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`\n[VideoReportRoute] 📹 Vídeo ${i + 1}/${files.length}: ${file.originalname}`);

            try {
                // Usar o método generateReport para cada vídeo individualmente
                // Isso retorna um Buffer do relatório, mas queremos os topic groups
                // Então vamos chamar os métodos internos diretamente

                // Extrair áudio
                const audioPath = await videoReportService['extractAudio'](file.path);

                // Transcrever
                const transcriptionSegments = await videoReportService['transcribeAudio'](audioPath);
                console.log(`[VideoReportRoute] ✓ ${transcriptionSegments.length} segmentos transcritos`);

                // Analisar transcrição
                const audioTopics = await videoReportService['analyzeTranscription'](transcriptionSegments);
                console.log(`[VideoReportRoute] ✓ ${audioTopics.length} tópicos identificados`);

                // Processar cada tópico
                for (const audioTopic of audioTopics) {
                    // Extrair frames nos timestamps
                    const frames = await videoReportService['extractFramesAtTimestamps'](
                        file.path,
                        audioTopic.timestamps
                    );

                    if (frames.length === 0) {
                        console.warn(`[VideoReportRoute] Nenhum frame extraído para: ${audioTopic.topic}`);
                        continue;
                    }

                    // Analisar frames com correlação de áudio
                    const frameAnalyses: any[] = [];

                    for (const frame of frames) {
                        const base64Image = frame.buffer.toString('base64');

                        const technicalPrompt = `Você é um especialista técnico da Monofloor Revestimentos analisando uma imagem de vistoria.

O TÉCNICO DISSE: "${audioTopic.narration}"

TAREFA:
Analise esta imagem e CONFIRME/DETALHE o que o técnico narrou. Descreva tecnicamente o que você vê que corresponde à narração.

FOCO:
- Condições do substrato (concreto, cerâmica, nivelamento, trincas)
- Problemas identificados (umidade, desníveis, fissuras, rejuntes deteriorados)
- Medições ou detalhes técnicos visíveis
- Requisitos técnicos necessários (resistência, preparação, produtos)

ESTILO: Técnico, formal, objetivo. Use termos como "resistência à compressão", "substrato", "aderência", "nivelamento".

Responda em 3-5 linhas de texto corrido sem símbolos ou markdown.`;

                        try {
                            const openai = require('openai');
                            const client = new openai.default({
                                apiKey: process.env.OPENAI_API_KEY
                            });

                            const response = await client.chat.completions.create({
                                model: 'gpt-4o',
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            { type: 'text', text: technicalPrompt },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: `data:image/jpeg;base64,${base64Image}`,
                                                    detail: 'high'
                                                }
                                            }
                                        ]
                                    }
                                ],
                                max_tokens: 300,
                                temperature: 0.4
                            });

                            const analysis = response.choices[0]?.message?.content || 'Não foi possível analisar esta imagem.';

                            frameAnalyses.push({
                                frame,
                                analysis
                            });
                        } catch (error: any) {
                            console.error(`[VideoReportRoute] Erro ao analisar frame:`, error.message);
                        }

                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    // Adicionar topic group
                    allTopicGroups.push({
                        topic: audioTopic.topic,
                        description: audioTopic.description,
                        frameAnalyses
                    });

                    // NÃO limpar frames aqui - serão limpos depois da geração do relatório
                }

                // Limpar áudio
                try {
                    await fs.unlink(audioPath);
                } catch (error) {
                    console.error('[VideoReportRoute] Erro ao deletar áudio:', error);
                }

                // Deletar vídeo
                try {
                    await fs.unlink(file.path);
                } catch (error) {
                    console.error('[VideoReportRoute] Erro ao deletar vídeo:', error);
                }

            } catch (error: any) {
                console.error(`[VideoReportRoute] Erro ao processar vídeo ${i + 1}:`, error.message);
            }
        }

        console.log(`\n[VideoReportRoute] ✓ Total: ${allTopicGroups.length} tópicos de ${files.length} vídeos`);

        // DEBUG: Verificar se os arquivos de frame existem
        console.log('\n[VideoReportRoute] 🔍 Verificando frames antes de gerar DOCX...');
        for (const group of allTopicGroups) {
            if (group.frameAnalyses) {
                for (const fa of group.frameAnalyses) {
                    try {
                        await fs.access(fa.frame.path);
                        console.log(`[VideoReportRoute] ✓ Frame existe: ${fa.frame.path}`);
                    } catch (error) {
                        console.error(`[VideoReportRoute] ❌ Frame NÃO existe: ${fa.frame.path}`);
                    }
                }
            }
        }

        // Gerar relatório consolidado (PDF ou DOCX)
        const reportBuffer = format === 'docx'
            ? await docxReportService.generateDocxReport({
                projectName,
                technicianName,
                visitDate,
                clientName: clientName || projectName,
                address: address || '',
                topicGroups: allTopicGroups
            })
            : await videoReportService['generateMonofloorPDF']({
                projectName,
                technicianName,
                visitDate,
                visitPurpose: visitPurpose || 'vistoria',
                observations,
                topicGroups: allTopicGroups
            });

        // Limpar frames temporários DEPOIS de gerar o relatório
        console.log('\n[VideoReportRoute] 🧹 Limpando frames temporários...');
        for (const topicGroup of allTopicGroups) {
            if (topicGroup.frameAnalyses) {
                await videoReportService['cleanupFrames'](
                    topicGroup.frameAnalyses.map((fa: any) => fa.frame)
                );
            }
        }
        console.log('[VideoReportRoute] ✓ Frames temporários removidos');

        // Retornar arquivo no formato escolhido
        const fileExtension = format === 'docx' ? 'docx' : 'pdf';
        const contentType = format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${projectName.replace(/[^a-z0-9]/gi, '_')}_${visitDate}.${fileExtension}"`);
        res.send(reportBuffer);

    } catch (error: any) {
        console.error('[VideoReportRoute] Erro:', error);

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
