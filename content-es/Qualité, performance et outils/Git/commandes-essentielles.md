---
order: 2
---

# Los comandos esenciales

Este capítulo cubre el ciclo de trabajo Git más común: inicializar un repositorio (u obtener uno existente), seguir modificaciones, y registrarlas en forma de commits.

## Crear u obtener un repositorio

```bash
git init                                  # convierte el directorio actual en un repositorio Git (vacio, sin historial)
git clone https://ejemplo.com/proyecto.git  # obtiene un repositorio existente, con todo su historial
```

## Ver el estado del directorio de trabajo

```bash
git status
```

Muestra qué archivos están modificados, cuáles están en la zona de staging, y cuáles no están seguidos (véase [Los conceptos básicos de Git](/?c=git&p=concepts-de-base)).

## Añadir modificaciones al staging

```bash
git add archivo.txt  # anade un archivo preciso
git add carpeta/      # anade toda una carpeta
git add .            # anade todo lo que cambio en el directorio actual y sus subdirectorios
git add -p           # modo interactivo: elegir con precision que bloques de lineas anadir
```

> **Nota:** `git add .` también añade los archivos no seguidos: asegúrate de que [.gitignore](/?c=git&p=gitignore) esté actualizado antes, para no añadir accidentalmente archivos que nunca deberían entrar en el historial (secretos, dependencias, archivos generados...).

## Crear un commit

```bash
git commit -m "Corrige el calculo del descuento"
git commit -am "Mensaje"   # atajo: anade automaticamente los archivos ya seguidos Y modificados, sin "git add" previo
```

> **Nota:** `-a` (en `-am`) solo añade los archivos ya seguidos por Git: un archivo completamente nuevo, nunca añadido antes, siempre debe pasar al menos una vez por un `git add` explícito.

Un buen mensaje de commit describe el **por qué** del cambio, no solo el qué (el diff ya muestra qué cambió), útil para entender el historial mucho después.

## Un mensaje de commit en dos niveles: título y descripción

Un mensaje de commit es, para Git, solo un único bloque de texto: nada lo obliga a tener un "título" y una "descripción" separados. Es una **convención**, no una restricción técnica, pero está tan ampliamente adoptada ([GitHub](/?c=git&p=github-et-plateformes), `git log`, la mayoría de las herramientas que muestran un historial) que vale la pena seguirla sistemáticamente:

- La **primera línea** es el título: un resumen corto (tradicionalmente bajo 50-72 caracteres), en imperativo ("Corrige", "Añade", no "Corregido" ni "He añadido").
- Una **línea vacía** separa el título del resto.
- Todo lo que sigue es la **descripción**: el detalle, el contexto, el "por qué" desarrollado, en tantas líneas como sea necesario.

```text
Corrige el calculo del descuento para pedidos multiarticulo

El porcentaje solo se aplicaba al primer articulo del pedido,
en lugar del total: un bug introducido en el ultimo refactor de
`calcularDescuento()`, nunca cubierto por las pruebas existentes.
```

Es esta línea vacía, y solo ella, la que indica a una herramienta como [GitHub](/?c=git&p=github-et-plateformes) dónde termina el título: en la lista de commits de un repositorio o de una pull request, solo se muestra por defecto la primera línea (en negrita); la descripción solo se muestra al desplegar el commit. `git log --oneline` hace lo mismo: una línea por commit, solo el título.

## Escribir un mensaje multilínea en línea de comandos

`git commit -m "mensaje"` con un único `-m` solo produce un título, sin descripción. Tres formas de obtener ambos:

```bash
# 1. Sin -m: abre el editor configurado (vim, nano...), donde escribir titulo, linea vacia, luego descripcion
git commit

# 2. Varios -m: cada uno se convierte en un parrafo separado por una linea vacia, sin abrir editor
git commit -m "Corrige el calculo del descuento" -m "El porcentaje solo se aplicaba al primer articulo, no al total."

# 3. Una cadena multilinea pasada a un solo -m (util para automatizar un commit, o desde una herramienta que genera el mensaje)
git commit -m "$(cat <<'EOF'
Corrige el calculo del descuento

El porcentaje solo se aplicaba al primer articulo, no al total.
EOF
)"
```

> **Nota:** la opción 3 (`$(cat <<'EOF' ... EOF)`) no es una funcionalidad de Git: es un **heredoc**, una sintaxis del shell (véase [Escribir y ejecutar un script Bash](/?c=shells&s=bash&p=scripts-et-shebang)) que construye una cadena multilínea, luego pasada tal cual a `-m`. `$(...)` captura la salida del comando `cat` (aquí, todo lo que está entre los dos `EOF`) para inyectarla como un único argumento.

> **Trampa:** escribir un título de commit demasiado largo, o que describe el *cómo* en lugar del *por qué* ("Modifica línea 42 de carrito.php"). Un título debe ser comprensible por sí solo, aislado en una lista de decenas de otros títulos, sin necesidad de abrir el commit para entender qué hace.
>
> **Buena práctica:** reservar el título para un resumen breve y accionable, y detallar todo contexto útil (por qué este cambio, qué bug, qué alternativa descartada) en la descripción en lugar de alargar el título indefinidamente.

## Consultar el historial

```bash
git log                          # historial completo, del mas reciente al mas antiguo
git log --oneline                # una linea por commit, mas legible para una revision rapida
git log --oneline --graph --all  # visualiza tambien las ramas y sus puntos de divergencia/fusion
git log -p archivo.txt           # historial detallado (con diff) de un archivo preciso
```

## Ver las diferencias

```bash
git diff                  # diferencias aun no anadidas al staging
git diff --staged         # diferencias ya anadidas al staging, aun no commiteadas
git diff commit1 commit2  # diferencias entre dos commits precisos
```

## Ver el detalle de un commit

```bash
git show a3f9c1d   # muestra el mensaje, el autor, la fecha y el diff completo de ese commit preciso
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `git init`/`clone` crean u obtienen un repositorio; `git add` pone modificaciones en staging; `git commit` las registra; `git log`/`diff`/`show` inspeccionan el historial. Un mensaje de commit tiene un título (primera línea) y una descripción opcional, separados por una línea vacía: es esa línea vacía la que GitHub y `git log` usan para mostrar solo el título por defecto. |
| **Herramientas utilizables** | `git status`, `git add`, `git commit` (varios `-m`, o sin `-m` para el editor), `git log`, `git diff`, `git show`. |
| **Trampas a evitar** | `git add .` también añade los archivos no seguidos: verificar `.gitignore` antes; `-am` no añade los archivos nunca seguidos, sigue siendo necesario un `git add` explícito al menos una vez; un título de commit demasiado largo o que describe el *cómo* en lugar del *por qué*. |
| **Buenas prácticas** | Describir el *por qué* del cambio en el mensaje de commit, no solo el *qué*; verificar `git status` antes de cada commit; mantener el título corto y accionable, detallando el contexto en la descripción. |
