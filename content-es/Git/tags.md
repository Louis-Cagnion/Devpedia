---
order: 7
---

# Las tags

Un **tag** es un puntero hacia un commit concreto, como una rama, pero a diferencia de una rama, un tag **nunca se mueve** una vez creado. Sirve típicamente para marcar una versión publicada de un proyecto (`v1.0.0`, `v2.3.1`...).

## Crear un tag

```bash
git tag v1.0.0                                  # tag "ligero": simple puntero, sin metadatos
git tag -a v1.0.0 -m "Primera version estable"  # tag "anotado": con autor, fecha y mensaje
```

> **Nota:** un tag anotado (`-a`) suele ser preferible para una versión publicada real: se registra como un objeto Git de pleno derecho (con su propio mensaje y autor), a diferencia del tag ligero, que no es más que un simple alias hacia un hash de commit.

## Listar e inspeccionar los tags

```bash
git tag            # lista todos los tags
git tag -l "v1.*"  # filtra por patron
git show v1.0.0    # muestra los detalles del tag (y el commit asociado)
```

## Taguear un commit pasado

```bash
git tag -a v0.9.0 a3f9c1d -m "Version beta"   # taguea un commit concreto, no necesariamente el mas reciente
```

## Enviar tags a un remote

Los tags **no** se envían automáticamente con un `git push` clásico:

```bash
git push origin v1.0.0  # envia un tag concreto
git push origin --tags  # envia todos los tags locales de una vez
```

## Eliminar un tag

```bash
git tag -d v1.0.0                # elimina localmente
git push origin --delete v1.0.0  # tambien elimina del lado del remote
```

## Volver a una versión tagueada

```bash
git checkout v1.0.0
```

> **Nota:** esto coloca el repositorio en estado de **"detached HEAD"** (`HEAD` apunta directamente a un commit, ya no a una rama), útil para inspeccionar esta versión concreta, pero cualquier commit nuevo hecho en este estado no pertenecería a ninguna rama y se perdería fácilmente. Para seguir trabajando desde ahí, crear primero una rama: `git checkout -b nueva-rama v1.0.0`.

**Volver atrás una vez terminada la inspección.** Si no se hizo ningún commit durante el detached HEAD (el caso más común tras una simple inspección), basta con volver a la rama de la que se venía para que `HEAD` se reconecte a ella, exactamente como cualquier [cambio de rama](/?c=git&p=branches):

```bash
git checkout main   # o: git switch main
```

Nada se pierde ni hay que deshacer: el commit tagueado nunca fue modificado, y `HEAD` simplemente retoma su lugar normal, apuntando a `main` en lugar de directamente a un commit.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un tag es un puntero fijo hacia un commit; a diferencia de una rama, nunca se mueve. Sirve típicamente para marcar una versión publicada. |
| **Herramientas utilizables** | `git tag`, `git tag -a`, `git push origin --tags`. |
| **Trampas a evitar** | Los tags no se envían automáticamente con un `git push` clásico; moverse a un tag coloca en *detached HEAD*. |
| **Buenas prácticas** | Preferir un tag anotado (`-a`) para una versión publicada real; crear una rama antes de seguir trabajando a partir de un tag. |
