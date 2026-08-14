---
order: 1
---

# Las condiciones

JavaScript utiliza `if`/`else if`/`else` y `switch`, con una particularidad importante respecto a [PHP](/?c=langages-de-programmation&s=php&p=conditions) o [Python](/?c=langages-de-programmation&s=python&p=conditions): sus reglas de comparación "flexibles" (`==`) son conocidas por sus sorprendentes conversiones de tipo.

## `if` / `else if` / `else`

```javascript
const edad = 20;

if (edad >= 18) {
    console.log("Eres mayor de edad.");
} else if (edad >= 13) {
    console.log("Eres adolescente.");
} else {
    console.log("Eres un niño.");
}
```

## `==` vs `===`: aún más crítico que en PHP

```javascript
0 == "0"           // true  -> se convierte a número antes de comparar
0 == ""            // true  -> "" se convierte a 0
null == undefined  // true  -> caso especial
"" == false        // true
1 == "1"            // true

0 === "0"    // false -> tipos diferentes, sin conversión
```

> **Nota:** estas conversiones implícitas de `==` son una fuente legendaria de errores en JavaScript; `===`/`!==` (igualdad estricta, tipo Y valor) deben ser la opción por defecto, exactamente igual que en [PHP](/?c=langages-de-programmation&s=php&p=conditions).

## Valores "truthy" y "falsy"

```javascript
if (0) {}          // falsy
if ("") {}         // falsy
if (null) {}       // falsy
if (undefined) {}  // falsy
if (NaN) {}        // falsy
if ([]) {}         // ¡TRUTHY! (a diferencia de PHP, donde un array vacío es falsy)
if ({}) {}         // ¡TRUTHY!
```

> **Nota:** trampa clásica para quien viene de [PHP](/?c=langages-de-programmation&s=php&p=conditions): un array u objeto **vacío** es `truthy` en JavaScript, mientras que es `falsy` en PHP; comprueba siempre explícitamente `array.length === 0` en lugar de `if (!array)`.

## El operador ternario

```javascript
const estado = edad >= 18 ? "mayor" : "menor";
```

## Coalescencia nula (`??`) y encadenamiento opcional (`?.`)

```javascript
const apodo = usuario.apodo ?? "Invitado";
// "??" solo recurre al valor por defecto SI el valor es null/undefined (no 0, "", false)

const ciudad = usuario?.direccion?.ciudad ?? "Desconocida";
// "?." : si "usuario" o "direccion" es null/undefined, se detiene inmediatamente y devuelve undefined
// -> evita un TypeError "Cannot read properties of undefined" en cascada
```

> **Nota:** `??` es diferente de `||`: `0 || "predeterminado"` devuelve `"predeterminado"` (0 es falsy para `||`), mientras que `0 ?? "predeterminado"` devuelve `0` (0 no es ni `null` ni `undefined`).

## El `switch`

```javascript
const dia = 3;

switch (dia) {
    case 1:
        console.log("Lunes");
        break;
    case 2:
    case 3:
        console.log("Comienzo de semana");  // sin break entre 2 y 3: caso compartido
        break;
    default:
        console.log("Otro día");
}
```

`switch` compara con igualdad **estricta** (`===`): sin conversión de tipo sorpresa aquí, a diferencia de `if (x == y)`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `if`/`else if`/`else` y `switch` (comparación estricta `===`) estructuran el control de flujo. `??` y `?.` gestionan correctamente los valores `null`/`undefined`. |
| **Herramientas utilizables** | Operador ternario `? :`, coalescencia nula `??`, encadenamiento opcional `?.`. |
| **Trampas a evitar** | Usar `==` (conversiones de tipo sorprendentes); probar `if (array)` pensando que un array vacío es falsy: es truthy en JavaScript, a diferencia de PHP. |
| **Buenas prácticas** | Preferir siempre `===`/`!==` a `==`/`!=`; usar `array.length === 0` para comprobar si un array está vacío. |
