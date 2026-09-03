---
order: 11
---

# A classificação bayesiana: corrigindo uma média ingênua demais

Classificar itens (avaliações de clientes, restaurantes, filmes) pela simples **média** parece natural, mas favorece injustamente amostras pequenas: uma ficha avaliada 5/5 por um único cliente vence, em uma classificação por média pura, uma ficha avaliada 4,8/5 por 500 clientes. A **classificação bayesiana** (popularizada pelo IMDB para sua classificação de filmes) corrige esse viés.

## O problema: uma média perfeita nem sempre é confiável

| Ficha | Nota média | Número de avaliações | Confiável? |
|---|---|---|---|
| A | 5,0 / 5 | 2 | Pouco confiável: duas avaliações quase não provam nada |
| B | 4,8 / 5 | 500 | Muito confiável: uma média estável sobre uma amostra grande |

Uma média simples classificaria A antes de B, embora B seja evidentemente o resultado mais digno de confiança.

## A fórmula

```
nota_ajustada = (R x v + m x C) / (v + m)
```

| Variável | Significado |
|---|---|
| `R` | Média bruta do item (ex: 5,0 para a ficha A) |
| `v` | Número de avaliações do item (ex: 2 para a ficha A) |
| `C` | Média global de referência, calculada sobre o conjunto de fichas |
| `m` | Limite de confiança: o número de avaliações a partir do qual se confia realmente em `R` em vez de em `C` |

## Interpretação: uma suavização progressiva, não um corte brusco

```python
def nota_ajustada(R, v, C, m):
    return (R * v + m * C) / (v + m)

# Ficha A: 5.0 sobre 2 avaliacoes, contra uma media global de 4.2, limite de confianca m=50
nota_ajustada(R=5.0, v=2,   C=4.2, m=50)   # ~4.23: bem perto da referencia global
nota_ajustada(R=4.8, v=500, C=4.2, m=50)   # ~4.71: bem perto da media bruta
```

- Quando `v` é **grande** em relação a `m` (ficha B): a fórmula tende para a média bruta `R`, o volume de avaliações já basta para confiar nela.
- Quando `v` é **pequeno** em relação a `m` (ficha A): a fórmula tende para a referência global `C`, a amostra é pequena demais para confiar nela sozinha.

```text
v = 0        v pequeno        v = m           v grande         v -> infinito
  |             |                |                |                 |
  C ────────────┼────────────────┼────────────────┼─────────────────R
             perto de C      no meio do caminho perto de R       igual a R
```

Sem corte brusco ("menos de `m` avaliações = ficha ignorada"): a transição entre `C` e `R` é contínua, proporcional ao número de avaliações já coletadas.

> **Armadilha:** escolher `m` arbitrariamente pequeno para que uma ficha de alto volume "vença" mais rápido. Um `m` baixo demais reintroduz o problema inicial: uma ficha com 3 avaliações perfeitas volta a competir com uma ficha com 500 avaliações muito boas.
>
> **Boa prática:** definir `m` em um valor representativo do número de avaliações necessário, no domínio em questão, para que uma média comece a ser considerada confiável (frequentemente estimado empiricamente a partir da distribuição real do número de avaliações por ficha).

---

## 📋 O que reter

| | |
|---|---|
| **O que reter** | Uma média bruta favorece injustamente amostras pequenas. A classificação bayesiana pondera a média de cada item pelo seu volume de avaliações, aproximando-a de uma média global de referência enquanto esse volume permanece baixo. |
| **Ferramentas úteis** | A fórmula `(R·v + m·C) / (v + m)`, com `m` calibrado empiricamente sobre a distribuição real do número de avaliações. |
| **Armadilhas a evitar** | Classificar por média bruta sem considerar o volume de avaliações; escolher um `m` baixo demais, que anula o efeito corretivo pretendido. |
| **Boas práticas** | Calibrar `m` com dados reais em vez de arbitrariamente; verificar que a classificação obtida coloque as fichas de alto volume e boa nota à frente das fichas cujo volume é baixo demais para ser confiável. |
