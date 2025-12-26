import { Router, Request, Response } from 'express';
import { PrismaClient, ComercialStatus, PropostaStatus, FollowUpStatus, FollowUpTipo, FollowUpCanal } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// COMERCIAL MODULE ROUTES
// =============================================

// GET /comercial - List all commercial data with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as ComercialStatus;
    }

    if (search) {
      where.OR = [
        { project: { cliente: { contains: search as string, mode: 'insensitive' } } },
        { project: { endereco: { contains: search as string, mode: 'insensitive' } } },
        { arquiteto: { contains: search as string, mode: 'insensitive' } },
        { escritorio: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [comerciais, total] = await Promise.all([
      prisma.comercialData.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              cliente: true,
              endereco: true,
              m2Total: true,
              currentModule: true,
            },
          },
          propostas: {
            orderBy: { versao: 'desc' },
            take: 1,
          },
          followUps: {
            where: { status: 'AGENDADO' },
            orderBy: { agendadoPara: 'asc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.comercialData.count({ where }),
    ]);

    res.json({
      success: true,
      data: comerciais,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
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
        levantamento: stats[2],
        propostaEnviada: stats[3],
        followUp: stats[4],
        negociacao: stats[5],
        ganhos: stats[6],
        perdidos: stats[7],
        followUpsHoje: stats[8],
        valorEmNegociacao: stats[9]._sum.valorTotal || 0,
        totalAtivos: stats[0] + stats[1] + stats[2] + stats[3] + stats[4] + stats[5],
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

// PUT /comercial/:id - Update comercial data
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
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

    const comercial = await prisma.comercialData.update({
      where: { id },
      data: {
        personPhone,
        personEmail,
        arquiteto,
        escritorio,
        telefoneArquiteto,
        tipoCliente,
        tipoProjeto,
        budgetEstimado: budgetEstimado || null,
        origem,
      },
      include: {
        project: true,
      },
    });

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
    const { status, motivoPerda } = req.body;

    const oldData = await prisma.comercialData.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!oldData) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const updateData: any = { status };

    if (status === 'GANHO') {
      updateData.dataGanho = new Date();
    } else if (status === 'PERDIDO') {
      updateData.dataPerda = new Date();
      updateData.motivoPerda = motivoPerda;
    }

    const comercial = await prisma.comercialData.update({
      where: { id },
      data: updateData,
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: oldData.projectId,
        modulo: 'COMERCIAL',
        tipo: 'STATUS_CHANGE',
        titulo: `Status alterado para ${status}`,
        descricao: status === 'PERDIDO' ? motivoPerda : undefined,
        dadosAnteriores: { status: oldData.status },
        dadosNovos: { status },
      },
    });

    // If GANHO, update project module and create contract with proposal data
    if (status === 'GANHO') {
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

// GET /comercial/stages - Get all pipeline stages config
router.get('/stages', async (_req: Request, res: Response) => {
  try {
    const stages = [
      // Entrada
      { id: 'FORM_ORCAMENTO', label: 'Form Orçamento', color: '#6366f1', order: 1, group: 'entrada' },
      { id: 'LEAD', label: 'Lead', color: '#8b5cf6', order: 2, group: 'entrada' },
      { id: 'QUALIFICACAO', label: 'Qualificação', color: '#a855f7', order: 3, group: 'entrada' },

      // Contato
      { id: 'PRIMEIRO_CONTATO', label: '1º Contato', color: '#3b82f6', order: 4, group: 'contato' },
      { id: 'CONTATO_ARQUITETO', label: 'Contato Arquiteto', color: '#0ea5e9', order: 5, group: 'contato' },
      { id: 'AGUARDANDO_ARQ', label: 'Aguardando Arq.', color: '#06b6d4', order: 6, group: 'contato' },

      // Levantamento
      { id: 'LEVANTAMENTO', label: 'Levantamento', color: '#14b8a6', order: 7, group: 'levantamento' },
      { id: 'VISITA_AGENDADA', label: 'Visita Agendada', color: '#10b981', order: 8, group: 'levantamento' },
      { id: 'VISITA_REALIZADA', label: 'Visita Realizada', color: '#22c55e', order: 9, group: 'levantamento' },

      // Proposta
      { id: 'PROPOSTA_EM_ELABORACAO', label: 'Proposta em Elaboração', color: '#eab308', order: 10, group: 'proposta' },
      { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: '#f59e0b', order: 11, group: 'proposta' },

      // Follow-up
      { id: 'FOLLOW_1', label: 'Follow 1', color: '#f97316', order: 12, group: 'followup' },
      { id: 'FOLLOW_2', label: 'Follow 2', color: '#fb923c', order: 13, group: 'followup' },
      { id: 'FOLLOW_3', label: 'Follow 3', color: '#fdba74', order: 14, group: 'followup' },
      { id: 'FOLLOW_4', label: 'Follow 4', color: '#fed7aa', order: 15, group: 'followup' },
      { id: 'FOLLOW_5', label: 'Follow 5 (último)', color: '#ffedd5', order: 16, group: 'followup' },

      // Negociação
      { id: 'NEGOCIACAO', label: 'Negociação', color: '#c9a962', order: 17, group: 'negociacao' },
      { id: 'AJUSTE_PROPOSTA', label: 'Ajuste de Proposta', color: '#d4b872', order: 18, group: 'negociacao' },

      // Fechamento
      { id: 'GANHO', label: 'Ganho', color: '#22c55e', order: 19, group: 'fechamento' },
      { id: 'PERDIDO', label: 'Perdido', color: '#ef4444', order: 20, group: 'fechamento' },

      // Especiais
      { id: 'CONGELADO', label: 'Congelado', color: '#64748b', order: 21, group: 'especial' },
      { id: 'FOLLOW_UP', label: 'Follow-up (legacy)', color: '#94a3b8', order: 22, group: 'legacy', hidden: true },
    ];

    res.json({ success: true, stages });
  } catch (error: any) {
    console.error('[Comercial] Error getting stages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as comercialRoutes };
