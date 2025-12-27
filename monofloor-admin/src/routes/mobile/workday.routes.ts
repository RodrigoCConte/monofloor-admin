import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { DayType, ScheduleStatus } from '@prisma/client';

const router = Router();

// =============================================
// WORK DAY CHECK - Verificar tipo do dia
// =============================================

// GET /mobile/workday/today - Verificar se hoje é dia de trabalho
router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
    const currentYear = today.getFullYear();

    // Verificar se é feriado
    const holiday = await prisma.holiday.findFirst({
      where: {
        isActive: true,
        date: today,
        OR: [
          { year: currentYear },
          { year: null }, // Feriados recorrentes
        ],
      },
    });

    // Verificar se está escalado para sábado
    let saturdaySchedule = null;
    if (dayOfWeek === 6) {
      saturdaySchedule = await prisma.saturdaySchedule.findFirst({
        where: {
          userId,
          date: today,
        },
        include: {
          project: {
            select: { id: true, title: true, cliente: true },
          },
        },
      });
    }

    // Verificar se já respondeu hoje
    const existingResponse = await prisma.workDayResponse.findUnique({
      where: {
        date_userId: {
          date: today,
          userId,
        },
      },
    });

    // Determinar tipo do dia e se precisa perguntar
    let dayType: DayType | 'WEEKDAY' | 'SCHEDULED_SATURDAY' = 'WEEKDAY';
    let needsConfirmation = false;
    let message = '';

    if (holiday) {
      dayType = DayType.HOLIDAY;
      needsConfirmation = !existingResponse;
      message = `Hoje é feriado: ${holiday.name}`;
    } else if (dayOfWeek === 0) {
      dayType = DayType.SUNDAY;
      needsConfirmation = !existingResponse;
      message = 'Hoje é domingo';
    } else if (dayOfWeek === 6) {
      if (saturdaySchedule) {
        dayType = 'SCHEDULED_SATURDAY';
        needsConfirmation = saturdaySchedule.status === ScheduleStatus.SCHEDULED;
        message = 'Você está escalado para trabalhar hoje';
      } else {
        dayType = DayType.SATURDAY;
        needsConfirmation = !existingResponse;
        message = 'Hoje é sábado';
      }
    }

    res.json({
      success: true,
      data: {
        date: today.toISOString(),
        dayOfWeek,
        dayType,
        isHoliday: !!holiday,
        holidayName: holiday?.name || null,
        isSunday: dayOfWeek === 0,
        isSaturday: dayOfWeek === 6,
        isScheduledSaturday: !!saturdaySchedule,
        saturdaySchedule,
        needsConfirmation,
        hasResponded: !!existingResponse,
        previousResponse: existingResponse,
        message,
      },
    });
  } catch (error: any) {
    console.error('Error checking work day:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// POST /mobile/workday/respond - Responder se vai trabalhar
router.post('/respond', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { willWork, reason, dayType } = req.body;

    if (willWork === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Campo willWork é obrigatório' },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já respondeu
    const existingResponse = await prisma.workDayResponse.findUnique({
      where: {
        date_userId: {
          date: today,
          userId,
        },
      },
    });

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        error: { message: 'Você já respondeu para hoje' },
      });
    }

    // Criar resposta
    const response = await prisma.workDayResponse.create({
      data: {
        date: today,
        userId,
        dayType: dayType || DayType.SUNDAY,
        willWork,
        reason: !willWork ? reason : null,
      },
    });

    // Se é sábado escalado, atualizar status da escala
    if (dayType === 'SCHEDULED_SATURDAY' || today.getDay() === 6) {
      const schedule = await prisma.saturdaySchedule.findFirst({
        where: {
          userId,
          date: today,
        },
      });

      if (schedule) {
        await prisma.saturdaySchedule.update({
          where: { id: schedule.id },
          data: {
            status: willWork ? ScheduleStatus.CONFIRMED : ScheduleStatus.DECLINED,
            confirmedAt: willWork ? new Date() : null,
            declinedAt: !willWork ? new Date() : null,
            declineReason: !willWork ? reason : null,
          },
        });
      }
    }

    res.json({
      success: true,
      data: response,
      message: willWork
        ? 'Ótimo! Bom trabalho hoje!'
        : 'Tudo bem, descanse bem!',
    });
  } catch (error: any) {
    console.error('Error responding to work day:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// GET /mobile/workday/schedule - Ver escalas do usuário
router.get('/schedule', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { startDate, endDate } = req.query;

    const now = new Date();
    const start = startDate ? new Date(startDate as string) : now;
    const end = endDate
      ? new Date(endDate as string)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fim do mês

    const schedules = await prisma.saturdaySchedule.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        project: {
          select: { id: true, title: true, cliente: true, endereco: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    console.error('Error fetching user schedule:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// GET /mobile/workday/holidays - Ver feriados do mês/ano
router.get('/holidays', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    let dateFilter: any = {};

    if (month) {
      const targetMonth = parseInt(month as string) - 1;
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const holidays = await prisma.holiday.findMany({
      where: {
        isActive: true,
        ...dateFilter,
        OR: [
          { year: targetYear },
          { year: null },
        ],
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      success: true,
      data: holidays,
    });
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// POST /mobile/workday/confirm-saturday - Confirmar sábado escalado
router.post('/confirm-saturday/:scheduleId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { scheduleId } = req.params;

    const schedule = await prisma.saturdaySchedule.findFirst({
      where: {
        id: scheduleId,
        userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { message: 'Escala não encontrada' },
      });
    }

    const updated = await prisma.saturdaySchedule.update({
      where: { id: scheduleId },
      data: {
        status: ScheduleStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Presença confirmada para o sábado!',
    });
  } catch (error: any) {
    console.error('Error confirming saturday:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// POST /mobile/workday/decline-saturday - Recusar sábado escalado
router.post('/decline-saturday/:scheduleId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { scheduleId } = req.params;
    const { reason } = req.body;

    const schedule = await prisma.saturdaySchedule.findFirst({
      where: {
        id: scheduleId,
        userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { message: 'Escala não encontrada' },
      });
    }

    const updated = await prisma.saturdaySchedule.update({
      where: { id: scheduleId },
      data: {
        status: ScheduleStatus.DECLINED,
        declinedAt: new Date(),
        declineReason: reason,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Recusa registrada. O administrador será notificado.',
    });
  } catch (error: any) {
    console.error('Error declining saturday:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

export default router;
