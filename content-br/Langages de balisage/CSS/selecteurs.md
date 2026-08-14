---
order: 1
---

# Os seletores

Um **seletor** determina a quais elementos HTML uma regra CSS se aplica: do mais simples (uma tag) ao mais preciso (uma combinação de atributos e posição na árvore do documento).

## Seletores básicos

```css
h1 { }        /* todos os elementos <h1> */
.cartao { }   /* todos os elementos com class="cartao" */
#cabecalho { }  /* o unico elemento com id="cabecalho" */
* { }         /* absolutamente todos os elementos */
```

> **Nota:** uma `class` pode ser reutilizada em vários elementos, um `id` precisa continuar **único** em toda a página: um seletor `#id` então sempre mira em um único elemento específico, ao contrário de `.classe`.

## Combinadores

```css
article p { }    /* todo <p> descendente de <article>, em QUALQUER profundidade */
article > p { }  /* todo <p> FILHO DIRETO de <article>, nao mais fundo */
h2 + p { }       /* o <p> imediatamente APOS um <h2>, no mesmo nivel */
h2 ~ p { }       /* TODOS os <p> que seguem um <h2>, no mesmo nivel */
```

## Seletores de atributo

```css
input[type="email"] { }  /* todo <input> com esse atributo E esse valor exato */
a[href^="https"] { }     /* href que COMECA com "https" */
a[href$=".pdf"] { }      /* href que TERMINA com ".pdf" */
a[href*="exemplo"] { }   /* href que CONTEM "exemplo" em qualquer lugar */
```

## Pseudo-classes: mirar em um estado

```css
a:hover { }            /* quando o mouse passa sobre o elemento */
input:focus { }        /* quando o campo tem foco (clique ou tab) */
li:first-child { }     /* o primeiro filho de seu pai */
li:last-child { }      /* o ultimo filho de seu pai */
li:nth-child(2) { }    /* o 2o filho precisamente */
li:nth-child(odd) { }  /* todos os filhos impares (1o, 3o, 5o...) */
input:disabled { }     /* um campo desativado */
input:required { }     /* um campo marcado "required" no HTML (veja Os formulários) */
```

## Pseudo-elementos: mirar em uma parte de um elemento

```css
p::first-line { }             /* apenas a primeira linha exibida do paragrafo */
p::before { content: "→ "; }  /* insere conteudo ANTES do texto real do paragrafo */
p::after { content: " ✓"; }   /* insere conteudo DEPOIS */
```

> **Nota:** `::before`/`::after` exigem uma propriedade `content` para serem visíveis (mesmo vazia, `content: "";`), muito usados para adicionar um elemento puramente decorativo (ícone, seta...) sem sobrecarregar o HTML com uma tag adicional sem significado semântico real (veja [Semântica HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5)).

## A especificidade: o que acontece em caso de conflito?

```css
p { color: blue; }
.texto-importante { color: red; }
#paragrafo-unico { color: green; }
```

```html
<p id="paragrafo-unico" class="texto-importante">Qual cor?</p>
```

Um `id` tem uma especificidade mais forte que uma `class`, que por sua vez é mais forte que um seletor de tag: o parágrafo então será exibido em **verde** (`#paragrafo-unico` vence), qualquer que seja a ordem de escrita das regras no arquivo.

| Tipo de seletor | Peso (do mais fraco ao mais forte) |
|---|---|
| Seletor universal (`*`) | O mais fraco |
| Tag (`p`, `div`...) | Fraco |
| Classe (`.cartao`), atributo (`[type=...]`), pseudo-classe (`:hover`) | Médio |
| `id` (`#cabecalho`) | Forte |
| Estilo em linha (`style="..."`) | Muito forte |
| `!important` | Sobrepõe tudo o resto (evitar, veja [Variáveis CSS e a cascata](/?c=langages-de-balisage&s=css&p=variables-et-cascade)) |

Veja também [Variáveis CSS e a cascata](/?c=langages-de-balisage&s=css&p=variables-et-cascade), que detalha precisamente a ordem de resolução entre especificidade, ordem de escrita e origem da regra.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um seletor determina a quais elementos uma regra CSS se aplica, do mais simples (tag) ao mais preciso (atributos, posição, estado). Em caso de conflito, o seletor mais **específico** vence (id > classe > tag), senão a regra escrita por último. |
| **Ferramentas utilizáveis** | Seletores básicos, combinadores (`>`, `+`, `~`), seletores de atributo, pseudo-classes (`:hover`, `:nth-child`...), pseudo-elementos (`::before`/`::after`). |
| **Armadilhas a evitar** | Confundir especificidade com ordem de escrita: um seletor mais específico sempre vence, mesmo escrito antes de um seletor menos específico. |
| **Boas práticas** | Preferir classes a ids para o estilo comum (mais fáceis de reutilizar e sobrescrever); reservar `id` a um uso realmente único na página. |
