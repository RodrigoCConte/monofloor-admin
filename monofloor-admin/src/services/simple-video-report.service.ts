import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import docxReportService from './docx-report.service';

// Configure FFmpeg path
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

interface SimpleVideoReportOptions {
    videoPath: string;
    projectName: string;
    technicianName: string;
    visitDate: string;
    clientName: string;
    address: string;
}

export class SimpleVideoReportService {
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
     * Extrai áudio do vídeo usando FFmpeg
     */
    private extractAudio(videoPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const audioPath = path.join(this.tempDir, `audio_${Date.now()}.wav`);

            console.log('[SimpleReport] 🎵 Extraindo áudio do vídeo...');

            ffmpeg(videoPath)
                .noVideo()
                .audioCodec('pcm_s16le')
                .audioFrequency(16000)
                .audioChannels(1)
                .output(audioPath)
                .on('end', () => {
                    console.log('[SimpleReport] ✓ Áudio extraído');
                    resolve(audioPath);
                })
                .on('error', (err) => {
                    reject(new Error(`Erro ao extrair áudio: ${err.message}`));
                })
                .run();
        });
    }

    /**
     * Transcreve áudio usando OpenAI Whisper
     */
    private async transcribeAudio(audioPath: string): Promise<string> {
        console.log('[SimpleReport] 🗣️ Transcrevendo áudio com Whisper...');

        try {
            const audioFile = await fs.readFile(audioPath);
            const audioBlob = new Blob([audioFile], { type: 'audio/wav' });
            const audioFileObject = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

            const response = await openai.audio.transcriptions.create({
                file: audioFileObject,
                model: 'whisper-1',
                language: 'pt',
                response_format: 'text'
            });

            console.log('[SimpleReport] ✓ Transcrição concluída');
            console.log('[SimpleReport] Texto:', response.substring(0, 200) + '...');

            return response as string;
        } catch (error: any) {
            console.error('[SimpleReport] Erro ao transcrever:', error.message);
            throw error;
        }
    }

    /**
     * Gera relatório processando transcrição com Claude Opus 4.5 + diretrizes JUTOR
     */
    private async generateReportFromTranscription(
        transcription: string,
        options: SimpleVideoReportOptions
    ): Promise<Buffer> {
        console.log('[SimpleReport] 🤖 Processando transcrição com Claude Opus 4.5...');

        // Carregar conhecimento técnico Monofloor (JUTOR)
        const jutorKnowledge = await fs.readFile(
            '/Users/rodrigoconte/Downloads/JUTOR_PROMPT_COMPLETO (2).txt',
            'utf-8'
        );

        const prompt = `Você é um especialista técnico da Monofloor Revestimentos.

TRANSCRIÇÃO DA VISTORIA (áudio do técnico em campo):
${transcription}

CONHECIMENTO TÉCNICO MONOFLOOR:
${jutorKnowledge}

TAREFA:
Transforme essa transcrição em um relatório técnico profissional seguindo as diretrizes Monofloor.

ESTRUTURA DO RELATÓRIO:
Organize as observações por TÓPICOS técnicos (ex: "Banheiros", "Rodapés", "Cerâmicas", "Carpete", "Impermeabilização", "Ralos", "Escadas", etc.)

Para cada tópico identificado na transcrição, escreva um parágrafo técnico detalhado descrevendo:
- Condições encontradas no substrato
- Problemas identificados
- Requisitos técnicos necessários (ex: resistência de 20 MPa, cura de contrapiso, nivelamento)
- Recomendações de preparação

ESTILO DE ESCRITA (siga as diretrizes JUTOR):
- Técnico e profissional, mas acessível
- Parágrafos corridos (NÃO use bullet points)
- Use terminologia técnica: "resistência à compressão", "substrato", "aderência", "nivelamento", "regularização"
- Seja específico e detalhado
- Mencione medidas e especificações quando o técnico mencionar
- Tom confiante mas não arrogante
- Linguagem clara e objetiva

IMPORTANTE:
- Use APENAS informações que estão na transcrição
- Se o técnico mencionou um problema, descreva tecnicamente
- Se mencionou medidas (cm, m², MPa), inclua no relatório
- Mantenha fidelidade ao que foi observado em campo
- NÃO invente informações que não foram mencionadas

Responda com JSON puro (sem markdown):
{
  "topics": [
    {
      "topic": "Nome do Tópico",
      "description": "Parágrafo técnico detalhado sobre este tópico, seguindo o estilo Monofloor..."
    }
  ]
}`;

        try {
            console.log('[SimpleReport] Enviando para Claude Opus 4.5...');

            const response = await anthropic.messages.create({
                model: 'claude-opus-4-5-20251101',
                max_tokens: 4000,
                temperature: 0.3,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].type === 'text'
                ? response.content[0].text
                : '{"topics": []}';

            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            let parsed: { topics: Array<{ topic: string; description: string }> };

            try {
                parsed = JSON.parse(cleanContent);
            } catch (error) {
                console.error('[SimpleReport] Erro ao parsear JSON, usando transcrição pura');
                parsed = {
                    topics: [{
                        topic: 'Relatório de Vistoria Técnica',
                        description: transcription
                    }]
                };
            }

            console.log(`[SimpleReport] ✓ ${parsed.topics.length} tópicos identificados por Claude Opus 4.5`);

            // DEBUG: Mostrar os tópicos
            parsed.topics.forEach((topic, i) => {
                console.log(`[SimpleReport] Tópico ${i + 1}: ${topic.topic}`);
                console.log(`[SimpleReport] Descrição preview: ${topic.description.substring(0, 100)}...`);
            });

            // Gerar DOCX
            return this.generateSimpleDocx(parsed.topics, options);

        } catch (error: any) {
            console.error('[SimpleReport] Erro ao processar com Claude:', error.message);

            // Fallback: usar transcrição direta
            console.log('[SimpleReport] Usando transcrição direta como fallback');
            return this.generateSimpleDocx([{
                topic: 'Relatório de Vistoria Técnica',
                description: transcription
            }], options);
        }
    }

    /**
     * Gera DOCX simples sem imagens
     */
    private async generateSimpleDocx(
        topics: Array<{ topic: string; description: string }>,
        options: SimpleVideoReportOptions
    ): Promise<Buffer> {
        console.log('[SimpleReport] 📄 Gerando DOCX...');

        const topicGroups = topics.map(topic => ({
            topic: topic.topic,
            description: topic.description,
            frameAnalyses: [] // Sem imagens
        }));

        return docxReportService.generateDocxReport({
            projectName: options.projectName,
            technicianName: options.technicianName,
            visitDate: options.visitDate,
            clientName: options.clientName,
            address: options.address,
            topicGroups
        });
    }

    /**
     * Método principal - processa vídeo e gera relatório simples
     */
    async generateReport(options: SimpleVideoReportOptions): Promise<Buffer> {
        console.log('[SimpleReport] ========================================');
        console.log('[SimpleReport] RELATÓRIO SIMPLES - ÁUDIO → TEXTO');
        console.log('[SimpleReport] ========================================');
        console.log('[SimpleReport] Vídeo:', options.videoPath);
        console.log('[SimpleReport] Projeto:', options.projectName);

        let audioPath: string | null = null;

        try {
            // 1. Extrair áudio
            audioPath = await this.extractAudio(options.videoPath);

            // 2. Transcrever
            const transcription = await this.transcribeAudio(audioPath);

            // 3. Gerar relatório
            const reportBuffer = await this.generateReportFromTranscription(transcription, options);

            // 4. Limpar áudio temporário
            if (audioPath) {
                try {
                    await fs.unlink(audioPath);
                    console.log('[SimpleReport] ✓ Áudio temporário removido');
                } catch (error) {
                    console.error('[SimpleReport] Erro ao remover áudio:', error);
                }
            }

            console.log('[SimpleReport] ========================================');
            console.log('[SimpleReport] ✅ RELATÓRIO CONCLUÍDO!');
            console.log('[SimpleReport] ========================================');

            return reportBuffer;

        } catch (error) {
            console.error('[SimpleReport] ❌ ERRO:', error);

            // Limpar áudio em caso de erro
            if (audioPath) {
                try {
                    await fs.unlink(audioPath);
                } catch (err) {
                    // Ignorar
                }
            }

            throw error;
        }
    }

    /**
     * Processa múltiplos vídeos em um único relatório
     */
    async generateMultiVideoReport(
        videos: Array<{ path: string; name: string }>,
        options: Omit<SimpleVideoReportOptions, 'videoPath'>
    ): Promise<Buffer> {
        console.log(`[SimpleReport] Processando ${videos.length} vídeos...`);

        const allTranscriptions: string[] = [];

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            console.log(`\n[SimpleReport] 📹 Vídeo ${i + 1}/${videos.length}: ${video.name}`);

            let audioPath: string | null = null;

            try {
                // Extrair e transcrever
                audioPath = await this.extractAudio(video.path);
                const transcription = await this.transcribeAudio(audioPath);

                allTranscriptions.push(`\n=== VÍDEO ${i + 1}: ${video.name} ===\n${transcription}`);

                // Limpar áudio
                if (audioPath) {
                    await fs.unlink(audioPath);
                }
            } catch (error: any) {
                console.error(`[SimpleReport] Erro ao processar vídeo ${i + 1}:`, error.message);
            }
        }

        // Combinar todas as transcrições
        const combinedTranscription = allTranscriptions.join('\n\n');

        console.log(`\n[SimpleReport] ✓ Todas as transcrições combinadas`);

        // Gerar relatório consolidado
        return this.generateReportFromTranscription(combinedTranscription, {
            ...options,
            videoPath: '' // Não usado neste caso
        });
    }
}

export default new SimpleVideoReportService();
