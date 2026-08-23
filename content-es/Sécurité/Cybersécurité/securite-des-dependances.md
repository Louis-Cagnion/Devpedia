---
order: 6
---

# Seguridad de las dependencias y de la cadena de suministro

Un proyecto moderno se apoya en decenas, a veces miles, de bibliotecas escritas por otras personas (ver por ejemplo `pip` en Python, o el equivalente en otros lenguajes, descrito en [Módulos, pip y entornos virtuales](/?c=langages-de-programmation&s=python&p=modules-et-environnements)). Cada una de estas bibliotecas, y cada una de sus propias dependencias, es un eslabón de la **cadena de suministro de software** (*supply chain*): un fallo o un código malicioso en cualquiera de estos eslabones afecta a todos los proyectos que dependen de él, directa o indirectamente, sin que se haya cometido ningún error en el código del propio proyecto. Es una de las categorías de fallos ya presentadas en [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles) bajo el nombre de "componentes vulnerables".

```text
Tu proyecto
   |
   +-- depende de --> Biblioteca A
   |                     |
   |                     +-- depende de --> Biblioteca C (fallo aqui)
   |
   +-- depende de --> Biblioteca B

Un fallo en C afecta a tu proyecto, aunque nunca hayas oido
hablar de C ni la hayas instalado tu mismo.
```

## El lockfile: fijar lo que realmente está instalado

Un archivo de dependencias habitual (`package.json`, `composer.json`...) declara rangos de versión flexibles ("al menos la 2.1", "cualquier versión 3.x"): dos instalaciones en momentos distintos pueden así obtener versiones diferentes, incluso de dependencias indirectas nunca listadas explícitamente. Un **lockfile** (`package-lock.json`, `composer.lock`, o un `requirements.txt` generado con `pip freeze`, ver [Módulos, pip y entornos virtuales](/?c=langages-de-programmation&s=python&p=modules-et-environnements)) fija la versión **exacta** de cada dependencia, directa e indirecta, a menudo junto con una huella criptográfica del contenido descargado:

| Sin lockfile | Con lockfile |
|---|---|
| Versión instalada potencialmente distinta en cada ejecución del instalador | Versión instalada idéntica y reproducible, para todo el equipo y en producción |
| Una dependencia indirecta comprometida puede instalarse en silencio | La huella del lockfile detecta contenido modificado desde la última instalación validada |

> **Buena práctica:** subir siempre el lockfile junto con el resto del código, nunca ignorarlo como un archivo generado más: eso es precisamente lo que garantiza que todos instalen las mismas versiones, con las mismas huellas.

## El typosquatting de paquetes

El [typosquatting](/?c=cybersecurite&p=ingenierie-sociale-et-phishing) no solo apunta a nombres de dominio: un atacante puede publicar un paquete con un nombre deliberadamente parecido a uno popular (`reqeusts` en lugar de `requests`, `lodahs` en lugar de `lodash`), esperando que un error tipográfico al instalar (`pip install reqeusts`) instale su versión maliciosa en lugar de la legítima.

```text
pip install requests    # el paquete legitimo, muy usado
pip install reqeusts    # error tipografico -> paquete distinto, potencialmente malicioso
```

> **Buena práctica:** copiar y pegar el nombre exacto de un paquete desde su documentación oficial en lugar de escribirlo de memoria, y comprobar el número de descargas/la antigüedad de un paquete poco conocido antes de añadirlo a un proyecto.

## Auditar tus dependencias

Un paquete instalado hoy sin fallos conocidos puede revelar uno más adelante: por eso la auditoría de dependencias es un control recurrente, no una verificación única en el momento de instalar.

| Herramienta | Ecosistema | Función |
|---|---|---|
| `npm audit` | [JavaScript](/?c=langages&s=javascript&p=javascript)/Node.js | Compara las dependencias instaladas con una base de datos de fallos conocidos |
| `pip-audit` | Python | El equivalente para paquetes Python |
| [Dependabot](https://docs.github.com/en/code-security/dependabot) | Multi-ecosistema (integrado en GitHub) | Abre automáticamente una pull request cuando una dependencia tiene un fallo conocido y hay una corrección disponible |

Estas herramientas se integran de forma natural en un [pipeline de CI/CD](/?c=ci-cd&p=pipeline-cicd): la auditoría se ejecuta automáticamente en cada cambio, en lugar de depender de una comprobación manual que alguien olvida repetir.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una dependencia (directa o indirecta) es un eslabón de la cadena de suministro de software: su fallo se convierte en el fallo del proyecto. Un lockfile fija las versiones exactas realmente instaladas, para todo el equipo. |
| **Herramientas utilizables** | `npm audit`, `pip-audit`, Dependabot, un lockfile (`package-lock.json`, `composer.lock`, `requirements.txt`). |
| **Errores a evitar** | Ignorar el lockfile en lugar de subirlo; escribir de memoria el nombre de un paquete poco familiar (riesgo de typosquatting); auditar las dependencias una sola vez, al instalar, sin volver a hacerlo nunca. |
| **Buenas prácticas** | Subir siempre el lockfile; copiar y pegar el nombre de un paquete desde su documentación oficial; integrar la auditoría de dependencias en el pipeline de CI/CD, ejecutada en cada cambio. |
