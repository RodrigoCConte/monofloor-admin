const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Iniciando teste completo de geração de proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Captura erros
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ CONSOLE ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('❌ PAGE ERROR:', error.message);
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url + ' -> ' + status);
        }
    });

    try {
        // 1. Login
        console.log('📍 Step 1: Acessando login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        console.log('📍 Step 2: Preenchendo credenciais...');
        await page.type('input[type="email"], input[placeholder*="email"]', 'rodrigo@monofloor.com.br', { delay: 30 });
        await page.type('input[type="password"], input[placeholder*="senha"]', 'mono2025', { delay: 30 });

        await page.screenshot({ path: '/tmp/flow-1-login-filled.png' });
        console.log('📸 Screenshot: /tmp/flow-1-login-filled.png');

        console.log('📍 Step 3: Clicando em ENTRAR...');
        await page.click('button[type="submit"], button:has-text("ENTRAR")');

        // Aguarda navegação após login
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ URL após login:', page.url());

        await page.screenshot({ path: '/tmp/flow-2-after-login.png' });
        console.log('📸 Screenshot: /tmp/flow-2-after-login.png');

        // 2. Navegar para CRM/Kanban
        console.log('📍 Step 4: Indo para o CRM...');
        await page.goto('https://comercial.monofloor.cloud/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: '/tmp/flow-3-crm.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow-3-crm.png');
        console.log('✅ URL CRM:', page.url());

        // 3. Verificar elementos na página
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                hasKanban: !!document.querySelector('[class*="kanban"], [class*="pipeline"], [class*="stage"]'),
                buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).slice(0, 10),
                links: Array.from(document.querySelectorAll('a[href]')).map(a => ({ text: a.textContent.trim(), href: a.href })).slice(0, 10)
            };
        });
        console.log('📄 Conteúdo da página:', JSON.stringify(pageContent, null, 2));

        // 4. Procurar card de lead para gerar proposta
        console.log('📍 Step 5: Buscando lead para gerar proposta...');

        // Clica no primeiro card do kanban
        const cardClicked = await page.evaluate(() => {
            // Procura cards no kanban
            const cards = document.querySelectorAll('[class*="card"], [class*="deal"], [class*="lead"], .pipeline-item, .kanban-item');
            if (cards.length > 0) {
                cards[0].click();
                return 'Clicou no primeiro card';
            }

            // Alternativa: procura qualquer elemento clicável que pareça um lead
            const clickables = document.querySelectorAll('[draggable="true"], [data-id]');
            if (clickables.length > 0) {
                clickables[0].click();
                return 'Clicou em elemento draggable';
            }

            return null;
        });
        console.log('🔍 Resultado:', cardClicked);
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: '/tmp/flow-4-after-card-click.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow-4-after-card-click.png');

        // 5. Procurar botão de gerar proposta no modal/sidebar
        console.log('📍 Step 6: Buscando botão Gerar Proposta...');

        const generateBtnText = await page.evaluate(() => {
            const allElements = document.querySelectorAll('button, a, [role="button"]');
            for (const el of allElements) {
                const text = el.textContent.toLowerCase();
                if (text.includes('gerar') && (text.includes('proposta') || text.includes('pdf'))) {
                    el.click();
                    return el.textContent.trim();
                }
            }
            return null;
        });

        if (generateBtnText) {
            console.log('✅ Clicou em:', generateBtnText);
            await new Promise(r => setTimeout(r, 3000));
            await page.screenshot({ path: '/tmp/flow-5-generate-clicked.png', fullPage: true });
        } else {
            console.log('⚠️ Botão de gerar proposta não encontrado');
        }

        // 6. Preencher modal de geração (se houver)
        console.log('📍 Step 7: Verificando modal de geração...');
        await new Promise(r => setTimeout(r, 2000));

        const modalInputs = await page.evaluate(() => {
            const modal = document.querySelector('[class*="modal"], [class*="dialog"], [class*="drawer"]');
            if (modal) {
                return Array.from(modal.querySelectorAll('input')).map(i => ({
                    name: i.name,
                    placeholder: i.placeholder,
                    value: i.value
                }));
            }
            return [];
        });
        console.log('🔍 Inputs no modal:', JSON.stringify(modalInputs, null, 2));

        await page.screenshot({ path: '/tmp/flow-6-modal.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow-6-modal.png');

        // 7. Aguardar geração
        console.log('⏳ Aguardando geração (30s)...');
        await new Promise(r => setTimeout(r, 30000));

        await page.screenshot({ path: '/tmp/flow-7-final.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow-7-final.png');
        console.log('✅ URL final:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/flow-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído. Browser permanece aberto.');

})();
