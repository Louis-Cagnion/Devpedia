---
order: 3
---

# Arquitectura de una suite de pruebas

Escribir una prueba aislada es sencillo; mantener cientos de ellas legibles, fiables y fáciles de hacer evolucionar lo es mucho menos. Este capítulo cubre cómo organizar una **suite de pruebas** (el conjunto de pruebas de un proyecto) para que se mantenga manejable con el tiempo, sea cual sea el nivel de la pirámide de pruebas al que pertenezca.

## Dónde colocar las pruebas: espejo del código fuente

La convención más extendida es hacer que la estructura de carpetas de las pruebas refleje la del código fuente, un archivo de prueba por archivo de código, en una carpeta separada (a menudo llamada `tests/` o `__tests__/`):

```text
source/
  users/
    autenticacion.js
    perfil.js
tests/
  users/
    autenticacion.test.js
    perfil.test.js
```

Esta organización permite localizar de inmediato las pruebas de un archivo dado, y hace visible de un vistazo el código que no tiene ninguna prueba asociada (un archivo fuente sin su archivo de prueba espejo).

## Fixtures: preparar un estado de partida común

Un **fixture** es un estado preparado de antemano (datos, una configuración, una conexión) que varias pruebas reutilizan, para evitar recrear ese contexto cada vez.

```text
Sin fixture (repetido en cada prueba):
  prueba "puede editar su perfil":
    crear un usuario "alicia@ejemplo.es"
    iniciar sesión con ese usuario
    editar su perfil
    verificar el cambio

Con fixture (preparado una vez, reutilizado):
  fixture "usuario_conectado":
    crear un usuario "alicia@ejemplo.es"
    iniciar sesión con ese usuario

  prueba "puede editar su perfil" (usa fixture "usuario_conectado"):
    editar su perfil
    verificar el cambio
```

> **Trampa:** fixtures que se contaminan entre pruebas, por ejemplo una base de datos de prueba que conserva datos dejados por una prueba anterior. Una prueba que depende del orden de ejecución de las demás se vuelve impredecible.
>
> **Buena práctica:** cada prueba debe partir de un estado limpio y predecible, generalmente recreando el fixture antes de cada prueba en lugar de reutilizarlo tal cual entre ellas.

## Test doubles: mocks, stubs y fakes

Un **test double** es un sustituto ficticio de una dependencia real (una base de datos, una API externa, el reloj del sistema), usado para aislar lo que realmente se está probando. El término agrupa varias variantes, a menudo confundidas entre sí:

| Término | Papel |
|---|---|
| **Stub** | Devuelve una respuesta fija y predefinida, sin lógica ("cuando se le llama, siempre devuelve este resultado") |
| **Mock** | Como un stub, pero además verifica *cómo* se usó (si fue llamado, con qué argumentos, cuántas veces) |
| **Fake** | Una implementación simplificada pero funcional (ej. una base de datos en memoria en lugar de una real) |

```text
Stub: "getUsuario(id) siempre devuelve {nombre: 'Alicia'}"
Mock: "getUsuario fue efectivamente llamado una vez, con id=42"
Fake: una pequeña base de datos real en memoria, que se comporta
      como la real pero sin archivo ni servidor que instalar
```

> **Trampa:** abusar de los mocks hasta el punto de que una prueba solo verifica "el código llamó a las funciones correctas", sin verificar nunca un resultado de negocio real.
>
> **Buena práctica:** reservar los test doubles para dependencias genuinamente costosas o poco fiables de usar tal cual en una prueba (red, tiempo, aleatoriedad); mantener la lógica real del programa probado, nunca simularla a ella misma.

## Entornos de prueba

Un proyecto suele ejecutar sus pruebas en un **entorno** separado del de producción: una base de datos de prueba, credenciales ficticias, a veces servicios externos también simulados. Separar estos entornos evita que una prueba fallida o mal escrita toque datos reales, y hace que los resultados sean reproducibles independientemente del estado cambiante de la producción.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Una suite de pruebas manejable refleja la estructura de carpetas del código fuente, usa fixtures para preparar un estado de partida limpio y reproducible, y test doubles (stub, mock, fake) para aislar dependencias costosas o poco fiables. |
| **Herramientas utilizables** | Ninguna herramienta concreta en esta etapa: los capítulos siguientes sobre cada nivel de prueba (unitaria, integración, E2E) cubrirán herramientas específicas. |
| **Trampas a evitar** | Fixtures que se contaminan entre pruebas. Abusar de los mocks hasta dejar de probar la lógica real. |
| **Buenas prácticas** | Partir de un estado limpio en cada prueba. Reservar los test doubles para dependencias genuinamente costosas (red, tiempo, aleatoriedad). |
