---
order: 4
---

# Recursão e funções de ordem superior

## A recursão substitui o laço

Sem variável mutável por padrão, repetir um processamento passa por uma função que chama a si mesma, cada chamada reduzindo o problema em um passo:

```ocaml
let rec fatorial n =
  if n = 0 then 1
  else n * fatorial (n - 1)

fatorial 5   (* 120 *)
```

## Recursão terminal: evitar fazer a pilha crescer

O `fatorial` acima **não é terminal** (*not tail-recursive*): a cada chamada, a multiplicação `n * ...` espera o resultado da chamada recursiva antes de poder ser executada. Cada chamada em espera então fica na **pilha de chamadas** (cf. capítulo [A organização em memória](/?c=representation-des-donnees&p=organisation-en-memoire) para a distinção pilha/heap), até que o caso base seja alcançado e então todas as multiplicações se desenrolem em cascata subindo de volta.

Uma versão **terminal** carrega o resultado intermediário em um argumento adicional (um **acumulador**), de forma que a chamada recursiva é a última coisa feita na função; nada mais espera depois dela:

```ocaml
let fatorial_terminal n =
  let rec aux n acc =
    if n = 0 then acc
    else aux (n - 1) (n * acc)     (* ultima chamada: nada fica em espera depois *)
  in
  aux n 1
```

O compilador OCaml reconhece essa forma e a otimiza em um simples laço no nível do código de máquina gerado: a pilha **não** cresce de uma chamada para outra, qualquer que seja a profundidade da recursão. É isso que torna a recursão praticável até mesmo em listas de vários milhões de elementos, onde uma versão não terminal acabaria esgotando a pilha (*stack overflow*).

## Funções de ordem superior: `map`, `filter`, `fold`

Uma função de ordem superior recebe uma função como argumento, ou retorna uma, o mesmo princípio de um decorador [Python](/?c=langages-de-programmation&s=python&p=python) (cf. capítulo [Os decoradores](/?c=langages-de-programmation&s=python&p=decorateurs)), generalizado a toda a biblioteca padrão de listas em vez de reservado a um caso de uso específico.

```ocaml
let quadrados = List.map (fun x -> x * x) [1; 2; 3; 4]        (* [1; 4; 9; 16] *)
let pares = List.filter (fun x -> x mod 2 = 0) [1; 2; 3; 4]   (* [2; 4] *)
let soma = List.fold_left (+) 0 [1; 2; 3; 4]                  (* 10 *)
```

Essas três funções cobrem, sozinhas, a quase totalidade dos laços `for` (cf. capítulo [Os laços](/?c=langages-de-programmation&s=c&p=boucles), tópico C) que se escreveria para transformar uma coleção (`map`), manter uma parte dela (`filter`), ou agregá-la em um único valor (`fold`):

```c
// Equivalente imperativo da soma, em C
int total = 0;
for (int i = 0; i < tamanho; i++) {
    total += array[i];
}
```

A versão `fold_left` nunca menciona explicitamente um contador nem uma variável intermediária: o "como percorrer" é inteiramente delegado a `List.fold_left`, e o código só expressa o "o que fazer em cada elemento" (`(+)`) e o estado inicial (`0`).

> **Nota:** `fold_left` acumula da esquerda para a direita (`(((0 + 1) + 2) + 3) + 4`); para uma operação não associativa ou sensível à ordem, `List.fold_right` acumula da direita para a esquerda, com uma assinatura de chamada ligeiramente diferente (o acumulador é o último argumento, não o segundo).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A recursão substitui o laço com contador mutável. Uma recursão terminal (a chamada recursiva é a última ação) é otimizada pelo compilador em um laço, sem fazer a pilha crescer. `map`/`filter`/`fold` cobrem o essencial dos laços de transformação/filtro/agregação. |
| **Ferramentas utilizáveis** | `let rec`, um acumulador para tornar uma recursão terminal, `List.map`/`List.filter`/`List.fold_left`. |
| **Armadilhas a evitar** | Escrever uma recursão não terminal sobre uma lista muito grande: risco de estouro de pilha (*stack overflow*). |
| **Boas práticas** | Transformar uma recursão em forma terminal (com acumulador) assim que ela precisar processar coleções potencialmente grandes. |
