---
order: 1
---

# A função matemática

Este capítulo estabelece uma noção retomada na estatística, no machine learning e na inteligência artificial: a função, no sentido matemático, que não deve ser confundida com a [função em programação](/?c=shells&s=bash&p=fonctions), que toma esse nome de empréstimo sem sempre respeitar sua regra (veja a armadilha mais abaixo).

Uma **função matemática** é uma regra que associa, a cada entrada, **sempre a mesma** saída.

```text
f(x) = x * 2

f(3)  -> 6   (sempre 6, cada vez que chamamos f com 3)
f(3)  -> 6   (chamada de novo com a mesma entrada: mesmo resultado, sem exceção)
f(5)  -> 10
```

> **Analogia:** uma máquina de bebidas automática bem calibrada: apertar o botão "A1" sempre dá a mesma bebida. Se um dia o mesmo botão desse ora um suco, ora um café, isso não seria mais uma função no sentido matemático: o resultado deixaria de depender só da entrada.

> **Cuidado:** uma função em programação (veja [As funções](/?c=shells&s=bash&p=fonctions) em [Bash](/?c=shells&s=bash&p=bash), ou seu equivalente em qualquer outra linguagem) **não** tem essa garantia: uma função que lê a hora atual, sorteia um número [aleatório](/?c=representation-des-donnees&p=aleatoire-et-generateurs), ou lê um arquivo pode retornar um resultado diferente a cada chamada, com a mesma entrada. Chamamos isso de função **não determinística**: um termo que vai voltar para explicar por que certos sistemas (incluindo um [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) nunca respondem exatamente a mesma coisa duas vezes.
>
> **Boa prática:** em programação, preferir uma função determinística (mesma entrada → sempre mesma saída) sempre que possível: uma mesma chamada dá então um resultado previsível, portanto mais simples de testar e depurar.

## Uma função pode receber várias entradas

Nada obriga uma função a ter apenas uma entrada:

```text
f(x, y) = x + y

f(2, 3)   -> 5
f(10, 1)  -> 11
```

Cada entrada adicional é um novo parâmetro da função, exatamente como uma função em programação pode receber vários argumentos. Essa forma com várias entradas é a mais comum na prática: um modelo de machine learning quase sempre combina várias entradas (idade, salário, histórico...) para produzir uma única saída.

> **Cuidado:** esquecer que uma entrada ausente não tem saída definida. `f(x, y) = x / y` não tem resultado para `y = 0`: a função simplesmente não é definida nesse ponto, não é um valor específico do tipo "zero" ou "vazio".
>
> **Boa prática:** identificar, antes de programar uma função, as entradas para as quais ela não tem uma saída sensata (divisão por zero, raiz quadrada de um número negativo...), e decidir explicitamente o que fazer nesses casos (erro, valor padrão) em vez de deixar a linguagem reagir do seu próprio jeito.

## Representar uma função por uma curva

Em um gráfico, cada par (entrada, saída) se torna um ponto: ligar todos esses pontos desenha a **curva** da função, aqui para `f(x) = x²`:

```plot-fonction
fn: x => x^2
domaine: -4, 4
label: f(x) = x²
```

Uma curva que sobe significa que a saída aumenta com a entrada; uma curva que desce significa o contrário: aqui, a curva desce até `x = 0` e depois volta a subir, exatamente o tipo de vale que o capítulo sobre [a derivada e o gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient) ensina a identificar, para explicar como um computador "desce" uma curva para encontrar seu ponto mais baixo.

## O que reter

| | |
|---|---|
| **O que reter** | Uma função matemática associa a cada entrada sempre a mesma saída (`f(x)`), pode receber várias entradas (`f(x, y)`), e se representa visualmente por uma curva. |
| **Ferramentas úteis** | Nenhuma ferramenta específica: a notação `f(x) = ...` basta para descrever uma função no papel. |
| **Armadilhas a evitar** | Confundir uma função matemática (sempre determinística) com uma função em programação, que pode não ser (hora atual, aleatoriedade, leitura de arquivo). Esquecer que uma entrada pode não ter saída definida (divisão por zero). |
| **Boas práticas** | Verificar que uma função em programação supostamente "pura" (mesma entrada → mesma saída) não depende de nenhuma fonte externa mutável. Decidir explicitamente o que fazer com entradas sem saída definida em vez de deixar a linguagem reagir do seu próprio jeito. |
