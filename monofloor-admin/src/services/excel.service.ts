import * as XLSX from 'xlsx';
import { ProjectStatus } from '@prisma/client';
import { geocodingService } from './geocoding.service';
import prisma from '../lib/prisma';

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
  link_escopo?: string; // Link para escopo do projeto
  data_entrada?: string; // Data de entrada no sistema
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number; // Projetos com status não permitido (ex: concluído, cancelado)
  errors: Array<{ row: number; error: string }>;
}

const STATUS_MAP: Record<string, ProjectStatus> = {
  // EM EXECUÇÃO - Projetos ativos
  'em execução': 'EM_EXECUCAO',
  'em execucao': 'EM_EXECUCAO',
  'execução': 'EM_EXECUCAO',
  'execucao': 'EM_EXECUCAO',
  'ativo': 'EM_EXECUCAO',
  'em andamento': 'EM_EXECUCAO',
  'fazendo': 'EM_EXECUCAO',

  // PAUSADO - Obras pausadas
  'pausado': 'PAUSADO',
  'parado': 'PAUSADO',
  'obra pausada': 'PAUSADO',
  'pausada': 'PAUSADO',
  'suspenso': 'PAUSADO',
  'aguardando': 'PAUSADO',

  // CONCLUÍDO - Finalizados
  'concluído': 'CONCLUIDO',
  'concluido': 'CONCLUIDO',
  'finalizado': 'CONCLUIDO',
  'entregue': 'CONCLUIDO',

  // CANCELADO
  'cancelado': 'CANCELADO',
  'cancelada': 'CANCELADO',
};

// Fases do Pipefy que devem ser importadas
const ALLOWED_PIPEFY_PHASES = [
  'em execução',
  'em execucao',
  'obra pausada',
  'pausado',
  'pausada',
  'caixa de entrada', // Novos projetos
  'inicio',
  'início',
  'em andamento',
  'fazendo',
];

/**
 * Check if a Pipefy phase should be imported
 * Only "Em Execução" and "Obra Pausada" are allowed
 */
function isAllowedPhase(value: string | undefined): boolean {
  if (!value) return true; // If no status, allow it (will default to EM_EXECUCAO)
  const normalized = value.toLowerCase().trim();

  // Check if it's one of the allowed phases
  return ALLOWED_PIPEFY_PHASES.some(phase => normalized.includes(phase)) ||
         normalized.includes('execução') ||
         normalized.includes('execucao') ||
         normalized.includes('pausad');
}

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
      // Titulo / Nome do projeto (Pipefy usa "Title" por padrão)
      'titulo': 'titulo',
      'title': 'titulo',
      'nome': 'titulo',
      'projeto': 'titulo',
      'nome_do_projeto': 'titulo',
      'card': 'titulo',

      // Cliente
      'cliente': 'cliente',
      'client': 'cliente',
      'nome_do_cliente': 'cliente',
      'cliente_nome': 'cliente',

      // Endereço (Pipefy pode usar várias variações)
      'endereco': 'endereco',
      'address': 'endereco',
      'localizacao': 'endereco',
      'local': 'endereco',
      'endereco_da_obra': 'endereco',
      'endereco_completo': 'endereco',
      'local_da_obra': 'endereco',

      // M² Total
      'm2_total': 'm2_total',
      'm²_total': 'm2_total',
      'm2total': 'm2_total',
      'area_total': 'm2_total',
      'total_m2': 'm2_total',
      'metragem_total': 'm2_total',
      'area': 'm2_total',

      // Piso (m²)
      'm2_piso': 'm2_piso',
      'm²_piso': 'm2_piso',
      'm2piso': 'm2_piso',
      'piso_m2': 'm2_piso',
      'piso_m²': 'm2_piso',
      'piso_m2_': 'm2_piso',
      'piso_m²_': 'm2_piso',
      'piso': 'm2_piso',

      // Parede (m²)
      'm2_parede': 'm2_parede',
      'm²_parede': 'm2_parede',
      'm2parede': 'm2_parede',
      'parede_m2': 'm2_parede',
      'parede_m²': 'm2_parede',
      'parede_m2_': 'm2_parede',
      'parede_m²_': 'm2_parede',
      'parede': 'm2_parede',

      // Teto (m²)
      'm2_teto': 'm2_teto',
      'm²_teto': 'm2_teto',
      'm2teto': 'm2_teto',
      'teto_m2': 'm2_teto',
      'teto_m²': 'm2_teto',
      'teto_m2_': 'm2_teto',
      'teto_m²_': 'm2_teto',
      'teto': 'm2_teto',
      'forro': 'm2_teto',

      // Rodapé (m linear)
      'm_rodape': 'm_rodape',
      'mrodape': 'm_rodape',
      'rodape_m_linear': 'm_rodape',
      'rodape_m_linear_': 'm_rodape',
      'rodape': 'm_rodape',
      'm_linear_rodape': 'm_rodape',

      // Status / Fase atual (IMPORTANTE: usado para filtrar)
      'status': 'status',
      'situacao': 'status',
      'fase_atual': 'status',
      'fase': 'status',
      'current_phase': 'status',
      'estagio': 'status',

      // Consultor / Vendedor / Responsável
      'consultor': 'consultor',
      'vendedor': 'consultor',
      'responsavel': 'consultor',
      'responsavel_comercial': 'consultor',
      'responsavel_pela_obra': 'consultor',

      // Material / Tipo de aplicação
      'material': 'material',
      'tipo': 'material',
      'tipo_de_material': 'material',
      'tipo_aplicacao': 'material',

      // Cor
      'cor': 'cor',
      'color': 'cor',
      'cor_do_piso': 'cor',
      'acabamento': 'cor',

      // Horas estimadas
      'horas_estimadas': 'horas_estimadas',
      'horas': 'horas_estimadas',
      'estimativa_horas': 'horas_estimadas',
      'previsao_horas': 'horas_estimadas',

      // Pipefy specific fields
      'codigo': 'codigo',
      'code': 'codigo',
      'id': 'codigo',
      'card_id': 'codigo',
      'equipe': 'equipe',
      'time': 'equipe',
      'especiais': 'especiais',
      'detalhamento': 'detalhamento',
      'descricao': 'detalhamento',
      'andamento': 'andamento',
      'progresso': 'andamento',
      'link_escopo': 'link_escopo',
      'escopo': 'link_escopo',
      'data_entrada': 'data_entrada',
      'data_de_entrada': 'data_entrada',
      'previsao': 'data_entrada',
      'data_prevista': 'data_entrada',
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
   * Only imports projects with status "Em Execução" or "Obra Pausada"
   */
  async importProjects(data: ProjectImportRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      total: data.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        // Filter: Only import "Em Execução" and "Obra Pausada" phases
        if (!isAllowedPhase(row.status)) {
          result.skipped++;
          console.log(`Row ${rowNum}: Skipped (status: ${row.status})`);
          continue;
        }

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

        const endereco = row.endereco ? String(row.endereco).trim() : null;

        // Geocode address if available and project doesn't have coordinates
        let latitude: number | null = null;
        let longitude: number | null = null;

        if (endereco && (!existingProject?.latitude || !existingProject?.longitude)) {
          try {
            const geocodeResult = await geocodingService.geocodeAddress(endereco);
            if (geocodeResult) {
              latitude = geocodeResult.latitude;
              longitude = geocodeResult.longitude;
            }
          } catch (geoError) {
            console.error(`Geocoding failed for row ${rowNum}:`, geoError);
            // Continue without coordinates
          }
        }

        // Parse metragens
        const m2Piso = parseNumber(row.m2_piso);
        const m2Parede = parseNumber(row.m2_parede);
        const m2Teto = parseNumber(row.m2_teto);
        const mRodape = parseNumber(row.m_rodape);

        // IMPORTANTE: Calcular m2Total como soma de piso + parede + teto
        // Ignorar o M² Total da planilha, calcular manualmente
        const m2Total = m2Piso + m2Parede + m2Teto;

        // Base data for new projects
        const projectData: any = {
          title,
          cliente: row.cliente ? String(row.cliente).trim() : null,
          endereco,
          m2Total,
          m2Piso,
          m2Parede,
          m2Teto,
          mRodape,
          status: parseStatus(row.status),
          consultor: row.consultor ? String(row.consultor).trim() : null,
          material: row.material ? String(row.material).trim() : null,
          cor: row.cor ? String(row.cor).trim() : null,
          estimatedHours: row.horas_estimadas ? parseNumber(row.horas_estimadas) : null,
          pipefyCardId: pipefyCardId,
          // Novos campos da planilha
          linkEscopo: row.link_escopo ? String(row.link_escopo).trim() : null,
          especiais: row.especiais ? String(row.especiais).trim() : null,
          detalhamento: row.detalhamento ? String(row.detalhamento).trim() : null,
          equipe: row.equipe ? String(row.equipe).trim() : null,
          // IMPORTANTE: Projetos importados da planilha vão para o módulo EXECUCAO
          currentModule: 'EXECUCAO',
        };

        // Only add coordinates if we have them
        if (latitude !== null && longitude !== null) {
          projectData.latitude = latitude;
          projectData.longitude = longitude;
        }

        if (existingProject) {
          // UPDATE: Only update fields that have actual values in Excel
          // Preserve existing data when Excel field is empty
          const updateData: any = {
            title, // Always update title
            currentModule: 'EXECUCAO', // Always ensure correct module
          };

          // Only update if Excel has a value (preserve existing otherwise)
          if (row.cliente) updateData.cliente = String(row.cliente).trim();
          if (endereco) updateData.endereco = endereco;

          // Metragens: atualizar se tiver valor
          if (row.m2_piso) updateData.m2Piso = m2Piso;
          if (row.m2_parede) updateData.m2Parede = m2Parede;
          if (row.m2_teto) updateData.m2Teto = m2Teto;
          if (row.m_rodape) updateData.mRodape = mRodape;

          // Recalcular m2Total se algum dos componentes foi atualizado
          if (row.m2_piso || row.m2_parede || row.m2_teto) {
            // Pegar valores existentes ou zero
            const existingPiso = updateData.m2Piso ?? existingProject.m2Piso ?? 0;
            const existingParede = updateData.m2Parede ?? existingProject.m2Parede ?? 0;
            const existingTeto = updateData.m2Teto ?? existingProject.m2Teto ?? 0;
            updateData.m2Total = Number(existingPiso) + Number(existingParede) + Number(existingTeto);
          }

          if (row.status) updateData.status = parseStatus(row.status);
          if (row.consultor) updateData.consultor = String(row.consultor).trim();
          if (row.material) updateData.material = String(row.material).trim();
          if (row.cor) updateData.cor = String(row.cor).trim();
          if (row.horas_estimadas) updateData.estimatedHours = parseNumber(row.horas_estimadas);
          if (pipefyCardId) updateData.pipefyCardId = pipefyCardId;

          // Novos campos
          if (row.link_escopo) updateData.linkEscopo = String(row.link_escopo).trim();
          if (row.especiais) updateData.especiais = String(row.especiais).trim();
          if (row.detalhamento) updateData.detalhamento = String(row.detalhamento).trim();
          if (row.equipe) updateData.equipe = String(row.equipe).trim();

          if (latitude !== null && longitude !== null) {
            updateData.latitude = latitude;
            updateData.longitude = longitude;
          }

          await prisma.project.update({
            where: { id: existingProject.id },
            data: updateData,
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
