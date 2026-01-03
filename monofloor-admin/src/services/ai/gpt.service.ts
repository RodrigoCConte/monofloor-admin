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

  /**
   * Extrai a metragem total de uma descrição textual da área do projeto.
   * Usa IA para interpretar descrições como "sala de 50m², cozinha 30m², 2 quartos de 15m² cada"
   * e calcular a metragem total.
   *
   * @param descricao - Texto descritivo da área do projeto
   * @param faixaEstimativa - Valor estimado da faixa selecionada (fallback secundário)
   * @returns Metragem total estimada (mínimo 150m²)
   */
  async extractMetragemFromDescription(
    descricao: string | null,
    faixaEstimativa?: number
  ): Promise<number> {
    const METRAGEM_MINIMA = 150;

    // Se não há descrição, usa a faixa ou o mínimo
    if (!descricao || descricao.trim().length === 0) {
      console.log('[GPT] Sem descrição, usando fallback:', faixaEstimativa || METRAGEM_MINIMA);
      return faixaEstimativa || METRAGEM_MINIMA;
    }

    try {
      const systemPrompt = `Você é um especialista em orçamentos de aplicação de revestimento STELION (piso monolítico).
Sua tarefa é extrair a METRAGEM TOTAL em metros quadrados (m²) que o cliente deseja aplicar.

CONTEXTO: O cliente está descrevendo áreas onde quer aplicar piso monolítico STELION.
O produto pode ser aplicado em: piso, parede, bancada, rodapé, borda de piscina, escada, área externa, etc.

REGRAS IMPORTANTES:
1. SOME TODAS as áreas mencionadas (piso + parede + revestimento + rodapé + bancada + escada + etc.)
2. Exemplo: "80m piso e 120m parede" = 200m² TOTAL
3. Exemplo: "100m² piso e 50m² revestimento" = 150m² TOTAL
4. Exemplo: "250 metros de piso e 50 metros de parede" = 300m² TOTAL
5. DIMENSÕES: Se mencionar dimensões como "8m x 24m" ou "5 x 10 metros", MULTIPLIQUE para obter a área (8 × 24 = 192m²)
6. Se mencionar apenas um número sem contexto (ex: "100"), considere como metragem total
7. Rodapé em metros lineares: considere ~0.15m² por metro linear (15cm de altura)
8. Borda de piscina: considere ~0.3m² por metro linear
9. Se a descrição for muito vaga (só cômodos, sem números), retorne 0

RESPONDA APENAS com um objeto JSON:
{
  "metragemTotal": número (soma de TODAS as áreas),
  "detalhamento": "explicação breve do cálculo",
  "confianca": "alta" | "media" | "baixa"
}`;

      const userPrompt = `Descrição do projeto:
"${descricao}"

Extraia a metragem total em m².`;

      const result = await this.callGPT(systemPrompt, userPrompt, 0.3);

      try {
        const parsed = JSON.parse(result);
        const metragem = parsed.metragemTotal || 0;

        console.log(`[GPT] Metragem extraída: ${metragem}m² (confiança: ${parsed.confianca})`);
        console.log(`[GPT] Detalhamento: ${parsed.detalhamento}`);

        // Se a IA não conseguiu extrair ou retornou 0, usa fallback
        if (metragem <= 0) {
          console.log('[GPT] Metragem inválida, usando fallback:', faixaEstimativa || METRAGEM_MINIMA);
          return faixaEstimativa || METRAGEM_MINIMA;
        }

        // Garante mínimo de 150m² apenas se não houver valor válido
        return metragem;

      } catch (parseError) {
        console.error('[GPT] Erro ao parsear resposta:', parseError);
        console.log('[GPT] Resposta raw:', result);

        // Tenta extrair número diretamente da resposta
        const numMatch = result.match(/(\d+(?:[.,]\d+)?)/);
        if (numMatch) {
          const extracted = parseFloat(numMatch[1].replace(',', '.'));
          if (extracted > 0) {
            console.log('[GPT] Número extraído do texto:', extracted);
            return extracted;
          }
        }

        return faixaEstimativa || METRAGEM_MINIMA;
      }

    } catch (error) {
      console.error('[GPT] Erro ao chamar API:', error);
      return faixaEstimativa || METRAGEM_MINIMA;
    }
  }
}

export const gptService = new GPTService();
