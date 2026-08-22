---
order: 2
---

# Vetores e produto escalar

Um único número basta para representar uma informação isolada (veja [a variável](/?c=bases-de-l-informatique&p=la-variable)). Mas frequentemente, vários números descrevem juntos uma única coisa: uma posição, as características de um cliente. É isso que representa um **vetor**.

Um vetor é uma lista ordenada de números, tratada como uma única entidade.

```text
Posicao de um ponto em um plano:  [3, 5]
                                     |  |
                                     |  segunda coordenada (altura, y)
                                     primeira coordenada (largura, x)
```

```vecteurs
vecteurs: (3, 5)
label: O vetor [3, 5]
```

> **Analogia:** uma lista de compras em que a ordem tem um sentido preciso (2 kg de maçãs, depois 3 pães): inverter a ordem mudaria o que cada número representa, não apenas sua posição na lista.

> **Cuidado:** achar que a ordem dos componentes é intercambiável. `[3, 5]` e `[5, 3]` não descrevem o mesmo ponto: o primeiro componente sempre tem o mesmo papel (aqui, a posição horizontal), qualquer que seja seu valor.

> **Boa prática:** documentar o que cada posição de um vetor representa desde sua criação (um comentário, um nome de variável explícito): nada nos números em si lembra o que eles significam.

## Um vetor pode ter bem mais de dois números

Nada limita um vetor a dois componentes:

```text
Um cliente:  [idade, salario, tempo_empresa] = [34, 42000, 5]
```

Cada componente adicional acrescenta uma **dimensão**. Um vetor com 3 componentes ainda se representa no espaço (como um ponto em 3D), mas um vetor com 100 ou 1000 componentes (o caso comum em inteligência artificial para representar uma palavra ou uma imagem) não se desenha mais; só o cálculo continua funcionando exatamente do mesmo jeito.

## Somar dois vetores

```text
[1, 2] + [3, 4] = [1+3, 2+4] = [4, 6]
```

```vecteurs
vecteurs: (1, 2), (3, 4), (4, 6)
label: [1, 2] + [3, 4] = [4, 6]
```

Somam-se os componentes um a um, na mesma posição.

> **Cuidado:** somar dois vetores de tamanhos diferentes não tem sentido (`[1, 2] + [1, 2, 3]` não é definido: qual componente iria com qual?). Um programa que tenta essa operação geralmente lança um erro explícito (ex.: *"shapes mismatch"* no [NumPy](/?c=data-science&p=numpy)) em vez de adivinhar.
>
> **Boa prática:** verificar que dois vetores têm a mesma dimensão antes de combiná-los, em vez de descobrir a incompatibilidade só na hora de executar.

## O produto escalar: reduzir dois vetores a um único número

O **produto escalar** (*dot product*) de dois vetores de mesma dimensão multiplica seus componentes um a um, e então soma todos esses produtos:

```text
[1, 2, 3] . [4, 5, 6] = (1×4) + (2×5) + (3×6) = 4 + 10 + 18 = 32
```

Diferente da soma, o resultado não é um vetor, mas um **único número**: daí o nome "escalar".

Esse número mede o quanto dois vetores apontam na mesma direção:

| Resultado do produto escalar | Interpretação |
|---|---|
| Grande e positivo | Os dois vetores apontam de forma geral na mesma direção |
| Próximo de zero | Os dois vetores não têm relação direcional relevante entre si |
| Negativo | Os dois vetores apontam de forma geral em direções opostas |

> **Boa prática:** essa mesma operação (multiplicar termo a termo, depois somar) reaparece em muitos cálculos mais adiante, principalmente para combinar várias entradas em um único valor dando a cada uma um **peso**, um número que reflete sua importância relativa no resultado final (uma entrada com peso alto pesa mais na soma que uma entrada com peso baixo). Diz-se então que o resultado é uma soma **ponderada**. Reconhecer essa operação nessa forma evita redescobri-la sempre com um nome diferente.

## A norma de um vetor: seu comprimento

Um vetor com 2 componentes como `[3, 4]` pode ser lido como um ponto em um plano (veja o primeiro exemplo deste capítulo), alcançado a partir de um ponto de partida comum a todos os vetores: a **origem**, o ponto `[0, 0]`. A **norma** de um vetor é a distância entre a origem e esse ponto: o caminho mais direto, em linha reta, não a soma das duas distâncias percorridas em ângulo reto (`3 + 4 = 7` estaria errado):

```text
        (3,4)
          /|
         / |
    5   /  | 4   <- segundo componente do vetor: distancia vertical desde a origem
       /   |
      /____|
    (0,0)  3     <- primeiro componente do vetor: distancia horizontal desde a origem
   origem
```

O trajeto direto (a diagonal, comprimento 5) é sempre mais curto que o trajeto em ângulo reto (3 depois 4, ou seja 7): é exatamente isso que calcula a fórmula da norma, que vem do [teorema de Pitágoras](https://en.wikipedia.org/wiki/Pythagorean_theorem): a raiz quadrada da soma dos quadrados de cada componente.

```text
norma([3, 4]) = raiz(3² + 4²) = raiz(9 + 16) = raiz(25) = 5
```

Dividir cada componente de um vetor pela sua própria norma o **normaliza**: sua direção permanece a mesma, mas seu comprimento passa a ser exatamente 1.

```text
[3, 4] tem norma 5 (calculado acima)

Vetor normalizado = [3/5, 4/5] = [0.6, 0.8]

Verificacao, recalculando a norma desse novo vetor:
norma([0.6, 0.8]) = raiz(0.6² + 0.8²) = raiz(0.36 + 0.64) = raiz(1) = 1
```

Esse resultado não é uma coincidência particular desse exemplo: dividir cada componente pela norma divide mecanicamente a própria norma por esse mesmo valor: uma norma `N` dividida por `N` sempre dá `1`, qualquer que seja o vetor de partida. Útil para comparar dois vetores apenas pela direção, sem que seus respectivos comprimentos distorçam a comparação.

> **Cuidado:** normalizar um vetor nulo (`[0, 0]`) equivale a dividir por uma norma de 0: uma operação não definida, não apenas um erro de arredondamento.
>
> **Boa prática:** verificar que um vetor não é nulo antes de normalizá-lo, em vez de deixar o programa falhar em uma divisão por zero.

## O que reter

| | |
|---|---|
| **O que reter** | Um vetor é uma lista ordenada de números tratada como uma única entidade. O produto escalar reduz dois vetores de mesma dimensão a um único número, que mede o quanto eles apontam na mesma direção. A norma é o comprimento de um vetor. |
| **Ferramentas úteis** | Nenhuma ferramenta específica para o cálculo manual; na prática, uma biblioteca como o [NumPy](/?c=data-science&p=numpy) realiza essas operações diretamente em vetores inteiros, sem loop explícito. |
| **Armadilhas a evitar** | Somar ou combinar dois vetores de dimensões diferentes. Normalizar um vetor nulo (divisão por uma norma de 0). |
| **Boas práticas** | Verificar que dois vetores têm a mesma dimensão antes de qualquer operação entre eles. Documentar o que cada componente de um vetor representa desde sua criação. |
