---
order: 1
---

# As condições

JavaScript usa `if`/`else if`/`else` e `switch`, com uma particularidade importante em relação a [PHP](/?c=langages-de-programmation&s=php&p=conditions) ou [Python](/?c=langages-de-programmation&s=python&p=conditions): suas regras de comparação "flexíveis" (`==`) são conhecidas por suas conversões de tipo surpreendentes.

## `if` / `else if` / `else`

```javascript
const idade = 20;

if (idade >= 18) {
    console.log("Voce e maior de idade.");
} else if (idade >= 13) {
    console.log("Voce e adolescente.");
} else {
    console.log("Voce e crianca.");
}
```

## `==` vs `===`: ainda mais crítico que em PHP

```javascript
0 == "0"           // true  -> convertido em numero antes da comparacao
0 == ""            // true  -> "" convertida em 0
null == undefined  // true -> caso especial
"" == false        // true
1 == "1"           // true

0 === "0"    // false -> tipos diferentes, nenhuma conversao
```

> **Nota:** essas conversões implícitas de `==` são uma fonte lendária de bugs em JavaScript; `===`/`!==` (igualdade estrita, tipo E valor) devem ser a escolha padrão, exatamente como em [PHP](/?c=langages-de-programmation&s=php&p=conditions).

## Valores "truthy" e "falsy"

```javascript
if (0) {}          // falsy
if ("") {}         // falsy
if (null) {}       // falsy
if (undefined) {}  // falsy
if (NaN) {}        // falsy
if ([]) {}         // TRUTHY! (ao contrario de PHP, onde um array vazio e falsy)
if ({}) {}         // TRUTHY!
```

> **Nota:** armadilha clássica para quem vem de [PHP](/?c=langages-de-programmation&s=php&p=conditions): um array ou objeto **vazio** é `truthy` em JavaScript, enquanto é `falsy` em PHP; sempre testar `array.length === 0` explicitamente em vez de `if (!array)`.

## O operador ternário

```javascript
const status = idade >= 18 ? "maior de idade" : "menor de idade";
```

## Coalescência nula (`??`) e encadeamento opcional (`?.`)

```javascript
const apelido = usuario.apelido ?? "Convidado";
// "??" so recorre ao valor padrao SE o valor for null/undefined (nao 0, "", false)

const cidade = usuario?.endereco?.cidade ?? "Desconhecida";
// "?." : se "usuario" ou "endereco" for null/undefined, para imediatamente e retorna undefined
// -> evita um TypeError "Cannot read properties of undefined" em cascata
```

> **Nota:** `??` difere de `||`: `0 || "padrao"` retorna `"padrao"` (0 é falsy para `||`), enquanto `0 ?? "padrao"` retorna `0` (0 não é `null` nem `undefined`).

## O `switch`

```javascript
const dia = 3;

switch (dia) {
    case 1:
        console.log("Segunda");
        break;
    case 2:
    case 3:
        console.log("Inicio de semana");  // sem break entre 2 e 3: caso compartilhado
        break;
    default:
        console.log("Outro dia");
}
```

`switch` compara com igualdade **estrita** (`===`): nenhuma conversão de tipo surpresa aqui, ao contrário de `if (x == y)`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `if`/`else if`/`else` e `switch` (comparação estrita `===`) estruturam o controle de fluxo. `??` e `?.` tratam corretamente os valores `null`/`undefined`. |
| **Ferramentas utilizáveis** | Operador ternário `? :`, coalescência nula `??`, encadeamento opcional `?.`. |
| **Armadilhas a evitar** | Usar `==` (conversões de tipo surpreendentes); testar `if (array)` pensando que um array vazio é falsy: ele é truthy em JavaScript, ao contrário de PHP. |
| **Boas práticas** | Sempre preferir `===`/`!==` a `==`/`!=`; usar `array.length === 0` para testar um array vazio. |
