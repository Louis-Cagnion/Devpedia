---
order: 4
---

# n8n: o formato JSON de um fluxo de trabalho

Por baixo da interface visual, um fluxo de trabalho n8n não é nada além de um arquivo [JSON](/?c=infrastructure-devops&s=infrastructure&p=json): cada nó colocado no canvas e cada conexão traçada entre eles aparece ali de forma legível. Entender essa estrutura permite exportar, compartilhar e versionar um fluxo de trabalho como qualquer outro arquivo de configuração.

## Exportar e importar

O menu do fluxo de trabalho (três pontos, no canto superior direito do editor) oferece **"Download"**, que baixa o fluxo de trabalho inteiro como um arquivo `.json`. Ao contrário, **"Import from File"** recarrega um fluxo de trabalho a partir desse arquivo. Também existe um atalho para parte do canvas: selecionar nós e então `Ctrl+C`/`Ctrl+V` copia e cola seu JSON, mesmo entre duas abas diferentes do n8n.

## A estrutura geral

Um fluxo de trabalho exportado se organiza em torno de duas chaves principais, `nodes` e `connections`, junto com informações gerais sobre o próprio fluxo de trabalho (nome, status ativo ou não, configurações):

```json
{
  "name": "Notificar um novo pedido",
  "active": false,
  "nodes": [ /* a lista de nós, detalhada mais abaixo */ ],
  "connections": { /* os vínculos entre nós, detalhados mais abaixo */ },
  "settings": {}
}
```

## Um nó no JSON

Cada nó do canvas corresponde a um objeto no array `nodes`: seu nome (como exibido no canvas), seu tipo (qual conector ou qual função), sua posição visual, e seus **parâmetros** (o conteúdo realmente configurado no painel visto no primeiro capítulo):

```json
{
  "name": "Enviar uma mensagem no Slack",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 1,
  "position": [900, 300],
  "parameters": {
    "channel": "vendas",
    "text": "Novo pedido recebido"
  },
  "credentials": {
    "slackApi": {
      "id": "17",
      "name": "slack_credentials"
    }
  }
}
```

O campo `credentials` contém apenas uma **referência** (um id e um nome) a credenciais armazenadas separadamente pelo n8n, nunca a senha ou a chave de API em si: um arquivo exportado pode, portanto, ser compartilhado sem revelar nenhum segredo, mas continua inutilizável do jeito que está até que as credenciais correspondentes sejam reconfiguradas na instância de destino.

## As conexões: quem envia seus dados para quem

O objeto `connections` associa o **nome** de um nó de origem à lista de nós que recebem seus dados de saída:

```json
{
  "connections": {
    "Novo pedido": {
      "main": [
        [
          { "node": "Enviar uma mensagem no Slack", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

Essa estrutura aninhada (um array de arrays) existe para representar os nós com várias saídas (como os nós IF ou Switch vistos no capítulo anterior): cada saída do nó de origem tem seu próprio array de nós de destino, na ordem em que aparecem no canvas.

> **Cilada:** modificar o nome de um nó diretamente no JSON bruto, esquecendo que esse nome é usado como chave no objeto `connections`. Um nome dessincronizado quebra silenciosamente o vínculo entre os dois nós envolvidos na próxima importação.
>
> **Boa prática:** renomear um nó a partir do editor visual em vez de no JSON bruto; o n8n então se encarrega de atualizar automaticamente todas as referências em `connections`.

## O formato dos dados que circulam

Além do próprio arquivo do fluxo de trabalho, é útil conhecer o formato dos **dados** que cada nó manipula internamente (visível no painel de execução): o n8n sempre faz circular um array de objetos, cada um contendo uma chave `json` (dados comuns) ou `binary` (um arquivo):

```json
[
  {
    "json": {
      "cliente": "Alice",
      "valor": 149.90
    }
  }
]
```

É essa mesma estrutura que um Code node manipula (ver o capítulo anterior) via `$input.all()`.

## Versionar um fluxo de trabalho como código

Como um fluxo de trabalho é apenas um arquivo de texto estruturado, nada impede de fazer commit dele em um repositório [Git](/?c=qualite-performance-et-outils&s=git&p=commandes-essentielles): o histórico de suas versões, as diferenças entre duas versões (`git diff`), e uma revisão antes de uma mudança se tornam então possíveis, exatamente como para código-fonte comum.

> **Cilada:** fazer commit de um export de fluxo de trabalho sem ter verificado que ele não contém nenhum dado sensível fixo nos `parameters` (uma URL com um token de acesso em texto puro, por exemplo): ao contrário das `credentials`, um valor digitado diretamente em um campo de texto é exportado tal como está.
>
> **Boa prática:** usar as credenciais do n8n, ou variáveis de ambiente, para qualquer valor sensível, nunca um campo de texto fixo, para que um export continue seguro de compartilhar ou versionar.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um fluxo de trabalho exportado é um JSON com duas chaves principais: `nodes` (nome, tipo, posição, parâmetros) e `connections` (qual nó envia seus dados para qual outro, por nome). As `credentials` armazenam apenas uma referência, nunca o segredo em si. Os dados que circulam entre nós são sempre um array de objetos `{json: ...}` ou `{binary: ...}`. |
| **Ferramentas utilizáveis** | "Download"/"Import from File" para exportar/importar; `Ctrl+C`/`Ctrl+V` para copiar uma seleção de nós; Git para versionar um fluxo de trabalho como código. |
| **Ciladas a evitar** | Renomear um nó diretamente no JSON bruto, dessincronizando as referências em `connections`. Fazer commit de um export contendo um dado sensível fixo em um parâmetro. |
| **Boas práticas** | Renomear um nó a partir do editor visual, nunca no JSON bruto. Usar as credenciais do n8n ou variáveis de ambiente para qualquer valor sensível antes de compartilhar ou versionar um export. |
