---
order: 5
---

# As probabilidades básicas

Este capítulo apresenta as probabilidades, uma noção retomada mais adiante para descrever o que um modelo prediz: não uma única resposta certa, mas várias respostas possíveis, cada uma com sua própria chance de ocorrer.

## O que é uma probabilidade?

Uma **probabilidade** mede o quanto um evento tem chances de ocorrer: um número entre 0 (impossível) e 1 (certo).

| Valor | Significado | Exemplo |
|---|---|---|
| 0 | Impossível | Obter um 7 ao lançar um dado de 6 lados |
| 0,5 | Tantas chances de ser o caso quanto o contrário | Obter cara ao lançar uma moeda equilibrada |
| 1 | Certo | Obter um número menor que 10 ao lançar um dado de 6 lados |

> **Analogia:** um medidor graduado de 0 a 1, como um medidor de combustível, mas que mede a confiança de que um evento ocorra em vez de uma quantidade de combustível.

Anota-se `P(evento) = valor`. Para um dado de 6 lados equilibrado (cada lado tem tantas chances de sair quanto os outros): `P(obter um 3) = 1/6 ≈ 0,167`.

## Uma distribuição de probabilidade: vários resultados, uma única soma

Quando um evento tem vários resultados possíveis, cada um recebe sua própria probabilidade: o conjunto dessas probabilidades se chama uma **distribuição de probabilidade**:

```text
Dado de 6 lados equilibrado:

P(1) = 0,167
P(2) = 0,167
P(3) = 0,167
P(4) = 0,167
P(5) = 0,167
P(6) = 0,167
        -----
Soma = 1,000
```

```distribution
barres: 1=0.167, 2=0.167, 3=0.167, 4=0.167, 5=0.167, 6=0.167
label: Distribuição de um dado de 6 lados equilibrado
```

Não importa como as probabilidades se distribuam entre os resultados possíveis, sua soma sempre vale exatamente **1**: um dos resultados listados obrigatoriamente ocorre, não há nada fora dessa lista.

> **Cuidado:** uma distribuição calculada por um programa que não soma exatamente 1 (arredondamento impreciso, resultado possível esquecido no cálculo) não é uma distribuição de probabilidade válida.
>
> **Boa prática:** depois de calcular uma distribuição de probabilidade, verificar se a soma de seus valores realmente dá 1 (ou muito próximo, considerando os arredondamentos) antes de usá-la mais adiante em um cálculo.

## Uma distribuição não é necessariamente equilibrada

Nada obriga cada resultado a ter a mesma probabilidade que os outros: um dado de 6 lados equilibrado é um caso particular, não a regra geral:

```text
Uma previsao do tempo que favorece fortemente a chuva:

P(chuva) = 0,80
P(sol)   = 0,15
P(neve)  = 0,05
            -----
Soma      = 1,00
```

```distribution
barres: Chuva=0.80, Sol=0.15, Neve=0.05
label: Distribuição de tempo desequilibrada
```

O resultado mais provável (aqui, a chuva) não é o único possível: apenas aquele cuja probabilidade é mais alta. Essa distinção vai ser retomada exatamente assim mais adiante: um modelo que prediz "provavelmente X" sempre deixa aberta a possibilidade de um resultado diferente, com uma probabilidade menor mas não nula.

> **Cuidado:** confundir "o resultado mais provável" com "o único resultado possível": uma probabilidade de 0,80 ainda significa 20% de chance de ser outra coisa, não uma certeza.
>
> **Boa prática:** raciocinar sobre a distribuição inteira em vez de apenas seu resultado mais provável, sempre que os resultados menos prováveis tiverem consequências importantes caso ocorram mesmo assim.

## O que reter

| | |
|---|---|
| **O que reter** | Uma probabilidade é um número entre 0 (impossível) e 1 (certo). Uma distribuição de probabilidade lista a probabilidade de cada resultado possível; essas probabilidades sempre somam 1. O resultado mais provável não é o único possível. |
| **Ferramentas úteis** | Nenhuma ferramenta específica: a notação `P(evento) = valor` basta para raciocinar no papel. |
| **Armadilhas a evitar** | Uma distribuição cuja soma não vale exatamente 1 (erro de cálculo). Confundir "o mais provável" com "certo". |
| **Boas práticas** | Verificar que uma distribuição calculada realmente soma 1 antes de usá-la. Raciocinar sobre a distribuição inteira, não apenas sobre seu resultado mais provável, quando resultados raros têm consequências importantes. |
