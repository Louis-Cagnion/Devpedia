---
order: 2
---

# Performance

Optimizar un programa es, ante todo, entender en qué se le va el tiempo, y raramente es donde uno cree. Esta sección reúne principios de rendimiento que no dependen de un lenguaje en particular: se aplican tanto a un script Python como a una página web o a un acceso a base de datos.

El hilo conductor es una distinción que aparece en todas partes: el tiempo que su programa **pierde solo** (esperas fijas, trabajo rehecho, idas y vueltas innecesarias) y el tiempo que **pasa esperando a otro** (la red, un disco, un servicio remoto). El primero se elimina sin contrapartida. El segundo se rodea, a veces, pero a menudo se paga en otro lado, y ahí es donde empiezan las decisiones de compromiso.

Los ejemplos numéricos vienen de un caso real: la optimización de un programa de automatización de navegador, que pasó de 61 a 14 segundos para el mismo trabajo, sin cambiar nada de lo que produce.

A continuación encontrarás las distintas nociones:
