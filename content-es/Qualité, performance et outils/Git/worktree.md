---
order: 15
---

# El worktree: varias ramas abiertas a la vez

Un directorio de trabajo Git clásico solo tiene una rama extraída (*checked out*) a la vez: cambiar de rama reemplaza el contenido del directorio por el de la rama destino. Un **worktree** es un directorio de trabajo adicional, conectado al mismo repositorio, con su propia rama extraída aparte: varias ramas quedan así disponibles a la vez, cada una en su propia carpeta.

## El problema que resuelve el worktree

Una funcionalidad está a medio terminar en `feature`, y cae un bug urgente en `main`. Cambiar de rama para corregir el bug obliga a elegir entre confirmar (`commit`) un trabajo incompleto, o usar un [`git stash`](/?c=git&p=stash) que pone todo a un lado mientras dura la corrección. Un worktree evita esa elección: la corrección se hace en una segunda carpeta, mientras la primera mantiene `feature` intacta.

```text
Sin worktree                         Con worktree
una carpeta, una rama                una carpeta por rama, en paralelo
a la vez -> stash para cambiar       mi-proyecto/         (main)
                                      mi-proyecto-hotfix/  (hotfix)
                                      mi-proyecto-feature/ (feature)
```

## Crear, listar y retirar un worktree

```bash
git worktree add ../mi-proyecto-hotfix hotfix   # crea una carpeta, rama "hotfix" extraida
git worktree list                               # lista los worktrees del repo y su rama
git worktree remove ../mi-proyecto-hotfix       # retira un worktree terminado
```

`git worktree add` también acepta una rama que aún no existe (`-b nueva-rama`), creada al vuelo desde el commit actual.

## Historial compartido, archivos de trabajo separados

Todos los worktrees de un repositorio comparten el mismo historial (`.git`): no hace falta clonar el repositorio entero para cada rama. Solo los archivos de trabajo (directorio de trabajo + índice) son propios de cada worktree.

> **Trampa:** el historial es compartido, pero no las dependencias instaladas (`node_modules`, un entorno virtual Python...). Cada worktree mantiene su propia copia de esas carpetas, lo que consume espacio en disco y exige reinstalar por worktree.

> **Nota:** una fusión entre dos ramas de worktrees distintos sigue siendo un merge Git ordinario, con los mismos conflictos posibles que entre dos ramas de un único directorio de trabajo. El worktree aísla el trabajo en curso, nunca exime de resolver un conflicto real al fusionar.

## Caso de uso típico: varios agentes en paralelo

Un uso cada vez más frecuente: dar a cada agente que programa en paralelo (o a cada tarea independiente) su propio worktree, para que ninguno modifique nunca archivos en los que otro ya está trabajando:

```bash
git worktree add ../proyecto-auth autenticacion
git worktree add ../proyecto-facturacion facturacion
# un agente trabaja en cada carpeta, sin pisarse nunca entre ellos
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un worktree es un directorio de trabajo adicional conectado al mismo repositorio, con su propia rama extraída. Varias ramas quedan así abiertas a la vez, sin `stash` ni clon aparte: solo el historial es compartido, los archivos de trabajo (dependencias instaladas incluidas) siguen siendo propios de cada worktree. |
| **Herramientas utilizables** | `git worktree add`/`list`/`remove`. |
| **Trampas a evitar** | Creer que las dependencias instaladas (`node_modules`...) se comparten entre worktrees: cada uno tiene su propia copia que reinstalar. |
| **Buenas prácticas** | Dar un worktree separado a cada rama/tarea llevada en paralelo (un hotfix urgente, varios agentes programando a la vez), en lugar de encadenar `stash`. |
