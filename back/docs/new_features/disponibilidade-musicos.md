# RF — Disponibilidade Semanal dos Músicos

**Módulo:** Disponibilidade  
**Versão do documento:** 1.0  
**Data:** 29/04/2026  
**Status:** Aguardando aprovação  

---

## 1. Visão Geral

Atualmente o sistema LouvorHub permite que o ministro de louvor escale qualquer músico cadastrado na igreja, independentemente de sua disponibilidade real para aquela semana. Isso gera problemas de comunicação: músicos escalados sem estar disponíveis, ou ministros sem visibilidade de quem pode participar antes de montar o repertório.

Esta feature introduz um **ciclo semanal de declaração de disponibilidade**, onde cada músico informa no início da semana (segunda-feira) se estará disponível para os cultos daquela semana. O ministro só visualiza como disponíveis os músicos que confirmaram presença, tornando o processo de escalação mais ágil e confiável.

---

## 2. Atores

| Ator | Descrição |
|------|-----------|
| **Músico / Cantor** | Declara sua disponibilidade semanalmente |
| **Ministro** | Visualiza disponibilidades e realiza escalações com base nelas |
| **Pastor / ADM** | Tem visibilidade geral das disponibilidades da semana |
| **Sistema (Scheduler)** | Envia notificações automáticas de lembrete toda segunda-feira |

---

## 3. Requisitos Funcionais

### RF-01 — Declaração de Disponibilidade pelo Músico

**Descrição:** O músico deve poder declarar, via aplicativo, se está ou não disponível para ser escalado durante uma determinada semana.

**Regras de negócio:**
- RF-01.1 — A semana de referência é identificada pela data da segunda-feira que a inicia (ex.: `2026-04-27`).
- RF-01.2 — A declaração é vinculada à **igreja** do músico, já que um usuário pode pertencer a mais de uma igreja.
- RF-01.3 — As opções de declaração são:
  - **Disponível** — O músico pode ser escalado naquela semana.
  - **Indisponível** — O músico não poderá ser escalado naquela semana.
- RF-01.4 — O músico pode incluir uma **observação opcional** explicando a indisponibilidade (ex.: "Viagem a trabalho", "Problemas de saúde").
- RF-01.5 — A declaração pode ser feita **a qualquer momento da semana**, não apenas na segunda-feira. O envio na segunda-feira é apenas o momento incentivado pelo sistema via notificação.
- RF-01.6 — O músico pode **alterar** sua declaração a qualquer momento **enquanto não estiver escalado** num repertório daquela semana. Após ser escalado, uma confirmação de alteração será solicitada ao ministro.
- RF-01.7 — Músicos que não declararam disponibilidade até o momento da consulta aparecem com status **"Não informado"** para o ministro.

---

### RF-02 — Visibilidade da Disponibilidade para o Ministro

**Descrição:** O ministro deve conseguir visualizar o status de disponibilidade de todos os músicos da sua igreja para a semana corrente antes de realizar escalações.

**Regras de negócio:**
- RF-02.1 — Ao acessar a tela de escalação de um repertório, o ministro visualiza a lista de músicos com um dos três status:
  - `Disponível` (declarou disponibilidade)
  - `Indisponível` (declarou indisponibilidade)
  - `Não informado` (ainda não declarou)
- RF-02.2 — Por padrão, músicos com status **Indisponível** ou **Não informado** são ocultados da listagem de seleção durante a escalação, mas podem ser exibidos caso o ministro opte por ver todos.
- RF-02.3 — O ministro pode visualizar o **histórico de disponibilidade** de um músico (semanas anteriores), para apoiar decisões de escalação com base em padrões de frequência.
- RF-02.4 — O ministro pode ter acesso a um **painel resumo semanal** com a contagem de músicos disponíveis, indisponíveis e não informados, separados por instrumento/função.

---

### RF-03 — Disponibilidade Segmentada por Período do Dia (Opcional — Fase 2)

**Descrição:** Em igrejas com múltiplos cultos na semana (ex.: culto de quarta à noite e culto de domingo pela manhã), o músico pode indicar disponibilidade apenas para determinados cultos ou horários.

**Regras de negócio:**
- RF-03.1 — O músico pode declarar disponibilidade **geral para a semana** (cobre todos os cultos) ou **por tipo de culto** da sua igreja (ex.: disponível para "Culto de Domingo Manhã", indisponível para "Culto de Quarta").
- RF-03.2 — Quando a disponibilidade é declarada por tipo de culto, o sistema cruza automaticamente o `TipoCulto` do repertório com a disponibilidade declarada pelo músico.
- RF-03.3 — Esta segmentação é **opcional** — o músico pode simplesmente declarar disponibilidade geral sem precisar detalhar por culto.

> **Nota:** RF-03 é considerado escopo de uma segunda fase e não é pré-requisito para o lançamento inicial da feature.

---

### RF-04 — Notificações Automáticas (Lembrete Semanal)

**Descrição:** O sistema deve enviar lembretes automáticos para que os músicos não se esqueçam de declarar disponibilidade no início de cada semana.

**Regras de negócio:**
- RF-04.1 — **Toda segunda-feira às 8h00**, o sistema envia uma notificação do tipo `lembrete_disponibilidade` para **todos os músicos e cantores** ativos de cada igreja que ainda não declararam disponibilidade para aquela semana.
- RF-04.2 — Caso o músico não tenha declarado até **segunda-feira às 20h00**, o sistema envia um segundo lembrete.
- RF-04.3 — As notificações de lembrete são **deduplicadas**: não serão enviadas novamente se o músico já tiver declarado disponibilidade após o primeiro lembrete.
- RF-04.4 — As notificações devem conter link/referência direto para a tela de declaração de disponibilidade no app.
- RF-04.5 — Um novo tipo de notificação `lembrete_disponibilidade` deve ser adicionado ao enum existente de `TipoNotificacao`.

---

### RF-05 — Alerta ao Ministro sobre Músicos Não Informados

**Descrição:** O ministro de louvor deve receber alertas quando músicos-chave ainda não informaram disponibilidade, especialmente quando o culto está próximo.

**Regras de negócio:**
- RF-05.1 — O ministro recebe uma notificação do tipo `disponibilidade_pendente` quando, **48 horas antes de um culto**, ainda existirem músicos escalados (ou elegíveis para escalação) que não declararam disponibilidade para aquela semana.
- RF-05.2 — A notificação lista quantos músicos ainda não se pronunciaram.
- RF-05.3 — O ministro pode, a partir da notificação, acessar diretamente o painel de disponibilidades da semana.

---

### RF-06 — Restrição na Escalação de Músicos Indisponíveis

**Descrição:** O sistema deve alertar (ou impedir) a escalação de músicos que declararam indisponibilidade para aquela semana.

**Regras de negócio:**
- RF-06.1 — Ao tentar escalar um músico com status **Indisponível**, o sistema exibe um **aviso de confirmação** antes de prosseguir (ex.: "João Silva declarou indisponibilidade para esta semana. Deseja escalá-lo mesmo assim?").
- RF-06.2 — O sistema **não bloqueia** a escalação, pois o ministro pode ter combinado presença por fora do app; apenas alerta.
- RF-06.3 — Músicos com status **Não informado** podem ser escalados normalmente, sem aviso adicional.

---

### RF-07 — Histórico e Relatório de Disponibilidade

**Descrição:** O sistema deve manter um histórico das declarações de disponibilidade para fins de gestão e análise pelo ministro e pastores.

**Regras de negócio:**
- RF-07.1 — Cada declaração de disponibilidade é **registrada com data/hora** de criação e última atualização.
- RF-07.2 — O ministro e o pastor/ADM podem consultar o histórico de disponibilidade de qualquer músico da igreja, por semana.
- RF-07.3 — O histórico deve indicar claramente quando houve **alteração** de status (ex.: declarou disponível e depois alterou para indisponível) e o respectivo horário da mudança.

---

## 4. Regras de Negócio Gerais

| Código | Regra |
|--------|-------|
| RN-01 | A semana é sempre calculada de segunda-feira (00:00) a domingo (23:59) no fuso horário da igreja |
| RN-02 | Um músico que não declarou disponibilidade **não aparece como disponível** na visão do ministro |
| RN-03 | Um músico pode estar em múltiplas igrejas; a disponibilidade é **por igreja** |
| RN-04 | Apenas usuários com perfil `Musico` ou `Cantor` podem declarar disponibilidade |
| RN-05 | Apenas usuários com perfil `Ministro`, `Pastor` ou `ADM` podem consultar disponibilidades de outros |
| RN-06 | A declaração de disponibilidade é **independente do repertório** — não está vinculada a um culto específico, mas à semana toda (salvo RF-03 na fase 2) |
| RN-07 | Semanas futuras (além da semana atual) não podem ter disponibilidade declarada antecipadamente na fase 1 |

---

## 5. Critérios de Aceite

### CA-01 — Declaração básica
- [ ] O músico acessa a tela de disponibilidade e vê a semana atual claramente identificada
- [ ] O músico consegue marcar "Disponível" ou "Indisponível"
- [ ] A declaração é salva e o status é atualizado imediatamente na visão do ministro
- [ ] O músico pode adicionar uma observação opcional à sua declaração

### CA-02 — Visão do ministro
- [ ] O ministro vê, na tela de escalação, quais músicos estão disponíveis, indisponíveis ou não informados
- [ ] Por padrão, músicos indisponíveis e não informados ficam ocultados (mas acessíveis)
- [ ] O ministro vê o painel resumo com contagens por status

### CA-03 — Notificações
- [ ] Toda segunda-feira às 8h00 os músicos que não declararam recebem a notificação de lembrete
- [ ] Um segundo lembrete é enviado às 20h00 caso ainda não tenham declarado
- [ ] A notificação não é enviada novamente se o músico já declarou

### CA-04 — Escalação com aviso
- [ ] Ao tentar escalar músico indisponível, o sistema exibe alerta antes de confirmar
- [ ] A escalação ainda é permitida após confirmação do ministro

### CA-05 — Alteração de disponibilidade
- [ ] O músico pode alterar o status enquanto não estiver escalado
- [ ] Se já estiver escalado, o sistema exibe aviso sobre o impacto da alteração

---

## 6. Fluxos Principais

### Fluxo 1 — Músico declara disponibilidade

```
Segunda-feira, 8h00
    → Sistema envia notificação "lembrete_disponibilidade" ao músico
    → Músico abre app e acessa a tela de disponibilidade
    → Músico seleciona "Disponível" (ou "Indisponível" + observação opcional)
    → Sistema registra a declaração com timestamp
    → Status do músico é atualizado na visão do ministro
```

### Fluxo 2 — Ministro monta escalação

```
Ministro acessa escalação de um repertório
    → Sistema exibe lista de músicos com status de disponibilidade
    → Músicos "Disponíveis" aparecem no topo, destacados em verde
    → Músicos "Indisponíveis" e "Não informados" ficam em seção colapsada
    → Ministro seleciona músicos disponíveis e finaliza escalação
```

### Fluxo 3 — Tentativa de escalar músico indisponível

```
Ministro seleciona músico com status "Indisponível"
    → Sistema exibe aviso: "[Nome] declarou indisponibilidade esta semana. Deseja continuar?"
    → Ministro confirma → escalação é realizada normalmente
    → Ministro cancela → retorna à lista sem alteração
```

---

## 7. Modelo de Dados (Proposto)

> **Nota:** Esta seção descreve o modelo conceitual de dados. A implementação técnica (migrations, DTOs, endpoints) será definida na fase de desenvolvimento, após aprovação dos requisitos.

### Nova entidade: `DisponibilidadeMusico`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID/Int | Identificador único |
| `usuarioId` | Int | Referência ao músico |
| `igrejaId` | Int | Referência à igreja |
| `semanaInicio` | Date | Data da segunda-feira da semana (ex.: `2026-04-27`) |
| `disponivel` | Boolean | `true` = disponível, `false` = indisponível |
| `observacao` | String? | Observação opcional do músico |
| `criadoEm` | DateTime | Timestamp de criação |
| `atualizadoEm` | DateTime | Timestamp da última atualização |

**Restrição:** Unique em `(usuarioId, igrejaId, semanaInicio)` — um músico só pode ter uma declaração por semana por igreja.

### Novo tipo de notificação

Adição ao enum `TipoNotificacao`:
- `lembrete_disponibilidade` — Lembrete semanal para declarar disponibilidade
- `disponibilidade_pendente` — Alerta ao ministro sobre músicos não informados

---

## 8. Impacto em Funcionalidades Existentes

| Funcionalidade | Impacto |
|---------------|---------|
| **Tela de escalação** | Deve exibir status de disponibilidade ao listar músicos |
| **Listagem de músicos da igreja** | Pode exibir badge de status de disponibilidade na semana atual |
| **Scheduler de notificações** | Dois novos jobs semanais: lembrete às 8h e às 20h de segunda-feira |
| **Notificações** | Dois novos tipos no enum `TipoNotificacao` |
| **Dashboard** | Pode exibir card resumo de disponibilidade da semana atual |

---

## 9. Fora de Escopo (Fase 1)

- Declaração de disponibilidade antecipada (semanas futuras)
- Disponibilidade segmentada por tipo de culto (coberto no RF-03 — Fase 2)
- Integração com calendário externo (Google Calendar, etc.)
- Solicitação de substituição automática quando músico se torna indisponível após escalação
- Aprovação do ministro para declaração de indisponibilidade

---

## 10. Dependências e Pré-Requisitos

- O usuário deve estar cadastrado e vinculado a uma igreja com perfil `Musico` ou `Cantor`
- O sistema de notificações com scheduler já está implementado e funcional
- Não há dependência de novas integrações externas

---

## Aprovação

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| Product Owner | | | |
| Ministro (Representante) | | | |
| Dev Lead | | | |
