/**
 * Payroll Configuration
 * Valores de remuneração por cargo
 */

// Valores por cargo (em reais)
export const ROLE_RATES = {
  AUXILIAR: {
    label: 'Ajudante',
    dailyRate: 150.00,           // Diária (8h)
    hourlyRate: 18.75,           // Valor/hora
    overtimeRate: 22.50,         // Hora extra (+20%)
    travelRate: 22.50,           // Hora em modo viagem (+20%)
    travelOvertimeRate: 26.25,   // Hora extra em modo viagem (+40%)
  },
  PREPARADOR: {
    label: 'Preparador',
    dailyRate: 180.00,
    hourlyRate: 22.50,
    overtimeRate: 27.00,
    travelRate: 27.00,
    travelOvertimeRate: 31.50,
  },
  LIDER_PREPARACAO: {
    label: 'Finalizador',
    dailyRate: 195.00,
    hourlyRate: 24.375,
    overtimeRate: 29.25,
    travelRate: 29.25,
    travelOvertimeRate: 34.125,
  },
  APLICADOR_I: {
    label: 'Aplicador I',
    dailyRate: 200.00,
    hourlyRate: 25.00,
    overtimeRate: 30.00,
    travelRate: 30.00,
    travelOvertimeRate: 35.00,
  },
  APLICADOR_II: {
    label: 'Aplicador II',
    dailyRate: 300.00,
    hourlyRate: 37.50,
    overtimeRate: 45.00,
    travelRate: 45.00,
    travelOvertimeRate: 52.50,
  },
  APLICADOR_III: {
    label: 'Aplicador III',
    dailyRate: 330.00,
    hourlyRate: 41.25,
    overtimeRate: 49.50,
    travelRate: 49.50,
    travelOvertimeRate: 57.75,
  },
  LIDER: {
    label: 'Líder',
    dailyRate: 350.00,
    hourlyRate: 43.75,
    overtimeRate: 52.50,
    travelRate: 52.50,
    travelOvertimeRate: 61.25,
  },
} as const;

// Tipo para roles válidos
export type PayrollRole = keyof typeof ROLE_RATES;

// Regras de intervalo obrigatório
export const LUNCH_BREAK_RULES = {
  // Jornada > 6h: intervalo mínimo de 60 minutos
  ABOVE_6H: {
    minWorkHours: 6,
    requiredBreakMinutes: 60,
  },
  // Jornada 4h-6h: intervalo mínimo de 15 minutos
  BETWEEN_4H_6H: {
    minWorkHours: 4,
    maxWorkHours: 6,
    requiredBreakMinutes: 15,
  },
  // Jornada até 4h: sem intervalo obrigatório
  UNDER_4H: {
    maxWorkHours: 4,
    requiredBreakMinutes: 0,
  },
} as const;

// Penalidades
export const PENALTIES = {
  LUNCH_NOT_REGISTERED: 500,      // XP perdido por não registrar almoço
  REPORT_NOT_SUBMITTED: 7000,     // XP perdido por não enviar relatório (após 3 lembretes)
} as const;

// Alertas de almoço prolongado (minutos após checkout de almoço)
export const LUNCH_ALERT_TIMES = [
  { minutes: 70, label: '1h10' },
  { minutes: 80, label: '1h20' },
  { minutes: 90, label: '1h30' },
] as const;

// Bônus
export const BONUSES = {
  REFERRAL: 300,                  // R$ por indicação (após 30 dias)
  REFERRAL_MIN_DAYS: 30,          // Dias mínimos para validar indicação
} as const;

// Constantes de jornada
export const WORKDAY = {
  NORMAL_HOURS: 8,                // Horas normais por dia
  OVERTIME_START: 8,              // Hora em que começa hora extra
} as const;

// Adicional percentuais
export const RATE_MULTIPLIERS = {
  OVERTIME: 1.20,                 // +20% para hora extra/noturna
  TRAVEL_MODE: 1.20,              // +20% para modo viagem
  TRAVEL_OVERTIME: 1.40,          // +40% para hora extra em modo viagem (20% + 20%)
} as const;

/**
 * Obtém as taxas de um cargo
 */
export function getRoleRates(role: string): typeof ROLE_RATES[PayrollRole] | null {
  const validRole = role as PayrollRole;
  return ROLE_RATES[validRole] || null;
}

/**
 * Calcula o intervalo obrigatório baseado nas horas trabalhadas
 */
export function getRequiredBreakMinutes(totalHoursWorked: number): number {
  if (totalHoursWorked > 6) {
    return LUNCH_BREAK_RULES.ABOVE_6H.requiredBreakMinutes;
  }
  if (totalHoursWorked >= 4) {
    return LUNCH_BREAK_RULES.BETWEEN_4H_6H.requiredBreakMinutes;
  }
  return LUNCH_BREAK_RULES.UNDER_4H.requiredBreakMinutes;
}

/**
 * Calcula o desconto de intervalo
 * Retorna os minutos a descontar e se deve aplicar penalidade
 */
export function calculateLunchDeduction(
  totalHoursWorked: number,
  actualBreakMinutes: number
): { deductionMinutes: number; shouldPenalize: boolean } {
  const requiredBreak = getRequiredBreakMinutes(totalHoursWorked);

  if (requiredBreak === 0) {
    // Jornada até 4h: sem desconto, sem penalidade
    return { deductionMinutes: 0, shouldPenalize: false };
  }

  if (actualBreakMinutes >= requiredBreak) {
    // Fez pausa suficiente
    return { deductionMinutes: 0, shouldPenalize: false };
  }

  // Pausa insuficiente
  const deduction = requiredBreak - actualBreakMinutes;
  return {
    deductionMinutes: deduction,
    shouldPenalize: true
  };
}

/**
 * Calcula o valor a pagar pelas horas trabalhadas
 *
 * Regras:
 * - Hora normal: hourlyRate
 * - Hora extra (>8h): overtimeRate (+20%)
 * - Hora em modo viagem: travelRate (+20%)
 * - Hora extra em modo viagem: travelOvertimeRate (+40%)
 */
export function calculatePayment(
  role: string,
  hoursNormal: number,
  hoursOvertime: number,
  hoursTravelNormal: number = 0,
  hoursTravelOvertime: number = 0
): {
  normalPay: number;
  overtimePay: number;
  travelNormalPay: number;
  travelOvertimePay: number;
  totalPay: number
} {
  const rates = getRoleRates(role);
  if (!rates) {
    return { normalPay: 0, overtimePay: 0, travelNormalPay: 0, travelOvertimePay: 0, totalPay: 0 };
  }

  const normalPay = hoursNormal * rates.hourlyRate;
  const overtimePay = hoursOvertime * rates.overtimeRate;
  const travelNormalPay = hoursTravelNormal * rates.travelRate;
  const travelOvertimePay = hoursTravelOvertime * rates.travelOvertimeRate;
  const totalPay = normalPay + overtimePay + travelNormalPay + travelOvertimePay;

  return { normalPay, overtimePay, travelNormalPay, travelOvertimePay, totalPay };
}
