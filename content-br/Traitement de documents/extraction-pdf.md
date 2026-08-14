---
order: 1
---

# Extrair o texto e as páginas de um PDF

Um **PDF** (*Portable Document Format*) é um formato de arquivo projetado para que um documento seja exibido de forma idêntica em qualquer dispositivo, ao contrário de um arquivo editável ([Word](https://www.microsoft.com/microsoft-365/word), [HTML](/?c=langages-de-balisage&s=html&p=html)) cujo layout pode variar de acordo com o software que o abre. Essa portabilidade tem um custo para quem quer extrair a informação automaticamente: um PDF não contém "texto" de forma uniforme, ele mistura duas naturezas de conteúdo bem diferentes na mesma página.

## Duas naturezas de conteúdo, na mesma página

| | Texto nativo | Conteúdo em imagem |
|---|---|---|
| O que é | Caracteres reais armazenados como tal no arquivo (como em um arquivo de texto) | Pixels, exatamente como uma foto: nenhum caractere está armazenado por trás |
| De onde vem | Um documento gerado por um software (editor de texto, exportação web) | Uma página escaneada, uma captura de tela colada no documento, uma tabela complexa formatada como imagem |
| Como extrair | Ler diretamente os caracteres armazenados: rápido, confiável, nenhum erro de interpretação possível | Impossível "ler" pixels como texto: é preciso interpretá-los visualmente ([OCR estruturado](/?c=traitement-de-documents&p=ocr-structure)) ou desistir dessa parte |

> **Armadilha:** supor que um PDF sempre contém texto nativo utilizável. Um documento inteiramente escaneado (cada página é uma simples foto de página inteira) não contém **nenhum** texto nativo, mesmo que o arquivo "pareça" um documento de texto ao ser aberto: sem uma etapa de OCR, nenhuma extração automática vai encontrar ali o menor caractere.
>
> **Boa prática:** verificar concretamente a presença de texto nativo em uma amostra antes de projetar um pipeline de extração; nunca supor que um PDF "se parece" com um documento de texto só porque tem essa aparência visual.

## Extrair o texto nativo: blocos, posições, tamanho de fonte

Uma biblioteca como [**PyMuPDF**](https://pymupdf.readthedocs.io) (módulo Python `pymupdf`) abre um PDF e dá acesso, página por página, à sua estrutura interna: o texto nunca é retornado como uma única string grande, mas dividido em **blocos** (um parágrafo, uma célula de tabela...), eles próprios divididos em linhas e depois em **spans** (uma porção de texto que compartilha a mesma fonte e o mesmo tamanho):

```python
import pymupdf

with pymupdf.open("documento.pdf") as documento:
    for numero_pagina, pagina in enumerate(documento, start=1):
        for bloco in pagina.get_text("dict")["blocks"]:
            if bloco["type"] != 0:      # 0 = bloco de texto ; 1 = bloco de imagem, ignorado aqui
                continue
            spans = [span for linha in bloco["lines"] for span in linha["spans"]]
            texto = "".join(span["text"] for span in spans).strip()
            if not texto:
                continue                 # bloco vazio (espaçamento, linha em branco): nada a guardar
            print(numero_pagina, bloco["bbox"], texto)
```

- `pagina.get_text("dict")` retorna uma estrutura aninhada (dicionário Python) em vez de uma simples string: é isso que dá acesso à **posição** de cada bloco na página (`bbox`, a caixa delimitadora em coordenadas `x0, y0, x1, y1`) e à sua formatação, não apenas ao seu conteúdo textual.
- `bloco["type"]` distingue um bloco de texto (`0`) de um bloco de imagem (`1`, abordado na próxima seção): um PDF pode misturar os dois na mesma página, esse filtro mantém apenas o texto.
- O **tamanho da fonte** de um span (`span["size"]`) serve, em um uso real, para identificar um título (fonte maior que o corpo do texto) sem precisar adivinhar o layout de outra forma além de medi-lo.

> **Armadilha:** pegar o tamanho de fonte **máximo** de um bloco para caracterizá-lo, sem pensar no que compõe esse bloco. Um bloco pode misturar, por exemplo, um número de página grande colado a uma pequena nota de rodapé: o tamanho máximo refletiria então o número de página, não o texto realmente representativo do bloco.
>
> **Boa prática:** caracterizar um bloco pelo tamanho de fonte do span mais **longo** (com mais caracteres), não pelo tamanho máximo bruto: uma escolha simples que evita que um elemento curto e isolado (número, marcador) distorça a medição.

## Renderizar uma página como imagem

Alguns processamentos (o [OCR estruturado](/?c=traitement-de-documents&p=ocr-structure), uma verificação visual) precisam da página como uma **imagem**, independentemente de qualquer texto nativo que ela já contenha. O PyMuPDF também pode produzir essa renderização:

```python
pixmap = pagina.get_pixmap(dpi=200)
```

Um **DPI** (*dots per inch*, pontos por polegada) mede a resolução da renderização: quanto mais alto, mais detalhada (e pesada) é a imagem produzida. É um trade-off direto:

| DPI | Efeito |
|---|---|
| Muito baixo (ex. 72, a resolução de exibição de tela clássica) | Imagem borrada: um texto pequeno ou uma tabela densa fica ilegível, inclusive para um OCR |
| Muito alto (ex. 600) | Imagem bem nítida, mas muito mais pesada em memória e mais lenta de processar, sem ganho real além de certo limite |
| Trade-off comum (ex. 200) | Suficiente para a maioria dos OCRs modernos, sem explodir o tempo de processamento |

> **Armadilha:** escolher um DPI padrão sem validá-lo nos próprios documentos. Um DPI baixo demais para uma tabela densa produz erros de OCR difíceis de diagnosticar (o texto de origem já estava ilegível antes mesmo do OCR entrar em ação); nada no comportamento do programa aponta essa causa precisa.
>
> **Boa prática:** testar vários valores de DPI em documentos representativos do caso real (texto denso, tabela fina) antes de fixar um, em vez de copiar um valor padrão.

A renderização produzida por `get_pixmap` precisa então ser convertida em um array de números para ser utilizável pelo resto de um pipeline (OCR, exibição):

```python
import numpy as np

imagem = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
```

`pixmap.samples` é uma sequência bruta de bytes (os pixels, um após o outro); `reshape` a reorganiza em um [array NumPy](/?c=data-science&p=numpy) de 3 dimensões (altura, largura, canais de cor), o formato esperado pela quase totalidade das bibliotecas de visão computacional.

## Resultado: uma estrutura, não apenas texto bruto

Um pipeline de extração completo produz tipicamente, para um dado PDF, duas coleções distintas em vez de um único bloco de texto: os blocos de texto nativo (com sua página e posição) de um lado, as renderizações de imagem por página de outro. Manter essa separação (em vez de fundir tudo em uma única saída de texto) é o que permite que as etapas seguintes de um pipeline escolham, página por página ou até bloco por bloco, o método de extração adequado.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um PDF mistura texto nativo (caracteres realmente armazenados) e conteúdo em imagem (pixels) na mesma página. O texto nativo é extraído diretamente, com posição e tamanho de fonte; o conteúdo em imagem precisa ser renderizado como imagem (resolução definida em DPI) antes de ser interpretado de outra forma. |
| **Ferramentas utilizáveis** | `pymupdf`: `pagina.get_text("dict")` para texto estruturado, `pagina.get_pixmap(dpi=...)` para uma renderização em imagem, convertida em array NumPy com `np.frombuffer`/`reshape`. |
| **Armadilhas a evitar** | Supor que um PDF escaneado contém texto nativo. Caracterizar um bloco pelo tamanho de fonte máximo em vez do span mais longo. Escolher um DPI padrão sem validá-lo em documentos reais. |
| **Boas práticas** | Verificar a presença real de texto nativo antes de projetar um pipeline. Medir um bloco pelo span mais longo. Testar vários DPIs em documentos representativos antes de fixar um. |
