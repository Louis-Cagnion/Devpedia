---
order: 9
---

# Los skills: empaquetar una capacidad reutilizable para un agente

El capítulo sobre los [agentes](/?c=ia&s=nlp-llm&p=agents) mostró cómo dar a un modelo herramientas que puede invocar. Sin embargo, esas herramientas siguen siendo acciones puntuales (llamar a una API, leer un archivo): no dicen nada sobre *cómo* llevar a cabo una tarea compleja y recurrente (depurar metódicamente, hacer una revisión de código, encuadrar un proyecto antes de programar). Un **skill** responde a esta necesidad: un paquete reutilizable de instrucciones, y opcionalmente de scripts o documentos asociados, que el agente carga bajo demanda en lugar de tener que explicárselo cada vez.

## El problema: repetir las mismas instrucciones en cada conversación

Sin un skill, conseguir que un agente siga un método preciso (por ejemplo, un ciclo de desarrollo guiado por pruebas, ver el capítulo [TDD](/?c=tests&p=tdd)) exige volver a explicar ese método en cada nueva conversación, o pegarlo en un prompt de sistema largo. Un skill empaquetado de una vez por todas evita esta repetición, y sigue disponible de una sesión a otra sin tener que retransmitirlo.

## La estructura: una carpeta, un archivo SKILL.md

La convención más extendida (estandarizada por Anthropic bajo el nombre **Agent Skills**, e implementada por varios agentes) organiza un skill como una carpeta que contiene un archivo `SKILL.md` obligatorio, más recursos asociados opcionales:

```text
mi-skill/
├── SKILL.md          <- obligatorio: metadatos + instrucciones
├── scripts/            <- opcional: código ejecutable
├── references/          <- opcional: documentación detallada
└── assets/               <- opcional: plantillas, archivos de referencia
```

El propio `SKILL.md` combina una cabecera estructurada con instrucciones en lenguaje natural:

```markdown
---
name: revision-de-seguridad
description: Revisión de seguridad metódica de un cambio de
  código, a usar antes de fusionar una pull request que toque
  la autenticación o datos sensibles.
---

# Revisión de seguridad

1. Identificar todos los puntos de entrada de datos de usuario
   modificados por este cambio.
2. Para cada uno, verificar: validación, escapado, autorización.
3. ...
```

## La carga progresiva: no cargarlo todo de golpe

Un agente con acceso a decenas de skills no puede permitirse leer cada uno por completo en cada turno, o saturaría su [ventana de contexto](/?c=ia&s=nlp-llm&p=llm-en-production) para nada. El mecanismo usado, la **divulgación progresiva** (*progressive disclosure*), solo carga cada nivel si el nivel anterior lo justifica:

```text
Nivel 1: el nombre y la descripción de cada skill disponible
         (unas pocas líneas cada uno) -> siempre presentes

Nivel 2: si una tarea corresponde a la descripción de un skill,
         cargar el cuerpo completo de su SKILL.md

Nivel 3: si las instrucciones del skill lo piden, cargar un
         archivo de referencia o ejecutar un script asociado
```

Este mecanismo explica por qué la **descripción** de un skill importa tanto como su contenido: es lo único que ve el agente antes de decidir si el skill se aplica a la tarea en curso.

> **Trampa:** escribir una descripción vaga o demasiado general ("ayuda con el código"). Una descripción que no indica con precisión a qué situación responde el skill no permite al agente saber cuándo cargarlo, ni a quien lo escribe verificar que no se activa en casos no deseados.
>
> **Buena práctica:** redactar la descripción como una respuesta a "¿en qué situación precisa debe activarse este skill?", con palabras clave concretas en lugar de formulaciones generales.

## Dónde encontrar skills ya existentes

En lugar de escribir cada skill desde cero, ya existen colecciones públicas. [skills.sh](https://skills.sh), un directorio de skills clasificados por popularidad de uso, referencia miles de ellos. El repositorio [mattpocock/skills](https://github.com/mattpocock/skills) es un ejemplo concreto y muy usado: una colección pensada para ingeniería de software real, no para un prototipado superficial, con skills como `tdd` (un ciclo automatizado rojo/verde/refactor), `diagnosing-bugs` (un método de depuración disciplinado), o `grill-me` (una entrevista a fondo para clarificar un plan antes de ejecutarlo).

> **Trampa:** instalar un skill de terceros sin haber leído su contenido, sobre todo si incluye scripts ejecutables (una carpeta `scripts/`). Un skill malicioso o mal escrito puede hacer que el agente ejecute código arbitrario, exactamente igual que cualquier otro código descargado de una fuente no verificada.
>
> **Buena práctica:** leer el contenido de un skill (instrucciones y scripts asociados) antes de instalarlo, sobre todo si viene de una fuente que uno no controla, aplicando el mismo nivel de precaución que al ejecutar cualquier código de terceros.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un skill empaquetado de una vez por todas (carpeta + `SKILL.md`, opcionalmente scripts/references/assets) evita reexplicar un método recurrente en cada conversación. La divulgación progresiva solo carga el contenido completo de un skill cuando su descripción coincide con la tarea en curso, manteniendo bajo el coste en contexto aunque haya muchos skills disponibles. |
| **Herramientas utilizables** | El formato `SKILL.md` (cabecera `name`/`description` + instrucciones). skills.sh para descubrir skills existentes; mattpocock/skills como colección concreta orientada a la ingeniería real. |
| **Trampas a evitar** | Una descripción de skill demasiado vaga para que el agente sepa cuándo activarlo. Instalar un skill de terceros, sobre todo con scripts ejecutables, sin haber leído su contenido. |
| **Buenas prácticas** | Redactar la descripción como una respuesta precisa a "¿cuándo debe activarse este skill?". Leer un skill antes de instalarlo, como con cualquier código de terceros. |
