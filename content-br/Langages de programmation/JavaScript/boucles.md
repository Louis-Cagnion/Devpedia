---
order: 2
---

# Os loops

O JavaScript disponibiliza os ciclos clássicos (`for`, `while`, `do...while`), além de dois ciclos dedicados à iteração de coleções (`for...of`, `for...in`); e, na prática quotidiana, os métodos funcionais dos tabuletos (`map`, `filter`...) substituem frequentemente um ciclo explícito.

## `for` clássica

```javascript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

## `while` e `do...while`

```javascript
let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}

let j = 0;
do {
    console.log(j);
    j++;
} while (j < 5);   // é executada pelo menos uma vez; a condição é verificada a seguir
```

## `for...of` : percorrer os valores de um iterável

```javascript
const frutas = ["pomme", "banane", "cerise"];

for (const fruto of frutas) {
    console.log(fruto);
}

for (const caractere of "abc") {   // também funciona em sequência
    console.log(caractere);
}
```

## `for...in` : percorrer as chaves de um objeto

```javascript
const pessoa = { nome: "Jean", idade: 25 };

for (const chave in pessoa) {
    console.log(`${chave} : ${pessoa[chave]}`);
}
```

> **Nota:** `for...in` percorre as **chaves enumeráveis** de um objeto: nunca a utilize num array (o `for...in` percorreria os índices, mas também qualquer propriedade adicionada manualmente ao array, e não garante a ordem): `for...of` ou `.forEach()` são as ferramentas adequadas para um array.

## `break` e `continue`

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    if (i % 2 === 0) continue;
    console.log(i);
}
```

## Métodos funcionais de matriz: a alternativa idiomática

No JavaScript moderno, transformar ou filtrar um array é feito mais frequentemente através destes métodos do que através de um ciclo explícito do tipo «`for`»:

```javascript
const números = [1, 2, 3, 4, 5];

números.forEach(n => console.log(n));            // executa uma função para cada elemento
const doubles = números.map(n => n * 2);           // [2, 4, 6, 8, 10] -> transforma cada elemento
const pairs = números.filter(n => n % 2 === 0);      // [2, 4] -> mantém apenas o que corresponde
const somme = números.reduce((acc, n) => acc + n, 0); // 15 -> reduz toda a matriz a um único valor
```

> **Nota:** `reduce()` é a mais versátil, mas a menos intuitiva: `acc` (o acumulador) parte do valor inicial fornecido como segundo argumento (aqui, `0`) e atualiza-se a cada elemento de acordo com a função fornecida.

Consulte também o capítulo sobre funções para conhecer a sintaxe das funções com seta (`=>`) aqui utilizadas.
