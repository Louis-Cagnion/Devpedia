---
order: 10
---

# Os floats longe da origem: precisão perdida e origem local

Um número do tipo `float` (um número de ponto flutuante armazenado em 32 bits) guarda cerca de sete algarismos decimais confiáveis, **qualquer que seja a sua ordem de grandeza**. Para um valor próximo de 1, isso dá um detalhe da ordem de uma dez-milionésima parte; para um valor de dez milhões, o detalhe mais fino é o metro inteiro. Um ponto situado a 10 000 km da origem, expresso em metros, já não pode se deslocar em menos de um metro: um detalhe de um centímetro desaparece. Este capítulo mede essa perda e depois apresenta a solução usada em computação gráfica, em cartografia e nos jogos: uma **origem local**, um ponto de referência escolhido perto dos dados, subtraída em `double` (um número de ponto flutuante armazenado em 64 bits, mais preciso) antes de guardar os valores em `float`.

Alguns termos do ofício, definidos aqui de uma vez por todas. Uma **coordenada** é um número que situa um ponto em relação a um referencial (por exemplo « 12,5 metros para o leste »). A **origem** é o ponto desse referencial cujas coordenadas valem todas 0. Um **vértice** é um ponto de um objeto em 3D, e uma **malha** é um objeto descrito por vértices ligados em triângulos (veja [o formato `.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Um mapa, uma fase de jogo ou uma malha manipulam listas de coordenadas desse tipo.

Este capítulo pressupõe conhecidas as bases do C ([as variáveis](/?c=langages&s=c&p=variables), [as condições](/?c=langages&s=c&p=conditions), [os laços](/?c=langages&s=c&p=boucles)), [os tipos de números de ponto flutuante em C](/?c=langages&s=c&p=variables#os-numeros-de-ponto-flutuante) e [a codificação dos floats](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#como-um-float-e-codificado) (sinal, expoente, mantissa), que ele prolonga sem repetir. As potências de dois e os bits são relembrados em [os inteiros e os estouros](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements). Todos os programas foram compilados com `gcc -std=c11 -Wall -Wextra -Werror -fsanitize=address,undefined` no Linux (`-Werror` transforma cada aviso em erro; `-fsanitize=...` acrescenta verificações em tempo de execução que detectam erros de memória e comportamentos indefinidos; veja [o processo de compilação](/?c=langages&s=c&p=compilation)) e depois executados; eles também foram recompilados com `-O2 -ffp-contract=off` (a otimização do compilador, veja [os níveis de otimização](/?c=langages&s=c&p=compilation#os-niveis-de-otimizacao-o0-a-o3-os), sem a fusão de uma multiplicação e de uma adição em uma única operação, o que mudaria os arredondamentos): as saídas são **idênticas** nos dois casos. Elas supõem um processador atual cujo `float` calcula de fato em 32 bits.

## A constatação: 24 bits significativos, portanto um intervalo que dobra

Um `float` guarda **24 bits significativos**: os algarismos binários que carregam o valor. Às vezes se fala em 23 bits de mantissa, às vezes em 24. Os dois estão certos: 23 bits são **armazenados** (a mantissa), e o 24º é implícito. Um número binário escrito na forma normalizada « 1,xxx × 2ᵉ » (um único algarismo antes da vírgula, sempre 1) não precisa armazenar esse primeiro 1. O `double` faz o mesmo, com 52 bits armazenados e 53 significativos.

| Tipo | Bits armazenados (mantissa) | Bits significativos | Intervalo logo acima de 1,0 | Algarismos decimais confiáveis |
|---|---|---|---|---|
| `float` | 23 | 24 | 2⁻²³ ≈ 1,19 × 10⁻⁷ | cerca de 7 |
| `double` | 52 | 53 | 2⁻⁵² ≈ 2,2 × 10⁻¹⁶ | cerca de 15 a 16 |

Entre dois números consecutivos representáveis há um **intervalo**, chamado em inglês de *ULP* (*unit in the last place*, « unidade do último lugar »: o valor do último bit da mantissa). Para um `float` entre 2ᵉ e 2ᵉ⁺¹, o intervalo vale 2ᵉ⁻²³. Cada **patamar** [2ᵉ ; 2ᵉ⁺¹[ (o intervalo entre duas potências de dois consecutivas) contém exatamente o mesmo número de `float` (2²³ = 8 388 608), e sua largura dobra de um patamar para o seguinte: o intervalo dobra também.

```text
valor :     1                2                      4                              8
            |----------------|----------------------|------------------------------|
float :     8 388 608 float   8 388 608 float         8 388 608 float
intervalo : 2⁻²³ ≈ 1,2e-7     2⁻²² (x2)              2⁻²¹ (x4)
```

O programa a seguir interroga diretamente o computador. `nextafterf(x, destino)` devolve o `float` vizinho de `x` na direção de `destino` ([`nextafterf`](https://en.cppreference.com/w/c/numeric/math/nextafter)); a diferença com `x` é o intervalo procurado.

```c
#include <float.h>
#include <math.h>
#include <stdio.h>

// Mostra o intervalo entre x e seus vizinhos, depois FLT_EPSILON * x para comparação
static void mostrar_intervalo(float x)
{
    float seguinte = nextafterf(x, INFINITY);    // o menor float estritamente maior
    float anterior = nextafterf(x, -INFINITY);   // o maior float estritamente menor
    printf("%10.0f | %-14.9g | %-14.9g | %.9g\n", x, seguinte - x, x - anterior,
           FLT_EPSILON * x);
}

int main(void)
{
    const float valores[] = {1.0f, 1000.0f, 1000000.0f, 16777216.0f, 100000000.0f};
    const int qtd = sizeof valores / sizeof valores[0];  // número de valores do array

    printf("%10s | %-14s | %-14s | %s\n", "x", "acima", "abaixo", "FLT_EPSILON*x");
    for (int i = 0; i < qtd; i++)            // uma linha por valor
        mostrar_intervalo(valores[i]);
    printf("FLT_EPSILON = %.9g\n", FLT_EPSILON);    // o intervalo acima de 1.0, nada mais

    float grande = 16777216.0f;              // 2^24: além disso, faltam inteiros
    float mais_um = grande + 1.0f;           // 16777217 não existe: arredondado
    float mais_dois = grande + 2.0f;         // 16777218 existe
    printf("2^24 + 1 == 2^24 ? %s\n", mais_um == grande ? "sim" : "não");
    printf("2^24 + 2 == 2^24 ? %s\n", mais_dois == grande ? "sim" : "não");
    return 0;
}
```

```text
         x | acima          | abaixo         | FLT_EPSILON*x
         1 | 1.1920929e-07  | 5.96046448e-08 | 1.1920929e-07
      1000 | 6.10351562e-05 | 6.10351562e-05 | 0.00011920929
   1000000 | 0.0625         | 0.0625         | 0.11920929
  16777216 | 2              | 1              | 2
 100000000 | 8              | 8              | 11.920929
FLT_EPSILON = 1.1920929e-07
2^24 + 1 == 2^24 ? sim
2^24 + 2 == 2^24 ? não
```

| Elemento | Papel |
|---|---|
| `#include <float.h>` | O cabeçalho (arquivo de declarações, veja [os cabeçalhos](/?c=langages&s=c&p=headers)) que fornece os limites dos tipos de ponto flutuante, entre eles `FLT_EPSILON` ([`<float.h>`](https://en.cppreference.com/w/c/types/limits)) |
| `static`, `const` | `static` diante de uma função a torna visível apenas neste arquivo; `const` garante que um valor não será modificado |
| `#include <math.h>` | O cabeçalho das funções matemáticas: `nextafterf` e o valor `INFINITY` |
| `INFINITY` | O valor « infinito positivo »; `nextafterf(x, INFINITY)` dá o vizinho acima, `-INFINITY` o vizinho abaixo |
| `1.0f` | O sufixo `f` produz um `float`; sem ele, `1.0` seria um `double` |
| `sizeof valores / sizeof valores[0]` | O tamanho do array dividido pelo de uma casa: o número de casas |
| `%10.0f`, `%-14.9g`, `%.9g` | Formatos de `printf`: um `float` em 10 caracteres, sem casas decimais; um número em 14 caracteres alinhado à esquerda (`-`) com 9 algarismos significativos; idem sem largura. Nove algarismos bastam para distinguir dois `float` |

Os intervalos medidos, comparados com a fórmula 2ᵉ⁻²³:

| Valor | Patamar [2ᵉ ; 2ᵉ⁺¹[ | Intervalo acima | O que isso significa em metros |
|---|---|---|---|
| 1 | [1 ; 2[ | 2⁻²³ ≈ 0,00000012 | Um dez-milionésimo de metro |
| 1 000 | [512 ; 1 024[ | 2⁻¹⁴ ≈ 0,000061 | Cerca de 6 centésimos de milímetro |
| 1 000 000 | [524 288 ; 1 048 576[ | 2⁻⁴ = 0,0625 | Mais de 6 centímetros |
| 16 777 216 (2²⁴) | [2²⁴ ; 2²⁵[ | 2 | Os inteiros **ímpares** deixam de existir |
| 100 000 000 | [2²⁶ ; 2²⁷[ | 2³ = 8 | Intervalos de 8 metros |

Três observações sobre a saída. Primeiro, a partir de 16 777 216 = 2²⁴, dois números consecutivos estão separados por 2: `16777217` não existe, e o cálculo `2²⁴ + 1` cai de volta em `2²⁴` (o resultado exato fica bem no meio de dois `float`; a regra de arredondamento, veja [a absorção](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorcao-e-cancelamento-quando-um-calculo-perde-seus-digitos), escolhe o que tem o último bit igual a 0). Depois, o intervalo **abaixo** de 1 e de 2²⁴ vale a metade do intervalo acima (5,96e-08 e 1): uma potência de dois abre um patamar, então o patamar anterior é duas vezes mais fino. Por fim, a coluna `FLT_EPSILON*x` dá a ordem de grandeza do intervalo, nunca o seu valor exato.

### O que significa `FLT_EPSILON`

`FLT_EPSILON`, definido em `<float.h>`, é o intervalo logo acima de **1,0** e nada mais: 2⁻²³ ≈ 1,19 × 10⁻⁷. Tomá-lo por « a precisão de um `float` » é um erro comum.

| O que se acredita | O que é verdade |
|---|---|
| « Dois `float` a menos de `FLT_EPSILON` um do outro são iguais » | Isso só vale perto de 1. Em 1 000 000, o intervalo é 0,0625: mais de 500 000 vezes maior |
| « Um `float` tem uma precisão de 10⁻⁷ » | A precisão é **relativa**: cerca de 10⁻⁷ **do valor** (entre 6 × 10⁻⁸ e 1,2 × 10⁻⁷ de `x`) |
| « A precisão é a mesma em toda parte » | Ela é constante em proporção, mas o erro **absoluto** cresce com o valor: 10⁻⁷ em 1, 8 em 10⁸ |
| « O `double` resolve o problema » | Ele apenas o empurra para longe: o mesmo fenômeno existe com 53 bits, em valores bem maiores ([o capítulo sobre os floats](/?c=donnees&s=representation-des-donnees&p=nombres-flottants) dá os limiares do `double`) |

Para comparar dois `float`, toma-se portanto uma margem **proporcional** ao seu tamanho (veja [comparar corretamente](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#a-consequencia-pratica-nunca-testar-igualdade)), jamais só `FLT_EPSILON`.

## Os sintomas, medidos

Um único programa faz duas medições. **Primeira medição**: somar 0,1 um milhão de vezes a um `float`, uma primeira vez partindo de 0, uma segunda partindo de 10 000 000. O resultado matemático é 100 000 no primeiro caso e 10 100 000 no segundo.

**Segunda medição**, mais próxima de uma malha real: um pequeno triângulo ABC, de lados de 1 cm (0,01 m), é posto a 10 000 km da origem (10 000 000 m). Guardam-se seus vértices em `float`, relê-se e medem-se os lados. Dois triângulos são testados: um longe de qualquer fronteira de arredondamento, o outro atravessando uma fronteira. Para o segundo, eis o que acontece com seus dois vértices A e B:

```text
x de A : 10000000.495  --arredonda-->  10000000   (o float mais próximo)
x de B : 10000000.505  --arredonda-->  10000001   (o float mais próximo)
diferença real : 0,01 m              diferença obtida : 1 m
(dois floats vizinhos estão a 1 m; o meio deles é 10000000.5, A abaixo, B acima)
```

Os dois vértices, distanciados de 1 cm, caem de um lado e do outro do meio entre dois `float` vizinhos: A vira 10 000 000 e B vira 10 000 001.

```c
#include <math.h>
#include <stdio.h>

// Um vértice: duas coordenadas em metros, medidas a partir da origem do referencial
typedef struct {
    double x;
    double y;
} Point;

// O que se torna um número quando o guardamos em um float e depois o relemos
static double via_float(double v)
{
    return (double)(float)v;            // double -> float (arredonda) -> double (sem perda)
}

// Comprimento do segmento entre dois pontos, em metros
static double lado(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y); // hypot(dx, dy): raiz de dx² + dy²
}

// Mostra os três lados do triângulo, depois de uma passagem pelo float
static void mostrar_triangulo(const char *nome, const Point s[3])
{
    Point f[3];                         // os três vértices depois da passagem pelo float

    for (int i = 0; i < 3; i++) {       // cada coordenada é arredondada para um float
        f[i].x = via_float(s[i].x);
        f[i].y = via_float(s[i].y);
    }
    printf("%s : AB=%g BC=%g CA=%g (esperado : 0.01 0.0141421 0.01)\n",
           nome, lado(f[0], f[1]), lado(f[1], f[2]), lado(f[2], f[0]));
}

int main(void)
{
    float desde_zero = 0.0f;                   // soma que parte de 0
    float desde_dez_milhoes = 10000000.0f;     // soma que parte de dez milhões

    for (int i = 0; i < 1000000; i++) {         // um milhão de somas de 0,1
        desde_zero += 0.1f;
        desde_dez_milhoes += 0.1f;
    }
    printf("desde 0        : %.2f (esperado 100000)\n", desde_zero);
    printf("desde 10000000 : %.2f (esperado 10100000)\n", desde_dez_milhoes);

    const Point no_meio[3] = {                  // lados de 1 cm, a 10 000 km (10^7 m)
        {10000000.2, 10000000.2}, {10000000.21, 10000000.2}, {10000000.2, 10000000.21}};
    const Point a_cavalo[3] = {                 // A logo abaixo de x.5, B logo acima
        {10000000.495, 10000000.0}, {10000000.505, 10000000.0},
        {10000000.495, 10000000.01}};

    mostrar_triangulo("degenerado", no_meio);
    mostrar_triangulo("deformado ", a_cavalo);
    return 0;
}
```

```text
desde 0        : 100958.34 (esperado 100000)
desde 10000000 : 10000000.00 (esperado 10100000)
degenerado : AB=0 BC=0 CA=0 (esperado : 0.01 0.0141421 0.01)
deformado  : AB=1 BC=1 CA=0 (esperado : 0.01 0.0141421 0.01)
```

| Elemento | Papel |
|---|---|
| `typedef struct {...} Point;` | Dá o nome `Point` a um agrupamento de dois campos (veja [as estruturas](/?c=langages&s=c&p=variables#as-estruturas-struct)) |
| `(double)(float)v` | Duas conversões seguidas: para um `float` (o arredondamento acontece aqui), depois para um `double` (sem perda, pois um `double` contém todos os `float`) |
| `hypot(dx, dy)` | A raiz quadrada de dx² + dy²: o comprimento de um segmento de lados dx e dy |
| `0.1f` | O `float` mais próximo de 0,1 (valor exato: 0,100000001490116...) |
| `const Point s[3]` | Um parâmetro que recebe três pontos (na realidade, o endereço do primeiro, veja [os ponteiros](/?c=langages&s=c&p=pointeurs)) |
| `%.2f`, `%g`, `%s` | Formatos de `printf`: duas casas decimais; um número sem zeros inúteis; um texto |
| `for` | O laço que repete um bloco um número dado de vezes (veja [o laço `for`](/?c=langages&s=c&p=boucles#o-laco-for)) |

| Medida | Resultado | Explicação |
|---|---|---|
| Soma partindo de 0 | 100 958,34 em vez de 100 000 | 0,1 nunca é um múltiplo exato do intervalo. A cada soma o resultado é arredondado, e nesses tamanhos ele é arredondado **para o mesmo lado** a cada vez: os erros se somam em vez de se compensar |
| Soma partindo de 10 000 000 | Fica em 10 000 000,00 | O intervalo ali vale 1: somar 0,1 (menos que a metade de um intervalo) não muda nenhum bit. Cada uma das somas, um milhão ao todo, é **absorvida** |
| Triângulo « longe de uma fronteira » | Os três lados valem 0 | Os três vértices viram o mesmo `float`: o triângulo fica **degenerado** (reduzido a um ponto) |
| Triângulo « atravessando uma fronteira » | AB = 1 m, BC = 1 m, CA = 0 | Lados 100 vezes grandes demais, ou nulos: o triângulo fica **deformado** |

Esses triângulos não têm nada de exótico: um vértice que vira um ponto ou um lado que vira um metro são buracos numa superfície, um objeto que treme quando a câmera se move, ou uma colisão que deixa de ser detectada.

## A solução: uma origem local

A ideia: não guardar as coordenadas **absolutas** (medidas a partir da origem do mundo), mas coordenadas **relativas** a um ponto vizinho, a **origem local**. Se os dados cabem em um raio de alguns metros, os números guardados valem alguns metros, e um `float` tem ali um intervalo da ordem do micrômetro.

```text
        origem do mundo                         origem local O
              (0,0)                         (escolhida perto dos dados)
                |                                    |
                |<------------ 10 000 000 m -------->|<-- 0,01 m -->| vértice
                |                                    |
   armazenamento direto : x = 10000000.505  -> float : diferença de 1 m  (perdida)
   armazenamento local  : x - O = 0.01      -> float : diferença de ~1e-9 m (precisa)
```

O método tem quatro etapas:

| Etapa | O quê | Em que tipo |
|---|---|---|
| 1. Escolher a origem O | O primeiro vértice, o centro dos dados, um canto... | `double` |
| 2. Subtrair | Para cada coordenada: `p - O` | **`double`** |
| 3. Converter e guardar | A diferença, agora pequena, é guardada em um `float` | `float` |
| 4. Reler | Na leitura: `O + valor_float`, somado em `double` | `double` |

A origem O é conservada **com o objeto**, em `double`: é o único valor que guarda a posição real.

### Por que a subtração se faz em `double`

Tudo está na ordem. Converter **primeiro** em `float` e depois subtrair destrói a informação, pois a perda acontece na conversão, e a subtração apenas a torna visível. Subtrair **primeiro** em `double` conserva tudo, e então a conversão incide sobre um número pequeno.

| Ordem das operações | Cálculo de B − A (B = 10000000.505, A = 10000000.495) | Resultado |
|---|---|---|
| Converter, depois subtrair em `float` | `(float)B - (float)A` = 10000001 − 10000000 | **1** |
| Subtrair em `double`, depois converter | `(float)(B - A)` | **0,01** |

A diferença de dois `double` próximos um do outro é **exata**. Mais precisamente, se um dos dois números está entre a metade e o dobro do outro, a diferença cabe exatamente em um `double`: é o lema de Sterbenz (um resultado clássico da aritmética dos floats). Intuitivamente: os dois números se escrevem com os mesmos algarismos de maior peso, que se anulam na subtração; resta apenas alguns bits a conservar, e os 53 bits do `double` bastam com folga. O programa seguinte guarda os mesmos vértices das duas maneiras e mede o erro de posição.

```c
#include <math.h>
#include <stdio.h>

typedef struct { double x, y; } Point;      // um vértice em metros, em double (53 bits)
typedef struct { float x, y; } PointF;      // um vértice guardado em float (24 bits)

// Armazenamento sem precaução: convertemos diretamente as coordenadas em float
static PointF guardar_direto(Point p)
{
    return (PointF){(float)p.x, (float)p.y};
}

// Armazenamento com origem local: subtraímos em double, depois convertemos
static PointF guardar_local(Point p, Point origem)
{
    return (PointF){(float)(p.x - origem.x), (float)(p.y - origem.y)};
}

// Releitura sem origem: obtemos o valor do float, nada mais
static Point reler_direto(PointF f)
{
    return (Point){f.x, f.y};
}

// Releitura com origem: recolocamos a origem, em double
static Point reler_local(PointF f, Point origem)
{
    return (Point){origem.x + f.x, origem.y + f.y};
}

// Distância entre dois pontos, em metros
static double dist(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y);
}

// Mostra os três lados do triângulo relido r e seu maior erro de posição
static void mostrar(const char *nome, const Point v[3], const Point r[3])
{
    double pior = 0.0;                      // maior distância entre v[i] e r[i]

    for (int i = 0; i < 3; i++)
        pior = fmax(pior, dist(v[i], r[i]));
    printf("%-15s AB=%.6f BC=%.6f CA=%.6f  erro max=%.2e m\n", nome,
           dist(r[0], r[1]), dist(r[1], r[2]), dist(r[2], r[0]), pior);
}

int main(void)
{
    // Lados de 1 cm, a 10 000 km (10^7 m): A logo abaixo de x.5, B logo acima
    const Point v[3] = {{10000000.495, 10000000.0}, {10000000.505, 10000000.0},
                        {10000000.495, 10000000.01}};
    const Point origem = v[0];              // origem local: o primeiro vértice
    Point direto[3], local[3];              // vértices relidos, sem e com origem local

    for (int i = 0; i < 3; i++) {           // armazenamento em float, depois releitura
        direto[i] = reler_direto(guardar_direto(v[i]));
        local[i] = reler_local(guardar_local(v[i], origem), origem);
    }
    printf("esperado        AB=0.010000 BC=0.014142 CA=0.010000\n");
    mostrar("float direto", v, direto);
    mostrar("origem local", v, local);

    float fa = (float)v[0].x, fb = (float)v[1].x;   // A e B convertidos em float
    printf("B - A em float  : %g\n", fb - fa);      // subtração feita em float
    printf("B - A em double : %.6f\n", v[1].x - v[0].x);    // mesma subtração em double
    return 0;
}
```

```text
esperado        AB=0.010000 BC=0.014142 CA=0.010000
float direto    AB=1.000000 BC=1.000000 CA=0.000000  erro max=4.95e-01 m
origem local    AB=0.010000 BC=0.014142 CA=0.010000  erro max=0.00e+00 m
B - A em float  : 1
B - A em double : 0.010000
```

| Elemento | Papel |
|---|---|
| `(PointF){(float)p.x, (float)p.y}` | Um **literal composto**: fabrica um `PointF` no lugar, sem variável intermediária (veja [o literal composto](/?c=langages&s=c&p=offsetof-et-litteral-compose#o-literal-composto-do-c99-um-valor-fabricado-no-lugar)) |
| `fmax(a, b)` | O maior dos dois números |
| `%-15s` | Um texto em 15 caracteres, alinhado à esquerda |
| `%.2e` | Notação científica com duas casas decimais: `4.95e-01` significa 4,95 × 10⁻¹ |
| `const Point origem = v[0];` | A origem local é aqui o primeiro vértice |

Com a origem local, os lados saem corretos. O « erro max » de `0.00e+00` não diz que o `float` é exato (0,01 é nele armazenado com uma aproximação de cerca de 2 × 10⁻¹⁰): esse erro é menor que a metade do passo do `double` a 10 000 km (cerca de 9 × 10⁻¹⁰ m), então a soma `origem + valor` cai de volta no valor original.

### Qual origem escolher

| Escolha | Vantagem | Desvantagem |
|---|---|---|
| O primeiro vértice | Simples; deslocamentos pequenos para um objeto compacto | Depende da ordem dos vértices; dois objetos vizinhos têm duas origens diferentes |
| O centro da caixa delimitadora (o menor paralelepípedo que contém os dados) | Deslocamentos no máximo iguais à metade do tamanho | Recalcula-se sempre que os dados mudam |
| Um canto da zona | Fácil de encontrar | Deslocamentos até o tamanho inteiro |
| Um múltiplo de uma potência de dois (seção seguinte) | Exata em toda parte, idêntica para todos os objetos de uma mesma célula | Escolher o passo |

## Por que um passo de potência de dois

As três primeiras escolhas têm um defeito comum: a origem depende dos dados. Um **passo** é um comprimento fixo, aqui 2ᵏ metros (k é um inteiro: k = 10 dá 1 024 m). A origem então se calcula somente a partir da coordenada: O = 2ᵏ × (x / 2ᵏ arredondado para o inteiro mais próximo). Todos os pontos que recebem a mesma origem formam uma **célula**: um segmento de 2ᵏ metros (um quadrado em 2D, um cubo em 3D).

```text
fronteiras :  9999872                  10000896
                 |<------- 1024 m -------->|
                 |           O             |
                 |       10000384          |   toda coordenada desta célula
                 |                         |   recebe a mesma origem O
```

O cálculo, com x = 10000000.495 e k = 10:

| Etapa | Operação | Valor |
|---|---|---|
| 1 | x ÷ 2¹⁰ (um simples deslocamento do expoente) | 9765,6255 |
| 2 | Somar 0,5 e depois tomar a parte inteira (`floor`) | 9766 |
| 3 | Multiplicar por 2¹⁰ | O = 10 000 384 |
| 4 | Deslocamento x − O | −383,505 |

```c
#include <math.h>
#include <stdio.h>

// Origem escolhida por passo: o múltiplo de 2^k mais próximo de x
static double origem_por_passo(double x, int k)
{
    double n = floor(ldexp(x, -k) + 0.5);   // x / 2^k, arredondado ao inteiro mais próximo
    return ldexp(n, k);                     // n * 2^k (ldexp(m, e) vale m * 2^e, sem erro)
}

// Guarda x em um float relativo à origem o, depois o relê: o valor recuperado
static double ida_e_volta(double x, double o)
{
    float f = (float)(x - o);               // subtração em double, depois em float
    return o + f;                           // recoloca a origem, em double
}

int main(void)
{
    const double x = 10000000.495;          // uma coordenada a 10 000 km da origem
    const int passo[] = {0, 4, 10, 16};     // os expoentes k testados

    printf("x = %.3f\n", x);
    for (int i = 0; i < 4; i++) {           // um teste por passo
        double o = origem_por_passo(x, passo[i]);
        double pior = 0.0;                  // maior erro sobre 200 000 pontos vizinhos
        for (int j = 0; j < 200000; j++) {
            double p = 10000000.0 + j * 0.4713;
            pior = fmax(pior, fabs(ida_e_volta(p, origem_por_passo(p, passo[i])) - p));
        }
        printf("k=%2d passo=%6.0f origem=%.0f deslocamento=%+.3f erro max=%.2e\n",
               passo[i], ldexp(1.0, passo[i]), o, x - o, pior);
    }

    const double livre = 10000000.1;        // uma origem « livre », perto dos dados
    const double por_passo = origem_por_passo(livre, 10);
    printf("qualquer   : double=%.9f float=%.9f\n", livre, (double)(float)livre);
    printf("por passo  : double=%.9f float=%.9f\n", por_passo, (double)(float)por_passo);

    const double compartilhado = 10000040.123;    // vértice comum a dois pedaços
    const double centro_a = 10000020.3, centro_b = 10000070.7;  // um centro por pedaço
    printf("centros : diferença entre as duas releituras = %.2e m\n",
           fabs(ida_e_volta(compartilhado, centro_a) - ida_e_volta(compartilhado, centro_b)));
    printf("por passo : diferença entre as duas releituras = %.2e m\n",
           fabs(ida_e_volta(compartilhado, origem_por_passo(compartilhado - 20.0, 10))
                - ida_e_volta(compartilhado, origem_por_passo(compartilhado + 30.0, 10))));

    const double borda = 10000895.9;        // um vértice vizinho de uma fronteira de célula
    printf("na fronteira: diferença = %.2e m\n",
           fabs(ida_e_volta(borda, origem_por_passo(borda - 2.0, 10))
                - ida_e_volta(borda, origem_por_passo(borda + 2.0, 10))));
    return 0;
}
```

```text
x = 10000000.495
k= 0 passo=     1 origem=10000000 deslocamento=+0.495 erro max=1.49e-08
k= 4 passo=    16 origem=10000000 deslocamento=+0.495 erro max=2.38e-07
k=10 passo=  1024 origem=10000384 deslocamento=-383.505 erro max=1.52e-05
k=16 passo= 65536 origem=10027008 deslocamento=-27007.505 erro max=9.75e-04
qualquer   : double=10000000.100000000 float=10000000.000000000
por passo  : double=10000384.000000000 float=10000384.000000000
centros : diferença entre as duas releituras = 3.80e-07 m
por passo : diferença entre as duas releituras = 0.00e+00 m
na fronteira: diferença = 3.05e-05 m
```

| Elemento | Papel |
|---|---|
| `ldexp(m, e)` | Calcula m × 2ᵉ alterando apenas o expoente do número: **nenhum erro de arredondamento** ([`ldexp`](https://en.cppreference.com/w/c/numeric/math/ldexp)) |
| `floor(y)` | O maior inteiro menor ou igual a y, devolvido como `double`; `floor(y + 0.5)` arredonda ao inteiro mais próximo ([`floor`](https://en.cppreference.com/w/c/numeric/math/floor)) |
| `fabs(y)` | O valor absoluto de y |
| `%+.3f`, `%6.0f`, `%2d` | Formatos de `printf`: três casas decimais com o sinal; um número em 6 caracteres, sem casas decimais; um inteiro em 2 caracteres |
| `%.9f` | Um número com nove casas decimais |
| `(double)(float)livre` | O que se torna `livre` quando o fazemos passar por um `float` |

Por que potências de dois, e não uma origem « livre » ou um passo decimal como 0,1 m (que nem `float` nem `double` representam exatamente)?

| Propriedade | Explicação | O que a saída mostra |
|---|---|---|
| A própria origem é exata | Um múltiplo n × 2ᵏ (n < 2²⁴) cabe em um `float` **e** em um `double` sem arredondamento. Um número como 10000000.1 não cabe em nenhum: ele é apenas aproximado | `livre` passa por um `float` e vira 10 000 000,0: **0,1 m de erro a mais**, ou seja dez vezes o lado do triângulo. `por_passo` volta inalterada |
| O deslocamento é limitado | A célula nunca ultrapassa 2ᵏ⁻¹ de cada lado de O: o erro da conversão é limitado por 2ᵏ⁻²⁶ (mais o arredondamento minúsculo da soma final em `double`), qualquer que seja a distância até a origem do mundo | A coluna `erro max` segue o limite (tabela abaixo) |
| A mesma origem se encontra em toda parte | O depende apenas de x e de k: carregamento, salvamento, envio à placa de vídeo e a outra máquina dão o mesmo valor. Pode-se até guardar somente o inteiro n | Na linha `por passo`, dois pontos a 50 m um do outro recebem a mesma origem |
| Os vizinhos a compartilham | Todos os pontos de uma mesma célula têm a mesma origem, portanto a mesma conversão para um vértice comum | `centros`: 3,80e-07 m de diferença; `por passo`: 0 |

O item 1 merece um esclarecimento de honestidade. A **subtração** `x - 10000000.1` continua exata em `double`, como com qualquer origem próxima (veja acima). O erro extra nasce quando essa origem viaja para fora de um `double`: enviada à placa de vídeo em `float`, escrita em um arquivo como texto arredondado, ou recalculada um pouco diferente em outro ponto do programa. Uma origem múltipla de 2ᵏ atravessa todas essas passagens sem mudar.

Escolher k é um compromisso, medido sobre 200 000 pontos vizinhos:

| k | Passo (m) | Deslocamento máximo (m) | Limite 2ᵏ⁻²⁶ (m) | Erro medido (m) |
|---|---|---|---|---|
| 0 | 1 | 0,5 | 1,49 × 10⁻⁸ | 1,49 × 10⁻⁸ |
| 4 | 16 | 8 | 2,4 × 10⁻⁷ | 2,38 × 10⁻⁷ |
| 10 | 1 024 | 512 | 1,5 × 10⁻⁵ | 1,52 × 10⁻⁵ |
| 16 | 65 536 | 32 768 | 9,8 × 10⁻⁴ | 9,75 × 10⁻⁴ |

Escolhe-se o maior k cujo limite fica abaixo da tolerância desejada: um passo maior significa menos origens para gerenciar, um passo menor, mais precisão. O último teste da saída mostra o limite do método: na **fronteira** entre duas células, dois pontos vizinhos recebem duas origens diferentes (10 000 384 e 10 001 408), e um vértice comum guardado duas vezes pode diferir de 3,05 × 10⁻⁵ m, ou seja, uma diferença de `float` a 512 m. A diferença fica limitada, mas não é nula.

## Limites e outros remédios

### Guardar a origem junto com o objeto

A origem local faz parte dos dados: sem ela, os `float` não situam mais nada. Guarda-se em `double`, ao lado das coordenadas relativas:

```c
#include <stddef.h>

typedef struct {
    double origem[3];       // a origem local do objeto, em double (3 × 8 = 24 bytes)
    float *vertices;        // x, y, z de cada vértice, relativos à origem, em float
    size_t num_vertices;    // número de vértices
} Malha;

// Coordenada x absoluta do vértice i: a origem é recolocada em double
static double x_absoluto(const Malha *m, size_t i)
{
    return m->origem[0] + m->vertices[3 * i];
}

// Diferença em x entre o vértice i de a e o vértice j de b, sem números grandes
static double desvio_x(const Malha *a, size_t i, const Malha *b, size_t j)
{
    double entre_origens = a->origem[0] - b->origem[0];  // grande diferença, em double
    return entre_origens + ((double)a->vertices[3 * i] - b->vertices[3 * j]);
}
```

| Elemento | Papel |
|---|---|
| `size_t` | Um inteiro sem sinal próprio para contar elementos e posições |
| `m->origem[0]` | O campo `origem` da estrutura cujo endereço é `m`, primeira casa (x) |
| `m->vertices[3 * i]` | Os vértices são guardados em sequência: x, y, z do vértice 0, depois do vértice 1...; a coordenada x do vértice i fica na casa 3 × i |
| `(double)a->vertices[3 * i] - b->vertices[3 * j]` | O cast converte o `float` da esquerda em `double`; o da direita é então promovido automaticamente a `double`, e a subtração é feita em `double` |

`desvio_x` ilustra a regra para dois objetos de origens diferentes: subtraem-se primeiro as **origens** entre si, em `double`, depois se soma a pequena diferença dos deslocamentos.

### O custo e a placa de vídeo

| Pergunta | Resposta |
|---|---|
| Por que não guardar tudo em `double`? | Um `double` ocupa 8 bytes, um `float` 4 (veja [a organização dos dados na memória](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Um milhão de vértices em 3D: 12 MB (megabytes, milhões de bytes) em `float`, 24 MB em `double`, e o dobro de dados a enviar à placa de vídeo a cada vez |
| Por que a placa de vídeo é afetada? | Seus programas, os [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#os-shaders-os-programas-da-placa-de-video), calculam em `float`: o `double` está ausente em alguns hardwares e é bem mais lento em outros |
| E então, o que fazer? | Manter a origem em `double` do lado do processador e enviar apenas `float` relativos. A translação do objeto (veja [as matrizes model, view e projection](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#do-objeto-a-tela-model-view-projection)) se calcula em `double`, e somente sua versão reduzida vai em `float` |

### Outros remédios

| Remédio | Princípio | Detalhe |
|---|---|---|
| Coordenadas relativas à câmera | A cada imagem, subtrai-se em `double` a posição da câmera: a precisão é máxima perto do olho | Uma origem local que segue a câmera |
| Inteiros em ponto fixo | Contar em milímetros em um inteiro de 64 bits: o intervalo é o mesmo em toda parte | Veja [o ponto fixo](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#uma-alternativa-a-representacao-em-ponto-fixo) |
| `double` em toda parte | Empurra o limiar (de 16,7 milhões a 9 quadrilhões para inteiros) | Custo de memória, velocidade |
| Dividir o mundo em células | Uma origem por célula (o passo de potência de dois deste capítulo), cada célula tem seus próprios `float` | Gerenciar as fronteiras |

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Converter em `float` **antes** de subtrair | `(float)p - (float)O` cai em 0 ou em um metro: a perda já foi feita. Subtrair em `double` primeiro |
| Perder a origem, ou guardá-la em `float` | Os deslocamentos continuam certos, mas o objeto inteiro fica deslocado (de 0,1 m no exemplo de `livre`). Guardar a origem em `double` junto com o objeto |
| Misturar dois objetos de origens diferentes | Comparar ou somar seus `float` como se compartilhassem um referencial desloca tudo pela diferença das origens. Levar ao mesmo referencial (subtrair as origens em `double`, veja `desvio_x`) |
| Um vértice comum a dois pedaços de origens diferentes | Guardado duas vezes, ele difere por alguns passos de `float`: uma fissura entre os pedaços. Dar a mesma origem aos dois, ou guardá-lo uma só vez |
| Somar a translação do objeto em `float` depois | Uma matriz de posicionamento (uma tabela de números que desloca e gira o objeto) que contém 10 000 000 em `float` traz de volta o problema da origem. Compor em `double` e reduzir no final |
| Comparar dois floats com `==` | Mesmo após uma ida e volta exata, um arredondamento pode subsistir. Comparar com uma margem relativa (veja `quase_iguais` mais abaixo) ou em `double` após a recolocação da origem |
| Tomar `FLT_EPSILON` pela precisão de todo `float` | Ele só vale perto de 1. É necessária uma tolerância proporcional ao valor |
| Escolher um passo grande demais | Com k = 16, o erro sobe para quase um milímetro. Escolher k pela tolerância |
| Somar muitos valores pequenos a um grande total | Cada soma é arredondada (ou absorvida): veja as somas acima e [a absorção](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorcao-e-cancelamento-quando-um-calculo-perde-seus-digitos). Somar primeiro os valores pequenos entre si |

Uma comparação de `float` com margem proporcional (`fabsf` é o valor absoluto de um `float`, `fmaxf` o maior de dois `float`):

```c
#include <float.h>
#include <math.h>

// Verdadeiro se a e b diferem em no máximo quatro vezes o intervalo relativo de um float
static int quase_iguais(float a, float b)
{
    float margem = 4.0f * FLT_EPSILON * fmaxf(fabsf(a), fabsf(b));  // margem proporcional
    return fabsf(a - b) <= margem;       // fabsf: valor absoluto de um float
}
```

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Manter as coordenadas do mundo em `double` e guardar em `float` apenas os deslocamentos | Os números grandes permanecem precisos, os pequenos cabem em 24 bits |
| Subtrair a origem em `double`, converter depois | A diferença é exata, a conversão incide sobre um número pequeno |
| Escolher a origem por passo de potência de dois (`ldexp`, `floor`) | Origem exata, reproduzível, compartilhada pelos vizinhos |
| Escolher k pela tolerância: erro ≤ 2ᵏ⁻²⁶ | O erro máximo se calcula antes de programar |
| Guardar a origem (ou o inteiro n e k) junto com cada objeto | Os `float` não servem para nada sem ela |
| Levar dois objetos ao mesmo referencial subtraindo suas origens em `double` | Nenhum valor grande passa de novo por um `float` |
| Medir o intervalo acima do valor útil com `nextafterf`, em vez de supô-lo | Vê-se a precisão real no ponto em que se trabalha |
| Comparar com uma margem proporcional, nunca com `==` | A tolerância acompanha o tamanho dos valores |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um `float` tem 24 bits significativos: o intervalo entre dois vizinhos vale 2ᵉ⁻²³ e dobra a cada patamar de potência de dois (1,2e-7 em 1, 0,0625 em um milhão, 2 em 16 777 216, 8 em cem milhões). `FLT_EPSILON` é esse intervalo somente ao redor de 1,0: a precisão é constante em proporção, mas o erro absoluto cresce. Longe da origem, um triângulo de 1 cm vira nulo ou mede 1 m. A solução é uma origem local em `double`, subtraída **antes** da conversão em `float`; a origem é escolhida por passo de potência de dois (2ᵏ × inteiro), exata, reproduzível e compartilhada pelos vizinhos. |
| **Armadilhas a evitar** | Converter antes de subtrair; esquecer ou arredondar a origem; misturar dois referenciais de origens diferentes; um vértice comum guardado com duas origens; a translação do objeto recomposta em `float`; `==` e `FLT_EPSILON` como tolerância universal; um passo grande demais; somar pequenos termos a um grande total. |
| **Boas práticas** | Mundo em `double`, deslocamentos em `float`; subtração em `double` e depois conversão; origem por passo 2ᵏ com k escolhido conforme a tolerância; origem guardada com o objeto; diferença das origens em `double` entre objetos; margem de comparação proporcional ao valor; `nextafterf` para medir o intervalo real. |
