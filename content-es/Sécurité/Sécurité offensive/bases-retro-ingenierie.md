---
order: 3
---

# Las bases de la ingeniería inversa

La **ingeniería inversa** (*reverse engineering*) consiste en entender el funcionamiento de un programa sin disponer de su código fuente, a partir únicamente del binario compilado. Es un paso casi sistemático en seguridad ofensiva: un atacante nunca recibe el código fuente de su objetivo, solo el programa que este ejecuta.

## Dos herramientas complementarias: desensamblador y depurador

| Herramienta | Qué hace | Ejemplo |
|---|---|---|
| **Desensamblador** | Traduce el binario (secuencia de bytes) en instrucciones ensamblador legibles, sin ejecutar nunca el programa | Ghidra, `objdump` |
| **Depurador** | Ejecuta realmente el programa, permitiendo suspenderlo en cualquier momento para inspeccionar registros, pila y memoria (véase [Cómo se ejecuta realmente un programa](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)) | `gdb` |

```text
Desensamblador:  Binario --> solo lectura --> "estas son las instrucciones que contiene"

Depurador:       Binario --> ejecucion --> pausa en un punto elegido --> "este es el estado
                                                                          REAL de la memoria
                                                                          en este instante"
```

Ambas herramientas se complementan: el desensamblador ofrece una vista de conjunto rápida sin ejecutar nada (útil frente a un binario potencialmente peligroso), el depurador confirma lo que ocurre realmente en ejecución, incluyendo comportamientos que una simple lectura del desensamblado no revela (ej.: un valor calculado dinámicamente).

## Leer un mínimo de ensamblador x86

El **ensamblador** es la representación legible por un humano de las instrucciones que un procesador ejecuta directamente. Unas pocas instrucciones x86 bastan para seguir la lógica general de un programa:

| Instrucción | Efecto |
|---|---|
| `mov dest, src` | Copia `src` en `dest` (ej.: `mov rax, rbx` copia `rbx` en `rax`) |
| `push`/`pop` | Apila/desapila un valor en la pila |
| `call`/`ret` | Llama a una función (apila la dirección de retorno) / vuelve al que la llamó (desapila esa dirección) |
| `cmp` | Compara dos valores (el resultado lo usa la instrucción siguiente) |
| `jmp`/`je`/`jne` | Salta a otra instrucción, incondicionalmente (`jmp`) o según el resultado del `cmp` anterior (`je`: si es igual, `jne`: si es distinto) |

```text
Pseudocodigo:        Ensamblador equivalente (simplificado):

if (a == b) {         cmp  rax, rbx      ; compara a (en rax) y b (en rbx)
    haceX();           jne  sino         ; si es distinto, salta a "sino"
} else {               call haceX
    haceY();            jmp  fin
}                      sino:
                        call haceY
                       fin:
```

## Caja negra o caja blanca

| Enfoque | De qué se dispone |
|---|---|
| **Caja blanca** (*white-box*) | El código fuente está disponible: se lee directamente la lógica de negocio |
| **Caja negra** (*black-box*) | Solo es accesible el binario (o el servicio expuesto): hay que deducir el comportamiento observándolo, mediante desensamblador/depurador o por sus entradas/salidas |

> **Buena práctica:** empezar siempre por el desensamblador para obtener una vista de conjunto rápida y sin riesgo, antes de pasar al depurador para confirmar un detalle concreto en ejecución real: inspeccionar todo un programa paso a paso en un depurador, sin ningún plan, lleva un tiempo desproporcionado.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La ingeniería inversa entiende un programa sin su código fuente. El desensamblador traduce el binario en ensamblador legible sin ejecutarlo; el depurador lo ejecuta y permite inspeccionar su estado real en cualquier momento. Unas pocas instrucciones x86 (`mov`, `push`/`pop`, `call`/`ret`, `cmp`, `jmp`/`je`/`jne`) bastan para seguir la lógica general de un programa. |
| **Herramientas utilizables** | Ghidra u `objdump` para desensamblar; `gdb` para depurar. |
| **Errores a evitar** | Lanzarse directamente a un depurador sin una vista de conjunto previa del desensamblado. |
| **Buenas prácticas** | Desensamblar primero para localizar las zonas interesantes, depurar después para confirmar un comportamiento concreto. |
