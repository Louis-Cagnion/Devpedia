---
order: 5
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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Mover un vértice de forma aislada rompe visualmente la superficie de una malla. La selección proporcional también mueve a los vecinos, con una intensidad que decae según su distancia al vértice seleccionado, dentro de un radio de influencia. |
| **Herramientas utilizables** | Una distancia 3D entre vértices, un factor de atenuación lineal o suavizado (`smoothstep`) según esa distancia. |
| **Trampas a evitar** | Un radio de influencia fijo, sin relación con la escala real del objeto editado. |
| **Buenas prácticas** | Expresar el radio de influencia en relación con el tamaño del objeto en lugar de como valor absoluto. Una curva de decaimiento suavizada para una transición sin cambio de pendiente visible en el límite del radio. |
