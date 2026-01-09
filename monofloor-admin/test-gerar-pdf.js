const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"], defaultViewport: null });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log("1. Acessando comercial...");
  await page.goto("https://comercial.monofloor.cloud/comercial", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));

  // Verificar se precisa login
  const needsLogin = await page.evaluate(() => {
    return document.querySelector('input[type="email"]') !== null;
  });

  if (needsLogin) {
    console.log("2. Fazendo login...");
    await page.type('input[type="email"]', "amanda@monofloor.com.br");
    await page.type('input[type="password"]', "senha123");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log("3. Clicando em um contato...");
  await new Promise(r => setTimeout(r, 3000));

  // Clicar no primeiro card
  await page.evaluate(() => {
    const cards = document.querySelectorAll(".deal-card, [class*='deal-card']");
    if (cards.length > 0) cards[0].click();
  });

  await new Promise(r => setTimeout(r, 3000));
  console.log("4. Modal aberto");

  // Clicar em "Gerar Proposta" (abre nova aba)
  console.log("5. Clicando em Gerar Proposta (abre nova aba)...");

  // Capturar nova aba
  const newPagePromise = new Promise(resolve => {
    browser.once('targetcreated', async target => {
      const newPage = await target.page();
      resolve(newPage);
    });
  });

  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const btn of btns) {
      if (btn.textContent.includes("Gerar Proposta") && !btn.textContent.includes("HTML")) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  const propostaPage = await newPagePromise;
  console.log("6. Nova aba aberta:", await propostaPage.url());

  await new Promise(r => setTimeout(r, 3000));

  // Clicar no botao de gerar PDF
  console.log("7. Clicando em Gerar Proposta em PDF...");

  // Configurar para interceptar downloads
  const downloadPath = "/tmp";
  const client = await propostaPage.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  await propostaPage.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const btn of btns) {
      if (btn.textContent.includes("Gerar Proposta em PDF")) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  console.log("8. Aguardando geracao do PDF...");
  await new Promise(r => setTimeout(r, 30000));

  // Tirar screenshot do resultado
  await propostaPage.screenshot({ path: "/tmp/proposta-gerada.png" });
  console.log("9. Screenshot salvo em /tmp/proposta-gerada.png");

  // Verificar logs no console
  console.log("10. Mantendo navegador aberto para baixar PDF manualmente...");
  console.log("    Use o botao 'Baixar PDF' na interface");

  await new Promise(r => setTimeout(r, 60000));

  await browser.close();
})();
