import { Router, Request, Response } from 'express';
import { PrismaClient, PreObraStatus, PreObraTarefaTipo, PreObraTarefaStatus, ProvisionamentoTipo, ProvisionamentoStatus, AmostraStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// PRE-OBRA MODULE ROUTES
// =============================================

// GET /pre-obra - List all pre-obras with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as PreObraStatus;
    }

    if (search) {
      where.project = {
        OR: [
          { cliente: { contains: search as string, mode: 'insensitive' } },
          { endereco: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [preObras, total] = await Promise.all([
      prisma.preObra.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              cliente: true,
              endereco: true,
              m2Total: true,
              m2Piso: true,
              m2Parede: true,
              cor: true,
            },
          },
          tarefas: {
            orderBy: { sortOrder: 'asc' },
          },
          provisionamentos: {
            orderBy: { sortOrder: 'asc' },
          },
          amostras: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.preObra.count({ where }),
    ]);

    res.json({
      success: true,
      data: preObras,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('[PreObra] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /pre-obra/stats - Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      aguardandoOrientacoes,
      orientacoesEnviadas,
      visitaAgendada,
      visitaRealizada,
      aguardandoCor,
      corDefinida,
      materiaisSolicitados,
      materiaisEmTransito,
      materiaisRecebidos,
      prontoExecucao,
      total,
    ] = await Promise.all([
      prisma.preObra.count({ where: { status: 'AGUARDANDO_ORIENTACOES' } }),
      prisma.preObra.count({ where: { status: 'ORIENTACOES_ENVIADAS' } }),
      prisma.preObra.count({ where: { status: 'VISITA_AGENDADA' } }),
      prisma.preObra.count({ where: { status: 'VISITA_REALIZADA' } }),
      prisma.preObra.count({ where: { status: 'AGUARDANDO_COR' } }),
      prisma.preObra.count({ where: { status: 'COR_DEFINIDA' } }),
      prisma.preObra.count({ where: { status: 'MATERIAIS_SOLICITADOS' } }),
      prisma.preObra.count({ where: { status: 'MATERIAIS_EM_TRANSITO' } }),
      prisma.preObra.count({ where: { status: 'MATERIAIS_RECEBIDOS' } }),
      prisma.preObra.count({ where: { status: 'PRONTO_EXECUCAO' } }),
      prisma.preObra.count(),
    ]);

    // Calculate aggregate stats
    const emAndamento = orientacoesEnviadas + visitaAgendada + visitaRealizada + aguardandoCor + corDefinida + materiaisSolicitados + materiaisEmTransito;
    const concluido = materiaisRecebidos + prontoExecucao;

    res.json({
      success: true,
      stats: {
        aguardandoOrientacoes,
        orientacoesEnviadas,
        visitaAgendada,
        visitaRealizada,
        aguardandoCor,
        corDefinida,
        materiaisSolicitados,
        materiaisEmTransito,
        materiaisRecebidos,
        prontoExecucao,
        total,
        // Aggregated
        emAndamento,
        concluido,
      },
    });
  } catch (error: any) {
    console.error('[PreObra] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /pre-obra/capacity - Get capacity planning data for 12 months
router.get('/capacity', async (_req: Request, res: Response) => {
  try {
    const MONTHLY_CAPACITY = 20000; // Hours per month
    const months: { month: string; label: string; capacity: number; allocated: number; projects: any[] }[] = [];

    // Generate 12 months starting from current month
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      months.push({
        month: monthKey,
        label: monthLabel,
        capacity: MONTHLY_CAPACITY,
        allocated: 0,
        projects: [],
      });
    }

    // Get all pre-obras with allocation
    const preObras = await prisma.preObra.findMany({
      where: {
        mesExecucao: { not: null },
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
      },
    });

    // Aggregate by month
    for (const preObra of preObras) {
      const monthData = months.find(m => m.month === preObra.mesExecucao);
      if (monthData) {
        const hours = Number(preObra.horasEstimadas) || 0;
        monthData.allocated += hours;
        monthData.projects.push({
          id: preObra.id,
          projectId: preObra.projectId,
          cliente: preObra.project.cliente,
          endereco: preObra.project.endereco,
          horasEstimadas: hours,
          m2Total: preObra.project.m2Total,
        });
      }
    }

    // Get unallocated pre-obras
    const unallocated = await prisma.preObra.findMany({
      where: {
        OR: [
          { mesExecucao: null },
          { mesExecucao: '' },
        ],
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
      },
    });

    res.json({
      success: true,
      data: {
        monthlyCapacity: MONTHLY_CAPACITY,
        months,
        unallocated: unallocated.map(p => ({
          id: p.id,
          projectId: p.projectId,
          cliente: p.project.cliente,
          endereco: p.project.endereco,
          horasEstimadas: Number(p.horasEstimadas) || 0,
          m2Total: p.project.m2Total,
        })),
      },
    });
  } catch (error: any) {
    console.error('[PreObra] Error getting capacity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id/allocate - Allocate pre-obra to a month
router.put('/:id/allocate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mesExecucao, horasEstimadas } = req.body;

    const updateData: any = {};
    if (mesExecucao !== undefined) updateData.mesExecucao = mesExecucao;
    if (horasEstimadas !== undefined) updateData.horasEstimadas = horasEstimadas;

    const preObra = await prisma.preObra.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            cliente: true,
            endereco: true,
            m2Total: true,
          },
        },
      },
    });

    res.json({ success: true, data: preObra });
  } catch (error: any) {
    console.error('[PreObra] Error allocating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /pre-obra/:id - Get single pre-obra with all relations
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const preObra = await prisma.preObra.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            cliente: true,
            endereco: true,
            m2Total: true,
            m2Piso: true,
            m2Parede: true,
            m2Teto: true,
            cor: true,
            consultor: true,
            material: true,
            latitude: true,
            longitude: true,
          },
        },
        tarefas: {
          orderBy: { sortOrder: 'asc' },
        },
        provisionamentos: {
          orderBy: { sortOrder: 'asc' },
        },
        amostras: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!preObra) {
      return res.status(404).json({ success: false, error: 'Pre-obra not found' });
    }

    res.json({ success: true, data: preObra });
  } catch (error: any) {
    console.error('[PreObra] Error getting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra - Create pre-obra
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if pre-obra already exists
    const existing = await prisma.preObra.findUnique({ where: { projectId } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Pre-obra already exists for this project' });
    }

    const preObra = await prisma.preObra.create({
      data: {
        projectId,
        dataEntrada: new Date(),
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
      },
    });

    res.status(201).json({ success: true, data: preObra });
  } catch (error: any) {
    console.error('[PreObra] Error creating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id - Update pre-obra
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove relations from update data
    delete updateData.project;
    delete updateData.tarefas;
    delete updateData.provisionamentos;
    delete updateData.amostras;

    const preObra = await prisma.preObra.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            cliente: true,
            endereco: true,
          },
        },
      },
    });

    res.json({ success: true, data: preObra });
  } catch (error: any) {
    console.error('[PreObra] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id/status - Update status with automatic flag updates
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    // Auto-update flags based on status
    switch (status) {
      case 'ORIENTACOES_ENVIADAS':
        updateData.orientacoesEnviadas = true;
        updateData.orientacoesEnviadasEm = new Date();
        break;
      case 'VISITA_AGENDADA':
        updateData.visitaTecnicaAgendada = true;
        break;
      case 'VISITA_REALIZADA':
        updateData.visitaTecnicaRealizada = true;
        updateData.visitaTecnicaRealizadaEm = new Date();
        break;
      case 'REUNIAO_REALIZADA':
        updateData.reuniaoOrientativaRealizada = true;
        updateData.reuniaoOrientativaEm = new Date();
        break;
      case 'COR_DEFINIDA':
        updateData.corDefinida = true;
        updateData.corDefinidaEm = new Date();
        break;
      case 'MATERIAIS_RECEBIDOS':
        updateData.materiaisEnviados = true;
        updateData.materiaisEnviadosEm = new Date();
        break;
    }

    const preObra = await prisma.preObra.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: preObra });
  } catch (error: any) {
    console.error('[PreObra] Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id/checklist - Update checklist item
router.put('/:id/checklist', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    const allowedFields = [
      'orientacoesEnviadas',
      'visitaTecnicaAgendada',
      'visitaTecnicaRealizada',
      'reuniaoOrientativaRealizada',
      'materiaisEnviados',
      'corDefinida',
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, error: 'Invalid checklist field' });
    }

    const updateData: any = { [field]: value };

    // Auto-set timestamp if marking as true
    if (value === true) {
      const timestampField = field + 'Em';
      if (['orientacoesEnviadas', 'visitaTecnicaRealizada', 'reuniaoOrientativaRealizada', 'materiaisEnviados', 'corDefinida'].includes(field)) {
        const fieldMap: { [key: string]: string } = {
          orientacoesEnviadas: 'orientacoesEnviadasEm',
          visitaTecnicaRealizada: 'visitaTecnicaRealizadaEm',
          reuniaoOrientativaRealizada: 'reuniaoOrientativaEm',
          materiaisEnviados: 'materiaisEnviadosEm',
          corDefinida: 'corDefinidaEm',
        };
        if (fieldMap[field]) {
          updateData[fieldMap[field]] = new Date();
        }
      }
    }

    const preObra = await prisma.preObra.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: preObra });
  } catch (error: any) {
    console.error('[PreObra] Error updating checklist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// TAREFAS (CRONOGRAMA) ROUTES
// =============================================

// GET /pre-obra/:id/tarefas - List tasks
router.get('/:id/tarefas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const where: any = { preObraId: id };
    if (status) {
      where.status = status as PreObraTarefaStatus;
    }

    const tarefas = await prisma.preObraTarefa.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: tarefas });
  } catch (error: any) {
    console.error('[PreObra] Error listing tarefas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/tarefas - Create task
router.post('/:id/tarefas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, tipo, dataAgendada, horaAgendada, responsavelNome, responsavelId, observacoes } = req.body;

    // Get max sortOrder
    const maxOrder = await prisma.preObraTarefa.findFirst({
      where: { preObraId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const tarefa = await prisma.preObraTarefa.create({
      data: {
        preObraId: id,
        titulo,
        tipo: tipo || 'CUSTOM',
        dataAgendada: dataAgendada ? new Date(dataAgendada) : null,
        horaAgendada,
        responsavelNome,
        responsavelId,
        observacoes,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    res.status(201).json({ success: true, data: tarefa });
  } catch (error: any) {
    console.error('[PreObra] Error creating tarefa:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id/tarefas/:tarefaId - Update task
router.put('/:id/tarefas/:tarefaId', async (req: Request, res: Response) => {
  try {
    const { tarefaId } = req.params;
    const { titulo, tipo, status, dataAgendada, horaAgendada, dataRealizacao, responsavelNome, responsavelId, observacoes } = req.body;

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (status !== undefined) updateData.status = status;
    if (dataAgendada !== undefined) updateData.dataAgendada = dataAgendada ? new Date(dataAgendada) : null;
    if (horaAgendada !== undefined) updateData.horaAgendada = horaAgendada;
    if (dataRealizacao !== undefined) updateData.dataRealizacao = dataRealizacao ? new Date(dataRealizacao) : null;
    if (responsavelNome !== undefined) updateData.responsavelNome = responsavelNome;
    if (responsavelId !== undefined) updateData.responsavelId = responsavelId;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    // Auto-set dataRealizacao when marking as completed
    if (status === 'CONCLUIDA' && !dataRealizacao) {
      updateData.dataRealizacao = new Date();
    }

    const tarefa = await prisma.preObraTarefa.update({
      where: { id: tarefaId },
      data: updateData,
    });

    res.json({ success: true, data: tarefa });
  } catch (error: any) {
    console.error('[PreObra] Error updating tarefa:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /pre-obra/:id/tarefas/:tarefaId - Delete task
router.delete('/:id/tarefas/:tarefaId', async (req: Request, res: Response) => {
  try {
    const { tarefaId } = req.params;

    await prisma.preObraTarefa.delete({
      where: { id: tarefaId },
    });

    res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    console.error('[PreObra] Error deleting tarefa:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/tarefas/reorder - Reorder tasks
router.post('/:id/tarefas/reorder', async (req: Request, res: Response) => {
  try {
    const { tarefaIds } = req.body;

    // Update sortOrder for each task
    await Promise.all(
      tarefaIds.map((id: string, index: number) =>
        prisma.preObraTarefa.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    res.json({ success: true, message: 'Tasks reordered' });
  } catch (error: any) {
    console.error('[PreObra] Error reordering tarefas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/tarefas/generate - Auto-generate default tasks
router.post('/:id/tarefas/generate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Default task templates for pre-obra
    const defaultTasks = [
      { titulo: 'Enviar orientacoes de preparacao', tipo: 'PREPARACAO_CLIENTE' as PreObraTarefaTipo },
      { titulo: 'Agendar visita tecnica de afericao', tipo: 'VISITA_TECNICA_AFERICAO' as PreObraTarefaTipo },
      { titulo: 'Realizar visita tecnica', tipo: 'VISITA_TECNICA_AFERICAO' as PreObraTarefaTipo },
      { titulo: 'Agendar reuniao orientativa', tipo: 'REUNIAO_ORIENTATIVA' as PreObraTarefaTipo },
      { titulo: 'Realizar reuniao orientativa', tipo: 'REUNIAO_ORIENTATIVA' as PreObraTarefaTipo },
      { titulo: 'Enviar amostras de cor', tipo: 'ENVIO_AMOSTRAS' as PreObraTarefaTipo },
      { titulo: 'Confirmar cor com cliente', tipo: 'DEFINICAO_COR' as PreObraTarefaTipo },
      { titulo: 'Solicitar materiais', tipo: 'ENVIO_MATERIAIS' as PreObraTarefaTipo },
      { titulo: 'Confirmar recebimento de materiais', tipo: 'CONFIRMACAO_RECEBIMENTO' as PreObraTarefaTipo },
    ];

    // Delete existing tasks
    await prisma.preObraTarefa.deleteMany({
      where: { preObraId: id },
    });

    // Create new tasks
    const tarefas = await Promise.all(
      defaultTasks.map((task, index) =>
        prisma.preObraTarefa.create({
          data: {
            preObraId: id,
            titulo: task.titulo,
            tipo: task.tipo,
            sortOrder: index,
          },
        })
      )
    );

    res.json({ success: true, data: tarefas });
  } catch (error: any) {
    console.error('[PreObra] Error generating tarefas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PROVISIONAMENTOS (MATERIAIS) ROUTES
// =============================================

// GET /pre-obra/:id/provisionamentos - List materials
router.get('/:id/provisionamentos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, tipo } = req.query;

    const where: any = { preObraId: id };
    if (status) where.status = status as ProvisionamentoStatus;
    if (tipo) where.tipo = tipo as ProvisionamentoTipo;

    const provisionamentos = await prisma.preObraProvisionamento.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: provisionamentos });
  } catch (error: any) {
    console.error('[PreObra] Error listing provisionamentos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/provisionamentos - Create material item
router.post('/:id/provisionamentos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, nome, descricao, quantidade, unidade, baseadoEmM2, fatorM2, custoUnitario, fornecedor } = req.body;

    // Get max sortOrder
    const maxOrder = await prisma.preObraProvisionamento.findFirst({
      where: { preObraId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    // Calculate custoTotal if custoUnitario provided
    const custoTotal = custoUnitario ? parseFloat(custoUnitario) * parseFloat(quantidade) : null;

    const provisionamento = await prisma.preObraProvisionamento.create({
      data: {
        preObraId: id,
        tipo: tipo || 'MATERIAL',
        nome,
        descricao,
        quantidade: parseFloat(quantidade),
        unidade: unidade || 'un',
        baseadoEmM2: baseadoEmM2 || false,
        fatorM2: fatorM2 ? parseFloat(fatorM2) : null,
        custoUnitario: custoUnitario ? parseFloat(custoUnitario) : null,
        custoTotal,
        fornecedor,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    res.status(201).json({ success: true, data: provisionamento });
  } catch (error: any) {
    console.error('[PreObra] Error creating provisionamento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id/provisionamentos/:provId - Update material item
router.put('/:id/provisionamentos/:provId', async (req: Request, res: Response) => {
  try {
    const { provId } = req.params;
    const { tipo, nome, descricao, quantidade, unidade, status, baseadoEmM2, fatorM2, custoUnitario, fornecedor, notaFiscal, dataSolicitacao, dataPrevisao, dataRecebimento } = req.body;

    const updateData: any = {};
    if (tipo !== undefined) updateData.tipo = tipo;
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (quantidade !== undefined) updateData.quantidade = parseFloat(quantidade);
    if (unidade !== undefined) updateData.unidade = unidade;
    if (status !== undefined) updateData.status = status;
    if (baseadoEmM2 !== undefined) updateData.baseadoEmM2 = baseadoEmM2;
    if (fatorM2 !== undefined) updateData.fatorM2 = fatorM2 ? parseFloat(fatorM2) : null;
    if (custoUnitario !== undefined) {
      updateData.custoUnitario = custoUnitario ? parseFloat(custoUnitario) : null;
      // Recalculate total if we have quantidade
      if (custoUnitario && quantidade) {
        updateData.custoTotal = parseFloat(custoUnitario) * parseFloat(quantidade);
      }
    }
    if (fornecedor !== undefined) updateData.fornecedor = fornecedor;
    if (notaFiscal !== undefined) updateData.notaFiscal = notaFiscal;
    if (dataSolicitacao !== undefined) updateData.dataSolicitacao = dataSolicitacao ? new Date(dataSolicitacao) : null;
    if (dataPrevisao !== undefined) updateData.dataPrevisao = dataPrevisao ? new Date(dataPrevisao) : null;
    if (dataRecebimento !== undefined) updateData.dataRecebimento = dataRecebimento ? new Date(dataRecebimento) : null;

    // Auto-set dates based on status change
    if (status === 'SOLICITADO' && !dataSolicitacao) {
      updateData.dataSolicitacao = new Date();
    }
    if (status === 'RECEBIDO' && !dataRecebimento) {
      updateData.dataRecebimento = new Date();
    }

    const provisionamento = await prisma.preObraProvisionamento.update({
      where: { id: provId },
      data: updateData,
    });

    res.json({ success: true, data: provisionamento });
  } catch (error: any) {
    console.error('[PreObra] Error updating provisionamento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /pre-obra/:id/provisionamentos/:provId - Delete material item
router.delete('/:id/provisionamentos/:provId', async (req: Request, res: Response) => {
  try {
    const { provId } = req.params;

    await prisma.preObraProvisionamento.delete({
      where: { id: provId },
    });

    res.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    console.error('[PreObra] Error deleting provisionamento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/provisionamentos/calculate - Calculate from m2
router.post('/:id/provisionamentos/calculate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get pre-obra with project measurements
    const preObra = await prisma.preObra.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            m2Total: true,
            m2Piso: true,
            m2Parede: true,
            m2Teto: true,
          },
        },
      },
    });

    if (!preObra) {
      return res.status(404).json({ success: false, error: 'Pre-obra not found' });
    }

    const m2Total = Number(preObra.project.m2Total) || 0;
    const m2Piso = Number(preObra.project.m2Piso) || 0;
    const m2Parede = Number(preObra.project.m2Parede) || 0;

    // Default material templates with factors per m2
    const materialTemplates = [
      { nome: 'Stelion Base', fatorM2: 2.5, unidade: 'kg', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'piso' },
      { nome: 'Stelion Top', fatorM2: 1.5, unidade: 'kg', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'piso' },
      { nome: 'Primer', fatorM2: 0.15, unidade: 'litros', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'total' },
      { nome: 'Selador', fatorM2: 0.1, unidade: 'litros', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'total' },
      { nome: 'Verniz', fatorM2: 0.12, unidade: 'litros', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'total' },
      { nome: 'Lilit (parede)', fatorM2: 1.8, unidade: 'kg', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'parede' },
      { nome: 'Lixas', fatorM2: 0.05, unidade: 'un', tipo: 'FERRAMENTA' as ProvisionamentoTipo, baseM2: 'total' },
      { nome: 'Fita de protecao', fatorM2: 0.5, unidade: 'm', tipo: 'MATERIAL' as ProvisionamentoTipo, baseM2: 'total' },
    ];

    // Delete existing calculated items
    await prisma.preObraProvisionamento.deleteMany({
      where: {
        preObraId: id,
        baseadoEmM2: true,
      },
    });

    // Create calculated items
    const provisionamentos = await Promise.all(
      materialTemplates.map(async (template, index) => {
        let baseArea = m2Total;
        if (template.baseM2 === 'piso') baseArea = m2Piso;
        if (template.baseM2 === 'parede') baseArea = m2Parede;

        // Skip if base area is 0
        if (baseArea === 0) return null;

        const quantidade = Math.ceil(baseArea * template.fatorM2 * 100) / 100;

        return prisma.preObraProvisionamento.create({
          data: {
            preObraId: id,
            tipo: template.tipo,
            nome: template.nome,
            quantidade,
            unidade: template.unidade,
            baseadoEmM2: true,
            fatorM2: template.fatorM2,
            sortOrder: index,
          },
        });
      })
    );

    res.json({
      success: true,
      data: provisionamentos.filter(Boolean),
      m2: { total: m2Total, piso: m2Piso, parede: m2Parede },
    });
  } catch (error: any) {
    console.error('[PreObra] Error calculating provisionamentos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// AMOSTRAS (CORES) ROUTES
// =============================================

// GET /pre-obra/:id/amostras - List samples
router.get('/:id/amostras', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const where: any = { preObraId: id };
    if (status) where.status = status as AmostraStatus;

    const amostras = await prisma.preObraAmostra.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: amostras });
  } catch (error: any) {
    console.error('[PreObra] Error listing amostras:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/amostras - Create sample
router.post('/:id/amostras', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { corNome, corCodigo, corHex, fotoAmostraUrl, fotoReferenciaUrl } = req.body;

    const amostra = await prisma.preObraAmostra.create({
      data: {
        preObraId: id,
        corNome,
        corCodigo,
        corHex,
        fotoAmostraUrl,
        fotoReferenciaUrl,
      },
    });

    res.status(201).json({ success: true, data: amostra });
  } catch (error: any) {
    console.error('[PreObra] Error creating amostra:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /pre-obra/:id/amostras/:amostraId - Update sample
router.put('/:id/amostras/:amostraId', async (req: Request, res: Response) => {
  try {
    const { amostraId } = req.params;
    const { corNome, corCodigo, corHex, status, dataEnvio, dataRecebimento, dataAvaliacao, aprovada, feedbackCliente, fotoAmostraUrl, fotoReferenciaUrl } = req.body;

    const updateData: any = {};
    if (corNome !== undefined) updateData.corNome = corNome;
    if (corCodigo !== undefined) updateData.corCodigo = corCodigo;
    if (corHex !== undefined) updateData.corHex = corHex;
    if (status !== undefined) updateData.status = status;
    if (dataEnvio !== undefined) updateData.dataEnvio = dataEnvio ? new Date(dataEnvio) : null;
    if (dataRecebimento !== undefined) updateData.dataRecebimento = dataRecebimento ? new Date(dataRecebimento) : null;
    if (dataAvaliacao !== undefined) updateData.dataAvaliacao = dataAvaliacao ? new Date(dataAvaliacao) : null;
    if (aprovada !== undefined) updateData.aprovada = aprovada;
    if (feedbackCliente !== undefined) updateData.feedbackCliente = feedbackCliente;
    if (fotoAmostraUrl !== undefined) updateData.fotoAmostraUrl = fotoAmostraUrl;
    if (fotoReferenciaUrl !== undefined) updateData.fotoReferenciaUrl = fotoReferenciaUrl;

    // Auto-set dates based on status
    if (status === 'ENVIADA' && !dataEnvio) {
      updateData.dataEnvio = new Date();
    }
    if (status === 'RECEBIDA' && !dataRecebimento) {
      updateData.dataRecebimento = new Date();
    }
    if ((status === 'APROVADA' || status === 'REJEITADA') && !dataAvaliacao) {
      updateData.dataAvaliacao = new Date();
      if (status === 'APROVADA') updateData.aprovada = true;
      if (status === 'REJEITADA') updateData.aprovada = false;
    }

    const amostra = await prisma.preObraAmostra.update({
      where: { id: amostraId },
      data: updateData,
    });

    res.json({ success: true, data: amostra });
  } catch (error: any) {
    console.error('[PreObra] Error updating amostra:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /pre-obra/:id/amostras/:amostraId - Delete sample
router.delete('/:id/amostras/:amostraId', async (req: Request, res: Response) => {
  try {
    const { amostraId } = req.params;

    await prisma.preObraAmostra.delete({
      where: { id: amostraId },
    });

    res.json({ success: true, message: 'Sample deleted' });
  } catch (error: any) {
    console.error('[PreObra] Error deleting amostra:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /pre-obra/:id/amostras/:amostraId/select - Mark as final selection
router.post('/:id/amostras/:amostraId/select', async (req: Request, res: Response) => {
  try {
    const { id, amostraId } = req.params;

    // Unselect all other samples
    await prisma.preObraAmostra.updateMany({
      where: { preObraId: id },
      data: { selecionadaFinal: false },
    });

    // Select this sample
    const amostra = await prisma.preObraAmostra.update({
      where: { id: amostraId },
      data: {
        selecionadaFinal: true,
        status: 'APROVADA',
        aprovada: true,
        dataAvaliacao: new Date(),
      },
    });

    // Update pre-obra corDefinida flag
    await prisma.preObra.update({
      where: { id },
      data: {
        corDefinida: true,
        corDefinidaEm: new Date(),
      },
    });

    res.json({ success: true, data: amostra });
  } catch (error: any) {
    console.error('[PreObra] Error selecting amostra:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
