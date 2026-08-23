---
order: 4
---

# Matplotlib: visualizar dados

O **Matplotlib** é a biblioteca de visualização mais usada em [Python](/?c=langages-de-programmation&s=python&p=python): a maioria das outras bibliotecas de gráficos ([seaborn](https://seaborn.pydata.org), pandas `.plot()`...) são construídas sobre ela, ou se inspiram diretamente nela.

## As duas formas de usar o Matplotlib

```python
import matplotlib.pyplot as plt

# API "pyplot" (estado implícito, rápida de escrever):
plt.plot([1, 2, 3], [1, 4, 9])
plt.title("Um gráfico simples")
plt.show()

# API orientada a objetos (explícita, recomendada quando o gráfico se torna mais complexo):
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])
ax.set_title("Um gráfico simples")
plt.show()
```

> **Nota:** a API `pyplot` mantém um estado global implícito (a "figura atual"), prática para um gráfico rápido em uma linha, mas fonte de confusão assim que se manipula vários gráficos ao mesmo tempo. `fig, ax = plt.subplots()` deixa explícito sobre o que cada comando age (`ax`), o que é preferível para qualquer código destinado a ser reutilizado.

## `Figure` e `Axes`

```python
fig, ax = plt.subplots()
```

- `fig` (*Figure*): a janela/imagem inteira, pode conter vários gráficos.
- `ax` (*Axes*): uma área de plotagem específica dentro da figura, na qual se desenha.

## Tipos de gráficos comuns

```python
ax.plot(x, y)                # curva (linha contínua)
ax.scatter(x, y)             # nuvem de pontos
ax.bar(categorias, valores)  # gráfico de barras
ax.hist(dados, bins=20)      # histograma (distribuição de uma variável)
ax.boxplot(dados)            # boxplot (mediana, quartis, valores extremos)
```

## Estilizar um gráfico

```python
fig, ax = plt.subplots()
ax.plot(x, y, label="Vendas 2025", color="blue")
ax.set_xlabel("Mês")
ax.set_ylabel("Vendas (R$)")
ax.set_title("Evolução das vendas")
ax.legend()    # exibe a legenda (a partir dos "label=" fornecidos)
ax.grid(True)  # adiciona uma grade, geralmente útil para ler valores precisos
```

## Vários gráficos em uma mesma figura

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))  # 1 linha, 2 colunas -> 2 áreas de plotagem

axes[0].plot(x, y)
axes[0].set_title("Curva")

axes[1].hist(dados)
axes[1].set_title("Distribuição")

plt.tight_layout()   # ajusta automaticamente os espaçamentos para evitar sobreposições
```

## Salvar um gráfico

```python
fig.savefig("grafico.png", dpi=300)   # dpi: resolução da imagem exportada
```

## Ligação com o pandas

```python
dados["idade"].plot(kind="hist")   # o pandas delega diretamente ao Matplotlib internamente
```

O `.plot()` do [pandas](/?c=data-science&p=pandas) é apenas um atalho prático sobre o Matplotlib: compreender este último permite personalizar qualquer gráfico gerado dessa forma.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | O Matplotlib desenha gráficos por meio de uma `Figure` (a imagem inteira) e um ou mais `Axes` (uma área de plotagem). A API orientada a objetos (`fig, ax = plt.subplots()`) é preferível quando o gráfico se torna mais complexo. |
| **Ferramentas úteis** | `plot`/`scatter`/`bar`/`hist`/`boxplot`, `savefig` para exportar. |
| **Armadilhas a evitar** | Usar a API `pyplot` implícita com vários gráficos simultâneos: fonte de confusão sobre qual gráfico um comando afeta. |
| **Boas práticas** | Preferir `fig, ax = plt.subplots()` explícito para qualquer código destinado a ser reutilizado. |
