import { PrismaClient, ComercialStatus, PlanejamentoStatus } from '@prisma/client';

const prisma = new PrismaClient();

// API Credentials
const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

const PIPEFY_API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NjY2NzE2MTUsImp0aSI6IjE0YWQ1NjM1LTE2OTktNDAxZS04ODQ2LWI4ZDBmMDUzZGZhNCIsInN1YiI6MzA3MTY5NjIyLCJ1c2VyIjp7ImlkIjozMDcxNjk2MjIsImVtYWlsIjoicm9kcmlnb0Btb25vZmxvb3IuY29tLmJyIn0sInVzZXJfdHlwZSI6ImF1dGhlbnRpY2F0ZWQifQ.iIFoE3qzRA17wSuDRQ_fpLmFKq8YAuVhb-WI37UjhZ_JvGgTTbjoetnUkODxK_eo3CYkvhuHh6ZBB76D-FIoyA';
const PIPEFY_BASE_URL = 'https://api.pipefy.com/graphql';
const PIPEFY_PIPE_OPERACOES = '306410007';

// Custom field mappings for Pipedrive
const PIPEDRIVE_CUSTOM_FIELDS: Record<string, string> = {
  'aa5d8cc9c5b0b926ebb0a2c3eb73f443bec731b4': 'resumo',
  '2c3ffa560c132066eb8503bc58a5b1a35b9bff4c': 'metragemEstimada',
  'b738870cd03c6212a2cedb5a94e6b969b5cac7cd': 'metragemEstimadaN1',
  '9f938c89c2b9b6aeb1ee15934eb103e1b4847bdf': 'descritivoArea',
  '9fd47f2f4b67f8f7ab5ac5444e988b0222eaad45': 'detalhesArquiteto',
  '87845e892df12877faac618a35d9064c3cf2833f': 'cidadeExecucaoDesc',
  '60a014040c370143e4e8d58efc47c7ecfec484d6': 'cidadeExecucao',
  '1f41e2ababaaca38f6eda10f0118d8739895f4d7': 'tipoCliente',
  '6c33ac42e32df9ffcfe148880cdbcccedb3c3345': 'tipoProjeto',
  '461af1e6927db97e477004b68d9eed2a123b237a': 'nomeEscritorio',
  '6e584cf39b9b71ed4f0b1cc87268d8f25decc86e': 'budgetEstimado',
  'f8d5ce157fe481c15a867f146497eb5831d81249': 'estadoObra',
  'f74d97aed5827fcfa0c40e0cfe83efa0e161764f': 'metragemSemArq',
  'e34c43d77127f2032b7827450093a89db01db960': 'dataPrevistaExec',
  '162d774100ff3792cc5d0c79a3439525d9a9bc14': 'primeiroNomeZapi',
  '9ed948b3581f019a0ed8cc2dcab3e106bfca84c4': 'telefoneZapi',
};

// Stage mapping Pipedrive -> ComercialStatus
const PIPEDRIVE_STAGE_MAP: Record<number, ComercialStatus> = {
  1: 'LEAD',           // Form Orçamento
  2: 'PRIMEIRO_CONTATO', // 1º Contato
  70: 'LEVANTAMENTO',  // Proposta Escopo Minimo
  68: 'PRIMEIRO_CONTATO', // 1º Contato Feito
  62: 'FOLLOW_UP',     // Follow 1º Contato
  69: 'FOLLOW_UP',     // Follow 1º Contato Feito
  60: 'CONTATO_ARQUITETO', // Form Arquiteto
  58: 'CONTATO_ARQUITETO', // Contato Arquiteto
  3: 'LEVANTAMENTO',   // Cálculo de Projeto
  43: 'LEVANTAMENTO',  // Projeto levantado
  52: 'LEVANTAMENTO',  // Cálculo Deslocamento
  53: 'LEVANTAMENTO',  // Deslocamento Levantado
  4: 'PROPOSTA_ENVIADA', // Proposta enviada
  59: 'FOLLOW_UP',     // Fazer Follow 1
  63: 'FOLLOW_UP',     // Follow 1 Feito
  64: 'FOLLOW_UP',     // Fazer Follow 2
  65: 'FOLLOW_UP',     // Follow 2 Feito
  66: 'FOLLOW_UP',     // Fazer Follow 3
  67: 'FOLLOW_UP',     // Follow 3 Feito
  5: 'NEGOCIACAO',     // Negociações
  17: 'PERDIDO',       // Perdido
};

// Phase mapping Pipefy -> PlanejamentoStatus
const PIPEFY_PHASE_MAP: Record<string, PlanejamentoStatus> = {
  '338919163': 'ENTRADA',
  '339755506': 'EM_CONTRATO',
  '338725721': 'PRIMEIRO_CONTATO_OP',
  '338726490': 'AGEND_VT_AFERICAO',
  '338852426': 'RESULTADO_VT_AFERICAO',
  '338854949': 'PROJETOS_REVISAO',
  '338728922': 'CONFIRMACOES_OP1',
  '338730213': 'DATA_A_DEFINIR',
  '338731557': 'AGEND_VT_ACOMPANHAMENTO',
  '338852447': 'RESULTADO_VT_ACOMPANHAMENTO',
  '338729512': 'CONFIRMACOES_OP2',
  '338741135': 'REVISAO_FINAL_OP',
  '339898036': 'AGUARDANDO_LIBERACAO',
  '338741318': 'INDUSTRIA_PRODUCAO',
  '338868811': 'AGEND_VT_ENTRADA',
  '338868866': 'RESULTADO_VT_ENTRADA',
  '339218978': 'FINANCEIRO_REVISAO',
  '338990356': 'EQUIPE_EXECUCAO',
  '338741342': 'INFO_LOGISTICAS',
  '338839564': 'LOGISTICA_ENTREGA',
  '338816083': 'LOGISTICA_MATERIAL_ENTREGUE',
  '338741343': 'OBRA_EXECUCAO',
  '338994841': 'OBRA_PAUSADA',
  '338741344': 'OBRA_CONCLUIDA',
  '338831664': 'LOGISTICA_COLETAR',
  '338954214': 'LOGISTICA_EM_COLETA',
  '338741361': 'CLIENTE_FINALIZADO',
};

// ==========================================
// PIPEDRIVE API FUNCTIONS
// ==========================================

async function fetchPipedrive(endpoint: string): Promise<any> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  const response = await fetch(url);
  return response.json() as Promise<any>;
}

async function getAllPipedriveDeals(): Promise<any[]> {
  const allDeals: any[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  console.log('[Pipedrive] Fetching all deals...');

  while (hasMore) {
    const response = await fetchPipedrive(`/deals?status=all_not_deleted&start=${start}&limit=${limit}`);
    if (response.data && response.data.length > 0) {
      allDeals.push(...response.data);
      console.log(`[Pipedrive] Fetched ${allDeals.length} deals so far...`);
    }
    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += limit;
  }

  console.log(`[Pipedrive] Total deals fetched: ${allDeals.length}`);
  return allDeals;
}

async function getPipedriveNotes(dealId: number): Promise<any[]> {
  const response = await fetchPipedrive(`/deals/${dealId}/notes?start=0&limit=100`);
  return response.data || [];
}

async function getPipedriveActivities(dealId: number): Promise<any[]> {
  const response = await fetchPipedrive(`/deals/${dealId}/activities?start=0&limit=100`);
  return response.data || [];
}

async function getPipedriveFiles(dealId: number): Promise<any[]> {
  const response = await fetchPipedrive(`/deals/${dealId}/files?start=0&limit=100`);
  return response.data || [];
}

async function getPipedriveStages(): Promise<Record<number, string>> {
  const response = await fetchPipedrive('/stages?pipeline_id=1');
  const stages: Record<number, string> = {};
  if (response.data) {
    for (const stage of response.data) {
      stages[stage.id] = stage.name;
    }
  }
  return stages;
}

// ==========================================
// PIPEFY API FUNCTIONS
// ==========================================

async function fetchPipefy(query: string): Promise<any> {
  const response = await fetch(PIPEFY_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PIPEFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return response.json() as Promise<any>;
}

async function getAllPipefyCards(pipeId: string): Promise<any[]> {
  const allCards: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  console.log(`[Pipefy] Fetching all cards from pipe ${pipeId}...`);

  while (hasNextPage) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      allCards(pipeId: ${pipeId}, first: 50${afterClause}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            createdAt
            url
            done
            due_date
            current_phase {
              id
              name
            }
            assignees {
              id
              name
              email
            }
            comments_count
            attachments_count
            fields {
              name
              value
              array_value
              datetime_value
              field {
                id
                type
              }
            }
            attachments {
              url
              path
            }
            comments {
              id
              text
              created_at
              author_name
            }
          }
        }
      }
    }`;

    const response = await fetchPipefy(query);

    if (response.data?.allCards?.edges) {
      const cards = response.data.allCards.edges.map((e: any) => e.node);
      allCards.push(...cards);
      console.log(`[Pipefy] Fetched ${allCards.length} cards so far...`);

      hasNextPage = response.data.allCards.pageInfo.hasNextPage;
      cursor = response.data.allCards.pageInfo.endCursor;
    } else {
      hasNextPage = false;
    }
  }

  console.log(`[Pipefy] Total cards fetched: ${allCards.length}`);
  return allCards;
}

// ==========================================
// MIGRATION: PIPEDRIVE -> COMERCIAL
// ==========================================

export async function migratePipedrive(): Promise<{
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;
  let updated = 0;

  try {
    console.log('[Migration] Starting Pipedrive migration...');

    // Get all deals and stages
    const [deals, stages] = await Promise.all([
      getAllPipedriveDeals(),
      getPipedriveStages(),
    ]);

    console.log(`[Migration] Processing ${deals.length} deals...`);
    let processedCount = 0;

    for (const deal of deals) {
      try {
        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`[Migration] Progress: ${processedCount}/${deals.length} deals processed...`);
        }

        const dealId = String(deal.id);
        const title = deal.title || 'Sem título';

        // Extract custom fields
        const customFields: Record<string, any> = {};
        for (const [hash, fieldName] of Object.entries(PIPEDRIVE_CUSTOM_FIELDS)) {
          if (deal[hash] !== undefined && deal[hash] !== null) {
            customFields[fieldName] = deal[hash];
          }
        }

        // Get person info
        const personEmail = deal.person_id?.email?.[0]?.value || null;
        const personPhone = deal.person_id?.phone?.[0]?.value || null;

        // Determine status
        let status: ComercialStatus = PIPEDRIVE_STAGE_MAP[deal.stage_id] || 'LEAD';
        if (deal.status === 'won') status = 'GANHO';
        if (deal.status === 'lost') status = 'PERDIDO';

        // Check if already exists
        const existing = await prisma.comercialData.findUnique({
          where: { pipedriveDealId: dealId },
          include: { project: true },
        });

        // Prepare comercial data
        const comercialData = {
          // Pipedrive identification
          pipedriveDealId: dealId,
          pipedrivePersonId: deal.person_id?.value || null,
          pipedriveOrgId: deal.org_id?.value || null,
          stageId: deal.stage_id,
          stageName: stages[deal.stage_id] || null,
          stageOrderNr: deal.stage_order_nr,
          pipelineId: deal.pipeline_id,
          pipedriveUrl: deal.cc_email ? `https://monofloor.pipedrive.com/deal/${deal.id}` : null,

          // Person contact
          personName: deal.person_name || deal.person_id?.name || null,
          personEmail,
          personPhone,

          // Values
          dealValue: deal.value ? parseFloat(deal.value) : null,
          dealCurrency: deal.currency,
          probability: deal.probability,
          weightedValue: deal.weighted_value ? parseFloat(deal.weighted_value) : null,

          // Dates
          dealAddTime: deal.add_time ? new Date(deal.add_time) : null,
          dealUpdateTime: deal.update_time ? new Date(deal.update_time) : null,
          stageChangeTime: deal.stage_change_time ? new Date(deal.stage_change_time) : null,
          wonTime: deal.won_time ? new Date(deal.won_time) : null,
          lostTime: deal.lost_time ? new Date(deal.lost_time) : null,
          expectedCloseDate: deal.expected_close_date ? new Date(deal.expected_close_date) : null,

          // Status
          dealStatus: deal.status,
          lostReason: deal.lost_reason,

          // Counters
          filesCount: deal.files_count || 0,
          notesCount: deal.notes_count || 0,
          activitiesCount: deal.activities_count || 0,
          followersCount: deal.followers_count || 0,
          emailMessagesCount: deal.email_messages_count || 0,

          // Owner
          ownerUserId: deal.user_id?.value || null,
          ownerUserName: deal.user_id?.name || deal.owner_name || null,
          ownerUserEmail: deal.user_id?.email || null,
          creatorUserId: deal.creator_user_id?.value || null,
          creatorUserName: deal.creator_user_id?.name || null,

          // Custom fields
          ...customFields,
          labelPipedrive: deal.label,
          dealOrigin: deal.origin,
          dealOriginId: deal.origin_id,

          // Raw data
          pipedriveRawData: deal,

          // Status
          status,
          pipedriveSyncedAt: new Date(),
        };

        if (existing) {
          // Update existing lead
          await prisma.comercialData.update({
            where: { id: existing.id },
            data: comercialData,
          });

          // Update project name if different (only if has project)
          if (existing.project && existing.project.cliente !== title) {
            await prisma.project.update({
              where: { id: existing.projectId! },
              data: { cliente: title },
            });
          }

          updated++;
        } else {
          // Create new lead (WITHOUT creating a project)
          // Project will be created only when lead is converted (GANHO)
          await prisma.comercialData.create({
            data: {
              ...comercialData,
              // projectId is null - lead starts without project
            },
          });

          imported++;
        }

        // Import notes, activities, and files - TEMPORARILY DISABLED FOR FASTER IMPORT
        // Can be enabled later for a second pass to import notes/activities/files
        const IMPORT_ATTACHMENTS = false;

        const comercial = IMPORT_ATTACHMENTS ? await prisma.comercialData.findUnique({
          where: { pipedriveDealId: dealId },
        }) : null;

        if (comercial && IMPORT_ATTACHMENTS && (deal.notes_count > 0 || deal.activities_count > 0 || deal.files_count > 0)) {
          // Notes
          if (deal.notes_count > 0) {
            try {
              const notes = await getPipedriveNotes(deal.id);
              for (const note of notes) {
                try {
                  await prisma.pipedriveNote.upsert({
                    where: { pipedriveNoteId: note.id },
                    update: {
                      comercialId: comercial.id, // Ensure correct comercial association
                      content: note.content || '',
                      addTime: note.add_time ? new Date(note.add_time) : null,
                      updateTime: note.update_time ? new Date(note.update_time) : null,
                      userId: note.user_id,
                      userName: note.user?.name || null,
                      pinned: note.pinned_to_deal_flag || false,
                    },
                    create: {
                      comercialId: comercial.id,
                      pipedriveNoteId: note.id,
                      content: note.content || '',
                      addTime: note.add_time ? new Date(note.add_time) : null,
                      updateTime: note.update_time ? new Date(note.update_time) : null,
                      userId: note.user_id,
                      userName: note.user?.name || null,
                      pinned: note.pinned_to_deal_flag || false,
                    },
                  });
                } catch (noteErr: any) {
                  // Log but don't fail the whole deal
                  console.error(`[Migration] Note ${note.id} failed:`, noteErr.message);
                }
              }
            } catch (notesErr: any) {
              console.error(`[Migration] Failed to fetch notes for deal ${deal.id}:`, notesErr.message);
            }
          }

          // Activities
          if (deal.activities_count > 0) {
            try {
              const activities = await getPipedriveActivities(deal.id);
              for (const activity of activities) {
                try {
                  await prisma.pipedriveActivity.upsert({
                    where: { pipedriveActivityId: activity.id },
                    update: {
                      comercialId: comercial.id,
                      type: activity.type,
                      subject: activity.subject,
                      note: activity.note,
                      dueDate: activity.due_date ? new Date(activity.due_date) : null,
                      dueTime: activity.due_time,
                      duration: activity.duration ? parseInt(activity.duration, 10) : null,
                      done: activity.done || false,
                      markedDoneTime: activity.marked_as_done_time ? new Date(activity.marked_as_done_time) : null,
                      userId: activity.user_id,
                      userName: activity.owner_name || null,
                      addTime: activity.add_time ? new Date(activity.add_time) : null,
                    },
                    create: {
                      comercialId: comercial.id,
                      pipedriveActivityId: activity.id,
                      type: activity.type,
                      subject: activity.subject,
                      note: activity.note,
                      dueDate: activity.due_date ? new Date(activity.due_date) : null,
                      dueTime: activity.due_time,
                      duration: activity.duration ? parseInt(activity.duration, 10) : null,
                      done: activity.done || false,
                      markedDoneTime: activity.marked_as_done_time ? new Date(activity.marked_as_done_time) : null,
                      userId: activity.user_id,
                      userName: activity.owner_name || null,
                      addTime: activity.add_time ? new Date(activity.add_time) : null,
                    },
                  });
                } catch (actErr: any) {
                  console.error(`[Migration] Activity ${activity.id} failed:`, actErr.message);
                }
              }
            } catch (activitiesErr: any) {
              console.error(`[Migration] Failed to fetch activities for deal ${deal.id}:`, activitiesErr.message);
            }
          }

          // Files
          if (deal.files_count > 0) {
            try {
              const files = await getPipedriveFiles(deal.id);
              for (const file of files) {
                try {
                  await prisma.pipedriveFile.upsert({
                    where: { pipedriveFileId: file.id },
                    update: {
                      comercialId: comercial.id,
                      fileName: file.name || file.file_name || 'unknown',
                      fileType: file.file_type,
                      fileSize: file.file_size,
                      fileUrl: file.url,
                      addTime: file.add_time ? new Date(file.add_time) : null,
                      userId: file.user_id,
                      userName: file.person_name || null,
                    },
                    create: {
                      comercialId: comercial.id,
                      pipedriveFileId: file.id,
                      fileName: file.name || file.file_name || 'unknown',
                      fileType: file.file_type,
                      fileSize: file.file_size,
                      fileUrl: file.url,
                      addTime: file.add_time ? new Date(file.add_time) : null,
                      userId: file.user_id,
                      userName: file.person_name || null,
                    },
                  });
                } catch (fileErr: any) {
                  console.error(`[Migration] File ${file.id} failed:`, fileErr.message);
                }
              }
            } catch (filesErr: any) {
              console.error(`[Migration] Failed to fetch files for deal ${deal.id}:`, filesErr.message);
            }
          }
        }

      } catch (dealError: any) {
        errors.push(`Deal ${deal.id}: ${dealError.message}`);
        console.error(`[Migration] Error processing deal ${deal.id}:`, dealError.message);
      }
    }

    console.log(`[Migration] Pipedrive migration completed. Imported: ${imported}, Updated: ${updated}`);
    return { success: true, imported, updated, errors };

  } catch (error: any) {
    console.error('[Migration] Pipedrive migration failed:', error);
    return { success: false, imported, updated, errors: [error.message] };
  }
}

// ==========================================
// MIGRATION: PIPEFY OPERAÇÕES -> PLANEJAMENTO
// ==========================================

export async function migratePipefyOperacoes(): Promise<{
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;
  let updated = 0;

  try {
    console.log('[Migration] Starting Pipefy OPERAÇÕES migration...');

    const cards = await getAllPipefyCards(PIPEFY_PIPE_OPERACOES);

    console.log(`[Migration] Processing ${cards.length} cards...`);
    let processedCount = 0;

    for (const card of cards) {
      try {
        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(`[Migration] Progress: ${processedCount}/${cards.length} cards processed...`);
        }

        const cardId = String(card.id);
        const title = card.title || 'Sem título';

        // Extract fields into a map
        const fieldsMap: Record<string, any> = {};
        for (const field of card.fields || []) {
          const fieldId = field.field?.id || field.name;
          fieldsMap[fieldId] = {
            value: field.value,
            arrayValue: field.array_value,
            datetimeValue: field.datetime_value,
            type: field.field?.type,
          };
        }

        // Helper to get field value
        const getField = (id: string): string | null => fieldsMap[id]?.value || null;
        const getFieldArray = (id: string): string[] => {
          const f = fieldsMap[id];
          if (f?.arrayValue) return f.arrayValue;
          if (f?.value) {
            try {
              const parsed = JSON.parse(f.value);
              return Array.isArray(parsed) ? parsed : [f.value];
            } catch {
              return f.value.split(',').map((s: string) => s.trim());
            }
          }
          return [];
        };
        const getFieldDate = (id: string): Date | null => {
          const f = fieldsMap[id];
          if (f?.datetimeValue) return new Date(f.datetimeValue);
          if (f?.value) {
            const d = new Date(f.value);
            return isNaN(d.getTime()) ? null : d;
          }
          return null;
        };

        // Map phase to status
        const phaseId = card.current_phase?.id;
        const status: PlanejamentoStatus = phaseId ? (PIPEFY_PHASE_MAP[phaseId] || 'ENTRADA') : 'ENTRADA';

        // Get assignees
        const assignees = card.assignees || [];
        const consultorOperacional = assignees.find((a: any) => a)?.name || null;
        const consultorOperacionalId = assignees.find((a: any) => a)?.id || null;

        // Prepare planejamento data
        const planejamentoData = {
          pipefyCardId: cardId,
          pipefyPhaseId: phaseId,
          pipefyPhaseName: card.current_phase?.name || null,
          pipefyUrl: card.url,
          pipefySyncedAt: new Date(),
          pipefyCreatedAt: card.createdAt ? new Date(card.createdAt) : null,

          status,

          // Fields
          isReserva: getField('reserva') === 'SIM',
          dataEntrada: getFieldDate('data_de_entrada'),
          dataDueDate: card.due_date ? new Date(card.due_date) : null,
          dataUltimaCamadaVerniz: getFieldDate('data_e_hora_de_aplica_o_da_segunda_camada_de_verniz_1'),

          m2Total: getField('metragem_do_projeto') ? parseFloat(getField('metragem_do_projeto')!) : null,
          metragemLinearTotal: getField('linear_total') ? parseFloat(getField('linear_total')!) : null,
          prazoEstimado: getField('prazo') ? parseInt(getField('prazo')!) : null,

          visitaAntesPiui: getField('visita_antes_do_piui') === 'SIM',
          isTelada: getField('tela_contratada') === 'SIM',
          detalheTela: getField('detalhamento_da_metragem_de_tela'),
          isFaseada: getField('obra_ser_faseada_1') === 'SIM',
          detalheFaseamento: getField('detalhamento_do_faseamento_1'),

          classificacaoSuperficie: getFieldArray('reas_de_projetos'),
          cores: getFieldArray('cores'),
          detalhePersonalizacao: getField('texto_curto'),
          materiais: getFieldArray('materials'),
          etiquetas: getFieldArray('localidade'),

          equipeExecucao: getField('equipe'),
          numeroOS: getField('n_mero_os') ? parseInt(getField('n_mero_os')!) : null,
          vendedor: getField('vendedor'),

          consultorOperacional,
          consultorOperacionalId,
          consultorAtendimento: null,
          consultorAtendimentoId: getField('consultor_de_atendimento'),
          consultorProjetos: null,
          consultorProjetosId: getField('consultor_de_projetos'),

          pipefyRawData: card,
        };

        // Check if already exists
        const existing = await prisma.planejamento.findUnique({
          where: { pipefyCardId: cardId },
          include: { project: true },
        });

        if (existing) {
          // Update existing
          await prisma.planejamento.update({
            where: { id: existing.id },
            data: planejamentoData,
          });

          // Update project
          const endereco = getField('endere_o') || '';
          if (existing.project.cliente !== title || existing.project.endereco !== endereco) {
            await prisma.project.update({
              where: { id: existing.projectId },
              data: {
                cliente: title,
                endereco,
                m2Total: planejamentoData.m2Total || existing.project.m2Total,
              },
            });
          }

          updated++;
        } else {
          // Create new project and planejamento
          const endereco = getField('endere_o') || '';

          const project = await prisma.project.create({
            data: {
              title: title, // Required field
              cliente: title,
              endereco,
              m2Total: planejamentoData.m2Total || 0,
              status: 'EM_EXECUCAO',
              currentModule: 'PLANEJAMENTO',
              pipefyCardId: cardId,
            },
          });

          await prisma.planejamento.create({
            data: {
              ...planejamentoData,
              projectId: project.id,
            },
          });

          imported++;
        }

        // Import comments
        const planejamento = await prisma.planejamento.findUnique({
          where: { pipefyCardId: cardId },
        });

        if (planejamento && card.comments && card.comments.length > 0) {
          for (const comment of card.comments) {
            const existingComment = await prisma.pipefyComment.findFirst({
              where: {
                planejamentoId: planejamento.id,
                pipefyCommentId: comment.id,
              },
            });

            if (!existingComment) {
              await prisma.pipefyComment.create({
                data: {
                  planejamentoId: planejamento.id,
                  pipefyCommentId: comment.id,
                  text: comment.text || '',
                  authorName: comment.author_name,
                  createdAt: comment.created_at ? new Date(comment.created_at) : new Date(),
                },
              });
            }
          }
        }

        // Import attachments
        if (planejamento && card.attachments && card.attachments.length > 0) {
          for (const attachment of card.attachments) {
            const existingAttachment = await prisma.pipefyAttachment.findFirst({
              where: {
                planejamentoId: planejamento.id,
                url: attachment.url,
              },
            });

            if (!existingAttachment) {
              await prisma.pipefyAttachment.create({
                data: {
                  planejamentoId: planejamento.id,
                  pipefyPath: attachment.path,
                  url: attachment.url,
                },
              });
            }
          }
        }

        // Handle attachment fields (escopo_inicial, escopo_aprovado)
        if (planejamento) {
          const escopoInicial = fieldsMap['escopo_inicial'];
          const escopoAprovado = fieldsMap['escopo_aprovado'];

          if (escopoInicial?.value) {
            try {
              const urls = JSON.parse(escopoInicial.value);
              if (Array.isArray(urls)) {
                for (const url of urls) {
                  const exists = await prisma.pipefyAttachment.findFirst({
                    where: { planejamentoId: planejamento.id, url },
                  });
                  if (!exists) {
                    await prisma.pipefyAttachment.create({
                      data: {
                        planejamentoId: planejamento.id,
                        url,
                        fieldName: 'escopo_inicial',
                      },
                    });
                  }
                }
                // Update URL in planejamento
                await prisma.planejamento.update({
                  where: { id: planejamento.id },
                  data: { escopoInicialUrl: urls[0] || null },
                });
              }
            } catch {}
          }

          if (escopoAprovado?.value) {
            try {
              const urls = JSON.parse(escopoAprovado.value);
              if (Array.isArray(urls)) {
                for (const url of urls) {
                  const exists = await prisma.pipefyAttachment.findFirst({
                    where: { planejamentoId: planejamento.id, url },
                  });
                  if (!exists) {
                    await prisma.pipefyAttachment.create({
                      data: {
                        planejamentoId: planejamento.id,
                        url,
                        fieldName: 'escopo_aprovado',
                      },
                    });
                  }
                }
                // Update URL in planejamento
                await prisma.planejamento.update({
                  where: { id: planejamento.id },
                  data: { escopoAprovadoUrl: urls[0] || null },
                });
              }
            } catch {}
          }
        }

      } catch (cardError: any) {
        errors.push(`Card ${card.id}: ${cardError.message}`);
        console.error(`[Migration] Error processing card ${card.id}:`, cardError.message);
      }
    }

    console.log(`[Migration] Pipefy OPERAÇÕES migration completed. Imported: ${imported}, Updated: ${updated}`);
    return { success: true, imported, updated, errors };

  } catch (error: any) {
    console.error('[Migration] Pipefy OPERAÇÕES migration failed:', error);
    return { success: false, imported, updated, errors: [error.message] };
  }
}

// ==========================================
// FULL MIGRATION
// ==========================================

export async function migrateAll(): Promise<{
  pipedrive: { success: boolean; imported: number; updated: number; errors: string[] };
  pipefy: { success: boolean; imported: number; updated: number; errors: string[] };
}> {
  console.log('[Migration] Starting full migration...');

  const pipedriveResult = await migratePipedrive();
  const pipefyResult = await migratePipefyOperacoes();

  console.log('[Migration] Full migration completed!');
  console.log(`[Migration] Pipedrive: ${pipedriveResult.imported} imported, ${pipedriveResult.updated} updated`);
  console.log(`[Migration] Pipefy: ${pipefyResult.imported} imported, ${pipefyResult.updated} updated`);

  return {
    pipedrive: pipedriveResult,
    pipefy: pipefyResult,
  };
}

// ==========================================
// PHASE TO MODULE MAPPING
// ==========================================

// Fases que pertencem ao módulo EXECUÇÃO
const EXECUCAO_PHASES = [
  'OBRA EM EXECUÇÃO',
  'OBRA PAUSADA',
];

// Fases que indicam projeto FINALIZADO
const FINALIZADO_PHASES = [
  'CLIENTE FINALIZADO',
];

// Fases pós-obra (transição para finalização) - ainda em EXECUCAO mas com status diferente
const POS_OBRA_PHASES = [
  'OBRA CONCLUÍDA',
  'LOGÍSTICA - COLETAR',
  'LOGÍSTICA - EM COLETA',
];

// Todas as outras fases são PLANEJAMENTO

/**
 * Determina o módulo e status baseado na fase do Pipefy
 *
 * ProjectStatus enum: EM_EXECUCAO, PAUSADO, CONCLUIDO, CANCELADO
 * ProjectModule enum: COMERCIAL, PIUI, PLANEJAMENTO, EXECUCAO, POS_VENDA
 */
function getModuleAndStatusFromPhase(phaseName: string | null): {
  currentModule: 'PLANEJAMENTO' | 'EXECUCAO';
  status: 'EM_EXECUCAO' | 'PAUSADO' | 'CONCLUIDO';
} {
  if (!phaseName) {
    return { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' };
  }

  const normalizedPhase = phaseName.toUpperCase().trim();

  // EXECUÇÃO - Obras ativas
  if (EXECUCAO_PHASES.some(p => normalizedPhase.includes(p.toUpperCase()))) {
    if (normalizedPhase.includes('PAUSADA')) {
      return { currentModule: 'EXECUCAO', status: 'PAUSADO' };
    }
    return { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' };
  }

  // PÓS-OBRA - Ainda em execução mas pós-conclusão (logística de coleta)
  if (POS_OBRA_PHASES.some(p => normalizedPhase.includes(p.toUpperCase()))) {
    return { currentModule: 'EXECUCAO', status: 'EM_EXECUCAO' };
  }

  // FINALIZADO - Projetos concluídos (POS_VENDA tem pipe próprio)
  if (FINALIZADO_PHASES.some(p => normalizedPhase.includes(p.toUpperCase()))) {
    return { currentModule: 'EXECUCAO', status: 'CONCLUIDO' };
  }

  // Todas as outras fases são PLANEJAMENTO (em andamento)
  return { currentModule: 'PLANEJAMENTO', status: 'EM_EXECUCAO' };
}

/**
 * Sincroniza os módulos dos projetos baseado nas fases atuais do Pipefy
 */
export async function syncPipefyModules(): Promise<{
  success: boolean;
  updated: {
    planejamento: number;
    execucao: number;
    concluidos: number;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const updated = {
    planejamento: 0,
    execucao: 0,
    concluidos: 0,
  };

  try {
    console.log('[Sync] Starting Pipefy modules sync...');

    // Fetch all cards from Pipefy to get current phases
    const cards = await getAllPipefyCards(PIPEFY_PIPE_OPERACOES);
    console.log(`[Sync] Fetched ${cards.length} cards from Pipefy`);

    let processedCount = 0;

    for (const card of cards) {
      try {
        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(`[Sync] Progress: ${processedCount}/${cards.length} cards processed...`);
        }

        const cardId = String(card.id);
        const phaseName = card.current_phase?.name || null;

        // Find the project with this Pipefy card ID
        const project = await prisma.project.findFirst({
          where: { pipefyCardId: cardId },
        });

        if (!project) {
          continue; // Project not found, skip
        }

        // Get the correct module and status based on phase
        const { currentModule, status } = getModuleAndStatusFromPhase(phaseName);

        // Update if different
        if (project.currentModule !== currentModule || project.status !== status) {
          await prisma.project.update({
            where: { id: project.id },
            data: {
              currentModule,
              status,
              pipefyPhase: phaseName,
            },
          });

          // Also update planejamento record if exists
          await prisma.planejamento.updateMany({
            where: { pipefyCardId: cardId },
            data: { pipefyPhaseName: phaseName },
          });

          if (currentModule === 'PLANEJAMENTO') updated.planejamento++;
          else if (currentModule === 'EXECUCAO' && status === 'CONCLUIDO') updated.concluidos++;
          else if (currentModule === 'EXECUCAO') updated.execucao++;

          console.log(`[Sync] Updated "${project.cliente}" -> ${currentModule} (${status}) [Phase: ${phaseName}]`);
        }
      } catch (err: any) {
        errors.push(`Card ${card.id}: ${err.message}`);
      }
    }

    console.log('[Sync] Sync completed!');
    console.log(`[Sync] Planejamento: ${updated.planejamento}, Execução: ${updated.execucao}, Concluídos: ${updated.concluidos}`);

    return {
      success: true,
      updated,
      errors,
    };
  } catch (error: any) {
    console.error('[Sync] Error syncing modules:', error);
    return {
      success: false,
      updated,
      errors: [error.message, ...errors],
    };
  }
}
