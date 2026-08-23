---
order: 1
---

# Programação funcional vs imperativa

## Instruções contra expressões

Em C, [Python](/?c=langages-de-programmation&s=python&p=python) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), um `if` é uma **instrução**: ele não produz nenhum valor, apenas dispara a execução de um bloco ou de outro.

```python
# Python : if e uma instrucao, cada branch precisa atribuir explicitamente
if idade >= 18:
    mensagem = "maior de idade"
else:
    mensagem = "menor de idade"
```

Em OCaml, como na grande maioria das linguagens funcionais, `if` é uma **expressão**: ele produz diretamente um valor, como faria um operador ternário.

```ocaml
let mensagem = if idade >= 18 then "maior de idade" else "menor de idade"
```

Essa ideia se generaliza a toda a linguagem: um bloco inteiro (delimitado por `let ... in`) é ele mesmo uma expressão, cujo valor é o de sua última linha.

```ocaml
let resultado =
  let a = 2 in
  let b = 3 in
  a + b            (* resultado = 5 : e o valor de todo o bloco *)
```

Não existe então, estruturalmente, distinção entre "o que produz um valor" e "o que executa uma ação": tudo produz um valor, inclusive `()` (*unit*, o equivalente de `void`) para uma expressão executada apenas por seu efeito.

## Ligação contra mutação

`let x = 5` em OCaml não reserva um local de memória reatribuível: é uma **ligação** (*binding*), que associa o nome `x` ao valor `5` no escopo onde ele é visível. Reutilizar `let x = ...` não modifica nada, isso cria um novo nome que mascara o antigo.

```ocaml
let x = 5 in
let x = x + 1 in  (* nova ligacao, NAO modifica o x anterior *)
print_int x       (* 6 *)
```

```python
# Python : x e reatribuido, a mesma variavel muda de valor
x = 5
x = x + 1
print(x)   # 6
```

O resultado exibido é idêntico, mas o mecanismo difere: em Python, uma única posição de memória mudou de conteúdo; em OCaml, uma nova ligação simplesmente tomou o lugar da antiga no escopo atual. O OCaml propõe uma saída explícita quando uma posição realmente mutável é necessária, a referência (`ref`), aprofundada no capítulo sobre imutabilidade e funções puras.

## Laços contra recursão

Sem variável mutável por padrão, um laço clássico (que se apoia em um contador reatribuído a cada volta) não tem seu lugar natural em estilo funcional. O substituto é a **recursão**: uma função que chama a si mesma, cada chamada carregando o equivalente de uma volta de laço.

```ocaml
(* Estilo imperativo: contador mutavel, laco for sobre um array *)
let soma_imperativa array =
  let total = ref 0 in
  for i = 0 to Array.length array - 1 do
    total := !total + array.(i)
  done;
  !total

(* Estilo funcional: recursao, nenhuma variavel mutavel *)
let rec soma_funcional = function
  | [] -> 0
  | cabeca :: resto -> cabeca + soma_funcional resto
```

Os dois estilos coexistem em OCaml: `ref`, `for` e `while` existem de verdade na linguagem, não é uma simulação. O capítulo sobre recursão e funções de ordem superior detalha por que a versão recursiva continua praticável mesmo em listas grandes.

## Síntese

| | Imperativo (C, Python, JS...) | Funcional (OCaml) |
|---|---|---|
| Unidade básica | Instrução (nenhum valor) | Expressão (sempre produz um valor) |
| Variáveis | Reatribuíveis por padrão | Ligações imutáveis por padrão, mutação explícita via `ref` |
| Repetição | Laços (`for`, `while`) com contador mutável | Recursão, funções de ordem superior (`map`, `fold`) |
| Modelo mental | "O que fazer, em que ordem" | "Qual valor, a partir de quais outros valores" |

Nenhum estilo é estritamente superior: o estilo imperativo geralmente se encaixa mais naturalmente em um recurso que realmente muda no tempo (o estado de uma interface, uma conexão de rede), enquanto o estilo funcional se destaca em transformações de dados puras. O restante deste tópico detalha as razões concretas dessa vantagem em vez de tomá-la como certa.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Em OCaml, `if` e todo bloco são expressões (produzem um valor), `let` cria uma ligação imutável (não uma variável reatribuível), e a recursão substitui o laço com contador mutável. |
| **Ferramentas utilizáveis** | `let ... in`, `if ... then ... else` como expressão, `let rec` para uma função recursiva. |
| **Armadilhas a evitar** | Confundir uma nova ligação (`let x = x + 1`) com uma reatribuição: o `x` antigo não é modificado, apenas mascarado no escopo seguinte. |
| **Boas práticas** | Escolher o estilo conforme a natureza do problema: imperativo para um estado que realmente muda no tempo, funcional para uma transformação de dados pura. |
