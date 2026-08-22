---
order: 4
---

# O feed de notícias: construir o fluxo de cada um (fan-out)

Um feed de notícias (Instagram, mas o princípio é idêntico na maioria das redes sociais) precisa exibir, para cada usuário, as publicações de todas as contas que ele segue, em ordem. O problema não é armazenar as publicações: é saber **quando** montar, para cada usuário, a lista do que ele deve ver. Duas estratégias opostas respondem a essa questão, chamadas **fan-out** (distribuição) na escrita ou na leitura.

## Fan-out na escrita (push): preparar o feed com antecedência

Assim que uma conta publica, o sistema escreve imediatamente essa publicação no feed **já pré-calculado** de cada um de seus seguidores:

```text
Conta A publica
   |
   v
Escreve a publicacao no feed pre-calculado de:
   Seguidor 1, Seguidor 2, Seguidor 3, ... Seguidor n
   (tantas escritas quanto seguidores)

Mais tarde, o seguidor 1 abre seu feed:
   -> le diretamente seu feed ja pronto (rapido)
```

Ler o próprio feed se torna então muito rápido (uma simples leitura de uma lista já pronta), ao custo de um trabalho de escrita multiplicado a cada publicação.

## Fan-out na leitura (pull): montar tudo no momento da consulta

Ao contrário, nada é pré-calculado na publicação. Quando um usuário abre seu feed, o sistema busca ao vivo as últimas publicações de todas as contas que ele segue, e as monta naquele momento:

```text
Conta A publica
   |
   v
Nada acontece para os seguidores (escrita unica, pouco custosa)

Mais tarde, o seguidor 1 abre seu feed:
   -> busca as ultimas publicacoes de CADA conta seguida
   -> monta e ordena tudo nesse instante (custoso se muitas contas seguidas)
```

## Comparativo e o "problema da celebridade"

| | Fan-out na escrita (push) | Fan-out na leitura (pull) |
|---|---|---|
| Custo na publicação | Uma escrita por seguidor | Uma única escrita, pouco custosa |
| Custo na leitura do feed | Uma simples leitura, muito rápida | Montar e ordenar ao vivo, mais lento |
| Caso problemático | Uma conta seguida por milhões de pessoas: uma única publicação dispara milhões de escritas simultâneas | Um usuário que segue milhares de contas: cada abertura do feed consulta milhares de fontes |

> **Cuidado:** escolher apenas o fan-out na escrita para uma rede em que algumas contas têm milhões de seguidores (o "problema da celebridade"). Uma única publicação de uma conta assim dispararia tantas escritas quanto seguidores de uma vez, um pico que até um sistema com [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) absorve com dificuldade.
>
> **Boa prática:** um modelo **híbrido**, usado pela maioria das grandes redes sociais: fan-out na escrita para a maioria das contas (poucos seguidores, leitura rápida garantida), e mudança automática para um fan-out na leitura acima de um certo número de seguidores (as publicações de uma conta-celebridade são obtidas ao vivo no momento da leitura, em vez de empurradas em massa a cada publicação). As escritas massivas do fan-out na escrita são elas mesmas delegadas a uma [fila](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) em segundo plano, para que o autor da publicação não espere o fim de todas essas escritas antes de receber uma confirmação.

## O que reter

| | |
|---|---|
| **O que reter** | O fan-out na escrita pré-calcula o feed de cada seguidor na publicação (leitura rápida, escrita custosa em grande escala); o fan-out na leitura monta o feed sob demanda (escrita leve, leitura mais custosa). Um modelo híbrido muda para a leitura no caso de contas com número muito alto de seguidores. |
| **Ferramentas úteis** | Uma fila para distribuir as escritas massivas do fan-out na escrita em segundo plano. |
| **Armadilhas a evitar** | Generalizar o fan-out na escrita a todas as contas sem exceção, incluindo as que têm milhões de seguidores. |
| **Boas práticas** | Modelo híbrido, com um limiar de número de seguidores que muda o comportamento. |
