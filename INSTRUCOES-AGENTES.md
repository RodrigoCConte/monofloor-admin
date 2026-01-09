# INSTRUCOES PARA AGENTES - OBRIGATORIO

> **ATENCAO:** Este documento DEVE ser lido por qualquer agente antes de fazer alteracoes.
> Ignorar estas instrucoes resulta em confusao e retrabalho.

---

## PASSO 1: IDENTIFICAR O SISTEMA

Antes de QUALQUER acao, identifique em qual sistema voce vai trabalhar:

| Sistema | Dominio | Pasta | Banco |
|---------|---------|-------|-------|
| CRM Comercial | comercial.monofloor.cloud | A definir | Proprio |
| Admin Panel | admin.monofloor.cloud | monofloor-admin/admin-panel/ | PostgreSQL Railway |
| Backend API | (mesmo do admin) | monofloor-admin/src/ | PostgreSQL Railway |
| App Mobile | app.monofloor.cloud | monofloor-app/ | PostgreSQL Railway |
| Video Processor | vt.monofloor.cloud | public-video-processor/ | Nenhum |

---

## PASSO 2: CONFIRMAR COM O USUARIO

Se o usuario pedir algo vago como:
- "Corrige o bug do login" -> PERGUNTE: "Em qual sistema? CRM, Admin ou App?"
- "Adiciona uma feature" -> PERGUNTE: "Em qual sistema?"
- "Faz deploy" -> PERGUNTE: "De qual sistema? Para qual dominio?"

**NUNCA ASSUMA. SEMPRE PERGUNTE.**

---

## PASSO 3: TRABALHAR NO SISTEMA CORRETO

### Para CRM Comercial (comercial.monofloor.cloud)
```bash
cd "/Users/rodrigoconte/[PASTA_CRM]"
# Trabalhe apenas em arquivos do CRM
# Deploy vai para comercial.monofloor.cloud
```

### Para Admin Panel (admin.monofloor.cloud)
```bash
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-admin/admin-panel"
# Frontend Vue.js do painel administrativo
# Deploy vai para admin.monofloor.cloud
```

### Para Backend API
```bash
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-admin"
# Backend Node.js/Express/TypeScript
# Serve tanto o Admin quanto o App
# Deploy vai para Railway
```

### Para App Mobile (app.monofloor.cloud)
```bash
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-app"
# Frontend do aplicativo PWA
# Deploy vai para app.monofloor.cloud
```

### Para Video Processor (vt.monofloor.cloud)
```bash
cd "/Users/rodrigoconte/Primeiro projeto/public-video-processor"
# Processador de videos standalone
# Deploy vai para VPS 72.61.56.150
# Diretorio no VPS: /var/www/vt.monofloor.cloud/
```

---

## PASSO 4: REGISTRAR ALTERACOES

Apos QUALQUER alteracao, adicione uma entrada no CHANGELOG.md:

```bash
# Abra o changelog
code "/Users/rodrigoconte/Primeiro projeto/CHANGELOG.md"

# Adicione uma entrada no formato:
## [DATA] - [SISTEMA] - [TIPO]
**Agente/Sessao:** ...
**Arquivos Alterados:** ...
**Resumo:** ...
**Status:** ...
**Deploy:** ...
```

---

## PASSO 5: DEPLOY SEGURO

### Railway (CRM, Admin, App, Backend)
```bash
# Verifique em qual projeto esta
railway status

# Confirme o dominio antes de fazer deploy
# NUNCA faca deploy sem confirmar
```

### VPS (Video Processor)
```bash
# Apenas para vt.monofloor.cloud
sshpass -p 'qS4wv19mLrB;c@rOGeX,' ssh root@72.61.56.150

# Diretorio correto:
cd /var/www/vt.monofloor.cloud/
```

---

## COMANDOS UTEIS

### Verificar onde estou
```bash
pwd
railway status
```

### Ver qual projeto Railway esta linkado
```bash
cat .railway.toml 2>/dev/null || echo "Nenhum projeto Railway linkado"
```

### Ver dominios configurados
```bash
railway domain
```

---

## ERROS COMUNS A EVITAR

### 1. Confundir Admin com CRM
- **ERRADO:** Adicionar funcionalidade de vendas no Admin Panel
- **CERTO:** Funcionalidades de vendas vao no CRM Comercial

### 2. Deploy no dominio errado
- **ERRADO:** Fazer deploy do CRM em admin.monofloor.cloud
- **CERTO:** Cada sistema tem seu proprio dominio

### 3. Alterar banco de dados errado
- **ERRADO:** Rodar migration do CRM no banco do App
- **CERTO:** Cada sistema tem seu proprio banco (exceto App+Admin)

### 4. Nao registrar alteracoes
- **ERRADO:** Fazer mudancas sem atualizar o CHANGELOG
- **CERTO:** Sempre registrar no CHANGELOG.md

---

## FLUXO DE TRABALHO PADRAO

```
1. PERGUNTE qual sistema o usuario quer alterar
2. NAVEGUE para a pasta correta
3. FACA as alteracoes necessarias
4. TESTE localmente se possivel
5. REGISTRE no CHANGELOG.md
6. FACA deploy apenas se solicitado
7. VERIFIQUE se o deploy funcionou
8. CONFIRME que outros sistemas nao foram afetados
```

---

## CHECKLIST ANTES DE TERMINAR

```
[ ] Trabalhei no sistema correto?
[ ] Alterei apenas arquivos do sistema correto?
[ ] Registrei as mudancas no CHANGELOG.md?
[ ] Se fiz deploy, foi no dominio correto?
[ ] Verifiquei que outros sistemas nao foram afetados?
```

---

## EM CASO DE DUVIDA

**PARE E PERGUNTE AO USUARIO**

Eh melhor perguntar e ter certeza do que fazer algo errado e causar problemas.
