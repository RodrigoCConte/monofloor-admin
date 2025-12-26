import { Router, Request, Response } from 'express';
import { PrismaClient, ProjectModule } from '@prisma/client';
import { migratePipedrive, migratePipefyOperacoes, migrateAll, syncPipefyModules } from '../../services/data-migration.service';

const router = Router();
const prisma = new PrismaClient();

// Pipedrive API configuration
const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

// Pipefy API configuration
const PIPEFY_API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NjY2NzE2MTUsImp0aSI6IjE0YWQ1NjM1LTE2OTktNDAxZS04ODQ2LWI4ZDBmMDUzZGZhNCIsInN1YiI6MzA3MTY5NjIyLCJ1c2VyIjp7ImlkIjozMDcxNjk2MjIsImVtYWlsIjoicm9kcmlnb0Btb25vZmxvb3IuY29tLmJyIn0sInVzZXJfdHlwZSI6ImF1dGhlbnRpY2F0ZWQifQ.iIFoE3qzRA17wSuDRQ_fpLmFKq8YAuVhb-WI37UjhZ_JvGgTTbjoetnUkODxK_eo3CYkvhuHh6ZBB76D-FIoyA';
const PIPEFY_BASE_URL = 'https://api.pipefy.com/graphql';

// Pipefy Pipe IDs
const PIPEFY_PIPES = {
  OPERACOES: '306410007',
  POS_VENDA: '306434917',
  COMERCIAL: '306497797',
  EM_EXECUCAO: '306848975',
};

// =============================================
// ENTERPRISE HUB - Unified Project View
// =============================================

// GET /enterprise/dashboard - Enterprise dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      // By module
      prisma.project.count({ where: { currentModule: 'COMERCIAL' } }),
      prisma.project.count({ where: { currentModule: 'PIUI' } }),
      prisma.project.count({ where: { currentModule: 'PLANEJAMENTO' } }),
      prisma.project.count({ where: { currentModule: 'EXECUCAO' } }),
      prisma.project.count({ where: { currentModule: 'FINALIZADO' } }),
      prisma.project.count({ where: { currentModule: 'POS_VENDA' } }),
      prisma.project.count(),

      // Financial
      prisma.contrato.aggregate({
        where: { status: 'ASSINADO' },
        _sum: { valorContratado: true },
      }),
      prisma.parcela.aggregate({
        where: { pago: false, vencimento: { lt: new Date() } },
        _sum: { valor: true },
        _count: true,
      }),

      // Execution
      prisma.project.count({ where: { status: 'EM_EXECUCAO' } }),
      prisma.checkin.count({
        where: {
          checkoutAt: null,
          checkinAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    res.json({
      success: true,
      dashboard: {
        byModule: {
          comercial: stats[0],
          piui: stats[1],
          planejamento: stats[2],
          execucao: stats[3],
          finalizado: stats[4],
          posVenda: stats[5],
          total: stats[6],
        },
        financial: {
          valorTotalContratado: stats[7]._sum.valorContratado || 0,
          parcelasVencidas: stats[8]._count,
          valorVencido: stats[8]._sum.valor || 0,
        },
        execution: {
          obrasAtivas: stats[9],
          checkinsHoje: stats[10],
        },
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error getting dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /enterprise/projects - Unified project list
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const { module, status, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (module && module !== 'ALL') {
      where.currentModule = module as ProjectModule;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { cliente: { contains: search as string, mode: 'insensitive' } },
        { endereco: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          comercialData: {
            select: { status: true, budgetEstimado: true },
          },
          contrato: {
            select: { status: true, valorContratado: true },
          },
          planejamento: {
            select: { status: true },
          },
          execucao: {
            select: { status: true, percentual: true },
          },
          _count: {
            select: { posVendas: true, checkins: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error listing projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /enterprise/projects/:id - Complete project view
router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        comercialData: {
          include: {
            propostas: { orderBy: { versao: 'desc' } },
            followUps: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        contrato: {
          include: {
            parcelas: { orderBy: { numero: 'asc' } },
          },
        },
        planejamento: {
          include: {
            visitasTecnicas: { orderBy: { createdAt: 'desc' } },
            ordemServico: true,
            logistica: true,
          },
        },
        execucao: {
          include: {
            etapas: { orderBy: { ordem: 'asc' } },
            checklists: { orderBy: { createdAt: 'desc' } },
          },
        },
        posVendas: {
          include: {
            visitasQualidade: true,
            intervencao: true,
          },
          orderBy: { dataAcionamento: 'desc' },
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        videos: {
          orderBy: { ordem: 'asc' },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, photoUrl: true, role: true },
            },
          },
        },
        checkins: {
          orderBy: { checkinAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error: any) {
    console.error('[Enterprise] Error getting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /enterprise/projects/:id/timeline - Project timeline
router.get('/projects/:id/timeline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { module, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { projectId: id };

    if (module && module !== 'ALL') {
      where.modulo = module as ProjectModule;
    }

    const [events, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.timelineEvent.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error getting timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /enterprise/projects/:id/videos - Add video to project
router.post('/projects/:id/videos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, url, thumbnailUrl, duracaoSegundos, tipo, fase } = req.body;

    const existingVideos = await prisma.projectVideo.count({ where: { projectId: id } });

    const video = await prisma.projectVideo.create({
      data: {
        projectId: id,
        titulo,
        descricao,
        url,
        thumbnailUrl,
        duracaoSegundos,
        tipo,
        fase,
        ordem: existingVideos,
      },
    });

    res.json({ success: true, data: video });
  } catch (error: any) {
    console.error('[Enterprise] Error adding video:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// MIGRATION - Import from Pipedrive and Pipefy
// =============================================

// Helper function to fetch from Pipedrive
async function fetchPipedrive(endpoint: string) {
  const response = await fetch(`${PIPEDRIVE_BASE_URL}${endpoint}&api_token=${PIPEDRIVE_API_TOKEN}`);
  return response.json();
}

// Helper function to fetch from Pipefy
async function fetchPipefy(query: string) {
  const response = await fetch(PIPEFY_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PIPEFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return response.json();
}

// GET /enterprise/migration/status - Migration status
router.get('/migration/status', async (_req: Request, res: Response) => {
  try {
    const [
      totalProjects,
      withPipedrive,
      withPipefy,
      comercialCount,
      piuiCount,
      planejamentoCount,
      execucaoCount,
      posVendaCount,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.comercialData.count({ where: { pipedriveDealId: { not: null } } }),
      prisma.project.count({ where: { pipefyCardId: { not: null } } }),
      prisma.comercialData.count(),
      prisma.contrato.count(),
      prisma.planejamento.count(),
      prisma.execucao.count(),
      prisma.posVenda.count(),
    ]);

    res.json({
      success: true,
      status: {
        totalProjects,
        withPipedrive,
        withPipefy,
        modules: {
          comercial: comercialCount,
          piui: piuiCount,
          planejamento: planejamentoCount,
          execucao: execucaoCount,
          posVenda: posVendaCount,
        },
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error getting migration status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /enterprise/migration/pipedrive - Import ALL from Pipedrive (complete migration)
router.post('/migration/pipedrive', async (_req: Request, res: Response) => {
  try {
    console.log('[Enterprise] Starting Pipedrive complete migration...');
    const result = await migratePipedrive();

    res.json({
      success: result.success,
      result: {
        imported: result.imported,
        updated: result.updated,
        errors: result.errors.length,
        errorDetails: result.errors.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error importing from Pipedrive:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /enterprise/migration/pipefy - Import ALL from Pipefy OPERAÇÕES (complete migration)
router.post('/migration/pipefy', async (_req: Request, res: Response) => {
  try {
    console.log('[Enterprise] Starting Pipefy OPERAÇÕES complete migration...');
    const result = await migratePipefyOperacoes();

    res.json({
      success: result.success,
      result: {
        imported: result.imported,
        updated: result.updated,
        errors: result.errors.length,
        errorDetails: result.errors.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error importing from Pipefy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /enterprise/migration/pipefy-posvenda - Import from Pipefy PÓS-VENDA
router.post('/migration/pipefy-posvenda', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.body;
    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    const query = `{
      allCards(pipeId: ${PIPEFY_PIPES.POS_VENDA}, first: ${limit}) {
        edges {
          node {
            id
            title
            current_phase { name }
            fields { name value }
          }
        }
      }
    }`;

    const response = await fetchPipefy(query);

    if (!response.data?.allCards?.edges) {
      return res.status(400).json({ success: false, error: 'Failed to fetch Pipefy cards' });
    }

    for (const edge of response.data.allCards.edges) {
      const card = edge.node;

      try {
        // Find matching project by title
        const matchingProject = await prisma.project.findFirst({
          where: {
            OR: [
              { cliente: { contains: card.title, mode: 'insensitive' } },
              { title: { contains: card.title, mode: 'insensitive' } },
            ],
          },
        });

        if (!matchingProject) {
          skipped++;
          continue;
        }

        // Check if pós-venda already exists for this project with same reason
        const fields: Record<string, string> = {};
        for (const field of card.fields || []) {
          fields[field.name] = field.value;
        }

        const motivo = fields['MOTIVO DO ACIONAMENTO'] || 'Pós-venda importado do Pipefy';

        const existingPosVenda = await prisma.posVenda.findFirst({
          where: {
            projectId: matchingProject.id,
            motivoAcionamento: motivo,
          },
        });

        if (existingPosVenda) {
          skipped++;
          continue;
        }

        // Create pós-venda
        await prisma.posVenda.create({
          data: {
            projectId: matchingProject.id,
            motivoAcionamento: motivo,
            status: card.current_phase?.name?.includes('FINALIZADO') ? 'RESOLVIDO' : 'ABERTO',
          },
        });

        imported++;
      } catch (err: any) {
        errors.push(`Card ${card.id}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      result: {
        imported,
        skipped,
        errors: errors.length,
        errorDetails: errors.slice(0, 10),
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error importing from Pipefy PosVenda:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /enterprise/sync-modules - Sync project modules based on current Pipefy phases
router.post('/sync-modules', async (_req: Request, res: Response) => {
  try {
    console.log('[Enterprise] Starting Pipefy modules sync...');
    const result = await syncPipefyModules();

    res.json({
      success: result.success,
      updated: result.updated,
      total: result.updated.planejamento + result.updated.execucao + result.updated.concluidos,
      errors: result.errors.length,
      errorDetails: result.errors.slice(0, 10),
    });
  } catch (error: any) {
    console.error('[Enterprise] Error syncing modules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /enterprise/migration/full - Full migration (Pipedrive + Pipefy OPERAÇÕES)
router.post('/migration/full', async (_req: Request, res: Response) => {
  try {
    console.log('[Enterprise] Starting FULL migration (Pipedrive + Pipefy)...');
    const results = await migrateAll();

    res.json({
      success: results.pipedrive.success && results.pipefy.success,
      results: {
        pipedrive: {
          imported: results.pipedrive.imported,
          updated: results.pipedrive.updated,
          errors: results.pipedrive.errors.length,
          errorDetails: results.pipedrive.errors.slice(0, 10),
        },
        pipefy: {
          imported: results.pipefy.imported,
          updated: results.pipefy.updated,
          errors: results.pipefy.errors.length,
          errorDetails: results.pipefy.errors.slice(0, 10),
        },
      },
      summary: {
        totalImported: results.pipedrive.imported + results.pipefy.imported,
        totalUpdated: results.pipedrive.updated + results.pipefy.updated,
      },
    });
  } catch (error: any) {
    console.error('[Enterprise] Error in full migration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as enterpriseRoutes };
