---
order: 1
---

# Los conceptos básicos de Git

**Git** es un software de *control de versiones*: guarda en memoria el historial completo de las modificaciones de un proyecto, para poder volver a un estado anterior, entender quién cambió qué y por qué, o hacer que varias personas trabajen sobre el mismo código sin sobrescribir su trabajo respectivo. Los comandos que siguen se ejecutan en una [terminal](/?c=bases-de-l-informatique&p=le-terminal).

Git sigue la evolución de un proyecto registrando, en cada instante elegido, una **instantánea** (snapshot) completa del estado de los archivos: al contrario de la idea común, no es una simple lista de diferencias línea por línea, aunque a menudo se visualice así (`git diff`).

## Las tres zonas de trabajo

```text
Directorio de trabajo  -->  Zona de staging  -->  Repositorio (historial)
(working directory)         (index)               (commits)

git add                     git commit
```

| Zona | Función |
|---|---|
| **Directorio de trabajo** | Los archivos tal como existen realmente en el disco, modificables libremente |
| **Zona de staging** (*index*) | Una zona intermedia: las modificaciones que se ha elegido explícitamente incluir en el **próximo** commit |
| **Repositorio** (*repository*) | El historial completo, siendo cada commit una instantánea permanente |

> **Nota:** esta etapa intermedia de staging es una particularidad de Git frente a otros sistemas más antiguos (como [SVN](https://es.wikipedia.org/wiki/Apache_Subversion), no tratado en este sitio): permite elegir con precisión **qué** modificaciones entran en un commit, incluso si varios archivos se modificaron al mismo tiempo.

## Un commit: una instantánea, no una diferencia

Cada commit hace referencia a:
- Una instantánea completa de los archivos seguidos en ese instante.
- Uno o varios commits **padres** (el/los commit(s) anterior(es)).
- Un autor, una fecha, y un mensaje que describe el cambio.
- Un identificador único: un **hash SHA-1** (ej. `a3f9c1d...`), calculado a partir del contenido: dos commits idénticos tendrían el mismo hash, y modificar un commit pasado cambia su hash (y el de todos sus descendientes).

> **SHA-1** (*Secure Hash Algorithm 1*) es una función de hash: transforma un dato de tamaño cualquiera en una huella de tamaño fijo (40 caracteres hexadecimales aquí). Dos propiedades la hacen útil para Git: la misma entrada siempre da la misma huella, y el más mínimo cambio en la entrada produce una huella totalmente diferente. Esto es lo que permite identificar un contenido por su huella, y detectar cualquier alteración del historial.

```text
commit A <-- commit B <-- commit C (HEAD)
```

Cada commit apunta a su padre, formando una cadena: es esta cadena la que constituye el historial del proyecto.

## `HEAD`: dónde estás actualmente

`HEAD` es un puntero que designa el commit en el que estás trabajando actualmente; la mayor parte del tiempo, apunta al último commit de la [rama](/?c=git&p=branches) actual, y avanza automáticamente con cada nuevo commit.

## Archivos seguidos, no seguidos, modificados

```bash
git status
```

`git status` clasifica los archivos del directorio de trabajo en varias categorías: seguidos y sin cambios (nada que reportar), seguidos y modificados (aún no añadidos al staging), en espera en el staging (listos para el próximo commit), o no seguidos, nunca añadidos a Git (véase el capítulo [El archivo .gitignore](/?c=git&p=gitignore)) para excluir voluntariamente ciertos archivos de este seguimiento.

Véase también [Los comandos esenciales](/?c=git&p=commandes-essentielles) para la práctica concreta de este ciclo `add` → `commit`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Git registra instantáneas completas (no diferencias) en tres zonas sucesivas: directorio de trabajo → staging (`git add`) → repositorio (`git commit`). Cada commit tiene un hash SHA-1 único y apunta a su commit padre, formando el historial. `HEAD` designa el commit actualmente activo. |
| **Herramientas utilizables** | `git status` para ver el estado de los archivos; `git add`/`git commit` para hacer avanzar un cambio del directorio de trabajo hacia el repositorio. |
| **Trampas a evitar** | Confundir el staging con un simple borrador: mientras un archivo modificado no se añada (`git add`), no formará parte del próximo commit, aunque el commit se lance justo después. |
| **Buenas prácticas** | Verificar `git status` antes de cada commit para nunca incluir un archivo por error (ni olvidar uno). |
