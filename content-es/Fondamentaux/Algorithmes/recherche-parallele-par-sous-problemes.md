---
order: 7
---

# Paralelizar una búsqueda: dividir en subproblemas independientes (EPS)

Un [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) prueba las opciones posibles una por una, retrocediendo en cada callejón sin salida. Un ordenador moderno tiene varios **núcleos** (unidades de cálculo capaces de trabajar al mismo tiempo, ver [El paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)): ¿se pueden explorar varias pistas a la vez? La **EPS** (*Embarrassingly Parallel Search*, «búsqueda vergonzosamente paralela», es decir, tan fácil de paralelizar que casi da vergüenza) es una respuesta sencilla: primero dividir el problema en muchos pequeños problemas independientes y luego repartirlos.

## El árbol de búsqueda, visto como una lista de subproblemas

Cada elección del backtracking abre una rama. Todo lo que está bajo una rama es un **subproblema**: el problema de partida, con algunas variables ya fijadas.

```
                     (problema completo)
              /              |              \
         A = 1            A = 2            A = 3          <- 1.ª elección: 3 subproblemas
        /     \          /     \          /     \
    B = 1   B = 2    B = 1   B = 3    B = 2   B = 3       <- 2.ª elección: 6 subproblemas
```

Dos subproblemas del mismo nivel no comparten nada: buscar en `A = 1` no dice nada sobre `A = 2`. Por tanto se pueden confiar a **workers** distintos (un worker es un hilo o un proceso que trata una tarea, ver [Los subprocesos](/?c=langages&s=c&p=threads)).

## Por qué hacen falta muchos más subproblemas que workers

| Enfoque | Lo que ocurre |
|---|---|
| Lanzar N hilos sobre el **mismo** estado de búsqueda | Modifican la misma memoria al mismo tiempo: resultados erróneos (ver [Memoria compartida](/?c=langages&s=c&p=threads#memoria-compartida-una-ventaja-y-un-peligro)). |
| **Un** subproblema por worker | Los subproblemas no tienen la misma dificultad: un worker termina en 1 segundo y espera, mientras otro se atasca 9 segundos. |
| **30 a 100** subproblemas por worker, en una cola | Un worker que termina pronto toma enseguida el siguiente: la carga se equilibra sola. |

Ejemplo con cifras, 4 workers:

| División | Duraciones de los subproblemas | Tiempo total |
|---|---|---|
| 4 subproblemas | 1 s, 1 s, 1 s, 9 s | 9 s (tres workers esperan 8 s) |
| 40 subproblemas, mismo trabajo total (12 s) | unos 0,3 s cada uno | unos 3 s (12 s ÷ 4) |

## Las tres etapas de la EPS

```
 1. Dividir                  2. Repartir                   3. Resolver
 (un solo worker)            (cola compartida)             (cada uno por su lado)

 raíz                        [sp1][sp2][sp3]...[sp240]     worker 1: sp1, sp5, sp9...
   -> desarrollar el      ->        |    |    |       ->   worker 2: sp2, sp6...
      árbol hasta 240               v    v    v            worker 3: sp3, sp7...
      subproblemas                tomar el siguiente       (backtracking normal)
```

| Etapa | Lo que se hace | Sincronización necesaria |
|---|---|---|
| 1. Dividir | Desarrollar el árbol desde la raíz hasta el objetivo (p. ej. 30 × número de workers), aplicando la [propagación de restricciones](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reducir-los-dominios-antes-incluso-de-intentar-la-propagacion-de-restricciones) a cada subproblema: los que ya son imposibles desaparecen. | Ninguna (un solo worker) |
| 2. Repartir | Guardar los subproblemas en una cola; cada worker toma el siguiente cuando queda libre. | Solo para «tomar el siguiente» (un [mutex](/?c=langages&s=c&p=threads#proteger-un-dato-compartido-con-un-mutex)) |
| 3. Resolver | Cada worker lanza un backtracking secuencial normal sobre su subproblema. | Ninguna durante la búsqueda |

Si se busca **una sola** solución, hay que añadir una bandera compartida «solución encontrada»: el primer worker que lo consigue la levanta, y los demás se detienen en cuanto la ven.

## Elegir qué subproblema dividir

Para alcanzar el objetivo en pocas etapas, se divide siempre el subproblema que producirá **más** subproblemas nuevos: aquel cuya siguiente variable (elegida por [MRV](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#elegir-primero-la-variable-adecuada-la-heuristica-mrv), la más restringida) tiene más valores posibles.

| Subproblema | Valores posibles de su variable MRV | Dividirlo da |
|---|---|---|
| sp1 | 2 | +1 subproblema (1 sustituido por 2) |
| sp2 | 5 | +4 subproblemas: **dividir este primero** |

## Copiar el estado: la condición del «sin sincronización»

Cada subproblema debe poseer **su propia copia** de todos sus datos: una *copia profunda*. Una copia que conservara un puntero hacia los datos de otro subproblema (una *copia superficial*) volvería a poner a dos workers sobre la misma memoria.

```c
typedef struct {
    int  n;          // número de variables
    int *valores;    // valores[i] = valor elegido para la variable i, o -1
} t_estado;

t_estado *copiar_estado(const t_estado *src)
{
    t_estado *copia = malloc(sizeof(t_estado));          // nueva estructura
    copia->n = src->n;                                   // un entero se copia tal cual
    copia->valores = malloc(src->n * sizeof(int));       // NUEVO array, no el de src
    memcpy(copia->valores, src->valores, src->n * sizeof(int)); // se recopia su contenido
    return copia;                                        // ningún puntero compartido con src
}
```

Escribir `copia->valores = src->valores;` en lugar de las dos líneas `malloc`/`memcpy` sería una copia superficial: los dos estados modificarían entonces el mismo array.

## Cuando la EPS no gana nada: un caso medido

La EPS se probó en un solucionador del puzle *Skyscraper* (backtracking con MRV y propagación, en C, 8 hilos) y luego se retiró:

| Cuadrícula | Secuencial | EPS (240 subproblemas) |
|---|---|---|
| 10 × 10 | 1,08 s | 13,06 s (12 veces más lento) |
| 11 × 11 | 14 a 16 s | 82 s a más de 90 s |

| Causa | Explicación |
|---|---|
| Dividir cuesta caro | Cada subproblema creado exige una propagación completa: 240 propagaciones antes incluso de empezar a buscar, mientras que la búsqueda secuencial solo exploraba de 7 a 50 nodos. |
| El árbol real es estrecho | MRV y la propagación podan tanto que casi todo el trabajo cabe en unas pocas ramas. Con un subproblema por hilo, el tiempo vuelve al del secuencial, sin ganancia: 110 % de uso del procesador en 8 hilos, apenas más de un núcleo ocupado. |

La lección: la EPS compensa cuando el árbol es **ancho** y los subproblemas cuestan poco de crear. Antes de paralelizar, hay que [medir](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) adónde se va realmente el tiempo.

Fuente: *Embarrassingly Parallel Search*, Régin, Rezgui y Malapert, JAIR 2016 ([jair.org/index.php/jair/article/view/11031](https://jair.org/index.php/jair/article/view/11031)).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La EPS divide el árbol de búsqueda en subproblemas independientes (30 a 100 por worker), los guarda en una cola y deja que cada worker haga un backtracking normal sin comunicarse. |
| **Herramientas utilizables** | Propagación de restricciones durante la división, MRV para elegir el subproblema que dividir, una cola protegida por un mutex, una bandera compartida para detener a los demás workers. |
| **Trampas a evitar** | Un solo subproblema por worker (carga desequilibrada); una copia superficial del estado (memoria compartida); paralelizar una búsqueda cuyo árbol ya es estrecho. |
| **Buenas prácticas** | Medir el secuencial antes y después; mantener barata la división; copiar el estado en profundidad para cada subproblema. |
