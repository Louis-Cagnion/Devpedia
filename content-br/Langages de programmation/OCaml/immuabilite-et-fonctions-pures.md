---
order: 2
---

# Imutabilidade e funções puras

## A imutabilidade por padrão, e sua saída explícita

Uma ligação OCaml (`let x = ...`) não pode ser reatribuída: modificar um valor supõe criar um **novo** valor a partir do antigo, nunca modificar o original no lugar. Quando uma posição realmente mutável é necessária, o OCaml exige declará-la explicitamente com uma **referência**:

```ocaml
let contador = ref 0        (* uma referencia: uma posicao mutavel, explicita *)
contador := !contador + 1   (* := atribui um novo valor *)
print_int !contador         (* ! le o valor atual -> 1 *)
```

A sintaxe `ref`/`:=`/`!` torna toda mutação **visível no código**: impossível mutar um valor por acidente, ao contrário de uma variável Python ou JavaScript, mutável por padrão sem nenhuma marca distintiva no local onde é modificada.

## Estruturas de dados persistentes

Adicionar um elemento a uma lista OCaml nunca modifica a lista de origem: o operador `::` constrói uma **nova** lista, que compartilha seu final (sua "cauda") com a antiga em vez de copiá-la inteiramente.

```ocaml
let lista_a = [2; 3; 4]
let lista_b = 1 :: lista_a   (* lista_b = [1; 2; 3; 4] *)
(* lista_a continua existindo, inalterada: [2; 3; 4] *)
```

```python
# Python: append() muta a lista existente, so sobra uma unica lista
lista_a = [2, 3, 4]
lista_a.append(1)   # lista_a vira [2, 3, 4, 1] -- a original nao existe mais
```

Essa estrutura chamada **persistente** torna possível manter várias versões de uma mesma coleção sem nunca copiá-las integralmente: `lista_a` e `lista_b` coexistem, compartilham a memória do que têm em comum, e nenhuma das duas pode corromper a outra.

## Funções puras

Uma função é **pura** se satisfaz duas condições: sua saída depende apenas de seus argumentos (a mesma entrada sempre produz a mesma saída), e sua execução não produz nenhum **efeito colateral** observável (nenhuma mutação de um estado externo à função, nenhuma escrita em disco, nenhuma exibição).

```ocaml
let quadrado x = x * x            (* pura: depende apenas de x, nenhum efeito colateral *)

let contador = ref 0
let quadrado_impuro x =
  contador := !contador + 1;       (* efeito colateral: modifica um estado externo *)
  x * x
```

`quadrado` pode ser substituída por seu valor de retorno em qualquer lugar do programa sem mudar seu comportamento, uma propriedade chamada **transparência referencial**. `quadrado_impuro`, por sua vez, não pode: chamá-la ou não muda o conteúdo de `contador`, então a ordem e o número de chamadas contam, não apenas o resultado final.

## Por que isso importa na prática

- **Testar se torna trivial**: uma função pura se testa com entradas e uma saída esperada, sem precisar construir um estado prévio nem verificar um efeito colateral depois da chamada, o exato oposto de uma dependência oculta.
- **Nenhuma surpresa entre duas chamadas**: como nenhum estado compartilhado pode ser modificado sem o conhecimento de quem chama, duas chamadas idênticas sempre dão o mesmo resultado, inclusive executadas em paralelo em núcleos diferentes: um estado compartilhado mutado simultaneamente por várias threads é justamente uma das causas clássicas de bug difícil de reproduzir.
- **Uma armadilha estruturalmente impossível**: o argumento padrão mutável em Python (cf. capítulo [As funções](/?c=langages-de-programmation&s=python&p=fonctions)) só existe porque um objeto mutável compartilhado pode ser capturado silenciosamente entre várias chamadas. Sem mutação implícita, essa armadilha específica simplesmente não tem como acontecer.

> **Nuance:** nenhum programa real é composto 100% de funções puras: exibir um resultado, ler um arquivo, responder a uma requisição de rede são efeitos colaterais por natureza. O objetivo não é eliminá-los, mas **isolá-los**: reduzir ao mínimo a parte do código que depende deles, para concentrar o esforço de teste e revisão onde os bugs são mais prováveis.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma ligação OCaml é imutável por padrão; `ref`/`:=`/`!` tornam toda mutação explícita e visível. Uma função pura depende apenas de seus argumentos e não tem nenhum efeito colateral: sua saída é portanto previsível e testável isoladamente. |
| **Ferramentas utilizáveis** | `ref`, `:=`, `!`, as estruturas de dados persistentes (listas imutáveis compartilhando sua memória). |
| **Armadilhas a evitar** | Esperar que uma função com efeito colateral (via `ref`) dê o mesmo resultado a cada chamada, independentemente da ordem de execução. |
| **Boas práticas** | Isolar os efeitos colaterais em uma pequena parte do código em vez de eliminá-los inteiramente; concentrar o esforço de teste onde eles estão. |
