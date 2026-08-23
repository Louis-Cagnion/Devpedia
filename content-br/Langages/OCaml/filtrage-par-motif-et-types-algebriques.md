---
order: 3
---

# Filtro por padrão e tipos algébricos

## Os tipos variantes (sum types)

Um **tipo variante** enumera todas as formas possíveis de um valor, cada uma podendo carregar seus próprios dados:

```ocaml
type forma =
  | Circulo of float                    (* raio *)
  | Retangulo of float * float          (* largura, altura *)
  | Triangulo of float * float * float  (* tres lados *)
```

Um valor do tipo `forma` é **exatamente uma** dessas três possibilidades, nunca uma mistura nem outra coisa, ao contrário de uma classe base com herança (cf. capítulo [Herança e polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme), tópico [C++](/?c=langages-de-programmation&s=cpp&p=cpp)), onde o conjunto de subclasses possíveis permanece aberto: qualquer um pode adicionar uma nova em outro lugar do código.

## O filtro por padrão (`match`)

`match` decompõe um valor conforme sua forma, e extrai diretamente os dados que ele carrega:

```ocaml
let area forma =
  match forma with
  | Circulo raio -> Float.pi *. raio *. raio
  | Retangulo (largura, altura) -> largura *. altura
  | Triangulo (a, b, c) ->
      let s = (a +. b +. c) /. 2.0 in
      sqrt (s *. (s -. a) *. (s -. b) *. (s -. c))
```

Comparado a um `switch` (cf. capítulo [As condições](/?c=langages-de-programmation&s=c&p=conditions), tópico [C](/?c=langages-de-programmation&s=c&p=c)), a diferença não é só estética: cada branch **extrai** diretamente `raio`, ou `largura` e `altura`, sem acesso manual a campos (`forma.raio`) nem distinção de tipo prévia.

## A exaustividade verificada na compilação

Se um branch é esquecido, o compilador OCaml sinaliza isso sozinho, sem precisar escrever o menor teste para perceber:

```ocaml
let area_incompleta forma =
  match forma with
  | Circulo raio -> Float.pi *. raio *. raio
  | Retangulo (largura, altura) -> largura *. altura
  (* Warning 8: este filtro nao e exaustivo -- o caso Triangulo nao esta coberto *)
```

Isso é apenas um **aviso** por padrão (o programa compila mesmo assim), mas um projeto sério geralmente ativa a opção que transforma esse tipo de aviso em erro bloqueante, tornando assim a exaustividade uma garantia, não uma simples sugestão. É uma diferença estrutural importante em relação a um `switch`/`if-elif` em C, [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript): um caso esquecido ali compila sem o menor aviso, e só falha na **execução**, se e somente se esse caso específico aparecer um dia em produção, uma das falhas silenciosas mais custosas de diagnosticar, já que só se manifesta meses depois de o código ter sido escrito, em uma entrada que ninguém havia previsto. Em OCaml, adicionar um novo caso a um tipo variante (`Losango of float`) faz surgir imediatamente, já na compilação, **cada** `match` do programa inteiro que precisaria ser atualizado para tratá-lo.

## O tipo `option`, uma alternativa estrutural ao `null`

`option` é ele mesmo um tipo variante, já definido na biblioteca padrão:

```ocaml
type 'a option = None | Some of 'a
```

```ocaml
let encontrar_usuario id =
  if id = 42 then Some "Alice" else None

match encontrar_usuario 42 with
| Some nome -> print_endline nome
| None -> print_endline "Usuario nao encontrado"
```

A diferença em relação ao `None` em [Python](/?c=langages-de-programmation&s=python&p=python) (cf. capítulo [As variáveis](/?c=langages-de-programmation&s=python&p=variables) para `is None`) é que o compilador **força** a tratar o caso `None`: o tipo de uma função que pode não encontrar nada é explicitamente `string option`, nunca simplesmente `string`. É portanto impossível esquecer de verificar a ausência de valor sem que o compilador sinalize isso, enquanto um [`NullPointerException`](https://docs.oracle.com/en/java/) ou um `TypeError: 'NoneType' object is not subscriptable` em Python só aparece na execução, no caminho de código específico que o esqueceu.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um tipo variante enumera todas as formas possíveis de um valor; `match` decompõe e extrai seus dados. O compilador verifica a exaustividade de um `match`: um caso esquecido é detectado antes da execução, não apenas no dia em que aparece em produção. |
| **Ferramentas utilizáveis** | `type ... = \| ...`, `match ... with`, o tipo `option` (`Some`/`None`) como alternativa estrutural a `null`. |
| **Armadilhas a evitar** | Deixar um `match` não exaustivo como simples aviso em vez de erro bloqueante. |
| **Boas práticas** | Ativar a opção que transforma um `match` não exaustivo em erro de compilação; usar `option` em vez de um valor que poderia estar ausente sem que o tipo sinalize isso. |
