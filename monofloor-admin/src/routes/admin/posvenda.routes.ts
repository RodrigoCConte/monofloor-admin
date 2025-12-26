import { Router, Request, Response } from 'express';
import { PrismaClient, PosVendaStatus, Prioridade, VisitaStatus, IntervencaoStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// PÓS-VENDA MODULE ROUTES
// =============================================

// GET /posvenda - List all pós-venda with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, prioridade, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as PosVendaStatus;
    }

    if (prioridade && prioridade !== 'ALL') {
      where.prioridade = prioridade as Prioridade;
    }

    if (search) {
      where.OR = [
        { project: { cliente: { contains: search as string, mode: 'insensitive' } } },
        { motivoAcionamento: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [posVendas, total] = await Promise.all([
      prisma.posVenda.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              cliente: true,
              endereco: true,
              m2Total: true,
            },
          },
          visitasQualidade: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          intervencao: true,
        },
        orderBy: [
          { prioridade: 'desc' },
          { dataAcionamento: 'desc' },
        ],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.posVenda.count({ where }),
    ]);

    res.json({
      success: true,
      data: posVendas,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('[PosVenda] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /posvenda/stats - Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      prisma.posVenda.count({ where: { status: 'ABERTO' } }),
      prisma.posVenda.count({ where: { status: 'VISITA_AGENDADA' } }),
      prisma.posVenda.count({ where: { status: 'EM_ANALISE' } }),
      prisma.posVenda.count({ where: { status: 'INTERVENCAO_NECESSARIA' } }),
      prisma.posVenda.count({ where: { status: 'EM_INTERVENCAO' } }),
      prisma.posVenda.count({ where: { status: 'RESOLVIDO' } }),
      // Por prioridade
      prisma.posVenda.count({ where: { status: { not: 'RESOLVIDO' }, prioridade: 'URGENTE' } }),
      prisma.posVenda.count({ where: { status: { not: 'RESOLVIDO' }, prioridade: 'ALTA' } }),
      // Visitas agendadas para hoje
      prisma.visitaQualidade.count({
        where: {
          status: 'AGENDADA',
          dataAgendada: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        abertos: stats[0],
        visitaAgendada: stats[1],
        emAnalise: stats[2],
        intervencaoNecessaria: stats[3],
        emIntervencao: stats[4],
        resolvidos: stats[5],
        urgentes: stats[6],
        altaPrioridade: stats[7],
        visitasHoje: stats[8],
        totalAtivos: stats[0] + stats[1] + stats[2] + stats[3] + stats[4],
      },
    });
  } catch (error: any) {
    console.error('[PosVenda] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /posvenda/:id - Get single pós-venda
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const posVenda = await prisma.posVenda.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            contrato: true,
            execucao: true,
          },
        },
        visitasQualidade: {
          orderBy: { createdAt: 'desc' },
        },
        intervencao: true,
      },
    });

    if (!posVenda) {
      return res.status(404).json({ success: false, error: 'Pós-venda not found' });
    }

    res.json({ success: true, data: posVenda });
  } catch (error: any) {
    console.error('[PosVenda] Error getting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /posvenda - Create new pós-venda
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      motivoAcionamento,
      prioridade,
      contatoCliente,
      telefoneContato,
      responsavelId,
      responsavelNome,
    } = req.body;

    // Update project module
    await prisma.project.update({
      where: { id: projectId },
      data: { currentModule: 'POS_VENDA' },
    });

    const posVenda = await prisma.posVenda.create({
      data: {
        projectId,
        motivoAcionamento,
        prioridade: prioridade as Prioridade,
        contatoCliente,
        telefoneContato,
        responsavelId,
        responsavelNome,
      },
      include: {
        project: true,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId,
        modulo: 'POS_VENDA',
        tipo: 'CHAMADO_ABERTO',
        titulo: 'Chamado pós-venda aberto',
        descricao: motivoAcionamento,
        metadata: { prioridade },
      },
    });

    res.json({ success: true, data: posVenda });
  } catch (error: any) {
    console.error('[PosVenda] Error creating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /posvenda/:id - Update pós-venda
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      motivoAcionamento,
      prioridade,
      contatoCliente,
      telefoneContato,
      responsavelId,
      responsavelNome,
    } = req.body;

    const posVenda = await prisma.posVenda.update({
      where: { id },
      data: {
        motivoAcionamento,
        prioridade: prioridade as Prioridade,
        contatoCliente,
        telefoneContato,
        responsavelId,
        responsavelNome,
      },
    });

    res.json({ success: true, data: posVenda });
  } catch (error: any) {
    console.error('[PosVenda] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /posvenda/:id/status - Update status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, observacoesFinais } = req.body;

    const oldPosVenda = await prisma.posVenda.findUnique({
      where: { id },
    });

    if (!oldPosVenda) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const updateData: any = { status };

    if (status === 'RESOLVIDO') {
      updateData.dataResolucao = new Date();
      updateData.observacoesFinais = observacoesFinais;
    }

    const posVenda = await prisma.posVenda.update({
      where: { id },
      data: updateData,
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: oldPosVenda.projectId,
        modulo: 'POS_VENDA',
        tipo: 'STATUS_CHANGE',
        titulo: `Pós-venda: ${status}`,
        descricao: status === 'RESOLVIDO' ? observacoesFinais : undefined,
        dadosAnteriores: { status: oldPosVenda.status },
        dadosNovos: { status },
      },
    });

    res.json({ success: true, data: posVenda });
  } catch (error: any) {
    console.error('[PosVenda] Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// VISITAS DE QUALIDADE
// =============================================

// POST /posvenda/:id/visitas - Create quality visit
router.post('/:id/visitas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dataAgendada } = req.body;

    const posVenda = await prisma.posVenda.findUnique({
      where: { id },
    });

    if (!posVenda) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const visita = await prisma.visitaQualidade.create({
      data: {
        posVendaId: id,
        dataAgendada: new Date(dataAgendada),
      },
    });

    // Update status
    await prisma.posVenda.update({
      where: { id },
      data: { status: 'VISITA_AGENDADA' },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: posVenda.projectId,
        modulo: 'POS_VENDA',
        tipo: 'VISITA_AGENDADA',
        titulo: 'Visita de qualidade agendada',
        descricao: `Data: ${new Date(dataAgendada).toLocaleDateString('pt-BR')}`,
      },
    });

    res.json({ success: true, data: visita });
  } catch (error: any) {
    console.error('[PosVenda] Error creating visit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /posvenda/visitas/:visitaId/realizar - Complete quality visit
router.put('/visitas/:visitaId/realizar', async (req: Request, res: Response) => {
  try {
    const { visitaId } = req.params;
    const {
      parecer,
      problemasEncontrados,
      recomendacoes,
      fotos,
      realizadaPorId,
      realizadaPorNome,
      intervencaoNecessaria,
    } = req.body;

    const visita = await prisma.visitaQualidade.update({
      where: { id: visitaId },
      data: {
        status: 'REALIZADA',
        dataRealizada: new Date(),
        parecer,
        problemasEncontrados: problemasEncontrados || [],
        recomendacoes,
        fotos: fotos || [],
        realizadaPorId,
        realizadaPorNome,
      },
      include: {
        posVenda: true,
      },
    });

    // Update pós-venda status based on findings
    const newStatus = intervencaoNecessaria ? 'INTERVENCAO_NECESSARIA' : 'EM_ANALISE';

    await prisma.posVenda.update({
      where: { id: visita.posVendaId },
      data: { status: newStatus },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: visita.posVenda.projectId,
        modulo: 'POS_VENDA',
        tipo: 'VISITA_REALIZADA',
        titulo: 'Visita de qualidade realizada',
        descricao: parecer,
        metadata: { problemasEncontrados, intervencaoNecessaria },
      },
    });

    res.json({ success: true, data: visita });
  } catch (error: any) {
    console.error('[PosVenda] Error completing visit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// INTERVENÇÕES
// =============================================

// POST /posvenda/:id/intervencao - Create intervention
router.post('/:id/intervencao', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      descricao,
      m2Intervencao,
      custoEstimado,
      cobradoCliente,
      equipeDesignada,
    } = req.body;

    const posVenda = await prisma.posVenda.findUnique({
      where: { id },
    });

    if (!posVenda) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const intervencao = await prisma.intervencao.create({
      data: {
        posVendaId: id,
        descricao,
        m2Intervencao: m2Intervencao ? parseFloat(m2Intervencao) : null,
        custoEstimado: custoEstimado ? parseFloat(custoEstimado) : null,
        cobradoCliente: cobradoCliente || false,
        equipeDesignada,
      },
    });

    // Update status
    await prisma.posVenda.update({
      where: { id },
      data: { status: 'EM_INTERVENCAO' },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: posVenda.projectId,
        modulo: 'POS_VENDA',
        tipo: 'INTERVENCAO_CRIADA',
        titulo: 'Intervenção planejada',
        descricao,
        metadata: { m2Intervencao, custoEstimado, cobradoCliente },
      },
    });

    res.json({ success: true, data: intervencao });
  } catch (error: any) {
    console.error('[PosVenda] Error creating intervention:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /posvenda/intervencao/:intervencaoId - Update intervention
router.put('/intervencao/:intervencaoId', async (req: Request, res: Response) => {
  try {
    const { intervencaoId } = req.params;
    const {
      descricao,
      m2Intervencao,
      custoEstimado,
      custoReal,
      cobradoCliente,
      equipeDesignada,
      status,
      relatorioFinal,
      fotos,
    } = req.body;

    const updateData: any = {
      descricao,
      m2Intervencao: m2Intervencao ? parseFloat(m2Intervencao) : undefined,
      custoEstimado: custoEstimado ? parseFloat(custoEstimado) : undefined,
      custoReal: custoReal ? parseFloat(custoReal) : undefined,
      cobradoCliente,
      equipeDesignada,
      relatorioFinal,
      fotos: fotos || undefined,
    };

    if (status) {
      updateData.status = status as IntervencaoStatus;

      if (status === 'EM_EXECUCAO') {
        updateData.dataInicio = new Date();
      } else if (status === 'CONCLUIDA') {
        updateData.dataFim = new Date();
      }
    }

    const intervencao = await prisma.intervencao.update({
      where: { id: intervencaoId },
      data: updateData,
      include: {
        posVenda: true,
      },
    });

    // If intervention concluded, update pós-venda
    if (status === 'CONCLUIDA') {
      await prisma.posVenda.update({
        where: { id: intervencao.posVendaId },
        data: { status: 'RESOLVIDO', dataResolucao: new Date() },
      });

      // Create timeline event
      await prisma.timelineEvent.create({
        data: {
          projectId: intervencao.posVenda.projectId,
          modulo: 'POS_VENDA',
          tipo: 'INTERVENCAO_CONCLUIDA',
          titulo: 'Intervenção concluída',
          descricao: relatorioFinal,
          metadata: { custoReal },
        },
      });
    }

    res.json({ success: true, data: intervencao });
  } catch (error: any) {
    console.error('[PosVenda] Error updating intervention:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /posvenda/intervencoes/ativas - Active interventions
router.get('/intervencoes/ativas', async (_req: Request, res: Response) => {
  try {
    const intervencoes = await prisma.intervencao.findMany({
      where: {
        status: { in: ['PLANEJANDO', 'AGUARDANDO_MATERIAL', 'AGUARDANDO_EQUIPE', 'EM_EXECUCAO'] },
      },
      include: {
        posVenda: {
          include: {
            project: {
              select: {
                id: true,
                cliente: true,
                endereco: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: intervencoes });
  } catch (error: any) {
    console.error('[PosVenda] Error getting active interventions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as posvendaRoutes };
