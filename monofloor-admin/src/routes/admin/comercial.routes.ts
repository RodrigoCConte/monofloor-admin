import { Router, Request, Response } from 'express';
import { PrismaClient, ComercialStatus, PropostaStatus, FollowUpStatus, FollowUpTipo, FollowUpCanal } from '@prisma/client';
import * as XLSX from 'xlsx';
import multer from 'multer';
import { gptService } from '../../services/ai/gpt.service';
import { leadDistributionService } from '../../services/lead-distribution.service';
import { sendWhatsAppDocument, sendWhatsAppMessage, isWhatsAppConfigured } from '../../services/whatsapp.service';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// CACHE SYSTEM FOR COMERCIAL DATA
// =============================================
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const comercialCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para invalidar cache
export const invalidateComercialCache = () => {
  comercialCache.clear();
  console.log('[Cache] Comercial cache invalidated');
};

// =============================================
// STAGE NAME → COMERCIAL STATUS MAPPING
// =============================================
// Mapeia nomes de stage do Pipedrive para o enum ComercialStatus
const stageNameToStatus: Record<string, ComercialStatus> = {
  // Entrada
  'Form Orçamento': 'LEAD',
  // 1º Contato
  '1º Contato': 'PRIMEIRO_CONTATO',
  '1º Contato Feito': 'PRIMEIRO_CONTATO',
  'Follow 1º Contato': 'FOLLOW_UP',
  'Follow 1º Contato Feito': 'FOLLOW_UP',
  // Arquiteto
  'Form Arquiteto': 'CONTATO_ARQUITETO',
  'Contato Arquiteto': 'CONTATO_ARQUITETO',
  // Levantamento
  'Proposta Escopo Minimo': 'LEVANTAMENTO',
  'Cálculo de Projeto': 'LEVANTAMENTO',
  'Projeto levantado': 'LEVANTAMENTO',
  'Cálculo Deslocamento': 'LEVANTAMENTO',
  'Deslocamento Levantado': 'LEVANTAMENTO',
  // Proposta
  'Proposta enviada': 'PROPOSTA_ENVIADA',
  // Follow-up
  'Fazer Follow 1': 'FOLLOW_UP',
  'Follow 1 Feito': 'FOLLOW_UP',
  'Fazer Follow 2': 'FOLLOW_UP',
  'Follow 2 Feito': 'FOLLOW_UP',
  'Fazer Follow 3': 'FOLLOW_UP',
  'Follow 3 Feito': 'FOLLOW_UP',
  // Negociação
  'Negociações': 'NEGOCIACAO',
  // Fechamento
  'Ganho': 'GANHO',
  'Perdido': 'PERDIDO',
};

// Função para obter o status do enum a partir do nome do stage
const getStatusFromStageName = (stageName: string): ComercialStatus => {
  // Se já é um valor válido do enum (backward compatibility)
  const enumValues = Object.values(ComercialStatus);
  if (enumValues.includes(stageName as ComercialStatus)) {
    return stageName as ComercialStatus;
  }
  // Mapear do nome do stage
  return stageNameToStatus[stageName] || 'LEAD';
};

// =============================================
// COMERCIAL MODULE ROUTES
// =============================================

// GET /comercial - List all commercial data with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '10000', excludeClosed } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Cache key based on filters
    // Cache key - só para queries sem search (search não é cacheável)
    const cacheKey = !search ? `${excludeClosed || 'false'}-${status || 'ALL'}` : null;

    // Verificar cache (apenas se não tiver search)
    if (cacheKey) {
      const cached = comercialCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`[Cache] HIT for ${cacheKey} (${cached.data.length} deals)`);
        return res.json({
          success: true,
          data: cached.data,
          pagination: {
            total: cached.data.length,
            page: 1,
            limit: cached.data.length,
            totalPages: 1,
          },
          cached: true,
        });
      }
    }

    const where: any = {
      // Mostrar apenas deals "open"
      dealStatus: 'open',
    };

    // Excluir deals fechados (PERDIDO e GANHO) para melhor performance
    if (excludeClosed === 'true') {
      where.status = { notIn: ['PERDIDO', 'GANHO'] };
    } else if (status && status !== 'ALL') {
      where.status = status as ComercialStatus;
    }

    if (search) {
      where.OR = [
        { personName: { contains: search as string, mode: 'insensitive' } },
        { personEmail: { contains: search as string, mode: 'insensitive' } },
        { nomeEscritorio: { contains: search as string, mode: 'insensitive' } },
        { cidadeExecucao: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    console.log(`[Cache] MISS for ${cacheKey || 'search query'} - fetching from DB...`);

    const [comerciais, total] = await Promise.all([
      prisma.comercialData.findMany({
        where,
        select: {
          // IDs
          id: true,
          pipedriveDealId: true,
          pipedriveUrl: true,
          // Status e Stage
          status: true,
          stageName: true,
          stageId: true,
          // Contato
          personName: true,
          personEmail: true,
          personPhone: true,
          primeiroNomeZapi: true,
          telefoneZapi: true,
          // Valores
          dealValue: true,
          dealCurrency: true,
          // Datas
          dealAddTime: true,
          dealUpdateTime: true,
          stageChangeTime: true,
          pipedriveSyncedAt: true,
          // Owner / Consultor
          ownerUserName: true,
          consultorId: true,
          // Campos customizados importantes
          tipoCliente: true,
          tipoProjeto: true,
          nomeEscritorio: true,
          cidadeExecucao: true,
          metragemEstimada: true,
          metragemEstimadaN1: true,
          descritivoArea: true,
          budgetEstimado: true,
          estadoObra: true,
          dataPrevistaExec: true,
          resumo: true,
          // Relações leves
          project: {
            select: {
              id: true,
              cliente: true,
              endereco: true,
              m2Total: true,
            },
          },
          // NÃO incluir pipedriveRawData (muito pesado)
        },
        orderBy: [
          { dealAddTime: 'desc' },  // Mais recentes primeiro
          { dealUpdateTime: 'desc' }
        ],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.comercialData.count({ where }),
    ]);

    // Salvar no cache (se não for search)
    if (cacheKey) {
      comercialCache.set(cacheKey, {
        data: comerciais,
        timestamp: Date.now(),
      });
      console.log(`[Cache] SAVED ${cacheKey} (${comerciais.length} deals)`);
    }

    res.json({
      success: true,
      data: comerciais,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
      cached: false,
    });
  } catch (error: any) {
    console.error('[Comercial] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/stats - Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      prisma.comercialData.count({ where: { status: 'LEAD' } }),
      prisma.comercialData.count({ where: { status: 'PRIMEIRO_CONTATO' } }),
      prisma.comercialData.count({ where: { status: 'CONTATO_ARQUITETO' } }),
      prisma.comercialData.count({ where: { status: 'LEVANTAMENTO' } }),
      prisma.comercialData.count({ where: { status: 'PROPOSTA_ENVIADA' } }),
      prisma.comercialData.count({ where: { status: 'FOLLOW_UP' } }),
      prisma.comercialData.count({ where: { status: 'NEGOCIACAO' } }),
      prisma.comercialData.count({ where: { status: 'GANHO' } }),
      prisma.comercialData.count({ where: { status: 'PERDIDO' } }),
      // Follow-ups pendentes para hoje
      prisma.followUp.count({
        where: {
          status: 'AGENDADO',
          agendadoPara: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      // Valor total em negociação
      prisma.proposta.aggregate({
        where: {
          comercial: { status: { in: ['PROPOSTA_ENVIADA', 'FOLLOW_UP', 'NEGOCIACAO'] } },
          status: { in: ['ENVIADA', 'VISUALIZADA'] },
        },
        _sum: { valorTotal: true },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        leads: stats[0],
        primeiroContato: stats[1],
        contatoArquiteto: stats[2],
        levantamento: stats[3],
        propostaEnviada: stats[4],
        followUp: stats[5],
        negociacao: stats[6],
        ganhos: stats[7],
        perdidos: stats[8],
        followUpsHoje: stats[9],
        valorEmNegociacao: stats[10]._sum.valorTotal || 0,
        totalAtivos: stats[0] + stats[1] + stats[2] + stats[3] + stats[4] + stats[5] + stats[6],
      },
    });
  } catch (error: any) {
    console.error('[Comercial] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/pipeline - Kanban pipeline view
router.get('/pipeline', async (_req: Request, res: Response) => {
  try {
    const pipeline = await prisma.comercialData.findMany({
      where: {
        status: { notIn: ['GANHO', 'PERDIDO'] },
      },
      include: {
        project: {
          select: {
            id: true,
            cliente: true,
            endereco: true,
            m2Total: true,
          },
        },
        propostas: {
          orderBy: { versao: 'desc' },
          take: 1,
          select: {
            id: true,
            valorTotal: true,
            status: true,
          },
        },
        followUps: {
          where: { status: 'AGENDADO' },
          orderBy: { agendadoPara: 'asc' },
          take: 1,
          select: {
            id: true,
            agendadoPara: true,
            tipo: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by status for kanban
    const kanban: Record<string, any[]> = {
      LEAD: [],
      PRIMEIRO_CONTATO: [],
      CONTATO_ARQUITETO: [],
      LEVANTAMENTO: [],
      PROPOSTA_ENVIADA: [],
      FOLLOW_UP: [],
      NEGOCIACAO: [],
    };

    for (const item of pipeline) {
      if (kanban[item.status]) {
        kanban[item.status].push(item);
      }
    }

    res.json({ success: true, pipeline: kanban });
  } catch (error: any) {
    console.error('[Comercial] Error getting pipeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial - Create new comercial entry (with project)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      cliente,
      endereco,
      cidade,
      m2Total,
      personPhone,
      personEmail,
      arquiteto,
      escritorio,
      telefoneArquiteto,
      tipoCliente,
      tipoProjeto,
      budgetEstimado,
      origem,
    } = req.body;

    // Create project and comercial data together
    const project = await prisma.project.create({
      data: {
        title: cliente,
        cliente,
        endereco,
        m2Total: m2Total ? parseFloat(m2Total) : 0,
        currentModule: 'COMERCIAL',
        comercialData: {
          create: {
            personPhone,
            personEmail,
            arquiteto,
            escritorio,
            telefoneArquiteto,
            tipoCliente,
            tipoProjeto,
            cidadeExecucao: cidade || null,
            budgetEstimado: budgetEstimado || null,
            origem,
            status: 'LEAD',
          },
        },
      },
      include: {
        comercialData: true,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        modulo: 'COMERCIAL',
        tipo: 'LEAD_CRIADO',
        titulo: 'Lead criado',
        descricao: `Novo lead criado: ${cliente}`,
      },
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    console.error('[Comercial] Error creating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/:id - Update comercial data (suporta edição inline de campos)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Record<string, any> = {};

    // Campos editáveis - só atualiza se presente no body
    const editableFields = [
      'personName', 'personPhone', 'personEmail',
      'arquiteto', 'escritorio', 'telefoneArquiteto',
      'tipoCliente', 'tipoProjeto', 'budgetEstimado', 'origem',
      'metragemEstimada', 'metragemEstimadaN1',
      'endereco', 'cidadeExecucao', 'cidadeExecucaoDesc',
      'estadoObra', 'dataPrevistaExec',
      'nomeEscritorio', 'detalhesArquiteto',
      'resumo', 'descritivoArea',
      'consultorId', 'dealValue'
    ];

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        // Tratar valores vazios como null para campos opcionais
        const value = req.body[field];
        updateData[field] = value === '' ? null : value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const comercial = await prisma.comercialData.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
      },
    });

    // Invalidar cache após atualização
    invalidateComercialCache();

    res.json({ success: true, data: comercial });
  } catch (error: any) {
    console.error('[Comercial] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/:id/status - Update status (move in pipeline)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status: inputStatus, motivoPerda } = req.body;

    const oldData = await prisma.comercialData.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!oldData) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // Mapear o status recebido (pode ser nome do Pipedrive ou enum)
    const enumStatus = getStatusFromStageName(inputStatus);
    // O stageName é o inputStatus se for um nome do Pipedrive válido
    const stageName = stageNameToStatus[inputStatus] ? inputStatus : oldData.stageName;

    const updateData: any = {
      status: enumStatus,
      stageName: stageName,
      stageChangeTime: new Date(),
    };

    if (enumStatus === 'GANHO') {
      updateData.dataGanho = new Date();
      updateData.dealStatus = 'won';
    } else if (enumStatus === 'PERDIDO') {
      updateData.dataPerda = new Date();
      updateData.motivoPerda = motivoPerda;
      updateData.dealStatus = 'lost';
    } else {
      updateData.dealStatus = 'open';
    }

    const comercial = await prisma.comercialData.update({
      where: { id },
      data: updateData,
    });

    // Create timeline event only if there's a project associated
    if (oldData.projectId) {
      await prisma.timelineEvent.create({
        data: {
          projectId: oldData.projectId,
          modulo: 'COMERCIAL',
          tipo: 'STATUS_CHANGE',
          titulo: `Status alterado para ${stageName} (${enumStatus})`,
          descricao: enumStatus === 'PERDIDO' ? motivoPerda : undefined,
          dadosAnteriores: { status: oldData.status, stageName: oldData.stageName },
          dadosNovos: { status: enumStatus, stageName },
        },
      });
    }

    // If GANHO, update project module and create contract with proposal data
    if (enumStatus === 'GANHO') {
      // Get the approved proposal (or latest)
      const proposta = await prisma.proposta.findFirst({
        where: { comercialId: id },
        orderBy: [
          { status: 'asc' }, // APROVADA comes first
          { versao: 'desc' },
        ],
      });

      // Update project to PIUI module
      await prisma.project.update({
        where: { id: oldData.projectId },
        data: {
          currentModule: 'PIUI',
          status: 'EM_EXECUCAO',
        },
      });

      // Check if contract already exists
      const existingContract = await prisma.contrato.findUnique({
        where: { projectId: oldData.projectId },
      });

      if (!existingContract) {
        // Parse metragem from comercialData
        const metragem = oldData.metragemEstimada
          ? parseFloat(oldData.metragemEstimada.replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;

        // Auto-create contract with proposal values
        await prisma.contrato.create({
          data: {
            projectId: oldData.projectId,
            valorContratado: proposta?.valorTotal || 0,
            m2Piso: metragem || 0,
          },
        });
      }

      // Create timeline event for module transition
      await prisma.timelineEvent.create({
        data: {
          projectId: oldData.projectId,
          modulo: 'PIUI',
          tipo: 'PROJETO_INICIADO',
          titulo: 'Projeto iniciado no módulo PIUI',
          descricao: `Valor contratado: R$ ${proposta?.valorTotal?.toFixed(2) || '0'}`,
        },
      });
    }

    // Invalidar cache após mudança de status
    invalidateComercialCache();

    res.json({ success: true, data: comercial });
  } catch (error: any) {
    console.error('[Comercial] Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PROPOSTAS
// =============================================

// POST /comercial/:id/propostas - Create new proposal
router.post('/:id/propostas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { valorTotal, valorM2, desconto, descricao, escopoUrl, validadeAte } = req.body;

    const comercial = await prisma.comercialData.findUnique({
      where: { id },
      include: { propostas: { orderBy: { versao: 'desc' }, take: 1 } },
    });

    if (!comercial) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const nextVersion = (comercial.propostas[0]?.versao || 0) + 1;

    const proposta = await prisma.proposta.create({
      data: {
        comercialId: id,
        versao: nextVersion,
        valorTotal: parseFloat(valorTotal),
        valorM2: valorM2 ? parseFloat(valorM2) : null,
        desconto: desconto ? parseFloat(desconto) : null,
        descricao,
        escopoUrl,
        validadeAte: validadeAte ? new Date(validadeAte) : null,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: comercial.projectId,
        modulo: 'COMERCIAL',
        tipo: 'PROPOSTA_CRIADA',
        titulo: `Proposta v${nextVersion} criada`,
        descricao: `Valor: R$ ${valorTotal}`,
      },
    });

    res.json({ success: true, data: proposta });
  } catch (error: any) {
    console.error('[Comercial] Error creating proposal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/propostas/:propostaId/enviar - Send proposal to client
router.put('/propostas/:propostaId/enviar', async (req: Request, res: Response) => {
  try {
    const { propostaId } = req.params;

    const proposta = await prisma.proposta.update({
      where: { id: propostaId },
      data: {
        status: 'ENVIADA',
        enviadaEm: new Date(),
      },
      include: {
        comercial: true,
      },
    });

    // Update comercial status if needed
    if (proposta.comercial.status === 'LEVANTAMENTO') {
      await prisma.comercialData.update({
        where: { id: proposta.comercialId },
        data: { status: 'PROPOSTA_ENVIADA' },
      });
    }

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: proposta.comercial.projectId,
        modulo: 'COMERCIAL',
        tipo: 'PROPOSTA_ENVIADA',
        titulo: `Proposta v${proposta.versao} enviada`,
      },
    });

    res.json({ success: true, data: proposta });
  } catch (error: any) {
    console.error('[Comercial] Error sending proposal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/propostas/:propostaId/aprovar - Approve proposal
router.put('/propostas/:propostaId/aprovar', async (req: Request, res: Response) => {
  try {
    const { propostaId } = req.params;

    const proposta = await prisma.proposta.update({
      where: { id: propostaId },
      data: {
        status: 'APROVADA',
        aprovadaEm: new Date(),
      },
      include: {
        comercial: true,
      },
    });

    // Move to negotiation
    await prisma.comercialData.update({
      where: { id: proposta.comercialId },
      data: { status: 'NEGOCIACAO' },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: proposta.comercial.projectId,
        modulo: 'COMERCIAL',
        tipo: 'PROPOSTA_APROVADA',
        titulo: `Proposta v${proposta.versao} aprovada pelo cliente`,
      },
    });

    res.json({ success: true, data: proposta });
  } catch (error: any) {
    console.error('[Comercial] Error approving proposal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// FOLLOW-UPS
// =============================================

// POST /comercial/:id/followups - Create follow-up
router.post('/:id/followups', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, canal, mensagem, agendadoPara } = req.body;

    const comercial = await prisma.comercialData.findUnique({
      where: { id },
    });

    if (!comercial) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const followUp = await prisma.followUp.create({
      data: {
        comercialId: id,
        tipo: tipo as FollowUpTipo,
        canal: canal as FollowUpCanal,
        mensagem,
        agendadoPara: agendadoPara ? new Date(agendadoPara) : null,
        status: 'AGENDADO',
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: comercial.projectId,
        modulo: 'COMERCIAL',
        tipo: 'FOLLOW_UP_AGENDADO',
        titulo: `Follow-up agendado`,
        descricao: `${tipo} via ${canal} para ${new Date(agendadoPara).toLocaleDateString('pt-BR')}`,
      },
    });

    res.json({ success: true, data: followUp });
  } catch (error: any) {
    console.error('[Comercial] Error creating follow-up:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/followups/:followUpId/realizar - Mark follow-up as done
router.put('/followups/:followUpId/realizar', async (req: Request, res: Response) => {
  try {
    const { followUpId } = req.params;
    const { resultado } = req.body;

    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: 'REALIZADO',
        realizadoEm: new Date(),
        resultado,
      },
      include: {
        comercial: true,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: followUp.comercial.projectId,
        modulo: 'COMERCIAL',
        tipo: 'FOLLOW_UP_REALIZADO',
        titulo: `Follow-up realizado`,
        descricao: resultado,
      },
    });

    res.json({ success: true, data: followUp });
  } catch (error: any) {
    console.error('[Comercial] Error completing follow-up:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/followups/hoje - Today's follow-ups
router.get('/followups/hoje', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followUps = await prisma.followUp.findMany({
      where: {
        status: 'AGENDADO',
        agendadoPara: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        comercial: {
          include: {
            project: {
              select: {
                id: true,
                cliente: true,
              },
            },
          },
        },
      },
      orderBy: { agendadoPara: 'asc' },
    });

    res.json({ success: true, data: followUps });
  } catch (error: any) {
    console.error('[Comercial] Error getting today follow-ups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ANALYTICS
// =============================================

// GET /comercial/analytics - Conversion metrics and performance
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all comercial data for analysis
    const [
      totalDeals,
      ganhos,
      perdidos,
      ganhosThisMonth,
      ganhosLastMonth,
      followUpsPendentes,
      followUpsAtrasados,
      perdidosPorMotivo,
      dealsPorEtapa,
      valorPorEtapa,
    ] = await Promise.all([
      // Total deals
      prisma.comercialData.count(),

      // Total ganhos
      prisma.comercialData.count({ where: { status: 'GANHO' } }),

      // Total perdidos
      prisma.comercialData.count({ where: { status: 'PERDIDO' } }),

      // Ganhos this month
      prisma.comercialData.count({
        where: {
          status: 'GANHO',
          dataGanho: { gte: startOfMonth },
        },
      }),

      // Ganhos last month
      prisma.comercialData.count({
        where: {
          status: 'GANHO',
          dataGanho: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Follow-ups pendentes
      prisma.followUp.count({
        where: { status: 'AGENDADO' },
      }),

      // Follow-ups atrasados
      prisma.followUp.count({
        where: {
          status: 'AGENDADO',
          agendadoPara: { lt: now },
        },
      }),

      // Perdidos por motivo
      prisma.comercialData.groupBy({
        by: ['motivoPerda'],
        where: { status: 'PERDIDO', motivoPerda: { not: null } },
        _count: true,
        orderBy: { _count: { motivoPerda: 'desc' } },
        take: 5,
      }),

      // Deals por etapa
      prisma.comercialData.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Valor por etapa (from proposals)
      prisma.$queryRaw`
        SELECT cd.status, COALESCE(SUM(p.valor_total), 0) as valor
        FROM comercial_data cd
        LEFT JOIN propostas p ON p.comercial_id = cd.id
        GROUP BY cd.status
      `,
    ]);

    // Calculate conversion rate
    const leadsTotal = totalDeals;
    const taxaConversao = leadsTotal > 0 ? ((ganhos / leadsTotal) * 100).toFixed(1) : 0;

    // Calculate average deal value
    const valorMedio = await prisma.proposta.aggregate({
      where: {
        comercial: { status: 'GANHO' },
        status: 'APROVADA',
      },
      _avg: { valorTotal: true },
    });

    // Calculate average time to close
    const tempoMedioResult = await prisma.$queryRaw<{ avg_days: number }[]>`
      SELECT AVG(EXTRACT(DAY FROM (data_ganho - created_at))) as avg_days
      FROM comercial_data
      WHERE status = 'GANHO' AND data_ganho IS NOT NULL
    `;
    const tempoMedioFechamento = tempoMedioResult[0]?.avg_days || 0;

    res.json({
      success: true,
      analytics: {
        // Overview
        totalDeals,
        ganhos,
        perdidos,
        emAndamento: totalDeals - ganhos - perdidos,

        // Conversão
        taxaConversao: parseFloat(taxaConversao as string),
        ganhosThisMonth,
        ganhosLastMonth,
        tendencia: ganhosThisMonth - ganhosLastMonth,

        // Performance
        valorMedioNegocio: valorMedio._avg?.valorTotal || 0,
        tempoMedioFechamento: Math.round(tempoMedioFechamento),

        // Follow-ups
        followUpsPendentes,
        followUpsAtrasados,

        // Detalhes
        perdidosPorMotivo: perdidosPorMotivo.map((p) => ({
          motivo: p.motivoPerda || 'Não informado',
          count: p._count,
        })),
        dealsPorEtapa: dealsPorEtapa.map((d) => ({
          status: d.status,
          count: d._count,
        })),
        valorPorEtapa,
      },
    });
  } catch (error: any) {
    console.error('[Comercial] Error getting analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PIPELINE STAGES (Customizable)
// =============================================

// Default stages for seeding
const DEFAULT_STAGES = [
  // Entrada
  { slug: 'FORM_ORCAMENTO', name: 'Form Orçamento', color: '#6366f1', sortOrder: 1, groupName: 'Entrada', probability: 10, isSystem: true },
  { slug: 'LEAD', name: 'Lead', color: '#8b5cf6', sortOrder: 2, groupName: 'Entrada', probability: 15, isSystem: true },
  { slug: 'QUALIFICACAO', name: 'Qualificação', color: '#a855f7', sortOrder: 3, groupName: 'Entrada', probability: 20, isSystem: true },

  // Contato
  { slug: 'PRIMEIRO_CONTATO', name: '1º Contato', color: '#3b82f6', sortOrder: 4, groupName: 'Contato', probability: 25 },
  { slug: 'CONTATO_ARQUITETO', name: 'Contato Arquiteto', color: '#0ea5e9', sortOrder: 5, groupName: 'Contato', probability: 30 },
  { slug: 'AGUARDANDO_ARQ', name: 'Aguardando Arq.', color: '#06b6d4', sortOrder: 6, groupName: 'Contato', probability: 30 },

  // Levantamento
  { slug: 'LEVANTAMENTO', name: 'Levantamento', color: '#14b8a6', sortOrder: 7, groupName: 'Levantamento', probability: 40 },
  { slug: 'VISITA_AGENDADA', name: 'Visita Agendada', color: '#10b981', sortOrder: 8, groupName: 'Levantamento', probability: 45 },
  { slug: 'VISITA_REALIZADA', name: 'Visita Realizada', color: '#22c55e', sortOrder: 9, groupName: 'Levantamento', probability: 50 },

  // Proposta
  { slug: 'PROPOSTA_EM_ELABORACAO', name: 'Proposta em Elaboração', color: '#eab308', sortOrder: 10, groupName: 'Proposta', probability: 55 },
  { slug: 'PROPOSTA_ENVIADA', name: 'Proposta Enviada', color: '#f59e0b', sortOrder: 11, groupName: 'Proposta', probability: 60 },

  // Follow-up
  { slug: 'FOLLOW_1', name: 'Follow 1', color: '#f97316', sortOrder: 12, groupName: 'Follow-up', probability: 55, autoMoveDays: 3 },
  { slug: 'FOLLOW_2', name: 'Follow 2', color: '#fb923c', sortOrder: 13, groupName: 'Follow-up', probability: 50, autoMoveDays: 5 },
  { slug: 'FOLLOW_3', name: 'Follow 3', color: '#fdba74', sortOrder: 14, groupName: 'Follow-up', probability: 40, autoMoveDays: 7 },
  { slug: 'FOLLOW_4', name: 'Follow 4', color: '#fed7aa', sortOrder: 15, groupName: 'Follow-up', probability: 30, autoMoveDays: 14 },
  { slug: 'FOLLOW_5', name: 'Follow 5 (último)', color: '#fef3c7', sortOrder: 16, groupName: 'Follow-up', probability: 20, autoMoveDays: 30 },

  // Negociação
  { slug: 'NEGOCIACAO', name: 'Negociação', color: '#c9a962', sortOrder: 17, groupName: 'Negociação', probability: 70 },
  { slug: 'AJUSTE_PROPOSTA', name: 'Ajuste de Proposta', color: '#d4b872', sortOrder: 18, groupName: 'Negociação', probability: 75 },

  // Fechamento
  { slug: 'GANHO', name: 'Ganho', color: '#22c55e', sortOrder: 19, groupName: 'Fechamento', probability: 100, isSystem: true, isFinal: true, isWon: true },
  { slug: 'PERDIDO', name: 'Perdido', color: '#ef4444', sortOrder: 20, groupName: 'Fechamento', probability: 0, isSystem: true, isFinal: true, isWon: false },

  // Especiais
  { slug: 'CONGELADO', name: 'Congelado', color: '#64748b', sortOrder: 21, groupName: 'Especiais', probability: 30, isSystem: true },
];

// GET /comercial/stages - Get all pipeline stages config
router.get('/stages', async (_req: Request, res: Response) => {
  try {
    // First try to get stages from database
    let stages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // If no stages exist, return default hardcoded stages (for backwards compatibility)
    if (stages.length === 0) {
      const hardcodedStages = DEFAULT_STAGES.map(s => ({
        id: s.slug,
        name: s.name,
        color: s.color,
        probability: s.probability,
        groupName: s.groupName,
        sortOrder: s.sortOrder,
        isSystem: s.isSystem || false,
        isFinal: s.isFinal || false,
        isWon: s.isWon || false,
      }));
      return res.json({ success: true, stages: hardcodedStages, source: 'hardcoded' });
    }

    res.json({ success: true, stages, source: 'database' });
  } catch (error: any) {
    console.error('[Comercial] Error getting stages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/stages/seed - Seed default stages into database
router.post('/stages/seed', async (_req: Request, res: Response) => {
  try {
    const existingStages = await prisma.pipelineStage.count();

    if (existingStages > 0) {
      return res.status(400).json({
        success: false,
        error: 'Stages already exist. Delete all stages first or use update endpoints.',
      });
    }

    const createdStages = await prisma.$transaction(
      DEFAULT_STAGES.map((stage) =>
        prisma.pipelineStage.create({
          data: {
            slug: stage.slug,
            name: stage.name,
            color: stage.color,
            probability: stage.probability,
            groupName: stage.groupName,
            sortOrder: stage.sortOrder,
            isSystem: stage.isSystem || false,
            isFinal: stage.isFinal || false,
            isWon: stage.isWon || false,
            autoMoveDays: stage.autoMoveDays,
          },
        })
      )
    );

    res.json({
      success: true,
      message: `${createdStages.length} stages created successfully`,
      stages: createdStages,
    });
  } catch (error: any) {
    console.error('[Comercial] Error seeding stages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/stages - Create a new stage
router.post('/stages', async (req: Request, res: Response) => {
  try {
    const { name, slug, color, probability, groupName, groupColor, icon, autoMoveDays, autoMoveToId } = req.body;

    if (!name || !slug || !groupName) {
      return res.status(400).json({
        success: false,
        error: 'name, slug and groupName are required',
      });
    }

    // Get max sortOrder
    const maxOrder = await prisma.pipelineStage.aggregate({
      _max: { sortOrder: true },
    });

    const stage = await prisma.pipelineStage.create({
      data: {
        name,
        slug: slug.toUpperCase().replace(/\s+/g, '_'),
        color: color || '#6366f1',
        probability: probability || 50,
        groupName,
        groupColor,
        icon,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        autoMoveDays,
        autoMoveToId,
      },
    });

    res.json({ success: true, data: stage });
  } catch (error: any) {
    console.error('[Comercial] Error creating stage:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Stage slug already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/stages/:id - Update a stage
router.put('/stages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, probability, groupName, groupColor, icon, autoMoveDays, autoMoveToId, isActive } = req.body;

    const existing = await prisma.pipelineStage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }

    // Can't rename system stages slug
    if (existing.isSystem && req.body.slug && req.body.slug !== existing.slug) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change slug of system stages',
      });
    }

    const stage = await prisma.pipelineStage.update({
      where: { id },
      data: {
        name,
        color,
        probability,
        groupName,
        groupColor,
        icon,
        autoMoveDays,
        autoMoveToId,
        isActive,
      },
    });

    res.json({ success: true, data: stage });
  } catch (error: any) {
    console.error('[Comercial] Error updating stage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /comercial/stages/:id - Delete a stage (soft delete)
router.delete('/stages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.pipelineStage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }

    if (existing.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system stages. You can deactivate them instead.',
      });
    }

    // Soft delete - just mark as inactive
    await prisma.pipelineStage.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Stage deactivated successfully' });
  } catch (error: any) {
    console.error('[Comercial] Error deleting stage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/stages/reorder - Reorder stages
router.put('/stages/reorder', async (req: Request, res: Response) => {
  try {
    const { stages } = req.body; // Array of { id, sortOrder }

    if (!stages || !Array.isArray(stages)) {
      return res.status(400).json({
        success: false,
        error: 'stages array is required',
      });
    }

    await prisma.$transaction(
      stages.map((s: { id: string; sortOrder: number }) =>
        prisma.pipelineStage.update({
          where: { id: s.id },
          data: { sortOrder: s.sortOrder },
        })
      )
    );

    const updatedStages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, stages: updatedStages });
  } catch (error: any) {
    console.error('[Comercial] Error reordering stages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/stages/groups - Get stage groups for grouping UI
router.get('/stages/groups', async (_req: Request, res: Response) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Group stages by groupName
    const groups = stages.reduce((acc: Record<string, any>, stage) => {
      if (!acc[stage.groupName]) {
        acc[stage.groupName] = {
          name: stage.groupName,
          color: stage.groupColor || stage.color,
          stages: [],
        };
      }
      acc[stage.groupName].stages.push(stage);
      return acc;
    }, {});

    res.json({ success: true, groups: Object.values(groups) });
  } catch (error: any) {
    console.error('[Comercial] Error getting stage groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ANALYTICS AVANÇADO - FASE 3
// =============================================

// GET /comercial/analytics/overview - Visão geral com comparativo período anterior
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);

    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

    // Current period stats
    const [currentDeals, currentWon, currentLost, currentProposals] = await Promise.all([
      prisma.comercialData.count({
        where: { createdAt: { gte: currentPeriodStart } }
      }),
      prisma.comercialData.findMany({
        where: {
          status: 'GANHO',
          updatedAt: { gte: currentPeriodStart }
        },
        include: {
          propostas: {
            where: { status: 'APROVADA' },
            orderBy: { versao: 'desc' },
            take: 1
          }
        }
      }),
      prisma.comercialData.count({
        where: {
          status: 'PERDIDO',
          updatedAt: { gte: currentPeriodStart }
        }
      }),
      prisma.proposta.aggregate({
        where: {
          createdAt: { gte: currentPeriodStart },
          comercial: { status: { in: ['PROPOSTA_ENVIADA', 'FOLLOW_UP', 'NEGOCIACAO'] } }
        },
        _sum: { valorTotal: true }
      })
    ]);

    // Previous period stats for comparison
    const [prevDeals, prevWon, prevLost] = await Promise.all([
      prisma.comercialData.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart
          }
        }
      }),
      prisma.comercialData.findMany({
        where: {
          status: 'GANHO',
          updatedAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart
          }
        },
        include: {
          propostas: {
            where: { status: 'APROVADA' },
            orderBy: { versao: 'desc' },
            take: 1
          }
        }
      }),
      prisma.comercialData.count({
        where: {
          status: 'PERDIDO',
          updatedAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart
          }
        }
      })
    ]);

    const currentWonValue = currentWon.reduce((sum, c) =>
      sum + Number(c.propostas[0]?.valorTotal || 0), 0
    );
    const prevWonValue = prevWon.reduce((sum, c) =>
      sum + Number(c.propostas[0]?.valorTotal || 0), 0
    );

    const currentConversion = currentDeals > 0
      ? (currentWon.length / (currentWon.length + currentLost)) * 100
      : 0;
    const prevConversion = prevDeals > 0
      ? (prevWon.length / (prevWon.length + prevLost)) * 100
      : 0;

    const calcChange = (current: number, prev: number) =>
      prev === 0 ? (current > 0 ? 100 : 0) : ((current - prev) / prev) * 100;

    res.json({
      success: true,
      overview: {
        totalDeals: currentDeals,
        totalDealsChange: calcChange(currentDeals, prevDeals),
        wonDeals: currentWon.length,
        wonDealsChange: calcChange(currentWon.length, prevWon.length),
        wonValue: currentWonValue,
        wonValueChange: calcChange(currentWonValue, prevWonValue),
        lostDeals: currentLost,
        lostDealsChange: calcChange(currentLost, prevLost),
        conversionRate: currentConversion,
        conversionRateChange: currentConversion - prevConversion,
        pipelineValue: currentProposals._sum.valorTotal || 0,
        period: days
      }
    });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting overview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/analytics/funnel - Dados do funil de conversão
router.get('/analytics/funnel', async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get stages from pipeline config
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    // Count deals per stage (all time for funnel shape)
    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.comercialData.count({
          where: { status: stage.name as ComercialStatus }
        });
        const value = await prisma.proposta.aggregate({
          where: {
            comercial: { status: stage.name as ComercialStatus },
            status: { in: ['ENVIADA', 'VISUALIZADA', 'APROVADA'] }
          },
          _sum: { valorTotal: true }
        });
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          count,
          value: Number(value._sum.valorTotal || 0),
          probability: stage.probability
        };
      })
    );

    // Calculate percentages relative to first stage
    const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
    const funnelData = stageCounts.map((stage, index) => ({
      ...stage,
      percentage: (stage.count / maxCount) * 100,
      conversionFromPrev: index === 0 ? 100 :
        stageCounts[index - 1].count > 0
          ? (stage.count / stageCounts[index - 1].count) * 100
          : 0
    }));

    res.json({ success: true, funnel: funnelData });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting funnel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/analytics/forecast - Previsão de receita (30/60/90 dias)
router.get('/analytics/forecast', async (_req: Request, res: Response) => {
  try {
    // Get all active deals with proposals
    const activeDeals = await prisma.comercialData.findMany({
      where: {
        status: { notIn: ['GANHO', 'PERDIDO'] }
      },
      include: {
        propostas: {
          where: { status: { in: ['ENVIADA', 'VISUALIZADA'] } },
          orderBy: { versao: 'desc' },
          take: 1
        }
      }
    });

    // Get stage probabilities
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true }
    });
    const stageProbabilities = new Map(stages.map(s => [s.name, Number(s.probability)]));

    // Calculate weighted forecast
    let forecast30 = 0;
    let forecast60 = 0;
    let forecast90 = 0;

    const dealBreakdown = activeDeals.map(deal => {
      const proposalValue = Number(deal.propostas[0]?.valorTotal || 0);
      const probability = stageProbabilities.get(deal.status) || 50;
      const weightedValue = proposalValue * (probability / 100);

      // Simple heuristic: earlier stages → longer to close
      const stageIndex = stages.findIndex(s => s.name === deal.status);
      const daysToClose = (stages.length - stageIndex) * 10; // ~10 days per stage

      if (daysToClose <= 30) forecast30 += weightedValue;
      if (daysToClose <= 60) forecast60 += weightedValue;
      if (daysToClose <= 90) forecast90 += weightedValue;

      return {
        id: deal.id,
        status: deal.status,
        proposalValue,
        probability,
        weightedValue,
        estimatedDaysToClose: daysToClose
      };
    });

    // Get historical average for comparison
    const last90DaysWon = await prisma.comercialData.findMany({
      where: {
        status: 'GANHO',
        updatedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      include: {
        propostas: {
          where: { status: 'APROVADA' },
          take: 1
        }
      }
    });
    const avgMonthlyRevenue = last90DaysWon.reduce(
      (sum, d) => sum + Number(d.propostas[0]?.valorTotal || 0), 0
    ) / 3;

    res.json({
      success: true,
      forecast: {
        days30: { value: forecast30, deals: dealBreakdown.filter(d => d.estimatedDaysToClose <= 30).length },
        days60: { value: forecast60, deals: dealBreakdown.filter(d => d.estimatedDaysToClose <= 60).length },
        days90: { value: forecast90, deals: dealBreakdown.filter(d => d.estimatedDaysToClose <= 90).length },
        avgMonthlyRevenue,
        breakdown: dealBreakdown
      }
    });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting forecast:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/analytics/performance - Performance por consultor/vendedor
router.get('/analytics/performance', async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Group deals by consultant
    const dealsWithConsultants = await prisma.comercialData.findMany({
      where: {
        updatedAt: { gte: startDate }
      },
      include: {
        project: { select: { consultor: true } },
        propostas: {
          orderBy: { versao: 'desc' },
          take: 1
        }
      }
    });

    const performanceMap = new Map<string, {
      consultant: string;
      totalDeals: number;
      wonDeals: number;
      lostDeals: number;
      totalValue: number;
      wonValue: number;
      avgCycleTime: number;
      cycleTimes: number[];
    }>();

    for (const deal of dealsWithConsultants) {
      const consultant = deal.project?.consultor || 'Não atribuído';

      if (!performanceMap.has(consultant)) {
        performanceMap.set(consultant, {
          consultant,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          wonValue: 0,
          avgCycleTime: 0,
          cycleTimes: []
        });
      }

      const stats = performanceMap.get(consultant)!;
      stats.totalDeals++;
      stats.totalValue += Number(deal.propostas[0]?.valorTotal || 0);

      if (deal.status === 'GANHO') {
        stats.wonDeals++;
        stats.wonValue += Number(deal.propostas[0]?.valorTotal || 0);
        const cycleTime = Math.floor(
          (deal.updatedAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        stats.cycleTimes.push(cycleTime);
      } else if (deal.status === 'PERDIDO') {
        stats.lostDeals++;
      }
    }

    const performance = Array.from(performanceMap.values()).map(stats => ({
      consultant: stats.consultant,
      totalDeals: stats.totalDeals,
      wonDeals: stats.wonDeals,
      lostDeals: stats.lostDeals,
      activeDeals: stats.totalDeals - stats.wonDeals - stats.lostDeals,
      conversionRate: stats.totalDeals > 0
        ? (stats.wonDeals / (stats.wonDeals + stats.lostDeals || 1)) * 100
        : 0,
      totalValue: stats.totalValue,
      wonValue: stats.wonValue,
      avgCycleTime: stats.cycleTimes.length > 0
        ? Math.round(stats.cycleTimes.reduce((a, b) => a + b, 0) / stats.cycleTimes.length)
        : 0
    })).sort((a, b) => b.wonValue - a.wonValue);

    res.json({ success: true, performance });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/analytics/cycle-time - Tempo médio em cada etapa
router.get('/analytics/cycle-time', async (req: Request, res: Response) => {
  try {
    const { period = '90' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all closed deals to analyze cycle time
    const closedDeals = await prisma.comercialData.findMany({
      where: {
        status: { in: ['GANHO', 'PERDIDO'] },
        updatedAt: { gte: startDate }
      },
      include: {
        followUps: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Get pipeline stages
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    // Calculate average time in each stage (simplified - based on status change timestamps)
    const stageStats = stages.map(stage => {
      const dealsInStage = closedDeals.filter(d => {
        // Check if deal passed through this stage via follow-up history
        return d.followUps.some(f => f.resultado?.includes(stage.name));
      });

      // Average cycle time for deals that passed this stage
      const avgTime = dealsInStage.length > 0
        ? Math.round(
            dealsInStage.reduce((sum, deal) => {
              const daysDiff = Math.floor(
                (deal.updatedAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + daysDiff / stages.length; // Rough estimate per stage
            }, 0) / dealsInStage.length
          )
        : 0;

      return {
        id: stage.id,
        name: stage.name,
        color: stage.color,
        avgDays: avgTime,
        dealsCount: dealsInStage.length
      };
    });

    // Overall cycle time for won deals
    const wonDeals = closedDeals.filter(d => d.status === 'GANHO');
    const avgOverallCycleTime = wonDeals.length > 0
      ? Math.round(
          wonDeals.reduce((sum, deal) => {
            return sum + Math.floor(
              (deal.updatedAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
          }, 0) / wonDeals.length
        )
      : 0;

    res.json({
      success: true,
      cycleTime: {
        overall: avgOverallCycleTime,
        stages: stageStats,
        period: days,
        sampleSize: closedDeals.length
      }
    });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting cycle time:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/analytics/lost-reasons - Motivos de perda
router.get('/analytics/lost-reasons', async (req: Request, res: Response) => {
  try {
    const { period = '90' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const lostDeals = await prisma.comercialData.findMany({
      where: {
        status: 'PERDIDO',
        updatedAt: { gte: startDate }
      },
      include: {
        propostas: {
          orderBy: { versao: 'desc' },
          take: 1
        }
      }
    });

    // Group by motivo perda
    const reasonMap = new Map<string, { count: number; value: number }>();

    for (const deal of lostDeals) {
      const reason = deal.motivoPerda || 'Não especificado';

      if (!reasonMap.has(reason)) {
        reasonMap.set(reason, { count: 0, value: 0 });
      }

      const stats = reasonMap.get(reason)!;
      stats.count++;
      stats.value += Number(deal.propostas[0]?.valorTotal || 0);
    }

    const reasons = Array.from(reasonMap.entries())
      .map(([reason, stats]) => ({
        reason,
        count: stats.count,
        value: stats.value,
        percentage: lostDeals.length > 0 ? (stats.count / lostDeals.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      lostReasons: {
        total: lostDeals.length,
        totalValue: lostDeals.reduce((sum, d) => sum + Number(d.propostas[0]?.valorTotal || 0), 0),
        reasons,
        period: days
      }
    });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting lost reasons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/analytics/trends - Tendências ao longo do tempo
router.get('/analytics/trends', async (req: Request, res: Response) => {
  try {
    const { period = '90', interval = 'week' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get deals grouped by week/month
    const deals = await prisma.comercialData.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        propostas: {
          orderBy: { versao: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by interval
    const intervalMs = interval === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const buckets = new Map<string, {
      date: string;
      newDeals: number;
      wonDeals: number;
      lostDeals: number;
      value: number;
    }>();

    let currentDate = new Date(startDate);
    while (currentDate <= new Date()) {
      const bucketKey = currentDate.toISOString().split('T')[0];
      buckets.set(bucketKey, {
        date: bucketKey,
        newDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        value: 0
      });
      currentDate = new Date(currentDate.getTime() + intervalMs);
    }

    for (const deal of deals) {
      const dealDate = deal.createdAt.toISOString().split('T')[0];
      // Find closest bucket
      let closestBucket = '';
      let minDiff = Infinity;
      for (const key of buckets.keys()) {
        const diff = Math.abs(new Date(key).getTime() - new Date(dealDate).getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestBucket = key;
        }
      }

      if (closestBucket && buckets.has(closestBucket)) {
        const bucket = buckets.get(closestBucket)!;
        bucket.newDeals++;
        bucket.value += Number(deal.propostas[0]?.valorTotal || 0);
        if (deal.status === 'GANHO') bucket.wonDeals++;
        if (deal.status === 'PERDIDO') bucket.lostDeals++;
      }
    }

    res.json({
      success: true,
      trends: Array.from(buckets.values())
    });
  } catch (error: any) {
    console.error('[Comercial Analytics] Error getting trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// LEAD SCORING - FASE 4
// =============================================

// GET /comercial/scoring/rules - List all scoring rules
router.get('/scoring/rules', async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await prisma.leadScoringRule.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { category: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({ success: true, rules });
  } catch (error: any) {
    console.error('[Lead Scoring] Error listing rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/scoring/rules/:id - Get single rule
router.get('/scoring/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await prisma.leadScoringRule.findUnique({ where: { id } });

    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    res.json({ success: true, rule });
  } catch (error: any) {
    console.error('[Lead Scoring] Error getting rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/scoring/rules - Create new rule
router.post('/scoring/rules', async (req: Request, res: Response) => {
  try {
    const { name, description, category, condition, points, maxPoints, priority } = req.body;

    const rule = await prisma.leadScoringRule.create({
      data: {
        name,
        description,
        category,
        condition,
        points: points || 10,
        maxPoints,
        priority: priority || 0
      }
    });

    res.json({ success: true, rule });
  } catch (error: any) {
    console.error('[Lead Scoring] Error creating rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/scoring/rules/:id - Update rule
router.put('/scoring/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, condition, points, maxPoints, priority, isActive } = req.body;

    const rule = await prisma.leadScoringRule.update({
      where: { id },
      data: {
        name,
        description,
        category,
        condition,
        points,
        maxPoints,
        priority,
        isActive
      }
    });

    res.json({ success: true, rule });
  } catch (error: any) {
    console.error('[Lead Scoring] Error updating rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /comercial/scoring/rules/:id - Delete rule
router.delete('/scoring/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.leadScoringRule.delete({ where: { id } });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error: any) {
    console.error('[Lead Scoring] Error deleting rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/scoring/rules/seed - Seed default rules
router.post('/scoring/rules/seed', async (_req: Request, res: Response) => {
  try {
    const defaultRules = [
      // FIT - Perfil do cliente
      { name: 'Cliente Final', category: 'FIT', condition: { field: 'tipoCliente', operator: 'equals', value: 'FINAL' }, points: 20, priority: 10 },
      { name: 'Cliente Arquiteto', category: 'FIT', condition: { field: 'tipoCliente', operator: 'equals', value: 'ARQUITETO' }, points: 15, priority: 10 },
      { name: 'Área > 100m²', category: 'FIT', condition: { field: 'm2Total', operator: 'gte', value: 100 }, points: 15, priority: 5 },
      { name: 'Área > 500m²', category: 'FIT', condition: { field: 'm2Total', operator: 'gte', value: 500 }, points: 25, priority: 6 },
      { name: 'Valor > R$50k', category: 'FIT', condition: { field: 'valorEstimado', operator: 'gte', value: 50000 }, points: 20, priority: 5 },

      // ENGAGEMENT - Interações
      { name: 'Respondeu WhatsApp', category: 'ENGAGEMENT', condition: { field: 'followupRespondido', operator: 'equals', value: true }, points: 10, priority: 10 },
      { name: 'Agendou visita', category: 'ENGAGEMENT', condition: { field: 'visitaAgendada', operator: 'equals', value: true }, points: 25, priority: 10 },
      { name: 'Visualizou proposta', category: 'ENGAGEMENT', condition: { field: 'propostaVisualizada', operator: 'equals', value: true }, points: 15, priority: 10 },
      { name: 'Pediu ajustes na proposta', category: 'ENGAGEMENT', condition: { field: 'propostaAjustada', operator: 'equals', value: true }, points: 20, priority: 10 },

      // BEHAVIOR - Comportamento
      { name: 'Originou de indicação', category: 'BEHAVIOR', condition: { field: 'origem', operator: 'equals', value: 'INDICACAO' }, points: 20, priority: 5 },
      { name: 'Teve contato rápido', category: 'BEHAVIOR', condition: { field: 'diasAtePrimeiroContato', operator: 'lte', value: 1 }, points: 15, priority: 5 },
      { name: 'Projeto em andamento', category: 'BEHAVIOR', condition: { field: 'faseObraAtual', operator: 'equals', value: 'EM_ANDAMENTO' }, points: 15, priority: 5 },

      // TIME - Timing
      { name: 'Deadline próximo', category: 'TIME', condition: { field: 'diasAteDeadline', operator: 'lte', value: 30 }, points: 20, priority: 10 },
      { name: 'Estagnado há muito tempo', category: 'TIME', condition: { field: 'diasNoEstagio', operator: 'gte', value: 30 }, points: -15, priority: 10 },
      { name: 'Follow-up atrasado', category: 'TIME', condition: { field: 'followupAtrasado', operator: 'equals', value: true }, points: -10, priority: 10 },
    ];

    for (const rule of defaultRules) {
      await prisma.leadScoringRule.upsert({
        where: { id: rule.name.toLowerCase().replace(/\s+/g, '-') },
        update: rule,
        create: {
          ...rule,
          id: rule.name.toLowerCase().replace(/\s+/g, '-')
        }
      });
    }

    res.json({ success: true, message: 'Default rules seeded', count: defaultRules.length });
  } catch (error: any) {
    console.error('[Lead Scoring] Error seeding rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/:id/score - Calculate and return lead score for a deal
router.get('/:id/score', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get comercial data
    const comercial = await prisma.comercialData.findUnique({
      where: { id },
      include: {
        project: true,
        propostas: {
          orderBy: { versao: 'desc' },
          take: 1
        },
        followUps: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!comercial) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    // Get active rules
    const rules = await prisma.leadScoringRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    // Calculate scores by category
    const scores = { FIT: 0, ENGAGEMENT: 0, BEHAVIOR: 0, TIME: 0 };
    const appliedRules: { ruleId: string; ruleName: string; points: number }[] = [];

    // Build context object for rule evaluation
    const context = {
      tipoCliente: comercial.tipoCliente,
      m2Total: comercial.project?.m2Total || 0,
      valorEstimado: Number(comercial.propostas[0]?.valorTotal || 0),
      origem: comercial.origem,
      diasNoEstagio: Math.floor((Date.now() - comercial.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
      followupAtrasado: comercial.followUps.some(f =>
        f.status === 'AGENDADO' && new Date(f.agendadoPara) < new Date()
      ),
      visitaAgendada: comercial.followUps.some(f => f.canal === 'PRESENCIAL' && f.status === 'AGENDADO'),
      propostaVisualizada: comercial.propostas.some(p => p.status === 'VISUALIZADA'),
      followupRespondido: comercial.followUps.some(f => f.status === 'REALIZADO'),
      faseObraAtual: comercial.project?.currentModule
    };

    // Evaluate each rule
    for (const rule of rules) {
      const condition = rule.condition as { field: string; operator: string; value: any };
      const fieldValue = (context as any)[condition.field];
      let matches = false;

      switch (condition.operator) {
        case 'equals':
          matches = fieldValue === condition.value;
          break;
        case 'gte':
          matches = fieldValue >= condition.value;
          break;
        case 'lte':
          matches = fieldValue <= condition.value;
          break;
        case 'gt':
          matches = fieldValue > condition.value;
          break;
        case 'lt':
          matches = fieldValue < condition.value;
          break;
        case 'contains':
          matches = String(fieldValue).includes(condition.value);
          break;
        case 'exists':
          matches = fieldValue !== undefined && fieldValue !== null;
          break;
      }

      if (matches) {
        const category = rule.category as keyof typeof scores;
        const points = Math.min(rule.points, rule.maxPoints || rule.points);
        scores[category] = (scores[category] || 0) + points;
        appliedRules.push({ ruleId: rule.id, ruleName: rule.name, points });
      }
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    // Save to history
    await prisma.leadScoreHistory.create({
      data: {
        comercialId: id,
        totalScore,
        fitScore: scores.FIT,
        engagementScore: scores.ENGAGEMENT,
        behaviorScore: scores.BEHAVIOR,
        timeScore: scores.TIME,
        rulesApplied: appliedRules
      }
    });

    res.json({
      success: true,
      score: {
        total: totalScore,
        fit: scores.FIT,
        engagement: scores.ENGAGEMENT,
        behavior: scores.BEHAVIOR,
        time: scores.TIME,
        appliedRules,
        calculatedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('[Lead Scoring] Error calculating score:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/:id/score/history - Get score history for a deal
router.get('/:id/score/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10' } = req.query;

    const history = await prisma.leadScoreHistory.findMany({
      where: { comercialId: id },
      orderBy: { calculatedAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ success: true, history });
  } catch (error: any) {
    console.error('[Lead Scoring] Error getting history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/scoring/recalculate-all - Recalculate scores for all deals
router.post('/scoring/recalculate-all', async (_req: Request, res: Response) => {
  try {
    const deals = await prisma.comercialData.findMany({
      where: { status: { notIn: ['GANHO', 'PERDIDO'] } },
      select: { id: true }
    });

    let updated = 0;
    for (const deal of deals) {
      // This is simplified - in production you'd batch these
      try {
        // Trigger score calculation by making internal call
        const comercial = await prisma.comercialData.findUnique({
          where: { id: deal.id },
          include: {
            project: true,
            propostas: { orderBy: { versao: 'desc' }, take: 1 },
            followUps: { orderBy: { createdAt: 'desc' } }
          }
        });

        if (!comercial) continue;

        const rules = await prisma.leadScoringRule.findMany({
          where: { isActive: true }
        });

        // Simple scoring (abbreviated version)
        const context = {
          tipoCliente: comercial.tipoCliente,
          m2Total: comercial.project?.m2Total || 0,
          diasNoEstagio: Math.floor((Date.now() - comercial.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        };

        let totalScore = 0;
        for (const rule of rules) {
          const cond = rule.condition as any;
          if ((context as any)[cond.field] !== undefined) {
            totalScore += rule.points;
          }
        }

        // Save score to history
        await prisma.leadScoreHistory.create({
          data: {
            comercialId: deal.id,
            totalScore: Math.max(0, totalScore),
            fitScore: 0,
            engagementScore: 0,
            behaviorScore: 0,
            timeScore: 0,
            rulesApplied: []
          }
        });

        updated++;
      } catch (e) {
        console.error(`Error updating deal ${deal.id}:`, e);
      }
    }

    res.json({ success: true, message: `Recalculated ${updated} deals` });
  } catch (error: any) {
    console.error('[Lead Scoring] Error recalculating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// REPROCESS METRAGEM WITH AI
// =============================================

// POST /comercial/reprocess-metragem - Reprocess descritivoArea with AI to extract metragem
router.post('/reprocess-metragem', async (req: Request, res: Response) => {
  try {
    const { limit = 100, dryRun = false, stageFilter } = req.body;

    console.log(`[Metragem AI] Starting reprocess (limit=${limit}, dryRun=${dryRun})`);

    // Find leads with descritivoArea but metragemEstimada is textual (contains 'de ' or 'm2')
    const where: any = {
      descritivoArea: { not: null },
      OR: [
        { metragemEstimada: { contains: 'de ' } },
        { metragemEstimada: { endsWith: 'm2' } },
        { metragemEstimada: { endsWith: 'm²' } },
        { metragemEstimada: null },
      ],
    };

    if (stageFilter) {
      where.stageName = stageFilter;
    }

    const leads = await prisma.comercialData.findMany({
      where,
      select: {
        id: true,
        personName: true,
        descritivoArea: true,
        metragemEstimada: true,
        metragemEstimadaN1: true,
        projectId: true,
      },
      take: parseInt(limit),
      orderBy: { dealAddTime: 'desc' },
    });

    console.log(`[Metragem AI] Found ${leads.length} leads to process`);

    const results: any[] = [];
    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const lead of leads) {
      try {
        const descritivoArea = lead.descritivoArea as string;

        // Get fallback from faixa
        let fallbackMetragem = 150;
        if (lead.metragemEstimadaN1) {
          const faixaMatch = lead.metragemEstimadaN1.match(/(\d+)/);
          if (faixaMatch) {
            fallbackMetragem = parseInt(faixaMatch[1]);
          }
        }

        console.log(`[Metragem AI] Processing ${lead.personName}: "${descritivoArea.substring(0, 50)}..."`);

        const metragemExtraida = await gptService.extractMetragemFromDescription(
          descritivoArea,
          fallbackMetragem
        );

        const result = {
          id: lead.id,
          nome: lead.personName,
          descritivoArea: descritivoArea.substring(0, 100),
          metragemAnterior: lead.metragemEstimada,
          metragemNova: metragemExtraida,
        };

        results.push(result);
        processed++;

        if (!dryRun && metragemExtraida > 0) {
          // Update comercialData
          await prisma.comercialData.update({
            where: { id: lead.id },
            data: { metragemEstimada: metragemExtraida.toString() },
          });

          // Update project m2Total if exists
          if (lead.projectId) {
            await prisma.project.update({
              where: { id: lead.projectId },
              data: { m2Total: metragemExtraida },
            });
          }

          updated++;
          console.log(`[Metragem AI] ✅ Updated ${lead.personName}: ${metragemExtraida}m²`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`[Metragem AI] ❌ Error processing ${lead.personName}:`, error.message);
        errors++;
      }
    }

    // Invalidate cache after updates
    if (!dryRun && updated > 0) {
      invalidateComercialCache();
    }

    res.json({
      success: true,
      message: dryRun ? 'Dry run complete' : `Processed ${processed}, updated ${updated} leads`,
      stats: { found: leads.length, processed, updated, errors },
      results,
    });

  } catch (error: any) {
    console.error('[Metragem AI] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// REPROCESS PRIMEIRO NOME Z-API
// =============================================

/**
 * Formata o primeiro nome para Z-API
 * Ex: "ALTAIR DA SILVA" → "Altair"
 * Ex: "joão pedro" → "João"
 */
function formatPrimeiroNome(nomeCompleto: string | null | undefined): string {
  if (!nomeCompleto) return '';
  const primeiroNome = nomeCompleto.trim().split(/\s+/)[0];
  if (!primeiroNome) return '';
  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

// POST /comercial/reprocess-primeiro-nome - Reprocess personName to extract primeiroNomeZapi
router.post('/reprocess-primeiro-nome', async (req: Request, res: Response) => {
  try {
    const { limit = 1000, dryRun = false } = req.body;

    console.log(`[Primeiro Nome] Starting reprocess (limit=${limit}, dryRun=${dryRun})`);

    // Find leads where primeiroNomeZapi might need fixing
    const leads = await prisma.comercialData.findMany({
      where: {
        personName: { not: null },
      },
      select: {
        id: true,
        personName: true,
        primeiroNomeZapi: true,
      },
      take: parseInt(limit),
      orderBy: { dealAddTime: 'desc' },
    });

    console.log(`[Primeiro Nome] Found ${leads.length} leads to check`);

    const results: any[] = [];
    let updated = 0;
    let skipped = 0;

    for (const lead of leads) {
      const personName = lead.personName || '';
      const novoNome = formatPrimeiroNome(personName);
      const nomeAtual = lead.primeiroNomeZapi || '';

      // Skip if already correct
      if (nomeAtual === novoNome) {
        skipped++;
        continue;
      }

      results.push({
        id: lead.id,
        personName,
        antes: nomeAtual,
        depois: novoNome,
      });

      if (!dryRun) {
        await prisma.comercialData.update({
          where: { id: lead.id },
          data: { primeiroNomeZapi: novoNome },
        });
        updated++;
      }
    }

    // Invalidate cache after updates
    if (!dryRun && updated > 0) {
      invalidateComercialCache();
    }

    res.json({
      success: true,
      message: dryRun ? 'Dry run complete' : `Updated ${updated} leads`,
      stats: { checked: leads.length, updated, skipped, needsUpdate: results.length },
      results: results.slice(0, 50), // Limit results in response
    });

  } catch (error: any) {
    console.error('[Primeiro Nome] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ROUTES WITH :id PARAMETER (MUST BE LAST)
// =============================================

// GET /comercial/:id - Get single comercial data
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comercial = await prisma.comercialData.findUnique({
      where: { id },
      include: {
        project: true,
        propostas: {
          orderBy: { versao: 'desc' },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!comercial) {
      return res.status(404).json({ success: false, error: 'Comercial data not found' });
    }

    res.json({ success: true, data: comercial });
  } catch (error: any) {
    console.error('[Comercial] Error getting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// EXCEL IMPORT
// =============================================

const upload = multer({ storage: multer.memoryStorage() });

// Mapeamento padrão de colunas do Pipedrive para ComercialData
// Formato exato do export Pipedrive em português
const DEFAULT_COLUMN_MAPPING: Record<string, string> = {
  // Identificação
  'Negócio - ID': 'pipedriveDealId',
  'Negócio - Título': 'titulo',
  'Negócio - Etiqueta': 'labelPipedrive',

  // Contato - Pessoa
  'Pessoa - Nome': 'personName',
  'Negócio - Pessoa de contato': 'personName', // fallback
  'Pessoa - Telefone': 'personPhone',
  'Pessoa - Telefone - Celular': 'personPhone', // fallback
  'Pessoa - E-mail - Trabalho': 'personEmail',

  // Valores
  'Negócio - Valor': 'dealValue',

  // Estágio e Pipeline
  'Negócio - Etapa': 'stageName',
  'Negócio - Funil': 'pipelineName',
  'Negócio - Status': 'dealStatus',

  // Datas
  'Negócio - Negócio criado em': 'dealAddTime',
  'Negócio - Atualizado em': 'dealUpdateTime',
  'Negócio - Última alteração de etapa': 'stageChangeTime',
  'Negócio - Ganho em': 'wonTime',
  'Negócio - Data de perda': 'lostTime',

  // Responsável
  'Negócio - Proprietário': 'ownerUserName',
  'Negócio - Criado por': 'creatorUserName',

  // Campos customizados Monofloor
  'Negócio - Tipo de cliente': 'tipoCliente',
  'Negócio - Tipo de projeto': 'tipoProjeto',
  'Negócio - Cidade de execução': 'cidadeExecucao',
  'Negócio - Cidade de execução (descritivo)': 'cidadeExecucaoDesc',
  'Negócio - Nome do escritório / Empresa de engenharia': 'nomeEscritorio',
  'Negócio - Metragem estimada': 'metragemEstimada',
  'Negócio - Metragem estimada N1': 'metragemEstimadaN1',
  'Negócio - Metragem estimada (sem arquiteto)': 'metragemSemArq',
  'Negócio - Budget estimado': 'budgetEstimado',
  'Negócio - Qual estado de obra': 'estadoObra',
  'Negócio - Data prevista de execução': 'dataPrevistaExec',
  'Negócio - Descritivo de área': 'descritivoArea',
  'Negócio - Detalhes (com arquiteto)': 'detalhesArquiteto',

  // Campos Z-API para integração WhatsApp
  'Negócio - Primeiro Nome Para Z-API': 'primeiroNomeZapi',
  'Negócio - Telefone Processado Z-API': 'telefoneZapi',

  // Campos Pessoa extras
  'Pessoa - Tem arquiteto?': 'temArquiteto',
  'Pessoa - Nome do escritório': 'escritorio',
};

// POST /comercial/import - Import from Excel
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    console.log('[Import] Recebendo arquivo:', req.file.originalname);

    // Parse Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (rawData.length < 2) {
      return res.status(400).json({ success: false, error: 'Arquivo vazio ou sem dados' });
    }

    // Headers (primeira linha)
    const headers = rawData[0] as string[];
    const rows = rawData.slice(1);

    console.log('[Import] Headers encontrados:', headers);
    console.log('[Import] Total de linhas:', rows.length);

    // Custom mapping from request body (optional)
    const customMapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    const columnMapping = { ...DEFAULT_COLUMN_MAPPING, ...customMapping };

    // Mapear índices das colunas
    const columnIndexes: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedField = columnMapping[header];
      if (mappedField) {
        columnIndexes[mappedField] = index;
      }
    });

    console.log('[Import] Colunas mapeadas:', Object.keys(columnIndexes));

    // Importar dados
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Extrair dados da linha
        const getValue = (field: string) => {
          const idx = columnIndexes[field];
          return idx !== undefined ? row[idx] : null;
        };

        const personName = getValue('personName');
        const titulo = getValue('titulo');

        // Pular linhas vazias
        if (!personName && !titulo) {
          skipped++;
          continue;
        }

        // Determinar status baseado no estágio
        const stageName = getValue('stageName')?.toString() || '';
        const dealStatus = getValue('dealStatus')?.toString() || '';

        let status: ComercialStatus = 'LEAD';
        // Status em português do Pipedrive: "Ganho", "Perdido", "Aberto"
        if (dealStatus.toLowerCase() === 'ganho' || dealStatus === 'won' || stageName.toLowerCase().includes('ganho')) {
          status = 'GANHO';
        } else if (dealStatus.toLowerCase() === 'perdido' || dealStatus === 'lost' || stageName.toLowerCase().includes('perdido')) {
          status = 'PERDIDO';
        } else if (stageName.toLowerCase().includes('proposta')) {
          status = 'PROPOSTA_ENVIADA';
        } else if (stageName.toLowerCase().includes('negociação') || stageName.toLowerCase().includes('negociacao')) {
          status = 'NEGOCIACAO';
        } else if (stageName.toLowerCase().includes('follow')) {
          status = 'FOLLOW_UP';
        } else if (stageName.toLowerCase().includes('levantamento')) {
          status = 'LEVANTAMENTO';
        } else if (stageName.toLowerCase().includes('contato') || stageName.toLowerCase().includes('arquiteto')) {
          status = 'CONTATO_ARQUITETO';
        } else if (stageName.toLowerCase().includes('primeiro')) {
          status = 'PRIMEIRO_CONTATO';
        }

        // Parse de datas
        const parseDate = (val: any): Date | null => {
          if (!val) return null;
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        };

        // Parse de valor numérico
        const parseNumber = (val: any): number | null => {
          if (!val) return null;
          const n = parseFloat(val.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
          return isNaN(n) ? null : n;
        };

        // Criar registro
        await prisma.comercialData.create({
          data: {
            pipedriveDealId: getValue('pipedriveDealId')?.toString() || null,
            personName: personName?.toString() || titulo?.toString() || 'Sem nome',
            personEmail: getValue('personEmail')?.toString() || null,
            personPhone: getValue('personPhone')?.toString() || null,
            dealValue: parseNumber(getValue('dealValue')),
            stageName: stageName || null,
            dealStatus: dealStatus || null,
            dealAddTime: parseDate(getValue('dealAddTime')),
            dealUpdateTime: parseDate(getValue('dealUpdateTime')),
            stageChangeTime: parseDate(getValue('stageChangeTime')),
            wonTime: parseDate(getValue('wonTime')),
            lostTime: parseDate(getValue('lostTime')),
            ownerUserName: getValue('ownerUserName')?.toString() || null,
            creatorUserName: getValue('creatorUserName')?.toString() || null,
            labelPipedrive: getValue('labelPipedrive')?.toString() || null,
            tipoCliente: getValue('tipoCliente')?.toString() || null,
            tipoProjeto: getValue('tipoProjeto')?.toString() || null,
            cidadeExecucao: getValue('cidadeExecucao')?.toString() || null,
            cidadeExecucaoDesc: getValue('cidadeExecucaoDesc')?.toString() || null,
            nomeEscritorio: getValue('nomeEscritorio')?.toString() || null,
            metragemEstimada: getValue('metragemEstimada')?.toString() || null,
            metragemEstimadaN1: getValue('metragemEstimadaN1')?.toString() || null,
            metragemSemArq: getValue('metragemSemArq')?.toString() || null,
            budgetEstimado: getValue('budgetEstimado')?.toString() || null,
            estadoObra: getValue('estadoObra')?.toString() || null,
            dataPrevistaExec: getValue('dataPrevistaExec')?.toString() || null,
            descritivoArea: getValue('descritivoArea')?.toString() || null,
            detalhesArquiteto: getValue('detalhesArquiteto')?.toString() || null,
            escritorio: getValue('escritorio')?.toString() || null,
            // Campos Z-API para integração WhatsApp
            primeiroNomeZapi: getValue('primeiroNomeZapi')?.toString() || null,
            telefoneZapi: getValue('telefoneZapi')?.toString() || null,
            status,
            pipedriveSyncedAt: new Date(),
          },
        });

        imported++;

        if (imported % 100 === 0) {
          console.log(`[Import] Progresso: ${imported}/${rows.length}`);
        }
      } catch (rowError: any) {
        errors.push(`Linha ${i + 2}: ${rowError.message}`);
        skipped++;
      }
    }

    // Invalidar cache
    comercialCache.clear();

    console.log(`[Import] Concluído: ${imported} importados, ${skipped} pulados`);

    res.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 10), // Primeiros 10 erros
      mappedColumns: Object.keys(columnIndexes),
      unmappedHeaders: headers.filter(h => !columnMapping[h]),
    });
  } catch (error: any) {
    console.error('[Import] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/import/template - Download template with column mapping
router.get('/import/template', (_req: Request, res: Response) => {
  res.json({
    success: true,
    mapping: DEFAULT_COLUMN_MAPPING,
    instructions: {
      pt: 'Exporte seus deals do Pipedrive em Excel e faça upload. O sistema vai mapear automaticamente as colunas conhecidas.',
      supportedColumns: Object.keys(DEFAULT_COLUMN_MAPPING),
    },
  });
});

// =============================================
// PRECIFICAÇÃO AUTOMÁTICA
// =============================================

// Tabela de preços base por faixa de metragem
const PRICING_TABLE: Record<string, { midpoint: number; pricePerM2: number }> = {
  // Faixas padrão do Typeform/Pipedrive
  'abaixo de 100m2': { midpoint: 75, pricePerM2: 650 },
  'de 80m2 a 150m2': { midpoint: 115, pricePerM2: 650 },
  'de 100m2 a 250m2': { midpoint: 175, pricePerM2: 650 },
  'de 150m2 a 300m2': { midpoint: 225, pricePerM2: 650 },
  'de 250m2 a 500m2': { midpoint: 375, pricePerM2: 650 },
  'de 300m2 a 500m2': { midpoint: 400, pricePerM2: 650 },
  'de 500m2 a 1000m2': { midpoint: 750, pricePerM2: 650 },
  'acima de 1000m2': { midpoint: 1500, pricePerM2: 650 },
};

// Função para calcular valor baseado na metragem
function calculateDealValue(metragem: string | null): number | null {
  if (!metragem) return null;

  const metLower = metragem.toLowerCase().trim();

  // 1. Tentar match exato na tabela de faixas
  for (const [faixa, config] of Object.entries(PRICING_TABLE)) {
    if (metLower === faixa.toLowerCase() || metLower.includes(faixa.toLowerCase())) {
      return config.midpoint * config.pricePerM2;
    }
  }

  // 2. Tentar extrair número diretamente (ex: "150m²", "300m2", "450")
  const numMatch = metragem.match(/(\d+(?:[.,]\d+)?)\s*m?[²2]?/i);
  if (numMatch) {
    const m2 = parseFloat(numMatch[1].replace(',', '.'));
    if (!isNaN(m2) && m2 > 0) {
      return m2 * 650; // Preço base R$ 650/m²
    }
  }

  // 3. Tentar extrair faixa (ex: "80 a 150", "150-300")
  const rangeMatch = metragem.match(/(\d+)\s*(?:a|até|-)\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    const midpoint = (min + max) / 2;
    return midpoint * 650;
  }

  return null;
}

// POST /comercial/pricing/calculate - Calcular e atualizar preços automaticamente
router.post('/pricing/calculate', async (req: Request, res: Response) => {
  try {
    const { dryRun = false, onlyWithoutValue = true } = req.body;

    // Buscar deals que precisam de precificação
    const where: any = {};
    if (onlyWithoutValue) {
      where.OR = [{ dealValue: null }, { dealValue: 0 }];
    }
    // Precisa ter alguma metragem
    where.AND = [
      {
        OR: [
          { metragemEstimada: { not: null } },
          { metragemEstimadaN1: { not: null } },
          { metragemSemArq: { not: null } },
        ],
      },
    ];

    const deals = await prisma.comercialData.findMany({
      where,
      select: {
        id: true,
        personName: true,
        metragemEstimada: true,
        metragemEstimadaN1: true,
        metragemSemArq: true,
        dealValue: true,
      },
    });

    console.log(`[Pricing] Encontrados ${deals.length} deals para precificar`);

    let updated = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const deal of deals) {
      // Prioridade: metragemEstimadaN1 > metragemEstimada > metragemSemArq
      const metragem = deal.metragemEstimadaN1 || deal.metragemEstimada || deal.metragemSemArq;
      const calculatedValue = calculateDealValue(metragem);

      if (calculatedValue && calculatedValue > 0) {
        if (!dryRun) {
          await prisma.comercialData.update({
            where: { id: deal.id },
            data: { dealValue: calculatedValue },
          });
        }
        updated++;
        results.push({
          id: deal.id,
          name: deal.personName,
          metragem,
          oldValue: deal.dealValue,
          newValue: calculatedValue,
        });
      } else {
        skipped++;
      }
    }

    // Invalidar cache
    if (!dryRun && updated > 0) {
      comercialCache.clear();
    }

    console.log(`[Pricing] ${dryRun ? '[DRY RUN] ' : ''}Atualizados: ${updated}, Pulados: ${skipped}`);

    res.json({
      success: true,
      dryRun,
      updated,
      skipped,
      total: deals.length,
      samples: results.slice(0, 10), // Primeiros 10 exemplos
    });
  } catch (error: any) {
    console.error('[Pricing] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/pricing/table - Ver tabela de preços atual
router.get('/pricing/table', (_req: Request, res: Response) => {
  const table = Object.entries(PRICING_TABLE).map(([faixa, config]) => ({
    faixa,
    pontoMedio: config.midpoint,
    precoM2: config.pricePerM2,
    valorEstimado: config.midpoint * config.pricePerM2,
  }));

  res.json({
    success: true,
    precoBaseM2: 650,
    table,
  });
});

// =============================================
// DISTRIBUIÇÃO AUTOMÁTICA DE LEADS
// =============================================

// GET /comercial/distribution/consultores - Lista consultores disponíveis
router.get('/distribution/consultores', (_req: Request, res: Response) => {
  try {
    const byGroup = leadDistributionService.getConsultoresByGroup();
    const consultores = {
      renata: byGroup.renata,
      joao: byGroup.joao,
      spOutros: byGroup.spOutros,
      all: leadDistributionService.getAllActiveConsultores(),
    };

    res.json({ success: true, consultores });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/distribution/stats - Estatísticas de distribuição
router.get('/distribution/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await leadDistributionService.getDistributionStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/distribution/redistribute - Redistribuir leads sem consultor
router.post('/distribution/redistribute', async (_req: Request, res: Response) => {
  try {
    console.log('[Distribution] Starting redistribution of unassigned leads...');
    const result = await leadDistributionService.redistributeUnassignedLeads();

    // Invalidar cache após redistribuição
    invalidateComercialCache();

    res.json({
      success: true,
      message: `Redistribuídos ${result.distributed} de ${result.total} leads`,
      result,
    });
  } catch (error: any) {
    console.error('[Distribution] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/distribution/consultor/:id/status - Ativar/desativar consultor
router.put('/distribution/consultor/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const success = leadDistributionService.setConsultorActive(id, isActive);

    if (success) {
      res.json({ success: true, message: `Consultor ${id} ${isActive ? 'ativado' : 'desativado'}` });
    } else {
      res.status(404).json({ success: false, error: 'Consultor não encontrado' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/:id/consultor - Atribuir consultor manualmente
router.put('/:id/consultor', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { consultor } = req.body;

    const updated = await prisma.comercialData.update({
      where: { id },
      data: { consultorId: consultor },
    });

    // Invalidar cache
    invalidateComercialCache();

    res.json({
      success: true,
      message: `Consultor atribuído: ${consultor}`,
      deal: updated,
    });
  } catch (error: any) {
    console.error('[Distribution] Error assigning consultor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PROPOSTAS INTEGRADAS
// =============================================

// GET /comercial/:id/propostas - Lista propostas do lead
router.get('/:id/propostas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const propostas = await prisma.proposta.findMany({
      where: { comercialId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        versao: true,
        valorTotal: true,
        valorM2: true,
        metragem: true,
        status: true,
        pdfUrl: true,
        enviadaEm: true,
        createdAt: true,
      },
    });

    res.json({ success: true, propostas });
  } catch (error: any) {
    console.error('[Propostas] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/:id/proposta/gerar - Gera proposta e salva no lead
router.post('/:id/proposta/gerar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      // Metragens
      metrosPiso = 0,
      metrosParede = 0,
      metrosTeto = 0,
      metrosBancadas = 0,
      metrosEscadas = 0,
      metrosEspeciaisPequenos = 0,
      metrosEspeciaisGrandes = 0,
      metrosPiscina = 0,
      // Produtos
      pisoProduto = 'stelion',
      paredeProduto = 'stelion',
      // Preços base
      precoBaseStelion = 910,
      precoBaseLilit = 590,
      // Desconto
      desconto = 0,
    } = req.body;

    // Buscar dados do lead
    const lead = await prisma.comercialData.findUnique({
      where: { id },
      select: {
        id: true,
        personName: true,
        personPhone: true,
        personEmail: true,
        cidadeExecucaoDesc: true,
        metragemEstimada: true,
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    // Calcular metragem total
    const metragemTotal = parseFloat(metrosPiso) + parseFloat(metrosParede) + parseFloat(metrosTeto) +
      parseFloat(metrosBancadas) + parseFloat(metrosEscadas) +
      parseFloat(metrosEspeciaisPequenos) + parseFloat(metrosEspeciaisGrandes) + parseFloat(metrosPiscina);

    // Calcular valores (simplificado - usar preço base STELION)
    const precoM2 = precoBaseStelion;
    let valorTotal = metragemTotal * precoM2;

    // Aplicar desconto
    if (desconto > 0) {
      valorTotal = valorTotal * (1 - desconto / 100);
    }

    // Contar versão
    const versaoAtual = await prisma.proposta.count({
      where: { comercialId: id },
    });

    // Dados do cálculo para salvar
    const dadosCalculo = {
      metrosPiso,
      metrosParede,
      metrosTeto,
      metrosBancadas,
      metrosEscadas,
      metrosEspeciaisPequenos,
      metrosEspeciaisGrandes,
      metrosPiscina,
      pisoProduto,
      paredeProduto,
      precoBaseStelion,
      precoBaseLilit,
      desconto,
      precoM2,
      cliente: lead.personName,
      endereco: lead.cidadeExecucaoDesc,
    };

    // Criar proposta no banco
    const proposta = await prisma.proposta.create({
      data: {
        comercialId: id,
        versao: versaoAtual + 1,
        valorTotal,
        valorM2: precoM2,
        metragem: metragemTotal,
        desconto: desconto || null,
        dadosCalculo,
        status: 'DRAFT',
        validadeAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    // Retornar URL do gerador com dados pré-preenchidos
    const queryParams = new URLSearchParams({
      comercialId: id,
      propostaId: proposta.id,
      nomeCliente: lead.personName || '',
      endereco: lead.cidadeExecucaoDesc || '',
      metrosPiso: String(metrosPiso),
      metrosParede: String(metrosParede),
      metrosTeto: String(metrosTeto),
      metrosBancadas: String(metrosBancadas),
      metrosEscadas: String(metrosEscadas),
      metrosEspeciaisPequenos: String(metrosEspeciaisPequenos),
      metrosEspeciaisGrandes: String(metrosEspeciaisGrandes),
      metrosPiscina: String(metrosPiscina),
    });

    const geradorUrl = `/propostas.html?${queryParams.toString()}`;

    res.json({
      success: true,
      proposta: {
        id: proposta.id,
        versao: proposta.versao,
        valorTotal,
        metragem: metragemTotal,
        precoM2,
      },
      geradorUrl,
    });
  } catch (error: any) {
    console.error('[Propostas] Error generating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/:id/proposta/:propostaId/pdf - Salva PDF da proposta e registra no CRM
router.put('/:id/proposta/:propostaId/pdf', async (req: Request, res: Response) => {
  try {
    const { id, propostaId } = req.params;
    const { pdfBase64, valorTotal, metragem } = req.body;

    // 1. Atualizar proposta com PDF
    const proposta = await prisma.proposta.update({
      where: { id: propostaId },
      data: {
        pdfBase64,
        valorTotal: valorTotal ? parseFloat(valorTotal) : undefined,
        metragem: metragem ? parseFloat(metragem) : undefined,
        status: 'DRAFT',
      },
    });

    // 2. Buscar nome do cliente para o nome do anexo
    const lead = await prisma.comercialData.findUnique({
      where: { id },
      select: { personName: true },
    });

    const nomeCliente = lead?.personName || 'Cliente';
    const dataHoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Proposta-Monofloor-${nomeCliente.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}-${dataHoje}.pdf`;

    // 3. Criar registro de Orçamento Enviado automaticamente
    const orcamentoEnviado = await prisma.orcamentoEnviado.create({
      data: {
        comercialId: id,
        dataEnvio: new Date(),
        valor: valorTotal ? parseFloat(valorTotal) : null,
        metragem: metragem ? parseFloat(metragem) : null,
        descricao: `Proposta v${proposta.versao} gerada`,
        propostaId: propostaId,
      },
    });

    // 4. Anexar PDF ao lead automaticamente
    const anexo = await prisma.comercialAnexo.create({
      data: {
        comercialId: id,
        nome: nomeArquivo,
        tipo: 'PROPOSTA',
        descricao: `Proposta v${proposta.versao} - ${formatCurrencyBR(valorTotal)} - ${metragem || 0}m²`,
        fileData: pdfBase64,
        mimeType: 'application/pdf',
        fileSize: pdfBase64 ? Math.round(pdfBase64.length * 0.75) : 0, // Tamanho aproximado do base64
      },
    });

    console.log(`[Propostas] PDF salvo, orçamento registrado e anexado ao lead ${id}`);

    res.json({
      success: true,
      proposta,
      orcamentoEnviado,
      anexo: { id: anexo.id, nome: anexo.nome },
    });
  } catch (error: any) {
    console.error('[Propostas] Error saving PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Função auxiliar para formatar moeda
function formatCurrencyBR(value: any): string {
  if (!value) return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

// POST /comercial/:id/proposta/:propostaId/enviar-whatsapp - Envia proposta via WhatsApp (com PDF via Z-API)
router.post('/:id/proposta/:propostaId/enviar-whatsapp', async (req: Request, res: Response) => {
  try {
    const { id, propostaId } = req.params;

    // Buscar proposta e lead
    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: {
        comercial: {
          select: {
            personName: true,
            personPhone: true,
            primeiroNomeZapi: true,
          },
        },
      },
    });

    if (!proposta) {
      return res.status(404).json({ success: false, error: 'Proposta não encontrada' });
    }

    if (!proposta.comercial.personPhone) {
      return res.status(400).json({ success: false, error: 'Lead sem telefone' });
    }

    if (!proposta.pdfBase64) {
      return res.status(400).json({ success: false, error: 'Proposta sem PDF gerado' });
    }

    // Preparar dados para envio
    const telefone = proposta.comercial.personPhone.replace(/\D/g, '');
    const nomeCliente = proposta.comercial.primeiroNomeZapi || proposta.comercial.personName?.split(' ')[0] || 'Cliente';

    // Mensagem
    const valorFormatado = Number(proposta.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const mensagem = `Olá ${nomeCliente}! Segue a proposta comercial Monofloor no valor de ${valorFormatado}. Qualquer dúvida estou à disposição!`;

    // Nome do arquivo
    const dataHoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Proposta-Monofloor-${proposta.comercial.personName?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente'}-${dataHoje}.pdf`;

    // Verificar se Z-API está configurado
    if (!isWhatsAppConfigured()) {
      console.log('[Propostas] Z-API não configurado, usando fallback (wa.me)');

      // Marcar como enviada mesmo sem Z-API
      await prisma.proposta.update({
        where: { id: propostaId },
        data: {
          status: 'ENVIADA',
          enviadaEm: new Date(),
        },
      });

      return res.json({
        success: true,
        method: 'fallback',
        whatsappUrl: `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
        telefone,
        mensagem,
        message: 'Z-API não configurado. Use o link para enviar manualmente.',
      });
    }

    // Enviar PDF via Z-API
    console.log(`[Propostas] Enviando proposta v${proposta.versao} para ${telefone} via Z-API`);

    const documentResult = await sendWhatsAppDocument(
      telefone,
      proposta.pdfBase64,
      nomeArquivo,
      mensagem
    );

    if (!documentResult.success) {
      console.error('[Propostas] Erro ao enviar PDF:', documentResult.error);
      return res.status(500).json({
        success: false,
        error: `Erro ao enviar PDF: ${documentResult.error}`,
        whatsappUrl: `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
      });
    }

    // Marcar como enviada
    await prisma.proposta.update({
      where: { id: propostaId },
      data: {
        status: 'ENVIADA',
        enviadaEm: new Date(),
      },
    });

    console.log(`[Propostas] ✅ Proposta v${proposta.versao} enviada com sucesso para ${telefone}`);

    res.json({
      success: true,
      method: 'zapi',
      messageId: documentResult.messageId,
      zaapId: documentResult.zaapId,
      telefone,
      mensagem,
      message: 'Proposta enviada com sucesso via WhatsApp!',
    });
  } catch (error: any) {
    console.error('[Propostas] Error sending:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/:id/ultima-proposta - Retorna última proposta do lead
router.get('/:id/ultima-proposta', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proposta = await prisma.proposta.findFirst({
      where: { comercialId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        versao: true,
        valorTotal: true,
        valorM2: true,
        metragem: true,
        status: true,
        pdfBase64: true,
        enviadaEm: true,
        createdAt: true,
        dadosCalculo: true,
      },
    });

    res.json({ success: true, proposta });
  } catch (error: any) {
    console.error('[Propostas] Error getting last:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ANEXOS DO LEAD (Projeto Arquitetônico, Documentos, etc)
// =============================================

// GET /comercial/:id/anexos - Listar anexos do lead
router.get('/:id/anexos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const anexos = await prisma.comercialAnexo.findMany({
      where: { comercialId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        tipo: true,
        descricao: true,
        mimeType: true,
        fileSize: true,
        fileUrl: true,
        createdAt: true,
      },
    });

    res.json({ success: true, anexos });
  } catch (error: any) {
    console.error('[Anexos] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /comercial/:id/anexos/:anexoId/download - Baixar anexo (com base64)
router.get('/:id/anexos/:anexoId/download', async (req: Request, res: Response) => {
  try {
    const { id, anexoId } = req.params;

    const anexo = await prisma.comercialAnexo.findFirst({
      where: { id: anexoId, comercialId: id },
    });

    if (!anexo) {
      return res.status(404).json({ success: false, error: 'Anexo não encontrado' });
    }

    res.json({
      success: true,
      anexo: {
        id: anexo.id,
        nome: anexo.nome,
        mimeType: anexo.mimeType,
        fileData: anexo.fileData,
      }
    });
  } catch (error: any) {
    console.error('[Anexos] Error downloading:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/:id/anexos - Criar anexo
router.post('/:id/anexos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, tipo, descricao, fileData, mimeType, fileSize, fileUrl } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ success: false, error: 'Nome e tipo são obrigatórios' });
    }

    // Verificar se o deal existe
    const deal = await prisma.comercialData.findUnique({ where: { id } });
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    const anexo = await prisma.comercialAnexo.create({
      data: {
        comercialId: id,
        nome,
        tipo,
        descricao,
        fileData,
        mimeType,
        fileSize,
        fileUrl,
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        descricao: true,
        mimeType: true,
        fileSize: true,
        fileUrl: true,
        createdAt: true,
      },
    });

    console.log(`[Anexos] Created for deal ${id}: ${nome} (${tipo})`);
    res.json({ success: true, anexo });
  } catch (error: any) {
    console.error('[Anexos] Error creating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /comercial/:id/anexos/:anexoId - Deletar anexo
router.delete('/:id/anexos/:anexoId', async (req: Request, res: Response) => {
  try {
    const { id, anexoId } = req.params;

    const anexo = await prisma.comercialAnexo.findFirst({
      where: { id: anexoId, comercialId: id },
    });

    if (!anexo) {
      return res.status(404).json({ success: false, error: 'Anexo não encontrado' });
    }

    await prisma.comercialAnexo.delete({ where: { id: anexoId } });

    console.log(`[Anexos] Deleted: ${anexo.nome}`);
    res.json({ success: true, message: 'Anexo deletado com sucesso' });
  } catch (error: any) {
    console.error('[Anexos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ORÇAMENTOS ENVIADOS
// =============================================

// GET /comercial/:id/orcamentos-enviados - Listar orçamentos enviados
router.get('/:id/orcamentos-enviados', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orcamentos = await prisma.orcamentoEnviado.findMany({
      where: { comercialId: id },
      orderBy: { dataEnvio: 'desc' },
      include: {
        proposta: {
          select: {
            id: true,
            versao: true,
            valorTotal: true,
            status: true,
          },
        },
      },
    });

    res.json({ success: true, orcamentos });
  } catch (error: any) {
    console.error('[Orçamentos] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /comercial/:id/orcamentos-enviados - Criar orçamento enviado
router.post('/:id/orcamentos-enviados', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dataEnvio, valor, descricao, metragem, observacoes, propostaId } = req.body;

    if (!dataEnvio) {
      return res.status(400).json({ success: false, error: 'Data de envio é obrigatória' });
    }

    // Verificar se o deal existe
    const deal = await prisma.comercialData.findUnique({ where: { id } });
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    const orcamento = await prisma.orcamentoEnviado.create({
      data: {
        comercialId: id,
        dataEnvio: new Date(dataEnvio),
        valor: valor ? parseFloat(valor) : null,
        descricao,
        metragem: metragem ? parseFloat(metragem) : null,
        observacoes,
        propostaId,
      },
      include: {
        proposta: {
          select: {
            id: true,
            versao: true,
            valorTotal: true,
            status: true,
          },
        },
      },
    });

    console.log(`[Orçamentos] Created for deal ${id}: ${descricao || 'Sem descrição'}`);
    res.json({ success: true, orcamento });
  } catch (error: any) {
    console.error('[Orçamentos] Error creating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /comercial/:id/orcamentos-enviados/:orcamentoId - Atualizar orçamento
router.put('/:id/orcamentos-enviados/:orcamentoId', async (req: Request, res: Response) => {
  try {
    const { id, orcamentoId } = req.params;
    const { dataEnvio, valor, descricao, metragem, observacoes, propostaId } = req.body;

    const existing = await prisma.orcamentoEnviado.findFirst({
      where: { id: orcamentoId, comercialId: id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Orçamento não encontrado' });
    }

    const orcamento = await prisma.orcamentoEnviado.update({
      where: { id: orcamentoId },
      data: {
        dataEnvio: dataEnvio ? new Date(dataEnvio) : undefined,
        valor: valor !== undefined ? (valor ? parseFloat(valor) : null) : undefined,
        descricao,
        metragem: metragem !== undefined ? (metragem ? parseFloat(metragem) : null) : undefined,
        observacoes,
        propostaId,
      },
      include: {
        proposta: {
          select: {
            id: true,
            versao: true,
            valorTotal: true,
            status: true,
          },
        },
      },
    });

    console.log(`[Orçamentos] Updated: ${orcamentoId}`);
    res.json({ success: true, orcamento });
  } catch (error: any) {
    console.error('[Orçamentos] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /comercial/:id/orcamentos-enviados/:orcamentoId - Deletar orçamento
router.delete('/:id/orcamentos-enviados/:orcamentoId', async (req: Request, res: Response) => {
  try {
    const { id, orcamentoId } = req.params;

    const existing = await prisma.orcamentoEnviado.findFirst({
      where: { id: orcamentoId, comercialId: id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Orçamento não encontrado' });
    }

    await prisma.orcamentoEnviado.delete({ where: { id: orcamentoId } });

    console.log(`[Orçamentos] Deleted: ${orcamentoId}`);
    res.json({ success: true, message: 'Orçamento deletado com sucesso' });
  } catch (error: any) {
    console.error('[Orçamentos] Error deleting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as comercialRoutes };
