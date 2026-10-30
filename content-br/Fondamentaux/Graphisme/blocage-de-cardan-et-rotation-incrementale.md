---
order: 11
---

# Bloqueio de cardã e rotação incremental

Uma **orientação** é a maneira como um objeto é girado no espaço, deixando de lado a sua posição: um avião que mergulha de nariz, uma câmera que olha para cima, um modelo 3D que se faz girar com o mouse. Para memorizá-la, a ideia mais natural é guardar **três ângulos**, um por eixo: são os **ângulos de Euler**. Ela funciona bem, até um valor preciso em que dois dos três comandos passam a fazer a mesma coisa: um movimento se torna impossível e a vista pode saltar. Esse defeito se chama **bloqueio de cardã** (*gimbal lock*, em inglês). Um **cardã** é uma suspensão formada por anéis encaixados, cada um girando dentro do seguinte, como a de uma bússola de navio ou de um giroscópio; o bloqueio ocorre quando dois desses anéis ficam no mesmo plano. Os cálculos abaixo reproduzem essa montagem com matrizes ([detalhe do fenômeno](https://en.wikipedia.org/wiki/Gimbal_lock)).

Este capítulo mostra o defeito por medições, contorna-o guardando uma matriz em vez de ângulos e depois trata do preço a pagar:

| Etapa | Pergunta | Seção |
|---|---|---|
| 1 | O que é um ângulo de Euler, e por que a ordem das rotações importa? | [Os ângulos de Euler](#os-angulos-de-euler-tres-numeros-tres-eixos) |
| 2 | O que acontece exatamente no momento do bloqueio? | [O bloqueio de cardã](#o-bloqueio-de-carda-quando-dois-eixos-viram-um-so) |
| 3 | Como evitá-lo? | [A rotação incremental](#a-rotacao-incremental-guardar-a-matriz-nao-os-angulos) |
| 4 | Que erro essa matriz acumula, e como eliminá-lo? | [O erro de arredondamento](#o-erro-de-arredondamento-que-se-acumula) e depois [a reortonormalização](#a-reortonormalizacao-por-a-matriz-de-volta-no-prumo) |
| 5 | Quando manter ângulos mesmo assim? | [As variantes](#as-variantes-quaternios-e-angulos-limitados) |

Ele prolonga [Matrizes e câmera](/?c=fondamentaux&s=graphisme&p=matrices-et-camera), que constrói as matrizes de rotação, apresenta a [rotação acumulada](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-um-objeto-a-rotacao-acumulada) e a [fórmula de Rodrigues](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-em-torno-de-um-eixo-qualquer-a-formula-de-rodrigues): ele as usa sem redemonstrá-las. Supõe conhecidas [as matrizes e o produto matricial](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) (uma tabela de números, e a maneira de multiplicar duas tabelas), [os vetores, o produto escalar e a norma](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (uma lista de números, a soma de seus produtos dois a dois, e o comprimento do vetor), e as bases do C: [as variáveis](/?c=langages&s=c&p=variables), [as condições](/?c=langages&s=c&p=conditions) e [os laços](/?c=langages&s=c&p=boucles).

Todos os programas se compilam com `gcc -std=c99 -Wall -Wextra -o programa programa.c -lm` (ver [o processo de compilação](/?c=langages&s=c&p=compilation): `-Wall -Wextra` pedem todos os avisos, `-lm` acrescenta a biblioteca matemática) e se executam com `./programa` (no Linux ou no macOS). As saídas reproduzidas neste capítulo foram todas obtidas na execução. Regra de montagem: um programa é formado por **todos os blocos de funções que o precedem**, na ordem, seguidos de **um único bloco contendo `main`** (a função pela qual um programa C começa). Os blocos que já contêm um `main` servem apenas a eles mesmos.

## Os ângulos de Euler: três números, três eixos

Um **eixo** é a reta em torno da qual se gira, como a haste de um pião. O espaço tem três, nomeados como em [o capítulo sobre matrizes](/?c=fondamentaux&s=graphisme&p=matrices-et-camera): **X** para a direita, **Y** para cima, **Z** na direção de você, saindo da tela (a câmera olha, portanto, para -Z). Os ângulos de Euler, em homenagem ao matemático Leonhard Euler ([detalhe](https://en.wikipedia.org/wiki/Euler_angles)), descrevem uma orientação por uma rotação em torno de cada um:

| Ângulo | Nome em inglês | Eixo | O gesto da cabeça | Para um avião |
|---|---|---|---|---|
| **Arfagem** | *pitch* | X | Balançar a cabeça para dizer « sim » | O nariz sobe ou desce |
| **Guinada** | *yaw* | Y | Virar a cabeça para dizer « não » | O nariz vai para a esquerda ou para a direita |
| **Rolagem** | *roll* | Z | Inclinar a cabeça, a orelha em direção ao ombro | As asas se inclinam |

```text
            Y (cima)  guinada: girar em torno de Y
            ^
            |
            |
            +---------> X (direita)  arfagem: girar em torno de X
           /
          /
         v
        Z (para você)                rolagem: girar em torno de Z
```

Um ângulo se mede em **graus** (uma volta completa vale 360) ou em **radianos** (180 graus valem π, ou seja cerca de 3,14159 radianos; [lembrete](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#do-objeto-a-tela-model-view-projection) com o cosseno e o seno). As funções `cos` e `sin` do C esperam radianos. O sentido positivo é o da **regra da mão direita**: o polegar ao longo do eixo, apontado para si, os dedos que se fecham dão o sentido de rotação de um ângulo positivo.

Cada rotação é uma matriz 3×3, a versão sem translação das do [capítulo anterior](/?c=fondamentaux&s=graphisme&p=matrices-et-camera). Para uma tal matriz, a **coluna j** indica onde vai a seta de comprimento 1 posta sobre o eixo j (coluna 0 para X, 1 para Y, 2 para Z): é o que dá o produto da matriz por essa seta. Os blocos de código que seguem usam algumas notações do C:

| Escrita | Sentido |
|---|---|
| `#include <math.h>` | Carrega uma biblioteca de funções ([os cabeçalhos](/?c=langages&s=c&p=headers)). `math.h` traz `cos`, `sin`, `sqrt` (raiz quadrada) e `fabs` (valor absoluto: o número sem o seu sinal), ver a [lista das funções de `<math.h>`](https://en.cppreference.com/w/c/numeric/math); `stdio.h` traz `printf` |
| `int`, `long` | Números inteiros (`long`: um intervalo maior), ver [as variáveis](/?c=langages&s=c&p=variables) |
| `float`, `double` | Números de ponto flutuante armazenados em 32 e 64 bits, ou seja cerca de 7 e 15 algarismos exatos ([detalhe](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#como-um-float-e-codificado)). As funções `cos`, `sin`, `sqrt` calculam em `double` |
| `1e-9`, `3.0e-08` | Notação científica: `1e-9` vale 10⁻⁹, ou seja 0,000000001 |
| `const` | Um valor que nunca vai mudar |
| `float v[3]` | Um array: 3 números dispostos lado a lado, `v[0]`, `v[1]`, `v[2]`, que se preenche com `{1, 0, 0}` |
| `typedef struct { ... } Nome;` | Agrupa vários valores sob um único nome de tipo; `e.campo` designa o campo `campo` do valor `e` |
| `m[i][j]` | A casela da linha `i` e da coluna `j` de um array bidimensional; conta-se a partir de 0 |
| `for (int i = 0; i < 3; i++)` | Repete a instrução seguinte com `i` valendo 0, depois 1, depois 2 |
| `a % b` | O resto da divisão de `a` por `b` |
| `a += b`, `a -= b`, `a /= b` | Atalhos para `a = a + b`, `a = a - b`, `a = a / b` |
| `a == b`, `a && b` | `==` compara dois valores (verdadeiro se forem iguais); `&&` significa « e » |
| Uma função | Um trecho de código com nome: `Mat3 produto(Mat3 a, Mat3 b)` recebe duas matrizes e devolve uma (`return`) |
| `x ? a : b` | Vale `a` se a condição `x` for verdadeira, `b` caso contrário |

O primeiro bloco escreve as rotações em torno de um eixo, o produto de duas matrizes e a aplicação de uma matriz a um ponto. Uma única função `rotacao_eixo` fabrica as três rotações: para o eixo 2 (Z), ela preenche exatamente a matriz da tabela do capítulo vizinho.

```c
#include <math.h>      // cos, sin, sqrt, fabs...
#include <stdio.h>     // printf

// Um ângulo de 1 grau, expresso em radianos: π / 180
const float DEG = 0.017453292;

// Uma matriz 3 x 3 de float, lida m[linha][coluna]; typedef lhe dá um nome curto
typedef struct { float m[3][3]; } Mat3;

// Matriz de rotação de "angulo" radianos em torno do eixo 0 (X), 1 (Y) ou 2 (Z)
Mat3 rotacao_eixo(int eixo, float angulo)
{
    Mat3 r = {{{0}}};                       // toda a matriz começa em 0
    int i = (eixo + 1) % 3;                 // os outros dois eixos, na ordem X, Y, Z
    int j = (eixo + 2) % 3;                 // (% é o resto da divisão: 2 + 1 dá 0)
    r.m[eixo][eixo] = 1;                    // o próprio eixo de rotação não se mexe
    r.m[i][i] = cos(angulo);                // cos e sin calculam em double;
    r.m[i][j] = -sin(angulo);               // o resultado é guardado em um float
    r.m[j][i] = sin(angulo);                // segunda casela fora da diagonal: seno
    r.m[j][j] = cos(angulo);                // segunda casela da diagonal: cosseno
    return r;
}

// Produto matricial a * b: o elemento (i, j) é o produto escalar da linha i
// de a pela coluna j de b
Mat3 produto(Mat3 a, Mat3 b)
{
    Mat3 r = {{{0}}};                       // o resultado, preenchido casela por casela
    for (int i = 0; i < 3; i++)             // cada linha i do resultado
        for (int j = 0; j < 3; j++)         // cada coluna j do resultado
            for (int k = 0; k < 3; k++)     // soma dos três produtos linha x coluna
                r.m[i][j] += a.m[i][k] * b.m[k][j];  // acumula um produto na casela (i, j)
    return r;
}

// Imagem do ponto p pela matriz a: o vetor a * p, guardado em v (void: nada a devolver)
void aplicar(Mat3 a, const float p[3], float v[3])
{
    for (int i = 0; i < 3; i++)             // cada coordenada do resultado
        // linha i de a, multiplicada termo a termo por p, depois somada
        v[i] = a.m[i][0] * p[0] + a.m[i][1] * p[1] + a.m[i][2] * p[2];
}

// Zera um resto de arredondamento (menor que 0,00005) para uma exibição legível;
// « x ? a : b » vale a se a condição x for verdadeira, b caso contrário
float limpa(float x)
{
    return fabs(x) < 0.00005 ? 0 : x;
}
```

O programa seguinte compõe duas rotações de 90 graus nas duas ordens. `printf("(%.0f, %.0f)\n", x, y)` exibe um texto no qual cada `%` é substituído por um valor dado em seguida (`%.0f`: um número de ponto flutuante sem casa decimal), e `\n` passa para a linha seguinte; `return 0` diz ao sistema que o programa terminou bem.

```c
int main(void)
{
    const float partida[3] = {1, 0, 0};    // um ponto posto sobre o eixo X
    float v[3];                             // o ponto após a rotação
    // Z (eixo 2) depois X (eixo 0): o produto se escreve X * Z
    Mat3 z_depois_x = produto(rotacao_eixo(0, 90 * DEG), rotacao_eixo(2, 90 * DEG));
    // X (eixo 0) depois Z (eixo 2): o produto se escreve Z * X
    Mat3 x_depois_z = produto(rotacao_eixo(2, 90 * DEG), rotacao_eixo(0, 90 * DEG));

    aplicar(z_depois_x, partida, v);        // Z age primeiro (matriz mais à direita)
    // as três coordenadas, sem resto de arredondamento
    printf("Z depois X: (%.0f, %.0f, %.0f)\n", limpa(v[0]), limpa(v[1]), limpa(v[2]));
    aplicar(x_depois_z, partida, v);        // X age primeiro
    printf("X depois Z: (%.0f, %.0f, %.0f)\n", limpa(v[0]), limpa(v[1]), limpa(v[2])); // idem
    return 0;
}
```

```text
Z depois X: (0, 0, 1)
X depois Z: (0, 1, 0)
```

| Ordem | O que faz o ponto (1, 0, 0) | Resultado |
|---|---|---|
| Z depois X | Z o leva do eixo X ao eixo Y; X o faz passar em seguida de Y para Z | (0, 0, 1) |
| X depois Z | X o deixa no lugar (ele está sobre o eixo X); Z o leva em seguida a Y | (0, 1, 0) |

**A ordem importa**: duas rotações não comutam. Para três ângulos, é preciso portanto **escolher uma ordem de uma vez por todas** e mantê-la. Este capítulo adota **guinada, arfagem, rolagem**: a orientação é o produto `Ry(guinada) × Rx(arfagem) × Rz(rolagem)`. O produto se lê da direita para a esquerda, como no capítulo sobre matrizes: a rolagem age primeiro sobre o objeto, a arfagem depois, a guinada por último.

### Por que é tentador

| Vantagem | Detalhe |
|---|---|
| Legível | « arfagem de 30 graus » fala a um humano; nove coeficientes de matriz, não |
| Fácil de comandar com o mouse | Um deslocamento horizontal soma à guinada, um deslocamento vertical soma à arfagem |
| Leve | 3 números em vez de 9 |
| Nenhuma deriva | A matriz é recalculada a partir dos 3 ângulos: ela é sempre uma rotação exata, a menos dos arredondamentos |
| Simples de escrever em um arquivo ou em um editor | Três cursores, três campos de entrada |

O preço a pagar aparece na seção seguinte.

## O bloqueio de cardã: quando dois eixos viram um só

O produto `Ry(guinada) × Rx(arfagem) × Rz(rolagem)` faz agir a rolagem em torno de Z, depois a arfagem faz tombar esse eixo Z. Quando a arfagem vale 90 graus, ela o deita exatamente sobre o eixo Y, o da guinada: rolagem e guinada giram então em torno do **mesmo eixo**.

```text
Arfagem 0 grau                        Arfagem 90 graus

    Y = eixo da guinada                   Y = eixo da guinada
    ^                                     ^  = eixo da rolagem (deitado pela arfagem)
    |                                     |
    +-----> X                             +-----> X
   /                                     /
  Z = eixo da rolagem                   Z: nenhum ângulo gira mais em torno dele

três eixos diferentes:                dois eixos coincidentes:
três rotações possíveis               duas rotações possíveis
```

Uma rotação se perde: diz-se que se tem **um grau de liberdade a menos** (um grau de liberdade é uma maneira independente de se mover: aqui, três no início, dois no bloqueio). O programa seguinte prova isso com os 9 coeficientes da matriz. Ele fabrica uma orientação a partir de uma ordem de eixos e de três ângulos, mede o maior desvio entre duas matrizes (`desvio_max`) e exibe uma matriz (`exibir`). Em `exibir`, `const char *nome` é um texto; `%s` o insere na exibição e `%7.4f` escreve um número decimal em 7 caracteres de largura, com 4 casas decimais.

```c
// Orientação descrita por três ângulos: produto das rotações ordem[0], ordem[1], ordem[2]
// de ângulos angulo[0], angulo[1], angulo[2]; a rotação escrita por último age primeiro
Mat3 euler(const int ordem[3], const float angulo[3])
{
    Mat3 r = rotacao_eixo(ordem[0], angulo[0]);    // a primeira do produto
    // multiplica pela segunda rotação
    r = produto(r, rotacao_eixo(ordem[1], angulo[1]));
    return produto(r, rotacao_eixo(ordem[2], angulo[2]));
}

// Maior desvio, em valor absoluto, entre os 9 coeficientes de a e os de b
float desvio_max(Mat3 a, Mat3 b)
{
    float pior = 0;                         // o maior desvio encontrado
    for (int i = 0; i < 3; i++)             // cada linha
        for (int j = 0; j < 3; j++)         // cada coluna
            if (fabs(a.m[i][j] - b.m[i][j]) > pior)  // este desvio bate o recorde?
                pior = fabs(a.m[i][j] - b.m[i][j]);  // sim: ele vira o recorde
    return pior;
}

// Exibe uma matriz, uma linha de três coeficientes por linha de texto;
// « const char *nome » é um texto (um endereço de caracteres), %s o insere
void exibir(const char *nome, Mat3 a)
{
    printf("%s\n", nome);                   // o título da matriz
    for (int i = 0; i < 3; i++)             // uma linha de texto por linha da matriz
        // os três coeficientes da linha
        printf("  %7.4f %7.4f %7.4f\n", limpa(a.m[i][0]), limpa(a.m[i][1]), limpa(a.m[i][2]));
}
```

Três conjuntos de ângulos {guinada, arfagem, rolagem} compartilham a mesma arfagem de 90 graus e a mesma diferença guinada menos rolagem (20). Outros dois, a 45 graus, têm as mesmas guinadas e rolagens. `%.1e` exibe um número em notação científica com uma casa decimal: `3.0e-08` vale 3,0 × 10⁻⁸, ou seja 0,00000003.

```c
int main(void)
{
    const int ordem[3] = {1, 0, 2};         // guinada (Y), arfagem (X), rolagem (Z)
    // Cada conjunto de ângulos se escreve {guinada, arfagem, rolagem}
    const float a[3] = {30 * DEG, 90 * DEG, 10 * DEG};
    // mesma arfagem; guinada e rolagem aumentadas em 20 graus
    const float b[3] = {50 * DEG, 90 * DEG, 30 * DEG};
    // mesma arfagem; guinada menos rolagem continua valendo 20
    const float c[3] = {20 * DEG, 90 * DEG, 0 * DEG};
    const float d[3] = {30 * DEG, 45 * DEG, 10 * DEG};      // mesma guinada e rolagem que a,
    const float e[3] = {50 * DEG, 45 * DEG, 30 * DEG};      // mas arfagem de 45 graus

    // os 9 coeficientes do conjunto A
    exibir("A: guinada 30, arfagem 90, rolagem 10", euler(ordem, a));
    exibir("B: guinada 50, arfagem 90, rolagem 30", euler(ordem, b));  // os do conjunto B
    exibir("C: guinada 20, arfagem 90, rolagem 0", euler(ordem, c));  // os do conjunto C
    // maior desvio entre as matrizes A e B
    printf("desvio A-B: %.1e\n", desvio_max(euler(ordem, a), euler(ordem, b)));
    // entre A e C
    printf("desvio A-C: %.1e\n", desvio_max(euler(ordem, a), euler(ordem, c)));
    // entre D e E
    printf("desvio D-E (arfagem 45): %.1e\n", desvio_max(euler(ordem, d), euler(ordem, e)));
    return 0;
}
```

```text
A: guinada 30, arfagem 90, rolagem 10
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
B: guinada 50, arfagem 90, rolagem 30
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
C: guinada 20, arfagem 90, rolagem 0
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
desvio A-B: 3.0e-08
desvio A-C: 3.0e-08
desvio D-E (arfagem 45): 2.3e-01
```

| Comparação | Arfagem | Maior desvio entre os 9 coeficientes | Leitura |
|---|---|---|---|
| A (30, 90, 10) contra B (50, 90, 30) | 90 graus | 3,0 × 10⁻⁸ | Mesma matriz (a menos do ruído de arredondamento) |
| A (30, 90, 10) contra C (20, 90, 0) | 90 graus | 3,0 × 10⁻⁸ | Mesma matriz |
| D (30, 45, 10) contra E (50, 45, 30) | 45 graus | 0,23 | Duas orientações bem diferentes |

Três conjuntos de ângulos distintos dão **a mesma orientação**: a 90 graus, só conta a diferença guinada menos rolagem. O cálculo à mão confirma: `Ry(a) × Rx(90°) × Rz(c) = Ry(a - c) × Rx(90°)`. A tabela das ordens mais adiante verifica essa regra pela medição.

### Medir a liberdade perdida

Para saber em torno de qual eixo cada ângulo faz o objeto girar, faz-se esse ângulo variar de um passo muito pequeno (0,001 radiano) e lê-se o eixo da pequena rotação obtida. A **transposta** de uma matriz troca suas linhas e colunas ([lembrete](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#a-transposta-trocar-linhas-e-colunas)); para uma rotação, ela é também a sua **inversa**: a rotação que desfaz exatamente a primeira. Multiplicar uma orientação `depois` pela transposta de `antes` dá, portanto, a rotação que leva de uma à outra, cujo eixo se lê nas diferenças entre elementos simétricos (`r21 - r12`, ..., onde `rij` é o elemento da linha `i` e da coluna `j`, como em [a seção sobre o eixo e o ângulo](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#recuperar-o-eixo-e-o-angulo-de-uma-rotacao)).

```c
// Transposta de a: linhas e colunas trocadas. Para uma rotação, é também
// a sua inversa: a rotação que desfaz exatamente a
Mat3 transposta(Mat3 a)
{
    Mat3 t = {{{0}}};                       // a transposta, preenchida casela por casela
    for (int i = 0; i < 3; i++)             // cada linha i de a
        for (int j = 0; j < 3; j++)         // cada coluna j de a
            t.m[j][i] = a.m[i][j];          // torna-se a linha j, coluna i de t
    return t;
}

// Velocidade de rotação entre duas orientações muito próximas: o eixo da pequena rotação
// que leva de antes a depois, lido nas diferenças r21 - r12, r02 - r20, r10 - r01
void velocidade(Mat3 antes, Mat3 depois, float passo, float w[3])
{
    Mat3 r = produto(depois, transposta(antes));    // a rotação que leva de antes a depois
    w[0] = (r.m[2][1] - r.m[1][2]) / (2 * passo);   // componente segundo X
    w[1] = (r.m[0][2] - r.m[2][0]) / (2 * passo);   // componente segundo Y
    w[2] = (r.m[1][0] - r.m[0][1]) / (2 * passo);   // componente segundo Z
}
```

```c
int main(void)
{
    const int ordem[3] = {1, 0, 2};         // guinada (Y), arfagem (X), rolagem (Z)
    // os nomes exibidos dos três ângulos
    const char *nome[3] = {"guinada", "arfagem", "rolagem"};
    const float passo = 0.001;              // faz-se cada ângulo variar de 0,001 radiano
    // as duas arfagens testadas: 0 e 90 graus
    const float arfagens[2] = {0 * DEG, 90 * DEG};

    for (int t = 0; t < 2; t++) {           // uma série com arfagem 0, uma com 90
        float angulo[3] = {0, arfagens[t], 0};  // guinada 0, arfagem da série, rolagem 0
        Mat3 antes = euler(ordem, angulo);  // a orientação de partida
        printf("arfagem %.0f graus\n", arfagens[t] / DEG);  // o título da série
        for (int i = 0; i < 3; i++) {       // move-se um só dos três ângulos
            float w[3];                     // o eixo medido, preenchido por velocidade
            // cópia dos ângulos, dos quais um só vai mudar
            float mexe[3] = {angulo[0], angulo[1], angulo[2]};
            mexe[i] += passo;               // o ângulo número i aumenta de 0,001 radiano
            // o eixo da pequena rotação obtida
            velocidade(antes, euler(ordem, mexe), passo, w);
            // %-8s: um texto, completado por espaços até 8 caracteres
            printf("  %-8s gira em torno de (%6.3f, %6.3f, %6.3f)\n", nome[i],
                   limpa(w[0]), limpa(w[1]), limpa(w[2]));
        }
    }
    return 0;
}
```

```text
arfagem 0 graus
  guinada  gira em torno de ( 0.000,  1.000,  0.000)
  arfagem  gira em torno de ( 1.000,  0.000,  0.000)
  rolagem  gira em torno de ( 0.000,  0.000,  1.000)
arfagem 90 graus
  guinada  gira em torno de ( 0.000,  1.000,  0.000)
  arfagem  gira em torno de ( 1.000,  0.000,  0.000)
  rolagem  gira em torno de ( 0.000, -1.000,  0.000)
```

| Arfagem | Eixo da guinada | Eixo da arfagem | Eixo da rolagem | Eixos distintos |
|---|---|---|---|---|
| 0 grau | (0, 1, 0) | (1, 0, 0) | (0, 0, 1) | 3: todo movimento é possível |
| 90 graus | (0, 1, 0) | (1, 0, 0) | **(0, -1, 0)** | 2: a rolagem gira em torno do eixo da guinada, em sentido contrário |

No bloqueio, **nenhum ângulo faz mais o objeto girar em torno de Z** (o eixo que aponta para você). Para inclinar a vista, o único recurso é sair dos 90 graus, por exemplo mudando a arfagem.

### O sintoma: a visão que salta no zênite

O **zênite** é o ponto situado na vertical acima de si. Quando o nariz de um objeto ou o olhar de uma câmera passa por ali, os ângulos que o descrevem mudam bruscamente, embora o movimento seja mínimo. Para vê-lo, é preciso reler a guinada a partir de uma direção: `atan2(a, b)` dá o ângulo do ponto (b, a) visto da origem, na faixa de -180 a 180 graus, e sabe em qual quarto de volta o ponto se encontra.

```c
// Guinada, em graus, que os ângulos de Euler (ordem Y, X, Z) atribuem a um nariz que aponta
// para (x, y, z). atan2(a, b) devolve o ângulo do ponto (b, a) visto da origem,
// de -180 a 180 graus (asin, o arco-seno, daria a arfagem: o ângulo cujo seno é y)
float guinada_do_nariz(const float nariz[3])
{
    return atan2(-nariz[0], -nariz[2]) / DEG;
}

int main(void)
{
    const int ordem[3] = {1, 0, 2};         // guinada (Y), arfagem (X), rolagem (Z)
    // guinada 30 graus, arfagem 80 graus, rolagem 0
    const float angulo[3] = {30 * DEG, 80 * DEG, 0};
    const float frente[3] = {0, 0, -1};     // o nariz, antes de qualquer rotação: para -Z
    float nariz[3];                         // a direção do nariz após a rotação

    aplicar(euler(ordem, angulo), frente, nariz);       // para onde aponta o nariz?
    // a guinada relida deve valer 30
    printf("controle: guinada 30, arfagem 80 -> guinada relida %.1f\n",
           guinada_do_nariz(nariz));

    // Dois narizes quase verticais, afastados de 0,02 grau um do outro:
    // um pende 0,01 grau para a direita, o outro 0,01 grau para a esquerda
    const float desvio = sin(0.01 * DEG);
    const float direita[3] = {desvio, 1, 0};   // nariz a 0,01 grau da vertical, lado direito
    const float esquerda[3] = {-desvio, 1, 0}; // nariz a 0,01 grau da vertical, lado esquerdo
    // a guinada atribuída ao nariz da direita
    printf("nariz à direita: guinada %.1f\n", guinada_do_nariz(direita));
    // a guinada atribuída ao nariz da esquerda
    printf("nariz à esquerda: guinada %.1f\n", guinada_do_nariz(esquerda));
    return 0;
}
```

```text
controle: guinada 30, arfagem 80 -> guinada relida 30.0
nariz à direita: guinada -90.0
nariz à esquerda: guinada 90.0
```

A primeira linha controla a função: uma guinada de 30 graus é relida como 30,0. Os dois narizes seguintes estão afastados apenas por **0,02 grau** (um centésimo de grau de cada lado da vertical), mas a sua guinada difere de **180 graus**. Em um aplicativo, a vista gira portanto meia volta em torno da vertical de uma imagem para a seguinte (uma **imagem** é uma exibição da cena, ver o [loop de renderização](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-loop-de-renderizacao): costuma haver umas sessenta por segundo). O sintoma descrito é este: olhando bem para o alto, mover o mouse para o lado faz a vista girar sobre si mesma em vez de inclinar-se para aquele lado (a guinada e a rolagem têm o mesmo efeito, a menos do sentido de giro, como mostrou a medição anterior), e cruzar a vertical faz a exibição saltar.

### Qual eixo bloqueia, conforme a ordem escolhida?

Mudar a ordem não elimina o bloqueio: ele o desloca. O programa seguinte testa as seis ordens possíveis dos três eixos (o primeiro eixo age por último, como no produto escrito), com o ângulo **do meio** em 90, -90 e depois 45 graus. Para cada caso, ele faz mexer o primeiro e o último ângulo de 10 graus (no mesmo sentido, depois em sentidos contrários) e diz qual combinação dos dois continua em jogo: sua **diferença** (mexer os dois no mesmo sentido não muda nada) ou sua **soma** (mexer os dois em sentidos contrários não muda nada). Ele testa também a ordem Z X Z, que repete um eixo (os ângulos de Euler ditos « próprios », por oposição aos ângulos « de Tait-Bryan », de três eixos diferentes, [detalhe](https://en.wikipedia.org/wiki/Euler_angles)), com o ângulo do meio em 0, 180 e depois 90 graus. No bloco, `"diferença"` é um texto que a função devolve, `'X'` um caractere isolado, e `const int *o` designa o endereço de um array de três inteiros.

```c
// O que acontece com a matriz quando se mexe o primeiro e o último ângulo de 10 graus?
// Devolve "diferença" se só a diferença dos dois conta (mesmo sentido: nenhum efeito),
// "soma" se só a soma conta (sentidos contrários: nenhum efeito), "nenhum" caso contrário
const char *bloqueio(const int ordem[3], float meio)    // devolve um texto
{
    const float base[3] = {20 * DEG, meio, 35 * DEG};   // um ponto de partida qualquer
    const float mesmo[3] = {30 * DEG, meio, 45 * DEG};  // os dois extremos +10 graus
    const float inverso[3] = {30 * DEG, meio, 25 * DEG};  // primeiro +10, último -10
    Mat3 m = euler(ordem, base);            // a orientação de partida

    // mesmo sentido: a matriz fica inalterada?
    if (desvio_max(m, euler(ordem, mesmo)) < 0.0001)
        return "diferença";
    if (desvio_max(m, euler(ordem, inverso)) < 0.0001)  // sentidos contrários: inalterada?
        return "soma";
    return "nenhum";
}

int main(void)
{
    // As seis maneiras de dispor X (0), Y (1) e Z (2) em um produto de três rotações
    const int ordens[6][3] = {
        // cada trio é uma ordem de eixos ({0, 1, 2}: X Y Z)
        {0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}
    };
    const char eixo[3] = {'X', 'Y', 'Z'};  // 'X': um caractere isolado, exibido por %c

    for (int k = 0; k < 6; k++) {           // uma linha por ordem
        const int *o = ordens[k];           // o: o endereço dos três eixos desta ordem
        // uma ordem, depois o veredito para cada ângulo do meio
        printf("%c %c %c: meio a 90: %s; a -90: %s; a 45: %s\n", eixo[o[0]],
               eixo[o[1]], eixo[o[2]], bloqueio(o, 90 * DEG), bloqueio(o, -90 * DEG),
               bloqueio(o, 45 * DEG));
    }
    const int zxz[3] = {2, 0, 2};           // eixo Z repetido: ângulos de Euler « próprios »
    // mesma exibição para a ordem Z X Z
    printf("Z X Z: meio a 0: %s; a 180: %s; a 90: %s\n", bloqueio(zxz, 0 * DEG),
           bloqueio(zxz, 180 * DEG), bloqueio(zxz, 90 * DEG));
    return 0;
}
```

```text
X Y Z: meio a 90: soma; a -90: diferença; a 45: nenhum
X Z Y: meio a 90: diferença; a -90: soma; a 45: nenhum
Y X Z: meio a 90: diferença; a -90: soma; a 45: nenhum
Y Z X: meio a 90: soma; a -90: diferença; a 45: nenhum
Z X Y: meio a 90: soma; a -90: diferença; a 45: nenhum
Z Y X: meio a 90: diferença; a -90: soma; a 45: nenhum
Z X Z: meio a 0: soma; a 180: diferença; a 90: nenhum
```

| Ordem (primeiro eixo escrito primeiro) | Ângulo que bloqueia | O primeiro e o último ângulo: só conta... (meio a 90 graus) | ... (meio a -90 graus) |
|---|---|---|---|
| X Y Z | Y (o meio) | a soma deles | a diferença deles |
| X Z Y | Z | a diferença deles | a soma deles |
| **Y X Z** (o do capítulo) | **X, a arfagem** | a diferença deles | a soma deles |
| Y Z X | Z | a soma deles | a diferença deles |
| Z X Y | X | a soma deles | a diferença deles |
| Z Y X | Y | a diferença deles | a soma deles |

Nas seis ordens com três eixos, é sempre **o ângulo do meio** que bloqueia, a 90 graus como a -90 graus; a combinação que permanece em jogo é então a outra (a soma torna-se a diferença, e inversamente: medido para as seis ordens). A 45 graus, nenhuma se bloqueia. Escolher a ordem equivale, portanto, a escolher **qual gesto cairá na armadilha**; não é possível fazer o problema desaparecer. A ordem Z X Z, que repete um eixo, bloqueia de outra maneira: seus dois eixos extremos coincidem quando o ângulo do meio vale 0 (só a soma conta) ou 180 graus (só a diferença conta), e não bloqueia a 90 graus. O bloqueio ocorre, portanto, em repouso, e não na vertical.

## A rotação incremental: guardar a matriz, não os ângulos

O bloqueio vem de que se **guardam ângulos**: três números globais, relativos a eixos numa ordem fixa. A ideia da **rotação incremental** é não guardar mais nenhum. Guarda-se a própria orientação, uma matriz 3×3 `R` (9 números), e, a cada imagem, multiplica-se por ela uma **pequena rotação** `d` (um eixo e um pequeno ângulo) calculada a partir do movimento do mouse: `R = d × R`. Nenhum ângulo global existe: a matriz não se lembra de como chegou ali, então nada pode se confundir.

| | Ângulos de Euler | Rotação incremental |
|---|---|---|
| O que se guarda | 3 ângulos | 1 matriz 3×3 (9 números) |
| Atualização a cada imagem | `guinada += ...` depois `arfagem += ...` | `R = d × R` |
| Bloqueio de cardã | **Sim**, quando o ângulo do meio vale 90 graus | **Não** |
| Erro de arredondamento que se acumula | Não (matriz recalculada a cada vez) | **Sim**: a corrigir (seções seguintes) |
| Legível e editável à mão | Sim | Não |

A pequena rotação vem da fórmula de Rodrigues, dada no [capítulo vizinho](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-em-torno-de-um-eixo-qualquer-a-formula-de-rodrigues). Ela se escreve aqui sob uma forma equivalente e mais compacta: `cos(θ) × I + sin(θ) × K + (1 - cos(θ)) × k × kᵀ`, onde `k` é o eixo de comprimento 1 e `θ` o ângulo; `I` é a **matriz identidade** (1 na diagonal, 0 no resto: ela deixa tudo no lugar); `K` é a matriz `0 -kz ky / kz 0 -kx / -ky kx 0` (linhas separadas por `/`), que, multiplicada por um vetor `v`, dá o produto vetorial `k × v` (um vetor perpendicular aos dois, ver [a câmera](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#a-camera-look-at)); e `k × kᵀ` é a matriz cujo elemento (i, j) vale `k_i × k_j`. A função `arrastar` traduz um arrasto do mouse (botão pressionado, mouse deslocado de `dx` pixels para a direita e `dy` para baixo; um **pixel** é o menor ponto da tela) em uma rotação em torno do eixo `(dy, dx, 0)`, de um ângulo proporcional ao comprimento do arrasto.

```c
// Matriz identidade: 1 na diagonal, 0 no resto; ela não gira nada
Mat3 identidade(void)
{
    Mat3 r = {{{0}}};                       // zeros por toda parte, depois 1 na diagonal
    for (int i = 0; i < 3; i++)             // cada casela da diagonal
        r.m[i][i] = 1;                      // um 1 na casela (i, i)
    return r;
}

// Rotação de "angulo" radianos em torno do eixo (x, y, z), de comprimento qualquer
// (fórmula de Rodrigues: cos * I + sin * K + (1 - cos) * k * kᵀ, K descrita no texto)
Mat3 rotacao_eixo_angulo(float x, float y, float z, float angulo)
{
    double n = sqrt(x * x + y * y + z * z);             // comprimento do eixo
    if (n < 1e-9)                                       // eixo nulo: o mouse não se mexeu
        return identidade();
    double k[3] = {x / n, y / n, z / n};                // o eixo reduzido ao comprimento 1
    double c = cos(angulo), s = sin(angulo);            // cosseno e seno do ângulo
    // a matriz K: multiplicar por ela é fazer k x v
    const double cruz[3][3] = {{0, -k[2], k[1]}, {k[2], 0, -k[0]}, {-k[1], k[0], 0}};
    Mat3 r;                                 // a rotação, preenchida casela por casela
    for (int i = 0; i < 3; i++)             // cada linha i
        for (int j = 0; j < 3; j++)         // cada coluna j
            // os três termos da fórmula, casela (i, j)
            r.m[i][j] = (i == j ? c : 0) + s * cruz[i][j] + (1 - c) * k[i] * k[j];
    return r;
}

// Orientação após um arrasto de mouse de (dx, dy) pixels: uma pequena rotação em torno
// do eixo (dy, dx, 0), tanto maior quanto mais longo for o arrasto
Mat3 arrastar(Mat3 r, float dx, float dy)
{
    float angulo = sqrt(dx * dx + dy * dy) * 0.005;     // 0,005 radiano por pixel
    return produto(rotacao_eixo_angulo(dy, dx, 0, angulo), r);  // R = d * R
}
```

O programa seguinte faz um arrasto vertical do mouse durante 180 imagens de um grau cada, em torno do eixo X da tela: o nariz do objeto sobe, passa pelo zênite, depois desce do outro lado. Desde o zênite (o momento em que o nariz aponta exatamente para cima, imagem 90), ele mede em seguida os eixos de três pequenos arrastos, como para os ângulos de Euler. `%3d` exibe um inteiro em 3 caracteres de largura.

```c
int main(void)
{
    const float frente[3] = {0, 0, -1};    // o nariz do objeto: para -Z no início
    const float passo = 0.001;              // pequeno ângulo de teste: 0,001 radiano
    Mat3 r = identidade();                  // orientação de partida: nenhuma rotação
    Mat3 zenite = r;                        // cópia da orientação « nariz para cima »
    float nariz[3], w[3];                   // a direção do nariz, e o eixo medido

    // Um arrasto vertical de 180 imagens, 1 grau por imagem, em torno do eixo X da tela
    for (int imagem = 0; imagem <= 180; imagem++) {
        if (imagem % 45 == 0) {             // uma linha a cada 45 graus
            aplicar(r, frente, nariz);      // para onde aponta o nariz agora?
            // o ângulo percorrido, depois a direção do nariz
            printf("%3d graus: nariz = (%6.3f, %6.3f, %6.3f)\n", imagem,
                   limpa(nariz[0]), limpa(nariz[1]), limpa(nariz[2]));
        }
        if (imagem == 90)                   // a meio curso, nariz exatamente para cima
            zenite = r;                     // o nariz acaba de chegar exatamente no alto
        r = produto(rotacao_eixo_angulo(1, 0, 0, 1 * DEG), r);      // R = d * R
    }
    // Desde o zênite, três pequenos arrastos: segundo X, Y e depois Z da tela
    for (int eixo = 0; eixo < 3; eixo++) {
        float k[3] = {0, 0, 0};             // o eixo do arrasto: três zeros...
        k[eixo] = 1;                        // o eixo deste arrasto
        // a orientação após um pequeno arrasto segundo este eixo
        Mat3 depois = produto(rotacao_eixo_angulo(k[0], k[1], k[2], passo), zenite);
        velocidade(zenite, depois, passo, w);       // o eixo da rotação obtida
        // o número do arrasto, depois o eixo medido
        printf("arrasto %d: gira em torno de (%6.3f, %6.3f, %6.3f)\n", eixo + 1,
               limpa(w[0]), limpa(w[1]), limpa(w[2]));
    }
    return 0;
}
```

```text
  0 graus: nariz = ( 0.000,  0.000, -1.000)
 45 graus: nariz = ( 0.000,  0.707, -0.707)
 90 graus: nariz = ( 0.000,  1.000,  0.000)
135 graus: nariz = ( 0.000,  0.707,  0.707)
180 graus: nariz = ( 0.000,  0.000,  1.000)
arrasto 1: gira em torno de ( 1.000,  0.000,  0.000)
arrasto 2: gira em torno de ( 0.000,  1.000,  0.000)
arrasto 3: gira em torno de ( 0.000,  0.000,  1.000)
```

O nariz atravessa o zênite **sem solavanco**: sua altura sobe de 0 a 1 e desce de novo, regularmente. Sobretudo, desde o zênite, os três arrastos giram em torno de três eixos **distintos** (X, Y e Z), ao passo que três ângulos de Euler só ofereciam dois. Como os pequenos giros são expressos no referencial da tela, três direções de rotação permanecem sempre disponíveis, qualquer que seja a orientação do objeto. Um mouse só fornece duas direções (eixos X e Y); a rotação em torno de Z (a rolagem) se comanda de outra forma, pela roda ou por teclas.

### `d × R` ou `R × d`?

O produto não é comutativo: o lado em que se coloca `d` muda o eixo da rotação. O programa seguinte também verifica `arrastar`: um arrasto de 100 pixels para a direita deve fazer a face voltada para a tela ir para a direita (+X), e um arrasto para baixo fazê-la descer (-Y).

```c
int main(void)
{
    const float frente[3] = {0, 0, -1};    // o nariz do objeto: para -Z no início
    const float face[3] = {0, 0, 1};        // um ponto da face voltada para a tela
    Mat3 r = rotacao_eixo_angulo(0, 1, 0, 90 * DEG);    // objeto girado de 90° (eixo Y)
    Mat3 d = rotacao_eixo_angulo(1, 0, 0, 10 * DEG);    // arrasto vertical de 10° (eixo X)
    float p[3];                             // o ponto após a transformação

    aplicar(arrastar(identidade(), 100, 0), face, p);   // 100 pixels para a direita
    printf("arrasto à direita: face = (%6.3f, %6.3f, %6.3f)\n",  // para onde foi a face
           limpa(p[0]), limpa(p[1]), limpa(p[2]));
    aplicar(arrastar(identidade(), 0, 100), face, p);   // 100 pixels para baixo
    printf("arrasto para baixo: face = (%6.3f, %6.3f, %6.3f)\n",  // para onde foi a face
           limpa(p[0]), limpa(p[1]), limpa(p[2]));
    aplicar(produto(d, r), frente, p);                  // d * R: eixo X da tela
    // para onde aponta o nariz
    printf("d * R: nariz = (%6.3f, %6.3f, %6.3f)\n", limpa(p[0]), limpa(p[1]), limpa(p[2]));
    aplicar(produto(r, d), frente, p);                  // R * d: eixo X do objeto
    // para onde aponta o nariz
    printf("R * d: nariz = (%6.3f, %6.3f, %6.3f)\n", limpa(p[0]), limpa(p[1]), limpa(p[2]));
    return 0;
}
```

```text
arrasto à direita: face = ( 0.479,  0.000,  0.878)
arrasto para baixo: face = ( 0.000, -0.479,  0.878)
d * R: nariz = (-1.000,  0.000,  0.000)
R * d: nariz = (-0.985,  0.174,  0.000)
```

| Produto | Em torno de quais eixos? | Nariz após um arrasto vertical de 10 graus, objeto já girado de 90 graus em torno de Y |
|---|---|---|
| `d × R` (o de `arrastar`) | Os eixos **da tela**: um arrasto para a direita sempre gira para a direita | (-1,000, 0,000, 0,000): o nariz fica alinhado ao eixo X da tela, não se move |
| `R × d` | Os eixos **do objeto**: eles giraram com ele | (-0,985, 0,174, 0,000): o nariz sobe |

Para uma manipulação com o mouse, os eixos da tela são o que se espera. Escolha um lado, escreva-o em um comentário e não o mude mais.

### Ligar a matriz à renderização

Para uma câmera, a parte de rotação da matriz de visualização é a **inversa** da orientação da câmera. Para uma matriz que é uma verdadeira rotação, a inversa é a transposta (função `transposta` mais acima): não é preciso um cálculo de inversa geral. É o que já faz [`look_at`](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#a-camera-look-at), cujas linhas são as três direções da câmera. Seu caso degenerado (olhar exatamente para cima com `up = (0, 1, 0)`) é da mesma família que o bloqueio de cardã: duas direções se confundem. Com uma orientação em matriz, nenhuma direção « para cima » é imposta, e o caso não se apresenta mais.

## O erro de arredondamento que se acumula

Um `float` só guarda cerca de 7 algarismos exatos ([detalhe](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), e [a diferença entre dois `float` vizinhos](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine#o-que-significa-flt-epsilon)): cada soma e cada multiplicação arredonda o seu resultado. Um produto de duas matrizes 3×3 contém 27 multiplicações e 18 somas. O erro por imagem é minúsculo, da ordem de 10⁻⁷, mas `R = d × R` recomeça a cada imagem a partir do resultado da anterior: os erros **se somam**.

Uma verdadeira rotação tem uma matriz **ortogonal**: suas três colunas têm comprimento 1 e são duas a duas perpendiculares (seu produto escalar é nulo); de forma equivalente, `R × Rᵀ` é a matriz identidade. Quando o erro cresce, a matriz deixa de ser uma rotação: uma coluna mais longa que 1 **estica** o objeto nessa direção, e colunas que não estão mais em ângulo reto o **inclinam** (o cisalham).

| Medida | O que calcula | Valor para uma rotação perfeita |
|---|---|---|
| `comprimento` | O maior desvio a 1 do comprimento de uma coluna | 0 |
| `perpendicular` | O maior produto escalar entre duas colunas | 0 |
| `identidade` | O maior desvio entre `R × Rᵀ` e a matriz identidade | 0 |

A função `medir` as calcula (em `double`, para que a própria medição não acrescente erro).

```c
// Os três desvios a uma rotação perfeita: 0 em toda parte se a matriz estiver exata
typedef struct {
    double comprimento;         // maior desvio a 1 do comprimento de uma coluna
    double perpendicular;       // maior produto escalar de duas colunas
    double identidade;          // maior desvio entre a * aᵀ e a matriz identidade
} Desvios;

Desvios medir(Mat3 a)
{
    Desvios e = {0, 0, 0};                  // os três desvios começam em 0
    for (int j = 0; j < 3; j++) {           // cada coluna j
        double soma = 0;                    // o quadrado do seu comprimento
        // soma dos quadrados dos três elementos da coluna
        for (int i = 0; i < 3; i++)
            soma += (double)a.m[i][j] * a.m[i][j];      // (double): cálculo em double
        // o desvio a 1 do seu comprimento bate o recorde?
        if (fabs(sqrt(soma) - 1) > e.comprimento)
            e.comprimento = fabs(sqrt(soma) - 1);       // sim: novo recorde
        for (int k = j + 1; k < 3; k++) {   // cada coluna k depois de j: uma vez por par
            double p = 0;                   // produto escalar das colunas j e k
            // soma dos produtos termo a termo das colunas j e k
            for (int i = 0; i < 3; i++)
                p += (double)a.m[i][j] * a.m[i][k];     // soma um produto
            if (fabs(p) > e.perpendicular)  // este produto escalar bate o recorde?
                e.perpendicular = fabs(p);  // sim: novo recorde
        }
    }
    for (int i = 0; i < 3; i++)             // a * aᵀ: o elemento (i, k) é o produto
        for (int k = 0; k < 3; k++) {       // escalar da linha i pela linha k de a
            double p = 0;                   // produto escalar das linhas i e k
            for (int j = 0; j < 3; j++)     // soma dos produtos termo a termo
                p += (double)a.m[i][j] * a.m[k][j];     // soma um produto
            if (fabs(p - (i == k)) > e.identidade)  // (i == k): 1 na diagonal
                e.identidade = fabs(p - (i == k));  // sim: novo recorde
        }
    return e;
}
```

O programa faz uma orientação girar durante um milhão de imagens, de 0,01 radiano por imagem (cerca de 0,57 grau), em torno de um eixo que muda lentamente, e registra as três medidas em 100, 10 000, 100 000 e depois 1 000 000 de imagens. `%8ld` exibe um inteiro do tipo `long` em 8 caracteres de largura.

```c
int main(void)
{
    const long marcos[4] = {100, 10000, 100000, 1000000};   // números de imagens registrados
    Mat3 r = identidade();                  // a orientação, no início sem rotação
    long imagem = 0;                        // número de imagens já calculadas

    for (int j = 0; j < 4; j++) {           // para em cada marco para medir
        for (; imagem < marcos[j]; imagem++) {  // uma imagem por volta, até o marco
            double t = imagem * 0.001;      // o tempo: o eixo do mouse gira devagar
            // 0,01 radiano de rotação por imagem, em torno de um eixo que muda a cada imagem
            r = produto(rotacao_eixo_angulo(cos(t), sin(t), 0.5, 0.01), r);
        }
        Desvios e = medir(r);               // os três desvios neste marco
        // número de imagens, depois os três desvios
        printf("%8ld imagens: comprimento %.1e, produto escalar %.1e, a*aT %.1e\n",
               imagem, e.comprimento, e.perpendicular, e.identidade);
    }
    return 0;
}
```

```text
     100 imagens: comprimento 4.0e-07, produto escalar 3.2e-07, a*aT 8.3e-07
   10000 imagens: comprimento 1.9e-05, produto escalar 8.3e-06, a*aT 3.4e-05
  100000 imagens: comprimento 2.0e-04, produto escalar 9.0e-05, a*aT 3.4e-04
 1000000 imagens: comprimento 2.0e-03, produto escalar 8.3e-04, a*aT 3.1e-03
```

O mesmo programa, com `float` trocado por `double` em toda parte, dá desvios da ordem de 10⁻¹¹ após um milhão de imagens; esse segundo ensaio mostra que a precisão do tipo é de fato a causa.

| Imagens | `comprimento` (`float`) | `perpendicular` (`float`) | `identidade` (`float`) | `identidade` (`double`) |
|---|---|---|---|---|
| 100 | 4,0 × 10⁻⁷ | 3,2 × 10⁻⁷ | 8,3 × 10⁻⁷ | 2,2 × 10⁻¹⁵ |
| 10 000 | 1,9 × 10⁻⁵ | 8,3 × 10⁻⁶ | 3,4 × 10⁻⁵ | 2,5 × 10⁻¹³ |
| 100 000 | 2,0 × 10⁻⁴ | 9,0 × 10⁻⁵ | 3,4 × 10⁻⁴ | 2,5 × 10⁻¹² |
| 1 000 000 | 2,0 × 10⁻³ | 8,3 × 10⁻⁴ | 3,1 × 10⁻³ | 2,5 × 10⁻¹¹ |

Leitura: de 10 000 a 1 000 000 de imagens, o desvio é aproximadamente **multiplicado por 10 sempre que o número de imagens é multiplicado por 10**: ele cresce regularmente e nunca se estabiliza. Após um milhão de imagens (cerca de quatro horas e meia a 60 imagens por segundo), o comprimento de uma coluna se afasta de 1 por 0,002: um segmento de 1 metro, uma vez transformado, mede 2 milímetros a mais ou a menos, e o desvio continua crescendo. Passar para `double` não resolve o problema, apenas o **adia**: o desvio é cerca de cem milhões de vezes menor (10⁸), e continua crescendo do mesmo jeito. Esses valores precisos dependem da velocidade de rotação e do movimento; o que se deve reter é a ordem de grandeza e o crescimento regular.

## A reortonormalização: pôr a matriz de volta no prumo

**Reortonormalizar** uma matriz é corrigi-la levemente para que volte a ser ortogonal: colunas de comprimento 1 e perpendiculares. Como o erro é de cerca de 10⁻⁷ por imagem, a correção é minúscula e não se vê na tela. Existem vários métodos:

| Método | Princípio | Resultado medido (ver abaixo) |
|---|---|---|
| Normalizar cada coluna | Dividir cada coluna pelo seu comprimento | Os comprimentos são corrigidos, mas não o ângulo entre colunas: **insuficiente** |
| **Gram-Schmidt sobre duas colunas, depois produto vetorial** (escolhido) | Fixar a coluna 0, tornar a coluna 1 perpendicular a ela, **fabricar** a coluna 2 por um produto vetorial | Os três desvios voltam a cair para alguns 10⁻⁶ (N = 100) |
| Gram-Schmidt sobre três colunas | O mesmo procedimento, aplicado também à coluna 2 | Não medido aqui: um cálculo a mais para uma coluna que o produto vetorial já determina inteiramente |

O **procedimento de Gram-Schmidt** ([detalhe](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)) trata as colunas uma a uma: cada nova coluna perde primeiro a parte que vai na direção das colunas já fixadas, depois é reduzida ao comprimento 1. Essa parte se calcula com o produto escalar: se `c0` tem comprimento 1, `c1 · c0` é a sua medida. Exemplo numérico: `c0 = (1, 0, 0)` e `c1 = (1, 2, 0)` têm produto escalar 1 (1 × 1 + 0 × 2 + 0 × 0); `c1 - 1 × c0 = (0, 2, 0)`, que é perpendicular a `c0`; reduzido ao comprimento 1 (dividindo por 2), torna-se `(0, 1, 0)`.

O método escolhido é o mais simples de escrever e de verificar: duas normalizações, um produto escalar, um produto vetorial. Ele oferece duas garantias: a coluna 2 é **exatamente** perpendicular às outras duas e de comprimento 1 (o produto vetorial de dois vetores de comprimento 1 perpendiculares entre si é um terceiro vetor com essas mesmas propriedades), e ela está do lado certo: o resultado é uma verdadeira rotação, e não um **espelho** (que trocaria a esquerda e a direita do objeto, o que nenhuma rotação faz). O preço: a coluna 0 mantém sua direção e as outras duas se ajustam em torno dela; como a correção é da ordem do erro (10⁻⁶), esse leve privilégio não tem consequência.

```c
// Divide o vetor v pelo seu comprimento: a direção permanece a mesma, o comprimento vira 1
void normalizar(double v[3])
{
    double n = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);   // seu comprimento (sua norma)
    if (n > 0)                              // um vetor nulo não pode ser normalizado
        for (int i = 0; i < 3; i++)         // cada componente de v
            v[i] /= n;                      // dividida pelo comprimento
}

// Endireita em três etapas a matriz cujo endereço é a: « Mat3 *a » é um ponteiro,
// e a->m designa o array dessa matriz, que a função modifica no lugar
void endireitar(Mat3 *a)
{
    double c0[3], c1[3], c2[3];             // as três colunas
    for (int i = 0; i < 3; i++) {           // cada linha i
        c0[i] = a->m[i][0];                 // copia-se as colunas 0 e 1
        c1[i] = a->m[i][1];                 // coluna 1
    }
    normalizar(c0);                         // etapa 1: a coluna 0 mantém sua direção
    double d = c1[0] * c0[0] + c1[1] * c0[1] + c1[2] * c0[2];   // parte de c1 ao longo de c0
    for (int i = 0; i < 3; i++)             // cada componente
        c1[i] -= d * c0[i];                 // etapa 2: retira-se essa parte, c1 se torna
    normalizar(c1);                         // perpendicular a c0, depois de comprimento 1
    c2[0] = c0[1] * c1[2] - c0[2] * c1[1];  // etapa 3: a coluna 2 é o produto
    c2[1] = c0[2] * c1[0] - c0[0] * c1[2];  // vetorial das outras duas: perpendicular
    c2[2] = c0[0] * c1[1] - c0[1] * c1[0];  // às duas e de comprimento 1, sem cálculo a mais
    for (int i = 0; i < 3; i++) {           // cada linha i
        a->m[i][0] = c0[i];                 // reescreve-se as três colunas
        a->m[i][1] = c1[i];                 // coluna 1
        a->m[i][2] = c2[i];                 // coluna 2
    }
}

// Variante insuficiente, para comparar: cada coluna reduzida ao comprimento 1, nada mais
void normalizar_colunas(Mat3 *a)
{
    for (int j = 0; j < 3; j++) {           // cada coluna j
        double c[3] = {a->m[0][j], a->m[1][j], a->m[2][j]};  // a coluna j, copiada
        normalizar(c);                      // reduzida ao comprimento 1
        for (int i = 0; i < 3; i++)         // cada linha i
            a->m[i][j] = c[i];              // e reescrita na matriz
    }
}
```

O programa seguinte refaz o milhão de imagens do programa anterior, corrigindo a matriz a cada `N` imagens (o período `periodo` do código), e registra, para cada uma das três medidas, **o pior valor encontrado** durante todo o ensaio (uma medida a cada imagem). Ele compara a ausência de correção, a simples normalização das colunas e `endireitar` em seis ritmos. `fmax` devolve o maior de dois números.

```c
// Um milhão de imagens; modo 0: nenhuma correção, 1: normalizar_colunas, 2: endireitar.
// A correção ocorre a cada "periodo" imagens. Devolve, para cada um dos três desvios,
// o pior valor encontrado durante todo o experimento
Desvios ensaio(int modo, long periodo)
{
    Mat3 r = identidade();                  // a orientação de partida
    Desvios pior = {0, 0, 0};               // os piores valores, em 0 no início

    for (long imagem = 1; imagem <= 1000000; imagem++) {    // uma volta por imagem
        double t = imagem * 0.001;          // mesmo movimento da seção anterior
        // a rotação desta imagem
        r = produto(rotacao_eixo_angulo(cos(t), sin(t), 0.5, 0.01), r);
        if (modo == 1 && imagem % periodo == 0) // modo 1: a cada "periodo" imagens
            normalizar_colunas(&r);         // &r: o endereço de r
        if (modo == 2 && imagem % periodo == 0) // modo 2: a cada "periodo" imagens
            endireitar(&r);                 // endireita a matriz
        Desvios e = medir(r);               // mede-se a cada imagem; fmax: o maior
        // guarda-se o maior desvio encontrado
        pior.comprimento = fmax(pior.comprimento, e.comprimento);
        pior.perpendicular = fmax(pior.perpendicular, e.perpendicular);     // idem
        pior.identidade = fmax(pior.identidade, e.identidade);              // idem
    }
    return pior;
}

int main(void)
{
    // os ritmos de correção testados
    const long periodos[6] = {1, 10, 100, 1000, 10000, 100000};
    Desvios e = ensaio(0, 1);               // o período não serve para nada sem correção
    // os três piores desvios, sem correção
    printf("nenhuma correção: %.1e %.1e %.1e\n", e.comprimento, e.perpendicular,
           e.identidade);
    e = ensaio(1, 100);                     // normalizar as colunas, a cada 100 imagens
    // os três piores desvios
    printf("normalizar, N=100: %.1e %.1e %.1e\n", e.comprimento, e.perpendicular,
           e.identidade);
    for (int k = 0; k < 6; k++) {           // a mesma correção em ritmos diferentes
        e = ensaio(2, periodos[k]);         // endireitar a cada periodos[k] imagens
        // o período, depois os três piores desvios
        printf("endireitar, N=%ld: %.1e %.1e %.1e\n", periodos[k], e.comprimento,
               e.perpendicular, e.identidade);
    }
    return 0;
}
```

```text
nenhuma correção: 2.0e-03 8.8e-04 4.0e-03
normalizar, N=100: 1.3e-06 9.3e-04 9.3e-04
endireitar, N=1: 5.1e-08 8.5e-08 1.0e-07
endireitar, N=10: 4.7e-07 5.4e-07 1.0e-06
endireitar, N=100: 1.5e-06 1.7e-06 2.7e-06
endireitar, N=1000: 4.8e-06 4.2e-06 8.5e-06
endireitar, N=10000: 2.6e-05 1.5e-05 5.1e-05
endireitar, N=100000: 2.2e-04 1.1e-04 4.3e-04
```

As três colunas de números são, na ordem: `comprimento`, `perpendicular`, `identidade`.

| Correção | `comprimento` | `perpendicular` | `identidade` |
|---|---|---|---|
| Nenhuma | 2,0 × 10⁻³ | 8,8 × 10⁻⁴ | 4,0 × 10⁻³ |
| Normalizar as colunas, N = 100 | 1,3 × 10⁻⁶ | **9,3 × 10⁻⁴** | **9,3 × 10⁻⁴** |
| `endireitar`, N = 1 | 5,1 × 10⁻⁸ | 8,5 × 10⁻⁸ | 1,0 × 10⁻⁷ |
| `endireitar`, N = 10 | 4,7 × 10⁻⁷ | 5,4 × 10⁻⁷ | 1,0 × 10⁻⁶ |
| `endireitar`, N = 100 | 1,5 × 10⁻⁶ | 1,7 × 10⁻⁶ | 2,7 × 10⁻⁶ |
| `endireitar`, N = 1 000 | 4,8 × 10⁻⁶ | 4,2 × 10⁻⁶ | 8,5 × 10⁻⁶ |
| `endireitar`, N = 10 000 | 2,6 × 10⁻⁵ | 1,5 × 10⁻⁵ | 5,1 × 10⁻⁵ |
| `endireitar`, N = 100 000 | 2,2 × 10⁻⁴ | 1,1 × 10⁻⁴ | 4,3 × 10⁻⁴ |

Três ensinamentos:

- **Normalizar apenas as colunas não basta**: os comprimentos são corrigidos (10⁻⁶), mas as colunas continuam inclinadas umas sobre as outras (`perpendicular` 9,3 × 10⁻⁴, nem melhor que sem correção).
- **Corrigir a cada imagem** (N = 1) dá o melhor resultado, da ordem de 10⁻⁷: o limite do `float`, pois a correção também arredonda.
- **Corrigir com menos frequência degrada lentamente**: o pior desvio passa de 10⁻⁷ (N = 1) para 8,5 × 10⁻⁶ (N = 1 000) e depois 4,3 × 10⁻⁴ (N = 100 000), ou seja, mais ou menos o que se mediu sem correção após 100 000 imagens.

Para escolher `N`, fixe o desvio máximo aceitável. Um desvio de 10⁻⁵ sobre um objeto largo de 1 000 pixels representa 0,01 pixel: invisível. Nesse ritmo de rotação, **N = 1 000** respeita esse limite (8,5 × 10⁻⁶), ou seja, uma correção a cada 17 segundos, mais ou menos, a 60 imagens por segundo. Uma chamada de `endireitar` custa: 2 raízes quadradas, 6 divisões e 18 multiplicações, contra 27 multiplicações para um produto de duas matrizes. Corrigir a cada imagem continua viável para alguns objetos, e corrigir a cada centenas de imagens não custa quase nada. Um movimento mais rápido ou uma cena mais longa exigem refazer a medição.

## As variantes: quatérnios e ângulos limitados

### Os quatérnios

Um **quatérnio** representa uma rotação com **4 números** em vez de 9. Como os ângulos de Euler, é compacto; como a matriz, não tem **bloqueio de cardã**. Compor duas rotações equivale a multiplicar dois quatérnios, e ele se endireita simplesmente dividindo-se pela sua norma (seu comprimento): 4 números a normalizar, em vez de endireitar três colunas. O capítulo vizinho o menciona como [alternativa](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-um-objeto-a-rotacao-acumulada); nenhum capítulo do site o desenvolve: a fonte de referência é a página sobre [quatérnios e rotações no espaço](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation). Para um projeto que precisa apenas girar um objeto com o mouse e desenhá-lo, a matriz endireitada deste capítulo basta e continua fácil de ligar ao [OpenGL](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl).

### Quando manter ângulos mesmo assim

O bloqueio só é um problema se a orientação puder atingir a configuração armadilhada. Se a aplicação não tem rolagem, ou impede de atingir a vertical, dois ângulos bastam:

| Situação | Escolha | Por quê |
|---|---|---|
| Câmera em primeira pessoa (um personagem anda, o horizonte fica horizontal) | Dois ângulos (guinada, arfagem), **arfagem limitada a menos de 90 graus** | Sem rolagem, nada a bloquear; o limite impede de passar pelo zênite |
| Câmera orbital (gira em torno de um objeto, como um satélite) | Dois ângulos (em torno do objeto, altura acima dele), **altura limitada** | Mesma razão |
| Câmera de voo livre (pode se virar de ponta-cabeça, como a de uma nave), objeto que se gira em todos os sentidos | Matriz incremental endireitada, ou quatérnio | Nenhuma direção é proibida |
| Exibição ou entrada pelo usuário (controles deslizantes, arquivo de cena legível) | Ângulos de Euler **somente para a interface** | Legíveis; não os reler a partir da matriz perto do zênite (a vista salta 180 graus, medido acima) |
| Gravar uma orientação em um arquivo | A matriz (9 números) ou o quatérnio | Os ângulos não são únicos nas proximidades do bloqueio |

O bloco seguinte limita a arfagem de uma câmera a 89 graus. `c->guinada` designa o campo `guinada` da câmera `c` (um ponteiro: o endereço da câmera, que a função modifica no lugar). `dx` e `dy` são os deslocamentos do mouse, em pixels, desde a imagem anterior; em um programa de verdade, obtêm-se com os eventos de mouse do [GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu).

```c
// Uma câmera descrita por apenas dois ângulos: sem rolagem, não há nada a bloquear
typedef struct { float guinada, arfagem; } Camera;

const float LIMITE = 1.553343;              // 89 graus em radianos: nunca exatamente 90

// dx e dy: deslocamento do mouse desde a imagem anterior, em pixels
void mirar(Camera *c, float dx, float dy)   // c->guinada: o campo guinada da câmera c
{
    c->guinada += dx * 0.002;               // 0,002 radiano por pixel, para a direita
    c->arfagem -= dy * 0.002;               // mouse para cima (dy < 0): olhar mais alto
    if (c->arfagem > LIMITE)                // a arfagem fica entre -89 e +89 graus
        c->arfagem = LIMITE;                // limitada a +89 graus
    if (c->arfagem < -LIMITE)               // baixo demais?
        c->arfagem = -LIMITE;               // piso de -89 graus
}

int main(void)
{
    Camera c = {0, 0};                      // olha bem para a frente
    for (int i = 0; i < 3; i++)             // três grandes arrastos para cima
        mirar(&c, 0, -1000);                // 1000 pixels para cima (dy é negativo)
    // a arfagem final, em graus
    printf("arfagem após 3000 pixels para cima: %.1f graus\n", c.arfagem / DEG);
    mirar(&c, 0, 5000);                     // depois um arrasto muito grande para baixo
    printf("arfagem após 5000 pixels para baixo: %.1f graus\n", c.arfagem / DEG);  // idem
    return 0;
}
```

```text
arfagem após 3000 pixels para cima: 89.0 graus
arfagem após 5000 pixels para baixo: -89.0 graus
```

Qualquer que seja o comprimento do arrasto (3 000 pixels para cima, depois 5 000 para baixo), a arfagem permanece entre -89 e +89 graus: a vista não pode mais atingir a vertical.

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Achar que o bloqueio só incomoda a exatos 90 graus | Perto da vertical, um movimento minúsculo exige uma grande variação de guinada: 0,02 grau de diferença dá 180 graus de diferença de guinada (medido) |
| Guardar a orientação em ângulos para um objeto que gira livremente | Um ângulo do meio a 90 graus perde uma rotação: o movimento pedido não tem mais efeito |
| Mudar a ordem das rotações para evitar o bloqueio | Mudar de ordem desloca o bloqueio, não o elimina (tabela das seis ordens) |
| Reler os ângulos a partir da matriz, depois reinjetá-los | No zênite, a guinada salta 180 graus para 0,02 grau de movimento |
| Nunca endireitar a matriz | O desvio cresce a cada imagem (3,1 × 10⁻³ após um milhão de imagens): o objeto se estica e se inclina |
| Normalizar apenas as colunas | Os comprimentos são corrigidos, não o ângulo entre colunas (9,3 × 10⁻⁴ medido) |
| Copiar a coluna 2 em vez de recalculá-la pelo produto vetorial | Ela mantém seu erro, e nada garante que se obtenha uma rotação em vez de um espelho |
| Passar para `double` acreditando eliminar a deriva | O `double` torna o erro cerca de cem milhões de vezes menor, mas ele continua crescendo regularmente |
| Normalizar um eixo nulo | Quando o mouse não se mexeu, o eixo `(dy, dx, 0)` é nulo: a divisão pelo seu comprimento (0) dá **`NaN`** (*Not a Number*, o resultado de um cálculo impossível como `0 / 0`, [detalhe](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#a-camera-look-at)) que contamina toda a matriz. `rotacao_eixo_angulo` devolve a identidade nesse caso |
| Misturar `d × R` e `R × d` | Os eixos de rotação passam da tela para o objeto: o mouse parece girar no sentido errado |
| Girar de um ângulo fixo por imagem | A velocidade depende então da cadência da máquina: usar uma velocidade por segundo multiplicada pelo [delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#o-delta-time-uma-velocidade-independente-da-maquina) |
| Limitar a arfagem a exatamente 90 graus | O zênite continua atingível: deixar uma margem (89 graus) |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Guardar a orientação de um objeto que gira livremente como matriz (ou quatérnio), não como ângulos | Nenhum ângulo global: o bloqueio deixa de existir |
| Manter dois ângulos e limitar a arfagem para uma câmera em primeira pessoa ou orbital | O mais simples, e sem bloqueio possível |
| Endireitar a matriz com Gram-Schmidt sobre duas colunas mais um produto vetorial, a cada `N` imagens | Desvio reduzido de cerca de 10⁻³ para 10⁻⁵ ou menos; a coluna 2 é exata e o resultado continua sendo uma rotação |
| Escolher `N` medindo (`medir`, `ensaio`) conforme o desvio aceitável | `N = 1 000` dá 8,5 × 10⁻⁶ a 0,01 radiano por imagem; um movimento mais rápido exige uma nova medição |
| Escolher um lado para a composição (`d × R`, eixos da tela, para o mouse) e anotá-lo em comentário | Evita rotações que partem do lado errado |
| Tratar o eixo nulo (mouse imóvel) antes de normalizar | Nenhum `NaN` na matriz |
| Testar os casos-limite: arfagem de 90 graus, arrasto nulo, um milhão de imagens | São eles que revelam o bloqueio e a deriva |
| Gravar a matriz ou o quatérnio, exibir os ângulos apenas na interface | Os ângulos não são únicos perto do bloqueio |

## O que reter

| | |
|---|---|
| **A reter** | Os ângulos de Euler (arfagem, guinada, rolagem) descrevem uma orientação por três rotações em uma ordem fixa, e a ordem importa. Quando o ângulo do meio vale 90 graus, os outros dois giram em torno do mesmo eixo: é o bloqueio de cardã, uma rotação se perde (medido: três conjuntos de ângulos dão a mesma matriz, e no zênite 0,02 grau de movimento faz a guinada saltar 180 graus). O remédio é a rotação incremental: guardar a matriz 3×3 e multiplicar-lhe a cada imagem uma pequena rotação, `R = d × R`, sem ângulo global e, portanto, sem bloqueio. Sua contrapartida é o erro de arredondamento, que se acumula (3,1 × 10⁻³ após um milhão de imagens em `float`): corrige-se remetendo as colunas ao comprimento 1 e perpendiculares (Gram-Schmidt sobre duas colunas, produto vetorial para a terceira), por exemplo a cada 1 000 imagens (8,5 × 10⁻⁶). Um quatérnio, ou dois ângulos limitados a menos de 90 graus para uma câmera em primeira pessoa, são as variantes. |
| **Ferramentas utilizáveis** | `cos`, `sin`, `sqrt`, `fabs`, `fmax`, `atan2` da [biblioteca matemática do C](https://en.cppreference.com/w/c/numeric/math); [a fórmula de Rodrigues](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-em-torno-de-um-eixo-qualquer-a-formula-de-rodrigues); [o procedimento de Gram-Schmidt](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process); [os quatérnios](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation); [os ângulos de Euler](https://en.wikipedia.org/wiki/Euler_angles); [o bloqueio de cardã](https://en.wikipedia.org/wiki/Gimbal_lock). |
| **Armadilhas a evitar** | Guardar ângulos para um objeto livre; achar que mudar a ordem elimina o bloqueio; reler ângulos a partir da matriz perto do zênite; nunca endireitar a matriz; normalizar só as colunas; normalizar um eixo nulo (`NaN`); misturar `d × R` e `R × d`; um ângulo fixo por imagem em vez de uma velocidade por segundo; uma arfagem limitada a exatamente 90 graus. |
| **Boas práticas** | Matriz (ou quatérnio) para a rotação livre, dois ângulos limitados para a câmera em primeira pessoa ou orbital; endireitar a cada `N` imagens, com `N` escolhido pela medição; compor do lado da tela para o mouse; tratar o eixo nulo; testar arfagem de 90 graus, arrasto nulo e sessões muito longas; gravar a matriz, exibir os ângulos apenas na interface. |
