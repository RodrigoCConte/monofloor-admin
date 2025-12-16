# 🗺️ Como Configurar Google Maps API (Autocomplete de Endereço)

## ⚡ Passo a Passo (5 minutos)

### 1️⃣ Criar uma Chave de API (GRATUITO)

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Crie um novo projeto (ou selecione um existente)
   - Nome sugerido: "Monofloor Propostas"

### 2️⃣ Ativar a API Places

1. No menu lateral, vá em: **APIs e Serviços** → **Biblioteca**
2. Procure por: **"Places API"**
3. Clique em **ATIVAR**

### 3️⃣ Criar Credenciais

1. No menu lateral, vá em: **APIs e Serviços** → **Credenciais**
2. Clique em: **+ CRIAR CREDENCIAIS** → **Chave de API**
3. Copie a chave gerada (algo como: `AIzaSy...`)

### 4️⃣ Configurar no Projeto

1. Abra o arquivo: `monofloor-admin/public/propostas.html`
2. Procure pela linha **~1308** (busque por `YOUR_API_KEY`)
3. Substitua:
   ```javascript
   var apiKey = 'YOUR_API_KEY';
   ```

   Por:
   ```javascript
   var apiKey = 'SUA_CHAVE_AQUI';  // Cole a chave que você copiou
   ```

4. Salve o arquivo
5. Recarregue a página no navegador (Ctrl+R ou Cmd+R)

---

## ✅ Como Testar

1. Abra: http://localhost:1111
2. No campo **"Endereço"**, comece a digitar: "Avenida Paulista"
3. Deve aparecer um dropdown com sugestões de endereços
4. No console (F12) deve aparecer: `✅ Google Maps Autocomplete inicializado com sucesso!`

---

## 💰 Custos

- ✅ **GRATUITO** até 200 requisições por dia
- ✅ Google oferece **$200 de crédito mensal gratuito**
- ✅ Para uma ferramenta de propostas, provavelmente sempre será gratuito

---

## ⚠️ Limitar a Chave (Recomendado)

Para segurança, limite a chave de API:

1. Em **Credenciais**, clique na chave criada
2. Em **Restrições de aplicativo**, selecione: **Referenciadores HTTP (sites)**
3. Adicione: `http://localhost:1111/*` e `http://localhost:*/*`
4. Em **Restrições de API**, selecione: **Restringir chave**
5. Escolha apenas: **Places API**
6. Clique em **SALVAR**

---

## 🚨 Se Não Quiser Configurar Agora

Sem problemas! O campo de endereço funciona normalmente sem autocomplete.
O usuário pode digitar o endereço completo manualmente.

A página **não trava** sem a API configurada - apenas perde o autocomplete.

---

## 📖 Links Úteis

- Console Google Cloud: https://console.cloud.google.com/
- Documentação Places API: https://developers.google.com/maps/documentation/places/web-service
- Preços: https://mapsplatform.google.com/pricing/
