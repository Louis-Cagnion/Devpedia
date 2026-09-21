---
order: 21
---

# A biblioteca de gráficos Apache ECharts

Desenhar um gráfico (barras, linhas, setores) na mão em um [`<canvas>`](/?c=langages&s=javascript&p=canvas-2d-et-animations) exige desenhar cada elemento você mesmo: eixos, escala, curvas, legenda, dica ao passar o cursor. Este capítulo cobre o [Apache ECharts](https://echarts.apache.org/), uma biblioteca JavaScript de gráficos que substitui esse desenho manual por um único objeto de configuração.

## Configuração declarativa em vez de desenho manual

O ECharts recebe como entrada um objeto que descreve o resultado desejado (abordagem **declarativa**), não os passos para chegar lá (abordagem **imperativa**, a do canvas): a biblioteca calcula sozinha as posições, a escala e a renderização.

| | Canvas 2D (imperativo) | ECharts (declarativo) |
|---|---|---|
| O que se escreve | Cada instrução de desenho (`fillRect`, `moveTo`, `lineTo`...) | Um objeto de configuração (`option`) descrevendo o resultado desejado |
| Atualizar um valor | Apagar e redesenhar você mesmo toda a área | `chart.setOption()` apenas com os dados novos |
| Dica ao passar o cursor | Programada na mão (detecção de posição, exibição) | Incluída, ativada pela chave `tooltip` |

## Inicializar um gráfico em um contêiner

`echarts.init()` vincula um gráfico a um elemento do [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (uma tag vazia, com um tamanho definido em CSS); `setOption()` então aplica uma configuração a ele:

```javascript
const chart = echarts.init(document.querySelector('#meu-grafico'));

const option = {
    xAxis: { type: 'category', data: ['T1', 'T2', 'T3', 'T4'] },   // categorias exibidas no eixo horizontal
    yAxis: { type: 'value' },                                      // eixo vertical numerico, escala automatica
    tooltip: {},                                                   // dica exibida ao passar o cursor sobre uma barra
    series: [{ type: 'bar', data: [120, 200, 150, 80] }]           // uma "serie" = um conjunto de barras/pontos a desenhar
};

chart.setOption(option);   // aplica a configuracao: o grafico se desenha
```

> **Boa prática:** um `option` continua sendo um objeto JavaScript comum, gerado dinamicamente a partir dos dados reais (uma resposta de API, um cálculo) em vez de escrito à mão: montar suas chaves (`xAxis.data`, `series[].data`) a partir dos dados a exibir, nunca o contrário.

## Atualizar os dados sem redesenhar tudo: `setOption()`

Uma chamada a `setOption()` com um objeto parcial mescla os novos valores à configuração existente: só as partes alteradas são recalculadas e redesenhadas, sem reconstruir os eixos nem a legenda do zero.

```javascript
// Adiciona uma quinta categoria e seu valor, sem recriar o grafico inteiro
chart.setOption({
    xAxis: { data: ['T1', 'T2', 'T3', 'T4', 'T5'] },
    series: [{ data: [120, 200, 150, 80, 175] }]
});
```

## Adaptar o gráfico ao tamanho do seu contêiner: `resize()`

Por padrão, um gráfico ECharts mantém o tamanho que tinha na inicialização: redimensionar a janela não o redimensiona sozinho. É preciso escutar o [evento `resize`](/?c=langages&s=javascript&p=dom-et-evenements#escutar-eventos) e pedir explicitamente um novo cálculo de tamanho:

```javascript
window.addEventListener('resize', () => chart.resize());
```

> **Cilada:** esquecer esse escutador. O contêiner (uma `<div>`) até segue o CSS responsivo da página, mas o gráfico desenhado dentro dele fica congelado no tamanho original: uma área vazia aparece ao lado, ou o gráfico transborda de um contêiner que ficou menor.

## Liberar memória quando o gráfico desaparece: `dispose()`

Em uma [aplicação de página única (SPA)](/?c=langages&s=javascript&p=ssr-vs-csr#csr-o-servidor-envia-uma-casca-vazia), um componente de gráfico é criado e destruído a cada navegação. Remover a `<div>` do DOM não basta para liberar o gráfico: `echarts.init()` registrou seu próprio gerenciador de redimensionamento e alocou recursos de renderização, que permanecem ativos enquanto `chart.dispose()` não tiver sido chamado explicitamente.

```javascript
chart.dispose();   // chamar antes de remover o container do DOM
```

> **Cilada:** um componente de gráfico que se destrói sem chamar `dispose()` acumula um gráfico fantasma a cada navegação: o escutador `resize` definido acima continua rodando sobre um gráfico que não existe mais visualmente, um vazamento de memória clássico em uma SPA com navegação frequente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O ECharts descreve um gráfico com um único objeto `option` (`series`, `xAxis`/`yAxis`, `tooltip`) em vez de instruções de desenho (abordagem declarativa versus imperativa). `echarts.init()` o vincula a um elemento do DOM, `setOption()` o exibe ou o atualiza parcialmente. |
| **Ferramentas utilizáveis** | `echarts.init()`, `chart.setOption()`, `chart.resize()`, `chart.dispose()`. |
| **Ciladas a evitar** | Esquecer de escutar `resize` (gráfico congelado no tamanho inicial). Esquecer `dispose()` antes de remover o contêiner do DOM (vazamento de memória, sobretudo em uma SPA). |
| **Boas práticas** | Gerar o objeto `option` dinamicamente a partir dos dados reais em vez de escrevê-lo à mão. Atualizar um gráfico existente via `setOption()` parcial em vez de recriá-lo por completo. |
