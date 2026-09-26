---
order: 10
---

# O property-based testing

Todos os tipos de teste vistos até agora ([unitários](/?c=tests&p=tests-unitaires), [de integração](/?c=tests&p=tests-dintegration), [E2E](/?c=tests&p=tests-end-to-end)) compartilham um mesmo princípio: escolher exemplos precisos de entrada, e verificar o resultado esperado para cada um. O **property-based testing** inverte essa lógica: em vez de escolher as entradas você mesmo, descreve-se uma **propriedade** que deve permanecer verdadeira para qualquer entrada válida, e uma ferramenta gera automaticamente centenas de entradas para tentar contradizê-la.

## Um teste clássico, exemplo por exemplo

Um teste unitário clássico verifica um número finito de casos escolhidos manualmente:

```text
teste "somar(2, 3) == 5"
teste "somar(-1, 1) == 0"
teste "somar(0, 0) == 0"
```

Esses três testes passam, mas não dizem nada sobre o que acontece com `somar(1000000, -999999)`, ou qualquer outra combinação não testada explicitamente: um bug escondido em um caso não escolhido por quem escreveu o teste continua invisível.

## Uma propriedade: o que deve sempre ser verdade

Uma **propriedade** descreve uma regra geral, válida para qualquer entrada que respeite certas restrições, em vez de um resultado preciso para uma entrada precisa:

```text
Propriedade: "somar é comutativa"
  Para todo a e b: somar(a, b) == somar(b, a)

Propriedade: "ordenar uma lista não muda seu tamanho"
  Para toda lista L: tamanho(ordenar(L)) == tamanho(L)

Propriedade: "ordenar duas vezes dá o mesmo resultado que ordenar uma vez"
  Para toda lista L: ordenar(ordenar(L)) == ordenar(L)
```

Uma ferramenta de property-based testing (por exemplo [fast-check](https://fast-check.dev) em [JavaScript](/?c=langages&s=javascript&p=javascript), [Hypothesis](https://hypothesis.readthedocs.io) em [Python](/?c=langages&s=python&p=python), ou [QuickCheck](https://hackage.haskell.org/package/QuickCheck), a ferramenta histórica da área em Haskell) então gera automaticamente centenas de entradas aleatórias que respeitam as restrições dadas, e verifica a propriedade em cada uma.

```text
Teste property-based para "ordenar não muda o tamanho":

  repetir 200 vezes:
    gerar uma lista aleatória L (tamanho e conteúdo variáveis)
    verificar que tamanho(ordenar(L)) == tamanho(L)

  -> se um único caso gerado quebrar a propriedade, o teste
     falha e mostra a lista exata que causou o problema
```

## Encontrar um contraexemplo mínimo (shrinking)

Quando uma ferramenta de property-based testing encontra uma entrada que quebra a propriedade, ela não para por aí: tenta **reduzi-la** (*shrinking*) até o menor contraexemplo possível que ainda reproduza o bug, para facilitar o diagnóstico.

```text
Contraexemplo encontrado inicialmente:
  L = [47, -12, 999, 3, -5, 0, 812, ...] (lista de 50 elementos)

Após a redução (shrinking):
  L = [1, 0] (2 elementos, o bug ainda se reproduz)

-> muito mais fácil de entender e corrigir do que a lista inicial
```

## Quando escolher essa abordagem

O property-based testing não substitui os testes clássicos, ele os complementa, em particular em código onde uma **regra geral** é mais fácil de formular do que uma lista de casos precisos: funções matemáticas, algoritmos de ordenação ou codificação/decodificação, parsers, estruturas de dados.

> **Cilada:** tentar escrever uma propriedade para um comportamento que na realidade não segue uma regra geral simples (uma lógica de negócio com numerosos casos particulares arbitrários). Forçar uma propriedade onde ela não se encaixa produz uma regra tão complicada que se torna ela mesma propensa a erros.
>
> **Boa prática:** reservar o property-based testing aos comportamentos que realmente obedecem a uma regra geral simples de enunciar; manter testes clássicos, por exemplo, para a lógica de negócio rica em casos particulares.

## Um caso vizinho: o teste diferencial

Ao reescrever um algoritmo existente (implementação mais rápida, mudança de estrutura de dados...), nem sempre há uma propriedade geral simples a formular. O **teste diferencial** compara então diretamente as duas implementações em muitas entradas geradas: a antiga serve de referência, e qualquer desacordo entre os dois resultados sinaliza um bug na reescrita.

Exemplo real do solucionador SAT Skyscraper (veja [Codificar um problema em SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)): ao passar de cláusulas implícitas enumeradas para recuperadas por cálculo, a reescrita foi validada em dois níveis: o conjunto exato de cláusulas removidas comparado ao antigo conjunto enumerado, e depois o acordo "solução encontrada / sem solução" entre as duas versões em 700 grades.

```python
def ordenar_antigo(xs):
    """Implementação antiga: ordenação por seleção (correta, porém lenta)."""
    xs = list(xs)
    for i in range(len(xs)):
        m = i
        for j in range(i + 1, len(xs)):
            if xs[j] < xs[m]:
                m = j
        xs[i], xs[m] = xs[m], xs[i]
    return xs

def ordenar_novo(xs):
    """Reescrita a validar: ordenação nativa do Python (Timsort)."""
    return sorted(xs)
```

Executado em 500 listas aleatórias (tamanhos de 0 a 20, valores de -50 a 50), comparando `ordenar_antigo(xs) != ordenar_novo(xs)` a cada sorteio: saída real `0 desaccord(s) sur 500 entrees generees` (0 desacordo(s) em 500 entradas geradas).

| Property-based testing | Teste diferencial |
|---|---|
| Compara o resultado com uma **propriedade geral** enunciada à mão | Compara o resultado com **outra implementação** (a versão antiga) |
| Útil mesmo sem uma versão anterior para comparar | Serve especificamente para validar uma reescrita |
| Exige formular uma regra verdadeira para qualquer entrada válida | Exige apenas que a implementação antiga continue disponível como referência |

> **Cilada:** o teste diferencial não detecta um bug presente nas duas implementações: elas concordariam, erradamente. Ele valida uma reescrita em relação ao existente, não o existente em relação à especificação.
>
> **Boa prática:** gerar muitas entradas, incluindo casos-limite (lista vazia, valores repetidos, tamanhos extremos); combinar com um teste contra a especificação quando ela existir.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O property-based testing descreve uma propriedade válida para qualquer entrada, em vez de verificar exemplos escolhidos manualmente; uma ferramenta gera automaticamente centenas de entradas para tentar contradizê-la, e reduz (shrinking) todo contraexemplo encontrado até o caso mais simples possível. O teste diferencial, um caso vizinho, compara em vez disso o resultado de uma reescrita com o da implementação antiga em muitas entradas geradas. |
| **Ferramentas utilizáveis** | fast-check (JavaScript), Hypothesis (Python), QuickCheck (Haskell, a ferramenta histórica da área); teste diferencial: nenhuma ferramenta dedicada é necessária, um script de comparação basta. |
| **Ciladas a evitar** | Forçar uma propriedade sobre um comportamento sem regra geral simples; acreditar que o acordo entre duas implementações em um teste diferencial prova a ausência de um bug compartilhado por ambas. |
| **Boas práticas** | Reservar o property-based testing a comportamentos com uma regra geral clara (funções matemáticas, ordenação, parsers); manter testes clássicos para a lógica de negócio rica em casos particulares; no teste diferencial, gerar também casos-limite e combinar com um teste contra a especificação quando ela existir. |
