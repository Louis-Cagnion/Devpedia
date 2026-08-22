---
order: 5
---

# A aleatoriedade e os geradores

Um processador é uma máquina determinística: entradas idênticas, saídas idênticas. Portanto, ele não pode produzir aleatoriedade de verdade. O que as funções `random()` fornecem não é aleatoriedade, mas uma sequência de números **calculados** que se parece estatisticamente com aleatoriedade. Daí seu nome exato: geradores de números **pseudo**aleatórios (PRNG).

Essa distinção não é um detalhe teórico: confundir as duas categorias de geradores é uma falha de segurança clássica.

## Um PRNG é uma sequência determinística

Um PRNG parte de um estado inicial, a **semente** (*seed*), e aplica uma fórmula para produzir cada valor seguinte. Mesma semente, mesma sequência, sempre, em todas as máquinas.

```python
import random

random.seed(42)
print(random.randint(1, 100))  # 82
print(random.randint(1, 100))  # 15

random.seed(42)                # voltamos para a mesma semente
print(random.randint(1, 100))  # 82 -> identico
```

Em C, `rand()` sem `srand()` usa implicitamente a semente `1`: um programa relançado produz **exatamente a mesma sequência**. Daí o hábito de semear com a hora atual:

```c
srand(time(NULL));   // semente diferente a cada segundo
int sorteio = rand() % 100;
```

**Esse determinismo costuma ser uma qualidade**, não um defeito:

- **reprodutibilidade científica**: fixar a semente permite repetir exatamente um treinamento de modelo (veja [O treinamento e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient));
- **testes**: um teste que usa aleatoriedade precisa ser reproduzível para ser diagnosticável;
- **geração procedural**: um mundo de jogo inteiro pode ser regenerado de forma idêntica a partir de uma única semente.

## A armadilha da semente previsível

Semear com `time(NULL)` tem um lado negativo: a hora é **conhecida por todos**. Se um token de sessão é sorteado de um PRNG semeado com o timestamp, um atacante que conhece aproximadamente a hora de criação tem apenas alguns milhares de sementes para tentar regenerar a sequência completa.

Mais grave: um PRNG clássico é projetado para ser **rápido e bem distribuído**, não imprevisível. Com valores observados suficientes, é possível descobrir o estado interno e **prever todos os valores seguintes**. Isso não é uma falha de implementação, está fora do seu propósito.

## Duas famílias que não devem ser confundidas

| | PRNG clássico | CSPRNG (criptográfico) |
|---|---|---|
| Objetivo | Velocidade, boa distribuição | Imprevisibilidade |
| Previsível? | Sim, a partir do estado | Não, mesmo conhecendo as saídas |
| Fonte da semente | Frequentemente o relógio | Entropia do sistema |
| C | `rand()` | `getrandom()`, `/dev/urandom` |
| Python | `random` | `secrets` |
| PHP | `rand()`, `mt_rand()` | `random_bytes()`, `random_int()` |
| JavaScript | `Math.random()` | `crypto.getRandomValues()` |

**A regra é simples e sem exceção: sempre que o valor precisar ser imprevisível, use um CSPRNG.** Isso vale para tokens de sessão, tokens CSRF, códigos de redefinição de senha, salts, identificadores secretos, chaves.

```python
import secrets
token = secrets.token_hex(32)     # imprevisivel
```

```php
$token = bin2hex(random_bytes(32));   // e nao uniqid() ou mt_rand()
```

Veja o capítulo [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite) de PHP, onde os tokens CSRF se baseiam justamente em `random_bytes()`.

> Por outro lado, não use um CSPRNG para embaralhar uma lista de exibição ou simular um dado: é mais lento e consome entropia sem benefício.

## De onde vem a entropia real?

O sistema operacional coleta eventos físicos dificilmente previsíveis: intervalos precisos entre as teclas pressionadas e as interrupções de hardware, ruído térmico, e nos processadores recentes uma instrução dedicada ([`RDRAND`](https://en.wikipedia.org/wiki/RDRAND)). Ele alimenta com isso um reservatório de entropia, exposto no Linux via [`/dev/urandom`](https://man7.org/linux/man-pages/man4/urandom.4.html).

É daí que um CSPRNG extrai sua semente, e é isso que o torna imprevisível: a própria semente não depende de nenhuma fórmula.

## O viés do módulo

Um erro discreto mas real: trazer um sorteio para um intervalo com `%` **desequilibra** as probabilidades quando a faixa do gerador não é um múltiplo do intervalo.

```c
// rand() retorna 0..32767, ou seja, 32768 valores
int sorteio = rand() % 3;   // 0..2
```

32768 não é divisível por 3: os valores `0` e `1` saem 10.923 vezes, o valor `2` apenas 10.922 vezes. O viés aqui é insignificante, mas se torna relevante quando o intervalo solicitado se aproxima da faixa do gerador.

A solução é **rejeitar** os sorteios que caem na zona excedente, ou mais simplesmente usar uma função que faz isso por você:

```python
random.randint(0, 2)  # gerencia a distribuicao uniforme
secrets.randbelow(3)  # idem, em versao criptografica
```

O mesmo raciocínio se aplica a `Math.random()` em JavaScript ou `mt_rand()` em PHP: prefira a função dedicada a um `%` improvisado.

## Resumo

| A reter | |
|---|---|
| Um PRNG é determinístico | Mesma semente → mesma sequência |
| O determinismo é útil | Testes, reprodutibilidade científica, geração procedural |
| Semente = relógio | Previsível: nunca para segurança |
| Valor que precisa ser secreto | CSPRNG obrigatório (`secrets`, `random_bytes`, `crypto`) |
| Trazer para um intervalo | Evitar `%` bruto: viés do módulo |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um PRNG clássico é uma sequência determinística (mesma semente = mesma sequência): útil para testes e reprodutibilidade, mas nunca para um valor que precisa permanecer secreto. Um CSPRNG extrai sua semente da entropia do sistema, o que o torna imprevisível. |
| **Ferramentas úteis** | `secrets`/`random_bytes()`/`crypto.getRandomValues()` (CSPRNG) vs `random`/`rand()`/`Math.random()` (PRNG clássico). |
| **Armadilhas a evitar** | Usar um PRNG clássico (ou uma semente previsível como o relógio) para um token de sessão, um salt, ou qualquer valor que precise permanecer secreto. |
| **Boas práticas** | CSPRNG sistemático sempre que um valor precisar ser imprevisível; usar uma função dedicada (`randint`, `randbelow`) em vez de um `%` improvisado para trazer um sorteio para um intervalo. |
