---
order: 22
---

# Pós-processamento e correção de um OCR

O [capítulo sobre avaliação](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) mede os erros de um OCR; este capítulo cobre a etapa que vem logo depois, antes de usar o texto reconhecido: tentar **corrigir** automaticamente os erros mais prováveis, sem passar de novo pelo modelo de reconhecimento em si.

## Correção por dicionário

A correção por dicionário compara cada palavra reconhecida a uma lista de palavras válidas (um **léxico**): se a palavra reconhecida não estiver nela, ela é substituída pela entrada do léxico mais próxima, medida pela [distância de Levenshtein](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) já vista para a avaliação:

```python
def corrigir_por_dicionario(palavra, lexico, distancia_max=2):
    if palavra in lexico:
        return palavra   # ja e uma palavra valida, nada a corrigir

    candidatos = [(entrada, distancia_levenshtein(palavra, entrada)) for entrada in lexico]
    melhor_entrada, melhor_distancia = min(candidatos, key=lambda c: c[1])

    if melhor_distancia <= distancia_max:
        return melhor_entrada   # suficientemente proxima: corrige-se
    return palavra                # muito diferente de qualquer palavra conhecida: nao se toca em nada
```

> **Cuidado:** usar um dicionário de idioma genérico (as palavras do português comum) em um documento de negócio. Um nome próprio, uma referência de produto ou um identificador técnico (CNPJ, um número de pedido) não pertence a nenhum dicionário generalista: o mecanismo de correção os "corrigiria" para a palavra do dicionário mais próxima, muitas vezes uma palavra totalmente diferente da correta.
>
> **Boa prática:** construir ou complementar o léxico a partir do vocabulário realmente encontrado no domínio de negócio (nomes de clientes, referências de produto, terminologia do setor), não apenas de um dicionário de idioma genérico.

## Correção contextual: além da palavra isolada

Uma correção por dicionário trata cada palavra isoladamente, sem considerar o que a rodeia. Uma confusão comum em OCR (o dígito `0` lido como a letra `O`, ou o inverso) frequentemente resulta em uma palavra que existe de fato em um dicionário, mas está errada em seu contexto:

```text
"Valor total : R$ 1O0"
                 ^
        "1O0" nao e reconhecido como suspeito por NENHUM dicionario de palavras
        (nao e uma palavra); e preciso o contexto ("Valor", "R$")
        para saber que uma sequencia de digitos e esperada aqui, nao uma letra
```

A correção contextual se apoia em um modelo que avalia a **plausibilidade** de uma sequência inteira, não de uma palavra isolada: exatamente o princípio já visto em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), onde um modelo de linguagem atribui uma distribuição de probabilidade ao próximo token considerando o que vem antes. Aplicado aqui, um modelo de linguagem avalia qual das leituras candidatas (`1O0` vs `100`) é mais provável dado o contexto ("Valor total:", seguido de "R$") em vez de julgar o token isoladamente.

> **Cuidado:** aplicar uma correção contextual uniforme, com a mesma confiança, em todo o documento. Uma correção baseada na plausibilidade **estatística** pode, ao contrário de um erro real de OCR, "corrigir" um valor raro mas perfeitamente correto (um valor inusual, um nome pouco comum) para um valor mais frequente mas errado.
>
> **Boa prática:** reservar a correção contextual automática para campos de texto livre, e desativá-la (ou usá-la apenas como sinalização, não como substituição automática) em campos com alta restrição de formato (valores, identificadores), tratados por validação de formato (veja abaixo), mais confiável para esse tipo de dado.

## Validação por formato: explorar o que já se sabe sobre o campo esperado

Muitos campos de um documento estruturado seguem um formato conhecido com antecedência (uma data, um CNPJ com 14 dígitos, um CEP com 8 dígitos): uma restrição que uma [expressão regular](/?c=domain-specific-languages-dsl&p=regex) basta para verificar, sem dicionário nem modelo de linguagem:

```python
import re

def formato_cnpj_valido(texto):
    return re.fullmatch(r"\d{14}", texto) is not None

formato_cnpj_valido("1234567890123 4")  # False -> um espaco extra, sinaliza um erro provavel de OCR
formato_cnpj_valido("12345678901234")   # True
```

Um campo que falha nessa verificação é sinalizado como suspeito, mesmo sem saber precisamente *qual* correção aplicar: uma informação já útil por si só para priorizar uma releitura humana.

## Detecção por forma estatística: sinalizar sem corrigir

As três abordagens anteriores têm todas um ponto em comum: elas sabem, ou tentam adivinhar, **qual** valor seria correto. Um campo em texto livre, sem léxico de negócio nem formato conhecido, não se presta a nenhuma das três: resta a possibilidade de perceber que **um valor tem uma forma estatisticamente suspeita**, sem pretender saber corrigi-lo.

Dois sinais frequentes na prática:

- **Uma proporção de letras isoladas anormalmente elevada**: uma única letra cercada de dígitos (`"12A34"`) é rara em um texto real bem reconhecido; uma taxa elevada desse padrão em um documento costuma trair uma confusão dígito/letra sistemática do modelo de OCR nesse documento específico.
- **Um padrão de substituição restrito a um subconjunto confundível**: `0`/`O`, `1`/`l`/`I`, `5`/`S`, `8`/`B` se parecem visualmente e costumam se confundir entre si; uma substituição fora desse subconjunto (um `7` lido como `K`, por exemplo) é estatisticamente bem mais rara e merece uma vigilância diferente.

> **Cuidado:** confundir essa abordagem com a correção contextual (vista acima): a detecção estatística não propõe **nenhum** valor de substituição, ela apenas sinaliza um campo como suspeito. Tratá-la como uma correção (substituir automaticamente) equivale a adivinhar um valor sem nenhuma base real, pior do que uma correção contextual mal calibrada.
>
> **Boa prática:** reservar essa detecção aos campos que escapam às três abordagens anteriores (sem léxico de negócio, sem formato conhecido, contexto insuficiente para um modelo de linguagem), e sempre fazê-la desembocar em uma releitura humana, nunca em uma substituição automática.

## Nunca perder o rastro do texto bruto

Qualquer que seja o método de correção aplicado, o texto reconhecido **antes** da correção continua sendo uma informação valiosa: sem ele, torna-se impossível saber depois se um valor vem do modelo de OCR ou de uma correção automática, nem medir o efeito real dessa correção na qualidade geral (veja o [CER/WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)).

> **Cuidado:** sobrescrever o texto bruto reconhecido com sua versão corrigida, sem manter o original. Uma auditoria posterior, ou uma futura mudança de estratégia de correção, perde então qualquer possibilidade de comparar antes/depois.
>
> **Boa prática:** sempre manter o texto bruto ao lado do texto corrigido (dois campos distintos, nunca um único campo sobrescrito), com, se possível, o método de correção aplicado a cada campo.

## O que reter

| | |
|---|---|
| **O que reter** | A correção por dicionário substitui uma palavra ausente de um léxico por sua entrada mais próxima (distância de Levenshtein). A correção contextual julga a plausibilidade de uma sequência inteira via um modelo de linguagem, útil diante de confusões que a palavra isolada não revela. A validação por formato (regex) detecta uma anomalia em um campo de estrutura conhecida, sem dicionário nem modelo. A detecção por forma estatística sinaliza um campo suspeito sem propor correção, para os casos que as três anteriores não cobrem. |
| **Ferramentas úteis** | Um léxico de negócio construído com o vocabulário realmente encontrado. Um modelo de linguagem para a correção contextual. Expressões regulares para validar um campo de formato conhecido. Uma proporção de letras isoladas ou um padrão de substituição restrito para a detecção estatística. |
| **Armadilhas a evitar** | Usar um dicionário de idioma genérico em vocabulário de negócio. Aplicar uma correção contextual automática em campos com alta restrição de formato. Sobrescrever o texto bruto com sua versão corrigida. Tratar uma detecção estatística como uma correção, substituindo automaticamente o valor sinalizado. |
| **Boas práticas** | Construir o léxico a partir do vocabulário de negócio real. Reservar a correção contextual para texto livre, validar os campos de formato conhecido por regex. Sempre manter o texto bruto ao lado do texto corrigido. Fazer toda detecção estatística desembocar em uma releitura humana, nunca uma substituição automática. |
