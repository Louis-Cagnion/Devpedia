---
order: 2
---

# Os laços

JavaScript oferece os laços clássicos (`for`, `while`, `do...while`), além de dois laços dedicados ao percurso de coleções (`for...of`, `for...in`); e, na prática cotidiana, os métodos funcionais dos arrays (`map`, `filter`...) frequentemente substituem um laço explícito.

## `for` clássico

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
} while (j < 5);   // executa pelo menos uma vez, condicao testada depois
```

## `for...of`: percorrer os valores de um iterável

```javascript
const frutas = ["maca", "banana", "cereja"];

for (const fruta of frutas) {
    console.log(fruta);
}

for (const caractere of "abc") {   // funciona tambem em uma string
    console.log(caractere);
}
```

## `for...in`: percorrer as chaves de um objeto

```javascript
const pessoa = { nome: "Joao", idade: 25 };

for (const chave in pessoa) {
    console.log(`${chave}: ${pessoa[chave]}`);
}
```

> **Nota:** `for...in` percorre as **chaves enumeráveis** de um objeto: nunca usá-lo em um array (`for...in` percorreria os índices, mas também qualquer propriedade adicionada manualmente ao array, e não garante a ordem): `for...of` ou `.forEach()` são as ferramentas corretas para um array.

## `break` e `continue`

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    if (i % 2 === 0) continue;
    console.log(i);
}
```

## Os métodos funcionais de array: a alternativa idiomática

Em JavaScript moderno, transformar ou filtrar um array passa mais frequentemente por esses métodos do que por um laço `for` explícito:

```javascript
const numeros = [1, 2, 3, 4, 5];

numeros.forEach(n => console.log(n));                  // executa uma funcao para cada elemento
const dobros = numeros.map(n => n * 2);                // [2, 4, 6, 8, 10] -> transforma cada elemento
const pares = numeros.filter(n => n % 2 === 0);        // [2, 4] -> mantem apenas o que corresponde
const soma = numeros.reduce((acc, n) => acc + n, 0);   // 15 -> reduz todo o array a um unico valor
```

> **Nota:** `reduce()` é o mais versátil mas o menos imediatamente legível: `acc` (o acumulador) parte do valor inicial fornecido no segundo argumento (`0` aqui), e se atualiza a cada elemento conforme a função fornecida.

Veja também [As funções](/?c=langages-de-programmation&s=javascript&p=fonctions) para a sintaxe das funções de seta (`=>`) usadas aqui.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `for`/`while`/`do...while` são os laços clássicos; `for...of` percorre os valores de um iterável, `for...in` as chaves de um objeto. Os métodos funcionais (`map`/`filter`/`reduce`) frequentemente substituem um laço explícito. |
| **Ferramentas utilizáveis** | `break`/`continue`, `forEach`/`map`/`filter`/`reduce`. |
| **Armadilhas a evitar** | Usar `for...in` em um array: percorre também propriedades adicionadas manualmente, sem garantir a ordem. |
| **Boas práticas** | `for...of` ou `.forEach()` para um array; os métodos funcionais para transformar/filtrar em vez de um laço manual. |
