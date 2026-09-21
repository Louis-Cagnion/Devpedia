---
order: 10
---

# Zsh

Zsh (*Z shell*) es, como [Bash](/?c=shells&s=bash&p=bash), un shell compatible con [POSIX](/?c=shells&s=bash&p=scripts-et-shebang): la casi totalidad de lo visto en la sección Bash (variables, condiciones, bucles, funciones, redirecciones y tuberías, permisos y archivos, gestión de procesos, procesamiento de texto) funciona **de forma idéntica** en zsh, sintaxis incluida -- salvo un par de divergencias puntuales y silenciosas, detalladas más abajo. Es además el shell por defecto en macOS desde 2019, y una opción habitual en Linux por su comodidad de uso interactivo.

> **Lo que se cubre aquí:** únicamente lo que realmente difiere de Bash o lo que no existe en absoluto en Bash: los archivos de inicio, el sistema de opciones (`setopt`), el globbing extendido, la finalización avanzada, la personalización del prompt, el framework **Oh My Zsh**, y dos divergencias de comportamiento que rompen silenciosamente un script de Bash trasladado tal cual (véase más abajo). Para todo lo demás (variables, condiciones, bucles, funciones, redirecciones, permisos, procesos, procesamiento de texto), los capítulos del sujeto Bash se aplican directamente.

## En qué difiere realmente zsh de Bash

Zsh añade por encima de la base POSIX (compartida con Bash) varias capas de comodidad orientadas al uso **interactivo** más que al scripting puro:

- una finalización por tabulación notablemente más rica (menús navegables, finalización contextual por comando);
- un globbing más potente, activable con `setopt extendedglob`;
- un sistema de personalización del prompt independiente del de Bash (`PROMPT` en lugar de `PS1`, con sus propios códigos de escape);
- un sistema de opciones con nombre (`setopt`/`unsetopt`) más legible que las opciones puntuales de Bash (`shopt`, `set -o`);
- un ecosistema de frameworks de configuración, del cual **Oh My Zsh** es el más extendido.

## Dos divergencias que rompen silenciosamente un script de Bash trasladado tal cual

A diferencia de las comodidades anteriores (globbing, finalización...), estos dos puntos cambian el **resultado** de un script idéntico según el shell que lo ejecute, sin ningún error ni aviso -- el script se ejecuta, pero no como se esperaba.

### El troceado de palabras en una variable sin comillas

En [Bash](/?c=shells&s=bash&p=bash), una variable escalar sin comillas (`$var`) se trocea por espacios (*word splitting*), igual que una sustitución de comandos (`$(cmd)`). En zsh, solo la sustitución de comandos sigue troceándose: una variable escalar sin comillas sigue siendo una **cadena única**, espacios incluidos.

```bash
pasos="uno dos tres"

for p in $pasos; do
    echo "$p"
done
```

| Shell | Resultado del bucle |
|---|---|
| Bash | 3 vueltas: `uno`, luego `dos`, luego `tres` (`$pasos` troceado por espacios) |
| Zsh | 1 sola vuelta: `uno dos tres` (cadena completa, sin trocear) |

> **Buena práctica:** nunca depender de este troceado implícito, en ninguno de los dos shells. Usar un array real (`pasos=(uno dos tres)`, luego `for p in "${pasos[@]}"`) hace el comportamiento idéntico y explícito en ambos lados.

### Aritmética en coma flotante nativa

En Bash, la aritmética `$(( ))` solo maneja enteros: una división como `$((1 / 2))` trunca el resultado (`0`), y una expresión con un número decimal literal falla. En zsh, `$(( ))` maneja de forma nativa números en coma flotante:

```zsh
echo $((1 / 2))       # 0 en Bash (división entera) -- 0.5 en zsh
echo $((0.53 / 1))    # error en Bash -- 0.53 en zsh
```

> **Trampa:** un script escrito y probado en zsh puede por tanto producir silenciosamente un resultado numérico distinto (o un error) al ejecutarse con `bash script.sh` o mediante un `#!/bin/bash` explícito. Para un cálculo decimal portable, usar [`bc`](https://www.gnu.org/software/bc) o `awk` en lugar de `$(( ))`, sea cual sea el shell de destino.

A continuación encontrarás los distintos capítulos:
