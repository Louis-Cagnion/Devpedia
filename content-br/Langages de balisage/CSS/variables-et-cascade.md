---
order: 2
---

# Variáveis CSS e a cascata

Este capítulo aborda dois mecanismos transversais do CSS: as **variáveis personalizadas** (reutilizar um valor em vários locais) e a **cascata** (como o CSS resolve um conflito entre várias regras que visam o mesmo elemento): o «C» de CSS (*Cascading*) refere-se diretamente a este segundo mecanismo.

## As variáveis CSS (propriedades personalizadas)

```css
:root {
    --couleur-primaire: #3366cc;
    --espacement-standard: 16px;
}

.bouton {
    background-color: var(--couleur-primaire);
    padding: var(--espacement-standard);
}
```

`:root` Apointa para o elemento raiz do documento (`<html>`): declarar as variáveis neste local torna-as acessíveis em **toda** a folha de estilo. Alterar uma única vez `--couleur-primaire` atualiza instantaneamente todos os locais que a utilizam, sem necessidade de «procurar e substituir» em todo o arquivo.

```css
.bouton {
    background-color: var(--couleur-primaire, blue);   /* "blue" : valeur de secours si la variable n'existe pas */
}
```

## Variáveis locais de um componente

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    --marge-interne: 8px;   /* redéfinit la variable UNIQUEMENT pour les éléments avec cette classe supplémentaire */
}
```

> **Nota:** ao contrário de uma variável Sass/Less (resolvida de uma vez por todas na compilação), uma variável CSS nativa está **ativa** no navegador: pode ser alterada até mesmo em JavaScript (`elemento.style.setProperty('--marge-interne', '30px')`) e é reavaliada dinamicamente consoante o elemento em que é consultada.

## A cascata: três critérios, por esta ordem

Quando existem várias regras que visam o mesmo elemento e a mesma propriedade, o CSS distingue-as nesta ordem específica:

### 1. A importância (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignoré : la règle du dessus a !important */
```

`!important` ignora todo o resto da cadeia: uma regra com «`!important`» prevalece, independentemente da sua especificidade ou da ordem em que foi escrita.

> **Melhores práticas:** evite o uso corrente de `!important`: torna a depuração difícil (impossível de sobrecarregar de forma simples) e quebra a lógica natural da cadeia. Deve ser reservado para casos muito excecionais (muitas vezes para sobrecarregar um estilo de terceiros que não controlamos).

### 2. A especificidade (ver capítulo sobre os seletores)

```css
#bouton-principal { color: blue; }   /* spécificité : id -> plus fort */
.bouton { color: red; }                /* spécificité : classe -> plus faible */
```

O seletor mais específico prevalece, independentemente da ordem em que está escrito no arquivo.

### 3. A ordem de aparecimento (em caso de igualidade de especificidade)

```css
.bouton { color: blue; }
.bouton { color: red; }   /* GAGNE : même spécificité, mais écrite en dernier */
```

Em caso de igualdade de especificações, prevalece a regra declarada **em último lugar** no arquivo (ou no último arquivo carregado).

## A herança: algumas propriedades são transmitidas, outras não

```css
body {
    color: #333;         /* HÉRITÉ : tous les descendants (p, span, li...) reprennent cette couleur de texte */
    border: 1px solid;      /* PAS hérité : chaque élément a sa propre bordure, ou aucune */
}
```

As propriedades relacionadas com o **texto** (`color`, `font-family`, `font-size`, `line-height`...) são geralmente herdadas por padrão; as propriedades relacionadas com a **caixa** (`border`, `margin`, `padding`, `background`...) nunca o são: trata-se de um mecanismo distinto da cascata, embora interaja com ela (uma regra herdada tem a especificidade mais baixa possível, facilmente substituída por qualquer regra aplicada diretamente ao elemento).
