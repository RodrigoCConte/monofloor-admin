const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Iniciando teste de geração de proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    // Monitor network requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url + ' -> ' + status);
        }
    });

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('proposta') || text.includes('Proposta') || text.includes('PDF') || text.includes('erro') || text.includes('Erro')) {
            console.log('🖥️ Console:', text);
        }
    });

    try {
        // 1. Login
        console.log('📍 Fazendo login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', 'rodrigo@monofloor.com.br');
        await page.type('input[type="password"]', 'mono2025');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Login OK');

        // 2. Ir para propostas
        console.log('📍 Indo para lista de propostas...');
        await page.goto('https://comercial.monofloor.cloud/propostas', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // 3. Criar nova proposta
        console.log('📍 Criando nova proposta...');

        // Tenta clicar em qualquer botão que pareça ser "nova proposta"
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const btn = buttons.find(b => b.textContent.toLowerCase().includes('nova'));
            if (btn) btn.click();
        });

        await new Promise(r => setTimeout(r, 2000));

        // 4. Preencher formulário
        console.log('📍 Preenchendo formulário...');

        // Nome do cliente
        const clientNameInput = await page.$('input[name="clientName"], input[placeholder*="cliente"], input[placeholder*="Cliente"], #clientName');
        if (clientNameInput) {
            await clientNameInput.click({ clickCount: 3 });
            await clientNameInput.type('Teste_Geracao_' + Date.now().toString().slice(-6));
            console.log('✅ Nome do cliente preenchido');
        }

        // Área
        const areaInput = await page.$('input[name="area"], input[placeholder*="área"], input[placeholder*="m²"], #area');
        if (areaInput) {
            await areaInput.click({ clickCount: 3 });
            await areaInput.type('150');
            console.log('✅ Área preenchida');
        }

        // Valor por m²
        const priceInput = await page.$('input[name="pricePerSqm"], input[placeholder*="preço"], input[placeholder*="R$"], #pricePerSqm');
        if (priceInput) {
            await priceInput.click({ clickCount: 3 });
            await priceInput.type('350');
            console.log('✅ Valor preenchido');
        }

        await new Promise(r => setTimeout(r, 1000));

        // 5. Screenshot antes de gerar
        await page.screenshot({ path: '/tmp/before-generate.png', fullPage: true });
        console.log('📸 Screenshot salvo: /tmp/before-generate.png');

        // 6. Gerar proposta
        console.log('📍 Gerando proposta...');
        const generateButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b =>
                b.textContent.toLowerCase().includes('gerar') ||
                b.textContent.toLowerCase().includes('criar') ||
                b.textContent.toLowerCase().includes('salvar')
            );
            if (btn) {
                console.log('Botão encontrado:', btn.textContent);
                return btn.textContent;
            }
            return null;
        });

        console.log('🔍 Botão de gerar:', generateButton);

        // Clica no botão de gerar
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b =>
                b.textContent.toLowerCase().includes('gerar') ||
                b.textContent.toLowerCase().includes('criar') ||
                b.textContent.toLowerCase().includes('salvar')
            );
            if (btn) btn.click();
        });

        // Aguarda a geração
        console.log('⏳ Aguardando geração do PDF...');
        await new Promise(r => setTimeout(r, 30000));

        // Screenshot após gerar
        await page.screenshot({ path: '/tmp/after-generate.png', fullPage: true });
        console.log('📸 Screenshot salvo: /tmp/after-generate.png');

        // Verifica URL atual
        console.log('📍 URL atual:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    }

    console.log('🏁 Teste concluído. Browser permanece aberto para inspeção.');
    // Não fecha o browser para permitir inspeção manual

})();
