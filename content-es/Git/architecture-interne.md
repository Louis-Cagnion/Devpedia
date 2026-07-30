---
order: 11
---

# La arquitectura interna de Git

Los comandos que se han visto en los demás capítulos (`add`, `commit`, `branch`...) no son más que la parte visible («porcelana») de un mecanismo de almacenamiento sorprendentemente sencillo: una base de datos clave-valor **direccionada por contenido**, en la que la clave de cada dato es el hash de su propio contenido. Comprender este modelo permite «ver más allá» de cualquier comando de Git y proporciona los elementos básicos necesarios para diseñar un sistema de control de versiones similar.

## Una base de datos indexada por contenido

Cada dato almacenado por Git (el contenido de un archivo, una estructura de carpetas, una confirmación...) se guarda en forma de objeto, identificado únicamente por el hash SHA-1 de su propio contenido:

```
contenu -> SHA-1(contenu) -> clé de stockage
```

```bash
echo "Bonjour" | git hash-object --stdin
# c6b7f... -> siempre el mismo hash para el mismo contenido, independientemente de dónde o cuándo
```

> **Nota:** una **función hash** (en este caso, SHA-1) transforma una entrada de cualquier tamaño en un número de tamaño fijo, de forma determinista (la misma entrada → siempre el mismo resultado) y bien distribuida (dos contenidos, aunque sean muy similares, producen resultados muy diferentes; esto es lo que hace que una colisión accidental sea extremadamente improbable). Véase el capítulo sobre tablas hash (apartado C) para conocer este mecanismo aplicado a una estructura de datos concreta.

En concreto, cada objeto se comprime (zlib, un algoritmo de compresión sin pérdidas) y se almacena en `.git/objects/`, en una ruta derivada de su hash: los dos primeros caracteres hexadecimales forman una subcarpeta, y los 38 restantes, el nombre del archivo (`.git/objects/c6/b7f4a2...`). No es ni más ni menos que una **tabla hash** (véase el capítulo dedicado a ello, apartado C) almacenada directamente en el sistema de archivos; la subcarpeta desempeña la función de un compartimento (*bucket*).

> **Consecuencia directa:** dos archivos con un contenido estrictamente idéntico producen el **mismo** hash y, por lo tanto, el **mismo** objeto almacenado una sola vez —una deduplicación automática y gratuita, propiedad inherente al modelo, no una optimización añadida a posteriori—.

## Los cuatro tipos de objetos

| Tipo | Contenido |
|---|---|
| **blob** | El contenido sin procesar de un archivo: solo los bytes, sin nombre de archivo ni metadatos |
| **árbol** | Una lista de entradas (modo, tipo, nombre, hash): representa una carpeta, y cada entrada apunta a un blob (archivo) o a otro árbol (subcarpeta) |
| **commit** | Un hash del árbol (la instantánea raíz), uno o varios hashes de los commits padres, autor, fecha, mensaje |
| **etiqueta** (anotada) | Un hash de un objeto de referencia (normalmente una confirmación), un mensaje —utilizado por `git tag -a` |

```
commit ---> tree (racine du projet)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (parent)
```

> **Nota:** un blob no conoce su propio nombre de archivo; es el `tree` el que contiene la asociación «este nombre de archivo corresponde a este hash de blob». Por eso, al renombrar un archivo sin cambiar su contenido no se crea ningún blob nuevo: solo cambia el `tree` (y, por consiguiente, el commit).

## ¿Qué hace realmente `git add` y, posteriormente, `git commit`?

1. `git add archivo.txt`: calcula el SHA-1 del contenido del archivo, lo comprime, lo escribe como objeto **blob** en `.git/objects/` y registra una entrada en el índice (`.git/índice`, el nombre real del archivo de la zona de staging) que asocia la ruta del archivo a este hash del blob.
2. `git commit`: construye de forma recursiva los objetos **«tree»** correspondientes al estado actual del índice (un «tree» por carpeta), crea un objeto **«commit»** que apunta al «tree» raíz y al «commit» actual de `HEAD` (que se convierte en su padre) y, a continuación, actualiza la referencia de la rama actual para que apunte a este nuevo «commit».

## Las referencias: simples archivos de texto

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> solo 40 caracteres hexadecimales, nada más
```

Una rama no es, **literalmente, más que** un archivo que contiene un hash de una confirmación. «`git branch nouvelle`» simplemente crea un nuevo archivo en «`.git/refs/heads/`», copiado a partir de la confirmación actual.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD no contiene un hash, sino la RUTA hacia la referencia actual
```

`HEAD` es un puntero a un puntero: cambiar de rama (`git checkout autre-branche`) solo modifica una línea en `.git/HEAD`, que pasa a hacer referencia a otro archivo de `refs/heads/`. En modo *HEAD «detached»* (véase el capítulo sobre las etiquetas), `.git/HEAD` contiene directamente un hash de commit, sin pasar por una referencia con nombre.

## Por qué modificar una confirmación cambia todos sus descendientes

El hash de un commit depende de **todo su contenido**, incluido el hash de su commit padre. Por lo tanto, modificar un commit anterior (mediante un rebase o un «`commit --amend`») cambia su propio hash y, dado que cada commit posterior hace referencia al hash de su padre, su contenido (y, por lo tanto, también sus propios hash) cambia en cadena. Es precisamente este mecanismo el que explica por qué un rebase (véase el capítulo dedicado a ello) genera commits con hashes diferentes a los originales, incluso cuando el contenido de los archivos es idéntico.

## Objetos aislados frente a archivos de paquete

Cada nuevo objeto comienza su vida como un archivo comprimido independiente («*loose object*»). Periódicamente (por `git gc` o automáticamente al realizar un «`push`»), Git agrupa estos objetos en un **«packfile**»: un único archivo de gran tamaño en el que los objetos similares se almacenan en forma de **deltas** (un objeto de referencia completo, seguido de una serie de diferencias en lugar de copias completas), lo que resulta mucho más compacto para un historial voluminoso.

## Fontanería frente a porcelana

Los comandos de uso diario (`add`, `commit`, `merge`...) son la **«porcelana**»: una interfaz intuitiva construida íntegramente sobre comandos de nivel más bajo, la **«fontanería»**, que manipulan directamente los objetos:

```bash
echo "contenu" | git hash-object -w --stdin   # Crea un blob y muestra su hash.
git cat-file -p a3f9c1d                        # muestra el contenido descomprimido de un objeto
git cat-file -t a3f9c1d                        # muestra su tipo (blob/árbol/commit/etiqueta)
git write-tree                                  # crea un objeto «tree» a partir del índice actual
git commit-tree a3f9c1d -m "message"             # crea manualmente un objeto commit
git update-ref refs/heads/main a3f9c1d           # mueve manualmente una rama a una confirmación
```

Un «`git commit`» «normal» no es, en realidad, más que una sucesión de `write-tree`, `commit-tree` y `update-ref`.

## Diseñar tu propio sistema de control de versiones

Los componentes necesarios para un sistema mínimo, en este orden lógico:

1. **Un almacenamiento clave-valor dirigido por contenido**: una función hash (SHA-1, o una más sencilla para un prototipo) + compresión + un sistema de archivos o una tabla hash para almacenar cada objeto bajo su propia clave.
2. **Una estructura de árbol** para representar una instantánea completa de un árbol de carpetas en un momento dado (el «`tree`»).
3. **Objetos de confirmación encadenados** mediante un puntero a su(s) padre(s); es esta cadena la que constituye el historial.
4. **Punteros con nombre y mutables** (las ramas) que apuntan a una confirmación, además de un puntero especial (`HEAD`) que indica «en qué punto nos encontramos» actualmente.
5. **Un algoritmo de comparación** (p. ej., el algoritmo de Myers): necesario únicamente para mostrar diferencias legibles o fusionar ramas, pero no para el propio modelo de almacenamiento, que estructuralmente no lo necesita.
