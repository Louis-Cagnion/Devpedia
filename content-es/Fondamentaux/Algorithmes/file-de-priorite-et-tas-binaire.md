---
order: 10
---

# La cola de prioridad y el montículo binario

Una [cola](/?c=fondamentaux&s=algorithmes&p=pile-et-file) atiende los elementos en su orden de llegada. Una **cola de prioridad** atiende siempre **al más prioritario** primero, como las urgencias de un hospital: el paciente más grave pasa antes, sea cual sea su hora de llegada.

| Operación | Array sin ordenar | Array ordenado | Montículo binario |
|---|---|---|---|
| Añadir un elemento | O(1) | O(n) (desplazar para insertarlo en su sitio) | O(log n) |
| Retirar el más prioritario | O(n) (recorrerlo todo) | O(1) | O(log n) |

El **montículo binario** hace las dos operaciones en O(log n) (ver [La complejidad y la notación Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): con un millón de elementos, una veintena de pasos en lugar de un millón.

## El montículo binario: un árbol guardado en un array

Un montículo es un árbol en el que cada padre es **al menos tan prioritario como sus hijos**. El más prioritario está por tanto siempre en la raíz. El árbol se guarda nivel por nivel en un simple array, sin punteros:

```
            [0] 90                  array  : 90  70  80  20  50  60
          /        \                casilla:  0   1   2   3   4   5
      [1] 70      [2] 80
      /    \       /                padre de la casilla i : (i - 1) / 2
  [3] 20  [4] 50  [5] 60            hijos de la casilla i : 2i + 1 y 2i + 2
```

| Operación | Cómo |
|---|---|
| Añadir | Poner el elemento al final del array y luego hacerlo **subir** intercambiándolo con su padre mientras sea más prioritario |
| Retirar el más prioritario | Tomar la raíz, poner el último elemento en su lugar y luego hacerlo **bajar** intercambiándolo con su hijo más prioritario mientras haga falta |

Cada subida o bajada recorre como mucho la altura del árbol, es decir, log₂(n) pasos.

## El montículo indexado: cambiar la prioridad de un elemento ya guardado

Algunos algoritmos aumentan la prioridad de un elemento **que ya está en el montículo**: por ejemplo la heurística VSIDS de los [solucionadores SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), que aumenta la actividad de una variable en cada conflicto. Hay que saber entonces **dónde** está ese elemento en el array, sin buscarlo casilla por casilla. Un **montículo indexado** mantiene una tabla `pos[x]`: la casilla donde está el elemento x, actualizada en cada movimiento.

```c
double prioridad[N];                         // prioridad[x]: prioridad del elemento x
int    monticulo[N];                         // los elementos, guardados en montículo
int    pos[N];                               // pos[x]: casilla de x en monticulo, o -1
int    tamano = 0;

static void colocar(int i, int x) { monticulo[i] = x; pos[x] = i; }

// Hace subir el elemento de la casilla i mientras sea más prioritario que su padre
static void subir(int i)
{
    int x = monticulo[i];
    while (i > 0 && prioridad[x] > prioridad[monticulo[(i - 1) / 2]]) {
        colocar(i, monticulo[(i - 1) / 2]);  // el padre baja un nivel
        i = (i - 1) / 2;
    }
    colocar(i, x);
}

// Hace bajar el elemento de la casilla i mientras un hijo sea más prioritario
static void bajar(int i)
{
    int x = monticulo[i];
    for (;;) {
        int h = 2 * i + 1;                   // hijo izquierdo
        if (h >= tamano)
            break;
        if (h + 1 < tamano && prioridad[monticulo[h + 1]] > prioridad[monticulo[h]])
            h++;                             // el más prioritario de los dos hijos
        if (prioridad[monticulo[h]] <= prioridad[x])
            break;
        colocar(i, monticulo[h]);            // el hijo sube un nivel
        i = h;
    }
    colocar(i, x);
}

void insertar(int x) { colocar(tamano, x); tamano++; subir(tamano - 1); }

int extraer_max(void)
{
    int x = monticulo[0];
    pos[x] = -1;                             // x ya no está en el montículo
    tamano--;
    if (tamano > 0) {
        colocar(0, monticulo[tamano]);       // el último ocupa el lugar de la raíz
        bajar(0);
    }
    return x;
}

void aumentar(int x, double delta)           // la prioridad de x aumenta
{
    prioridad[x] += delta;
    if (pos[x] >= 0)
        subir(pos[x]);                       // gracias a pos: ninguna búsqueda en el montículo
}
```

En lugar de intercambiar dos casillas en cada paso, `subir` y `bajar` desplazan los elementos que encuentran y solo colocan `x` una vez, en su casilla final: la mitad de escrituras. Código comprobado con 200 000 operaciones aleatorias (inserciones, aumentos, extracciones), comparando cada extracción con una búsqueda del máximo casilla por casilla: ninguna diferencia.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una cola de prioridad atiende siempre primero al más prioritario. El montículo binario la implementa en un simple array: padre de la casilla i en (i − 1) / 2, hijos en 2i + 1 y 2i + 2, inserción y extracción en O(log n). |
| **Herramientas utilizables** | Subida y bajada en el montículo; tabla de posiciones `pos[x]` (montículo indexado) para aumentar la prioridad de un elemento ya guardado. |
| **Trampas a evitar** | Olvidar actualizar `pos` en cada movimiento (pasar siempre por una única función como `colocar`); buscar un elemento casilla por casilla en el montículo, lo que anula toda la ganancia. |
| **Buenas prácticas** | Comprobar un montículo frente a una versión ingenua con muchas operaciones aleatorias; desplazar en lugar de intercambiar durante una subida o una bajada. |
