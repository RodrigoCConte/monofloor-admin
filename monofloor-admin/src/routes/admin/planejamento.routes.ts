import { Router, Request, Response } from 'express';
import { PrismaClient, PlanejamentoStatus, TipoVisita, VisitaStatus, OSStatus, LogisticaStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// PLANEJAMENTO MODULE ROUTES
// =============================================

// GET /planejamento - List all planejamentos with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as PlanejamentoStatus;
    }

    if (search) {
      where.project = {
        OR: [
          { cliente: { contains: search as string, mode: 'insensitive' } },
          { endereco: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [planejamentos, total] = await Promise.all([
      prisma.planejamento.findMany({
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
          visitasTecnicas: {
            orderBy: { dataAgendada: 'desc' },
            take: 1,
          },
          ordemServico: true,
          logistica: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.planejamento.count({ where }),
    ]);

    res.json({
      success: true,
      data: planejamentos,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('[Planejamento] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /planejamento/stats - Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      prisma.planejamento.count({ where: { status: 'AGEND_VT_AFERICAO' } }),
      prisma.planejamento.count({ where: { status: 'AGEND_VT_ACOMPANHAMENTO' } }),
      prisma.planejamento.count({ where: { status: 'RESULTADO_VT_AFERICAO' } }),
      prisma.planejamento.count({ where: { status: 'PROJETOS_REVISAO' } }),
      prisma.planejamento.count({ where: { status: 'CONFIRMACOES_OP1' } }),
      prisma.planejamento.count({ where: { status: 'AGUARDANDO_LIBERACAO' } }),
      prisma.planejamento.count({ where: { status: 'INDUSTRIA_PRODUCAO' } }),
      prisma.planejamento.count({ where: { status: 'INFO_LOGISTICAS' } }),
      prisma.planejamento.count({ where: { status: 'EQUIPE_EXECUCAO' } }),
      // VTs agendadas para hoje
      prisma.visitaTecnica.count({
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
        aguardandoVt: stats[0],
        vtAgendada: stats[1],
        vtRealizada: stats[2],
        projetoRevisao: stats[3],
        confirmacoes: stats[4],
        aguardandoLiberacao: stats[5],
        industria: stats[6],
        logistica: stats[7],
        prontoExecucao: stats[8],
        vtsHoje: stats[9],
      },
    });
  } catch (error: any) {
    console.error('[Planejamento] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /planejamento/kanban - Kanban view
router.get('/kanban', async (_req: Request, res: Response) => {
  try {
    const planejamentos = await prisma.planejamento.findMany({
      where: {
        status: { not: 'EQUIPE_EXECUCAO' },
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
        visitasTecnicas: {
          where: { status: 'AGENDADA' },
          orderBy: { dataAgendada: 'asc' },
          take: 1,
        },
        ordemServico: {
          select: {
            numero: true,
            status: true,
            dataPrevisao: true,
          },
        },
        logistica: {
          select: {
            status: true,
            dataEntregaAgendada: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by status
    const kanban: Record<string, any[]> = {
      AGUARDANDO_VT: [],
      VT_AGENDADA: [],
      VT_REALIZADA: [],
      PROJETO_EM_REVISAO: [],
      CONFIRMACOES: [],
      AGUARDANDO_LIBERACAO: [],
      INDUSTRIA: [],
      LOGISTICA_ENTREGA: [],
      LOGISTICA_MATERIAL_ENTREGUE: [],
    };

    for (const item of planejamentos) {
      if (kanban[item.status]) {
        kanban[item.status].push(item);
      }
    }

    res.json({ success: true, kanban });
  } catch (error: any) {
    console.error('[Planejamento] Error getting kanban:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /planejamento/:id - Get single planejamento
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planejamento = await prisma.planejamento.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            contrato: true,
            comercialData: true,
          },
        },
        visitasTecnicas: {
          orderBy: { createdAt: 'desc' },
        },
        ordemServico: true,
        logistica: true,
      },
    });

    if (!planejamento) {
      return res.status(404).json({ success: false, error: 'Planejamento not found' });
    }

    res.json({ success: true, data: planejamento });
  } catch (error: any) {
    console.error('[Planejamento] Error getting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /planejamento/:id - Update planejamento
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      dataEntrada,
      prazoEstimado,
      consultorOperacionalId,
      consultorProjetosId,
      consultorAtendimentoId,
      observacoes,
    } = req.body;

    const planejamento = await prisma.planejamento.update({
      where: { id },
      data: {
        dataEntrada: dataEntrada ? new Date(dataEntrada) : null,
        prazoEstimado: prazoEstimado ? parseInt(prazoEstimado) : null,
        consultorOperacionalId,
        consultorProjetosId,
        consultorAtendimentoId,
        observacoes,
      },
    });

    res.json({ success: true, data: planejamento });
  } catch (error: any) {
    console.error('[Planejamento] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /planejamento/:id/status - Update status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const oldPlanejamento = await prisma.planejamento.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!oldPlanejamento) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // Update flags based on status
    const updateData: any = { status };

    switch (status) {
      case 'VT_REALIZADA':
        updateData.vtAfericaoRealizada = true;
        break;
      case 'CONFIRMACOES':
        updateData.projetoRevisado = true;
        break;
      case 'AGUARDANDO_LIBERACAO':
        updateData.confirmacoesOk = true;
        break;
      case 'LOGISTICA_MATERIAL_ENTREGUE':
        updateData.materialEntregue = true;
        break;
      case 'PRONTO_EXECUCAO':
        updateData.equipeDefinida = true;
        break;
    }

    const planejamento = await prisma.planejamento.update({
      where: { id },
      data: updateData,
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: oldPlanejamento.projectId,
        modulo: 'PLANEJAMENTO',
        tipo: 'STATUS_CHANGE',
        titulo: `Planejamento: ${status}`,
        dadosAnteriores: { status: oldPlanejamento.status },
        dadosNovos: { status },
      },
    });

    // If PRONTO_EXECUCAO, move to EXECUCAO
    if (status === 'PRONTO_EXECUCAO') {
      await prisma.project.update({
        where: { id: oldPlanejamento.projectId },
        data: { currentModule: 'EXECUCAO' },
      });

      // Auto-create execucao
      await prisma.execucao.create({
        data: {
          projectId: oldPlanejamento.projectId,
        },
      });
    }

    res.json({ success: true, data: planejamento });
  } catch (error: any) {
    console.error('[Planejamento] Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// VISITAS TÉCNICAS
// =============================================

// POST /planejamento/:id/visitas - Create technical visit
router.post('/:id/visitas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, dataAgendada, observacoes } = req.body;

    const planejamento = await prisma.planejamento.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!planejamento) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const visita = await prisma.visitaTecnica.create({
      data: {
        planejamentoId: id,
        tipo: tipo as TipoVisita,
        dataAgendada: new Date(dataAgendada),
        observacoes,
      },
    });

    // Update planejamento status
    if (planejamento.status === 'AGEND_VT_AFERICAO') {
      await prisma.planejamento.update({
        where: { id },
        data: { status: 'RESULTADO_VT_AFERICAO' },
      });
    }

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: planejamento.projectId,
        modulo: 'PLANEJAMENTO',
        tipo: 'VT_AGENDADA',
        titulo: `VT ${tipo} agendada`,
        descricao: `Data: ${new Date(dataAgendada).toLocaleDateString('pt-BR')}`,
      },
    });

    res.json({ success: true, data: visita });
  } catch (error: any) {
    console.error('[Planejamento] Error creating visit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /planejamento/visitas/:visitaId/realizar - Complete visit
router.put('/visitas/:visitaId/realizar', async (req: Request, res: Response) => {
  try {
    const { visitaId } = req.params;
    const { observacoes, relatorioUrl, fotos, realizadaPorId, realizadaPorNome } = req.body;

    const visita = await prisma.visitaTecnica.update({
      where: { id: visitaId },
      data: {
        status: 'REALIZADA',
        dataRealizada: new Date(),
        observacoes,
        relatorioUrl,
        fotos: fotos || [],
        realizadaPorId,
        realizadaPorNome,
      },
      include: {
        planejamento: {
          include: { project: true },
        },
      },
    });

    // Update planejamento
    if (visita.planejamento.status === 'AGEND_VT_ACOMPANHAMENTO') {
      await prisma.planejamento.update({
        where: { id: visita.planejamentoId },
        data: { status: 'RESULTADO_VT_ACOMPANHAMENTO' },
      });
    }

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: visita.planejamento.projectId,
        modulo: 'PLANEJAMENTO',
        tipo: 'VT_REALIZADA',
        titulo: `VT ${visita.tipo} realizada`,
        descricao: observacoes,
      },
    });

    res.json({ success: true, data: visita });
  } catch (error: any) {
    console.error('[Planejamento] Error completing visit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /planejamento/visitas/hoje - Today's visits
router.get('/visitas/hoje', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visitas = await prisma.visitaTecnica.findMany({
      where: {
        status: 'AGENDADA',
        dataAgendada: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        planejamento: {
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
      orderBy: { dataAgendada: 'asc' },
    });

    res.json({ success: true, data: visitas });
  } catch (error: any) {
    console.error('[Planejamento] Error getting today visits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ORDEM DE SERVIÇO (INDÚSTRIA)
// =============================================

// POST /planejamento/:id/ordem-servico - Create OS
router.post('/:id/ordem-servico', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { numero, cores, materiais, quantidades, observacoes, dataPrevisao } = req.body;

    const planejamento = await prisma.planejamento.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!planejamento) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const os = await prisma.ordemServico.create({
      data: {
        planejamentoId: id,
        numero,
        cores: cores || [],
        materiais: materiais || [],
        quantidades,
        observacoes,
        dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null,
        dataEnvio: new Date(),
        status: 'ENVIADA',
      },
    });

    // Update planejamento
    await prisma.planejamento.update({
      where: { id },
      data: { status: 'INDUSTRIA_PRODUCAO' },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: planejamento.projectId,
        modulo: 'PLANEJAMENTO',
        tipo: 'OS_CRIADA',
        titulo: `OS ${numero} criada`,
        descricao: `Previsão: ${dataPrevisao ? new Date(dataPrevisao).toLocaleDateString('pt-BR') : 'A definir'}`,
      },
    });

    res.json({ success: true, data: os });
  } catch (error: any) {
    console.error('[Planejamento] Error creating OS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /planejamento/ordem-servico/:osId/status - Update OS status
router.put('/ordem-servico/:osId/status', async (req: Request, res: Response) => {
  try {
    const { osId } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    if (status === 'CONCLUIDA') {
      updateData.dataConclusao = new Date();
    }

    const os = await prisma.ordemServico.update({
      where: { id: osId },
      data: updateData,
      include: {
        planejamento: {
          include: { project: true },
        },
      },
    });

    // If concluded, update planejamento to logistics
    if (status === 'CONCLUIDA') {
      await prisma.planejamento.update({
        where: { id: os.planejamentoId },
        data: {
          status: 'LOGISTICA_ENTREGA',
          materialProduzido: true,
        },
      });

      // Auto-create logistica
      await prisma.logistica.create({
        data: {
          planejamentoId: os.planejamentoId,
        },
      });
    }

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: os.planejamento.projectId,
        modulo: 'PLANEJAMENTO',
        tipo: 'OS_STATUS',
        titulo: `OS ${os.numero}: ${status}`,
      },
    });

    res.json({ success: true, data: os });
  } catch (error: any) {
    console.error('[Planejamento] Error updating OS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// LOGÍSTICA
// =============================================

// PUT /planejamento/logistica/:logisticaId - Update logistics
router.put('/logistica/:logisticaId', async (req: Request, res: Response) => {
  try {
    const { logisticaId } = req.params;
    const {
      dataEntregaAgendada,
      dataEntregaRealizada,
      entregaConfirmada,
      entregaFotos,
      dataColetaAgendada,
      dataColetaRealizada,
      coletaConfirmada,
      coletaFotos,
      observacoesEntrega,
      observacoesColeta,
      status,
    } = req.body;

    const logistica = await prisma.logistica.update({
      where: { id: logisticaId },
      data: {
        dataEntregaAgendada: dataEntregaAgendada ? new Date(dataEntregaAgendada) : undefined,
        dataEntregaRealizada: dataEntregaRealizada ? new Date(dataEntregaRealizada) : undefined,
        entregaConfirmada,
        entregaFotos: entregaFotos || undefined,
        dataColetaAgendada: dataColetaAgendada ? new Date(dataColetaAgendada) : undefined,
        dataColetaRealizada: dataColetaRealizada ? new Date(dataColetaRealizada) : undefined,
        coletaConfirmada,
        coletaFotos: coletaFotos || undefined,
        observacoesEntrega,
        observacoesColeta,
        status: status as LogisticaStatus,
      },
      include: {
        planejamento: {
          include: { project: true },
        },
      },
    });

    // Update planejamento based on logistics status
    if (status === 'ENTREGUE') {
      await prisma.planejamento.update({
        where: { id: logistica.planejamentoId },
        data: {
          status: 'LOGISTICA_MATERIAL_ENTREGUE',
          materialEntregue: true,
        },
      });
    }

    res.json({ success: true, data: logistica });
  } catch (error: any) {
    console.error('[Planejamento] Error updating logistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /planejamento/:id/confirmar-entrega - Confirm material delivery
router.post('/:id/confirmar-entrega', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fotos, observacoes } = req.body;

    const planejamento = await prisma.planejamento.findUnique({
      where: { id },
      include: { logistica: true, project: true },
    });

    if (!planejamento || !planejamento.logistica) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    await prisma.logistica.update({
      where: { id: planejamento.logistica.id },
      data: {
        dataEntregaRealizada: new Date(),
        entregaConfirmada: true,
        entregaFotos: fotos || [],
        observacoesEntrega: observacoes,
        status: 'ENTREGUE',
      },
    });

    await prisma.planejamento.update({
      where: { id },
      data: {
        status: 'LOGISTICA_MATERIAL_ENTREGUE',
        materialEntregue: true,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: planejamento.projectId,
        modulo: 'PLANEJAMENTO',
        tipo: 'MATERIAL_ENTREGUE',
        titulo: 'Material entregue',
        descricao: observacoes,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Planejamento] Error confirming delivery:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as planejamentoRoutes };
