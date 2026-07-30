---
order: 1
---

# Conceptos básicos de Git

Git realiza un seguimiento de la evolución de un proyecto registrando, en cada momento elegido, una **instantánea** (snapshot) completa del estado de los archivos; contrariamente a lo que se suele creer, no se trata de una simple lista de diferencias línea por línea, aunque a menudo se visualice así (`git diff`).

## Las tres áreas de trabajo

```
Dossier de travail  -->  Zone de staging  -->  Dépôt (historique)
(working directory)      (index)               (commits)

git add                  git commit
```

| Zona | Función |
|---|---|
| **Carpeta de trabajo** | Los archivos tal y como se encuentran realmente en el disco, modificables libremente |
| **Área de preparación** (*índice*) | Un área intermedia: los cambios que se ha decidido explícitamente incluir en la **próxima** confirmación |
| **Repositorio** | El historial completo, donde cada commit es una instantánea permanente |

> **Nota:** esta etapa intermedia de «staging» es una característica distintiva de Git con respecto a otros sistemas más antiguos (como SVN): permite seleccionar con precisión **qué** modificaciones se incluyen en una confirmación, incluso si se han modificado varios archivos al mismo tiempo.

## Un commit: una instantánea, no una diferencia

Cada commit hace referencia a:
- Una instantánea completa de los archivos en seguimiento en este momento.
- Una o varias confirmaciones **padre** (la(s) confirmación(es) anterior(es)).
- Un autor, una fecha y un mensaje que describa el cambio.
- Un identificador único: un **hash SHA-1** (p. ej., `a3f9c1d...`), calculado a partir del contenido; dos commits idénticos tendrían el mismo hash, y modificar un commit anterior cambia su hash (y el de todos sus descendientes).

```
commit A <-- commit B <-- commit C (HEAD)
```

Cada commit apunta a su padre, formando una cadena: es esta cadena la que constituye el historial del proyecto.

## `HEAD` : dónde te encuentras ahora mismo

`HEAD` es un puntero que señala la confirmación en la que estás trabajando actualmente; la mayoría de las veces apunta a la última confirmación de la rama actual (véase el capítulo sobre ramas) y avanza automáticamente con cada nueva confirmación.

## Archivos controlados, no controlados, modificados

```bash
git status
```

`git status` Clasifica los archivos de la carpeta de trabajo en varias categorías: seguidos y sin cambios (nada que señalar), seguidos y modificados (aún no añadidos al staging), en espera en el staging (listos para la próxima confirmación) o no seguidos (nunca añadidos a Git; véase el capítulo sobre «`.gitignore`»).

Véase también el capítulo sobre los comandos esenciales para la práctica concreta de este ciclo `add` → `commit`.
