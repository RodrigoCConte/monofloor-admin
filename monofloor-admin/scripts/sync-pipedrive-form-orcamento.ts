/**
 * Script para sincronizar leads do "Form Orçamento" entre Pipedrive e nosso sistema
 *
 * 1. Busca todos os leads do stage "Form Orçamento" no Pipedrive
 * 2. Compara com os leads do nosso sistema (dealOrigin = 'form orcamento')
 * 3. Leads que não existem no Pipedrive são movidos para "ARQUIVADO"
 * 4. Leads que existem no Pipedrive mas não no sistema são criados
 */

import { PrismaClient, ComercialStatus } from '@prisma/client';

const prisma = new PrismaClient();

// API Config
const PIPEDRIVE_API_TOKEN = '81ed84d2e99f5608d9d6c203e44ccefb4d137d3e';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

// Stage ID for "Form Orçamento" in Pipedrive
const FORM_ORCAMENTO_STAGE_ID = 1;

async function fetchPipedrive(endpoint: string): Promise<any> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  const response = await fetch(url);
  return response.json();
}

async function getFormOrcamentoDeals(): Promise<any[]> {
  const allDeals: any[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  console.log('[Pipedrive] Buscando deals do stage "Form Orçamento"...');

  while (hasMore) {
    const response = await fetchPipedrive(
      `/deals?stage_id=${FORM_ORCAMENTO_STAGE_ID}&status=open&start=${start}&limit=${limit}`
    );

    if (response.data && response.data.length > 0) {
      allDeals.push(...response.data);
      console.log(`[Pipedrive] Encontrados ${allDeals.length} deals até agora...`);
    }

    hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    start += limit;
  }

  console.log(`[Pipedrive] Total de deals em "Form Orçamento": ${allDeals.length}\n`);
  return allDeals;
}

async function main() {
  console.log('═'.repeat(80));
  console.log('SINCRONIZAÇÃO PIPEDRIVE ↔ FORM ORÇAMENTO');
  console.log('═'.repeat(80) + '\n');

  // 1. Buscar deals do Pipedrive (stage Form Orçamento)
  const pipedriveDeals = await getFormOrcamentoDeals();

  // Criar mapa de IDs do Pipedrive para fácil lookup
  const pipedriveIds = new Set(pipedriveDeals.map((d) => String(d.id)));
  const pipedriveByName = new Map<string, any>();
  const pipedriveByPhone = new Map<string, any>();
  const pipedriveByEmail = new Map<string, any>();

  for (const deal of pipedriveDeals) {
    // Por nome (normalizado)
    const name = (deal.person_name || deal.title || '').toLowerCase().trim();
    if (name) pipedriveByName.set(name, deal);

    // Por telefone
    const phone = deal.person_id?.phone?.[0]?.value;
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      pipedriveByPhone.set(normalizedPhone, deal);
    }

    // Por email
    const email = deal.person_id?.email?.[0]?.value?.toLowerCase();
    if (email) pipedriveByEmail.set(email, deal);
  }

  // 2. Buscar leads do nosso sistema (Form Orçamento)
  console.log('[Sistema] Buscando leads do Form Orçamento...');
  const sistemaLeads = await prisma.comercialData.findMany({
    where: {
      OR: [
        { dealOrigin: 'form orcamento' },
        { typeformResponseId: { not: null } },
      ],
      status: { not: 'ARQUIVADO' as ComercialStatus }, // Ignorar já arquivados
    },
    include: {
      project: true,
    },
  });

  console.log(`[Sistema] Total de leads: ${sistemaLeads.length}\n`);

  // 3. Comparar e identificar diferenças
  const leadsNoPipedrive: typeof sistemaLeads = [];
  const leadsSobrando: typeof sistemaLeads = [];

  for (const lead of sistemaLeads) {
    // Verificar se existe no Pipedrive por ID
    if (lead.pipedriveDealId && pipedriveIds.has(lead.pipedriveDealId)) {
      leadsNoPipedrive.push(lead);
      continue;
    }

    // Verificar por nome
    const name = (lead.personName || '').toLowerCase().trim();
    if (name && pipedriveByName.has(name)) {
      leadsNoPipedrive.push(lead);
      continue;
    }

    // Verificar por telefone
    const phone = (lead.personPhone || '').replace(/\D/g, '');
    if (phone && pipedriveByPhone.has(phone)) {
      leadsNoPipedrive.push(lead);
      continue;
    }

    // Verificar por email
    const email = (lead.personEmail || '').toLowerCase();
    if (email && pipedriveByEmail.has(email)) {
      leadsNoPipedrive.push(lead);
      continue;
    }

    // Não encontrado no Pipedrive - está sobrando
    leadsSobrando.push(lead);
  }

  // 4. Relatório
  console.log('─'.repeat(80));
  console.log('RESULTADO DA COMPARAÇÃO');
  console.log('─'.repeat(80));
  console.log(`✅ Leads no Pipedrive: ${leadsNoPipedrive.length}`);
  console.log(`⚠️  Leads sobrando (não estão no Pipedrive): ${leadsSobrando.length}`);
  console.log('');

  if (leadsSobrando.length > 0) {
    console.log('\n📋 LEADS SOBRANDO (serão arquivados):');
    console.log('─'.repeat(80));

    for (const lead of leadsSobrando) {
      const value = lead.dealValue ? `R$ ${Number(lead.dealValue).toLocaleString('pt-BR')}` : 'N/A';
      console.log(`  • ${lead.personName || 'Sem nome'}`);
      console.log(`    Tel: ${lead.personPhone || 'N/A'} | Email: ${lead.personEmail || 'N/A'}`);
      console.log(`    Valor: ${value} | Metragem: ${lead.metragemEstimada || 'N/A'}m²`);
      console.log('');
    }
  }

  // 5. Verificar leads no Pipedrive que não estão no sistema
  const sistemaByPipedriveId = new Set(sistemaLeads.map((l) => l.pipedriveDealId).filter(Boolean));
  const sistemaByName = new Set(sistemaLeads.map((l) => (l.personName || '').toLowerCase().trim()).filter(Boolean));
  const sistemaByPhone = new Set(
    sistemaLeads.map((l) => (l.personPhone || '').replace(/\D/g, '')).filter(Boolean)
  );
  const sistemaByEmail = new Set(
    sistemaLeads.map((l) => (l.personEmail || '').toLowerCase()).filter(Boolean)
  );

  const leadsFaltando: any[] = [];

  for (const deal of pipedriveDeals) {
    const id = String(deal.id);
    if (sistemaByPipedriveId.has(id)) continue;

    const name = (deal.person_name || deal.title || '').toLowerCase().trim();
    if (name && sistemaByName.has(name)) continue;

    const phone = (deal.person_id?.phone?.[0]?.value || '').replace(/\D/g, '');
    if (phone && sistemaByPhone.has(phone)) continue;

    const email = (deal.person_id?.email?.[0]?.value || '').toLowerCase();
    if (email && sistemaByEmail.has(email)) continue;

    leadsFaltando.push(deal);
  }

  if (leadsFaltando.length > 0) {
    console.log('\n📋 LEADS FALTANDO NO SISTEMA (serão criados):');
    console.log('─'.repeat(80));

    for (const deal of leadsFaltando) {
      const phone = deal.person_id?.phone?.[0]?.value || 'N/A';
      const email = deal.person_id?.email?.[0]?.value || 'N/A';
      const value = deal.value ? `R$ ${Number(deal.value).toLocaleString('pt-BR')}` : 'N/A';
      console.log(`  • ${deal.person_name || deal.title}`);
      console.log(`    Tel: ${phone} | Email: ${email}`);
      console.log(`    Valor: ${value} | Pipedrive ID: ${deal.id}`);
      console.log('');
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('RESUMO:');
  console.log(`  • Leads existentes nos dois: ${leadsNoPipedrive.length}`);
  console.log(`  • Leads sobrando (arquivar): ${leadsSobrando.length}`);
  console.log(`  • Leads faltando (criar): ${leadsFaltando.length}`);
  console.log('═'.repeat(80) + '\n');

  // 6. Executar se --confirm
  const shouldConfirm = process.argv.includes('--confirm');

  if (!shouldConfirm) {
    console.log('⚠️  Para executar as alterações, rode novamente com --confirm');
    console.log('   npx ts-node scripts/sync-pipedrive-form-orcamento.ts --confirm\n');
    return;
  }

  // Arquivar leads sobrando
  if (leadsSobrando.length > 0) {
    console.log('\n🗄️  Arquivando leads sobrando...');

    for (const lead of leadsSobrando) {
      await prisma.comercialData.update({
        where: { id: lead.id },
        data: {
          status: 'ARQUIVADO' as ComercialStatus,
          labelPipedrive: 'Arquivado - Não encontrado no Pipedrive',
        },
      });
      console.log(`  ✅ Arquivado: ${lead.personName || 'Sem nome'}`);
    }
  }

  // Criar leads faltando
  if (leadsFaltando.length > 0) {
    console.log('\n➕ Criando leads faltando...');

    for (const deal of leadsFaltando) {
      try {
        // Criar projeto
        const project = await prisma.project.create({
          data: {
            title: deal.person_name || deal.title || 'Lead Pipedrive',
            cliente: deal.person_name || deal.title || 'Lead Pipedrive',
            endereco: '',
            m2Total: 0,
            status: 'PAUSADO',
            currentModule: 'COMERCIAL',
          },
        });

        // Criar comercialData
        await prisma.comercialData.create({
          data: {
            projectId: project.id,
            pipedriveDealId: String(deal.id),
            status: 'LEAD' as ComercialStatus,
            dealOrigin: 'form orcamento',
            personName: deal.person_name || deal.title,
            personPhone: deal.person_id?.phone?.[0]?.value || null,
            personEmail: deal.person_id?.email?.[0]?.value || null,
            dealValue: deal.value ? parseFloat(deal.value) : null,
            dealCurrency: deal.currency,
            dealAddTime: deal.add_time ? new Date(deal.add_time) : new Date(),
            pipedriveUrl: `https://monofloor.pipedrive.com/deal/${deal.id}`,
            stageId: FORM_ORCAMENTO_STAGE_ID,
            stageName: 'Form Orçamento',
            labelPipedrive: deal.label || 'Novo Lead',
            pipedriveRawData: deal,
          },
        });

        console.log(`  ✅ Criado: ${deal.person_name || deal.title}`);
      } catch (err: any) {
        console.log(`  ❌ Erro ao criar ${deal.person_name || deal.title}: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Sincronização concluída!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
