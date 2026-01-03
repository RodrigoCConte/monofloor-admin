import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { ScheduleStatus, HolidayType, AbsenceType, DayType } from '@prisma/client';

const router = Router();

// =============================================
// HOLIDAYS - Gerenciamento de Feriados
// =============================================

// GET /admin/scheduling/holidays - Listar feriados
router.get('/holidays', async (req: Request, res: Response) => {
  try {
    const { year, type, includeInactive } = req.query;

    const where: any = {};

    if (year) {
      where.OR = [
        { year: parseInt(year as string) },
        { year: null }, // Feriados recorrentes
      ];
    }

    if (type) {
      where.type = type;
    }

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const holidays = await prisma.holiday.findMany({
      where,
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

// POST /admin/scheduling/holidays - Criar feriado
router.post('/holidays', async (req: Request, res: Response) => {
  try {
    const { date, year, name, description, type } = req.body;

    if (!date || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Data e nome são obrigatórios' },
      });
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        year: year ? parseInt(year) : null,
        name,
        description,
        type: type || HolidayType.NATIONAL,
      },
    });

    res.json({
      success: true,
      data: holiday,
    });
  } catch (error: any) {
    console.error('Error creating holiday:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// PUT /admin/scheduling/holidays/:id - Atualizar feriado
router.put('/holidays/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, year, name, description, type, isActive } = req.body;

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(year !== undefined && { year: year ? parseInt(year) : null }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      data: holiday,
    });
  } catch (error: any) {
    console.error('Error updating holiday:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// DELETE /admin/scheduling/holidays/:id - Remover feriado
router.delete('/holidays/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.holiday.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Feriado removido com sucesso',
    });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// POST /admin/scheduling/holidays/seed - Popular feriados nacionais
router.post('/holidays/seed', async (req: Request, res: Response) => {
  try {
    // Accept year from body OR query param
    const yearParam = req.body.year || req.query.year;
    const targetYear = yearParam ? parseInt(yearParam as string) : new Date().getFullYear();

    // Feriados fixos (repetem todo ano - year = null)
    const fixedHolidays = [
      { month: 1, day: 1, name: 'Confraternização Universal' },
      { month: 4, day: 21, name: 'Tiradentes' },
      { month: 5, day: 1, name: 'Dia do Trabalho' },
      { month: 9, day: 7, name: 'Independência do Brasil' },
      { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
      { month: 11, day: 2, name: 'Finados' },
      { month: 11, day: 15, name: 'Proclamação da República' },
      { month: 12, day: 25, name: 'Natal' },
    ];

    // Feriados móveis para o ano específico (calculados)
    const mobileHolidays = calculateMobileHolidays(targetYear);

    let created = 0;
    let skipped = 0;

    // Criar feriados fixos para o ano específico
    // Cada ano tem suas próprias datas de feriados fixos
    for (const h of fixedHolidays) {
      const date = new Date(targetYear, h.month - 1, h.day);
      date.setHours(0, 0, 0, 0);
      try {
        await prisma.holiday.upsert({
          where: {
            date_year: {
              date,
              year: targetYear,
            },
          },
          create: {
            date,
            year: targetYear,
            name: h.name,
            type: HolidayType.NATIONAL,
          },
          update: {},
        });
        created++;
      } catch (e) {
        skipped++;
      }
    }

    // Criar feriados móveis (com ano específico)
    for (const h of mobileHolidays) {
      const date = new Date(h.date);
      date.setHours(0, 0, 0, 0);
      try {
        await prisma.holiday.upsert({
          where: {
            date_year: {
              date,
              year: targetYear,
            },
          },
          create: {
            date,
            year: targetYear,
            name: h.name,
            type: HolidayType.NATIONAL,
          },
          update: {},
        });
        created++;
      } catch (e) {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Feriados populados para ${targetYear}`,
      data: { created, skipped },
    });
  } catch (error: any) {
    console.error('Error seeding holidays:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// =============================================
// SATURDAY SCHEDULES - Escalas de Sábado
// =============================================

// GET /admin/scheduling/saturdays - Listar escalas
router.get('/saturdays', async (req: Request, res: Response) => {
  try {
    const { date, userId, projectId, status, startDate, endDate } = req.query;

    const where: any = {};

    if (date) {
      where.date = new Date(date as string);
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (userId) {
      where.userId = userId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const schedules = await prisma.saturdaySchedule.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            cliente: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    console.error('Error fetching saturday schedules:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// POST /admin/scheduling/saturdays - Criar escala
router.post('/saturdays', async (req: Request, res: Response) => {
  try {
    const { date, userIds, projectId } = req.body;

    if (!date || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Data e pelo menos um usuário são obrigatórios' },
      });
    }

    const scheduleDate = new Date(date);

    // Verificar se é sábado
    if (scheduleDate.getDay() !== 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'A data deve ser um sábado' },
      });
    }

    const created = [];
    const skipped = [];

    for (const userId of userIds) {
      try {
        const schedule = await prisma.saturdaySchedule.create({
          data: {
            date: scheduleDate,
            userId,
            projectId: projectId || null,
            status: ScheduleStatus.SCHEDULED,
          },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        });
        created.push(schedule);
      } catch (e: any) {
        // Usuário já escalado para este sábado
        if (e.code === 'P2002') {
          skipped.push(userId);
        } else {
          throw e;
        }
      }
    }

    res.json({
      success: true,
      data: {
        created,
        skipped,
        message: `${created.length} escalas criadas, ${skipped.length} já existiam`,
      },
    });
  } catch (error: any) {
    console.error('Error creating saturday schedule:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// PUT /admin/scheduling/saturdays/:id - Atualizar escala
router.put('/saturdays/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, projectId } = req.body;

    const schedule = await prisma.saturdaySchedule.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(projectId !== undefined && { projectId }),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('Error updating saturday schedule:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// DELETE /admin/scheduling/saturdays/:id - Remover escala
router.delete('/saturdays/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.saturdaySchedule.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Escala removida com sucesso',
    });
  } catch (error: any) {
    console.error('Error deleting saturday schedule:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// POST /admin/scheduling/saturdays/:id/mark-no-show - Marcar como falta
router.post('/saturdays/:id/mark-no-show', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { xpPenalty = 100 } = req.body;

    const schedule = await prisma.saturdaySchedule.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { message: 'Escala não encontrada' },
      });
    }

    // Atualizar status da escala
    await prisma.saturdaySchedule.update({
      where: { id },
      data: { status: ScheduleStatus.NO_SHOW },
    });

    // Criar registro de falta
    const absence = await prisma.absenceRecord.create({
      data: {
        date: schedule.date,
        userId: schedule.userId,
        type: AbsenceType.SATURDAY_NO_SHOW,
        saturdayScheduleId: schedule.id,
        projectId: schedule.projectId,
        xpPenalty,
        penaltyApplied: true,
        penaltyAppliedAt: new Date(),
      },
    });

    // Aplicar penalidade de XP
    await prisma.user.update({
      where: { id: schedule.userId },
      data: {
        xpTotal: {
          decrement: xpPenalty,
        },
        // Resetar multiplicador de pontualidade
        punctualityStreak: 0,
        punctualityMultiplier: 1.1,
      },
    });

    // Registrar transação de XP
    await prisma.xpTransaction.create({
      data: {
        userId: schedule.userId,
        amount: -xpPenalty,
        type: 'PENALTY',
        reason: `Falta no sábado escalado (${schedule.date.toLocaleDateString('pt-BR')})`,
      },
    });

    res.json({
      success: true,
      message: 'Falta registrada e penalidade aplicada',
      data: { absence, xpPenalty },
    });
  } catch (error: any) {
    console.error('Error marking no-show:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// =============================================
// ABSENCE RECORDS - Registros de Faltas
// =============================================

// GET /admin/scheduling/absences - Listar faltas
router.get('/absences', async (req: Request, res: Response) => {
  try {
    const { userId, type, startDate, endDate, justified } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (justified !== undefined) {
      where.justified = justified === 'true';
    }

    const absences = await prisma.absenceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: absences,
    });
  } catch (error: any) {
    console.error('Error fetching absences:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// PUT /admin/scheduling/absences/:id/justify - Justificar falta
router.put('/absences/:id/justify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { justification, refundXp = false } = req.body;
    const adminId = (req as any).user?.id;

    const absence = await prisma.absenceRecord.findUnique({
      where: { id },
    });

    if (!absence) {
      return res.status(404).json({
        success: false,
        error: { message: 'Registro de falta não encontrado' },
      });
    }

    // Atualizar registro
    const updated = await prisma.absenceRecord.update({
      where: { id },
      data: {
        justified: true,
        justification,
        justifiedAt: new Date(),
        justifiedById: adminId,
      },
    });

    // Se refund de XP solicitado
    if (refundXp && absence.xpPenalty > 0) {
      await prisma.user.update({
        where: { id: absence.userId },
        data: {
          xpTotal: {
            increment: absence.xpPenalty,
          },
        },
      });

      await prisma.xpTransaction.create({
        data: {
          userId: absence.userId,
          amount: absence.xpPenalty,
          type: 'BONUS', // Reembolso via bonus
          reason: `Reembolso de penalidade justificada (${absence.date.toLocaleDateString('pt-BR')})`,
        },
      });
    }

    res.json({
      success: true,
      data: updated,
      message: refundXp ? 'Falta justificada e XP reembolsado' : 'Falta justificada',
    });
  } catch (error: any) {
    console.error('Error justifying absence:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

// =============================================
// HELPERS
// =============================================

/**
 * Calcula feriados móveis baseados na Páscoa
 */
function calculateMobileHolidays(year: number): { date: Date; name: string }[] {
  const easter = calculateEaster(year);
  const holidays = [];

  // Carnaval (47 dias antes da Páscoa)
  const carnival = new Date(easter);
  carnival.setDate(carnival.getDate() - 47);
  holidays.push({ date: carnival, name: 'Carnaval' });

  // Sexta-feira Santa (2 dias antes da Páscoa)
  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  holidays.push({ date: goodFriday, name: 'Sexta-feira Santa' });

  // Páscoa
  holidays.push({ date: easter, name: 'Páscoa' });

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(corpusChristi.getDate() + 60);
  holidays.push({ date: corpusChristi, name: 'Corpus Christi' });

  return holidays;
}

/**
 * Algoritmo de Meeus/Jones/Butcher para calcular a Páscoa
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

export default router;
