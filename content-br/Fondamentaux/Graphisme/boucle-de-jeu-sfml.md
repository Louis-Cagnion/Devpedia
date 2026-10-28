---
order: 9
---

# O loop de jogo com SFML (28/10/2026)

Um videogame é um programa que, dezenas de vezes por segundo, lê o que o jogador faz, faz o seu mundo avançar e, depois, redesenha tudo. Essa repetição se chama **loop de jogo**. Este capítulo o constrói passo a passo com **SFML** (*Simple and Fast Multimedia Library*), uma [biblioteca](/?c=langages&s=c&p=bibliotheques) (código já escrito que se reutiliza) da linguagem [C++](/?c=langages&s=cpp&p=cpp) que fornece o essencial de um jogo 2D: uma janela, o desenho de imagens e formas, a leitura do teclado e do mouse, e o som.

Este capítulo pressupõe conhecidos [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as condições](/?c=langages&s=c&p=conditions), [os loops](/?c=langages&s=c&p=boucles), [as classes e objetos](/?c=langages&s=cpp&p=classes-et-objets) e [os espaços de nomes](/?c=langages&s=cpp&p=espaces-de-noms) do C++. Para abrir uma janela OpenGL sem SFML, veja [GLFW, GLAD e o loop de renderização](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu): o loop é o mesmo ali, o SFML apenas esconde os detalhes.

> **Versão:** todo o código deste capítulo é escrito para **SFML 2** (a versão 2.6.1 em 28/10/2026, [documentação oficial](https://www.sfml-dev.org/documentation/2.6.1/)). O SFML 3 mudou alguns nomes de classes e de funções: o código abaixo não compila tal como está com ele.

## Instalar o SFML e compilar

O SFML é dividido em **módulos**, pedaços independentes que se ligam ao programa conforme as necessidades:

| Módulo | Conteúdo | Opção de ligação |
|---|---|---|
| System | tempo (cronômetro), vetores | `-lsfml-system` |
| Window | janela, eventos, teclado, mouse | `-lsfml-window` |
| Graphics | desenho de formas, imagens e texto | `-lsfml-graphics` |
| Audio | sons e música | `-lsfml-audio` |
| Network | comunicação em rede | `-lsfml-network` |

No Debian e no Ubuntu, o pacote de desenvolvimento é instalado a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) com `sudo apt install libsfml-dev`; os outros sistemas têm o equivalente (veja a [página de instalação](https://www.sfml-dev.org/tutorials/2.6/start-linux.php) do site oficial). O programa é então compilado com `g++`, o compilador C++ do GCC (veja [a compilação](/?c=langages&s=c&p=compilation)):

```bash
# -std=c++17 : versão da linguagem ; -o jogo : nome do executável gerado
# -Wall -Wextra : mostram os avisos do compilador
# -l<nome> : liga a biblioteca libsfml-<nome> (módulo Graphics, Window, System)
g++ -std=c++17 -Wall -Wextra jogo.cpp -o jogo -lsfml-graphics -lsfml-window -lsfml-system
./jogo    # executa o programa
```

## Sem loop, o programa termina imediatamente

Um programa C++ executa as linhas de `main` de cima para baixo e então para. Eis o menor programa SFML: ele abre uma janela, desenha e termina.

```cpp
#include <SFML/Graphics.hpp>   // cabeçalho do SFML: janela, desenho, tempo

int main()   // ponto de entrada: o programa começa aqui
{
    // sf:: é o espaço de nomes do SFML ; RenderWindow é uma janela onde se desenha
    // VideoMode(800, 600) : 800 pixels de largura, 600 de altura (um pixel: um ponto da tela)
    sf::RenderWindow window(sf::VideoMode(800, 600), "Meu loop de jogo");
    window.clear(sf::Color::Black);   // preenche a janela inteira de preto
    window.display();                 // mostra a imagem que acabou de ser desenhada
    return 0;   // fim de main: a janela é destruída e o programa para
}
```

A linha `#include` copia um arquivo de cabeçalho para dentro do programa (veja [`#include` e os cabeçalhos](/?c=langages&s=c&p=headers)): sem ela, o compilador não conhece `sf::RenderWindow`. Uma **janela** é um retângulo que o sistema operacional exibe e que o usuário pode mover e fechar. Aqui, ela aparece por alguns milissegundos (um milésimo de segundo) e some: nada impede `main` de chegar à última linha. É preciso um loop que **só devolva o controle quando a janela for fechada**.

## Uma volta do loop

Eis as palavras que servem no restante:

| Palavra | Definição |
|---|---|
| **Loop de jogo** (*game loop*) | Código repetido sem fim enquanto o jogo roda ; cada repetição é uma **volta** |
| **Imagem** (*frame*) | O que é exibido no fim de uma volta: uma volta produz uma imagem |
| **Delta time** (*dt*) | Duração, em segundos, decorrida desde a volta anterior ; explicada em detalhes em [o capítulo sobre GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-delta-time-uma-velocidade-independente-da-maquina) |
| **Evento** (*event*) | Sinal enviado pelo sistema quando algo acontece: tecla pressionada, clique, janela fechada |
| **Estado do jogo** (*game state*) | Todos os dados que descrevem o jogo em um instante: posições, pontuação, vidas, fase |

Uma volta sempre encadeia as mesmas quatro etapas, nesta ordem:

```text
              +-------------------------------------------------+
   início     | 1. TEMPO        dt = duração da volta anterior  |
   da volta   |                       |                         |
   ---------->|                       v                         |
              | 2. EVENTOS      ler teclado, mouse, fechamento  |
              |                       |                         |
              |                       v                         |
              | 3. ATUALIZAÇÃO  fazer o estado avançar com dt   |
              |                       |                         |
              |                       v                         |
              | 4. DESENHO      clear, draw, display            |
              +-----------------------|-------------------------+
                                      |
                  janela ainda aberta ? sim : volta ao início
                                      |
                                      não : fim do programa
```

| Etapa | Pergunta à qual ela responde | Ferramenta SFML 2 |
|---|---|---|
| 1. Tempo | Quanto tempo se passou desde a última volta? | `sf::Clock`, `restart()` |
| 2. Eventos | O que o jogador quer fazer? Ele fechou a janela? | `pollEvent`, `sf::Event` |
| 3. Atualização | Onde as coisas estão agora? | código do jogo, com `dt` |
| 4. Desenho | Como o mundo se parece agora? | `clear`, `draw`, `display` |

A atualização **modifica o estado** sem desenhar nada; o desenho **lê o estado** sem modificar nada. Essa separação permite mudar um sem tocar no outro.

## Um primeiro loop: a janela que continua aberta

Antes de acrescentar o tempo e a atualização, eis o loop reduzido ao essencial: eventos e desenho.

```cpp
#include <SFML/Graphics.hpp>   // cabeçalho do SFML

int main()
{
    sf::RenderWindow window(sf::VideoMode(800, 600), "Meu loop de jogo");

    // isOpen() vale verdadeiro enquanto a janela não foi fechada: é o loop de jogo
    while (window.isOpen()) {
        sf::Event event;   // uma caixa vazia para receber um evento (tipo sf::Event)
        // pollEvent põe em "event" o evento mais antigo pendente e devolve
        // verdadeiro ; devolve falso quando não há mais nenhum: o while esvazia a fila
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)   // o usuário clicou no botão de fechar
                window.close();                    // fecha a janela: isOpen() passa a falso
        }
        window.clear(sf::Color::Black);   // apaga a imagem anterior
        window.display();                 // mostra a nova imagem
    }
    return 0;   // alcançado somente quando a janela for fechada
}
```

Um **evento** não chega diretamente ao código: o sistema o deposita em uma **fila de espera** (uma lista de onde se retira na ordem de chegada). Vários eventos podem se acumular durante uma volta (uma tecla pressionada, o mouse movido): daí o `while` em volta de `pollEvent`, e não um simples `if`. Essa leitura, que "olha se há algo e segue mesmo se a fila estiver vazia", se chama **polling** ("interrogação").

## A estrutura `Game::run`

Um jogo de verdade reúne o loop e o estado em uma [classe](/?c=langages&s=cpp&p=classes-et-objets), em geral chamada `Game`, cuja função `run` contém o loop. Cada etapa da volta vira uma função:

| Função | Etapa | Papel |
|---|---|---|
| `run()` | 1 | Mede `dt`, depois chama as outras três na ordem, enquanto a janela estiver aberta |
| `processEvents()` | 2 | Esvazia a fila de eventos (fechamento, tecla Esc) |
| `update(float dt)` | 3 | Faz o estado do jogo avançar `dt` segundos |
| `render()` | 4 | Desenha o estado e o exibe |

O programa completo: um quadrado verde que as setas do teclado movem.

```cpp
#include <SFML/Graphics.hpp>   // cabeçalho do SFML

// Uma classe reúne o estado do jogo e as funções que o fazem funcionar
class Game {
public:   // o que pode ser usado de fora da classe
    // Construtor: chamado na criação de um Game ; depois de ":", a lista
    // de inicialização constrói cada membro (na ordem de declaração mais abaixo)
    Game()
        : window(sf::VideoMode(800, 600), "Meu loop de jogo"),
          player(sf::Vector2f(50.f, 50.f))   // quadrado de 50 x 50 pixels ; 50.f é um float
    {
        window.setFramerateLimit(60);   // limite de 60 imagens por segundo (veja mais abaixo)
        player.setFillColor(sf::Color::Green);   // cor de preenchimento do quadrado
        player.setPosition(375.f, 275.f);    // canto superior esquerdo: centraliza o quadrado
    }

    void run()   // void : a função não devolve nada
    {
        sf::Clock clock;   // cronômetro ; começa a contar na sua criação
        while (window.isOpen()) {   // uma volta de loop por imagem
            // restart() zera o cronômetro e devolve o tempo decorrido desde a
            // última partida, em um sf::Time ; asSeconds() o converte em segundos
            float dt = clock.restart().asSeconds();
            processEvents();   // etapa 2: os eventos
            update(dt);        // etapa 3: o estado do jogo
            render();          // etapa 4: a imagem
        }
    }

private:   // o que só pode ser usado de dentro da classe
    void processEvents()
    {
        sf::Event event;
        while (window.pollEvent(event)) {   // esvazia a fila de espera, como acima
            if (event.type == sf::Event::Closed)   // clique no botão de fechar da janela
                window.close();
            // && : "e" ; KeyPressed : uma tecla acabou de ser pressionada
            if (event.type == sf::Event::KeyPressed
                && event.key.code == sf::Keyboard::Escape)   // a tecla Esc
                window.close();
        }
    }

    void update(float dt)   // dt : segundos decorridos desde a volta anterior
    {
        const float speed = 200.f;   // const : não vai mudar ; 200 pixels por segundo
        // sf::Vector2f : um vetor de dois float, x (horizontal) e y (vertical)
        sf::Vector2f direction(0.f, 0.f);   // direção desejada ; (0, 0) : nenhuma
        // isKeyPressed vale verdadeiro enquanto a tecla estiver pressionada
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
            direction.x -= 1.f;   // para a esquerda : x diminui
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
            direction.x += 1.f;   // para a direita : x aumenta
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
            direction.y -= 1.f;   // para cima : y diminui (o eixo y desce no SFML)
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
            direction.y += 1.f;   // para baixo : y aumenta
        player.move(direction * speed * dt);   // desloca na direção x velocidade x dt
    }

    void render()
    {
        window.clear(sf::Color::Black);   // apaga a imagem anterior
        window.draw(player);              // desenha o quadrado na posição atual
        window.display();                 // mostra a imagem concluída
    }

    sf::RenderWindow window;     // a janela (declarada primeiro, construída primeiro)
    sf::RectangleShape player;   // o quadrado do jogador: uma forma retangular
};

int main()
{
    Game game;     // constrói o jogo: a janela é aberta
    game.run();    // o loop roda até a janela ser fechada
    return 0;
}
```

Os elementos do SFML 2 que você precisa conhecer para ler este código:

| Elemento | O que é |
|---|---|
| `sf::RenderWindow` | A janela **onde se desenha**: ela também lê os eventos (`pollEvent`) e se fecha (`close`) |
| `sf::Event` | Um evento; seu campo `type` diz qual (`Closed`, `KeyPressed`...), e `key.code` dá a tecla de um `KeyPressed` |
| `sf::Clock` | Um cronômetro; `restart()` o zera **e** devolve o tempo decorrido desde a sua última partida |
| `sf::Time` | Uma duração; `asSeconds()` a dá em segundos (`float`), `asMilliseconds()` em milissegundos |
| `window.clear(cor)` | Preenche toda a área de desenho com uma cor, para apagar a imagem anterior |
| `window.draw(objeto)` | Desenha um objeto em uma área **invisível** (o buffer de trás, veja a linha seguinte), ainda não na tela |
| `window.display()` | Troca os dois buffers: a imagem concluída se torna visível. É o [double buffering](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-double-buffering-evitar-a-imagem-desenhada-pela-metade) (o desenho acontece em um buffer invisível, trocado de uma só vez com o que está exibido), o papel de `glfwSwapBuffers` |

Duas formas de ler o teclado coexistem, para duas necessidades diferentes:

| | Evento `KeyPressed` | Estado `isKeyPressed` |
|---|---|---|
| Onde | Em `processEvents`, por `pollEvent` | Em `update`, a cada volta |
| Quando | Uma vez, no pressionamento da tecla; depois repetido pelo sistema se ela for mantida (`setKeyRepeatEnabled(false)` suprime a repetição) | A cada volta, verdadeiro enquanto a tecla estiver pressionada |
| Serve para | Uma ação pontual: sair, pausar, atirar uma vez | Um movimento contínuo: andar, girar |

## A velocidade: pixels por segundo, multiplicados pelo delta time

Em `update`, `player.move(direction * speed * dt)` desloca o quadrado de `200 x dt` pixels. A velocidade é expressa em **pixels por segundo**, e não em pixels por imagem. O princípio (e a sua armadilha do passo fixo) é explicado em [o capítulo sobre GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-delta-time-uma-velocidade-independente-da-maquina); aqui estão apenas os números para uma velocidade de 200 pixels por segundo, comparada a um passo fixo de 5 pixels por imagem (valores calculados por um programa de teste):

| Máquina | `dt` | Deslocamento por imagem (200 x `dt`) | Após 1 segundo | Passo fixo de 5 px por imagem após 1 s |
|---|---|---|---|---|
| 60 imagens por segundo | 1 / 60 = 0,0167 s | 3,33 px | 60 x 3,33 = **200 px** | 60 x 5 = 300 px |
| 30 imagens por segundo | 1 / 30 = 0,0333 s | 6,67 px | 30 x 6,67 = **200 px** | 30 x 5 = 150 px |

Cada imagem avança menos quando elas são mais numerosas, mas o total por segundo continua 200: o jogador não percebe diferença de velocidade entre as duas máquinas, a não ser pela fluidez.

> **Armadilha (inteiro contra ponto flutuante):** um **float** (`float`) é um número com vírgula; um **inteiro** (`int`) não tem vírgula e **trunca** (elimina a parte decimal: 3,33 vira 3). Com inteiros, a velocidade deriva ou para. A 60 imagens por segundo, `static_cast<int>(200 * dt)` (que converte o número em inteiro, veja [os casts do C++](/?c=langages&s=cpp&p=cast-cpp)) vale 3: após um segundo o quadrado só percorreu 180 pixels em vez de 200. A 144 imagens por segundo e 50 pixels por segundo, o passo vale 0,347 px, truncado para 0: **o quadrado nunca se move**. Da mesma forma, `float dt = 1 / 60;` dá 0, pois a divisão de dois inteiros é inteira: escreva `1.f / 60`. Mantenha `dt`, a velocidade e a posição em `float`.

> **Armadilha (delta time enorme):** depois de uma pausa (o programa suspenso, um ponto de parada no depurador), ou em certos sistemas quando o usuário move a janela (o loop pode travar durante todo o movimento), o primeiro `dt` seguinte pode valer vários segundos. Para uma pausa de 3 segundos, o quadrado pula de 200 x 3 = **600 pixels** de uma vez, para fora da tela. Limita-se `dt`: acima do limite, o jogo desacelera por uma imagem em vez de pular. Com um limite de 0,1 s, o pulo cai para 200 x 0,1 = 20 pixels.

```cpp
float dt = clock.restart().asSeconds();   // duração da volta anterior, em segundos
if (dt > 0.1f)   // mais de 0,1 s: houve uma pausa (menos de 10 imagens por segundo)
    dt = 0.1f;   // limitamos: o jogo age como se apenas 0,1 s tivesse passado
```

> **Armadilha (cronômetro criado cedo demais):** `sf::Clock` começa a contar na sua criação. Criado no construtor de `Game`, ele também conta o tempo de carregamento da janela: o primeiro `dt` seria grande demais. Por isso ele é criado logo antes do loop, como em `run()`. Um mesmo cronômetro também não deve servir para dois usos: veja [um único cronômetro por uso](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#um-unico-cronometro-por-uso).

## O deslocamento na diagonal: a normalização

No programa acima, apertar duas setas ao mesmo tempo (direita e baixo) soma as duas direções. Um [vetor](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) é uma lista de números tratada como uma coisa só, aqui o par `(x, y)`; a direção desejada é portanto `(1, 0) + (0, 1) = (1, 1)`. Seu comprimento (sua **norma**, veja [a norma de um vetor](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#a-norma-de-um-vetor-seu-comprimento)) se calcula com o teorema de Pitágoras: a **raiz quadrada** (o número que, multiplicado por ele mesmo, dá o número de partida) da soma dos quadrados das componentes.

```text
comprimento((1, 0)) = raiz(1 x 1 + 0 x 0) = raiz(1) = 1
comprimento((1, 1)) = raiz(1 x 1 + 1 x 1) = raiz(2) = 1,4142... ou seja, cerca de 1,41
```

O quadrado que avança na diagonal percorre então a cada segundo 1,41 vez a distância de um deslocamento reto. Medido em um segundo a 60 imagens por segundo, velocidade 200:

| Teclas | Direção | Comprimento da direção | Distância percorrida em 1 s |
|---|---|---|---|
| Só direita | `(1, 0)` | 1 | 200 px |
| Direita + Baixo, sem correção | `(1, 1)` | 1,41 | **282,84 px** (200 em x e 200 em y) |
| Direita + Baixo, **normalizada** | `(0,7071; 0,7071)` | 1 | 200 px (141,42 em cada eixo) |
| Esquerda + Direita | `(0, 0)` | 0 | 0 px |

**Normalizar** um vetor (veja [o capítulo sobre vetores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#a-norma-de-um-vetor-seu-comprimento)) consiste em dividir cada uma de suas componentes pelo seu comprimento: a direção continua a mesma, e o comprimento passa a ser exatamente 1. Aqui, `(1 / 1,41 ; 1 / 1,41) = (0,7071 ; 0,7071)`, de comprimento `raiz(0,7071² + 0,7071²) = raiz(1) = 1`. Normaliza-se a direção **antes** de multiplicá-la pela velocidade.

A última linha da tabela é a armadilha: esquerda e direita pressionadas juntas se anulam, a direção é o **vetor nulo** `(0, 0)`, de comprimento 0. Normalizar é dividir por 0: o resultado é **NaN** (*Not a Number*, "não é um número", o valor que `0 / 0` produz); uma posição que vira NaN continua assim, pois qualquer cálculo com NaN dá NaN, e o quadrado **desaparece da tela** para sempre. Daí uma guarda: nunca se normaliza um vetor nulo.

```cpp
#include <cmath>   // cabeçalho das funções matemáticas do C++: std::sqrt
// ... o restante de Game não muda ; só a função update é substituída:

void update(float dt)
{
    const float speed = 200.f;   // pixels por segundo
    sf::Vector2f direction(0.f, 0.f);
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
        direction.x -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
        direction.x += 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
        direction.y -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
        direction.y += 1.f;

    // std::sqrt calcula a raiz quadrada ; o comprimento é o do teorema de Pitágoras
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0.f) {   // GUARDA: nunca dividir por um comprimento nulo
        direction /= length;   // normaliza: cada componente é dividida pelo comprimento
        player.move(direction * speed * dt);   // velocidade x dt, na direção normalizada
    }
}
```

Medido por um pequeno programa de teste escrito para este capítulo (sem SFML): sem guarda, `(0, 0)` normalizado dá `(nan, nan)` (o sinal exibido varia conforme a máquina); com guarda, `(0, 0)`.

## Uma operação longa em uma volta trava o jogo

Os eventos só são lidos na etapa 2 de **cada** volta. Uma volta que dura 2 segundos deixa o jogador sem resposta durante 2 segundos: nenhuma tecla é tratada, a janela não é mais redesenhada, e o sistema pode exibir "não responde" e propor fechar o programa. O tempo disponível por volta depende da cadência visada:

| Imagens por segundo visadas | Duração disponível por volta (1000 ms / imagens) |
|---|---|
| 30 | 33,33 ms (um milissegundo, ms, é um milésimo de segundo) |
| 60 | 16,67 ms |
| 144 | 6,94 ms |

Uma atualização mais lenta que esse orçamento faz cair a cadência: a 50 ms por volta, o jogo roda a 20 imagens por segundo. Dois remédios:

| Remédio | Princípio |
|---|---|
| **Dividir o trabalho** | Fazer uma pequena fatia por volta (um nível pesado em cada dez, a cada imagem), de modo que cada volta fique abaixo do orçamento |
| **Delegar a outra linha de execução** (*thread*) | Uma **thread** é uma segunda linha de execução do programa, que avança ao mesmo tempo que a primeira (veja [as threads](/?c=langages&s=c&p=threads)): o cálculo pesado acontece ali enquanto o loop continua girando; em contrapartida, as duas threads não devem modificar os mesmos dados ao mesmo tempo |

```cpp
// Ruim: todo o carregamento em uma única volta, a janela fica travada por 2 segundos
void update(float dt)
{
    loadAllLevels();   // função imaginária, muito longa
}

// Melhor: uma única fatia por volta ; loaded e total são dois inteiros da classe
void update(float dt)
{
    if (loaded < total)           // ainda há trabalho a fazer
        loadOneLevel(loaded++);   // função imaginária: carrega um nível, passa ao seguinte
}
```

## Sem limite de imagens, o loop consome todo o processador

Nada no loop o obriga a esperar: ele encadeia as voltas o mais rápido possível, milhares de imagens por segundo, quase nenhuma delas visível (uma tela só exibe 60 ou 144 imagens por segundo). Um **núcleo** do processador (uma das unidades de cálculo independentes de que ele é feito) fica então a 100% sem utilidade: o computador esquenta, o ventilador dispara, a bateria acaba. Existem dois ajustes no SFML 2:

| Ajuste | Efeito | Observação |
|---|---|---|
| Nenhum | Cadência máxima, um núcleo a 100% | A evitar, exceto para medir o desempenho |
| `window.setFramerateLimit(60)` | Após cada `display()`, o programa dorme o suficiente para não passar de 60 imagens por segundo | Ajuste simples; a cadência real é aproximada |
| `window.setVerticalSyncEnabled(true)` | `display()` espera a próxima atualização da tela: veja [a sincronização vertical](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#a-sincronizacao-vertical-vsync) | Evita o *tearing* (imagem partida ao meio, veja o double buffering); o driver pode desativá-la |

A documentação do SFML desaconselha ativar os dois ao mesmo tempo. Nenhum dos dois regula a **velocidade** do jogo: só o delta time o faz, porque a cadência real varia de uma máquina para outra.

## A ordem das etapas importa

As quatro etapas não são intercambiáveis. Cada permutação produz um defeito preciso:

| Ordem errada | Sintoma |
|---|---|
| `clear` **depois** de `draw` (antes de `display`) | Tela vazia: o desenho é apagado antes de ser exibido |
| `display` **antes** de `draw` | A imagem exibida tem uma volta de atraso, às vezes cintilante |
| `render` **antes** de `update` | O que é desenhado é o estado de antes da atualização: uma volta de atraso |
| `update` **antes** de `processEvents` | As ordens do jogador só são levadas em conta na volta seguinte: uma imagem de latência a mais |

A ordem de referência: tempo, eventos, atualização, depois `clear`, `draw`, `display`.

## A alternativa: o loop guiado por eventos

Em vez de consultar a fila de espera a cada volta (*polling*), o programa pode **adormecer** até a chegada de um evento: é uma **espera bloqueante** (o programa fica suspenso e quase não consome nada enquanto nada acontece). O SFML 2 oferece isso com `waitEvent`, que bloqueia até um evento e então o devolve:

```cpp
// Colocar na classe Game, ao lado de run(): um loop que reage, sem dt
void runEventDriven()
{
    render();           // um primeiro desenho, antes da primeira espera
    sf::Event event;
    // waitEvent adormece o programa até a chegada de um evento, depois o guarda em
    // "event" ; devolve falso em caso de erro, o que interrompe o loop
    while (window.isOpen() && window.waitEvent(event)) {
        if (event.type == sf::Event::Closed)   // clique no botão de fechar
            window.close();
        if (event.type == sf::Event::KeyPressed
            && event.key.code == sf::Keyboard::Right)
            player.move(10.f, 0.f);   // um passo fixo de 10 pixels a cada pressionamento
        render();                     // só redesenhamos depois de um evento
    }
}
```

Aqui, **nada se mexe sem evento**: o quadrado avança um passo a cada pressionamento, nunca sozinho. Não é preciso `dt`: o deslocamento está ligado ao evento, não ao tempo. Um jogo de ação precisa do contrário (os inimigos avançam mesmo quando o jogador não toca em nada).

| | Loop contínuo (`pollEvent`) | Loop guiado por eventos (`waitEvent`) |
|---|---|---|
| Princípio | Uma volta após a outra, sem esperar | O programa dorme até o próximo evento |
| Cálculo em repouso | Constante: uma volta completa por imagem, mesmo sem nada a fazer | Quase nulo: o processador fica livre |
| Se o jogador não faz nada | O mundo continua avançando (inimigos, queda, animações) | Nada se mexe |
| Delta time | Indispensável | Sem objeto para o movimento |
| Limite de imagens | Necessário | Desnecessário: o ritmo vem dos eventos |
| Serve para | Jogos de ação, simulações, animações | Editores, jogos por turnos (xadrez, cartas), ferramentas |
| Armadilha principal | Loop guloso demais ou travado por um cálculo longo | Animação impossível, pois nada acorda o loop |

As duas formas de loop se combinam: um aplicativo de edição espera os eventos enquanto o usuário não age, e passa ao loop contínuo durante uma animação.

## As armadilhas

| Armadilha | Sintoma | Correção |
|---|---|---|
| Sem loop | A janela aparece e desaparece logo em seguida | `while (window.isOpen())` em volta da volta |
| Uma operação longa em uma volta | Janela travada, "não responde" | Dividir o trabalho ou confiá-lo a outra thread |
| Sem limite de imagens | Um núcleo a 100%, ventilador barulhento | `setFramerateLimit(60)` **ou** `setVerticalSyncEnabled(true)`, não os dois |
| Ordem das etapas errada | Tela vazia, imagens atrasadas, latência | Tempo, eventos, atualização, `clear`, `draw`, `display` |
| `dt` enorme após uma pausa ou um movimento da janela | O quadrado pula várias centenas de pixels | Limitar `dt` (por exemplo a 0,1 s) |
| Esquecer `window.clear()` | Cada imagem se sobrepõe às anteriores: rastros, imagem que borra | Apagar no início de cada desenho |
| Ler um movimento contínuo em `KeyPressed` | Um só passo ao pressionar, depois uma pausa, depois passos entrecortados (a repetição do sistema) | `isKeyPressed` em `update` para um movimento contínuo; `KeyPressed` para as ações pontuais |
| Achar que `isKeyPressed` depende da janela | Ele lê o teclado a qualquer momento: o quadrado se move mesmo que o usuário digite em outra janela | Só considerar as teclas se `window.hasFocus()` for verdadeiro (a janela é a que recebe o teclado: o *focus*) |
| Inteiros na velocidade ou em `dt` | Velocidade baixa demais, ou nula; `1 / 60` vale 0 | Tudo em `float`; escrever `1.f / 60` |
| Somar as teclas sem normalizar | Diagonal 1,41 vez mais rápida | Normalizar a direção |
| Normalizar um vetor nulo | Divisão por 0, NaN, quadrado desaparecido | Testar `length > 0.f` antes de dividir |
| Um único cronômetro para dois usos | `dt` errado | Um `sf::Clock` por uso |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Uma função por etapa (`processEvents`, `update`, `render`) | Cada etapa se lê, se testa e se modifica sozinha |
| `update` não desenha, `render` não modifica o estado | O estado permanece coerente; é possível mudar a exibição sem tocar nas regras do jogo |
| Todas as velocidades em unidades por segundo, multiplicadas por `dt` | Mesma velocidade em todas as máquinas |
| Limitar `dt` | Uma pausa não teleporta mais os objetos |
| Um limite de imagens (`setFramerateLimit` ou vsync) | O processador não é desperdiçado |
| Normalizar a direção, com guarda contra o vetor nulo | Mesma velocidade em todas as direções, nunca NaN |
| Evento para as ações pontuais, `isKeyPressed` para os movimentos contínuos | Cada necessidade usa a ferramenta que lhe corresponde |
| Manter `update` curta; dividir ou delegar os cálculos grandes | A janela permanece responsiva |
| Escolher o loop conforme o programa: contínuo para um mundo que vive sozinho, guiado por eventos para uma ferramenta | Um loop contínuo sem motivo desperdiça a bateria |

Para aprofundar: o [tutorial oficial sobre eventos](https://www.sfml-dev.org/tutorials/2.6/window-events.php) (`pollEvent`, `waitEvent`, tipos de evento), a página de [`sf::Clock`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Clock.php) (o cronômetro e `restart()`), a página de [`sf::Keyboard`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Keyboard.php) (`isKeyPressed` e os nomes das teclas) e a página de [`sf::Window`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Window.php) (`setFramerateLimit`, `setVerticalSyncEnabled`, `hasFocus`).

## O que reter

| Para reter | Detalhe |
|---|---|
| Sem loop, o programa termina | `main` para na última linha: a janela desaparece na hora |
| Uma volta = quatro etapas nesta ordem | Tempo (`dt`), eventos, atualização do estado, desenho (`clear`, `draw`, `display`) |
| `Game::run` | O loop `while (window.isOpen())` chama `processEvents`, `update(dt)` e `render` ; `dt = clock.restart().asSeconds()` |
| Velocidade | Em pixels por segundo, multiplicada por `dt`: 200 px/s dá 3,33 px por imagem a 60 imagens por segundo e 6,67 px a 30, ou seja 200 px nos dois casos |
| Diagonal | `(1, 1)` tem comprimento raiz(2), cerca de 1,41: o deslocamento vai 1,41 vez mais rápido; normaliza-se (divisão pelo comprimento) |
| Vetor nulo | Nunca normalizado: `length > 0.f` antes da divisão, senão NaN |
| Loop contínuo contra loop guiado por eventos | `pollEvent` (o mundo avança sozinho, custo constante) contra `waitEvent` (quase nenhum cálculo em repouso, mas nada se mexe sem evento) |
| Limites | Uma operação longa trava o jogo; sem limite de imagens o loop consome um núcleo inteiro; a ordem das etapas importa |
| Armadilhas de `dt` | Limitar após uma pausa; tudo em `float`; um cronômetro por uso |
| Não confundir | Evento `KeyPressed` (pontual) e `isKeyPressed` (estado contínuo) |
