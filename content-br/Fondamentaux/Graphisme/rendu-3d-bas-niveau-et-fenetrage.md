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

## Escrever diretamente no buffer de memória da imagem

O MinilibX oferece duas formas de colocar um pixel em uma imagem: `mlx_pixel_put()`, uma chamada de função por pixel, ou um acesso direto ao buffer de memória da imagem via `mlx_get_data_addr()`. Para uma imagem redesenhada por inteiro a cada frame (como uma renderização por raycasting), a segunda é bem mais rápida: uma chamada de função por pixel tem um custo não desprezível, multiplicado por centenas de milhares de pixels por imagem.

`mlx_get_data_addr()` retorna o endereço de memória do primeiro pixel da imagem, junto com três informações necessárias para calcular o endereço de um pixel específico: `line_length` (o número de bytes por linha da imagem), `bits_per_pixel` (o tamanho em bits de um pixel, geralmente 32) e `endian` (a ordem dos bytes).

```c
int line_length, bits_per_pixel, endian;
char *buffer = mlx_get_data_addr(image, &bits_per_pixel, &line_length, &endian);

void colocarPixel(char *buffer, int line_length, int bits_per_pixel, int x, int y, int cor)
{
    char *endereco = buffer + (y * line_length) + (x * (bits_per_pixel / 8));

    *(unsigned int *)endereco = cor; // escreve diretamente os 4 bytes do pixel
}
```

> **Cilada:** esquecer que `bits_per_pixel` é expresso em bits, não em bytes: dividir por 8 (`bits_per_pixel / 8`) é indispensável para obter o número de bytes a deslocar por pixel, senão o acesso à memória mira o lugar errado do buffer.
>
> **Boa prática:** calcular `line_length` e `bits_per_pixel` uma única vez (na inicialização), e depois recalcular apenas o endereço do pixel (`x`, `y` variáveis) a cada escrita: são os únicos valores que mudam de um pixel para outro.

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
> **Boa prática:** usar um algoritmo de avanço por grade (*DDA*, *Digital Differential Analyzer*) que pula diretamente de uma célula da grade para a seguinte em vez de avançar em pequenos passos fixos, garantindo que nenhuma parede seja perdida sem deixar de ser rápido (detalhado abaixo).

## O algoritmo DDA: avançar célula de grade em célula de grade

A abordagem anterior (avançar o raio "passo a passo") funciona, mas desperdiça cálculo: um passo pequeno pode cair várias vezes na mesma célula do mapa antes de alcançar a seguinte. O **DDA** avança diretamente de célula de grade em célula de grade, calculando a cada etapa a distância até a próxima linha vertical da grade e até a próxima linha horizontal, e escolhendo então a mais próxima das duas:

```text
A cada etapa do DDA:
  distancia_x = distância até a próxima linha vertical da grade
  distancia_y = distância até a próxima linha horizontal da grade
  se distancia_x < distancia_y:
    avançar até essa linha vertical (lado da parede potencialmente atingido: X)
  senão:
    avançar até essa linha horizontal (lado da parede potencialmente atingido: Y)
  repetir até atingir uma parede
```

Essa escolha (vertical ou horizontal) também memoriza de qual **lado** uma parede é eventualmente atingida (norte/sul ou leste/oeste), informação reutilizada mais adiante para escolher a textura certa ou escurecer levemente um lado em relação ao outro.

## Corrigir o efeito fisheye com o vetor plano de câmera

Cada raio é construído a partir de dois vetores: a **direção** do jogador (`direction_x`/`direction_y`) e um vetor **plano de câmera**, perpendicular à direção, que representa a largura do campo de visão. Um fator `cam_x`, que varre de `-1` (borda esquerda da tela) a `1` (borda direita), combina os dois para obter a direção exata do raio de cada coluna:

```text
direcao_raio = direcao_jogador + plano_camera * cam_x
```

> **Cilada:** usar a distância euclidiana real entre o jogador e o ponto de impacto do raio para calcular a altura da parede na tela. Os raios das colunas laterais percorrem uma distância em linha reta maior que o do centro para atingir a mesma parede, o que curvaria visualmente as paredes retas nas bordas da tela: o efeito **fisheye**.
>
> **Boa prática:** usar a distância **perpendicular** à direção do jogador (a distância projetada sobre o eixo de direção, em vez da distância em linha reta) para calcular a altura da parede. Essa correção elimina o efeito fisheye sem nenhum cálculo trigonométrico adicional: é um subproduto direto da construção do raio via o vetor plano de câmera.

## Aplicar uma textura sobre uma parede raycasteada

Uma vez conhecido o ponto de impacto do raio, sua posição **fracionária** ao longo da parede atingida (`wall_x`, a parte decimal da coordenada de impacto) dá diretamente a coordenada horizontal a ler na textura (`tex_x`):

```text
wall_x = parte fracionaria do ponto de impacto sobre a parede
tex_x  = wall_x * largura_textura
```

Verticalmente, um passo (`step = altura_textura / altura_parede_na_tela`) permite avançar na textura pixel de tela por pixel de tela: esse fator de escala se adapta automaticamente à distância, uma parede próxima (alta na tela) percorre a textura lentamente, uma parede distante (baixa na tela) a estica. O lado atingido pelo raio (registrado pelo DDA acima) determina qual textura usar (norte/sul/leste/oeste).

## Exibir um sprite em uma cena raycasteada

Um **sprite** (um objeto 2D, como um personagem ou um item coletável) não tem volume no mundo raycasteado: ele precisa ser transformado para aparecer na posição e no tamanho certos na tela, sempre de frente para a câmera (um *billboard*, como um painel publicitário sempre voltado para o observador).

A posição do sprite relativa ao jogador é transformada pela inversa da matriz de câmera (construída a partir da direção e do plano de câmera já usados para os raios); esse cálculo dá diretamente sua posição horizontal na tela e sua distância aparente (logo, seu tamanho).

> **Cilada:** desenhar um sprite sem verificar o que já foi desenhado naquele ponto da tela. Um sprite mais distante que uma parede que o esconde deve permanecer invisível, senão ele aparece através das paredes.
>
> **Boa prática:** manter em memória, para cada coluna de tela, a distância da parede já desenhada pelo raycasting (um **z-buffer**, literalmente "buffer de profundidade"); antes de desenhar um pixel de sprite, comparar sua distância com a já registrada para aquela coluna, e só desenhá-lo se estiver mais próximo. Esse teste de profundidade é o mesmo princípio, simplificado para uma dimensão (um valor por coluna em vez de por pixel), que o z-buffer usado em todos os motores 3D modernos.

## Simular um mouse infinito

Para girar a câmera com o mouse sem que o cursor jamais saia da janela (como em um jogo de tiro em primeira pessoa), uma técnica simples **recentraliza** o cursor assim que ele se aproxima de uma borda da tela:

```c
void aoMoverMouse(int x, int y)
{
    if (x <= 10) {
        mlx_mouse_move(janela, largura_tela - 11, y); // reposiciona perto da borda oposta
    } else if (x >= largura_tela - 10) {
        mlx_mouse_move(janela, 11, y);
    }
    // ... usar x - último_x para girar a camera ...
}
```

Só o movimento **relativo** entre duas posições sucessivas (`x - ultimo_x`) é usado para girar a câmera: reposicionar o cursor em si é apenas um artifício para nunca ficar bloqueado pela borda da janela, invisível para o usuário já que nenhuma rotação é calculada a partir da posição absoluta.

> **Nota:** essa abordagem (teletransportar o cursor) difere do **pointer lock** usado pelos navegadores web para a mesma necessidade, que esconde e trava completamente o cursor em vez de movê-lo: duas soluções diferentes para o mesmo problema.

## O que o raycasting não calcula

O raycasting clássico só lida com um único nível de altura por coluna: ele não consegue representar relevo real (escadas, uma ponte sobre um corredor) nem olhar de forma realista para cima ou para baixo, ao contrário de uma engine 3D real que calcula um volume completo. É justamente essa concessão deliberada, sacrificar o realismo geométrico pela velocidade de cálculo, que tornou a técnica jogável no hardware da época, e que ainda hoje faz dela um primeiro projeto útil para entender a renderização 3D sem a complexidade de uma engine completa.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Uma biblioteca de janelamento (X11, MinilibX) dá acesso a uma área de exibição e aos eventos de teclado/mouse por meio de um loop que roda continuamente. O raycasting simula a 3D avançando um raio por coluna de pixels (DDA) sobre um mapa 2D, sendo a distância perpendicular até a parede atingida o que determina sua altura na tela sem efeito fisheye. |
| **Ferramentas utilizáveis** | MinilibX/X11 para o janelamento no Linux. `mlx_get_data_addr()` para escrever diretamente no buffer da imagem em vez de pixel a pixel. O DDA para avançar o raio eficientemente; um z-buffer por coluna para ocluir corretamente os sprites atrás de uma parede. |
| **Ciladas a evitar** | Redesenhar a imagem inteira a cada passagem sem nenhuma condição. Avançar o raio em passos fixos grandes demais, arriscando pular uma parede fina. Esquecer de dividir `bits_per_pixel` por 8 ao escrever no buffer. Usar a distância euclidiana em vez da perpendicular (efeito fisheye). Desenhar um sprite sem teste de profundidade. |
| **Boas práticas** | Redesenhar somente após uma mudança real no estado do jogo. Usar um DDA em vez de pequenos passos fixos para avançar o raio. Recentralizar o cursor perto das bordas para um mouse infinito, baseando-se apenas no movimento relativo. |
