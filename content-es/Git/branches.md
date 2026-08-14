---
order: 4
---

# Las ramas

Una **rama** es simplemente un puntero móvil hacia un commit: permite hacer evolucionar una versión del código (una nueva funcionalidad, una corrección) sin tocar la rama principal, y luego reunir las dos líneas de trabajo más tarde.

## Crear y cambiar de rama

```bash
git branch                            # lista las ramas existentes, la actual esta marcada con un *
git branch nueva-funcionalidad        # crea una nueva rama, sin cambiar a ella
git checkout nueva-funcionalidad      # cambia a esta rama
git checkout -b nueva-funcionalidad   # atajo: crea Y cambia en un solo comando

git switch nueva-funcionalidad     # equivalente moderno de "checkout" para cambiar de rama
git switch -c nueva-funcionalidad  # equivalente moderno de "checkout -b"
```

> **Nota:** `git switch` (más reciente) y `git checkout` (histórico, más versátil pero menos explícito) hacen aquí lo mismo: `checkout` también sirve para otros usos (restaurar un archivo, véase [Deshacer cambios y navegar por el historial](/?c=git&p=annuler-et-historique)), lo que lo hace más ambiguo de leer.

## Lo que realmente ocurre al cambiar de rama

Cada rama es un simple puntero hacia un commit preciso. Cambiar de rama mueve `HEAD` hacia ese puntero, y Git actualiza el directorio de trabajo para que corresponda exactamente a la instantánea de ese commit:

```text
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (si estamos en "feature")
```

## Fusionar una rama (`merge`)

```bash
git checkout main
git merge feature
```

Lo que Git hace depende de una sola pregunta: **¿`main` recibió nuevos commits desde la creación de `feature`?** La respuesta determina si es necesaria una verdadera fusión (con un nuevo commit), o si Git puede limitarse a hacer que `main` "alcance" a `feature`.

**Fast-forward: `main` no se movió, no hay nada que reunir.** Todos los commits de `feature` (`C`, `D`) ya descienden directamente del último commit de `main` (`B`): el historial de `feature` ya **contiene** todo el historial de `main`, sin ninguna divergencia. Fusionar entonces solo requiere una cosa: hacer avanzar el puntero `main` hasta `D`, exactamente como se avanzaría el marcapáginas de un libro. No ocurre ninguna combinación de contenido, así que no se necesita ningún commit de fusión:

```text
Antes:   main: A -- B                    feature: A -- B -- C -- D
                    ^main                                        ^feature

Despues: main: A -- B -- C -- D          (main simplemente se realinea con feature)
                              ^main, feature
```

**Merge commit: `main` evolucionó por su lado, hay que reunir realmente dos historias.** Si `main` recibió su propio commit (`E`) mientras `feature` avanzaba con `C`/`D`, las dos ramas **divergieron**: ninguna de las dos contiene ya el historial de la otra, así que "avanzar un puntero" ya no basta. Git debe crear un nuevo commit que tenga **dos padres** a la vez (el último commit de `main` y el de `feature`), la única forma de representar "aquí hay un punto del historial que reúne estas dos líneas de trabajo":

```text
Antes:   main:     A -- B -- E                    feature: A -- B -- C -- D
                             ^main

Despues: main:     A -- B -- E ------- F (merge commit, dos padres)
                        \             /
         feature:        C --------- D
                                      ^feature
```

## Eliminar una rama

```bash
git branch -d feature  # elimina, solo si la rama ya fue fusionada (seguridad)
git branch -D feature  # fuerza la eliminacion, aunque nunca haya sido fusionada
```

> **Nota:** `git branch -D` en una rama nunca fusionada puede hacer perder el acceso a commits que ya no existen en ningún otro lugar. Generalmente siguen siendo recuperables por un tiempo vía `git reflog` (véase [Deshacer cambios y navegar por el historial](/?c=git&p=annuler-et-historique)), pero es mejor verificar con `git log feature` (o una fusión/`git branch -d`) antes de forzar la eliminación.

Véase también [El rebase](/?c=git&p=rebase), una alternativa al merge para integrar cambios sin commit de fusión, y [Resolver un conflicto de fusión](/?c=git&p=resoudre-conflits), para el caso en que ambas ramas hayan modificado las mismas líneas.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una rama es un puntero móvil hacia un commit. `git merge` reúne dos ramas: avance simple (*fast-forward*) si es posible, si no, un commit de fusión con dos padres. |
| **Herramientas utilizables** | `git branch`, `git switch`/`checkout`, `git merge`. |
| **Trampas a evitar** | `git branch -D` en una rama nunca fusionada puede hacer difícil recuperar sus commits. |
| **Buenas prácticas** | Preferir `-d` (seguro, rechaza si no está fusionada) a `-D`; usar `switch` en lugar de `checkout` para cambiar de rama, menos ambiguo de leer. |
