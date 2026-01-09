const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste: Buscar lead SEM proposta e gerar nova...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    // Captura APIs de proposals
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals') && !url.includes('track')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
            if (method === 'POST' && url.includes('generate')) {
                console.log('   🎯 GERAÇÃO DETECTADA!');
            }
        }
    });

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

        // 3. Busca lead SEM proposta existente
        console.log('📍 Buscando lead sem proposta...');

        let foundNewLead = false;
        let proposalUrl = null;

        // Tenta vários leads até encontrar um sem proposta
        for (let cardIndex = 50; cardIndex < 100 && !foundNewLead; cardIndex += 5) {
            console.log('📍 Tentando lead #' + cardIndex + '...');

            // Clica no lead
            await page.evaluate((idx) => {
                const cards = document.querySelectorAll('.deal-card');
                if (cards[idx]) cards[idx].click();
            }, cardIndex);
            await new Promise(r => setTimeout(r, 2000));

            // Clica em Gerar Proposta
            await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const b of btns) {
                    if (b.textContent.includes('Gerar Proposta')) {
                        b.click();
                        break;
                    }
                }
            });
            await new Promise(r => setTimeout(r, 2000));

            // Verifica se tem "Ver Proposta" (já existe) ou apenas "Gerar Proposta" (nova)
            const modalInfo = await page.evaluate(() => {
                const hasVerProposta = Array.from(document.querySelectorAll('button, a'))
                    .some(b => b.textContent.includes('Ver Proposta'));
                const hasCopiar = Array.from(document.querySelectorAll('button'))
                    .some(b => b.textContent.includes('Copiar'));
                const hasGerarVerde = Array.from(document.querySelectorAll('button'))
                    .filter(b => b.textContent.includes('Gerar Proposta'))
                    .length;

                return { hasVerProposta, hasCopiar, hasGerarVerde };
            });

            console.log('🔍 Modal info:', modalInfo);

            if (!modalInfo.hasVerProposta && !modalInfo.hasCopiar) {
                console.log('✅ Encontrou lead SEM proposta!');
                foundNewLead = true;

                // Faz screenshot do formulário
                await page.screenshot({ path: '/tmp/newlead-1-form.png', fullPage: true });
                console.log('📸 /tmp/newlead-1-form.png');

                // Preenche o select se necessário
                await page.evaluate(() => {
                    document.querySelectorAll('select').forEach(s => {
                        if (s.options.length > 1) {
                            s.selectedIndex = 1;
                            s.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                });
                await new Promise(r => setTimeout(r, 500));

                // Clica em Gerar Proposta (botão verde)
                console.log('📍 Gerando proposta...');
                await page.evaluate(() => {
                    const btns = document.querySelectorAll('button');
                    for (const b of btns) {
                        if (b.textContent.includes('Gerar Proposta') && !b.disabled) {
                            b.click();
                            break;
                        }
                    }
                });

                await page.screenshot({ path: '/tmp/newlead-2-generating.png', fullPage: true });

                // Aguarda geração (até 3 minutos)
                console.log('⏳ Aguardando geração (até 3 min)...');
                for (let i = 0; i < 36; i++) {
                    await new Promise(r => setTimeout(r, 5000));
                    console.log('   ' + ((i+1)*5) + 's...');

                    proposalUrl = await page.evaluate(() => {
                        const links = document.querySelectorAll('a');
                        for (const l of links) {
                            if (l.href && l.href.includes('propostas.monofloor.cloud/p/')) {
                                return l.href;
                            }
                        }
                        const inputs = document.querySelectorAll('input');
                        for (const i of inputs) {
                            if (i.value && i.value.includes('propostas.monofloor.cloud')) {
                                return i.value;
                            }
                        }
                        return null;
                    });

                    if (proposalUrl) {
                        console.log('✅ PROPOSTA GERADA: ' + proposalUrl);
                        break;
                    }
                }

                await page.screenshot({ path: '/tmp/newlead-3-result.png', fullPage: true });
                console.log('📸 /tmp/newlead-3-result.png');

            } else {
                // Lead já tem proposta, fecha e tenta próximo
                await page.evaluate(() => {
                    const closeBtn = document.querySelector('button:has-text("Fechar"), [aria-label="close"], .close-button');
                    if (closeBtn) closeBtn.click();
                    // Fallback: clica fora do modal
                    document.body.click();
                });
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // 4. Se encontrou proposta, abre e verifica
        if (proposalUrl) {
            console.log('📍 Abrindo proposta gerada...');
            await page.goto(proposalUrl, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 5000));

            await page.screenshot({ path: '/tmp/newlead-4-proposal.png', fullPage: false });
            console.log('📸 /tmp/newlead-4-proposal.png');

            // Scroll para página de pagamento
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.95));
            await new Promise(r => setTimeout(r, 2000));

            await page.screenshot({ path: '/tmp/newlead-5-payment.png', fullPage: false });
            console.log('📸 /tmp/newlead-5-payment.png');

            console.log('✅ Proposta gerada e capturada! Verifique /tmp/newlead-*.png');
        } else if (!foundNewLead) {
            console.log('⚠️ Não encontrou lead sem proposta nos índices testados');
        } else {
            console.log('⚠️ Lead encontrado mas proposta não foi gerada');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/newlead-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');
})();
