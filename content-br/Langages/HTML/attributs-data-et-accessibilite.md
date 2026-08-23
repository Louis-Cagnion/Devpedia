---
order: 7
---

# Atributos data-* e acessibilidade (ARIA)

Este capítulo cobre duas famílias de atributos transversais, utilizáveis em quase qualquer tag: os atributos `data-*` (armazenar um dado personalizado) e os atributos `aria-*` (melhorar a acessibilidade além do que a semântica HTML5 sozinha permite).

## Os atributos `data-*`

```html
<div data-id="42" data-role="cartao-produto" data-em-estoque="true">
    Cadeira de madeira
</div>
```

```javascript
const cartao = document.querySelector("div");
cartao.dataset.id;        // "42"
cartao.dataset.role;      // "cartao-produto"
cartao.dataset.emEstoque; // "true" -> "data-em-estoque" vira "emEstoque" em camelCase do lado JS
```

`data-*` permite anexar um dado a um elemento HTML, recuperável em [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) via `.dataset`: um jeito padrão de fazer uma informação circular do HTML para o JavaScript, sem precisar de variáveis globais ou requisições adicionais.

> **Nota:** qualquer nome depois de `data-` é válido (`data-qualquer-coisa`): a única regra é a conversão automática de **kebab-case** (palavras separadas por hífens, `data-em-estoque`) para **camelCase** (cada palavra seguinte colada e capitalizada, `emEstoque`) em JavaScript, uma simples convenção de nomenclatura, não um mecanismo próprio de `data-*`.

## A acessibilidade: por que isso importa

A acessibilidade web garante que uma página continue utilizável por pessoas com deficiência (deficiência visual usando um leitor de tela, motora navegando apenas pelo teclado...); não uma opção secundária, mas uma exigência legal em muitos contextos (sites públicos principalmente), e uma boa prática geral de qualidade de código.

## `alt` e semântica: as bases já vistas

Boa parte da acessibilidade decorre diretamente dos capítulos anteriores: `alt` nas imagens, `<label>` nos campos de formulário, hierarquia correta dos títulos, tags semânticas do HTML5 em vez de `<div>` genéricas.

## ARIA: complementar quando a semântica HTML sozinha não basta

O **ARIA** (*Accessible Rich Internet Applications*) adiciona informações de acessibilidade para componentes que o HTML nativo não descreve nativamente (uma aba personalizada, uma janela modal...):

```html
<button aria-label="Fechar a janela">✕</button>
```

`aria-label` fornece um texto alternativo para um leitor de tela, quando o conteúdo visível sozinho (aqui, apenas um símbolo `✕`) não basta para entender seu papel.

```html
<div role="alert">Sua sessao vai expirar em 2 minutos.</div>
```

`role="alert"` faz um leitor de tela anunciar imediatamente esse conteúdo assim que ele aparece, sem esperar que o usuário navegue até ele: útil para uma mensagem de erro ou uma notificação urgente que aparece dinamicamente.

```html
<button aria-expanded="false" aria-controls="menu-mobile">Menu</button>
<nav id="menu-mobile" hidden>...</nav>
```

`aria-expanded` indica se um elemento controlado (frequentemente via JavaScript) está atualmente aberto ou fechado; um leitor de tela anuncia esse estado, invisível de outra forma para quem não vê a mudança visual.

> **Regra de ouro do ARIA:** "*No ARIA is better than bad ARIA*": só usar ARIA para preencher uma lacuna real da semântica HTML nativa, nunca em substituição a uma tag HTML que já faria o trabalho corretamente. Um `<button>` nativo já gerencia nativamente o foco pelo teclado e o anúncio de seu papel; recriar esse comportamento na mão com um `<div role="button">` é quase sempre uma regressão, exceto necessidade absoluta.

## Navegação pelo teclado

```html
<button class="botao-personalizado">Botao personalizado</button>
```

Um `<button>` nativo já gerencia a acessibilidade pelo teclado (foco via Tab, ativação via Enter/Espaço) e o anúncio de seu papel por um leitor de tela: é por isso que a "regra de ouro" acima recomenda partir de um `<button>` de verdade, reestilizado em [CSS](/?c=langages-de-balisage&s=css&p=css) se necessário, em vez de recriar um botão a partir de uma `<div>`.

Se um caso específico realmente impede usar um `<button>` nativo, recriar seu comportamento exige mais do que apenas `tabindex`/`role`:

```html
<div tabindex="0" role="button" id="meu-botao">Botao personalizado</div>
```

```javascript
const botao = document.getElementById("meu-botao");
botao.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        botao.click();   // dispara o mesmo comportamento de um clique
    }
});
```

`tabindex="0"` torna o elemento focável via Tab e `role="button"` anuncia seu papel para um leitor de tela, mas **nenhum dos dois dispara a ativação pelo teclado** (Enter/Espaço); ao contrário de um `<button>` de verdade, que faz isso nativamente. Sem esse manipulador `keydown` explícito, o elemento continuaria focável mas inutilizável pelo teclado: exatamente a armadilha que a regra de ouro do ARIA busca evitar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `data-*` anexa um dado personalizado a um elemento, recuperável em JavaScript via `.dataset`. `aria-*` complementa a acessibilidade quando a semântica HTML nativa não basta (componentes personalizados). |
| **Ferramentas utilizáveis** | `.dataset` em JavaScript; `aria-label`, `role`, `aria-expanded`. |
| **Armadilhas a evitar** | Recriar um `<div role="button">` sem gerenciar você mesmo o foco pelo teclado e a ativação (Enter/Espaço); um `<button>` de verdade faz tudo isso nativamente. |
| **Boas práticas** | "No ARIA is better than bad ARIA": só usar ARIA para preencher uma lacuna real, nunca em substituição a uma tag HTML nativa que já faria o trabalho. |
