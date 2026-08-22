---
order: 9
---

# GitHub y las plataformas de alojamiento Git

[Git](/?c=git&p=concepts-de-base) es un software, instalado localmente, que gestiona el historial de un proyecto. **GitHub** es un **servicio en línea** (un sitio web, con servidores detrás) que aloja repositorios Git y añade encima herramientas de colaboración que Git solo nunca ha ofrecido: este capítulo cubre específicamente estos añadidos, no Git en sí.

| | Git | GitHub |
|---|---|---|
| Naturaleza | Un software instalado en tu máquina | Un servicio web, operado por una empresa (Microsoft) |
| Papel | Gestiona el historial, las ramas, los commits **localmente** | Aloja una copia del repositorio en línea, accesible a varias personas |
| ¿Funciona sin el otro? | Sí: Git funciona perfectamente sin tocar nunca GitHub | No: GitHub aloja repositorios **Git**, no reemplaza la herramienta |
| Competidores | (Git no tiene competidor: es el estándar) | [GitLab](https://gitlab.com), [Bitbucket](https://bitbucket.org), Azure Repos (ver [Azure DevOps](/?c=ci-cd&p=azure-devops-plateforme)): plataformas diferentes, todas construidas sobre Git |

> **Trampa:** usar "Git" y "GitHub" como sinónimos. Un repositorio Git puramente local (nunca subido a ningún sitio) es un repositorio Git perfectamente válido, sin ninguna relación con GitHub. Al revés, un repositorio alojado en GitHub sigue siendo un repositorio Git ordinario; todos los comandos del capítulo [Los repositorios remotos](/?c=git&p=remotes) (`push`, `pull`, `fetch`, `clone`) se aplican de forma idéntica.

## Un repositorio en GitHub: un remote, más una página web

Añadir GitHub como [remote](/?c=git&p=remotes) de un repositorio local no difiere en nada técnicamente de añadir cualquier otro remote:

```bash
git remote add origin https://github.com/usuario/proyecto.git
git push -u origin main
```

Lo que GitHub añade encima de este simple almacenamiento: una **página web** para el repositorio (archivos navegables, `README.md` mostrado automáticamente como página de inicio del proyecto), un historial consultable sin terminal, y las herramientas de colaboración detalladas más abajo.

> **Nota (autenticación):** GitHub ya no acepta una contraseña clásica para `git push` en HTTPS. Hace falta o bien un **token de acceso personal** (*Personal Access Token*, generado desde los ajustes de la cuenta, usado en lugar de la contraseña), o bien una **clave SSH**: un par de dos archivos generados juntos (una clave privada, guardada en secreto en tu máquina, y una clave pública, registrada en tu cuenta de GitHub) que permiten demostrar tu identidad sin transmitir nunca una contraseña. Sin uno de los dos, `git push` falla con un error de autenticación, incluso con el nombre de usuario y la contraseña correctos de la cuenta.

## Las herramientas de colaboración añadidas por GitHub

Más allá del alojamiento, GitHub añade tres familias de herramientas, cada una detallada en su propio capítulo en lugar de resumida aquí:

| Herramienta | Papel | Capítulo dedicado |
|---|---|---|
| **Pull request** | Proponer un cambio (una rama) para revisión antes de integrarlo | [Las pull requests en GitHub](/?c=git&p=pull-requests-github) |
| **Fork** | Copiar un repositorio que no controlas, para poder contribuir vía una pull request | [Las pull requests en GitHub](/?c=git&p=pull-requests-github) (el fork solo tiene sentido para este caso de uso) |
| **Issue** | Seguir un bug, una tarea, una discusión, sin código asociado | [Issues y gestión de proyecto en GitHub](/?c=git&p=issues-et-projets-github) |
| **GitHub Actions** | Automatizar build/tests/despliegue | [Azure Pipelines frente a GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions) (comparación detallada ya disponible) |

## Visibilidad: repositorio público o privado

Un repositorio **público** es visible y clonable por cualquiera en internet, con o sin cuenta de GitHub. Un repositorio **privado** solo es visible para las cuentas explícitamente autorizadas.

> **Trampa:** subir un secreto (clave de API, contraseña, archivo `.env`) a un repositorio público, aunque sea brevemente y luego eliminado en un commit siguiente: el commit que contiene el secreto sigue siendo consultable en el historial Git mientras no se haya reescrito explícitamente (ver [La arquitectura interna de Git](/?c=git&p=architecture-interne)), y un repositorio público puede haber sido clonado por cualquiera mientras tanto.
>
> **Buena práctica:** excluir los secretos vía [`.gitignore`](/?c=git&p=gitignore) antes del primerísimo commit que los concierne; si un secreto ya se subió, considerarlo comprometido y revocarlo/regenerarlo del lado del servicio en cuestión, no solo eliminarlo del repositorio.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | GitHub es un servicio que aloja repositorios Git (un remote como cualquier otro, más una página web) y añade herramientas de colaboración detalladas en sus propios capítulos: pull requests y forks, issues, GitHub Actions. Git funciona independientemente de GitHub. |
| **Herramientas utilizables** | Token de acceso personal o clave SSH para la autenticación. |
| **Trampas a evitar** | Confundir Git y GitHub. Subir un secreto a un repositorio público. |
| **Buenas prácticas** | Excluir los secretos vía `.gitignore` antes del primer commit que los concierne. |
