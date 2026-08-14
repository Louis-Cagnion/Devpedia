---
order: 21
---

# Avaliar um OCR: CER, WER e taxa de reconhecimento por campo

O princípio geral de avaliação (separar um conjunto de teste, comparar uma predição à resposta verdadeira) já foi estabelecido em [Introdução ao machine learning](/?c=data-science&p=machine-learning-scikit-learn). Um OCR, porém, tem uma vantagem que um LLM não tem: sua saída se compara diretamente a uma **resposta verdadeira conhecida** (o texto real da imagem), sem o não determinismo que exige métodos como o golden set ou o LLM-as-judge (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)). Este capítulo cobre as métricas específicas dessa comparação direta.

## Medir a diferença entre dois textos: a distância de edição

Comparar dois textos caractere por caractere em uma posição fixa falharia já no primeiro caractere ausente ou adicionado: todo o resto se deslocaria, uma discordância artificial em cada posição seguinte. A [**distância de Levenshtein**](https://pt.wikipedia.org/wiki/Distância_de_Levenshtein) resolve esse problema: o número mínimo de operações (substituir, inserir, remover um caractere) para transformar um texto em outro.

```text
Texto reconhecido:   "Ds gatos dormem"
Texto real:          "Os gatos dormem"
                       ^
              1 substituicao (D -> O) -> distancia de Levenshtein = 1
```

```python
def distancia_levenshtein(a, b):
    # tabela[i][j] = distancia entre os i primeiros caracteres de a e os j primeiros de b
    tabela = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        tabela[i][0] = i   # transformar a[:i] em "" custa i remocoes
    for j in range(len(b) + 1):
        tabela[0][j] = j   # transformar "" em b[:j] custa j insercoes

    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                tabela[i][j] = tabela[i - 1][j - 1]              # caracteres identicos, nada a fazer
            else:
                tabela[i][j] = 1 + min(
                    tabela[i - 1][j],      # remocao
                    tabela[i][j - 1],      # insercao
                    tabela[i - 1][j - 1],  # substituicao
                )
    return tabela[len(a)][len(b)]
```

## CER (*Character Error Rate*): a distância de edição, em proporção

Uma distância bruta de 5 não tem o mesmo peso em uma palavra de 6 letras do que em uma página de 2000 caracteres: o **CER** relaciona essa distância ao comprimento do texto de referência, para obter uma proporção comparável entre documentos de tamanhos diferentes.

```python
def cer(texto_reconhecido, texto_real):
    return distancia_levenshtein(texto_reconhecido, texto_real) / len(texto_real)

cer("Ds gatos dormem", "Os gatos dormem")  # 1 / 15 ~= 0.067 -> 6,7% de caracteres errados
```

Um CER de 0 significa um reconhecimento perfeito; um CER de 0,05 (5%) significa que, em média, 5 caracteres em cada 100 são mal reconhecidos.

## WER (*Word Error Rate*): a mesma ideia, no nível da palavra

O **WER** aplica o mesmo cálculo (distância de edição, relacionada ao comprimento de referência), mas na sequência de **palavras** em vez de caracteres:

```python
def wer(texto_reconhecido, texto_real):
    return distancia_levenshtein(texto_reconhecido.split(), texto_real.split()) / len(texto_real.split())
```

| | CER | WER |
|---|---|---|
| Unidade comparada | Caractere | Palavra |
| Sensibilidade | Uma única letra errada em uma palavra de 10 letras pesa pouco | O mesmo erro invalida a palavra inteira: mais próximo da legibilidade humana |
| Caso de uso típico | Escritas sem separador de palavra nítido, ou avaliação fina de um motor de reconhecimento | Avaliação orientada ao uso final (uma palavra mal reconhecida continua sendo uma palavra a corrigir, qualquer que seja a extensão do erro) |

> **Cuidado:** seguir apenas uma dessas duas métricas e tirar dela uma conclusão geral sobre "a qualidade" do modelo. Um CER baixo pode mascarar um WER alto (muitas palavras levemente deslocadas, cada uma contada como errada no nível palavra): as duas métricas respondem a perguntas diferentes, não à mesma pergunta com mais ou menos precisão.
>
> **Boa prática:** acompanhar as duas métricas em paralelo, e escolher a que prevalece de acordo com o uso real (WER se um humano precisa reler e corrigir palavra por palavra, CER para um diagnóstico mais fino do comportamento do modelo).

## A armadilha do score global: a taxa de reconhecimento por campo

Em um documento estruturado (uma nota fiscal, um formulário), um CER ou WER calculado sobre todo o texto esconde **onde** as erros se concentram:

```text
Nota fiscal com CER global de 2% (excelente na aparencia):

  Endereco do cliente : "Rua da Paz, 12, 0l310-000 Sao Paulo"  <- erro em 1 caractere do CEP (l ao inves de 1)
  Valor total          : "R$ 1.250,00"                          <- perfeitamente reconhecido

  O CER global (2%) afoga o erro no CEP (um campo critico para a entrega)
  na massa de texto corretamente reconhecido em volta.
```

> **Cuidado:** se contentar com um CER ou WER global baixo sem verificar a distribuição dos erros por campo. Um único erro em um campo crítico (um valor, uma data de vencimento, um número de conta) pode ter consequências muito mais graves do que um CER global agregado sugere, principalmente se esse erro se concentra sistematicamente no mesmo tipo de campo (uma confusão recorrente entre "l" e "1" em CEPs, por exemplo).
>
> **Boa prática:** calcular um CER/WER **por campo** identificado (valor, data, referência do cliente...) além do score global, em um conjunto de documentos representativo, para identificar um campo sistematicamente mais frágil que os outros antes da colocação em produção.

Um conjunto de teste anotado (imagens acompanhadas de sua transcrição exata, verificada manualmente) executado novamente a cada mudança de modelo ou versão retoma exatamente o princípio do **golden set** já visto para um LLM (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), aplicado aqui a uma saída determinística em vez de uma saída que varia de uma chamada para outra.

## O que reter

| | |
|---|---|
| **O que reter** | A distância de Levenshtein mede o número mínimo de operações para transformar um texto em outro. O CER a relaciona ao comprimento do texto no nível caractere, o WER no nível palavra; os dois respondem a perguntas diferentes e são acompanhados em paralelo. Um score global esconde a distribuição real dos erros: medir também por campo em um documento estruturado. |
| **Ferramentas úteis** | Um conjunto de teste anotado (golden set), executado novamente a cada mudança de modelo. Bibliotecas dedicadas (`jiwer`, por exemplo) calculam CER/WER sem reimplementar a distância de edição manualmente. |
| **Armadilhas a evitar** | Seguir apenas uma das duas métricas. Se contentar com um score global sem verificar a distribuição dos erros por campo. |
| **Boas práticas** | Acompanhar CER e WER em paralelo. Calcular um score por campo além do score global em um documento estruturado. |
