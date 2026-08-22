---
order: 1
---

# O que um computador executa?

Antes de falar de terminal, editor de código ou de uma linguagem específica, uma única pergunta importa: o que um computador realmente faz quando dizemos que ele "executa" algo? Este capítulo estabelece essa base: todo o resto do site vai se apoiar nela.

## Um computador segue instruções, sem entendê-las

Um computador não "pensa" e nunca adivinha uma intenção. Ele faz uma única coisa, muito rápido e sem questionar: ler uma lista de instruções, em ordem, e executá-las uma por uma, exatamente como estão escritas.

```text
Instrucao 1  →  executada exatamente como esta
Instrucao 2  →  executada exatamente como esta
Instrucao 3  →  executada exatamente como esta
```

> **Analogia:** é como seguir uma receita de cozinha ao pé da letra, sem nunca improvisar. Se a receita diz "quebrar 2 ovos", quebram-se 2 (nem mais, nem menos) e não se questiona o porquê.

**Por que isso é importante:** praticamente tudo o que pode parecer "inteligente" em um computador (corrigir um erro de digitação, adivinhar o que se queria fazer) vem, na verdade, de instruções escritas com antecedência por um humano para esse caso específico, nunca de uma compreensão do problema pela própria máquina.

> **Cuidado:** achar que uma instrução imprecisa será "entendida de forma razoável". O computador sempre escolhe uma interpretação precisa (geralmente a mais literal possível), não necessariamente a que se tinha em mente ao escrevê-la; veja o capítulo sobre [o bug](/?c=bases-de-l-informatique&p=le-bug) para o que isso produz na prática.
>
> **Boa prática:** escrever instruções o mais precisas possível, sem deixar nada para a máquina "adivinhar".

## O código: a lista de instruções escrita por um humano

O **código** (ou **código-fonte**) é o texto que contém essas instruções. Ele é escrito por uma pessoa, em uma **linguagem de programação**, uma das muitas "línguas" que um computador pode seguir, cada uma com sua própria gramática (Python, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), C...).

```text
exibir "Ola"           → escreve "Ola" na tela
exibir "Tchau"          → escreve "Tchau" na tela logo depois
```

> **Nota:** o bloco acima não é uma linguagem real: é **pseudocódigo**, uma forma simplificada de escrever instruções sem a sintaxe precisa de uma linguagem real. Ele serve apenas para ilustrar a ideia de uma sequência de instruções, antes de escolher uma linguagem de verdade.

O Devpedia detalha várias linguagens em profundidade, cada uma em seu próprio capítulo (por exemplo [Python](/?c=langages-de-programmation&s=python&p=python) ou [o C](/?c=langages-de-programmation&s=c&p=c)). Este capítulo não entra em nenhuma delas: apenas o princípio comum a todas.

> **Cuidado:** tentar executar o pseudocódigo acima tal como está em uma linguagem real: isso não vai funcionar, é apenas uma ilustração simplificada, não uma sintaxe real.
>
> **Boa prática:** sempre verificar a sintaxe exata esperada pela linguagem escolhida (capítulo dedicado) antes de escrever código destinado a ser realmente executado.

## O arquivo: onde o código é guardado

Um **arquivo** é uma unidade de dados armazenada no disco do computador, identificada por um **nome** e uma **extensão**, a parte depois do ponto, que indica seu tipo de conteúdo.

| Extensão | Tipo de conteúdo | Exemplo de nome |
|---|---|---|
| `.txt` | Texto puro, sem formatação | `notas.txt` |
| `.py` | Código-fonte em linguagem Python | `programa.py` |
| `.js` | Código-fonte em linguagem JavaScript | `script.js` |
| `.md` | Texto em formato Markdown (o desta página) | `README.md` |

> **Analogia:** um arquivo é como uma folha de papel guardada em uma pasta (a **pasta**/diretório), com um nome escrito na etiqueta para encontrá-la.

O código-fonte é quase sempre escrito em um arquivo de texto; entender "arquivo" é necessário antes de conseguir navegar em uma árvore de diretórios ou abrir qualquer coisa em um editor, dois capítulos que vêm a seguir.

> **Cuidado:** achar que renomear um arquivo muda o que ele contém: renomear `notas.txt` para `notas.py` não transforma um texto qualquer em código Python válido. A extensão é apenas uma **indicação** para humanos e ferramentas (qual editor abrir, qual coloração aplicar); o que realmente decide a natureza de um arquivo é o que o abre e o interpreta, nunca seu nome.
>
> **Boa prática:** escolher a extensão que corresponde ao conteúdo real do arquivo, nunca o contrário.

## Programa: o que o computador executa de fato

O código escrito por um humano nem sempre é o que o processador executa diretamente. Existem duas abordagens:

| | Interpretado | Compilado |
|---|---|---|
| O que acontece | Outro programa, o **interpretador**, lê o código e o executa diretamente, linha por linha | Um programa, o **compilador**, primeiro transforma todo o código em uma forma que o processador entende nativamente |
| Quando a execução começa | Imediatamente | Somente depois que a transformação (a **compilação**) termina |
| Exemplo de linguagem | Python, JavaScript | C, C++ |

> **Aprofundar:** este capítulo se limita a essa distinção de princípio; o detalhe do que acontece durante uma compilação (etapas, possíveis erros) é abordado em [O processo de compilação](/?c=langages-de-programmation&s=c&p=compilation).

> **Cuidado:** achar que um programa compilado funciona em qualquer lugar tal como está. Um executável compilado para Windows não funciona no Linux ou no macOS: a compilação produz código específico para o sistema visado, é preciso recompilar para cada sistema de destino.
>
> **Boa prática:** para um programa interpretado, verificar se o interpretador da linguagem correta está instalado na máquina de destino; para um programa compilado, recompilá-lo para cada sistema visado em vez de supor que um único executável servirá em qualquer lugar.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um computador executa instruções ao pé da letra, sem entender seu sentido. O **código** é essa lista de instruções, escrita em uma **linguagem de programação**, guardada em um **arquivo**. Um programa é **interpretado** (executado diretamente) ou **compilado** (transformado antes de ser executado). |
| **Ferramentas úteis** | Nenhuma por enquanto: o terminal e o editor de código, para escrever e executar código você mesmo, chegam nos próximos dois capítulos. |
| **Armadilhas a evitar** | Achar que o computador "entende" o que se quer fazer, ou que ele pode adivinhar uma intenção não escrita explicitamente no código. Confundir um arquivo qualquer com um programa: um arquivo `.txt` nunca é executado, um arquivo `.py` só é executado via um interpretador Python. |
| **Boas práticas** | Sempre distinguir, diante de um problema, "o que o código diz para fazer" de "o que eu queria que ele fizesse": a maioria dos erros de principiante vem de uma instrução executada ao pé da letra, mas mal formulada. |
