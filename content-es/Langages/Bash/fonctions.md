---
order: 7
---

# Las funciones

Una función Bash agrupa una secuencia de comandos bajo un nombre reutilizable. A diferencia de [PHP](/?c=langages-de-programmation&s=php&p=conditions) o [C](/?c=langages-de-programmation&s=c&p=conditions), una función Bash **nunca** declara una lista de parámetros con nombre: recibe sus argumentos exactamente igual que un script recibe los suyos, vía `$1`, `$2`, etc.

## Declarar y llamar a una función

```bash
saludar() {
    echo "¡Hola $1!"
}

saludar "Juan"   # ¡Hola Juan!
```

`function saludar { ... }` es una escritura alternativa aceptada por Bash (pero no portable a un `sh` estrictamente POSIX): `saludar() { ... }` es la forma más universal.

## Los argumentos de una función

```bash
resumir() {
    echo "Nombre de la función: $FUNCNAME"
    echo "Primer argumento: $1"
    echo "Todos los argumentos: $@"
    echo "Número de argumentos: $#"
}

resumir "Juan" "Perez"
```

> **Nota:** `$1`, `$2`... dentro de una función designan los argumentos **de la función**, nunca los del script que la engloba: se sustituyen automáticamente durante la llamada, sin nada que configurar.

## Sin verdadero valor de retorno: solo un código de salida

`return` en Bash **no** devuelve un valor en el sentido de [PHP](/?c=langages-de-programmation&s=php&p=php)/C: solo fija el **código de salida** de la función (un entero de 0 a 255, recuperable vía `$?`), exactamente como `exit` para un script completo:

```bash
es_par() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = éxito/verdadero, convención Unix
    else
        return 1   # distinto de cero = fallo/falso
    fi
}

if es_par 4; then
    echo "4 es par"
fi
```

## "Devolver" un dato real: `echo` + sustitución de comandos

Para recuperar un dato calculado (no solo un éxito/fallo), la convención es mostrarlo con `echo`, y capturar esa salida desde el llamador vía [`$(...)`](/?c=shells&s=bash&p=variables):

```bash
suma() {
    echo $(($1 + $2))
}

resultado=$(suma 4 6)
echo "Resultado: $resultado"  # Resultado: 10
```

> **Nota:** nunca confundir los dos mecanismos. `return` comunica un estado (0-255, para control de flujo con `if`), `echo` + `$(...)` comunica un dato real (para almacenarlo/reutilizarlo). Mezclar ambos en la misma función es una fuente clásica de confusión.

## Variables locales

Sin `local`, una variable asignada en una función sigue siendo visible **globalmente** tras la primera llamada: a menudo un efecto secundario no deseado:

```bash
calcular() {
    local resultado=$(($1 * 2))  # local: solo existe dentro de calcular()
    echo $resultado
}
```

Ver también [Las variables](/?c=shells&s=bash&p=variables) (variables especiales `$1`, `$@`, `$#`, `$?`, ya reutilizadas aquí en el contexto de las funciones).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una función Bash recibe sus argumentos como un script (`$1`, `$2`...), nunca vía parámetros con nombre. `return` solo fija un código de salida (0-255): para un dato real, se usa `echo` capturado vía `$(...)`. |
| **Herramientas utilizables** | `$FUNCNAME`, `$@`/`$#`, `local` para una variable propia de la función. |
| **Trampas a evitar** | Confundir `return` (estado, para `if`) y `echo`+`$(...)` (dato, para almacenarse); olvidar `local`, lo que deja una variable visible globalmente tras la primera llamada. |
| **Buenas prácticas** | Declarar siempre `local` para una variable que no necesita existir fuera de la función. |
