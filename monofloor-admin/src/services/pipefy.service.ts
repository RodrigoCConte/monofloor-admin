import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

interface PipefyCard {
  id: string;
  title: string;
  current_phase: { name: string };
  fields: Array<{ name: string; value: string }>;
}

interface PipefyProject {
  pipefyCardId: string;
  title: string;
  phase: string;
  cliente: string;
  endereco: string | null;
  m2Total: number;
  m2Piso: number;
  m2Parede: number;
  equipe: string | null;
  cor: string | null;
  consultor: string | null;
  material: string | null;
  andamento: number;
}

// Field mapping from Pipefy to our schema
const FIELD_MAP: Record<string, string> = {
  'Cliente': 'cliente',
  'Endereço': 'endereco',
  'M² Total': 'm2Total',
  'Piso (m²)': 'm2Piso',
  'Parede (m²)': 'm2Parede',
  'Equipe': 'equipe',
  'Cor': 'cor',
  'Consultor': 'consultor',
  'Material': 'material',
  'Andamento': 'andamento',
};

export class PipefyService {
  private endpoint = 'https://api.pipefy.com/graphql';
  private token = config.pipefy.apiToken;
  private pipeId = config.pipefy.pipeId;

  async fetchProjectsFromPipefy(): Promise<PipefyProject[]> {
    const query = `
      query {
        pipe(id: "${this.pipeId}") {
          phases {
            name
            cards(first: 100) {
              edges {
                node {
                  id
                  title
                  current_phase { name }
                  fields {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Pipefy API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Pipefy GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    const projects: PipefyProject[] = [];

    for (const phase of data.data.pipe.phases) {
      for (const edge of phase.cards.edges) {
        const card = edge.node as PipefyCard;
        const project = this.mapCardToProject(card);
        projects.push(project);
      }
    }

    return projects;
  }

  private mapCardToProject(card: PipefyCard): PipefyProject {
    const fieldValues: Record<string, string> = {};

    for (const field of card.fields) {
      const mappedKey = FIELD_MAP[field.name];
      if (mappedKey && field.value) {
        fieldValues[mappedKey] = field.value;
      }
    }

    return {
      pipefyCardId: card.id,
      title: card.title,
      phase: card.current_phase.name,
      cliente: fieldValues.cliente || card.title,
      endereco: fieldValues.endereco || null,
      m2Total: this.parseNumber(fieldValues.m2Total),
      m2Piso: this.parseNumber(fieldValues.m2Piso),
      m2Parede: this.parseNumber(fieldValues.m2Parede),
      equipe: fieldValues.equipe || null,
      cor: fieldValues.cor || null,
      consultor: fieldValues.consultor || null,
      material: fieldValues.material || null,
      andamento: this.parseNumber(fieldValues.andamento),
    };
  }

  private parseNumber(value: string | undefined): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  async syncProjects(): Promise<{ created: number; updated: number; total: number }> {
    const pipefyProjects = await this.fetchProjectsFromPipefy();
    let created = 0;
    let updated = 0;

    for (const project of pipefyProjects) {
      const existing = await prisma.project.findFirst({
        where: { pipefyCardId: project.pipefyCardId },
      });

      if (existing) {
        // Update existing project (only Pipefy-managed fields)
        await prisma.project.update({
          where: { id: existing.id },
          data: {
            title: project.title,
            cliente: project.cliente,
            endereco: project.endereco,
            m2Total: project.m2Total,
            m2Piso: project.m2Piso,
            m2Parede: project.m2Parede,
            equipe: project.equipe,
            cor: project.cor,
            consultor: project.consultor,
            material: project.material,
            pipefyPhase: project.phase,
            pipefySyncedAt: new Date(),
          },
        });
        updated++;
      } else {
        // Create new project
        await prisma.project.create({
          data: {
            pipefyCardId: project.pipefyCardId,
            title: project.title,
            cliente: project.cliente,
            endereco: project.endereco,
            m2Total: project.m2Total,
            m2Piso: project.m2Piso,
            m2Parede: project.m2Parede,
            equipe: project.equipe,
            cor: project.cor,
            consultor: project.consultor,
            material: project.material,
            pipefyPhase: project.phase,
            pipefySyncedAt: new Date(),
            status: this.mapPhaseToStatus(project.phase),
          },
        });
        created++;
      }
    }

    return {
      created,
      updated,
      total: pipefyProjects.length,
    };
  }

  private mapPhaseToStatus(phase: string): 'EM_EXECUCAO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO' {
    const phaseLower = phase.toLowerCase();

    if (phaseLower.includes('execu') || phaseLower.includes('andamento')) {
      return 'EM_EXECUCAO';
    }
    if (phaseLower.includes('conclu') || phaseLower.includes('finaliz')) {
      return 'CONCLUIDO';
    }
    if (phaseLower.includes('cancel')) {
      return 'CANCELADO';
    }
    if (phaseLower.includes('paus') || phaseLower.includes('parad')) {
      return 'PAUSADO';
    }

    return 'EM_EXECUCAO';
  }

  async getProjectByPipefyId(pipefyCardId: string) {
    return prisma.project.findFirst({
      where: { pipefyCardId },
      include: {
        assignments: {
          include: { user: true },
        },
      },
    });
  }
}

export const pipefyService = new PipefyService();
