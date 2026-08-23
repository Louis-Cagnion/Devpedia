---
order: 2
---

# O OCR estruturado e a análise de layout

O **OCR** (*Optical Character Recognition*, reconhecimento óptico de caracteres) é a família de modelos que converte pixels em texto: a operação necessária sempre que um conteúdo só existe em forma de imagem em vez de [texto nativo](/?c=traitement-de-documents&p=extraction-pdf) (um scan, uma tabela formatada como imagem). Um OCR "texto puro" para por aí: ele retorna uma sequência de palavras encontradas na imagem, com sua posição, sem nenhuma noção do que as conecta entre si.

## O que o OCR "texto puro" não captura

Uma tabela não é apenas uma lista de palavras espalhadas em uma página: é uma **grade**, com linhas e colunas que dão sentido aos valores que ela contém. Um OCR de texto puro, em uma tabela, retorna cada célula como uma palavra isolada entre outras, sem indicar em qual linha nem em qual coluna ela está:

| | OCR texto puro | OCR estruturado |
|---|---|---|
| Saída | Uma lista de palavras, cada uma com sua posição na imagem | Uma estrutura (linhas, colunas, células), com o texto de cada célula no lugar certo |
| Suficiente para | Um parágrafo de texto simples | Uma tabela, um formulário com campos alinhados |
| O que falta no texto puro | Nenhuma forma de saber que duas palavras pertencem à mesma linha de uma tabela, em vez de dois lugares sem relação na página | - |

O **OCR estruturado** adiciona uma etapa de **análise de layout** (*layout analysis*) antes mesmo de ler o texto: localizar primeiro as regiões da página (um título, um parágrafo, uma tabela...), e depois, para cada região reconhecida como tabela, reconstruir sua grade em vez de retornar uma simples pilha de palavras.

## Dois modelos, dois custos: filtrar antes de estruturar

Um modelo que localiza regiões (responder a "há uma tabela nesta página?") é bem menos custoso de rodar do que um modelo que, além disso, reconstrói inteiramente a estrutura dessa tabela (linhas, colunas, texto de cada célula). Rodar sistematicamente o modelo completo em cada página, inclusive nas que visivelmente não contêm nenhuma tabela, desperdiça a maior parte do tempo de processamento:

```text
Pagina renderizada como imagem
        │
        ▼
Modelo de deteccao de layout (rapido, ~40x mais rapido que o pipeline completo)
        │
        ├── nenhuma zona "tabela" encontrada ──> pagina ignorada, nada mais a fazer
        │
        └── pelo menos uma zona "tabela" ──> pipeline completo de estruturacao
                                              (localizacao precisa + reconstrucao
                                              da grade, mais lento)
```

> **Armadilha:** rodar o modelo mais completo (e mais lento) em cada página de um documento, por simplicidade de implementação, quando a maioria das páginas só precisa de uma resposta "há uma tabela aqui?".
>
> **Boa prática:** intercalar um modelo de pré-filtragem rápido que elimina os casos negativos óbvios, e reservar o modelo custoso apenas às regiões que realmente precisam dele. O mesmo princípio de um [índice que evita percorrer uma tabela inteira](/?c=domain-specific-languages-dsl&p=sql): responder rápido a "é preciso buscar aqui?" antes de fazer o trabalho completo.

## Reconstruir a grade: linhas, colunas, células mescladas

Uma tabela detectada não se limita a uma grade retangular uniforme: uma célula de cabeçalho pode se estender por várias colunas, ou uma célula da primeira coluna pode cobrir várias linhas. Dois conceitos descrevem essas fusões, herdados diretamente do vocabulário [HTML](/?c=langages-de-balisage&s=html&p=html) de tabelas:

```text
+----------+----------------------+
|          |      Trimestre 1     |   <- "colspan" 2 : uma celula que cobre 2 colunas
+----------+-----------+----------+
|          |  Janeiro  | Fevereiro|
+----------+-----------+----------+
| Regiao A |    120    |   135    |
+          +-----------+----------+   <- "rowspan" 2 : "Regiao A" cobre essas 2 linhas
|          |    98     |   110    |
+----------+-----------+----------+
```

| Termo | Significa |
|---|---|
| `colspan` (*column span*) | Uma célula ocupa várias colunas na mesma linha |
| `rowspan` (*row span*) | Uma célula ocupa várias linhas na mesma coluna |

Um modelo de OCR estruturado (como o [PP-StructureV3](/?c=ia&s=vision-et-ocr&p=modeles-document-ai), usado no projeto de origem deste capítulo) tipicamente retorna essa grade em formato **HTML** (`<table>`, `<tr>`, `<td colspan="...">`), o mesmo formato de uma página web: reconstruir, a partir desse HTML, a posição exata (linha, coluna) de cada célula levando em conta as fusões em andamento é um exercício de [parsing incremental](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) por si só.

> **Armadilha:** ignorar as fusões e supor que uma tabela reconstruída sempre tem o mesmo número de células em cada linha. Uma linha em que uma coluna é "pulada" por causa de um `rowspan` iniciado mais acima teria, sem levar isso em conta, um deslocamento silencioso entre o conteúdo e a coluna à qual ele realmente pertence.
>
> **Boa prática:** acompanhar explicitamente, coluna por coluna, quantas linhas restantes uma fusão vertical ainda deve ocupar, antes de posicionar a célula seguinte de uma linha.

## Os resultados de um modelo de detecção nunca são perfeitos

Um modelo que localiza zonas (aqui, tabelas) fornece um **score de confiança** por zona detectada, e pode também detectar duas vezes a mesma zona física em duas caixas ligeiramente diferentes (uma cobrindo a tabela inteira, outra cobrindo apenas uma parte): veja [Detecção de layout: caixas delimitadoras, score de confiança e remoção de duplicatas](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) para o detalhe da filtragem por score de confiança e da deduplicação por IoU/NMS, diretamente aplicável aqui.

Veja também [Extrair o texto e as páginas de um PDF](/?c=traitement-de-documents&p=extraction-pdf) para a etapa anterior (obter a imagem da página a analisar), e [Arbitragem local vs cloud para um modelo de visão](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) para a questão de onde rodar esse tipo de modelo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um OCR de texto puro retorna palavras isoladas com sua posição; um OCR estruturado adiciona uma análise de layout (localizar títulos, parágrafos, tabelas) e reconstrói a grade de uma tabela (linhas, colunas, células mescladas via `rowspan`/`colspan`). |
| **Ferramentas utilizáveis** | Um modelo leve de detecção de layout como pré-filtro, um pipeline completo de estruturação reservado às zonas que realmente precisam dele. |
| **Armadilhas a evitar** | Rodar sistematicamente o modelo mais custoso em cada página. Ignorar as fusões de células ao reconstruir uma grade. Manter sem filtragem detecções com baixo score ou zonas quase duplicadas. |
| **Boas práticas** | Pré-filtrar com um modelo rápido antes do pipeline completo. Acompanhar explicitamente as fusões coluna por coluna. Filtrar por score de confiança e deduplicar zonas que se sobrepõem fortemente. |
