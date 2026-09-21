---
order: 7
---

# El NPS: medir la satisfacción y la fidelidad del cliente

El **NPS** (*Net Promoter Score*) es una métrica de satisfacción del cliente ampliamente utilizada, mucho más allá de la tecnología (soporte, servicio postventa, experiencia de producto): un ejemplo concreto de medida cuantitativa que puede alimentar un [Key Result](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=okr) ("pasar el NPS de 20 a 40", por ejemplo).

## El principio: una sola pregunta, puntuada de 0 a 10

El NPS se basa en una sola pregunta, planteada tras una interacción con un servicio: *"¿Recomendarías este servicio a un colega o amigo?"*, puntuada de 0 (para nada) a 10 (totalmente).

| Puntuación | Categoría | ¿Cuenta en el total? | ¿Cuenta en el numerador? |
|---|---|---|---|
| 0 a 6 | Detractores | Sí | Sí (negativamente) |
| 7 u 8 | Pasivos/neutros | Sí | No |
| 9 o 10 | Promotores | Sí | Sí (positivamente) |

```javascript
// puntuaciones: array de enteros de 0 a 10, uno por encuestado
function calcularNps(puntuaciones) {
    const total = puntuaciones.length;
    const detractores = puntuaciones.filter(p => p <= 6).length;
    const promotores = puntuaciones.filter(p => p >= 9).length;
    // los neutros (7-8) cuentan en "total", pero nunca en el numerador
    return ((promotores - detractores) / total) * 100;
}
```

El resultado siempre está entre -100 (todos detractores) y +100 (todos promotores).

> **Trampa:** comparar el NPS bruto de dos empresas de sectores distintos sin tener en cuenta las normas del sector: el NPS medio varía enormemente de un sector a otro (un NPS de 30 puede ser excelente en un sector, mediocre en otro).
>
> **Buena práctica:** seguir la evolución del NPS de un mismo servicio a lo largo del tiempo (antes/después de un cambio concreto), en lugar de compararlo bruscamente con el de una empresa de otro sector.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El NPS mide la satisfacción/fidelidad del cliente a partir de una sola pregunta puntuada de 0 a 10: `(% promotores [9-10] − % detractores [0-6]) × 100`, contando los neutros [7-8] en el total sin influir en el resultado. |
| **Herramientas utilizables** | Una sola pregunta estandarizada, planteada tras una interacción con el servicio; el cálculo puede automatizarse (`calcularNps()` arriba). |
| **Trampas a evitar** | Comparar un NPS bruto entre sectores distintos sin tener en cuenta las normas propias de cada sector. |
| **Buenas prácticas** | Seguir la evolución del NPS de un mismo servicio a lo largo del tiempo en lugar de una comparación intersectorial brusca. |
