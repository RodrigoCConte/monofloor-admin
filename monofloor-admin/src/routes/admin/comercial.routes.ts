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
              cidade: true,
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
      telefoneCliente,
      emailCliente,
      arquiteto,
      escritorio,
      telefoneArquiteto,
      tipoCliente,
      tipoProjetoEst,
      budgetEstimado,
      origem,
    } = req.body;

    // Create project and comercial data together
    const project = await prisma.project.create({
      data: {
        title: cliente,
        cliente,
        endereco,
        cidade,
        m2Total: m2Total ? parseFloat(m2Total) : 0,
        currentModule: 'COMERCIAL',
        comercialData: {
          create: {
            telefoneCliente,
            emailCliente,
            arquiteto,
            escritorio,
            telefoneArquiteto,
            tipoCliente,
            tipoProjetoEst,
            budgetEstimado: budgetEstimado ? parseFloat(budgetEstimado) : null,
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
      telefoneCliente,
      emailCliente,
      arquiteto,
      escritorio,
      telefoneArquiteto,
      tipoCliente,
      tipoProjetoEst,
      budgetEstimado,
      origem,
    } = req.body;

    const comercial = await prisma.comercialData.update({
      where: { id },
      data: {
        telefoneCliente,
        emailCliente,
        arquiteto,
        escritorio,
        telefoneArquiteto,
        tipoCliente,
        tipoProjetoEst,
        budgetEstimado: budgetEstimado ? parseFloat(budgetEstimado) : null,
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

    // If GANHO, update project module and create contract
    if (status === 'GANHO') {
      await prisma.project.update({
        where: { id: oldData.projectId },
        data: { currentModule: 'PIUI' },
      });

      // Auto-create contract skeleton
      await prisma.contrato.create({
        data: {
          projectId: oldData.projectId,
          valorContratado: 0, // To be filled
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

export { router as comercialRoutes };
