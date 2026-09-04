---
order: 13
---

# Os notebooks Jupyter

Um **notebook Jupyter** é um documento interativo que combina código executável, resultados (incluindo gráficos apresentados diretamente) e texto explicativo (Markdown): o formato de trabalho predominante na ciência de dados e na aprendizagem automática, para a exploração iterativa de dados.

## Células de código e células Markdown

Um notebook (arquivo `.ipynb`) é um conjunto de **células**, de dois tipos:

- **Bloco de código**: em Python, executável de forma independente (`Shift+Entrada` para o executar).
- **Célula Markdown**: texto formatado (títulos, listas, fórmulas matemáticas através do LaTeX), para documentar o processo a par do código.

```python
# Célula 1 (código)
import pandas as pd
dados = pd.read_csv("ventes.csv")
```

```python
# Célula 2 (código)
dados.describe()   # o resultado é apresentado diretamente abaixo da célula
```

## O kernel: o processo Python por trás do notebook

O **kernel** é o processo Python que executa efetivamente o código das células e mantém o seu estado na memória (variáveis, importações...) entre as execuções; o próprio notebook é apenas uma interface que envia código para o kernel e apresenta os seus resultados.

> **Nota:** reiniciar o kernel (*Restart Kernel*) apaga **todas** as variáveis na memória, como se o programa fosse reiniciado do zero; as células apresentadas permanecem visíveis na tela, mas o seu código não foi reexecutado enquanto não for explicitamente solicitado.

## A armadilha da execução não linear

Ao contrário de um script clássico do `.py` (executado estritamente de cima para baixo), as células de um notebook podem ser executadas **em qualquer ordem**, várias vezes cada uma:

```python
# Célula 1
x = 5
```

```python
# Célula 2
x = x * 2
```

Se executarmos a célula 2 **várias vezes seguidas** sem reiniciar a célula 1, `x` duplica a cada execução (10, depois 20, depois 40...), uma armadilha clássica em que o estado «invisível» do kernel já não corresponde à ordem visual das células na tela. Em caso de dúvida quanto à reprodutibilidade de um resultado, a opção *«Restart Kernel and Run All»* reexecuta tudo na ordem de cima para baixo, garantindo um estado coerente.

## Comandos mágicos (`%`, `%%`)

Comandos especiais, próprios do Jupyter, que não existem na própria linguagem Python:

```python
%matplotlib inline    # exibe os gráficos do Matplotlib diretamente abaixo da célula, sem uma janela separada
%timeit ma_fonction()   # mede automaticamente o tempo de execução, ao longo de várias repetições
%%time                  # (no início da célula) cronometra a execução de toda a célula
```

## Por que razão este formato é adequado para a ciência de dados

- Ver imediatamente o resultado de uma transformação (um «`DataFrame`», um gráfico) logo a seguir ao código que a produz, sem ter de esperar pelo fim de um script completo.
- Explorar em pequenas etapas sucessivas (carregar os dados, limpá-los, visualizá-los, treinar um modelo) sem ter de repetir todo o processo a cada tentativa.
- Documentar o processo e os resultados lado a lado (células Markdown + gráficos), útil para partilhar uma análise com outras pessoas.

Consulte também os capítulos sobre o pandas e o Matplotlib, as duas bibliotecas mais utilizadas num notebook.
