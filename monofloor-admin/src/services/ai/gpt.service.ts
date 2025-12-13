import { config } from '../../config';

interface ReportSummary {
  summary: string;
  highlights: string[];
  issues: string[];
  nextSteps: string[];
}

interface DailyReportData {
  projectName: string;
  projectClient: string;
  date: string;
  reports: Array<{
    userName: string;
    notes: string;
    transcription?: string;
    tags: string[];
    time: string;
  }>;
  totalHours: number;
  teamMembers: string[];
}

interface GeneratedDailyReport {
  title: string;
  executiveSummary: string;
  workCompleted: string[];
  issues: string[];
  teamPerformance: string;
  recommendations: string[];
}

export class GPTService {
  private apiKey = config.openai.apiKey;
  private endpoint = 'https://api.openai.com/v1/chat/completions';

  private async callGPT(
    systemPrompt: string,
    userPrompt: string,
    temperature = 0.7
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GPT API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content;
  }

  async summarizeReport(
    notes: string,
    transcription?: string,
    tags?: string[]
  ): Promise<ReportSummary> {
    const systemPrompt = `Você é um assistente especializado em resumir relatórios de obra de aplicação de piso monolítico STELION.
Sua tarefa é analisar o conteúdo do relatório e extrair:
1. Um resumo conciso (2-3 frases)
2. Destaques positivos do trabalho realizado
3. Problemas ou dificuldades encontrados
4. Próximos passos sugeridos

Responda APENAS em formato JSON válido com a estrutura:
{
  "summary": "resumo aqui",
  "highlights": ["destaque1", "destaque2"],
  "issues": ["problema1", "problema2"],
  "nextSteps": ["passo1", "passo2"]
}`;

    const userPrompt = `Relatório de obra:

Notas: ${notes || 'Não informado'}
${transcription ? `\nTranscrição de áudio: ${transcription}` : ''}
${tags && tags.length > 0 ? `\nTags: ${tags.join(', ')}` : ''}

Analise e resuma este relatório.`;

    const result = await this.callGPT(systemPrompt, userPrompt, 0.5);

    try {
      return JSON.parse(result);
    } catch {
      return {
        summary: result,
        highlights: [],
        issues: [],
        nextSteps: [],
      };
    }
  }

  async generateDailyReport(data: DailyReportData): Promise<GeneratedDailyReport> {
    const systemPrompt = `Você é um assistente especializado em gerar relatórios consolidados de obra para aplicação de piso monolítico STELION.
Sua tarefa é analisar todos os relatórios do dia e criar um relatório executivo consolidado.

Responda APENAS em formato JSON válido com a estrutura:
{
  "title": "Relatório Diário - [Cliente] - [Data]",
  "executiveSummary": "resumo executivo em 3-4 frases",
  "workCompleted": ["item1", "item2", "item3"],
  "issues": ["problema1", "problema2"],
  "teamPerformance": "análise da equipe",
  "recommendations": ["recomendação1", "recomendação2"]
}`;

    const reportsText = data.reports
      .map(
        (r) => `
[${r.time}] ${r.userName}:
Notas: ${r.notes || 'N/A'}
${r.transcription ? `Transcrição: ${r.transcription}` : ''}
Tags: ${r.tags.join(', ') || 'N/A'}`
      )
      .join('\n---\n');

    const userPrompt = `Projeto: ${data.projectName}
Cliente: ${data.projectClient}
Data: ${data.date}
Total de horas trabalhadas: ${data.totalHours.toFixed(1)}h
Equipe: ${data.teamMembers.join(', ')}

Relatórios do dia:
${reportsText}

Gere o relatório consolidado do dia.`;

    const result = await this.callGPT(systemPrompt, userPrompt, 0.6);

    try {
      return JSON.parse(result);
    } catch {
      return {
        title: `Relatório Diário - ${data.projectClient} - ${data.date}`,
        executiveSummary: result,
        workCompleted: [],
        issues: [],
        teamPerformance: '',
        recommendations: [],
      };
    }
  }

  async generatePeriodReport(
    projectName: string,
    clientName: string,
    startDate: string,
    endDate: string,
    dailySummaries: string[],
    totalHours: number,
    m2Applied: number
  ): Promise<string> {
    const systemPrompt = `Você é um assistente especializado em gerar relatórios consolidados de período para obras de aplicação de piso monolítico STELION.
Crie um relatório executivo profissional em português, formatado em Markdown, que inclua:
- Resumo executivo
- Progresso do período
- Principais realizações
- Desafios encontrados
- Métricas de produtividade
- Recomendações`;

    const userPrompt = `Projeto: ${projectName}
Cliente: ${clientName}
Período: ${startDate} a ${endDate}
Total de horas: ${totalHours.toFixed(1)}h
M² aplicados no período: ${m2Applied.toFixed(2)}m²

Resumos diários:
${dailySummaries.join('\n\n')}

Gere o relatório consolidado do período.`;

    return this.callGPT(systemPrompt, userPrompt, 0.7);
  }

  async generateTasksFromDescription(
    projectName: string,
    workflowDescription: string,
    m2Total: number,
    customPrompt?: string
  ): Promise<string[]> {
    const systemPrompt = customPrompt || `Você é um especialista em planejamento de obras de aplicação de piso monolítico STELION.
Dada a descrição do fluxo de trabalho de um projeto, gere uma lista de tarefas detalhadas e ordenadas.
Considere as etapas típicas: preparação da base, aplicação de primer, mistura do material, aplicação, nivelamento, cura.

Responda APENAS com um array JSON de strings, cada string sendo uma tarefa.
Exemplo: ["Tarefa 1", "Tarefa 2", "Tarefa 3"]`;

    const userPrompt = `Projeto: ${projectName}
Área total: ${m2Total}m²
Descrição do fluxo: ${workflowDescription}

Gere as tarefas detalhadas para este projeto.`;

    const result = await this.callGPT(systemPrompt, userPrompt, 0.7);

    try {
      return JSON.parse(result);
    } catch {
      // Try to extract tasks from unformatted response
      return result
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[\d\-\*\.]+\s*/, '').trim());
    }
  }
}

export const gptService = new GPTService();
