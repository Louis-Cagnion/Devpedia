---
order: 4
---

# As tabelas HTML

Uma tabela HTML serve para representar dados **tabulares** (linhas/colunas efetivamente interligadas, como uma exportação de uma base de dados, ver capítulo sobre SQL) — nunca para formatar visualmente uma página inteira, uma utilização histórica hoje substituída pelo CSS (`flexbox` / `grid`, ver capítulos dedicados).

## Estrutura básica

```html
<table>
    <thead>
        <tr>
            <th>Nom</th>
            <th>Ville</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Jean</td>
            <td>Lyon</td>
        </tr>
        <tr>
            <td>Marie</td>
            <td>Paris</td>
        </tr>
    </tbody>
</table>
```

- `<table>` : o contentor da matriz inteira.
- `<thead>` : o cabeçalho (geralmente uma única linha, com os títulos das colunas).
- `<tbody>` : o corpo da tabela (os próprios dados).
- `<tr>` (*linha da tabela*): uma linha.
- `<th>` (*cabeçalho da tabela*): uma célula de cabeçalho (geralmente a negrito por padrão e anunciada de forma diferente por um leitor de tela).
- `<td>` (*dados da tabela*): uma célula de dados clássica.

## Unir células

```html
<table>
    <tr>
        <td colspan="2">Fusionne 2 colonnes</td>
    </tr>
    <tr>
        <td rowspan="2">Fusionne 2 lignes</td>
        <td>Cellule normale</td>
    </tr>
    <tr>
        <td>Cellule normale</td>
    </tr>
</table>
```

`colspan` estende uma célula por várias colunas, `rowspan` por várias linhas.

## Nota de rodapé

```html
<table>
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot>
        <tr>
            <td>Total</td>
            <td>2 lignes</td>
        </tr>
    </tfoot>
</table>
```

## Acessibilidade e legenda

```html
<table>
    <caption>Répartition des clients par ville</caption>
    <thead>
        <tr>
            <th scope="col">Nom</th>
            <th scope="col">Ville</th>
        </tr>
    </thead>
    ...
</table>
```

- `<caption>` : um título associado à tabela, anunciado pelos leitores de tela antes do seu conteúdo.
- `scope="col"` (ou `"row"`) num `<th>`: especifica explicitamente se este cabeçalho se aplica a toda uma coluna ou a toda uma linha — essencial para que um leitor de tela anuncie o cabeçalho correto ao percorrer cada célula de uma tabela complexa.

> **Nota (melhor prática):** nunca utilizar `<table>` para organizar o layout geral de uma página (menu, colunas de conteúdo...) — esta prática, comum antes da chegada do CSS moderno, compromete a semântica do documento (um leitor de tela anunciaria dados tabulares onde não existem) e dificulta a adaptação da página a dispositivos móveis.
