# ARQUITETURA DE SISTEMAS MONOFLOOR

> **LEIA ESTE DOCUMENTO ANTES DE FAZER QUALQUER ALTERACAO**
> Este documento define a separacao entre os sistemas da Monofloor.
> Cada sistema eh tratado como INDEPENDENTE em termos de deploy.

---

## VISAO GERAL DA INFRAESTRUTURA

**IMPORTANTE:** Todos os sistemas estao hospedados no **VPS Hostinger** (72.61.56.150)

```
VPS 72.61.56.150
├── /var/www/comercial.monofloor.cloud/  <- CRM Comercial
├── /var/www/admin.monofloor.cloud/      <- Admin Panel
├── /var/www/app.monofloor.cloud/        <- App Mobile
├── /var/www/vt.monofloor.cloud/         <- Video Processor
├── /var/www/propostas.monofloor.cloud/  <- Propostas
└── /var/www/monofloor-admin/            <- Backend API
```

---

## SISTEMAS E SEUS DOMINIOS

### 1. CRM COMERCIAL
| Item | Valor |
|------|-------|
| **URL Producao** | `comercial.monofloor.cloud` |
| **Descricao** | Sistema de CRM para o time comercial |
| **Funcao** | Pipeline Pipedrive, gestao de leads, propostas |
| **Hospedagem** | VPS (72.61.56.150) |
| **Pasta no VPS** | `/var/www/comercial.monofloor.cloud/` |
| **Codigo Fonte** | `/Users/rodrigoconte/Primeiro projeto/monofloor-admin/admin-panel/` |
| **View Principal** | `src/views/Comercial.vue` |
| **Componentes** | `src/components/crm/` |
| **Banco de Dados** | PostgreSQL Railway (compartilhado) |

**ATENCAO:** O CRM usa o MESMO codigo fonte do Admin Panel, mas eh deployado separadamente!
- Componentes especificos: `PipelineBoard.vue`, `DealCard.vue`, `PipelineColumn.vue`
- Rota: `/comercial`

**O QUE MEXER AQUI:**
- View `Comercial.vue`
- Componentes em `src/components/crm/`
- Funcionalidades de vendas e pipeline
- Integracao com Pipedrive

**NAO CONFUNDIR COM:** Views do Admin Panel (Applicators, Projects, Map, etc.)

---

### 2. ADMIN PANEL (Painel Administrativo do APP)
| Item | Valor |
|------|-------|
| **URL Producao** | `admin.monofloor.cloud` |
| **Descricao** | Painel administrativo para gerenciar o APP de equipes |
| **Funcao** | Controle de aplicadores, projetos, campanhas, badges, localizacao |
| **Hospedagem** | VPS (72.61.56.150) |
| **Pasta no VPS** | `/var/www/admin.monofloor.cloud/` |
| **Codigo Fonte** | `/Users/rodrigoconte/Primeiro projeto/monofloor-admin/admin-panel/` |
| **Backend** | `/Users/rodrigoconte/Primeiro projeto/monofloor-admin/src/` |
| **Banco de Dados** | PostgreSQL no Railway |

**ATENCAO:** Compartilha codigo fonte com CRM, mas tem views diferentes!
- Views especificas: `Dashboard.vue`, `Applicators.vue`, `Projects.vue`, `Map.vue`, `Campaigns.vue`, etc.

**O QUE MEXER AQUI:**
- Views em `src/views/` (EXCETO Comercial.vue)
- Aprovacao de aplicadores
- Gestao de projetos (equipes de obra)
- Campanhas e gamificacao
- Mapa de localizacao
- Relatorios de obras

**NAO CONFUNDIR COM:** CRM Comercial (Comercial.vue e componentes crm/)

---

### 3. APP MOBILE (Aplicativo dos Aplicadores)
| Item | Valor |
|------|-------|
| **URL Producao** | `app.monofloor.cloud` |
| **Descricao** | Aplicativo PWA para os aplicadores de piso |
| **Funcao** | Check-in/out, relatorios de obra, gamificacao, localizacao |
| **Hospedagem** | VPS (72.61.56.150) |
| **Pasta no VPS** | `/var/www/app.monofloor.cloud/` |
| **Codigo Fonte** | `/Users/rodrigoconte/Primeiro projeto/monofloor-app/` |
| **Arquivos Principais** | `index.html`, `app.js`, `styles.css`, `sw.js` |
| **Banco de Dados** | PostgreSQL no Railway (via Backend API) |

**CODIGO SEPARADO** - Este eh um projeto diferente do Admin Panel!

**O QUE MEXER AQUI:**
- `app.js` - Logica do aplicativo
- `styles.css` - Estilos
- `index.html` - Estrutura HTML
- Check-in/checkout
- Relatorios de obra (audio, fotos)
- Feed social
- Campanhas (visualizacao)

**NAO CONFUNDIR COM:** Admin Panel ou CRM (Vue.js) - O App eh HTML/JS puro!

---

### 4. PROCESSADOR DE VIDEOS (Video Reports)
| Item | Valor |
|------|-------|
| **URL Producao** | `vt.monofloor.cloud` |
| **Descricao** | Plataforma para processar videos e gerar relatorios |
| **Funcao** | Upload de videos, extracao de frames, geracao de relatorios DOCX/PDF |
| **Hospedagem** | VPS (72.61.56.150) |
| **Pasta no VPS** | `/var/www/vt.monofloor.cloud/` |
| **Codigo Fonte** | `/Users/rodrigoconte/Primeiro projeto/public-video-processor/` |
| **Banco de Dados** | Nenhum (processa arquivos localmente) |

**SISTEMA COMPLETAMENTE INDEPENDENTE**

**O QUE MEXER AQUI:**
- Interface de upload de videos
- Processamento de videos
- Geracao de relatorios
- Extracao de frames

**NAO CONFUNDIR COM:** Qualquer outro sistema

---

### 5. BACKEND API
| Item | Valor |
|------|-------|
| **URL Producao** | `https://devoted-wholeness-production.up.railway.app` |
| **Descricao** | API Node.js/Express que serve todos os frontends |
| **Hospedagem** | Railway + VPS (backup em /var/www/monofloor-admin/) |
| **Codigo Fonte** | `/Users/rodrigoconte/Primeiro projeto/monofloor-admin/src/` |
| **Banco de Dados** | PostgreSQL no Railway |

**IMPORTANTE:** Esta API serve TODOS os sistemas (CRM, Admin, App)

**O QUE MEXER AQUI:**
- Routes em `src/routes/`
- Services em `src/services/`
- Middleware em `src/middleware/`
- Schema Prisma em `prisma/schema.prisma`

---

### 6. PROPOSTAS
| Item | Valor |
|------|-------|
| **URL Producao** | `propostas.monofloor.cloud` |
| **Hospedagem** | VPS (72.61.56.150) |
| **Pasta no VPS** | `/var/www/propostas.monofloor.cloud/` |
| **Funcao** | Gerar e exibir propostas comerciais

---

## REGRAS DE OURO

### 1. ISOLAMENTO TOTAL
Cada sistema eh INDEPENDENTE:
- Codigo separado
- Deploy separado
- Banco de dados separado (exceto App + Admin que compartilham)
- Dominios separados

### 2. ANTES DE QUALQUER MUDANCA
Pergunte-se:
1. Em qual sistema estou trabalhando?
2. Qual eh o dominio correto?
3. Qual eh a pasta correta?
4. Estou no branch correto?

### 3. NUNCA MISTURAR
- NAO copie codigo de um sistema para outro sem autorizacao
- NAO use variaveis de ambiente de um sistema em outro
- NAO faca deploy de um sistema no dominio de outro
- NAO altere banco de dados de um sistema achando que eh outro

### 4. VERIFICACAO POS-DEPLOY
Apos qualquer deploy, verifique:
- [ ] O dominio correto esta funcionando?
- [ ] O outro sistema NAO foi afetado?
- [ ] Os dados estao corretos?

---

## INFRAESTRUTURA

### VPS Hostinger (72.61.56.150)
**TODOS OS FRONTENDS ESTAO NO VPS!**

| Dominio | Pasta no VPS |
|---------|--------------|
| comercial.monofloor.cloud | /var/www/comercial.monofloor.cloud/ |
| admin.monofloor.cloud | /var/www/admin.monofloor.cloud/ |
| app.monofloor.cloud | /var/www/app.monofloor.cloud/ |
| vt.monofloor.cloud | /var/www/vt.monofloor.cloud/ |
| propostas.monofloor.cloud | /var/www/propostas.monofloor.cloud/ |

**Acesso SSH:**
```
Host: 72.61.56.150
User: root
Senha: qS4wv19mLrB;c@rOGeX,
```

### Railway (Cloud)
- **Backend API**: `devoted-wholeness-production.up.railway.app`
- **PostgreSQL**: Banco de dados principal

### DNS (Todos apontam para VPS)
- `comercial.monofloor.cloud` -> 72.61.56.150
- `admin.monofloor.cloud` -> 72.61.56.150
- `app.monofloor.cloud` -> 72.61.56.150
- `vt.monofloor.cloud` -> 72.61.56.150
- `propostas.monofloor.cloud` -> 72.61.56.150

---

## COMO FAZER DEPLOY

### Deploy do CRM Comercial (comercial.monofloor.cloud)
```bash
# 1. Build local
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-admin/admin-panel"
npm run build

# 2. Copiar para VPS
scp -r dist/* root@72.61.56.150:/var/www/comercial.monofloor.cloud/
```

### Deploy do Admin Panel (admin.monofloor.cloud)
```bash
# 1. Build local
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-admin/admin-panel"
npm run build

# 2. Copiar para VPS
scp -r dist/* root@72.61.56.150:/var/www/admin.monofloor.cloud/
```

### Deploy do App Mobile (app.monofloor.cloud)
```bash
# 1. Copiar arquivos diretamente (nao precisa build)
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-app"
scp index.html app.js styles.css sw.js root@72.61.56.150:/var/www/app.monofloor.cloud/
```

### Deploy do Video Processor (vt.monofloor.cloud)
```bash
cd "/Users/rodrigoconte/Primeiro projeto/public-video-processor"
scp -r * root@72.61.56.150:/var/www/vt.monofloor.cloud/
```

### Deploy do Backend API (Railway)
```bash
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-admin"
git add . && git commit -m "deploy" && git push
# Railway faz deploy automatico via GitHub
```

---

## CHECKLIST PARA AGENTES

Antes de executar qualquer comando:

```
[ ] Li o documento ARQUITETURA-SISTEMAS.md
[ ] Identifiquei qual sistema vou alterar
[ ] Estou na pasta correta
[ ] Vou fazer deploy no dominio correto
[ ] Vou registrar as mudancas no CHANGELOG.md
```

---

## CONTATO E DUVIDAS

Se houver qualquer duvida sobre qual sistema alterar:
**PERGUNTE AO USUARIO ANTES DE FAZER QUALQUER COISA**

Nunca assuma. Sempre confirme.
