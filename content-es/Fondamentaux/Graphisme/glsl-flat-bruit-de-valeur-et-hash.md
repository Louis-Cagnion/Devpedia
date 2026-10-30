---
order: 10
---

# GLSL: el calificador `flat`, el ruido de valor y las funciones hash

Un [shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#los-shaders-los-programas-de-la-tarjeta-grafica) es un pequeño programa escrito en GLSL que se ejecuta en la tarjeta gráfica. Este capítulo trata dos herramientas que aparecen en casi todos los shaders algo avanzados. La primera es una palabra clave, `flat`, que decide cómo viaja un valor de una etapa del shader a la siguiente: sin ella, la tarjeta lo **mezcla** entre los tres vértices de un triángulo, lo que no tiene sentido para un número de material. La segunda es una forma de fabricar «azar» sin generador: el **ruido de valor**, basado en una **función hash**. Todas las cifras de las tablas provienen de programas C escritos para este capítulo y ejecutados (el mismo algoritmo que el GLSL, salvo el redondeo); los bloques GLSL, en cambio, no se han compilado aquí.

El capítulo supone conocidas [las etapas de un shader y sus entradas/salidas `in`/`out`](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#los-shaders-los-programas-de-la-tarjeta-grafica) (un **vértice** es un punto de la malla, un **fragmento** es un píxel candidato de la pantalla), [los números de coma flotante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), [los operadores binarios de C](/?c=langages&s=c&p=operateurs-binaires) (`^`, `>>`, `<<`) y [el producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## Lo que recibe un fragmento: una media de los tres vértices

Un triángulo se dibuja a partir de sus tres vértices, y cada uno puede llevar valores (un color, una coordenada de textura, una normal). Pero la pantalla está hecha de píxeles, mucho más numerosos: para cada fragmento cubierto por el triángulo, la tarjeta gráfica debe **inventar** un valor. Calcula una media ponderada de los tres valores, con **pesos baricéntricos**: tres números positivos cuya suma vale 1, que indican cuán cerca está el fragmento de cada vértice. Es la **interpolación** (el cálculo de un valor intermedio a partir de valores conocidos en puntos vecinos).

```text
              B  (valor 5)
             /\
            /  \
           /    \         P: un fragmento, con los pesos wA, wB, wC
          /   P  \        (wA + wB + wC = 1; cuanto más cerca está P
         /        \        de un vértice, mayor es su peso)
        A----------C
 (valor 2)      (valor 9)

 valor en P = wA x 2 + wB x 5 + wC x 9
```

Es exactamente lo que se quiere para un color o una coordenada de textura: un degradado continuo. Para un **identificador** (un número de material, un número de objeto), es una catástrofe. Los valores 2, 5 y 9 del esquema, interpolados en cuatro puntos de un triángulo (resultado del programa C de la sección sobre el vértice provocador):

| Pesos (wA, wB, wC) | Valor interpolado | Lo que se quería |
|---|---|---|
| 0,33; 0,33; 0,33 | 5,3333 | Un número entero |
| 0,60; 0,30; 0,10 | 3,6000 | Un número entero |
| 0,10; 0,10; 0,80 | 7,9000 | Un número entero |
| 0,05; 0,90; 0,05 | 5,0500 | Un número entero |

Ninguno de estos números es un material elegido por un vértice, y redondear no ayuda: 3,6 pasa a 4 y 7,9 pasa a 8, números que nadie ha proporcionado. GLSL ofrece tres comportamientos, elegidos con un **calificador** (una palabra colocada delante de la declaración de una variable):

| Calificador | Valor recibido por el fragmento | Uso típico |
|---|---|---|
| `smooth` (por defecto) | Media ponderada, corregida por la perspectiva (la corrección mantiene un motivo recto en una superficie vista de lado) | Color, coordenada de textura, normal suavizada |
| `noperspective` | Media ponderada, sin esa corrección: lineal en pantalla | Efectos dibujados directamente en el espacio de la pantalla |
| `flat` | **Ninguna media**: el valor de un solo vértice, el mismo en todo el triángulo | Identificador, índice de material, color o normal por cara |

Los tres están descritos por la [página Type Qualifier de la documentación Khronos](https://www.khronos.org/opengl/wiki/Type_Qualifier_(GLSL)).

## `flat`: un valor por triángulo, sin media

Se escribe `flat` delante de la salida del vertex shader **y** delante de la entrada del fragment shader que lleva el mismo nombre. Ejemplo: un entero por vértice elige un color en una pequeña paleta.

```glsl
// ----- vertex shader -----
#version 330 core                        // versión 3.30 de GLSL, perfil moderno (core)
layout(location = 0) in vec3 posicion;   // posición del vértice; 0: número del atributo
layout(location = 1) in int material;    // un entero por vértice; atributo número 1
uniform mat4 matriz_mvp;                 // fijado por el programa C; mat4: matriz 4x4
flat out int v_material;                 // salida «flat»: nunca se promedia

void main()
{
	gl_Position = matriz_mvp * vec4(posicion, 1.0);   // posición del vértice en pantalla
	v_material = material;                            // el entero se copia tal cual
}
```

```glsl
// ----- fragment shader -----
#version 330 core
flat in int v_material;        // mismo nombre, mismo calificador que la salida de arriba
uniform vec3 paleta[4];        // cuatro colores, fijados por el programa C
out vec4 color;                // color final del fragmento

void main()
{
	color = vec4(paleta[v_material], 1.0);   // el entero elige el color
}
```

Del lado del programa C, un atributo entero se declara con `glVertexAttribIPointer` (la **I** significa «integer»: sin ella, la tarjeta convertiría el entero en flotante), documentado con [`glVertexAttribPointer`](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glVertexAttribPointer.xhtml).

```c
/* atributo 1: 1 componente de tipo GL_INT; paso (stride): bytes de un vértice al siguiente;
   offset: posición del entero dentro de un vértice */
glVertexAttribIPointer(1, 1, GL_INT, stride, (void *)offset);
glEnableVertexAttribArray(1);                    /* activa el atributo 1 */
```

Una regla del lenguaje se suma: una entrada de fragment shader de **tipo entero** (`int`, `uint`, `ivec3`...) debe ser obligatoriamente `flat`. La razón es lógica: una media de enteros no es un entero. Sin `flat`, el shader se rechaza en la compilación o en el enlazado (regla de la página Khronos citada más arriba; no probada aquí por falta de controlador). Un flotante también puede ser `flat`.

| Caso de uso | Lo que lleva la variable `flat` | Por qué no un valor interpolado |
|---|---|---|
| Identificador de objeto | Un número escrito en una imagen aparte para el [picking](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#el-picking-con-el-raton-encontrar-que-objeto-3d-se-ha-pulsado) | Un número mezclado designa otro objeto |
| Índice de material | Un entero que indexa una paleta o un array de texturas | Un índice medio no existe |
| Color por cara | Un color por triángulo, para un renderizado en facetas | El degradado borraría las aristas |
| Normal por cara | El vector perpendicular al triángulo, calculado por el [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#ejemplo-una-normal-plana-por-triangulo-calculada-en-el-geometry-shader) | Los tres vértices llevan el mismo valor: `flat` lo dice explícitamente y evita un cálculo de media inútil |

## Qué vértice proporciona el valor: el vértice provocador

Si `flat` suprime la media, queda una pregunta: los tres vértices llevan tres valores posibles, ¿cuál recibe el fragmento? OpenGL elige **uno solo**, el **vértice provocador** (*provoking vertex*: el vértice que «provoca» el valor de todo el triángulo). Por defecto es el **último** vértice del triángulo (`GL_LAST_VERTEX_CONVENTION`); `glProvokingVertex` permite elegir el primero (`GL_FIRST_VERTEX_CONVENTION`), véase la [documentación Khronos de glProvokingVertex](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glProvokingVertex.xhtml).

```c
glProvokingVertex(GL_FIRST_VERTEX_CONVENTION);   /* el 1er vértice da el valor flat */
glProvokingVertex(GL_LAST_VERTEX_CONVENTION);    /* vuelta al ajuste por defecto */
```

Para una lista de triángulos (`GL_TRIANGLES`), «último» quiere decir el tercer índice de cada triángulo. Si existe un geometry shader, la regla se aplica a los vértices **emitidos** por él, no a los de la malla. La convención no se ha verificado aquí en una tarjeta gráfica: el programa C siguiente aplica la regla «último índice» a un cubo indexado de 8 vértices y 12 triángulos, y a la interpolación del valor 2, 5, 9 del esquema anterior.

```c
#include <stdio.h>   /* printf */

int	main(void)
{
	float	valores[3] = {2.0f, 5.0f, 9.0f};                    /* valor de A, B, C */
	float	w[4][3] = {{1 / 3.0f, 1 / 3.0f, 1 / 3.0f}, {0.6f, 0.3f, 0.1f},
		{0.1f, 0.1f, 0.8f}, {0.05f, 0.9f, 0.05f}};          /* cuatro fragmentos */
	int		cubo[12][3] = {{0,1,2}, {0,2,3}, {1,5,6}, {1,6,2}, {5,4,7}, {5,7,6},
		{4,0,3}, {4,3,7}, {3,2,6}, {3,6,7}, {4,5,1}, {4,1,0}};   /* índices */
	int		usos[8] = {0};                                  /* triángulos por vértice */
	int		k;

	for (k = 0; k < 4; k++)                                 /* media frente a flat */
		printf("peso %.2f %.2f %.2f : media %.4f, flat último 9, flat primero 2\n",
			w[k][0], w[k][1], w[k][2],
			w[k][0] * valores[0] + w[k][1] * valores[1] + w[k][2] * valores[2]);
	for (k = 0; k < 12; k++)
		usos[cubo[k][2]]++;                                 /* cuenta el último índice */
	for (k = 0; k < 8; k++)
		printf("vértice %d aporta el valor de %d triángulo(s)\n", k, usos[k]);
	return (0);
}
```

```text
peso 0.33 0.33 0.33 : media 5.3333, flat último 9, flat primero 2
peso 0.60 0.30 0.10 : media 3.6000, flat último 9, flat primero 2
peso 0.10 0.10 0.80 : media 7.9000, flat último 9, flat primero 2
peso 0.05 0.90 0.05 : media 5.0500, flat último 9, flat primero 2
vértice 0 aporta el valor de 1 triángulo(s)
vértice 1 aporta el valor de 1 triángulo(s)
vértice 2 aporta el valor de 2 triángulo(s)
vértice 3 aporta el valor de 2 triángulo(s)
vértice 4 aporta el valor de 0 triángulo(s)
vértice 5 aporta el valor de 0 triángulo(s)
vértice 6 aporta el valor de 3 triángulo(s)
vértice 7 aporta el valor de 3 triángulo(s)
```

| Vértice del cubo | Triángulos cuyo último índice es él | Consecuencia |
|---|---|---|
| 0 y 1 | 1 cada uno | Sin conflicto |
| 2 y 3 | 2 cada uno | Con este orden de índices, los dos triángulos vienen de caras diferentes (por ejemplo la delantera y la derecha para el vértice 2): conflicto |
| 4 y 5 | 0 | Nunca proporcionan valor: lo que llevan lo ignora `flat` |
| 6 y 7 | 3 cada uno | Tres caras diferentes reclaman cada una su valor: conflicto |

Los dos últimos casos son la trampa principal: un vértice **compartido** por varios triángulos (justo el interés de un [búfer de índices](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#los-buferes-vbo-ebo-y-vao)) solo lleva **un** valor, pero varias caras querrían el suyo. Tres remedios:

| Remedio | Principio | Coste |
|---|---|---|
| Duplicar los vértices | Cada cara tiene sus propios vértices (24 para un cubo en lugar de 8), luego su propio valor | Más memoria, más vértices que procesar |
| Calcular el valor en un geometry shader | Recibe los tres vértices y emite el mismo valor tres veces: ningún vértice puede entrar en conflicto | Una etapa más (opcional) |
| Leer una tabla con `gl_PrimitiveID` | Variable predefinida del fragment shader que da el número del triángulo; se lee su dato en una tabla | Un acceso a memoria por fragmento |

## Lo que hace un hash en un shader

Para ruido, grano, motivos aleatorios, hace falta un número que «parezca» azar. Un generador clásico (véase [el azar y los generadores](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs) o [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#un-ruido-reproducible-xorshift)) guarda un **estado**: cada tirada modifica el estado, y la siguiente depende de él. En un shader es imposible: los fragmentos se calculan en paralelo, en un orden cualquiera, sin memoria común. Se usa entonces una **función hash** (*hash*): una función que recibe un valor (aquí una posición) y devuelve un número que parece aleatorio, pero que está **totalmente determinado** por la entrada. No hay que confundirla con el hash de una [tabla de dispersión](/?c=langages&s=c&p=tables-de-hachage), que responde a otra necesidad.

| | Generador con estado (`rand`, xorshift) | Hash sin estado |
|---|---|---|
| Entrada | Ninguna: se pide «el siguiente» | Una posición (o un número) |
| Memoria entre dos llamadas | Sí, el estado | No |
| Misma posición, dos llamadas | Dos valores distintos | **El mismo valor** |
| Orden de las llamadas | Cuenta | Sin importancia |
| Sirve para un shader | No | Sí |

Un buen hash de shader debe tener tres cualidades: ser **determinista** (misma entrada, misma salida, de una imagen a otra, si no el motivo parpadea), ser **uniforme** (todos los valores de 0 a 1 salen con la misma frecuencia) y tener un **efecto de avalancha** (cambiar un solo bit de la entrada cambia cerca de la mitad de los bits de la salida, así que dos posiciones vecinas dan valores sin relación).

## Primer hash: `fract(sin(dot(...)))`

```glsl
float hash31(vec3 p)   // p: un punto del espacio; resultado: de 0 a menos de 1
{
	float d = dot(p, vec3(12.9898, 78.233, 37.719));   // dot: x*12.99 + y*78.23 + z*37.72
	d = sin(d) * 43758.5453;     // sin: de -1 a 1; el factor grande extiende las cifras
	return fract(d);             // fract: la parte decimal sola (3,7 da 0,7)
}
```

El razonamiento: `dot` reduce el punto a **un solo número** (tres coordenadas vecinas dan un número vecino); `sin` es una función que oscila rápido cuando su argumento crece, así que dos argumentos cercanos dan senos distintos; multiplicar por 43 758,5453 amplifica esas diferencias hasta las cifras decimales; `fract` solo conserva esas cifras, que ya nada relaciona con la entrada. Las constantes (12,9898; 78,233; 37,719; 43 758,5453) se han vuelto habituales por costumbre: ninguna regla matemática las impone.

Es corto y práctico, pero todo depende de la precisión de un `float` de 32 bits. El programa C siguiente ejecuta la misma fórmula en `float` y luego en `double` (64 bits).

```c
#include <math.h>     /* sinf, sin, floorf, floor */
#include <stdio.h>    /* printf */
#include <stdlib.h>   /* qsort */

float	hash_flot(float x, float y, float z)   /* fract(sin(dot(p, k)) * 43758.5453) */
{
	float	d = x * 12.9898f + y * 78.233f + z * 37.719f;   /* dot(p, k), en float 32 bits */
	float	v = sinf(d) * 43758.5453f;                      /* sin, luego la amplificación */

	return (v - floorf(v));                                 /* fract: la parte decimal */
}

double	hash_doble(double x, double y, double z)   /* misma fórmula, en double */
{
	double	v = sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;

	return (v - floor(v));
}

int	cmp_flotante(const void *a, const void *b)
{
	float	x = *(const float *)a;
	float	y = *(const float *)b;

	return ((x > y) - (x < y));
}

int	contar_distintos(float *v, int n)                  /* cuántos valores distintos */
{
	int	i;
	int	cuenta = 1;

	qsort(v, n, sizeof(float), cmp_flotante);
	for (i = 1; i < n; i++)
		if (v[i] != v[i - 1])
			cuenta++;
	return (cuenta);
}

int	main(void)
{
	static float	v[1048576];   /* static: fuera de la pila, demasiado pequeña */
	int				i;
	int				malos = 0;
	int				j;

	for (i = 0; i < 8; i++)
		printf("h(%d,0,0) = %.6f\n", i, hash_flot((float)i, 0, 0));
	for (i = 0; i < 1048576; i++)
		v[i] = hash_flot((float)i, 0, 0);
	printf("float de 32 bits: %d valores distintos\n", contar_distintos(v, 1048576));
	for (i = 0; i < 1048576; i++)
		v[i] = (float)hash_doble(i, 0, 0);
	printf("double: %d valores distintos\n", contar_distintos(v, 1048576));
	for (i = 0; i < 1024; i++)                        /* float contra double, x de 0 a 1023 */
		if (fabs(hash_flot((float)i, 0, 0) - hash_doble(i, 0, 0)) > 0.01)
			malos++;
	printf("diferencia de más de 0,01 entre ambos: %d casos de 1024\n", malos);
	for (i = 0; i < 2; i++)                           /* x = 0, luego x = 1 000 000 */
	{
		printf("x = %d, y de 0 a 0,007 : ", i * 1000000);
		for (j = 0; j < 8; j++)
			printf("%.4f ", hash_flot((float)i * 1000000.0f, 0.001f * j, 0));
		printf("\n");
	}
	return (0);
}
```

Salida real (compilado con `gcc -Wall -Wextra -O1 -ffp-contract=off -lm`; la última opción prohíbe al compilador fusionar una multiplicación y una suma en una sola operación, lo que cambiaría los redondeos):

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
double: 1027137 valores distintos
diferencia de más de 0,01 entre ambos: 998 casos de 1024
x = 0, y de 0 a 0,007 : 0.0000 0.8716 0.8232 0.0615 0.0508 0.6348 0.1562 0.5957 
x = 1000000, y de 0 a 0,007 : 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1299 
```

| Constatación | Medida | Explicación |
|---|---|---|
| Muy pocos valores distintos | 16 691 valores distintos sobre 1 048 576 entradas en `float`, frente a 1 027 137 en `double` | El producto `sin(d) * 43758.5453` alcanza varias decenas de miles: un `float` tiene 24 bits significativos, y solo le quedan unos pocos para los decimales (un paso de 1/256 por encima de 32 768, más fino por debajo). Las salidas del programa son todas múltiplos de 1/4096 (0,941406 = 3856/4096) |
| Resultado distinto según la precisión | Diferencia de más de 0,01 entre `float` y `double` para 998 entradas de 1 024 | El error de redondeo del `float` sobre `d` se multiplica por el factor grande: el «azar» depende de la precisión del cálculo |
| Los pequeños cambios desaparecen lejos del origen | Con x = 1 000 000, variar y de 0,001 en 0,001 da 0,1680 siete veces seguidas | `d` vale entonces unos 13 millones, y un `float` se redondea allí a la unidad: el término `y * 78.233` queda **absorbido** (véase [la absorción](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorcion-y-cancelacion-cuando-un-calculo-pierde-sus-cifras) y [los flotantes lejos del origen](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine)) |
| Una entrada nula da una salida nula | h(0,0,0) = 0,000000 | `sin(0)` vale 0: el punto 0 no parece azar |

Los resultados se acercan a la uniformidad (χ² de 21,36 para 15 grados de libertad sobre 1 048 576 entradas, valor corriente para un sorteo uniforme; la prueba se explica en [Comparar dos ajustes](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages#comprobar-un-sorteo-uniforme-la-prueba-del), medida hecha con un programa auxiliar), pero el defecto mayor está en otra parte: el valor depende de la implementación de `sin`. La diferencia `float`/`double` anterior se midió en el procesador; que dos tarjetas gráficas distintas den `sin` distintos para argumentos grandes no se pudo medir aquí (una sola máquina), pero la fórmula queda expuesta por construcción: un motivo calculado con este hash puede cambiar de aspecto de una tarjeta a otra, o de un controlador a otro.

## Segundo hash: un entero sin estado

La solución consiste en no usar ya flotantes para mezclar: se trabaja con **enteros sin signo** de 32 bits (`uint` en GLSL, `uint32_t` en C), cuyas operaciones son exactas e idénticas en todas partes. Un `uint` nunca supera `2³² - 1`: más allá, el resultado se calcula **módulo 2³²** (se conserva el resto de la división por 2³², así que los bits de más se pierden). Dos operaciones se repiten:

| Operación | Efecto | Por qué es útil |
|---|---|---|
| `x ^= x >> 16` (xor-desplazamiento) | Desplaza `x` 16 posiciones a la derecha (los bits de peso alto, a la izquierda, bajan a los bits de peso bajo), luego combina con `^`, la «o exclusiva»: un bit vale 1 si los dos bits combinados difieren (véase [los operadores binarios](/?c=langages&s=c&p=operateurs-binaires#los-seis-operadores)) | Una multiplicación propaga los bits solo hacia **arriba**: el xor-desplazamiento lleva la información de arriba hacia abajo |
| `x *= constante impar` | Multiplica, módulo 2³² | Cada bit de entrada se extiende a todos los bits superiores; una constante impar no pierde ninguna información (la multiplicación sigue siendo reversible) |

```glsl
uint hash_ent(uint x)            // uint: entero sin signo de 32 bits, cálculo módulo 2^32
{
	x ^= x >> 16;                // xor-desplazamiento: mezcla lo alto y lo bajo
	x *= 0x7feb352du;            // multiplica; 0x: escritura en base 16, u: sin signo
	x ^= x >> 15;                // segundo xor-desplazamiento
	x *= 0x846ca68bu;            // segunda multiplicación
	x ^= x >> 16;                // último mezclado
	return x;
}

float hash_unidad(uint h)        // convierte un uint en un número de 0 a menos de 1
{
	return float(h >> 8) * (1.0 / 16777216.0);   // 24 bits: exactos en float
}
```

¿Por qué `h >> 8`? Un `float` solo representa exactamente 24 bits de entero (véase [la codificación de los flotantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#como-se-codifica-un-flotante)). Escribir `float(h) / 4294967295.0` redondea: `(float)0xffffffff` vale 4294967296,0 y el cociente vale entonces exactamente 1,0, un valor que el ruido nunca debe producir (medido con un programa auxiliar). Conservando 24 bits, el valor máximo es 0,99999994.

Los cinco pasos, seguidos sobre algunas entradas (valores en hexadecimal, producidos por un programa auxiliar):

| Entrada | Tras el 1.er xor-desplazamiento | Tras `* 0x7feb352d` | Tras el xor-desplazamiento 15 | Tras `* 0x846ca68b` | Salida |
|---|---|---|---|---|---|
| `0x00000001` | `0x00000001` | `0x7feb352d` | `0x7febcafb` | `0x6889f849` | `0x688990c0` |
| `0x00000002` | `0x00000002` | `0xffd66a5a` | `0xffd795f6` | `0xd113f092` | `0xd1132181` |
| `0x00000003` | `0x00000003` | `0x7fc19f87` | `0x7fc16004` | `0x53f1ba2c` | `0x53f1e9dd` |
| `0x00010000` | `0x00010001` | `0xb518352d` | `0xb5195f1d` | `0xdcaf72bf` | `0xdcafae10` |

Se ve que el primer xor-desplazamiento no hace nada mientras la entrada cabe en 16 bits (las tres primeras filas): solo sirve para entradas grandes. El programa completo, en C (mismo algoritmo que el GLSL):

```c
#include <stdint.h>   /* uint32_t: entero sin signo de exactamente 32 bits */
#include <stdio.h>    /* printf */

uint32_t	hash_ent32(uint32_t x)
{
	x ^= x >> 16;       /* lleva los 16 bits altos a los 16 bits bajos */
	x *= 0x7feb352du;   /* multiplica, módulo 2^32: propaga hacia arriba */
	x ^= x >> 15;       /* vuelve a llevar lo alto hacia abajo */
	x *= 0x846ca68bu;   /* segunda multiplicación */
	x ^= x >> 16;       /* último mezclado */
	return (x);
}

float	a_unidad(uint32_t h)
{
	return ((float)(h >> 8) * (1.0f / 16777216.0f));   /* 24 bits: de 0 a menos de 1 */
}

int	main(void)
{
	long		cuenta[16] = {0};
	double		ji2 = 0;
	long		bits_cambiados = 0;
	long		doble = 0;
	uint32_t	x;
	int			b;

	for (x = 0; x < 8; x++)                                  /* vecinos 0 a 7 */
		printf("hash(%u) = 0x%08x -> %.6f\n", x, hash_ent32(x), a_unidad(hash_ent32(x)));
	for (x = 0; x < 1048576; x++)                            /* 2^20 entradas consecutivas */
		cuenta[(int)(a_unidad(hash_ent32(x)) * 16.0f)]++;    /* clase de 0 a 15 */
	for (b = 0; b < 16; b++)
		ji2 += (cuenta[b] - 65536.0) * (cuenta[b] - 65536.0) / 65536.0;
	for (b = 0; b < 16; b++)
		printf("%ld%s", cuenta[b], b % 8 == 7 ? "\n" : " ");     /* 8 contadores por línea */
	printf("ji2 = %.2f\n", ji2);
	for (x = 0; x < 100000; x++)                             /* 100 000 entradas de partida */
		for (b = 0; b < 32; b++)                             /* popcount: bits a 1 */
			bits_cambiados += __builtin_popcount(hash_ent32(x) ^ hash_ent32(x ^ (1u << b)));
	printf("bits cambiados de media: %.3f sobre 32\n", bits_cambiados / 3200000.0);
	for (x = 1; x < 65536; x++)                              /* ¿h(2x) cerca de 2 h(x)? */
		doble += (int32_t)(hash_ent32(2 * x) - 2 * hash_ent32(x)) >= -4
			&& (int32_t)(hash_ent32(2 * x) - 2 * hash_ent32(x)) <= 4;
	printf("h(2x) = 2 h(x) con margen de 4: %ld casos de 65535\n", doble);
	return (0);
}
```

Salida real (compilado con `gcc -Wall -Wextra -O1 -ffp-contract=off -lm`):

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
ji2 = 11.29
bits cambiados de media: 15.998 sobre 32
h(2x) = 2 h(x) con margen de 4: 4079 casos de 65535
```

| Medida | Resultado | Lectura |
|---|---|---|
| Distribución sobre 1 048 576 entradas consecutivas, 16 clases de 65 536 esperadas | De 65 119 a 65 846 por clase; χ² = 11,29 para 15 grados de libertad | Compatible con un sorteo uniforme (el valor esperado de un χ² es 15, con una desviación de unos 5,5) |
| Avalancha: un bit de entrada invertido, 3 200 000 ensayos | 15,998 bits de salida cambian de media sobre 32 | Casi exactamente la mitad, como se quería |
| `hash(0)` | `0x00000000` | La entrada 0 queda en 0: multiplicar y desplazar cero da cero |
| `hash(2)` frente a `2 x hash(1)` | 0,816698 frente a 2 x 0,408349 = 0,816698 | Para entradas pequeñas, la salida conserva una huella de la entrada |
| `h(2x)` igual a `2 h(x)` con margen de 4 | 4 079 entradas de 65 535 | Alrededor del 6 % de las entradas pequeñas: el hash sirve para motivos, no para seguridad |

Cómo hashear **varias coordenadas** (x, y, z enteros) con una función que solo toma una: se encadena, inyectando cada coordenada en el hash de la siguiente. En el código del ruido más abajo: `hash_ent(x ^ hash_ent(y ^ hash_ent(z)))`.

## El ruido de valor 3D

Llamar a `hash_unidad(hash_ent(...))` para cada píxel da **ruido blanco** (grano sin ningún vínculo entre vecinos): útil para grano de película, inutilizable para dibujar una nube, un mármol o rayas deformadas. El **ruido de valor** (*value noise*) saca de ahí un ruido **suave**: se pone un hash en las **esquinas de una cuadrícula** regular, y luego se **suaviza** entre esas esquinas.

### La cuadrícula y la celda

La cuadrícula tiene una esquina en cada punto cuyas tres coordenadas son enteras. Un punto `p` cae en una **celda** (un cubo de lado 1); `floor(p)` (la parte entera, por ejemplo `floor(2.3)` vale 2) da la esquina inferior de esa celda, y `fract(p)` (la parte decimal) da la posición de `p` dentro de ella, de 0 a 1 en cada eje. Visto en 2D (para caber en una página):

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
 cada c(i,j): el valor del hash en la esquina (i, j)
```

En 3D, la celda tiene **8 esquinas** (cada esquina entera más 0 o 1 en cada uno de los tres ejes). Una esquina es siempre **la misma** para todas las celdas que la comparten: no se almacena, se recalcula con el hash cada vez, y da el mismo valor.

### La curva de suavizado

Entre dos esquinas, el valor es una mezcla (`mix`, véase [el reflejo de Fresnel](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#el-reflejo-de-fresnel-cuanto-mas-de-refilon-se-mira-mas-refleja)): `mix(a, b, t) = a x (1 - t) + b x t`. Con `t` igual directamente a `fract(p)`, el valor varía en línea recta de una esquina a la otra, pero la **pendiente** (cuánto sube el valor por unidad de desplazamiento) cambia bruscamente al cruzar una cara de celda, y eso deja aparecer la cuadrícula. Se sustituye `t` por `t * t * (3 - 2 * t)`, una curva de Hermite (una curva polinómica de tercer grado): es la fórmula de `smoothstep(0.0, 1.0, t)`, función GLSL que vale 0 por debajo del primer umbral, 1 por encima del segundo y sigue esta curva entre ambos (véase [la ficha de referencia](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml), y un ejemplo de atenuación en [la edición de malla](/?c=fondamentaux&s=graphisme&p=edition-de-maillage-et-selection-proportionnelle)). Su pendiente es nula en 0 y en 1: a ambos lados de una cara, el valor llega y se aleja de forma plana, sin quiebro.

| `t` | Mezcla en línea recta | Curva suavizada |
|---|---|---|
| 0 | 0,00000 | 0,00000 |
| 0,25 | 0,25000 | 0,15625 |
| 0,5 | 0,50000 | 0,50000 |
| 0,75 | 0,75000 | 0,84375 |
| 1 | 1,00000 | 1,00000 |

### Las 8 esquinas y la interpolación trilineal

La mezcla se hace eje por eje: es la **interpolación trilineal**. Son 4 mezclas a lo largo de x (las 8 esquinas se reducen a 4 valores), 2 a lo largo de y (4 valores pasan a 2) y 1 a lo largo de z.

```text
 8 esquinas              tras x             tras y         tras z
 c000 c100  --mix x-->   x00  \
 c010 c110  --mix x-->   x10  / --mix y--> y0  \
 c001 c101  --mix x-->   x01  \                 --mix z--> ruido
 c011 c111  --mix x-->   x11  / --mix y--> y1  /
```

```glsl
float esquina(ivec3 c)           // ivec3: tres enteros; valor del hash en la esquina c
{
	uvec3 u = uvec3(c);                  // uvec3: tres uint; mismos bits, sin signo
	// cadena de los 3 ejes
	return hash_unidad(hash_ent(u.x ^ hash_ent(u.y ^ hash_ent(u.z))));
}

float ruido_valor(vec3 p)        // resultado: de 0 a menos de 1, continuo en p
{
	ivec3 i = ivec3(floor(p));            // esquina inferior de la celda
	vec3 f = fract(p);                    // posición dentro de la celda, de 0 a 1
	vec3 u = f * f * (3.0 - 2.0 * f);     // curva suavizada aplicada a los tres ejes
	// 4 mezclas en x, una por pareja de esquinas vecinas
	float x00 = mix(esquina(i), esquina(i + ivec3(1, 0, 0)), u.x);
	float x10 = mix(esquina(i + ivec3(0, 1, 0)), esquina(i + ivec3(1, 1, 0)), u.x);
	float x01 = mix(esquina(i + ivec3(0, 0, 1)), esquina(i + ivec3(1, 0, 1)), u.x);
	float x11 = mix(esquina(i + ivec3(0, 1, 1)), esquina(i + ivec3(1, 1, 1)), u.x);
	return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);   // 2 mezclas en y, 1 en z
}
```

El punto `p = (2.3, 5.7, 1.1)` da `i = (2, 5, 1)`, `f = (0,3; 0,7; 0,1)` y, tras la curva, `u = (0,216; 0,784; 0,028)` (por ejemplo `0,3 x 0,3 x (3 - 0,6) = 0,216`). Los ocho valores de esquina, producidos por el programa C de más abajo, y luego las mezclas:

| Esquina | Valor |
|---|---|
| (2, 5, 1) | 0,482036 |
| (3, 5, 1) | 0,212697 |
| (2, 6, 1) | 0,329994 |
| (3, 6, 1) | 0,220200 |
| (2, 5, 2) | 0,533925 |
| (3, 5, 2) | 0,170217 |
| (2, 6, 2) | 0,700765 |
| (3, 6, 2) | 0,960027 |

| Paso | Cálculo | Valor |
|---|---|---|
| `x00` | mezcla de las esquinas (2,5,1) y (3,5,1), peso 0,216 | 0,423859 |
| `x10` | esquinas (2,6,1) y (3,6,1) | 0,306279 |
| `x01` | esquinas (2,5,2) y (3,5,2) | 0,455364 |
| `x11` | esquinas (2,6,2) y (3,6,2) | 0,756766 |
| `y0` | mezcla de `x00` y `x10`, peso 0,784 | 0,331676 |
| `y1` | mezcla de `x01` y `x11`, peso 0,784 | 0,691663 |
| ruido | mezcla de `y0` e `y1`, peso 0,028 | 0,341756 |

Las mezclas intermedias se recalcularon a mano a partir de las ocho esquinas (el programa C no las muestra); el resultado final coincide con el del programa.

```c
#include <math.h>     /* floorf, fabsf, sqrt */
#include <stdint.h>   /* uint32_t */
#include <stdio.h>    /* printf */

uint32_t	hash_ent32(uint32_t x)         /* el hash entero de la sección anterior */
{
	x ^= x >> 16;
	x *= 0x7feb352du;
	x ^= x >> 15;
	x *= 0x846ca68bu;
	x ^= x >> 16;
	return (x);
}

float	esquina(int x, int y, int z)           /* valor de la esquina, de 0 a menos de 1 */
{
	uint32_t	h = hash_ent32((uint32_t)x
				^ hash_ent32((uint32_t)y ^ hash_ent32((uint32_t)z)));

	return ((float)(h >> 8) * (1.0f / 16777216.0f));
}

float	mezcla(float a, float b, float t)      /* a para t = 0, b para t = 1 */
{
	return (a * (1.0f - t) + b * t);
}

float	curva(float t, int smooth)             /* smooth = 1: suavizada; 0: recta */
{
	return (smooth ? t * t * (3.0f - 2.0f * t) : t);
}

float	ruido(float px, float py, float pz, int smooth)
{
	int		ix = (int)floorf(px);          /* esquina inferior de la celda */
	int		iy = (int)floorf(py);
	int		iz = (int)floorf(pz);
	float	fx = curva(px - floorf(px), smooth);   /* posición en la celda, suavizada */
	float	fy = curva(py - floorf(py), smooth);
	float	fz = curva(pz - floorf(pz), smooth);
	float	x00 = mezcla(esquina(ix, iy, iz), esquina(ix + 1, iy, iz), fx);
	float	x10 = mezcla(esquina(ix, iy + 1, iz), esquina(ix + 1, iy + 1, iz), fx);
	float	x01 = mezcla(esquina(ix, iy, iz + 1), esquina(ix + 1, iy, iz + 1), fx);
	float	x11 = mezcla(esquina(ix, iy + 1, iz + 1), esquina(ix + 1, iy + 1, iz + 1), fx);

	return (mezcla(mezcla(x00, x10, fy), mezcla(x01, x11, fy), fz));   /* y luego z */
}

float	max_salto(int smooth)                 /* mayor salto entre dos puntos vecinos */
{
	float	salto = 0;
	float	x;
	int		s;

	for (s = 1; s <= 200; s++)             /* x de 0,900 a 1,100, paso de 0,001 */
	{
		x = 0.9f + 0.001f * s;
		salto = fmaxf(salto, fabsf(ruido(x, 0.3f, 0.6f, smooth)
					- ruido(x - 0.001f, 0.3f, 0.6f, smooth)));
	}
	return (salto);
}

float	pendiente(float x0, float x1, int smooth)  /* pendiente entre x0 y x1, y y z fijos */
{
	float	d = ruido(x1, 0.3f, 0.6f, smooth) - ruido(x0, 0.3f, 0.6f, smooth);

	return (d / (x1 - x0));
}

void	estadisticas(void)                     /* media, desviación típica: 10^6 puntos */
{
	uint32_t	r = 1;
	double		suma[2] = {0, 0};
	double		cuad[2] = {0, 0};
	float		p[3];
	float		v[2];
	int			i;
	int			k;

	for (i = 0; i < 1000000; i++)
	{
		for (k = 0; k < 3; k++)            /* tres coordenadas en [0, 64[ */
		{
			r = hash_ent32(r + 1);
			p[k] = (float)(r >> 8) * (64.0f / 16777216.0f);
		}
		v[0] = ruido(p[0], p[1], p[2], 1);
		v[1] = esquina((int)p[0], (int)p[1], (int)p[2]);   /* el hash solo */
		for (k = 0; k < 2; k++)
		{
			suma[k] += v[k];
			cuad[k] += (double)v[k] * v[k];
		}
	}
	for (k = 0; k < 2; k++)
		printf("%s: media %.4f, desviación típica %.4f\n",
			k ? "hash" : "ruido", suma[k] / 1e6,
			sqrt(cuad[k] / 1e6 - suma[k] / 1e6 * suma[k] / 1e6));
}

int	main(void)
{
	int	s;

	for (s = 0; s < 8; s++)                      /* las 8 esquinas de la celda (2, 5, 1) */
		printf("esquina (%d,%d,%d) = %.6f\n", 2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2),
			esquina(2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2)));
	printf("ruido(2.3, 5.7, 1.1) = %.6f\n", ruido(2.3f, 5.7f, 1.1f, 1));
	for (s = 0; s < 4; s++)                      /* puntos enteros: ruido = esquina */
		printf("ruido(%d,2,3) = %.6f, esquina = %.6f\n", s, ruido(s, 2, 3, 1),
			esquina(s, 2, 3));
	printf("diferencia máxima entre vecinos: suavizada %.6f, recta %.6f\n",
		max_salto(1), max_salto(0));
	printf("pendiente antes de x = 1: suavizada %.5f, recta %.5f\n",
		pendiente(0.99f, 1.0f, 1), pendiente(0.99f, 1.0f, 0));
	printf("pendiente después de x = 1: suavizada %.5f, recta %.5f\n",
		pendiente(1.0f, 1.01f, 1), pendiente(1.0f, 1.01f, 0));
	estadisticas();
	return (0);
}
```

Salida real (compilado con `gcc -Wall -Wextra -O1 -ffp-contract=off -lm`):

```text
esquina (2,5,1) = 0.482036
esquina (3,5,1) = 0.212697
esquina (2,6,1) = 0.329994
esquina (3,6,1) = 0.220200
esquina (2,5,2) = 0.533925
esquina (3,5,2) = 0.170217
esquina (2,6,2) = 0.700765
esquina (3,6,2) = 0.960027
ruido(2.3, 5.7, 1.1) = 0.341756
ruido(0,2,3) = 0.164228, esquina = 0.164228
ruido(1,2,3) = 0.675743, esquina = 0.675743
ruido(2,2,3) = 0.459813, esquina = 0.459813
ruido(3,2,3) = 0.143211, esquina = 0.143211
diferencia máxima entre vecinos: suavizada 0.000312, recta 0.000575
pendiente antes de x = 1: suavizada 0.01732, recta 0.57474
pendiente después de x = 1: suavizada 0.00376, recta 0.13027
ruido: media 0.4997, desviación típica 0.1849
hash: media 0.4997, desviación típica 0.2891
```

| Medida | Curva suavizada | Recta (sin suavizado) |
|---|---|---|
| Mayor diferencia entre dos puntos separados 0,001, x de 0,9 a 1,1 | 0,000312 | 0,000575 |
| Pendiente justo antes de la cara x = 1 (paso de 0,01) | 0,01732 | 0,57474 |
| Pendiente justo después de la cara x = 1 | 0,00376 | 0,13027 |

Con la recta, la pendiente pasa de 0,57 a 0,13 al cruzar la cara: un codo, y por tanto una arista visible en el motivo. Con la curva, las dos pendientes están cerca de 0 (queda el efecto del paso de medida de 0,01): la transición es invisible. En los puntos enteros, el ruido vale exactamente el hash de la esquina (las cuatro líneas `ruido(s,2,3)`). Y el ruido es **continuo**: dos puntos separados 0,001 tienen valores vecinos, mientras que dos hash sucesivos saltan (de 0,000000 a 0,408349 entre las entradas 0 y 1 de la salida del hash entero).

Otra medida, sobre 1 000 000 de puntos repartidos en un cubo de lado 64: el ruido vale 0,4997 de media con una desviación típica (que mide cuánto se apartan los valores de la media) de 0,1849, mientras que el hash solo tiene la misma media (0,4997) pero una desviación de 0,2891. El ruido es, pues, **menos contrastado** que su hash: cada valor es una media de ocho esquinas, así que se aparta menos de 0,5. Para obtener un contraste pleno, se estira el resultado alrededor de 0,5 (por ejemplo `0.5 + (n - 0.5) * 1.5`, factor 1,5 que se ajusta a ojo) y se acota con `clamp` (`clamp(x, 0.0, 1.0)` lleva `x` al intervalo de 0 a 1).

### Rayas deformadas y octavas

Un uso directo: deformar una función regular. Aquí, rayas cuya posición se perturba con el ruido:

```glsl
float rayas(vec3 p)
{
	float ondulacion = ruido_valor(p * 2.0);            // ruido lento: celda de 0,5
	float s = sin(p.x * 16.0 + ondulacion * 2.0);       // rayas desplazadas por el ruido
	return smoothstep(-0.7, -0.3, s);                   // 0 hasta -0,7; 1 desde -0,3
}
```

Una sola capa de ruido da manchas del tamaño de una celda. Para un aspecto natural (nubes, relieve), se suman varias **octavas**: la misma función a una frecuencia doble (detalles dos veces más finos) y una amplitud dividida por dos (detalles menos visibles). Esa suma se llama ruido **fractal** (*fBm*).

```glsl
float fbm(vec3 p)                // suma de 4 octavas de ruido de valor
{
	float suma = 0.0;            // total acumulado
	float ampl = 0.5;            // amplitud de la primera octava
	for (int k = 0; k < 4; k++)
	{
		suma += ampl * ruido_valor(p);   // añade una capa
		p *= 2.0;                        // frecuencia doble: detalles dos veces más finos
		ampl *= 0.5;                     // amplitud dividida por dos
	}
	return suma;                 // como máximo 0,5 + 0,25 + 0,125 + 0,0625 = 0,9375
}
```

## Elegir su hash

| | `fract(sin(dot(...)))` | Hash entero (xor-desplazamientos y multiplicaciones) |
|---|---|---|
| Cálculo | En `float`, muy sensible a los redondeos | En enteros, exacto módulo 2³² |
| Mismo resultado de una tarjeta a otra | No garantizado (depende de `sin`) | Sí, si la tarjeta gestiona los `uint` |
| Entradas de gran tamaño | Los pequeños cambios se absorben | Los 32 bits de la entrada cuentan todos |
| Disponibilidad | En todas partes | `uint` y operadores binarios: GLSL 1.30 y siguientes, así que `#version 330` sirve |
| Legibilidad | Una línea | Cinco líneas, constantes opacas |
| Cuándo usarlo | Prototipo rápido, entradas pequeñas y resultado que puede variar | Todo motivo que deba ser **reproducible** |

## Las trampas

| Trampa | Por qué es un problema | Remedio |
|---|---|---|
| Una entrada entera de fragmento sin `flat` | Una media de enteros no es un entero: rechazo del shader | `flat` en ambos lados (salida y entrada), con el mismo nombre |
| Un índice `flat` usado fuera de la tabla | `paleta[v_material]` con un índice demasiado grande: resultado indefinido, sin mensaje | Controlar el índice en el lado C, o acotarlo con `clamp` |
| Atributo entero declarado con `glVertexAttribPointer` | La tarjeta convierte el entero en flotante | `glVertexAttribIPointer` |
| Un vértice compartido por caras que quieren valores distintos | El vértice provocador solo lleva un valor: una cara recibe el de otra | Duplicar los vértices, o pasar por un geometry shader |
| Suponer que `flat` toma el primer vértice | El ajuste por defecto es el último | `glProvokingVertex` si se quiere el otro, fijado una vez para todo el programa |
| `fract(sin(...))` con entradas grandes | Los pequeños cambios de entrada se absorben: zonas de valor constante (0,1680 siete veces seguidas para x = 1 000 000) | Mantener las entradas pequeñas (restar un origen), o usar el hash entero |
| `fract(sin(...))` y reproducibilidad | El mismo código puede dar otros valores en otra tarjeta | Hash entero para todo lo que deba volver a encontrarse |
| Hash entero: la entrada 0 da 0 | `hash(0)` vale `0x00000000` | Sumar una constante a la semilla o a la coordenada antes de hashear |
| Dividir un `uint` por `4294967295.0` | `(float)0xffffffff` vale 4294967296: se obtiene 1,0 | Conservar 24 bits: `float(h >> 8) * (1.0 / 16777216.0)` |
| Coordenadas negativas convertidas en `uint` | En C, el resultado es el mismo patrón de 32 bits (módulo 2³²); en GLSL, comprobar la conversión de `int` a `uint` en la especificación de su versión | Desplazar las coordenadas para que queden positivas, o probar en el destino |
| Ruido de valor sin suavizado | La pendiente cambia en cada cara de celda: la cuadrícula se ve | Aplicar `t * t * (3.0 - 2.0 * t)` antes de las mezclas |
| Creer el ruido tan contrastado como el hash | Desviación típica de 0,1849 frente a 0,2891 | Estirar el resultado alrededor de 0,5, y luego acotar |
| Un hash entero para la seguridad | Basta a un shader, pero no está hecho para resistir a un atacante (el 6 % de las entradas pequeñas cumplen `h(2x)` cerca de `2 h(x)`) | Para un secreto, véase [el azar y los generadores](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#dos-familias-que-no-confundir) |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Escribir `flat` en la salida **y** en la entrada, con el mismo nombre | Ninguna ambigüedad sobre la interpolación esperada |
| Reservar `flat` a los datos por triángulo (identificador, material, cara) | El resto (color, textura, normal suavizada) debe seguir interpolado |
| Decidir desde el principio la convención del vértice provocador, y anotarla | Un cambio posterior modifica el valor de cada cara |
| Preferir un hash entero a `fract(sin(...))` en cuanto el motivo deba ser reproducible | Los enteros dan el mismo resultado en todas partes |
| Pasar un `uint` a un `float` con 24 bits, nunca dividiendo por `2³² - 1` | La salida se mantiene en [0, 1[ y es exacta |
| Mezclar varias coordenadas encadenando `hash_ent(a ^ hash_ent(b ^ ...))` | Basta una mezcla por coordenada, y el orden de los ejes importa |
| Medir el hash (distribución, avalancha) antes de usarlo | Las tres pruebas de los programas C de arriba se rehacen en pocas líneas |
| Suavizar el ruido de valor con la curva de Hermite | La cuadrícula de celdas desaparece |
| Ajustar el contraste del ruido después | La media de ocho esquinas se aparta poco de 0,5 |
| Empezar con una octava, y añadir más solo si el renderizado lo exige | Cada octava cuesta ocho hash por píxel |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un fragmento recibe por defecto una media ponderada (interpolación) de los valores de los tres vértices; `flat` suprime la media y da a todo el triángulo el valor de un solo vértice, el vértice provocador (el último por defecto, `GL_LAST_VERTEX_CONVENTION`, modificable con `glProvokingVertex`). Una entrada de fragmento de tipo entero debe ser `flat`. Los usos: identificador de objeto, índice de material, color o normal por cara. Un shader no tiene generador con estado: usa una función hash, determinada por la posición. `fract(sin(dot(...)) * 43758.5453)` es corto pero depende de la precisión del `float` (16 691 valores distintos sobre 1 048 576 entradas, 998 diferencias de más de 0,01 frente al mismo cálculo en `double`, valores constantes lejos del origen). El hash entero (xor-desplazamiento, multiplicación por `0x7feb352d`, xor-desplazamiento, multiplicación por `0x846ca68b`, xor-desplazamiento) es exacto, uniforme (χ² de 11,29 para 15 grados de libertad) y cambia 15,998 bits sobre 32 de media cuando cambia un bit de entrada. El ruido de valor 3D pone un hash en las esquinas de una cuadrícula, suaviza con `t * t * (3 - 2 * t)` y combina las 8 esquinas mediante tres mezclas sucesivas (interpolación trilineal). |
| **Trampas a evitar** | Un entero de fragmento sin `flat`; un vértice compartido que lleva el valor de varias caras; un atributo entero sin `glVertexAttribIPointer`; `fract(sin(...))` con entradas grandes o cuando el resultado debe volver a encontrarse en otra tarjeta; la entrada 0 que da 0; la división por `4294967295.0` que da 1,0; un ruido sin suavizado; un ruido menos contrastado que su hash. |
| **Buenas prácticas** | `flat` en ambos lados con el mismo nombre; hash entero para todo motivo reproducible; 24 bits para pasar de un `uint` a un `float`; curva de Hermite antes de las mezclas; medir la distribución y la avalancha de un hash; añadir octavas solo si es necesario. |
