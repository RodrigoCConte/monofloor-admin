import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface VideoReportOptions {
    videoPath: string;
    projectName: string;
    technicianName: string;
    visitDate: string;
    visitPurpose: string;
    observations?: string;
    frameInterval?: number; // segundos
    maxFrames?: number;
    analysisPrompt?: string;
}

interface ExtractedFrame {
    path: string;
    timestamp: number;
    buffer: Buffer;
}

interface FrameAnalysis {
    frame: ExtractedFrame;
    analysis: string;
}

export class VideoReportService {
    private tempDir = path.join(__dirname, '../../temp');

    constructor() {
        this.ensureTempDir();
    }

    private async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Erro ao criar diretório temp:', error);
        }
    }

    /**
     * Processa vídeo e gera relatório PDF
     */
    async generateReport(options: VideoReportOptions): Promise<Buffer> {
        const {
            videoPath,
            projectName,
            technicianName,
            visitDate,
            visitPurpose,
            observations = '',
            frameInterval = 10,
            maxFrames = 30,
            analysisPrompt = 'Analise esta imagem de obra. Descreva o que vê, identifique problemas, medições visíveis, qualidade da aplicação e próximos passos necessários.'
        } = options;

        console.log('[VideoReport] Iniciando processamento...');
        console.log('[VideoReport] Vídeo:', videoPath);
        console.log('[VideoReport] Projeto:', projectName);

        try {
            // 1. Extrair frames do vídeo
            console.log('[VideoReport] Extraindo frames...');
            const frames = await this.extractFrames(videoPath, frameInterval, maxFrames);
            console.log(`[VideoReport] ${frames.length} frames extraídos`);

            // 2. Analisar cada frame com GPT-4 Vision
            console.log('[VideoReport] Analisando frames com IA...');
            const analyses = await this.analyzeFrames(frames, analysisPrompt);
            console.log(`[VideoReport] ${analyses.length} frames analisados`);

            // 3. Gerar PDF
            console.log('[VideoReport] Gerando PDF...');
            const pdfBuffer = await this.generatePDF({
                projectName,
                technicianName,
                visitDate,
                visitPurpose,
                observations,
                analyses
            });

            // 4. Limpar arquivos temporários
            await this.cleanupFrames(frames);

            console.log('[VideoReport] Relatório gerado com sucesso!');
            return pdfBuffer;

        } catch (error) {
            console.error('[VideoReport] Erro:', error);
            throw error;
        }
    }

    /**
     * Extrai frames do vídeo usando FFmpeg
     */
    private extractFrames(
        videoPath: string,
        intervalSeconds: number,
        maxFrames: number
    ): Promise<ExtractedFrame[]> {
        return new Promise((resolve, reject) => {
            const frames: ExtractedFrame[] = [];
            const outputPattern = path.join(this.tempDir, `frame_%04d.jpg`);

            ffmpeg(videoPath)
                .on('end', async () => {
                    try {
                        // Ler arquivos gerados
                        const files = await fs.readdir(this.tempDir);
                        const frameFiles = files
                            .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
                            .sort()
                            .slice(0, maxFrames);

                        // Carregar buffers
                        for (let i = 0; i < frameFiles.length; i++) {
                            const framePath = path.join(this.tempDir, frameFiles[i]);
                            const buffer = await fs.readFile(framePath);

                            frames.push({
                                path: framePath,
                                timestamp: i * intervalSeconds,
                                buffer
                            });
                        }

                        resolve(frames);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    reject(new Error(`Erro ao extrair frames: ${err.message}`));
                })
                .screenshots({
                    folder: this.tempDir,
                    filename: 'frame_%04d.jpg',
                    timestamps: Array.from({ length: maxFrames }, (_, i) => i * intervalSeconds)
                });
        });
    }

    /**
     * Analisa frames usando GPT-4 Vision
     */
    private async analyzeFrames(
        frames: ExtractedFrame[],
        prompt: string
    ): Promise<FrameAnalysis[]> {
        const analyses: FrameAnalysis[] = [];

        // Processar em lotes de 5 para não sobrecarregar a API
        const batchSize = 5;
        for (let i = 0; i < frames.length; i += batchSize) {
            const batch = frames.slice(i, i + batchSize);

            const batchPromises = batch.map(async (frame) => {
                try {
                    // Converter para base64
                    const base64Image = frame.buffer.toString('base64');

                    const response = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
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
                        max_tokens: 500
                    });

                    const analysis = response.choices[0]?.message?.content || 'Não foi possível analisar esta imagem.';

                    return {
                        frame,
                        analysis
                    };
                } catch (error: any) {
                    console.error(`Erro ao analisar frame ${frame.timestamp}s:`, error.message);
                    return {
                        frame,
                        analysis: 'Erro ao processar esta imagem.'
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            analyses.push(...batchResults);

            // Aguardar um pouco entre lotes para respeitar rate limits
            if (i + batchSize < frames.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return analyses;
    }

    /**
     * Gera PDF com imagens e análises
     */
    private generatePDF(data: {
        projectName: string;
        technicianName: string;
        visitDate: string;
        visitPurpose: string;
        observations: string;
        analyses: FrameAnalysis[];
    }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Cabeçalho
            doc.fontSize(24)
                .fillColor('#c9a962')
                .text('RELATÓRIO DE VISITA TÉCNICA', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(14)
                .fillColor('#666666')
                .text('Monofloor Revestimentos', { align: 'center' });

            doc.moveDown(1.5);

            // Informações do projeto
            doc.fontSize(12).fillColor('#000000');

            const addField = (label: string, value: string) => {
                doc.font('Helvetica-Bold').text(label, { continued: true });
                doc.font('Helvetica').text(` ${value}`);
            };

            addField('Projeto:', data.projectName);
            addField('Técnico:', data.technicianName);
            addField('Data da Visita:', new Date(data.visitDate).toLocaleDateString('pt-BR'));
            addField('Objetivo:', this.getVisitPurposeLabel(data.visitPurpose));

            if (data.observations) {
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').text('Observações Gerais:');
                doc.font('Helvetica').text(data.observations);
            }

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
            doc.moveDown(1);

            // Análises com imagens
            data.analyses.forEach((item, index) => {
                // Verificar se precisa de nova página
                if (doc.y > 600) {
                    doc.addPage();
                }

                // Timestamp
                doc.fontSize(14)
                    .fillColor('#c9a962')
                    .font('Helvetica-Bold')
                    .text(`${index + 1}. Análise aos ${this.formatTimestamp(item.frame.timestamp)}`);

                doc.moveDown(0.5);

                // Imagem
                try {
                    const imageWidth = 500;
                    const imageHeight = 280;

                    doc.image(item.frame.buffer, {
                        fit: [imageWidth, imageHeight],
                        align: 'center'
                    });

                    doc.moveDown(0.5);
                } catch (error) {
                    console.error('Erro ao adicionar imagem ao PDF:', error);
                }

                // Análise
                doc.fontSize(11)
                    .fillColor('#000000')
                    .font('Helvetica')
                    .text(item.analysis, {
                        align: 'justify'
                    });

                doc.moveDown(1);

                // Linha divisória
                if (index < data.analyses.length - 1) {
                    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#eeeeee');
                    doc.moveDown(1);
                }
            });

            // Rodapé final
            doc.addPage();
            doc.fontSize(12).fillColor('#666666');
            doc.text('Fim do Relatório', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
            doc.text('Monofloor Revestimentos - Sistema de Relatórios Automáticos', { align: 'center' });

            doc.end();
        });
    }

    /**
     * Limpa frames temporários
     */
    private async cleanupFrames(frames: ExtractedFrame[]) {
        for (const frame of frames) {
            try {
                await fs.unlink(frame.path);
            } catch (error) {
                console.error('Erro ao deletar frame:', error);
            }
        }
    }

    /**
     * Formata timestamp para MM:SS
     */
    private formatTimestamp(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Retorna label do objetivo da visita
     */
    private getVisitPurposeLabel(purpose: string): string {
        const labels: Record<string, string> = {
            vistoria: 'Vistoria Inicial',
            acompanhamento: 'Acompanhamento de Obra',
            problema: 'Identificação de Problema',
            finalização: 'Vistoria de Finalização',
            manutencao: 'Manutenção',
            outro: 'Outro'
        };
        return labels[purpose] || purpose;
    }
}

export default new VideoReportService();
