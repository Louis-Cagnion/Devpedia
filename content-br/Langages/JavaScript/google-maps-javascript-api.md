---
order: 18
---

# A API JavaScript do Google Maps

Exibir um mapa interativo em uma página web (marcadores, um mapa base navegável) normalmente exige carregar uma biblioteca de terceiros. Este capítulo cobre a API JavaScript do [Google Maps](https://developers.google.com/maps/documentation/javascript), com seu carregamento diferido oficial, o agrupamento visual de marcadores numerosos, e as duas formas de desenhar um marcador.

## Carregar a biblioteca sob demanda: `importLibrary()`

Um mapa completo do Google Maps usa várias sub-bibliotecas independentes (`maps` para o mapa em si, `marker` para os marcadores...), cada uma inútil enquanto não for realmente usada. Em vez de carregar todas de uma vez ao carregar a página, o Google fornece um pequeno script de inicialização (*bootstrap loader*): ele só carrega o script real da API na primeira chamada a `google.maps.importLibrary()`, e armazena em cache as chamadas seguintes.

```javascript
// Carrega apenas as sub-bibliotecas pedidas, na 1a vez que são necessarias
const { Map } = await google.maps.importLibrary('maps');
const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
```

> **Nota:** esse script de inicialização é fornecido tal como está pelo Google (para colar na página), deliberadamente minificado e condensado em uma única expressão: não há motivo para reescrevê-lo à mão, apenas entender o que ele faz uma vez expandido, como acima.

## Agrupar marcadores numerosos: o clustering

Exibir centenas de marcadores próximos uns dos outros, em um nível de zoom baixo, torna o mapa ilegível (marcadores sobrepostos). Uma biblioteca de **clustering** (agrupamento visual) como [`@googlemaps/markerclusterer`](https://github.com/googlemaps/js-markerclusterer) substitui um grupo de marcadores próximos por um único selo mostrando sua quantidade, que se desagrupa automaticamente ao dar zoom:

```javascript
const agrupador = new markerClusterer.MarkerClusterer({
    map,
    markers: listaDeMarcadores,
});
```

O clustering funciona por **posição na tela**, recalculada a cada mudança de zoom: não precisa de nenhuma configuração de distância ou limiar para funcionar corretamente no caso comum.

## Dispersar marcadores estritamente colocalizados

O clustering resolve a legibilidade à distância, mas não um caso específico: várias entradas que compartilham exatamente as **mesmas** coordenadas (por exemplo, várias fichas do mesmo estabelecimento). Mesmo com o zoom máximo, um marcador ficaria invisível sob o outro, estritamente sobreposto, sem que nenhum clique pudesse alcançá-lo. A solução consiste em deslocar cada marcador colocalizado segundo um pequeno círculo, em um raio fixo:

```javascript
const RAIO_DISPERSAO = 0.00020;   // ~20m no equador

function dispersarColocalizados(pontos) {
    const grupos = new Map();
    pontos.forEach(p => {
        const chave = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(p);
    });

    grupos.forEach(grupo => {
        if (grupo.length <= 1) return;
        const n = grupo.length;
        // Correção de longitude conforme a latitude (senão os circulos se esticam norte-sul)
        const escalaLongitude = 1 / Math.max(0.1, Math.cos(grupo[0].lat * Math.PI / 180));
        grupo.forEach((ponto, i) => {
            const angulo = (2 * Math.PI * i) / n - Math.PI / 2;
            ponto.lat += RAIO_DISPERSAO * Math.sin(angulo);
            ponto.lng += RAIO_DISPERSAO * Math.cos(angulo) * escalaLongitude;
        });
    });
}
```

> **Armadilha:** esquecer a correção de longitude (`escalaLongitude`). Um grau de longitude não cobre a mesma distância real conforme a latitude (encolhe ao se afastar do equador, até valer 0 nos polos): sem essa correção, o círculo de dispersão se estica visualmente de norte a sul em vez de continuar sendo um círculo real na tela.

## Duas formas de desenhar um marcador

A API do Google Maps oferece dois caminhos de renderização para um marcador, com capacidades diferentes:

| | `google.maps.Marker` (legado) | `AdvancedMarkerElement` |
|---|---|---|
| Renderização | Imagem SVG fixa | Elemento [HTML](/?c=langages&s=html&p=html) personalizável (`content`) |
| Personalização | Limitada (ícone, cor) | Total (CSS, animações, conteúdo dinâmico) |
| Pré-requisito | Nenhum | Um identificador de estilo de mapa (*Map ID*) configurado no Google Cloud |

```javascript
// AdvancedMarkerElement: conteúdo HTML livre
const el = document.createElement('div');
el.className = 'meu-marcador-animado';
new AdvancedMarkerElement({ map, position, content: el });

// google.maps.Marker (legado): renderização SVG fixa, sem pre-requisito de configuração
new google.maps.Marker({ map, position, icon: meuIconeSvg });
```

> **Boa prática:** alternar dinamicamente entre os dois conforme haja ou não um *Map ID* configurado, em vez de depender de um único caminho de renderização: `AdvancedMarkerElement` quando disponível (personalização total), `google.maps.Marker` como alternativa caso contrário, sem quebrar nada para uma implantação que ainda não tem essa configuração.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `google.maps.importLibrary()` carrega cada sub-biblioteca sob demanda, uma única vez. Um agrupador agrupa visualmente marcadores próximos; uma dispersão em círculo (com correção de longitude) separa marcadores estritamente colocalizados. `AdvancedMarkerElement` permite uma renderização HTML personalizável, `google.maps.Marker` uma renderização SVG fixa sem pré-requisitos. |
| **Ferramentas utilizáveis** | `google.maps.importLibrary()`, `@googlemaps/markerclusterer` (`MarkerClusterer`), `AdvancedMarkerElement`/`google.maps.Marker`. |
| **Armadilhas a evitar** | Carregar todas as sub-bibliotecas de uma vez em vez de sob demanda. Esquecer a correção de longitude ao dispersar pontos colocalizados. |
| **Boas práticas** | Agrupar os marcadores numerosos por clustering em vez de deixá-los se sobrepor visualmente. Alternar entre `AdvancedMarkerElement` e `google.maps.Marker` conforme a configuração disponível, em vez de depender de um único caminho. |
