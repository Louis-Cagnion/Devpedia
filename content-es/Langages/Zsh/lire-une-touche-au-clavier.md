---
order: 7
---

# Leer una tecla del teclado en zsh: `read -k`, Escape y flechas

Un script interactivo necesita a menudo una respuesta inmediata: «Intro para continuar, Escape para parar». El script que lanza el solucionador de Skyscraper sobre una serie de cuadrículas hace exactamente eso. Sin embargo, el comando habitual, `read`, espera a que se valide una **línea** con Intro. Este capítulo muestra cómo leer **una sola tecla**, qué envía realmente una tecla al programa y cómo distinguir la tecla Escape de una flecha.

## Una línea o una tecla: `read` y `read -k`

| Comando | Qué hace |
|---|---|
| `read linea` | Espera a que se valide una línea entera con Intro |
| `read -k 1 tecla` | Lee **una tecla** en cuanto se pulsa: el terminal procesa entonces la entrada tecla a tecla |
| `read -s ...` | No muestra lo que se escribe |
| `read -t 0.05 ...` | Solo espera 0,05 segundos (se acepta un número decimal); código de retorno 1 si no ha llegado nada |

Según el manual de zsh, `-k` lee **desde el terminal**. Sin terminal (script lanzado por `cron`, entrada redirigida), `read -k` falla con el mensaje `not interactive and can't open terminal` y el código 1.

La misma operación existe en bash, con otras opciones (comportamientos verificados en un terminal simulado):

| | bash | zsh |
|---|---|---|
| Leer una tecla | `read -n 1 tecla` | `read -k 1 tecla` |
| Sin eco | `-s` | `-s` |
| Plazo de 0,05 s vencido | Código **142** | Código **1** |
| `read -n 1 tecla` | Lee una tecla | **No lee nada**: `tecla` queda vacía, código 0, ningún mensaje |

> **Trampa:** copiar el `read -n 1` de bash en un script zsh no produce ningún error: el manual de zsh reserva `-n` para las funciones de compleción; en cualquier otro sitio la opción se ignora en silencio.

## Qué envía una tecla: bytes

El teclado no envía «la tecla Escape»: el terminal transmite **bytes**, y `read -k 1` lee uno cada vez. El script siguiente (`bytes.zsh`) muestra cada byte recibido; la bandera `(q)` escribe los caracteres invisibles de forma legible:

```zsh
#!/bin/zsh
# Muestra los bytes recibidos en cada tecla: pulsar una letra, Intro, Escape, una flecha...
# Para parar: pulsar q.
while read -s -k 1 key; do
    print -r -- "byte recibido: ${(q)key}"
    [[ $key == q ]] && break
done
```

Salida al pulsar, por orden: `a`, Intro, Escape, flecha arriba, flecha izquierda, Alt+x, F1 y luego `q`:

```
byte recibido: a
byte recibido: $'\n'
byte recibido: $'\033'
byte recibido: $'\033'
byte recibido: \[
byte recibido: A
byte recibido: $'\033'
byte recibido: \[
byte recibido: D
byte recibido: $'\033'
byte recibido: x
byte recibido: $'\033'
byte recibido: O
byte recibido: P
byte recibido: q
```

| Tecla | Bytes recibidos | Lectura |
|---|---|---|
| Letra `a` | `a` | Un byte |
| Intro | `\n` | Un byte (el terminal convierte el retorno de carro) |
| Escape | `\033` | Un byte: el carácter **ESC**, de código 27 |
| Flecha arriba, abajo, derecha, izquierda | `\033`, `[`, luego `A`, `B`, `C` o `D` | **Tres** bytes: ESC, `[` y una letra |
| Alt+x | `\033`, `x` | Dos bytes: ESC seguido de la letra |
| F1 | `\033`, `O`, `P` | Tres bytes |
| Tabulador, retroceso | `\t`, `\177` | Un byte cada una |

ESC es el carácter que abre una **secuencia de escape** (el mismo que sirve para los [códigos ANSI de color](/?c=langages&s=bash&p=architecture-dun-shell#colorear-la-salida-de-una-terminal-los-codigos-ansi) en sentido contrario, del programa al terminal). Una flecha empieza, pues, exactamente como la tecla Escape: solo lo que sigue permite distinguirlas.

## Distinguir Escape de una flecha

Tras leer ESC, se espera muy brevemente un byte más. Si llega, es el comienzo de una secuencia (flecha, F1...). Si no llega, es la tecla Escape, pulsada sola. La función `wait_for_key` (`espera.zsh`) devuelve `0` con Intro, `1` con Escape solo y `2` si no hay terminal:

```zsh
#!/bin/zsh
# Espera Intro (código 0) o Escape (código 1); código 2 si no hay terminal.
wait_for_key() {
    local key
    while read -s -k 1 key 2>/dev/null; do
        [[ $key == $'\n' || $key == $'\r' ]] && return 0       # Intro
        [[ $key != $'\e' ]] && continue                        # cualquier otra tecla: se sigue esperando
        # una flecha envía Escape seguido de otros bytes: solo un Escape aislado detiene
        read -s -t 0.05 -k 1 key || return 1                   # no sigue nada: Escape solo
        while read -s -t 0.01 -k 1 key; do :; done             # vacía el resto de la flecha
    done
    return 2
}

wait_for_key
echo "código de retorno: $?"
```

| Línea | Papel |
|---|---|
| `while read -s -k 1 key 2>/dev/null` | Lee una tecla sin mostrarla; falla sin terminal (mensaje oculto) |
| `[[ $key == $'\n' \|\| $key == $'\r' ]] && return 0` | Intro (retorno de carro o salto de línea): termina con el código 0 |
| `[[ $key != $'\e' ]] && continue` | Cualquier tecla distinta de ESC se ignora: se vuelve a leer |
| `read -s -t 0.05 -k 1 key \|\| return 1` | Tras ESC, espera 0,05 s un byte más; no llega ninguno: Escape solo, código 1 |
| `while read -s -t 0.01 -k 1 key; do :; done` | Llegó un byte: se vacía el resto de la secuencia (`[` y `A`...) para que no se lean como dos pulsaciones |
| `return 2` | El bucle se detuvo porque `read` falló: no hay terminal |

Resultados (terminal simulado, teclas enviadas como desde el teclado):

| Teclas pulsadas | Código devuelto | Lectura |
|---|---|---|
| Intro | 0 | Continuar |
| Escape solo | 1 | Parar |
| Flecha arriba, luego Intro | 0 | La flecha se ignora |
| `abc`, luego Intro | 0 | Las letras se ignoran |
| Escape, luego `x` 20 ms después (como Alt+x) | 0 | Tomado por el comienzo de una secuencia: Escape no reconocido |
| Ningún terminal (`< /dev/null`) | 2 | Sin terminal |

## Las trampas

| Trampa | Qué ocurre | Remedio |
|---|---|---|
| `read -n 1` escrito por costumbre de bash | Ningún error, pero la variable queda vacía (verificado) | `read -k 1` en zsh |
| Script sin terminal (cron, tubería) | `read -k` falla con un mensaje y el código 1 | Ocultar el mensaje (`2>/dev/null`) y prever un código propio, como el `return 2` anterior |
| Alt+tecla o tecla de función | ESC y la letra llegan casi juntos: se leen como una secuencia, nunca como Escape (verificado con 20 ms) | Aceptar este límite, o leer la secuencia entera |
| No vaciar el final de una secuencia | `[` y `A` se leerían como dos pulsaciones ordinarias | El bucle `while read -t 0.01` |
| Plazo de 0,05 s demasiado corto | En un enlace lento (ssh), los bytes de una flecha pueden llegar separados por más de 0,05 s y la flecha tomarse por Escape | Probar en el enlace realmente usado y ajustar |

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | `read -k 1` lee una tecla sin esperar Intro (zsh; `read -n 1` en bash). Una tecla envía bytes: Escape es un solo byte ESC (`\033`), una flecha envía tres (ESC, `[`, una letra). Para distinguir Escape de una flecha, se lee ESC y luego se espera brevemente un byte más con `-t`. |
| **Herramientas utilizables** | `read -k`, `-s`, `-t`, la comparación con `$'\e'`, la bandera `(q)` para ver los bytes, `[[ -t 0 ]]` para comprobar si hay terminal. |
| **Trampas a evitar** | `read -n 1` en un script zsh (variable vacía sin error). Olvidar vaciar el final de una secuencia. Leer una tecla sin terminal. Tomar Alt+tecla por Escape. |
| **Buenas prácticas** | Comprobar qué envía cada tecla con un pequeño script de bytes. Ocultar el mensaje de error y gestionar el caso «sin terminal» con un código de retorno propio. Elegir los plazos según el enlace usado. |
