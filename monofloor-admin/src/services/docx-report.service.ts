import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface FrameAnalysis {
    frame: {
        path: string;
        timestamp: number;
        buffer: Buffer;
    };
    analysis: string;
}

interface TopicGroup {
    topic: string;
    description: string;
    frameAnalyses: FrameAnalysis[];
}

interface DocxReportOptions {
    projectName: string;
    technicianName: string;
    visitDate: string;
    clientName: string;
    address: string;
    topicGroups: TopicGroup[];
}

export class DocxReportService {
    private pythonScriptPath = path.join(__dirname, '../../scripts/generate-docx.py');

    /**
     * Gera relatório DOCX no formato Monofloor usando Python
     */
    async generateDocxReport(options: DocxReportOptions): Promise<Buffer> {
        console.log('[DocxReport] Gerando relatório DOCX...');

        // Criar arquivo JSON temporário com os dados
        const tempDataPath = path.join(__dirname, '../../temp/report-data.json');
        const tempOutputPath = path.join(__dirname, '../../temp/report-output.docx');

        try {
            // Preparar dados para o Python
            // Passar as imagens como base64 em vez de paths para evitar problemas de timing
            const reportData = {
                clientName: options.clientName,
                address: options.address,
                visitDate: options.visitDate,
                topicGroups: options.topicGroups.map(group => ({
                    topic: group.topic,
                    description: group.description,
                    frames: group.frameAnalyses.map(item => ({
                        imageBase64: item.frame.buffer.toString('base64'),
                        analysis: item.analysis
                    }))
                }))
            };

            // Salvar JSON
            await fs.writeFile(tempDataPath, JSON.stringify(reportData, null, 2));

            // Chamar script Python
            const buffer = await this.executePythonScript(tempDataPath, tempOutputPath);

            // Limpar arquivos temporários
            try {
                await fs.unlink(tempDataPath);
            } catch (error) {
                console.error('Erro ao deletar arquivo temporário:', error);
            }

            console.log('[DocxReport] DOCX gerado com sucesso!');
            return buffer;

        } catch (error: any) {
            console.error('[DocxReport] Erro ao gerar DOCX:', error.message);
            throw error;
        }
    }

    /**
     * Executa script Python para gerar DOCX
     */
    private executePythonScript(dataPath: string, outputPath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', [
                this.pythonScriptPath,
                dataPath,
                outputPath
            ]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log('[DocxReport Python]', data.toString().trim());
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error('[DocxReport Python Error]', data.toString().trim());
            });

            python.on('close', async (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script failed: ${stderr}`));
                    return;
                }

                try {
                    const buffer = await fs.readFile(outputPath);
                    await fs.unlink(outputPath);
                    resolve(buffer);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}

export default new DocxReportService();
