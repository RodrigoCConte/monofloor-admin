const { chromium } = require('playwright');

async function testCidade() {
  console.log('🚀 Testando conversão de código de cidade...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER]`, msg.text());
  });

  try {
    // Simular URL que viria do CRM com código de cidade
    const params = new URLSearchParams({
      cliente: 'Teste Cliente',
      cidade: 'SP_CAPITAL',
      consultor: 'Amanda Vantini',
      arquiteto: 'Escritório Teste'
    });

    const url = `https://comercial.monofloor.cloud/geradordepropostas/?${params.toString()}`;
    console.log('📄 Navegando para:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Verificar os campos preenchidos
    const endereco = await page.$eval('#endereco', el => el.value);
    const detalhes = await page.$eval('#detalhes', el => el.value);
    const nomeCliente = await page.$eval('#nomeCliente', el => el.value);

    console.log('\n📊 CAMPOS PREENCHIDOS:');
    console.log('  Nome Cliente:', nomeCliente);
    console.log('  Endereço/Local:', endereco);
    console.log('  Detalhes:', detalhes);

    console.log('\n🔍 VERIFICAÇÃO:');
    console.log('  Esperado Endereço: "São Paulo (Capital)"');
    console.log('  Recebido Endereço:', `"${endereco}"`);
    console.log('  ✓ Correto:', endereco === 'São Paulo (Capital)' ? 'SIM' : 'NÃO');

    console.log('\n  Esperado Detalhes: "Especialista: Amanda Vantini\\nArquiteto: Escritório Teste"');
    console.log('  Recebido Detalhes:', `"${detalhes.replace(/\n/g, '\\n')}"`);
    console.log('  ✓ Tem Especialista:', detalhes.includes('Especialista:') ? 'SIM' : 'NÃO');
    console.log('  ✓ NÃO tem Consultor:', !detalhes.includes('Consultor:') ? 'SIM' : 'NÃO');

    // Verificar o código JS da página
    const hasNewCode = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('SP_CAPITAL') && script.textContent.includes('São Paulo (Capital)')) {
          return true;
        }
      }
      return false;
    });
    console.log('\n🔧 Código atualizado na página:', hasNewCode ? 'SIM' : 'NÃO');

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await browser.close();
  process.exit(0);
}

testCidade();
