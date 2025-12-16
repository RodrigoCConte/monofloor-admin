import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import OpenAI from 'openai';
import docxReportService from './docx-report.service';

// Configure FFmpeg path
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);

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
    outputFormat?: 'pdf' | 'docx'; // Formato de saída
    clientName?: string; // Para DOCX
    address?: string; // Para DOCX
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

interface TopicGroup {
    topic: string;
    description: string;
    frameAnalyses: FrameAnalysis[];
}

interface TranscriptionSegment {
    text: string;
    start: number; // timestamp em segundos
    end: number;
}

interface AudioTopicTimestamp {
    topic: string;
    description: string;
    timestamps: number[]; // momentos específicos para extrair frames
    narration: string; // o que foi dito sobre este tópico
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
     * Extrai áudio do vídeo usando FFmpeg
     * Retorna o caminho para o arquivo de áudio WAV
     */
    private extractAudio(videoPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const audioPath = path.join(this.tempDir, `audio_${Date.now()}.wav`);

            console.log('[VideoReport] Extraindo áudio do vídeo...');

            ffmpeg(videoPath)
                .noVideo()
                .audioCodec('pcm_s16le')
                .audioFrequency(16000) // Whisper funciona melhor com 16kHz
                .audioChannels(1) // Mono
                .output(audioPath)
                .on('end', () => {
                    console.log('[VideoReport] ✓ Áudio extraído:', audioPath);
                    resolve(audioPath);
                })
                .on('error', (err) => {
                    reject(new Error(`Erro ao extrair áudio: ${err.message}`));
                })
                .run();
        });
    }

    /**
     * Transcreve áudio usando OpenAI Whisper com timestamps
     */
    private async transcribeAudio(audioPath: string): Promise<TranscriptionSegment[]> {
        console.log('[VideoReport] Transcrevendo áudio com Whisper...');

        try {
            const audioFile = await fs.readFile(audioPath);
            const audioBlob = new Blob([audioFile], { type: 'audio/wav' });

            // Criar File object do Blob
            const audioFileObject = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

            const response = await openai.audio.transcriptions.create({
                file: audioFileObject,
                model: 'whisper-1',
                language: 'pt',
                response_format: 'verbose_json',
                timestamp_granularities: ['segment']
            });

            console.log('[VideoReport] ✓ Transcrição concluída');
            console.log('[VideoReport] Texto completo:', response.text);

            // Converter response.segments para TranscriptionSegment[]
            const segments: TranscriptionSegment[] = (response.segments || []).map((seg: any) => ({
                text: seg.text,
                start: seg.start,
                end: seg.end
            }));

            console.log(`[VideoReport] ${segments.length} segmentos identificados`);

            return segments;
        } catch (error: any) {
            console.error('[VideoReport] Erro ao transcrever áudio:', error.message);
            throw error;
        }
    }

    /**
     * Analisa a transcrição e identifica tópicos mencionados com seus timestamps
     */
    private async analyzeTranscription(segments: TranscriptionSegment[]): Promise<AudioTopicTimestamp[]> {
        console.log('[VideoReport] Analisando transcrição para identificar tópicos...');

        const fullTranscription = segments.map((seg, i) => {
            return `[${this.formatTimestamp(seg.start)} - ${this.formatTimestamp(seg.end)}]: ${seg.text}`;
        }).join('\n');

        console.log('[VideoReport] Transcrição completa:\n', fullTranscription);

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: `Você é um especialista em análise de relatórios técnicos da Monofloor Revestimentos.

Analise esta transcrição de áudio de uma vistoria técnica e identifique os TÓPICOS mencionados pelo técnico.

TRANSCRIÇÃO COM TIMESTAMPS:
${fullTranscription}

TAREFA:
1. Identifique os principais TÓPICOS técnicos mencionados (ex: "Banheiros", "Cerâmicas", "Rodapés", "Impermeabilização", etc.)
2. Para cada tópico, identifique os timestamps EXATOS (em segundos) onde o técnico menciona ou aponta problemas
3. Extraia a narração relevante (o que foi dito sobre cada tópico)
4. Crie uma descrição técnica do problema mencionado

REGRAS CRÍTICAS:
- Cada tópico deve ter pelo menos 1 timestamp, máximo 5 timestamps
- Use APENAS timestamps que aparecem na transcrição acima (ex: se vê [00:15 - 00:23], use 15 ou 23)
- NUNCA invente timestamps que não existem na transcrição
- O timestamp máximo é o último que aparece na transcrição
- Foque em momentos onde o técnico aponta problemas, medições ou condições importantes
- Se o técnico mencionar "aqui", "esse", "esta área", identifique o timestamp exato desse segmento

Responda APENAS com JSON puro (sem markdown, sem símbolos extras):
{
  "topics": [
    {
      "topic": "Nome do Tópico",
      "description": "Descrição técnica do problema",
      "timestamps": [10.5, 25.3, 40.1],
      "narration": "O que foi dito sobre este tópico"
    }
  ]
}`
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            });

            const content = response.choices[0]?.message?.content || '{"topics": []}';

            // Remover markdown code blocks se existirem
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            let parsed: { topics: AudioTopicTimestamp[] };

            try {
                parsed = JSON.parse(cleanContent);
            } catch (error) {
                console.error('[VideoReport] Erro ao parsear JSON da análise de transcrição');
                console.error('[VideoReport] Conteúdo recebido:', cleanContent);

                // Fallback: criar um tópico genérico com todos os timestamps
                const allTimestamps = segments.map(seg => seg.start);
                parsed = {
                    topics: [{
                        topic: 'Análise Geral',
                        description: 'Condições gerais encontradas durante a visita',
                        timestamps: allTimestamps.slice(0, 10), // Pegar primeiros 10 timestamps
                        narration: segments.map(seg => seg.text).join(' ')
                    }]
                };
            }

            console.log(`[VideoReport] ${parsed.topics.length} tópicos identificados da narração:`);
            parsed.topics.forEach(topic => {
                console.log(`  - ${topic.topic} (${topic.timestamps.length} momentos identificados)`);
            });

            return parsed.topics;
        } catch (error: any) {
            console.error('[VideoReport] Erro ao analisar transcrição:', error.message);
            throw error;
        }
    }

    /**
     * Extrai frames específicos em timestamps determinados
     */
    private async extractFramesAtTimestamps(
        videoPath: string,
        timestamps: number[]
    ): Promise<ExtractedFrame[]> {
        console.log(`[VideoReport] Extraindo ${timestamps.length} frames em timestamps específicos...`);

        const frames: ExtractedFrame[] = [];

        for (let i = 0; i < timestamps.length; i++) {
            const timestamp = timestamps[i];
            const uniqueId = `${Date.now()}_${i}`;
            const filename = `frame_${uniqueId}.jpg`;
            const framePath = path.join(this.tempDir, filename);

            try {
                // Usar seekInput e frames(1) para extrair um único frame
                await new Promise<void>((resolve, reject) => {
                    ffmpeg(videoPath)
                        .seekInput(timestamp)
                        .frames(1)
                        .output(framePath)
                        .on('end', () => resolve())
                        .on('error', (err) => reject(err))
                        .run();
                });

                // Aguardar um pouco para garantir que o arquivo foi escrito
                await new Promise(resolve => setTimeout(resolve, 200));

                // Verificar se o arquivo existe antes de ler
                try {
                    await fs.access(framePath);
                } catch (error) {
                    throw new Error(`Frame file not found: ${framePath}`);
                }

                const buffer = await fs.readFile(framePath);

                frames.push({
                    path: framePath,
                    timestamp: timestamp,
                    buffer
                });

                console.log(`[VideoReport] ✓ Frame extraído em ${this.formatTimestamp(timestamp)} -> ${filename}`);
            } catch (error: any) {
                console.error(`[VideoReport] Erro ao extrair frame em ${timestamp}s:`, error.message);
            }
        }

        return frames;
    }

    /**
     * Processa vídeo e gera relatório (PDF ou DOCX) com ANÁLISE AUDIO-FIRST
     */
    async generateReport(options: VideoReportOptions): Promise<Buffer> {
        const {
            videoPath,
            projectName,
            technicianName,
            visitDate,
            visitPurpose,
            observations = '',
            analysisPrompt,
            outputFormat = 'pdf',
            clientName,
            address
        } = options;

        console.log('[VideoReport] ========================================');
        console.log('[VideoReport] SISTEMA AUDIO-FIRST (NOVA ARQUITETURA)');
        console.log('[VideoReport] ========================================');
        console.log('[VideoReport] Vídeo:', videoPath);
        console.log('[VideoReport] Projeto:', projectName);
        console.log('[VideoReport] Formato:', outputFormat.toUpperCase());

        let audioPath: string | null = null;

        try {
            // FASE 1: Extrair áudio do vídeo
            console.log('\n[VideoReport] 🎵 Fase 1: Extração de áudio...');
            audioPath = await this.extractAudio(videoPath);

            // FASE 2: Transcrever áudio com timestamps
            console.log('\n[VideoReport] 🗣️ Fase 2: Transcrição com Whisper...');
            const transcriptionSegments = await this.transcribeAudio(audioPath);
            console.log(`[VideoReport] ✓ ${transcriptionSegments.length} segmentos transcritos`);

            // FASE 3: Analisar transcrição e identificar tópicos com timestamps
            console.log('\n[VideoReport] 🔍 Fase 3: Identificando tópicos da narração...');
            const audioTopics = await this.analyzeTranscription(transcriptionSegments);
            console.log(`[VideoReport] ✓ ${audioTopics.length} tópicos identificados`);

            // FASE 4: Extrair frames nos momentos mencionados
            console.log('\n[VideoReport] 🎬 Fase 4: Extraindo frames nos momentos mencionados...');
            const topicGroups: TopicGroup[] = [];

            for (const audioTopic of audioTopics) {
                console.log(`[VideoReport] Processando tópico: ${audioTopic.topic}`);

                // Extrair frames nos timestamps identificados
                const frames = await this.extractFramesAtTimestamps(videoPath, audioTopic.timestamps);

                if (frames.length === 0) {
                    console.warn(`[VideoReport] Nenhum frame extraído para tópico: ${audioTopic.topic}`);
                    continue;
                }

                // FASE 5: Analisar frames correlacionando com o áudio
                console.log(`[VideoReport] Analisando ${frames.length} frames com correlação de áudio...`);
                const frameAnalyses: FrameAnalysis[] = [];

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
                        const response = await openai.chat.completions.create({
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

                        console.log(`[VideoReport] ✓ Frame ${this.formatTimestamp(frame.timestamp)} analisado`);
                    } catch (error: any) {
                        console.error(`[VideoReport] Erro ao analisar frame ${frame.timestamp}s:`, error.message);
                    }

                    // Aguardar entre análises
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                topicGroups.push({
                    topic: audioTopic.topic,
                    description: audioTopic.description,
                    frameAnalyses
                });
            }

            console.log(`[VideoReport] ✓ ${topicGroups.length} tópicos processados com frames`);

            // FASE 6: Gerar relatório no formato escolhido
            let reportBuffer: Buffer;

            if (outputFormat === 'docx') {
                console.log('\n[VideoReport] 📄 Fase 6: Gerando DOCX Monofloor...');
                reportBuffer = await docxReportService.generateDocxReport({
                    projectName,
                    technicianName,
                    visitDate,
                    clientName: clientName || projectName,
                    address: address || '',
                    topicGroups
                });
                console.log('[VideoReport] ✓ DOCX gerado com sucesso');
            } else {
                console.log('\n[VideoReport] 📄 Fase 6: Gerando PDF Monofloor...');
                reportBuffer = await this.generateMonofloorPDF({
                    projectName,
                    technicianName,
                    visitDate,
                    visitPurpose,
                    observations,
                    topicGroups
                });
                console.log('[VideoReport] ✓ PDF gerado com sucesso');
            }

            // FASE 7: Limpar arquivos temporários
            console.log('\n[VideoReport] 🧹 Fase 7: Limpando arquivos temporários...');
            for (const topicGroup of topicGroups) {
                await this.cleanupFrames(topicGroup.frameAnalyses.map(fa => fa.frame));
            }

            if (audioPath) {
                try {
                    await fs.unlink(audioPath);
                    console.log('[VideoReport] ✓ Áudio temporário removido');
                } catch (error) {
                    console.error('[VideoReport] Erro ao remover áudio:', error);
                }
            }

            console.log('[VideoReport] ========================================');
            console.log('[VideoReport] ✅ RELATÓRIO CONCLUÍDO COM SUCESSO!');
            console.log('[VideoReport] ========================================\n');

            return reportBuffer;

        } catch (error) {
            console.error('[VideoReport] ❌ ERRO:', error);

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
     * Extrai frames do vídeo usando FFmpeg com seleção inteligente
     * Primeiro extrai muitos frames, depois usa AI para selecionar os relevantes
     */
    private async extractFrames(
        videoPath: string,
        intervalSeconds: number,
        maxFrames: number
    ): Promise<ExtractedFrame[]> {
        console.log('[VideoReport] Fase 1: Extraindo frames candidatos...');

        // Extrair frames a cada 3 segundos (mais denso para não perder momentos importantes)
        const candidateInterval = 3;
        const candidateFrames = await this.extractAllFrames(videoPath, candidateInterval);

        console.log(`[VideoReport] ${candidateFrames.length} frames candidatos extraídos`);

        // Fase 2: Seleção inteligente dos frames mais relevantes
        console.log('[VideoReport] Fase 2: Selecionando frames relevantes com IA...');
        const selectedFrames = await this.selectRelevantFrames(candidateFrames, maxFrames);

        // Limpar frames não selecionados
        const selectedPaths = new Set(selectedFrames.map(f => f.path));
        for (const frame of candidateFrames) {
            if (!selectedPaths.has(frame.path)) {
                try {
                    await fs.unlink(frame.path);
                } catch (error) {
                    // Ignorar erros ao deletar
                }
            }
        }

        console.log(`[VideoReport] ${selectedFrames.length} frames relevantes selecionados`);
        return selectedFrames;
    }

    /**
     * Extrai todos os frames em um intervalo fixo
     */
    private extractAllFrames(
        videoPath: string,
        intervalSeconds: number
    ): Promise<ExtractedFrame[]> {
        return new Promise((resolve, reject) => {
            const frames: ExtractedFrame[] = [];
            const maxCandidates = 100; // Limite de frames candidatos

            ffmpeg(videoPath)
                .on('end', async () => {
                    try {
                        // Ler arquivos gerados
                        const files = await fs.readdir(this.tempDir);
                        const frameFiles = files
                            .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
                            .sort()
                            .slice(0, maxCandidates);

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
                    timestamps: Array.from({ length: maxCandidates }, (_, i) => i * intervalSeconds)
                });
        });
    }

    /**
     * Seleciona frames relevantes usando GPT-4 Vision
     * Critérios: mudanças de cena, problemas visíveis, gestos indicando pontos importantes
     */
    private async selectRelevantFrames(
        candidateFrames: ExtractedFrame[],
        maxFrames: number
    ): Promise<ExtractedFrame[]> {
        const relevanceScores: Array<{ frame: ExtractedFrame; score: number; reason: string }> = [];

        // Avaliar relevância em lotes de 5
        const batchSize = 5;
        for (let i = 0; i < candidateFrames.length; i += batchSize) {
            const batch = candidateFrames.slice(i, i + batchSize);

            const batchPromises = batch.map(async (frame) => {
                try {
                    const base64Image = frame.buffer.toString('base64');

                    const response = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: `Analise esta imagem de obra e avalie sua RELEVÂNCIA para um relatório técnico de visita.

Atribua uma nota de 0 a 10, onde:
- 10 = Extremamente relevante (problemas graves, condições ruins, aplicação incorreta, medições visíveis, detalhes técnicos importantes)
- 7-9 = Muito relevante (áreas com problemas menores, preparação de substrato, aplicação em andamento)
- 4-6 = Moderadamente relevante (áreas em bom estado, visão geral do ambiente)
- 1-3 = Pouco relevante (imagens borradas, transições, movimentos, nada técnico)
- 0 = Irrelevante (totalmente borrada, sem informação técnica)

Responda APENAS com um JSON no formato:
{"score": X, "reason": "breve explicação técnica"}

Foque em: problemas estruturais, condições do substrato, qualidade de aplicação, medições, áreas problemáticas.`
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:image/jpeg;base64,${base64Image}`,
                                            detail: 'low' // Usar low para economizar tokens
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 100,
                        temperature: 0.3 // Baixa temperatura para respostas consistentes
                    });

                    const content = response.choices[0]?.message?.content || '{"score": 0, "reason": "Erro"}';

                    try {
                        const parsed = JSON.parse(content);
                        return {
                            frame,
                            score: parsed.score || 0,
                            reason: parsed.reason || 'Sem motivo'
                        };
                    } catch {
                        // Se não conseguir parsear JSON, tentar extrair score do texto
                        const scoreMatch = content.match(/score["\s:]+(\d+)/i);
                        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
                        return {
                            frame,
                            score,
                            reason: content.substring(0, 100)
                        };
                    }
                } catch (error: any) {
                    console.error(`Erro ao avaliar frame ${frame.timestamp}s:`, error.message);
                    return {
                        frame,
                        score: 0,
                        reason: 'Erro na avaliação'
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            relevanceScores.push(...batchResults);

            // Aguardar entre lotes
            if (i + batchSize < candidateFrames.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Ordenar por score e pegar os top N
        const topFrames = relevanceScores
            .sort((a, b) => b.score - a.score)
            .slice(0, maxFrames)
            .sort((a, b) => a.frame.timestamp - b.frame.timestamp); // Reordenar por timestamp

        console.log('[VideoReport] Frames selecionados:');
        topFrames.forEach(({ frame, score, reason }) => {
            console.log(`  - ${this.formatTimestamp(frame.timestamp)} | Score: ${score}/10 | ${reason}`);
        });

        return topFrames.map(item => item.frame);
    }

    /**
     * Analisa frames usando GPT-4 Vision com prompt técnico e focado em problemas
     */
    private async analyzeFrames(
        frames: ExtractedFrame[],
        prompt?: string
    ): Promise<FrameAnalysis[]> {
        const analyses: FrameAnalysis[] = [];

        const technicalPrompt = prompt || `Você é um especialista técnico da Monofloor Revestimentos, analisando condições de obra para aplicação de piso monolítico STELION.

Analise esta imagem de forma TÉCNICA e OBJETIVA:

1. **Identifique o ambiente** (ex: banheiro, cozinha, sala, área externa)
2. **Condições do substrato**: tipo de base (concreto, cerâmica, etc.), umidade, nivelamento, trincas
3. **Problemas identificados**: desníveis, fissuras, manchas de umidade, cerâmicas soltas, rejuntes deteriorados
4. **Requisitos técnicos**: resistência necessária (ex: 20 MPa), preparação necessária, produtos indicados
5. **Observações importantes**: medições visíveis, detalhes críticos, áreas que precisam atenção especial

**Estilo de escrita**: Formal, técnico, direto. Use termos como "resistência à compressão", "substrato", "aderência", "nivelamento".

Responda em 3-5 linhas de texto técnico corrido.`;

        // Processar em lotes de 5
        const batchSize = 5;
        for (let i = 0; i < frames.length; i += batchSize) {
            const batch = frames.slice(i, i + batchSize);

            const batchPromises = batch.map(async (frame) => {
                try {
                    const base64Image = frame.buffer.toString('base64');

                    const response = await openai.chat.completions.create({
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
                        temperature: 0.4 // Pouca criatividade, mais técnico
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

            // Aguardar entre lotes
            if (i + batchSize < frames.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return analyses;
    }

    /**
     * Agrupa análises de frames por tópicos semânticos
     * Usa GPT-4 para identificar temas comuns e agrupar frames relacionados
     */
    private async groupFramesByTopics(analyses: FrameAnalysis[]): Promise<TopicGroup[]> {
        console.log('[VideoReport] Fase 3: Agrupando frames por tópicos semânticos...');

        // Criar resumo de todas as análises para enviar ao GPT
        const analysesText = analyses.map((item, index) => {
            return `[Frame ${index + 1} - ${this.formatTimestamp(item.frame.timestamp)}]: ${item.analysis}`;
        }).join('\n\n');

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: `Você é um especialista técnico da Monofloor Revestimentos, organizando um relatório de visita técnica.

Analise estas ${analyses.length} observações de frames de vídeo e agrupe-as em TÓPICOS TÉCNICOS.

OBSERVAÇÕES:
${analysesText}

TAREFA:
1. Identifique os principais TÓPICOS técnicos abordados (ex: "Banheiros", "Condições das Cerâmicas", "Área Externa", "Problemas Estruturais", etc.)
2. Para cada tópico, liste os números dos frames que pertencem a ele
3. Crie uma descrição técnica curta (1-2 linhas) para cada tópico

REGRAS:
- Mínimo de 2 tópicos, máximo de 6 tópicos
- Um frame pode pertencer a apenas UM tópico (escolha o mais relevante)
- Use nomenclatura técnica e profissional
- Ordene por ordem lógica de inspeção (entrada → ambientes internos → problemas específicos)

Responda APENAS com um JSON no formato:
{
  "topics": [
    {
      "topic": "Nome do Tópico",
      "description": "Breve descrição técnica",
      "frameNumbers": [1, 3, 5]
    }
  ]
}

IMPORTANTE: Todos os ${analyses.length} frames devem ser distribuídos entre os tópicos.`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            const content = response.choices[0]?.message?.content || '{"topics": []}';

            let parsed: { topics: Array<{ topic: string; description: string; frameNumbers: number[] }> };

            try {
                // Tentar extrair JSON do conteúdo
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Nenhum JSON encontrado');
                }
            } catch (error) {
                console.error('[VideoReport] Erro ao parsear agrupamento, usando agrupamento padrão');
                // Fallback: criar um único tópico com todos os frames
                parsed = {
                    topics: [{
                        topic: 'Análise Geral da Obra',
                        description: 'Condições gerais encontradas durante a visita técnica',
                        frameNumbers: analyses.map((_, i) => i + 1)
                    }]
                };
            }

            // Converter frameNumbers em frameAnalyses
            const topicGroups: TopicGroup[] = parsed.topics.map(topicData => {
                const frameAnalyses = topicData.frameNumbers
                    .map(num => analyses[num - 1])
                    .filter(Boolean); // Remover undefined

                return {
                    topic: topicData.topic,
                    description: topicData.description,
                    frameAnalyses
                };
            }).filter(group => group.frameAnalyses.length > 0); // Remover grupos vazios

            console.log(`[VideoReport] ${topicGroups.length} tópicos identificados:`);
            topicGroups.forEach(group => {
                console.log(`  - ${group.topic} (${group.frameAnalyses.length} frames)`);
            });

            return topicGroups;

        } catch (error: any) {
            console.error('[VideoReport] Erro ao agrupar por tópicos:', error.message);

            // Fallback: retornar todas as análises em um único grupo
            return [{
                topic: 'Análise Geral da Obra',
                description: 'Condições gerais encontradas durante a visita técnica',
                frameAnalyses: analyses
            }];
        }
    }

    /**
     * Gera PDF no estilo Monofloor com tópicos semânticos
     */
    private generateMonofloorPDF(data: {
        projectName: string;
        technicianName: string;
        visitDate: string;
        visitPurpose: string;
        observations: string;
        topicGroups: TopicGroup[];
    }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 80, left: 50, right: 50 }
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Cores Monofloor
            const colors = {
                gold: '#c9a962',
                gray: '#E5E5E5',
                darkGray: '#666666',
                black: '#000000'
            };

            let pageNumber = 1;

            // Função para adicionar rodapé com paleta de cores e número de página
            const addFooter = () => {
                // Paleta de cores no rodapé
                const paletteY = 770;
                const colorWidth = 115;
                const paletteColors = ['#1a1a1a', '#c9a962', '#8b7355', '#d4af6a', '#333333'];

                paletteColors.forEach((color, i) => {
                    doc.rect(50 + (i * colorWidth), paletteY, colorWidth, 15)
                        .fill(color);
                });

                // Número da página (caixa)
                doc.rect(520, paletteY, 25, 15)
                    .fill('#FFFFFF')
                    .stroke('#000000');

                doc.fontSize(9)
                    .fillColor('#000000')
                    .text(pageNumber.toString(), 520, paletteY + 3, {
                        width: 25,
                        align: 'center'
                    });

                pageNumber++;
            };

            // Função para criar nova página com fundo cinza e cabeçalho
            const addNewPage = (isFirstPage: boolean = false) => {
                if (!isFirstPage) {
                    addFooter();
                    doc.addPage();
                }

                // Fundo cinza
                doc.rect(0, 0, 595, 842).fill(colors.gray);

                // Logo/Cabeçalho (placeholder - futuramente adicionar logo real)
                doc.fontSize(16)
                    .fillColor(colors.gold)
                    .font('Helvetica-Bold')
                    .text('MONOFLOOR REVESTIMENTOS', 50, 30, { align: 'left' });

                doc.fontSize(9)
                    .fillColor(colors.darkGray)
                    .font('Helvetica')
                    .text('Sistema STELION - Piso Monolítico de Alto Desempenho', 50, 50);

                // Retornar à posição inicial do conteúdo
                doc.y = 90;
            };

            // PÁGINA 1 - Cabeçalho e Informações
            addNewPage(true);

            doc.fontSize(22)
                .fillColor(colors.gold)
                .font('Helvetica-Bold')
                .text('RELATÓRIO DE VISITA TÉCNICA', 50, 110, { align: 'center' });

            doc.moveDown(2);

            // Informações do projeto em caixa
            const infoBoxY = doc.y;
            doc.rect(50, infoBoxY, 495, 100)
                .fill('#FFFFFF')
                .stroke(colors.gold);

            doc.fontSize(11)
                .fillColor(colors.black)
                .font('Helvetica');

            const addInfoField = (label: string, value: string, y: number) => {
                doc.font('Helvetica-Bold').text(label, 70, y, { continued: true, width: 455 });
                doc.font('Helvetica').text(` ${value}`);
            };

            addInfoField('Projeto:', data.projectName, infoBoxY + 15);
            addInfoField('Técnico Responsável:', data.technicianName, infoBoxY + 35);
            addInfoField('Data da Visita:', new Date(data.visitDate).toLocaleDateString('pt-BR'), infoBoxY + 55);
            addInfoField('Objetivo:', this.getVisitPurposeLabel(data.visitPurpose), infoBoxY + 75);

            doc.y = infoBoxY + 120;
            doc.moveDown(1);

            // Texto introdutório padrão
            doc.fontSize(10)
                .fillColor(colors.black)
                .font('Helvetica')
                .text(
                    'Este relatório apresenta a análise técnica realizada durante visita ao local, ' +
                    'com identificação das condições encontradas, problemas detectados e ' +
                    'recomendações técnicas para aplicação do sistema STELION. ' +
                    'As observações a seguir foram organizadas por área ou tema técnico.',
                    50,
                    doc.y,
                    { align: 'justify', width: 495 }
                );

            if (data.observations) {
                doc.moveDown(1);
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Observações Gerais:', 50, doc.y);
                doc.moveDown(0.3);
                doc.font('Helvetica')
                    .text(data.observations, 50, doc.y, { align: 'justify', width: 495 });
            }

            doc.moveDown(1.5);

            // Linha divisória
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(colors.gold);
            doc.moveDown(1);

            // TÓPICOS
            data.topicGroups.forEach((topic, topicIndex) => {
                // Verificar se precisa de nova página
                if (doc.y > 650) {
                    addFooter();
                    doc.addPage();
                    addNewPage(false);
                }

                // Número e título do tópico
                doc.fontSize(14)
                    .fillColor(colors.gold)
                    .font('Helvetica-Bold')
                    .text(`${topicIndex + 1}. ${topic.topic}`, 50, doc.y);

                doc.moveDown(0.5);

                // Descrição do tópico
                doc.fontSize(10)
                    .fillColor(colors.darkGray)
                    .font('Helvetica-Oblique')
                    .text(topic.description, 50, doc.y, { width: 495 });

                doc.moveDown(1);

                // Imagens e análises do tópico
                topic.frameAnalyses.forEach((item, frameIndex) => {
                    // Verificar espaço para imagem + texto
                    if (doc.y > 550) {
                        addFooter();
                        doc.addPage();
                        addNewPage(false);
                    }

                    // Imagem em caixa branca
                    const imageBoxY = doc.y;
                    const imageBoxHeight = 220;

                    doc.rect(50, imageBoxY, 495, imageBoxHeight)
                        .fill('#FFFFFF')
                        .stroke(colors.darkGray);

                    try {
                        doc.image(item.frame.buffer, 55, imageBoxY + 5, {
                            fit: [485, 210],
                            align: 'center',
                            valign: 'center'
                        });
                    } catch (error) {
                        console.error('Erro ao adicionar imagem:', error);
                    }

                    doc.y = imageBoxY + imageBoxHeight + 10;

                    // Análise técnica
                    doc.fontSize(10)
                        .fillColor(colors.black)
                        .font('Helvetica')
                        .text(item.analysis, 50, doc.y, {
                            align: 'justify',
                            width: 495
                        });

                    doc.moveDown(1.5);

                    // Linha divisória entre frames do mesmo tópico
                    if (frameIndex < topic.frameAnalyses.length - 1) {
                        doc.moveTo(70, doc.y).lineTo(525, doc.y).stroke('#CCCCCC');
                        doc.moveDown(1);
                    }
                });

                // Linha divisória entre tópicos
                if (topicIndex < data.topicGroups.length - 1) {
                    doc.moveDown(1);
                    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(colors.gold);
                    doc.moveDown(1.5);
                }
            });

            // PÁGINA FINAL
            addFooter();
            doc.addPage();
            addNewPage(false);

            doc.y = 350;

            doc.fontSize(14)
                .fillColor(colors.gold)
                .font('Helvetica-Bold')
                .text('CONSIDERAÇÕES FINAIS', 50, doc.y, { align: 'center' });

            doc.moveDown(1.5);

            doc.fontSize(10)
                .fillColor(colors.black)
                .font('Helvetica')
                .text(
                    'Este relatório técnico foi elaborado com base nas condições encontradas no momento da visita. ' +
                    'As recomendações apresentadas visam garantir a qualidade e durabilidade da aplicação do sistema STELION. ' +
                    'Para esclarecimentos adicionais ou detalhamento de qualquer ponto, nossa equipe técnica permanece à disposição.',
                    50,
                    doc.y,
                    { align: 'justify', width: 495 }
                );

            doc.moveDown(2);

            doc.fontSize(9)
                .fillColor(colors.darkGray)
                .text(`Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, 50, doc.y, { align: 'center' });

            doc.moveDown(0.5);

            doc.fontSize(8)
                .text('Monofloor Revestimentos - Sistema de Relatórios Técnicos Automatizados', 50, doc.y, { align: 'center' });

            // Rodapé final
            addFooter();

            doc.end();
        });
    }

    /**
     * Gera PDF com imagens e análises (versão antiga - manter para compatibilidade)
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
     * Gera PDF consolidado com múltiplos vídeos usando análise semântica
     */
    private async generateConsolidatedPDF(data: {
        projectName: string;
        technicianName: string;
        visitDate: string;
        visitPurpose: string;
        observations: string;
        videos: Array<{
            videoNumber: number;
            videoName: string;
            analyses: FrameAnalysis[];
        }>;
        outputFormat?: 'pdf' | 'docx';
        clientName?: string;
        address?: string;
    }): Promise<Buffer> {
        console.log('[VideoReport] Consolidando análises de múltiplos vídeos...');

        // Combinar todas as análises de todos os vídeos
        const allAnalyses: FrameAnalysis[] = [];
        data.videos.forEach(video => {
            allAnalyses.push(...video.analyses);
        });

        console.log(`[VideoReport] Total de ${allAnalyses.length} análises de ${data.videos.length} vídeos`);

        // Agrupar por tópicos semânticos (todos os vídeos juntos)
        const topicGroups = await this.groupFramesByTopics(allAnalyses);

        const format = data.outputFormat || 'pdf';

        // Gerar no formato escolhido
        if (format === 'docx') {
            console.log('[VideoReport] Gerando DOCX consolidado...');
            return docxReportService.generateDocxReport({
                projectName: data.projectName,
                technicianName: data.technicianName,
                visitDate: data.visitDate,
                clientName: data.clientName || data.projectName,
                address: data.address || '',
                topicGroups
            });
        } else {
            console.log('[VideoReport] Gerando PDF consolidado...');
            return this.generateMonofloorPDF({
                projectName: data.projectName,
                technicianName: data.technicianName,
                visitDate: data.visitDate,
                visitPurpose: data.visitPurpose,
                observations: data.observations,
                topicGroups
            });
        }
    }

    /**
     * Gera PDF consolidado com múltiplos vídeos (versão antiga - deprecated)
     */
    private generateConsolidatedPDF_OLD(data: {
        projectName: string;
        technicianName: string;
        visitDate: string;
        visitPurpose: string;
        observations: string;
        videos: Array<{
            videoNumber: number;
            videoName: string;
            analyses: FrameAnalysis[];
        }>;
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
            addField('Total de Vídeos:', `${data.videos.length} vídeo${data.videos.length > 1 ? 's' : ''}`);

            if (data.observations) {
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').text('Observações Gerais:');
                doc.font('Helvetica').text(data.observations);
            }

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
            doc.moveDown(1);

            // Processar cada vídeo
            data.videos.forEach((video, videoIndex) => {
                // Cabeçalho do vídeo
                if (videoIndex > 0) {
                    doc.addPage();
                }

                doc.fontSize(18)
                    .fillColor('#c9a962')
                    .font('Helvetica-Bold')
                    .text(`📹 Vídeo ${video.videoNumber}`, { align: 'left' });

                doc.moveDown(0.3);
                doc.fontSize(11)
                    .fillColor('#888888')
                    .font('Helvetica')
                    .text(`${video.videoName}`, { align: 'left' });

                doc.moveDown(1);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
                doc.moveDown(1);

                // Análises do vídeo
                video.analyses.forEach((item, index) => {
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
                    if (index < video.analyses.length - 1) {
                        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#eeeeee');
                        doc.moveDown(1);
                    }
                });

                // Separador entre vídeos
                if (videoIndex < data.videos.length - 1) {
                    doc.moveDown(2);
                    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#c9a962');
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
