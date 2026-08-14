---
order: 14
---

# La arquitectura interna de Git

Los comandos vistos en los demás capítulos (`add`, `commit`, `branch`...) no son más que la parte visible ("porcelain") de un mecanismo de almacenamiento sorprendentemente simple: una base de datos clave-valor **direccionada por contenido**, donde la clave de cada dato es el hash de su propio contenido. Comprender este modelo permite "ver a través" de cualquier comando de Git, y da las piezas necesarias para diseñar un sistema de control de versiones similar.

## Una base de datos direccionada por contenido

Cada dato almacenado por Git (el contenido de un archivo, una estructura de carpetas, un commit...) se guarda en forma de un **objeto**, identificado únicamente por el hash SHA-1 de su propio contenido:

```text
contenido -> SHA-1(contenido) -> clave de almacenamiento
```

```bash
echo "Hola" | git hash-object --stdin
# c6b7f... -> siempre el mismo hash para el mismo contenido, sin importar donde/cuando
```

> **Nota:** una **función de hash** (aquí SHA-1) transforma una entrada de tamaño cualquiera en un número de tamaño fijo, de forma determinista (misma entrada → siempre el mismo resultado) y bien distribuida (dos contenidos, incluso muy parecidos, producen resultados muy diferentes: esto es lo que hace que una colisión accidental sea extremadamente improbable). Véase [Las tablas hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage) para este mecanismo aplicado a una estructura de datos concreta.

En concreto, cada objeto se comprime ([zlib](https://zlib.net), un algoritmo de compresión sin pérdida) y se almacena en `.git/objects/`, bajo una ruta derivada de su hash: los 2 primeros caracteres hexadecimales forman una subcarpeta, los 38 restantes el nombre del archivo (`.git/objects/c6/b7f4a2...`). No es ni más ni menos que una [tabla hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage) almacenada directamente en el sistema de archivos: la subcarpeta cumple el rol de una casilla (*bucket*).

> **Consecuencia directa:** dos archivos con un contenido estrictamente idéntico producen el **mismo** hash, y por lo tanto el **mismo** objeto almacenado una sola vez, una deduplicación automática y gratuita, propiedad inherente al modelo, no una optimización añadida después.

## Los cuatro tipos de objetos

| Tipo | Contenido |
|---|---|
| **blob** | El contenido bruto de un archivo: solo los bytes, sin nombre de archivo ni metadatos |
| **tree** | Una lista de entradas (modo, tipo, nombre, hash): representa una carpeta, cada entrada apunta a un blob (archivo) u otro tree (subcarpeta) |
| **commit** | Un hash de tree (la instantánea raíz), uno o varios hash de commit(s) padre(s), autor, fecha, mensaje |
| **tag** (anotado) | Un hash de un objeto apuntado (generalmente un commit), un mensaje, usado por `git tag -a` |

```text
commit ---> tree (raiz del proyecto)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (padre)
```

> **Nota:** un blob no conoce **su propio** nombre de archivo: es el `tree` el que contiene la asociación "este nombre de archivo corresponde a este hash de blob". Por eso renombrar un archivo sin cambiar su contenido no crea ningún blob nuevo: solo cambia el `tree` (y por lo tanto, en cascada, el commit).

## Lo que realmente hace `git add` y luego `git commit`

1. `git add archivo.txt`: calcula el SHA-1 del contenido del archivo, lo comprime, lo escribe como objeto **blob** en `.git/objects/`, y registra una entrada en el **índice** (`.git/index`, el nombre real del archivo de la zona de staging) que asocia la ruta del archivo a ese hash de blob.
2. `git commit`: construye recursivamente los objetos **tree** correspondientes al estado actual del índice (un tree por carpeta), crea un objeto **commit** que apunta al tree raíz y al commit actual de `HEAD` (que se convierte en su padre), luego actualiza la referencia de la rama actual para que apunte a este nuevo commit.

## Las refs: simples archivos de texto

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> solo 40 caracteres hexadecimales, nada mas
```

Una rama no es **literalmente nada más** que un archivo que contiene un hash de commit. `git branch nueva` simplemente crea un nuevo archivo en `.git/refs/heads/`, copiado desde el commit actual.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD no contiene un hash, sino la RUTA hacia la ref actual
```

`HEAD` es un puntero hacia un puntero: cambiar de rama (`git checkout otra-rama`) solo modifica una línea en `.git/HEAD`, que pasa a referenciar otro archivo de `refs/heads/`. En modo *detached HEAD* (véase [Las tags](/?c=git&p=tags)), `.git/HEAD` contiene directamente un hash de commit, sin pasar por una ref con nombre.

## Por qué modificar un commit cambia todos sus descendientes

El hash de un commit depende de **todo su contenido**, incluyendo el hash de su commit padre. Modificar un commit antiguo (vía un rebase o un `commit --amend`) cambia entonces su propio hash, y como cada commit siguiente referencia el hash de su padre, su contenido (y por lo tanto su propio hash también) cambia en cascada. Es exactamente este mecanismo el que explica por qué un [rebase](/?c=git&p=rebase) produce commits con hashes diferentes de los originales, incluso con contenido de archivo idéntico.

## Objetos sueltos vs packfiles

Cada objeto nuevo empieza su vida como un archivo comprimido independiente ("*loose object*"). Periódicamente (`git gc`, o automáticamente durante un `push`), Git agrupa estos objetos en un **packfile**: un único archivo grande donde los objetos similares se almacenan en forma de **deltas** (un objeto completo de referencia, luego una serie de diferencias en lugar de copias completas), mucho más compacto para un historial voluminoso.

## Plumbing vs porcelain

Los comandos del día a día (`add`, `commit`, `merge`...) son el **porcelain**: una interfaz amigable construida enteramente sobre comandos de más bajo nivel, el **plumbing**, que manipulan directamente los objetos:

```bash
echo "contenido" | git hash-object -w --stdin  # crea un blob, muestra su hash
git cat-file -p a3f9c1d                        # muestra el contenido descomprimido de un objeto
git cat-file -t a3f9c1d                        # muestra su tipo (blob/tree/commit/tag)
git write-tree                                 # construye un objeto tree desde el indice actual
git commit-tree a3f9c1d -m "mensaje"           # crea manualmente un objeto commit
git update-ref refs/heads/main a3f9c1d         # mueve manualmente una rama hacia un commit
```

Un `git commit` "normal" no es, bajo el capó, más que un encadenamiento de `write-tree`, `commit-tree` y `update-ref`.

## Reescribir todo el historial: purgar un archivo de cada commit

Un `rebase` o un `commit --amend` solo reescriben los commits **posteriores** al punto modificado. A veces hay que ir más lejos: retirar un archivo (secreto, binario grande...) de **cada** commit donde existió, del primero al último: un simple `rm` + nuevo commit no basta, ya que el archivo sigue siendo legible en los commits anteriores.

```bash
git filter-branch --index-filter "git rm --cached --ignore-unmatch secreto.pem" --prune-empty -- --all
```

`--index-filter` repite este comando sobre el índice de **cada** commit del historial (sobre todas las refs, vía `--all`), reconstruye un nuevo tree sin el archivo, luego un nuevo commit, lo que, por el mecanismo visto arriba (el hash de un commit depende del de su padre), cambia el hash de **todos** los commits a partir del primero afectado.

> **Nota:** `git filter-branch` está oficialmente obsoleto en favor de [`git filter-repo`](https://github.com/newren/git-filter-repo) (más rápido, menos trampas), pero este último no viene incluido con Git: requiere una instalación separada ([Python](/?c=langages-de-programmation&s=python&p=python)). `filter-branch` sigue disponible en cualquier lugar donde Git esté instalado, suficiente para una operación puntual.

Consecuencias directas de este cambio de hash en cadena:
- Cualquier clon o fork existente del repositorio divergerá irremediablemente de la nueva versión: un push normal será rechazado, un `push --force`/`--force-with-lease` (véase [Los repositorios remotos](/?c=git&p=remotes)) es necesario, y cualquiera que ya haya clonado el repositorio debe volver a clonar o reiniciar duramente su copia.
- Siempre hacer un respaldo completo (`git bundle create ... --all`, véase [Los repositorios remotos](/?c=git&p=remotes)) **antes** de lanzar una reescritura de este tipo: un error en el filtro es tan irreversible como la propia operación.

## Objetos inalcanzables: una eliminación nunca es inmediata

Tras una reescritura de historial (o un simple `reset --hard`), los commits antiguos ya no están referenciados por ninguna rama, pero sus objetos siguen físicamente presentes en `.git/objects/`. Dos mecanismos los mantienen aún con vida:

- `git filter-branch` conserva por sí mismo un respaldo automático en `refs/original/` (a eliminar explícitamente con `git update-ref -d refs/original/refs/heads/main`, una vez que se tiene la certeza de no necesitarlo más).
- El **reflog** (véase [Deshacer cambios y navegar por el historial](/?c=git&p=annuler-et-historique)) guarda un registro de cada commit antiguo durante varias semanas por defecto, incluso sin ninguna ref apuntándole.

Un objeto solo se elimina realmente del repositorio local cuando ya nada lo retiene:

```bash
git reflog expire --expire=now --all  # vacia inmediatamente el reflog de todas las refs (en lugar de esperar la expiracion por defecto)
git gc --prune=now                    # elimina todo objeto vuelto inalcanzable ("unreachable")
git fsck --unreachable                # lista los objetos aun presentes pero no referenciados por ninguna rama/tag/reflog
```

> **Nota:** esta limpieza solo concierne al repositorio **local**. Un repositorio remoto ([GitHub](/?c=git&p=github-et-plateformes), GitLab...) aplica su propio `gc` según su propio calendario: tras un `push --force` que retira un archivo sensible del historial, el commit antiguo puede seguir siendo accesible del lado del servidor vía su hash exacto (una consulta puntual, no una navegación normal) hasta que el servidor haga su propia limpieza. Para una garantía de eliminación inmediata del lado del servidor, solo el soporte de la plataforma puede actuar.

## Diseñar tu propio sistema de control de versiones

Las piezas necesarias para un sistema mínimo, en este orden lógico:

1. **Un almacenamiento clave-valor direccionado por contenido**: una función de hash (SHA-1, o más simple para un prototipo) + compresión + un sistema de archivos o una tabla hash para almacenar cada objeto bajo su propia clave.
2. **Una estructura de árbol** para representar una instantánea completa de un árbol de carpetas en un momento dado (el `tree`).
3. **Objetos commit encadenados** por un puntero hacia su(s) padre(s): es esta cadena la que constituye el historial.
4. **Punteros con nombre y mutables** (las ramas) apuntando a un commit, más un puntero especial (`HEAD`) que indica "dónde estamos" actualmente.
5. **Un algoritmo de diff**: necesario únicamente para mostrar diferencias legibles o fusionar ramas, pero no para el modelo de almacenamiento en sí, que estructuralmente no lo necesita. [El algoritmo de Myers](https://en.wikipedia.org/wiki/Diff#Algorithm), usado por Git, encuentra la secuencia más corta de adiciones/eliminaciones de líneas que transforma un texto en otro: es esto lo que hace que un `git diff` muestre un cambio mínimo y legible en lugar de "eliminar todo y reescribir todo".

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Git almacena cada dato como un objeto identificado por el hash de su propio contenido (blob, tree, commit, tag). Los comandos del día a día ("porcelain") son solo una interfaz sobre este modelo de almacenamiento de bajo nivel ("plumbing"). |
| **Herramientas utilizables** | `git hash-object`, `git cat-file`, `git write-tree`, `git commit-tree`, `git update-ref`, `git fsck --unreachable`. |
| **Trampas a evitar** | Reescribir el historial (`filter-branch`) sin respaldo previo: un error en el filtro es tan irreversible como la propia operación. |
| **Buenas prácticas** | Siempre respaldar (`git bundle`) antes de una reescritura de historial; verificar `git fsck --unreachable` antes de dar un objeto por definitivamente perdido. |
