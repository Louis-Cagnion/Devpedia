---
order: 7
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

## Compactar uma malha: remover os vértices que nenhuma face usa

Um arquivo [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) pode declarar vértices (`v`) que nenhuma face (`f`) referencia: **vértices isolados**. Invisíveis na tela, eles contam mesmo assim no cálculo da **caixa envolvente**, a menor caixa alinhada aos eixos que contém todos os vértices. O programa a usa para posicionar o **pivô** (o ponto em torno do qual o objeto gira, aqui o centro da caixa) e para [enquadrar a câmera](/?c=fondamentaux&s=graphisme&p=matrices-et-camera).

```text
Com o vértice isolado D:          Sem D:
+----------------------+          +-------+
|  A---B             D |          | A---B |
|   \ /                |          |  \ /  |
|    C                 |          |   C   |
+----------------------+          +-------+
pivô descentralizado, objeto      pivô e enquadramento
pequeno e excêntrico              corretos
```

A solução é **compactar** a malha: manter só os vértices usados e depois renumerar as faces. As faces designam um vértice pelo seu **índice** (sua posição no vetor de vértices): remover o vértice n.º 2 desloca todos os seguintes, então todo índice maior que 2 precisa ser corrigido.

### Uma tabela de renumeração, preenchida em três passadas

A **tabela de renumeração** (`remap`) associa a cada vértice seu índice antigo ao seu índice novo, ou a `-1` se ele desaparece.

```c
typedef struct {
    float position[3];
    float uv[2];        // coordenadas de textura: viajam com o vértice
} Vertex;

// Remove no lugar os vértices sem uso; devolve quantos são mantidos,
// -1 se a alocação falha, -2 se um índice de face sai do vetor.
long compact_mesh(Vertex *vertices, size_t vertex_count,
                  unsigned *indices, size_t index_count) {
    long *remap = malloc(vertex_count * sizeof *remap);

    if (remap == NULL)
        return -1;
    for (size_t i = 0; i < vertex_count; i++)
        remap[i] = -1;
    for (size_t k = 0; k < index_count; k++) {
        if (indices[k] >= vertex_count) {
            free(remap);
            return -2;
        }
        remap[indices[k]] = 0;          // marca «usado»
    }
    long next = 0;
    for (size_t i = 0; i < vertex_count; i++) {
        if (remap[i] < 0)
            continue;
        vertices[next] = vertices[i];   // next <= i: posição já lida
        remap[i] = next++;
    }
    for (size_t k = 0; k < index_count; k++)
        indices[k] = remap[indices[k]];
    free(remap);
    return next;
}
```

| Passada | Função |
|---|---|
| 1. Marcar | Para cada índice de face, passar `remap[índice]` de `-1` para «usado» |
| 2. Mover | Percorrer os vértices em ordem; cada vértice usado recebe o próximo índice novo e é copiado para seu novo lugar |
| 3. Renumerar | Substituir cada índice de face por `remap[índice]` |

- **Sem segundo vetor**: o deslocamento é feito no lugar, porque um vértice nunca sobe (`next <= i`). A posição de destino já foi lida ou estava sem uso.
- **Índice e UV juntos**: as UV (coordenadas de textura, cf. [indexação `v/vt/vn`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#a-indexacao-combinada-vvtvn-e-a-costura-uv)) viajam com o vértice na mesma estrutura. Se o arquivo as guarda em um vetor separado, esse vetor tem sua própria tabela de renumeração, aplicada às mesmas faces.
- **Validar antes de renumerar**: um índice fora do vetor escreveria fora de `remap`. A função o recusa com um código de erro próprio em vez de supor que seja válido.

> **Cilada de teste:** um verificador que lê os triângulos pelo número do vértice falha após a renumeração, pois os números mudaram. Comparar os triângulos por **coordenadas**, não por índice. Atenção também: dois vértices distintos cujas coordenadas arredondam para o mesmo `float` tornam esse índice ambíguo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Mover um vértice isoladamente quebra visualmente a superfície de uma malha. A seleção proporcional também move os vizinhos, com uma intensidade que decai conforme a distância deles até o vértice selecionado, dentro de um raio de influência. Um vértice que nenhuma face usa falseia a caixa envolvente, e com ela o pivô e o enquadramento: compacta-se a malha. |
| **Ferramentas utilizáveis** | Uma distância 3D entre vértices, um fator de atenuação linear ou suavizado (`smoothstep`) conforme essa distância. Uma tabela de renumeração (`remap`) preenchida em três passadas (marcar, mover no lugar, renumerar as faces). |
| **Armadilhas a evitar** | Um raio de influência fixo, sem relação com a escala real do objeto editado. Renumerar sem validar os índices de face, ou comparar triângulos por índice após compactar. |
| **Boas práticas** | Expressar o raio de influência em relação ao tamanho do objeto em vez de como valor absoluto. Uma curva de decaimento suavizada para uma transição sem mudança de inclinação visível no limite do raio. Renumerar faces e UV juntas; comparar os triângulos por coordenadas. |
