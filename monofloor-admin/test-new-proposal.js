const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste de NOVA proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);
    page.setDefaultTimeout(60000);

    // Captura TODAS as APIs de proposals
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);

            // Se for POST de geração, mostra detalhes
            if (method === 'POST' && url.includes('generate')) {
                console.log('   🎯 GERAÇÃO DE PROPOSTA DETECTADA!');
                try {
                    const body = await response.text();
                    console.log('   📦 Resposta:', body.substring(0, 300));
                } catch(e) {}
            }
        }
    });

    try {
        // 1. Login
        console.log('📍 Login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', 'amanda@monofloor.com.br', { delay: 20 });
        await page.type('input[type="password"]', 'senha123', { delay: 20 });
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ Login OK');

        // 2. Aguarda pipeline carregar
        console.log('📍 Aguardando pipeline...');
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const pageText = await page.evaluate(() => document.body.innerText);
            if (!pageText.includes('Carregando')) {
                console.log('✅ Pipeline carregado');
                break;
            }
        }
        await new Promise(r => setTimeout(r, 2000));

        // 3. Busca um lead que NÃO tenha proposta (evita os primeiros que provavelmente já têm)
        console.log('📍 Buscando lead SEM proposta existente...');

        // Pega um lead de uma coluna mais à direita ou um lead mais novo
        const selectedLead = await page.evaluate(() => {
            const cards = document.querySelectorAll('.deal-card');
            // Tenta pegar um card com ID diferente para garantir que seja novo
            for (let i = Math.min(10, cards.length - 1); i < cards.length && i < 50; i++) {
                const card = cards[i];
                if (card && card.textContent.length > 20) {
                    card.click();
                    return card.textContent.substring(0, 60);
                }
            }
            // Fallback: pega o segundo card
            if (cards.length > 1) {
                cards[1].click();
                return cards[1].textContent.substring(0, 60);
            }
            return null;
        });

        console.log('🔍 Lead selecionado:', selectedLead);
        await new Promise(r => setTimeout(r, 3000));

        // 4. Clica em "Gerar Proposta"
        console.log('📍 Clicando em Gerar Proposta...');
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a');
            for (const btn of buttons) {
                if (btn.textContent.toLowerCase().includes('gerar') &&
                    btn.textContent.toLowerCase().includes('proposta')) {
                    btn.click();
                    return;
                }
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: '/tmp/new-1-modal.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/new-1-modal.png');

        // 5. Verifica se aparece formulário de nova proposta ou se já tem proposta
        const modalContent = await page.evaluate(() => {
            const modal = document.querySelector('[class*="modal"], [class*="dialog"], .drawer');
            if (modal) {
                return {
                    hasForm: !!modal.querySelector('input, select'),
                    buttons: Array.from(modal.querySelectorAll('button')).map(b => b.textContent.trim()),
                    text: modal.innerText.substring(0, 500)
                };
            }
            return null;
        });
        console.log('🔍 Modal:', JSON.stringify(modalContent, null, 2));

        // 6. Preenche campos se necessário e clica em gerar
        console.log('📍 Preenchendo e gerando...');

        // Verifica se precisa preencher área/valor
        const areaInput = await page.$('input[name*="area"], input[placeholder*="área"], input[placeholder*="m²"]');
        if (areaInput) {
            await areaInput.click({ clickCount: 3 });
            await areaInput.type('120');
            console.log('✅ Área preenchida: 120');
        }

        const valueInput = await page.$('input[name*="valor"], input[name*="price"], input[placeholder*="valor"]');
        if (valueInput) {
            await valueInput.click({ clickCount: 3 });
            await valueInput.type('350');
            console.log('✅ Valor preenchido: 350');
        }

        await new Promise(r => setTimeout(r, 1000));

        // Clica no botão de gerar (último botão verde ou com texto "gerar")
        const generateClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            // Procura botão verde de gerar
            for (const btn of buttons) {
                const text = btn.textContent.toLowerCase();
                const isGreen = btn.classList.contains('bg-green') ||
                               btn.style.backgroundColor.includes('green') ||
                               getComputedStyle(btn).backgroundColor.includes('34');

                if ((text.includes('gerar') && !btn.disabled) || isGreen) {
                    btn.click();
                    return btn.textContent.trim();
                }
            }
            return null;
        });

        console.log('🔍 Botão clicado:', generateClicked);

        // 7. Aguarda geração com monitoramento
        console.log('⏳ Aguardando geração da proposta...');

        let proposalUrl = null;
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 3000));
            console.log('   ' + ((i+1) * 3) + 's...');

            // Verifica se há link de proposta
            proposalUrl = await page.evaluate(() => {
                // Procura link de proposta
                const links = document.querySelectorAll('a[href*="proposta"], a[href*="Proposta"]');
                for (const l of links) {
                    if (l.href && l.href.includes('propostas.monofloor.cloud')) {
                        return l.href;
                    }
                }

                // Procura texto com URL de proposta
                const text = document.body.innerText;
                const match = text.match(/propostas\.monofloor\.cloud\/p\/[^\s]+/);
                if (match) {
                    return 'https://' + match[0];
                }

                return null;
            });

            if (proposalUrl) {
                console.log('✅ PROPOSTA GERADA:', proposalUrl);
                break;
            }
        }

        await page.screenshot({ path: '/tmp/new-2-result.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/new-2-result.png');

        // 8. Se tiver URL, abre a proposta para verificar
        if (proposalUrl) {
            console.log('📍 Abrindo proposta para verificar...');
            await page.goto(proposalUrl, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 5000));

            await page.screenshot({ path: '/tmp/new-3-proposal.png', fullPage: true });
            console.log('📸 Screenshot da proposta: /tmp/new-3-proposal.png');

            // Navega para página 24 (onde fica o logo)
            console.log('📍 Navegando para página 24...');
            await page.evaluate(() => {
                // Scroll para página 24
                const pages = document.querySelectorAll('[class*="page"], .slide');
                if (pages.length >= 24) {
                    pages[23].scrollIntoView();
                }
            });
            await new Promise(r => setTimeout(r, 2000));

            await page.screenshot({ path: '/tmp/new-4-page24.png', fullPage: true });
            console.log('📸 Screenshot página 24: /tmp/new-4-page24.png');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/new-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');

})();
