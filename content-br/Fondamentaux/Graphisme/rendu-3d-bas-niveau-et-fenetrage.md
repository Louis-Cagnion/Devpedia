---
order: 1
---

# Renderização 3D de baixo nível e janelamento: raycasting estilo Wolfenstein

Antes de uma engine de jogo assumir a abertura de uma janela e o desenho de uma cena 3D por conta de um programa, o programa precisa fazer isso sozinho: pedir ao sistema operacional uma área de exibição, e então escrever diretamente nela os pixels que compõem a imagem. Este capítulo cobre essa etapa de baixo nível, com o **raycasting**, a técnica que tornou *Wolfenstein 3D* (1992) possível em um hardware lento demais para calcular uma 3D real.

## Janelamento: obter uma área para desenhar

**Abrir uma janela** não acontece automaticamente: o programa precisa pedir ao sistema operacional uma área de exibição, receber eventos dela (uma tecla pressionada, o mouse movido, a janela fechada) e entregar a imagem a ser exibida a cada passo. Uma biblioteca de janelamento gerencia essa troca de baixo nível com o sistema:

| Biblioteca | Papel |
|---|---|
| **X11** (*X Window System*) | O sistema de janelas padrão no Linux: gerencia janelas, eventos de teclado/mouse e a exibição na tela |
| **MinilibX** | Uma pequena biblioteca construída sobre o X11, que simplifica seu uso para um programa que só precisa criar uma janela e desenhar pixels nela um a um |

Um **loop de eventos** roda continuamente enquanto a janela permanece aberta: a cada passagem, ele verifica se uma tecla foi pressionada ou o mouse movido, atualiza o estado do programa de acordo, e então redesenha a imagem.

```text
Enquanto a janela estiver aberta:
  1. Verificar eventos (tecla pressionada, mouse movido, fechamento solicitado)
  2. Atualizar o estado do jogo (posição do jogador, direção do olhar)
  3. Recalcular a imagem a exibir
  4. Enviar a imagem para a tela
```

> **Cilada:** redesenhar a imagem inteira a cada passagem mesmo quando nada mudou. É o mesmo princípio já visto em [evitar o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant): reprocessar apenas o que realmente mudou, aplicado aqui à renderização de imagem em vez de a um cálculo do lado do servidor.
>
> **Boa prática:** redesenhar somente quando o estado do jogo realmente mudou (uma tecla pressionada, o mouse movido), em vez de incondicionalmente a cada passagem do loop.

## O problema: simular 3D sem uma 3D real

Calcular uma cena 3D completa (cada superfície, cada ângulo de visão) exigia, no início dos anos 1990, mais poder de computação do que qualquer computador doméstico tinha. O raycasting contorna o problema: em vez de modelar um volume 3D real, ele simula profundidade a partir de um mapa **2D** (uma planta vista de cima, como um labirinto), calculando apenas a distância até a parede mais próxima em cada direção observada.

```text
Mapa 2D (vista de cima):             Render final (visão do jogador):

# # # # # # #                        A parede próxima parece alta,
#           #                        a parede distante parece baixa:
#     @     #    -- raycasting -->   a mesma informação de distância,
#           #                        traduzida em altura de parede
# # # # # # #                        na tela.
```

## Lançando um raio por coluna de pixels

Para cada coluna vertical de pixels na tela (uma imagem de 800 pixels de largura precisa de 800 cálculos), o programa lança um **raio** imaginário a partir da posição do jogador, na direção correspondente àquela coluna, e avança esse raio sobre o mapa 2D até que ele atinja uma parede:

```text
Posição do jogador: (x, y)
Direção do raio: ângulo de visão do jogador + deslocamento para esta coluna

Avançar o raio passo a passo sobre o mapa:
  enquanto a célula atual não for uma parede:
    mover o raio para a frente em um pequeno passo
  -> distância percorrida = distância até a parede, naquela direção
```

Uma vez conhecida essa distância, a altura de parede a desenhar na tela para aquela coluna decorre diretamente: quanto mais curta a distância, mais alta a parede aparece (perto); quanto mais longa, mais baixa ela aparece (longe), exatamente como um objeto real que encolhe com a distância.

> **Cilada:** avançar o raio em passos fixos grandes demais, o que pode fazê-lo "pular" sobre uma parede fina sem nunca detectar a colisão. Um passo pequeno demais, por outro lado, deixa o cálculo mais lento para cada coluna da imagem.
>
> **Boa prática:** usar um algoritmo de avanço por grade (*DDA*, *Digital Differential Analyzer*) que pula diretamente de uma célula da grade para a seguinte em vez de avançar em pequenos passos fixos, garantindo que nenhuma parede seja perdida sem deixar de ser rápido.

## O que o raycasting não calcula

O raycasting clássico só lida com um único nível de altura por coluna: ele não consegue representar relevo real (escadas, uma ponte sobre um corredor) nem olhar de forma realista para cima ou para baixo, ao contrário de uma engine 3D real que calcula um volume completo. É justamente essa concessão deliberada, sacrificar o realismo geométrico pela velocidade de cálculo, que tornou a técnica jogável no hardware da época, e que ainda hoje faz dela um primeiro projeto útil para entender a renderização 3D sem a complexidade de uma engine completa.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Uma biblioteca de janelamento (X11, MinilibX) dá acesso a uma área de exibição e aos eventos de teclado/mouse por meio de um loop que roda continuamente. O raycasting simula a 3D lançando um raio por coluna de pixels sobre um mapa 2D, sendo a distância até a parede atingida o que determina sua altura na tela. |
| **Ferramentas utilizáveis** | MinilibX/X11 para o janelamento no Linux. Um algoritmo DDA para avançar o raio eficientemente sobre a grade do mapa. |
| **Ciladas a evitar** | Redesenhar a imagem inteira a cada passagem sem nenhuma condição. Avançar o raio em passos fixos grandes demais, arriscando pular uma parede fina. |
| **Boas práticas** | Redesenhar somente após uma mudança real no estado do jogo. Usar um DDA em vez de pequenos passos fixos para avançar o raio. |
