---
order: 10
---

# Las pull requests en GitHub

La **pull request** (PR) es el mecanismo central de colaboración en [GitHub](/?c=git&p=github-et-plateformes): una solicitud explícita, "aquí hay commits en mi rama, por favor revísalos e intégralos en la tuya." Se apoya enteramente en las [ramas](/?c=git&p=branches) Git ordinarias, sin añadir nada del lado de Git en sí.

## El flujo de trabajo básico

```text
1. Crear una rama dedicada al cambio (ver Las ramas)
2. Commitear y subir esta rama a GitHub
3. Abrir una pull request: rama origen -> rama destino (a menudo main)
4. Una o varias personas revisan, comentan, piden cambios
5. Una vez aprobada: la pull request se fusiona (merge)
```

```bash
git checkout -b correccion-visualizacion
# ... modificaciones, commits ...
git push -u origin correccion-visualizacion
# -> la apertura de la pull request se hace después en el sitio de GitHub, no en línea de comandos
```

> **Nota:** una pull request no es un objeto Git: solo existe en la base de datos de GitHub (metadatos, comentarios, historial de revisión). El único objeto Git implicado es la rama en sí; eliminar la pull request en GitHub no borra ningún commit.

## El fork: contribuir a un repositorio que no controlas

Abrir una pull request supone poder subir una rama al repositorio destino. Para un repositorio de otra persona, un **fork** crea primero una copia completa en tu propia cuenta, con permisos totales:

```text
Repositorio original (ej. github.com/proyecto/herramienta)
       │  botón "Fork"
       ▼
Tu copia (ej. github.com/tu/herramienta)  <-- tienes permisos totales aquí
       │  git clone
       ▼
Copia local en tu máquina
```

| | `fork` | `clone` |
|---|---|---|
| Dónde | En GitHub (crea un nuevo repositorio remoto, en tu cuenta) | En tu máquina (crea una copia local) |
| Necesario para | Contribuir a un repositorio donde no tienes permisos de escritura | Trabajar localmente en cualquier repositorio, incluido el tuyo |
| Vínculo con el original | Conserva un vínculo (`upstream`) con el repositorio de origen | Ningún vínculo particular: es solo una copia |

Una vez clonado el fork, la pull request se hace desde una rama del fork hacia el repositorio de origen: GitHub reconoce el vínculo entre ambos y propone ese destino automáticamente.

> **Trampa:** creer que un fork se actualiza automáticamente cuando el repositorio de origen evoluciona. Un fork es una copia fija en el momento en que se crea: sin acción explícita, se queda atrás respecto al original.
>
> **Buena práctica:** añadir el repositorio de origen como segundo [remote](/?c=git&p=remotes) (llamado por convención `upstream`) y resincronizarlo regularmente: `git remote add upstream https://github.com/proyecto/herramienta.git`, luego `git fetch upstream` y fusionar sus cambios, **antes** de crear una nueva rama de trabajo.

## Pull request en borrador (*draft*)

Una pull request puede abrirse en modo **borrador** (*draft*): visible y discutible, pero marcada explícitamente como aún no lista para fusionarse, ni siquiera totalmente revisada. Útil para compartir un trabajo en curso (obtener feedback pronto, hacer correr las verificaciones automáticas) sin dar a entender que está terminado.

## Pedir una revisión

Una pull request puede designar explícitamente a una o varias personas como **reviewers**. Cada revisión termina en un estado:

| Estado de revisión | Significado |
|---|---|
| *Approve* | El cambio está validado, listo para fusionarse (sujeto a las demás reglas vigentes) |
| *Request changes* | Se piden modificaciones antes de fusionar; bloquea la fusión si reglas de protección lo exigen (sección siguiente) |
| *Comment* | Observaciones sin validación ni bloqueo explícito |

## Proteger una rama: aceptar solo cambios revisados

Una **regla de protección de rama** (*branch protection rule*) impide subir directamente a una rama sensible (típicamente `main`), e impone condiciones antes de que una pull request pueda fusionarse:

| Condición habitual | Efecto |
|---|---|
| Exigir al menos una revisión aprobada | La fusión queda bloqueada mientras no se haya dado ningún *Approve* |
| Exigir que las verificaciones automáticas pasen | La fusión queda bloqueada mientras la [CI/CD](/?c=ci-cd&p=pipeline-cicd) (tests, build) no haya tenido éxito en la última versión de la rama |
| Prohibir el push directo | Todo cambio en esta rama debe pasar obligatoriamente por una pull request, sin excepción |

> **Trampa:** confiar únicamente en la disciplina del equipo ("nunca subimos directamente a `main`") sin regla de protección técnica. Nada impide entonces un push directo accidental, ni una fusión prematura de una pull request aún no aprobada.
>
> **Buena práctica:** activar una regla de protección en toda rama destinada a permanecer estable, en lugar de apoyarse únicamente en una convención de equipo no técnica.

## Las tres formas de fusionar una pull request

GitHub ofrece tres estrategias de fusión, con un efecto diferente sobre el historial final:

| Estrategia | Efecto sobre el historial |
|---|---|
| **Merge commit** | Un [commit de fusión con dos padres](/?c=git&p=branches), que conserva todos los commits individuales de la rama, con su detalle |
| **Squash and merge** | Todos los commits de la rama se agrupan en **uno solo** sobre la rama destino: historial destino lineal, pero se pierde el detalle de los commits individuales de la pull request |
| **Rebase and merge** | Cada commit de la rama se [reproduce](/?c=git&p=rebase) individualmente en la cima de la rama destino: historial lineal, sin commit de fusión, pero cada commit original sigue siendo distinto |

> **Trampa:** elegir "Squash and merge" para una pull request que contiene varios cambios lógicamente independientes (ej. una corrección de bug **y** una nueva funcionalidad, mezcladas en la misma rama): el squash los funde en un solo commit, haciendo imposible revertir uno sin el otro después.
>
> **Buena práctica:** reservar "Squash and merge" a una pull request cuyos commits individuales no tienen valor propio (correcciones sucesivas del mismo cambio, por ejemplo); preferir "Merge commit" o "Rebase and merge" cuando el historial detallado de la pull request merece conservarse.

## Vincular una pull request a una issue

Incluir `closes #12` (el número de la [issue](/?c=git&p=issues-et-projets-github)) en la descripción de una pull request la cierra automáticamente en cuanto la pull request se fusiona, sin acción manual adicional.

## La trampa del force-push durante una revisión

Reescribir el historial de una rama ya subida (`git commit --amend`, [rebase](/?c=git&p=rebase)) requiere un [`git push --force`](/?c=git&p=remotes) para actualizarla del lado de GitHub.

> **Trampa:** hacer un `push --force` sobre una rama ya revisada por otra persona. Los comentarios de revisión siguen adjuntos a las líneas de código antiguas, potencialmente desaparecidas o desplazadas: un reviewer que vuelve a la pull request puede encontrarse ante un diff completamente diferente del que ya había aprobado, sin saberlo.
>
> **Buena práctica:** evitar reescribir el historial de una rama ya en revisión activa; si es necesario, avisar explícitamente a los reviewers en un comentario de la pull request.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una pull request propone una rama para revisión antes de fusionarla. Un fork permite contribuir a un repositorio externo. Las reglas de protección de rama imponen condiciones (revisión, CI) antes de fusionar. Tres estrategias de fusión (merge commit, squash, rebase) dan un historial final diferente. |
| **Herramientas utilizables** | Pull request en borrador (*draft*), reviewers designados, reglas de protección de rama, `closes #12` para vincular una issue. |
| **Trampas a evitar** | Creer que un fork se actualiza solo. Confiar en la disciplina en lugar de en una regla de protección técnica. Squashear una pull request con commits lógicamente independientes. Force-pushear una rama ya en revisión activa. |
| **Buenas prácticas** | Resincronizar un fork con `upstream` antes de cada nueva rama. Activar una protección de rama en toda rama estable. Elegir la estrategia de fusión según el valor del historial detallado. Avisar a los reviewers antes de un force-push. |
