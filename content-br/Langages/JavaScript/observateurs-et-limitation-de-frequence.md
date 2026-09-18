---
order: 16
---

# Observadores do navegador e limitação de frequência

O [capítulo sobre o DOM](/?c=langages&s=javascript&p=dom-et-evenements) cobre os eventos disparados por uma ação explícita (um clique, uma tecla pressionada). Este capítulo cobre outras duas necessidades: reagir a uma mudança que **não** é um evento clássico (um elemento que se torna visível, o conteúdo de uma página que muda), e limitar a frequência de execução de uma função chamada com frequência demais.

## `IntersectionObserver`: detectar que um elemento se torna visível

Antes do `IntersectionObserver`, saber se um elemento estava visível na tela exigia recalcular sua posição a cada rolagem (`scroll`), um cálculo caro repetido em loop. O `IntersectionObserver` inverte o problema: o navegador avisa sozinho assim que um elemento entra ou sai da área visível, sem recálculo manual.

```javascript
const sentinela = document.querySelector('.sentinela-paginacao');

const observador = new IntersectionObserver((entradas) => {
    if (entradas[0].isIntersecting) {   // a sentinela acabou de entrar na area visivel
        carregarProximaPagina();
    }
}, { rootMargin: '200px' });            // dispara 200px ANTES de a sentinela estar realmente visivel

observador.observe(sentinela);
```

Esse padrão (uma "sentinela" invisível no final de uma lista, que dispara o carregamento da próxima página assim que se aproxima da área visível) implementa o **scroll infinito**: `rootMargin` antecipa o disparo, para que o conteúdo seguinte já esteja carregado quando o usuário realmente chegar até ele, em vez de depois.

> **Boa prática:** sempre chamar `observador.disconnect()` assim que a observação deixar de ser necessária (todo o conteúdo já carregado, o elemento removido da página), para liberar a referência e evitar um callback que continua rodando sobre um elemento que não precisa mais de vigilância.

## `MutationObserver`: reagir a uma mudança do DOM sem sondar em loop

O `MutationObserver` avisa o código quando o DOM muda (adição/remoção de elementos, mudança de atributo...), sem precisar checar "mudou?" em loop (*polling*):

```javascript
const container = document.getElementById('mensagens');

const observador = new MutationObserver(() => {
    rolarParaBaixo();
});

observador.observe(container, { childList: true, subtree: true });
```

`{ childList: true, subtree: true }` especifica o que vigiar: a adição/remoção de filhos diretos (`childList`), inclusive em qualquer profundidade sob `container` (`subtree`). Sem `subtree`, um filho adicionado a um neto de `container` não dispararia nada.

> **Armadilha:** o `MutationObserver` só detecta mudanças de **estrutura do DOM** ou de **atributo HTML**. Escrever `meuSelect.value = "x"` muda a propriedade JavaScript `value` de um `<select>`, mas não modifica nenhum atributo HTML nem a estrutura do DOM: nenhuma mutação é jamais notificada para esse tipo de escrita, mesmo observando `attributes: true`. Veja [interceptar um setter de propriedade](/?c=langages&s=javascript&p=intercepter-un-setter-de-propriete) para a técnica que cobre essa lacuna.

## `ResizeObserver`: reagir à mudança de tamanho de um elemento

Terceiro membro da mesma família "callback na mudança, sem sondar em loop": `IntersectionObserver` vigia a *visibilidade*, `MutationObserver` a *estrutura do DOM*, `ResizeObserver` vigia as *dimensões* de um elemento específico, independentemente do evento global `resize` da janela.

```javascript
const tabela = document.querySelector('.tabela-larga');

const observador = new ResizeObserver((entradas) => {
    const largura = entradas[0].contentRect.width;
    tabela.classList.toggle('modo-compacto', largura < 600);   // muda assim que falta espaco
});

observador.observe(tabela);
```

`resize` só é disparado com uma mudança de tamanho da JANELA inteira; um elemento pode, no entanto, mudar de largura por muitas outras razões (uma barra lateral que aparece, uma fonte que carrega, um pai que muda de layout) sem que nenhum `resize` ocorra. `ResizeObserver` detecta também esses casos, observando diretamente o próprio elemento.

> **Boa prática:** preferir `ResizeObserver` ao evento `resize` assim que a mudança depender do espaço realmente disponível para UM elemento específico, não da largura da janela inteira (veja também as [container queries](/?c=langages&s=css&p=responsive-et-media-queries), o equivalente CSS puro da mesma necessidade, sem JavaScript).

## Debounce e throttle: duas formas de limitar a frequência de uma função

Alguns eventos (`resize`, `scroll`, `input`) disparam dezenas de vezes por segundo. Executar uma função cara a cada disparo pode deixar a página inteira mais lenta. Duas técnicas limitam a frequência de execução, mas com lógicas opostas:

| | Debounce | Throttle |
|---|---|---|
| Princípio | Espera uma pausa de inatividade antes de executar | Executa no máximo uma vez por intervalo fixo |
| Efeito sobre uma rajada contínua | Uma única execução, depois do fim da rajada | Várias execuções regulares, espaçadas, durante a rajada |
| Uso típico | Busca em tempo real (esperar o usuário terminar de digitar) | Reiniciar um timer de inatividade (limitar, sem nunca bloquear completamente) |

```javascript
// Debounce: so executa depois de 300ms sem nova chamada
function debounce(fn, atraso) {
    let temporizador = null;
    return (...args) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => fn(...args), atraso);
    };
}
```

```javascript
// Throttle: trava as chamadas seguintes por 1000ms apos a primeira
let travado = false;

function aoDetectarAtividade() {
    if (travado) return;
    travado = true;
    setTimeout(() => { travado = false; }, 1000);

    reiniciarTimerInatividade();
}
```

O throttle acima deliberadamente não usa `setInterval`: a trava é liberada uma única vez, 1000ms depois da primeira chamada da rajada, e então a próxima chamada pode passar de novo e ativa sua própria trava nova. É a forma mais simples de um throttle (chamada *leading edge*: executa imediatamente na primeira chamada em vez de esperar o fim do intervalo).

> **Armadilha:** aplicar um debounce onde na verdade um throttle é necessário. Em um timer de inatividade reiniciado a cada movimento do mouse, um debounce nunca reiniciaria nada enquanto o mouse continuar se movendo (a pausa de inatividade nunca chega): exatamente o oposto do comportamento buscado.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O `IntersectionObserver` detecta a visibilidade de um elemento sem recálculo manual no scroll (scroll infinito). O `MutationObserver` reage a uma mudança do DOM sem sondar em loop, mas não vê nem propriedades JS atribuídas diretamente nem mudanças fora do DOM. O `ResizeObserver` detecta a mudança de dimensões de um elemento específico, sem depender do `resize` da janela. Debounce espera uma pausa antes de executar; throttle executa no máximo uma vez por intervalo. |
| **Ferramentas utilizáveis** | `IntersectionObserver` (`rootMargin`, `isIntersecting`), `MutationObserver` (`childList`/`subtree`/`attributes`), `ResizeObserver` (`contentRect`), um debounce/throttle caseiro via `setTimeout`. |
| **Armadilhas a evitar** | Esquecer `observador.disconnect()` assim que a observação deixar de ser necessária. Esperar uma mutação DOM em uma propriedade JS atribuída diretamente (`select.value = x`). Confundir debounce e throttle em uma necessidade de reinício repetido. |
| **Boas práticas** | `rootMargin` para pré-carregar antes de o elemento estar realmente visível. `subtree: true` assim que a mudança puder ocorrer em qualquer profundidade. `ResizeObserver` em vez do evento `resize` para uma mudança que depende do espaço de um elemento específico. Escolher debounce para uma ação final única depois de uma rajada, throttle para um teto regular durante a rajada. |
