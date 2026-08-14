---
order: 4
---

# Espaçamento e grade (layout)

O espaçamento já foi apresentado como uma alavanca de [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle): mais espaço ao redor de um elemento o isola e o faz se destacar. Este capítulo trata o espaçamento como um sistema completo (uma grade e uma escala coerentes), em vez de um ajuste pontual.

## O espaço negativo: uma ferramenta ativa, não um vazio a preencher

O **espaço negativo** (*white space*) é o espaço vazio ao redor e entre os elementos de uma tela. Não é uma falta a corrigir preenchendo cada pixel disponível: é uma ferramenta que deixa o conteúdo respirar e reduz o esforço de leitura.

> **Analogia:** o silêncio na música. As pausas entre as notas fazem tanto parte da música quanto as próprias notas; sem elas, tudo se mistura em um ruído contínuo.

> **Armadilha:** o "medo do vazio": preencher cada espaço disponível com conteúdo ou decoração, partindo do princípio de que um espaço vazio é um espaço desperdiçado. Resultado: uma sobrecarga visual (já vista no [capítulo 1](/?c=ui-ux&p=hierarchie-visuelle)) e uma leitura mais cansativa.
>
> **Boa prática:** tratar o espaço vazio como um elemento de design por si só, decidido no mesmo nível que a cor ou a tipografia, não como um resto a preencher.

## O sistema de grade: colunas, calhas, margens

Uma **grade** estrutura uma página em zonas alinhadas entre si, em vez de posicionar cada elemento no olho:

| Termo | Definição | Papel |
|---|---|---|
| Coluna | Uma faixa vertical na qual o conteúdo se alinha | Estrutura a página em zonas coerentes entre si |
| Calha (*gutter*) | O espaço vazio entre duas colunas | Separa visualmente o conteúdo de colunas vizinhas |
| Margem | O espaço vazio entre o conteúdo e a borda da tela | Impede o conteúdo de "colar" nas bordas |

```text
┌──margem─┬────col A────┬cal┬────col B────┬cal┬────col C────┬──margem─┐
│         │   Bloco 1    │   │   Bloco 2    │   │   Bloco 3    │         │
└─────────┴──────────────┴───┴──────────────┴───┴──────────────┴─────────┘
```

A convenção mais difundida na web é uma grade de 12 colunas: 12 se divide por 2, 3, 4 e 6, o que permite compor layouts variados (dois blocos iguais, três blocos iguais, um terço + dois terços...) sem mudar de grade.

> **Armadilha:** alinhar elementos "a olho" em vez de sobre uma grade explícita. Os desvios de alguns pixels resultantes são invisíveis quando tomados isoladamente, mas dão ao conjunto da página uma impressão de incoerência.
>
> **Boa prática:** definir a grade (número de colunas, largura das calhas) antes de posicionar o menor elemento, e depois alinhar sistematicamente sobre ela.

## Uma escala de espaçamento coerente

Em vez de inventar um valor de espaçamento caso a caso (5px aqui, 13px ali, 22px em outro lugar), uma escala fixa em múltiplos de uma unidade base (4px ou 8px) cobre todas as necessidades:

| Múltiplo | Valor (base 8px) | Uso típico |
|---|---|---|
| ×1 | 8px | Entre elementos muito próximos (um ícone e seu texto) |
| ×2 | 16px | Entre elementos ligados (os campos de um formulário) |
| ×3 | 24px | Entre subseções |
| ×4 | 32px | Entre grandes blocos de página |
| ×6 | 48px | Entre seções principais |

> **Armadilha:** escolher cada valor de espaçamento caso a caso ("15px, parece bom aqui"). Cada valor parece correto isoladamente, mas seu acúmulo ao longo do projeto nunca forma um conjunto coerente.
>
> **Boa prática:** definir essa escala uma vez, no início do projeto, e depois recorrer exclusivamente a ela, nunca um valor inventado pontualmente.

## O ritmo vertical

O **ritmo vertical** é um espaçamento constante e previsível entre os blocos de conteúdo empilados verticalmente: títulos, parágrafos, seções.

```text
Titulo
                    ← sempre o mesmo espaco apos um titulo (x3, 24px)
Paragrafo de texto...
                    ← sempre o mesmo espaco entre dois paragrafos (x2, 16px)
Paragrafo de texto...
```

> **Armadilha:** um espaçamento vertical que varia sem razão de um bloco a outro (24px aqui, 30px ali). A página parece "desconexa", mesmo que cada bloco isoladamente pareça correto.
>
> **Boa prática:** atribuir um espaçamento fixo e reutilizado a cada tipo de transição (título → parágrafo, parágrafo → parágrafo, seção → seção), retirado da escala definida acima.

> **Tendência atual (2026):** retorno a layouts previsíveis e reconhecíveis, na mesma lógica do retorno à clareza já observado para a [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle), em vez de grades experimentais.

## Passando para a implementação

Uma grade e um ritmo vertical se constroem concretamente com [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) ou [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), e precisam se adaptar ao tamanho da tela via [o design responsivo](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O espaço negativo é uma ferramenta ativa, não um vazio a preencher. Uma grade (colunas, calhas, margens) alinha os elementos entre si, e uma escala de espaçamento fixa (múltiplos de 4 ou 8px) garante um ritmo vertical coerente. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: a grade e a escala se definem no projeto, e depois se implementam em CSS (Flexbox, Grid). |
| **Armadilhas a evitar** | Preencher cada espaço disponível por medo do vazio; alinhar elementos a olho em vez de sobre uma grade; inventar um valor de espaçamento caso a caso. |
| **Boas práticas** | Definir grade e escala de espaçamento antes de posicionar o menor elemento; sempre reutilizar os mesmos valores de espaçamento para um mesmo tipo de transição. |
