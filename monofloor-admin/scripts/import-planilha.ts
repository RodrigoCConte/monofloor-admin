/**
 * Script para importar projetos da planilha Excel
 * Executa: npx ts-node scripts/import-planilha.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { excelService } from '../src/services/excel.service';

const PLANILHA_PATH = '/Users/rodrigoconte/Downloads/novo_relatrio_13-12-2025.xlsx';

async function main() {
  console.log('='.repeat(60));
  console.log('IMPORTAÇÃO DE PROJETOS - MONOFLOOR');
  console.log('='.repeat(60));
  console.log(`\nPlanilha: ${PLANILHA_PATH}`);

  // Verificar se arquivo existe
  if (!fs.existsSync(PLANILHA_PATH)) {
    console.error('\n❌ ERRO: Arquivo não encontrado!');
    console.error(`Caminho: ${PLANILHA_PATH}`);
    process.exit(1);
  }

  console.log('\n📋 Lendo planilha...');
  const buffer = fs.readFileSync(PLANILHA_PATH);

  console.log('📊 Parseando dados...');
  const rows = excelService.parseExcel(buffer);
  console.log(`   → ${rows.length} linhas encontradas`);

  // Mostrar preview dos dados
  console.log('\n📝 Preview dos primeiros 3 projetos:');
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const row = rows[i];
    console.log(`\n   [${i + 1}] ${row.titulo}`);
    console.log(`       Cliente: ${row.cliente || '(não informado)'}`);
    console.log(`       Endereço: ${row.endereco || '(não informado)'}`);
    console.log(`       Piso: ${row.m2_piso || 0} m² | Parede: ${row.m2_parede || 0} m² | Teto: ${row.m2_teto || 0} m²`);
    console.log(`       Material: ${row.material || '(não informado)'} | Cor: ${row.cor || '(não informado)'}`);
    console.log(`       Consultor: ${row.consultor || '(não informado)'}`);
    console.log(`       Status: ${row.status || 'EM_EXECUCAO (padrão)'}`);
  }

  console.log('\n🚀 Iniciando importação...\n');

  try {
    const result = await excelService.importProjects(rows);

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTAÇÃO CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`\n   Total de linhas: ${result.total}`);
    console.log(`   ✅ Criados: ${result.created}`);
    console.log(`   🔄 Atualizados: ${result.updated}`);
    console.log(`   ⏭️  Ignorados: ${result.skipped} (status não permitido)`);
    console.log(`   ❌ Erros: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Erros encontrados:');
      for (const error of result.errors) {
        console.log(`   Linha ${error.row}: ${error.error}`);
      }
    }

    console.log('\n');
  } catch (error: any) {
    console.error('\n❌ ERRO NA IMPORTAÇÃO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
