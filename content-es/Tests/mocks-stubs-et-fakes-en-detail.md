---
order: 9
---

# Mocks, stubs y fakes en detalle

El capítulo sobre la [arquitectura de pruebas](/?c=tests&p=architecture-de-test) introdujo los test doubles (stub, mock, fake) en una frase cada uno. Este capítulo profundiza en sus diferencias prácticas, y sobre todo en la trampa más habitual de su uso: el exceso de mocks.

## Tres familias, tres usos

| Test double | Responde a | Verifica |
|---|---|---|
| **Stub** | "¿Qué debe devolver esta dependencia?" | Nada: solo una respuesta fija, impuesta por la prueba |
| **Mock** | "¿Se usó correctamente esta dependencia?" | Que una llamada ocurrió de verdad, con qué argumentos, cuántas veces |
| **Fake** | "¿Cómo se comportaría una versión real simplificada?" | Nada directamente: es una implementación que se comporta casi como la real |

```text
Función probada: enviarNotificacion(usuario, servicio)

Con un stub:
  servicio = { enviar: () => "ok" }
  -> la prueba verifica qué hace enviarNotificacion() con esa
     respuesta fija, sin preocuparse de cómo se llamó a
     servicio.enviar()

Con un mock:
  servicio = un mock del servicio, que registra cada llamada
  -> la prueba verifica después: ¿se llamó a servicio.enviar
     una vez, con el usuario esperado como parámetro?

Con un fake:
  servicio = una implementación en memoria que almacena
  realmente las notificaciones enviadas, sin tocar nunca la red
  -> la prueba puede releer la lista de notificaciones
     "enviadas" tal como lo haría el servicio real
```

## Prueba basada en el estado vs basada en la interacción

Esta distinción refleja dos formas distintas de verificar un comportamiento:

| Enfoque | Qué mira |
|---|---|
| **Basado en el estado** (stub, fake) | El resultado final: ¿qué produjo o cambió la función? |
| **Basado en la interacción** (mock) | El desarrollo: ¿qué dependencias se llamaron, y cómo? |

Una prueba basada en el estado sigue siendo válida aunque la implementación cambie internamente (mientras el resultado final no cambie); una prueba basada en la interacción, en cambio, se rompe en cuanto la implementación cambia su forma de llamar a sus dependencias, aunque el resultado final siga siendo idéntico.

> **Trampa:** usar un mock para verificar un detalle de implementación sin importancia real (el orden exacto de dos llamadas independientes, por ejemplo). La prueba queda entonces acoplada a una decisión de implementación arbitraria, y se rompe con el menor refactoring que, sin embargo, no cambia nada del comportamiento observable.
>
> **Buena práctica:** preferir una prueba basada en el estado siempre que el resultado final baste para verificar el comportamiento; reservar el mock para los casos en que la propia interacción es el comportamiento a verificar (ej. "se envió realmente un email", donde no existe otro resultado observable más que la propia llamada).

## El exceso de mocks: la trampa más habitual

Sustituir por un test double **cada** dependencia de una función, incluidas las que podrían seguir siendo reales sin coste alguno, produce una prueba que ya no verifica gran cosa: solo confirma que el código llama a las funciones correctas en el orden correcto, nunca que produce un resultado correcto.

```text
Función probada: calcularTotal(carrito) que usa
  - una función interna aplicarDescuento() (pura, sin
    dependencia externa)
  - un servicio externo tasaDeCambio()

Exceso de mocks:
  también mockear aplicarDescuento() -> la prueba ya no
  verifica si el descuento se aplica correctamente, solo
  que fue "llamada"

Buen equilibrio:
  mantener aplicarDescuento() real (sin dependencia externa,
  rápida, determinista), mockear solo tasaDeCambio()
  (dependencia externa, potencialmente lenta o no determinista)
```

> **Trampa:** simular una dependencia solo porque es llamada por la función probada, sin preguntarse si realmente necesita serlo (red, tiempo, aleatoriedad) o si podría seguir siendo el código real.
>
> **Buena práctica:** sustituir por un test double solo las dependencias genuinamente costosas o no deterministas de usar tal cual en una prueba; mantener el código interno, puro y determinista, tal cual en la prueba.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un stub devuelve una respuesta fija, un mock verifica cómo fue llamado, un fake es una implementación simplificada pero funcional. Una prueba basada en el estado se mantiene estable ante el refactoring interno; una prueba basada en la interacción (mock) es más sensible a él. El exceso de mocks (simular dependencias internas puras) produce pruebas que ya no verifican el comportamiento real. |
| **Herramientas utilizables** | Un stub/fake para una prueba basada en el estado. Un mock solo cuando la propia interacción es el comportamiento a verificar. |
| **Trampas a evitar** | Usar un mock para un detalle de implementación sin importancia real. Simular una dependencia que podría seguir siendo real sin coste (código interno, puro, determinista). |
| **Buenas prácticas** | Preferir una prueba basada en el estado cuando el resultado final basta. Mockear solo las dependencias genuinamente costosas o no deterministas. |
