---
order: 5
---

# Edição de malha e seleção proporcional

O [capítulo anterior](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d) cobre o picking, que identifica **um** vértice clicado. Este capítulo cobre o que acontece depois que esse vértice é selecionado: como movê-lo sem quebrar a forma geral da malha ao redor.

## O problema: mover um vértice isoladamente quebra a superfície

Uma [malha](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) é um conjunto de vértices conectados por faces. Mover um único vértice, sem tocar em seus vizinhos, cria um pico ou um buraco brusco, desproporcional em relação ao resto da superfície: visualmente, a modificação "quebra" a forma em vez de evoluí-la naturalmente.

```text
Movimento isolado do vertice central:        Com selecao proporcional:

      *                                            *
     /|\                                          /~\
    / | \          -- vs --                      /   \
---*--+--*---                              ---*--~~~~~--*---
   (pico brusco)                           (transicao suavizada)
```

## A seleção proporcional: uma influência que decai com a distância

A **seleção proporcional** (noção popularizada pela ferramenta de modelagem [Blender](https://www.blender.org)) responde a esse problema: mover um vértice também influencia seus vizinhos, com uma intensidade que **decai** conforme a distância deles até o vértice diretamente selecionado.

```c
float distancia = distancia_3d(vertice_vizinho.posicao, vertice_selecionado.posicao);

if (distancia < raio_influencia) {
    // 1.0 no centro, 0.0 na borda do raio
    float fator = 1.0f - (distancia / raio_influencia);
    vertice_vizinho.posicao += deslocamento * fator;
}
```

Cada vértice dentro do raio de influência se move então na mesma direção que o vértice diretamente selecionado, mas tanto menos quanto mais distante estiver: o próprio vértice selecionado se move por completo (`fator = 1.0`), um vizinho no limite do raio quase não se move (`fator` próximo de `0.0`).

| Parâmetro | Efeito |
|---|---|
| Raio de influência pequeno | Modificação localizada, próxima de um movimento isolado |
| Raio de influência grande | Deformação ampla e suave, sobre uma área extensa da malha |
| Curva de decaimento linear (acima) | Transição simples, mas com uma mudança de inclinação visível no limite do raio |
| Curva de decaimento suavizada (ex. `smoothstep`) | Transição mais suave, sem mudança de inclinação perceptível |

> **Armadilha:** um raio de influência escolhido sem relação com a escala real da malha. Em um objeto minúsculo, um raio pensado para um objeto enorme engloba a malha inteira (tudo se move de forma quase uniforme); em um objeto enorme, o mesmo raio pode quase não afetar nenhum vizinho (volta a um movimento isolado).
>
> **Boa prática:** expressar o raio de influência em relação ao tamanho do objeto editado (por exemplo, uma porcentagem de sua caixa delimitadora), em vez de como um valor absoluto fixo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Mover um vértice isoladamente quebra visualmente a superfície de uma malha. A seleção proporcional também move os vizinhos, com uma intensidade que decai conforme a distância deles até o vértice selecionado, dentro de um raio de influência. |
| **Ferramentas utilizáveis** | Uma distância 3D entre vértices, um fator de atenuação linear ou suavizado (`smoothstep`) conforme essa distância. |
| **Armadilhas a evitar** | Um raio de influência fixo, sem relação com a escala real do objeto editado. |
| **Boas práticas** | Expressar o raio de influência em relação ao tamanho do objeto em vez de como valor absoluto. Uma curva de decaimento suavizada para uma transição sem mudança de inclinação visível no limite do raio. |
