const puppeteer = require("puppeteer");

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
  await page.screenshot({ path: "/tmp/step1-modal.png" });
  console.log("4. Modal aberto - screenshot salvo");

  // Clicar em Gerar Proposta
  console.log("5. Clicando em Gerar Proposta...");
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const btn of btns) {
      if (btn.textContent.includes("Gerar Proposta")) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: "/tmp/step2-after-gerar.png" });
  console.log("6. Após Gerar Proposta - screenshot salvo");

  // Procurar botão HTML
  console.log("7. Procurando botão HTML...");
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button")).map(b => b.textContent.trim());
  });
  console.log("Botões encontrados:", buttons.filter(b => b.includes("HTML") || b.includes("Gerar") || b.includes("Link")));

  // Clicar em Gerar Link HTML ou similar
  const clicked = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const btn of btns) {
      const text = btn.textContent;
      if (text.includes("HTML") || text.includes("Link")) {
        btn.click();
        return text;
      }
    }
    return null;
  });
  console.log("Clicou em:", clicked);

  console.log("8. Aguardando geração...");
  await new Promise(r => setTimeout(r, 20000));
  await page.screenshot({ path: "/tmp/step3-final.png" });
  console.log("9. Screenshot final salvo");

  console.log("Mantendo aberto por 2 minutos...");
  await new Promise(r => setTimeout(r, 120000));

  await browser.close();
})();
