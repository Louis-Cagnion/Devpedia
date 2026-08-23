---
order: 3
---

# n8n: catálogo de funcionalidades e tipos de nós

O capítulo anterior estabeleceu as peças genéricas de um nó (gatilho, ação) e sua configuração. Este capítulo detalha as grandes famílias de nós específicos que o n8n oferece, além de um simples conector para um serviço externo.

## Os gatilhos: além do webhook

Um **gatilho** pode assumir várias formas, não apenas um evento externo:

| Tipo de gatilho | Inicia o fluxo de trabalho quando... |
|---|---|
| **Webhook** | Uma requisição HTTP chega a uma URL própria do fluxo de trabalho |
| **Agendado** (*Schedule*) | Em intervalo regular (a cada hora) ou em horário preciso (todo dia às 8h) |
| **Manual** | Uma pessoa clica em "Test workflow" no editor |
| **A partir de outro fluxo de trabalho** | Outro fluxo de trabalho n8n o chama explicitamente (ver mais abaixo) |

Um fluxo de trabalho tem apenas um gatilho ativo por vez (o que realmente o iniciou): vários nós do tipo gatilho podem coexistir no mesmo canvas, mas cada um inicia sua própria execução independente.

## Os nós de código: sair do no-code quando necessário

O **Code node** executa diretamente [JavaScript](/?c=langages&s=javascript&p=javascript) ou [Python](/?c=langages&s=python&p=python) dentro do fluxo de trabalho, para tratamentos específicos demais para um conector pré-configurado (uma transformação de dados complexa, um cálculo, uma filtragem sob medida):

```javascript
// Code node (JavaScript): mantém apenas os itens cujo valor
// ultrapassa 100, e adiciona um campo calculado
return $input.all().filter(item => item.json.valor > 100).map(item => {
  item.json.valorComImposto = item.json.valor * 1.2;
  return item;
});
```

> **Cilada:** usar sistematicamente o Code node por reflexo de desenvolvedor, mesmo quando um nó pré-configurado existente (filtro, edição de campos) faria a mesma coisa. Um fluxo de trabalho cheio de código perde a vantagem de legibilidade do no-code para quem não escreveu esse código.
>
> **Boa prática:** reservar o Code node para os tratamentos que nenhum nó pré-configurado cobre, e documentar brevemente (comentário no código, ou nome explícito do nó) o que ele faz, para a próxima pessoa que abrir o fluxo de trabalho.

## Os nós condicionais: fazer o fluxo de trabalho bifurcar

Já mencionados no capítulo anterior, esses nós merecem mais detalhe: o nó **IF** avalia uma condição e envia os dados por um de dois ramos (verdadeiro / falso); o nó **Switch** generaliza o princípio para vários ramos de acordo com o valor de um campo.

```text
Nó IF: condição = "valor > 1000"

  Entrada                    Saída "verdadeiro"    Saída "falso"
  [valor: 1500]  ------>     [valor: 1500]
  [valor: 50]    --------------------------->      [valor: 50]
```

Cada ramo leva então à sua própria sequência de ações (ex. um alerta específico para valores altos), antes de potencialmente se reunir mais adiante no fluxo de trabalho.

## O error workflow: o que fazer quando uma execução falha

Por padrão, um nó com falha interrompe a execução do fluxo de trabalho que o contém, sem nenhuma ação adicional automática. Um **error workflow** é um fluxo de trabalho separado, designado nas configurações de um fluxo de trabalho principal, que é disparado especificamente quando este último falha: ele recebe como entrada os detalhes do erro (qual nó, qual mensagem) e pode alertar uma equipe (Slack, email) ou tentar uma ação de compensação.

> **Cilada:** não configurar nenhum error workflow em um fluxo de trabalho crítico, supondo que uma falha será percebida de outra forma. Sem um alerta explícito, uma falha silenciosa (ex. um webhook que para de receber qualquer coisa por causa de um erro anterior) pode passar despercebida por muito tempo.
>
> **Boa prática:** configurar um error workflow ao menos para os fluxos de trabalho cuja falha tem um impacto real (perda de dados, ação de negócio não realizada), com um alerta que realmente chegue a uma pessoa responsável.

## Chamar um fluxo de trabalho a partir de outro

O nó **"Execute Workflow"** chama outro fluxo de trabalho n8n como se fosse uma subfunção, passando dados e recuperando seu resultado. Esse mecanismo permite fatorar uma lógica comum a vários fluxos de trabalho (ex. uma etapa de validação de dados reutilizada em todo lugar) em vez de duplicá-la em cada um.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um gatilho pode ser um webhook, um agendamento, um disparo manual, ou a chamada a partir de outro fluxo de trabalho. O Code node executa JS/Python para os casos fora do alcance dos conectores. Os nós IF/Switch fazem o fluxo de trabalho bifurcar de acordo com uma condição. Um error workflow é disparado especificamente quando o fluxo de trabalho principal falha. |
| **Ferramentas utilizáveis** | O Code node (JavaScript/Python); os nós IF e Switch; a configuração "error workflow"; o nó "Execute Workflow" para chamar outro fluxo de trabalho. |
| **Ciladas a evitar** | Usar o Code node por reflexo mesmo quando um nó pré-configurado bastaria. Não configurar nenhum error workflow em um fluxo de trabalho crítico. |
| **Boas práticas** | Reservar o Code node para os casos não cobertos por um nó existente, documentando-o. Configurar um error workflow com um alerta que realmente chegue a alguém, em qualquer fluxo de trabalho cuja falha tenha um impacto real. |
