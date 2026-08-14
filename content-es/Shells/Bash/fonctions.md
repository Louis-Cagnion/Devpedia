---
order: 6
---

# Las funciones

Una función de Bash agrupa una secuencia de comandos bajo un nombre reutilizable. A diferencia de PHP o C, una función de Bash **nunca** declara una lista de parámetros con nombre: recibe sus argumentos exactamente igual que lo hace un script, a través de `$1`, `$2`, etc.

## Declarar y llamar a una función

```bash
saluer() {
    echo "Bonjour $1 !"
}

saluer "Jean"   # ¡Hola, Jean!
```

`function saluer { ... }` Es una sintaxis alternativa aceptada por Bash (pero no compatible con un e`sh`o estrictamente POSIX); `saluer() { ... }` es la forma más universal.

## Los argumentos de una función

```bash
resumer() {
    echo "Nom de la fonction : $FUNCNAME"
    echo "Premier argument : $1"
    echo "Tous les arguments : $@"
    echo "Nombre d'arguments : $#"
}

resumer "Jean" "Dupont"
```

> **Nota:** «`$1`», «`$2`»... dentro de una función se refieren a los argumentos **de la función**, nunca a los del script que la engloba; se sustituyen automáticamente durante la llamada, sin necesidad de configurar nada.

## Sin valor de retorno real: solo un código de salida

`return` En Bash no devuelve un valor en el sentido de PHP/C, sino que únicamente establece el **código de salida** de la función (un entero de 0 a 255, que se puede recuperar mediante `$?`), exactamente igual que `exit` para un script completo:

```bash
est_pair() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = éxito/verdadero, convención de Unix
    else
        return 1   # distinto de cero = error/falso
    fi
}

if est_pair 4; then
    echo "4 est pair"
fi
```

## «Devolver» un dato real: `echo` + sustitución de comandos

Para recuperar un dato calculado (no solo un resultado de éxito o error), la convención consiste en mostrarlo mediante `echo` y capturar esta salida desde el llamante mediante `$(...)` (véase el capítulo sobre variables):

```bash
addition() {
    echo $(($1 + $2))
}

resultado=$(addition 4 6)
echo "Résultat : $resultado"  # Resultado: 10
```

> **Nota:** nunca hay que confundir ambos mecanismos. `return` comunica un estado (0-255, para el control de flujo con `if`), `echo` + `$(...)` comunica datos reales (para su almacenamiento o reutilización). Mezclar ambos en la misma función es una fuente habitual de confusión.

## Variables locales

Sin «`local`», una variable asignada en una función sigue siendo visible **a nivel global** tras la primera llamada, lo que a menudo supone un efecto secundario no deseado:

```bash
calculer() {
    local resultado=$(($1 * 2))  # local: solo existe dentro de calculer()
    echo $resultado
}
```

Véase también el capítulo sobre variables (variables especiales `$1`, `$@`, `$#`, `$?`, ya mencionadas aquí en el contexto de las funciones).
