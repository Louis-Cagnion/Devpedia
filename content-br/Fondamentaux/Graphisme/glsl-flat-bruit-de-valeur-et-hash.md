---
order: 10
---

# GLSL: o qualificador `flat`, o ruído de valor e as funções de hash

Um [shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#os-shaders-os-programas-da-placa-de-video) é um pequeno programa escrito em GLSL que roda na placa de vídeo. Este capítulo trata de duas ferramentas que aparecem em quase todos os shaders um pouco avançados. A primeira é uma palavra-chave, `flat`, que decide como um valor viaja de uma etapa do shader para a seguinte: sem ela, a placa **mistura** o valor entre os três vértices de um triângulo, o que não faz sentido para um número de material. A segunda é uma forma de fabricar um « acaso » sem gerador: o **ruído de valor**, baseado em uma **função de hash**. Todos os números das tabelas vêm de programas em C escritos para este capítulo e executados (o mesmo algoritmo do GLSL, a menos do arredondamento); os blocos GLSL, por sua vez, não foram compilados aqui.

O capítulo supõe conhecidos [as etapas de um shader e suas entradas/saídas `in`/`out`](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#os-shaders-os-programas-da-placa-de-video) (um **vértice** é um ponto da malha, um **fragmento** é um pixel candidato à tela), [os números de ponto flutuante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), [os operadores binários do C](/?c=langages&s=c&p=operateurs-binaires) (`^`, `>>`, `<<`) e [o produto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## O que recebe um fragmento: uma média dos três vértices

Um triângulo é desenhado a partir de seus três vértices, e cada um pode carregar valores (uma cor, uma coordenada de textura, uma normal). Mas a tela é feita de pixels, bem mais numerosos: para cada fragmento coberto pelo triângulo, a placa gráfica precisa **inventar** um valor. Ela faz uma média ponderada dos três valores, com **pesos baricêntricos**: três números positivos cuja soma vale 1, que indicam o quanto o fragmento está próximo de cada vértice. É a **interpolação** (o cálculo de um valor intermediário a partir de valores conhecidos em pontos vizinhos).

```text
              B  (valor 5)
             /\
            /  \
           /    \         P: um fragmento, com os pesos wA, wB, wC
          /   P  \        (wA + wB + wC = 1; quanto mais P está perto de um vértice,
         /        \        maior é o seu peso)
        A----------C
 (valor 2)      (valor 9)

 valor em P = wA x 2 + wB x 5 + wC x 9
```

É exatamente o que se quer para uma cor ou uma coordenada de textura: um degradê contínuo. Para um **identificador** (um número de material, um número de objeto), é uma catástrofe. Os valores 2, 5 e 9 do esquema, interpolados em quatro pontos de um triângulo (resultado do programa em C da seção sobre o vértice provocador):

| Pesos (wA, wB, wC) | Valor interpolado | O que se queria |
|---|---|---|
| 0,33 ; 0,33 ; 0,33 | 5,3333 | Um número inteiro |
| 0,60 ; 0,30 ; 0,10 | 3,6000 | Um número inteiro |
| 0,10 ; 0,10 ; 0,80 | 7,9000 | Um número inteiro |
| 0,05 ; 0,90 ; 0,05 | 5,0500 | Um número inteiro |

Nenhum desses números é um material escolhido por um vértice, e arredondar não resolve: 3,6 vira 4 e 7,9 vira 8, números que ninguém forneceu. GLSL oferece três comportamentos, escolhidos por um **qualificador** (uma palavra colocada antes da declaração de uma variável):

| Qualificador | Valor recebido pelo fragmento | Uso típico |
|---|---|---|
| `smooth` (padrão) | Média ponderada, corrigida pela perspectiva (a correção mantém um padrão reto numa superfície vista de lado) | Cor, coordenada de textura, normal suavizada |
| `noperspective` | Média ponderada, sem essa correção: linear na tela | Efeitos desenhados diretamente no espaço da tela |
| `flat` | **Nenhuma média**: o valor de um único vértice, o mesmo em todo o triângulo | Identificador, índice de material, cor ou normal por face |

Os três estão descritos na [página Type Qualifier da documentação Khronos](https://www.khronos.org/opengl/wiki/Type_Qualifier_(GLSL)).

## `flat`: um valor por triângulo, sem média

Escreve-se `flat` antes da saída do vertex shader **e** antes da entrada do fragment shader que tem o mesmo nome. Exemplo: um inteiro por vértice escolhe uma cor em uma pequena paleta.

```glsl
// ----- vertex shader -----
#version 330 core                        // versão 3.30 de GLSL, perfil moderno (core)
layout(location = 0) in vec3 posicao;    // posição do vértice; 0: número do atributo
layout(location = 1) in int material;    // um inteiro por vértice; atributo número 1
uniform mat4 mvp;                        // uniform: fixado pelo programa C; mat4: matriz 4x4
flat out int v_material;                 // saída « flat »: nunca é média

void main()
{
	gl_Position = mvp * vec4(posicao, 1.0);   // posição do vértice na tela
	v_material = material;                    // o inteiro é copiado tal qual
}
```

```glsl
// ----- fragment shader -----
#version 330 core
flat in int v_material;        // mesmo nome, mesmo qualificador da saída acima
uniform vec3 paleta[4];        // quatro cores, fixadas pelo programa C
out vec4 cor;                  // cor final do fragmento

void main()
{
	cor = vec4(paleta[v_material], 1.0);   // o inteiro escolhe a cor
}
```

Do lado do programa C, um atributo inteiro se declara com `glVertexAttribIPointer` (o **I** significa « integer »: sem ele, a placa converteria o inteiro em ponto flutuante), documentado em [`glVertexAttribPointer`](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glVertexAttribPointer.xhtml).

```c
/* atributo 1: 1 componente do tipo GL_INT; stride: bytes de um vértice ao outro;
   offset: posição do inteiro dentro de um vértice */
glVertexAttribIPointer(1, 1, GL_INT, stride, (void *)offset);
glEnableVertexAttribArray(1);                    /* ativa o atributo 1 */
```

Além disso, há uma regra da linguagem: uma entrada de fragment shader de **tipo inteiro** (`int`, `uint`, `ivec3`...) deve obrigatoriamente ser `flat`. A razão é lógica: a média de inteiros não é um inteiro. Sem `flat`, o shader é recusado na compilação ou na ligação (regra da página Khronos acima; não testada aqui por falta de driver). Um flutuante também pode ser `flat`.

| Caso de uso | O que carrega a variável `flat` | Por que não um valor interpolado |
|---|---|---|
| Identificador de objeto | Um número escrito em uma imagem à parte para o [picking](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#o-picking-do-mouse-encontrar-qual-objeto-3d-foi-clicado) | Um número misturado designa outro objeto |
| Índice de material | Um inteiro que indexa uma paleta ou um vetor de texturas | Um índice médio não existe |
| Cor por face | Uma cor por triângulo, para uma renderização facetada | O degradê apagaria as arestas |
| Normal por face | O vetor perpendicular ao triângulo, calculado pelo [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#exemplo-uma-normal-plana-por-triangulo-calculada-no-geometry-shader) | Os três vértices carregam o mesmo valor: `flat` o diz explicitamente e evita um cálculo de média inútil |

## Qual vértice fornece o valor: o vértice provocador

Se `flat` elimina a média, resta uma pergunta: os três vértices carregam três valores possíveis; qual deles o fragmento recebe? O OpenGL escolhe **um só**, o **vértice provocador** (*provoking vertex*: o vértice que « provoca » o valor do triângulo inteiro). Por padrão é o **último** vértice do triângulo (`GL_LAST_VERTEX_CONVENTION`); `glProvokingVertex` permite escolher o primeiro (`GL_FIRST_VERTEX_CONVENTION`), veja a [documentação Khronos de glProvokingVertex](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glProvokingVertex.xhtml).

```c
glProvokingVertex(GL_FIRST_VERTEX_CONVENTION);   /* o 1º vértice fornece o valor flat */
glProvokingVertex(GL_LAST_VERTEX_CONVENTION);    /* volta ao ajuste padrão */
```

Para uma lista de triângulos (`GL_TRIANGLES`), « último » quer dizer o terceiro índice de cada triângulo. Se existir um geometry shader, a regra se aplica aos vértices **emitidos** por ele, e não aos da malha. A convenção não foi verificada em uma placa gráfica aqui: o programa C abaixo aplica a regra « último índice » a um cubo indexado de 8 vértices e 12 triângulos, e à interpolação do valor 2, 5, 9 do esquema anterior.

```c
#include <stdio.h>   /* printf */

int	main(void)
{
	float	valores[3] = {2.0f, 5.0f, 9.0f};                /* valor de A, B, C */
	float	w[4][3] = {{1 / 3.0f, 1 / 3.0f, 1 / 3.0f}, {0.6f, 0.3f, 0.1f},
		{0.1f, 0.1f, 0.8f}, {0.05f, 0.9f, 0.05f}};          /* quatro fragmentos */
	int		cubo[12][3] = {{0,1,2}, {0,2,3}, {1,5,6}, {1,6,2}, {5,4,7}, {5,7,6},
		{4,0,3}, {4,3,7}, {3,2,6}, {3,6,7}, {4,5,1}, {4,1,0}};   /* índices */
	int		usos[8] = {0};                                  /* triângulos por vértice */
	int		k;

	for (k = 0; k < 4; k++)                                 /* média contra flat */
		printf("pesos %.2f %.2f %.2f : média %.4f, flat último 9, flat primeiro 2\n",
			w[k][0], w[k][1], w[k][2],
			w[k][0] * valores[0] + w[k][1] * valores[1] + w[k][2] * valores[2]);
	for (k = 0; k < 12; k++)
		usos[cubo[k][2]]++;                                 /* o último índice conta */
	for (k = 0; k < 8; k++)
		printf("vértice %d fornece o valor de %d triângulo(s)\n", k, usos[k]);
	return (0);
}
```

```text
pesos 0.33 0.33 0.33 : média 5.3333, flat último 9, flat primeiro 2
pesos 0.60 0.30 0.10 : média 3.6000, flat último 9, flat primeiro 2
pesos 0.10 0.10 0.80 : média 7.9000, flat último 9, flat primeiro 2
pesos 0.05 0.90 0.05 : média 5.0500, flat último 9, flat primeiro 2
vértice 0 fornece o valor de 1 triângulo(s)
vértice 1 fornece o valor de 1 triângulo(s)
vértice 2 fornece o valor de 2 triângulo(s)
vértice 3 fornece o valor de 2 triângulo(s)
vértice 4 fornece o valor de 0 triângulo(s)
vértice 5 fornece o valor de 0 triângulo(s)
vértice 6 fornece o valor de 3 triângulo(s)
vértice 7 fornece o valor de 3 triângulo(s)
```

| Vértice do cubo | Triângulos cujo último índice ele é | Consequência |
|---|---|---|
| 0 e 1 | 1 cada | Nenhum conflito |
| 2 e 3 | 2 cada | Com essa ordem de índices, os dois triângulos vêm de faces diferentes (por exemplo a frente e a direita para o vértice 2): conflito |
| 4 e 5 | 0 | Nunca fornecem valor: o que carregam é ignorado por `flat` |
| 6 e 7 | 3 cada | Três faces diferentes reclamam cada uma o seu valor: conflito |

Os dois últimos casos são a armadilha principal: um vértice **compartilhado** por vários triângulos (é todo o interesse de um [buffer de índices](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#os-buffers-vbo-ebo-e-vao)) carrega apenas **um** valor, mas várias faces gostariam de ter o seu. Três soluções:

| Solução | Princípio | Custo |
|---|---|---|
| Duplicar os vértices | Cada face tem seus próprios vértices (24 para um cubo, em vez de 8), portanto seu próprio valor | Mais memória, mais vértices a processar |
| Calcular o valor em um geometry shader | Ele recebe os três vértices e emite o mesmo valor três vezes: nenhum vértice pode entrar em conflito | Uma etapa a mais (opcional) |
| Ler uma tabela com `gl_PrimitiveID` | Variável predefinida do fragment shader que dá o número do triângulo; lê-se o seu dado em uma tabela | Um acesso de memória por fragmento |

## O que faz um hash em um shader

Para ruído, grão e padrões aleatórios, é preciso um número que « pareça » acaso. Um gerador clássico (veja [a aleatoriedade e os geradores](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs) ou [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#um-ruido-reproduzivel-xorshift)) guarda um **estado**: cada sorteio modifica o estado, e o seguinte depende dele. Em um shader isso é impossível: os fragmentos são calculados em paralelo, numa ordem qualquer, sem memória comum. Usa-se então uma **função de hash** (*hash*): uma função que recebe um valor (aqui uma posição) e devolve um número que parece aleatório, mas que é **inteiramente determinado** pela entrada. Não confundir com o hash de [uma tabela hash](/?c=langages&s=c&p=tables-de-hachage), que responde a outra necessidade.

| | Gerador com estado (`rand`, xorshift) | Hash sem estado |
|---|---|---|
| Entrada | Nenhuma: pede-se « o seguinte » | Uma posição (ou um número) |
| Memória entre duas chamadas | Sim, o estado | Não |
| Mesma posição, duas chamadas | Dois valores diferentes | **O mesmo valor** |
| Ordem das chamadas | Conta | Sem importância |
| Adequado a um shader | Não | Sim |

Um bom hash de shader deve ter três qualidades: ser **determinístico** (mesma entrada, mesma saída, de um quadro para outro, senão o padrão cintila), ser **uniforme** (todos os valores de 0 a 1 saem com a mesma frequência) e ter um **efeito avalanche** (mudar um único bit da entrada muda cerca de metade dos bits da saída, então duas posições vizinhas dão valores sem relação).

## Primeiro hash: `fract(sin(dot(...)))`

```glsl
float hash31(vec3 p)   // p: um ponto do espaço; resultado: de 0 a menos de 1
{
	float d = dot(p, vec3(12.9898, 78.233, 37.719));   // dot: x*12.99 + y*78.23 + z*37.72
	d = sin(d) * 43758.5453;     // sin: de -1 a 1; o fator grande espalha os algarismos
	return fract(d);             // fract: só a parte decimal (3,7 dá 0,7)
}
```

O raciocínio: `dot` reduz o ponto a **um único número** (três coordenadas vizinhas dão um número vizinho); `sin` é uma função que oscila rápido quando seu argumento cresce, então dois argumentos próximos dão senos diferentes; multiplicar por 43 758,5453 amplifica essas diferenças até os algarismos decimais; `fract` só guarda esses algarismos, que já não estão ligados à entrada. As constantes (12,9898 ; 78,233 ; 37,719 ; 43 758,5453) tornaram-se comuns por hábito: nenhuma regra matemática as impõe.

É curto e prático, mas tudo depende da precisão de um `float` de 32 bits. O programa C seguinte executa a mesma fórmula em `float`, depois em `double` (64 bits).

```c
#include <math.h>     /* sinf, sin, floorf, floor */
#include <stdio.h>    /* printf */
#include <stdlib.h>   /* qsort */

float	hash_f(float x, float y, float z)      /* fract(sin(dot(p, k)) * 43758.5453) */
{
	float	d = x * 12.9898f + y * 78.233f + z * 37.719f;   /* dot(p, k) em float 32 bits */
	float	v = sinf(d) * 43758.5453f;                      /* sin, depois a amplificação */

	return (v - floorf(v));                                 /* fract: a parte decimal */
}

double	hash_d(double x, double y, double z)   /* a mesma fórmula em double (64 bits) */
{
	double	v = sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;

	return (v - floor(v));
}

int	comparar_float(const void *a, const void *b)
{
	float	x = *(const float *)a;
	float	y = *(const float *)b;

	return ((x > y) - (x < y));
}

int	contar_distintos(float *v, int n)                /* quantos valores diferentes */
{
	int	i;
	int	contagem = 1;

	qsort(v, n, sizeof(float), comparar_float);
	for (i = 1; i < n; i++)
		if (v[i] != v[i - 1])
			contagem++;
	return (contagem);
}

int	main(void)
{
	static float	v[1048576];   /* static: fora da pilha, que seria pequena demais */
	int				i;
	int				bad = 0;
	int				j;

	for (i = 0; i < 8; i++)
		printf("h(%d,0,0) = %.6f\n", i, hash_f((float)i, 0, 0));
	for (i = 0; i < 1048576; i++)
		v[i] = hash_f((float)i, 0, 0);
	printf("float de 32 bits: %d valores distintos\n", contar_distintos(v, 1048576));
	for (i = 0; i < 1048576; i++)
		v[i] = (float)hash_d(i, 0, 0);
	printf("double          : %d valores distintos\n", contar_distintos(v, 1048576));
	for (i = 0; i < 1024; i++)                        /* float contra double, x de 0 a 1023 */
		if (fabs(hash_f((float)i, 0, 0) - hash_d(i, 0, 0)) > 0.01)
			bad++;
	printf("diferença maior que 0.01 entre as duas: %d casos em 1024\n", bad);
	for (i = 0; i < 2; i++)                           /* x = 0, depois x = 1 000 000 */
	{
		printf("x = %d, y de 0 a 0.007: ", i * 1000000);
		for (j = 0; j < 8; j++)
			printf("%.4f ", hash_f((float)i * 1000000.0f, 0.001f * j, 0));
		printf("\n");
	}
	return (0);
}
```

Saída real (compilado com `gcc -Wall -Wextra -O1 -ffp-contract=off`; a última opção impede o compilador de fundir uma multiplicação e uma soma em uma única operação, o que mudaria os arredondamentos):

```text
h(0,0,0) = 0.000000
h(1,0,0) = 0.941406
h(2,0,0) = 0.085938
h(3,0,0) = 0.589844
h(4,0,0) = 0.367188
h(5,0,0) = 0.335938
h(6,0,0) = 0.460938
h(7,0,0) = 0.987793
float de 32 bits: 16691 valores distintos
double          : 1027137 valores distintos
diferença maior que 0.01 entre as duas: 998 casos em 1024
x = 0, y de 0 a 0.007: 0.0000 0.8716 0.8232 0.0615 0.0508 0.6348 0.1562 0.5957
x = 1000000, y de 0 a 0.007: 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1299
```

| Constatação | Medida | Explicação |
|---|---|---|
| Muito poucos valores diferentes | 16 691 valores distintos em 1 048 576 entradas em `float`, contra 1 027 137 em `double` | O produto `sin(d) * 43758.5453` chega a dezenas de milhares: um `float` tem 24 bits significativos, sobram poucos para as casas decimais (um passo de 1/256 acima de 32 768, mais fino abaixo). As saídas do programa são todas múltiplos de 1/4096 (0,941406 = 3856/4096) |
| Resultado diferente conforme a precisão | Diferença de mais de 0,01 entre `float` e `double` para 998 entradas em 1 024 | O erro de arredondamento do `float` em `d` é multiplicado pelo fator grande: o « acaso » depende da precisão do cálculo |
| Pequenas mudanças desaparecem longe da origem | Com x = 1 000 000, variar y de 0,001 em 0,001 dá 0,1680 sete vezes seguidas | `d` vale então cerca de 13 milhões, e um `float` é arredondado ali para a unidade: o termo `y * 78.233` é **absorvido** (veja [absorção e cancelamento](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorcao-e-cancelamento-quando-um-calculo-perde-seus-digitos) e [os floats longe da origem](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine)) |
| Uma entrada nula dá uma saída nula | h(0,0,0) = 0,000000 | `sin(0)` vale 0: o ponto 0 não parece aleatório |

Os resultados se aproximam do uniforme (χ² de 21,36 para 15 graus de liberdade sobre 1 048 576 entradas, valor comum para um sorteio uniforme; o teste é explicado em [Comparar dois ajustes](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages#verificar-um-sorteio-uniforme-o-teste-do), medição feita com um programa auxiliar), mas o defeito principal está em outro lugar: o valor depende da implementação de `sin`. A diferença `float`/`double` acima foi medida no processador; que duas placas gráficas diferentes produzam `sin` diferentes para argumentos grandes não pôde ser medido aqui (uma única máquina), mas a fórmula o expõe por construção: um padrão calculado com este hash pode mudar de aparência de uma placa para outra, ou de um driver para outro.

## Segundo hash: um inteiro sem estado

A solução é parar de usar flutuantes para misturar: trabalha-se com **inteiros sem sinal** de 32 bits (`uint` em GLSL, `uint32_t` em C), cujas operações são exatas e idênticas em toda parte. Um `uint` nunca passa de `2³² - 1`: além disso, o resultado é calculado **módulo 2³²** (guarda-se o resto da divisão por 2³², então os bits excedentes se perdem). Duas operações se repetem:

| Operação | Efeito | Por que é útil |
|---|---|---|
| `x ^= x >> 16` (xor-deslocamento) | Desloca `x` de 16 posições para a direita (os bits de peso alto, à esquerda, descem para os bits de peso baixo), depois combina por `^`, o « ou exclusivo »: um bit vale 1 se os dois bits combinados forem diferentes (veja [os operadores binários](/?c=langages&s=c&p=operateurs-binaires#os-seis-operadores)) | Uma multiplicação só propaga os bits para **cima**: o xor-deslocamento traz a informação de cima para baixo |
| `x *= constante ímpar` | Multiplica, módulo 2³² | Cada bit de entrada se espalha por todos os bits mais altos; uma constante ímpar não faz perder informação (a multiplicação continua reversível) |

```glsl
uint hash_u(uint x)              // uint: inteiro sem sinal de 32 bits, cálculo módulo 2^32
{
	x ^= x >> 16;                // xor-deslocamento: mistura o alto e o baixo
	x *= 0x7feb352du;            // multiplica; 0x: escrita em base 16, u: sem sinal
	x ^= x >> 15;                // segundo xor-deslocamento
	x *= 0x846ca68bu;            // segunda multiplicação
	x ^= x >> 16;                // última mistura
	return x;
}

float hash_unitario(uint h)          // converte um uint em número de 0 a menos de 1
{
	return float(h >> 8) * (1.0 / 16777216.0);   // 24 bits: exatos em float
}
```

Por que `h >> 8`? Um `float` só representa exatamente 24 bits de inteiro (veja [a codificação dos flutuantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#como-um-float-e-codificado)). Escrever `float(h) / 4294967295.0` arredonda: `(float)0xffffffff` vale 4294967296,0 e o quociente vale então exatamente 1,0, valor que o ruído nunca deve produzir (medido por um programa auxiliar). Mantendo 24 bits, o valor máximo é 0,99999994.

As cinco etapas, acompanhadas em algumas entradas (valores em hexadecimal, produzidos por um programa auxiliar):

| Entrada | Após o 1º xor-deslocamento | Após `* 0x7feb352d` | Após o xor-deslocamento 15 | Após `* 0x846ca68b` | Saída |
|---|---|---|---|---|---|
| `0x00000001` | `0x00000001` | `0x7feb352d` | `0x7febcafb` | `0x6889f849` | `0x688990c0` |
| `0x00000002` | `0x00000002` | `0xffd66a5a` | `0xffd795f6` | `0xd113f092` | `0xd1132181` |
| `0x00000003` | `0x00000003` | `0x7fc19f87` | `0x7fc16004` | `0x53f1ba2c` | `0x53f1e9dd` |
| `0x00010000` | `0x00010001` | `0xb518352d` | `0xb5195f1d` | `0xdcaf72bf` | `0xdcafae10` |

Vê-se que o primeiro xor-deslocamento não faz nada enquanto a entrada cabe em 16 bits (as três primeiras linhas): ele só serve para entradas grandes. O programa completo, em C (mesmo algoritmo do GLSL):

```c
#include <stdint.h>   /* uint32_t: inteiro sem sinal de exatamente 32 bits */
#include <stdio.h>    /* printf */

uint32_t	hash_u32(uint32_t x)
{
	x ^= x >> 16;       /* traz os 16 bits altos para os 16 bits baixos */
	x *= 0x7feb352du;   /* multiplica, módulo 2^32: propaga para cima */
	x ^= x >> 15;       /* traz de novo o alto para baixo */
	x *= 0x846ca68bu;   /* segunda multiplicação */
	x ^= x >> 16;       /* última mistura */
	return (x);
}

float	para_unitario(uint32_t h)
{
	return ((float)(h >> 8) * (1.0f / 16777216.0f));   /* 24 bits: de 0 até menos de 1 */
}

int	main(void)
{
	long		contagem[16] = {0};
	double		chi2 = 0;
	long		bits = 0;
	long		dobro = 0;
	uint32_t	x;
	int			b;

	for (x = 0; x < 8; x++)                                  /* vizinhos 0 a 7 */
		printf("hash(%u) = 0x%08x -> %.6f\n", x, hash_u32(x), para_unitario(hash_u32(x)));
	for (x = 0; x < 1048576; x++)                            /* 2^20 entradas consecutivas */
		contagem[(int)(para_unitario(hash_u32(x)) * 16.0f)]++;   /* classe de 0 a 15 */
	for (b = 0; b < 16; b++)
		chi2 += (contagem[b] - 65536.0) * (contagem[b] - 65536.0) / 65536.0;
	for (b = 0; b < 16; b++)
		printf("%ld%s", contagem[b], b % 8 == 7 ? "\n" : " ");   /* 8 contadores por linha */
	printf("chi2 = %.2f\n", chi2);
	for (x = 0; x < 100000; x++)                             /* 100 000 entradas de partida */
		for (b = 0; b < 32; b++)                             /* popcount: bits em 1 */
			bits += __builtin_popcount(hash_u32(x) ^ hash_u32(x ^ (1u << b)));
	printf("bits alterados em média: %.3f de 32\n", bits / 3200000.0);
	for (x = 1; x < 65536; x++)                              /* h(2x) próximo de 2 h(x)? */
		dobro += (int32_t)(hash_u32(2 * x) - 2 * hash_u32(x)) >= -4
			&& (int32_t)(hash_u32(2 * x) - 2 * hash_u32(x)) <= 4;
	printf("h(2x) = 2 h(x) com margem de 4: %ld casos em 65535\n", dobro);
	return (0);
}
```

Saída real (compilado com `gcc -Wall -Wextra`):

```text
hash(0) = 0x00000000 -> 0.000000
hash(1) = 0x688990c0 -> 0.408349
hash(2) = 0xd1132181 -> 0.816698
hash(3) = 0x53f1e9dd -> 0.327910
hash(4) = 0xd97e5ed1 -> 0.849584
hash(5) = 0x5c45d53e -> 0.360441
hash(6) = 0xa7e3d3bb -> 0.655820
hash(7) = 0x948ba1e6 -> 0.580256
65646 65825 65785 65592 65704 65720 65498 65527
65228 65225 65119 65486 65316 65493 65566 65846
chi2 = 11.29
bits alterados em média: 15.998 de 32
h(2x) = 2 h(x) com margem de 4: 4079 casos em 65535
```

| Medida | Resultado | Leitura |
|---|---|---|
| Distribuição sobre 1 048 576 entradas consecutivas, 16 classes de 65 536 esperadas | De 65 119 a 65 846 por classe; χ² = 11,29 para 15 graus de liberdade | Compatível com um sorteio uniforme (o valor esperado de um χ² é 15, com um desvio de cerca de 5,5) |
| Avalanche: um bit de entrada invertido, 3 200 000 tentativas | 15,998 bits de saída mudados em média sobre 32 | Quase exatamente a metade, como desejado |
| `hash(0)` | `0x00000000` | A entrada 0 continua 0: multiplicar e deslocar zero dá zero |
| `hash(2)` contra `2 x hash(1)` | 0,816698 contra 2 x 0,408349 = 0,816698 | Para as pequenas entradas, a saída guarda um rastro da entrada |
| `h(2x)` igual a `2 h(x)` com margem de 4 | 4 079 entradas em 65 535 | Cerca de 6 % das pequenas entradas: o hash serve para padrões, não para segurança |

Como fazer o hash de **várias coordenadas** (x, y, z inteiros) com uma função que só recebe uma: encadeia-se, injetando cada coordenada no hash da seguinte. No código do ruído mais abaixo: `hash_u(x ^ hash_u(y ^ hash_u(z)))`.

## O ruído de valor 3D

Chamar `hash_unitario(hash_u(...))` para cada pixel dá **ruído branco** (grão sem nenhuma ligação entre vizinhos): útil para grão de filme, inutilizável para desenhar uma nuvem, um mármore ou riscos deformados. O **ruído de valor** (*value noise*) tira dele um ruído **suave**: coloca-se um hash nos **cantos de uma grade** regular, depois **suaviza-se** entre os cantos.

### A grade e a célula

A grade tem um canto em cada ponto cujas três coordenadas são inteiras. Um ponto `p` cai em uma **célula** (um cubo de lado 1); `floor(p)` (a parte inteira, ex.: `floor(2.3)` vale 2) dá o canto inferior dessa célula, e `fract(p)` (a parte decimal) dá a posição de `p` dentro dela, de 0 a 1 em cada eixo. Visto em 2D (para caber em uma página):

```text
 y
 6 |  c(2,6)------------------c(3,6)
   |    |                       |
   |    |        p = (2.3, 5.7) |   i = floor(p) = (2, 5)
   |    |   fy=0.7  *           |   f = fract(p) = (0.3, 0.7)
   |    |      <-fx=0.3->       |
 5 |  c(2,5)------------------c(3,5)
   |
   +----------------------------------> x
 cada c(i,j): o valor do hash no canto (i, j)
```

Em 3D, a célula tem **8 cantos** (cada canto inteiro mais 0 ou 1 em cada um dos três eixos). Um canto é sempre **o mesmo** para todas as células que o compartilham: não é armazenado, é recalculado pelo hash a cada vez, e dá sempre o mesmo valor.

### A curva de suavização

Entre dois cantos, o valor é uma mistura (`mix`, veja [o reflexo de Fresnel](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#o-reflexo-de-fresnel-quanto-mais-de-vies-se-olha-mais-reflete)): `mix(a, b, t) = a x (1 - t) + b x t`. Com `t` igual diretamente a `fract(p)`, o valor varia em linha reta de um canto a outro, mas a **inclinação** (de quanto o valor sobe por unidade de deslocamento) muda bruscamente ao cruzar uma face da célula, o que deixa aparecer a grade. Substitui-se `t` por `t * t * (3 - 2 * t)`, uma curva de Hermite (uma curva polinomial de terceiro grau): é a fórmula de `smoothstep(0.0, 1.0, t)`, função GLSL que vale 0 abaixo do primeiro limiar, 1 acima do segundo e segue essa curva entre os dois (veja [a ficha de referência](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml), e um exemplo de atenuação em [a edição de malha](/?c=fondamentaux&s=graphisme&p=edition-de-maillage-et-selection-proportionnelle)). Sua inclinação é nula em 0 e em 1: de cada lado de uma face, o valor chega e volta a ficar plano, sem quebra.

| `t` | Mistura em linha reta | Curva suavizada |
|---|---|---|
| 0 | 0,00000 | 0,00000 |
| 0,25 | 0,25000 | 0,15625 |
| 0,5 | 0,50000 | 0,50000 |
| 0,75 | 0,75000 | 0,84375 |
| 1 | 1,00000 | 1,00000 |

### Os 8 cantos e a interpolação trilinear

A mistura se faz eixo por eixo, é a **interpolação trilinear**: 4 misturas ao longo de x (os 8 cantos se reduzem a 4 valores), 2 ao longo de y (4 valores viram 2), 1 ao longo de z.

```text
 8 cantos                 após x            após y        após z
 c000 c100  --mix x-->   x00  \
 c010 c110  --mix x-->   x10  / --mix y--> y0  \
 c001 c101  --mix x-->   x01  \                 --mix z--> ruído
 c011 c111  --mix x-->   x11  / --mix y--> y1  /
```

```glsl
float canto(ivec3 c)             // ivec3: três inteiros; valor do hash no canto c
{
	uvec3 u = uvec3(c);                  // uvec3: três uint; mesmos bits, sem sinal
	return hash_unitario(hash_u(u.x ^ hash_u(u.y ^ hash_u(u.z))));   // cadeia dos 3 eixos
}

float ruido_valor(vec3 p)        // resultado: de 0 a menos de 1, contínuo em p
{
	ivec3 i = ivec3(floor(p));            // canto inferior da célula
	vec3 f = fract(p);                    // posição dentro da célula, de 0 a 1
	vec3 u = f * f * (3.0 - 2.0 * f);     // curva suavizada aplicada aos três eixos
	// 4 misturas em x, uma por par de cantos vizinhos
	float x00 = mix(canto(i), canto(i + ivec3(1, 0, 0)), u.x);
	float x10 = mix(canto(i + ivec3(0, 1, 0)), canto(i + ivec3(1, 1, 0)), u.x);
	float x01 = mix(canto(i + ivec3(0, 0, 1)), canto(i + ivec3(1, 0, 1)), u.x);
	float x11 = mix(canto(i + ivec3(0, 1, 1)), canto(i + ivec3(1, 1, 1)), u.x);
	return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);   // 2 misturas em y, 1 em z
}
```

O ponto `p = (2.3, 5.7, 1.1)` dá `i = (2, 5, 1)`, `f = (0,3 ; 0,7 ; 0,1)` e, depois da curva, `u = (0,216 ; 0,784 ; 0,028)` (por exemplo `0,3 x 0,3 x (3 - 0,6) = 0,216`). Os oito valores dos cantos, produzidos pelo programa C abaixo, depois as misturas:

| Canto | Valor |
|---|---|
| (2, 5, 1) | 0,482036 |
| (3, 5, 1) | 0,212697 |
| (2, 6, 1) | 0,329994 |
| (3, 6, 1) | 0,220200 |
| (2, 5, 2) | 0,533925 |
| (3, 5, 2) | 0,170217 |
| (2, 6, 2) | 0,700765 |
| (3, 6, 2) | 0,960027 |

| Etapa | Cálculo | Valor |
|---|---|---|
| `x00` | mistura dos cantos (2,5,1) e (3,5,1), peso 0,216 | 0,423859 |
| `x10` | cantos (2,6,1) e (3,6,1) | 0,306279 |
| `x01` | cantos (2,5,2) e (3,5,2) | 0,455364 |
| `x11` | cantos (2,6,2) e (3,6,2) | 0,756766 |
| `y0` | mistura de `x00` e `x10`, peso 0,784 | 0,331676 |
| `y1` | mistura de `x01` e `x11`, peso 0,784 | 0,691663 |
| ruído | mistura de `y0` e `y1`, peso 0,028 | 0,341756 |

As misturas intermediárias foram recalculadas à mão a partir dos oito cantos (o programa C não as exibe); o resultado final concorda com o do programa.

```c
#include <math.h>     /* floorf, fabsf, sqrt */
#include <stdint.h>   /* uint32_t */
#include <stdio.h>    /* printf */

uint32_t	hash_u32(uint32_t x)           /* o hash inteiro da seção anterior */
{
	x ^= x >> 16;
	x *= 0x7feb352du;
	x ^= x >> 15;
	x *= 0x846ca68bu;
	x ^= x >> 16;
	return (x);
}

float	canto(int x, int y, int z)             /* valor do canto, de 0 até menos de 1 */
{
	uint32_t	h = hash_u32((uint32_t)x ^ hash_u32((uint32_t)y ^ hash_u32((uint32_t)z)));

	return ((float)(h >> 8) * (1.0f / 16777216.0f));
}

float	misturar(float a, float b, float t)    /* a para t = 0, b para t = 1 */
{
	return (a * (1.0f - t) + b * t);
}

float	curva(float t, int smooth)             /* smooth = 1: suavizada; 0: reta */
{
	return (smooth ? t * t * (3.0f - 2.0f * t) : t);
}

float	ruido(float px, float py, float pz, int smooth)
{
	int		ix = (int)floorf(px);          /* canto inferior da célula */
	int		iy = (int)floorf(py);
	int		iz = (int)floorf(pz);
	float	fx = curva(px - floorf(px), smooth);   /* posição na célula, suavizada */
	float	fy = curva(py - floorf(py), smooth);
	float	fz = curva(pz - floorf(pz), smooth);
	float	x00 = misturar(canto(ix, iy, iz), canto(ix + 1, iy, iz), fx);
	float	x10 = misturar(canto(ix, iy + 1, iz), canto(ix + 1, iy + 1, iz), fx);
	float	x01 = misturar(canto(ix, iy, iz + 1), canto(ix + 1, iy, iz + 1), fx);
	float	x11 = misturar(canto(ix, iy + 1, iz + 1), canto(ix + 1, iy + 1, iz + 1), fx);

	return (misturar(misturar(x00, x10, fy), misturar(x01, x11, fy), fz));   /* y, depois z */
}

float	maior_salto(int smooth)               /* maior salto entre dois pontos vizinhos */
{
	float	salto = 0;
	float	x;
	int		s;

	for (s = 1; s <= 200; s++)             /* x de 0,900 a 1,100, passo de 0,001 */
	{
		x = 0.9f + 0.001f * s;
		salto = fmaxf(salto, fabsf(ruido(x, 0.3f, 0.6f, smooth)
					- ruido(x - 0.001f, 0.3f, 0.6f, smooth)));
	}
	return (salto);
}

float	inclinacao(float x0, float x1, int smooth)   /* entre x0 e x1, y e z fixos */
{
	float	d = ruido(x1, 0.3f, 0.6f, smooth) - ruido(x0, 0.3f, 0.6f, smooth);

	return (d / (x1 - x0));
}

void	estatisticas(void)                     /* média e desvio-padrão de 10^6 pontos */
{
	uint32_t	r = 1;
	double		soma[2] = {0, 0};
	double		sq[2] = {0, 0};
	float		p[3];
	float		v[2];
	int			i;
	int			k;

	for (i = 0; i < 1000000; i++)
	{
		for (k = 0; k < 3; k++)            /* três coordenadas em [0, 64[ */
		{
			r = hash_u32(r + 1);
			p[k] = (float)(r >> 8) * (64.0f / 16777216.0f);
		}
		v[0] = ruido(p[0], p[1], p[2], 1);
		v[1] = canto((int)p[0], (int)p[1], (int)p[2]);   /* o hash sozinho */
		for (k = 0; k < 2; k++)
		{
			soma[k] += v[k];
			sq[k] += (double)v[k] * v[k];
		}
	}
	for (k = 0; k < 2; k++)
		printf("%s : média %.4f, desvio-padrão %.4f\n", k ? "hash " : "ruído",
			soma[k] / 1e6,
			sqrt(sq[k] / 1e6 - soma[k] / 1e6 * soma[k] / 1e6));
}

int	main(void)
{
	int	s;

	for (s = 0; s < 8; s++)                      /* os 8 cantos da célula (2, 5, 1) */
		printf("canto (%d,%d,%d) = %.6f\n", 2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2),
			canto(2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2)));
	printf("ruido(2.3, 5.7, 1.1) = %.6f\n", ruido(2.3f, 5.7f, 1.1f, 1));
	for (s = 0; s < 4; s++)                      /* pontos inteiros: ruído = canto */
		printf("ruido(%d,2,3) = %.6f, canto = %.6f\n", s, ruido(s, 2, 3, 1), canto(s, 2, 3));
	printf("maior salto entre vizinhos: suavizada %.6f, reta %.6f\n", maior_salto(1),
		maior_salto(0));
	printf("inclinação antes de x = 1: suavizada %.5f, reta %.5f\n",
		inclinacao(0.99f, 1.0f, 1), inclinacao(0.99f, 1.0f, 0));
	printf("inclinação depois de x = 1: suavizada %.5f, reta %.5f\n",
		inclinacao(1.0f, 1.01f, 1), inclinacao(1.0f, 1.01f, 0));
	estatisticas();
	return (0);
}
```

Saída real (compilado com `gcc -Wall -Wextra -O1 -ffp-contract=off`):

```text
canto (2,5,1) = 0.482036
canto (3,5,1) = 0.212697
canto (2,6,1) = 0.329994
canto (3,6,1) = 0.220200
canto (2,5,2) = 0.533925
canto (3,5,2) = 0.170217
canto (2,6,2) = 0.700765
canto (3,6,2) = 0.960027
ruido(2.3, 5.7, 1.1) = 0.341756
ruido(0,2,3) = 0.164228, canto = 0.164228
ruido(1,2,3) = 0.675743, canto = 0.675743
ruido(2,2,3) = 0.459813, canto = 0.459813
ruido(3,2,3) = 0.143211, canto = 0.143211
maior salto entre vizinhos: suavizada 0.000312, reta 0.000575
inclinação antes de x = 1: suavizada 0.01732, reta 0.57474
inclinação depois de x = 1: suavizada 0.00376, reta 0.13027
ruído : média 0.4997, desvio-padrão 0.1849
hash  : média 0.4997, desvio-padrão 0.2891
```

| Medida | Curva suavizada | Reta (sem suavização) |
|---|---|---|
| Maior diferença entre dois pontos distantes de 0,001, x de 0,9 a 1,1 | 0,000312 | 0,000575 |
| Inclinação logo antes da face x = 1 (passo de 0,01) | 0,01732 | 0,57474 |
| Inclinação logo depois da face x = 1 | 0,00376 | 0,13027 |

Com a reta, a inclinação passa de 0,57 para 0,13 ao cruzar a face: uma quina, portanto uma aresta visível no padrão. Com a curva, as duas inclinações ficam próximas de 0 (resta o efeito do passo de medição de 0,01): a transição é invisível. Nos pontos inteiros, o ruído vale exatamente o hash do canto (as quatro linhas `ruido(s,2,3)`). E o ruído é **contínuo**: dois pontos distantes de 0,001 têm valores vizinhos, enquanto dois hashes sucessivos saltam (de 0,000000 a 0,408349 entre as entradas 0 e 1 da saída do hash inteiro).

Outra medida, sobre 1 000 000 de pontos distribuídos em um cubo de lado 64: o ruído vale 0,4997 em média com um desvio-padrão (que mede o quanto os valores se afastam da média) de 0,1849, enquanto o hash sozinho tem a mesma média (0,4997) mas um desvio-padrão de 0,2891. O ruído é portanto **menos contrastado** que seu hash: cada valor é uma média de oito cantos, então se afasta menos de 0,5. Para obter um contraste pleno, estica-se o resultado em torno de 0,5 (por exemplo `0.5 + (n - 0.5) * 1.5`, o fator 1,5 a ajustar a olho), limitando com `clamp` (`clamp(x, 0.0, 1.0)` traz `x` para o intervalo de 0 a 1).

### Listras deformadas e oitavas

Um uso direto: deformar uma função regular. Aqui, listras cuja posição é perturbada pelo ruído:

```glsl
float listras(vec3 p)
{
	float ondulacao = ruido_valor(p * 2.0);             // ruído lento: célula de 0,5
	float s = sin(p.x * 16.0 + ondulacao * 2.0);        // listras deslocadas pelo ruído
	return smoothstep(-0.7, -0.3, s);                   // 0 abaixo de -0,7, 1 acima de -0,3
}
```

Uma única camada de ruído dá manchas do tamanho de uma célula. Para um aspecto natural (nuvens, relevo), soma-se várias **oitavas**: a mesma função em uma frequência dobrada (detalhes duas vezes mais finos) e uma amplitude dividida por dois (detalhes menos visíveis). Essa soma chama-se ruído **fractal** (*fBm*).

```glsl
float fbm(vec3 p)                // soma de 4 oitavas de ruído de valor
{
	float soma = 0.0;            // total acumulado
	float ampl = 0.5;            // amplitude da primeira oitava
	for (int k = 0; k < 4; k++)
	{
		soma += ampl * ruido_valor(p);   // acrescenta uma camada
		p *= 2.0;                        // frequência dobrada: detalhes 2x mais finos
		ampl *= 0.5;                     // amplitude dividida por dois
	}
	return soma;                 // no máximo 0,5 + 0,25 + 0,125 + 0,0625 = 0,9375
}
```

## Escolher seu hash

| | `fract(sin(dot(...)))` | Hash inteiro (xor-deslocamentos e multiplicações) |
|---|---|---|
| Cálculo | Em `float`, muito sensível aos arredondamentos | Em inteiros, exato módulo 2³² |
| Mesmo resultado de uma placa para outra | Não garantido (depende de `sin`) | Sim, se a placa suportar `uint` |
| Entradas de grande tamanho | As pequenas mudanças se absorvem | Os 32 bits da entrada contam todos |
| Disponibilidade | Em toda parte | `uint` e operadores binários: GLSL 1.30 e posteriores, então `#version 330` serve |
| Legibilidade | Uma linha | Cinco linhas, constantes opacas |
| Quando usar | Protótipo rápido, entradas pequenas e resultado que pode variar | Todo padrão que deve ser **reproduzível** |

## As armadilhas

| Armadilha | Por que é um problema | Solução |
|---|---|---|
| Uma entrada inteira de fragmento sem `flat` | Uma média de inteiros não é um inteiro: o shader é recusado | `flat` nos dois lados (saída e entrada), com o mesmo nome |
| Um índice `flat` usado fora da tabela | `paleta[v_material]` com um índice grande demais: resultado indefinido, sem mensagem | Verificar o índice no lado C, ou limitá-lo com `clamp` |
| Atributo inteiro declarado com `glVertexAttribPointer` | A placa converte o inteiro em flutuante | `glVertexAttribIPointer` |
| Um vértice compartilhado por faces que querem valores diferentes | O vértice provocador carrega só um valor: uma face recebe o de outra | Duplicar os vértices, ou passar por um geometry shader |
| Supor que `flat` pega o primeiro vértice | O ajuste padrão é o último | `glProvokingVertex` se quisermos o outro, e defini-lo uma vez para todo o programa |
| `fract(sin(...))` com entradas grandes | As pequenas mudanças de entrada se absorvem: zonas de valor constante (0,1680 sete vezes seguidas para x = 1 000 000) | Manter as entradas pequenas (subtrair uma origem), ou usar o hash inteiro |
| `fract(sin(...))` e reprodutibilidade | O mesmo código pode dar outros valores em outra placa | Hash inteiro para tudo que deve se reencontrar |
| Hash inteiro: a entrada 0 dá 0 | `hash(0)` vale `0x00000000` | Somar uma constante à semente ou à coordenada antes de fazer o hash |
| Dividir um `uint` por `4294967295.0` | `(float)0xffffffff` vale 4294967296: obtém-se 1,0 | Manter 24 bits: `float(h >> 8) * (1.0 / 16777216.0)` |
| Coordenadas negativas convertidas em `uint` | Em C, o resultado é o mesmo padrão de 32 bits (módulo 2³²); em GLSL, verificar a conversão `int` para `uint` na especificação da sua versão | Deslocar as coordenadas para que fiquem positivas, ou testar no alvo |
| Ruído de valor sem suavização | A inclinação muda a cada face de célula: a grade aparece | Aplicar `t * t * (3.0 - 2.0 * t)` antes das misturas |
| Achar que o ruído é tão contrastado quanto o hash | Desvio-padrão de 0,1849 contra 0,2891 | Esticar o resultado em torno de 0,5, depois limitar |
| Um hash inteiro para segurança | Basta a um shader, mas não foi feito para resistir a um atacante (6 % das pequenas entradas verificam `h(2x)` próximo de `2 h(x)`) | Para um segredo, veja [a aleatoriedade e os geradores](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#duas-familias-que-nao-devem-ser-confundidas) |

## Boas práticas

| Boa prática | Por que |
|---|---|
| Escrever `flat` na saída **e** na entrada, com o mesmo nome | Nenhuma ambiguidade sobre a interpolação esperada |
| Reservar `flat` para os dados por triângulo (identificador, material, face) | O resto (cor, textura, normal suavizada) deve continuar interpolado |
| Decidir desde o início a convenção do vértice provocador, e anotá-la | Uma mudança posterior muda o valor de cada face |
| Preferir um hash inteiro a `fract(sin(...))` sempre que o padrão deva ser reproduzível | Os inteiros dão o mesmo resultado em toda parte |
| Reduzir um `uint` a um `float` por 24 bits, nunca por uma divisão por `2³² - 1` | A saída permanece em [0, 1[ e é exata |
| Misturar várias coordenadas encadeando `hash_u(a ^ hash_u(b ^ ...))` | Uma única mistura por coordenada basta, e a ordem dos eixos importa |
| Medir seu hash (distribuição, avalanche) antes de usá-lo | Os três testes dos programas C acima se refazem em poucas linhas |
| Suavizar o ruído de valor com a curva de Hermite | A grade de células desaparece |
| Ajustar o contraste do ruído depois | A média de oito cantos se afasta pouco de 0,5 |
| Começar com uma oitava, adicionar outras só se a renderização exigir | Cada oitava custa oito hashes por pixel |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um fragmento recebe por padrão uma média ponderada (interpolação) dos valores dos três vértices; `flat` elimina a média e dá a todo o triângulo o valor de um único vértice, o vértice provocador (o último por padrão, `GL_LAST_VERTEX_CONVENTION`, modificável por `glProvokingVertex`). Uma entrada de fragmento de tipo inteiro deve ser `flat`. Os usos: identificador de objeto, índice de material, cor ou normal por face. Um shader não tem gerador com estado: usa uma função de hash, determinada pela posição. `fract(sin(dot(...)) * 43758.5453)` é curto, mas depende da precisão do `float` (16 691 valores distintos em 1 048 576 entradas, 998 diferenças de mais de 0,01 contra o mesmo cálculo em `double`, valores constantes longe da origem). O hash inteiro (xor-deslocamento, multiplicação por `0x7feb352d`, xor-deslocamento, multiplicação por `0x846ca68b`, xor-deslocamento) é exato, uniforme (χ² de 11,29 para 15 graus de liberdade) e muda 15,998 bits em 32, em média, quando um bit de entrada muda. O ruído de valor 3D põe um hash nos cantos de uma grade, suaviza com `t * t * (3 - 2 * t)` e combina os 8 cantos por três misturas sucessivas (interpolação trilinear). |
| **Armadilhas a evitar** | Um inteiro de fragmento sem `flat`; um vértice compartilhado que carrega o valor de várias faces; um atributo inteiro sem `glVertexAttribIPointer`; `fract(sin(...))` com entradas grandes ou quando o resultado deve se reencontrar em outra placa; a entrada 0 que dá 0; a divisão por `4294967295.0` que dá 1,0; um ruído sem suavização; um ruído menos contrastado que seu hash. |
| **Boas práticas** | `flat` nos dois lados com o mesmo nome; hash inteiro para todo padrão reproduzível; 24 bits para passar de um `uint` a um `float`; curva de Hermite antes das misturas; medir a distribuição e a avalanche de um hash; adicionar oitavas só se necessário. |
