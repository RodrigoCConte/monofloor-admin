import { config } from '../../config';

interface ReportSummary {
  summary: string;
  highlights: string[];
  issues: string[];
  nextSteps: string[];
}

// Interface para detalhamento de áreas extraídas
export interface AreaDetails {
  piso: number;
  parede: number;
  teto: number;
  bancadas: number;
  escadas: number;
  especiaisPequenos: number;
  especiaisGrandes: number;
  piscina: number;
  metragemTotal: number;
  valorEstimado: number;
  detalhamento: string;
  confianca: 'alta' | 'media' | 'baixa';
}

// Constantes de precificação (espelho do gerador de propostas)
const PRICING = {
  STELION_BASE: 910,
  LILIT_BASE: 590,
  PERDA: 0.9, // Fator de perda (divide por 0.9 = +11%)
  MULTIPLICADORES: {
    piso: { produto: 'STELION', mult: 1.0 },
    parede: { produto: 'LILIT', mult: 0.8 },
    teto: { produto: 'LILIT', mult: 0.8 },
    bancadas: { produto: 'STELION', mult: 1.5 },
    escadas: { produto: 'STELION', mult: 1.5 },
    especiaisPequenos: { produto: 'STELION', mult: 0.5 },
    especiaisGrandes: { produto: 'STELION', mult: 1.5 },
    piscina: { produto: 'STELION', mult: 1.5 },
  }
};

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

  /**
   * Extrai detalhes estruturados das áreas de um projeto a partir da descrição textual.
   * Classifica por tipo (piso, parede, bancada, etc.) e calcula valor estimado
   * usando a tabela de precificação real do gerador de propostas.
   *
   * @param descricao - Texto descritivo da área do projeto
   * @param faixaEstimativa - Valor estimado da faixa selecionada (fallback)
   * @returns Objeto com metragem por tipo e valor estimado
   */
  async extractAreaDetails(
    descricao: string | null,
    faixaEstimativa?: number
  ): Promise<AreaDetails> {
    const defaultResult: AreaDetails = {
      piso: faixaEstimativa || 150,
      parede: 0,
      teto: 0,
      bancadas: 0,
      escadas: 0,
      especiaisPequenos: 0,
      especiaisGrandes: 0,
      piscina: 0,
      metragemTotal: faixaEstimativa || 150,
      valorEstimado: 0,
      detalhamento: 'Sem descrição - usando estimativa padrão',
      confianca: 'baixa'
    };

    // Calcula valor default
    defaultResult.valorEstimado = this.calcularValorEstimado(defaultResult);

    if (!descricao || descricao.trim().length === 0) {
      console.log('[GPT] Sem descrição, usando fallback');
      return defaultResult;
    }

    try {
      const systemPrompt = `Você é um especialista em orçamentos de aplicação de revestimento STELION/LILIT (piso monolítico).
Sua tarefa é extrair METROS QUADRADOS por tipo de área a partir da descrição do cliente.

TIPOS DE ÁREA (classifique cada área mencionada):
- piso: áreas de piso/chão (sala, quarto, cozinha, área externa, garagem, etc.)
- parede: paredes, muros, revestimentos verticais
- teto: forros, tetos, lajes
- bancadas: bancadas de cozinha, banheiro, churrasqueira, ilhas
- escadas: escadas, degraus
- especiaisPequenos: rodapés, soleiras, pingadeiras (áreas menores que 5m²)
- especiaisGrandes: nichos grandes, detalhes arquitetônicos (áreas maiores que 5m²)
- piscina: bordas de piscina, áreas molhadas de piscina

REGRAS:
1. EXTRAIA a metragem de CADA tipo separadamente
2. Dimensões: "8m x 24m" ou "5 x 10 metros" → MULTIPLIQUE (8 × 24 = 192m²)
3. Rodapé em metros lineares: considere ~0.15m² por metro linear
4. Borda de piscina: considere ~0.3m² por metro linear
5. Se não especificar o tipo, assuma que é PISO
6. Se só mencionar cômodos sem números, retorne todos como 0

RESPONDA APENAS com um objeto JSON:
{
  "piso": número,
  "parede": número,
  "teto": número,
  "bancadas": número,
  "escadas": número,
  "especiaisPequenos": número,
  "especiaisGrandes": número,
  "piscina": número,
  "detalhamento": "explicação breve do que foi interpretado",
  "confianca": "alta" | "media" | "baixa"
}`;

      const userPrompt = `Descrição do projeto:
"${descricao}"

Extraia a metragem por tipo de área em m².`;

      const result = await this.callGPT(systemPrompt, userPrompt, 0.2);

      try {
        // Remover markdown se o GPT retornar com ```json
        let jsonStr = result.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr);

        const areaDetails: AreaDetails = {
          piso: parsed.piso || 0,
          parede: parsed.parede || 0,
          teto: parsed.teto || 0,
          bancadas: parsed.bancadas || 0,
          escadas: parsed.escadas || 0,
          especiaisPequenos: parsed.especiaisPequenos || 0,
          especiaisGrandes: parsed.especiaisGrandes || 0,
          piscina: parsed.piscina || 0,
          metragemTotal: 0,
          valorEstimado: 0,
          detalhamento: parsed.detalhamento || '',
          confianca: parsed.confianca || 'media'
        };

        // Calcular metragem total
        areaDetails.metragemTotal =
          areaDetails.piso + areaDetails.parede + areaDetails.teto +
          areaDetails.bancadas + areaDetails.escadas +
          areaDetails.especiaisPequenos + areaDetails.especiaisGrandes +
          areaDetails.piscina;

        // Se não extraiu nada, usar fallback (midpoint da faixa selecionada)
        if (areaDetails.metragemTotal <= 0) {
          console.log(`[GPT] Nenhuma metragem extraída da descrição, usando fallback: ${faixaEstimativa || 150}m²`);
          return defaultResult;
        }

        // Calcular valor estimado usando tabela de preços
        areaDetails.valorEstimado = this.calcularValorEstimado(areaDetails);

        console.log(`[GPT] Áreas extraídas:`, {
          piso: areaDetails.piso,
          parede: areaDetails.parede,
          teto: areaDetails.teto,
          bancadas: areaDetails.bancadas,
          escadas: areaDetails.escadas,
          total: areaDetails.metragemTotal,
          valor: areaDetails.valorEstimado,
          confianca: areaDetails.confianca
        });

        return areaDetails;

      } catch (parseError) {
        console.error('[GPT] Erro ao parsear resposta:', parseError);
        console.log('[GPT] Resposta raw:', result);
        return defaultResult;
      }

    } catch (error) {
      console.error('[GPT] Erro ao chamar API:', error);
      return defaultResult;
    }
  }

  /**
   * Calcula o valor estimado do projeto usando a tabela de precificação
   * do gerador de propostas.
   */
  private calcularValorEstimado(areas: Partial<AreaDetails>): number {
    let valorTotal = 0;

    const tiposArea = ['piso', 'parede', 'teto', 'bancadas', 'escadas', 'especiaisPequenos', 'especiaisGrandes', 'piscina'] as const;

    for (const tipo of tiposArea) {
      const metros = areas[tipo] || 0;
      if (metros <= 0) continue;

      const config = PRICING.MULTIPLICADORES[tipo];
      const metrosComPerda = metros / PRICING.PERDA;
      const precoBase = config.produto === 'STELION' ? PRICING.STELION_BASE : PRICING.LILIT_BASE;

      valorTotal += metrosComPerda * precoBase * config.mult;
    }

    return Math.round(valorTotal);
  }
}

export const gptService = new GPTService();
