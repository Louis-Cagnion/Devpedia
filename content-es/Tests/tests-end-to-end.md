---
order: 6
---

# Las pruebas end-to-end

Las [pruebas de integración](/?c=tests&p=tests-dintegration) verifican que varios componentes se entienden entre sí, pero generalmente siguen siendo internas al programa (sin interfaz gráfica, sin navegador real). La cima de la [pirámide de pruebas](/?c=tests&p=pyramide-de-test), las pruebas **end-to-end** (E2E, "de extremo a extremo"), va más allá: simular un recorrido de usuario completo, exactamente como lo ejecutaría una persona real.

## Simular al usuario, no al código

Una prueba E2E no conoce nada de la implementación interna del programa: maneja la aplicación como lo haría un humano, haciendo clic en botones, rellenando campos, leyendo lo que se muestra en pantalla.

```text
Prueba E2E: "un cliente puede completar un pedido de principio a fin"

  1. Abrir la página de inicio del sitio
  2. Hacer clic en un producto
  3. Hacer clic en "Añadir al carrito"
  4. Ir a la página de pago
  5. Rellenar el formulario de envío
  6. Confirmar el pedido
  7. Verificar que la página de confirmación se muestra correctamente
```

Esta prueba podría haber fallado por un bug en cualquiera de estos siete pasos: eso es precisamente lo que le da valor, verifica que el recorrido funciona realmente en su conjunto, no solo cada pieza por separado.

## El precio de esta cobertura amplia

Una prueba E2E ejecuta la aplicación entera (a menudo en un navegador real y automatizado), lo que la hace notablemente más lenta que una prueba unitaria o de integración, y más frágil: un cambio visual inofensivo (un botón movido, un texto reformulado) puede romper la prueba sin que haya ningún bug real.

> **Trampa:** identificar los elementos de la página por su texto mostrado o su posición visual ("el tercer botón", "el enlace que dice Continuar"). Un simple cambio de texto o de maquetación, incluso sin bug, rompe entonces la prueba.
>
> **Buena práctica:** identificar los elementos por un atributo dedicado y estable (un `id`, un atributo `data-testid`), independiente del texto mostrado o de la maquetación, para que solo un cambio de comportamiento real haga fallar la prueba.

## Reservar el E2E para los recorridos verdaderamente críticos

Este coste (lentitud, fragilidad relativa) justifica directamente la forma de la pirámide de pruebas: una prueba E2E por recorrido realmente crítico para el usuario (crear una cuenta, pagar, enviar un mensaje), no una prueba E2E por cada detalle que ya cubriría una prueba unitaria más rápida y más estable.

```text
Buen candidato para una prueba E2E:
  "un cliente puede completar un pedido" (recorrido de negocio
  crítico, implica varias páginas y varios componentes)

Mal candidato para una prueba E2E:
  "el campo email rechaza una dirección mal formada" (ya cubierto,
  más rápido y de forma más fiable, por una prueba unitaria sobre
  la función de validación)
```

> **Trampa:** intentar cubrir todas las combinaciones posibles con pruebas E2E, por falta de pruebas unitarias suficientes sobre los mismos casos. La suite se vuelve entonces lenta hasta el punto de ralentizar a todo el equipo, sin una ganancia proporcional de fiabilidad.
>
> **Buena práctica:** mantener en E2E únicamente los recorridos cuyo fallo tendría un impacto real de negocio, y delegar la verificación de detalles (validación de un campo, cálculo aislado) a los niveles más bajos de la pirámide.

## Pruebas inestables: un problema aún más marcado aquí

El problema de las pruebas **inestables** (*flaky*, ya visto en el capítulo de pruebas unitarias) afecta particularmente al E2E: un retraso de red variable, una animación que aún no ha terminado cuando la prueba intenta hacer clic, un orden de carga ligeramente distinto de una ejecución a otra, pueden hacer fallar una prueba sin ninguna relación con un bug real.

> **Buena práctica:** esperar explícitamente a que un elemento esté presente e interactivo antes de actuar sobre él (en lugar de una pausa fija de varios segundos, que resulta o demasiado corta o innecesariamente larga), y tratar todo fallo E2E repetido como una señal a investigar, nunca como un ruido de fondo normal.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Una prueba end-to-end simula un recorrido de usuario completo en la aplicación real, sin conocer su implementación interna. Más lenta y más frágil que una prueba unitaria o de integración, se reserva a los recorridos verdaderamente críticos para el usuario. |
| **Herramientas utilizables** | Atributos dedicados y estables (`data-testid`) para identificar los elementos de página. Una espera explícita sobre la presencia/interactividad de un elemento en lugar de una pausa fija. |
| **Trampas a evitar** | Identificar los elementos por su texto o su posición visual. Cubrir en E2E casos ya cubiertos por pruebas unitarias más rápidas. |
| **Buenas prácticas** | Identificar los elementos por un atributo estable y dedicado. Reservar el E2E a los recorridos cuyo fallo tendría un impacto real de negocio. Tratar un fallo E2E repetido como una señal a investigar. |
