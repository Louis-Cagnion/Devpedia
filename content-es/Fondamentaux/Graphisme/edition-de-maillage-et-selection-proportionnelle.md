---
order: 7
---

# Edición de malla y selección proporcional

El [capítulo anterior](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d) cubre el picking, que identifica **un** vértice pulsado. Este capítulo cubre qué ocurre una vez seleccionado ese vértice: cómo moverlo sin romper la forma general de la malla que lo rodea.

## El problema: mover un vértice de forma aislada rompe la superficie

Una [malla](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) es un conjunto de vértices conectados por caras. Mover un solo vértice, sin tocar a sus vecinos, crea un pico o un hueco brusco, desproporcionado respecto al resto de la superficie: visualmente, la modificación "rompe" la forma en lugar de hacerla evolucionar con naturalidad.

```text
Movimiento aislado del vertice central:      Con seleccion proporcional:

      *                                            *
     /|\                                          /~\
    / | \          -- vs --                      /   \
---*--+--*---                              ---*--~~~~~--*---
   (pico brusco)                           (transicion suavizada)
```

## La selección proporcional: una influencia que decae con la distancia

La **selección proporcional** (noción popularizada por la herramienta de modelado [Blender](https://www.blender.org)) responde a este problema: mover un vértice también influye en sus vecinos, con una intensidad que **decae** según su distancia al vértice directamente seleccionado.

```c
float distancia = distancia_3d(vertice_vecino.posicion, vertice_seleccionado.posicion);

if (distancia < radio_influencia) {
    // 1.0 en el centro, 0.0 en el borde del radio
    float factor = 1.0f - (distancia / radio_influencia);
    vertice_vecino.posicion += desplazamiento * factor;
}
```

Cada vértice dentro del radio de influencia se mueve por tanto en la misma dirección que el vértice directamente seleccionado, pero tanto menos cuanto más alejado esté: el propio vértice seleccionado se mueve por completo (`factor = 1.0`), un vecino en el límite del radio apenas se mueve (`factor` cercano a `0.0`).

| Parámetro | Efecto |
|---|---|
| Radio de influencia pequeño | Modificación localizada, cercana a un movimiento aislado |
| Radio de influencia grande | Deformación amplia y suave, sobre una zona extensa de la malla |
| Curva de decaimiento lineal (arriba) | Transición simple, pero con un cambio de pendiente visible en el límite del radio |
| Curva de decaimiento suavizada (ej. `smoothstep`) | Transición más suave, sin cambio de pendiente perceptible |

> **Trampa:** un radio de influencia elegido sin relación con la escala real de la malla. En un objeto diminuto, un radio pensado para un objeto enorme engloba la malla entera (todo se mueve de forma casi uniforme); en un objeto enorme, el mismo radio puede no afectar casi a ningún vecino (vuelta a un movimiento aislado).
>
> **Buena práctica:** expresar el radio de influencia en relación con el tamaño del objeto editado (por ejemplo, un porcentaje de su caja envolvente), en lugar de como un valor absoluto fijo.

## Compactar una malla: eliminar los vértices que ninguna cara usa

Un archivo [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) puede declarar vértices (`v`) que ninguna cara (`f`) referencia: **vértices aislados**. Invisibles en pantalla, cuentan igualmente en el cálculo de la **caja envolvente**, la caja más pequeña alineada con los ejes que contiene todos los vértices. El programa la usa para colocar el **pivote** (el punto alrededor del cual gira el objeto, aquí el centro de la caja) y para [encuadrar la cámara](/?c=fondamentaux&s=graphisme&p=matrices-et-camera).

```text
Con el vértice aislado D:         Sin D:
+----------------------+          +-------+
|  A---B             D |          | A---B |
|   \ /                |          |  \ /  |
|    C                 |          |   C   |
+----------------------+          +-------+
pivote descentrado, objeto        pivote y encuadre
pequeño y excéntrico              correctos
```

La solución es **compactar** la malla: conservar solo los vértices usados y luego renumerar las caras. Las caras designan un vértice por su **índice** (su posición en el arreglo de vértices): eliminar el vértice n.º 2 desplaza todos los siguientes, así que todo índice mayor que 2 debe corregirse.

### Una tabla de renumeración, rellenada en tres pasadas

La **tabla de renumeración** (`remap`) asocia a cada vértice su índice antiguo con su índice nuevo, o con `-1` si desaparece.

```c
typedef struct {
    float position[3];
    float uv[2];        // coordenadas de textura: viajan con el vértice
} Vertex;

// Elimina en el lugar los vértices sin usar; devuelve cuántos se conservan,
// -1 si falla la asignación, -2 si un índice de cara sale del arreglo.
long compact_mesh(Vertex *vertices, size_t vertex_count,
                  unsigned *indices, size_t index_count) {
    long *remap = malloc(vertex_count * sizeof *remap);

    if (remap == NULL)
        return -1;
    for (size_t i = 0; i < vertex_count; i++)
        remap[i] = -1;
    for (size_t k = 0; k < index_count; k++) {
        if (indices[k] >= vertex_count) {
            free(remap);
            return -2;
        }
        remap[indices[k]] = 0;          // marca «usado»
    }
    long next = 0;
    for (size_t i = 0; i < vertex_count; i++) {
        if (remap[i] < 0)
            continue;
        vertices[next] = vertices[i];   // next <= i: casilla ya leída
        remap[i] = next++;
    }
    for (size_t k = 0; k < index_count; k++)
        indices[k] = remap[indices[k]];
    free(remap);
    return next;
}
```

| Pasada | Función |
|---|---|
| 1. Marcar | Para cada índice de cara, pasar `remap[índice]` de `-1` a «usado» |
| 2. Mover | Recorrer los vértices en orden; cada vértice usado recibe el siguiente índice nuevo y se copia a su nuevo lugar |
| 3. Renumerar | Sustituir cada índice de cara por `remap[índice]` |

- **Sin segundo arreglo**: el movimiento se hace en el lugar, porque un vértice nunca sube (`next <= i`). La casilla de destino ya fue leída o estaba sin usar.
- **Índice y UV juntos**: las UV (coordenadas de textura, cf. [indexación `v/vt/vn`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#la-indexacion-combinada-vvtvn-y-la-costura-uv)) viajan con el vértice en la misma estructura. Si el archivo las guarda en un arreglo aparte, ese arreglo tiene su propia tabla de renumeración, aplicada a las mismas caras.
- **Validar antes de renumerar**: un índice fuera del arreglo escribiría fuera de `remap`. La función lo rechaza con un código de error propio en lugar de suponerlo válido.

> **Trampa de prueba:** un verificador que lee los triángulos por número de vértice falla tras la renumeración, porque los números han cambiado. Comparar los triángulos por **coordenadas**, no por índice. Cuidado también: dos vértices distintos cuyas coordenadas se redondean al mismo `float` vuelven ambiguo ese índice.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Mover un vértice de forma aislada rompe visualmente la superficie de una malla. La selección proporcional también mueve a los vecinos, con una intensidad que decae según su distancia al vértice seleccionado, dentro de un radio de influencia. Un vértice que ninguna cara usa falsea la caja envolvente, y con ella el pivote y el encuadre: se compacta la malla. |
| **Herramientas utilizables** | Una distancia 3D entre vértices, un factor de atenuación lineal o suavizado (`smoothstep`) según esa distancia. Una tabla de renumeración (`remap`) rellenada en tres pasadas (marcar, mover en el lugar, renumerar las caras). |
| **Trampas a evitar** | Un radio de influencia fijo, sin relación con la escala real del objeto editado. Renumerar sin validar los índices de cara, o comparar triángulos por índice tras compactar. |
| **Buenas prácticas** | Expresar el radio de influencia en relación con el tamaño del objeto en lugar de como valor absoluto. Una curva de decaimiento suavizada para una transición sin cambio de pendiente visible en el límite del radio. Renumerar caras y UV juntas; comparar los triángulos por coordenadas. |
