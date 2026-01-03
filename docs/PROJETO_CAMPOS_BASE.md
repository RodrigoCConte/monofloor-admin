# MONOFLOOR - CAMPOS BASE DO PROJETO

> Documento de referência para todos os campos que compõem um projeto ao longo de sua trajetória.
> Estes campos serão populados a partir da integração com o Pipefy existente.

---

## ÍNDICE

1. [Identificação do Projeto](#1-identificação-do-projeto)
2. [Dados Contratuais](#2-dados-contratuais)
3. [Especificações Técnicas](#3-especificações-técnicas)
4. [Equipe e Responsáveis](#4-equipe-e-responsáveis)
5. [Datas e Prazos](#5-datas-e-prazos)
6. [Visitas Técnicas](#6-visitas-técnicas)
7. [Logística de Entrega](#7-logística-de-entrega)
8. [Execução da Obra](#8-execução-da-obra)
9. [Logística de Coleta](#9-logística-de-coleta)
10. [Pós-Vendas e Garantia](#10-pós-vendas-e-garantia)
11. [Anexos e Documentos](#11-anexos-e-documentos)
12. [Controle e Auditoria](#12-controle-e-auditoria)

---

## 1. IDENTIFICAÇÃO DO PROJETO

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| ID do Projeto | auto | - | Sistema | `id` |
| Nome do Projeto | texto | Sim | Contratos | `nome_do_projeto` |
| Código/Número OS | número | Não | Indústria | `n_mero_os` |
| Tipo de Obra | enum | Sim | Contratos | `tipo_de_obra_2` |
| Status Atual | enum | Sim | Sistema | - |
| Etiquetas/Tags | array | Sim | Contratos/Op. | `localidade` |

### Enum: Tipo de Obra
```
- NOVA
- ADITIVO
- FASE
- CANCELADA
- PÓS VENDAS
```

### Enum: Status do Projeto
```
- ENTRADA
- EM_CONTRATO
- PRIMEIRO_CONTATO
- AGENDAMENTO_VT_AFERICAO
- RESULTADO_VT_AFERICAO
- PROJETOS_REVISAO
- CONFIRMACOES_1
- DATA_A_DEFINIR
- AGENDAMENTO_VT_ACOMPANHAMENTO
- RESULTADO_VT_ACOMPANHAMENTO
- CONFIRMACOES_2
- REVISAO_FINAL
- AGUARDANDO_LIBERACAO
- INDUSTRIA_PRODUCAO
- AGENDAMENTO_VT_ENTRADA
- RESULTADO_VT_ENTRADA
- FINANCEIRO_REVISAO
- EQUIPE_EXECUCAO
- INFORMACOES_LOGISTICAS
- LOGISTICA_ENTREGA
- MATERIAL_ENTREGUE
- OBRA_EXECUCAO
- OBRA_PAUSADA
- OBRA_CONCLUIDA
- LOGISTICA_COLETA
- EM_COLETA
- FINALIZADO
```

---

## 2. DADOS CONTRATUAIS

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Endereço Completo | texto longo | Sim | Contratos | `endere_o` |
| Cidade | texto | Sim | Contratos | extrair de `endere_o` |
| Estado | texto | Sim | Contratos | extrair de `endere_o` |
| CEP | texto | Não | Contratos | - |
| Link Localização | url | Não | Atendimento | `link_localiza_o` |
| Vendedor | texto | Não | Contratos | `vendedor` |
| Reserva | boolean | Não | Comercial | `reserva` |
| Visita antes do PIUI | enum | Não | Contratos | `visita_antes_do_piui` |
| Visitou Showroom | enum | Não | Atendimento | `visitou_o_showroom` |
| Obra Noturna | boolean | Não | Atendimento | `obra_noturna` |

---

## 3. ESPECIFICAÇÕES TÉCNICAS

### 3.1 Metragens

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| M² Total | número | Sim | Projetos | `metragem_do_projeto` |
| Metragem Linear Total | número | Não | Projetos | `linear_total` |

### 3.2 Superfícies e Áreas

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Classificação da Superfície | array enum | Sim | Projetos | `reas_de_projetos` |

### Enum: Classificação da Superfície
```
- SECA
- MOLHADA
- EXTERNA
- SAUNA
- PISCINA
```

### 3.3 Cores

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Cores Selecionadas | array enum | Sim | Projetos/Op. | `cores` |
| Cor Definida | boolean | Sim | Atendimento | `cor_definida` |
| Cores Confirmadas | boolean | Sim | Atendimento | `cores_confirmadas` |
| Detalhe Personalização | texto | Não | Operacional | `texto_curto` |
| Textura da Aplicação | enum | Sim | Atendimento | `textura` |

### Enum: Cores
```
- À DEFINIR
- ABEL
- ARABIA
- ARCTURUS
- ARGENTO
- ASH
- ATENA
- BAMBOO
- BERTA
- CHROMA
- CHERRY
- EVEREST
- FLAMINGO
- GHOST
- GOBI
- GRAPE
- HASSAN
- IRIS
- JAVIER
- KALAHARI
- MIRAGE
- NERO
- SAARA
- SASHA
- SWEET
- TERRACOTA
- VERT
- PERSONALIZADA
```

### Enum: Textura
```
- MAIS_NUANCES
- MAIS_HOMOGENEO
- PADRAO
```

### 3.4 Material

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Material | array enum | Sim | Projetos | `materials` |
| Material Confirmado | boolean | Sim | Atendimento | `material_confirmado` |
| Material Suficiente em Obra | enum | Não | Atendimento | `tem_material_suficiente_em_obra` |
| Detalhes Solicitação Material | texto longo | Não | Atendimento | `detalhe_solicita_o_de_materiais` |

### Enum: Material
```
- LILIT
- LEONA
- STELION
- PISCINA
- LEONA_PARA_BASE
- STELION_PARA_BASE
```

### 3.5 Tela

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Obra Telada | boolean | Sim | Contratos/Proj./Op. | `tela_contratada` |
| Terá Aplicação de Tela | boolean | Não | Atendimento | `ter_aplica_o_de_tela` |
| Será Necessário Tela (VT) | enum | Não | Técnico | `ser_necess_rio_tela` |
| Detalhamento Metragem Tela | texto longo | Não | Operacional | `detalhamento_da_metragem_de_tela` |

### 3.6 Faseamento

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Obra Faseada | boolean | Sim | Atendimento/Op. | `obra_ser_faseada_1` |
| Detalhamento do Faseamento | texto longo | Não | Operacional | `detalhamento_do_faseamento_1` |
| Nome Modificado (Fase X) | boolean | Não | Atendimento | `modificar_o_nome_do_projeto` |
| Cards de Fases Criados | boolean | Não | Atendimento | `criar_um_novo_card_para_cada_fase_extra` |

---

## 4. EQUIPE E RESPONSÁVEIS

### 4.1 Consultores Internos

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Consultor Operacional | usuário | Sim | Operacional | `respons_vel_1` |
| Consultor de Atendimento | usuário | Não | Atendimento | `consultor_de_atendimento` |
| Consultor de Projetos | usuário | Não | Projetos | `consultor_de_projetos` |

### 4.2 Equipe de Execução

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Equipe Designada (Supervisão) | enum | Sim | Supervisão | `equipe` |
| Equipe de Execução (Confirmada) | enum | Sim | Supervisão | `equipe_de_execu_o` |
| Equipe Aceitou | boolean | Sim | Supervisão | `equipe_aceitou` |
| Hospedagem em CT | boolean | Não | Supervisão | `hospedagem_ser_em_um_ct` |
| Necessita Passagem/Hospedagem | boolean | Não | Supervisão | `necessita_passagem` |

### Enum: Equipes
```
- MUTIRAO
- WELLIGTON_WILLIAM
- MENDES
- GEYSSON
- MICHAEL
- EQUIPE_REPARO_REAPLICACAO
```

### 4.3 Prestadores de Visita

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Prestador VT Aferição 1 | enum | Não | Técnico | `prestador` |
| Prestador VT Aferição 2 | enum | Não | Técnico | `copy_of_prestador` |
| Prestador VT Aferição 3 | enum | Não | Técnico | `copy_of_prestador_2` |
| Prestador VT Acompanhamento 1 | enum | Não | Técnico | `prestador_1` |
| Prestador VT Acompanhamento 2 | enum | Não | Técnico | `copy_of_prestador_1` |
| Prestador VT Entrada 1 | enum | Não | Técnico | `prestador_2` |
| Prestador VT Entrada 2 | enum | Não | Técnico | `copy_of_prestador_4` |
| Prestador VT Entrada 3 | enum | Não | Técnico | `copy_of_prestador_2_1` |
| Prestador VT Entrada 4 | enum | Não | Técnico | `copy_of_prestador_3` |

### Enum: Prestadores
```
- MARCIO
- NATHAN
- JOAO
- GEYSSON
- JULIANA
- MICHAEL
```

---

## 5. DATAS E PRAZOS

### 5.1 Datas Principais

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Data de Entrada Prevista | data | Sim | Atendimento/Op. | `data_de_entrada` |
| Data Definida | data | Não | Atendimento | `data_definida` |
| Data Após Reprovação | data | Não | Atendimento | `data_definida_ap_s_reprova_o_da_entradaa` |
| Data Confirmada | boolean | Sim | Atendimento | `data_confirmada` |
| Nova Data (Redefinição) | data | Não | Técnico | `nova_data` |
| Data Pausamento | data | Não | Supervisão | `data_do_pausamento_da_obra` |
| Data Retorno (Pausa) | data | Não | Supervisão | `data_do_retorno` |
| Data Última Camada Verniz | datetime | Não | Operacional | `data_e_hora_de_aplica_o_da_segunda_camada_de_verniz` |
| Data Finalização | data | Não | Atendimento | `data_de_finaliza_o_da_obra` |

### 5.2 Prazos

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Prazo (dias) | número | Sim | Atendimento | `prazo` |
| Prazo Confirmado | boolean | Sim | Atendimento | `confirmar_prazo` |

### 5.3 Datas de Envio

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Data Envio Manual | data | Não | Atendimento | `envio_do_manuall` |
| Data Envio Relatório | data | Não | Técnico | `data_de_envio_do_relat_rio` |

---

## 6. VISITAS TÉCNICAS

### 6.1 VT Aferição/Orientação

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Data/Hora VT 1 | datetime | Não | Técnico | `data_e_hora_da_visita` |
| Tipo VT 1 | enum | Não | Técnico | `tipo_de_visita` |
| Data/Hora VT 2 | datetime | Não | Técnico | `data_e_hora_2_visita` |
| Tipo VT 2 | enum | Não | Técnico | `copy_of_tipo_de_visita` |
| Data/Hora VT 3 | datetime | Não | Técnico | `copy_of_data_e_hora_da_2_visita` |
| Tipo VT 3 | enum | Não | Técnico | `copy_of_tipo_de_visita_2` |

### Enum: Tipo de Visita
```
- ORIENTATIVA_AFERICAO
- ORIENTATIVA
- AFERICAO
```

### 6.2 Resultado VT Aferição

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Visita Realizada | boolean | Não | Técnico | `visita_foi_realizada` |
| Responsável Acompanhou | boolean | Não | Técnico | `respons_vel_pela_obra_acompanhou_a_visita` |
| Relatório Enviado | boolean | Não | Técnico | `devolutiva_visita_1` |
| Aferição Realizada | boolean | Não | Técnico | `foi_realizada_aferi_o` |

### 6.3 VT Acompanhamento

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Necessidade de Visita | boolean | Não | Técnico | `necessidade_de_visita` |
| Tipo VT Acompanhamento | enum | Não | Técnico | `tipode_visita` |
| Data/Hora VT Acomp. 1 | datetime | Não | Técnico | `1_visita` |
| Data/Hora VT Acomp. 2 | datetime | Não | Técnico | `data_e_hora_22` |
| Tipo VT Acomp. 2 | enum | Não | Técnico | `tipo_de_visita_2` |

### 6.4 Resultado VT Acompanhamento

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Relatório Enviado | boolean | Não | Técnico | `relat_rio_enviado` |
| Pendências para Entrada | texto longo | Não | Técnico | `pend_ncias_para_entrada` |
| Necessário Redefinir Data | boolean | Não | Técnico | `necess_rio_redefinir_data_de_entrada` |

### 6.5 VT Entrada

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Necessita Visita | boolean | Não | Técnico | `tipo_de_obra` |
| Data/Hora VT Entrada 1 | datetime | Não | Técnico | `visita_de_entrada` |
| Pendências Entrada 1 | texto longo | Não | Técnico | `pend_ncias_para_entrada_1` |
| Data/Hora VT Entrada 2 | datetime | Não | Técnico | `copy_of_visita_de_entrada` |
| Pendências Entrada 2 | texto longo | Não | Técnico | `pedn_ncias_para_entrada_2` |
| Data/Hora VT Entrada 3 | datetime | Não | Técnico | `copy_of_visita_de_entrada_2` |
| Pendências Entrada 3 | texto longo | Não | Técnico | `pend_ncias_para_entrada_3` |
| Data VT Entrada 4 | data | Não | Técnico | `data_da_visita_4` |

### 6.6 Resultado VT Entrada

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Resultado VT 1 | enum | Não | Técnico | `resultado_visita` |
| Resultado VT 2 | enum | Não | Técnico | `copy_of_resultado_visita` |
| Resultado VT 3 | enum | Não | Técnico | `copy_of_copy_of_resultado_visita` |
| Resultado VT 4 | enum | Não | Técnico | `copy_of_resultado_visita_3` |

### Enum: Resultado Visita
```
- APROVADO
- APROVADA_COM_TERMO
- REPROVADA
```

### 6.7 Visitas de Aprovação (durante execução)

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Data Visita Aprovação 1 | datetime | Não | Técnico | `visita_selador` |
| Descrição Visita 1 | texto longo | Não | Técnico | `descri_o_da_visita` |
| Aprovação 1 | enum | Não | Técnico | `aprova_o_3` |
| Data Visita Aprovação 2 | datetime | Não | Técnico | `copy_of_visita_aprova_o` |
| Descrição Visita 2 | texto longo | Não | Técnico | `copy_of_descri_o_da_visita` |
| Aprovação 2 | enum | Não | Técnico | `copy_of_aprova_o` |

### Enum: Aprovação
```
- APROVADO
- NAO_APROVADO
```

---

## 7. LOGÍSTICA DE ENTREGA

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Dias/Horário Entrega | texto | Sim | Atendimento | `dias_e_hor_rio_para_entrega` |
| Detalhes da Entrega | texto longo | Sim | Atendimento | `detalhes_da_entrega` |
| Recebido por Equipe Monofloor | boolean | Não | Atendimento | `ser_recebido_pela_equipe_monofloor` |
| Nome de Quem Recebe | texto | Sim | Atendimento | `nome_e_telefone_de_quem_ir_receber` |
| Telefone de Quem Recebe | telefone | Sim | Atendimento | `contato_de_quem_ir_receber` |
| Status Entrega | enum | Não | Logística | - |

### Enum: Status Entrega
```
- PENDENTE
- EM_TRANSITO
- ENTREGUE
```

---

## 8. EXECUÇÃO DA OBRA

### 8.1 Controles de Entrada

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Solicitado Registro Material | boolean | Não | Supervisão | `equipe_de_execu_o_fez_o_check_de_material_em_obra` |
| Equipe Enviou Registro Material | boolean | Não | Supervisão | `equipe_enviou_o_registro` |
| Solicitado Vídeo Entrada | boolean | Não | Supervisão | `equipe_de_execu_o_enviou_o_v_deo_de_entrada_de_obra` |
| Equipe Enviou Vídeo Entrada | boolean | Não | Supervisão | `equipe_enviou_o_registro_de_entrada` |

### 8.2 Andamento - Piso

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Andamento Piso | array enum | Não | Supervisão | `andamento_obra` |

### Enum: Etapas Piso
```
- PROTECAO
- LIMPEZA
- PREPARO_JUNTAS_PRIMER
- MASSA_JUNTAS
- CAMADA_1
- LIXAMENTO_1
- CAMADA_2
- LIXAMENTO_2
- CAMADA_3
- LIXAMENTO_3
- CAMADA_4
- LIXAMENTO_4
- SELADOR
- VERNIZ
```

### 8.3 Andamento - Parede/Outros

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Andamento Parede | array enum | Não | Supervisão | `copy_of_andamento_obra_piso` |

### 8.4 Ocorrências

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Obra Pausada | boolean | Não | Supervisão | `obra_pausada` |
| Ocorrência | boolean | Não | Supervisão | `ocorr_ncia` |
| Cliente Aceitou Orçamento Ocorrência | enum | Não | Atendimento | `cliente_aceitou_pagou_or_amento_da_ocorr_ncia` |
| Fasear para Ocorrência | enum | Não | Atendimento | `ser_necess_rio_fasear_para_tratar_a_ocorr_ncia` |

### 8.5 Conclusão

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Termo Entrega Enviado | boolean | Não | Atendimento | `termo_entrega` |
| Etiqueta Obra Concluída | boolean | Não | Atendimento | `adicionar_etiqueta_de_obra_conclu_da` |

---

## 9. LOGÍSTICA DE COLETA

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Dias/Horários Coleta | texto | Não | Atendimento | `dias_e_hor_rios_para_coleta` |
| Precisa Acessar Aplicação | boolean | Não | Atendimento | `precisa_acessar_a_aplica_o` |
| Detalhes da Coleta | texto longo | Não | Atendimento | `detalhes_da_coleta` |
| Nome Responsável Coleta | texto | Não | Atendimento | `nome_e_telefone_do_respons_vel` |
| Telefone Responsável Coleta | telefone | Não | Atendimento | `telefone_do_respons_vel` |
| Status Coleta | enum | Não | Logística | - |

### Enum: Status Coleta
```
- PENDENTE
- EM_TRANSITO
- COLETADO
```

---

## 10. PÓS-VENDAS E GARANTIA

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Motivo Acionamento Pós-Vendas | texto longo | Não | Atendimento | `descreva_o_motivo_do_acionamento` |
| Pós-Vendas Acionado | boolean | Não | Atendimento | `p_s_vendas_acionado` |
| Data Finalização (Início Garantia) | data | Não | Atendimento | `data_de_finaliza_o_da_obra` |
| Solicitação Cinderela | boolean | Não | Atendimento | `solicita_o_de_cinderela` |
| Grupo Telegram Exportado | boolean | Não | Atendimento | `grupo_do_telegram_exportado` |

---

## 11. ANEXOS E DOCUMENTOS

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Escopo Inicial | arquivo | Não | Contratos | `escopo_inicial` |
| Escopo Final Aprovado | arquivo | Não | Projetos | `escopo_aprovado` |
| Relatório de Visita | arquivo | Não | Técnico | `anexar_relat_rio_de_visita` |
| Foto Material para Coleta | arquivo | Não | Atendimento | `foto_material_para_coletar` |

---

## 12. CONTROLE E AUDITORIA

### 12.1 Checkpoints de Validação

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Consultores Preenchidos | boolean | Não | Operacional | `preencher_consultores_operacionais` |
| Dados Conferidos com Telegram | boolean | Não | Operacional | `conferir_dados_do_formul_rio_inicial_com_os_dados_do_telegram` |
| Apresentação WhatsApp | boolean | Não | Operacional | `apresenta_o_alinhamento_whatsappp` |
| Estimativa Prazo Informada | boolean | Não | Operacional | `estimativa_de_prazo_conforme_escopo` |
| Endereço Confirmado | boolean | Não | Atendimento | `endere_o_est_correto` |
| Cliente Respondeu Relatório | boolean | Não | Atendimento | `devolutiva_visita` |
| Escopo Preenchido e no Telegram | boolean | Não | Atendimento | `escopo_est_preenchido` |
| OK para Projetos | boolean | Não | Atendimento | `todas_as_informa_es_est_o_corretas_para_envio_desse_card_para_projeto` |
| OK para Indústria | boolean | Não | Atendimento | `todas_as_informa_es_est_o_corretas_para_envio_desse_card_para_a_ind_stria` |
| OK para Logística (Entrega) | boolean | Não | Atendimento | `todas_as_informa_es_est_o_corretas_para_envio_desse_card_para_log_stica` |
| OK para Logística (Coleta) | boolean | Não | Atendimento | `todas_as_informa_es_est_o_corretas_para_envio_desse_card_para_log_stica_1` |

### 12.2 Definição de Cor (Status)

| Campo | Tipo | Obrigatório | Preenchido por | Pipefy ID |
|-------|------|-------------|----------------|-----------|
| Status Definição Cor | array enum | Não | Atendimento | `denifi_o_de_cor` |
| Status Amostra | enum | Não | Atendimento | `recebeu_amostra` |

### Enum: Definição de Cor
```
- RECEBEU_AMOSTRA
- SOLICITAR_KIT_PADRAO
- SOLICITAR_KIT_COMPLETO
- SOLICITAR_AMOSTRA_PERSONALIZADA
- COR_ESCOLHIDA
- AGUARDANDO_DEFINICAO
```

### Enum: Status Amostra
```
- NAO_ENVIADA
- NAO_RECEBIDA
- NAO_APROVADA
- RECEBIDA
```

### 12.3 Timestamps (gerados pelo sistema)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| created_at | datetime | Data/hora de criação do projeto |
| updated_at | datetime | Última atualização |
| status_changed_at | datetime | Última mudança de status |
| entered_execution_at | datetime | Quando entrou em execução |
| completed_at | datetime | Quando foi concluído |
| finalized_at | datetime | Quando foi finalizado |

---

## MAPEAMENTO PIPEFY → SISTEMA

### Campos do Formulário Inicial (Start Form)
```
id                                    → ID do Projeto
reserva                               → Reserva
respons_vel_1                         → Consultor Operacional
consultor_de_atendimento              → Consultor de Atendimento
consultor_de_projetos                 → Consultor de Projetos
nome_do_projeto                       → Nome do Projeto
endere_o                              → Endereço Completo
metragem_do_projeto                   → M² Total
linear_total                          → Metragem Linear Total
visita_antes_do_piui                  → Visita antes do PIUI
data_de_entrada                       → Data de Entrada Prevista
tela_contratada                       → Obra Telada
detalhamento_da_metragem_de_tela      → Detalhamento Metragem Tela
obra_ser_faseada_1                    → Obra Faseada
detalhamento_do_faseamento_1          → Detalhamento do Faseamento
prazo                                 → Prazo (dias)
equipe                                → Equipe Designada
reas_de_projetos                      → Classificação da Superfície
cores                                 → Cores Selecionadas
texto_curto                           → Detalhe Personalização
materials                             → Material
vendedor                              → Vendedor
escopo_inicial                        → Escopo Inicial (anexo)
escopo_aprovado                       → Escopo Final Aprovado (anexo)
n_mero_os                             → Número OS
data_e_hora_de_aplica_o_da_segunda... → Data Última Camada Verniz
localidade                            → Etiquetas
```

---

## TOTAL DE CAMPOS

| Categoria | Quantidade |
|-----------|------------|
| Identificação | 6 |
| Dados Contratuais | 10 |
| Especificações Técnicas | 20 |
| Equipe e Responsáveis | 18 |
| Datas e Prazos | 13 |
| Visitas Técnicas | 35 |
| Logística Entrega | 6 |
| Execução | 12 |
| Logística Coleta | 6 |
| Pós-Vendas | 5 |
| Anexos | 4 |
| Controle/Auditoria | 15 |
| Timestamps | 6 |
| **TOTAL** | **~156 campos** |

---

## PRÓXIMOS PASSOS

1. [ ] Criar modelo Prisma baseado nesta estrutura
2. [ ] Criar script de migração Pipefy → Sistema
3. [ ] Definir permissões por módulo/setor
4. [ ] Implementar automações de transição
5. [ ] Criar interfaces por módulo

---

*Documento gerado em: Dezembro 2025*
*Versão: 1.0*
