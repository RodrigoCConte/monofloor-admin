import { Router, Request, Response } from 'express';
import { PrismaClient, ContratoStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// PIUI (CONTRATOS) MODULE ROUTES
// =============================================

// GET /piui - List all contracts with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as ContratoStatus;
    }

    if (search) {
      where.OR = [
        { project: { cliente: { contains: search as string, mode: 'insensitive' } } },
        { numero: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [contratos, total] = await Promise.all([
      prisma.contrato.findMany({
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
          parcelas: {
            orderBy: { numero: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.contrato.count({ where }),
    ]);

    res.json({
      success: true,
      data: contratos,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('[PIUI] Error listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /piui/stats - Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      prisma.contrato.count({ where: { status: 'DRAFT' } }),
      prisma.contrato.count({ where: { status: 'AGUARDANDO_APROVACAO' } }),
      prisma.contrato.count({ where: { status: 'APROVADO_INTERNO' } }),
      prisma.contrato.count({ where: { status: 'ENVIADO_CLIENTE' } }),
      prisma.contrato.count({ where: { status: 'APROVADO' } }),
      prisma.contrato.count({ where: { status: 'ASSINADO' } }),
      // Valor total de contratos assinados este mês
      prisma.contrato.aggregate({
        where: {
          status: 'ASSINADO',
          dataAssinatura: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { valorContratado: true },
        _count: true,
      }),
      // Parcelas vencidas não pagas
      prisma.parcela.count({
        where: {
          pago: false,
          vencimento: { lt: new Date() },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        rascunhos: stats[0],
        aguardandoAprovacao: stats[1],
        aprovadoInterno: stats[2],
        enviadoCliente: stats[3],
        aprovado: stats[4],
        assinado: stats[5],
        valorMes: stats[6]._sum.valorContratado || 0,
        contratosMes: stats[6]._count,
        parcelasVencidas: stats[7],
      },
    });
  } catch (error: any) {
    console.error('[PIUI] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /piui/:id - Get single contract
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            comercialData: true,
          },
        },
        parcelas: {
          orderBy: { numero: 'asc' },
        },
      },
    });

    if (!contrato) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    res.json({ success: true, data: contrato });
  } catch (error: any) {
    console.error('[PIUI] Error getting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /piui/:id - Update contract
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      numero,
      valorContratado,
      valorEntrada,
      formaPagamento,
      escopoInicialUrl,
      escopoAprovadoUrl,
      m2Piso,
      m2Parede,
      m2Rodape,
      cores,
      materiais,
      isTelada,
      isFaseada,
      detalheFaseamento,
      detalheTela,
    } = req.body;

    const contrato = await prisma.contrato.update({
      where: { id },
      data: {
        numero,
        valorContratado: valorContratado ? parseFloat(valorContratado) : undefined,
        valorEntrada: valorEntrada ? parseFloat(valorEntrada) : null,
        formaPagamento,
        escopoInicialUrl,
        escopoAprovadoUrl,
        m2Piso: m2Piso ? parseFloat(m2Piso) : null,
        m2Parede: m2Parede ? parseFloat(m2Parede) : null,
        m2Rodape: m2Rodape ? parseFloat(m2Rodape) : null,
        cores: cores || [],
        materiais: materiais || [],
        isTelada: isTelada || false,
        isFaseada: isFaseada || false,
        detalheFaseamento,
        detalheTela,
      },
      include: {
        project: true,
      },
    });

    res.json({ success: true, data: contrato });
  } catch (error: any) {
    console.error('[PIUI] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /piui/:id/status - Update contract status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const oldContrato = await prisma.contrato.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!oldContrato) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const updateData: any = { status };

    if (status === 'APROVADO_INTERNO') {
      updateData.aprovadoInternamente = true;
      updateData.dataAprovacaoInterna = new Date();
    } else if (status === 'APROVADO') {
      updateData.aprovadoCliente = true;
      updateData.dataAprovacaoCliente = new Date();
    } else if (status === 'ASSINADO') {
      updateData.assinadoDigitalmente = true;
      updateData.dataAssinatura = new Date();
    }

    const contrato = await prisma.contrato.update({
      where: { id },
      data: updateData,
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: oldContrato.projectId,
        modulo: 'PIUI',
        tipo: 'STATUS_CHANGE',
        titulo: `Contrato: ${status}`,
        dadosAnteriores: { status: oldContrato.status },
        dadosNovos: { status },
      },
    });

    // If ASSINADO, move to PLANEJAMENTO
    if (status === 'ASSINADO') {
      await prisma.project.update({
        where: { id: oldContrato.projectId },
        data: { currentModule: 'PLANEJAMENTO' },
      });

      // Auto-create planejamento
      await prisma.planejamento.create({
        data: {
          projectId: oldContrato.projectId,
        },
      });
    }

    res.json({ success: true, data: contrato });
  } catch (error: any) {
    console.error('[PIUI] Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PARCELAS
// =============================================

// POST /piui/:id/parcelas - Add payment installment
router.post('/:id/parcelas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { valor, vencimento, descricao } = req.body;

    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: { parcelas: { orderBy: { numero: 'desc' }, take: 1 } },
    });

    if (!contrato) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const nextNumber = (contrato.parcelas[0]?.numero || 0) + 1;

    const parcela = await prisma.parcela.create({
      data: {
        contratoId: id,
        numero: nextNumber,
        valor: parseFloat(valor),
        vencimento: new Date(vencimento),
        descricao,
      },
    });

    res.json({ success: true, data: parcela });
  } catch (error: any) {
    console.error('[PIUI] Error adding installment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /piui/parcelas/:parcelaId/pagar - Mark installment as paid
router.put('/parcelas/:parcelaId/pagar', async (req: Request, res: Response) => {
  try {
    const { parcelaId } = req.params;
    const { dataPagamento, comprovante } = req.body;

    const parcela = await prisma.parcela.update({
      where: { id: parcelaId },
      data: {
        pago: true,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date(),
        comprovante,
      },
      include: {
        contrato: {
          include: { project: true },
        },
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: parcela.contrato.projectId,
        modulo: 'PIUI',
        tipo: 'PARCELA_PAGA',
        titulo: `Parcela ${parcela.numero} paga`,
        descricao: `Valor: R$ ${parcela.valor}`,
      },
    });

    res.json({ success: true, data: parcela });
  } catch (error: any) {
    console.error('[PIUI] Error marking as paid:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /piui/parcelas/:parcelaId - Delete installment
router.delete('/parcelas/:parcelaId', async (req: Request, res: Response) => {
  try {
    const { parcelaId } = req.params;

    await prisma.parcela.delete({
      where: { id: parcelaId },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[PIUI] Error deleting installment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /piui/parcelas/vencidas - Overdue installments
router.get('/parcelas/vencidas', async (_req: Request, res: Response) => {
  try {
    const parcelas = await prisma.parcela.findMany({
      where: {
        pago: false,
        vencimento: { lt: new Date() },
      },
      include: {
        contrato: {
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
      orderBy: { vencimento: 'asc' },
    });

    res.json({ success: true, data: parcelas });
  } catch (error: any) {
    console.error('[PIUI] Error getting overdue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /piui/:id/gerar-parcelas - Auto-generate installments
router.post('/:id/gerar-parcelas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantidadeParcelas, valorEntrada, dataInicio } = req.body;

    const contrato = await prisma.contrato.findUnique({
      where: { id },
    });

    if (!contrato) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // Delete existing parcelas
    await prisma.parcela.deleteMany({
      where: { contratoId: id },
    });

    const parcelas: any[] = [];
    const valorTotal = Number(contrato.valorContratado);
    const entrada = valorEntrada ? parseFloat(valorEntrada) : 0;
    const valorRestante = valorTotal - entrada;
    const valorParcela = valorRestante / quantidadeParcelas;

    const startDate = new Date(dataInicio);

    // Entrada
    if (entrada > 0) {
      parcelas.push({
        contratoId: id,
        numero: 0,
        valor: entrada,
        vencimento: startDate,
        descricao: 'Entrada',
      });
    }

    // Parcelas
    for (let i = 1; i <= quantidadeParcelas; i++) {
      const vencimento = new Date(startDate);
      vencimento.setMonth(vencimento.getMonth() + i);

      parcelas.push({
        contratoId: id,
        numero: i,
        valor: valorParcela,
        vencimento,
        descricao: `${i}ª Parcela`,
      });
    }

    await prisma.parcela.createMany({
      data: parcelas,
    });

    const createdParcelas = await prisma.parcela.findMany({
      where: { contratoId: id },
      orderBy: { numero: 'asc' },
    });

    res.json({ success: true, data: createdParcelas });
  } catch (error: any) {
    console.error('[PIUI] Error generating installments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as piuiRoutes };
