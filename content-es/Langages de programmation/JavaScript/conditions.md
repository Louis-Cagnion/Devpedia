---
order: 1
---

# Condiciones

JavaScript utiliza `if` / `else if` / `else` y `switch`, con una particularidad importante respecto a PHP o Python: sus reglas de comparación «flexibles» (`==`) son conocidas por sus sorprendentes conversiones de tipo.

## `if` / `else if` / `else`

```javascript
const edad = 20;

if (edad >= 18) {
    console.log("Vous êtes majeur.");
} else if (edad >= 13) {
    console.log("Vous êtes adolescent.");
} else {
    console.log("Vous êtes enfant.");
}
```

## `==` vs `===`: aún más crítico que en PHP

```javascript
0 == "0"        // true  -> se convierte en un número antes de la comparación
0 == ""          // true  -> "" se convierte en 0
null == undefined // true -> caso especial
"" == false        // true
1 == "1"            // true

0 === "0"    // false -> tipos diferentes, sin conversión
```

> **Nota:** estas conversiones implícitas de `==` son una fuente legendaria de errores en JavaScript — `===` / `!==` (igualdad estricta, tipo Y valor) deben ser la opción por defecto, exactamente igual que en PHP.

## Valores «truthy» y «falsy»

```javascript
if (0) {}          // falsy
if ("") {}          // falsy
if (null) {}         // falsy
if (undefined) {}     // falsy
if (NaN) {}            // falsy
if ([]) {}               // ¡TRUTHY! (a diferencia de PHP, donde un array vacío es falsy)
if ({}) {}                // ¡TRUTHY!
```

> **Nota:** trampa habitual para quienes vienen de PHP: un array u objeto **vacío** es «`truthy`» en JavaScript, mientras que en PHP es «`falsy`»; comprueba siempre explícitamente «`matriz.length === 0`» en lugar de «`if (!matriz)`».

## El operador ternario

```javascript
const statut = edad >= 18 ? "majeur" : "mineur";
```

## Coalescencia nula (`??`) y encadenamiento opcional (`?.`)

```javascript
const pseudo = usuario.pseudo ?? "Invité";
// «??» solo recurre al valor por defecto SI el valor es null/undefined (no 0, «», false)

const ciudad = usuario?.adresse?.ciudad ?? "Inconnue";
// «?.»: si «usuario» o «dirección» es nulo/indefinido, se detiene inmediatamente y devuelve «indefinido»
// -> evita un TypeError «Cannot read properties of undefined» en cascada
```

> **Nota:** «`??`» es diferente de «`||`»: «`0 || "défaut"`» devuelve «`"défaut"`» (0 es «falsy» para «`||`»), mientras que «`0 ?? "défaut"`» devuelve «`0`» (0 no es ni «`null`» ni «`undefined`»).

## El e`switch`

```javascript
const jour = 3;

switch (jour) {
    case 1:
        console.log("Lundi");
        break;
    case 2:
    case 3:
        console.log("Début de semaine");  // No hay salto entre el 2 y el 3: caso compartido
        break;
    default:
        console.log("Autre jour");
}
```

`switch` Compara con la igualdad **estricta** (`===`): aquí no hay conversiones de tipo inesperadas, a diferencia de lo que ocurre con `if (x == y)`.
