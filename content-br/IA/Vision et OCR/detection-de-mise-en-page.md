---
order: 2
---

# Detecção de layout: caixas delimitadoras, score de confiança e remoção de duplicatas

O capítulo [OCR estruturado e análise de layout](/?c=traitement-de-documents&p=ocr-structure) apresenta o princípio geral: antes de ler o texto, um modelo primeiro localiza as regiões da página (título, parágrafo, tabela...). Este capítulo desenvolve o funcionamento desse modelo de localização em si, uma **detecção de objetos** (*object detection*) no sentido geral do termo, aplicada aqui a áreas de página em vez de objetos fotografados.

## A caixa delimitadora: representar uma área detectada

Uma **caixa delimitadora** (*bounding box*) representa a posição de uma área detectada na página por um simples retângulo, descrito por 4 números:

```text
(x_min, y_min) ●─────────────────────┐
               │                     │
               │   Area detectada    │
               │   (ex: uma tabela)  │
               │                     │
               └─────────────────────● (x_max, y_max)
```

| Representação | Os 4 números |
|---|---|
| Cantos opostos | `x_min`, `y_min` (canto superior esquerdo), `x_max`, `y_max` (canto inferior direito) |
| Centro + dimensões | `x_centro`, `y_centro`, `largura`, `altura` |

As duas representações descrevem o mesmo retângulo; a escolha entre elas é uma convenção do modelo usado (a verificar em sua documentação), não uma diferença de fundo.

Para cada caixa, o modelo também produz uma **classe** (o tipo de área: título, parágrafo, tabela, figura...) e um **score de confiança**: uma probabilidade, entre 0 e 1, de que essa classe seja a correta para essa área (o mesmo tipo de saída de uma [classificação por softmax](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones), sendo a classe escolhida a de maior probabilidade).

> **Cuidado:** manter todas as caixas retornadas pelo modelo, sem olhar seu score de confiança. Um modelo de detecção sistematicamente propõe muitas caixas candidatas em toda a imagem; a maioria tem um score de confiança muito baixo (um simples bloco de texto alinhado confundido com uma tabela, por exemplo) e não corresponde a nada real na página.
>
> **Boa prática:** descartar qualquer caixa cujo score de confiança fique abaixo de um limiar fixado com antecedência (geralmente entre 0.3 e 0.7 de acordo com a tolerância a falsos positivos desejada), antes de qualquer outro processamento.

## O problema das duplicatas: IoU (*Intersection over Union*)

Um modelo de detecção propõe suas caixas candidatas independentemente umas das outras: é comum, então, que ele detecte a **mesma área física** várias vezes, na forma de várias caixas levemente diferentes (uma cobrindo toda uma tabela, outra cobrindo só uma parte, uma terceira levemente deslocada):

```text
┌──────────────────┐
│  ┌───────────────┼──┐    <- 3 caixas que se sobrepoem fortemente,
│  │///////////////│  │       todas candidatas para A MESMA tabela
└──┼───────────────┘  │
   └───────────────────┘
```

Para decidir se duas caixas designam a mesma área (a deduplicar) ou duas áreas realmente distintas (a manter ambas), é preciso medir sua sobreposição. O **IoU** (*Intersection over Union*) é essa medida: a área de sua intersecção, dividida pela área de sua união.

```text
Caixa A          Caixa B
┌────────┐
│    ┌───┼────┐
│    │###│    │    ### = intersecao (compartilhada por A e B)
└────┼───┘    │
     └────────┘

IoU = area(###) / area(A uniao B)
```

```python
def iou(caixa_a, caixa_b):
    # Coordenadas do retangulo de intersecao
    x_min = max(caixa_a.x_min, caixa_b.x_min)
    y_min = max(caixa_a.y_min, caixa_b.y_min)
    x_max = min(caixa_a.x_max, caixa_b.x_max)
    y_max = min(caixa_a.y_max, caixa_b.y_max)

    largura_intersecao = max(0, x_max - x_min)   # 0 se as caixas nao se tocam
    altura_intersecao = max(0, y_max - y_min)
    area_intersecao = largura_intersecao * altura_intersecao

    area_a = (caixa_a.x_max - caixa_a.x_min) * (caixa_a.y_max - caixa_a.y_min)
    area_b = (caixa_b.x_max - caixa_b.x_min) * (caixa_b.y_max - caixa_b.y_min)
    area_uniao = area_a + area_b - area_intersecao

    return area_intersecao / area_uniao
```

Um IoU de 1 significa duas caixas idênticas; um IoU de 0 significa que elas não se tocam de forma alguma. Duas caixas que designam a mesma área física geralmente têm um IoU alto (frequentemente acima de 0.5), mesmo que suas coordenadas exatas difiram um pouco.

> **Cuidado:** subtrair a intersecção uma segunda vez ao calcular a união (`area_a + area_b`, sem o `- area_intersecao`). A intersecção pertence às duas áreas individuais: somá-la sem retirá-la uma vez a conta duas vezes, o que infla artificialmente a união e faz subestimar o IoU.
>
> **Boa prática:** sempre verificar a fórmula `uniao = area_a + area_b - intersecao` (o caso mais simples do [princípio da inclusão-exclusão](https://pt.wikipedia.org/wiki/Princípio_da_inclusão-exclusão), uma regra geral de contagem para não contar duas vezes uma parte comum a dois conjuntos) em vez de improvisá-la de memória.

## NMS (*Non-Maximum Suppression*): manter apenas uma caixa por área

A **NMS** (suprimir os não máximos) usa o IoU para manter apenas uma caixa por área física, entre todas as duplicatas candidatas:

```text
1. Ordenar todas as caixas por score de confianca decrescente
2. Pegar a caixa de maior score -> mante-la definitivamente
3. Remover todas as caixas restantes cujo IoU com ela supera um limiar
   (ex: 0.5) -> sao duplicatas da caixa que acabou de ser mantida
4. Repetir as etapas 2 e 3 nas caixas que restam, ate que nao haja mais nenhuma
```

```python
def nms(caixas, limiar_iou=0.5):
    caixas_ordenadas = sorted(caixas, key=lambda b: b.score, reverse=True)
    mantidas = []
    while caixas_ordenadas:
        melhor = caixas_ordenadas.pop(0)   # score mais alto restante
        mantidas.append(melhor)
        caixas_ordenadas = [
            b for b in caixas_ordenadas
            if iou(melhor, b) <= limiar_iou   # descarta as duplicatas de "melhor"
        ]
    return mantidas
```

A cada rodada, a caixa de melhor score restante é considerada a melhor estimativa da área real: todas as que se sobrepõem fortemente a ela são, então, suas duplicatas, não áreas distintas.

> **Cuidado:** aplicar a NMS a todas as caixas de uma vez, sem distinguir sua classe predita. Uma caixa "título" e uma caixa "tabela" podem se sobrepor por coincidência geométrica (um título logo acima de uma tabela, cujas caixas se tocam levemente) sem designar a mesma área: tratá-las juntas arriscaria remover erroneamente uma das duas.
>
> **Boa prática:** aplicar a NMS separadamente para cada classe (comparar as caixas "tabela" entre si, as caixas "título" entre si, etc.), nunca entre classes diferentes.

## O limiar de IoU: um compromisso, não um valor universal

| Limiar de IoU escolhido | Efeito |
|---|---|
| Muito baixo (ex. 0.1) | Áreas realmente distintas mas próximas (duas tabelas pequenas lado a lado) correm o risco de serem fundidas em uma só |
| Muito alto (ex. 0.9) | Duplicatas evidentes da mesma área, com coordenadas levemente diferentes, não são eliminadas |

> **Boa prática:** ajustar esse limiar em documentos representativos do caso de uso real (tabelas densas e próximas exigem um limiar mais alto que um layout mais espaçado), em vez de manter um valor padrão sem tê-lo verificado nos próprios documentos.

Veja também [OCR estruturado e análise de layout](/?c=traitement-de-documents&p=ocr-structure) para a continuação do pipeline (reconstruir a grade de uma tabela uma vez sua área localizada e deduplicada), e [As redes neurais: os fundamentos](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) para a classificação por score de confiança sobre a qual se apoia este capítulo.

## O que reter

| | |
|---|---|
| **O que reter** | Um modelo de detecção produz caixas delimitadoras (4 coordenadas), cada uma com uma classe e um score de confiança. Ele frequentemente detecta a mesma área várias vezes: o IoU (área de intersecção / área de união) mede a sobreposição entre duas caixas, e a NMS mantém apenas a caixa de melhor score entre as que se sobrepõem fortemente, classe por classe. |
| **Ferramentas úteis** | As bibliotecas de visão computacional ([torchvision](https://pytorch.org/vision/stable/index.html), por exemplo) fornecem implementações de NMS prontas para uso, mais rápidas que código [Python](/?c=langages-de-programmation&s=python&p=python) puro em um grande número de caixas. |
| **Armadilhas a evitar** | Manter caixas com baixo score de confiança sem filtragem. Calcular mal a união contando a intersecção duas vezes. Aplicar a NMS entre classes diferentes em vez de separadamente por classe. Manter um limiar de IoU padrão sem validá-lo nos próprios documentos. |
| **Boas práticas** | Filtrar por score de confiança antes de qualquer processamento. Verificar a fórmula da união (inclusão-exclusão). Aplicar a NMS separadamente por classe. Ajustar o limiar de IoU em documentos representativos do caso de uso real. |
