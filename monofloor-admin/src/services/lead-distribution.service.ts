/**
 * Lead Distribution Service
 *
 * Distribui leads automaticamente baseado na REGIÃO de execução.
 *
 * Regras:
 * - Curitiba, Litoral PR, Santa Catarina → Renata
 * - Rio de Janeiro, Litoral RJ → João
 * - São Paulo, Interior/Litoral SP, Outros → Isa, Gabriel, Amanda (round-robin 1 para cada)
 *
 * A mesma lógica se aplica para Form Orçamento e Form Arquiteto.
 */

import prisma from '../lib/prisma';

// =============================================
// CONFIGURAÇÃO DE CONSULTORES
// =============================================

export interface ConsultorConfig {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// Consultores por região
const CONSULTOR_RENATA: ConsultorConfig = {
  id: 'renata',
  name: 'Renata Garcia Penna',
  email: 'renatagpenna@gmail.com',
  isActive: true,
};

const CONSULTOR_JOAO: ConsultorConfig = {
  id: 'joao',
  name: 'João Farah',
  email: 'joaohfarah@hotmail.com',
  isActive: true,
};

// Consultores para SP e Outros (round-robin)
const CONSULTORES_SP_OUTROS: ConsultorConfig[] = [
  { id: 'isabela', name: 'Isabela de Moraes', email: 'isa@monofloor.com.br', isActive: true },
  { id: 'gabriel', name: 'Gabriel Accardo', email: 'gabriel@monofloor.com.br', isActive: true },
  { id: 'amanda', name: 'Amanda Vantini', email: 'amandavantini@outlook.com', isActive: true },
];

// Todos os consultores
const ALL_CONSULTORES: ConsultorConfig[] = [
  CONSULTOR_RENATA,
  CONSULTOR_JOAO,
  ...CONSULTORES_SP_OUTROS,
];

// =============================================
// MAPEAMENTO DE REGIÕES
// =============================================

type RegionGroup = 'RENATA' | 'JOAO' | 'SP_OUTROS';

// Mapeamento de códigos de região para grupo de consultor
const REGION_MAP: Record<string, RegionGroup> = {
  // Renata - Sul
  'CURITIBA': 'RENATA',
  'PR_LITORAL': 'RENATA',
  'SC': 'RENATA',
  'Curitiba': 'RENATA',
  'Litoral Paranaense': 'RENATA',
  'Santa Catarina': 'RENATA',

  // João - Rio de Janeiro
  'RJ_CAPITAL': 'JOAO',
  'RJ_INTERIOR': 'JOAO',
  'Rio de Janeiro (Capital)': 'JOAO',
  'Interior ou Litoral Carioca': 'JOAO',

  // SP e Outros - Isa, Gabriel, Amanda
  'SP_CAPITAL': 'SP_OUTROS',
  'SP_INTERIOR': 'SP_OUTROS',
  'OUTRO': 'SP_OUTROS',
  'São Paulo (Capital)': 'SP_OUTROS',
  'Interior ou Litoral Paulista': 'SP_OUTROS',
  'Outro': 'SP_OUTROS',
};

// =============================================
// MAPEAMENTO DE DDD PARA REGIÃO
// =============================================

const DDD_REGION_MAP: Record<string, RegionGroup> = {
  // Renata - Paraná e Santa Catarina
  '41': 'RENATA', // Curitiba
  '42': 'RENATA', // Ponta Grossa
  '43': 'RENATA', // Londrina
  '44': 'RENATA', // Maringá
  '45': 'RENATA', // Cascavel
  '46': 'RENATA', // Francisco Beltrão
  '47': 'RENATA', // Joinville, Blumenau (SC)
  '48': 'RENATA', // Florianópolis (SC)
  '49': 'RENATA', // Chapecó (SC)

  // João - Rio de Janeiro
  '21': 'JOAO', // Rio de Janeiro Capital
  '22': 'JOAO', // Campos, Cabo Frio
  '24': 'JOAO', // Petrópolis, Volta Redonda

  // SP e Outros - Isa, Gabriel, Amanda
  '11': 'SP_OUTROS', // São Paulo Capital
  '12': 'SP_OUTROS', // São José dos Campos
  '13': 'SP_OUTROS', // Santos, Litoral
  '14': 'SP_OUTROS', // Bauru
  '15': 'SP_OUTROS', // Sorocaba
  '16': 'SP_OUTROS', // Ribeirão Preto
  '17': 'SP_OUTROS', // São José do Rio Preto
  '18': 'SP_OUTROS', // Presidente Prudente
  '19': 'SP_OUTROS', // Campinas
};

// =============================================
// ESTADO DO ROUND-ROBIN (apenas para SP/Outros)
// =============================================

let roundRobinIndex = -1; // Começa em -1 para que o primeiro lead vá para índice 0

// =============================================
// FUNÇÕES DE DISTRIBUIÇÃO
// =============================================

/**
 * Extrai o DDD de um número de telefone
 * Exemplos: "+5541999999999" -> "41", "41999999999" -> "41", "(41) 99999-9999" -> "41"
 */
function extractDDD(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, '');

  // Se começa com 55 (código do Brasil), remove
  let cleaned = digits;
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    cleaned = cleaned.substring(2);
  }

  // Se tem pelo menos 10 dígitos (DDD + 8 dígitos), extrai DDD
  if (cleaned.length >= 10) {
    return cleaned.substring(0, 2);
  }

  return null;
}

/**
 * Determina o grupo de região baseado no DDD do telefone
 */
function getRegionGroupByDDD(phone: string | null | undefined): RegionGroup | null {
  const ddd = extractDDD(phone);
  if (ddd && DDD_REGION_MAP[ddd]) {
    return DDD_REGION_MAP[ddd];
  }
  return null;
}

/**
 * Determina o grupo de região baseado na cidade/código
 */
function getRegionGroupByCidade(cidadeExecucao: string | null | undefined, cidadeExecucaoDesc: string | null | undefined): RegionGroup {
  // Tentar pelo código primeiro
  if (cidadeExecucao && REGION_MAP[cidadeExecucao]) {
    return REGION_MAP[cidadeExecucao];
  }

  // Tentar pela descrição
  if (cidadeExecucaoDesc && REGION_MAP[cidadeExecucaoDesc]) {
    return REGION_MAP[cidadeExecucaoDesc];
  }

  // Tentar match parcial na descrição
  if (cidadeExecucaoDesc) {
    const desc = cidadeExecucaoDesc.toLowerCase();

    // Renata - Sul
    if (desc.includes('curitiba') || desc.includes('paranaense') || desc.includes('santa catarina') || desc.includes('sc')) {
      return 'RENATA';
    }

    // João - RJ
    if (desc.includes('rio de janeiro') || desc.includes('carioca') || desc.includes('rj')) {
      return 'JOAO';
    }

    // SP e Outros
    if (desc.includes('são paulo') || desc.includes('sao paulo') || desc.includes('paulista') || desc.includes('sp')) {
      return 'SP_OUTROS';
    }
  }

  // Default: SP/Outros
  return 'SP_OUTROS';
}

/**
 * Retorna o consultor baseado no grupo de região
 */
function getConsultorByRegionGroup(regionGroup: RegionGroup, contextInfo: string): ConsultorConfig {
  switch (regionGroup) {
    case 'RENATA':
      console.log(`[LeadDistribution] Região Sul (${contextInfo}) -> ${CONSULTOR_RENATA.name}`);
      return CONSULTOR_RENATA;

    case 'JOAO':
      console.log(`[LeadDistribution] Região RJ (${contextInfo}) -> ${CONSULTOR_JOAO.name}`);
      return CONSULTOR_JOAO;

    case 'SP_OUTROS':
    default:
      // Round-robin entre Isa, Gabriel, Amanda
      const activeConsultores = CONSULTORES_SP_OUTROS.filter(c => c.isActive);

      if (activeConsultores.length === 0) {
        console.warn('[LeadDistribution] No active consultores for SP/Outros!');
        return CONSULTORES_SP_OUTROS[0];
      }

      roundRobinIndex = (roundRobinIndex + 1) % activeConsultores.length;
      const consultor = activeConsultores[roundRobinIndex];

      console.log(`[LeadDistribution] Região SP/Outros (${contextInfo}) -> ${consultor.name} (round-robin index ${roundRobinIndex})`);
      return consultor;
  }
}

/**
 * Obtém o próximo consultor para Form ORÇAMENTO (usa cidade de execução)
 */
export function getNextConsultorOrcamento(
  cidadeExecucao: string | null | undefined,
  cidadeExecucaoDesc: string | null | undefined
): ConsultorConfig {
  const regionGroup = getRegionGroupByCidade(cidadeExecucao, cidadeExecucaoDesc);
  return getConsultorByRegionGroup(regionGroup, cidadeExecucaoDesc || cidadeExecucao || 'N/A');
}

/**
 * Obtém o próximo consultor para Form ARQUITETO (usa DDD do telefone)
 */
export function getNextConsultorArquiteto(
  phone: string | null | undefined,
  cidadeExecucao?: string | null,
  cidadeExecucaoDesc?: string | null
): ConsultorConfig {
  // Primeiro tenta pelo DDD do telefone
  const ddd = extractDDD(phone);
  const regionByDDD = getRegionGroupByDDD(phone);

  if (regionByDDD) {
    console.log(`[LeadDistribution] Form Arquiteto - DDD ${ddd} detectado`);
    return getConsultorByRegionGroup(regionByDDD, `DDD ${ddd}`);
  }

  // Fallback: usa cidade de execução se DDD não for identificável
  console.log(`[LeadDistribution] Form Arquiteto - DDD não identificado, usando cidade`);
  const regionByCidade = getRegionGroupByCidade(cidadeExecucao, cidadeExecucaoDesc);
  return getConsultorByRegionGroup(regionByCidade, cidadeExecucaoDesc || cidadeExecucao || 'N/A');
}

/**
 * Obtém o próximo consultor para um lead (wrapper genérico)
 * @deprecated Use getNextConsultorOrcamento ou getNextConsultorArquiteto
 */
export function getNextConsultor(
  cidadeExecucao: string | null | undefined,
  cidadeExecucaoDesc: string | null | undefined,
  phone?: string | null,
  isArquiteto?: boolean
): ConsultorConfig {
  if (isArquiteto) {
    return getNextConsultorArquiteto(phone, cidadeExecucao, cidadeExecucaoDesc);
  }
  return getNextConsultorOrcamento(cidadeExecucao, cidadeExecucaoDesc);
}


// =============================================
// INICIALIZAÇÃO DO ESTADO
// =============================================

/**
 * Inicializa o estado do round-robin baseado no último lead SP/Outros
 */
export async function initializeDistributionState(): Promise<void> {
  try {
    // Buscar último lead de SP/Outros com consultor atribuído
    const lastSPLead = await prisma.comercialData.findFirst({
      where: {
        consultorId: {
          in: CONSULTORES_SP_OUTROS.map(c => c.name),
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { consultorId: true },
    });

    if (lastSPLead?.consultorId) {
      const activeConsultores = CONSULTORES_SP_OUTROS.filter(c => c.isActive);
      const index = activeConsultores.findIndex(c => c.name === lastSPLead.consultorId);

      if (index !== -1) {
        roundRobinIndex = index;
        console.log(`[LeadDistribution] Initialized SP/Outros state: last was ${activeConsultores[index].name} (index ${index})`);
      }
    }

    console.log(`[LeadDistribution] ✅ Distribution state initialized`);
    console.log(`[LeadDistribution]   Round-robin index (SP/Outros): ${roundRobinIndex}`);
    console.log(`[LeadDistribution]   Next SP/Outros lead goes to: ${CONSULTORES_SP_OUTROS[(roundRobinIndex + 1) % CONSULTORES_SP_OUTROS.length].name}`);

  } catch (error: any) {
    console.error('[LeadDistribution] Error initializing state:', error.message);
  }
}

// =============================================
// HELPERS
// =============================================

/**
 * Retorna todos os consultores ativos
 */
export function getAllActiveConsultores(): ConsultorConfig[] {
  return ALL_CONSULTORES.filter(c => c.isActive);
}

/**
 * Retorna consultores por grupo
 */
export function getConsultoresByGroup(): {
  renata: ConsultorConfig;
  joao: ConsultorConfig;
  spOutros: ConsultorConfig[];
} {
  return {
    renata: CONSULTOR_RENATA,
    joao: CONSULTOR_JOAO,
    spOutros: CONSULTORES_SP_OUTROS.filter(c => c.isActive),
  };
}

/**
 * Atualiza o status ativo de um consultor
 */
export function setConsultorActive(consultorId: string, isActive: boolean): boolean {
  // Buscar em todas as listas
  if (CONSULTOR_RENATA.id === consultorId) {
    CONSULTOR_RENATA.isActive = isActive;
    console.log(`[LeadDistribution] ${CONSULTOR_RENATA.name} is now ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    return true;
  }

  if (CONSULTOR_JOAO.id === consultorId) {
    CONSULTOR_JOAO.isActive = isActive;
    console.log(`[LeadDistribution] ${CONSULTOR_JOAO.name} is now ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    return true;
  }

  const consultor = CONSULTORES_SP_OUTROS.find(c => c.id === consultorId);
  if (consultor) {
    consultor.isActive = isActive;
    console.log(`[LeadDistribution] ${consultor.name} is now ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    return true;
  }

  return false;
}

/**
 * Retorna estatísticas de distribuição (últimos 30 dias)
 */
export async function getDistributionStats(): Promise<{
  byConsultor: { consultor: string; count: number }[];
  byRegion: { region: string; count: number }[];
  semConsultor: number;
}> {
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

  // Leads por consultor
  const byConsultorStats = await prisma.comercialData.groupBy({
    by: ['consultorId'],
    where: {
      consultorId: { not: null },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  });

  // Leads por região
  const byRegionStats = await prisma.comercialData.groupBy({
    by: ['cidadeExecucaoDesc'],
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  });

  // Leads sem consultor
  const semConsultor = await prisma.comercialData.count({
    where: {
      OR: [
        { consultorId: null },
        { consultorId: '' },
      ],
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  return {
    byConsultor: byConsultorStats.map(s => ({
      consultor: s.consultorId || 'N/A',
      count: s._count.id,
    })).sort((a, b) => b.count - a.count),
    byRegion: byRegionStats.map(s => ({
      region: s.cidadeExecucaoDesc || 'N/A',
      count: s._count.id,
    })).sort((a, b) => b.count - a.count),
    semConsultor,
  };
}

/**
 * Redistribui leads sem consultor baseado na região
 */
export async function redistributeUnassignedLeads(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{
  total: number;
  distributed: number;
  byConsultor: Record<string, number>;
  errors: string[];
}> {
  const { dryRun = false, limit } = options || {};
  const errors: string[] = [];
  let distributed = 0;
  const byConsultor: Record<string, number> = {};

  // Buscar leads sem consultor
  const unassignedLeads = await prisma.comercialData.findMany({
    where: {
      OR: [
        { consultorId: null },
        { consultorId: '' },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      cidadeExecucao: true,
      cidadeExecucaoDesc: true,
      personName: true,
    },
    take: limit,
  });

  console.log(`[LeadDistribution] Found ${unassignedLeads.length} unassigned leads${dryRun ? ' (DRY RUN)' : ''}`);

  for (const lead of unassignedLeads) {
    try {
      // Obter consultor baseado na região
      const consultor = getNextConsultor(lead.cidadeExecucao, lead.cidadeExecucaoDesc);

      if (!dryRun) {
        await prisma.comercialData.update({
          where: { id: lead.id },
          data: { consultorId: consultor.name },
        });
      }

      distributed++;
      byConsultor[consultor.name] = (byConsultor[consultor.name] || 0) + 1;

      if (distributed <= 20) {
        console.log(`[LeadDistribution] ${dryRun ? '[DRY] ' : ''}${lead.personName} (${lead.cidadeExecucaoDesc || 'N/A'}) -> ${consultor.name}`);
      }
    } catch (error: any) {
      errors.push(`Lead ${lead.id}: ${error.message}`);
    }
  }

  if (distributed > 20) {
    console.log(`[LeadDistribution] ... and ${distributed - 20} more leads`);
  }

  console.log(`[LeadDistribution] Distribution summary:`);
  for (const [name, count] of Object.entries(byConsultor)) {
    console.log(`[LeadDistribution]   ${name}: ${count} leads`);
  }

  return {
    total: unassignedLeads.length,
    distributed,
    byConsultor,
    errors,
  };
}

// =============================================
// EXPORT DEFAULT
// =============================================

export const leadDistributionService = {
  getNextConsultor,
  initializeDistributionState,
  getAllActiveConsultores,
  getConsultoresByGroup,
  setConsultorActive,
  getDistributionStats,
  redistributeUnassignedLeads,
};
