---
order: 7
---

# Evitar el recálculo redundante

Un principio más general se esconde detrás de [esperar una condición en lugar de una duración](/?c=performance&p=attentes-et-temps-morts): **nunca recalcular un resultado que nada ha podido cambiar desde su último cálculo**. Mientras que el capítulo anterior trataba sobre la espera (del tiempo que pasa), este trata sobre el cálculo (del procesador y la memoria que trabajan): la misma pereza disciplinada, aplicada a otro tipo de coste.

## Memoizar el resultado de una función

El caso más directo: una función costosa, llamada varias veces con los mismos argumentos, que rehace el mismo trabajo en cada llamada.

```python
def calificacion_crediticia(id_cliente):
    # consulta pesada: agrega el historial, calcula un puntaje
    return calcular_puntaje(recuperar_historial(id_cliente))

# llamada 3 veces para el mismo cliente en el mismo procesamiento
for pedido in pedidos_del_cliente:
    if calificacion_crediticia(id_cliente) < umbral:
        rechazar(pedido)
```

Nada cambia `id_cliente` ni su historial entre estas tres llamadas: la segunda y la tercera recalculan exactamente lo que la primera ya produjo.

```python
_cache_calificaciones = {}

def calificacion_crediticia(id_cliente):
    if id_cliente not in _cache_calificaciones:
        _cache_calificaciones[id_cliente] = calcular_puntaje(recuperar_historial(id_cliente))
    return _cache_calificaciones[id_cliente]
```

La **memoización** guarda en memoria el resultado para una entrada dada y lo reutiliza mientras nada pueda invalidarlo. La condición que la hace correcta no es "es más rápido", es "la entrada no ha cambiado": exactamente el mismo invariante que el del banner de cookies ya tratado en el capítulo anterior, aplicado aquí a un valor en lugar de a un estado de visualización.

> Una memoización sin invalidación es un bug en suspenso: si `id_cliente` puede ver su historial modificado durante el procesamiento (un pago que llega entre dos pedidos), la caché devuelve una respuesta obsoleta. Memoizar es, primero, identificar qué volvería obsoleto el resultado, antes de decidir conservarlo.

## Recalcular solo lo que ha cambiado

El mismo principio se aplica a la escala de un procesamiento entero, no solo de una llamada de función. Si solo una parte de los datos ha cambiado desde el último pase, volver a procesar todo equivale a rehacer todo el trabajo ya validado para modificar solo un fragmento.

```python
# en cada ejecución: se vuelve a procesar las 50 000 líneas del archivo
for linea in todo_el_archivo:
    resultados.append(procesar(linea))
```

```python
# solo se vuelve a procesar lo llegado desde el último pase
ultima_marca_temporal = leer_marca_de_progreso()
lineas_nuevas = [l for l in todo_el_archivo if l.marca_temporal > ultima_marca_temporal]

for linea in lineas_nuevas:
    resultados.append(procesar(linea))

escribir_marca_de_progreso(
    lineas_nuevas[-1].marca_temporal if lineas_nuevas else ultima_marca_temporal,
)
```

El coste del procesamiento se vuelve proporcional a lo que **cambió**, no al tamaño total de los datos: una ganancia que se acentúa a medida que el volumen ya procesado crece frente al volumen realmente nuevo.

## El ejemplo del videojuego 2D: solo redibujar lo que se mueve

Un juego 2D que gestiona él mismo su memoria de visualización (un array de píxeles o de tiles en memoria, sin delegar a un motor de renderizado que ya optimiza esto) ilustra bien el principio a la escala de una imagen completa.

```python
# en cada tick: se redibuja toda la imagen, aunque solo un personaje se haya movido
def dibujar_frame(pantalla, escena):
    for x in range(pantalla.ancho):
        for y in range(pantalla.alto):
            pantalla.definir_pixel(x, y, escena.color_en(x, y))
```

Si un tick solo mueve un personaje unos pocos píxeles, el resto del decorado es idéntico píxel por píxel al frame anterior: recalcularlo no cambia nada el resultado, solo el tiempo empleado en obtenerlo.

```python
# solo se redibujan los rectangulos marcados como "sucios" (modificados desde el último tick)
def dibujar_frame(pantalla, escena, zonas_modificadas):
    for zona in zonas_modificadas:
        for x, y in zona.pixeles():
            pantalla.definir_pixel(x, y, escena.color_en(x, y))
```

Es la lógica del **dirty rectangle** (rectángulo sucio): la escena señala ella misma qué zonas han cambiado desde el último renderizado, y solo esas se redibujan. En un decorado 90 % estático, esto reduce el coste de cada frame a una fracción del de un renderizado completo, para un resultado visualmente idéntico.

## Reparar el resultado anterior en lugar de recalcularlo todo

Un solucionador repite la misma prueba cientos de miles de veces, sobre datos que apenas cambian de una prueba a la siguiente. Ejemplo: la restricción «todas distintas» se comprueba con un [emparejamiento bipartito](/?c=fondamentaux&s=algorithmes&p=couplage-biparti-et-theoreme-de-hall) tras cada retirada de un valor posible. Rehacer el emparejamiento desde cero reempieza todo el trabajo aunque haya desaparecido una sola arista.

La idea es **conservar el emparejamiento anterior** y reparar solo lo que el cambio ha roto:

| La arista retirada | Qué se hace |
|---|---|
| No estaba en el emparejamiento | Nada: el emparejamiento sigue siendo válido |
| Estaba en el emparejamiento | Una sola casilla pierde su valor: una sola búsqueda de camino para recolocarla |

```c
// Retira el valor v de la casilla c y luego repara el emparejamiento en lugar de rehacerlo
int tras_retirada(int c, int v)
{
    dom[c][v] = 0;
    if (dueno[v] == c) {         // la arista retirada servía al emparejamiento
        dueno[v] = -1;
        valor_de[c] = -1;
        memset(vista, 0, sizeof vista);
        buscar(c);               // una sola casilla que recolocar
    }
    for (int k = 0; k < N; k++)  // una casilla sin valor: ya no hay emparejamiento completo
        if (valor_de[k] < 0)
            return 0;
    return 1;
}
```

`valor_de[c]` memoriza el valor de cada casilla (el `buscar()` del capítulo sobre el emparejamiento lo actualiza a la vez que `dueno`). Cuando se vuelve a poner el valor retirado, las casillas que se quedaron sin valor lo intentan de nuevo: sin eso, el emparejamiento conservado se quedaría demasiado pequeño para siempre.

Medido con 200 000 retiradas sucesivas, 40 casillas, 40 valores, aceptando cada casilla el 12 % de los valores:

| | Recalcularlo todo | Reparar |
|---|---|---|
| Casillas examinadas por las búsquedas | 61 566 318 | 832 601 (74 veces menos) |
| Tiempo | alrededor de 1 s | unas decenas de ms |
| Respuestas «¿emparejamiento completo?» | 198 112 sí | 198 112 sí, **idénticas prueba a prueba** (0 diferencias) |

**Misma respuesta, no necesariamente el mismo emparejamiento.** Existen varios emparejamientos completos: el emparejamiento reparado difiere del que da un cálculo completo en 1 972 casos de 1 973 comparados. La respuesta sí/no es la misma; pero si el resto del programa depende del propio emparejamiento (una explicación, un orden, un resultado que debe reproducirse idéntico de una ejecución a otra), se **vuelve al cálculo completo** para producir ese resultado canónico, y se conserva la versión reparada para todas las pruebas que solo necesitan la respuesta. En el solucionador de la investigación rush01, esta combinación redujo el tiempo total un 6,2 %.

> **Trampa:** reparar un estado que ya no es válido. El invariante «el emparejamiento actual es válido para los datos actuales» debe restablecerse tras **cada** tipo de cambio (retirada, reposición, vuelta atrás de una búsqueda): un caso olvidado da una respuesta errónea, sin error.
>
> **Buena práctica:** conservar el cálculo completo como referencia en una prueba y comparar las respuestas prueba a prueba (aquí 0 diferencias sobre 200 000) antes de medir el tiempo.

## Recorrer solo los elementos marcados: el bitmap

Cuando solo ha cambiado una pequeña parte de los elementos y se han marcado (como los «rectángulos sucios» anteriores), recorrer un array de indicadores de un byte por elemento cuesta una lectura por elemento, marcado o no. Un **bitmap** guarda un indicador por bit: una palabra de 64 bits contiene 64 (ver [el filtro por bitmap](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)), y `__builtin_ctzll` da directamente la posición del siguiente bit a 1 ([funciones integradas](/?c=langages&s=c&p=operateurs-binaires)). Las palabras vacías cuestan una sola lectura.

```c
for (uint32_t w = 0; w < N / 64; w++)
    for (uint64_t m = bitmap[w]; m; m &= m - 1)  // bits restantes de la palabra
        procesar(w * 64 + __builtin_ctzll(m));   // índice del bit a 1 más bajo
```

`m &= m - 1` borra el bit a 1 más bajo: el bucle se detiene cuando la palabra queda vacía, y `__builtin_ctzll` nunca se llama con 0 (su resultado sería indefinido).

Medido con 1 M de elementos, 200 recorridos, mediana de 7 rondas alternas, mismas sumas comprobadas (Intel Core Ultra 5 228V bajo WSL, gcc 13.3 en `-O2`):

| Proporción de elementos marcados | Array de bytes | Bitmap | Diferencia |
|---|---|---|---|
| 0,1 % | 84 ms | 2,9 ms | −97 % |
| 1 % | 63 ms | 16 ms | −74 % |
| 10 % | 67 ms | 44 ms | −35 % |
| 50 % | 68 ms | 130 ms | **+91 %** |

La ganancia depende de la **densidad** de las marcas: con la mitad marcada, el bitmap es casi el doble de lento, porque cada marca cuesta más que un byte leído en secuencia. En el solucionador de la investigación rush01, este recorrido solo ganó un 2 % del tiempo total: solo el programa real dice lo que vale la optimización (ver [Medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)).

> **Trampa:** adoptar el bitmap porque es más compacto o más rápido en el caso disperso, sin medir la densidad real de las marcas del programa.
>
> **Buena práctica:** medir la proporción de elementos marcados en el programa real antes de elegir; el bitmap vale para marcas escasas.

## Un ejemplo tomado de un scraper: no confirmar lo que ya está probado

Un scraper de anuncios clasificados comparaba dos anuncios para saber si describían el mismo vehículo (duplicado) o dos vehículos diferentes. La verificación completa abría la página detallada de cada anuncio para comparar una decena de características (kilometraje, opciones, historial de mantenimiento): una llamada de red y un tiempo de renderizado nada desdeñables.

```python
def son_potencialmente_duplicados(anuncio_a, anuncio_b):
    # todo ya esta disponible en las tarjetas de la pagina de resultados
    return (
        anuncio_a.marca == anuncio_b.marca
        and anuncio_a.modelo == anuncio_b.modelo
        and abs(anuncio_a.precio - anuncio_b.precio) < 200
    )

def son_duplicados(anuncio_a, anuncio_b):
    if not son_potencialmente_duplicados(anuncio_a, anuncio_b):
        return False    # ya decidido: marca o modelo diferente, o precio demasiado distinto
    detalle_a = abrir_pagina_anuncio(anuncio_a)
    detalle_b = abrir_pagina_anuncio(anuncio_b)
    return comparar_especificaciones(detalle_a, detalle_b)
```

En cuanto la comparación "ligera" (los campos ya presentes en la tarjeta de resultados) establece que dos anuncios son diferentes, la pregunta ya está **resuelta**: abrir las dos páginas detalladas para confirmarlo solo recalcularía, a precio alto, un resultado que el dato barato ya produjo. La verificación costosa solo se ejecuta en el caso ambiguo, aquel donde el dato ligero no basta para decidir.

> No confundir con una optimización de la **latencia de red**. Aquí, lo que se evita es un trabajo redundante del lado CPU/lógica (recalcular una respuesta ya conocida), no un retraso de E/S. Las pausas voluntarias entre peticiones (límite de tasa, cortesía hacia un servidor remoto) o la espera de una animación de interfaz no forman parte de este principio: siguen siendo necesarias incluso cuando no hay ningún recálculo en juego, y eliminarlas expone a un bloqueo, no a una simple lentitud. Es exactamente la distinción planteada al final de [Esperar sin perder tiempo](/?c=performance&p=attentes-et-temps-morts): un retraso de protección no es un desperdicio a eliminar.

## Reutilizar el resultado anterior: el cálculo incremental con resultado idéntico

[Recalcular solo lo que ha cambiado](#recalcular-solo-lo-que-ha-cambiado) trata de **datos** que llegan en pequeños trozos. El mismo principio se aplica a un **algoritmo** llamado millones de veces sobre una entrada que apenas ha cambiado entre dos llamadas: en vez de partir de cero, parte del **resultado anterior**.

Ejemplo tomado del solucionador de Skyscraper. Su prueba de Hall busca, para una fila casi llena, un [emparejamiento entre las casillas libres y los valores que faltan](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#encontrar-un-emparejamiento-el-camino-aumentante-algoritmo-de-kuhn). Entre dos pruebas de la misma fila solo se han quitado unos pocos valores: casi todas las parejas del emparejamiento anterior siguen siendo válidas. La función siguiente las conserva y solo lanza una búsqueda de camino aumentante para las casillas que se han quedado sin valor. Usa el archivo `emparejamiento.h` del capítulo sobre los [emparejamientos](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin).

```c
#include <stdio.h>
#include <stdlib.h>
#include "emparejamiento.h"

static long busquedas, valores_visitados;       /* contadores de trabajo */

/* Empareja las casillas partiendo de poseedor: las parejas aún válidas se conservan,
   solo las casillas sin valor buscan un camino aumentante. */
static int emparejar_desde(int n, const uint64_t *dominio, int *poseedor, uint64_t *conj_fallo)
{
    uint64_t conservadas = 0;                   /* casillas cuya pareja se conserva */
    uint64_t vistas;

    for (int v = 0; v < 64; v++) {
        int i = poseedor[v];

        if (i >= 0 && (dominio[i] >> v & 1) && !(conservadas >> i & 1))
            conservadas |= 1ull << i;           /* pareja aún válida */
        else
            poseedor[v] = -1;                   /* pareja caducada: el valor queda libre */
    }
    for (int i = 0; i < n; i++) {
        if (conservadas >> i & 1)
            continue;
        vistas = 0;
        busquedas++;
        int ok = ampliar(i, dominio, poseedor, &vistas);

        valores_visitados += __builtin_popcountll(vistas);
        if (!ok) {
            *conj_fallo = vistas;               /* el conjunto de Hall de este fallo */
            return i;
        }
    }
    return -1;
}

int main(void)
{
    enum { N = 32, EPISODES = 2000 };
    long pasos = 0, desacuerdos = 0, trabajo[2][2] = {{0}};
    long conflictos = 0, otra_casilla = 0, otro_conjunto = 0;

    srand(7);
    for (int ep = 0; ep < EPISODES; ep++) {
        uint64_t dom[N];
        int previo[64], nuevo[64];
        uint64_t hall_a, hall_b, ignorado;

        for (int i = 0; i < N; i++) {           /* dominios al azar, 10 % de los valores */
            dom[i] = 1ull << i;                 /* el valor i es posible al principio */
            for (int v = 0; v < N; v++)
                if (rand() % 100 < 10)
                    dom[i] |= 1ull << v;
        }
        for (int v = 0; v < 64; v++)
            previo[v] = -1;
        emparejar_desde(N, dom, previo, &ignorado);  /* emparejamiento de partida */
        for (int paso = 0; paso < 1000; paso++) {  /* una casilla pierde un valor por paso */
            int i = rand() % N, v = rand() % N;
            long r0, w0;
            int a, b;

            if (!(dom[i] >> v & 1) || (dom[i] & (dom[i] - 1)) == 0)
                continue;                       /* valor ausente, o el último de la casilla */
            dom[i] &= ~(1ull << v);
            pasos++;
            for (int k = 0; k < 64; k++)
                nuevo[k] = -1;                  /* A: cálculo completo, sin reutilizar nada */
            r0 = busquedas; w0 = valores_visitados;
            a = emparejar_desde(N, dom, nuevo, &hall_a);
            trabajo[0][0] += busquedas - r0; trabajo[0][1] += valores_visitados - w0;
            r0 = busquedas; w0 = valores_visitados;
            b = emparejar_desde(N, dom, previo, &hall_b);  /* B: se reutiliza el previo */
            trabajo[1][0] += busquedas - r0; trabajo[1][1] += valores_visitados - w0;
            if ((a < 0) != (b < 0))
                desacuerdos++;                  /* se espera el mismo veredicto de ambos */
            if (b >= 0) {                       /* conflicto: el episodio termina */
                conflictos++;
                otra_casilla += a != b;         /* la casilla que queda sin valor difiere */
                otro_conjunto += hall_a != hall_b;
                break;
            }
        }
    }
    printf("%ld retiradas de valor, %ld desacuerdos de veredicto\n", pasos, desacuerdos);
    printf("cálculo completo: %ld búsquedas, %ld valores visitados\n",
           trabajo[0][0], trabajo[0][1]);
    printf("emparejamiento reutilizado: %ld búsquedas, %ld valores visitados\n",
           trabajo[1][0], trabajo[1][1]);
    printf("%ld conflictos: %ld con otra casilla sin valor,\n", conflictos, otra_casilla);
    printf("%ld con otro conjunto de valores alcanzados\n", otro_conjunto);
    return desacuerdos != 0;
}
```

El programa quita valores uno a uno en dominios al azar y, cada vez, rehace el cálculo de dos maneras: **A** desde cero, **B** reutilizando el emparejamiento anterior.

```
49549 retiradas de valor, 0 desacuerdos de veredicto
cálculo completo: 1581056 búsquedas, 9423329 valores visitados
emparejamiento reutilizado: 12710 búsquedas, 207078 valores visitados
2000 conflictos: 1725 con otra casilla sin valor,
0 con otro conjunto de valores alcanzados
```

| Contador (49.549 retiradas de valor) | Cálculo completo (A) | Emparejamiento reutilizado (B) |
|---|---|---|
| Búsquedas de camino aumentante lanzadas | 1.581.056 | 12.710 |
| Valores visitados durante esas búsquedas | 9.423.329 | 207.078 |
| Desacuerdos de veredicto (existe o no un emparejamiento) | 0 | 0 |

La reutilización hace 124 veces menos búsquedas, con exactamente las mismas respuestas. Tres precauciones lo hacen seguro:

| Precaución | Por qué | En el ejemplo |
|---|---|---|
| El punto de partida debe seguir siendo válido | Una pareja caducada falsearía el resultado | Las parejas cuyo valor se quitó se eliminan antes de volver a empezar |
| El veredicto debe ser el mismo desde cualquier punto de partida | Si no, la optimización cambia la respuesta | El algoritmo de Kuhn es exacto desde cualquier emparejamiento válido: 0 desacuerdos en 49.549 casos |
| Lo que depende del punto de partida no debe filtrarse | Una explicación o una salida que cambia modifica el resto del programa | En un conflicto, se vuelve al cálculo completo (véase más abajo) |

El último punto se ve en la última línea de la salida. De los 2.000 conflictos, **1.725** dejan otra casilla sin valor según el punto de partida, aunque el conjunto de valores alcanzados es el mismo en los 2.000. Ahora bien, la [explicación del conflicto](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin#cuando-no-existe-ningun-emparejamiento-el-conjunto-de-hall) se construye a partir de esa casilla y de los poseedores de los valores alcanzados: depende, pues, del emparejamiento de partida. El solucionador rehace entonces el cálculo completo original, **solo cuando hay conflicto**: la explicación es la de la versión sin reutilización, la búsqueda sigue exactamente el mismo camino y los contadores (decisiones, conflictos, propagaciones) permanecen idénticos en las 49 verificaciones del protocolo. Una optimización con búsqueda idéntica se mide limpiamente: solo cambia el tiempo (véase [comparar con contadores de trabajo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-con-contadores-de-trabajo-no-solo-con-el-tiempo)).

> Un contador dividido por 124 no da un programa 124 veces más rápido. La prueba de Hall pesaba un **7,4 %** del tiempo de la búsqueda (perfil con contador de ciclos, cuadrícula de 104 × 104: 4,7 % para construir el grafo, 2,5 % para el emparejamiento): la ganancia máxima posible era, pues, de un 7 % aproximadamente. Medido: **6,2 %** (33,9 s frente a 31,8 s con 96 × 96). Perfilar primero dice hasta dónde merece la pena llegar.

## Repasar solo lo que está marcado: recorrer un bitmap

El [filtro por bitmap](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#filtro-por-bitmap) evita leer un elemento cuando un bit anuncia que no hay nada dentro. El mismo bitmap sirve también para **enumerar** solo los elementos que tienen algo, sin visitar los demás.

Ejemplo tomado del mismo solucionador: en cada limpieza de las cláusulas aprendidas hay que quitar de cada lista de vigilancia las cláusulas eliminadas. El solucionador tiene 13,6 millones de listas (una por literal), casi todas vacías. Un bit por lista indica si puede contener algo. El programa siguiente compara un recorrido de todas las listas con un recorrido de solo los bits a 1: `bits &= bits - 1` borra el bit más bajo de la palabra, `__builtin_ctzll` da la posición del bit que se debe tratar (véase [recorrer los bits a 1](/?c=langages&s=c&p=operateurs-binaires#recorrer-los-bits-a-1-las-funciones-integradas-del-compilador)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 13600000u                 /* número de listas, como los literales del solucionador */

typedef struct {
    int *d;                         /* las entradas de la lista */
    int n, cap;
    char reserva[16];               /* sitio de una segunda lista: 32 bytes por cabecera */
} lista;

static lista *listas;
static uint64_t *marca;             /* bit i: la lista i puede no estar vacía */
static long leidas;                 /* contador de trabajo: cabeceras de lista leídas */

/* Cuenta las entradas «muertas» (impares), que representan cláusulas eliminadas */
static long contar_todo(void)
{
    long muertas = 0;

    for (unsigned i = 0; i < N; i++) {              /* todas las listas, vacías incluidas */
        leidas++;
        for (int k = 0; k < listas[i].n; k++)
            muertas += listas[i].d[k] & 1;
    }
    return muertas;
}

static long contar_marcadas(void)
{
    long muertas = 0;

    for (unsigned palabra = 0; palabra < N / 64 + 1; palabra++)
        for (uint64_t bits = marca[palabra]; bits; bits &= bits - 1) {  /* bits a 1 */
            unsigned i = palabra * 64 + __builtin_ctzll(bits);

            leidas++;
            for (int k = 0; k < listas[i].n; k++)
                muertas += listas[i].d[k] & 1;
        }
    return muertas;
}

static double ahora(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned por_mil = argc > 1 ? (unsigned)atoi(argv[1]) : 90;       /* listas no vacías */
    int *pool = malloc(sizeof(int) * N * 3);
    uint64_t estado = 88172645463325252ull;
    long esperado, hallado = 0, tomadas = 0, olvidadas = 0, leidas_marcadas = 0;
    double mejor[2] = { 1e9, 1e9 };

    listas = calloc(N, sizeof(lista));
    marca = calloc(N / 64 + 1, sizeof(uint64_t));
    if (!pool || !listas || !marca)
        return 1;
    for (unsigned i = 0; i < N; i++) {
        estado ^= estado << 13;                     /* xorshift: un sorteo pseudoaleatorio */
        estado ^= estado >> 7;
        estado ^= estado << 17;
        if (estado % 1000 < por_mil) {              /* lista no vacía, de 1 a 3 entradas */
            listas[i].n = 1 + (int)(estado / 1000 % 3);
            listas[i].d = pool + tomadas;
            for (int k = 0; k < listas[i].n; k++)
                pool[tomadas++] = (int)(estado >> (8 * k + 8));
            marca[i / 64] |= 1ull << (i % 64);      /* invariante: no vacía implica marcada */
        }
    }
    esperado = contar_todo();
    for (int ronda = 0; ronda < 5; ronda++) {       /* 5 rondas alternas, cuenta la mejor */
        double t0 = ahora();
        double duracion;

        hallado = contar_todo();
        duracion = ahora() - t0;
        mejor[0] = duracion < mejor[0] ? duracion : mejor[0];
        t0 = ahora();
        leidas = 0;
        hallado = contar_marcadas();
        duracion = ahora() - t0;
        mejor[1] = duracion < mejor[1] ? duracion : mejor[1];
        leidas_marcadas = leidas;
    }
    printf("%.1f %% de listas no vacías\n", por_mil / 10.0);
    printf("todas las listas:  %5.1f ms, %ld cabeceras leídas\n", mejor[0] * 1e3, (long)N);
    printf("listas marcadas:   %5.1f ms, %ld cabeceras leídas, mismo resultado: %s\n",
           mejor[1] * 1e3, leidas_marcadas, hallado == esperado ? "sí" : "NO");
    for (unsigned i = 0; i < N; i += 1000)          /* error: olvida 1 marca de 1000 */
        if (listas[i].n && (marca[i / 64] >> (i % 64) & 1)) {
            marca[i / 64] &= ~(1ull << (i % 64));
            olvidadas++;
        }
    printf("con %ld marcas olvidadas: %ld entradas muertas en lugar de %ld\n",
           olvidadas, contar_marcadas(), esperado);
    return 0;
}
```

```
1.0 % de listas no vacías
todas las listas:   14.2 ms, 13600000 cabeceras leídas
listas marcadas:     3.8 ms, 135940 cabeceras leídas, mismo resultado: sí
con 129 marcas olvidadas: 135683 entradas muertas en lugar de 135817
```

La misma medición para varias proporciones de listas no vacías (el mejor de 5 rondas alternas, máquina en reposo):

| Listas no vacías | Todas las listas | Listas marcadas | Relación |
|---|---|---|---|
| 0,1 % | 7,6 ms | 0,6 ms | ×13 |
| 1 % | 14,2 ms | 3,8 ms | ×3,7 |
| 9 % | 22,4 ms | 25,1 ms | ×0,9 |
| 30 % | 44,2 ms | 31,4 ms | ×1,4 |

La ganancia no está garantizada: depende de la proporción de elementos que tienen trabajo. Con un 9 %, pasar de una lista marcada a la siguiente es un acceso al azar en una tabla de 435 MB, tan costoso como leer todas las listas de un tirón; una lectura continua se ve favorecida en parte por la precarga del procesador (explicación probable, no aislada aquí). En el solucionador, el bitmap se usa así en dos sitios: la propagación salta las listas vacías (el 91 % de las propagaciones encuentra una: 2,0 s frente a 1,58 s con 48 × 48, mismos contadores), y la purga solo visita las listas marcadas (33,9 s frente a 35,1 s con 96 × 96, un 3,3 % menos, búsqueda idéntica).

> **Trampa:** el bitmap es un **contrato**. Un bit a 0 debe garantizar que el elemento está vacío; un bit a 1 no garantiza nada (se vuelve a poner a 0 más tarde). Olvidar marcar un elemento no produce ningún error: la última línea de la salida muestra que 129 marcas olvidadas hacen perder 134 de las 135.817 entradas muertas, sin ningún mensaje. Conviene verificar toda optimización de este tipo comparando con el recorrido completo en casos pequeños.

## Escritura atómica: nunca una lectura a medio escribir

Una caché memoizada en memoria (sección anterior) desaparece al detenerse el proceso; una **caché de archivo** sobrevive a un reinicio, pero introduce un riesgo nuevo: un lector concurrente puede abrir el archivo de caché **mientras se está escribiendo**.

```python
# Riesgo: un lector concurrente puede leer este archivo a medio escribir
with open("cache.json", "w") as f:
    json.dump(resultado, f)   # si el proceso se interrumpe aquí, el archivo queda corrupto
```

```python
# Escritura atomica: escribir en un archivo temporal, luego renombrarlo
import os

ruta_tmp = "cache.json.tmp"
with open(ruta_tmp, "w") as f:
    json.dump(resultado, f)
os.replace(ruta_tmp, "cache.json")   # rename(): atomico a nivel del sistema de archivos
```

`os.replace()` (como `rename()` en la mayoría de lenguajes) es **atómico** a nivel del sistema de archivos: en todo momento, `cache.json` apunta a la versión antigua completa o a la nueva versión completa, nunca a un estado intermedio. Ningún lector concurrente puede entonces ver jamás un archivo a medio escribir, a diferencia de una escritura directa interrumpida en el camino.

> **Trampa:** escribir directamente en el archivo de caché final, asumiendo que una interrupción (caída, corte) es lo bastante rara como para ignorarla. Un archivo de caché corrupto puede luego hacer fallar a todos los lectores siguientes, mucho después del incidente inicial.
>
> **Buena práctica:** escribir siempre en un archivo temporal y luego renombrarlo al nombre final, para cualquier archivo leído por otro proceso mientras pueda ser reescrito.

## Stale-while-revalidate: responder de inmediato, recalcular por detrás

La memoización vista arriba tiene un defecto a gran escala: si la caché está vacía u obsoleta, la solicitud que dispara el recálculo **espera** ese recálculo antes de responder. El patrón **stale-while-revalidate** (tomado del encabezado HTTP [`Cache-Control: stale-while-revalidate`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)) cambia esta regla: responder **inmediatamente** con el valor en caché, aunque esté obsoleto, y solo recalcular en segundo plano.

```text
Cache clasica (bloqueante):         Stale-while-revalidate:

solicitud -> cache obsoleta?        solicitud -> cache obsoleta?
              |  si                                |  si
              v                                    v
        recalcula (espera)                  responde con el valor obsoleto
              |                              Y dispara un recalculo en segundo plano
              v                                    |
          responde                           (la proxima llamada recibe el
                                              valor fresco)
```

```python
bloqueo_recalculo = threading.Lock()

def valor_con_cache(clave):
    entrada = cache.get(clave)
    if entrada is None:
        # la primera llamada: no hay otra opción que esperar
        return recalcular_y_guardar(clave)

    if entrada.esta_obsoleta() and bloqueo_recalculo.acquire(blocking=False):
        threading.Thread(target=lambda: recalcular_y_guardar(clave, bloqueo_recalculo)).start()

    return entrada.valor   # responde inmediatamente, obsoleto o no
```

El bloqueo anti-concurrencia (`bloqueo_recalculo`) evita que un recálculo costoso se relance N veces en paralelo mientras ya está en curso para la misma clave: solo el primer hilo en adquirirlo dispara realmente el recálculo, los demás siguen sirviendo el valor obsoleto mientras tanto.

> **Trampa:** aplicar stale-while-revalidate sin bloqueo anti-concurrencia, en una clave sometida a muchas solicitudes simultáneas: cada solicitud que detecta la caché obsoleta relanza su propio recálculo costoso, lo que puede anular todo el beneficio (o incluso agravar la carga frente a una caché bloqueante clásica).
>
> **Buena práctica:** nunca dejar que una caché obsoleta haga esperar al usuario para un simple refresco; reservar la espera solo para la primera llamada, sin ningún valor en caché.

## Streaming HTTP progresivo: cuando el cálculo es inevitable

Todas las técnicas anteriores evitan un recálculo evitable. Esta se aplica al caso contrario: un cálculo realmente **inevitable** (importar un archivo grande, llamar a un servicio externo lento) que ninguna caché puede acortar. La única palanca que queda es cómo percibe el usuario la espera.

Por defecto, un servidor PHP mantiene en memoria todo lo que un script produce con `echo`, y solo lo envía al navegador una vez que el script termina (o su búfer se llena): el usuario ve una página en blanco hasta el final, aunque el script ya haya producido un resultado útil desde hace tiempo.

```php
<?php
ini_set('output_buffering', 'off');   // desactiva el almacenamiento en búfer de la salida
ini_set('implicit_flush', true);      // fuerza el envio inmediato tras cada echo
while (ob_get_level() > 0) {
    ob_end_flush();                   // vacía también cualquier búfer ya abierto por PHP mismo
}

foreach ($filasAImportar as $fila) {
    importarFila($fila);
    echo "Fila importada: {$fila->id}<br>\n";
    flush();                          // envía este echo al navegador de inmediato
}
```

Cada `echo` seguido de `flush()` se envía al navegador de inmediato, sin esperar a que termine el script: el usuario ve una consola que se llena en tiempo real, como los logs de una terminal, en lugar de una página en blanco seguida de un resultado final de una vez.

> **Nota:** este mecanismo es el inverso de [`fastcgi_finish_request()`](/?c=langages&s=php&p=php-fpm): ahí, la conexión se cierra de inmediato y el trabajo sigue oculto por detrás; aquí, la conexión permanece abierta durante todo el cálculo, que es justo lo que permite enviar cada fragmento del resultado a medida que está disponible.

> **Trampa:** este streaming se rompe en cuanto un servidor intermedio (proxy, balanceador de carga, Nginx en modo `fastcgi_buffering`) vuelve a poner su propio búfer: revisar la configuración de toda la cadena de red, no solo la de PHP.

## Resumen comparativo

| Situación | Sin el principio | Con el principio |
|---|---|---|
| Función pura llamada varias veces con la misma entrada | Recalcula en cada llamada | Memoiza el resultado, invalida si la entrada cambia |
| Procesamiento periódico sobre datos en gran parte estables | Vuelve a procesar todo en cada pase | Solo procesa lo que cambió desde la marca de progreso |
| Renderizado de un frame de juego | Redibuja toda la pantalla en cada tick | Solo redibuja las zonas marcadas como modificadas |
| Comparación de dos registros | Abre sistemáticamente el detalle costoso | Se detiene en cuanto un dato ligero ya decidió |
| Cálculo repetido sobre una entrada que cambia poco | Parte de cero en cada llamada | Reutiliza el resultado anterior, con retorno al cálculo completo si el resultado debe seguir siendo idéntico |
| Bucle sobre millones de elementos, casi ninguno con trabajo | Visita todos los elementos | Solo visita los elementos marcados en un bitmap |

En los cuatro primeros casos, la ganancia no viene de un cálculo hecho más rápido, sino de un cálculo **que no tuvo lugar** porque nada podía cambiar su resultado. En los dos últimos, el cálculo sí tiene lugar, pero solo abarca lo que ha cambiado (el resultado anterior reutilizado) o lo que está marcado (el bitmap).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Nunca recalcular un resultado que nada ha podido cambiar desde su último cálculo: memoización, reprocesamiento incremental o dirty rectangle aplican todos la misma idea a escalas diferentes. Una caché de archivo añade dos técnicas: la escritura atómica (nunca una lectura a medio escribir) y el stale-while-revalidate (responder rápido, recalcular por detrás). Cuando el cálculo es inevitable (nada que meter en caché), el streaming HTTP progresivo es la única palanca que queda para mejorar la espera percibida. Dos variantes para los cálculos pesados: reutilizar el resultado anterior (cálculo incremental, con retorno al cálculo completo cuando el resultado debe seguir siendo idéntico) y recorrer solo los elementos marcados en un bitmap. |
| **Herramientas utilizables** | Una caché en memoria por entrada (memoización), una marca de progreso para solo reprocesar lo nuevo, una comparación "ligera" antes de una verificación costosa, `rename()`/`os.replace()` para una escritura atómica, un bloqueo anti-concurrencia para un recálculo en segundo plano, `flush()`/`ob_end_flush()` para un streaming HTTP progresivo. Un contador de trabajo para verificar que dos versiones dan los mismos veredictos, `__builtin_ctzll` para recorrer los bits a 1. |
| **Trampas a evitar** | Memoizar sin identificar qué invalidaría el resultado: una caché nunca invalidada se convierte en una fuente de datos obsoletos. Escribir directamente en un archivo de caché leído por otros procesos. Aplicar stale-while-revalidate sin bloqueo anti-concurrencia. Hacer streaming de una respuesta HTTP sin comprobar que ningún proxy intermedio vuelve a poner su propio búfer. Reutilizar un punto de partida caducado; dejar que se filtre lo que depende del punto de partida; olvidar una marca en un bitmap (ningún error, resultados perdidos). |
| **Buenas prácticas** | Siempre definir la condición de invalidación antes de memoizar; distinguir un recálculo evitable (este principio) de una pausa voluntaria de protección (a conservar); escribir un archivo de caché mediante un archivo temporal renombrado; solo hacer esperar al usuario en la primera llamada sin caché; hacer streaming de la respuesta HTTP en cuanto un cálculo largo e inevitable produce resultados progresivamente. Perfilar antes: la parte de la función en el tiempo total limita la ganancia; verificar que una versión incremental o filtrada da las mismas respuestas que el cálculo completo. |
