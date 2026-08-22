---
order: 6
---

# A derivada e o gradiente

Este capítulo responde a uma pergunta feita pela [curva de uma função](/?c=mathematiques&p=la-fonction-mathematique): o quanto uma função muda em um determinado ponto, e em que direção? É isso que medem a derivada, e depois o gradiente: sua generalização para uma função com várias entradas.

## A inclinação: a que velocidade uma função muda

Para uma função simples como `f(x) = 2x + 1`, a **inclinação** entre dois pontos mede o quanto `f` muda, em relação a uma mudança de `x`:

```text
f(1) = 3
f(3) = 7

inclinacao entre x=1 e x=3 = (f(3) - f(1)) / (3 - 1) = (7 - 3) / 2 = 2
```

Essa função é uma reta: sua inclinação vale 2 em todo lugar, quaisquer que sejam os dois pontos escolhidos. Isso não é mais verdade para uma função cuja curva não é uma reta, como veremos a seguir.

## A derivada: a inclinação em um único ponto preciso

Para uma curva (por exemplo `f(x) = x²`), a inclinação não é mais constante; ela depende do ponto observado. Para saber a inclinação **exatamente em um ponto**, calcula-se a inclinação entre esse ponto e outro cada vez mais próximo:

```text
f(x) = x²

Em torno de x = 2:
f(2)      = 4
f(2,1)    = 4,41      -> inclinacao entre 2 e 2,1   : (4,41 - 4) / 0,1     = 4,1
f(2,01)   = 4,0401    -> inclinacao entre 2 e 2,01  : (4,0401 - 4) / 0,01  = 4,01
f(2,001)  = 4,004001  -> inclinacao entre 2 e 2,001 : (4,004001 - 4) / 0,001 = 4,001
```

Quanto menor o intervalo, mais a inclinação calculada se aproxima de **4**: essa é a **derivada** de `f` no ponto `x = 2`, anotada `f'(2) = 4`. Para `f(x) = x²`, essa derivada vale `2x` em qualquer ponto (um resultado conhecido, que pode ser verificado aqui: `2 × 2 = 4`).

## O sinal da derivada indica a direção

| Sinal de `f'(x)` | Comportamento da função nesse ponto |
|---|---|
| Positivo | A função aumenta |
| Negativo | A função diminui |
| Zero | A função está momentaneamente plana (um pico, um vale, ou um platô) |

```plot-fonction
fn: x => x^2
domaine: -4, 4
label: f(x) = x², o mesmo vale do diagrama abaixo
```

```text
f(x)
  |  \                                /
  |   \                              /
  |    \          vale             /
  |     \_____   (derivada = 0)   _/
  |           \_________________/
  |     f' < 0     f'=0      f' > 0
  +------------------------------------ x
```

## Descer uma curva: avançar no sentido oposto à derivada

Se o objetivo é encontrar o ponto mais baixo de uma curva (seu mínimo), e só a inclinação no ponto atual é conhecida, avançar na direção **oposta** ao sinal dessa inclinação aproxima do mínimo:

```text
f(x) = x²   (minimo em x = 0)

Ponto de partida: x = 3         f'(x) = 2x = 6
novo x = x - 0,1 × f'(x) = 3 - 0,1 × 6 = 2,4

x = 2,4     f'(x) = 4,8    novo x = 2,4 - 0,1 × 4,8   = 1,92
x = 1,92    f'(x) = 3,84   novo x = 1,92 - 0,1 × 3,84  = 1,536
...                        -> se aproxima progressivamente de x = 0
```

O `0,1` controla o tamanho de cada passo: um passo muito grande pode ultrapassar o mínimo, um passo muito pequeno torna a descida muito lenta. Esse método (avançar no sentido oposto à derivada, passo a passo) se chama **descida do gradiente**.

> **Cuidado:** uma curva pode ter vários vales (vários mínimos locais). Esse método só garante encontrar o vale mais próximo do ponto de partida, não necessariamente o mais baixo de todos.
>
> **Boa prática:** ter em mente que um mínimo encontrado por esse método é local, não necessariamente o melhor possível: tentar vários pontos de partida diferentes é uma solução comum para reduzir esse risco.

## O gradiente: a derivada de uma função com várias entradas

Para uma função com várias entradas (veja [a função matemática](/?c=mathematiques&p=la-fonction-mathematique)), o **gradiente** generaliza a derivada: é um [vetor](/?c=mathematiques&p=vecteurs-et-produit-scalaire) que contém, para cada entrada, sua própria **derivada parcial**: o quanto a função muda se movermos apenas essa entrada, mantendo todas as outras fixas.

```text
f(x, y) = x² + y²

derivada parcial em relacao a x (y tratado como constante): 2x
derivada parcial em relacao a y (x tratado como constante): 2y

gradiente de f no ponto (3, 4) = [2×3, 2×4] = [6, 8]
```

O gradiente aponta na direção em que a função **aumenta** mais rápido. Avançar na direção oposta (subtrair o gradiente, componente por componente, veja [a soma de vetores](/?c=mathematiques&p=vecteurs-et-produit-scalaire)) faz então a função diminuir o mais rápido possível, exatamente a mesma lógica de uma única entrada, aplicada a cada componente do vetor:

```text
novo_vetor = vetor_antigo - taxa × gradiente
```

## O que reter

| | |
|---|---|
| **O que reter** | A derivada mede a inclinação de uma função em um ponto preciso (seu sinal indica se a função aumenta, diminui, ou está momentaneamente plana). O gradiente generaliza a derivada para uma função com várias entradas: um vetor de derivadas parciais, que aponta para a direção de maior aumento. |
| **Ferramentas úteis** | Nenhum cálculo manual na prática: as bibliotecas de deep learning calculam derivadas e gradientes automaticamente (veja a [diferenciação automática](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)). |
| **Armadilhas a evitar** | Confundir "um mínimo encontrado" com "o mínimo mais baixo possível": uma curva com vários vales só garante o vale mais próximo do ponto de partida. |
| **Boas práticas** | Tentar vários pontos de partida diferentes para reduzir o risco de ficar preso em um mínimo local pouco satisfatório. |
