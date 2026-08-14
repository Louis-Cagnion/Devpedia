---
order: 1
---

# As condições

O JavaScript utiliza `if` / `else if` / `else` e `switch`, com uma particularidade significativa em relação ao PHP ou ao Python: as suas regras de comparação «flexíveis» (`==`) são conhecidas pelas suas conversões de tipo surpreendentes.

## `if` / `else if` / `else`

```javascript
const idade = 20;

if (idade >= 18) {
    console.log("Vous êtes majeur.");
} else if (idade >= 13) {
    console.log("Vous êtes adolescent.");
} else {
    console.log("Vous êtes enfant.");
}
```

## `==` vs `===`: ainda mais crítica do que em PHP

```javascript
0 == "0"        // true  -> convertido em número antes da comparação
0 == ""          // true  -> "" convertido em 0
null == undefined // true -> caso especial
"" == false        // true
1 == "1"            // true

0 === "0"    // false -> tipos diferentes, sem conversão
```

> **Nota:** estas conversões implícitas de `==` são uma fonte lendária de erros em JavaScript: `===` / `!==` (igualdade estrita, tipo E valor) devem ser a opção padrão, tal como no PHP.

## Valores «truthy» e «falsy»

```javascript
if (0) {}          // falsy
if ("") {}          // falsy
if (null) {}         // falsy
if (undefined) {}     // falsy
if (NaN) {}            // falsy
if ([]) {}               // TRUTHY! (ao contrário do PHP, onde um array vazio é falsy)
if ({}) {}                // TRUTHY!
```

> **Nota:** armadilha clássica para quem vem do PHP: um array ou objeto **vazio** é «`truthy`» em JavaScript, enquanto no PHP é «`falsy`»: teste sempre explicitamente «`matriz.length === 0`» em vez de «`if (!matriz)`».

## O operador ternário

```javascript
const statut = idade >= 18 ? "majeur" : "mineur";
```

## Coalescência nula (`??`) e encadeamento opcional (`?.`)

```javascript
const pseudo = usuário.pseudo ?? "Invité";
// "??" só recorre ao valor por padrão SE o valor for null/undefined (não 0, "", false)

const cidade = usuário?.adresse?.cidade ?? "Inconnue";
// «?.»: se «usuário» ou «endereço» for nulo/indefinido, interrompe-se imediatamente e devolve «indefinido»
// -> evita um TypeError «Cannot read properties of undefined» em cascata
```

> **Nota:** `??` difere de `||`: `0 || "défaut"` devolve `"défaut"` (0 é «falsy» para `||`), enquanto que `0 ?? "défaut"` devolve `0` (0 não é nem «`null`» nem «`undefined`»).

## O `switch`

```javascript
const jour = 3;

switch (jour) {
    case 1:
        console.log("Lundi");
        break;
    case 2:
    case 3:
        console.log("Début de semaine");  // sem quebra entre o 2.º e o 3.º: caso partilhado
        break;
    default:
        console.log("Autre jour");
}
```

`switch` compara com a igualdade **estrita** (`===`): aqui não há conversões de tipo inesperadas, ao contrário de `if (x == y)`.
