const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importProjects() {
  const workbook = XLSX.readFile('/Users/rodrigoconte/Downloads/novo_relatrio_13-12-2025.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log('Total de projetos na planilha:', data.length);

  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const row of data) {
    try {
      const pipefyCardId = String(row['Código']);
      const fase = row['Fase atual'] || '';

      // Mapear fase para currentModule
      let currentModule = 'EXECUCAO';
      if (fase.toLowerCase().includes('caixa') || fase.toLowerCase().includes('inbox')) {
        currentModule = 'COMERCIAL';
      } else if (fase.toLowerCase().includes('fazendo') || fase.toLowerCase().includes('andamento')) {
        currentModule = 'EXECUCAO';
      } else if (fase.toLowerCase().includes('conclu')) {
        currentModule = 'FINALIZADO';
      }

      // Parsear m²
      const parseNumber = (val) => {
        if (!val) return null;
        const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''));
        return isNaN(num) ? null : num;
      };

      const projectData = {
        title: row['Título'] || row['Cliente'] || 'Sem título',
        cliente: row['Cliente'] || row['Título'] || '',
        endereco: row['Endereço'] || null,
        m2Total: parseNumber(row['M² Total']),
        m2Piso: parseNumber(row['Piso (m²)']) || 0,
        m2Parede: parseNumber(row['Parede (m²)']) || 0,
        m2Teto: parseNumber(row['Teto (m²)']) || 0,
        mRodape: parseNumber(row['Rodapé (m linear)']) || 0,
        equipe: row['Equipe'] || null,
        material: row['Material'] || null,
        cor: row['Cor'] || null,
        detalhamento: row['Detalhamento'] || null,
        andamento: row['Andamento'] || null,
        especiais: row['Especiais'] || null,
        consultor: row['Consultor'] || null,
        currentModule: currentModule,
        status: 'EM_EXECUCAO',
      };

      // Tentar encontrar projeto existente pelo pipefyCardId
      const existing = await prisma.project.findFirst({
        where: { pipefyCardId: pipefyCardId }
      });

      if (existing) {
        await prisma.project.update({
          where: { id: existing.id },
          data: projectData
        });
        updated++;
      } else {
        await prisma.project.create({
          data: {
            ...projectData,
            pipefyCardId: pipefyCardId,
          }
        });
        created++;
      }

      process.stdout.write('.');
    } catch (err) {
      console.error('\nErro:', err.message);
      errors++;
    }
  }

  console.log('\n\nImportação concluída!');
  console.log('Atualizados:', updated);
  console.log('Criados:', created);
  console.log('Erros:', errors);
}

importProjects().catch(console.error).finally(() => prisma.$disconnect());
