# CHANGELOG - Registro de Alteracoes

> Este arquivo registra TODAS as alteracoes feitas nos sistemas Monofloor.
> Cada agente/sessao DEVE adicionar entradas aqui apos fazer mudancas.

---

## Formato de Entrada

```
## [DATA] - [SISTEMA] - [TIPO]
**Agente/Sessao:** ID ou descricao
**Arquivos Alterados:**
- arquivo1.ts (descricao da mudanca)
- arquivo2.vue (descricao da mudanca)

**Resumo:**
Descricao do que foi feito e por que.

**Status:** Completo | Em Progresso | Pendente
**Deploy:** Sim/Nao - Dominio afetado
**Proximos Passos:** (se houver)
---
```

---

## HISTORICO DE ALTERACOES

---

## [2026-01-07] - INFRAESTRUTURA - Correcao Deploy Admin e App
**Agente/Sessao:** Claude Code
**Arquivos/Configuracoes Alterados:**
- Criado container Docker `admin-monofloor` (nginx:alpine)
- Criado container Docker `app-monofloor` (nginx:alpine)
- Configuracao Traefik via labels para roteamento HTTPS

**Resumo:**
Descoberta importante: O VPS 72.61.56.150 usa **Coolify + Traefik** como reverse proxy.
Anteriormente os sites admin e app estavam caindo no catch-all do Traefik (video processor).

Solucao implementada:
- Criados containers Docker com nginx:alpine para admin e app
- Volumes montados para /var/www/[dominio]
- Labels Traefik configuradas para:
  - Roteamento HTTP->HTTPS automatico
  - Certificados Let's Encrypt automaticos
  - Roteamento correto para cada dominio

**Status:** Completo
**Deploy:** Sim
- https://admin.monofloor.cloud (HTTP 200 OK - Admin Panel Vue.js)
- https://app.monofloor.cloud (HTTP 200 OK - App Mobile)

**Containers criados:**
```bash
docker ps --filter name=monofloor
# admin-monofloor, app-monofloor, vt-monofloor
```

---

## [2025-01-07] - DEPLOY - Admin Panel e App Mobile
**Agente/Sessao:** Claude Code
**Arquivos Deployados:**
- Admin Panel (build Vue.js) -> admin.monofloor.cloud
- App Mobile (HTML/JS/CSS) -> app.monofloor.cloud

**Resumo:**
Deploy realizado para o VPS 72.61.56.150:
- Admin Panel: /var/www/admin.monofloor.cloud/
- App Mobile: /var/www/app.monofloor.cloud/

**Status:** Completo
**Deploy:** Sim
- https://admin.monofloor.cloud (HTTP 200 OK)
- https://app.monofloor.cloud (HTTP 200 OK)

---

## [2025-01-07] - DOCUMENTACAO - Atualizacao Completa
**Agente/Sessao:** Claude Code - Analise de infraestrutura
**Arquivos Alterados:**
- ARQUITETURA-SISTEMAS.md (atualizacao completa)
- CHANGELOG.md (nova entrada)

**Resumo:**
Descoberta da arquitetura real dos sistemas:
- TODOS os frontends estao no VPS 72.61.56.150 (nao no Railway!)
- CRM Comercial e Admin Panel compartilham o MESMO codigo fonte (admin-panel)
- CRM usa Comercial.vue + componentes crm/
- Admin usa outras views (Dashboard, Applicators, Projects, etc.)
- App Mobile eh um projeto separado (HTML/JS puro)
- Video Processor eh independente
- Backend API esta no Railway

Dominios mapeados:
- comercial.monofloor.cloud -> VPS /var/www/comercial.monofloor.cloud/
- admin.monofloor.cloud -> VPS /var/www/admin.monofloor.cloud/
- app.monofloor.cloud -> VPS /var/www/app.monofloor.cloud/
- vt.monofloor.cloud -> VPS /var/www/vt.monofloor.cloud/
- propostas.monofloor.cloud -> VPS /var/www/propostas.monofloor.cloud/

**Status:** Completo
**Deploy:** Nao - Apenas documentacao
**Proximos Passos:** Usar este documento como referencia para todos os deploys

---

## [2025-01-07] - DOCUMENTACAO - Criacao
**Agente/Sessao:** Claude Code - Sessao inicial
**Arquivos Criados:**
- ARQUITETURA-SISTEMAS.md (documento de arquitetura)
- CHANGELOG.md (este arquivo)

**Resumo:**
Criados documentos para organizar e separar os sistemas Monofloor:
1. CRM Comercial (comercial.monofloor.cloud)
2. Admin Panel (admin.monofloor.cloud)
3. App Mobile (app.monofloor.cloud)
4. Video Processor (vt.monofloor.cloud)

**Status:** Completo
**Deploy:** Nao - Apenas documentacao
**Proximos Passos:** Seguir este padrao em todas as alteracoes futuras

---

## [2025-01-07] - TODOS OS SISTEMAS - Auditoria de Seguranca
**Agente/Sessao:** Claude Code - Analise completa
**Arquivos Analisados:**
- monofloor-app/app.js (Mobile App)
- monofloor-admin/src/ (Backend API)
- monofloor-admin/admin-panel/src/ (Admin Panel Vue)
- monofloor-admin/prisma/schema.prisma (Database)

**Resumo:**
Realizada auditoria completa de seguranca e qualidade de codigo.
Encontrados 139 problemas:
- 22 Criticos (XSS, JWT fraco, CORS, tokens em localStorage, etc.)
- 41 Altos (race conditions, memory leaks, IDOR)
- 57 Medios (validacao, performance)
- 19 Baixos (code quality)

**Status:** Analise Completa - Correcoes Pendentes
**Deploy:** Nao - Apenas analise
**Proximos Passos:**
- Corrigir vulnerabilidades criticas de seguranca
- Implementar rate limiting
- Corrigir timeout do GPS (aumentar de 15s para 30s)
- Adicionar sanitizacao XSS

---

## TEMPLATE PARA NOVAS ENTRADAS

<!-- Copie o template abaixo para novas entradas -->

<!--
## [YYYY-MM-DD] - [SISTEMA] - [TIPO]
**Agente/Sessao:**
**Arquivos Alterados:**
-

**Resumo:**


**Status:**
**Deploy:**
**Proximos Passos:**

---
-->

---

## LEGENDA

### Sistemas
- `CRM` = CRM Comercial (comercial.monofloor.cloud)
- `ADMIN` = Admin Panel (admin.monofloor.cloud)
- `APP` = App Mobile (app.monofloor.cloud)
- `VIDEO` = Video Processor (vt.monofloor.cloud)
- `TODOS` = Afeta multiplos sistemas
- `DOCS` = Apenas documentacao

### Tipos de Alteracao
- `Feature` = Nova funcionalidade
- `Fix` = Correcao de bug
- `Security` = Correcao de seguranca
- `Refactor` = Refatoracao de codigo
- `Style` = Mudanca visual/CSS
- `Docs` = Documentacao
- `Deploy` = Deploy/Infraestrutura
- `Config` = Configuracao

### Status
- `Completo` = Finalizado e testado
- `Em Progresso` = Ainda trabalhando
- `Pendente` = Aguardando algo
- `Revertido` = Mudanca desfeita
