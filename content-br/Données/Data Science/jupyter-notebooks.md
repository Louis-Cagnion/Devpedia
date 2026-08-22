---
order: 1
---

# Os notebooks Jupyter

Um **notebook Jupyter** é um documento interativo que combina código executável, resultados (incluindo gráficos exibidos diretamente) e texto explicativo (Markdown), o formato de trabalho dominante em data science e em machine learning, para a exploração iterativa de dados.

## Células de código e células Markdown

Um notebook (arquivo `.ipynb`) é uma sequência de **células**, de dois tipos:

- **Célula de código**: Python, executável de forma independente (`Shift+Enter` para executar).
- **Célula Markdown**: texto formatado (títulos, listas, fórmulas matemáticas via [LaTeX](https://www.latex-project.org)), para documentar o processo ao lado do código.

```python
# Célula 1 (código)
import pandas as pd
dados = pd.read_csv("vendas.csv")
```

```python
# Célula 2 (código)
dados.describe()   # o resultado aparece diretamente abaixo da célula
```

## O kernel: o processo Python por trás do notebook

O **kernel** é o processo Python que executa de fato o código das células e mantém seu estado em memória (variáveis, imports...) entre as execuções: o notebook em si é apenas uma interface que envia código para o kernel e exibe seus resultados.

> **Nota:** reiniciar o kernel (*Restart Kernel*) apaga **todas** as variáveis em memória, como se o programa fosse reiniciado do zero: as células exibidas continuam visíveis na tela, mas seu código não foi reexecutado até que isso seja explicitamente solicitado.

## A armadilha da execução não linear

Diferente de um script `.py` clássico (executado estritamente de cima para baixo), as células de um notebook podem ser executadas **em qualquer ordem**, várias vezes cada uma:

```python
# Célula 1
x = 5
```

```python
# Célula 2
x = x * 2
```

Se executarmos a célula 2 **várias vezes seguidas** sem reiniciar a célula 1, `x` dobra a cada execução (10, depois 20, depois 40...): uma armadilha clássica em que o estado "invisível" do kernel deixa de corresponder à ordem visual das células na tela. Em caso de dúvida sobre a reprodutibilidade de um resultado, *Restart Kernel and Run All* reexecuta tudo na ordem de cima para baixo, garantindo um estado consistente.

## Comandos mágicos (`%`, `%%`)

Comandos especiais, próprios do Jupyter, ausentes da linguagem Python em si:

```python
%matplotlib inline     # exibe os gráficos do Matplotlib diretamente abaixo da célula, sem janela separada
%timeit minha_funcao()  # mede automaticamente o tempo de execução, em várias repetições
%%time                  # (no início da célula) cronometra a execução de toda a célula
```

## Por que esse formato é adequado para a data science

- Ver imediatamente o resultado de uma transformação (um `DataFrame`, um gráfico) logo após o código que o produz, sem esperar o fim de um script inteiro.
- Explorar em pequenas etapas sucessivas (carregar os dados, limpá-los, visualizá-los, treinar um modelo) sem reexecutar tudo a cada tentativa.
- Documentar o processo e os resultados lado a lado (células Markdown + gráficos), útil para compartilhar uma análise com outras pessoas.

Veja também os capítulos sobre [pandas](/?c=data-science&p=pandas) e [Matplotlib](/?c=data-science&p=matplotlib), as duas bibliotecas mais usadas dentro de um notebook.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um notebook combina células de código e células Markdown, executadas em uma ordem potencialmente não linear: o kernel mantém o estado entre as execuções, independentemente da ordem visual das células. |
| **Ferramentas úteis** | Comandos mágicos (`%matplotlib inline`, `%timeit`), *Restart Kernel and Run All* para garantir um estado consistente. |
| **Armadilhas a evitar** | Executar as células fora de ordem e acreditar que o resultado exibido reflete o estado real do kernel. |
| **Boas práticas** | Usar *Restart Kernel and Run All* em caso de dúvida sobre a reprodutibilidade de um resultado. |
