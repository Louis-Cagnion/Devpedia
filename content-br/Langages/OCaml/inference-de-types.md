---
order: 5
---

# A inferência de tipos

## Estático, mas sem anotações

O OCaml é **estaticamente tipado**: cada expressão tem um tipo fixado de uma vez por todas, verificado antes mesmo da execução, como em C (cf. capítulo [As variáveis e tipos de dados](/?c=langages-de-programmation&s=c&p=variables)). Ao contrário do C, esse tipo quase nunca precisa ser escrito explicitamente:

```ocaml
let soma x y = x + y
(* o compilador deduz sozinho: soma : int -> int -> int *)
```

O uso de `+` (reservado aos inteiros em OCaml; `+.` é a adição de ponto flutuante) já basta para o compilador deduzir que `x` e `y` são `int`, e portanto que `soma` também retorna um. Nenhuma anotação foi escrita, e mesmo assim a tipagem é tão estrita quanto em C: chamar `soma 1 "dois"` é um erro detectado na compilação, nunca na execução.

## Como a inferência procede

O mecanismo (o [algoritmo de Hindley-Milner](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)) parte de cada expressão e impõe restrições sobre os tipos de suas subexpressões, depois resolve o conjunto do sistema de restrições para todo o programa:

```ocaml
let dobro x = x + x
(* '+' impoe: x e int, e o resultado e int *)
(* -> dobro : int -> int *)

let aplicar_duas_vezes f x = f (f x)
(* f deve aceitar o tipo que ela retorna -- nenhuma restricao fixa QUAL *)
(* -> aplicar_duas_vezes : ('a -> 'a) -> 'a -> 'a *)
```

O segundo exemplo ilustra o **polimorfismo paramétrico**: `'a` significa "um tipo qualquer, a determinar conforme a chamada", a mesma ideia de um template C++ (cf. capítulo [Os templates](/?c=langages-de-programmation&s=cpp&p=templates)), mas resolvida automaticamente por inferência em vez de declarada explicitamente a cada uso (`template<typename T>`).

## Comparado à tipagem dinâmica e à tipagem gradual

| | C | Python (anotações) | OCaml |
|---|---|---|---|
| Verificação | Na compilação | À escolha: nunca, ou via um [verificador externo](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) (`mypy`) | Na compilação, sistematicamente |
| Anotação necessária | Sempre (`int x`) | Opcional | Nunca (deduzida) |

O Python (cf. capítulo [A tipagem com anotações](/?c=langages-de-programmation&s=python&p=typage-avec-annotations)) permite adicionar indicações de tipo depois, verificadas por uma ferramenta separada que continua opcional: o programa roda mesmo que essas anotações estejam erradas ou ausentes. Em OCaml, não existe modo "sem verificação": um programa cujos tipos não batem simplesmente não compila, e portanto nunca pode chegar à execução com uma inconsistência de tipo.

## Uma rede de segurança, não uma restrição de verbosidade

A ideia comum sobre linguagens estaticamente tipadas é que elas obrigam a escrever mais: isso é verdade em C, onde cada variável carrega seu tipo. A inferência dissocia as duas coisas: o rigor da tipagem estática (erros de tipo detectados antes da execução, inclusive em código nunca executado durante os testes) sem o custo de digitação normalmente associado a ela.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O OCaml é estaticamente tipado mas deduz os tipos sem anotação (algoritmo de Hindley-Milner): o rigor da tipagem estática sem o custo de digitação habitual. |
| **Ferramentas utilizáveis** | O polimorfismo paramétrico (`'a`) para uma função válida em qualquer tipo, resolvido automaticamente. |
| **Armadilhas a evitar** | Achar que uma linguagem sem anotação de tipo é necessariamente dinamicamente tipada: o OCaml verifica tudo na compilação, sem exceção. |
| **Boas práticas** | Deixar o compilador inferir os tipos em vez de anotá-los sistematicamente; as anotações continuam úteis pontualmente para documentar uma assinatura complexa. |
