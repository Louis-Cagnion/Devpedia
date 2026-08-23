---
order: 4
---

# As tabelas HTML

Uma tabela HTML serve para representar dados **tabulares** (linhas/colunas realmente ligadas entre si, como uma exportação de banco de dados, veja [SQL](/?c=domain-specific-languages-dsl&p=sql)); nunca para diagramar visualmente uma página inteira, um uso histórico hoje substituído pelo [CSS](/?c=langages-de-balisage&s=css&p=css) ([Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)).

## Estrutura básica

```html
<table>
    <thead>
        <tr>
            <th>Nome</th>
            <th>Cidade</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Joao</td>
            <td>Sao Paulo</td>
        </tr>
        <tr>
            <td>Maria</td>
            <td>Rio de Janeiro</td>
        </tr>
    </tbody>
</table>
```

- `<table>`: o contêiner da tabela inteira.
- `<thead>`: o cabeçalho (frequentemente uma única linha, os títulos das colunas).
- `<tbody>`: o corpo da tabela (os dados em si).
- `<tr>` (*table row*): uma linha.
- `<th>` (*table header*): uma célula de cabeçalho (geralmente em negrito por padrão, e anunciada diferente por um leitor de tela).
- `<td>` (*table data*): uma célula de dado comum.

## Mesclar células

```html
<table>
    <tr>
        <td colspan="2">Mescla 2 colunas</td>
    </tr>
    <tr>
        <td rowspan="2">Mescla 2 linhas</td>
        <td>Celula normal</td>
    </tr>
    <tr>
        <td>Celula normal</td>
    </tr>
</table>
```

`colspan` estende uma célula por várias colunas, `rowspan` por várias linhas.

## Rodapé de tabela

```html
<table>
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot>
        <tr>
            <td>Total</td>
            <td>2 linhas</td>
        </tr>
    </tfoot>
</table>
```

## Acessibilidade e legenda

```html
<table>
    <caption>Distribuicao dos clientes por cidade</caption>
    <thead>
        <tr>
            <th scope="col">Nome</th>
            <th scope="col">Cidade</th>
        </tr>
    </thead>
    ...
</table>
```

- `<caption>`: um título associado à tabela, anunciado pelos leitores de tela antes de seu conteúdo.
- `scope="col"` (ou `"row"`) em um `<th>`: especifica explicitamente se esse cabeçalho se aplica a uma coluna inteira ou uma linha inteira; indispensável para que um leitor de tela anuncie o cabeçalho correto ao percorrer cada célula de uma tabela complexa.

> **Nota (boa prática):** nunca usar `<table>` para organizar o layout geral de uma página (menu, colunas de conteúdo...): esse uso, comum antes da chegada do CSS moderno, quebra a semântica do documento (um leitor de tela anunciaria dados tabulares onde não há nenhum) e torna a página difícil de tornar responsiva.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `<table>` representa dados tabulares realmente ligados entre si; nunca um layout geral. `<thead>`/`<tbody>`/`<tfoot>` estruturam a tabela; `colspan`/`rowspan` mesclam células. |
| **Ferramentas utilizáveis** | `<caption>` (título da tabela), `scope="col"`/`"row"` em um `<th>` para a acessibilidade. |
| **Armadilhas a evitar** | Usar `<table>` para o layout geral de uma página: quebra a semântica e complica a responsividade. |
| **Boas práticas** | Sempre associar um `scope` a cada `<th>` de uma tabela complexa, para que um leitor de tela anuncie o cabeçalho correto por célula. |
