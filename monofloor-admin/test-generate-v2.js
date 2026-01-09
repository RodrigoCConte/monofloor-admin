const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Iniciando teste de geração de proposta v2...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    // Timeouts maiores
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Monitor network requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url + ' -> ' + status);
            if (method === 'POST' && url.includes('generate')) {
                try {
                    const body = await response.text();
                    console.log('📦 Resposta:', body.substring(0, 500));
                } catch(e) {}
            }
        }
    });

    try {
        // 1. Login
        console.log('📍 Fazendo login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'domcontentloaded' });

        // Aguarda o formulário de login
        await page.waitForSelector('input[type="email"]', { visible: true });
        console.log('✅ Formulário de login carregado');

        await page.type('input[type="email"]', 'rodrigo@monofloor.com.br', { delay: 50 });
        await page.type('input[type="password"]', 'mono2025', { delay: 50 });

        console.log('📍 Clicando em submit...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            page.click('button[type="submit"]')
        ]);
        console.log('✅ Login OK - URL:', page.url());

        // Aguarda carregar completamente
        await new Promise(r => setTimeout(r, 3000));

        // 2. Ir para propostas
        console.log('📍 Indo para lista de propostas...');
        await page.goto('https://comercial.monofloor.cloud/propostas', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 3000));
        console.log('✅ Página de propostas - URL:', page.url());

        // Screenshot da lista
        await page.screenshot({ path: '/tmp/propostas-list.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/propostas-list.png');

        // 3. Buscar botão Nova Proposta
        console.log('📍 Buscando botão Nova Proposta...');
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a')).map(b => ({
                text: b.textContent.trim(),
                tag: b.tagName,
                href: b.href || ''
            })).filter(b => b.text.length > 0 && b.text.length < 50);
        });
        console.log('🔍 Botões encontrados:', JSON.stringify(buttons.slice(0, 10), null, 2));

        // Clica em Nova Proposta
        const clicked = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            const btn = items.find(b => {
                const text = b.textContent.toLowerCase();
                return text.includes('nova') || text.includes('criar') || text.includes('adicionar');
            });
            if (btn) {
                btn.click();
                return btn.textContent.trim();
            }
            return null;
        });
        console.log('✅ Clicado em:', clicked);
        await new Promise(r => setTimeout(r, 3000));

        // Screenshot do formulário
        await page.screenshot({ path: '/tmp/proposta-form.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/proposta-form.png');

        // 4. Verifica se tem formulário de proposta
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
                name: i.name,
                id: i.id,
                placeholder: i.placeholder,
                type: i.type
            }));
        });
        console.log('🔍 Inputs encontrados:', JSON.stringify(inputs.slice(0, 15), null, 2));

        // 5. Preenche campos básicos
        console.log('📍 Preenchendo formulário...');

        // Tenta diferentes seletores para nome do cliente
        const nameSelectors = ['input[name="clientName"]', 'input[name="client_name"]', 'input[placeholder*="cliente"]', 'input[placeholder*="nome"]', '#clientName', '#client_name'];
        for (const sel of nameSelectors) {
            const input = await page.$(sel);
            if (input) {
                await input.click({ clickCount: 3 });
                await input.type('Teste_Claude_' + Date.now().toString().slice(-6));
                console.log('✅ Nome preenchido usando:', sel);
                break;
            }
        }

        // Área
        const areaSelectors = ['input[name="area"]', 'input[name="totalArea"]', 'input[placeholder*="área"]', 'input[placeholder*="m²"]', '#area'];
        for (const sel of areaSelectors) {
            const input = await page.$(sel);
            if (input) {
                await input.click({ clickCount: 3 });
                await input.type('150');
                console.log('✅ Área preenchida usando:', sel);
                break;
            }
        }

        // Valor
        const priceSelectors = ['input[name="pricePerSqm"]', 'input[name="price"]', 'input[name="valor"]', 'input[placeholder*="preço"]', 'input[placeholder*="valor"]', '#pricePerSqm'];
        for (const sel of priceSelectors) {
            const input = await page.$(sel);
            if (input) {
                await input.click({ clickCount: 3 });
                await input.type('350');
                console.log('✅ Valor preenchido usando:', sel);
                break;
            }
        }

        await new Promise(r => setTimeout(r, 1000));

        // Screenshot antes de gerar
        await page.screenshot({ path: '/tmp/before-generate.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/before-generate.png');

        // 6. Botão de gerar
        console.log('📍 Buscando botão de gerar...');
        const generateButtons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 50);
        });
        console.log('🔍 Botões de ação:', generateButtons);

        const generateClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => {
                const text = b.textContent.toLowerCase();
                return text.includes('gerar') || text.includes('salvar') || text.includes('criar proposta');
            });
            if (btn) {
                console.log('Clicando em:', btn.textContent);
                btn.click();
                return btn.textContent.trim();
            }
            return null;
        });
        console.log('✅ Clicado em gerar:', generateClicked);

        // Aguarda a geração (pode demorar)
        console.log('⏳ Aguardando geração do PDF (60s)...');
        await new Promise(r => setTimeout(r, 60000));

        // Screenshot após
        await page.screenshot({ path: '/tmp/after-generate.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/after-generate.png');
        console.log('📍 URL final:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/error.png', fullPage: true });
        console.log('📸 Screenshot de erro: /tmp/error.png');
    }

    console.log('🏁 Teste concluído');
    // Browser permanece aberto

})();
