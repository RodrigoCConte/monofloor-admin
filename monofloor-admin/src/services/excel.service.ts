import * as XLSX from 'xlsx';
import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProjectImportRow {
  titulo: string;
  cliente?: string;
  endereco?: string;
  m2_total?: number;
  m2_piso?: number;
  m2_parede?: number;
  m2_teto?: number;
  m_rodape?: number;
  status?: string;
  consultor?: string;
  material?: string;
  cor?: string;
  horas_estimadas?: number;
  codigo?: string; // Pipefy ID
  equipe?: string;
  especiais?: string;
  detalhamento?: string;
  andamento?: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
}

const STATUS_MAP: Record<string, ProjectStatus> = {
  // Portuguese variations
  'em execução': 'EM_EXECUCAO',
  'em execucao': 'EM_EXECUCAO',
  'execução': 'EM_EXECUCAO',
  'execucao': 'EM_EXECUCAO',
  'ativo': 'EM_EXECUCAO',
  'em andamento': 'EM_EXECUCAO',
  'fazendo': 'EM_EXECUCAO',
  'pausado': 'PAUSADO',
  'parado': 'PAUSADO',
  'concluído': 'CONCLUIDO',
  'concluido': 'CONCLUIDO',
  'finalizado': 'CONCLUIDO',
  'cancelado': 'CANCELADO',
  // Pipefy phases
  'caixa de entrada': 'EM_EXECUCAO',
  'início': 'EM_EXECUCAO',
  'inicio': 'EM_EXECUCAO',
};

function parseStatus(value: string | undefined): ProjectStatus {
  if (!value) return 'EM_EXECUCAO';
  const normalized = value.toLowerCase().trim();
  return STATUS_MAP[normalized] || 'EM_EXECUCAO';
}

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

function normalizeHeaders(row: any): ProjectImportRow {
  const normalized: any = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[()]/g, '') // remove parenteses
      .replace(/\s+/g, '_')
      .trim();

    // Map common variations including Pipefy columns
    const keyMap: Record<string, string> = {
      // Titulo / Nome do projeto
      'titulo': 'titulo',
      'title': 'titulo',
      'nome': 'titulo',
      'projeto': 'titulo',
      // Cliente
      'cliente': 'cliente',
      'client': 'cliente',
      // Endereco
      'endereco': 'endereco',
      'address': 'endereco',
      'localizacao': 'endereco',
      // M2 Total
      'm2_total': 'm2_total',
      'm²_total': 'm2_total', // Pipefy: "M² Total"
      'm2total': 'm2_total',
      'area_total': 'm2_total',
      'total_m2': 'm2_total',
      // Piso
      'm2_piso': 'm2_piso',
      'm²_piso': 'm2_piso',
      'm2piso': 'm2_piso',
      'piso_m2': 'm2_piso',
      'piso_m²': 'm2_piso',
      'piso_m2_': 'm2_piso', // Pipefy: "Piso (m²)"
      'piso_m²_': 'm2_piso',
      // Parede
      'm2_parede': 'm2_parede',
      'm²_parede': 'm2_parede',
      'm2parede': 'm2_parede',
      'parede_m2': 'm2_parede',
      'parede_m²': 'm2_parede',
      'parede_m2_': 'm2_parede', // Pipefy: "Parede (m²)"
      'parede_m²_': 'm2_parede',
      // Teto
      'm2_teto': 'm2_teto',
      'm²_teto': 'm2_teto',
      'm2teto': 'm2_teto',
      'teto_m2': 'm2_teto',
      'teto_m²': 'm2_teto',
      'teto_m2_': 'm2_teto', // Pipefy: "Teto (m²)"
      'teto_m²_': 'm2_teto',
      // Rodape
      'm_rodape': 'm_rodape',
      'mrodape': 'm_rodape',
      'rodape_m_linear': 'm_rodape', // Pipefy: "Rodapé (m linear)"
      'rodape_m_linear_': 'm_rodape',
      // Status
      'status': 'status',
      'situacao': 'status',
      'fase_atual': 'status', // Pipefy: "Fase atual"
      // Consultor
      'consultor': 'consultor',
      'vendedor': 'consultor',
      // Material
      'material': 'material',
      'tipo': 'material',
      // Cor
      'cor': 'cor',
      'color': 'cor',
      // Horas
      'horas_estimadas': 'horas_estimadas',
      'horas': 'horas_estimadas',
      'estimativa_horas': 'horas_estimadas',
      // Pipefy specific
      'codigo': 'codigo',
      'code': 'codigo',
      'equipe': 'equipe',
      'especiais': 'especiais',
      'detalhamento': 'detalhamento',
      'andamento': 'andamento',
    };

    const mappedKey = keyMap[normalizedKey] || normalizedKey;
    normalized[mappedKey] = value;
  }

  return normalized as ProjectImportRow;
}

export const excelService = {
  /**
   * Parse Excel buffer and return rows
   */
  parseExcel(buffer: Buffer): ProjectImportRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(sheet);
    return rawData.map((row: any) => normalizeHeaders(row));
  },

  /**
   * Import projects from Excel data
   */
  async importProjects(data: ProjectImportRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      total: data.length,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        // Validate required field
        if (!row.titulo || String(row.titulo).trim() === '') {
          result.errors.push({ row: rowNum, error: 'Título é obrigatório' });
          continue;
        }

        const title = String(row.titulo).trim();
        const pipefyCardId = row.codigo ? String(row.codigo).trim() : null;

        // Check if project exists by Pipefy ID first, then by title + cliente
        let existingProject = null;

        if (pipefyCardId) {
          existingProject = await prisma.project.findFirst({
            where: { pipefyCardId },
          });
        }

        if (!existingProject) {
          existingProject = await prisma.project.findFirst({
            where: {
              title,
              cliente: row.cliente ? String(row.cliente).trim() : undefined,
            },
          });
        }

        const projectData = {
          title,
          cliente: row.cliente ? String(row.cliente).trim() : null,
          endereco: row.endereco ? String(row.endereco).trim() : null,
          m2Total: parseNumber(row.m2_total),
          m2Piso: parseNumber(row.m2_piso),
          m2Parede: parseNumber(row.m2_parede),
          m2Teto: parseNumber(row.m2_teto),
          mRodape: parseNumber(row.m_rodape),
          status: parseStatus(row.status),
          consultor: row.consultor ? String(row.consultor).trim() : null,
          material: row.material ? String(row.material).trim() : null,
          cor: row.cor ? String(row.cor).trim() : null,
          estimatedHours: row.horas_estimadas ? parseNumber(row.horas_estimadas) : null,
          pipefyCardId: pipefyCardId,
        };

        if (existingProject) {
          // Update existing project
          await prisma.project.update({
            where: { id: existingProject.id },
            data: projectData,
          });
          result.updated++;
        } else {
          // Create new project
          await prisma.project.create({
            data: projectData,
          });
          result.created++;
        }
      } catch (error: any) {
        result.errors.push({
          row: rowNum,
          error: error.message || 'Erro desconhecido',
        });
      }
    }

    return result;
  },

  /**
   * Generate Excel template for download
   */
  generateTemplate(): Buffer {
    const template = [
      {
        titulo: 'Projeto Exemplo',
        cliente: 'Cliente ABC',
        endereco: 'Rua Exemplo, 123 - Cidade/UF',
        m2_total: 150,
        m2_piso: 100,
        m2_parede: 40,
        m2_teto: 10,
        m_rodape: 50,
        status: 'Em Execução',
        consultor: 'João Silva',
        material: 'STELION Premium',
        cor: 'Cinza Claro',
        horas_estimadas: 40,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projetos');

    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // titulo
      { width: 20 }, // cliente
      { width: 35 }, // endereco
      { width: 10 }, // m2_total
      { width: 10 }, // m2_piso
      { width: 10 }, // m2_parede
      { width: 10 }, // m2_teto
      { width: 10 }, // m_rodape
      { width: 15 }, // status
      { width: 15 }, // consultor
      { width: 20 }, // material
      { width: 15 }, // cor
      { width: 15 }, // horas_estimadas
    ];

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  },

  /**
   * Export all projects to Excel
   */
  async exportProjects(): Promise<Buffer> {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = projects.map((p) => ({
      titulo: p.title,
      cliente: p.cliente || '',
      endereco: p.endereco || '',
      m2_total: Number(p.m2Total),
      m2_piso: Number(p.m2Piso),
      m2_parede: Number(p.m2Parede),
      m2_teto: Number(p.m2Teto),
      m_rodape: Number(p.mRodape),
      status: p.status,
      consultor: p.consultor || '',
      material: p.material || '',
      cor: p.cor || '',
      horas_estimadas: p.estimatedHours ? Number(p.estimatedHours) : '',
      horas_trabalhadas: Number(p.workedHours),
      criado_em: p.createdAt.toISOString().split('T')[0],
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projetos');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  },
};
