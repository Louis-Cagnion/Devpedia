---
order: 16
---

# Matplotlib — visualizar dados

**O Matplotlib** é a biblioteca de visualização mais utilizada em Python — a maioria das outras bibliotecas de gráficos (seaborn, pandas`.plot()` etc.) assenta nela ou inspira-se diretamente nela.

## As duas formas de utilizar o Matplotlib

```python
import matplotlib.pyplot as plt

# API «pyplot» (estado implícito, rápida de escrever):
plt.plot([1, 2, 3], [1, 4, 9])
plt.title("Un graphique simple")
plt.show()

# API orientada a objetos (explícita, recomendada assim que o gráfico se tornar mais complexo):
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])
ax.set_title("Un graphique simple")
plt.show()
```

> **Nota:** a API `pyplot` mantém um estado global implícito (a «figura atual») — prático para um gráfico rápido numa única linha, mas fonte de confusão assim que se manipulam vários gráficos ao mesmo tempo. `fig, ax = plt.subplots()` especifica explicitamente sobre o que cada comando atua (`ax`), o que é preferível para qualquer código destinado a ser reutilizado.

## `Figure` e `Axes`

```python
fig, ax = plt.subplots()
```

- `fig` (*Figura*): a janela/imagem completa, que pode conter vários gráficos.
- `ax` (*Eixos*): uma área de traçado precisa no interior da figura, sobre a qual se desenha.

## Tipos de gráficos comuns

```python
ax.plot(x, y)              # curva (linha contínua)
ax.scatter(x, y)            # nuvem de pontos
ax.bar(categories, valores)  # gráfico de barras
ax.hist(dados, bins=20)     # histograma (distribuição de uma variável)
ax.boxplot(dados)            # diagrama de box-and-whisker (mediana, quartis, valores extremos)
```

## Formatar um gráfico

```python
fig, ax = plt.subplots()
ax.plot(x, y, label="Ventes 2025", color="blue")
ax.set_xlabel("Mois")
ax.set_ylabel("Ventes (€)")
ax.set_title("Évolution des ventes")
ax.legend()             # exibe a legenda (com base nos «label=» fornecidos)
ax.grid(True)             # Adiciona uma grelha, frequentemente útil para ler valores precisos
```

## Vários gráficos numa mesma figura

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))  # 1 linha, 2 colunas -> 2 áreas de desenho

axes[0].plot(x, y)
axes[0].set_title("Courbe")

axes[1].hist(dados)
axes[1].set_title("Distribution")

plt.tight_layout()   # ajusta automaticamente os espaços para evitar sobreposições
```

## Guardar um gráfico

```python
fig.savefig("graphique.png", dpi=300)   # dpi: resolução da imagem exportada
```

## Ligação com o pandas

```python
dados["age"].plot(kind="hist")   # O pandas recorre diretamente ao Matplotlib internamente
```

O `.plot()` do pandas (ver capítulo dedicado) é apenas um atalho prático sobre o Matplotlib — compreender este último permite personalizar qualquer gráfico assim gerado.
