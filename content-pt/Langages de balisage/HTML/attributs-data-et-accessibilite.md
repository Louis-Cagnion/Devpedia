---
order: 7
---

# Atributos data-* e acessibilidade (ARIA)

Este capítulo aborda duas famílias de atributos transversais, que podem ser utilizados em praticamente qualquer baliza: os atributos «`data-*`» (armazenar dados personalizados) e os atributos «`aria-*`» (melhorar a acessibilidade para além do que a semântica HTML5 por si só permite).

## Os atributos`data-*`

```html
<div data-id="42" data-role="carte-produit" data-en-stock="true">
    Chaise en bois
</div>
```

```javascript
const carte = document.querySelector("div");
carte.dataset.id;         // «42»
carte.dataset.role;         // «ficha do produto»
carte.dataset.enStock;       // «true» -> «data-en-stock» passa a ser «enStock» em camelCase no lado do JS
```

`data-*` permite associar um valor a um elemento HTML, que pode ser recuperado em JavaScript através de `.dataset` — uma forma padrão de transmitir informação do HTML para o JavaScript, sem necessidade de variáveis globais ou de chamadas adicionais.

> **Nota:** qualquer nome após `data-` é válido (`data-nimporte-quoi`) — a única regra é a conversão automática de kebab-case (`data-en-stock`) para camelCase (`enStock`) em JavaScript (ver o capítulo sobre variáveis, secção JavaScript, para esta convenção de nomenclatura).

## Acessibilidade: por que é importante

A acessibilidade na Web garante que uma página continue a ser utilizável por pessoas com deficiência (deficiência visual com um leitor de tela, deficiência motora ao navegar apenas com o teclado...) — não é uma opção secundária, mas sim uma exigência legal em muitos contextos (nomeadamente em sites públicos) e uma boa prática geral de qualidade do código.

## `alt` e semântica: os conceitos básicos já abordados

Grande parte da acessibilidade decorre diretamente dos capítulos anteriores: `alt` sobre imagens, `<label>` sobre campos de formulário, hierarquia correta dos títulos, etiquetas semânticas HTML5 em vez de `<div>` genéricas.

## ARIA: a utilizar quando a semântica HTML, por si só, não for suficiente

**O ARIA** (*Accessible Rich Internet Applications*) adiciona informações de acessibilidade a componentes que o HTML nativo não descreve de forma nativa (um separador personalizado, uma janela modal, etc.):

```html
<button aria-label="Fermer la fenêtre">✕</button>
```

`aria-label` Fornece um texto alternativo para um leitor de tela, quando o conteúdo visível por si só (neste caso, apenas um símbolo `✕`) não é suficiente para compreender a sua função.

```html
<div role="alert">Votre session va expirer dans 2 minutes.</div>
```

`role="alert"` faz com que este conteúdo seja imediatamente anunciado por um leitor de tela assim que aparece, sem esperar que o usuário navegue até ele — útil para uma mensagem de erro ou uma notificação urgente que surja dinamicamente.

```html
<button aria-expanded="false" aria-controls="menu-mobile">Menu</button>
<nav id="menu-mobile" hidden>...</nav>
```

`aria-expanded` indica se um elemento controlado (frequentemente através de JavaScript) está atualmente aberto ou fechado — um leitor de tela anuncia este estado, que de outra forma seria invisível para alguém que não consiga perceber a alteração visual.

> **Regra de ouro do ARIA:** *«Melhor nenhum ARIA do que um ARIA mal feito*» — utilize o ARIA apenas para colmatar uma lacuna real na semântica nativa do HTML, nunca em substituição de uma baliza HTML que já cumpra a sua função corretamente. Um «`<button>`» nativo já gere nativamente o foco do teclado e a indicação da sua função — recriar este comportamento manualmente com um «`<div role="button">`» é quase sempre um retrocesso, salvo em caso de necessidade absoluta.

## Navegação com o teclado

```html
<button class="bouton-personnalise">Bouton personnalisé</button>
```

Um «`<button>`» nativo já suporta a acessibilidade do teclado (foco através da tecla Tab, ativação através das teclas Enter/Espaço) e a leitura da sua função por um leitor de tela — é por isso que a «regra de ouro» acima recomenda partir de um verdadeiro «`<button>`», redesenhado em CSS, se necessário, em vez de recriar um botão a partir de um `<div>`.

Se um caso específico impedir efetivamente a utilização de um «`<button>`» nativo, recriar o seu comportamento requer mais do que apenas «`tabindex`» / «`role`»:

```html
<div tabindex="0" role="button" id="mon-bouton">Bouton personnalisé</div>
```

```javascript
const bouton = document.getElementById("mon-bouton");
bouton.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter" || evenement.key === " ") {
        evenement.preventDefault();
        bouton.click();   // provoca o mesmo comportamento que um clique
    }
});
```

`tabindex="0"` torna o elemento selecionável através das teclas Tab e `role="button"` indica a sua função a um leitor de tela, mas **nenhuma das duas opções aciona a ativação pelo teclado** (Enter/Barra de Espaço) — ao contrário de um verdadeiro `<button>`, que o faz de forma nativa. Sem este gestor `keydown` explícito, o elemento continuaria a poder receber o foco, mas seria inutilizável através do teclado: exatamente a armadilha que a regra de ouro da ARIA procura evitar.
