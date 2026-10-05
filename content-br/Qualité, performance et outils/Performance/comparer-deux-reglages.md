---
order: 11
---

# Comparar dois ajustes: pareamento, teste do sinal e comparações múltiplas

«Este ajuste é melhor que o outro?» A pergunta parece simples, mas um cronômetro ou um contador só responde para **um caso**: uma grade, uma semente, uma execução. Este capítulo mostra como concluir com honestidade a partir de vários casos, com as medições reais da pesquisa sobre o [solucionador de Skyscraper](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl): comparar cada caso consigo mesmo, medir a diferença com o teste do sinal, não se deixar enganar por um grande número de comparações e não julgar um ajuste pelos casos que serviram para escolhê-lo.

Vocabulário: um **ajuste** é uma forma de lançar o programa (uma opção, um limiar); uma **grade** é um caso de teste; uma **semente** é o número que inicializa o acaso do solucionador: duas sementes dão dois percursos diferentes da mesma grade.

## Por que uma média não basta

| Fonte de variação | Ordem de grandeza medida |
|---|---|
| Mesmo programa, mesma grade, dois cronometragens | ±15 % de tempo |
| Duas rodadas de medição alternadas do mesmo binário | Até 3,6 % de diferença |
| Mesma grade, duas sementes | Resolvida em um caso, bloqueada no outro |
| Contador de propagações, mesmo programa e mesma semente | Idêntico a cada execução |

Duas consequências:

| Regra | Por quê |
|---|---|
| Comparar em **contadores de trabalho** (propagações, conflitos) em vez de em tempo | Um contador não se mexe de uma execução para outra (veja [comparar em contadores de trabalho](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-em-contadores-de-trabalho-nao-so-no-tempo) e [medir em rodadas alternadas](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#medir-em-rodadas-alternadas)) |
| Não confiar em uma média que contém falhas | Uma grade não resolvida conta pelo orçamento inteiro (400 milhões de propagações): a média depende do orçamento escolhido, não só do solucionador. Com 64 × 64, 187 milhões de propagações em média sem a filtragem de Régin e 97 milhões com ela, mas 12 grades em 40 contam por 400 milhões no primeiro caso |

## O pareamento: cada grade contra ela mesma

Comparar as médias de dois ajustes mistura duas coisas: a diferença entre os ajustes e a diferença entre as grades. O **pareamento** elimina a segunda: cada grade é lançada com os dois ajustes e compara-se o **par** de resultados. Para um resultado «resolvida ou não», cada grade cai em uma de quatro caixas:

| | Resolvida com B | Não resolvida com B |
|---|---|---|
| **Resolvida com A** | Concordante: não diz nada sobre o sentido da diferença | **Discordante**: A vence |
| **Não resolvida com A** | **Discordante**: B vence | Concordante: não diz nada |

Só as grades **discordantes** informam sobre a comparação.

## O teste do sinal

Se os dois ajustes fossem equivalentes, cada grade discordante iria para um lado ou para o outro como uma moeda jogada ao ar (veja [as probabilidades](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). O **teste do sinal** calcula a probabilidade de obter, só por acaso, uma diferença pelo menos tão nítida quanto a observada: é o **valor p**. Ele não diz «B é melhor com tal probabilidade»: diz apenas o quanto os dados seriam **surpreendentes** se A e B fossem equivalentes.

Dados reais: 40 grades de 64 × 64, sem e com a filtragem de Régin (veja [a filtragem de Régin](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin)):

```python
from math import comb

# Uma letra por grade (64 x 64, as mesmas 40): 1 = resolvida, 0 = não resolvida
sem_regin = "1111111110111110101010010011011111010011"
com_regin = "1111111111111111111111111111111111111101"


def teste_do_sinal(a_favor, contra):
    """Probabilidade de uma diferença tão nítida, se os dois ajustes fossem equivalentes."""
    n = a_favor + contra                    # só contam as grades discordantes
    k = max(a_favor, contra)
    unilateral = sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n
    return unilateral, min(1.0, 2 * unilateral)


def comparar(inicio, fim):
    """Compara os dois ajustes nas grades início a fim (excluída)."""
    a, b = sem_regin[inicio:fim], com_regin[inicio:fim]
    ambos = sum(x == "1" and y == "1" for x, y in zip(a, b))
    a_favor = sum(x == "0" and y == "1" for x, y in zip(a, b))   # só com Régin
    contra = sum(x == "1" and y == "0" for x, y in zip(a, b))    # só sem ele
    nenhuma = len(a) - ambos - a_favor - contra
    unilateral, bilateral = teste_do_sinal(a_favor, contra)
    print(f"grades {inicio + 1:2}-{fim:2}: ambos {ambos:2}, só com {a_favor:2}, "
          f"só sem {contra}, nenhuma {nenhuma}; "
          f"p = {unilateral:.4f} (unilateral), {bilateral:.4f} (bilateral)")


comparar(0, 40)
comparar(0, 20)
comparar(20, 40)
```

```
grades  1-40: ambos 27, só com 12, só sem 1, nenhuma 0; p = 0.0017 (unilateral), 0.0034 (bilateral)
grades  1-20: ambos 16, só com  4, só sem 0, nenhuma 0; p = 0.0625 (unilateral), 0.1250 (bilateral)
grades 21-40: ambos 11, só com  8, só sem 1, nenhuma 0; p = 0.0195 (unilateral), 0.0391 (bilateral)
```

| Leitura | Valor |
|---|---|
| 40 grades: 12 ganhas por Régin, 1 perdida | `p = 0,0034` (bilateral): muito improvável por acaso |
| Grades 1 a 20 sozinhas: 4 contra 0 | `p = 0,125`: poucas grades para concluir |
| Grades 21 a 40 sozinhas: 8 contra 1 | `p = 0,039`: abaixo de 5 %, mas longe de 0,0034 |

Duas precisões:

| Precisão | Explicação |
|---|---|
| **Unilateral ou bilateral** | O teste unilateral só espera uma diferença em um sentido (Régin melhor); o bilateral aceita os dois sentidos. Sem razão para prever o sentido antes de medir, o bilateral (o dobro) é a escolha prudente |
| **As 40 grades misturam dois papéis** | O limiar de Régin mantido (`REGINK=16`) tinha sido escolhido olhando as grades 1 a 20 entre vários ajustes. Para julgar com honestidade, são necessárias grades que a escolha não viu: 8 contra 1 nas grades 21 a 40, ou seja `p = 0,039`, um resultado mais frágil que o `0,0034` das 40 grades agrupadas |

## Várias comparações ao mesmo tempo

Um limiar de 5 % significa: uma vez em vinte, uma diferença «significativa» aparece **por acaso**. Com uma única comparação isso é aceitável; com sete ajustes comparados à mesma referência, há muito mais chance de que pelo menos um pareça significativo sem sê-lo. A **correção de Bonferroni** exige então de cada comparação um limiar dividido pelo número de comparações (aqui `0,05 / 7 = 0,0071`).

```python
from math import comb

referencia = "1111111110111110101010010011011111010011"  # 40 grades, sem Régin

# Sete variantes do mesmo mecanismo, contra a mesma referência (1 = resolvida)
variantes = {
    "REGIN=1, todas as linhas (grades 1-20)":  ("11111110110111111111", 0),
    "REGINMAX=96 (grades 1-20)":                 ("11011111111111111111", 0),
    "REGINMAX=128 (grades 1-20)":                ("11110011111111111001", 0),
    "REGINMAX=192 (grades 1-20)":                ("11111110111101101111", 0),
    "REGINK=24 (grades 1-20)":                   ("11101111111111111001", 0),
    "REGINK=16 (grades 1-20)":                   ("11111111111111111111", 0),
    "REGINK=12 (grades 21-40)":                  ("11011110111111111111", 20),
}


def p_bilateral(a_favor, contra):
    n, k = a_favor + contra, max(a_favor, contra)
    return min(1.0, 2 * sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n)


limiar = 0.05 / len(variantes)                               # correção de Bonferroni
print(f"limiar por comparação: {limiar:.4f}")
for nome, (resultado, inicio) in variantes.items():
    ref = referencia[inicio:inicio + 20]                     # mesmas grades
    a_favor = sum(r == "0" and v == "1" for r, v in zip(ref, resultado))
    contra = sum(r == "1" and v == "0" for r, v in zip(ref, resultado))
    p = p_bilateral(a_favor, contra)
    marca = "< 0,05" if p < 0.05 else ""
    print(f"{nome:44} {a_favor} contra {contra}   p = {p:.3f}   {marca}")

# E se as sete variantes fossem todas equivalentes à referência?
import random

random.seed(5)
campanhas, alertas_5, alertas_bonferroni = 2000, 0, 0
for _ in range(campanhas):
    ps = []
    for _ in range(len(variantes)):
        a_favor = contra = 0
        for _ in range(20):                                  # 20 grades, a mesma chance
            a, b = random.random() < 0.7, random.random() < 0.7
            a_favor += b and not a
            contra += a and not b
        ps.append(p_bilateral(a_favor, contra))
    alertas_5 += min(ps) < 0.05                              # uma variante «significativa»
    alertas_bonferroni += min(ps) < limiar
print(f"falsos alarmes: {alertas_5 / campanhas:.1%} das campanhas a 0,05, "
      f"{alertas_bonferroni / campanhas:.1%} com o limiar {limiar:.4f}")
```

```
limiar por comparação: 0.0071
REGIN=1, todas as linhas (grades 1-20)       4 contra 2   p = 0.688   
REGINMAX=96 (grades 1-20)                    4 contra 1   p = 0.375   
REGINMAX=128 (grades 1-20)                   3 contra 3   p = 1.000   
REGINMAX=192 (grades 1-20)                   3 contra 2   p = 1.000   
REGINK=24 (grades 1-20)                      3 contra 2   p = 1.000   
REGINK=16 (grades 1-20)                      4 contra 0   p = 0.125   
REGINK=12 (grades 21-40)                     7 contra 1   p = 0.070   
falsos alarmes: 13.9% das campanhas a 0,05, 1.2% com o limiar 0.0071
```

| Observação | Leitura |
|---|---|
| Nenhuma das sete variantes reais atinge 5 % com 20 grades | Diferença **não provada**: não é o mesmo que «nenhuma diferença». `REGINK=16` ganha 4 grades e não perde nenhuma, o que é pouco com 20 grades; com 40, o efeito é nítido |
| Se as sete variantes fossem equivalentes, uma campanha produziria pelo menos um falso alarme a 5 % em 13,9 % dos casos | O limiar nominal de 5 % deixa de valer quando vários ajustes são testados (o teste do sinal é prudente, então o excesso é menor que os 30 % do cálculo ingênuo) |
| Com o limiar de Bonferroni, 1,2 % de falsos alarmes | A correção reduz o risco abaixo de 5 %, ao preço de detectar menos efeitos modestos |

A vivificação das cláusulas aprendidas (veja [o capítulo sobre solucionadores](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)) deu 17 grades ganhas contra 8 perdidas (`p` próximo de 0,05) entre 4 comparações feitas: com um limiar de `0,05 / 4 = 0,0125`, não é significativo, e o resultado não se confirmou com 108 × 108.

## O viés de seleção: escolher e julgar nas mesmas grades

Quando se testam muitos ajustes nas mesmas grades e se guarda o melhor, **o melhor é em parte o mais sortudo**. Em grades novas, ele volta para a média. Simulação: 162 ajustes **todos equivalentes** (4 grades em 100 estouram o prazo para cada um), medidos nas mesmas 100 grades; o melhor é guardado e medido de novo em 100 grades novas:

```python
import random

random.seed(3)
P_ESTOURO = 0.04            # ajustes equivalentes: 4 em 100 estouram o tempo


def estouros(n=100):
    """Número de grades que estouram o tempo entre n sorteadas."""
    return sum(random.random() < P_ESTOURO for _ in range(n))


aparente, real = 0, 0
for _ in range(1000):                                        # 1000 campanhas de seleção
    medicoes = [estouros() for _ in range(162)]              # 162 ajustes, mesmas 100 grades
    aparente += min(medicoes)                                # ficamos com o melhor
    real += estouros()                                       # medido de novo em 100 novas
print(f"melhor ajuste escolhido: {aparente / 1000:.2f} estouros nas grades da escolha")
print(f"o mesmo ajuste, em grades novas: {real / 1000:.2f} estouros")
```

```
melhor ajuste escolhido: 0.06 estouros nas grades da escolha
o mesmo ajuste, em grades novas: 3.96 estouros
```

O melhor ajuste parece quase perfeito nas grades que o designaram e volta exatamente ao nível de todos os outros em grades novas. Dois casos reais da pesquisa:

| Caso | Constatação |
|---|---|
| Um ajuste escolhido nas 8 grades em que a referência falhava (`RANDFREQ=300`) | 8 grades em 8 resolvidas, mas 8 estouros de prazo em 100 grades contra 4 da referência (veja [a armadilha de avaliação](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#a-armadilha-de-avaliacao-vies-de-selecao-e-regressao-a-media)) |
| O melhor de 162 portfólios classificados nas mesmas 100 grades | Cerca de 4 estouros esperados em grades novas, não 1 |

Remédio: decidir com grades **separadas desde o início** (um conjunto de confirmação) e fixar o limiar antes de olhar.

## Simular um portfólio a partir de cópias medidas sozinhas

Um [portfólio](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#portfolio-de-trajetorias-independentes-a-lei-de-p-k) lança 4 cópias do solucionador em paralelo e fica com a primeira que termina. Como cada cópia é determinista, basta medir cada uma **sozinha**: o tempo do portfólio é o da cópia com menos propagações, multiplicado pelo custo de uma propagação (63,6 ns medidos com 4 processos), mais 0,4 s de partida. Podem-se então comparar centenas de combinações sem relançá-las:

```python
NS_POR_PROPAGACAO = 63.6e-9       # custo medido de uma propagação com 4 processos
PARTIDA = 0.4                     # codificação e partida, em segundos
TETO = 90                         # uma grade além disso conta como 90 s

# Propagações de cada cópia lançada sozinha (None: não resolvida), grades 108 x 108
medicoes = {
    "grade 1":  ([1160198340, 1079061713, 965580745, 1121869261],
                  [1161081253, 1080793391, None, 1128429894]),
    "grade 2":  ([935030775, 873949674, None, 1030612002],
                  [935461446, 870245776, None, 1029000510]),
    "grade 36": ([None, None, None, None], [None, None, None, 855762975]),
    "grade 44": ([None, None, None, None], [1164445761, 918386044, 880153114, 900765717]),
    "grade 45": ([None, None, None, None], [930976402, 978540372, 826546571, None]),
}


def tempo_do_portfolio(copias):
    """O primeiro a terminar vence: menos propagações, vezes o custo."""
    resolvidas = [p for p in copias if p is not None]
    if not resolvidas:
        return TETO
    return min(TETO, min(resolvidas) * NS_POR_PROPAGACAO + PARTIDA)


print(f"{'grade':12} {'sem Régin':>12} {'com Régin':>12}")
for nome, (referencia, regin) in medicoes.items():
    t_ref, t_regin = tempo_do_portfolio(referencia), tempo_do_portfolio(regin)
    print(f"{nome:12} {t_ref:11.1f} s {t_regin:11.1f} s")
```

```
grade           sem Régin    com Régin
grade 1             61.8 s        69.1 s
grade 2             56.0 s        55.7 s
grade 36            90.0 s        54.8 s
grade 44            90.0 s        56.4 s
grade 45            90.0 s        53.0 s
```

A grade 1 é um lembrete útil: Régin é ali **mais lento** (69,1 s contra 61,8 s), porque a trajetória de busca é diferente. Nenhuma grade isolada decide nada. Nas 100 grades reais com 108 × 108, a simulação dá 56,6 s e 4 estouros sem Régin contra 53,0 s e nenhum estouro com ele, sendo Régin mais rápido em 73 grades contra 27 (teste do sinal nessas 100 grades: `p` inferior a 0,00001). Ela encontra exatamente os estouros reais (grades 36, 44, 45 e 86 com 108 × 108; 31, 42 e 76 com 104 × 104); a medição real dá 49,3 s: a simulação é ligeiramente pessimista.

## Verificar um sorteio uniforme: o teste do χ²

As grades de teste devem representar o problema, não apenas o gerador que as produz. Para os [quadrados latinos](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme#a-cadeia-de-jacobson-matthews), o gerador de Jacobson e Matthews deve sortear cada quadrado com a mesma probabilidade. O **teste do χ²** (qui-quadrado) compara o número de vezes em que cada quadrado saiu com o que se esperaria de um sorteio uniforme. A seguir, um sorteio aleatório entre 576 possibilidades (os 576 quadrados latinos de 4 × 4) substitui o gerador, uma vez uniforme e outra enviesado:

```python
import random

CASAS = 576                       # os 576 quadrados latinos 4 x 4
SORTEIOS = 57600                  # 100 sorteios esperados por quadrado
random.seed(2)


def qui2(sorteios):
    """Soma de (observado - esperado)^2 / esperado sobre as 576 casas da tabela de contagem."""
    contagens = [0] * CASAS
    for t in sorteios:
        contagens[t] += 1
    esperado = len(sorteios) / CASAS
    return sum((c - esperado) ** 2 / esperado for c in contagens)


uniforme = [random.randrange(CASAS) for _ in range(SORTEIOS)]
# um sorteio enviesado: os 100 primeiros quadrados saem um pouco mais
enviesado = [random.randrange(CASAS) if random.random() < 0.9 else random.randrange(100)
          for _ in range(SORTEIOS)]
print(f"sorteio uniforme: qui2 = {qui2(uniforme):.0f}")
print(f"sorteio enviesado: qui2 = {qui2(enviesado):.0f}")
desvio = (2 * (CASAS - 1)) ** 0.5
print(f"esperado se uniforme: {CASAS - 1} com um desvio de cerca de {desvio:.0f}")
```

```
sorteio uniforme: qui2 = 556
sorteio enviesado: qui2 = 3466
esperado se uniforme: 575 com um desvio de cerca de 34
```

| Resultado | Leitura |
|---|---|
| χ² = 556 para 576 quadrados possíveis | Próximo de 575 (o número de graus de liberdade), a menos de um desvio (cerca de 34): compatível com um sorteio uniforme |
| χ² = 3466 para um sorteio enviesado | Muito acima: o viés é detectado |

Medição real no gerador da pesquisa: os 576 quadrados de 4 × 4 aparecem todos e χ² = 557 para 575 ± 34 esperados. O teste não **prova** a uniformidade: simplesmente não detectou nada. Ele é completado por uma verificação no próprio problema: com 104 × 104, o portfólio de referência simulado dá 47,3 s em 20 grades uniformes contra 50,4 s nas 100 grades oficiais, sem estouros; com 72 × 72, 6,2 s contra 6,5 s. O solucionador não está ajustado apenas ao gerador oficial.

## As armadilhas

| Armadilha | O que acontece | Remédio |
|---|---|---|
| Comparar médias em grades diferentes | A diferença entre grades esconde (ou fabrica) a que existe entre ajustes | Parear: mesmas grades, mesmas sementes |
| Contar as falhas pelo orçamento em uma média | A média depende do orçamento, não só do solucionador | Comparar os números de grades resolvidas e os contadores nas resolvidas por ambos |
| Concluir de um `p` acima de 0,05 que não há diferença | Poucas grades: um efeito real passa despercebido (`REGINK=16` com 20 grades) | Acrescentar grades novas, sem mexer no limiar pelo caminho |
| Testar vários ajustes ao mesmo limiar de 5 % | Falsos alarmes (13,9 % com 7 ajustes) | Corrigir o limiar (Bonferroni) ou anunciar o número de comparações feitas |
| Guardar o melhor ajuste e julgá-lo nas mesmas grades | O resultado é otimista (0,06 contra 3,96 estouros na simulação) | Um conjunto de confirmação separado desde o início |
| Julgar uma grade isolada | Um ajuste melhor na média pode perder em algumas grades (a grade 1) | Olhar as 100 grades e o teste do sinal |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Para comparar dois ajustes: as mesmas grades para ambos (pareamento), contadores de trabalho em vez de tempo, teste do sinal nas grades discordantes. O valor p mede o quanto a diferença seria surpreendente se os ajustes fossem equivalentes. Várias comparações aumentam os falsos alarmes; escolher e depois julgar nas mesmas grades é otimista. |
| **Ferramentas utilizáveis** | O teste do sinal (`math.comb`), a correção de Bonferroni, um conjunto de grades de confirmação, a simulação de um portfólio a partir de cópias medidas sozinhas, o teste do χ² para verificar um sorteio uniforme. |
| **Armadilhas a evitar** | Comparar médias, contar as falhas pelo orçamento, ler um `p` alto como prova de equivalência, multiplicar as comparações sem corrigir o limiar, julgar nas grades da escolha. |
| **Boas práticas** | Decidir o número de grades e o limiar antes de medir. Reservar grades novas para confirmar. Anunciar todas as comparações feitas. Verificar o resultado em várias fontes de grades. |
