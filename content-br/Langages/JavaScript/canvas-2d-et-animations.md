---
order: 19
---

# Canvas 2D e animações

O elemento [HTML](/?c=langages&s=html&p=html) `<canvas>` expõe uma área de desenho programável, pixel a pixel, diretamente em JavaScript. Este capítulo cobre seu uso para uma animação fluida (loop de renderização, adaptação à densidade da tela) e um uso menos óbvio: medir texto sem nunca exibi-lo.

## Obter um contexto de desenho

```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');   // "2d": desenho 2D clássico (em oposição a "webgl")

ctx.fillStyle = 'rgba(2,96,231,0.5)';
ctx.fillRect(10, 10, 100, 50);         // retangulo preenchido: x, y, largura, altura
```

## Adaptar o desenho à densidade real da tela

Um pixel CSS (o tamanho exibido) nem sempre corresponde a um pixel físico da tela: uma tela de alta densidade (Retina, por exemplo) exibe vários por pixel CSS. `window.devicePixelRatio` dá esse fator, a ser aplicado para uma renderização nítida:

```javascript
function redimensionar() {
    // limite em 2: alem disso, custo desnecessário
    const proporcao = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    // resolução REAL do canvas (pixels fisicos)
    canvas.width  = Math.floor(rect.width  * proporcao);
    canvas.height = Math.floor(rect.height * proporcao);
    // para desenhar depois em coordenadas CSS
    ctx.setTransform(proporcao, 0, 0, proporcao, 0, 0);
}
```

`canvas.width`/`canvas.height` (a resolução interna, em pixels físicos) são deliberadamente distintos do tamanho CSS exibido (`rect.width`/`rect.height`): sem esse fator, o canvas continuaria nítido em uma tela padrão mas borrado em uma de alta densidade, com seus pixels internos esticados para preencher uma área fisicamente maior.

`ctx.setTransform(proporcao, 0, 0, proporcao, 0, 0)` compensa depois essa diferença: todo o código de desenho que segue pode continuar raciocinando em coordenadas CSS normais (`fillRect(10, 10, ...)`), sem nunca multiplicar manualmente cada coordenada pela proporção.

> **Armadilha:** limitar `devicePixelRatio` (aqui em 2) não é um erro de arredondamento, mas uma escolha deliberada: além disso, o ganho visual se torna imperceptível enquanto o número de pixels a calcular continua crescendo ao quadrado, um custo real sem benefício visível.

## O loop de animação: `requestAnimationFrame`

`requestAnimationFrame(callback)` pede ao navegador para chamar `callback` bem antes da próxima atualização de tela (geralmente 60 vezes por segundo), em vez de em um intervalo fixo como `setInterval`:

```javascript
function frame(agora) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // apaga a imagem anterior
    desenharCena(agora);
    requestAnimationFrame(frame);                         // reagenda a próxima chamada
}
requestAnimationFrame(frame);
```

`agora` (fornecido automaticamente pelo navegador, em milissegundos) permite basear a animação no **tempo real decorrido** em vez do número de chamadas: uma animação que avança um passo fixo a cada chamada de `frame` andaria mais rápido em uma tela de 144Hz do que em uma de 60Hz, enquanto uma animação baseada em `agora` mantém a mesma velocidade percebida, seja qual for a taxa de atualização.

> **Boa prática:** preferir `requestAnimationFrame` a `setInterval` para qualquer animação visual. O navegador pode sincronizar a chamada com sua própria atualização de tela (imagem mais fluida) e suspende automaticamente as chamadas de uma aba não visível (economia de recursos), algo que um `setInterval` nunca faz sozinho.

## O suavização exponencial: seguir um alvo sem solavancos

Fazer um elemento (um cursor animado, uma câmera) seguir uma posição alvo, quadro após quadro, sem que "pule" bruscamente a cada mudança de alvo, costuma usar uma **suavização exponencial** (também chamada *lerp* nesse contexto):

```javascript
let x = posicaoInicial;

function frame() {
    const alvo = calcularNovoAlvo();
    x += (alvo - x) * 0.04;   // avança 4% da distância restante a cada quadro
    desenharEm(x);
    requestAnimationFrame(frame);
}
```

A cada quadro, a posição nunca pula direto para o alvo: ela avança apenas uma fração (4% aqui) da distância que ainda a separa dele. O efeito percebido é um movimento que desacelera naturalmente ao se aproximar do alvo, em vez de uma parada brusca.

| Fator | Efeito |
|---|---|
| Perto de 0 (ex. 0.01) | Acompanhamento muito lento, efeito "inércia" pronunciado |
| Perto de 1 (ex. 0.5) | Acompanhamento quase instantâneo, pouca suavização perceptível |

## Medir texto sem nunca exibi-lo: `measureText()`

Um canvas 2D também serve, de forma indireta, para medir com precisão a largura que um texto ocuparia com uma determinada fonte, **sem nunca desenhar nem exibir esse canvas**:

```javascript
// nunca adicionado ao DOM
const ctxMedida = document.createElement('canvas').getContext('2d');

function larguraTexto(texto, tamanhoFonte = 11) {
    ctxMedida.font = `${tamanhoFonte}px sans-serif`;
    return ctxMedida.measureText(texto).width;
}
```

Esse número substitui com vantagem uma estimativa aproximada (uma largura média por caractere) para um cálculo de layout que depende da largura real de um texto (uma legenda que precisa saber se cabe em uma linha ou deve quebrar para a seguinte, por exemplo): `measureText()` usa a fonte real e dá a largura exata que esse texto realmente ocuparia na tela.

> **Armadilha:** usar uma fonte diferente entre `ctxMedida.font` e a realmente exibida na tela (tamanho, família de fonte). A medida deixaria então de ser fiel ao que é realmente exibido, o que pode reintroduzir a imprecisão que o `measureText()` deveria eliminar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `devicePixelRatio` adapta um canvas à densidade real da tela. `requestAnimationFrame` sincroniza uma animação com a atualização da tela e fornece um timestamp para uma velocidade independente da taxa de atualização. A suavização exponencial faz algo seguir um alvo sem solavancos. `measureText()` em um canvas nunca exibido mede um texto com precisão, sem exibi-lo. |
| **Ferramentas utilizáveis** | `getContext('2d')`, `devicePixelRatio`/`setTransform`, `requestAnimationFrame`, `measureText()`. |
| **Armadilhas a evitar** | Ignorar `devicePixelRatio` (renderização borrada em tela de alta densidade). Animar por passo fixo por chamada em vez de por tempo real decorrido (velocidade dependente da taxa de atualização). Medir um texto com uma fonte diferente da realmente exibida. |
| **Boas práticas** | Limitar `devicePixelRatio` a um valor razoável (2, por exemplo). Preferir `requestAnimationFrame` a `setInterval` para qualquer animação visual. Usar um fator de suavização perto de 0 para um efeito de inércia pronunciado, perto de 1 para um acompanhamento quase instantâneo. |
