const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste de visualização de proposta existente...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    try {
        // 1. Login
        console.log('📍 Login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'amanda@monofloor.com.br');
        await page.type('input[type="password"]', 'senha123');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ Login OK');

        // 2. Aguarda pipeline
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const hasCards = await page.evaluate(() => document.querySelectorAll('.deal-card').length);
            if (hasCards > 0) {
                console.log('✅ Pipeline carregado com ' + hasCards + ' cards');
                break;
            }
        }

        // 3. Clica em um lead
        console.log('📍 Selecionando lead...');
        await page.evaluate(() => {
            const cards = document.querySelectorAll('.deal-card');
            if (cards[0]) cards[0].click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // 4. Clica em Gerar Proposta para abrir o modal
        console.log('📍 Abrindo modal de proposta...');
        await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const b of btns) {
                if (b.textContent.includes('Gerar Proposta')) {
                    b.click();
                    break;
                }
            }
        });
        await new Promise(r => setTimeout(r, 3000));

        // 5. Busca URL da proposta
        console.log('📍 Buscando URL da proposta...');
        const proposalUrl = await page.evaluate(() => {
            // Procura em inputs
            const inputs = document.querySelectorAll('input');
            for (const i of inputs) {
                if (i.value && i.value.includes('propostas.monofloor.cloud')) {
                    return i.value;
                }
            }
            // Procura em links
            const links = document.querySelectorAll('a');
            for (const l of links) {
                if (l.href && l.href.includes('propostas.monofloor.cloud/p/')) {
                    return l.href;
                }
            }
            // Procura no texto
            const text = document.body.innerText;
            const match = text.match(/(https?:\/\/propostas\.monofloor\.cloud\/p\/[^\s]+)/);
            if (match) return match[1];

            return null;
        });

        if (!proposalUrl) {
            // Tenta clicar em "Ver Proposta"
            console.log('📍 Clicando em Ver Proposta...');
            const clicked = await page.evaluate(() => {
                const btns = document.querySelectorAll('button, a');
                for (const b of btns) {
                    if (b.textContent.includes('Ver Proposta')) {
                        if (b.href) return b.href;
                        b.click();
                        return 'clicked';
                    }
                }
                return null;
            });
            console.log('🔍 Resultado:', clicked);

            if (clicked && clicked !== 'clicked') {
                // Era um link, navega direto
                await page.goto(clicked, { waitUntil: 'networkidle2' });
            } else {
                // Aguarda nova página abrir ou modal mudar
                await new Promise(r => setTimeout(r, 5000));
            }
        } else {
            console.log('✅ URL encontrada:', proposalUrl);
            await page.goto(proposalUrl, { waitUntil: 'networkidle2' });
        }

        // 6. Aguarda proposta carregar
        console.log('📍 Aguardando proposta carregar...');
        await new Promise(r => setTimeout(r, 5000));

        const currentUrl = page.url();
        console.log('📍 URL atual:', currentUrl);

        if (currentUrl.includes('propostas.monofloor.cloud')) {
            console.log('✅ Proposta aberta!');

            await page.screenshot({ path: '/tmp/view-1-proposal.png', fullPage: true });
            console.log('📸 /tmp/view-1-proposal.png');

            // 7. Scroll para páginas finais (24, 25, 26)
            console.log('📍 Scrollando para páginas finais...');

            // Pega altura da página
            const pageHeight = await page.evaluate(() => document.body.scrollHeight);
            console.log('📄 Altura total:', pageHeight);

            // Scroll para ~85% (páginas 24-26 de ~27)
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight * 0.85);
            });
            await new Promise(r => setTimeout(r, 2000));

            await page.screenshot({ path: '/tmp/view-2-page24.png', fullPage: false });
            console.log('📸 /tmp/view-2-page24.png');

            // Scroll mais para baixo
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight * 0.92);
            });
            await new Promise(r => setTimeout(r, 2000));

            await page.screenshot({ path: '/tmp/view-3-page25.png', fullPage: false });
            console.log('📸 /tmp/view-3-page25.png');

            // Final
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(r => setTimeout(r, 2000));

            await page.screenshot({ path: '/tmp/view-4-page26.png', fullPage: false });
            console.log('📸 /tmp/view-4-page26.png');

            console.log('✅ Screenshots das páginas finais capturados!');
        } else {
            console.log('⚠️ Não conseguiu abrir proposta. URL:', currentUrl);
            await page.screenshot({ path: '/tmp/view-error.png', fullPage: true });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/view-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');
})();
