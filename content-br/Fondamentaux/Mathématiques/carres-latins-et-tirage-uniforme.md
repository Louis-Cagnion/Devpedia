---
order: 9
---

# Quadrados latinos e sorteio uniforme com uma cadeia de Markov

Para testar um programa, muitas vezes é preciso ter exemplos **sorteados de forma uniforme**: cada exemplo possível deve ter exatamente a mesma chance de sair (ver [As probabilidades básicas](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). Para alguns objetos, isso é surpreendentemente difícil. Este capítulo usa o exemplo dos quadrados latinos, usados por quebra-cabeças como o Sudoku ou o Skyscraper.

## O quadrado latino

Um **quadrado latino** de ordem n é uma grade n × n preenchida com n símbolos, cada um **uma única vez por linha e por coluna**:

```
1 2 3 4
2 1 4 3
3 4 1 2
4 3 2 1
```

O número deles explode (sequência [A002860](https://oeis.org/A002860) da enciclopédia de sequências de inteiros):

| n | Número de quadrados latinos |
|---|---|
| 3 | 12 |
| 4 | 576 |
| 5 | 161.280 |
| 6 | 812.851.200 |

Os valores até n = 5 foram verificados aqui por enumeração completa.

## A armadilha da mistura: a isotopia

Método ingênuo para "sortear um quadrado": partir do **quadrado cíclico** (cada linha deslocada de uma posição) e misturar ao acaso as suas linhas, colunas e símbolos.

```
quadrado cíclico      depois de trocar as linhas 1 e 3, e depois os símbolos 1 e 4
1 2 3 4               3 1 4 2
2 3 4 1               2 3 1 4
3 4 1 2               4 2 3 1
4 1 2 3               1 4 2 3
```

Dois quadrados que podem ser transformados um no outro por essas permutações são **isótopos**. O problema: nem todo quadrado latino é isótopo do quadrado cíclico. Verificado em 4 × 4:

| Quadrados 4 × 4 | Número | Proporção |
|---|---|---|
| Isótopos do quadrado cíclico (alcançáveis pela mistura) | 432 | 75% |
| Os outros (entre eles o do início do capítulo) | 144 | 25% |
| Total | 576 | 100% |

A mistura portanto **nunca** produz um quarto dos quadrados 4 × 4, e a parte inalcançável cresce com n. Uma bateria de testes construída assim só testa uma família particular de grades: as suas medidas podem enganar.

## A cadeia de Markov: um passeio ao acaso

Uma **cadeia de Markov** é uma sequência de estados em que o estado seguinte é sorteado **dependendo apenas do estado atual**, não do caminho percorrido antes. Exemplo com o tempo:

| Hoje | Amanhã: sol | Amanhã: chuva |
|---|---|---|
| Sol | 0,8 | 0,2 |
| Chuva | 0,4 | 0,6 |

Deixando a cadeia rodar por muito tempo, a frequência de cada estado se estabiliza (aqui, 2 dias de sol em cada 3), qualquer que seja o ponto de partida: é a **distribuição estacionária**.

A ideia do **MCMC** (*Markov Chain Monte Carlo*): para sortear um objeto difícil de construir diretamente, inventa-se um passeio aleatório entre esses objetos cuja distribuição estacionária seja **uniforme**. Depois de passos suficientes, o estado atual é um sorteio (quase) uniforme.

## A cadeia de Jacobson-Matthews

Jacobson e Matthews (1996) construíram uma cadeia assim para os quadrados latinos. Um quadrado é visto como um **cubo** de n × n × n casas `m[linha][coluna][símbolo]`, que vale 1 se a casa (linha, coluna) contém esse símbolo, e 0 caso contrário.

| Etapa | O que acontece |
|---|---|
| Escolher um canto | Uma casa do cubo em 0, ao acaso |
| Formar um cubinho | Com as três casas em 1 alinhadas com ela (mesma coluna e símbolo, mesma linha e símbolo, mesma linha e coluna), ela define um subcubo 2 × 2 × 2 |
| Modificar os seus 8 cantos | +1 em quatro cantos, −1 nos outros quatro, alternadamente: cada linha do cubo mantém a mesma soma |
| Quadrado "impróprio" | Se um canto cai para −1, o quadrado fica temporariamente **impróprio**; o passo seguinte parte obrigatoriamente dessa casa para consertá-la |

Jacobson e Matthews demonstraram que, olhando apenas os quadrados próprios, essa cadeia tem uma distribuição estacionária uniforme.

## Onde ler o sorteio: uma armadilha medida

Depois dos passos previstos, a cadeia pode estar em um quadrado impróprio. Solução tentadora: continuar até o primeiro quadrado próprio e devolvê-lo. Isso está **errado**: parar no primeiro estado "correto" não equivale a olhar a cadeia em um instante fixo. É preciso rejeitar o sorteio ou relançar um bloco completo de passos.

```python
# trecho: cubo_do_quadrado_ciclico, um_passo e quadrado_do_cubo são supostas escritas
def sortear_quadrado(n, rng, passos):
    m = cubo_do_quadrado_ciclico(n)                  # ponto de partida
    improprio = None
    while True:
        for _ in range(passos):                      # um bloco completo de passos
            improprio = um_passo(m, n, rng, improprio)  # devolve a casa em -1, ou None
        if improprio is None:                        # lido no fim de um bloco, nunca antes
            return quadrado_do_cubo(m, n)
```

Medido em 5.760 sorteios de quadrados 4 × 4 (cada quadrado deveria sair cerca de 10 vezes):

| Método | Quadrados não isótopos do cíclico (esperado: 25%) | Quadrado mais sorteado |
|---|---|---|
| Continuar até o primeiro quadrado próprio (64, 256 ou 1.024 passos) | 8% | 24 vezes |
| Relançar um bloco completo se o quadrado for impróprio (64 passos) | 25,5% | 21 vezes |

O viés não diminui quando o número de passos aumenta: ele vem do **lugar** onde o resultado é lido, não de uma falta de mistura. A verificação certa consiste em comparar as frequências obtidas com as esperadas em um tamanho pequeno em que tudo pode ser contado.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um quadrado latino contém cada símbolo uma vez por linha e por coluna. Misturar o quadrado cíclico só dá os seus isótopos (75% dos quadrados 4 × 4). A cadeia de Jacobson-Matthews permite um sorteio uniforme, desde que o resultado seja lido em um instante fixo. |
| **Ferramentas utilizáveis** | Cadeia de Markov e MCMC; representação de um quadrado latino como cubo de incidência; cadeia de Jacobson-Matthews; comparação das frequências por enumeração em um tamanho pequeno. |
| **Armadilhas a evitar** | Gerar dados de teste apenas misturando um modelo único; devolver o primeiro estado "correto" de uma cadeia em vez do estado em um instante fixo. |
| **Boas práticas** | Verificar a uniformidade de um gerador em um tamanho em que todos os objetos podem ser contados; variar a origem dos dados de uma bateria de testes. |
