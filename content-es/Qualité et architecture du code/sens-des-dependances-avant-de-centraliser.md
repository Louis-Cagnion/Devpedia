---
order: 4
---

# Verificar el sentido de las dependencias antes de centralizar

Centralizar una configuración compartida en un solo lugar en general es una buena idea (ver [Fuente única de verdad](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), pero el lugar elegido no es neutral: si esta nueva ubicación se encuentra "más arriba" en el grafo de dependencias que algunos de sus futuros usuarios, la centralización crea una **importación circular** en lugar de simplificar algo.

## Un ejemplo concreto

Un proyecto de scraping organizado en capas: un módulo `browser.py` de bajo nivel (abrir una página, hacer clic, esperar) sin conocimiento de los sitios particulares, y una carpeta `sites/` de más alto nivel que importa `browser.py` para implementar el scraping de cada sitio:

```text
sites/leboncoin.py  --importa-->  browser.py
sites/lacentrale.py --importa-->  browser.py
```

Algunos ajustes (retrasos específicos de un sitio, rangos de variación aleatoria para parecer menos robótico) parecían, a primera vista, pertenecer lógicamente a un registro centralizado de sitios (`SITE_REGISTRY`, ubicado en `sites/__init__.py`). Pero `browser.py` en sí necesita leer esos ajustes para funcionar, y `browser.py` es importado POR `sites/`, no al revés. Moverlo crearía:

```text
browser.py  --importaria-->  sites/__init__.py  --importa-->  browser.py
```

Un ciclo: `browser.py` importaría un módulo que, transitivamente, ya lo importa a él. Según el lenguaje, esto produce un error al cargar, o una importación parcialmente inicializada (a menudo peor: el bug solo aparece en ciertos órdenes de ejecución). La solución adoptada: mantener esos ajustes específicos en `browser.py` mismo, al precio de una pequeña excepción a la regla "todo lo relativo a un sitio va en el registro", documentada en un comentario para que la próxima persona no intente "corregir" lo que en realidad es una restricción estructural.

## La pregunta a hacerse antes de centralizar

*¿Quién importa a quién, hoy?* Si la nueva ubicación centralizada debe ser importada por un módulo que se encuentra **por debajo**, en el grafo de dependencias, del módulo donde vive actualmente la información a centralizar, el traslado invierte el sentido de una dependencia existente, y aparece un ciclo en cuanto un módulo de bajo nivel necesita, aunque sea indirectamente, una información que vive en un módulo de alto nivel que depende de él.

> **Referencia práctica:** en una arquitectura en capas (bajo nivel ↔ alto nivel), la información solo debería circular en un sentido: de las capas bajas hacia las capas altas que las usan. Una centralización que parece "lógica" desde el punto de vista del dominio (agrupar todo lo relativo a un sitio) puede sin embargo violar este sentido si la información es usada por una capa más baja que la ubicación prevista.

## Esto no es una razón para nunca centralizar

Este principio no dice que haya que evitar la centralización; la [fuente única de verdad](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) sigue siendo deseable. Dice que hay que verificar el grafo de dependencias **antes** de mover algo, y aceptar que una información permanezca en un módulo aparentemente "menos lógico" cuando la única alternativa es un ciclo: la claridad de la organización importa menos que la ausencia de un ciclo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Centralizar una información en un módulo más "arriba" que algunos de sus usuarios actuales crea una importación circular, no una simplificación: el sentido de las dependencias existentes prima sobre la organización lógica del dominio. |
| **Herramientas utilizables** | Preguntarse "¿quién importa a quién, hoy?" antes de cualquier traslado de configuración compartida. |
| **Trampas a evitar** | Trasladar una información a una ubicación "lógica" sin verificar que sus usuarios actuales no se encuentren más abajo en el grafo de dependencias. |
| **Buenas prácticas** | Aceptar que una información permanezca en un módulo aparentemente "menos lógico" cuando la única alternativa es un ciclo, documentado en un comentario para evitar una futura "corrección" indebida. |
